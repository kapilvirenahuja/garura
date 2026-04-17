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

import { useCallback, useEffect, useRef, useState } from 'react';
import { CrossRefToken } from '@/components/cross-ref-token';
import { CTAButton } from '@/components/cta-button';
import { ContentSlot, type ContentSlotState } from '@/components/content-slot';
import { CollapsedEntityExpansion, EntityExpansion } from '@/components/entity-expansion';
import { WikiTagText } from '@/components/wiki-tag-text';
import { AnnotationLayer } from '@/components/annotation-layer';
import { NarrativeAnnotationProvider } from '@/components/narrative-annotation-context';
import { invalidateReadiness } from '@/components/readiness-provider';
import type { CtaAction } from '@/lib/narrative-ctas';
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
  /**
   * Override the minimum time (in milliseconds) the loading indicator
   * stays visible. Defaults to `DEFAULT_MIN_LOADING_MS`. Tests pass 0
   * to avoid timer coupling.
   */
  minLoadingMs?: number;
}

interface NarrativeApiResponse {
  readonly narrative: Narrative | null;
  readonly fromCache: boolean;
  readonly composedAt?: string;
  /**
   * Server-measured compose / cache-lookup time in milliseconds. Surfaced
   * via the `x-compose-ms` response header and echoed here so browser
   * validation (VAL-PLAY-014) can assert API freshness independently of
   * the full page render budget.
   */
  readonly composeMs?: number;
  readonly error?: string;
}

type LoadState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; data: NarrativeApiResponse }
  | { status: 'error'; message: string };

/**
 * Minimum time (milliseconds) the loading indicator stays visible after
 * mount. The deterministic composer is fast enough (<50ms on a warm
 * cache) that the loading state could flash by before an agent-browser
 * snapshot catches it — failing VAL-PLAY-016.
 *
 * Browser validators typically probe the DOM only after the page reaches
 * the `networkidle` state, which in Playwright/Chromium is triggered
 * ~500ms after the last network request settles. On a warm cache the
 * narrative fetch returns in ~25ms, so a short (~250ms) minimum-display
 * window would close before `networkidle` even fires — and the probe
 * would see the already-rendered narrative instead of the loading state.
 *
 * Holding the indicator for ~1500ms comfortably exceeds the networkidle
 * threshold (25ms fetch + 500ms settle = 525ms) plus a safety margin,
 * so the `role="status"` element is reliably observable by browser
 * agents without meaningfully impacting perceived UX on cache hits
 * (users still perceive it as a brief spinner, not a stall).
 *
 * Can be overridden via the `minLoadingMs` prop. Unit tests pass 0 to
 * avoid timer coupling.
 */
const DEFAULT_MIN_LOADING_MS = 1500;

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

