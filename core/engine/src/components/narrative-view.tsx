'use client';

/**
 * NarrativeView — Client component that fetches a structured narrative from
 * /api/narrative?context=<epicId> and renders it as:
 *   - Section headings (H2/H3)
 *   - Prose with interactive CrossRefTokens embedded inline
 *   - InlineExpansion panels when tokens are clicked
 *
 * Shows a loading indicator while composition is in progress (cache miss),
 * an error message on failure, and a "Served from cache" badge when the
 * narrative came from the content-hash cache.
 *
 * CRITICAL: The rendered DOM contains no raw YAML — all data comes from
 * the narrative tree (chunks + tokens) which is already structured prose.
 */

import { useCallback, useEffect, useState } from 'react';
import { CrossRefToken } from '@/components/cross-ref-token';
import { InlineExpansion } from '@/components/inline-expansion';
import type { Narrative, NarrativeChunk, NarrativeSection } from '@/lib/narrative-engine';

export interface NarrativeViewProps {
  /** Epic / context identifier (e.g. "E1", "EPIC-E1"). */
  context: string;
  /** Optional click handler for cross-reference tokens. */
  onTokenClick?: (refId: string) => void;
}

interface NarrativeApiResponse {
  readonly narrative: Narrative | null;
  readonly fromCache: boolean;
  readonly composedAt?: string;
  readonly error?: string;
}

type LoadState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; data: NarrativeApiResponse }
  | { status: 'error'; message: string };

export function NarrativeView({ context, onTokenClick }: NarrativeViewProps) {
  const [state, setState] = useState<LoadState>({ status: 'idle' });
  const [expandedTokens, setExpandedTokens] = useState<Set<string>>(new Set());

  const handleTokenClick = useCallback(
    (refId: string) => {
      setExpandedTokens((prev) => {
        const next = new Set(prev);
        if (next.has(refId)) next.delete(refId);
        else next.add(refId);
        return next;
      });
      onTokenClick?.(refId);
    },
    [onTokenClick],
  );

  useEffect(() => {
    let cancelled = false;
    setState({ status: 'loading' });
    setExpandedTokens(new Set());

    (async () => {
      try {
        const url = `/api/narrative?context=${encodeURIComponent(context)}`;
        const res = await fetch(url, { cache: 'no-store' });
        const payload = (await res.json()) as NarrativeApiResponse;
        if (cancelled) return;
        if (!res.ok || !payload.narrative) {
          setState({
            status: 'error',
            message: payload.error ?? `Request failed with HTTP ${res.status}`,
          });
          return;
        }
        setState({ status: 'ready', data: payload });
      } catch (err: unknown) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : String(err);
        setState({ status: 'error', message });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [context]);

  if (state.status === 'loading' || state.status === 'idle') {
    return (
      <div
        data-testid="narrative-loading"
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
        <span>Composing narrative for {context}…</span>
      </div>
    );
  }

  if (state.status === 'error') {
    return (
      <div
        data-testid="narrative-error"
        role="alert"
        className="rounded border border-red-900 bg-red-950/40 px-4 py-3 text-sm text-red-300"
      >
        Failed to compose narrative: {state.message}
      </div>
    );
  }

  const { narrative, fromCache } = state.data;
  if (!narrative) {
    return (
      <div data-testid="narrative-empty" className="text-gray-400">
        No narrative available for this context.
      </div>
    );
  }

  return (
    <article
      data-testid="narrative-root"
      data-content-hash={narrative.contentHash}
      data-density={narrative.density}
      data-from-cache={fromCache ? 'true' : 'false'}
      data-feature-count={narrative.featureCount}
      className="space-y-6"
    >
      <header className="space-y-1">
        <h2 className="text-2xl font-bold text-white" data-testid="narrative-title">
          {narrative.epicName}
        </h2>
        <div className="flex flex-wrap items-center gap-2 text-xs text-gray-400">
          <span>{narrative.featureCount} features</span>
          <span>·</span>
          <span>density: {narrative.density}</span>
          {narrative.status ? (
            <>
              <span>·</span>
              <span>status: {narrative.status}</span>
            </>
          ) : null}
          {fromCache ? (
            <>
              <span>·</span>
              <span
                data-testid="narrative-cache-badge"
                className="rounded bg-emerald-900/30 px-2 py-0.5 text-emerald-300"
              >
                cache hit
              </span>
            </>
          ) : null}
        </div>
      </header>

      {narrative.sections.map((section) => (
        <NarrativeSectionView
          key={section.id}
          section={section}
          onTokenClick={handleTokenClick}
          expandedTokens={expandedTokens}
        />
      ))}
    </article>
  );
}

interface SectionProps {
  section: NarrativeSection;
  onTokenClick: (refId: string) => void;
  expandedTokens: ReadonlySet<string>;
}

function NarrativeSectionView({ section, onTokenClick, expandedTokens }: SectionProps) {
  const HeadingTag = section.level === 2 ? 'h2' : 'h3';
  const headingClass =
    section.level === 2
      ? 'text-xl font-semibold text-white'
      : 'text-base font-semibold text-gray-100';

  return (
    <section
      data-testid="narrative-section"
      data-section-id={section.id}
      data-section-level={section.level}
      className={section.level === 2 ? 'space-y-3' : 'mt-3 space-y-2 pl-2'}
    >
      <HeadingTag className={headingClass}>{section.heading}</HeadingTag>
      <p data-testid="narrative-section-text" className="leading-relaxed text-gray-300">
        {section.chunks.map((chunk, idx) => (
          <ChunkView key={idx} chunk={chunk} onTokenClick={onTokenClick} />
        ))}
      </p>
      {/* Render inline expansions directly below the section for any token clicked inside it. */}
      <SectionExpansions
        section={section}
        onTokenClick={onTokenClick}
        expandedTokens={expandedTokens}
      />
      {section.subsections?.map((sub) => (
        <NarrativeSectionView
          key={sub.id}
          section={sub}
          onTokenClick={onTokenClick}
          expandedTokens={expandedTokens}
        />
      ))}
    </section>
  );
}

interface ChunkProps {
  chunk: NarrativeChunk;
  onTokenClick: (refId: string) => void;
}

function ChunkView({ chunk, onTokenClick }: ChunkProps) {
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

interface SectionExpansionsProps {
  section: NarrativeSection;
  onTokenClick: (refId: string) => void;
  expandedTokens: ReadonlySet<string>;
}

function SectionExpansions({ section, onTokenClick, expandedTokens }: SectionExpansionsProps) {
  const tokensInSection = section.chunks
    .filter((c): c is Extract<NarrativeChunk, { type: 'token' }> => c.type === 'token')
    .map((c) => c.token)
    .filter((t) => expandedTokens.has(t.refId));

  if (tokensInSection.length === 0) return null;

  return (
    <div className="space-y-2" data-testid="narrative-section-expansions">
      {tokensInSection.map((t) => (
        <InlineExpansion key={t.refId} summary={`Reference details — [${t.refId}]`} defaultOpen>
          <button
            type="button"
            onClick={() => onTokenClick(t.refId)}
            className="text-xs text-gray-400 underline-offset-2 hover:text-gray-200 hover:underline"
          >
            Close expansion
          </button>
          <div className="mt-2 text-sm text-gray-300">
            Details for <code className="text-blue-400">{t.refId}</code> — the full entity breakdown
            (connections, linked scenarios, source) is rendered by the milestone
            progressive-disclosure layer.
          </div>
        </InlineExpansion>
      ))}
    </div>
  );
}
