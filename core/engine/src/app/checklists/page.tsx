'use client';

import { useCallback, useEffect, useState } from 'react';
import { ReadinessGauge } from '@/components/readiness-gauge';
import { ReadinessBreakdown } from '@/components/readiness-breakdown';
import { ChecklistItem } from '@/components/checklist-item';
import { ChecklistCard } from '@/components/checklist-card';
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

/** Mid-project API response types */
interface ChecklistWithMetaData {
  readonly checklist: ChecklistData;
  readonly status: 'not-started' | 'in-progress' | 'completed';
  readonly completedSteps: number;
  readonly totalSteps: number;
  readonly readinessImpact: number;
}

interface MidProjectData {
  readonly active: ReadonlyArray<ChecklistWithMetaData>;
  readonly completed: ReadonlyArray<ChecklistWithMetaData>;
  readonly selectionRationale: string;
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
 * Two layouts based on readiness score:
 * - Greenfield (score === 0): Single onboarding checklist, hero gauge, locked steps.
 * - Mid-project (score > 0): Multiple checklists ranked by readiness impact,
 *   generative region explaining selection, completed checklists at bottom.
 *
 * Checklist definitions are loaded from API endpoints — no step arrays are
 * hardcoded in this component (VAL-CHECK-028).
 *
 * The readiness score and breakdown are consumed from ReadinessProvider context,
 * ensuring the gauge here is consistent with the mini-gauge in the top bar (VAL-CHECK-003).
 *
 * Fulfills: VAL-CHECK-001 (greenfield 0), VAL-CHECK-005 (per-area breakdown),
 *           VAL-CHECK-007 (one checklist in greenfield), VAL-CHECK-008 (5 steps),
 *           VAL-CHECK-009 (first step actionable, rest locked),
 *           VAL-CHECK-010 (no empty sections), VAL-CHECK-011 (hero gauge centered),
 *           VAL-CHECK-012 (multiple checklists in mid-project),
 *           VAL-CHECK-013 (title, progress, status without expanding),
 *           VAL-CHECK-014 (expand/collapse toggling),
 *           VAL-CHECK-015 (completed checklists at bottom),
 *           VAL-CHECK-016 (ordered by readiness impact),
 *           VAL-CHECK-017 (generative region above checklists),
 *           VAL-CHECK-028 (no hardcoded steps)
 */
export default function ChecklistsPage() {
  const { score, breakdown } = useReadiness();

  // Greenfield data
  const [checklists, setChecklists] = useState<ChecklistData[]>([]);

  // Mid-project data
  const [midProjectData, setMidProjectData] = useState<MidProjectData | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isGreenfield = score === 0;

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      if (isGreenfield) {
        // Greenfield: fetch all checklists and show the onboarding one
        const res = await fetch('/api/checklists');
        if (!res.ok) {
          throw new Error(`Failed to load checklists: ${res.status}`);
        }
        const data = (await res.json()) as { checklists: ChecklistData[] };
        setChecklists(data.checklists);
        setMidProjectData(null);
      } else {
        // Mid-project: fetch selected & ordered checklists
        const res = await fetch('/api/checklists/midproject');
        if (!res.ok) {
          throw new Error(`Failed to load mid-project checklists: ${res.status}`);
        }
        const data = (await res.json()) as MidProjectData;
        setMidProjectData(data);
        setChecklists([]);
      }

      setError(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [isGreenfield]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  // Greenfield state — single onboarding checklist
  const greenfieldChecklist = checklists.find((c) => c.id === 'greenfield-onboarding');
  const doneCount = greenfieldChecklist ? countDone(greenfieldChecklist.steps) : 0;
  const totalSteps = greenfieldChecklist ? greenfieldChecklist.steps.length : 0;

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

      {/* ═══════════════════════════════════════════════════════════════════
         GREENFIELD VIEW (score === 0)
         Exactly one onboarding checklist, hero gauge, locked steps.
         ═══════════════════════════════════════════════════════════════════ */}
      {isGreenfield && !loading && !error && greenfieldChecklist && (
        <section
          data-testid="checklist-card"
          className="mx-auto max-w-2xl"
          aria-label={greenfieldChecklist.title}
        >
          {/* Checklist card header with title + progress */}
          <div className="rounded-t-lg border border-b-0 border-gray-700 bg-gray-900/80 px-6 py-4">
            <div className="flex items-center justify-between">
              <h2
                className="text-base font-semibold uppercase tracking-wide text-white"
                data-testid="checklist-title"
              >
                {greenfieldChecklist.title}
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
            {greenfieldChecklist.steps.map((step, index) => {
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

      {/* ═══════════════════════════════════════════════════════════════════
         MID-PROJECT VIEW (score > 0)
         Multiple checklists ranked by readiness impact, generative region,
         completed checklists collapsed at bottom.
         ═══════════════════════════════════════════════════════════════════ */}
      {!isGreenfield && !loading && !error && midProjectData && (
        <div className="mx-auto max-w-2xl space-y-6" data-testid="midproject-checklists">
          {/* Generative region — explains checklist selection (VAL-CHECK-017) */}
          <div
            data-testid="generative-region"
            className="rounded-lg border border-dashed border-gray-600 bg-gray-900/30 px-5 py-4"
          >
            <div className="flex items-start gap-3">
              <span className="text-lg" aria-hidden="true">
                🤖
              </span>
              <p
                className="text-sm leading-relaxed text-gray-300"
                data-testid="selection-rationale"
              >
                {midProjectData.selectionRationale}
              </p>
            </div>
          </div>

          {/* Active checklists — ordered by readiness impact (VAL-CHECK-016) */}
          {midProjectData.active.length > 0 && (
            <div className="space-y-4" data-testid="active-checklists">
              {midProjectData.active.map((item, index) => (
                <ChecklistCard
                  key={item.checklist.id}
                  id={item.checklist.id}
                  title={item.checklist.title}
                  steps={item.checklist.steps}
                  completedSteps={item.completedSteps}
                  totalSteps={item.totalSteps}
                  status={item.status}
                  defaultExpanded={index === 0}
                  onStepExecute={(playName) => {
                    // Play execution will be implemented by mdb-checklist-step-execution
                    console.log(`[mdb] Executing play: ${playName}`);
                  }}
                />
              ))}
            </div>
          )}

          {/* Completed checklists — collapsed at bottom, muted (VAL-CHECK-015) */}
          {midProjectData.completed.length > 0 && (
            <div data-testid="completed-checklists" className="mt-8">
              <div className="mb-3 flex items-center gap-2">
                <span className="text-xs font-medium uppercase tracking-wider text-gray-500">
                  Completed
                </span>
                <div className="h-px flex-1 bg-gray-800" />
              </div>
              <div className="space-y-2">
                {midProjectData.completed.map((item) => (
                  <ChecklistCard
                    key={item.checklist.id}
                    id={item.checklist.id}
                    title={item.checklist.title}
                    steps={item.checklist.steps}
                    completedSteps={item.completedSteps}
                    totalSteps={item.totalSteps}
                    status={item.status}
                    muted
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
