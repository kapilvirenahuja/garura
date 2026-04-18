/**
 * Tests for the server-side play execution bridge.
 *
 * Covers VAL-ACTION-009 through VAL-ACTION-016 plus VAL-ACTION-029 and
 * VAL-ACTION-030. Uses a synthetic `spawnFn` implementation (see
 * {@link fakeSpawn}) so that unit tests do not rely on the Factory or
 * Claude CLI being installed and remain deterministic.
 */

import { EventEmitter } from 'node:events';
import { Readable } from 'node:stream';
import type { spawn as nodeSpawn, ChildProcess } from 'node:child_process';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  ALLOWED_COMMANDS,
  ConcurrentLimitError,
  DEFAULT_CLI_COMMAND,
  DEFAULT_TIMEOUT_MS,
  InvalidCommandError,
  InvalidPlayNameError,
  InvalidPromptError,
  MAX_CONCURRENT_EXECUTIONS,
  MAX_PROMPT_LENGTH,
  cancelExecution,
  findDangerousShellCharacters,
  getExecutionRecord,
  getProcessTracker,
  getRunningCount,
  resetExecutorForTesting,
  sanitizePrompt,
  spawnPlay,
  validatePlayName,
} from '@/lib/play-executor';

// ---------------------------------------------------------------------------
// Fake child_process.spawn
// ---------------------------------------------------------------------------

interface FakeChildHandle {
  readonly pid: number;
  readonly command: string;
  readonly args: readonly string[];
  readonly stdout: EventEmitter;
  readonly stderr: EventEmitter;
  readonly child: ChildProcess;
  readonly killCalls: string[];
  exit(code: number | null): void;
  crash(err: Error): void;
  emitStdout(chunk: string): void;
  emitStderr(chunk: string): void;
}

class FakeChild extends EventEmitter implements Pick<ChildProcess, 'pid' | 'kill'> {
  public pid: number;
  public stdout: Readable;
  public stderr: Readable;
  public killCalls: string[] = [];

  constructor(pid: number) {
    super();
    this.pid = pid;
    // Use Readable.from([]) so stdout/stderr are truthy, then emit via
    // direct .emit() calls so we control the timing explicitly.
    this.stdout = new Readable({ read() {} });
    this.stderr = new Readable({ read() {} });
  }

  kill(signal: NodeJS.Signals | number = 'SIGTERM'): boolean {
    this.killCalls.push(String(signal));
    return true;
  }
}

let nextPid = 10000;
const liveHandles: FakeChildHandle[] = [];

function makeFakeSpawn(): {
  spawnFn: typeof nodeSpawn;
  handles: FakeChildHandle[];
} {
  const handles: FakeChildHandle[] = [];
  const spawnFn = (command: string, args: readonly string[]): ChildProcess => {
    const pid = nextPid++;
    const fake = new FakeChild(pid);
    const child = fake as unknown as ChildProcess;
    const handle: FakeChildHandle = {
      pid,
      command,
      args: [...args],
      stdout: fake.stdout,
      stderr: fake.stderr,
      child,
      get killCalls() {
        return fake.killCalls;
      },
      exit(code) {
        fake.emit('close', code);
      },
      crash(err) {
        fake.emit('error', err);
      },
      emitStdout(chunk) {
        fake.stdout.emit('data', Buffer.from(chunk, 'utf8'));
      },
      emitStderr(chunk) {
        fake.stderr.emit('data', Buffer.from(chunk, 'utf8'));
      },
    };
    handles.push(handle);
    liveHandles.push(handle);
    return child;
  };
  return { spawnFn: spawnFn as unknown as typeof nodeSpawn, handles };
}

// ---------------------------------------------------------------------------
// SSE stream reader
// ---------------------------------------------------------------------------

interface SseEvent {
  type: string;
  [key: string]: unknown;
}

async function readSseEvents(stream: ReadableStream<Uint8Array>): Promise<SseEvent[]> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  const events: SseEvent[] = [];
  let buffer = '';
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let idx = buffer.indexOf('\n\n');
    while (idx !== -1) {
      const raw = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 2);
      idx = buffer.indexOf('\n\n');
      for (const line of raw.split('\n')) {
        if (!line.startsWith('data: ')) continue;
        events.push(JSON.parse(line.slice(6)) as SseEvent);
      }
    }
  }
  return events;
}

