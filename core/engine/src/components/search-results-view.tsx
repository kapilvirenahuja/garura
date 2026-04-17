'use client';

/**
 * SearchResultsView — client component that renders AI-composed
 * generative search results fetched from /api/search.
 *
 * Each result card shows:
 *   - A headline (feature / decision / NFR / topic)
 *   - Contextual prose chunks with inline CrossRefTokens that are
 *     clickable and navigate to the Playbook Reader
 *   - An epic-badge list (cross-epic relevance surface)
 *   - A source footer listing the artifacts that contributed to the
 *     composition (may be multiple for top results)
 *
 * CRITICAL: The rendered DOM contains NO raw YAML — everything is
 * either composed prose or structured UI components.
 *
 * Fulfills: mdb-generative-search (client surface).
 */

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CrossRefToken } from '@/components/cross-ref-token';
import type {
  GenerativeSearchResponse,
  GenerativeSearchResult,
  GenerativeSearchEpicRef,
} from '@/lib/generative-search';
import type { NarrativeChunk } from '@/lib/narrative-engine';

export interface SearchResultsViewProps {
  readonly query: string;
}

type LoadState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; data: GenerativeSearchResponse }
  | { status: 'error'; message: string };

export function SearchResultsView({ query }: SearchResultsViewProps) {
  const [state, setState] = useState<LoadState>({ status: 'idle' });
  const router = useRouter();

  const navigateToContext = useCallback(
    (refId: string) => {
      router.push(`/playbook?context=${encodeURIComponent(refId)}`);
    },
    [router],
  );

  useEffect(() => {
    let cancelled = false;
    setState({ status: 'loading' });

    (async () => {
      try {
        const url = `/api/search?query=${encodeURIComponent(query)}`;
        const res = await fetch(url, { cache: 'no-store' });
        const payload = (await res.json()) as unknown;
        if (cancelled) return;
        if (!res.ok) {
          const message =
            payload && typeof payload === 'object' && 'error' in payload
              ? String((payload as { error?: unknown }).error ?? `HTTP ${res.status}`)
              : `HTTP ${res.status}`;
          setState({ status: 'error', message });
          return;
        }
        const normalised = normaliseResponse(payload, query);
        if (!normalised) {
          setState({ status: 'error', message: 'Malformed search response' });
          return;
        }
        setState({ status: 'ready', data: normalised });
      } catch (err: unknown) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : String(err);
        setState({ status: 'error', message });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [query]);

  if (state.status === 'loading' || state.status === 'idle') {
    return (
      <section
        data-testid="search-results-loading"
        role="status"
        aria-live="polite"
        className="flex items-center gap-3 rounded border border-gray-800 bg-gray-900/40 px-4 py-6 text-gray-300"
      >
        <svg
          className="h-4 w-4 animate-spin text-blue-400"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
          />
        </svg>
        <span>Composing results for &ldquo;{query}&rdquo;…</span>
      </section>
    );
  }

  if (state.status === 'error') {
    return (
      <section
        data-testid="search-results-error"
        role="alert"
        className="rounded border border-red-900 bg-red-950/40 px-4 py-3 text-sm text-red-300"
      >
        Failed to compose search results: {state.message}
      </section>
    );
  }

  const { data } = state;
  return (
    <section
      data-testid="search-results-view"
      data-query={data.query}
      data-hit-count={data.hitCount}
      data-result-count={data.results.length}
      data-epic-count={data.epics.length}
      className="space-y-4"
    >
      <header className="flex flex-col gap-1">
        <p className="text-xs uppercase tracking-wider text-gray-500">Search</p>
        <h2 className="text-xl font-semibold text-white">&ldquo;{data.query}&rdquo;</h2>
        <div className="flex flex-wrap items-center gap-2 text-xs text-gray-400">
          <span data-testid="search-results-summary">
            {data.results.length} composed result{data.results.length === 1 ? '' : 's'} from{' '}
            {data.hitCount} underlying match{data.hitCount === 1 ? '' : 'es'}
          </span>
          {data.epics.length > 1 ? (
            <span
              data-testid="search-results-cross-epic"
              className="rounded bg-indigo-900/40 px-2 py-0.5 text-indigo-300"
              title="This query matches multiple epics"
            >
              cross-epic · {data.epics.length} epics
            </span>
          ) : null}
        </div>
      </header>

      {data.results.length === 0 ? (
        <EmptyState />
      ) : (
        <ol className="space-y-3" data-testid="search-results-list">
          {data.results.map((result, idx) => (
            <SearchResultCard
              key={result.id}
              result={result}
              rank={idx + 1}
              onTokenClick={navigateToContext}
            />
          ))}
        </ol>
      )}

      <footer className="pt-2 text-xs text-gray-500">
        Prefer to browse manually?{' '}
        <Link
          href="/playbook"
          data-testid="search-results-root-link"
          className="text-blue-400 underline-offset-2 hover:underline"
        >
          Return to Playbook root
        </Link>
        .
      </footer>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Subcomponents
// ---------------------------------------------------------------------------

interface SearchResultCardProps {
  readonly result: GenerativeSearchResult;
  readonly rank: number;
  readonly onTokenClick: (refId: string) => void;
}

function SearchResultCard({ result, rank, onTokenClick }: SearchResultCardProps) {
  return (
    <li
      data-testid="search-result-card"
      data-result-id={result.id}
      data-result-kind={result.kind}
      data-result-rank={rank}
      data-source-count={result.sources.length}
      data-epic-count={result.epics.length}
      className="rounded-lg border border-gray-800 bg-gray-900/40 p-4 shadow-sm transition-colors hover:border-gray-700"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <p className="text-[11px] uppercase tracking-wider text-gray-500">
            {resultKindLabel(result.kind)} · rank {rank}
          </p>
          <h3
            className="mt-0.5 text-base font-semibold text-white"
            data-testid="search-result-title"
          >
            {result.title}
          </h3>
        </div>
        <span
          className="rounded bg-gray-800/70 px-2 py-0.5 text-[11px] font-medium text-gray-300"
          aria-label="Relevance score"
          data-testid="search-result-relevance"
        >
          relevance {result.relevance.toFixed(2)}
        </span>
      </div>

      {result.epics.length > 0 ? (
        <ul
          data-testid="search-result-epics"
          className="mt-2 flex flex-wrap gap-1.5"
          aria-label="Related epics"
        >
          {result.epics.map((epic) => (
            <EpicBadge key={epic.id} epic={epic} />
          ))}
        </ul>
      ) : null}

      <p data-testid="search-result-prose" className="mt-3 text-sm leading-relaxed text-gray-300">
        {result.chunks.map((chunk, i) => (
          <ChunkView key={i} chunk={chunk} onTokenClick={onTokenClick} />
        ))}
      </p>

      <div
        className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-gray-500"
        data-testid="search-result-sources"
      >
        <span className="uppercase tracking-wider">Sources ({result.sources.length}):</span>
        {result.sources.map((source, i) => (
          <span
            key={`${source.entityId}-${i}`}
            data-testid="search-result-source"
            data-source-type={source.sourceType}
            data-entity-id={source.entityId}
            className="rounded border border-gray-800 bg-gray-950 px-1.5 py-0.5 font-mono"
          >
            {source.sourceType}:{source.entityId}
          </span>
        ))}
      </div>
    </li>
  );
}

function EpicBadge({ epic }: { epic: GenerativeSearchEpicRef }) {
  return (
    <li>
      <Link
        href={`/playbook?context=${encodeURIComponent(epic.id)}`}
        data-testid="search-result-epic-badge"
        data-epic-id={epic.id}
        className="inline-flex items-center gap-1 rounded border border-blue-900/60 bg-blue-950/40 px-2 py-0.5 text-xs font-medium text-blue-300 hover:border-blue-700 hover:bg-blue-900/60 hover:text-blue-200"
      >
        <span aria-hidden="true">📖</span>
        {epic.shortId}: {epic.name}
      </Link>
    </li>
  );
}

function ChunkView({
  chunk,
  onTokenClick,
}: {
  chunk: NarrativeChunk;
  onTokenClick: (refId: string) => void;
}) {
  if (chunk.type === 'text') {
    return <span>{chunk.text}</span>;
  }
  return (
    <CrossRefToken
      refId={chunk.token.refId}
      dangling={chunk.token.dangling}
      onClick={onTokenClick}
    />
  );
}

function EmptyState() {
  return (
    <div
      data-testid="search-results-empty"
      className="rounded border border-dashed border-gray-700 bg-gray-900/30 px-4 py-6 text-center text-sm text-gray-400"
    >
      No results found. Try a different query or{' '}
      <Link
        href="/playbook"
        data-testid="search-results-empty-root-link"
        className="text-blue-400 underline-offset-2 hover:underline"
      >
        return to Playbook root
      </Link>
      .
    </div>
  );
}

/**
 * Defensively coerce an arbitrary payload into a GenerativeSearchResponse.
 * Returns null if the payload has neither `results` nor `error` — i.e. the
 * fetch succeeded but did not return the expected shape (e.g. a test
 * environment mocked fetch for a different endpoint). This keeps the
 * component resilient to unrelated fetch mocks.
 */
function normaliseResponse(
  payload: unknown,
  fallbackQuery: string,
): GenerativeSearchResponse | null {
  if (!payload || typeof payload !== 'object') return null;
  const record = payload as Record<string, unknown>;
  if (!Array.isArray(record['results'])) return null;
  const results = record['results'] as GenerativeSearchResult[];
  const query = typeof record['query'] === 'string' ? (record['query'] as string) : fallbackQuery;
  const hitCount =
    typeof record['hitCount'] === 'number' ? (record['hitCount'] as number) : results.length;
  const epics = Array.isArray(record['epics'])
    ? (record['epics'] as GenerativeSearchEpicRef[])
    : [];
  const composedAt =
    typeof record['composedAt'] === 'string'
      ? (record['composedAt'] as string)
      : new Date().toISOString();
  return { query, results, hitCount, epics, composedAt };
}

function resultKindLabel(kind: GenerativeSearchResult['kind']): string {
  switch (kind) {
    case 'feature':
      return 'Feature';
    case 'decision':
      return 'Architecture decision';
    case 'nfr':
      return 'Non-functional requirement';
    case 'plan':
      return 'Plan task';
    case 'product':
      return 'Product context';
    default:
      return 'Reference';
  }
}
