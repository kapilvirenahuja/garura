/**
 * Flight Deck Aggregator
 *
 * Transforms the raw epic discovery result (from `epic-status.ts`) into the
 * shape the Flight Deck UI consumes:
 *
 *   - summary metric tiles  (epics in flight, active devs, plays today, open issues)
 *   - "Needs Attention"     (epics with failures — expanded cards with diagnostics)
 *   - "On Track"            (compact cards — green for healthy, yellow for stalled)
 *   - "Recent play activity" (cross-epic play log sorted by most recent first)
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
 *   VAL-FLIGHT-018  Play log table columns and rendering data shape
 *   VAL-FLIGHT-019  Play log sorted most-recent first
 *   VAL-FLIGHT-020  Play log status indicators (DONE/FAIL/WARN/RUNNING)
 *   VAL-FLIGHT-021  Play log empty state flag
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

/**
 * Canonical play-log status used by the Flight Deck's "Recent play activity"
 * table. Raw STM status strings (e.g. "success", "failed", "warn") are
 * normalized onto this closed set so the UI can render distinct visual
 * indicators (VAL-FLIGHT-020).
 */
export type PlayLogStatus = 'DONE' | 'FAIL' | 'WARN' | 'RUNNING' | 'UNKNOWN';

/** A single denormalized row in the "Recent play activity" table. */
export interface PlayLogEntry {
  /** Stable id: `${epicId}|${playName}|${timestamp ?? index}`. */
  readonly id: string;
  /** Epic id this play was run under (e.g. "E1"). */
  readonly epicId: string;
  /** Display name for the epic (e.g. "E1: auth" or "E1" when slug is empty). */
  readonly epicLabel: string;
  /** The play's short name (e.g. "play-quality-check"). */
  readonly playName: string;
  /** ISO timestamp of the play run, or null if unknown. */
  readonly timestamp: string | null;
  /** Human-readable relative time (e.g. "15m ago") anchored to `now`. */
  readonly timeLabel: string;
  /** Canonical status for color coding (VAL-FLIGHT-020). */
  readonly status: PlayLogStatus;
  /** Raw status string as recorded in STM evidence. */
  readonly rawStatus: string;
  /** Duration in seconds, or null if unknown. */
  readonly durationSeconds: number | null;
  /** Formatted duration (e.g. "45s", "2m 30s"), or "—" when unknown. */
  readonly durationLabel: string;
}

/** Top-level data model the Flight Deck page consumes. */
export interface FlightDeckData {
  readonly attention: readonly FlightDeckEpicCard[];
  readonly onTrack: readonly FlightDeckEpicCard[];
  readonly metrics: FlightDeckMetrics;
  readonly playLog: readonly PlayLogEntry[];
  readonly playLogEmpty: boolean;
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
// Play log aggregation
// ---------------------------------------------------------------------------

/**
 * Normalize a raw STM play status token into the canonical {@link PlayLogStatus}.
 *
 * Mapping:
 *   - success / passed / done / complete / completed / ok / ✓   → DONE
 *   - fail / failed / failing / error / errored / ✗             → FAIL
 *   - warn / warning / flaky / partial / ⚠                      → WARN
 *   - running / in_progress / in-progress / pending / queued /
 *     started / active / ◐                                      → RUNNING
 *   - anything else                                              → UNKNOWN
 *
 * Fulfills: VAL-FLIGHT-020
 */
export function normalizePlayStatus(raw: string | undefined | null): PlayLogStatus {
  if (!raw) return 'UNKNOWN';
  const token = raw.toString().toLowerCase().trim();
  if (token.length === 0) return 'UNKNOWN';

  if (
    token === 'done' ||
    token === 'success' ||
    token === 'succeeded' ||
    token === 'passed' ||
    token === 'pass' ||
    token === 'complete' ||
    token === 'completed' ||
    token === 'ok' ||
    token === '✓'
  ) {
    return 'DONE';
  }

  if (
    token === 'fail' ||
    token === 'failed' ||
    token === 'failing' ||
    token === 'error' ||
    token === 'errored' ||
    token === '✗'
  ) {
    return 'FAIL';
  }

  if (
    token === 'warn' ||
    token === 'warning' ||
    token === 'flaky' ||
    token === 'partial' ||
    token === '⚠'
  ) {
    return 'WARN';
  }

  if (
    token === 'running' ||
    token === 'in_progress' ||
    token === 'in-progress' ||
    token === 'in progress' ||
    token === 'pending' ||
    token === 'queued' ||
    token === 'started' ||
    token === 'active' ||
    token === '◐'
  ) {
    return 'RUNNING';
  }

  return 'UNKNOWN';
}

/**
 * Format a duration in seconds as a short human-readable label.
 *
 *   - < 1s      → "<1s"
 *   - < 60s     → "Ns"          (e.g. "45s")
 *   - < 3600s   → "Nm Ss"       (e.g. "2m 30s"), seconds omitted when 0
 *   - >= 3600s  → "Nh Mm"       (e.g. "1h 5m"), minutes omitted when 0
 */
export function formatDuration(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined || !Number.isFinite(seconds) || seconds < 0) {
    return '—';
  }
  if (seconds < 1) return '<1s';
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) {
    const m = Math.floor(seconds / 60);
    const s = Math.round(seconds - m * 60);
    return s === 0 ? `${m}m` : `${m}m ${s}s`;
  }
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds - h * 3600) / 60);
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

