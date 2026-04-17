/**
 * HTTP-level tests for /api/play/execute, /api/play/cancel, and
 * /api/play/status.
 *
 * We replace the play-executor's default `spawn` implementation with a
 * synthetic one via {@link setSpawnImplForTesting} so these tests do not
 * depend on the real Factory/Claude CLI being installed and can
 * deterministically exercise the concurrent-execution limit. Note we do
 * NOT use `vi.mock('node:child_process')` — mocking that module breaks
 * Vitest's tinypool IPC.
 */

import { EventEmitter } from 'node:events';
import { Readable } from 'node:stream';
import type { ChildProcess } from 'node:child_process';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { POST as executePost } from '@/app/api/play/execute/route';
import { POST as cancelPost } from '@/app/api/play/cancel/route';
import { GET as statusGet } from '@/app/api/play/status/route';
import {
  MAX_CONCURRENT_EXECUTIONS,
  cancelExecution,
  getExecutionRecord,
  resetExecutorForTesting,
  setSpawnImplForTesting,
} from '@/lib/play-executor';

// ---------------------------------------------------------------------------
// Synthetic spawn
// ---------------------------------------------------------------------------

interface FakeChildHandle {
  readonly pid: number;
  readonly killCalls: string[];
  emitStdout: (chunk: string) => void;
  exit: (code: number | null) => void;
}

const liveChildren: FakeChildHandle[] = [];
let nextPid = 20000;

class FakeChild extends EventEmitter {
  public pid: number;
  public stdout: Readable;
  public stderr: Readable;
  public killCalls: string[] = [];
  constructor() {
    super();
    this.pid = nextPid++;
    this.stdout = new Readable({ read() {} });
    this.stderr = new Readable({ read() {} });
  }
  kill(signal: NodeJS.Signals | number = 'SIGTERM'): boolean {
    this.killCalls.push(String(signal));
    return true;
  }
}

