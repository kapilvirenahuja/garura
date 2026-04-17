'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MetricTile } from '@/components/metric-tile';
import { AttentionCard, OnTrackCard } from '@/components/epic-card';
import type { FlightDeckData } from '@/lib/flight-deck';

/**
 * Flight Deck — attention-priority live execution dashboard.
 *
 * Spatial hierarchy (top → bottom):
 *   1. Summary metric tiles (epics, devs, plays today, open issues)
 *   2. Needs Attention — expanded cards with AI diagnostic + issue refs + CTAs
 *   3. On Track — compact cards (side-by-side on wide viewports, stacked on narrow)
 *
 * All data derives from `/api/flight-deck` which reads git branches + STM
 * evidence live. No hardcoded values.
 *
 * Fulfills:
 *   VAL-FLIGHT-008  Failed plays in Needs Attention
 *   VAL-FLIGHT-009  On Track compact
 *   VAL-FLIGHT-010  Yellow indicator for stalled epics
 *   VAL-FLIGHT-011  AI diagnostic on attention cards
 *   VAL-FLIGHT-012  Empty state message
 *   VAL-FLIGHT-013  Epics In Flight counter (live)
 *   VAL-FLIGHT-014  Active Developers counter (live)
 *   VAL-FLIGHT-015  Plays Today counter (live)
 *   VAL-FLIGHT-016  Open Issues counter (live)
 *   VAL-FLIGHT-017  Metrics derived from live data
 *   VAL-FLIGHT-022  Required fields on each epic card
 *   VAL-FLIGHT-023  Attention cards show issues
 *   VAL-FLIGHT-024  Open in Reader navigates to Playbook with epic context
 *   VAL-FLIGHT-025  Different CTAs on attention vs on-track
 *   VAL-FLIGHT-033  Spatial hierarchy
 *   VAL-FLIGHT-034  Responsive layout adapts to viewport widths
 */
