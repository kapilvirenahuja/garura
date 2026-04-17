/**
 * Relative time formatting helper for the Flight Deck.
 *
 * Deterministically converts an ISO-8601 timestamp into a short human-readable
 * string anchored against a `now` reference time:
 *
 *   - 0–59 seconds               → "just now"
 *   - 1–59 minutes               → "Nm ago"
 *   - 1–23 hours                 → "Nh ago"
 *   - prior calendar day         → "yesterday"
 *   - 2–6 days ago               → "N days ago"
 *   - 7+ days ago                → short date (e.g. "Mar 15")
 *   - future timestamps          → "just now" (defensive; clock skew tolerated)
 *   - invalid / missing inputs   → ""
 *
 * Fulfills: VAL-FLIGHT-006 (relative time formatting)
 */

const DAY_MS = 24 * 60 * 60 * 1000;

function sameCalendarDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

const SHORT_MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;

/**
 * Format an ISO-8601 timestamp as a short relative-time string anchored
 * against `now`.
 *
 * @param isoTimestamp - ISO-8601 timestamp string (e.g. `2025-04-17T12:00:00Z`).
 * @param now          - Reference time. Defaults to `new Date()`; accept explicit
 *                       value for deterministic tests.
 */
export function formatRelativeTime(
  isoTimestamp: string | null | undefined,
  now: Date = new Date(),
): string {
  if (!isoTimestamp) return '';
  const parsed = new Date(isoTimestamp);
  if (Number.isNaN(parsed.getTime())) return '';

  const deltaMs = now.getTime() - parsed.getTime();

  // Defensive: future timestamps (clock skew) collapse to "just now".
  if (deltaMs < 0) return 'just now';

  const seconds = Math.floor(deltaMs / 1000);
  if (seconds < 60) return 'just now';

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  // Calendar-day aware comparison for "yesterday".
  const startToday = startOfDay(now);
  const startThen = startOfDay(parsed);
  const dayDelta = Math.round((startToday.getTime() - startThen.getTime()) / DAY_MS);

  if (dayDelta === 1) return 'yesterday';
  if (dayDelta >= 2 && dayDelta <= 6) return `${dayDelta} days ago`;

  return `${SHORT_MONTHS[parsed.getMonth()]} ${parsed.getDate()}`;
}

/**
 * Return true when `isoTimestamp` represents the same calendar date as `now`.
 *
 * Used by the Flight Deck "Plays Today" metric (VAL-FLIGHT-015).
 */
export function isToday(isoTimestamp: string | null | undefined, now: Date = new Date()): boolean {
  if (!isoTimestamp) return false;
  const parsed = new Date(isoTimestamp);
  if (Number.isNaN(parsed.getTime())) return false;
  return sameCalendarDay(parsed, now);
}

/**
 * Return true when `isoTimestamp` is older than `thresholdHours` hours.
 *
 * Used by the Flight Deck stalled-epic check (VAL-FLIGHT-010).
 */
export function isStale(
  isoTimestamp: string | null | undefined,
  thresholdHours: number,
  now: Date = new Date(),
): boolean {
  if (!isoTimestamp) return true; // no activity at all is stalest
  const parsed = new Date(isoTimestamp);
  if (Number.isNaN(parsed.getTime())) return true;
  const deltaMs = now.getTime() - parsed.getTime();
  return deltaMs > thresholdHours * 60 * 60 * 1000;
}
