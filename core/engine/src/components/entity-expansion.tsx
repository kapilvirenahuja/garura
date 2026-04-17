'use client';

/**
 * EntityExpansion — The rich, open InlineExpansion panel shown in the
 * Playbook Reader when a CrossRefToken is clicked.
 *
 * Structure:
 *   ┌─ Header: type badge · title · [× close] ───────────┐
 *   │  description prose                                 │
 *   │  facts (definition list: Given / When / Then ...)  │
 *   │  ── Connections ─────────────────────────────────  │
 *   │    Parent feature:    [F1]                         │
 *   │    Architecture:      [ADR-001] [ADR-003]          │
 *   │  ╔════════════════════╗                            │
 *   │  ║ 🔎 Explain further ║                            │
 *   │  ╚════════════════════╝                            │
 *   │  (deeper composition appears here)                 │
 *   │  (nested expansions for clicked connections)       │
 *   └────────────────────────────────────────────────────┘
 *
 * Fulfills: mdb-progressive-disclosure — the entire open-state surface.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { CrossRefToken } from '@/components/cross-ref-token';
import type { EntityExpansionData } from '@/lib/entity-expansion';

export interface EntityExpansionProps {
  /** Reference ID being expanded (e.g. "F1", "SC-AUTH-001"). */
  refId: string;
  /** Called when the user clicks the close (×) control. */
  onClose: () => void;
  /**
   * Optional — a seeded expansion payload. When provided, the component will
   * render without fetching. Useful for tests and pre-rendered scenarios.
   */
  seed?: EntityExpansionData;
  /**
   * Optional nesting depth. Limits runaway nested expansions.
   * Defaults to 0; children render at depth + 1.
   */
  depth?: number;
}

interface ExpansionApiResponse {
  readonly expansion: EntityExpansionData | null;
  readonly error?: string;
}

interface ExplainApiResponse {
  readonly paragraphs: readonly string[];
  readonly source: 'deterministic' | 'ai';
  readonly error?: string;
}

type DataState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; data: EntityExpansionData }
  | { status: 'error'; message: string };

type ExplainState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; paragraphs: readonly string[] }
  | { status: 'error'; message: string };

/** Clamp nested expansion depth to avoid pathological nesting. */
const MAX_DEPTH = 4;

