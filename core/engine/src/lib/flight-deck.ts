/**
 * Flight Deck Aggregator
 *
 * Transforms the raw epic discovery result (from `epic-status.ts`) into the
 * shape the Flight Deck UI consumes:
 *
 *   - summary metric tiles  (epics in flight, active devs, plays today, open issues)
 *   - "Needs Attention"     (epics with failures — expanded cards with diagnostics)
 *   - "On Track"            (compact cards — green for healthy, yellow for stalled)
 *
 * All values are derived from live discovery data — no hardcoded metrics.
 *
 * Fulfills:
 *   VAL-FLIGHT-005  Developer Mapping
 *   VAL-FLIGHT-007  Last Commit Message (carried onto the card)
 *   VAL-FLIGHT-008  Failed plays surface in Needs Attention
 *   VAL-FLIGHT-009  On Track epics are compact
 *   VAL-FLIGHT-010  Yellow status for stalled epics
 *   VAL-FLIGHT-011  AI (deterministic) diagnostic for attention epics
 *   VAL-FLIGHT-013  Epics In Flight counter
 *   VAL-FLIGHT-014  Active Developers counter
 *   VAL-FLIGHT-015  Plays Today counter
 *   VAL-FLIGHT-016  Open Issues counter
 *   VAL-FLIGHT-017  Metrics derived, not hardcoded
 *   VAL-FLIGHT-022  Required fields on each epic card
 *   VAL-FLIGHT-023  Attention card shows issue references
 *   VAL-FLIGHT-025  Contextual CTA buttons
 */

import type { EpicInfo, EpicDiscoveryResult, PlayRun, QualityCheckEvidence } from './epic-status';
import { formatRelativeTime, isToday, isStale } from './relative-time';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type EpicStatusColor = 'green' | 'yellow' | 'red';
export type FlightDeckCategory = 'attention' | 'on-track';

/** Shape consumed by the Flight Deck UI for a single epic card. */
export interface FlightDeckEpicCard {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly branchName: string;
  readonly stage: string;
  readonly developer: string;
  readonly lastCommitMessage: string;
  readonly lastCommitTimestamp: string | null;
  readonly lastActivityRelative: string;
  readonly statusColor: EpicStatusColor;
  readonly category: FlightDeckCategory;
  /** Short issue references surfaced on the attention card (empty on on-track cards). */
  readonly issues: readonly string[];
  /** Total unresolved issue count (used by attention cards and the Open Issues metric). */
  readonly issueCount: number;
  /** Pre-composed diagnostic sentence for attention cards (empty for on-track). */
  readonly aiDiagnostic: string;
  /** Count of failed quality-check evidence entries. */
  readonly failedQualityChecks: number;
  /** Count of failed plays in the epic's STM evidence. */
  readonly failedPlays: number;
}

/** Summary metric tiles for the Flight Deck. */
export interface FlightDeckMetrics {
  readonly epicsInFlight: number;
  readonly activeDevelopers: number;
  readonly playsToday: number;
  readonly openIssues: number;
}

/** Top-level data model the Flight Deck page consumes. */
export interface FlightDeckData {
  readonly attention: readonly FlightDeckEpicCard[];
  readonly onTrack: readonly FlightDeckEpicCard[];
  readonly metrics: FlightDeckMetrics;
  readonly empty: boolean;
  readonly error: string | null;
  readonly lastUpdatedIso: string;
}

// ---------------------------------------------------------------------------
// Heuristics
// ---------------------------------------------------------------------------

/** Statuses that count as a failed play or a failed quality check. */
const FAILED_STATUS_TOKENS = new Set(['fail', 'failed', 'failing', 'error', 'errored']);

/** Hours without a commit before an on-track epic is considered stalled. */
export const STALE_THRESHOLD_HOURS = 24;

function isFailedStatus(status: string | undefined | null): boolean {
  if (!status) return false;
  return FAILED_STATUS_TOKENS.has(status.toLowerCase().trim());
}

