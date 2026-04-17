'use client';

export interface CTAButtonProps {
  /** Button label text. */
  label: string;
  /** Name of the Meridian play to execute. */
  playName: string;
  /** Optional arguments passed to the play. */
  args?: Record<string, string>;
  /** Callback fired when the button is clicked. Receives play name and args. */
  onExecute?: (playName: string, args?: Record<string, string>) => void;
}

/**
 * Styled call-to-action button mapped to a Meridian play.
 * Fires `onExecute` with the play name and optional arguments when clicked.
 */
export function CTAButton({ label, playName, args, onExecute }: CTAButtonProps) {
  const handleClick = () => {
    onExecute?.(playName, args);
  };

  return (
    <button
      type="button"
      data-testid="cta-button"
      data-play={playName}
      onClick={handleClick}
      className="inline-flex items-center gap-2 rounded-md border border-blue-700 bg-blue-900/50 px-4 py-2 text-sm font-medium text-blue-300 transition-colors hover:border-blue-600 hover:bg-blue-900/70"
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
