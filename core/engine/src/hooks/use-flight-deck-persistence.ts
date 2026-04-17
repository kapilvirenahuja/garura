'use client';

/**
 * Flight Deck Persistence Hook
 *
 * Preserves UI state (scroll position + per-card expansion) across tab
 * switches using `sessionStorage`. In Next.js App Router, navigating away
 * from `/flight-deck` unmounts the page component — without this hook the
 * user would return to the top of a collapsed view after every tab switch.
 *
 * ## Scroll capture — the tricky part
 *
 * A naïve "save `window.scrollY` on unmount" loses the position because
 * Next.js App Router scrolls to the top of the document BEFORE the old
 * page component unmounts. The concrete in-browser event sequence when the
 * user clicks a `<Link>` while scrolled to y=250 is:
 *
 *   1. `click` event fires on the anchor      (scrollY = 250)
 *   2. Next.js's router handler calls scrollTo(0, 0)  (scroll event, y=0)
 *   3. New route renders, old route unmounts   (scrollY = 0)
 *   4. Cleanup effect reads `window.scrollY`   → writes 0, losing the state
 *
 * The fix: capture scroll at the earliest point in the navigation sequence
 * — the click (or Enter keydown) itself, in the capture phase so it runs
 * before Next.js's navigation handler. We also persist on scroll events
 * (throttled) so the sessionStorage value is always up to date if the user
 * switches tabs via the keyboard or the browser's back/forward controls.
 *
 * Because `window.scrollY` may already be 0 by the time the unmount
 * cleanup runs, we do NOT overwrite sessionStorage on unmount with a
 * zeroed-out value — that would erase the position we carefully captured
 * on click.
 *
 * ## Restore
 *
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

  // Capture scroll at the earliest point in every plausible navigation
  // sequence so we beat Next.js's scroll-to-top reset:
  //
  //   - `click`   — tab, gauge, breadcrumb links; capture phase runs before
  //                 Next.js's router click handler.
  //   - `keydown` — Enter/Space on a focused link; same rationale.
  //   - `scroll`  — while the user is actively reading, keep the stored
  //                 value current (throttled via rAF) so unplanned
  //                 navigations (browser back, middle-click, etc.) also
  //                 land on the right offset.
  //
  // We intentionally do NOT write on unmount: by that point Next.js has
  // already scrolled to 0, and overwriting a captured non-zero value with
  // 0 is exactly the VAL-FLIGHT-029 regression.
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const save = (): void => {
      // Skip the synthetic scroll event that Next.js fires when it jumps
      // to the top mid-navigation — the click/keydown handler already
      // captured the real pre-navigation offset, so don't clobber it.
      const y = window.scrollY;
      if (y <= 0) return;
      writeScroll(y);
    };

    let rafPending = false;
    const onScroll = (): void => {
      if (rafPending) return;
      rafPending = true;
      window.requestAnimationFrame(() => {
        rafPending = false;
        save();
      });
    };

    // Capture phase on click/keydown so we run before Next.js's router
    // handler that schedules the scroll-to-top.
    document.addEventListener('click', save, true);
    document.addEventListener('keydown', save, true);
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      document.removeEventListener('click', save, true);
      document.removeEventListener('keydown', save, true);
      window.removeEventListener('scroll', onScroll);
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
