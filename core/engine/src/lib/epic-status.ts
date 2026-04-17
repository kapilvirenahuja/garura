/**
 * Garura Flight Deck — Epic Discovery and Status Inference
 *
 * Discovers active epics by scanning git branches matching the epic branch
 * naming convention (`feat/e<N>-<slug>`), infers each epic's current stage
 * from artifact presence plus STM evidence, and scans the STM evidence
 * directory for play execution history, quality-check runs, and validation
 * results. Handles the "no matching branches" case gracefully with an empty
 * result (no crash, no error UI).
 *
 * Fulfills:
 *   VAL-FLIGHT-001  Epic Discovery from Branches
 *   VAL-FLIGHT-002  Stage Inference
 *   VAL-FLIGHT-003  STM Evidence Scanning
 *   VAL-FLIGHT-004  No Branch Graceful (empty state)
 */

import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';
import { createGitIntegration } from './git-integration';
import { checkArtifacts } from './readiness';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Lifecycle stage of an epic, inferred from artifacts + STM evidence. */
export type EpicStage = 'Planning' | 'Designing' | 'Preparing' | 'Implementation' | 'Validation';

/** A single git commit snapshot attached to an epic's branch. */
export interface EpicCommit {
  readonly hash: string;
  readonly author: string;
  readonly timestamp: string;
  readonly message: string;
}

/** A single play run recovered from STM evidence. */
export interface PlayRun {
  readonly name: string;
  readonly status: string;
  readonly timestamp?: string;
  /** Wall-clock duration of the play run, in seconds. Omitted when unknown. */
  readonly durationSeconds?: number;
}

/** A single quality-check evidence entry recovered from STM. */
export interface QualityCheckEvidence {
  readonly status: string;
  readonly timestamp?: string;
  readonly issues: readonly string[];
}

/** A single validation-result evidence entry recovered from STM. */
export interface ValidationResultEvidence {
  readonly status: string;
  readonly timestamp?: string;
  readonly scenariosPassed?: number;
  readonly scenariosFailed?: number;
}

/** Aggregated STM evidence attached to an epic. */
export interface StmEvidenceSummary {
  readonly playHistory: readonly PlayRun[];
  readonly qualityChecks: readonly QualityCheckEvidence[];
  readonly validationResults: readonly ValidationResultEvidence[];
  /** Resolved directory path of the epic's STM folder, or null when absent. */
  readonly stmPath: string | null;
}

/** Parsed identity of an epic branch. */
export interface EpicBranchRef {
  readonly id: string; // e.g. "E1"
  readonly slug: string; // e.g. "auth" (may be empty)
  readonly branchName: string; // branch short name without remote prefix
}

/** Discovered epic as presented to the Flight Deck. */
export interface EpicInfo {
  readonly id: string;
  readonly slug: string;
  readonly branchName: string;
  readonly hash: string;
  readonly stage: EpicStage;
  readonly developer: string | null;
  readonly lastCommit: EpicCommit | null;
  readonly branchCommits: number;
  readonly artifactsPresent: readonly string[];
  readonly stmEvidence: StmEvidenceSummary;
}

/** Top-level result of epic discovery. */
export interface EpicDiscoveryResult {
  readonly epics: readonly EpicInfo[];
  readonly empty: boolean;
  readonly error: string | null;
}

/** Options for discoverEpics. */
export interface DiscoverEpicsOptions {
  /** Absolute path to the target repository. */
  readonly repoPath: string;
  /** Absolute path to the product artifacts directory (e.g. `<repo>/.garura/product`). */
  readonly productBasePath: string;
  /** Absolute path to the STM base directory (e.g. `<repo>/.garura/project/issues`). */
  readonly stmBasePath: string;
}

// ---------------------------------------------------------------------------
// Branch parsing
// ---------------------------------------------------------------------------

// Match `feat/e<N>[-<slug>]`, case-insensitive on the `e` prefix.
// Allows the slug to contain letters, digits, dots, hyphens, underscores, or
// slashes. Does not allow a lone `feat/eventing` to match (requires either a
// digit immediately after `e`, or nothing at all).
const EPIC_BRANCH_RE = /^feat\/e(\d+)(?:-(.+))?$/i;

/**
 * Strip optional `remotes/{remote}/` prefix from a branch name so both local
 * and tracked remote branches resolve to the same canonical form.
 */
