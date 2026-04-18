'use client';

/**
 * Step Execution Hook
 *
 * Manages checklist step execution state: which steps are completed,
 * which step is currently executing, and streaming output from play execution.
 *
 * Enforces:
 * - Sequential unlock (step N+1 only after step N completes)
 * - One CTA active per checklist at a time (VAL-CHECK-024)
 * - Different checklists CAN execute concurrently
 * - Completion state tracking
 *
 * Fulfills: VAL-CHECK-018 (sequential unlock),
 *           VAL-CHECK-020 (CTA triggers play execution),
 *           VAL-CHECK-021 (ContentSlot streaming),
 *           VAL-CHECK-022 (completed not retriggerable),
 *           VAL-CHECK-023 (next step unlocks on completion),
 *           VAL-CHECK-024 (one CTA active per checklist at a time),
 *           VAL-CHECK-033 (concurrent ContentSlots render independently)
 */

import { useState, useCallback, useRef } from 'react';
import { invalidateReadiness } from '@/components/readiness-provider';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Represents an active play execution */
export interface ExecutionNotification {
  readonly kind: 'activity' | 'question' | 'approval';
  readonly title: string;
  readonly message: string;
  readonly details?: string;
  readonly prompt?: string;
  readonly timestamp: number;
}

export interface PendingUserInput {
  readonly kind: 'question' | 'approval';
  readonly title: string;
  readonly summary: string;
  readonly details: string;
  readonly prompt: string;
}

export interface StepExecutionConfig {
  readonly playName: string;
  readonly execution?: {
    readonly runner: 'garura' | 'claude-headless';
    readonly prompt?: string;
  };
}

type StepExecutionArg = StepExecutionConfig | string;

export interface ActiveExecution {
  /** Checklist that owns the executing step */
  readonly checklistId: string;
  /** Step being executed */
  readonly stepId: string;
  /** Play being run */
  readonly playName: string;
  /** Accumulated streaming output */
  readonly output: string;
  /** Execution status */
  readonly status: 'running' | 'complete' | 'error' | 'needs-input' | 'needs-approval';
  /** Error message (only when status is 'error') */
  readonly error?: string;
  /** Claude session id for resumable headless sessions. */
  readonly sessionId?: string;
  /** Latest pending question / approval request surfaced by the backend. */
  readonly pendingUserInput?: PendingUserInput;
  /** Rolling notifications and activity surfaced during execution. */
  readonly notifications?: ReadonlyArray<ExecutionNotification>;
}

