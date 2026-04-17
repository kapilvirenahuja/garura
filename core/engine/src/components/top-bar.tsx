'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { InstrumentSwitcher } from '@/components/instrument-switcher';
import { ReadinessMiniGauge } from '@/components/readiness-mini-gauge';
import { SearchBar } from '@/components/search-bar';
import { useReadiness } from '@/components/readiness-provider';

export interface TopBarProps {
  /** Project name to display in the top bar, derived from config. */
  projectName?: string;
}

/**
 * Persistent top bar visible on every screen.
 * Contains: project name (from config), readiness mini-gauge, instrument switcher tabs, and search bar.
 *
 * The mini-gauge is wired to the ReadinessProvider context so it shows the
 * same score on Checklists, Flight Deck, Playbook, and Search views (VAL-CHECK-003).
 * Clicking the mini-gauge navigates to Checklists (VAL-CHECK-004, VAL-FOUND-011).
 */
export function TopBar({ projectName = 'Untitled Project' }: TopBarProps) {
  const { score } = useReadiness();
  const router = useRouter();

  // Wire search submission → Playbook Reader with the query as context.
  // Satisfies VAL-CROSS-007 (global search from any instrument lands in
  // the Playbook Reader) and the Playbook "entry from search" expectation
  // in mdb-playbook-entry-points.
  const handleSearch = useCallback(
    (query: string) => {
      const trimmed = query.trim();
      if (trimmed.length === 0) return;
      router.push(`/playbook?query=${encodeURIComponent(trimmed)}`);
    },
    [router],
  );

  return (
    <header
      className="sticky top-0 z-50 border-b border-gray-800 bg-gray-950/95 backdrop-blur-sm"
      data-testid="top-bar"
    >
      <div className="flex items-center justify-between px-4 py-2">
        {/* Left: Project name + readiness gauge */}
        <div className="flex items-center gap-4">
          <h1
            className="text-sm font-semibold tracking-tight text-white"
            data-testid="project-name"
          >
            {projectName}
          </h1>
          <ReadinessMiniGauge score={score} />
        </div>

        {/* Center: Instrument tabs */}
        <InstrumentSwitcher />

        {/* Right: Search */}
        <SearchBar onSearch={handleSearch} />
      </div>
    </header>
  );
}
