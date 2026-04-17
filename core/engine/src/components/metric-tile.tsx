'use client';

export interface MetricTileProps {
  /** Label describing the metric. */
  label: string;
  /** Numeric value to display. */
  value: number;
  /** Optional icon element. */
  icon?: React.ReactNode;
}

/**
 * Compact card displaying a labelled numeric metric.
 * Used in the Flight Deck summary area.
 */
export function MetricTile({ label, value, icon }: MetricTileProps) {
  return (
    <div
      data-testid="metric-tile"
      className="flex items-center gap-3 rounded-lg border border-gray-800 bg-gray-900 px-4 py-3"
    >
      {icon && (
        <span data-testid="metric-tile-icon" className="text-gray-500">
          {icon}
        </span>
      )}
      <div>
        <p
          data-testid="metric-tile-label"
          className="text-xs font-medium uppercase tracking-wider text-gray-500"
        >
          {label}
        </p>
        <p data-testid="metric-tile-value" className="text-2xl font-bold tabular-nums text-white">
          {value}
        </p>
      </div>
    </div>
  );
}
