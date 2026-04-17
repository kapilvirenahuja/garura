'use client';

import { useState, useCallback } from 'react';
import { ChecklistItem } from '@/components/checklist-item';
import { ContentSlot } from '@/components/content-slot';
import { CTAButton } from '@/components/cta-button';
import type { ChecklistItemState } from '@/components/checklist-item';
import type { ActiveExecution } from '@/hooks/use-step-execution';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ChecklistCardStatus = 'not-started' | 'in-progress' | 'completed';

export interface ChecklistStepData {
  readonly id: string;
  readonly label: string;
  readonly description: string;
  readonly play: string;
}

export interface ChecklistCardProps {
  /** Unique checklist ID */
  readonly id: string;
  /** Checklist title */
  readonly title: string;
  /** Steps in this checklist */
  readonly steps: ReadonlyArray<ChecklistStepData>;
  /** Number of completed steps */
  readonly completedSteps: number;
  /** Total number of steps */
  readonly totalSteps: number;
  /** Overall status of this checklist */
  readonly status: ChecklistCardStatus;
  /** Whether the card starts expanded (default: false) */
  readonly defaultExpanded?: boolean;
  /** Whether this card is in the completed (muted) section */
  readonly muted?: boolean;
  /** Callback when a step CTA is triggered — receives playName and stepId */
  readonly onStepExecute?: (playName: string, stepId: string) => void;
  /**
   * Active execution state — if the executing step belongs to this checklist,
   * a ContentSlot renders below the step and the CTA is hidden.
   */
  readonly activeExecution?: ActiveExecution | null;
  /**
   * Whether CTA interaction is globally disabled (e.g., another checklist
   * is running a step). Prevents multiple concurrent executions.
   * (VAL-CHECK-024)
   */
  readonly ctaDisabled?: boolean;
  /**
   * Elapsed seconds for current execution — enables long-running play
   * visual feedback (VAL-CHECK-043).
   */
  readonly elapsedSeconds?: number;
}

// ---------------------------------------------------------------------------
// Status badge config
// ---------------------------------------------------------------------------

const STATUS_CONFIG: Record<
  ChecklistCardStatus,
  { icon: string; colorClass: string; label: string }
> = {
  'not-started': { icon: '○', colorClass: 'text-gray-400', label: 'Not Started' },
  'in-progress': { icon: '◐', colorClass: 'text-amber-400', label: 'In Progress' },
  completed: { icon: '●', colorClass: 'text-emerald-400', label: 'Completed' },
};

/**
 * Derive the display state for each step in a checklist.
 * Steps before completedSteps are done, the next is in-progress (actionable),
 * and subsequent ones are locked.
 */