export function EntityExpansion({ refId, onClose, seed, depth = 0 }: EntityExpansionProps) {
  const [state, setState] = useState<DataState>(() =>
    seed ? { status: 'ready', data: seed } : { status: 'idle' },
  );
  const [explain, setExplain] = useState<ExplainState>({ status: 'idle' });
  const [nested, setNested] = useState<readonly string[]>([]);

  const handleConnectionClick = useCallback((id: string) => {
    setNested((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }, []);

  const closeNested = useCallback((id: string) => {
    setNested((prev) => prev.filter((x) => x !== id));
  }, []);

  useEffect(() => {
    if (seed) return; // already seeded
    let cancelled = false;
    setState({ status: 'loading' });
    (async () => {
      try {
        const url = `/api/expansion?refId=${encodeURIComponent(refId)}`;
        const res = await fetch(url, { cache: 'no-store' });
        const payload = (await res.json()) as ExpansionApiResponse;
        if (cancelled) return;
        if (!res.ok || !payload.expansion) {
          setState({
            status: 'error',
            message: payload.error ?? `Request failed with HTTP ${res.status}`,
          });
          return;
        }
        setState({ status: 'ready', data: payload.expansion });
      } catch (err: unknown) {
        if (cancelled) return;
        setState({
          status: 'error',
          message: err instanceof Error ? err.message : String(err),
        });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refId, seed]);

  const handleExplainFurther = useCallback(() => {
    if (explain.status === 'loading') return;
    setExplain({ status: 'loading' });
    (async () => {
      try {
        const res = await fetch(`/api/explain?refId=${encodeURIComponent(refId)}`, {
          cache: 'no-store',
        });
        const payload = (await res.json()) as ExplainApiResponse;
        if (!res.ok) {
          setExplain({
            status: 'error',
            message: payload.error ?? `Request failed with HTTP ${res.status}`,
          });
          return;
        }
        setExplain({ status: 'ready', paragraphs: payload.paragraphs });
      } catch (err: unknown) {
        setExplain({
          status: 'error',
          message: err instanceof Error ? err.message : String(err),
        });
      }
    })();
  }, [explain.status, refId]);

  const nestedCapped = useMemo(() => nested.slice(0, 8), [nested]);

  if (state.status === 'loading' || state.status === 'idle') {
    return (
      <div
        data-testid="entity-expansion"
        data-ref-id={refId}
        data-open="true"
        data-state="loading"
        className="my-2 rounded-md border border-gray-700 bg-gray-900/70 p-4"
      >
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">Loading [{refId}]…</span>
          <CloseButton onClick={onClose} />
        </div>
      </div>
    );
  }

  if (state.status === 'error') {
    return (
      <div
        data-testid="entity-expansion"
        data-ref-id={refId}
        data-open="true"
        data-state="error"
        role="alert"
        className="my-2 rounded-md border border-red-800 bg-red-950/40 p-4"
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="text-sm font-semibold text-red-300">
              Could not load details for [{refId}]
            </div>
            <div className="mt-1 text-xs text-red-400">{state.message}</div>
          </div>
          <CloseButton onClick={onClose} />
        </div>
      </div>
    );
  }

  const data = state.data;

  return (
    <div
      data-testid="entity-expansion"
      data-ref-id={refId}
      data-open="true"
      data-state="ready"
      data-depth={depth}
      className="my-2 rounded-md border border-gray-700 bg-gray-900/70 p-4"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs">
            <span className="rounded bg-gray-700 px-2 py-0.5 font-medium text-gray-200">
              {data.typeLabel}
            </span>
            <span className="text-gray-500">·</span>
            <span className="font-mono text-blue-400" data-testid="entity-expansion-ref">
              [{data.refId}]
            </span>
            {data.source ? (
              <>
                <span className="text-gray-500">·</span>
                <span className="text-gray-500">{data.source}</span>
              </>
            ) : null}
          </div>
          <h4 className="text-base font-semibold text-white" data-testid="entity-expansion-title">
            {data.title}
          </h4>
        </div>
        <CloseButton onClick={onClose} />
      </div>

      {/* Description */}
      {data.description ? (
        <p
          data-testid="entity-expansion-description"
          className="mt-3 text-sm leading-relaxed text-gray-300"
        >
          {data.description}
        </p>
      ) : null}

      {/* Facts */}
      {data.facts.length > 0 ? (
        <dl
          data-testid="entity-expansion-facts"
          className="mt-3 grid grid-cols-[max-content_1fr] gap-x-3 gap-y-1 text-xs"
        >
          {data.facts.map((f, i) => (
            <div key={i} className="contents">
              <dt className="text-gray-400">{f.label}</dt>
              <dd className="text-gray-200">{f.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}

      {/* Connections */}
      {data.connections.length > 0 ? (
        <div
          className="mt-4 border-t border-gray-800 pt-3"
          data-testid="entity-expansion-connections"
        >
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            Connections
          </div>
          <dl className="mt-2 grid grid-cols-[max-content_1fr] gap-x-3 gap-y-1 text-xs">
            {data.connections.map((conn, i) => (
              <div key={i} className="contents" data-testid="entity-expansion-connection">
                <dt className="self-center text-gray-400">{conn.label}</dt>
                <dd className="flex flex-wrap gap-1">
                  {conn.refIds.map((id) => (
                    <CrossRefToken
                      key={id}
                      refId={id}
                      onClick={depth < MAX_DEPTH ? handleConnectionClick : undefined}
                    />
                  ))}
                </dd>
              </div>
            ))}
          </dl>

          {/* Nested expansions for connection clicks */}
          {nestedCapped.length > 0 ? (
            <div
              className="mt-3 space-y-2 pl-3 border-l border-gray-800"
              data-testid="entity-expansion-nested"
            >
              {nestedCapped.map((nestedId) => (
                <EntityExpansion
                  key={nestedId}
                  refId={nestedId}
                  onClose={() => closeNested(nestedId)}
                  depth={depth + 1}
                />
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {/* Explain further */}
      <div className="mt-4" data-testid="entity-expansion-explain-wrap">
        <button
          type="button"
          onClick={handleExplainFurther}
          disabled={explain.status === 'loading'}
          data-testid="entity-expansion-explain-btn"
          className="inline-flex items-center gap-2 rounded border border-blue-700 bg-blue-900/30 px-3 py-1.5 text-xs font-medium text-blue-300 hover:bg-blue-900/60 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span aria-hidden="true">🔎</span>
          {explain.status === 'loading' ? 'Composing…' : 'Explain further'}
        </button>
        {explain.status === 'ready' && explain.paragraphs.length > 0 ? (
          <div
            data-testid="entity-expansion-explain-result"
            className="mt-3 space-y-2 rounded border border-gray-800 bg-black/30 p-3 text-sm leading-relaxed text-gray-200"
          >
            {explain.paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        ) : null}
        {explain.status === 'error' ? (
          <div
            data-testid="entity-expansion-explain-error"
            role="alert"
            className="mt-2 text-xs text-red-400"
          >
            Explain further failed: {explain.message}
          </div>
        ) : null}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Collapsed state — previously opened, click to re-open
// ---------------------------------------------------------------------------

export interface CollapsedEntityExpansionProps {
  refId: string;
  /** Summary shown inline (e.g. "[F1] OAuth Login via Google"). */
  summary: string;
  /** Click the row to re-open. */
  onReopen: () => void;
}

export function CollapsedEntityExpansion({
  refId,
  summary,
  onReopen,
}: CollapsedEntityExpansionProps) {
  return (
    <div
      data-testid="entity-expansion-collapsed"
      data-ref-id={refId}
      data-open="false"
      className="my-2 flex items-center justify-between gap-3 rounded-md border border-dashed border-gray-700 bg-gray-900/30 px-3 py-2 text-xs text-gray-400"
    >
      <span>
        <span aria-hidden="true" className="mr-1">
          ▾
        </span>
        {summary}
      </span>
      <button
        type="button"
        data-testid="entity-expansion-reopen"
        onClick={onReopen}
        className="rounded border border-gray-700 bg-gray-800 px-2 py-1 text-xs text-gray-200 hover:bg-gray-700"
      >
        click to re-open
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function CloseButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      data-testid="entity-expansion-close"
      onClick={onClick}
      className="flex h-6 shrink-0 items-center gap-1 rounded border border-gray-700 bg-gray-800 px-2 text-xs text-gray-300 hover:border-gray-500 hover:text-gray-100"
      aria-label="Close expansion"
    >
      <span aria-hidden="true">×</span>
      <span>close</span>
    </button>
  );
}
