'use client';

import { StatusBadge } from '@/components/status-badge';
import { CTAButton } from '@/components/cta-button';

export interface ActionCardProps {
  /** Card title. */
  title: string;
  /** Card description text. */
  description: string;
  /** Status string rendered via StatusBadge. */
  status: string;
  /** Optional CTA configuration. */
  cta?: {
    label: string;
    playName: string;
    args?: Record<string, string>;
  };
  /** Callback when CTA is executed. */
  onExecute?: (playName: string, args?: Record<string, string>) => void;
}

/**
 * Renders a card with a title, description, status indicator,
 * and an optional CTA button.
 */
export function ActionCard({ title, description, status, cta, onExecute }: ActionCardProps) {
  return (
    <div data-testid="action-card" className="rounded-lg border border-gray-800 bg-gray-900 p-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 data-testid="action-card-title" className="text-sm font-semibold text-white">
          {title}
        </h3>
        <StatusBadge status={status} />
      </div>
      <p data-testid="action-card-description" className="mb-3 text-sm text-gray-400">
        {description}
      </p>
      {cta && (
        <CTAButton
          label={cta.label}
          playName={cta.playName}
          args={cta.args}
          onExecute={onExecute}
        />
      )}
    </div>
  );
}