function deriveStepState(index: number, completedSteps: number): ChecklistItemState {
  if (index < completedSteps) return 'done';
  if (index === completedSteps) return 'in-progress';
  return 'locked';
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Expandable/collapsible checklist card with step execution support.
 *
 * When collapsed: shows title, progress (N/M done), and status marker.
 * When expanded: shows all steps with states, CTA for actionable step,
 * ContentSlot below executing step.
 * Completed checklists render with muted styling.
 *
 * Fulfills: VAL-CHECK-013 (title, progress, status without expanding),
 *           VAL-CHECK-014 (expand/collapse toggling),
 *           VAL-CHECK-018 (sequential unlock),
 *           VAL-CHECK-019 (step metadata display),
 *           VAL-CHECK-021 (ContentSlot below active step),
 *           VAL-CHECK-022 (completed steps show checkmark, not retriggerable),
 *           VAL-CHECK-024 (one CTA active at a time)
 */
export function ChecklistCard({
  id,
  title,
  steps,
  completedSteps,
  totalSteps,
  status,
  defaultExpanded = false,
  muted = false,
  onStepExecute,
  activeExecution,
  ctaDisabled = false,
  elapsedSeconds = 0,
}: ChecklistCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const statusConfig = STATUS_CONFIG[status];

  // Does the provided execution belong to THIS checklist at all?
  // Used to gate ContentSlot visibility (persists after completion so the
  // slot stays visible — VAL-CHECK-021).
  const isExecutionAttachedHere = activeExecution != null && activeExecution.checklistId === id;
  // Narrower: is that execution still running (for CTA gating)?
  const isExecutingHere = isExecutionAttachedHere && activeExecution?.status === 'running';

  const executionStepId = isExecutionAttachedHere ? (activeExecution?.stepId ?? null) : null;

  const handleToggle = useCallback(() => {
    setExpanded((prev) => !prev);
  }, []);

  const handleStepExecute = useCallback(
    (playName: string, stepId: string) => {
      onStepExecute?.(playName, stepId);
    },
    [onStepExecute],
  );

  return (
    <div
      data-testid="checklist-card"
      data-checklist-id={id}
      data-status={status}
      data-expanded={expanded}
      className={`overflow-hidden rounded-lg border ${
        muted ? 'border-gray-800 bg-gray-900/30 opacity-60' : 'border-gray-700 bg-gray-900/50'
      }`}
    >
      {/* Card header — always visible, clickable to toggle */}
      <button
        type="button"
        data-testid="checklist-card-header"
        onClick={handleToggle}
        className={`flex w-full items-center justify-between px-6 py-4 text-left transition-colors ${
          muted ? 'hover:bg-gray-800/20' : 'hover:bg-gray-800/50'
        }`}
      >
        <div className="flex items-center gap-3">
          {/* Expand/collapse chevron */}
          <span
            data-testid="checklist-card-chevron"
            className={`text-gray-500 transition-transform ${expanded ? 'rotate-90' : ''}`}
          >
            ▸
          </span>
          <h3
            className={`text-sm font-semibold uppercase tracking-wide ${
              muted ? 'text-gray-500' : 'text-white'
            }`}
            data-testid="checklist-card-title"
          >
            {title}
          </h3>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`text-sm tabular-nums ${muted ? 'text-gray-600' : 'text-gray-400'}`}
            data-testid="checklist-card-progress"
          >
            {completedSteps} / {totalSteps} done
          </span>
          <span
            className={`text-sm ${statusConfig.colorClass}`}
            data-testid="checklist-card-status"
            title={statusConfig.label}
          >
            {statusConfig.icon}
          </span>
        </div>
      </button>

      {/* Expanded content — steps list */}
      {expanded && (
        <div
          data-testid="checklist-card-steps"
          className="divide-y divide-gray-800/50 border-t border-gray-800"
        >
          {steps.map((step, index) => {
            const state = deriveStepState(index, completedSteps);
            const isDone = state === 'done';
            const isActionable = state === 'in-progress' || state === 'pending';
            const isLocked = state === 'locked';
            // Is an execution (running or recently completed) attached to this step?
            const isStepExecutionAttached = executionStepId === step.id;
            // Narrower: is the step still running (drives running indicator)?
            const isStepRunning = isStepExecutionAttached && isExecutingHere;

            // Show CTA only when actionable, not muted, and no other execution
            // is running globally (VAL-CHECK-024). A completed execution
            // attached to an earlier step does NOT suppress CTAs on later
            // actionable steps.
            const showCta = isActionable && !muted && !isStepRunning && !ctaDisabled;

            return (
              <div
                key={step.id}
                data-testid="checklist-step"
                data-step-id={step.id}
                data-step-state={state}
                className={`px-6 py-4 ${isLocked ? 'opacity-50' : ''}`}
              >
                {/* Step icon + label + completion indicator */}
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 pt-0.5">
                    <ChecklistItem label={step.label} state={state} />
                  </div>
                  {/* Checkmark badge for completed steps (VAL-CHECK-022) */}
                  {isDone && (
                    <span
                      className="ml-auto text-xs font-medium text-emerald-500"
                      data-testid="step-complete-badge"
                    >
                      ✓
                    </span>
                  )}
                </div>

                {/* Step description (VAL-CHECK-019) */}
                <div className={`mt-1 pl-9 ${isLocked ? 'text-gray-600' : 'text-gray-400'}`}>
                  <p className="text-sm" data-testid="step-description">
                    {step.description}
                  </p>
                </div>

                {/* Play reference — visible for ALL steps, dimmed for locked (VAL-CHECK-019) */}
                <div className="mt-1 pl-9">
                  <span
                    className={`text-xs ${isLocked ? 'text-gray-600' : 'text-gray-500'}`}
                    data-testid="step-play-ref"
                  >
                    → {step.play}
                  </span>
                </div>

                {/* CTA button — only for actionable, non-executing steps (VAL-CHECK-024) */}
                {showCta && (
                  <div className="mt-3 pl-9" data-testid="step-cta-container">
                    <CTAButton
                      label={step.label}
                      playName={step.play}
                      onExecute={(playName) => handleStepExecute(playName, step.id)}
                    />
                  </div>
                )}

                {/* Running indicator — only while still running (VAL-CHECK-043) */}
                {isStepRunning && (
                  <div className="mt-2 pl-9" data-testid="step-executing-indicator">
                    <span className="inline-flex items-center gap-2 text-xs text-blue-400">
                      <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-blue-400" />
                      Running {step.play}…
                      {elapsedSeconds > 0 && (
                        <span className="tabular-nums text-gray-500" data-testid="elapsed-time">
                          ({elapsedSeconds}s)
                        </span>
                      )}
                    </span>
                  </div>
                )}

                {/* ContentSlot — streams output below active step (VAL-CHECK-021).
                    Remains visible after completion so the user (and
                    browser-based tests) can observe the final output. */}
                {isStepExecutionAttached &&
                  activeExecution &&
                  activeExecution.status !== 'error' && (
                    <div className="mt-3 pl-9" data-testid="step-content-slot">
                      <ContentSlot
                        state="active"
                        content={activeExecution.output}
                        placeholder={`Executing ${step.play}…`}
                      />
                    </div>
                  )}

                {/* ContentSlot error state (VAL-CHECK-038) */}
                {isStepExecutionAttached &&
                  activeExecution &&
                  activeExecution.status === 'error' && (
                    <div className="mt-3 pl-9" data-testid="step-error-slot">
                      <ContentSlot
                        state="error"
                        content={activeExecution.output}
                        errorMessage={activeExecution.error}
                      />
                    </div>
                  )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
