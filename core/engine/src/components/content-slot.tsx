'use client';

export type ContentSlotState = 'idle' | 'active';

export interface ContentSlotProps {
  /** Current state of the slot. */
  state: ContentSlotState;
  /** Content to display when active. */
  content?: string;
  /** Placeholder text for idle state. */
  placeholder?: string;
  /** Progress fraction 0–1 (shown when active). */
  progress?: number;
}

/**
 * Expandable content area.
 * In **idle** state: shows a muted placeholder.
 * In **active** state: shows streaming content with an optional progress indicator.
 */
export function ContentSlot({
  state,
  content = '',
  placeholder = 'Waiting for output…',
  progress,
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