export default function FlightDeckPage() {
  const router = useRouter();
  const [data, setData] = useState<FlightDeckData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/flight-deck');
      if (!res.ok) {
        throw new Error(`Failed to load flight-deck data: ${res.status}`);
      }
      const body = (await res.json()) as FlightDeckData;
      setData(body);
      setError(body.error);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      // Surface an empty payload so the empty state renders rather than a blank screen.
      setData({
        attention: [],
        onTrack: [],
        metrics: { epicsInFlight: 0, activeDevelopers: 0, playsToday: 0, openIssues: 0 },
        empty: true,
        error: message,
        lastUpdatedIso: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const handleOpenInReader = useCallback(
    (epicId: string) => {
      router.push(`/playbook?context=${encodeURIComponent(epicId)}`);
    },
    [router],
  );

  const handleRunQaCheck = useCallback((epicId: string) => {
    // Deeper QA execution lands in a later feature (mdb-play-execution-log
    // + play execution engine). The debounced CTAButton already records the
    // click; we surface an optimistic console message so the action is
    // visible in tests and the browser devtools.

    console.log(`[flight-deck] Run QA Check requested for ${epicId}`);
  }, []);

  const handleViewIssues = useCallback(
    (epicId: string) => {
      router.push(`/playbook?context=${encodeURIComponent(epicId)}&tab=issues`);
    },
    [router],
  );

  const isEmpty = data !== null && data.empty;
  const hasAttention = (data?.attention.length ?? 0) > 0;
  const hasOnTrack = (data?.onTrack.length ?? 0) > 0;

  return (
    <div data-testid="flight-deck-view" className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Flight Deck</h2>
          <p className="mt-1 text-sm text-gray-400">
            Live execution dashboard — epics, developer activity, and AI diagnostics.
          </p>
        </div>
      </header>

      {/* 1. Metric tiles — top of the spatial hierarchy (VAL-FLIGHT-033) */}
      <section
        data-testid="flight-deck-metrics"
        aria-label="Flight Deck summary metrics"
        className="grid grid-cols-2 gap-3 sm:grid-cols-4"
      >
        <MetricTile label="Epics In Flight" value={data?.metrics.epicsInFlight ?? 0} />
        <MetricTile label="Active Devs" value={data?.metrics.activeDevelopers ?? 0} />
        <MetricTile label="Plays Today" value={data?.metrics.playsToday ?? 0} />
        <MetricTile label="Open Issues" value={data?.metrics.openIssues ?? 0} />
      </section>

      {loading && (
        <div
          data-testid="flight-deck-loading"
          className="mx-auto max-w-2xl rounded-lg border border-gray-800 bg-gray-900/30 px-6 py-10 text-center"
        >
          <p className="text-sm text-gray-500">Loading epics…</p>
        </div>
      )}

      {/* 2/3. Empty state when no epics match the convention (VAL-FLIGHT-012) */}
      {!loading && isEmpty && (
        <section
          data-testid="flight-deck-empty-state"
          aria-label="No epics in flight"
          className="mx-auto max-w-2xl rounded-lg border border-dashed border-gray-700 bg-gray-900/30 px-6 py-12 text-center"
        >
          <span className="mb-3 block text-4xl" aria-hidden="true">
            ✈️
          </span>
          <h3 className="text-lg font-semibold text-gray-200">No epics in flight</h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-gray-400">
            No git branches match the epic naming convention{' '}
            <code className="rounded bg-gray-800 px-1.5 py-0.5 font-mono text-xs text-gray-300">
              feat/e&lt;N&gt;-&lt;slug&gt;
            </code>
            . Start a new epic from Checklists to see it here.
          </p>
        </section>
      )}

      {/* 2. Needs Attention — prominent (VAL-FLIGHT-008, VAL-FLIGHT-033) */}
      {!loading && !isEmpty && hasAttention && (
        <section
          data-testid="flight-deck-attention"
          aria-label="Needs Attention"
          className="space-y-3"
        >
          <div className="flex items-baseline justify-between">
            <h3 className="text-lg font-semibold text-red-300">Needs Attention</h3>
            <span className="text-xs uppercase tracking-wider text-gray-500">
              {data?.attention.length ?? 0} epic{(data?.attention.length ?? 0) === 1 ? '' : 's'}
            </span>
          </div>
          <div className="space-y-3">
            {data?.attention.map((card) => (
              <AttentionCard
                key={card.id}
                card={card}
                onOpenInReader={handleOpenInReader}
                onRunQaCheck={handleRunQaCheck}
                onViewIssues={handleViewIssues}
              />
            ))}
          </div>
        </section>
      )}

      {/* 3. On Track — compact grid (VAL-FLIGHT-009, VAL-FLIGHT-034) */}
      {!loading && !isEmpty && hasOnTrack && (
        <section data-testid="flight-deck-on-track" aria-label="On Track" className="space-y-3">
          <div className="flex items-baseline justify-between">
            <h3 className="text-lg font-semibold text-emerald-300">On Track</h3>
            <span className="text-xs uppercase tracking-wider text-gray-500">
              {data?.onTrack.length ?? 0} epic{(data?.onTrack.length ?? 0) === 1 ? '' : 's'}
            </span>
          </div>
          {/*
            Responsive grid (VAL-FLIGHT-034):
              - default (narrow):   single column, cards stack vertically
              - md (≥768px):        two columns side by side
              - lg (≥1024px):       three columns side by side
              - xl (≥1280px):       four columns
          */}
          <div
            data-testid="flight-deck-on-track-grid"
            className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          >
            {data?.onTrack.map((card) => (
              <OnTrackCard key={card.id} card={card} onOpenInReader={handleOpenInReader} />
            ))}
          </div>
        </section>
      )}

      {/* Error strip — visible next to the empty state so the user never sees a blank screen. */}
      {error && !loading && data?.empty && (
        <p
          data-testid="flight-deck-error-note"
          className="mx-auto max-w-2xl text-center text-xs text-gray-500"
        >
          (Engine reported: {error})
        </p>
      )}
    </div>
  );
}
