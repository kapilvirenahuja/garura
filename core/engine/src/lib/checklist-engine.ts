/**
 * Garura Checklist Engine
 *
 * Selects, orders, and manages checklists for the mid-project view.
 * Active checklists are ordered by their impact on the readiness score —
 * the checklist whose completion would most increase readiness appears first.
 * Completed checklists are separated and displayed at the bottom.
 *
 * Fulfills: VAL-CHECK-012 (multiple checklists displayed),
 *           VAL-CHECK-015 (completed at bottom),
 *           VAL-CHECK-016 (ordered by impact)
 */

import type { ChecklistDefinition } from './checklist-loader';
import type { ReadinessArea, PlayDefinition, ReadinessResult } from './readiness';
import { PLAY_REGISTRY } from './readiness';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Status of a checklist overall */
export type ChecklistStatus = 'not-started' | 'in-progress' | 'completed';

/** Step completion state for a single step */
export interface StepCompletionState {
  readonly stepId: string;
  readonly completed: boolean;
}

/** A checklist with computed status and ordering metadata */
export interface ChecklistWithMeta {
  readonly checklist: ChecklistDefinition;
  readonly status: ChecklistStatus;
  readonly completedSteps: number;
  readonly totalSteps: number;
  /** Estimated impact on readiness score (0–100 scale) if this checklist is completed */
  readonly readinessImpact: number;
}

/** Result of selecting checklists for the current project state */
export interface ChecklistSelectionResult {
  /** Active checklists ordered by readiness impact (highest first) */
  readonly active: ReadonlyArray<ChecklistWithMeta>;
  /** Completed checklists (collapsed at bottom) */
  readonly completed: ReadonlyArray<ChecklistWithMeta>;
  /** Explanation text for the generative region */
  readonly selectionRationale: string;
}

// ---------------------------------------------------------------------------
// Checklist-to-area mapping
//
// Maps checklist categories/IDs to the readiness areas they most impact.
// ---------------------------------------------------------------------------

const CHECKLIST_AREA_MAP: Record<string, ReadonlyArray<ReadinessArea>> = {
  'greenfield-onboarding': ['Product', 'Features', 'Roadmap'],
  'brownfield-onboarding': ['Product', 'Architecture', 'Epics'],
  'prepare-epic': ['Architecture', 'Epics'],
};

// ---------------------------------------------------------------------------
// Impact computation
// ---------------------------------------------------------------------------

/**
 * Compute the readiness impact of completing a checklist.
 *
 * Impact = the number of additional plays that would become runnable if all
 * artifacts in the checklist's target areas were present, relative to total plays.
 * Higher impact means completing this checklist would increase readiness the most.
 *
 * @param checklistId - ID of the checklist
 * @param availableArtifacts - Currently available artifacts
 * @param plays - Play registry to evaluate against
 * @returns Impact score 0–100
 */
export function computeChecklistImpact(
  checklistId: string,
  availableArtifacts: Set<string>,
  plays: ReadonlyArray<PlayDefinition> = PLAY_REGISTRY,
): number {
  const targetAreas = CHECKLIST_AREA_MAP[checklistId];
  if (!targetAreas || targetAreas.length === 0) {
    return 0;
  }

  // Collect all unique preconditions from plays in the target areas
  const targetPreconditions = new Set<string>();
  const areaPlays = plays.filter((p) => targetAreas.includes(p.area));

  for (const play of areaPlays) {
    for (const precondition of play.preconditions) {
      targetPreconditions.add(precondition);
    }
  }

  // Simulate having all those artifacts available
  const simulatedArtifacts = new Set(availableArtifacts);
  for (const precondition of targetPreconditions) {
    simulatedArtifacts.add(precondition);
  }

  // Count additional plays that become runnable
  const currentRunnable = plays.filter((p) =>
    p.preconditions.every((pc) => availableArtifacts.has(pc)),
  ).length;

  const simulatedRunnable = plays.filter((p) =>
    p.preconditions.every((pc) => simulatedArtifacts.has(pc)),
  ).length;

  const totalPlays = plays.length;
  if (totalPlays === 0) return 0;

  const additionalRunnable = simulatedRunnable - currentRunnable;
  return Math.round((additionalRunnable / totalPlays) * 100);
}

