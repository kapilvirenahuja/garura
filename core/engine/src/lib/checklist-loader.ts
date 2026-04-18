/**
 * Garura Checklist Loader
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
  readonly execution?: ChecklistStepExecution;
}

/** Optional execution override for a checklist step. */
export interface ChecklistStepExecution {
  readonly runner: 'garura' | 'claude-headless';
  readonly prompt?: string;
}

/**
 * Optional related-epic reference declared on a checklist definition.
 * When present, the Checklists UI renders a clickable chip that navigates
 * to `/playbook?context=<id>` — VAL-CROSS-001, VAL-PLAY-008.
 */
export interface ChecklistRelatedEpic {
  readonly id: string;
  readonly label?: string;
}

/** A complete checklist definition as stored in YAML */
export interface ChecklistDefinition {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly category: string;
  readonly steps: ReadonlyArray<ChecklistStep>;
  /** Optional epic reference that links this checklist to a Playbook context. */
  readonly relatedEpic?: ChecklistRelatedEpic;
}

/** Result of loading a checklist — either success or error */
export type ChecklistLoadResult =
  | { readonly ok: true; readonly checklist: ChecklistDefinition }
  | { readonly ok: false; readonly error: string };

/** Result of loading all built-in checklists (success + errors) */
export interface BuiltInChecklistsResult {
  readonly checklists: ReadonlyArray<ChecklistDefinition>;
  readonly errors: ReadonlyArray<string>;
}

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

/**
 * Resolve the path to the built-in checklists definitions directory.
 *
 * Resolution order:
 *   1. CHECKLIST_DEFS_DIR env var override (explicit user/CI override)
 *   2. Relative to this file's compiled location (__dirname)
 *   3. Relative to process.cwd() (Next.js runs from core/engine/)
 *
 * Logs an error when no valid directory is found.
 */
export function getChecklistsDataDir(): string {
  // 1. Env-var override — highest priority, lets CI / deployment pin the path
  const envDir = process.env.CHECKLIST_DEFS_DIR;
  if (envDir) {
    const resolved = path.resolve(envDir);
    if (fs.existsSync(resolved)) {
      return resolved;
    }
    console.warn(
      `[checklist-loader] CHECKLIST_DEFS_DIR="${envDir}" does not exist — trying fallbacks`,
    );
  }

  // 2. Relative to this file's compiled location
  const fromDirname = path.join(__dirname, '..', 'checklist-defs');
  if (fs.existsSync(fromDirname)) {
    return fromDirname;
  }

  // 3. Relative to process.cwd() (Next.js dev server runs from core/engine/)
  const fromCwd = path.join(process.cwd(), 'src', 'checklist-defs');
  if (fs.existsSync(fromCwd)) {
    return fromCwd;
  }

  // No valid directory found — log error and return the __dirname-based path
  // (will fail gracefully downstream when individual files are loaded)
  console.error(
    '[checklist-loader] No valid checklist definitions directory found. ' +
      'Tried: CHECKLIST_DEFS_DIR env var, __dirname-based path, process.cwd()-based path. ' +
      `Set CHECKLIST_DEFS_DIR to an absolute path containing checklist YAML files.`,
  );
  return fromDirname;
}

// ---------------------------------------------------------------------------
// Built-in checklist IDs
// ---------------------------------------------------------------------------

/** IDs of all built-in checklists shipped with Garura */
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
 * Load all built-in checklists, returning both successes and errors.
 *
 * @returns Object with `checklists` (successful loads) and `errors` (failure messages)
 */
export function getBuiltInChecklists(): BuiltInChecklistsResult {
  const results = loadAllChecklists();
  const checklists: ChecklistDefinition[] = [];
  const errors: string[] = [];

  for (const result of results) {
    if (result.ok) {
      checklists.push(result.checklist);
    } else {
      errors.push(result.error);
    }
  }

  return { checklists, errors };
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
  const { checklists } = getBuiltInChecklists();
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
      ...(() => {
        const execution = normalizeStepExecution((step as Record<string, unknown>).execution);
        return execution ? { execution } : {};
      })(),
    });
  }

  const relatedEpic = normalizeRelatedEpic(raw['relatedEpic']);

  const definition: ChecklistDefinition = {
    id: id as string,
    title: title as string,
    description: description as string,
    category: category as string,
    steps: normalizedSteps,
    ...(relatedEpic ? { relatedEpic } : {}),
  };
  return definition;
}

function normalizeStepExecution(raw: unknown): ChecklistStepExecution | null {
  if (!raw || typeof raw !== 'object') return null;
  const rec = raw as Record<string, unknown>;
  const runner = rec['runner'];
  if (runner !== 'garura' && runner !== 'claude-headless') return null;
  const prompt = typeof rec['prompt'] === 'string' ? rec['prompt'].trim() : '';
  return prompt.length > 0 ? { runner, prompt } : { runner };
}

/**
 * Normalize the optional `relatedEpic` YAML block. Accepts either a bare
 * string (treated as the epic id) or an object `{ id, label? }`. Invalid
 * shapes are silently dropped — the checklist still loads, just without
 * the Playbook chip.
 */
function normalizeRelatedEpic(raw: unknown): ChecklistRelatedEpic | null {
  if (raw == null) return null;
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    return trimmed.length > 0 ? { id: trimmed } : null;
  }
  if (typeof raw === 'object') {
    const rec = raw as Record<string, unknown>;
    const id = typeof rec['id'] === 'string' ? (rec['id'] as string).trim() : '';
    if (id.length === 0) return null;
    const label = typeof rec['label'] === 'string' ? (rec['label'] as string).trim() : '';
    return label.length > 0 ? { id, label } : { id };
  }
  return null;
}
