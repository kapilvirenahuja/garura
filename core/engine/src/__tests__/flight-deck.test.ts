/**
 * Tests for the Flight Deck aggregator (`@/lib/flight-deck`).
 *
 * Exercises the pure transformation from `EpicDiscoveryResult` into the
 * `FlightDeckData` shape the page consumes: status-color heuristics,
 * attention/on-track partitioning, diagnostic composition, and metric
 * computation.
 *
 * Fulfills:
 *   VAL-FLIGHT-008 (failures → Needs Attention)
 *   VAL-FLIGHT-009 (on-track epics compact — data-level partition)
 *   VAL-FLIGHT-010 (yellow for stalled epics)
 *   VAL-FLIGHT-011 (AI diagnostic for attention epics)
 *   VAL-FLIGHT-013 (epics in flight counter)
 *   VAL-FLIGHT-014 (active developers counter)
 *   VAL-FLIGHT-015 (plays today counter)
 *   VAL-FLIGHT-016 (open issues counter)
 *   VAL-FLIGHT-017 (metrics derived, not hardcoded)
 */

import { describe, it, expect } from 'vitest';
import {
  buildEpicCard,
  buildFlightDeckData,
  buildPlayLog,
  computeMetrics,
  composeDiagnostic,
  deriveStatusColor,
  formatDuration,
  normalizePlayStatus,
  STALE_THRESHOLD_HOURS,
} from '@/lib/flight-deck';
import type {
  EpicInfo,
  EpicDiscoveryResult,
  StmEvidenceSummary,
  EpicStage,
} from '@/lib/epic-status';

const NOW = new Date('2025-04-17T12:00:00Z');

function makeStm(overrides: Partial<StmEvidenceSummary> = {}): StmEvidenceSummary {
  return {
    playHistory: [],
    qualityChecks: [],
    validationResults: [],
    stmPath: null,
    ...overrides,
  };
}

function makeEpic(partial: Partial<EpicInfo> & { id: string }): EpicInfo {
  return {
    slug: partial.slug ?? '',
    branchName: partial.branchName ?? `feat/${partial.id.toLowerCase()}-x`,
    hash: partial.hash ?? 'abc1234',
    stage: (partial.stage ?? 'Implementation') as EpicStage,
    developer: partial.developer ?? 'Kapil',
    lastCommit: partial.lastCommit ?? {
      hash: 'abc1234',
      author: 'Kapil',
      timestamp: '2025-04-17T11:45:00Z',
      message: 'work in progress',
    },
    branchCommits: partial.branchCommits ?? 1,
    artifactsPresent: partial.artifactsPresent ?? [],
    stmEvidence: partial.stmEvidence ?? makeStm(),
    ...partial,
  };
}

// ---------------------------------------------------------------------------
// deriveStatusColor
// ---------------------------------------------------------------------------

describe('deriveStatusColor', () => {
  it('returns red when quality-check evidence has failures (VAL-FLIGHT-008)', () => {
    const epic = makeEpic({
      id: 'E1',
      stmEvidence: makeStm({
        qualityChecks: [
          { status: 'fail', timestamp: '2025-04-17T10:00:00Z', issues: ['#142 flaky test'] },
        ],
      }),
    });
    expect(deriveStatusColor(epic, NOW)).toBe('red');
  });

  it('returns red when quality-check has issues even if status is unknown', () => {
    const epic = makeEpic({
      id: 'E1',
      stmEvidence: makeStm({
        qualityChecks: [
          { status: 'unknown', timestamp: '2025-04-17T10:00:00Z', issues: ['#145 regression'] },
        ],
      }),
    });
    expect(deriveStatusColor(epic, NOW)).toBe('red');
  });

  it('returns red when play history has a failed run', () => {
    const epic = makeEpic({
      id: 'E1',
      stmEvidence: makeStm({
        playHistory: [{ name: 'play-quality-check', status: 'failed' }],
      }),
    });
    expect(deriveStatusColor(epic, NOW)).toBe('red');
  });

  it('returns red when validation result has scenariosFailed > 0', () => {
    const epic = makeEpic({
      id: 'E1',
      stmEvidence: makeStm({
        validationResults: [{ status: 'done', scenariosFailed: 2 }],
      }),
    });
    expect(deriveStatusColor(epic, NOW)).toBe('red');
  });

  it('returns yellow when no failures but last commit is stale (VAL-FLIGHT-010)', () => {
    const stale = new Date(NOW.getTime() - (STALE_THRESHOLD_HOURS + 5) * 60 * 60 * 1000);
    const epic = makeEpic({
      id: 'E1',
      lastCommit: {
        hash: 'abc',
        author: 'Kapil',
        timestamp: stale.toISOString(),
        message: 'stale work',
      },
    });
    expect(deriveStatusColor(epic, NOW)).toBe('yellow');
  });

  it('returns green for healthy epics with recent commits', () => {
    const epic = makeEpic({
      id: 'E1',
      lastCommit: {
        hash: 'abc',
        author: 'Kapil',
        timestamp: '2025-04-17T11:45:00Z',
        message: 'recent',
      },
    });
    expect(deriveStatusColor(epic, NOW)).toBe('green');
  });
});

