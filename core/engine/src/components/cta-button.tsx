'use client';

import { useState, useCallback, useRef } from 'react';

export interface CTAButtonProps {
  /** Button label text. */
  label: string;
  /** Name of the Meridian play to execute. */
  playName: string;
  /** Optional arguments passed to the play. */
  args?: Record<string, string>;
  /** Callback fired when the button is clicked. Receives play name and args. */
  onExecute?: (playName: string, args?: Record<string, string>) => void;
  /** Whether the button is disabled (e.g., another execution is running). */
  disabled?: boolean;
}

/**
 * Styled call-to-action button mapped to a Meridian play.
 * Fires `onExecute` with the play name and optional arguments when clicked.
 *
 * Implements rapid click debounce (VAL-CHECK-035): after the first click,
 * the button disables for 500ms to prevent duplicate executions.
 */
export function CTAButton({ label, playName, args, onExecute, disabled = false }: CTAButtonProps) {
  const [debounced, setDebounced] = useState(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleClick = useCallback(() => {
    if (debounced || disabled) return;

    // Debounce: prevent rapid clicks (VAL-CHECK-035)
    setDebounced(true);
    debounceTimer.current = setTimeout(() => setDebounced(false), 500);

    onExecute?.(playName, args);
  }, [debounced, disabled, onExecute, playName, args]);

  const isDisabled = disabled || debounced;

  return (
    <button
      type="button"
      data-testid="cta-button"
      data-play={playName}
      onClick={handleClick}
      disabled={isDisabled}
      aria-disabled={isDisabled}
      className={`inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium transition-colors ${
        isDisabled
          ? 'cursor-not-allowed border-gray-700 bg-gray-800/50 text-gray-500'
          : 'border-blue-700 bg-blue-900/50 text-blue-300 hover:border-blue-600 hover:bg-blue-900/70'
      }`}
    >
      <svg
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      {label}
    </button>
  );
}
