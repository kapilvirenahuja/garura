'use client';

/**
 * Step Execution Hook
 *
 * Manages checklist step execution state: which steps are completed,
 * which step is currently executing, and streaming output from play execution.
 *
 * Enforces:
 * - Sequential unlock (step N+1 only after step N completes)
 * - One CTA active at a time (across all checklists)
 * - Completion state tracking
 *
 * Fulfills: VAL-CHECK-018 (sequential unlock),
 *           VAL-CHECK-020 (CTA triggers play execution),
 *           VAL-CHECK-021 (ContentSlot streaming),
 *           VAL-CHECK-022 (completed not retriggerable),
 *           VAL-CHECK-023 (next step unlocks on completion),
 *           VAL-CHECK-024 (one CTA active at a time)
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
  /** Currently active execution, null if idle */
  readonly activeExecution: ActiveExecution | null;
  /** Map of checklistId → number of completed steps */
  readonly completedCounts: ReadonlyMap<string, number>;
  /** Execute a step's play */
  readonly executeStep: (checklistId: string, stepId: string, playName: string) => void;
  /** Get the completed step count for a checklist */
  readonly getCompletedCount: (checklistId: string) => number;
  /** Whether any execution is running globally */
  readonly isExecuting: boolean;
  /** Initialize completed counts (e.g., from API data) */
  readonly initCompletedCounts: (counts: ReadonlyMap<string, number>) => void;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useStepExecution(): StepExecutionApi {
  const [activeExecution, setActiveExecution] = useState<ActiveExecution | null>(null);
  const [completedCounts, setCompletedCounts] = useState<Map<string, number>>(new Map());
  const abortControllerRef = useRef<AbortController | null>(null);

  const isExecuting = activeExecution?.status === 'running';

  const getCompletedCount = useCallback(
    (checklistId: string): number => {
      return completedCounts.get(checklistId) ?? 0;
    },
    [completedCounts],
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
      // Prevent concurrent executions (VAL-CHECK-024)
      if (isExecuting) return;

      // Cancel any previous connection
      abortControllerRef.current?.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;

      // Set initial execution state
      setActiveExecution({
        checklistId,
        stepId,
        playName,
        output: '',
        status: 'running',
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
                  setActiveExecution((prev) => (prev ? { ...prev, output: accumulated } : null));
                } else if (event.type === 'complete') {
                  markedComplete = true;
                  setActiveExecution((prev) => (prev ? { ...prev, status: 'complete' } : null));
                  markStepComplete(checklistId);
                  // Clear active execution after brief delay to show completion state
                  setTimeout(() => setActiveExecution(null), 300);
                } else if (event.type === 'error') {
                  setActiveExecution((prev) =>
                    prev
                      ? { ...prev, status: 'error', error: event.message ?? 'Unknown error' }
                      : null,
                  );
                }
              } catch {
                // Non-JSON data line — treat as raw output
                accumulated += raw + '\n';
                setActiveExecution((prev) => (prev ? { ...prev, output: accumulated } : null));
              }
            }
          }

          // Stream ended without explicit complete event — mark complete
          if (!markedComplete) {
            setActiveExecution((prev) => {
              if (prev && prev.status === 'running') {
                markStepComplete(checklistId);
                setTimeout(() => setActiveExecution(null), 300);
                return { ...prev, status: 'complete' };
              }
              return prev;
            });
          }
        })
        .catch((err: Error) => {
          if (err.name === 'AbortError') return;
          setActiveExecution((prev) =>
            prev ? { ...prev, status: 'error', error: err.message } : null,
          );
        });
    },
    [isExecuting, markStepComplete],
  );

  return {
    activeExecution,
    completedCounts,
    executeStep,
    getCompletedCount,
    isExecuting,
    initCompletedCounts,
  };
}