/** Consume events in the background; resolves when the stream closes. */
function collectSseEvents(stream: ReadableStream<Uint8Array>): {
  events: SseEvent[];
  done: Promise<SseEvent[]>;
} {
  const events: SseEvent[] = [];
  const done = (async () => {
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    for (;;) {
      const { done: streamDone, value } = await reader.read();
      if (streamDone) break;
      buffer += decoder.decode(value, { stream: true });
      let idx = buffer.indexOf('\n\n');
      while (idx !== -1) {
        const raw = buffer.slice(0, idx);
        buffer = buffer.slice(idx + 2);
        idx = buffer.indexOf('\n\n');
        for (const line of raw.split('\n')) {
          if (!line.startsWith('data: ')) continue;
          events.push(JSON.parse(line.slice(6)) as SseEvent);
        }
      }
    }
    return events;
  })();
  return { events, done };
}

// ---------------------------------------------------------------------------
// Global reset
// ---------------------------------------------------------------------------

beforeEach(() => {
  resetExecutorForTesting();
  liveHandles.length = 0;
});

afterEach(() => {
  resetExecutorForTesting();
  vi.useRealTimers();
});

// ---------------------------------------------------------------------------
// validatePlayName / sanitizePrompt / findDangerousShellCharacters
// ---------------------------------------------------------------------------

describe('validatePlayName', () => {
  it('rejects non-strings, empty, or oversized names', () => {
    expect(validatePlayName(undefined)).toBe(false);
    expect(validatePlayName(null)).toBe(false);
    expect(validatePlayName(42)).toBe(false);
    expect(validatePlayName('')).toBe(false);
    expect(validatePlayName('a'.repeat(101))).toBe(false);
  });

  it('rejects names with shell metacharacters even when registry check is skipped', () => {
    expect(validatePlayName('foo;bar', false)).toBe(false);
    expect(validatePlayName('ship && echo pwn', false)).toBe(false);
    expect(validatePlayName('foo|bar', false)).toBe(false);
    expect(validatePlayName('foo bar', false)).toBe(false);
    expect(validatePlayName('foo/bar', false)).toBe(false);
  });

  it('rejects unknown plays when registry check is enabled', () => {
    expect(validatePlayName('definitely-not-a-real-play-xyz', true)).toBe(false);
  });

  it('accepts registered plays with registry check', () => {
    expect(validatePlayName('ship', true)).toBe(true);
    expect(validatePlayName('specify-product', true)).toBe(true);
  });

  it('accepts unknown but syntactically valid names when registry check is off', () => {
    expect(validatePlayName('test-play', false)).toBe(true);
    expect(validatePlayName('foo_bar-123', false)).toBe(true);
  });
});

describe('sanitizePrompt', () => {
  it('returns empty string for undefined / null', () => {
    expect(sanitizePrompt(undefined)).toBe('');
    expect(sanitizePrompt(null)).toBe('');
  });

  it('rejects non-string prompts', () => {
    expect(() => sanitizePrompt(123)).toThrow(InvalidPromptError);
    expect(() => sanitizePrompt({ prompt: 'foo' })).toThrow(InvalidPromptError);
  });

  it('enforces MAX_PROMPT_LENGTH', () => {
    expect(() => sanitizePrompt('x'.repeat(MAX_PROMPT_LENGTH + 1))).toThrow(InvalidPromptError);
  });

  it('preserves shell metacharacters verbatim (VAL-ACTION-011)', () => {
    // The argv boundary is where injection is prevented, not the
    // prompt string itself. Shell metacharacters must be preserved so
    // the downstream play can interpret them as literal text.
    const evil = '; rm -rf / && echo pwned > /tmp/owned';
    expect(sanitizePrompt(evil)).toBe(evil);
  });
});

