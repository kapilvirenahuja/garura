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

export interface InstrumentSwitcherProps {
  /** Explicitly set the active tab (overrides URL-based detection). */
  active?: InstrumentId;
  /** Callback fired when a tab is clicked. When provided, renders buttons instead of links. */
  onChange?: (id: InstrumentId) => void;
}

/**
 * Three-tab instrument switcher in the top bar.
 *
 * **Shell mode** (no props): uses URL-based routing via next/navigation.
 * **Library mode** (`active` + `onChange`): prop-driven, renders buttons.
 */
export function InstrumentSwitcher({ active, onChange }: InstrumentSwitcherProps = {}) {
  const pathname = usePathname();
  const activeId = active ?? resolveActiveInstrument(pathname);

  return (
    <nav aria-label="Instrument switcher" data-testid="instrument-switcher">
      <ul className="flex items-center gap-1" role="tablist">
        {INSTRUMENTS.map((instrument) => {
          const isActive = instrument.id === activeId;
          const classes = `rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            isActive
              ? 'bg-gray-700 text-white'
              : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
          }`;

          return (
            <li key={instrument.id} role="presentation">
              {onChange ? (
                <button
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  data-testid={`tab-${instrument.id}`}
                  className={classes}
                  onClick={() => onChange(instrument.id)}
                >
                  {instrument.label}
                </button>
              ) : (
                <Link
                  href={instrument.href}
                  role="tab"
                  aria-selected={isActive}
                  data-testid={`tab-${instrument.id}`}
                  className={classes}
                >
                  {instrument.label}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