function stripRemotePrefix(branchName: string): string {
  const remoteMatch = /^remotes\/[^/]+\/(.+)$/.exec(branchName);
  return remoteMatch ? remoteMatch[1]! : branchName;
}

/**
 * Parse a git branch name into an {@link EpicBranchRef}, or return `null`
 * when the branch is not an epic branch.
 */
export function parseEpicBranch(branchName: string): EpicBranchRef | null {
  if (!branchName || branchName.trim().length === 0) return null;
  const canonical = stripRemotePrefix(branchName.trim());
  const match = EPIC_BRANCH_RE.exec(canonical);
  if (!match) return null;

  const number = match[1]!;
  const slug = (match[2] ?? '').trim();
  return {
    id: `E${number}`,
    slug,
    branchName: canonical,
  };
}

// ---------------------------------------------------------------------------
// Stage inference
// ---------------------------------------------------------------------------

export interface InferStageInput {
  /** Filenames of product-level artifacts that exist and parse (e.g. `"product.yaml"`). */
  readonly artifacts: ReadonlySet<string>;
  /** STM evidence summary for this epic. */
  readonly stmEvidence: StmEvidenceSummary;
  /** Number of commits on the epic branch ahead of the default branch. */
  readonly branchCommits: number;
}

/** Names of plays that indicate implementation work is happening. */
const IMPLEMENTATION_PLAY_NAMES = new Set([
  'implement-epic',
  'play-implement-epic',
  'code-builder',
]);

/**
 * Infer the lifecycle stage of an epic.
 *
 * Priority cascade (highest-weight signal wins):
 *   1. Validation       — STM has any quality-check or validation-result evidence
 *   2. Implementation   — implement-epic play history OR (tech.yaml present AND branch has commits)
 *   3. Preparing        — tech.yaml is present
 *   4. Designing        — features.yaml AND architecture.yaml are present
 *   5. Planning         — default / product.yaml only / no artifacts yet
 */
export function inferStage(input: InferStageInput): EpicStage {
  const { artifacts, stmEvidence, branchCommits } = input;

  if (stmEvidence.qualityChecks.length > 0 || stmEvidence.validationResults.length > 0) {
    return 'Validation';
  }

  const hasImplementationPlay = stmEvidence.playHistory.some((p) =>
    IMPLEMENTATION_PLAY_NAMES.has(p.name),
  );
  if (hasImplementationPlay) return 'Implementation';

  if (artifacts.has('tech.yaml')) {
    if (branchCommits > 0) return 'Implementation';
    return 'Preparing';
  }

  if (artifacts.has('features.yaml') && artifacts.has('architecture.yaml')) {
    return 'Designing';
  }

  return 'Planning';
}

// ---------------------------------------------------------------------------
// STM evidence scanning
// ---------------------------------------------------------------------------

/**
 * Candidate directory names to try, in order, when resolving the STM folder
 * for a given epic. The first existing directory wins.
 */
function stmCandidateDirectories(epicId: string, slug?: string): string[] {
  const candidates = new Set<string>();
  candidates.add(epicId); // "E1"
  candidates.add(epicId.toLowerCase()); // "e1"
  if (slug && slug.length > 0) {
    const slugLower = slug.toLowerCase();
    candidates.add(`${epicId}-${slug}`); // "E1-auth"
    candidates.add(`${epicId.toLowerCase()}-${slugLower}`); // "e1-auth"
  }
  return Array.from(candidates);
}

/** Walk a directory recursively, returning absolute paths to YAML files. */
function walkYamlFiles(dirPath: string): string[] {
  const results: string[] = [];
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dirPath, { withFileTypes: true });
  } catch {
    return results;
  }
  for (const entry of entries) {
    const full = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkYamlFiles(full));
    } else if (entry.isFile() && /\.(ya?ml)$/i.test(entry.name)) {
      results.push(full);
    }
  }
  return results;
}

/** Classify an STM evidence file by its path/filename. */
function classifyEvidenceFile(
  absoluteFilePath: string,
  epicRootPath: string,
): 'quality' | 'validation' | 'play' {
  // Path-relative classification covers both flat and nested layouts:
  //   <epic>/quality-check.yaml          (flat)
  //   <epic>/quality-check/run-01.yaml   (nested)
  //   <epic>/validation/result.yaml      (nested)
  const relative = path.relative(epicRootPath, absoluteFilePath).toLowerCase();
  if (/(^|[\\/])quality/.test(relative)) return 'quality';
  if (/(^|[\\/])valid/.test(relative)) return 'validation';
  return 'play';
}

