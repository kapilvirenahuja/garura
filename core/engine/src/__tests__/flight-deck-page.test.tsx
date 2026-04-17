/**
 * Tests for the Flight Deck page layout and behavior.
 *
 * Fulfills:
 *   VAL-FLIGHT-004  Empty state
 *   VAL-FLIGHT-008  Needs Attention prominently placed
 *   VAL-FLIGHT-009  On Track compact cards
 *   VAL-FLIGHT-011  AI diagnostic on attention cards
 *   VAL-FLIGHT-012  Empty state message
 *   VAL-FLIGHT-013  Epics In Flight counter
 *   VAL-FLIGHT-014  Active Developers counter
 *   VAL-FLIGHT-015  Plays Today counter
 *   VAL-FLIGHT-016  Open Issues counter
 *   VAL-FLIGHT-022  Required fields on each epic card
 *   VAL-FLIGHT-023  Attention cards show issues
 *   VAL-FLIGHT-024  Open in Reader navigation
 *   VAL-FLIGHT-025  Contextual CTAs differ on attention vs on-track
 *   VAL-FLIGHT-033  Spatial hierarchy
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup, fireEvent, within } from '@testing-library/react';
import FlightDeckPage from '@/app/flight-deck/page';
import type { FlightDeckData } from '@/lib/flight-deck';

// Mock next/navigation so the page can use useRouter().push() for Open in Reader.
const pushMock = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => '/flight-deck',
}));

function mockFetchOnce(payload: FlightDeckData, ok: boolean = true, status: number = 200) {
  (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
    ok,
    status,
    json: async () => payload,
  });
}

function makeCard(overrides: Partial<FlightDeckData['attention'][number]> = {}) {
  return {
    id: 'E1',
    slug: 'auth',
    name: 'E1: auth',
    branchName: 'feat/e1-auth',
    stage: 'Implementation',
    developer: 'Kapil',
    lastCommitMessage: 'wire up login',
    lastCommitTimestamp: '2025-04-17T11:45:00Z',
    lastActivityRelative: '15m ago',
    statusColor: 'green' as const,
    category: 'on-track' as const,
    issues: [],
    issueCount: 0,
    aiDiagnostic: '',
    failedQualityChecks: 0,
    failedPlays: 0,
    ...overrides,
  };
}

function makeData(partial: Partial<FlightDeckData> = {}): FlightDeckData {
  return {
    attention: [],
    onTrack: [],
    metrics: { epicsInFlight: 0, activeDevelopers: 0, playsToday: 0, openIssues: 0 },
    empty: true,
    error: null,
    lastUpdatedIso: '2025-04-17T12:00:00Z',
    ...partial,
  };
}

describe('Flight Deck page', () => {
  beforeEach(() => {
    pushMock.mockReset();
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('renders the empty state when no epics are in flight (VAL-FLIGHT-012)', async () => {
    mockFetchOnce(makeData({ empty: true }));
    render(<FlightDeckPage />);
    await waitFor(() => {
      expect(screen.getByTestId('flight-deck-empty-state')).toBeInTheDocument();
    });
    expect(screen.getByText(/no epics in flight/i)).toBeInTheDocument();
    expect(screen.queryByTestId('flight-deck-attention')).not.toBeInTheDocument();
    expect(screen.queryByTestId('flight-deck-on-track')).not.toBeInTheDocument();
  });

  it('renders live metric tiles with values from the API (VAL-FLIGHT-013..016)', async () => {
    mockFetchOnce(
      makeData({
        empty: false,
        onTrack: [makeCard({ id: 'E1' })],
        metrics: { epicsInFlight: 3, activeDevelopers: 2, playsToday: 5, openIssues: 4 },
      }),
    );
    render(<FlightDeckPage />);
    await waitFor(() => {
      expect(screen.getByTestId('flight-deck-metrics')).toBeInTheDocument();
    });
    const metrics = screen.getByTestId('flight-deck-metrics');
    expect(within(metrics).getByText('Epics In Flight')).toBeInTheDocument();
    expect(within(metrics).getByText('3')).toBeInTheDocument();
    expect(within(metrics).getByText('Active Devs')).toBeInTheDocument();
    expect(within(metrics).getByText('2')).toBeInTheDocument();
    expect(within(metrics).getByText('Plays Today')).toBeInTheDocument();
    expect(within(metrics).getByText('5')).toBeInTheDocument();
    expect(within(metrics).getByText('Open Issues')).toBeInTheDocument();
    expect(within(metrics).getByText('4')).toBeInTheDocument();
  });

  it('places Needs Attention before On Track in the DOM (VAL-FLIGHT-033)', async () => {
    mockFetchOnce(
      makeData({
        empty: false,
        attention: [
          makeCard({
            id: 'E1',
            category: 'attention',
            statusColor: 'red',
            issueCount: 2,
            issues: ['#142 flaky test', '#145 timeout regression'],
            aiDiagnostic: 'E1 has 1 failing quality check. Likely cause: regression.',
          }),
        ],
        onTrack: [makeCard({ id: 'E2', name: 'E2: billing' })],
        metrics: { epicsInFlight: 2, activeDevelopers: 1, playsToday: 0, openIssues: 2 },
      }),
    );

    render(<FlightDeckPage />);

    await waitFor(() => {
      expect(screen.getByTestId('flight-deck-attention')).toBeInTheDocument();
    });

    const attention = screen.getByTestId('flight-deck-attention');
    const onTrack = screen.getByTestId('flight-deck-on-track');
    const attentionPos = attention.compareDocumentPosition(onTrack);
    // Node.DOCUMENT_POSITION_FOLLOWING === 4 — onTrack comes after attention.
    expect(attentionPos & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    // Attention card shows diagnostic + issue references
    expect(within(attention).getByTestId('epic-diagnostic')).toHaveTextContent(/likely cause/i);
    expect(within(attention).getByTestId('epic-issues')).toHaveTextContent('#142 flaky test');
    expect(within(attention).getByTestId('epic-issue-count')).toHaveTextContent('2 issues');
  });

  it('on-track cards display required fields: name, developer, stage, last activity, status color (VAL-FLIGHT-022)', async () => {
    mockFetchOnce(
      makeData({
        empty: false,
        onTrack: [
          makeCard({
            id: 'E2',
            name: 'E2: billing',
            developer: 'Ada',
            stage: 'Preparing',
            lastActivityRelative: '2h ago',
            statusColor: 'yellow',
          }),
        ],
        metrics: { epicsInFlight: 1, activeDevelopers: 1, playsToday: 0, openIssues: 0 },
      }),
    );
    render(<FlightDeckPage />);
    await waitFor(() => {
      expect(screen.getByTestId('flight-deck-on-track')).toBeInTheDocument();
    });
    const card = screen.getByTestId('flight-deck-on-track-card');
    expect(within(card).getByTestId('epic-name')).toHaveTextContent('E2: billing');
    expect(within(card).getByTestId('epic-developer')).toHaveTextContent('Ada');
    expect(within(card).getByTestId('epic-stage')).toHaveTextContent('Preparing');
    expect(within(card).getByTestId('epic-last-activity')).toHaveTextContent('2h ago');
    expect(card.getAttribute('data-status-color')).toBe('yellow');
  });

  it('attention cards carry Run QA Check + View Issues + Open in Reader CTAs; on-track cards carry only Open in Reader (VAL-FLIGHT-025)', async () => {
    mockFetchOnce(
      makeData({
        empty: false,
        attention: [
          makeCard({
            id: 'E1',
            category: 'attention',
            statusColor: 'red',
            issueCount: 1,
            issues: ['#1'],
            aiDiagnostic: 'E1 has 1 failing quality check. Likely cause: regression.',
          }),
        ],
        onTrack: [makeCard({ id: 'E2' })],
        metrics: { epicsInFlight: 2, activeDevelopers: 1, playsToday: 0, openIssues: 1 },
      }),
    );
    render(<FlightDeckPage />);
    await waitFor(() => {
      expect(screen.getByTestId('flight-deck-attention-card')).toBeInTheDocument();
    });

    const attentionCard = screen.getByTestId('flight-deck-attention-card');
    expect(within(attentionCard).getByTestId('cta-button')).toHaveTextContent(/Run QA Check/i);
    expect(within(attentionCard).getByTestId('epic-cta-view-issues')).toBeInTheDocument();
    expect(within(attentionCard).getByTestId('epic-cta-open-in-reader')).toBeInTheDocument();

    const onTrackCard = screen.getByTestId('flight-deck-on-track-card');
    expect(within(onTrackCard).getByTestId('epic-cta-open-in-reader')).toBeInTheDocument();
    // No Run QA / View Issues on the on-track card.
    expect(within(onTrackCard).queryByTestId('cta-button')).not.toBeInTheDocument();
    expect(within(onTrackCard).queryByTestId('epic-cta-view-issues')).not.toBeInTheDocument();
  });

  it('Open in Reader navigates to the Playbook with epic context (VAL-FLIGHT-024)', async () => {
    mockFetchOnce(
      makeData({
        empty: false,
        onTrack: [makeCard({ id: 'E7' })],
        metrics: { epicsInFlight: 1, activeDevelopers: 1, playsToday: 0, openIssues: 0 },
      }),
    );
    render(<FlightDeckPage />);
    await waitFor(() => {
      expect(screen.getByTestId('flight-deck-on-track-card')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId('epic-cta-open-in-reader'));
    expect(pushMock).toHaveBeenCalledWith('/playbook?context=E7');
  });

  it('on-track grid uses a responsive class list (VAL-FLIGHT-034)', async () => {
    mockFetchOnce(
      makeData({
        empty: false,
        onTrack: [makeCard({ id: 'E1' }), makeCard({ id: 'E2' })],
        metrics: { epicsInFlight: 2, activeDevelopers: 1, playsToday: 0, openIssues: 0 },
      }),
    );
    render(<FlightDeckPage />);
    await waitFor(() => {
      expect(screen.getByTestId('flight-deck-on-track-grid')).toBeInTheDocument();
    });
    const grid = screen.getByTestId('flight-deck-on-track-grid');
    // Narrow default: single column. Wider breakpoints: 2/3/4 columns.
    const cls = grid.className;
    expect(cls).toContain('grid-cols-1');
    expect(cls).toContain('md:grid-cols-2');
    expect(cls).toContain('lg:grid-cols-3');
  });

  it('falls back to the empty state when the API errors out', async () => {
    (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({}),
    });

    render(<FlightDeckPage />);

    await waitFor(() => {
      expect(screen.getByTestId('flight-deck-empty-state')).toBeInTheDocument();
    });
    expect(screen.getByTestId('flight-deck-error-note')).toBeInTheDocument();
  });
});
