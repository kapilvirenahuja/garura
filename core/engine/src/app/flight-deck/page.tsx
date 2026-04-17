'use client';

import { useCallback, useEffect, useState } from 'react';

/**
 * Summary of discovered epics for the Flight Deck.
 *
 * This page is the surface for the epic-status-inference feature. The
 * matching feature ships the discovery/inference engine and this minimal
 * empty-state presentation; the attention-priority layout, AI diagnostics,
 * metric tiles, and play-execution log are delivered by subsequent features
 * (mdb-flight-deck-layout, mdb-play-execution-log, mdb-flight-deck-refresh).
 */
interface FlightDeckEpic {
  readonly id: string;
  readonly slug: string;
  readonly branchName: string;
  readonly stage: string;
  readonly developer: string | null;
  readonly lastCommit: {
    readonly hash: string;
    readonly author: string;
    readonly timestamp: string;
    readonly message: string;
  } | null;
}

interface FlightDeckResponse {
  readonly epics: ReadonlyArray<FlightDeckEpic>;
  readonly empty: boolean;
  readonly error: string | null;
}

/**
 * Flight Deck — live execution dashboard with epic status and developer activity.
 *
 * Empty state (VAL-FLIGHT-004): when no git branches match the epic naming
 * convention, the page shows a clear "No epics in flight" message with
 * guidance to start one from Checklists. No crash, no error UI, no blank
 * screen.
 */
export default function FlightDeckPage() {
  const [data, setData] = useState<FlightDeckResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEpics = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/flight-deck/epics');
      if (!res.ok) {
        throw new Error(`Failed to load epics: ${res.status}`);
      }
      const body = (await res.json()) as FlightDeckResponse;
      setData(body);
      setError(body.error);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      // Surface an empty result so the empty state renders rather than a blank screen.
      setData({ epics: [], empty: true, error: message });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchEpics();
  }, [fetchEpics]);

  const isEmpty = data !== null && data.empty;

  return (
    <div data-testid="flight-deck-view">
      <header className="mb-8">
        <h2 className="text-2xl font-bold text-white">Flight Deck</h2>
        <p className="mt-2 text-gray-400">
          Live execution dashboard with epic status and developer activity.
        </p>
      </header>

      {loading && (
        <div
          data-testid="flight-deck-loading"
          className="mx-auto max-w-2xl rounded-lg border border-gray-800 bg-gray-900/30 px-6 py-10 text-center"
        >
          <p className="text-sm text-gray-500">Loading epics…</p>
        </div>
      )}

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

      {!loading && !isEmpty && data && (
        <section data-testid="flight-deck-epics" className="space-y-3">
          {data.epics.map((epic) => (
            <article
              key={epic.id}
              data-testid="flight-deck-epic"
              data-epic-id={epic.id}
              data-epic-stage={epic.stage}
              className="rounded-lg border border-gray-700 bg-gray-900/50 px-5 py-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-base font-semibold text-white">
                    {epic.id}
                    {epic.slug ? `: ${epic.slug}` : ''}
                  </h3>
                  <p className="mt-1 text-xs text-gray-500">
                    {epic.branchName} · {epic.developer ?? 'unassigned'}
                  </p>
                </div>
                <span
                  data-testid="flight-deck-epic-stage"
                  className="rounded-full border border-gray-700 bg-gray-800 px-2.5 py-0.5 text-xs font-medium uppercase tracking-wide text-gray-300"
                >
                  {epic.stage}
                </span>
              </div>
              {epic.lastCommit && (
                <p className="mt-3 truncate text-xs text-gray-400" title={epic.lastCommit.message}>
                  Last commit: {epic.lastCommit.message}
                </p>
              )}
            </article>
          ))}
        </section>
      )}

      {/* Non-blocking error strip — empty-state still shows even when the API
          is degraded, so the user never sees a blank screen. */}
      {error && !loading && data?.empty && (
        <p
          data-testid="flight-deck-error-note"
          className="mx-auto mt-4 max-w-2xl text-center text-xs text-gray-500"
        >
          (Engine reported: {error})
        </p>
      )}
    </div>
  );
}
