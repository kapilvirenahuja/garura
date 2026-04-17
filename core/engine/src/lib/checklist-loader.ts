/**
 * MDB Checklist Loader
 *
 * Loads checklist definitions from YAML data files at runtime.
 * All checklists are stored as declarative data — not hardcoded in components.
 * Play references in every step are validated against the play registry.
 *
 * Fulfills: VAL-CHECK-025 (greenfield checklist exists),
 *           VAL-CHECK-026 (brownfield checklist exists),
 *           VAL-CHECK-027 (prepare-epic checklist exists),
 *           VAL-CHECK-028 (checklists stored as data files),
 *           VAL-CHECK-029 (valid play references)
 */

import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';
import { isValidPlay } from './play-registry';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** A single step in a checklist definition */
export interface ChecklistStep {
  readonly id: string;
  readonly label: string;
  readonly description: string;
  readonly play: string;
}

/** A complete checklist definition as stored in YAML */
export interface ChecklistDefinition {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly category: string;
  readonly steps: ReadonlyArray<ChecklistStep>;
}

/** Result of loading a checklist — either success or error */
export type ChecklistLoadResult =
  | { readonly ok: true; readonly checklist: ChecklistDefinition }
  | { readonly ok: false; readonly error: string };

/** Result of validating play references */
export interface PlayValidationResult {
  readonly valid: boolean;
  readonly invalidReferences: ReadonlyArray<{
    readonly checklistId: string;
    readonly stepId: string;
    readonly playName: string;
  }>;
}

// ---------------------------------------------------------------------------
// Data directory resolution
// ---------------------------------------------------------------------------

/** Resolve the path to the built-in checklists definitions directory */
function getChecklistsDataDir(): string {
  return path.join(__dirname, '..', 'checklist-defs');
}

// ---------------------------------------------------------------------------
// Built-in checklist IDs
// ---------------------------------------------------------------------------

/** IDs of all built-in checklists shipped with MDB */
export const BUILTIN_CHECKLIST_IDS = [
  'greenfield-onboarding',
  'brownfield-onboarding',
  'prepare-epic',
] as const;

export type BuiltinChecklistId = (typeof BUILTIN_CHECKLIST_IDS)[number];

// ---------------------------------------------------------------------------
// Loader functions
// ---------------------------------------------------------------------------

/**
 * Load a single checklist definition from a YAML file.
 *
 * @param filePath - Absolute path to the YAML definition file
 * @returns ChecklistLoadResult with the parsed definition or error
 */
export function loadChecklistFromFile(filePath: string): ChecklistLoadResult {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const parsed = yaml.load(content) as Record<string, unknown>;

    if (!parsed || typeof parsed !== 'object') {
      return { ok: false, error: `Invalid YAML structure in ${filePath}` };
    }

    const checklist = normalizeChecklist(parsed);
    if (!checklist) {
      return { ok: false, error: `Missing required fields in ${filePath}` };
    }

    return { ok: true, checklist };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, error: `Failed to load checklist from ${filePath}: ${message}` };
  }
}

/**
 * Load a built-in checklist by its ID.
 *
 * @param id - Built-in checklist identifier (e.g., 'greenfield-onboarding')
 * @returns ChecklistLoadResult
 */
export function loadChecklist(id: BuiltinChecklistId): ChecklistLoadResult {
  const dataDir = getChecklistsDataDir();
  const filePath = path.join(dataDir, `${id}.yaml`);
  return loadChecklistFromFile(filePath);
}

/**
 * Load all built-in checklists.
 *
 * @returns Array of ChecklistLoadResult for each built-in checklist
 */
export function loadAllChecklists(): ReadonlyArray<ChecklistLoadResult> {
  return BUILTIN_CHECKLIST_IDS.map((id) => loadChecklist(id));
}

/**
 * Load all built-in checklists that loaded successfully.
 *
 * @returns Array of ChecklistDefinition (only successful loads)
 */
export function getBuiltInChecklists(): ReadonlyArray<ChecklistDefinition> {
  return loadAllChecklists()
    .filter((result): result is { ok: true; checklist: ChecklistDefinition } => result.ok)
    .map((result) => result.checklist);
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

/**
 * Validate that all play references in a checklist resolve to known plays.
 *
 * @param checklist - The checklist definition to validate
 * @returns PlayValidationResult with any invalid references
 */
export function validatePlayReferences(checklist: ChecklistDefinition): PlayValidationResult {
  const invalidReferences: Array<{
    checklistId: string;
    stepId: string;
    playName: string;
  }> = [];

  for (const step of checklist.steps) {
    if (!isValidPlay(step.play)) {
      invalidReferences.push({
        checklistId: checklist.id,
        stepId: step.id,
        playName: step.play,
      });
    }
  }

  return {
    valid: invalidReferences.length === 0,
    invalidReferences,
  };
}

/**
 * Validate play references across all built-in checklists.
 *
 * @returns PlayValidationResult aggregating all checklists
 */
export function validateAllPlayReferences(): PlayValidationResult {
  const checklists = getBuiltInChecklists();
  const allInvalid: Array<{
    checklistId: string;
    stepId: string;
    playName: string;
  }> = [];

  for (const checklist of checklists) {
    const result = validatePlayReferences(checklist);
    allInvalid.push(...result.invalidReferences);
  }

  return {
    valid: allInvalid.length === 0,
    invalidReferences: allInvalid,
  };
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Normalize a raw parsed YAML object into a ChecklistDefinition.
 *
 * @returns ChecklistDefinition or null if required fields are missing
 */
function normalizeChecklist(raw: Record<string, unknown>): ChecklistDefinition | null {
  const { id, title, description, category, steps } = raw;

  if (
    typeof id !== 'string' ||
    typeof title !== 'string' ||
    typeof description !== 'string' ||
    typeof category !== 'string' ||
    !Array.isArray(steps)
  ) {
    return null;
  }

  const normalizedSteps: ChecklistStep[] = [];
  for (const step of steps) {
    if (
      typeof step !== 'object' ||
      step === null ||
      typeof (step as Record<string, unknown>).id !== 'string' ||
      typeof (step as Record<string, unknown>).label !== 'string' ||
      typeof (step as Record<string, unknown>).description !== 'string' ||
      typeof (step as Record<string, unknown>).play !== 'string'
    ) {
      return null;
    }
    normalizedSteps.push({
      id: (step as Record<string, unknown>).id as string,
      label: (step as Record<string, unknown>).label as string,
      description: (step as Record<string, unknown>).description as string,
      play: (step as Record<string, unknown>).play as string,
    });
  }

  return {
    id: id as string,
    title: title as string,
    description: description as string,
    category: category as string,
    steps: normalizedSteps,
  };
}