/** Safely parse a YAML file, returning `null` on any parse/read failure. */
function safeLoadYaml(filePath: string): Record<string, unknown> | null {
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    if (raw.trim().length === 0) return null;
    const parsed = yaml.load(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed as Record<string, unknown>;
  } catch {
    // Malformed YAML / unreadable file → skip gracefully.
    return null;
  }
}

function asString(val: unknown, fallback = ''): string {
  if (typeof val === 'string') return val;
  if (val === null || val === undefined) return fallback;
  return String(val);
}

function asNumber(val: unknown): number | undefined {
  return typeof val === 'number' && Number.isFinite(val) ? val : undefined;
}

function asStringArray(val: unknown): string[] {
  if (!Array.isArray(val)) return [];
  return val.filter((v): v is string => typeof v === 'string');
}

/**
 * Derive a play name from an evidence file.
 *
 * Prefers an explicit `play` or `name` field inside the YAML; falls back to
 * the filename stem (e.g. `play-prepare-epic.yaml` → `play-prepare-epic`).
 */
function derivePlayName(filePath: string, parsed: Record<string, unknown> | null): string {
  if (parsed) {
    const explicit = parsed['play'] ?? parsed['name'];
    if (typeof explicit === 'string' && explicit.trim().length > 0) return explicit.trim();
  }
  const stem = path.basename(filePath).replace(/\.(ya?ml)$/i, '');
  return stem;
}

/**
 * Scan an STM base path for evidence attached to a specific epic.
 *
 * - Resolves the epic's STM folder using id/slug candidate names.
 * - Recursively walks YAML files under the folder.
 * - Classifies each evidence file into play history, quality checks, or
 *   validation results based on path/filename heuristics.
 * - Silently skips malformed / unreadable files.
 *
 * Fulfills: VAL-FLIGHT-003
 */
export function scanStmEvidence(
  stmBasePath: string,
  epicId: string,
  slug?: string,
): StmEvidenceSummary {
  const empty: StmEvidenceSummary = {
    playHistory: [],
    qualityChecks: [],
    validationResults: [],
    stmPath: null,
  };

  // STM base path must exist and be a directory.
  try {
    const stat = fs.statSync(stmBasePath);
    if (!stat.isDirectory()) return empty;
  } catch {
    return empty;
  }

  // Resolve the epic's STM directory.
  //
  // We enumerate the base directory's entries and match case-insensitively
  // against our candidate names. This ensures that on case-insensitive
  // filesystems (macOS default) we still return the *actual* on-disk name of
  // the directory, not the candidate casing we probed with.
  let epicDir: string | null = null;
  let baseEntries: string[] = [];
  try {
    baseEntries = fs.readdirSync(stmBasePath);
  } catch {
    return empty;
  }
  const candidates = stmCandidateDirectories(epicId, slug);
  // Preserve candidate priority — first match wins.
  const entriesByLower = new Map<string, string>();
  for (const entry of baseEntries) {
    entriesByLower.set(entry.toLowerCase(), entry);
  }
  for (const candidate of candidates) {
    const actual = entriesByLower.get(candidate.toLowerCase());
    if (!actual) continue;
    const full = path.join(stmBasePath, actual);
    try {
      if (fs.statSync(full).isDirectory()) {
        epicDir = full;
        break;
      }
    } catch {
      // Skip — entry disappeared or inaccessible
    }
  }
  if (epicDir === null) return empty;

  const playHistory: PlayRun[] = [];
  const qualityChecks: QualityCheckEvidence[] = [];
  const validationResults: ValidationResultEvidence[] = [];

  const yamlFiles = walkYamlFiles(epicDir);
  for (const file of yamlFiles) {
    const parsed = safeLoadYaml(file);
    const kind = classifyEvidenceFile(file, epicDir);

    if (kind === 'quality') {
      if (parsed === null) continue; // malformed → skip
      qualityChecks.push({
        status: asString(parsed['status'], 'unknown'),
        timestamp: asString(parsed['timestamp']) || undefined,
        issues: asStringArray(parsed['issues']),
      });
      continue;
    }

    if (kind === 'validation') {
      if (parsed === null) continue;
      validationResults.push({
        status: asString(parsed['status'], 'unknown'),
        timestamp: asString(parsed['timestamp']) || undefined,
        scenariosPassed:
          asNumber(parsed['scenariosPassed']) ?? asNumber(parsed['scenarios_passed']),
        scenariosFailed:
          asNumber(parsed['scenariosFailed']) ?? asNumber(parsed['scenarios_failed']),
      });
      continue;
    }

    // Play history: accept even when YAML is missing fields, but skip if the
    // file couldn't be parsed at all (corrupt).
    if (parsed === null) continue;
    playHistory.push({
      name: derivePlayName(file, parsed),
      status: asString(parsed['status'], 'unknown'),
      timestamp: asString(parsed['timestamp']) || undefined,
      durationSeconds:
        asNumber(parsed['durationSeconds']) ??
        asNumber(parsed['duration_seconds']) ??
        asNumber(parsed['duration']),
    });
  }

  return {
    playHistory,
    qualityChecks,
    validationResults,
    stmPath: epicDir,
  };
}

