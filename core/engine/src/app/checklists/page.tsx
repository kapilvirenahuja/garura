'use client';

import { useCallback, useEffect, useState } from 'react';
import { ReadinessGauge } from '@/components/readiness-gauge';
import { ReadinessBreakdown } from '@/components/readiness-breakdown';
import { ChecklistItem } from '@/components/checklist-item';
import { CTAButton } from '@/components/cta-button';
import { useReadiness } from '@/components/readiness-provider';
import type { ChecklistItemState } from '@/components/checklist-item';

// ---------------------------------------------------------------------------
// Types — mirrors checklist-loader ChecklistDefinition / ChecklistStep
// ---------------------------------------------------------------------------

interface ChecklistStepData {
  readonly id: string;
  readonly label: string;
  readonly description: string;
  readonly play: string;
}

interface ChecklistData {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly category: string;
  readonly steps: ReadonlyArray<ChecklistStepData>;
}

/**
 * Derive the display state for each step in a checklist.
 * First step is in-progress (actionable); all others are locked.
 * (Full sequential-unlock logic will be implemented by mdb-checklist-step-execution)
 */
function deriveStepState(index: number): ChecklistItemState {
  return index === 0 ? 'in-progress' : 'locked';
}

/**
 * Count how many steps are completed (currently 0 in greenfield).
 * Used for the "N / M done" progress indicator.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function countDone(_steps: ReadonlyArray<ChecklistStepData>): number {
  // In greenfield, no steps are done. Full step-completion tracking
  // will be implemented by mdb-checklist-step-execution feature.
  return 0;
}

/**
 * Checklists instrument page.
 *
 * Displays a readiness gauge and guided procedures mapped to Meridian plays.
 * In greenfield state (readiness 0), shows exactly one onboarding checklist with
 * only the first step actionable (CTA visible) and steps 2–5 locked.
 * No empty sections, skeleton UI, or placeholder content.
 *
 * Checklist definitions are loaded from the /api/checklists endpoint, which
 * reads YAML data files at runtime — no step arrays are hardcoded in this
 * component (VAL-CHECK-028).
 *
 * The readiness score and breakdown are consumed from ReadinessProvider context,
 * ensuring the gauge here is consistent with the mini-gauge in the top bar (VAL-CHECK-003).
 *
 * Fulfills: VAL-CHECK-001 (greenfield 0), VAL-CHECK-005 (per-area breakdown),
 *           VAL-CHECK-007 (one checklist in greenfield), VAL-CHECK-008 (5 steps),
 *           VAL-CHECK-009 (first step actionable, rest locked),
 *           VAL-CHECK-010 (no empty sections), VAL-CHECK-011 (hero gauge centered),
 *           VAL-CHECK-028 (no hardcoded steps)
 */
export default function ChecklistsPage() {
  const { score, breakdown } = useReadiness();
  const [checklists, setChecklists] = useState<ChecklistData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchChecklists = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/checklists');
      if (!res.ok) {
        throw new Error(`Failed to load checklists: ${res.status}`);
      }
      const data = (await res.json()) as { checklists: ChecklistData[] };
      setChecklists(data.checklists);
      setError(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchChecklists();
  }, [fetchChecklists]);

  // In greenfield state (score === 0), show only the onboarding checklist.
  // When score > 0, mid-project view will be implemented by mdb-checklists-midproject.
  const isGreenfield = score === 0;
  const greenfieldChecklist = checklists.find((c) => c.id === 'greenfield-onboarding');
  const activeChecklist = isGreenfield ? greenfieldChecklist : greenfieldChecklist;

  // Compute done count for progress display
  const doneCount = activeChecklist ? countDone(activeChecklist.steps) : 0;
  const totalSteps = activeChecklist ? activeChecklist.steps.length : 0;

  return (
    <div data-testid="checklists-view">
      {/* Hero readiness gauge — centered prominently (VAL-CHECK-011) */}
      <div className="mb-10 flex flex-col items-center gap-3" data-testid="checklists-hero">
        <ReadinessGauge score={score} />
        <p className="text-center text-sm text-gray-400" data-testid="hero-supporting-text">
          {score === 0
            ? "Your project isn't flying yet — let's get started."
            : `${score}% of plays can run with current artifacts.`}
        </p>
        {/* Per-area breakdown — only show when there is breakdown data (VAL-CHECK-005) */}
        {breakdown.length > 0 && <ReadinessBreakdown breakdown={breakdown} />}
      </div>

      {/* Error state — only when fetch fails */}
      {error && !loading && (
        <div
          data-testid="checklists-error"
          className="mx-auto max-w-2xl rounded-lg border border-red-800 bg-red-900/20 p-4 text-center"
        >
          <p className="text-sm text-red-400">Unable to load checklists: {error}</p>
        </div>
      )}

      {/* Onboarding checklist — exactly one checklist in greenfield (VAL-CHECK-007)
          No loading skeleton, no empty sections (VAL-CHECK-010) */}
      {!loading && !error && activeChecklist && (
        <section
          data-testid="checklist-card"
          className="mx-auto max-w-2xl"
          aria-label={activeChecklist.title}
        >
          {/* Checklist card header with title + progress */}
          <div className="rounded-t-lg border border-b-0 border-gray-700 bg-gray-900/80 px-6 py-4">
            <div className="flex items-center justify-between">
              <h2
                className="text-base font-semibold uppercase tracking-wide text-white"
                data-testid="checklist-title"
              >
                {activeChecklist.title}
              </h2>
              <span className="text-sm tabular-nums text-gray-400" data-testid="checklist-progress">
                {doneCount} / {totalSteps} done
              </span>
            </div>
          </div>

          {/* Steps list */}
          <div
            className="divide-y divide-gray-800/50 rounded-b-lg border border-gray-700 bg-gray-900/50"
            data-testid="checklist-steps"
          >
            {activeChecklist.steps.map((step, index) => {
              const state = deriveStepState(index);
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

                  {/* CTA button — only for actionable steps (VAL-CHECK-009) */}
                  {isActionable && (
                    <div className="mt-3 pl-9" data-testid="step-cta-container">
                      <CTAButton
                        label={step.label}
                        playName={step.play}
                        onExecute={(playName) => {
                          // Play execution will be implemented by mdb-checklist-step-execution
                          console.log(`[mdb] Executing play: ${playName}`);
                        }}
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
        </section>
      )}
    </div>
  );
}