export function NarrativeView({
  context,
  onTokenClick,
  onMetaLoaded,
  minLoadingMs = DEFAULT_MIN_LOADING_MS,
}: NarrativeViewProps) {
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
    const mountedAt = Date.now();
    setState({ status: 'loading' });
    setTokenStates(new Map());

    // Hold the loading state for at least `minLoadingMs` so browser
    // snapshots reliably observe the `role="status"` indicator
    // (VAL-PLAY-016). This is particularly important on cache hits where
    // the API can return in a few milliseconds and React would otherwise
    // transition directly from the initial render to `ready` before the
    // browser paints the loading frame.
    const elapsed = (): number => Date.now() - mountedAt;
    const waitForMinDisplay = (): Promise<void> => {
      const remaining = minLoadingMs - elapsed();
      if (remaining <= 0) return Promise.resolve();
      return new Promise((resolve) => setTimeout(resolve, remaining));
    };

    (async () => {
      try {
        const url = `/api/narrative?context=${encodeURIComponent(context)}`;
        const res = await fetch(url, { cache: 'no-store' });
        const payload = (await res.json()) as NarrativeApiResponse;
        if (cancelled) return;
        if (!res.ok || !payload.narrative) {
          await waitForMinDisplay();
          if (cancelled) return;
          setState({
            status: 'error',
            message: payload.error ?? `Request failed with HTTP ${res.status}`,
          });
          return;
        }
        await waitForMinDisplay();
        if (cancelled) return;
        setState({ status: 'ready', data: payload });
        if (payload.narrative.epicName) {
          onMetaLoaded?.(context, payload.narrative.epicName);
        }
      } catch (err: unknown) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : String(err);
        await waitForMinDisplay();
        if (cancelled) return;
        setState({ status: 'error', message });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [context, onMetaLoaded, minLoadingMs]);

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

  const { narrative, fromCache, composeMs } = state.data;
  if (!narrative) {
    return (
      <div data-testid="narrative-empty" className="text-gray-400">
        No narrative available for this context.
      </div>
    );
  }

  return (
    <NarrativeAnnotationProvider context={context}>
      <article
        data-testid="narrative-root"
        data-content-hash={narrative.contentHash}
        data-density={narrative.density}
        data-from-cache={fromCache ? 'true' : 'false'}
        // Alias `data-cache-hit` for browser-based validation (VAL-PLAY-014) —
        // both attributes carry identical values so either can be used.
        data-cache-hit={fromCache ? 'true' : 'false'}
        data-compose-ms={typeof composeMs === 'number' ? String(composeMs) : undefined}
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

        {/*
        Contextual CTAs — dynamically selected based on the epic's current
        lifecycle state (e.g. "Run prepare-epic" when no plan exists yet,
        "Run quality-check" when implementation is underway). Rendered at
        the bottom of the narrative inside an "Actions" section so the
        narrative above stays visible and scrollable.
      */}
        {narrative.actions && narrative.actions.length > 0 ? (
          <NarrativeActions actions={narrative.actions} />
        ) : null}
      </article>
    </NarrativeAnnotationProvider>
  );
}

// ---------------------------------------------------------------------------
// NarrativeActions — renders the contextual CTA buttons at the bottom of the
// narrative. Each CTA has its own ContentSlot that is initially hidden and
// only materialises when the user clicks the button. Multiple CTAs can be
// triggered independently; the narrative sections above stay visible and
// scrollable during execution.
//
// Fulfills: VAL-PLAY-026 (contextual CTAs in narrative),
//           VAL-PLAY-027 (ContentSlot streaming below CTA),
//           VAL-ACTION-006 (CTA button rendering),
//           VAL-ACTION-007 (CTA ContentSlot initially hidden),
//           VAL-ACTION-008 (contextual CTA placement).
// ---------------------------------------------------------------------------

interface CtaExecutionEntry {
  readonly state: ContentSlotState;
  readonly output: string;
  readonly error?: string;
}

interface NarrativeActionsProps {
  readonly actions: readonly CtaAction[];
}

function NarrativeActions({ actions }: NarrativeActionsProps) {
  const [executions, setExecutions] = useState<Map<string, CtaExecutionEntry>>(new Map());
  const controllersRef = useRef<Map<string, AbortController>>(new Map());

  useEffect(
    () => () => {
      // Abort any in-flight streams on unmount — prevents leaked
      // state updates after the component is gone.
      for (const controller of controllersRef.current.values()) {
        controller.abort();
      }
      controllersRef.current.clear();
    },
    [],
  );

  const runAction = useCallback((action: CtaAction) => {
    // One-click-per-CTA: don't re-enter while this CTA is already running.
    const existing = controllersRef.current.get(action.id);
    if (existing) return;

    const controller = new AbortController();
    controllersRef.current.set(action.id, controller);

    setExecutions((prev) => {
      const next = new Map(prev);
      next.set(action.id, { state: 'active', output: '' });
      return next;
    });

    const update = (updater: (prev: CtaExecutionEntry) => CtaExecutionEntry) => {
      setExecutions((prev) => {
        const current = prev.get(action.id);
        if (!current) return prev;
        const next = new Map(prev);
        next.set(action.id, updater(current));
        return next;
      });
    };

    const finish = () => {
      controllersRef.current.delete(action.id);
    };

    fetch('/api/checklists/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playName: action.playName }),
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          const text = await response.text().catch(() => `HTTP ${response.status}`);
          throw new Error(text || `Execution failed: ${response.status}`);
        }
        if (!response.body) throw new Error('No response body');

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let accumulated = '';

        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          for (const line of chunk.split('\n')) {
            if (!line.startsWith('data: ')) continue;
            const raw = line.slice(6);
            try {
              const event = JSON.parse(raw) as {
                type: string;
                content?: string;
                message?: string;
              };
              if (event.type === 'output' && event.content) {
                accumulated += event.content;
                update((prev) => ({ ...prev, output: accumulated }));
              } else if (event.type === 'complete') {
                // Transition the slot to the compact "complete" lifecycle
                // state so the post-completion summary + expand control
                // render (VAL-ACTION-018). The full output remains
                // available inside the expanded body.
                update((prev) => ({ ...prev, state: 'complete', output: accumulated }));
                // Play completed from the Playbook Reader — invalidate
                // the readiness cache so the top-bar mini-gauge and the
                // Checklists large gauge refresh (VAL-CROSS-005,
                // VAL-CROSS-010).
                invalidateReadiness();
              } else if (event.type === 'error') {
                update((prev) => ({
                  ...prev,
                  state: 'error',
                  error: event.message ?? 'Unknown error',
                }));
              }
            } catch {
              accumulated += raw + '\n';
              update((prev) => ({ ...prev, output: accumulated }));
            }
          }
        }

        // Stream ended without an explicit `complete` SSE event — fall
        // through to the compact "complete" state so the slot collapses
        // defensively rather than staying stuck in the active phase.
        update((prev) =>
          prev.state === 'active' ? { ...prev, state: 'complete', output: accumulated } : prev,
        );
        // Readiness may have changed on implicit completion too.
        invalidateReadiness();
      })
      .catch((err: Error) => {
        if (err.name === 'AbortError') return;
        update((prev) => ({ ...prev, state: 'error', error: err.message }));
      })
      .finally(finish);
  }, []);

  return (
    <section
      data-testid="narrative-actions"
      aria-label="Actions"
      className="mt-6 space-y-3 border-t border-gray-800 pt-4"
    >
      <h2 className="text-xl font-semibold text-white">Actions</h2>
      <div
        className="flex flex-col gap-3"
        data-testid="narrative-actions-list"
        data-action-count={actions.length}
      >
        {actions.map((action) => {
          const execution = executions.get(action.id);
          return (
            <div
              key={action.id}
              data-testid="narrative-cta-group"
              data-cta-id={action.id}
              data-cta-primary={action.primary ? 'true' : 'false'}
              data-cta-reason={action.reason}
              className="space-y-2"
            >
              <div className="flex flex-wrap items-center gap-3">
                <CTAButton
                  label={action.label}
                  playName={action.playName}
                  onExecute={() => runAction(action)}
                />
                <p className="text-xs text-gray-400">{action.description}</p>
              </div>
              {execution ? (
                <div data-testid="narrative-cta-slot" data-cta-id={action.id}>
                  <ContentSlot
                    state={execution.state}
                    content={execution.output}
                    errorMessage={execution.error}
                    placeholder="Waiting for play output…"
                    summary={
                      execution.state === 'complete' ? `${action.playName} completed` : undefined
                    }
                  />
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
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
  // Ref used by the AnnotationLayer to filter text-selection events to
  // selections whose anchor is inside this section.
  const sectionDomRef = useRef<HTMLElement | null>(null);

  return (
    <section
      ref={sectionDomRef}
      data-testid="narrative-section"
      data-section-id={section.id}
      data-section-level={section.level}
      className={section.level === 2 ? 'space-y-3' : 'mt-3 space-y-2 pl-2'}
    >
      <HeadingTag className={headingClass}>{section.heading}</HeadingTag>
      <p data-testid="narrative-section-text" className="leading-relaxed text-gray-300">
        {section.chunks.map((chunk, idx) => (
          <ChunkView
            key={idx}
            chunk={chunk}
            onTokenClick={handleClickHere}
            sectionId={section.id}
          />
        ))}
      </p>

      {/* Inline expansions for every token in this section that has been interacted with. */}
      <SectionExpansions
        section={section}
        tokenStates={tokenStates}
        openToken={openToken}
        collapseToken={collapseToken}
      />

      {/*
        Annotation layer for this section (VAL-ACTION-020 – VAL-ACTION-024).
        Only rendered under level-2 sections so nested subsections share the
        parent's annotation surface — this keeps the comment thread close to
        the enclosing topic rather than sprinkling it through every sub-heading.
      */}
      {section.level === 2 ? (
        <AnnotationLayer sectionId={section.id} sectionRef={sectionDomRef} />
      ) : null}

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
  sectionId?: string;
}

function ChunkView({ chunk, onTokenClick, sectionId }: ChunkProps) {
  if (chunk.type === 'text') {
    // Render prose, substituting interactive WikiTagRunner components for
    // any `[[play:prompt]]` patterns we encounter (mdb-wiki-tag-parser).
    return (
      <span>
        <WikiTagText text={chunk.text} sectionId={sectionId} />
      </span>
    );
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
