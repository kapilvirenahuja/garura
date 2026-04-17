'use client';

import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { ReadinessGauge } from '@/components/readiness-gauge';
import { ReadinessBreakdown } from '@/components/readiness-breakdown';
import { ChecklistItem } from '@/components/checklist-item';
import { ChecklistCard } from '@/components/checklist-card';
import { ContentSlot } from '@/components/content-slot';
import { CTAButton } from '@/components/cta-button';
import { useReadiness } from '@/components/readiness-provider';
import { useStepExecution } from '@/hooks/use-step-execution';
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

interface RelatedEpicData {
  readonly id: string;
  readonly label?: string;
}

interface ChecklistData {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly category: string;
  readonly steps: ReadonlyArray<ChecklistStepData>;
  readonly relatedEpic?: RelatedEpicData;
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
 * Steps before completedCount are done, the next is in-progress (actionable),
 * and subsequent ones are locked.
 *
 * Fulfills: VAL-CHECK-018 (sequential unlock)
 */
function deriveStepState(index: number, completedCount: number): ChecklistItemState {
  if (index < completedCount) return 'done';
  if (index === completedCount) return 'in-progress';
  return 'locked';
}

/**
 * Checklists instrument page.
 *
 * Two layouts based on readiness score:
 * - Greenfield (score === 0): Single onboarding checklist, hero gauge, locked steps.
 * - Mid-project (score > 0): Multiple checklists ranked by readiness impact,
 *   generative region explaining selection, completed checklists at bottom.
 *
 * Step execution is managed by the useStepExecution hook:
 * - CTA click triggers play execution via SSE (VAL-CHECK-020)
 * - ContentSlot streams output below the active step (VAL-CHECK-021)
 * - Completed steps show checkmark and are not retriggerable (VAL-CHECK-022)
 * - Next step unlocks on completion (VAL-CHECK-023)
 * - Only one CTA active at a time (VAL-CHECK-024)
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
 *           VAL-CHECK-018 (sequential unlock),
 *           VAL-CHECK-020 (CTA triggers play),
 *           VAL-CHECK-021 (ContentSlot streaming),
 *           VAL-CHECK-022 (completed not retriggerable),
 *           VAL-CHECK-023 (next step unlocks),
 *           VAL-CHECK-024 (one CTA active at a time),
 *           VAL-CHECK-028 (no hardcoded steps),
 *           VAL-CHECK-030 (all-done celebratory state),
 *           VAL-CHECK-037 (failed play does not mark step done),
 *           VAL-CHECK-038 (ContentSlot error state),
 *           VAL-CHECK-039 (network error graceful messaging),
 *           VAL-CHECK-040 (checklist definition load failure),
 *           VAL-CHECK-041 (invalid play reference handling),
 *           VAL-CHECK-043 (long-running play visual feedback)
 */
export default function ChecklistsPage() {
  const { score, breakdown } = useReadiness();
  const { activeExecutions, executeStep, getCompletedCount, isChecklistExecuting, getExecution } =
    useStepExecution();

  // Greenfield data
  const [checklists, setChecklists] = useState<ChecklistData[]>([]);

  // Mid-project data
  const [midProjectData, setMidProjectData] = useState<MidProjectData | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Network error toast (VAL-CHECK-039)
  const [networkError, setNetworkError] = useState<string | null>(null);

  // Elapsed time tracker for long-running plays (VAL-CHECK-043)
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const elapsedTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isGreenfield = score === 0;

  // Track whether any execution is running (for elapsed time timer)
  const hasRunningExecution = Array.from(activeExecutions.values()).some(
    (exec) => exec.status === 'running',
  );

  // Track elapsed time when any execution is running (VAL-CHECK-043)
  useEffect(() => {
    if (hasRunningExecution) {
      setElapsedSeconds(0);
      elapsedTimerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (elapsedTimerRef.current) {
        clearInterval(elapsedTimerRef.current);
        elapsedTimerRef.current = null;
      }
      setElapsedSeconds(0);
    }
    return () => {
      if (elapsedTimerRef.current) {
        clearInterval(elapsedTimerRef.current);
      }
    };
  }, [hasRunningExecution]);

  // Clear network error toast after 5s
  useEffect(() => {
    if (networkError) {
      const timer = setTimeout(() => setNetworkError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [networkError]);

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
      // Also set network error toast for UI feedback (VAL-CHECK-039)
      setNetworkError('Unable to connect — please try again');
    } finally {
      setLoading(false);
    }
  }, [isGreenfield]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  // Greenfield state — single onboarding checklist
  const greenfieldChecklist = checklists.find((c) => c.id === 'greenfield-onboarding');
  const greenfieldChecklistId = greenfieldChecklist?.id ?? 'greenfield-onboarding';
  const doneCount = getCompletedCount(greenfieldChecklistId);
  const totalSteps = greenfieldChecklist ? greenfieldChecklist.steps.length : 0;

  // Greenfield execution state — per-checklist tracking.
  //
  // `greenfieldExecution` represents the *current or last* execution for this
  // checklist. It persists after completion (status='complete') so the
  // ContentSlot stays visible showing the final output (VAL-CHECK-021).
  const greenfieldExecution = getExecution(greenfieldChecklistId);
  const greenfieldExecuting = greenfieldExecution?.status === 'running';
  // The step that currently has (or most recently had) the execution attached.
  const greenfieldExecutionStepId = greenfieldExecution?.stepId ?? null;

  // ---------------------------------------------------------------------------
  // Client-side completion ordering (VAL-CHECK-015)
  //
  // The server returns checklists without step completion data (no persistence
  // in V1). The useStepExecution hook tracks completedCounts client-side.
  // We re-derive active vs completed here so completed checklists move to the
  // bottom in real-time as steps are finished during the session.
  // ---------------------------------------------------------------------------
  const { clientActive, clientCompleted } = useMemo(() => {
    if (!midProjectData) return { clientActive: [], clientCompleted: [] };

    // Merge all checklists from both server-side active and completed arrays
    const allChecklists = [...midProjectData.active, ...midProjectData.completed];

    const active: ChecklistWithMetaData[] = [];
    const completed: ChecklistWithMetaData[] = [];

    for (const item of allChecklists) {
      const hookCount = getCompletedCount(item.checklist.id);
      const effectiveCompleted = Math.max(hookCount, item.completedSteps);
      const isCompleted = effectiveCompleted >= item.totalSteps;

      if (isCompleted) {
        completed.push({
          ...item,
          completedSteps: effectiveCompleted,
          status: 'completed',
        });
      } else {
        // Derive status from effective completed count
        const status: 'not-started' | 'in-progress' | 'completed' =
          effectiveCompleted > 0 ? 'in-progress' : item.status;
        active.push({
          ...item,
          completedSteps: effectiveCompleted,
          status,
        });
      }
    }

    // Preserve impact-based ordering for active checklists
    active.sort((a, b) => b.readinessImpact - a.readinessImpact);

    return { clientActive: active, clientCompleted: completed };
  }, [midProjectData, getCompletedCount]);

  // Check if all checklists are completed (all-done state, VAL-CHECK-030)
  // Requires BOTH score===100 AND all checklists complete — score alone is not sufficient
  const isAllDone =
    score === 100 &&
    midProjectData !== null &&
    clientActive.length === 0 &&
    clientCompleted.length > 0;

  return (
    <div data-testid="checklists-view">
      {/* Network error toast (VAL-CHECK-039) */}
      {networkError && (
        <div
          data-testid="network-error-toast"
          className="fixed right-4 top-4 z-50 rounded-lg border border-red-800 bg-red-900/90 px-4 py-3 shadow-lg"
        >
          <p className="text-sm text-red-300">{networkError}</p>
        </div>
      )}

      {/* Hero readiness gauge — centered prominently (VAL-CHECK-011) */}
      <div className="mb-10 flex flex-col items-center gap-3" data-testid="checklists-hero">
        <ReadinessGauge score={score} />
        <p className="text-center text-sm text-gray-400" data-testid="hero-supporting-text">
          {isAllDone
            ? 'All clear — your project is fully instrumented.'
            : score === 0
              ? "Your project isn't flying yet — let's get started."
              : `${score}% of plays can run with current artifacts.`}
        </p>
        {/* Per-area breakdown — only show when there is breakdown data (VAL-CHECK-005) */}
        {breakdown.length > 0 && <ReadinessBreakdown breakdown={breakdown} />}
      </div>

      {/* Error state — when checklist definitions fail to load (VAL-CHECK-040) */}
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
         Exactly one onboarding checklist, hero gauge, sequential step unlock.
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
              const state = deriveStepState(index, doneCount);
              const isDone = state === 'done';
              const isActionable = state === 'in-progress' || state === 'pending';
              const isLocked = state === 'locked';

              // Is an execution currently/previously attached to THIS step?
              // Used to gate the visibility of the ContentSlot and execution indicators.
              const isStepExecutionAttached = greenfieldExecutionStepId === step.id;
              // Narrower: is this step's execution still running (for CTA gating)?
              const isStepRunning = isStepExecutionAttached && greenfieldExecuting;

              // Show CTA only when actionable and this checklist not currently executing (VAL-CHECK-024)
              const showCta = isActionable && !greenfieldExecuting;

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

                  {/* CTA button — only for actionable, non-executing steps (VAL-CHECK-009, VAL-CHECK-024) */}
                  {showCta && (
                    <div className="mt-3 pl-9" data-testid="step-cta-container">
                      <CTAButton
                        label={step.label}
                        playName={step.play}
                        onExecute={(playName) => {
                          executeStep(greenfieldChecklistId, step.id, playName);
                        }}
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
                      browser-based tests) can observe the final output.
                      Post-completion collapses to a compact summary
                      view with an expand control (VAL-ACTION-018). */}
                  {isStepExecutionAttached &&
                    greenfieldExecution &&
                    greenfieldExecution.status !== 'error' && (
                      <div className="mt-3 pl-9" data-testid="step-content-slot">
                        <ContentSlot
                          state={greenfieldExecution.status === 'complete' ? 'complete' : 'active'}
                          content={greenfieldExecution.output}
                          placeholder={`Executing ${step.play}…`}
                          summary={
                            greenfieldExecution.status === 'complete'
                              ? `${step.play} completed`
                              : undefined
                          }
                        />
                      </div>
                    )}

                  {/* ContentSlot error state (VAL-CHECK-038) */}
                  {isStepExecutionAttached &&
                    greenfieldExecution &&
                    greenfieldExecution.status === 'error' && (
                      <div className="mt-3 pl-9" data-testid="step-error-slot">
                        <ContentSlot
                          state="error"
                          content={greenfieldExecution.output}
                          errorMessage={greenfieldExecution.error}
                        />
                      </div>
                    )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
         ALL-DONE STATE (readiness 100 or all checklists completed)
         Affirming message with completed checklists collapsed (VAL-CHECK-030)
         ═══════════════════════════════════════════════════════════════════ */}
      {!isGreenfield && !loading && !error && midProjectData && isAllDone && (
        <div className="mx-auto max-w-2xl space-y-6" data-testid="all-done-view">
          <div
            data-testid="all-done-message"
            className="rounded-lg border border-emerald-800 bg-emerald-900/20 px-6 py-8 text-center"
          >
            <span className="mb-3 block text-4xl" aria-hidden="true">
              🎉
            </span>
            <h2 className="text-lg font-semibold text-emerald-300" data-testid="all-done-heading">
              All clear — your project is fully instrumented
            </h2>
            <p className="mt-2 text-sm text-gray-400">
              Every checklist is complete. Your Garura project has full play readiness.
            </p>
          </div>

          {/* All checklists collapsed in completed section (VAL-CHECK-030) */}
          {clientCompleted.length > 0 && (
            <div data-testid="completed-checklists" className="mt-8">
              <div className="mb-3 flex items-center gap-2">
                <span className="text-xs font-medium uppercase tracking-wider text-gray-500">
                  Completed
                </span>
                <div className="h-px flex-1 bg-gray-800" />
              </div>
              <div className="space-y-2">
                {clientCompleted.map((item) => (
                  <ChecklistCard
                    key={item.checklist.id}
                    id={item.checklist.id}
                    title={item.checklist.title}
                    steps={item.checklist.steps}
                    completedSteps={item.completedSteps}
                    totalSteps={item.totalSteps}
                    status={item.status}
                    muted
                    relatedEpic={item.checklist.relatedEpic}
                    persistExpansion
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
         MID-PROJECT VIEW (score > 0, not all-done)
         Multiple checklists ranked by readiness impact, generative region,
         completed checklists collapsed at bottom.
         ═══════════════════════════════════════════════════════════════════ */}
      {!isGreenfield && !loading && !error && midProjectData && !isAllDone && (
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
          {clientActive.length > 0 && (
            <div className="space-y-4" data-testid="active-checklists">
              {clientActive.map((item, index) => {
                const checklistId = item.checklist.id;

                // Per-checklist execution: only disable CTA if THIS checklist is executing
                const checklistExec = getExecution(checklistId);
                const thisChecklistExecuting = isChecklistExecuting(checklistId);

                return (
                  <ChecklistCard
                    key={checklistId}
                    id={checklistId}
                    title={item.checklist.title}
                    steps={item.checklist.steps}
                    completedSteps={item.completedSteps}
                    totalSteps={item.totalSteps}
                    status={item.status}
                    defaultExpanded={index === 0}
                    onStepExecute={(playName, stepId) => {
                      executeStep(checklistId, stepId, playName);
                    }}
                    activeExecution={checklistExec}
                    ctaDisabled={thisChecklistExecuting}
                    elapsedSeconds={elapsedSeconds}
                    relatedEpic={item.checklist.relatedEpic}
                    persistExpansion
                  />
                );
              })}
            </div>
          )}

          {/* Completed checklists — collapsed at bottom, muted (VAL-CHECK-015) */}
          {clientCompleted.length > 0 && (
            <div data-testid="completed-checklists" className="mt-8">
              <div className="mb-3 flex items-center gap-2">
                <span className="text-xs font-medium uppercase tracking-wider text-gray-500">
                  Completed
                </span>
                <div className="h-px flex-1 bg-gray-800" />
              </div>
              <div className="space-y-2">
                {clientCompleted.map((item) => (
                  <ChecklistCard
                    key={item.checklist.id}
                    id={item.checklist.id}
                    title={item.checklist.title}
                    steps={item.checklist.steps}
                    completedSteps={item.completedSteps}
                    totalSteps={item.totalSteps}
                    status={item.status}
                    muted
                    relatedEpic={item.checklist.relatedEpic}
                    persistExpansion
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
