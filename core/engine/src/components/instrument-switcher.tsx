'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { INSTRUMENTS } from '@/lib/constants';
import type { InstrumentId } from '@/lib/constants';

/**
 * Resolves the active instrument ID from the current pathname.
 */
export function resolveActiveInstrument(pathname: string): InstrumentId {
  for (const instrument of INSTRUMENTS) {
    if (pathname.startsWith(instrument.href)) {
      return instrument.id;
    }
  }
  return 'checklists';
}

/**
 * Three-tab instrument switcher in the top bar.
 * Uses URL-based routing so active tab persists on refresh.
 */
export function InstrumentSwitcher() {
  const pathname = usePathname();
  const activeId = resolveActiveInstrument(pathname);

  return (
    <nav aria-label="Instrument switcher" data-testid="instrument-switcher">
      <ul className="flex items-center gap-1" role="tablist">
        {INSTRUMENTS.map((instrument) => {
          const isActive = instrument.id === activeId;
          return (
            <li key={instrument.id} role="presentation">
              <Link
                href={instrument.href}
                role="tab"
                aria-selected={isActive}
                data-testid={`tab-${instrument.id}`}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-gray-700 text-white'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                }`}
              >
                {instrument.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