/** Return value of useStepExecution */
export interface StepExecutionApi {
  /** Currently active executions keyed by checklistId */
  readonly activeExecutions: ReadonlyMap<string, ActiveExecution>;
  /**
   * Currently active execution for a single checklist, null if idle.
   * @deprecated Use activeExecutions map and getExecution() instead.
   * Kept for backward compat — returns the first running execution or null.
   */
  readonly activeExecution: ActiveExecution | null;
  /** Map of checklistId → number of completed steps */
  readonly completedCounts: ReadonlyMap<string, number>;
  /** Execute a step's play */
  readonly executeStep: (checklistId: string, stepId: string, config: StepExecutionArg) => void;
  /** Continue a paused execution with the user's answer / approval text. */
  readonly respondToExecution: (checklistId: string, response: string) => void;
  /** Get the completed step count for a checklist */
  readonly getCompletedCount: (checklistId: string) => number;
  /** Whether any execution is running globally */
  readonly isExecuting: boolean;
  /** Whether a specific checklist is currently executing */
  readonly isChecklistExecuting: (checklistId: string) => boolean;
  /** Get the active execution for a specific checklist */
  readonly getExecution: (checklistId: string) => ActiveExecution | null;
  /** Initialize completed counts (e.g., from API data) */
  readonly initCompletedCounts: (counts: ReadonlyMap<string, number>) => void;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useStepExecution(): StepExecutionApi {
  const [activeExecutions, setActiveExecutions] = useState<Map<string, ActiveExecution>>(new Map());
  const [completedCounts, setCompletedCounts] = useState<Map<string, number>>(new Map());
  const abortControllersRef = useRef<Map<string, AbortController>>(new Map());
  // Timestamp of the last accepted executeStep call per checklist. Used to
  // reject rapid clicks that bypass the per-CTAButton ref guard — e.g.
  // when step N's CTA is clicked, completes instantly, and step N+1's CTA
  // re-renders in place to be clicked again within the 500ms debounce
  // window. This is a synchronous, checklist-level debounce (VAL-CHECK-035).
  const lastExecuteAtRef = useRef<Map<string, number>>(new Map());

  // `isExecuting` reflects *running* executions only — completed executions
  // remain in the map so their ContentSlot stays visible after completion
  // (VAL-CHECK-021), but they should not block new step triggers.
  const isExecuting = Array.from(activeExecutions.values()).some(
    (exec) => exec.status === 'running',
  );

  // Backward-compat: return first running execution or null
  const activeExecution: ActiveExecution | null = (() => {
    for (const exec of activeExecutions.values()) {
      if (exec.status === 'running') return exec;
    }
    return null;
  })();

  const getCompletedCount = useCallback(
    (checklistId: string): number => {
      return completedCounts.get(checklistId) ?? 0;
    },
    [completedCounts],
  );

  const isChecklistExecuting = useCallback(
    (checklistId: string): boolean => {
      const exec = activeExecutions.get(checklistId);
      return exec != null && exec.status === 'running';
    },
    [activeExecutions],
  );

  const getExecution = useCallback(
    (checklistId: string): ActiveExecution | null => {
      return activeExecutions.get(checklistId) ?? null;
    },
    [activeExecutions],
  );

  const initCompletedCounts = useCallback((counts: ReadonlyMap<string, number>) => {
    setCompletedCounts(new Map(counts));
  }, []);

  const appendNotification = useCallback(
    (checklistId: string, notification: ExecutionNotification) => {
      setActiveExecutions((prev) => {
        const current = prev.get(checklistId);
        if (!current) return prev;
        const next = new Map(prev);
        next.set(checklistId, {
          ...current,
          notifications: [...(current.notifications ?? []), notification].slice(-8),
        });
        return next;
      });
    },
    [],
  );

  const markStepComplete = useCallback((checklistId: string) => {
    setCompletedCounts((prev) => {
      const next = new Map(prev);
      next.set(checklistId, (next.get(checklistId) ?? 0) + 1);
      return next;
    });
  }, []);

  const streamExecution = useCallback(
    (
      checklistId: string,
      stepId: string,
      configOrPlayName: StepExecutionArg,
      options?: { readonly sessionId?: string; readonly response?: string },
    ) => {
      const config =
        typeof configOrPlayName === 'string'
          ? ({ playName: configOrPlayName } satisfies StepExecutionConfig)
          : configOrPlayName;
      // Synchronous checklist-level debounce (VAL-CHECK-035). Rejects any
      // call within 500ms of the previous accepted call on the same
      // checklist — even if the click came from a different CTA button
      // that re-rendered after the previous step completed instantly.
      const now = Date.now();
      const last = lastExecuteAtRef.current.get(checklistId) ?? 0;
      if (now - last < 500) return;

      // Prevent concurrent executions within the SAME checklist (VAL-CHECK-024)
      // Different checklists CAN execute concurrently (VAL-CHECK-033)
      const existing = activeExecutions.get(checklistId);
      if (existing?.status === 'running') return;

      lastExecuteAtRef.current.set(checklistId, now);

      // Cancel any previous connection for THIS checklist only
      abortControllersRef.current.get(checklistId)?.abort();
      const controller = new AbortController();
      abortControllersRef.current.set(checklistId, controller);

      // Set initial execution state for this checklist
      const newExecution: ActiveExecution = {
        checklistId,
        stepId,
        playName: config.playName,
        output: existing?.stepId === stepId ? existing.output : '',
        status: 'running',
        sessionId: options?.sessionId ?? existing?.sessionId,
        notifications: existing?.stepId === stepId ? [...(existing.notifications ?? [])] : [],
      };

      setActiveExecutions((prev) => {
        const next = new Map(prev);
        next.set(checklistId, newExecution);
        return next;
      });

      // Stream play output from the execution endpoint
      fetch('/api/checklists/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playName: config.playName,
          execution: config.execution,
          sessionId: options?.sessionId,
          userResponse: options?.response,
        }),
        signal: controller.signal,
      })
        .then(async (response) => {
          if (!response.ok) {
            const text = await response.text().catch(() => `HTTP ${response.status}`);
            throw new Error(text || `Execution failed: ${response.status}`);
          }
          if (!response.body) {
            throw new Error('No response body');
          }

          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let accumulated = '';
          let markedComplete = false;
          let hasError = false;

          for (;;) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });

