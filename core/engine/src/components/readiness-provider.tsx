'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { ReadinessResult, AreaBreakdown } from '@/lib/readiness';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ReadinessContextValue {
  /** Current readiness score (0–100) */
  readonly score: number;
  /** Per-area breakdown */
  readonly breakdown: ReadonlyArray<AreaBreakdown>;
  /** Total plays in the registry */
  readonly totalPlays: number;
  /** Plays whose preconditions are met */
  readonly runnablePlays: number;
  /** Last git hash used for this computation */
  readonly lastGitHash: string | null;
  /** Whether the readiness data is currently loading */
  readonly loading: boolean;
  /** Error message if fetch failed */
  readonly error: string | null;
  /** Trigger a manual refresh of the readiness data */
  readonly refresh: () => void;
}

/**
 * Global event fired when the readiness score may have changed (e.g.
 * after a play execution completes). The `ReadinessProvider` listens
 * for it and refetches `/api/readiness` so the mini-gauge and large
 * gauge both update without waiting for the next poll (VAL-CROSS-010).
 */
export const READINESS_REFRESH_EVENT = 'mdb:readiness-invalidated';

/** Fire the readiness-refresh event. Safe to call from any client-side
 *  code path. Does nothing when `window` is unavailable (SSR / tests
 *  without a DOM). */
export function invalidateReadiness(): void {
  if (typeof window === 'undefined') return;
  try {
    window.dispatchEvent(new Event(READINESS_REFRESH_EVENT));
  } catch {
    /* non-DOM test env — ignore */
  }
}

const DEFAULT_CONTEXT: ReadinessContextValue = {
  score: 0,
  breakdown: [],
  totalPlays: 0,
  runnablePlays: 0,
  lastGitHash: null,
  loading: true,
  error: null,
  refresh: () => {},
};

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const ReadinessContext = createContext<ReadinessContextValue>(DEFAULT_CONTEXT);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

interface ReadinessProviderProps {
  readonly children: ReactNode;
  /** Optional polling interval in ms. Set to 0 to disable polling. Default: 30000 (30s) */
  readonly pollInterval?: number;
}

/**
 * Provides readiness score data to all child components.
 *
 * Fetches from /api/readiness on mount and optionally polls at a configurable interval.
 * The mini-gauge in the top bar and the large gauge on Checklists both consume this context,
 * ensuring the score is always consistent across all views (VAL-CHECK-003).
 */
export function ReadinessProvider({ children, pollInterval = 30000 }: ReadinessProviderProps) {
  const [score, setScore] = useState(0);
  const [breakdown, setBreakdown] = useState<ReadonlyArray<AreaBreakdown>>([]);
  const [totalPlays, setTotalPlays] = useState(0);
  const [runnablePlays, setRunnablePlays] = useState(0);
  const [lastGitHash, setLastGitHash] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReadiness = useCallback(async () => {
    try {
      const res = await fetch('/api/readiness');
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data = (await res.json()) as ReadinessResult;

      setScore(data.score);
      setBreakdown(data.breakdown);
      setTotalPlays(data.totalPlays);
      setRunnablePlays(data.runnablePlays);
      setLastGitHash(data.lastGitHash);
      setError(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    void fetchReadiness();
  }, [fetchReadiness]);

  // Polling
  useEffect(() => {
    if (pollInterval <= 0) return;

    const timer = setInterval(() => {
      void fetchReadiness();
    }, pollInterval);

    return () => clearInterval(timer);
  }, [fetchReadiness, pollInterval]);

  // Event-driven refresh — when a play completes (or other code signals
  // that readiness may have changed), refetch immediately so the
  // mini-gauge AND the large gauge on Checklists reflect the update
  // without waiting for the next poll tick (VAL-CROSS-010).
  //
  // Emitters dispatch a `mdb:readiness-invalidated` CustomEvent on
  // `window`. Multiple listeners are safe — every provider instance in
  // the tree picks up the signal.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handler = (): void => {
      void fetchReadiness();
    };
    window.addEventListener(READINESS_REFRESH_EVENT, handler);
    return () => {
      window.removeEventListener(READINESS_REFRESH_EVENT, handler);
    };
  }, [fetchReadiness]);

  const value: ReadinessContextValue = {
    score,
    breakdown,
    totalPlays,
    runnablePlays,
    lastGitHash,
    loading,
    error,
    refresh: fetchReadiness,
  };

  return <ReadinessContext.Provider value={value}>{children}</ReadinessContext.Provider>;
}

/**
 * Hook to access readiness data from any component.
 * Must be used within a ReadinessProvider.
 */
export function useReadiness(): ReadinessContextValue {
  return useContext(ReadinessContext);
}
