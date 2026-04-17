'use client';

import { useState } from 'react';

export type WikiTagState = 'pending' | 'running' | 'complete';

export interface WikiTagProps {
  /** Display text of the tag (e.g. "play-name:prompt"). */
  text: string;
  /** Current lifecycle state. */
  state: WikiTagState;
  /** Result content (available when complete). */
  result?: string;
}

/**
 * Inline wiki tag rendered from `[[play-name:prompt]]` patterns.
 *
 * Three lifecycle states:
 * - **pending** — highlight + play icon, indicating it can be triggered.
 * - **running** — animated spinner indicating execution in progress.
 * - **complete** — checkmark + collapsed summary with an expand control.
 */
export function WikiTag({ text, state, result }: WikiTagProps) {
  const [expanded, setExpanded] = useState(false);

  if (state === 'pending') {
    return (
      <span
        data-testid="wiki-tag"
        data-state="pending"
        className="inline-flex items-center gap-1 rounded bg-yellow-900/30 px-1.5 py-0.5 text-xs text-yellow-400"
      >
        <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1.5-8.5v-3a1.5 1.5 0 013 0v2.379l1.56 1.56a1.5 1.5 0 01-2.12 2.122l-2-2A1.5 1.5 0 018.5 9.5z"
            clipRule="evenodd"
          />
        </svg>
        <span data-testid="wiki-tag-text">{text}</span>
      </span>
    );
  }

  if (state === 'running') {
    return (
      <span
        data-testid="wiki-tag"
        data-state="running"
        className="inline-flex items-center gap-1 rounded bg-blue-900/30 px-1.5 py-0.5 text-xs text-blue-400"
      >
        <svg
          className="h-3 w-3 animate-spin"
          data-testid="wiki-tag-spinner"
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
        <span data-testid="wiki-tag-text">{text}</span>
      </span>
    );
  }

  // state === 'complete'
  return (
    <span
      data-testid="wiki-tag"
      data-state="complete"
      className="inline-flex flex-col rounded bg-emerald-900/30 px-1.5 py-0.5 text-xs text-emerald-400"
    >
      <span className="inline-flex items-center gap-1">
        <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
          <path
            fillRule="evenodd"
            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
            clipRule="evenodd"
          />
        </svg>
        <span data-testid="wiki-tag-text">{text}</span>
        <button
          type="button"
          data-testid="wiki-tag-expand"
          className="ml-1 text-emerald-500 underline hover:text-emerald-300"
          onClick={() => setExpanded(!expanded)}
          aria-label={expanded ? 'Collapse result' : 'Expand result'}
        >
          {expanded ? 'collapse' : 'expand'}
        </button>
      </span>
      {expanded && result && (
        <span data-testid="wiki-tag-result" className="mt-1 block text-gray-300">
          {result}
        </span>
      )}
    </span>
  );
}
