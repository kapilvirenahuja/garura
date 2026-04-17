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
 * When no extras are provided, the trailing instrument segment has its
 * `href` stripped — it represents the current location and renders as
 * plain text, matching standard breadcrumb semantics.
 *
 * When extras are provided (e.g. `/playbook?context=E1` adds an
 * "E1: Authentication" segment), the instrument segment becomes a
 * clickable parent link and **every extras segment keeps its `href`** —
 * including the trailing one. This fulfils VAL-PLAY-022: clicking the
 * epic/context segment navigates to `/playbook?context=<id>` so the
 * user can re-enter the same context (and browser agents can assert the
 * link is navigable) without losing the `aria-current="page"` marker
 * applied by the `Breadcrumb` component itself.
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

  // Append any extras pushed by a page. Shallow-copy each segment so we
  // do not mutate the caller's objects.
  for (const extra of extras) {
    segments.push({ label: extra.label, href: extra.href });
  }

  // Only strip the trailing segment's href when no extras were provided.
  // In that case the last segment is the instrument itself and should
  // render as current-page plain text. When extras are provided, the
  // trailing context segment remains clickable (VAL-PLAY-022) while the
  // Breadcrumb component still marks it with aria-current="page".
  if (extras.length === 0) {
    const lastSegment = segments[segments.length - 1];
    if (lastSegment) {
      delete lastSegment.href;
    }
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
              {segment.href ? (
                onNavigate ? (
                  <button
                    type="button"
                    className={
                      isLast
                        ? 'text-gray-200 transition-colors hover:text-gray-100'
                        : 'text-gray-400 transition-colors hover:text-gray-200'
                    }
                    data-testid={
                      isLast ? `breadcrumb-current-${index}` : `breadcrumb-link-${index}`
                    }
                    aria-current={isLast ? 'page' : undefined}
                    onClick={() => onNavigate(segment.href!)}
                  >
                    {segment.label}
                  </button>
                ) : (
                  <Link
                    href={segment.href}
                    className={
                      isLast
                        ? 'text-gray-200 transition-colors hover:text-gray-100'
                        : 'text-gray-400 transition-colors hover:text-gray-200'
                    }
                    data-testid={
                      isLast ? `breadcrumb-current-${index}` : `breadcrumb-link-${index}`
                    }
                    aria-current={isLast ? 'page' : undefined}
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
