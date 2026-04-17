'use client';

export type ContentSlotState = 'idle' | 'active' | 'error';

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
}

/**
 * Expandable content area.
 * In **idle** state: shows a muted placeholder.
 * In **active** state: shows streaming content with an optional progress indicator.
 * In **error** state: shows error styling with error message (VAL-CHECK-038).
 */
export function ContentSlot({
  state,
  content = '',
  placeholder = 'Waiting for output…',
  progress,
  errorMessage,
}: ContentSlotProps) {
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
        className="rounded-md border border-red-800 bg-red-900/20 px-4 py-3"
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
            {content}
          </pre>
        )}
      </div>
    );
  }

  return (
    <div
      data-testid="content-slot"
      data-state="active"
      className="rounded-md border border-gray-700 bg-gray-900 px-4 py-3"
    >
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
        {content}
      </pre>
    </div>
  );
}