/**
 * Build the Flight Deck "Recent play activity" log from discovered epics.
 *
 * Collects every play run across every epic, annotates it with epic context,
 * normalizes its status, and sorts with the most recent entry first. Entries
 * with missing timestamps sort to the bottom so freshly recorded plays
 * dominate the view.
 *
 * Fulfills:
 *   VAL-FLIGHT-018  Table columns (Time, Play, Epic, Status, Duration)
 *   VAL-FLIGHT-019  Sorted most-recent first
 *   VAL-FLIGHT-020  Canonical status values for color coding
 */
export function buildPlayLog(epics: readonly EpicInfo[], now: Date = new Date()): PlayLogEntry[] {
  const entries: PlayLogEntry[] = [];

  for (const epic of epics) {
    const epicLabel = epicDisplayName(epic);

    let index = 0;
    for (const run of epic.stmEvidence.playHistory) {
      const timestamp = run.timestamp ?? null;
      const status = normalizePlayStatus(run.status);
      const durationSeconds =
        typeof run.durationSeconds === 'number' && Number.isFinite(run.durationSeconds)
          ? run.durationSeconds
          : null;
      entries.push({
        id: `${epic.id}|${run.name}|${timestamp ?? `idx-${index}`}`,
        epicId: epic.id,
        epicLabel,
        playName: run.name,
        timestamp,
        timeLabel: formatRelativeTime(timestamp, now),
        status,
        rawStatus: run.status,
        durationSeconds,
        durationLabel: formatDuration(durationSeconds),
      });
      index += 1;
    }
  }

  // Sort most-recent first. Entries without a timestamp sink to the bottom
  // but preserve their insertion order relative to one another.
  entries.sort((a, b) => {
    const at = a.timestamp ? Date.parse(a.timestamp) : NaN;
    const bt = b.timestamp ? Date.parse(b.timestamp) : NaN;
    const aValid = !Number.isNaN(at);
    const bValid = !Number.isNaN(bt);
    if (aValid && bValid) return bt - at;
    if (aValid) return -1;
    if (bValid) return 1;
    return 0;
  });

  return entries;
}

// ---------------------------------------------------------------------------
// Active execution aggregation
// ---------------------------------------------------------------------------

/**
 * Minimal shape of an in-memory play execution record. Mirrors the public
 * fields of `PlayExecutionRecord` in `@/lib/play-executor` without pulling
 * the module-level tracker into the aggregator tests.
 */
export interface ActivePlayExecutionRecord {
  readonly executionId: string;
  readonly playName: string;
  readonly startTime: number;
  readonly status: 'running' | 'complete' | 'error' | 'cancelled' | 'timeout';
}

/**
 * Synthesize {@link PlayLogEntry} rows for every currently-running
 * play execution in the in-memory tracker. These rows surface plays
 * triggered from the Playbook Reader (via wiki tags / CTAs) and
 * plays triggered from Checklists before the STM evidence they
 * eventually write is flushed to disk, so the Flight Deck play log
 * reflects concurrent activity across instruments in real time.
 *
 * Each synthesized row is marked with the canonical `RUNNING` status
 * (VAL-FLIGHT-020) and carries a synthetic `active-<executionId>`
 * epic id — active executions are not epic-bound by design, but the
 * Flight Deck UI still needs a stable row key.
 *
 * Fulfills: VAL-CROSS-020 (concurrent play executions visible in log).
 */
export function buildActivePlayLogEntries(
  records: readonly ActivePlayExecutionRecord[],
  now: Date = new Date(),
): PlayLogEntry[] {
  const entries: PlayLogEntry[] = [];
  for (const r of records) {
    if (r.status !== 'running') continue;
    const timestamp = Number.isFinite(r.startTime) ? new Date(r.startTime).toISOString() : null;
    const durationSeconds =
      timestamp !== null ? Math.max(0, Math.round((now.getTime() - r.startTime) / 1000)) : null;
    entries.push({
      id: `active|${r.executionId}`,
      epicId: 'active',
      epicLabel: 'Active execution',
      playName: r.playName,
      timestamp,
      timeLabel: formatRelativeTime(timestamp, now),
      status: 'RUNNING',
      rawStatus: 'running',
      durationSeconds,
      durationLabel: formatDuration(durationSeconds),
    });
  }
  return entries;
}

/**
 * Merge active execution rows into an existing play log, keeping the
 * most-recent-first ordering. Running executions always sort to the
 * top because they carry the freshest timestamp.
 */
export function mergeActivePlayLog(
  base: readonly PlayLogEntry[],
  active: readonly PlayLogEntry[],
): PlayLogEntry[] {
  const merged = [...active, ...base];
  merged.sort((a, b) => {
    const at = a.timestamp ? Date.parse(a.timestamp) : NaN;
    const bt = b.timestamp ? Date.parse(b.timestamp) : NaN;
    const aValid = !Number.isNaN(at);
    const bValid = !Number.isNaN(bt);
    if (aValid && bValid) return bt - at;
    if (aValid) return -1;
    if (bValid) return 1;
    return 0;
  });
  return merged;
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
  activeRecords: readonly ActivePlayExecutionRecord[] = [],
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
  const baseLog = buildPlayLog(result.epics, now);
  const activeLog = buildActivePlayLogEntries(activeRecords, now);
  const playLog = mergeActivePlayLog(baseLog, activeLog);

  return {
    attention,
    onTrack,
    metrics,
    playLog,
    playLogEmpty: playLog.length === 0,
    empty: result.empty,
    error: result.error,
    lastUpdatedIso: now.toISOString(),
  };
}
