'use client';

export interface CrossRefTokenProps {
  /** The reference ID (e.g. "F1", "SC-AUTH-001"). */
  refId: string;
  /** Whether the reference is dangling (target not found in graph). */
  dangling?: boolean;
  /** Callback fired when the token is clicked, receiving the reference ID. */
  onClick?: (refId: string) => void;
}

/**
 * Inline clickable cross-reference token.
 * Renders [refId] as a compact badge. When `dangling` is true,
 * applies a distinct visual (dashed border, muted colour) signalling
 * a broken reference.
 */
export function CrossRefToken({ refId, dangling = false, onClick }: CrossRefTokenProps) {
  const handleClick = () => {
    onClick?.(refId);
  };

  return (
    <button
      type="button"
      data-testid="cross-ref-token"
      data-ref-id={refId}
      className={`inline-flex cursor-pointer items-center rounded px-1.5 py-0.5 font-mono text-xs transition-colors ${
        dangling
          ? 'border border-dashed border-gray-600 text-gray-500 line-through hover:border-gray-500'
          : 'bg-blue-900/40 text-blue-400 hover:bg-blue-900/60'
      }`}
      onClick={handleClick}
      aria-label={`Reference ${refId}${dangling ? ' (dangling)' : ''}`}
    >
      [{refId}]
    </button>
  );
}