// ---------------------------------------------------------------------------
// composeDiagnostic
// ---------------------------------------------------------------------------

describe('composeDiagnostic', () => {
  it('names the epic, references issues, and states a likely cause', () => {
    const epic = makeEpic({
      id: 'E1',
      slug: 'auth',
      stmEvidence: makeStm({
        qualityChecks: [
          {
            status: 'fail',
            timestamp: '2025-04-17T10:00:00Z',
            issues: ['#142 flaky test', '#145 timeout regression'],
          },
        ],
      }),
    });
    const diag = composeDiagnostic(epic);
    expect(diag).toContain('E1');
    expect(diag).toContain('auth');
    expect(diag).toContain('#142 flaky test');
    expect(diag.toLowerCase()).toContain('likely cause');
  });

  it('falls back to a play-based sentence when only play failures exist', () => {
    const epic = makeEpic({
      id: 'E2',
      stmEvidence: makeStm({
        playHistory: [{ name: 'play-impl', status: 'failed' }],
      }),
    });
    const diag = composeDiagnostic(epic);
    expect(diag).toMatch(/play/i);
    expect(diag).toMatch(/likely cause/i);
  });
});

// ---------------------------------------------------------------------------
// buildEpicCard
// ---------------------------------------------------------------------------

describe('buildEpicCard', () => {
  it('populates all five required fields (VAL-FLIGHT-022)', () => {
    const epic = makeEpic({
      id: 'E1',
      slug: 'auth',
      stage: 'Implementation',
      developer: 'Kapil',
      lastCommit: {
        hash: 'abc',
        author: 'Kapil',
        timestamp: '2025-04-17T11:45:00Z',
        message: 'wire up login',
      },
    });
    const card = buildEpicCard(epic, NOW);
    expect(card.name).toBe('E1: auth');
    expect(card.developer).toBe('Kapil');
    expect(card.stage).toBe('Implementation');
    expect(card.lastActivityRelative).toBe('15m ago');
    expect(card.statusColor).toBe('green');
    expect(card.lastCommitMessage).toBe('wire up login');
  });

  it('falls back to "unassigned" developer when none recoverable', () => {
    const epic: EpicInfo = {
      ...makeEpic({ id: 'E3' }),
      developer: null,
      lastCommit: null,
    };
    const card = buildEpicCard(epic, NOW);
    expect(card.developer).toBe('unassigned');
    expect(card.lastCommitMessage).toBe('(no commits yet)');
    expect(card.lastActivityRelative).toBe('');
  });

  it('emits a non-empty diagnostic for attention cards only (VAL-FLIGHT-011)', () => {
    const attention = buildEpicCard(
      makeEpic({
        id: 'E1',
        stmEvidence: makeStm({
          qualityChecks: [{ status: 'fail', timestamp: '2025-04-17T10:00:00Z', issues: ['#1'] }],
        }),
      }),
      NOW,
    );
    expect(attention.category).toBe('attention');
    expect(attention.aiDiagnostic.length).toBeGreaterThan(0);

    const onTrack = buildEpicCard(makeEpic({ id: 'E2' }), NOW);
    expect(onTrack.category).toBe('on-track');
    expect(onTrack.aiDiagnostic).toBe('');
  });

  it('surfaces issue references on attention cards (VAL-FLIGHT-023)', () => {
    const card = buildEpicCard(
      makeEpic({
        id: 'E1',
        stmEvidence: makeStm({
          qualityChecks: [
            {
              status: 'fail',
              timestamp: '2025-04-17T10:00:00Z',
              issues: ['#142 flaky test', '#145 timeout regression'],
            },
          ],
        }),
      }),
      NOW,
    );
    expect(card.issues).toEqual(['#142 flaky test', '#145 timeout regression']);
    expect(card.issueCount).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// computeMetrics
// ---------------------------------------------------------------------------

describe('computeMetrics', () => {
  it('returns zeros for no epics (VAL-FLIGHT-017)', () => {
    const m = computeMetrics([], NOW);
    expect(m).toEqual({
      epicsInFlight: 0,
      activeDevelopers: 0,
      playsToday: 0,
      openIssues: 0,
    });
  });

  it('counts epics in flight (VAL-FLIGHT-013)', () => {
    const epics = [makeEpic({ id: 'E1' }), makeEpic({ id: 'E2' }), makeEpic({ id: 'E3' })];
    expect(computeMetrics(epics, NOW).epicsInFlight).toBe(3);
  });

  it('counts unique active developers (VAL-FLIGHT-014)', () => {
    const epics = [
      makeEpic({
        id: 'E1',
        lastCommit: {
          hash: 'a',
          author: 'Alice',
          timestamp: '2025-04-17T10:00:00Z',
          message: 'x',
        },
      }),
      makeEpic({
        id: 'E2',
        lastCommit: {
          hash: 'b',
          author: 'Bob',
          timestamp: '2025-04-17T10:30:00Z',
          message: 'y',
        },
      }),
      makeEpic({
        id: 'E3',
        lastCommit: {
          hash: 'c',
          author: 'Alice',
          timestamp: '2025-04-17T11:00:00Z',
          message: 'z',
        },
      }),
    ];
    expect(computeMetrics(epics, NOW).activeDevelopers).toBe(2);
  });

  it('counts play runs with timestamp on the current calendar day (VAL-FLIGHT-015)', () => {
    // Use local-time Date constructors so the calendar-day check is deterministic
    // regardless of the test runner's timezone.
    const nowLocal = new Date(2025, 3, 17, 12, 0, 0);
    const todayMorning = new Date(2025, 3, 17, 1, 0, 0);
    const todayEvening = new Date(2025, 3, 17, 18, 0, 0);
    const threeDaysAgo = new Date(2025, 3, 14, 10, 0, 0);
    const epics = [
      makeEpic({
        id: 'E1',
        stmEvidence: makeStm({
          playHistory: [
            { name: 'p1', status: 'success', timestamp: todayMorning.toISOString() },
            { name: 'p2', status: 'success', timestamp: todayEvening.toISOString() },
            { name: 'p3', status: 'success', timestamp: threeDaysAgo.toISOString() },
          ],
        }),
      }),
    ];
    const m = computeMetrics(epics, nowLocal);
    expect(m.playsToday).toBe(2);
  });

  it('aggregates open issues across quality checks and failed validations (VAL-FLIGHT-016)', () => {
    const epics = [
      makeEpic({
        id: 'E1',
        stmEvidence: makeStm({
          qualityChecks: [
            { status: 'fail', timestamp: '2025-04-17T06:00:00Z', issues: ['#1', '#2'] },
          ],
          validationResults: [{ status: 'done', scenariosFailed: 3 }],
        }),
      }),
      makeEpic({
        id: 'E2',
        stmEvidence: makeStm({
          qualityChecks: [{ status: 'fail', timestamp: '2025-04-17T06:00:00Z', issues: ['#3'] }],
        }),
      }),
    ];
    const m = computeMetrics(epics, NOW);
    expect(m.openIssues).toBe(6); // 2 + 3 + 1
  });
});

// ---------------------------------------------------------------------------
// buildFlightDeckData
// ---------------------------------------------------------------------------

describe('buildFlightDeckData', () => {
  it('partitions attention vs on-track and orders attention by issue count', () => {
    const result: EpicDiscoveryResult = {
      empty: false,
      error: null,
      epics: [
        makeEpic({
          id: 'E1',
          stmEvidence: makeStm({
            qualityChecks: [{ status: 'fail', timestamp: '2025-04-17T06:00:00Z', issues: ['#1'] }],
          }),
        }),
        makeEpic({
          id: 'E2',
          stmEvidence: makeStm({
            qualityChecks: [
              {
                status: 'fail',
                timestamp: '2025-04-17T06:00:00Z',
                issues: ['#a', '#b', '#c'],
              },
            ],
          }),
        }),
        makeEpic({ id: 'E3' }),
        makeEpic({
          id: 'E4',
          lastCommit: {
            hash: 'z',
            author: 'Ada',
            timestamp: '2025-04-14T08:00:00Z',
            message: 'stale',
          },
        }),
      ],
    };

    const data = buildFlightDeckData(result, NOW);

    // Attention cards sorted: E2 (3 issues) before E1 (1 issue)
    expect(data.attention.map((c) => c.id)).toEqual(['E2', 'E1']);
    // On-track: green (E3) before yellow (E4)
    expect(data.onTrack.map((c) => c.id)).toEqual(['E3', 'E4']);
    expect(data.onTrack[0]?.statusColor).toBe('green');
    expect(data.onTrack[1]?.statusColor).toBe('yellow');

    expect(data.empty).toBe(false);
    expect(data.metrics.epicsInFlight).toBe(4);
  });

  it('carries through the empty flag and error for discovery errors', () => {
    const result: EpicDiscoveryResult = {
      empty: true,
      error: 'not a git repo',
      epics: [],
    };
    const data = buildFlightDeckData(result, NOW);
    expect(data.empty).toBe(true);
    expect(data.error).toBe('not a git repo');
    expect(data.attention).toEqual([]);
    expect(data.onTrack).toEqual([]);
    expect(data.metrics.epicsInFlight).toBe(0);
    expect(data.playLog).toEqual([]);
    expect(data.playLogEmpty).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Play log — normalizePlayStatus (VAL-FLIGHT-020)
// ---------------------------------------------------------------------------

describe('normalizePlayStatus', () => {
  it('maps success-like tokens to DONE', () => {
    for (const t of ['done', 'DONE', 'success', 'succeeded', 'passed', 'pass', 'complete', 'ok']) {
      expect(normalizePlayStatus(t)).toBe('DONE');
    }
  });

  it('maps failure-like tokens to FAIL', () => {
    for (const t of ['fail', 'failed', 'FAILING', 'error', 'errored']) {
      expect(normalizePlayStatus(t)).toBe('FAIL');
    }
  });

  it('maps warning-like tokens to WARN', () => {
    for (const t of ['warn', 'WARNING', 'flaky', 'partial']) {
      expect(normalizePlayStatus(t)).toBe('WARN');
    }
  });

  it('maps in-progress-like tokens to RUNNING', () => {
    for (const t of ['running', 'in_progress', 'in-progress', 'pending', 'queued', 'active']) {
      expect(normalizePlayStatus(t)).toBe('RUNNING');
    }
  });

  it('falls back to UNKNOWN for unrecognized or empty tokens', () => {
    expect(normalizePlayStatus(undefined)).toBe('UNKNOWN');
    expect(normalizePlayStatus(null)).toBe('UNKNOWN');
    expect(normalizePlayStatus('')).toBe('UNKNOWN');
    expect(normalizePlayStatus('mystery')).toBe('UNKNOWN');
  });
});

// ---------------------------------------------------------------------------
// Play log — formatDuration
// ---------------------------------------------------------------------------

describe('formatDuration', () => {
  it('renders sub-second values as "<1s"', () => {
    expect(formatDuration(0)).toBe('<1s');
    expect(formatDuration(0.4)).toBe('<1s');
  });

  it('renders seconds as integer-seconds', () => {
    expect(formatDuration(1)).toBe('1s');
    expect(formatDuration(45)).toBe('45s');
    expect(formatDuration(59)).toBe('59s');
  });

  it('renders minutes with optional trailing seconds', () => {
    expect(formatDuration(60)).toBe('1m');
    expect(formatDuration(90)).toBe('1m 30s');
    expect(formatDuration(150)).toBe('2m 30s');
    expect(formatDuration(600)).toBe('10m');
  });

  it('renders hours with optional trailing minutes', () => {
    expect(formatDuration(3600)).toBe('1h');
    expect(formatDuration(3900)).toBe('1h 5m');
  });

  it('returns a dash for null/undefined/invalid values', () => {
    expect(formatDuration(null)).toBe('—');
    expect(formatDuration(undefined)).toBe('—');
    expect(formatDuration(-1)).toBe('—');
    expect(formatDuration(Number.NaN)).toBe('—');
  });
});

// ---------------------------------------------------------------------------
// Play log — buildPlayLog (VAL-FLIGHT-018, VAL-FLIGHT-019, VAL-FLIGHT-020)
// ---------------------------------------------------------------------------

describe('buildPlayLog', () => {
  it('returns an empty list when no epics have play history', () => {
    expect(buildPlayLog([], NOW)).toEqual([]);
    const epic = makeEpic({ id: 'E1' });
    expect(buildPlayLog([epic], NOW)).toEqual([]);
  });

  it('flattens play history across epics and attaches epic context (VAL-FLIGHT-018)', () => {
    const epic1 = makeEpic({
      id: 'E1',
      slug: 'auth',
      stmEvidence: makeStm({
        playHistory: [
          {
            name: 'play-implement-epic',
            status: 'success',
            timestamp: '2025-04-17T10:00:00Z',
            durationSeconds: 45,
          },
        ],
      }),
    });
    const epic2 = makeEpic({
      id: 'E2',
      slug: 'billing',
      stmEvidence: makeStm({
        playHistory: [
          { name: 'play-quality-check', status: 'failed', timestamp: '2025-04-17T11:00:00Z' },
        ],
      }),
    });
    const log = buildPlayLog([epic1, epic2], NOW);
    expect(log).toHaveLength(2);
    const first = log[0]!;
    const second = log[1]!;
    expect(first.epicId).toBe('E2');
    expect(first.epicLabel).toBe('E2: billing');
    expect(first.playName).toBe('play-quality-check');
    expect(first.status).toBe('FAIL');
    expect(second.epicId).toBe('E1');
    expect(second.epicLabel).toBe('E1: auth');
    expect(second.playName).toBe('play-implement-epic');
    expect(second.status).toBe('DONE');
    expect(second.durationSeconds).toBe(45);
    expect(second.durationLabel).toBe('45s');
  });

  it('sorts entries with the most recent timestamp first (VAL-FLIGHT-019)', () => {
    const epic = makeEpic({
      id: 'E1',
      stmEvidence: makeStm({
        playHistory: [
          { name: 'older', status: 'success', timestamp: '2025-04-15T10:00:00Z' },
          { name: 'newest', status: 'running', timestamp: '2025-04-17T11:50:00Z' },
          { name: 'middle', status: 'warn', timestamp: '2025-04-16T10:00:00Z' },
        ],
      }),
    });
    const log = buildPlayLog([epic], NOW);
    expect(log.map((e) => e.playName)).toEqual(['newest', 'middle', 'older']);
    // First row holds the latest timestamp
    expect(log[0]!.timestamp).toBe('2025-04-17T11:50:00Z');
  });

  it('places entries without timestamps at the bottom', () => {
    const epic = makeEpic({
      id: 'E1',
      stmEvidence: makeStm({
        playHistory: [
          { name: 'no-ts', status: 'success' },
          { name: 'with-ts', status: 'success', timestamp: '2025-04-17T10:00:00Z' },
        ],
      }),
    });
    const log = buildPlayLog([epic], NOW);
    expect(log[0]!.playName).toBe('with-ts');
    expect(log[1]!.playName).toBe('no-ts');
    expect(log[1]!.timestamp).toBeNull();
    expect(log[1]!.durationLabel).toBe('—');
  });

  it('normalizes each raw status into a canonical PlayLogStatus (VAL-FLIGHT-020)', () => {
    const epic = makeEpic({
      id: 'E1',
      stmEvidence: makeStm({
        playHistory: [
          { name: 'a', status: 'success', timestamp: '2025-04-17T11:00:00Z' },
          { name: 'b', status: 'failed', timestamp: '2025-04-17T10:00:00Z' },
          { name: 'c', status: 'warn', timestamp: '2025-04-17T09:00:00Z' },
          { name: 'd', status: 'running', timestamp: '2025-04-17T08:00:00Z' },
          { name: 'e', status: 'mystery', timestamp: '2025-04-17T07:00:00Z' },
        ],
      }),
    });
    const statuses = buildPlayLog([epic], NOW).map((e) => e.status);
    expect(statuses).toEqual(['DONE', 'FAIL', 'WARN', 'RUNNING', 'UNKNOWN']);
  });

  it('uses just the epic id when slug is empty', () => {
    const epic = makeEpic({
      id: 'E7',
      slug: '',
      stmEvidence: makeStm({
        playHistory: [{ name: 'p', status: 'success', timestamp: '2025-04-17T10:00:00Z' }],
      }),
    });
    const log = buildPlayLog([epic], NOW);
    expect(log[0]!.epicLabel).toBe('E7');
  });

  it('exposes playLog + playLogEmpty on the top-level FlightDeckData', () => {
    const result: EpicDiscoveryResult = {
      empty: false,
      error: null,
      epics: [
        makeEpic({
          id: 'E1',
          stmEvidence: makeStm({
            playHistory: [
              {
                name: 'play-specify',
                status: 'success',
                timestamp: '2025-04-17T10:00:00Z',
                durationSeconds: 12,
              },
            ],
          }),
        }),
      ],
    };
    const data = buildFlightDeckData(result, NOW);
    expect(data.playLog).toHaveLength(1);
    expect(data.playLog[0]!.playName).toBe('play-specify');
    expect(data.playLog[0]!.status).toBe('DONE');
    expect(data.playLog[0]!.durationLabel).toBe('12s');
    expect(data.playLogEmpty).toBe(false);
  });
});
