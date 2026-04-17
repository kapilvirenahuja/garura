'use client';

import { useState } from 'react';

export interface InlineExpansionProps {
  /** Summary shown when collapsed. */
  summary: string;
  /** Content shown when expanded. */
  children: React.ReactNode;
  /** Initial open state. */
  defaultOpen?: boolean;
}

/**
 * Toggleable inline expansion panel.
 * When **closed** — displays a compact summary with a toggle control.
 * When **open** — displays the children content, pushing surrounding
 * content downward. Closing removes the expanded section and re-flows.
 */
export function InlineExpansion({ summary, children, defaultOpen = false }: InlineExpansionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div data-testid="inline-expansion" data-open={isOpen} className="my-1">
      <button
        type="button"
        data-testid="inline-expansion-toggle"
        onClick={() => setIsOpen((prev) => !prev)}
        className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-200"
        aria-expanded={isOpen}
      >
        <svg
          className={`h-3 w-3 transition-transform ${isOpen ? 'rotate-90' : ''}`}
          fill="currentColor"
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
            clipRule="evenodd"
          />
        </svg>
        {summary}
      </button>
      {isOpen && (
        <div data-testid="inline-expansion-content" className="mt-2 pl-4 border-l border-gray-700">
          {children}
        </div>
      )}
    </div>
  );
}
