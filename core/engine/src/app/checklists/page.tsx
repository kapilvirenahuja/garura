'use client';

import { ReadinessGauge } from '@/components/readiness-gauge';
import { ChecklistItem } from '@/components/checklist-item';
import type { ChecklistItemState } from '@/components/checklist-item';

/** Onboarding checklist step definition */
interface OnboardingStep {
  readonly label: string;
  readonly play: string;
  readonly state: ChecklistItemState;
}

const ONBOARDING_STEPS: readonly OnboardingStep[] = [
  { label: 'Provide project brief', play: 'discover-product', state: 'in-progress' },
  { label: 'Review market analysis', play: 'research-market-opportunity', state: 'locked' },
  { label: 'Lock product spec', play: 'specify-product', state: 'locked' },
  { label: 'Define features and scenarios', play: 'draft-product-spec', state: 'locked' },
  { label: 'Plan roadmap', play: 'plan-roadmap', state: 'locked' },
] as const;

/**
 * Checklists instrument page.
 *
 * Displays a readiness gauge and guided procedures mapped to Meridian plays.
 * In greenfield state (readiness 0), shows the onboarding checklist with
 * only the first step actionable.
 */
export default function ChecklistsPage() {
  // Foundation: static greenfield state (readiness engine wired in checklists milestone)
  const readinessScore = 0;

  return (
    <div data-testid="checklists-view">
      {/* Hero readiness gauge */}
      <div className="mb-8 flex flex-col items-center" data-testid="checklists-hero">
        <ReadinessGauge score={readinessScore} />
        <p className="mt-3 text-sm text-gray-400">
          {readinessScore === 0
            ? "Your project isn't flying yet — let's get started."
            : `${readinessScore}% of plays can run with current artifacts.`}
        </p>
      </div>

      {/* Onboarding checklist */}
      <section data-testid="onboarding-checklist" className="mx-auto max-w-2xl">
        <h2 className="mb-4 text-lg font-semibold text-white">
          Getting Started: Greenfield Onboarding
        </h2>
        <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-4">
          {ONBOARDING_STEPS.map((step) => (
            <div key={step.play} className="flex items-center gap-2">
              <ChecklistItem label={step.label} state={step.state} />
              {step.state !== 'locked' && step.state !== 'done' && (
                <span className="text-xs text-gray-500">→ {step.play}</span>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
