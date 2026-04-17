'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { INSTRUMENTS } from '@/lib/constants';
import { useBreadcrumbExtras } from '@/components/breadcrumb-context';

export interface BreadcrumbSegment {
  label: string;
  href?: string;
}

/**
 * Derives breadcrumb segments from the current pathname, optionally
 * appending extra segments pushed by a page (via BreadcrumbExtrasProvider).
 *
 * The returned list always has the trailing segment with no `href`
 * (representing the current location). When `extras` is provided, the
 * previous trailing segment (the instrument) is re-linked to its root,
 * matching the VAL-PLAY-022 expectation that clicking "Playbook" from an
 * epic-level context returns to the Playbook root.
 */
export function deriveBreadcrumbs(
  pathname: string,
  extras: ReadonlyArray<BreadcrumbSegment> = [],
): BreadcrumbSegment[] {
  const segments: BreadcrumbSegment[] = [{ label: 'Home', href: '/checklists' }];

  // Find the active instrument
  const instrument = INSTRUMENTS.find((i) => pathname.startsWith(i.href));
  if (instrument) {
    segments.push({ label: instrument.label, href: instrument.href });
  }

  // Append any extras pushed by a page (e.g. `/playbook?context=E1` adds
  // an "E1: Authentication" segment). Each extra keeps its declared href
  // — the last segment in the final list has its href stripped below,
  // regardless of where it came from.
  for (const extra of extras) {
    // shallow-copy so we can safely mutate `href` on the last segment
    // without affecting the caller's object.
    segments.push({ label: extra.label, href: extra.href });
  }

  // The last segment has no href (current location). This applies whether
  // it came from the instrument list or from extras.
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
 * **Shell mode** (no props): derives segments from current pathname plus
 * any extras pushed by the active page through
 * `useBreadcrumbExtras().setExtras()`.
 *
 * **Library mode** (`segments` + `onNavigate`): prop-driven, renders buttons.
 */
export function Breadcrumb({ segments: segmentsProp, onNavigate }: BreadcrumbProps = {}) {
  const pathname = usePathname();
  const { extras } = useBreadcrumbExtras();
  const segments = segmentsProp ?? deriveBreadcrumbs(pathname, extras);

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
