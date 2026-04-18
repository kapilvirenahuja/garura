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
  const bandLabel = clamped < 30 ? '0-30' : clamped < 60 ? '30-60' : clamped < 80 ? '60-80' : '80-100';

  return (
    <div data-testid="readiness-gauge" className="w-full max-w-3xl space-y-3">
      <div className="flex items-end justify-between gap-4">
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
        <span
          className="rounded-full border border-gray-700 bg-gray-900 px-3 py-1 text-xs font-medium uppercase tracking-wider text-gray-300"
          data-testid="readiness-gauge-band"
        >
          Band {bandLabel}
        </span>
      </div>
      <div className="relative" data-testid="readiness-gauge-track">
        <div className="grid h-4 grid-cols-4 overflow-hidden rounded-full border border-gray-800 bg-gray-950">
          <div className="border-r border-gray-900 bg-rose-500/25" />
          <div className="border-r border-gray-900 bg-amber-500/25" />
          <div className="border-r border-gray-900 bg-sky-500/25" />
          <div className="bg-emerald-500/25" />
        </div>
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-rose-500 via-amber-400 via-sky-400 to-emerald-400 transition-all"
          style={{ width: `${clamped}%` }}
          data-testid="readiness-gauge-fill"
        />
      </div>
      <div className="grid grid-cols-4 text-[11px] uppercase tracking-wider text-gray-500">
        <span>0-30</span>
        <span className="text-center">30-60</span>
        <span className="text-center">60-80</span>
        <span className="text-right">80-100</span>
      </div>
    </div>
  );
}