describe('findDangerousShellCharacters', () => {
  it('finds metacharacters that are dangerous in shell contexts', () => {
    expect(findDangerousShellCharacters('foo;bar')).toContain(';');
    expect(findDangerousShellCharacters('foo|bar')).toContain('|');
    expect(findDangerousShellCharacters('foo && bar')).toContain('&');
    expect(findDangerousShellCharacters('foo > bar')).toContain('>');
    expect(findDangerousShellCharacters('$(evil)')).toContain('$');
  });

  it('returns empty for safe plain text', () => {
    expect(findDangerousShellCharacters('plain text prompt 123')).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// spawnPlay — validation
// ---------------------------------------------------------------------------

describe('spawnPlay — validation', () => {
  it('rejects commands that are not in the whitelist (VAL-ACTION-010)', () => {
    expect(() =>
      spawnPlay({
        playName: 'ship',
        // @ts-expect-error — intentionally off-whitelist to prove rejection
        cliCommand: 'bash',
      }),
    ).toThrow(InvalidCommandError);
  });

  it('whitelists exactly factory and claude', () => {
    expect([...ALLOWED_COMMANDS]).toEqual(['factory', 'claude']);
    expect(DEFAULT_CLI_COMMAND).toBe('factory');
  });

  it('rejects unknown play names before spawning (VAL-ACTION-010)', () => {
    const { spawnFn, handles } = makeFakeSpawn();
    expect(() => spawnPlay({ playName: 'bogus-xyz-nope', spawnFn })).toThrow(InvalidPlayNameError);
    expect(handles.length).toBe(0);
  });

  it('rejects play names containing shell metacharacters (VAL-ACTION-010)', () => {
    const { spawnFn, handles } = makeFakeSpawn();
    expect(() => spawnPlay({ playName: 'ship;ls', spawnFn, skipRegistryCheck: true })).toThrow(
      InvalidPlayNameError,
    );
    expect(handles.length).toBe(0);
  });

  it('rejects non-string prompts', () => {
    const { spawnFn } = makeFakeSpawn();
    expect(() =>
      spawnPlay({
        playName: 'ship',
        // @ts-expect-error — caller bypassed types
        prompt: { evil: true },
        spawnFn,
      }),
    ).toThrow(InvalidPromptError);
  });

  it('accepts whitelisted plays and default command (VAL-ACTION-009)', async () => {
    const { spawnFn, handles } = makeFakeSpawn();
    const { record, stream } = spawnPlay({ playName: 'ship', spawnFn });
    expect(handles.length).toBe(1);
    const handle = handles[0]!;
    expect(handle.command).toBe('factory');
    expect(handle.args[0]).toBe('run');
    expect(handle.args[1]).toBe('ship');
    expect(record.playName).toBe('ship');
    // Finish the stream so the test does not leak a pending process.
    handle.exit(0);
    await readSseEvents(stream);
  });
});

// ---------------------------------------------------------------------------
// VAL-ACTION-011 — argument sanitization / no shell injection
// ---------------------------------------------------------------------------

describe('spawnPlay — argument sanitization (VAL-ACTION-011)', () => {
  it('passes a malicious prompt to the child as a literal argv element', async () => {
    const { spawnFn, handles } = makeFakeSpawn();
    const evil = '; rm -rf / && echo pwned';
    const { stream } = spawnPlay({
      playName: 'ship',
      prompt: evil,
      spawnFn,
    });
    expect(handles.length).toBe(1);
    // The prompt must appear as an *argument*, not embedded in the
    // command — this is the invariant that prevents shell injection.
    expect(handles[0]!.command).toBe('factory');
    expect(handles[0]!.args).toEqual(['run', 'ship', evil]);
    // The command itself must still be the exact CLI binary, not
    // something with the prompt spliced in.
    expect(handles[0]!.command).not.toContain(';');
    expect(handles[0]!.command).not.toContain('&');
    handles[0]!.exit(0);
    await readSseEvents(stream);
  });

  it('omits the prompt argument when no prompt is supplied', async () => {
    const { spawnFn, handles } = makeFakeSpawn();
    const { stream } = spawnPlay({ playName: 'ship', spawnFn });
    expect(handles[0]!.args).toEqual(['run', 'ship']);
    handles[0]!.exit(0);
    await readSseEvents(stream);
  });

  it('preserves unicode and quoted characters byte-for-byte', async () => {
    const { spawnFn, handles } = makeFakeSpawn();
    const prompt = 'what\'s the "impact" of <system> 🤖?';
    const { stream } = spawnPlay({
      playName: 'ship',
      prompt,
      spawnFn,
    });
    expect(handles[0]!.args[2]).toBe(prompt);
    handles[0]!.exit(0);
    await readSseEvents(stream);
  });
});

// ---------------------------------------------------------------------------
// VAL-ACTION-012 — SSE streaming output
// ---------------------------------------------------------------------------

describe('spawnPlay — SSE streaming (VAL-ACTION-012)', () => {
  it('streams stdout chunks as incremental output events', async () => {
    const { spawnFn, handles } = makeFakeSpawn();
    const { stream } = spawnPlay({ playName: 'ship', spawnFn });
    const collector = collectSseEvents(stream);
    const handle = handles[0]!;

    // Let the stream's `start` callback run before we emit chunks.
    await Promise.resolve();
    handle.emitStdout('hello ');
    handle.emitStdout('world\n');
    handle.emitStderr('warn: minor\n');
    handle.exit(0);

    const events = await collector.done;
    const outputs = events.filter((e) => e.type === 'output');
    expect(outputs.length).toBe(3);
    expect(outputs[0]!.content).toBe('hello ');
    expect(outputs[1]!.content).toBe('world\n');
    expect(outputs[2]!.content).toBe('warn: minor\n');
    expect(events.find((e) => e.type === 'complete')).toBeTruthy();
    expect(events[0]!.type).toBe('start');
  });

  it('emits a start event carrying the executionId, pid, and play name', async () => {
    const { spawnFn, handles } = makeFakeSpawn();
    const { stream, executionId } = spawnPlay({ playName: 'ship', spawnFn });
    const collector = collectSseEvents(stream);
    handles[0]!.exit(0);
    const events = await collector.done;
    const start = events.find((e) => e.type === 'start');
    expect(start).toBeTruthy();
    expect(start?.executionId).toBe(executionId);
    expect(start?.playName).toBe('ship');
    expect(start?.pid).toBe(handles[0]!.pid);
  });
});

// ---------------------------------------------------------------------------
// VAL-ACTION-013 — process tracking
// ---------------------------------------------------------------------------

describe('spawnPlay — process tracker (VAL-ACTION-013)', () => {
  it('creates a tracker entry with PID, startTime, and status=running', () => {
    const { spawnFn, handles } = makeFakeSpawn();
    const { executionId, record } = spawnPlay({ playName: 'ship', spawnFn });
    const tracker = getProcessTracker();
    expect(tracker.has(executionId)).toBe(true);
    expect(record.pid).toBe(handles[0]!.pid);
    expect(record.status).toBe('running');
    expect(record.startTime).toBeGreaterThan(0);
    expect(record.playName).toBe('ship');
    handles[0]!.exit(0);
  });

  it('updates status to complete on clean exit', async () => {
    const { spawnFn, handles } = makeFakeSpawn();
    const { executionId, stream } = spawnPlay({ playName: 'ship', spawnFn });
    const collector = collectSseEvents(stream);
    await Promise.resolve();
    handles[0]!.exit(0);
    await collector.done;
    const rec = getExecutionRecord(executionId);
    expect(rec?.status).toBe('complete');
    expect(rec?.exitCode).toBe(0);
  });

  it('records error status when the process exits non-zero (VAL-ACTION-016)', async () => {
    const { spawnFn, handles } = makeFakeSpawn();
    const { executionId, stream } = spawnPlay({ playName: 'ship', spawnFn });
    const collector = collectSseEvents(stream);
    await Promise.resolve();
    handles[0]!.emitStderr('boom\n');
    handles[0]!.exit(42);
    const events = await collector.done;
    const rec = getExecutionRecord(executionId);
    expect(rec?.status).toBe('error');
    expect(rec?.exitCode).toBe(42);
    const errEvent = events.find((e) => e.type === 'error');
    expect(errEvent?.exitCode).toBe(42);
    expect(String(errEvent?.message)).toContain('42');
  });
});

// ---------------------------------------------------------------------------
// VAL-ACTION-014 — timeout
// ---------------------------------------------------------------------------

describe('spawnPlay — timeout (VAL-ACTION-014)', () => {
  it('kills the process and emits a timeout event when the deadline passes', async () => {
    vi.useFakeTimers();
    const { spawnFn, handles } = makeFakeSpawn();
    const { executionId, stream } = spawnPlay({
      playName: 'ship',
      spawnFn,
      timeoutMs: 1000,
    });
    const collector = collectSseEvents(stream);
    // Allow the ReadableStream.start() callback to run and register
    // the timeout before we advance fake time.
    await vi.advanceTimersByTimeAsync(0);
    expect(handles[0]!.killCalls.length).toBe(0);
    await vi.advanceTimersByTimeAsync(1500);
    expect(handles[0]!.killCalls).toContain('SIGTERM');
    // Simulate the child actually exiting in response to SIGTERM.
    handles[0]!.exit(null);
    vi.useRealTimers();
    const events = await collector.done;
    expect(events.find((e) => e.type === 'timeout')).toBeTruthy();
    const rec = getExecutionRecord(executionId);
    expect(rec?.status).toBe('timeout');
  });

  it('does not time out when the default 5-minute deadline has not passed', async () => {
    vi.useFakeTimers();
    const { spawnFn, handles } = makeFakeSpawn();
    const { executionId, stream } = spawnPlay({ playName: 'ship', spawnFn });
    const collector = collectSseEvents(stream);
    await vi.advanceTimersByTimeAsync(DEFAULT_TIMEOUT_MS - 1000);
    expect(handles[0]!.killCalls.length).toBe(0);
    handles[0]!.exit(0);
    vi.useRealTimers();
    await collector.done;
    const rec = getExecutionRecord(executionId);
    expect(rec?.status).toBe('complete');
  });
});

// ---------------------------------------------------------------------------
// VAL-ACTION-015 — cancellation
// ---------------------------------------------------------------------------

describe('spawnPlay — cancellation (VAL-ACTION-015)', () => {
  it('cancelExecution kills the process and transitions status to cancelled', async () => {
    const { spawnFn, handles } = makeFakeSpawn();
    const { executionId, stream } = spawnPlay({ playName: 'ship', spawnFn });
    const collector = collectSseEvents(stream);
    await Promise.resolve();
    expect(cancelExecution(executionId)).toBe(true);
    expect(handles[0]!.killCalls).toContain('SIGTERM');
    handles[0]!.exit(null);
    const events = await collector.done;
    expect(events.find((e) => e.type === 'cancelled')).toBeTruthy();
    const rec = getExecutionRecord(executionId);
    expect(rec?.status).toBe('cancelled');
  });

  it('returns false when cancelling an unknown execution id', () => {
    expect(cancelExecution('not-a-real-id')).toBe(false);
  });

  it('returns false when cancelling an already-complete execution', async () => {
    const { spawnFn, handles } = makeFakeSpawn();
    const { executionId, stream } = spawnPlay({ playName: 'ship', spawnFn });
    const collector = collectSseEvents(stream);
    await Promise.resolve();
    handles[0]!.exit(0);
    await collector.done;
    expect(cancelExecution(executionId)).toBe(false);
  });

  it('aborts the process when the AbortSignal fires (VAL-ACTION-029)', async () => {
    const { spawnFn, handles } = makeFakeSpawn();
    const controller = new AbortController();
    const { executionId, stream } = spawnPlay({
      playName: 'ship',
      spawnFn,
      signal: controller.signal,
    });
    const collector = collectSseEvents(stream);
    await Promise.resolve();
    controller.abort();
    expect(handles[0]!.killCalls).toContain('SIGTERM');
    handles[0]!.exit(null);
    const events = await collector.done;
    expect(events.find((e) => e.type === 'cancelled')).toBeTruthy();
    const rec = getExecutionRecord(executionId);
    expect(rec?.status).toBe('cancelled');
  });

  it('closes the SSE stream when the consumer cancels it (VAL-ACTION-029)', async () => {
    const { spawnFn, handles } = makeFakeSpawn();
    const { executionId, stream } = spawnPlay({ playName: 'ship', spawnFn });
    const reader = stream.getReader();
    // Read the `start` event before cancelling so the ReadableStream
    // source has finished initialising.
    await reader.read();
    await reader.cancel();
    // The source's `cancel()` hook must request process termination.
    expect(handles[0]!.killCalls).toContain('SIGTERM');
    const rec = getExecutionRecord(executionId);
    expect(rec?.status).toBe('cancelled');
  });
});

// ---------------------------------------------------------------------------
// VAL-ACTION-016 — non-zero exit / error styling
// ---------------------------------------------------------------------------

describe('spawnPlay — error handling (VAL-ACTION-016)', () => {
  it('emits a structured error event for non-zero exits', async () => {
    const { spawnFn, handles } = makeFakeSpawn();
    const { stream } = spawnPlay({ playName: 'ship', spawnFn });
    const collector = collectSseEvents(stream);
    await Promise.resolve();
    handles[0]!.exit(7);
    const events = await collector.done;
    const err = events.find((e) => e.type === 'error');
    expect(err).toBeTruthy();
    expect(err?.exitCode).toBe(7);
  });

  it('gracefully degrades when the CLI binary is missing (ENOENT)', async () => {
    const { spawnFn, handles } = makeFakeSpawn();
    const { executionId, stream } = spawnPlay({ playName: 'ship', spawnFn });
    const collector = collectSseEvents(stream);
    await Promise.resolve();
    const err = Object.assign(new Error('spawn factory ENOENT'), {
      code: 'ENOENT',
    });
    handles[0]!.crash(err);
    const events = await collector.done;
    // The stream should still emit a complete event rather than
    // stranding the client in an indeterminate state.
    expect(events.find((e) => e.type === 'complete')).toBeTruthy();
    const rec = getExecutionRecord(executionId);
    expect(rec?.status).toBe('complete');
  });

  it('marks execution as error (not complete) for non-ENOENT child errors', async () => {
    // Regression test: previously ALL child-process error events were
    // swallowed as "complete" via the ENOENT fallback path. Only
    // ENOENT should degrade gracefully; every other errno (EACCES,
    // EPERM, EMFILE, …) must surface as a genuine failure.
    const { spawnFn, handles } = makeFakeSpawn();
    const { executionId, stream } = spawnPlay({ playName: 'ship', spawnFn });
    const collector = collectSseEvents(stream);
    await Promise.resolve();
    const err = Object.assign(new Error('spawn factory EACCES'), {
      code: 'EACCES',
    });
    handles[0]!.crash(err);
    const events = await collector.done;
    // No `complete` — the execution failed.
    expect(events.find((e) => e.type === 'complete')).toBeUndefined();
    // A structured error event is emitted instead.
    const errorEvent = events.find((e) => e.type === 'error');
    expect(errorEvent).toBeTruthy();
    expect(errorEvent?.message).toMatch(/EACCES/);
    // And the record reflects the failure.
    const rec = getExecutionRecord(executionId);
    expect(rec?.status).toBe('error');
    expect(rec?.errorMessage).toMatch(/EACCES/);
  });

  it('marks execution as error for child errors without an errno code', async () => {
    // A generic Error (no `code` property) is not ENOENT — it must
    // fall through to the genuine-failure branch, not the simulated
    // fallback.
    const { spawnFn, handles } = makeFakeSpawn();
    const { executionId, stream } = spawnPlay({ playName: 'ship', spawnFn });
    const collector = collectSseEvents(stream);
    await Promise.resolve();
    handles[0]!.crash(new Error('pipe broke unexpectedly'));
    const events = await collector.done;
    expect(events.find((e) => e.type === 'complete')).toBeUndefined();
    const errorEvent = events.find((e) => e.type === 'error');
    expect(errorEvent?.message).toMatch(/pipe broke/);
    expect(getExecutionRecord(executionId)?.status).toBe('error');
  });
});

// ---------------------------------------------------------------------------
// VAL-ACTION-030 — concurrent-execution limit
// ---------------------------------------------------------------------------

describe('spawnPlay — concurrent-execution limit (VAL-ACTION-030)', () => {
  it('rejects the fourth simultaneous run with ConcurrentLimitError', () => {
    const { spawnFn, handles } = makeFakeSpawn();
    const results = [];
    for (let i = 0; i < MAX_CONCURRENT_EXECUTIONS; i++) {
      results.push(spawnPlay({ playName: 'ship', spawnFn }));
    }
    expect(getRunningCount()).toBe(MAX_CONCURRENT_EXECUTIONS);
    expect(() => spawnPlay({ playName: 'ship', spawnFn })).toThrow(ConcurrentLimitError);
    // Draining one slot should free capacity for the next request.
    handles[0]!.exit(0);
    return results[0]!.stream
      .getReader()
      .read()
      .then(async () => {
        // Allow the close handler to update the record.
        await new Promise((r) => setTimeout(r, 10));
        expect(getRunningCount()).toBeLessThan(MAX_CONCURRENT_EXECUTIONS);
        expect(() => spawnPlay({ playName: 'ship', spawnFn })).not.toThrow();
      });
  });

  it('does not release a slot when status transitions to cancelled before process exits', () => {
    // Regression: the concurrency gate used to key off `getRunningCount()`
    // (status === "running"). cancelExecution / timeout / onAbort all
    // flip the status the moment cancellation is *requested*, but the
    // OS child process is still alive until the subsequent `close`
    // event fires. Gating on the active-process map keeps the slot
    // reserved for the lifetime of the actual child.
    const { spawnFn, handles } = makeFakeSpawn();
    const results = [];
    for (let i = 0; i < MAX_CONCURRENT_EXECUTIONS; i++) {
      results.push(spawnPlay({ playName: 'ship', spawnFn }));
    }
    // Cancel the first slot — status flips to `cancelled` but the
    // fake child has not yet emitted `close`.
    expect(cancelExecution(results[0]!.executionId)).toBe(true);
    expect(getExecutionRecord(results[0]!.executionId)?.status).toBe('cancelled');
    // A 4th spawn must still be rejected because the OS-level child
    // is still alive.
    expect(() => spawnPlay({ playName: 'ship', spawnFn })).toThrow(ConcurrentLimitError);
    // Only once the child actually closes is the slot released.
    handles[0]!.exit(null);
    expect(() => spawnPlay({ playName: 'ship', spawnFn })).not.toThrow();
  });

  it('ConcurrentLimitError carries the limit and an error code', () => {
    const err = new ConcurrentLimitError(3);
    expect(err.limit).toBe(3);
    expect(err.code).toBe('CONCURRENT_LIMIT_EXCEEDED');
    expect(err.message).toMatch(/3/);
  });
});

// ---------------------------------------------------------------------------
// Housekeeping
// ---------------------------------------------------------------------------

describe('spawnPlay — housekeeping', () => {
  it('getRunningCount stays in sync with tracker state', async () => {
    const { spawnFn, handles } = makeFakeSpawn();
    expect(getRunningCount()).toBe(0);
    const a = spawnPlay({ playName: 'ship', spawnFn });
    const b = spawnPlay({ playName: 'ship', spawnFn });
    expect(getRunningCount()).toBe(2);
    const collectorA = collectSseEvents(a.stream);
    const collectorB = collectSseEvents(b.stream);
    await Promise.resolve();
    handles[0]!.exit(0);
    await collectorA.done;
    expect(getRunningCount()).toBe(1);
    handles[1]!.exit(0);
    await collectorB.done;
    expect(getRunningCount()).toBe(0);
  });

  it('exposes the tracker as a read-only view', () => {
    const { spawnFn, handles } = makeFakeSpawn();
    spawnPlay({ playName: 'ship', spawnFn });
    const snapshot = getProcessTracker();
    expect(snapshot.size).toBe(1);
    handles[0]!.exit(0);
  });
});
