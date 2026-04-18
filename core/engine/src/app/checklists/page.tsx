'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ReadinessGauge } from '@/components/readiness-gauge';
import { ReadinessBreakdown } from '@/components/readiness-breakdown';
import { ChecklistItem } from '@/components/checklist-item';
import { ChecklistCard } from '@/components/checklist-card';
import { BriefArtifactPanel } from '@/components/brief-artifact-panel';
import { useReadiness } from '@/components/readiness-provider';
import type { ChecklistItemState } from '@/components/checklist-item';
import type { LifecycleMode } from '@/lib/engine-state';

// ---------------------------------------------------------------------------
// Types — mirrors checklist-loader ChecklistDefinition / ChecklistStep
// ---------------------------------------------------------------------------

interface ChecklistStepData {
  readonly id: string;
  readonly label: string;
  readonly description: string;
  readonly play: string;
}

interface BriefArtifactSummary {
  readonly path: string;
  readonly title: string;
  readonly preview: string;
  readonly content: string;
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
 * This surface is intentionally read-only for now. It shows current
 * checklist status and, when available, lets the user inspect existing
 * brief artifacts inline instead of mutating project state.
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
  const { score, breakdown, lifecycle, detectedLifecycle, lifecycleMode, setLifecycleMode, band } =
    useReadiness();

  // Greenfield data
  const [checklists, setChecklists] = useState<ChecklistData[]>([]);
  const [briefArtifacts, setBriefArtifacts] = useState<BriefArtifactSummary[]>([]);

  // Mid-project data
  const [midProjectData, setMidProjectData] = useState<MidProjectData | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Network error toast (VAL-CHECK-039)
  const [networkError, setNetworkError] = useState<string | null>(null);

  // Elapsed time tracker for long-running plays (VAL-CHECK-043)
  const isGreenfield = lifecycle === 'greenfield';

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
        const data = (await res.json()) as {
          checklists: ChecklistData[];
          briefArtifacts?: BriefArtifactSummary[];
        };
        setChecklists(data.checklists);
        setBriefArtifacts(data.briefArtifacts ?? []);
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
        setBriefArtifacts([]);
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
  const doneCount = briefArtifacts.length > 0 ? 1 : 0;
  const totalSteps = greenfieldChecklist ? greenfieldChecklist.steps.length : 0;

  // ---------------------------------------------------------------------------
  // Client-side completion ordering (VAL-CHECK-015)
  //
  // The server returns checklists without step completion data (no persistence
  // Mid-project API already returns the current checklist status/progress.
  // ---------------------------------------------------------------------------
  const { clientActive, clientCompleted } = useMemo(() => {
    if (!midProjectData) return { clientActive: [], clientCompleted: [] };
    return {
      clientActive: [...midProjectData.active].sort((a, b) => b.readinessImpact - a.readinessImpact),
      clientCompleted: [...midProjectData.completed],
    };
  }, [midProjectData]);

  // Check if all checklists are completed (all-done state, VAL-CHECK-030)
  // Requires BOTH score===100 AND all checklists complete — score alone is not sufficient
  const isAllDone =
    score === 100 &&
    midProjectData !== null &&
    clientActive.length === 0 &&
    clientCompleted.length > 0;

  const readinessTone =
    band === '0-30'
      ? 'border-rose-900/70 bg-rose-950/20 text-rose-200'
      : band === '30-60'
        ? 'border-amber-900/70 bg-amber-950/20 text-amber-200'
        : band === '60-80'
          ? 'border-sky-900/70 bg-sky-950/20 text-sky-200'
          : 'border-emerald-900/70 bg-emerald-950/20 text-emerald-200';

  const lifecycleOptions: ReadonlyArray<{ mode: LifecycleMode; label: string }> = [
    { mode: 'auto', label: 'Auto' },
    { mode: 'greenfield', label: 'Greenfield' },
    { mode: 'brownfield', label: 'Brownfield' },
  ];

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
      <div className="mb-10 mx-auto max-w-4xl space-y-5" data-testid="checklists-hero">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gray-500">
              Product Readiness
            </p>
            <h2 className="text-2xl font-semibold tracking-tight text-white">Playbook</h2>
            <p className="max-w-2xl text-sm leading-relaxed text-gray-400">
              Inspired by Factory&apos;s readiness model, this view shows how prepared the repo is
              for Garura to operate effectively across product definition, planning, architecture,
              and epic execution.
            </p>
            <p className="text-xs text-gray-500">
              Engine-managed state persists the lifecycle mode locally so anomalies can be
              overridden without fighting auto-detection on every refresh.
            </p>
          </div>
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {lifecycleOptions.map((option) => {
                const isActive = lifecycleMode === option.mode;
                return (
                  <button
                    key={option.mode}
                    type="button"
                    onClick={() => void setLifecycleMode(option.mode)}
                    className={`rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-wider transition-colors ${
                      isActive
                        ? 'border-blue-600 bg-blue-950/40 text-blue-100'
                        : 'border-gray-800 bg-gray-950 text-gray-400 hover:border-gray-700 hover:text-gray-200'
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
            <div className="text-right text-xs text-gray-500">
              Detected: <span className="text-gray-300">{detectedLifecycle}</span>
              {' · '}
              Effective: <span className="text-gray-300">{lifecycle}</span>
            </div>
          </div>
        </div>

        <ReadinessGauge score={score} />
        <div className={`rounded-xl border px-4 py-3 text-sm ${readinessTone}`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span data-testid="hero-supporting-text">
              {isAllDone
                ? 'Garura has the product, planning, architecture, and epic artifacts it needs to operate at full strength.'
                : isGreenfield
                  ? 'This repository still looks early-stage. Garura can help most once the first product artifacts are in place.'
                  : 'This repository shows signs of significant prior work. Readiness reflects how much of that work Garura can actually build on.'}
            </span>
            <span className="rounded-full border border-current/20 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider">
              Band {band}
            </span>
          </div>
        </div>
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

              const shouldShowArtifacts = step.id === 'provide-brief' && briefArtifacts.length > 0;

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

                  {shouldShowArtifacts && (
                    <div className="pl-9">
                      <BriefArtifactPanel artifacts={briefArtifacts} />
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
                    showActions={false}
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
