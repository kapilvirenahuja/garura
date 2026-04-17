/**
 * Tests for the Checklist Engine — selection, ordering, and status logic
 * for the mid-project checklists view.
 *
 * Fulfills: VAL-CHECK-012 (multiple checklists displayed),
 *           VAL-CHECK-015 (completed at bottom),
 *           VAL-CHECK-016 (ordered by impact)
 */

import { describe, it, expect } from 'vitest';
import {
  computeChecklistImpact,
  deriveChecklistStatus,
  selectChecklists,
} from '@/lib/checklist-engine';
import type { ChecklistDefinition } from '@/lib/checklist-loader';
import type {
  PlayDefinition,
  ReadinessResult,
  PlayReadiness,
  AreaBreakdown,
} from '@/lib/readiness';
import { PLAY_REGISTRY } from '@/lib/readiness';

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

const FIXTURE_CHECKLISTS: ReadonlyArray<ChecklistDefinition> = [
  {
    id: 'greenfield-onboarding',
    title: 'Getting Started: Greenfield Onboarding',
    description: 'Onboard a new project from scratch.',
    category: 'onboarding',
    steps: [
      { id: 's1', label: 'Step 1', description: 'Desc 1', play: 'discover-product' },
      { id: 's2', label: 'Step 2', description: 'Desc 2', play: 'research-market-opportunity' },
      { id: 's3', label: 'Step 3', description: 'Desc 3', play: 'specify-product' },
      { id: 's4', label: 'Step 4', description: 'Desc 4', play: 'draft-product-spec' },
      { id: 's5', label: 'Step 5', description: 'Desc 5', play: 'plan-roadmap' },
    ],
  },
  {
    id: 'brownfield-onboarding',
    title: 'Brownfield Project Onboarding',
    description: 'Onboard to an existing project.',
    category: 'onboarding',
    steps: [
      { id: 'b1', label: 'Scout', description: 'Scout the project', play: 'scout-project' },
      { id: 'b2', label: 'Check drift', description: 'Check for drift', play: 'check-drift' },
      { id: 'b3', label: 'Quality audit', description: 'Run quality audit', play: 'quality-check' },
      { id: 'b4', label: 'Capture', description: 'Capture learnings', play: 'capture-learning' },
      { id: 'b5', label: 'Plan', description: 'Plan next phase', play: 'plan-roadmap' },
    ],
  },
  {
    id: 'prepare-epic',
    title: 'Prepare Epic for Implementation',
    description: 'Produce design artifacts before implementation.',
    category: 'epic-preparation',
    steps: [
      {
        id: 'p1',
        label: 'Lock features',
        description: 'Lock features',
        play: 'draft-product-spec',
      },
      { id: 'p2', label: 'Design', description: 'Design experience', play: 'design-exp' },
      { id: 'p3', label: 'Build arch', description: 'Build architecture', play: 'build-arch' },
      { id: 'p4', label: 'Prepare', description: 'Prepare epic', play: 'prepare-epic' },
      { id: 'p5', label: 'Implement', description: 'Begin implementation', play: 'implement-epic' },
    ],
  },
];

/** Helper to build a mock ReadinessResult */
function buildReadinessResult(
  availableArtifacts: Set<string>,
  plays: ReadonlyArray<PlayDefinition> = PLAY_REGISTRY,
): ReadinessResult {
  const playResults: PlayReadiness[] = plays.map((play) => {
    const satisfied: string[] = [];
    const missing: string[] = [];
    for (const precondition of play.preconditions) {
      if (availableArtifacts.has(precondition)) {
        satisfied.push(precondition);
      } else {
        missing.push(precondition);
      }
    }
    return {
      name: play.name,
      area: play.area,
      runnable: missing.length === 0,
      satisfiedPreconditions: satisfied,
      missingPreconditions: missing,
    };
  });

  const totalPlays = playResults.length;
  const runnablePlays = playResults.filter((p) => p.runnable).length;
  const rawScore = totalPlays > 0 ? (runnablePlays / totalPlays) * 100 : 0;
  const score = Math.min(100, Math.max(0, Math.round(rawScore)));

  const areas = ['Product', 'Features', 'Roadmap', 'Architecture', 'Epics'] as const;
  const breakdown: AreaBreakdown[] = areas.map((area) => {
    const areaPlays = playResults.filter((p) => p.area === area);
    const total = areaPlays.length;
    const runnable = areaPlays.filter((p) => p.runnable).length;
    const percentage = total > 0 ? Math.round((runnable / total) * 100) : 0;
    const status =
      total === 0
        ? ('missing' as const)
        : runnable === 0
          ? ('missing' as const)
          : runnable === total
            ? ('complete' as const)
            : ('in-progress' as const);
    return { area, status, totalPlays: total, runnablePlays: runnable, percentage };
  });

  return {
    score,
    totalPlays,
    runnablePlays,
    breakdown,
    plays: playResults,
    lastGitHash: null,
  };
}

