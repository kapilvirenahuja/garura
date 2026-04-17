'use client';

import { useState, useCallback } from 'react';
import { ChecklistItem } from '@/components/checklist-item';
import { CTAButton } from '@/components/cta-button';
import type { ChecklistItemState } from '@/components/checklist-item';

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
  /** Callback when a step CTA is triggered */
  readonly onStepExecute?: (playName: string) => void;
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
 * Expandable/collapsible checklist card for the mid-project view.
 *
 * When collapsed: shows title, progress (N/M done), and status marker.
 * When expanded: shows all steps with their states.
 * Completed checklists render with muted styling.
 *
 * Fulfills: VAL-CHECK-013 (title, progress, status without expanding),
 *           VAL-CHECK-014 (expand/collapse toggling)
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
}: ChecklistCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const statusConfig = STATUS_CONFIG[status];

  const handleToggle = useCallback(() => {
    setExpanded((prev) => !prev);
  }, []);

  const handleStepExecute = useCallback(
    (playName: string) => {
      onStepExecute?.(playName);
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
            const isActionable = state === 'in-progress' || state === 'pending';
            const isLocked = state === 'locked';

            return (
              <div
                key={step.id}
                data-testid="checklist-step"
                data-step-id={step.id}
                data-step-state={state}
                className={`px-6 py-4 ${isLocked ? 'opacity-50' : ''}`}
              >
                {/* Step icon + label */}
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 pt-0.5">
                    <ChecklistItem label={step.label} state={state} />
                  </div>
                </div>

                {/* Step description */}
                <div className={`mt-1 pl-9 ${isLocked ? 'text-gray-600' : 'text-gray-400'}`}>
                  <p className="text-sm" data-testid="step-description">
                    {step.description}
                  </p>
                </div>

                {/* CTA button — only for actionable steps */}
                {isActionable && !muted && (
                  <div className="mt-3 pl-9" data-testid="step-cta-container">
                    <CTAButton
                      label={step.label}
                      playName={step.play}
                      onExecute={(playName) => handleStepExecute(playName)}
                    />
                    <span className="ml-3 text-xs text-gray-500" data-testid="step-play-ref">
                      → {step.play}
                    </span>
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