// ---------------------------------------------------------------------------
// Epic discovery orchestrator
// ---------------------------------------------------------------------------

/**
 * Discover active epics in a repository and infer each epic's stage.
 *
 * @param options See {@link DiscoverEpicsOptions}
 * @returns {@link EpicDiscoveryResult} — never throws; errors are surfaced on
 *          the `error` field and `epics` is an empty array in that case.
 *
 * Fulfills: VAL-FLIGHT-001, VAL-FLIGHT-002, VAL-FLIGHT-003, VAL-FLIGHT-004
 */
export async function discoverEpics(options: DiscoverEpicsOptions): Promise<EpicDiscoveryResult> {
  const { repoPath, productBasePath, stmBasePath } = options;

  const git = createGitIntegration(repoPath);

  const branchResult = await git.listBranches();
  if (!branchResult.ok) {
    return { epics: [], empty: true, error: branchResult.error };
  }

  // Group branches by canonical (remote-stripped) name so a local branch and
  // its tracked remote counterpart collapse into a single epic entry.
  const epicCandidates = new Map<
    string,
    { ref: EpicBranchRef; hash: string; branchNames: string[] }
  >();
  for (const branch of branchResult.branches) {
    const ref = parseEpicBranch(branch.name);
    if (!ref) continue;
    const key = ref.id; // dedup by epic id
    const existing = epicCandidates.get(key);
    if (existing) {
      existing.branchNames.push(branch.name);
      continue;
    }
    epicCandidates.set(key, {
      ref,
      hash: branch.hash,
      branchNames: [branch.name],
    });
  }

  if (epicCandidates.size === 0) {
    return { epics: [], empty: true, error: null };
  }

  // Read product-level artifacts once — they drive stage inference for all
  // epics (stage is epic-specific via STM evidence + branch commits).
  const artifactsPresent = checkArtifacts(productBasePath);
  const artifactsList = Array.from(artifactsPresent).sort();

  const epics: EpicInfo[] = [];
  for (const { ref, hash } of epicCandidates.values()) {
    // Recover commit history from the epic's branch (newest first).
    const historyResult = await git.getCommitHistory(50, ref.branchName);
    const commits = historyResult.ok ? historyResult.commits : [];

    const lastCommit: EpicCommit | null = commits[0]
      ? {
          hash: commits[0].hash,
          author: commits[0].author,
          timestamp: commits[0].timestamp,
          message: commits[0].message,
        }
      : null;

    const developer = lastCommit?.author ?? null;
    const branchCommits = commits.length;

    const stmEvidence = scanStmEvidence(stmBasePath, ref.id, ref.slug);

    const stage = inferStage({
      artifacts: artifactsPresent,
      stmEvidence,
      branchCommits,
    });

    epics.push({
      id: ref.id,
      slug: ref.slug,
      branchName: ref.branchName,
      hash,
      stage,
      developer,
      lastCommit,
      branchCommits,
      artifactsPresent: artifactsList,
      stmEvidence,
    });
  }

  // Stable ordering: by numeric epic id ascending (E1, E2, E10, …).
  epics.sort((a, b) => {
    const an = Number.parseInt(a.id.slice(1), 10);
    const bn = Number.parseInt(b.id.slice(1), 10);
    return an - bn;
  });

  return { epics, empty: epics.length === 0, error: null };
}
