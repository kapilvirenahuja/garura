'use client';

import type { FlightDeckEpicCard } from '@/lib/flight-deck';
import { CTAButton } from '@/components/cta-button';

/**
 * "Needs Attention" card — expanded layout with AI diagnostic, listed issues,
 * and multi-action CTAs (Run QA Check, View Issues, Open in Reader).
 *
 * Fulfills:
 *   VAL-FLIGHT-008  Surfaces failed epics prominently
 *   VAL-FLIGHT-011  AI diagnostic sentence
 *   VAL-FLIGHT-022  Name, developer, stage, last activity, status color
 *   VAL-FLIGHT-023  Issue count + specific issue references
 *   VAL-FLIGHT-025  Contextual CTAs (attention variant)
 */
export interface AttentionCardProps {
  card: FlightDeckEpicCard;
  onOpenInReader?: (epicId: string) => void;
  onRunQaCheck?: (epicId: string) => void;
  onViewIssues?: (epicId: string) => void;
}

export function AttentionCard({
  card,
  onOpenInReader,
  onRunQaCheck,
  onViewIssues,
}: AttentionCardProps) {
  return (
    <article
      data-testid="flight-deck-attention-card"
      data-epic-id={card.id}
      data-status-color={card.statusColor}
      data-category="attention"
      className="rounded-lg border border-red-900/60 bg-red-950/20 p-5"
    >
      <header className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span
              data-testid="status-dot"
              className="h-2.5 w-2.5 flex-shrink-0 rounded-full bg-red-500"
              aria-label="Status: red"
            />
            <h3 data-testid="epic-name" className="truncate text-base font-semibold text-white">
              {card.name}
            </h3>
          </div>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-400">
            <span data-testid="epic-developer">{card.developer}</span>
            <span aria-hidden="true" className="text-gray-600">
              ·
            </span>
            <span data-testid="epic-stage">{card.stage}</span>
            {card.lastActivityRelative && (
              <>
                <span aria-hidden="true" className="text-gray-600">
                  ·
                </span>
                <span data-testid="epic-last-activity">{card.lastActivityRelative}</span>
              </>
            )}
          </p>
        </div>
        <span
          data-testid="epic-issue-count"
          className="rounded-full border border-red-900 bg-red-900/40 px-2.5 py-0.5 text-xs font-semibold text-red-300"
          title={`${card.issueCount} open issue${card.issueCount === 1 ? '' : 's'}`}
        >
          {card.issueCount} issue{card.issueCount === 1 ? '' : 's'}
        </span>
      </header>

      {card.aiDiagnostic && (
        <p data-testid="epic-diagnostic" className="mt-4 text-sm text-gray-200">
          {card.aiDiagnostic}
        </p>
      )}

      {card.lastCommitMessage && (
        <p
          data-testid="epic-last-commit-message"
          className="mt-3 truncate text-xs text-gray-500"
          title={card.lastCommitMessage}
        >
          Last commit: {card.lastCommitMessage}
        </p>
      )}

      {card.issues.length > 0 && (
        <ul data-testid="epic-issues" className="mt-3 space-y-1 text-xs text-red-300">
          {card.issues.slice(0, 4).map((issue) => (
            <li key={issue} className="flex items-start gap-2">
              <span aria-hidden="true" className="text-red-500">
                ✗
              </span>
              <span className="truncate">{issue}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-5 flex flex-wrap gap-2" data-testid="epic-ctas">
        <CTAButton
          label="Run QA Check"
          playName="quality-check"
          args={{ epic: card.id }}
          onExecute={() => onRunQaCheck?.(card.id)}
        />
        <button
          type="button"
          data-testid="epic-cta-view-issues"
          onClick={() => onViewIssues?.(card.id)}
          className="inline-flex items-center gap-2 rounded-md border border-gray-700 bg-gray-900 px-4 py-2 text-sm font-medium text-gray-200 transition-colors hover:border-gray-600 hover:bg-gray-800"
        >
          View Issues
        </button>
        <button
          type="button"
          data-testid="epic-cta-open-in-reader"
          onClick={() => onOpenInReader?.(card.id)}
          className="inline-flex items-center gap-2 rounded-md border border-gray-700 bg-gray-900 px-4 py-2 text-sm font-medium text-gray-200 transition-colors hover:border-gray-600 hover:bg-gray-800"
        >
          Open in Reader
        </button>
      </div>
    </article>
  );
}

/**
 * "On Track" card — compact layout with minimal information and a single
 * "Open in Reader" CTA.
 *
 * Fulfills:
 *   VAL-FLIGHT-009  Compact cards — minimal information only
 *   VAL-FLIGHT-010  Yellow status indicator for stalled epics
 *   VAL-FLIGHT-022  Name, developer, stage, last activity, status color
 *   VAL-FLIGHT-025  Contextual CTAs (on-track variant — single action)
 */
export interface OnTrackCardProps {
  card: FlightDeckEpicCard;
  onOpenInReader?: (epicId: string) => void;
}

const STATUS_DOT_CLASSES: Record<FlightDeckEpicCard['statusColor'], string> = {
  green: 'bg-emerald-500',
  yellow: 'bg-amber-500',
  red: 'bg-red-500',
};

export function OnTrackCard({ card, onOpenInReader }: OnTrackCardProps) {
  return (
    <article
      data-testid="flight-deck-on-track-card"
      data-epic-id={card.id}
      data-status-color={card.statusColor}
      data-category="on-track"
      className="rounded-lg border border-gray-800 bg-gray-900/50 p-4 transition-colors hover:border-gray-700"
    >
      <div className="flex items-start gap-2">
        <span
          data-testid="status-dot"
          className={`mt-1 h-2 w-2 flex-shrink-0 rounded-full ${STATUS_DOT_CLASSES[card.statusColor]}`}
          aria-label={`Status: ${card.statusColor}`}
        />
        <div className="min-w-0 flex-1">
          <h3 data-testid="epic-name" className="truncate text-sm font-semibold text-white">
            {card.name}
          </h3>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-gray-400">
            <span data-testid="epic-developer">{card.developer}</span>
            <span aria-hidden="true" className="text-gray-600">
              ·
            </span>
            <span data-testid="epic-stage">{card.stage}</span>
          </p>
        </div>
      </div>

      {card.lastActivityRelative && (
        <p
          data-testid="epic-last-activity"
          className="mt-2 text-[11px] uppercase tracking-wide text-gray-500"
        >
          {card.lastActivityRelative}
        </p>
      )}

      {card.lastCommitMessage && (
        <p
          data-testid="epic-last-commit-message"
          className="mt-1 truncate text-xs text-gray-500"
          title={card.lastCommitMessage}
        >
          {card.lastCommitMessage}
        </p>
      )}

      <div className="mt-3" data-testid="epic-ctas">
        <button
          type="button"
          data-testid="epic-cta-open-in-reader"
          onClick={() => onOpenInReader?.(card.id)}
          className="inline-flex items-center gap-1 rounded-md border border-gray-700 bg-gray-900 px-3 py-1.5 text-xs font-medium text-gray-300 transition-colors hover:border-gray-600 hover:bg-gray-800"
        >
          Open in Reader
          <span aria-hidden="true">→</span>
        </button>
      </div>
    </article>
  );
}
