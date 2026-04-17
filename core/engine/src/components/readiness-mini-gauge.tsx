'use client';

import { useRouter } from 'next/navigation';

interface ReadinessMiniGaugeProps {
  score?: number;
}

/**
 * Compact readiness gauge displayed in the top bar.
 * Shows a numeric score (0–100) with a visual bar indicator.
 * Clicking navigates to the Checklists instrument.
 */
export function ReadinessMiniGauge({ score = 0 }: ReadinessMiniGaugeProps) {
  const router = useRouter();
  const clampedScore = Math.min(100, Math.max(0, Math.round(score)));

  const handleClick = () => {
    router.push('/checklists');
  };

  return (
    <button
      onClick={handleClick}
      data-testid="readiness-mini-gauge"
      aria-label={`Readiness score: ${clampedScore}. Click to view Checklists.`}
      className="flex cursor-pointer items-center gap-2 rounded-md border border-gray-700 bg-gray-800/50 px-3 py-1.5 transition-colors hover:border-gray-600 hover:bg-gray-800"
    >
      <div className="relative h-2 w-16 overflow-hidden rounded-full bg-gray-700">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-emerald-500 transition-all"
          style={{ width: `${clampedScore}%` }}
          data-testid="readiness-mini-gauge-fill"
        />
      </div>
      <span
        className="text-xs font-medium tabular-nums text-gray-300"
        data-testid="readiness-mini-gauge-score"
      >
        {clampedScore}
      </span>
    </button>
  );
}
