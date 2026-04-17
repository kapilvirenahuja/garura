'use client';

export type ChecklistItemState = 'done' | 'in-progress' | 'pending' | 'locked';

export interface ChecklistItemProps {
  /** Label / name of the checklist step. */
  label: string;
  /** Current state. */
  state: ChecklistItemState;
  /** Callback fired when a clickable item is activated. */
  onClick?: () => void;
}

const STATE_CONFIG: Record<
  ChecklistItemState,
  { icon: string; classes: string; interactive: boolean }
> = {
  done: {
    icon: '●',
    classes: 'text-emerald-500',
    interactive: false,
  },
  'in-progress': {
    icon: '◐',
    classes: 'text-amber-400',
    interactive: true,
  },
  pending: {
    icon: '○',
    classes: 'text-gray-300',
    interactive: true,
  },
  locked: {
    icon: '◌',
    classes: 'text-gray-600',
    interactive: false,
  },
};

/**
 * Individual checklist step with four distinct visual states:
 * - **done** (●) — completed, non-interactive
 * - **in-progress** (◐) — active / current step
 * - **pending** (○) — unlocked but not started, clickable
 * - **locked** (◌) — muted, non-interactive
 */
export function ChecklistItem({ label, state, onClick }: ChecklistItemProps) {
  const config = STATE_CONFIG[state];

  const handleClick = () => {
    if (config.interactive && onClick) {
      onClick();
    }
  };

  return (
    <div
      data-testid="checklist-item"
      data-state={state}
      className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm ${
        config.interactive ? 'cursor-pointer hover:bg-gray-800/50' : ''
      } ${state === 'locked' ? 'opacity-50' : ''}`}
      onClick={handleClick}
      role={config.interactive ? 'button' : undefined}
      tabIndex={config.interactive ? 0 : undefined}
      onKeyDown={
        config.interactive
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleClick();
              }
            }
          : undefined
      }
    >
      <span
        data-testid="checklist-item-icon"
        className={`text-base ${config.classes}`}
        aria-hidden="true"
      >
        {config.icon}
      </span>
      <span
        data-testid="checklist-item-label"
        className={state === 'done' ? 'text-gray-400 line-through' : 'text-gray-200'}
      >
        {label}
      </span>
    </div>
  );
}
