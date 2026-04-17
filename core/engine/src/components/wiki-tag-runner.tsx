'use client';

/**
 * WikiTagRunner — Interactive wrapper around the presentational {@link WikiTag}
 * component.
 *
 * Responsibilities:
 *   1. Hold the wiki tag lifecycle state (pending → running → complete) and
 *      enforce the forward-only transition rules from
 *      {@link transitionWikiTag} (VAL-ACTION-005).
 *   2. Drive transitions in response to user clicks. Clicking a pending tag
 *      kicks off the associated play via `/api/checklists/execute`; the SSE
 *      stream is consumed into the accumulating result and the state flips
 *      to `running` and eventually `complete`.
 *   3. Be safe to render inside an {@link InlineExpansion} — no client-side
 *      context is required, every runtime dependency is local to the
 *      component (VAL-ACTION-031).
 *
 * The server-side execution contract is the same one used by checklist step
 * CTAs today (`/api/checklists/execute`), which already enforces play-name
 * whitelisting and streams JSON-encoded SSE events. Future work under
 * `mdb-play-execution-bridge` / `mdb-content-slots` may add per-wiki-tag
 * cancellation, timeouts and result persistence; this component's public
 * contract is stable in the face of those changes.
 *
 * Fulfills: mdb-wiki-tag-parser (interactive render layer).
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { WikiTag } from '@/components/wiki-tag';
import { canTransitionWikiTag, transitionWikiTag, type WikiTagState } from '@/lib/wiki-tag-parser';
import { useNarrativeAnnotations } from '@/components/narrative-annotation-context';

export interface WikiTagRunnerProps {
  /** Garura play name to execute when the tag is triggered. */
  readonly play: string;
  /** Prompt passed along with the play invocation. */
  readonly prompt: string;
  /**
   * Initial lifecycle state. Defaults to `pending`. Use `complete` to hydrate
   * a cached result on first render (e.g. when the sidecar already has a
   * stored result for this tag).
   */
  readonly initialState?: WikiTagState;
  /**
   * Seed result when rendering an already-complete tag. Only honoured when
   * `initialState === 'complete'`.
   */
  readonly initialResult?: string;
  /**
   * Override of the execute endpoint. Tests inject a stub URL; production
   * callers should leave this unset and rely on the default
   * `/api/checklists/execute` route.
   */
  readonly executeUrl?: string;
  /**
   * Narrative section id the tag is rendered under. Stored alongside the
   * cached result so the annotation is anchored to the correct section on
   * re-render.
   */
  readonly sectionId?: string;
}

interface SseEvent {
  readonly type: string;
  readonly content?: string;
  readonly message?: string;
}

/** Default SSE endpoint used for play execution. */
const DEFAULT_EXECUTE_URL = '/api/checklists/execute';

