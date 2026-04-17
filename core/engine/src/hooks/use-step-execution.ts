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

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Represents an active play execution */
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
  readonly status: 'running' | 'complete' | 'error';
  /** Error message (only when status is 'error') */
  readonly error?: string;
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
  readonly executeStep: (checklistId: string, stepId: string, playName: string) => void;
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

  const isExecuting = activeExecutions.size > 0;

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

  const markStepComplete = useCallback((checklistId: string) => {
    setCompletedCounts((prev) => {
      const next = new Map(prev);
      next.set(checklistId, (next.get(checklistId) ?? 0) + 1);
      return next;
    });
  }, []);

  const executeStep = useCallback(
    (checklistId: string, stepId: string, playName: string) => {
      // Prevent concurrent executions within the SAME checklist (VAL-CHECK-024)
      // Different checklists CAN execute concurrently (VAL-CHECK-033)
      const existing = activeExecutions.get(checklistId);
      if (existing?.status === 'running') return;

      // Cancel any previous connection for THIS checklist only
      abortControllersRef.current.get(checklistId)?.abort();
      const controller = new AbortController();
      abortControllersRef.current.set(checklistId, controller);

      // Set initial execution state for this checklist
      const newExecution: ActiveExecution = {
        checklistId,
        stepId,
        playName,
        output: '',
        status: 'running',
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
        body: JSON.stringify({ playName }),
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
                } else if (event.type === 'complete') {
                  markedComplete = true;
                  setActiveExecutions((prev) => {
                    const current = prev.get(checklistId);
                    if (!current) return prev;
                    const next = new Map(prev);
                    next.set(checklistId, { ...current, status: 'complete' });
                    return next;
                  });
                  markStepComplete(checklistId);
                  // Clear this checklist's execution after brief delay
                  setTimeout(() => {
                    setActiveExecutions((prev) => {
                      const next = new Map(prev);
                      next.delete(checklistId);
                      return next;
                    });
                  }, 300);
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

          // Stream ended without explicit complete event — mark complete only if no error
          if (!markedComplete && !hasError) {
            setActiveExecutions((prev) => {
              const current = prev.get(checklistId);
              if (current && current.status === 'running') {
                markStepComplete(checklistId);
                const next = new Map(prev);
                next.set(checklistId, { ...current, status: 'complete' });
                setTimeout(() => {
                  setActiveExecutions((p) => {
                    const n = new Map(p);
                    n.delete(checklistId);
                    return n;
                  });
                }, 300);
                return next;
              }
              return prev;
            });
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
    [activeExecutions, markStepComplete],
  );

  return {
    activeExecutions,
    activeExecution,
    completedCounts,
    executeStep,
    getCompletedCount,
    isExecuting,
    isChecklistExecuting,
    getExecution,
    initCompletedCounts,
  };
}