function countFailedPlays(playHistory: readonly PlayRun[]): number {
  return playHistory.filter((p) => isFailedStatus(p.status)).length;
}

function countFailedQualityChecks(qualityChecks: readonly QualityCheckEvidence[]): number {
  // A quality check is a failure when:
  //   - its status is explicitly a failed token, OR
  //   - it carries one or more issues regardless of status label
  return qualityChecks.filter((q) => isFailedStatus(q.status) || q.issues.length > 0).length;
}

/** Gather all issue references across the epic's quality checks. */
function collectIssues(qualityChecks: readonly QualityCheckEvidence[]): string[] {
  const out: string[] = [];
  for (const q of qualityChecks) {
    for (const issue of q.issues) {
      if (typeof issue === 'string' && issue.trim().length > 0) {
        out.push(issue.trim());
      }
    }
  }
  // Preserve order but dedupe — the same issue may appear across evidence files.
  return Array.from(new Set(out));
}

/** Decide the status color for an epic. */
export function deriveStatusColor(
  epic: EpicInfo,
  now: Date,
  staleThresholdHours: number = STALE_THRESHOLD_HOURS,
): EpicStatusColor {
  const failedPlays = countFailedPlays(epic.stmEvidence.playHistory);
  const failedQualityChecks = countFailedQualityChecks(epic.stmEvidence.qualityChecks);
  const failedValidations = epic.stmEvidence.validationResults.filter(
    (v) => isFailedStatus(v.status) || (v.scenariosFailed ?? 0) > 0,
  ).length;

  if (failedPlays > 0 || failedQualityChecks > 0 || failedValidations > 0) {
    return 'red';
  }

  if (isStale(epic.lastCommit?.timestamp ?? null, staleThresholdHours, now)) {
    return 'yellow';
  }

  return 'green';
}

/**
 * Compose a short deterministic diagnostic sentence for an attention epic.
 *
 * This stands in for an LLM-generated summary when no LLM key is configured
 * (AGENTS.md: "If not set, generative features should show a graceful
 * fallback message, not crash."). The sentence still explains the *issue*
 * and the *likely cause* — the two requirements in VAL-FLIGHT-011.
 */
export function composeDiagnostic(epic: EpicInfo): string {
  const failedQC = countFailedQualityChecks(epic.stmEvidence.qualityChecks);
  const failedPlays = countFailedPlays(epic.stmEvidence.playHistory);
  const issues = collectIssues(epic.stmEvidence.qualityChecks);
  const issueSample = issues.slice(0, 3).join(', ');

  const parts: string[] = [];
  const epicLabel = epic.slug ? `${epic.id} (${epic.slug})` : epic.id;

  if (failedQC > 0) {
    parts.push(
      `${epicLabel} has ${failedQC} failing quality check${failedQC === 1 ? '' : 's'}` +
        (issueSample ? `: ${issueSample}.` : '.'),
    );
  } else if (failedPlays > 0) {
    parts.push(
      `${epicLabel} has ${failedPlays} failed play run${failedPlays === 1 ? '' : 's'} in STM.`,
    );
  } else {
    parts.push(`${epicLabel} is flagged for review.`);
  }

  // Likely-cause heuristic — stage drives the phrasing.
  if (failedQC > 0) {
    parts.push('Likely cause: recent implementation work introduced a regression.');
  } else if (failedPlays > 0) {
    parts.push('Likely cause: a play failed to complete — rerun after inspecting its output.');
  } else {
    parts.push('Likely cause: unclassified — open the epic to investigate.');
  }

  return parts.join(' ');
}

// ---------------------------------------------------------------------------
// Card construction
// ---------------------------------------------------------------------------

function epicDisplayName(epic: EpicInfo): string {
  return epic.slug ? `${epic.id}: ${epic.slug}` : epic.id;
}

