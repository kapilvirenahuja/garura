'use client';

import { PROJECT_NAME } from '@/lib/constants';
import { InstrumentSwitcher } from '@/components/instrument-switcher';
import { ReadinessMiniGauge } from '@/components/readiness-mini-gauge';
import { SearchBar } from '@/components/search-bar';

/**
 * Persistent top bar visible on every screen.
 * Contains: project name, readiness mini-gauge, instrument switcher tabs, and search bar.
 */
export function TopBar() {
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
            {PROJECT_NAME}
          </h1>
          <ReadinessMiniGauge score={0} />
        </div>

        {/* Center: Instrument tabs */}
        <InstrumentSwitcher />

        {/* Right: Search */}
        <SearchBar />
      </div>
    </header>
  );
}
