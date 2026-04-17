'use client';

export type StatusBadgeStatus = 'passing' | 'failing' | 'in-progress' | 'pending' | 'warning';

export interface StatusBadgeProps {
  /** The status value to display. Unrecognised values render a neutral fallback. */
  status: string;
}

const STATUS_STYLES: Record<StatusBadgeStatus, { bg: string; text: string; label: string }> = {
  passing: { bg: 'bg-emerald-900/50', text: 'text-emerald-400', label: 'Passing' },
  failing: { bg: 'bg-red-900/50', text: 'text-red-400', label: 'Failing' },
  'in-progress': { bg: 'bg-amber-900/50', text: 'text-amber-400', label: 'In Progress' },
  pending: { bg: 'bg-gray-800', text: 'text-gray-400', label: 'Pending' },
  warning: { bg: 'bg-orange-900/50', text: 'text-orange-400', label: 'Warning' },
};

function isKnownStatus(s: string): s is StatusBadgeStatus {
  return Object.hasOwn(STATUS_STYLES, s);
}

/**
 * Renders a coloured badge for a given status value.
 * Unknown status values fall back to a neutral gray "Unknown" badge.
 */
export function StatusBadge({ status }: StatusBadgeProps) {
  const style = isKnownStatus(status)
    ? STATUS_STYLES[status]
    : { bg: 'bg-gray-800', text: 'text-gray-500', label: 'Unknown' };

  return (
    <span
      data-testid="status-badge"
      data-status={isKnownStatus(status) ? status : 'unknown'}
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${style.bg} ${style.text}`}
    >
      {style.label}
    </span>
  );
}