/** Build a single card from an epic. */
export function buildEpicCard(epic: EpicInfo, now: Date): FlightDeckEpicCard {
  const statusColor = deriveStatusColor(epic, now);
  const category: FlightDeckCategory = statusColor === 'red' ? 'attention' : 'on-track';

  const lastCommit = epic.lastCommit;
  const lastActivityRelative = formatRelativeTime(lastCommit?.timestamp ?? null, now);
  const lastCommitMessage = lastCommit?.message ?? '(no commits yet)';
  const lastCommitTimestamp = lastCommit?.timestamp ?? null;

  const failedPlays = countFailedPlays(epic.stmEvidence.playHistory);
  const failedQualityChecks = countFailedQualityChecks(epic.stmEvidence.qualityChecks);
  const issues = collectIssues(epic.stmEvidence.qualityChecks);
  const issueCount = issues.length;

  const aiDiagnostic = category === 'attention' ? composeDiagnostic(epic) : '';

  return {
    id: epic.id,
    slug: epic.slug,
    name: epicDisplayName(epic),
    branchName: epic.branchName,
    stage: epic.stage,
    developer: epic.developer ?? 'unassigned',
    lastCommitMessage,
    lastCommitTimestamp,
    lastActivityRelative,
    statusColor,
    category,
    issues,
    issueCount,
    aiDiagnostic,
    failedQualityChecks,
    failedPlays,
  };
}

// ---------------------------------------------------------------------------
// Metric computation
// ---------------------------------------------------------------------------

/** Compute summary metrics purely from discovered epic data. */
export function computeMetrics(epics: readonly EpicInfo[], now: Date): FlightDeckMetrics {
  const epicsInFlight = epics.length;

  const devSet = new Set<string>();
  for (const epic of epics) {
    const author = epic.lastCommit?.author?.trim();
    if (author) devSet.add(author);
  }
  const activeDevelopers = devSet.size;

  let playsToday = 0;
  let openIssues = 0;

  for (const epic of epics) {
    for (const play of epic.stmEvidence.playHistory) {
      if (isToday(play.timestamp, now)) playsToday += 1;
    }
    for (const qc of epic.stmEvidence.qualityChecks) {
      openIssues += qc.issues.length;
    }
    for (const v of epic.stmEvidence.validationResults) {
      if ((v.scenariosFailed ?? 0) > 0) {
        openIssues += v.scenariosFailed ?? 0;
      }
    }
  }

  return { epicsInFlight, activeDevelopers, playsToday, openIssues };
}

// ---------------------------------------------------------------------------
// Top-level data builder
// ---------------------------------------------------------------------------

/**
 * Produce the data payload the Flight Deck UI renders.
 *
 * Ordering:
 *   - attention  → sorted by issue count descending then by epic id
 *   - on-track   → green first, yellow (stalled) after; ties broken by id
 *
 * Fulfills: VAL-FLIGHT-033 (spatial hierarchy: attention before on-track)
 */
export function buildFlightDeckData(
  result: EpicDiscoveryResult,
  now: Date = new Date(),
): FlightDeckData {
  const cards = result.epics.map((e) => buildEpicCard(e, now));

  const attention = cards
    .filter((c) => c.category === 'attention')
    .slice()
    .sort((a, b) => b.issueCount - a.issueCount || a.id.localeCompare(b.id));

  const onTrack = cards
    .filter((c) => c.category === 'on-track')
    .slice()
    .sort((a, b) => {
      // green before yellow
      if (a.statusColor !== b.statusColor) {
        if (a.statusColor === 'green') return -1;
        if (b.statusColor === 'green') return 1;
      }
      return a.id.localeCompare(b.id);
    });

  const metrics = computeMetrics(result.epics, now);

  return {
    attention,
    onTrack,
    metrics,
    empty: result.empty,
    error: result.error,
    lastUpdatedIso: now.toISOString(),
  };
}
