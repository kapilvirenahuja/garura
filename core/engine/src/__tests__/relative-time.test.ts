/**
 * Tests for relative-time formatting used on the Flight Deck.
 *
 * Fulfills: VAL-FLIGHT-006 (relative time formatting)
 */

import { describe, it, expect } from 'vitest';
import { formatRelativeTime, isToday, isStale } from '@/lib/relative-time';

const NOW = new Date('2025-04-17T12:00:00Z');

describe('formatRelativeTime', () => {
  it('returns "just now" for <60s differences', () => {
    expect(formatRelativeTime('2025-04-17T11:59:30Z', NOW)).toBe('just now');
    expect(formatRelativeTime('2025-04-17T12:00:00Z', NOW)).toBe('just now');
  });

  it('returns minutes for 1–59 minute differences', () => {
    expect(formatRelativeTime('2025-04-17T11:45:00Z', NOW)).toBe('15m ago');
    expect(formatRelativeTime('2025-04-17T11:01:00Z', NOW)).toBe('59m ago');
  });

  it('returns hours for 1–23 hour differences', () => {
    expect(formatRelativeTime('2025-04-17T10:00:00Z', NOW)).toBe('2h ago');
    expect(formatRelativeTime('2025-04-16T13:00:00Z', NOW)).toBe('23h ago');
  });

  it('returns "yesterday" for the prior calendar day', () => {
    // 36 hours earlier → calendar day delta is 2 when crossing a UTC midnight.
    // Prefer a same-time-yesterday reference.
    const nowLocal = new Date(2025, 3, 17, 12, 0, 0); // April 17, 2025 12:00 local
    const yesterday = new Date(2025, 3, 16, 10, 0, 0); // April 16, 2025 10:00 local
    expect(formatRelativeTime(yesterday.toISOString(), nowLocal)).toBe('yesterday');
  });

  it('returns "N days ago" for 2–6 days', () => {
    const nowLocal = new Date(2025, 3, 17, 12, 0, 0);
    const threeDaysAgo = new Date(2025, 3, 14, 12, 0, 0);
    expect(formatRelativeTime(threeDaysAgo.toISOString(), nowLocal)).toBe('3 days ago');
  });

  it('returns a short date for 7+ days old', () => {
    const nowLocal = new Date(2025, 3, 17, 12, 0, 0); // Apr 17
    const oldLocal = new Date(2025, 2, 15, 12, 0, 0); // Mar 15
    expect(formatRelativeTime(oldLocal.toISOString(), nowLocal)).toBe('Mar 15');
  });

  it('returns empty string for invalid input', () => {
    expect(formatRelativeTime('', NOW)).toBe('');
    expect(formatRelativeTime(null, NOW)).toBe('');
    expect(formatRelativeTime(undefined, NOW)).toBe('');
    expect(formatRelativeTime('not-a-date', NOW)).toBe('');
  });

  it('tolerates clock skew (future timestamp → "just now")', () => {
    expect(formatRelativeTime('2025-04-17T13:00:00Z', NOW)).toBe('just now');
  });
});

describe('isToday', () => {
  it('returns true for timestamps on the same calendar day', () => {
    const nowLocal = new Date(2025, 3, 17, 12, 0, 0);
    const morning = new Date(2025, 3, 17, 1, 0, 0);
    const evening = new Date(2025, 3, 17, 23, 45, 0);
    expect(isToday(morning.toISOString(), nowLocal)).toBe(true);
    expect(isToday(evening.toISOString(), nowLocal)).toBe(true);
  });

  it('returns false for timestamps on other days', () => {
    const nowLocal = new Date(2025, 3, 17, 12, 0, 0);
    const yesterday = new Date(2025, 3, 16, 23, 59, 0);
    const tomorrow = new Date(2025, 3, 18, 0, 1, 0);
    expect(isToday(yesterday.toISOString(), nowLocal)).toBe(false);
    expect(isToday(tomorrow.toISOString(), nowLocal)).toBe(false);
  });

  it('returns false for invalid input', () => {
    expect(isToday(null)).toBe(false);
    expect(isToday(undefined)).toBe(false);
    expect(isToday('not-a-date')).toBe(false);
  });
});

describe('isStale', () => {
  const now = new Date('2025-04-17T12:00:00Z');

  it('returns true when older than threshold', () => {
    expect(isStale('2025-04-16T10:00:00Z', 24, now)).toBe(true); // 26h
    expect(isStale('2025-04-10T12:00:00Z', 24, now)).toBe(true);
  });

  it('returns false when within threshold', () => {
    expect(isStale('2025-04-17T00:00:00Z', 24, now)).toBe(false); // 12h
    expect(isStale('2025-04-16T14:00:00Z', 24, now)).toBe(false); // 22h
  });

  it('returns true when no timestamp provided', () => {
    expect(isStale(null, 24, now)).toBe(true);
    expect(isStale(undefined, 24, now)).toBe(true);
  });
});
