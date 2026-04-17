'use client';

import type { AreaBreakdown, AreaStatus } from '@/lib/readiness';

// ---------------------------------------------------------------------------
// Status styling map
// ---------------------------------------------------------------------------

const STATUS_CONFIG: Record<AreaStatus, { icon: string; colorClass: string; label: string }> = {
  complete: { icon: '●', colorClass: 'text-emerald-400', label: 'Locked' },
  'in-progress': { icon: '◐', colorClass: 'text-amber-400', label: 'In progress' },
  missing: { icon: '○', colorClass: 'text-gray-500', label: 'Missing' },
  locked: { icon: '◌', colorClass: 'text-gray-600', label: 'Locked' },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export interface ReadinessBreakdownProps {
  /** Per-area breakdown data from the readiness engine */
  readonly breakdown: ReadonlyArray<AreaBreakdown>;
}

/**
 * Displays a per-area readiness breakdown with status indicators.
 *
 * Shows each capability area (Product, Features, Roadmap, Architecture, Epics)
 * with a visual status indicator (complete ●, in-progress ◐, missing ○).
 *
 * Fulfills: VAL-CHECK-005
 */
export function ReadinessBreakdown({ breakdown }: ReadinessBreakdownProps) {
  if (breakdown.length === 0) {
    return null;
  }

  return (
    <div
      data-testid="readiness-breakdown"
      className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2"
    >
      {breakdown.map((area) => {
        const config = STATUS_CONFIG[area.status];
        return (
          <div
            key={area.area}
            data-testid={`area-${area.area.toLowerCase()}`}
            className="flex flex-col items-center gap-0.5"
          >
            <div className="flex items-center gap-1.5">
              <span
                className={`text-sm ${config.colorClass}`}
                data-testid={`area-status-icon-${area.area.toLowerCase()}`}
              >
                {config.icon}
              </span>
              <span className="text-xs font-medium text-gray-300">{area.area}</span>
            </div>
            <span
              className={`text-[10px] ${config.colorClass}`}
              data-testid={`area-status-label-${area.area.toLowerCase()}`}
            >
              {config.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