const fakeSpawn = ((): ChildProcess => {
  const fake = new FakeChild();
  const handle: FakeChildHandle = {
    pid: fake.pid,
    get killCalls() {
      return fake.killCalls;
    },
    emitStdout(chunk) {
      fake.stdout.emit('data', Buffer.from(chunk, 'utf8'));
    },
    exit(code) {
      fake.emit('close', code);
    },
  };
  liveChildren.push(handle);
  return fake as unknown as ChildProcess;
}) as unknown as typeof import('node:child_process').spawn;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRequest(url: string, body: unknown): Request {
  return new Request(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

type ExecuteReq = Parameters<typeof executePost>[0];
type CancelReq = Parameters<typeof cancelPost>[0];

beforeEach(() => {
  resetExecutorForTesting();
  liveChildren.length = 0;
  setSpawnImplForTesting(fakeSpawn);
});

afterEach(() => {
  // Drain any lingering fake children so spawn's close handler fires
  // and clears the tracker before the next test.
  for (const child of liveChildren) child.exit(null);
  resetExecutorForTesting();
  setSpawnImplForTesting(null);
});

// ---------------------------------------------------------------------------
// /api/play/execute — validation
// ---------------------------------------------------------------------------

describe('POST /api/play/execute — validation', () => {
  it('returns 400 for invalid JSON', async () => {
    const req = new Request('http://localhost/api/play/execute', {
      method: 'POST',
      body: 'not json',
    });
    const res = await executePost(req as unknown as ExecuteReq);
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toMatch(/json/i);
  });

  it('returns 400 for unknown play names (VAL-ACTION-010)', async () => {
    const req = makeRequest('http://localhost/api/play/execute', {
      playName: 'not-a-real-play-xyz',
    });
    const res = await executePost(req as unknown as ExecuteReq);
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string; code: string };
    expect(body.code).toBe('INVALID_PLAY_NAME');
  });

  it('returns 400 for play names with shell metacharacters (VAL-ACTION-010)', async () => {
    const req = makeRequest('http://localhost/api/play/execute', {
      playName: 'ship;rm -rf /',
    });
    const res = await executePost(req as unknown as ExecuteReq);
    expect(res.status).toBe(400);
  });

  it('returns 400 for oversized prompts', async () => {
    const req = makeRequest('http://localhost/api/play/execute', {
      playName: 'ship',
      prompt: 'x'.repeat(100_000),
    });
    const res = await executePost(req as unknown as ExecuteReq);
    expect(res.status).toBe(400);
    const body = (await res.json()) as { code: string };
    expect(body.code).toBe('INVALID_PROMPT');
  });
});

// ---------------------------------------------------------------------------
// /api/play/execute — successful spawn
// ---------------------------------------------------------------------------

describe('POST /api/play/execute — successful spawn', () => {
  it('returns an SSE response with X-Execution-Id header', async () => {
    const req = makeRequest('http://localhost/api/play/execute', {
      playName: 'ship',
    });
    const res = await executePost(req as unknown as ExecuteReq);
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('text/event-stream');
    const execId = res.headers.get('X-Execution-Id');
    expect(execId).toBeTruthy();
    const rec = getExecutionRecord(execId!);
    expect(rec?.status).toBe('running');
    expect(rec?.pid).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// /api/play/execute — concurrent limit (VAL-ACTION-030)
// ---------------------------------------------------------------------------

describe('POST /api/play/execute — concurrent limit (VAL-ACTION-030)', () => {
  it('returns 429 with a helpful message when three plays are already running', async () => {
    for (let i = 0; i < MAX_CONCURRENT_EXECUTIONS; i++) {
      const req = makeRequest('http://localhost/api/play/execute', {
        playName: 'ship',
      });
      const r = await executePost(req as unknown as ExecuteReq);
      expect(r.status).toBe(200);
    }

    const overflow = makeRequest('http://localhost/api/play/execute', {
      playName: 'ship',
    });
    const res = await executePost(overflow as unknown as ExecuteReq);
    expect(res.status).toBe(429);
    const body = (await res.json()) as {
      error: string;
      code: string;
      limit: number;
    };
    expect(body.code).toBe('CONCURRENT_LIMIT_EXCEEDED');
    expect(body.limit).toBe(MAX_CONCURRENT_EXECUTIONS);
    expect(body.error).toMatch(/Maximum concurrent plays reached/);
  });
});

// ---------------------------------------------------------------------------
// /api/play/cancel (VAL-ACTION-015)
// ---------------------------------------------------------------------------

describe('POST /api/play/cancel (VAL-ACTION-015)', () => {
  it('returns 400 when executionId is missing', async () => {
    const req = makeRequest('http://localhost/api/play/cancel', {});
    const res = await cancelPost(req as unknown as CancelReq);
    expect(res.status).toBe(400);
  });

  it('returns cancelled=false for unknown execution ids', async () => {
    const req = makeRequest('http://localhost/api/play/cancel', {
      executionId: 'ghost-id',
    });
    const res = await cancelPost(req as unknown as CancelReq);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { cancelled: boolean };
    expect(body.cancelled).toBe(false);
  });

  it('cancels a running execution end-to-end', async () => {
    const req = makeRequest('http://localhost/api/play/execute', {
      playName: 'ship',
    });
    const execRes = await executePost(req as unknown as ExecuteReq);
    const execId = execRes.headers.get('X-Execution-Id')!;

    const cancelReq = makeRequest('http://localhost/api/play/cancel', {
      executionId: execId,
    });
    const cancelRes = await cancelPost(cancelReq as unknown as CancelReq);
    expect(cancelRes.status).toBe(200);
    const body = (await cancelRes.json()) as { cancelled: boolean };
    expect(body.cancelled).toBe(true);
    expect(liveChildren[0]!.killCalls).toContain('SIGTERM');
    expect(getExecutionRecord(execId)?.status).toBe('cancelled');
  });
});

// ---------------------------------------------------------------------------
// /api/play/status (VAL-ACTION-013)
// ---------------------------------------------------------------------------

describe('GET /api/play/status (VAL-ACTION-013)', () => {
  it('returns an empty snapshot when no executions exist', async () => {
    const res = await statusGet();
    const body = (await res.json()) as {
      running: number;
      limit: number;
      records: unknown[];
    };
    expect(body.running).toBe(0);
    expect(body.limit).toBe(MAX_CONCURRENT_EXECUTIONS);
    expect(body.records).toEqual([]);
  });

  it('lists an active execution with its PID and play name', async () => {
    const req = makeRequest('http://localhost/api/play/execute', {
      playName: 'ship',
    });
    const execRes = await executePost(req as unknown as ExecuteReq);
    expect(execRes.status).toBe(200);

    const res = await statusGet();
    const body = (await res.json()) as {
      running: number;
      records: Array<{ playName: string; status: string; pid: number | null }>;
    };
    expect(body.running).toBe(1);
    expect(body.records.length).toBe(1);
    expect(body.records[0]!.playName).toBe('ship');
    expect(body.records[0]!.status).toBe('running');
    expect(body.records[0]!.pid).toBeGreaterThan(0);

    const id = execRes.headers.get('X-Execution-Id')!;
    cancelExecution(id);
  });
});
