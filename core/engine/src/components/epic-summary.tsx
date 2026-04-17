'use client';

export type EpicStatusColor = 'green' | 'yellow' | 'red';

export interface EpicSummaryProps {
  /** Epic name. */
  name: string;
  /** Developer assigned to the epic. */
  developer: string;
  /** Current stage (e.g. "Implementation", "Validation"). */
  stage: string;
  /** Last activity timestamp string. */
  timestamp: string;
  /** Status colour indicator. */
  statusColor: EpicStatusColor;
}

const COLOR_CLASSES: Record<EpicStatusColor, string> = {
  green: 'bg-emerald-500',
  yellow: 'bg-amber-500',
  red: 'bg-red-500',
};

/**
 * Compact summary card for an epic showing key fields
 * and a colour-coded status indicator.
 */
export function EpicSummary({ name, developer, stage, timestamp, statusColor }: EpicSummaryProps) {
  return (
    <div
      data-testid="epic-summary"
      className="flex items-start gap-3 rounded-lg border border-gray-800 bg-gray-900 p-4"
    >
      <span
        data-testid="epic-summary-status"
        className={`mt-1 h-2.5 w-2.5 flex-shrink-0 rounded-full ${COLOR_CLASSES[statusColor]}`}
        aria-label={`Status: ${statusColor}`}
      />
      <div className="min-w-0 flex-1">
        <h4 data-testid="epic-summary-name" className="text-sm font-semibold text-white truncate">
          {name}
        </h4>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-400">
          <span data-testid="epic-summary-developer">{developer}</span>
          <span data-testid="epic-summary-stage">{stage}</span>
          <time data-testid="epic-summary-timestamp" className="text-gray-500">
            {timestamp}
          </time>
        </div>
      </div>
    </div>
  );
}
