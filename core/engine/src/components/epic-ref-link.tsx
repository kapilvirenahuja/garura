'use client';

import Link from 'next/link';

export interface EpicRefLinkProps {
  /** Epic identifier — e.g. "E1", "EPIC-E1". */
  epicId: string;
  /** Human-readable label shown inside the chip (e.g. "E1: Authentication"). */
  label?: string;
  /** Compact styling for inline contexts (e.g. checklist card header). */
  variant?: 'default' | 'compact';
  /** Optional data-testid override for per-instance targeting in tests. */
  testId?: string;
}

/**
 * Clickable cross-instrument link that navigates the user to the
 * Playbook Reader with the given epic pre-loaded. Used by the Checklists
 * instrument (when a checklist references a specific epic) and any
 * future surfaces that need to jump to an AI-composed epic narrative.
 *
 * Renders a semantic `<a>` element so it works with server-rendered
 * navigation, keyboard focus, right-click "Open in new tab", and Next's
 * client-side router all at once — no bespoke JS onClick handler
 * required.
 *
 * Fulfills:
 *   VAL-PLAY-008  Entry from Checklists
 *   VAL-CROSS-001 Checklist epic link opens Playbook
 */
export function EpicRefLink({ epicId, label, variant = 'default', testId }: EpicRefLinkProps) {
  const text = label ?? epicId;
  const href = `/playbook?context=${encodeURIComponent(epicId)}`;
  const compact = variant === 'compact';
  const classes = compact
    ? 'inline-flex items-center gap-1 rounded border border-blue-900/60 bg-blue-950/40 px-2 py-0.5 text-xs font-medium text-blue-300 transition-colors hover:border-blue-700 hover:bg-blue-900/60 hover:text-blue-200'
    : 'inline-flex items-center gap-1.5 rounded-md border border-blue-900 bg-blue-950/50 px-2.5 py-1 text-sm font-medium text-blue-300 transition-colors hover:border-blue-700 hover:bg-blue-900/60 hover:text-blue-200';

  return (
    <Link
      href={href}
      data-testid={testId ?? 'epic-ref-link'}
      data-epic-id={epicId}
      className={classes}
      aria-label={`Open ${text} in Playbook Reader`}
    >
      <span aria-hidden="true">📖</span>
      <span>{text}</span>
      <span aria-hidden="true">→</span>
    </Link>
  );
}
