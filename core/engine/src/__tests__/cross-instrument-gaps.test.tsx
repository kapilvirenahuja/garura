/**
 * Cross-instrument gap-fill verification.
 *
 * Covers four behaviours that glue the three instruments together once
 * plays start executing concurrently and annotations are authored in
 * one view but queried from another:
 *
 *   - VAL-CROSS-006  Flight Deck auto-refreshes when a checklist (or any
 *                    other emitter) fires the readiness-invalidated event.
 *   - VAL-CROSS-017  Annotations are queryable via the API regardless of
 *                    which instrument page made the request — the route
 *                    takes a plain context slug and has no instrument
 *                    binding.
 *   - VAL-CROSS-018  Search-result CrossRefTokens navigate the user to
 *                    `/playbook?context=<refId>` with the correct context.
 *   - VAL-CROSS-020  Concurrent in-memory play executions surface in the
 *                    Flight Deck play log via `/api/flight-deck`.
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { EventEmitter } from 'node:events';
import { Readable } from 'node:stream';
import type { ChildProcess } from 'node:child_process';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, cleanup, fireEvent, act, within } from '@testing-library/react';
import { NextRequest } from 'next/server';

import FlightDeckPage from '@/app/flight-deck/page';
import { SearchResultsView } from '@/components/search-results-view';
import { invalidateReadiness, READINESS_REFRESH_EVENT } from '@/components/readiness-provider';
import type { FlightDeckData, PlayLogEntry } from '@/lib/flight-deck';
import {
  buildActivePlayLogEntries,
  buildFlightDeckData,
  mergeActivePlayLog,
} from '@/lib/flight-deck';
import { GET as flightDeckGet } from '@/app/api/flight-deck/route';
import { GET as getAnnotations, POST as postAnnotation } from '@/app/api/annotations/route';
import { loadConfig, resetConfig } from '@/lib/config';
import { resetAuthorCacheForTesting, resetWriteQueuesForTesting } from '@/lib/annotation-manager';
import { resetExecutorForTesting, setSpawnImplForTesting, spawnPlay } from '@/lib/play-executor';

// ---------------------------------------------------------------------------
// Mocks — Next router for page-level render
// ---------------------------------------------------------------------------

const pushMock = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => '/flight-deck',
  useSearchParams: () => new URLSearchParams(),
}));

// ---------------------------------------------------------------------------
// Flight Deck fixtures
// ---------------------------------------------------------------------------

function makeFlightData(partial: Partial<FlightDeckData> = {}): FlightDeckData {
  return {
    attention: [],
    onTrack: [],
    metrics: { epicsInFlight: 0, activeDevelopers: 0, playsToday: 0, openIssues: 0 },
    playLog: [],
    playLogEmpty: true,
    empty: true,
    error: null,
    lastUpdatedIso: '2025-04-17T12:00:00Z',
    ...partial,
  };
}

function mockFlightFetchOnce(payload: FlightDeckData) {
  (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
    ok: true,
    status: 200,
    json: async () => payload,
  });
}

// ---------------------------------------------------------------------------
// VAL-CROSS-006 — Flight Deck auto-refreshes on readiness-invalidated
// ---------------------------------------------------------------------------

describe('Flight Deck auto-refresh on readiness invalidation (VAL-CROSS-006)', () => {
  beforeEach(() => {
    pushMock.mockReset();
    vi.stubGlobal('fetch', vi.fn());
    sessionStorage.clear();
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    sessionStorage.clear();
  });

  it('refetches /api/flight-deck when mdb:readiness-invalidated fires', async () => {
    // Mount.
    mockFlightFetchOnce(makeFlightData({ empty: true }));
    render(<FlightDeckPage />);
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(1);
    });
    expect(fetch).toHaveBeenCalledWith('/api/flight-deck');

    // Invalidate — simulates a checklist step (or Playbook wiki tag)
    // completing in a sibling component tree.
    mockFlightFetchOnce(makeFlightData({ empty: true }));
    await act(async () => {
      invalidateReadiness();
    });
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(2);
    });
    expect((fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[1]![0]).toBe(
      '/api/flight-deck',
    );
  });

  it('uses the documented readiness-refresh event name', () => {
    // Guard against accidental renames of the well-known event string;
    // Flight Deck, ReadinessProvider, checklists, and the Playbook all
    // share this constant to keep the cross-instrument bus coherent.
    expect(READINESS_REFRESH_EVENT).toBe('mdb:readiness-invalidated');
  });

  it('multiple rapid invalidations each trigger an independent refetch', async () => {
    mockFlightFetchOnce(makeFlightData({ empty: true }));
    render(<FlightDeckPage />);
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));

    mockFlightFetchOnce(makeFlightData({ empty: true }));
    mockFlightFetchOnce(makeFlightData({ empty: true }));
    mockFlightFetchOnce(makeFlightData({ empty: true }));
    await act(async () => {
      invalidateReadiness();
      invalidateReadiness();
      invalidateReadiness();
    });
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(4);
    });
  });
});

// ---------------------------------------------------------------------------
// VAL-CROSS-020 — Active executions in play log
// ---------------------------------------------------------------------------

describe('Concurrent play executions surface in the Flight Deck log (VAL-CROSS-020)', () => {
  it('buildActivePlayLogEntries returns RUNNING rows for each running record', () => {
    const now = new Date('2025-04-17T12:00:30Z');
    const rows = buildActivePlayLogEntries(
      [
        {
          executionId: 'exec-a',
          playName: 'play-quality-check',
          startTime: Date.parse('2025-04-17T12:00:00Z'),
          status: 'running',
        },
        {
          executionId: 'exec-b',
          playName: 'research',
          startTime: Date.parse('2025-04-17T12:00:10Z'),
          status: 'running',
        },
      ],
      now,
    );
    expect(rows).toHaveLength(2);
    for (const row of rows) {
      expect(row.status).toBe('RUNNING');
      expect(row.epicId).toBe('active');
      expect(row.timestamp).toBeTruthy();
      expect(row.durationSeconds).toBeGreaterThanOrEqual(0);
    }
    expect(rows.map((r) => r.playName)).toEqual(['play-quality-check', 'research']);
  });

  it('skips non-running records (complete, error, cancelled, timeout)', () => {
    const rows = buildActivePlayLogEntries(
      [
        { executionId: 'a', playName: 'x', startTime: Date.now(), status: 'complete' },
        { executionId: 'b', playName: 'y', startTime: Date.now(), status: 'error' },
        { executionId: 'c', playName: 'z', startTime: Date.now(), status: 'cancelled' },
        { executionId: 'd', playName: 'w', startTime: Date.now(), status: 'timeout' },
      ],
      new Date(),
    );
    expect(rows).toEqual([]);
  });

  it('mergeActivePlayLog sorts running executions before older STM rows', () => {
    const stm: PlayLogEntry[] = [
      {
        id: 'E1|old-run|2025-04-17T11:00:00Z',
        epicId: 'E1',
        epicLabel: 'E1: auth',
        playName: 'old-run',
        timestamp: '2025-04-17T11:00:00Z',
        timeLabel: '1h ago',
        status: 'DONE',
        rawStatus: 'success',
        durationSeconds: 5,
        durationLabel: '5s',
      },
    ];
    const active = buildActivePlayLogEntries(
      [
        {
          executionId: 'exec-fresh',
          playName: 'fresh-play',
          startTime: Date.parse('2025-04-17T12:00:00Z'),
          status: 'running',
        },
      ],
      new Date('2025-04-17T12:00:30Z'),
    );
    const merged = mergeActivePlayLog(stm, active);
    expect(merged[0]!.playName).toBe('fresh-play');
    expect(merged[0]!.status).toBe('RUNNING');
    expect(merged[1]!.playName).toBe('old-run');
  });

  it('buildFlightDeckData merges active rows into the play log', () => {
    const data = buildFlightDeckData(
      { epics: [], empty: true, error: null },
      new Date('2025-04-17T12:00:30Z'),
      [
        {
          executionId: 'exec-x',
          playName: 'ship',
          startTime: Date.parse('2025-04-17T12:00:00Z'),
          status: 'running',
        },
      ],
    );
    expect(data.playLog).toHaveLength(1);
    expect(data.playLog[0]!.status).toBe('RUNNING');
    expect(data.playLog[0]!.playName).toBe('ship');
    expect(data.playLogEmpty).toBe(false);
  });

  it('/api/flight-deck returns active executions from the in-memory tracker', async () => {
    // Synthetic spawn so real CLIs are never invoked.
    const liveChildren: Array<{ exit: (code: number | null) => void }> = [];
    class FakeChild extends EventEmitter {
      public pid = 88888;
      public stdout = new Readable({ read() {} });
      public stderr = new Readable({ read() {} });
      kill() {
        return true;
      }
    }
    const fakeSpawn = (() => {
      const fake = new FakeChild();
      liveChildren.push({ exit: (code) => fake.emit('close', code) });
      return fake as unknown as ChildProcess;
    }) as unknown as typeof import('node:child_process').spawn;

    resetExecutorForTesting();
    setSpawnImplForTesting(fakeSpawn);

    try {
      // Start a play — the tracker now has a running record.
      const result = spawnPlay({ playName: 'ship', timeoutMs: 0 });
      expect(result.record.status).toBe('running');

      const res = await flightDeckGet();
      const body = (await res.json()) as FlightDeckData;

      const running = body.playLog.filter((e) => e.status === 'RUNNING');
      expect(running.length).toBeGreaterThanOrEqual(1);
      expect(running.some((e) => e.playName === 'ship')).toBe(true);
      expect(body.playLogEmpty).toBe(false);
    } finally {
      for (const c of liveChildren) c.exit(null);
      resetExecutorForTesting();
      setSpawnImplForTesting(null);
    }
  });
});

// ---------------------------------------------------------------------------
// VAL-CROSS-017 — Annotation API is instrument-agnostic
// ---------------------------------------------------------------------------

function makeTempRepo(): {
  repoRoot: string;
  productBase: string;
  configPath: string;
} {
  const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'garura-cross-inst-'));
  const productBase = path.join(repoRoot, '.garura', 'product');
  fs.mkdirSync(productBase, { recursive: true });
  const coreDir = path.join(repoRoot, '.garura', 'core');
  fs.mkdirSync(coreDir, { recursive: true });
  const configPath = path.join(coreDir, 'config.yaml');
  fs.writeFileSync(
    configPath,
    [
      'project:',
      '  name: Cross Instrument Annotation Test',
      'repo:',
      `  path: ${repoRoot}`,
      'product:',
      '  base-path: .garura/product/',
      'stm:',
      '  base-path: .garura/project/issues/',
      '',
    ].join('\n'),
    'utf-8',
  );
  return { repoRoot, productBase, configPath };
}

function initGit(repoRoot: string): void {
  const env = { ...process.env, GIT_TERMINAL_PROMPT: '0' };
  execFileSync('git', ['init', '--quiet', '--initial-branch=main'], {
    cwd: repoRoot,
    env,
  });
  execFileSync('git', ['config', 'user.email', 'tester@example.com'], {
    cwd: repoRoot,
    env,
  });
  execFileSync('git', ['config', 'user.name', 'Playbook Author'], {
    cwd: repoRoot,
    env,
  });
}

function jsonRequest(url: string, init?: { method?: string; body?: unknown }): NextRequest {
  if (!init) return new NextRequest(new Request(url));
  const body = init.body === undefined ? undefined : JSON.stringify(init.body);
  return new NextRequest(new Request(url, { method: init.method, body }));
}

describe('Annotation API is instrument-agnostic (VAL-CROSS-017)', () => {
  let originalEnv: NodeJS.ProcessEnv;
  beforeEach(() => {
    originalEnv = { ...process.env };
    resetConfig();
    resetAuthorCacheForTesting();
    resetWriteQueuesForTesting();
  });

  afterEach(() => {
    process.env = originalEnv;
    resetConfig();
    resetAuthorCacheForTesting();
    resetWriteQueuesForTesting();
  });

  it('an annotation POSTed "from Playbook" is returned when GET is called "from any instrument"', async () => {
    const repo = makeTempRepo();
    initGit(repo.repoRoot);
    process.env.GARURA_TARGET_REPO = repo.repoRoot;
    loadConfig(repo.configPath);

    // Simulate the Playbook writing an annotation.
    const postRes = await postAnnotation(
      jsonRequest('http://localhost/api/annotations', {
        method: 'POST',
        body: {
          context: 'E1',
          content: 'Note from Playbook view',
          position: { sectionId: 'overview' },
        },
      }),
    );
    expect(postRes.status).toBe(201);

    // Simulate a different instrument (e.g. Checklists, Flight Deck)
    // querying the same context. The API route is the same — it only
    // consumes a context slug, has no instrument binding, and returns
    // the stored annotations unchanged.
    const listRes = await getAnnotations(
      jsonRequest('http://localhost/api/annotations?context=E1'),
    );
    expect(listRes.status).toBe(200);
    const body = (await listRes.json()) as {
      context: string;
      annotations: Array<{ content: string }>;
    };
    expect(body.context).toBe('E1');
    expect(body.annotations).toHaveLength(1);
    expect(body.annotations[0]!.content).toBe('Note from Playbook view');
  });

  it('annotations written under one context are isolated from another context', async () => {
    const repo = makeTempRepo();
    initGit(repo.repoRoot);
    process.env.GARURA_TARGET_REPO = repo.repoRoot;
    loadConfig(repo.configPath);

    await postAnnotation(
      jsonRequest('http://localhost/api/annotations', {
        method: 'POST',
        body: { context: 'E1', content: 'for E1 only', position: {} },
      }),
    );

    const e2Res = await getAnnotations(jsonRequest('http://localhost/api/annotations?context=E2'));
    const e2Body = (await e2Res.json()) as { annotations: unknown[] };
    expect(e2Body.annotations).toEqual([]);

    const e1Res = await getAnnotations(jsonRequest('http://localhost/api/annotations?context=E1'));
    const e1Body = (await e1Res.json()) as { annotations: Array<{ content: string }> };
    expect(e1Body.annotations).toHaveLength(1);
    expect(e1Body.annotations[0]!.content).toBe('for E1 only');
  });
});

// ---------------------------------------------------------------------------
// VAL-CROSS-018 — Search results navigate to /playbook?context=<refId>
// ---------------------------------------------------------------------------

describe('Search results navigate to the correct Playbook context (VAL-CROSS-018)', () => {
  beforeEach(() => {
    pushMock.mockReset();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('clicking a CrossRefToken in a result pushes /playbook?context=<refId>', async () => {
    globalThis.fetch = vi.fn(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            query: 'auth',
            hitCount: 1,
            composedAt: '2025-04-17T12:00:00Z',
            epics: [{ id: 'EPIC-E1', shortId: 'E1', name: 'Authentication' }],
            results: [
              {
                id: 'feature:F1',
                title: 'Authentication',
                kind: 'feature',
                relevance: 9.0,
                primaryRefId: 'F1',
                chunks: [
                  { type: 'text', text: 'Feature ' },
                  { type: 'token', token: { refId: 'F1', dangling: false } },
                  { type: 'text', text: ' is covered by ' },
                  { type: 'token', token: { refId: 'SC-AUTH-001', dangling: false } },
                  { type: 'text', text: '.' },
                ],
                sources: [
                  {
                    entityId: 'F1',
                    sourceType: 'features',
                    sourceFile: '/tmp/features.yaml',
                    score: 2,
                    title: 'Authentication',
                  },
                ],
                epics: [{ id: 'EPIC-E1', shortId: 'E1', name: 'Authentication' }],
              },
            ],
          }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        ),
      ),
    ) as unknown as typeof fetch;

    render(<SearchResultsView query="auth" />);
    const card = await screen.findByTestId('search-result-card');
    const tokens = within(card).getAllByTestId('cross-ref-token');

    fireEvent.click(tokens[0]!);
    expect(pushMock).toHaveBeenLastCalledWith('/playbook?context=F1');

    fireEvent.click(tokens[1]!);
    expect(pushMock).toHaveBeenLastCalledWith('/playbook?context=SC-AUTH-001');
  });

  it('epic badges render as /playbook?context=<epicId> links', async () => {
    globalThis.fetch = vi.fn(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            query: 'auth',
            hitCount: 1,
            composedAt: '2025-04-17T12:00:00Z',
            epics: [{ id: 'EPIC-E1', shortId: 'E1', name: 'Authentication' }],
            results: [
              {
                id: 'feature:F1',
                title: 'Authentication',
                kind: 'feature',
                relevance: 9.0,
                primaryRefId: 'F1',
                chunks: [{ type: 'text', text: 'See epic' }],
                sources: [
                  {
                    entityId: 'F1',
                    sourceType: 'features',
                    sourceFile: '/tmp/features.yaml',
                    score: 1,
                    title: 'Authentication',
                  },
                ],
                epics: [{ id: 'EPIC-E1', shortId: 'E1', name: 'Authentication' }],
              },
            ],
          }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        ),
      ),
    ) as unknown as typeof fetch;

    render(<SearchResultsView query="auth" />);
    const card = await screen.findByTestId('search-result-card');
    const badge = within(card).getByTestId('search-result-epic-badge');
    expect(badge.getAttribute('href')).toBe('/playbook?context=EPIC-E1');
  });
});