// ---------------------------------------------------------------------------
// Checklist selection
// ---------------------------------------------------------------------------

/**
 * Determine the overall status of a checklist based on step completions.
 *
 * @param completedSteps - Number of completed steps
 * @param totalSteps - Total number of steps
 * @returns ChecklistStatus
 */
export function deriveChecklistStatus(completedSteps: number, totalSteps: number): ChecklistStatus {
  if (totalSteps === 0) return 'completed';
  if (completedSteps >= totalSteps) return 'completed';
  if (completedSteps > 0) return 'in-progress';
  return 'not-started';
}

/**
 * Select and order checklists for the current project state.
 *
 * In mid-project state (readiness > 0):
 * - All non-greenfield checklists with impact > 0 are shown
 * - Active checklists ordered by readiness impact (highest first)
 * - Completed checklists separated to the bottom
 * - A selection rationale explains why these checklists are relevant
 *
 * @param allChecklists - All available checklist definitions
 * @param readinessResult - Current readiness computation result
 * @param stepCompletions - Map of checklist ID → array of step completion states
 * @returns ChecklistSelectionResult
 */
export function selectChecklists(
  allChecklists: ReadonlyArray<ChecklistDefinition>,
  readinessResult: ReadinessResult,
  stepCompletions: ReadonlyMap<string, ReadonlyArray<StepCompletionState>> = new Map(),
): ChecklistSelectionResult {
  const availableArtifacts = new Set<string>();

  // Reconstruct available artifacts from play readiness data
  for (const play of readinessResult.plays) {
    for (const satisfied of play.satisfiedPreconditions) {
      availableArtifacts.add(satisfied);
    }
  }

  // Build metadata for each checklist
  const checklistsWithMeta: ChecklistWithMeta[] = allChecklists.map((checklist) => {
    const stepStates = stepCompletions.get(checklist.id) ?? [];
    const completedSteps = stepStates.filter((s) => s.completed).length;
    const totalSteps = checklist.steps.length;
    const status = deriveChecklistStatus(completedSteps, totalSteps);
    const readinessImpact = computeChecklistImpact(checklist.id, availableArtifacts);

    return {
      checklist,
      status,
      completedSteps,
      totalSteps,
      readinessImpact,
    };
  });

  // Separate active vs completed
  const active = checklistsWithMeta
    .filter((c) => c.status !== 'completed')
    .sort((a, b) => b.readinessImpact - a.readinessImpact);

  const completed = checklistsWithMeta.filter((c) => c.status === 'completed');

  // Generate selection rationale
  const selectionRationale = generateRationale(active, readinessResult);

  return { active, completed, selectionRationale };
}

// ---------------------------------------------------------------------------
// Rationale generation
// ---------------------------------------------------------------------------

/**
 * Generate a human-readable explanation for why these checklists are selected
 * and in what order.
 *
 * @param active - Active checklists ordered by impact
 * @param readinessResult - Current readiness result
 * @returns Rationale text
 */
function generateRationale(
  active: ReadonlyArray<ChecklistWithMeta>,
  readinessResult: ReadinessResult,
): string {
  if (active.length === 0) {
    return 'All checklists are complete — your project is fully instrumented.';
  }

  const missingAreas = readinessResult.breakdown
    .filter((b) => b.status === 'missing')
    .map((b) => b.area);

  const inProgressAreas = readinessResult.breakdown
    .filter((b) => b.status === 'in-progress')
    .map((b) => b.area);

  const parts: string[] = [];

  parts.push(
    `${active.length} checklist${active.length !== 1 ? 's are' : ' is'} relevant to your project right now.`,
  );

  if (active.length > 1) {
    parts.push('Ordered by impact on readiness.');
  }

  if (missingAreas.length > 0) {
    parts.push(
      `${missingAreas.join(' and ')} ${missingAreas.length === 1 ? 'needs' : 'need'} attention.`,
    );
  }

  if (inProgressAreas.length > 0 && missingAreas.length === 0) {
    parts.push(
      `${inProgressAreas.join(' and ')} ${inProgressAreas.length === 1 ? 'is' : 'are'} in progress — keep going.`,
    );
  }

  return parts.join(' ');
}
