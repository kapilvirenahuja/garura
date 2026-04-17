'use client';

import type { PlayLogEntry, PlayLogStatus } from '@/lib/flight-deck';

/**
 * Recent play activity table for the Flight Deck.
 *
 * Columns: Time, Play name, Epic, Status, Duration. Entries are rendered in
 * the order supplied by the caller, which the aggregator already sorts
 * most-recent-first (VAL-FLIGHT-019). When the list is empty the table is
 * not rendered; an inline empty-state panel takes its place (VAL-FLIGHT-021).
 *
 * Fulfills:
 *   VAL-FLIGHT-018  Table columns: Time, Play name, Epic, Status, Duration
 *   VAL-FLIGHT-019  Sorted by most recent first
 *   VAL-FLIGHT-020  Distinct colored status indicators
 *                   ● DONE green, ✗ FAIL red, ⚠ WARN yellow, ◐ RUNNING blue
 *   VAL-FLIGHT-021  Empty state message "No play activity yet"
 *   VAL-FLIGHT-033  Sits at the bottom of the Flight Deck spatial hierarchy
 */

export interface PlayLogTableProps {
  entries: readonly PlayLogEntry[];
  empty: boolean;
}

interface StatusStyle {
  readonly glyph: string;
  readonly label: string;
  readonly color: string;
  readonly dotColor: string;
}

const STATUS_STYLES: Record<PlayLogStatus, StatusStyle> = {
  DONE: {
    glyph: '●',
    label: 'DONE',
    color: 'text-emerald-400',
    dotColor: 'bg-emerald-500',
  },
  FAIL: {
    glyph: '✗',
    label: 'FAIL',
    color: 'text-red-400',
    dotColor: 'bg-red-500',
  },
  WARN: {
    glyph: '⚠',
    label: 'WARN',
    color: 'text-amber-400',
    dotColor: 'bg-amber-500',
  },
  RUNNING: {
    glyph: '◐',
    label: 'RUNNING',
    color: 'text-blue-400',
    dotColor: 'bg-blue-500',
  },
  UNKNOWN: {
    glyph: '○',
    label: 'UNKNOWN',
    color: 'text-gray-400',
    dotColor: 'bg-gray-500',
  },
};

function PlayLogStatusIndicator({ status }: { status: PlayLogStatus }) {
  const style = STATUS_STYLES[status];
  return (
    <span
      data-testid="play-log-status"
      data-status={status}
      className={`inline-flex items-center gap-1.5 text-xs font-semibold tabular-nums ${style.color}`}
    >
      <span
        aria-hidden="true"
        data-testid="play-log-status-dot"
        className={`h-2 w-2 rounded-full ${style.dotColor}`}
      />
      <span aria-hidden="true" className="font-normal">
        {style.glyph}
      </span>
      <span>{style.label}</span>
    </span>
  );
}

export function PlayLogTable({ entries, empty }: PlayLogTableProps) {
  if (empty || entries.length === 0) {
    return (
      <section
        data-testid="flight-deck-play-log"
        aria-label="Recent play activity"
        className="space-y-3"
      >
        <div className="flex items-baseline justify-between">
          <h3 className="text-lg font-semibold text-gray-200">Recent play activity</h3>
        </div>
        <div
          data-testid="flight-deck-play-log-empty"
          className="rounded-lg border border-dashed border-gray-700 bg-gray-900/30 px-6 py-8 text-center"
        >
          <p className="text-sm text-gray-400">No play activity yet</p>
          <p className="mt-1 text-xs text-gray-500">
            Play runs triggered from Checklists or epic cards will appear here.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section
      data-testid="flight-deck-play-log"
      aria-label="Recent play activity"
      className="space-y-3"
    >
      <div className="flex items-baseline justify-between">
        <h3 className="text-lg font-semibold text-gray-200">Recent play activity</h3>
        <span className="text-xs uppercase tracking-wider text-gray-500">
          {entries.length} run{entries.length === 1 ? '' : 's'}
        </span>
      </div>
      <div className="overflow-x-auto rounded-lg border border-gray-800 bg-gray-900/50">
        <table
          data-testid="flight-deck-play-log-table"
          className="w-full min-w-[640px] text-left text-sm"
        >
          <thead className="bg-gray-900/80 text-xs uppercase tracking-wider text-gray-400">
            <tr>
              <th scope="col" className="px-4 py-2 font-semibold">
                Time
              </th>
              <th scope="col" className="px-4 py-2 font-semibold">
                Play name
              </th>
              <th scope="col" className="px-4 py-2 font-semibold">
                Epic
              </th>
              <th scope="col" className="px-4 py-2 font-semibold">
                Status
              </th>
              <th scope="col" className="px-4 py-2 font-semibold">
                Duration
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {entries.map((entry) => (
              <tr
                key={entry.id}
                data-testid="flight-deck-play-log-row"
                data-epic-id={entry.epicId}
                data-status={entry.status}
                data-timestamp={entry.timestamp ?? ''}
              >
                <td
                  data-testid="play-log-time"
                  className="px-4 py-2 whitespace-nowrap text-xs text-gray-400 tabular-nums"
                >
                  {entry.timeLabel || '—'}
                </td>
                <td
                  data-testid="play-log-play-name"
                  className="px-4 py-2 font-medium text-gray-200"
                >
                  {entry.playName}
                </td>
                <td
                  data-testid="play-log-epic"
                  className="px-4 py-2 whitespace-nowrap text-xs text-gray-400"
                >
                  {entry.epicLabel}
                </td>
                <td className="px-4 py-2 whitespace-nowrap">
                  <PlayLogStatusIndicator status={entry.status} />
                </td>
                <td
                  data-testid="play-log-duration"
                  className="px-4 py-2 whitespace-nowrap text-xs text-gray-400 tabular-nums"
                >
                  {entry.durationLabel}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
