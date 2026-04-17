'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { CrossRefToken } from '@/components/cross-ref-token';
import { parseOutputTokens } from '@/lib/output-tokens';

/**
 * Lifecycle states of a ContentSlot.
 *
 *   - `idle`     — no play has been triggered yet. Shows a muted
 *                  placeholder.
 *   - `active`   — a play is running; streaming output fills the slot.
 *                  Entrance transition animates the slot smoothly into
 *                  view (VAL-ACTION-017).
 *   - `complete` — the play finished successfully. The slot collapses to
 *                  a compact summary view with an expand control; the
 *                  full output is revealed on click (VAL-ACTION-018).
 *   - `error`    — the play failed. Slot renders with error styling and
 *                  the accompanying error message (VAL-CHECK-038).
 */
export type ContentSlotState = 'idle' | 'active' | 'complete' | 'error';

export interface ContentSlotProps {
  /** Current state of the slot. */
  state: ContentSlotState;
  /** Content to display when active. */
  content?: string;
  /** Placeholder text for idle state. */
  placeholder?: string;
  /** Progress fraction 0–1 (shown when active). */
  progress?: number;
  /** Error message to display in error state (VAL-CHECK-038). */
  errorMessage?: string;
  /**
   * Optional summary line shown in the compact `complete` view. When
   * omitted, the component derives a summary automatically from the
   * first non-empty line of `content` (or a neutral default if the
   * output is empty).
   */
  summary?: string;
  /**
   * Whether the `complete` slot should render already expanded on first
   * paint. Defaults to `false` — completed slots collapse to the
   * compact view so the reading surface isn't permanently occupied by
   * finished output (VAL-ACTION-018).
   */
  defaultExpanded?: boolean;
  /**
   * When true (the default), scan the streamed output for `[REFID]`
   * tokens (e.g. `[F1]`, `[SC-AUTH-001]`) and render them as clickable
   * {@link CrossRefToken}s that navigate to the Playbook Reader with
   * the referenced entity's context.
   *
   * Disable by passing `tokenizeOutput={false}` in contexts where
   * cross-ref resolution is handled by the caller (e.g. tests).
   *
   * Fulfills: VAL-CROSS-002 (checklist/CTA output tokens navigate to Playbook).
   */
  tokenizeOutput?: boolean;
  /**
   * Optional override for the token click handler. When omitted, the
   * default handler navigates to `/playbook?context=<refId>` via the
   * browser's `window.location` — keeping the component usable from any
   * rendering context (no router provider required).
   */
  onTokenClick?: (refId: string) => void;
}

/**
 * Renders a streamed output string as a mix of plain text and interactive
 * CrossRefTokens. Splits the input on the output-token regex and emits a
 * {@link CrossRefToken} for each recognised `[ID]` pattern. Plain text
 * flows through as-is so whitespace, newlines, and any ANSI-free output
 * are preserved.
 *
 * When `onTokenClick` is provided it is called with the clicked refId —
 * otherwise the component falls back to a router push into the Playbook
 * Reader.
 */
function renderOutputWithTokens(
  text: string,
  onTokenClick: (refId: string) => void,
): React.ReactNode {
  if (!text) return null;
  const segments = parseOutputTokens(text);
  if (segments.length === 0) return text;
  return segments.map((seg, i) =>
    seg.type === 'text' ? (
      <span key={i}>{seg.text}</span>
    ) : (
      <CrossRefToken key={i} refId={seg.refId} onClick={onTokenClick} />
    ),
  );
}

/**
 * Derive a short summary line from streamed output. Used when no
 * explicit `summary` prop is provided. Trims whitespace, pulls the
 * first non-empty line, and caps the result at 120 characters so it
 * still fits on a single row in the compact complete view.
 */
function deriveSummary(content: string): string {
  const trimmed = content.trim();
  if (trimmed.length === 0) return 'Play completed with no output.';
  const firstLine = trimmed.split(/\r?\n/).find((line) => line.trim().length > 0) ?? trimmed;
  const clipped = firstLine.length > 120 ? `${firstLine.slice(0, 117)}…` : firstLine;
  return clipped;
}

