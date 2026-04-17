'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { INSTRUMENTS } from '@/lib/constants';

export interface BreadcrumbSegment {
  label: string;
  href?: string;
}

/**
 * Derives breadcrumb segments from the current pathname.
 */
export function deriveBreadcrumbs(pathname: string): BreadcrumbSegment[] {
  const segments: BreadcrumbSegment[] = [{ label: 'Home', href: '/checklists' }];

  // Find the active instrument
  const instrument = INSTRUMENTS.find((i) => pathname.startsWith(i.href));
  if (instrument) {
    segments.push({ label: instrument.label, href: instrument.href });
  }

  // Future: extract deeper context from pathname (e.g., /playbook?context=E1)
  // For now, the instrument is the deepest level

  // The last segment has no href (current location)
  const lastSegment = segments[segments.length - 1];
  if (lastSegment) {
    delete lastSegment.href;
  }

  return segments;
}

export interface BreadcrumbProps {
  /** Explicitly provide breadcrumb segments (overrides URL-based derivation). */
  segments?: BreadcrumbSegment[];
  /** Callback fired when a breadcrumb link is clicked. When provided, renders buttons instead of links. */
  onNavigate?: (href: string) => void;
}

/**
 * Breadcrumb navigation bar below the top bar.
 *
 * **Shell mode** (no props): derives segments from current pathname.
 * **Library mode** (`segments` + `onNavigate`): prop-driven, renders buttons.
 */
export function Breadcrumb({ segments: segmentsProp, onNavigate }: BreadcrumbProps = {}) {
  const pathname = usePathname();
  const segments = segmentsProp ?? deriveBreadcrumbs(pathname);

  return (
    <nav aria-label="Breadcrumb" data-testid="breadcrumb">
      <ol className="flex items-center gap-1 text-sm">
        {segments.map((segment, index) => {
          const isLast = index === segments.length - 1;
          return (
            <li key={`${segment.label}-${index}`} className="flex items-center gap-1">
              {index > 0 && (
                <span className="text-gray-600" aria-hidden="true">
                  ›
                </span>
              )}
              {segment.href && !isLast ? (
                onNavigate ? (
                  <button
                    type="button"
                    className="text-gray-400 transition-colors hover:text-gray-200"
                    data-testid={`breadcrumb-link-${index}`}
                    onClick={() => onNavigate(segment.href!)}
                  >
                    {segment.label}
                  </button>
                ) : (
                  <Link
                    href={segment.href}
                    className="text-gray-400 transition-colors hover:text-gray-200"
                    data-testid={`breadcrumb-link-${index}`}
                  >
                    {segment.label}
                  </Link>
                )
              ) : (
                <span
                  className="text-gray-200"
                  aria-current={isLast ? 'page' : undefined}
                  data-testid={`breadcrumb-current-${index}`}
                >
                  {segment.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
