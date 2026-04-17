'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { INSTRUMENTS } from '@/lib/constants';

interface BreadcrumbSegment {
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

/**
 * Breadcrumb navigation bar below the top bar.
 * Updates to reflect the current navigation path.
 */
export function Breadcrumb() {
  const pathname = usePathname();
  const segments = deriveBreadcrumbs(pathname);

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
                <Link
                  href={segment.href}
                  className="text-gray-400 transition-colors hover:text-gray-200"
                  data-testid={`breadcrumb-link-${index}`}
                >
                  {segment.label}
                </Link>
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
