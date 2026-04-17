'use client';

/**
 * Flight Deck Persistence Hook
 *
 * Preserves UI state (scroll position + per-card expansion) across tab
 * switches using `sessionStorage`. In Next.js App Router, navigating away
 * from `/flight-deck` unmounts the page component — without this hook the
 * user would return to the top of a collapsed view after every tab switch.
 *
 * Mechanics:
 *   - On first paint after mount, the scroll position is restored from
 *     `mdb:flight-deck:scroll-y`.
 *   - On unmount, the current `window.scrollY` is persisted.
 *   - Expansion state is exposed as a `Set<string>` (keyed by epic id) with
 *     a toggler; on every change the set is written back to sessionStorage.
 *
 * Fulfills: VAL-FLIGHT-029 (scroll + expansion preserved on tab switch)
 */

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

export const SCROLL_STORAGE_KEY = 'mdb:flight-deck:scroll-y';
export const EXPANSION_STORAGE_KEY = 'mdb:flight-deck:expanded';

function readScroll(): number | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(SCROLL_STORAGE_KEY);
    if (!raw) return null;
    const n = Number.parseInt(raw, 10);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

function writeScroll(value: number): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(SCROLL_STORAGE_KEY, String(Math.max(0, Math.round(value))));
  } catch {
    /* sessionStorage disabled — ignore */
  }
}

function readExpansion(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = window.sessionStorage.getItem(EXPANSION_STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((v): v is string => typeof v === 'string'));
  } catch {
    return new Set();
  }
}

function writeExpansion(set: Set<string>): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(EXPANSION_STORAGE_KEY, JSON.stringify(Array.from(set)));
  } catch {
    /* ignore */
  }
}

export interface FlightDeckPersistence {
  /** Set of expanded epic ids, lazy-initialised from sessionStorage. */
  readonly expanded: Set<string>;
  /** Toggle the expansion of a single epic id (persists to sessionStorage). */
  readonly toggleExpanded: (id: string) => void;
}

/**
 * Restore scroll on mount, persist on unmount, and return an expansion Set +
 * toggler that round-trips through sessionStorage on every change.
 */
export function useFlightDeckPersistence(): FlightDeckPersistence {
  const [expanded, setExpanded] = useState<Set<string>>(() => readExpansion());

  // Ref to the latest expanded set so the unmount cleanup reads fresh data.
  const expandedRef = useRef(expanded);
  useEffect(() => {
    expandedRef.current = expanded;
  }, [expanded]);

  // Restore scroll position on mount. useLayoutEffect so the restore happens
  // before the browser paints, avoiding a visible jump.
  useLayoutEffect(() => {
    const y = readScroll();
    if (y !== null && y > 0 && typeof window !== 'undefined') {
      window.scrollTo({ top: y, left: 0, behavior: 'auto' });
    }
  }, []);

  // Persist scroll on unmount.
  useEffect(() => {
    return () => {
      if (typeof window === 'undefined') return;
      writeScroll(window.scrollY ?? 0);
    };
  }, []);

  const toggleExpanded = useCallback((id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      writeExpansion(next);
      return next;
    });
  }, []);

  return { expanded, toggleExpanded };
}