/**
 * Expandable content area. Lifecycle states are covered by
 * {@link ContentSlotState}. Two visual transitions are implemented:
 *
 *   1. A mount-time entrance animation on the `active` and `complete`
 *      states (VAL-ACTION-017). We rely on a short transition between
 *      initial `data-mounted="false"` and `data-mounted="true"` applied
 *      via a useEffect tick — this plays when the element first
 *      appears in the DOM (e.g. when the parent flips from "no slot"
 *      to "slot present" after a CTA click).
 *
 *   2. A controlled expand/collapse on the `complete` state — the
 *      slot starts in a compact summary view (VAL-ACTION-018) and
 *      reveals the full output when the user clicks the expand
 *      control. The reveal uses CSS max-height + opacity transitions
 *      so the content grows smoothly into view without jumping.
 *
 * Scroll position preservation (VAL-ACTION-028) is ensured by NOT
 * calling `scrollIntoView` or otherwise programmatically moving the
 * viewport when the slot mounts or updates. The browser keeps the
 * scroll position stable as long as the layout change happens below
 * the current scroll Y, which is the case for the slot's append-only
 * rendering model.
 */
export function ContentSlot({
  state,
  content = '',
  placeholder = 'Waiting for output…',
  progress,
  errorMessage,
  summary,
  defaultExpanded = false,
  tokenizeOutput = true,
  onTokenClick,
}: ContentSlotProps) {
  // Wire token clicks → Playbook Reader context navigation. We don't
  // take a dependency on `useRouter` here because ContentSlot is rendered
  // in many surfaces (tests, Storybook, static snapshots) where the App
  // Router context may not be mounted. Instead we fall back to the
  // browser's own navigation, which works anywhere `window` exists.
  const handleTokenClick = useCallback(
    (refId: string) => {
      if (onTokenClick) {
        onTokenClick(refId);
        return;
      }
      if (typeof window !== 'undefined') {
        window.location.href = `/playbook?context=${encodeURIComponent(refId)}`;
      }
    },
    [onTokenClick],
  );

  // Single entry point for token-aware rendering. When tokenisation is
  // disabled, return the raw text — callers can still read the string
  // via data-testid="content-slot-content".
  const renderOutput = useCallback(
    (text: string): React.ReactNode => {
      if (!tokenizeOutput) return text;
      return renderOutputWithTokens(text, handleTokenClick);
    },
    [tokenizeOutput, handleTokenClick],
  );
  // Mount-time entrance animation. `mounted` flips from false → true on
  // the first paint after the DOM node attaches, which drives the
  // opacity + translate transition that gives the slot its smooth
  // "appears into view" feel when a CTA is clicked.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // Use a micro-task so the initial frame renders with
    // data-mounted="false", and the subsequent frame applies the
    // mounted styles — yielding a visible transition even if the
    // browser batches updates.
    const t = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(t);
  }, []);

  // Expand / collapse control for the `complete` state. Completed slots
  // default to collapsed; clicking the expand control reveals the full
  // output. The control is re-usable to collapse again.
  const [expanded, setExpanded] = useState(defaultExpanded);

  // Track prior state so we can react to `active → complete` transitions.
  const prevStateRef = useRef<ContentSlotState>(state);
  useEffect(() => {
    // When a play transitions into `complete`, collapse the slot unless
    // the caller opted into an expanded default. This preserves the
    // "compact post-completion" contract (VAL-ACTION-018).
    if (prevStateRef.current !== 'complete' && state === 'complete') {
      setExpanded(defaultExpanded);
    }
    prevStateRef.current = state;
  }, [state, defaultExpanded]);

  if (state === 'idle') {
    return (
      <div
        data-testid="content-slot"
        data-state="idle"
        className="rounded-md border border-gray-800 bg-gray-900/50 px-4 py-3 text-sm text-gray-500 italic"
      >
        {placeholder}
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div
        data-testid="content-slot"
        data-state="error"
        data-mounted={mounted ? 'true' : 'false'}
        className={`rounded-md border border-red-800 bg-red-900/20 px-4 py-3 transform transition-all duration-200 ease-out ${
          mounted ? 'translate-y-0 opacity-100' : '-translate-y-1 opacity-0'
        }`}
      >
        <div className="mb-1 flex items-center gap-2">
          <span className="text-sm font-medium text-red-400" data-testid="content-slot-error-label">
            ✗ Execution failed
          </span>
        </div>
        {errorMessage && (
          <p className="text-sm text-red-300" data-testid="content-slot-error-message">
            {errorMessage}
          </p>
        )}
        {content && (
          <pre
            data-testid="content-slot-content"
            className="mt-2 whitespace-pre-wrap font-mono text-sm text-gray-400"
          >
            {renderOutput(content)}
          </pre>
        )}
      </div>
    );
  }

  if (state === 'complete') {
    const summaryText = summary ?? deriveSummary(content);
    const toggle = () => setExpanded((prev) => !prev);

    return (
      <div
        data-testid="content-slot"
        data-state="complete"
        data-mounted={mounted ? 'true' : 'false'}
        data-expanded={expanded ? 'true' : 'false'}
        className={`rounded-md border border-emerald-800 bg-emerald-900/10 transform transition-all duration-200 ease-out ${
          mounted ? 'translate-y-0 opacity-100' : '-translate-y-1 opacity-0'
        }`}
      >
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="flex min-w-0 items-center gap-2">
            <span
              className="text-sm font-medium text-emerald-400"
              data-testid="content-slot-complete-label"
              aria-hidden="true"
            >
              ✓
            </span>
            <span
              className="truncate text-sm text-emerald-200"
              data-testid="content-slot-summary"
              title={summaryText}
            >
              {summaryText}
            </span>
          </div>
          <button
            type="button"
            data-testid="content-slot-expand"
            aria-expanded={expanded}
            aria-label={expanded ? 'Collapse play output' : 'Expand play output'}
            onClick={toggle}
            className="flex-shrink-0 rounded border border-emerald-700/50 bg-emerald-800/30 px-2 py-0.5 text-xs text-emerald-200 transition-colors hover:bg-emerald-800/50"
          >
            {expanded ? 'Collapse' : 'Expand'}
          </button>
        </div>
        <div
          data-testid="content-slot-expanded-body"
          data-visible={expanded ? 'true' : 'false'}
          aria-hidden={!expanded}
          className={`overflow-hidden transition-all duration-200 ease-out ${
            expanded ? 'max-h-[40rem] opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          {content ? (
            <pre
              data-testid="content-slot-content"
              className="max-h-[40rem] overflow-auto border-t border-emerald-800/50 bg-emerald-950/10 px-4 py-3 whitespace-pre-wrap font-mono text-sm text-gray-300"
            >
              {renderOutput(content)}
            </pre>
          ) : (
            <p className="border-t border-emerald-800/50 px-4 py-3 text-sm text-gray-500 italic">
              No output was captured.
            </p>
          )}
        </div>
      </div>
    );
  }

  // active
  return (
    <div
      data-testid="content-slot"
      data-state="active"
      data-mounted={mounted ? 'true' : 'false'}
      className={`rounded-md border border-gray-700 bg-gray-900 px-4 py-3 transform transition-all duration-200 ease-out ${
        mounted ? 'translate-y-0 opacity-100' : '-translate-y-1 opacity-0'
      }`}
    >
      <div
        className="mb-2 flex items-center gap-2 text-xs text-blue-300"
        data-testid="content-slot-progress-indicator"
      >
        <span
          className="inline-block h-2 w-2 animate-pulse rounded-full bg-blue-400"
          aria-hidden="true"
        />
        <span>Running…</span>
      </div>
      {progress !== undefined && (
        <div className="mb-2 h-1 w-full overflow-hidden rounded-full bg-gray-700">
          <div
            className="h-full rounded-full bg-blue-500 transition-all"
            style={{ width: `${Math.min(100, Math.max(0, progress * 100))}%` }}
            data-testid="content-slot-progress"
          />
        </div>
      )}
      <pre
        data-testid="content-slot-content"
        className="whitespace-pre-wrap font-mono text-sm text-gray-300"
      >
        {renderOutput(content)}
      </pre>
    </div>
  );
}
