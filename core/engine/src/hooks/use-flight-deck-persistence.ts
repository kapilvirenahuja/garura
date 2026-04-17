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
 *   - On mount, the saved scroll target is read from
 *     `mdb:flight-deck:scroll-y` and held in a ref. The scroll is NOT
 *     applied immediately because Flight Deck fetches its data
 *     asynchronously — at first paint the DOM contains only the header and
 *     a loading placeholder, which is shorter than the saved scroll target.
 *     Calling `window.scrollTo` against a short page clamps the effective
 *     scroll to 0, which is exactly the regression described in
 *     VAL-FLIGHT-029.
 *   - The hook accepts a `loading` signal from the page. When `loading`
 *     transitions to `false` (data fetched and cards rendered), a
 *     useLayoutEffect applies the pending scroll before the browser paints,
 *     so the user sees the restored position without a visible jump.
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
 * Restore scroll once data has rendered, persist on unmount, and return an
 * expansion Set + toggler that round-trips through sessionStorage on every
 * change.
 *
 * @param loading - The page's current loading state. Scroll restoration is
 *   deferred until this transitions to `false` so the DOM is tall enough
 *   for the browser to honor the target offset.
 */
export function useFlightDeckPersistence(loading: boolean): FlightDeckPersistence {
  const [expanded, setExpanded] = useState<Set<string>>(() => readExpansion());

  // Ref to the latest expanded set so the unmount cleanup reads fresh data.
  const expandedRef = useRef(expanded);
  useEffect(() => {
    expandedRef.current = expanded;
  }, [expanded]);

  // The saved scroll target, captured once on mount and held until we've
  // had a chance to restore it after data has rendered. A mount-time
  // scrollTo is insufficient because the initial DOM is only the loading
  // placeholder — the page is too short and the browser clamps the effective
  // scroll to 0.
  const pendingScrollRef = useRef<number | null>(null);
  // Once the scroll is consumed (restored or discarded because the target
  // was 0), we do not reapply it on subsequent renders. This prevents a
  // `loading = true → false → true → false` flicker (e.g., manual refresh)
  // from snapping the user back to the original position.
  const didConsumeScrollRef = useRef(false);

  // Capture the saved scroll target on mount. We intentionally do NOT call
  // window.scrollTo here — see the comment above.
  useLayoutEffect(() => {
    pendingScrollRef.current = readScroll();
  }, []);

  // When data has rendered (loading transitions to false) and we still
  // have a pending target, apply it. useLayoutEffect so the scroll happens
  // before the browser paints the newly tall DOM — no visible jump.
  useLayoutEffect(() => {
    if (loading) return;
    if (didConsumeScrollRef.current) return;
    const y = pendingScrollRef.current;
    didConsumeScrollRef.current = true;
    pendingScrollRef.current = null;
    if (y !== null && y > 0 && typeof window !== 'undefined') {
      window.scrollTo({ top: y, left: 0, behavior: 'auto' });
    }
  }, [loading]);

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