            // Parse SSE events (data: {...}\n\n)
            const lines = chunk.split('\n');
            for (const line of lines) {
              if (!line.startsWith('data: ')) continue;

              const raw = line.slice(6);
              try {
                const event = JSON.parse(raw) as {
                  type: string;
                  content?: string;
                  message?: string;
                  sessionId?: string;
                  title?: string;
                  summary?: string;
                  details?: string;
                  prompt?: string;
                  label?: string;
                };

                if (event.type === 'output' && event.content) {
                  accumulated += event.content;
                  setActiveExecutions((prev) => {
                    const current = prev.get(checklistId);
                    if (!current) return prev;
                    const next = new Map(prev);
                    next.set(checklistId, { ...current, output: accumulated });
                    return next;
                  });
                } else if (event.type === 'session' && event.sessionId) {
                  setActiveExecutions((prev) => {
                    const current = prev.get(checklistId);
                    if (!current) return prev;
                    const next = new Map(prev);
                    next.set(checklistId, { ...current, sessionId: event.sessionId });
                    return next;
                  });
                } else if (event.type === 'activity' && event.label) {
                  appendNotification(checklistId, {
                    kind: 'activity',
                    title: 'Claude activity',
                    message: event.label,
                    timestamp: Date.now(),
                  });
                } else if (event.type === 'needs_input' || event.type === 'needs_approval') {
                  const kind = event.type === 'needs_approval' ? 'approval' : 'question';
                  const pendingUserInput: PendingUserInput = {
                    kind,
                    title: event.title ?? (kind === 'approval' ? 'Approval needed' : 'Question'),
                    summary: event.summary ?? '',
                    details: event.details ?? '',
                    prompt: event.prompt ?? event.message ?? 'Reply to continue.',
                  };
                  setActiveExecutions((prev) => {
                    const current = prev.get(checklistId);
                    if (!current) return prev;
                    const next = new Map(prev);
                    next.set(checklistId, {
                      ...current,
                      status: kind === 'approval' ? 'needs-approval' : 'needs-input',
                      pendingUserInput,
                    });
                    return next;
                  });
                  appendNotification(checklistId, {
                    kind,
                    title: pendingUserInput.title,
                    message: pendingUserInput.summary || pendingUserInput.prompt,
                    details: pendingUserInput.details,
                    prompt: pendingUserInput.prompt,
                    timestamp: Date.now(),
                  });
                } else if (event.type === 'complete') {
                  markedComplete = true;
                  setActiveExecutions((prev) => {
                    const current = prev.get(checklistId);
                    if (!current) return prev;
                    const next = new Map(prev);
                    next.set(checklistId, {
                      ...current,
                      status: 'complete',
                      pendingUserInput: undefined,
                    });
                    return next;
                  });
                  markStepComplete(checklistId);
                  // Readiness may have changed — tell every gauge to refetch
                  // (VAL-CROSS-010). Safe no-op in non-DOM environments.
                  invalidateReadiness();
                  // NOTE: Execution is intentionally NOT deleted from the map
                  // on completion (VAL-CHECK-021). Keeping the completed output
                  // in state ensures the ContentSlot stays visible after the
                  // play finishes, so the user (and browser-based tests) can
                  // observe the final output. The entry is replaced when the
                  // next step in the checklist is triggered.
                } else if (event.type === 'error') {
                  // Play failure — step remains active, NOT marked done (VAL-CHECK-037)
                  hasError = true;
                  markedComplete = true; // prevent auto-complete fallback
                  setActiveExecutions((prev) => {
                    const current = prev.get(checklistId);
                    if (!current) return prev;
                    const next = new Map(prev);
                    next.set(checklistId, {
                      ...current,
                      status: 'error',
                      error: event.message ?? 'Unknown error',
                    });
                    return next;
                  });
                }
              } catch {
                // Non-JSON data line — treat as raw output
                accumulated += raw + '\n';
                setActiveExecutions((prev) => {
                  const current = prev.get(checklistId);
                  if (!current) return prev;
                  const next = new Map(prev);
                  next.set(checklistId, { ...current, output: accumulated });
                  return next;
                });
              }
            }
          }

          // Stream ended without explicit complete event — mark complete only if no error.
          // As with the explicit 'complete' branch above, the execution entry is retained
          // so the ContentSlot remains visible after the stream ends (VAL-CHECK-021).
          if (!markedComplete && !hasError) {
            setActiveExecutions((prev) => {
              const current = prev.get(checklistId);
              if (current && current.status === 'running') {
                markStepComplete(checklistId);
                const next = new Map(prev);
                next.set(checklistId, { ...current, status: 'complete' });
                return next;
              }
              return prev;
            });
            // Same readiness-invalidation signal as the explicit
            // `complete` event branch (VAL-CROSS-010).
            invalidateReadiness();
          }
        })
        .catch((err: Error) => {
          if (err.name === 'AbortError') return;
          // Network error — step remains active, NOT marked done (VAL-CHECK-039)
          setActiveExecutions((prev) => {
            const current = prev.get(checklistId);
            if (!current) return prev;
            const next = new Map(prev);
            next.set(checklistId, { ...current, status: 'error', error: err.message });
            return next;
          });
        });
    },
    [activeExecutions, appendNotification, markStepComplete],
  );

  const executeStep = useCallback(
    (checklistId: string, stepId: string, config: StepExecutionArg) => {
      streamExecution(checklistId, stepId, config);
    },
    [streamExecution],
  );

  const respondToExecution = useCallback(
    (checklistId: string, response: string) => {
      const existing = activeExecutions.get(checklistId);
      if (!existing || !existing.sessionId) return;
      appendNotification(checklistId, {
        kind: 'activity',
        title: 'User reply',
        message: 'Response sent to Claude',
        details: response,
        timestamp: Date.now(),
      });
      streamExecution(
        checklistId,
        existing.stepId,
        { playName: existing.playName, execution: { runner: 'claude-headless' } },
        { sessionId: existing.sessionId, response },
      );
    },
    [activeExecutions, appendNotification, streamExecution],
  );

  return {
    activeExecutions,
    activeExecution,
    completedCounts,
    executeStep,
    respondToExecution,
    getCompletedCount,
    isExecuting,
    isChecklistExecuting,
    getExecution,
    initCompletedCounts,
  };
}
