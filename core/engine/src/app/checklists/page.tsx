'use client';

import { useCallback, useEffect, useState } from 'react';
import { ReadinessGauge } from '@/components/readiness-gauge';
import { ReadinessBreakdown } from '@/components/readiness-breakdown';
import { ChecklistItem } from '@/components/checklist-item';
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
 * First step is in-progress; all others are locked.
 * (Full sequential-unlock logic will be implemented by mdb-checklist-step-execution)
 */
function deriveStepState(index: number): ChecklistItemState {
  return index === 0 ? 'in-progress' : 'locked';
}

/**
 * Checklists instrument page.
 *
 * Displays a readiness gauge and guided procedures mapped to Meridian plays.
 * In greenfield state (readiness 0), shows the onboarding checklist with
 * only the first step actionable.
 *
 * Checklist definitions are loaded from the /api/checklists endpoint, which
 * reads YAML data files at runtime — no step arrays are hardcoded in this
 * component (VAL-CHECK-028).
 *
 * The readiness score and breakdown are consumed from ReadinessProvider context,
 * ensuring the gauge here is consistent with the mini-gauge in the top bar (VAL-CHECK-003).
 *
 * Fulfills: VAL-CHECK-001 (greenfield 0), VAL-CHECK-005 (per-area breakdown),
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

  // Select checklist based on readiness state
  const greenfield = checklists.find((c) => c.id === 'greenfield-onboarding');
  const activeChecklist = score === 0 ? greenfield : greenfield;

  return (
    <div data-testid="checklists-view">
      {/* Hero readiness gauge */}
      <div className="mb-8 flex flex-col items-center gap-4" data-testid="checklists-hero">
        <ReadinessGauge score={score} />
        <p className="text-sm text-gray-400">
          {score === 0
            ? "Your project isn't flying yet — let's get started."
            : `${score}% of plays can run with current artifacts.`}
        </p>
        {/* Per-area breakdown (VAL-CHECK-005) */}
        <ReadinessBreakdown breakdown={breakdown} />
      </div>

      {/* Loading state */}
      {loading && (
        <div data-testid="checklists-loading" className="mx-auto max-w-2xl text-center">
          <p className="text-sm text-gray-500">Loading checklists…</p>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div
          data-testid="checklists-error"
          className="mx-auto max-w-2xl rounded-lg border border-red-800 bg-red-900/20 p-4 text-center"
        >
          <p className="text-sm text-red-400">Unable to load checklists: {error}</p>
        </div>
      )}

      {/* Onboarding checklist — loaded from data files */}
      {!loading && !error && activeChecklist && (
        <section data-testid="onboarding-checklist" className="mx-auto max-w-2xl">
          <h2 className="mb-4 text-lg font-semibold text-white">{activeChecklist.title}</h2>
          <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-4">
            {activeChecklist.steps.map((step, index) => {
              const state = deriveStepState(index);
              return (
                <div key={step.id} className="flex items-center gap-2">
                  <ChecklistItem label={step.label} state={state} />
                  {state !== 'locked' && state !== 'done' && (
                    <span className="text-xs text-gray-500">→ {step.play}</span>
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