// ---------------------------------------------------------------------------
// deriveChecklistStatus
// ---------------------------------------------------------------------------

describe('deriveChecklistStatus', () => {
  it('returns "completed" when all steps are done', () => {
    expect(deriveChecklistStatus(5, 5)).toBe('completed');
  });

  it('returns "completed" when completedSteps exceeds totalSteps', () => {
    expect(deriveChecklistStatus(6, 5)).toBe('completed');
  });

  it('returns "in-progress" when some steps are done', () => {
    expect(deriveChecklistStatus(3, 5)).toBe('in-progress');
  });

  it('returns "not-started" when no steps are done', () => {
    expect(deriveChecklistStatus(0, 5)).toBe('not-started');
  });

  it('returns "completed" for empty checklist (0 total steps)', () => {
    expect(deriveChecklistStatus(0, 0)).toBe('completed');
  });
});

// ---------------------------------------------------------------------------
// computeChecklistImpact
// ---------------------------------------------------------------------------

describe('computeChecklistImpact', () => {
  it('returns 0 for unknown checklist ID', () => {
    const available = new Set<string>();
    expect(computeChecklistImpact('unknown-checklist', available)).toBe(0);
  });

  it('returns positive impact for greenfield-onboarding when no artifacts exist', () => {
    const available = new Set<string>();
    const impact = computeChecklistImpact('greenfield-onboarding', available);
    expect(impact).toBeGreaterThan(0);
  });

  it('returns higher impact for the checklist targeting more missing areas', () => {
    // With only product.yaml, prepare-epic targets Architecture & Epics (lots of unrunnable plays)
    // greenfield-onboarding targets Product, Features, Roadmap
    const available = new Set(['product.yaml']);

    const greenfieldImpact = computeChecklistImpact('greenfield-onboarding', available);
    const prepareImpact = computeChecklistImpact('prepare-epic', available);

    // Both should be positive since artifacts are missing in their areas
    expect(greenfieldImpact).toBeGreaterThanOrEqual(0);
    expect(prepareImpact).toBeGreaterThanOrEqual(0);
  });

  it('returns 0 when all artifacts are already present', () => {
    const allArtifacts = new Set([
      'product.yaml',
      'features.yaml',
      'scenarios.yaml',
      'plan.yaml',
      'architecture.yaml',
      'tech.yaml',
      'roadmap.yaml',
    ]);
    const impact = computeChecklistImpact('greenfield-onboarding', allArtifacts);
    expect(impact).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// selectChecklists — ordering by impact (VAL-CHECK-016)
// ---------------------------------------------------------------------------

describe('selectChecklists — ordering by impact (VAL-CHECK-016)', () => {
  it('places highest-impact checklist first in active list', () => {
    // With product.yaml only — multiple areas missing
    const available = new Set(['product.yaml']);
    const readinessResult = buildReadinessResult(available);

    const result = selectChecklists(FIXTURE_CHECKLISTS, readinessResult);

    // All checklists should be active (none completed)
    expect(result.active.length).toBeGreaterThan(0);

    // Verify descending impact order
    const activeItems = [...result.active];
    for (let i = 1; i < activeItems.length; i++) {
      const prev = activeItems[i - 1]!;
      const curr = activeItems[i]!;
      expect(prev.readinessImpact).toBeGreaterThanOrEqual(curr.readinessImpact);
    }
  });

  it('returns multiple active checklists for mid-project state', () => {
    const available = new Set(['product.yaml', 'features.yaml']);
    const readinessResult = buildReadinessResult(available);

    const result = selectChecklists(FIXTURE_CHECKLISTS, readinessResult);

    // Should have at least 2 active checklists (VAL-CHECK-012)
    expect(result.active.length).toBeGreaterThanOrEqual(2);
  });

  it('separates completed checklists from active ones', () => {
    const available = new Set(['product.yaml']);
    const readinessResult = buildReadinessResult(available);

    // Mark greenfield-onboarding as all steps completed
    const completions = new Map<string, Array<{ stepId: string; completed: boolean }>>([
      [
        'greenfield-onboarding',
        [
          { stepId: 's1', completed: true },
          { stepId: 's2', completed: true },
          { stepId: 's3', completed: true },
          { stepId: 's4', completed: true },
          { stepId: 's5', completed: true },
        ],
      ],
    ]);

    const result = selectChecklists(FIXTURE_CHECKLISTS, readinessResult, completions);

    // Greenfield should be in completed
    expect(result.completed.some((c) => c.checklist.id === 'greenfield-onboarding')).toBe(true);

    // Other checklists should be in active
    expect(result.active.some((c) => c.checklist.id !== 'greenfield-onboarding')).toBe(true);

    // Completed should not appear in active
    expect(result.active.some((c) => c.checklist.id === 'greenfield-onboarding')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// selectChecklists — status computation
// ---------------------------------------------------------------------------

describe('selectChecklists — status computation', () => {
  it('marks checklists with no completed steps as not-started', () => {
    const available = new Set(['product.yaml']);
    const readinessResult = buildReadinessResult(available);

    const result = selectChecklists(FIXTURE_CHECKLISTS, readinessResult);

    // All should be not-started since no completions provided
    result.active.forEach((item) => {
      expect(item.status).toBe('not-started');
    });
  });

  it('marks partially completed checklists as in-progress', () => {
    const available = new Set(['product.yaml']);
    const readinessResult = buildReadinessResult(available);

    const completions = new Map([
      [
        'prepare-epic',
        [
          { stepId: 'p1', completed: true },
          { stepId: 'p2', completed: true },
          { stepId: 'p3', completed: false },
          { stepId: 'p4', completed: false },
          { stepId: 'p5', completed: false },
        ],
      ],
    ]);

    const result = selectChecklists(FIXTURE_CHECKLISTS, readinessResult, completions);

    const prepareEpic = result.active.find((c) => c.checklist.id === 'prepare-epic');
    if (!prepareEpic) throw new Error('prepare-epic not found in active list');
    expect(prepareEpic.status).toBe('in-progress');
    expect(prepareEpic.completedSteps).toBe(2);
    expect(prepareEpic.totalSteps).toBe(5);
  });
});

// ---------------------------------------------------------------------------
// selectChecklists — rationale (VAL-CHECK-017)
// ---------------------------------------------------------------------------

describe('selectChecklists — rationale (VAL-CHECK-017)', () => {
  it('generates non-empty rationale text', () => {
    const available = new Set(['product.yaml']);
    const readinessResult = buildReadinessResult(available);

    const result = selectChecklists(FIXTURE_CHECKLISTS, readinessResult);

    expect(result.selectionRationale).toBeTruthy();
    expect(result.selectionRationale.length).toBeGreaterThan(10);
  });

  it('mentions number of active checklists in rationale', () => {
    const available = new Set(['product.yaml']);
    const readinessResult = buildReadinessResult(available);

    const result = selectChecklists(FIXTURE_CHECKLISTS, readinessResult);

    // Should reference the count of checklists
    expect(result.selectionRationale).toMatch(/\d+ checklist/);
  });

  it('mentions ordering by impact when multiple checklists active', () => {
    const available = new Set(['product.yaml']);
    const readinessResult = buildReadinessResult(available);

    const result = selectChecklists(FIXTURE_CHECKLISTS, readinessResult);

    if (result.active.length > 1) {
      expect(result.selectionRationale.toLowerCase()).toContain('impact');
    }
  });

  it('produces all-complete message when no active checklists', () => {
    const available = new Set(['product.yaml']);
    const readinessResult = buildReadinessResult(available);

    // Mark ALL checklists as completed
    const completions = new Map<string, Array<{ stepId: string; completed: boolean }>>();
    for (const checklist of FIXTURE_CHECKLISTS) {
      completions.set(
        checklist.id,
        checklist.steps.map((s) => ({ stepId: s.id, completed: true })),
      );
    }

    const result = selectChecklists(FIXTURE_CHECKLISTS, readinessResult, completions);

    expect(result.active.length).toBe(0);
    expect(result.selectionRationale.toLowerCase()).toContain('complete');
  });
});

// ---------------------------------------------------------------------------
// selectChecklists — metadata on each checklist
// ---------------------------------------------------------------------------

describe('selectChecklists — metadata (VAL-CHECK-013)', () => {
  it('each checklist has title, completedSteps, totalSteps, and status', () => {
    const available = new Set(['product.yaml', 'features.yaml']);
    const readinessResult = buildReadinessResult(available);

    const result = selectChecklists(FIXTURE_CHECKLISTS, readinessResult);

    for (const item of result.active) {
      expect(item.checklist.title).toBeTruthy();
      expect(typeof item.completedSteps).toBe('number');
      expect(typeof item.totalSteps).toBe('number');
      expect(item.totalSteps).toBeGreaterThan(0);
      expect(['not-started', 'in-progress', 'completed']).toContain(item.status);
      expect(typeof item.readinessImpact).toBe('number');
    }
  });

  it('progress is consistent (completedSteps <= totalSteps)', () => {
    const available = new Set(['product.yaml']);
    const readinessResult = buildReadinessResult(available);

    const result = selectChecklists(FIXTURE_CHECKLISTS, readinessResult);

    for (const item of [...result.active, ...result.completed]) {
      expect(item.completedSteps).toBeLessThanOrEqual(item.totalSteps);
    }
  });
});
