'use client';

export interface ReadinessGaugeProps {
  /** Score value 0-100. Values outside range are clamped. */
  score: number;
}

/**
 * Full-size readiness gauge displaying a numeric score (0–100)
 * with a visual bar fill indicator proportional to the score.
 * Out-of-range values are clamped: negatives → 0, >100 → 100.
 */
export function ReadinessGauge({ score }: ReadinessGaugeProps) {
  const clamped = Math.min(100, Math.max(0, Math.round(score)));

  return (
    <div data-testid="readiness-gauge" className="flex flex-col items-center gap-2">
      <div className="flex items-baseline gap-1">
        <span
          data-testid="readiness-gauge-score"
          className="text-5xl font-bold tabular-nums text-white"
        >
          {clamped}
        </span>
        <span className="text-lg text-gray-500" data-testid="readiness-gauge-denominator">
          / 100
        </span>
      </div>
      <div
        className="relative h-3 w-48 overflow-hidden rounded-full bg-gray-700"
        data-testid="readiness-gauge-track"
      >
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-emerald-500 transition-all"
          style={{ width: `${clamped}%` }}
          data-testid="readiness-gauge-fill"
        />
      </div>
    </div>
  );
}
