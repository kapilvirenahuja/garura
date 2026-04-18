'use client';

import { useState, useCallback, useEffect, useRef } from 'react';

export interface CTAButtonProps {
  /** Button label text. */
  label: string;
  /** Name of the Garura play to execute. */
  playName: string;
  /** Optional arguments passed to the play. */
  args?: Record<string, string>;
  /** Callback fired when the button is clicked. Receives play name and args. */
  onExecute?: (playName: string, args?: Record<string, string>) => void;
  /** Whether the button is disabled (e.g., another execution is running). */
  disabled?: boolean;
}

/**
 * Styled call-to-action button mapped to a Garura play.
 * Fires `onExecute` with the play name and optional arguments when clicked.
 *
 * Implements rapid click debounce (VAL-CHECK-035): after the first click,
 * the button disables for 500ms to prevent duplicate executions.
 *
 * Defense in depth against rapid clicks:
 * 1. Ref-based guard (synchronous, wins the race when React hasn't re-rendered
 *    the `disabled` attribute yet between back-to-back click events).
 * 2. Timestamp check (500ms window) on the ref — ensures any click within
 *    500ms of the last accepted click is rejected immediately.
 * 3. React state (`debounced`) — drives the `disabled` attribute so the
 *    browser itself will suppress clicks once the DOM is updated.
 */
export function CTAButton({ label, playName, args, onExecute, disabled = false }: CTAButtonProps) {
  const [debounced, setDebounced] = useState(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Synchronous guards — update in the same tick as the click handler.
  // React state updates are asynchronous; refs are not, which closes the
  // small window during which rapid back-to-back clicks could both pass the
  // `debounced`/`disabled` check.
  const lockedRef = useRef(false);
  const lastClickTsRef = useRef(0);

  const handleClick = useCallback(() => {
    const now = Date.now();

    // Synchronous ref-based guards (wins the race before React re-renders).
    if (lockedRef.current) return;
    if (now - lastClickTsRef.current < 500) return;

    // State-based guards (kept for prop-driven disabling).
    if (debounced || disabled) return;

    // Lock synchronously so subsequent clicks in the same event loop are rejected.
    lockedRef.current = true;
    lastClickTsRef.current = now;

    // React state — drives the `disabled` attribute on the next render.
    setDebounced(true);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setDebounced(false);
      lockedRef.current = false;
    }, 500);

    onExecute?.(playName, args);
  }, [debounced, disabled, onExecute, playName, args]);

  // Cleanup the debounce timer on unmount. Without this, a click that
  // schedules `setTimeout(..., 500)` can fire after the component (and in
  // tests, the whole jsdom environment) is torn down. When that happens the
  // callback tries to call `setDebounced` → React's scheduler touches the DOM
  // and crashes with `window is not defined`. Clearing on unmount makes the
  // timer a no-op after teardown.
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
        debounceTimer.current = null;
      }
    };
  }, []);

  const isDisabled = disabled || debounced;

  // Prominent "double-border + accent" styling (VAL-ACTION-006): the
  // wireframe represents CTAs as ╔══╗ / ╚══╝ — rendered via CSS
  // `border-double`. Browsers require border width ≥ 3px for the second
  // line to be painted, hence `border-[3px]`. The accent hue (blue family)
  // keeps CTAs visually distinct from plain secondary buttons (which use
  // gray borders) and aligns with the existing action accent palette.
  const baseClasses =
    'inline-flex items-center gap-2 rounded-md border-[3px] border-double px-4 py-2 text-sm font-medium transition-colors';
  const activeClasses =
    'border-blue-500 bg-blue-900/40 text-blue-200 hover:border-blue-400 hover:bg-blue-900/60';
  const disabledClasses = 'cursor-not-allowed border-gray-700 bg-gray-800/50 text-gray-500';

  return (
    <button
      type="button"
      data-testid="cta-button"
      data-play={playName}
      data-cta-prominent="true"
      onClick={handleClick}
      disabled={isDisabled}
      aria-disabled={isDisabled}
      aria-label={`${label} — ${playName}`}
      className={`${baseClasses} ${isDisabled ? disabledClasses : activeClasses}`}
    >
      <svg
        data-testid="cta-button-icon"
        className="h-4 w-4 flex-shrink-0"
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
      {/*
        Label is kept as a direct text node so consumers that match the
        button via `getByText(label)` (without a regex) continue to
        resolve it — testing-library's `getByText` looks at the direct
        text-node children of each element.
      */}
      {label}
      {/*
        Mapped play name — visible per VAL-ACTION-006. Rendered as a
        sibling span so the direct-text label above stays intact.
      */}
      <span
        data-testid="cta-button-play"
        className={`ml-1 font-mono text-xs ${isDisabled ? 'text-gray-500' : 'text-blue-300/80'}`}
      >
        → {playName}
      </span>
    </button>
  );
}
