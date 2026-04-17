'use client';

/**
 * NarrativeView — Client component that fetches a structured narrative from
 * /api/narrative?context=<epicId> and renders it as:
 *   - Section headings (H2/H3)
 *   - Prose with interactive CrossRefTokens embedded inline
 *   - EntityExpansion panels when tokens are clicked — with progressive
 *     disclosure: tri-state (unopened → open → collapsed → re-open), nested
 *     expansions via connection clicks, and an "Explain further" control
 *     that inserts a deeper composition inline within the expansion.
 *
 * Shows a loading indicator while composition is in progress (cache miss),
 * an error message on failure, and a "Served from cache" badge when the
 * narrative came from the content-hash cache.
 *
 * CRITICAL: The rendered DOM contains no raw YAML — all data comes from
 * the narrative tree (chunks + tokens) which is already structured prose.
 *
 * Fulfills: mdb-progressive-disclosure (client-side disclosure layer).
 */

import { useCallback, useEffect, useState } from 'react';
import { CrossRefToken } from '@/components/cross-ref-token';
import { CollapsedEntityExpansion, EntityExpansion } from '@/components/entity-expansion';
import type { Narrative, NarrativeChunk, NarrativeSection } from '@/lib/narrative-engine';

export interface NarrativeViewProps {
  /** Epic / context identifier (e.g. "E1", "EPIC-E1"). */
  context: string;
  /** Optional click handler for cross-reference tokens (notification). */
  onTokenClick?: (refId: string) => void;
  /**
   * Fired once the narrative has been successfully loaded. Consumers use
   * this to enrich outer UI (e.g. the breadcrumb) with the resolved epic
   * name. The callback receives the context id actually loaded and the
   * narrative's `epicName` — never the raw YAML.
   */
  onMetaLoaded?: (context: string, epicName: string) => void;
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

/** Per-token expansion state.
 *  - `undefined` / missing: never opened.
 *  - "open": currently expanded.
 *  - "collapsed": previously opened, now collapsed (re-open affordance shown).
 *
 *  Keyed by `${sectionId}::${refId}` so a token appearing in multiple
 *  sections opens a separate expansion only under the section that was
 *  actually clicked — matching the "expansion appears directly below the
 *  clicked token" wireframe contract.
 */
type TokenState = 'open' | 'collapsed';

function makeKey(sectionId: string, refId: string): string {
  return `${sectionId}::${refId}`;
}

export function NarrativeView({ context, onTokenClick, onMetaLoaded }: NarrativeViewProps) {
  const [state, setState] = useState<LoadState>({ status: 'idle' });
  const [tokenStates, setTokenStates] = useState<ReadonlyMap<string, TokenState>>(new Map());

  const openToken = useCallback((sectionId: string, refId: string) => {
    // Preserve scroll position: expansion grows content downward, the
    // browser keeps the scroll Y stable as long as we don't trigger
    // scrollIntoView. We don't manipulate scroll here.
    setTokenStates((prev) => {
      const next = new Map(prev);
      next.set(makeKey(sectionId, refId), 'open');
      return next;
    });
  }, []);

  const collapseToken = useCallback((sectionId: string, refId: string) => {
    setTokenStates((prev) => {
      const next = new Map(prev);
      next.set(makeKey(sectionId, refId), 'collapsed');
      return next;
    });
  }, []);

  const toggleToken = useCallback(
    (sectionId: string, refId: string) => {
      // Tri-state toggle:
      //   unopened → open
      //   open     → collapsed   (close the panel, keep collapsed indicator)
      //   collapsed→ open        (re-open previously closed expansion)
      setTokenStates((prev) => {
        const next = new Map(prev);
        const key = makeKey(sectionId, refId);
        const current = prev.get(key);
        if (current === 'open') next.set(key, 'collapsed');
        else next.set(key, 'open');
        return next;
      });
      onTokenClick?.(refId);
    },
    [onTokenClick],
  );

  useEffect(() => {
    let cancelled = false;
    setState({ status: 'loading' });
    setTokenStates(new Map());

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
        if (payload.narrative.epicName) {
          onMetaLoaded?.(context, payload.narrative.epicName);
        }
      } catch (err: unknown) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : String(err);
        setState({ status: 'error', message });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [context, onMetaLoaded]);

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
          onTokenClick={toggleToken}
          tokenStates={tokenStates}
          openToken={openToken}
          collapseToken={collapseToken}
        />
      ))}
    </article>
  );
}

// ---------------------------------------------------------------------------
// Section view — renders prose with inline tokens, plus expansion panels
// positioned directly below the paragraph holding the clicked token.
// ---------------------------------------------------------------------------

interface SectionProps {
  section: NarrativeSection;
  onTokenClick: (sectionId: string, refId: string) => void;
  tokenStates: ReadonlyMap<string, TokenState>;
  openToken: (sectionId: string, refId: string) => void;
  collapseToken: (sectionId: string, refId: string) => void;
}

function NarrativeSectionView({
  section,
  onTokenClick,
  tokenStates,
  openToken,
  collapseToken,
}: SectionProps) {
  const HeadingTag = section.level === 2 ? 'h2' : 'h3';
  const headingClass =
    section.level === 2
      ? 'text-xl font-semibold text-white'
      : 'text-base font-semibold text-gray-100';

  const handleClickHere = useCallback(
    (refId: string) => onTokenClick(section.id, refId),
    [onTokenClick, section.id],
  );

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
          <ChunkView key={idx} chunk={chunk} onTokenClick={handleClickHere} />
        ))}
      </p>

      {/* Inline expansions for every token in this section that has been interacted with. */}
      <SectionExpansions
        section={section}
        tokenStates={tokenStates}
        openToken={openToken}
        collapseToken={collapseToken}
      />

      {section.subsections?.map((sub) => (
        <NarrativeSectionView
          key={sub.id}
          section={sub}
          onTokenClick={onTokenClick}
          tokenStates={tokenStates}
          openToken={openToken}
          collapseToken={collapseToken}
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
  tokenStates: ReadonlyMap<string, TokenState>;
  openToken: (sectionId: string, refId: string) => void;
  collapseToken: (sectionId: string, refId: string) => void;
}

function SectionExpansions({
  section,
  tokenStates,
  openToken,
  collapseToken,
}: SectionExpansionsProps) {
  // Collect token refIds used in this section (first occurrence preserved)
  // and filter down to the ones that have a state under THIS section id.
  const refIds: string[] = [];
  const seen = new Set<string>();
  for (const c of section.chunks) {
    if (c.type === 'token') {
      if (!seen.has(c.token.refId)) {
        seen.add(c.token.refId);
        refIds.push(c.token.refId);
      }
    }
  }
  const interactedRefIds = refIds.filter((id) => tokenStates.has(makeKey(section.id, id)));
  if (interactedRefIds.length === 0) return null;

  return (
    <div
      className="space-y-2"
      data-testid="narrative-section-expansions"
      data-section-id={section.id}
      data-expansion-count={interactedRefIds.length}
    >
      {interactedRefIds.map((refId) => {
        const s = tokenStates.get(makeKey(section.id, refId));
        if (s === 'open') {
          return (
            <EntityExpansion
              key={refId}
              refId={refId}
              onClose={() => collapseToken(section.id, refId)}
            />
          );
        }
        if (s === 'collapsed') {
          return (
            <CollapsedEntityExpansion
              key={refId}
              refId={refId}
              summary={`[${refId}] previously opened — click to re-open.`}
              onReopen={() => openToken(section.id, refId)}
            />
          );
        }
        return null;
      })}
    </div>
  );
}
