'use client';

/**
 * Global search bar placeholder displayed in the top bar.
 * Accepts text input with placeholder text. Full search functionality
 * will be wired up by the mdb-search-index feature.
 */
export function SearchBar() {
  return (
    <div className="relative" data-testid="search-bar">
      <svg
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
      <input
        type="text"
        placeholder="Search artifacts..."
        data-testid="search-bar-input"
        aria-label="Search artifacts"
        className="w-48 rounded-md border border-gray-700 bg-gray-800/50 py-1.5 pl-9 pr-3 text-sm text-gray-200 placeholder-gray-500 transition-colors focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500 lg:w-64"
      />
    </div>
  );
}
