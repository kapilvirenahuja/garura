'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

export interface SearchBarProps {
  /** Callback fired on Enter press or after debounce delay. */
  onSearch?: (query: string) => void;
  /** Whether a search is currently in progress. */
  isLoading?: boolean;
  /** Debounce delay in milliseconds. Pass 0 to disable debounce. */
  debounceMs?: number;
}

/**
 * Global search bar with Enter-submit, debounce, Escape-to-clear,
 * and an optional loading indicator.
 *
 * When no `onSearch` is provided, behaves as a simple input placeholder
 * (backwards-compatible with the original shell usage).
 */
export function SearchBar({ onSearch, isLoading = false, debounceMs = 300 }: SearchBarProps) {
  const [value, setValue] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearDebounce = useCallback(() => {
    if (debounceRef.current !== null) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => clearDebounce, [clearDebounce]);

  const fireSearch = useCallback(
    (query: string) => {
      if (onSearch && query.trim().length > 0) {
        onSearch(query);
      }
    },
    [onSearch],
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.value;
    setValue(next);

    if (onSearch && debounceMs > 0) {
      clearDebounce();
      debounceRef.current = setTimeout(() => {
        fireSearch(next);
      }, debounceMs);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      clearDebounce();
      fireSearch(value);
    } else if (e.key === 'Escape') {
      clearDebounce();
      setValue('');
    }
  };

  return (
    <div className="relative" data-testid="search-bar">
      {isLoading ? (
        <svg
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-gray-400"
          data-testid="search-bar-loading"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      ) : (
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
      )}
      <input
        type="text"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="Search artifacts..."
        data-testid="search-bar-input"
        aria-label="Search artifacts"
        className="w-48 rounded-md border border-gray-700 bg-gray-800/50 py-1.5 pl-9 pr-3 text-sm text-gray-200 placeholder-gray-500 transition-colors focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500 lg:w-64"
      />
    </div>
  );
}