export function WikiTagRunner({
  play,
  prompt,
  initialState = 'pending',
  initialResult,
  executeUrl = DEFAULT_EXECUTE_URL,
  sectionId,
}: WikiTagRunnerProps) {
  // Pull the sidecar-backed cache + persistence hooks from the narrative
  // annotation context. When the runner is rendered outside a provider
  // (e.g. legacy sample views, isolated tests) this resolves to the
  // no-op api so the component still functions with `pending` state.
  const annotationCtx = useNarrativeAnnotations();
  const cached = annotationCtx.wikiTagCache.get(`${play}::${prompt}`);
  // Explicit `initialState` prop beats sidecar hydration so tests can
  // force a specific starting state. Otherwise, a cached result seeds
  // the runner into the `complete` lifecycle on first render
  // (VAL-ACTION-025).
  const hydratedInitialState: WikiTagState =
    initialState === 'pending' && cached ? 'complete' : initialState;
  const hydratedInitialResult =
    initialState === 'pending' && cached ? cached.result : (initialResult ?? '');

  const [state, setState] = useState<WikiTagState>(hydratedInitialState);
  const [result, setResult] = useState<string>(
    hydratedInitialState === 'complete' ? hydratedInitialResult : '',
  );
  const [error, setError] = useState<string | null>(null);

  // Use refs so the abort / state guards are visible in the synchronous
  // click handler without depending on React's update cycle.
  const controllerRef = useRef<AbortController | null>(null);
  const stateRef = useRef<WikiTagState>(hydratedInitialState);
  // Latest annotation-context API kept on a ref so long-lived
  // callbacks (like the SSE consumer) do not close over a stale
  // reference after re-renders.
  const annotationCtxRef = useRef(annotationCtx);
  useEffect(() => {
    annotationCtxRef.current = annotationCtx;
  }, [annotationCtx]);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // When the narrative annotation context hydrates asynchronously (fetch
  // from the sidecar), a tag that initially rendered in `pending` should
  // flip to `complete` as soon as a cached entry arrives — otherwise the
  // user would see a spurious "ready to run" affordance for a tag whose
  // result is already stored. We only auto-advance from `pending` →
  // `complete`, never in the reverse direction, so this still satisfies
  // the forward-only lifecycle contract (VAL-ACTION-005).
  useEffect(() => {
    if (!cached) return;
    if (stateRef.current !== 'pending') return;
    stateRef.current = 'complete';
    setState('complete');
    setResult(cached.result);
  }, [cached]);

  useEffect(
    () => () => {
      controllerRef.current?.abort();
      controllerRef.current = null;
    },
    [],
  );

  /**
   * Forward-only state setter — rejects any transition disallowed by
   * {@link canTransitionWikiTag}. The ref mirror guarantees that rapid
   * synchronous transitions (e.g. SSE `complete` arriving while React is
   * mid-flush) still observe the most recently applied state.
   */
  const advance = useCallback((next: WikiTagState) => {
    const current = stateRef.current;
    if (!canTransitionWikiTag(current, next)) return false;
    const applied = transitionWikiTag(current, next);
    stateRef.current = applied;
    setState(applied);
    return applied === next;
  }, []);

  /**
   * Execute (or re-execute) the play. The forward-only lifecycle normally
   * prevents re-entry from `complete`, but a caller can pass `force: true`
   * to rewind the local state to `pending` and kick off a new run — this
   * is how the explicit "re-run" button implements VAL-ACTION-026. The
   * server-side cache upsert overwrites the previous sidecar entry
   * because the `(play, prompt)` tuple yields the same annotation id.
   */
  const runPlay = useCallback(
    (options?: { force?: boolean }) => {
      const force = options?.force === true;
      if (force) {
        // Reset local state before advancing — we bypass the
        // forward-only guard because this is an explicit user action.
        stateRef.current = 'pending';
        setState('pending');
        setResult('');
        setError(null);
      }
      // Only pending tags can kick off an execution. Running / complete
      // clicks are ignored — consistent with the forward-only lifecycle and
      // with the "no re-execute on page load" contract (VAL-ACTION-032).
      if (stateRef.current !== 'pending') return;
      if (controllerRef.current) return; // already in flight
      setError(null);
      setResult('');
      advance('running');
      const controller = new AbortController();
      controllerRef.current = controller;

      (async () => {
        let accumulated = '';
        let errored = false;
        try {
          const response = await fetch(executeUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ playName: play, prompt }),
            signal: controller.signal,
          });

          if (!response.ok) {
            const text = await response.text().catch(() => `HTTP ${response.status}`);
            throw new Error(text || `Execution failed: ${response.status}`);
          }
          if (!response.body) {
            throw new Error('Response has no readable body');
          }

          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';

          // The SSE stream may deliver partial events across chunks, so we
          // keep a buffer of unterminated data until we see a blank line
          // (`\n\n`) which delimits events per the SSE spec.
          for (;;) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });

            let delimiterIdx = buffer.indexOf('\n\n');
            while (delimiterIdx !== -1) {
              const rawEvent = buffer.slice(0, delimiterIdx);
              buffer = buffer.slice(delimiterIdx + 2);
              delimiterIdx = buffer.indexOf('\n\n');

              for (const line of rawEvent.split('\n')) {
                if (!line.startsWith('data: ')) continue;
                const payload = line.slice(6);
                try {
                  const event = JSON.parse(payload) as SseEvent;
                  if (event.type === 'output' && typeof event.content === 'string') {
                    accumulated += event.content;
                    setResult(accumulated);
                  } else if (event.type === 'complete') {
                    advance('complete');
                  } else if (event.type === 'error') {
                    errored = true;
                    setError(event.message ?? 'Unknown error');
                    // Error is terminal — advance to complete so the tag
                    // collapses, preserving the forward-only invariant.
                    advance('complete');
                  }
                } catch {
                  // Treat unparsable payloads as plain text output so the user
                  // still sees *something* rather than a silent stall.
                  accumulated += payload + '\n';
                  setResult(accumulated);
                }
              }
            }
          }

          // Stream closed without an explicit `complete` event. Complete
          // defensively so the UI does not stall in `running` state forever.
          advance('complete');
        } catch (err: unknown) {
          if (err instanceof Error && err.name === 'AbortError') return;
          errored = true;
          const message = err instanceof Error ? err.message : String(err);
          setError(message);
          advance('complete');
        } finally {
          controllerRef.current = null;
        }

        // Persist the result to the sidecar so subsequent renders can
        // hydrate without re-executing the play (VAL-ACTION-025). Errors
        // are NOT persisted — the cache is intended to carry "good"
        // results; an errored run leaves the prior cache entry (if any)
        // intact so the next render can still show the last good result.
        if (!errored && accumulated.length > 0) {
          void annotationCtxRef.current
            .recordWikiTagResult({
              play,
              prompt,
              result: accumulated,
              sectionId,
            })
            .catch(() => undefined);
        }
      })();
    },
    [advance, executeUrl, play, prompt, sectionId],
  );

  const text = `${play}:${prompt}`;
  // Event handler that ignores the synthetic event payload — React
  // passes MouseEvent/KeyboardEvent, but `runPlay` expects an options
  // object, so we funnel clicks through this wrapper.
  const triggerRun = () => runPlay();

  // The presentational WikiTag is unchanged; we just wire its click/expand
  // affordances through a wrapper span so the pending / running click
  // targets include the entire pill. When pending, clicking anywhere on the
  // tag triggers execution.
  if (state === 'pending') {
    return (
      <span
        role="button"
        tabIndex={0}
        data-testid="wiki-tag-runner"
        data-state="pending"
        data-play={play}
        aria-label={`Run ${play} with prompt: ${prompt}`}
        onClick={triggerRun}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            triggerRun();
          }
        }}
        className="cursor-pointer"
      >
        <WikiTag text={text} state="pending" />
      </span>
    );
  }

  if (state === 'running') {
    return (
      <span data-testid="wiki-tag-runner" data-state="running" data-play={play}>
        <WikiTag text={text} state="running" result={result} />
      </span>
    );
  }

  // complete — expose the re-run affordance only when a narrative context
  // is present (i.e. the tag is rendered inside a NarrativeAnnotationProvider).
  // Outside a provider there is no sidecar to overwrite, so a rerun would
  // just leak side effects with no user-visible persistence.
  const reRunAvailable = annotationCtx.context.length > 0;
  return (
    <span data-testid="wiki-tag-runner" data-state="complete" data-play={play}>
      <WikiTag text={text} state="complete" result={error ? `Error: ${error}` : result} />
      {reRunAvailable ? (
        <button
          type="button"
          data-testid="wiki-tag-rerun"
          data-play={play}
          onClick={() => runPlay({ force: true })}
          className="ml-2 rounded border border-emerald-700/40 px-1.5 py-0.5 text-[10px] font-medium text-emerald-300 hover:bg-emerald-900/40"
          aria-label={`Re-run ${play}`}
        >
          re-run
        </button>
      ) : null}
    </span>
  );
}
