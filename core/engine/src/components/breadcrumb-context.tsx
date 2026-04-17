'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { BreadcrumbSegment } from '@/components/breadcrumb';

/**
 * Breadcrumb extension context — lets pages push additional breadcrumb
 * segments below the static instrument segment derived from the URL path.
 *
 * Without this mechanism, breadcrumbs would be limited to the pathname
 * (e.g. "Home › Playbook"). When the Playbook Reader navigates to a
 * specific epic context (`/playbook?context=E1`), the breadcrumb needs to
 * render a trailing "E1: Authentication" segment — but `usePathname()`
 * alone cannot observe query-string changes. Rather than wire
 * `useSearchParams()` through every test harness, pages push their
 * extra segments into this provider and the Breadcrumb reads them.
 *
 * The extras array is ordered; it is appended after the instrument
 * segment. The Breadcrumb handles the "last segment has no href" logic
 * across the combined list so the deepest segment always represents
 * the current location.
 *
 * Fulfills:
 *   VAL-FOUND-010  Breadcrumb updates on navigation (deeper context)
 *   VAL-PLAY-021   Breadcrumb updates on Playbook navigation
 *   VAL-PLAY-022   Breadcrumb segment navigation (clickable parent segments)
 */
export interface BreadcrumbExtrasContextValue {
  readonly extras: ReadonlyArray<BreadcrumbSegment>;
  readonly setExtras: (next: ReadonlyArray<BreadcrumbSegment>) => void;
  readonly clearExtras: () => void;
}

const DEFAULT_VALUE: BreadcrumbExtrasContextValue = {
  extras: [],
  setExtras: () => {
    /* no-op outside a provider */
  },
  clearExtras: () => {
    /* no-op outside a provider */
  },
};

const BreadcrumbExtrasContext = createContext<BreadcrumbExtrasContextValue>(DEFAULT_VALUE);

export interface BreadcrumbExtrasProviderProps {
  children: React.ReactNode;
}

/**
 * Provides the breadcrumb-extras context. Intended to wrap the shell
 * just once (AppShell handles this); nested providers are allowed but
 * only the closest one is consulted.
 */
export function BreadcrumbExtrasProvider({ children }: BreadcrumbExtrasProviderProps) {
  const [extras, setExtrasState] = useState<ReadonlyArray<BreadcrumbSegment>>([]);

  const setExtras = useCallback((next: ReadonlyArray<BreadcrumbSegment>) => {
    setExtrasState(next);
  }, []);

  const clearExtras = useCallback(() => {
    setExtrasState([]);
  }, []);

  const value = useMemo<BreadcrumbExtrasContextValue>(
    () => ({ extras, setExtras, clearExtras }),
    [extras, setExtras, clearExtras],
  );

  return (
    <BreadcrumbExtrasContext.Provider value={value}>{children}</BreadcrumbExtrasContext.Provider>
  );
}

/**
 * Hook for components that need to read or mutate the breadcrumb extras.
 * Outside a provider, returns the no-op default so it is always safe to
 * call.
 */
export function useBreadcrumbExtras(): BreadcrumbExtrasContextValue {
  return useContext(BreadcrumbExtrasContext);
}
