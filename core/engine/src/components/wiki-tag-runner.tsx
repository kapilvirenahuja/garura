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
}: WikiTagRunnerProps) {
  const [state, setState] = useState<WikiTagState>(initialState);
  const [result, setResult] = useState<string>(
    initialState === 'complete' && typeof initialResult === 'string' ? initialResult : '',
  );
  const [error, setError] = useState<string | null>(null);

  // Use refs so the abort / state guards are visible in the synchronous
  // click handler without depending on React's update cycle.
  const controllerRef = useRef<AbortController | null>(null);
  const stateRef = useRef<WikiTagState>(initialState);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

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

  const runPlay = useCallback(() => {
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
        const message = err instanceof Error ? err.message : String(err);
        setError(message);
        advance('complete');
      } finally {
        controllerRef.current = null;
      }
    })();
  }, [advance, executeUrl, play, prompt]);

  const text = `${play}:${prompt}`;

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
        onClick={runPlay}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            runPlay();
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

  // complete
  return (
    <span data-testid="wiki-tag-runner" data-state="complete" data-play={play}>
      <WikiTag text={text} state="complete" result={error ? `Error: ${error}` : result} />
    </span>
  );
}
