/**
 * Tests for the Flight Deck data-refresh mechanism, Last Updated indicator,
 * manual refresh button, scroll/expansion state preservation on tab switch,
 * and play-log → Playbook Reader navigation.
 *
 * Fulfills:
 *   VAL-FLIGHT-026  Loads data on open — switching to Flight Deck triggers
 *                   API calls for branches + STM (exposed as GET /api/flight-deck)
 *   VAL-FLIGHT-027  Last updated indicator visible on Flight Deck
 *   VAL-FLIGHT-028  Manual refresh control triggers full data reload (timestamp updates)
 *   VAL-FLIGHT-029  Tab switching preserves scroll and expansion state
 *   VAL-FLIGHT-032  Play log entry click navigates to Playbook Reader with play context
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup, fireEvent, within, act } from '@testing-library/react';
import FlightDeckPage from '@/app/flight-deck/page';
import type { FlightDeckData, PlayLogEntry } from '@/lib/flight-deck';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

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

function makeData(partial: Partial<FlightDeckData> = {}): FlightDeckData {
  return {
    attention: [],
    onTrack: [],
    metrics: { epicsInFlight: 0, activeDevelopers: 0, playsToday: 0, openIssues: 0 },
    playLog: [],
    playLogEmpty: true,
    empty: true,
    error: null,
    lastUpdatedIso: '2025-04-17T12:00:00Z',
    ...partial,
  };
}

function makePlayLogEntry(partial: Partial<PlayLogEntry> = {}): PlayLogEntry {
  return {
    id: 'E1|play-quality-check|2025-04-17T11:45:00Z',
    epicId: 'E1',
    epicLabel: 'E1: auth',
    playName: 'play-quality-check',
    timestamp: '2025-04-17T11:45:00Z',
    timeLabel: '15m ago',
    status: 'DONE',
    rawStatus: 'success',
    durationSeconds: 30,
    durationLabel: '30s',
    ...partial,
  };
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeOnTrackCard(overrides: Partial<FlightDeckData['onTrack'][number]> = {}) {
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

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Flight Deck — data refresh mechanism', () => {
  beforeEach(() => {
    pushMock.mockReset();
    vi.stubGlobal('fetch', vi.fn());
    sessionStorage.clear();
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    sessionStorage.clear();
  });

  it('fetches /api/flight-deck on mount (tab open) — VAL-FLIGHT-026', async () => {
    mockFetchOnce(
      makeData({
        empty: false,
        onTrack: [makeOnTrackCard()],
        metrics: { epicsInFlight: 1, activeDevelopers: 1, playsToday: 0, openIssues: 0 },
      }),
    );
    render(<FlightDeckPage />);
    await waitFor(() => {
      expect(screen.getByTestId('flight-deck-on-track')).toBeInTheDocument();
    });
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith('/api/flight-deck');
  });

  it('renders the Last updated indicator with a human-readable relative time (VAL-FLIGHT-027)', async () => {
    const now = new Date();
    const twoMinsAgo = new Date(now.getTime() - 2 * 60 * 1000).toISOString();
    mockFetchOnce(
      makeData({
        empty: false,
        onTrack: [makeOnTrackCard()],
        metrics: { epicsInFlight: 1, activeDevelopers: 1, playsToday: 0, openIssues: 0 },
        lastUpdatedIso: twoMinsAgo,
      }),
    );
    render(<FlightDeckPage />);
    await waitFor(() => {
      expect(screen.getByTestId('flight-deck-last-updated')).toBeInTheDocument();
    });
    const lastUpdated = screen.getByTestId('flight-deck-last-updated');
    // Allow "just now", "1m ago", or "2m ago" since the anchor drift is tiny.
    expect(lastUpdated.textContent).toMatch(/Last updated:\s+(just now|[12]m ago)/i);
    // The machine-readable ISO timestamp is preserved as an attribute for tooling.
    expect(lastUpdated.getAttribute('data-timestamp')).toBe(twoMinsAgo);
  });

  it('manual refresh button triggers a full data reload and updates the timestamp (VAL-FLIGHT-028)', async () => {
    const firstIso = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const secondIso = new Date(Date.now() - 0).toISOString();

    mockFetchOnce(
      makeData({
        empty: false,
        onTrack: [makeOnTrackCard({ id: 'E1', name: 'E1: auth' })],
        metrics: { epicsInFlight: 1, activeDevelopers: 1, playsToday: 0, openIssues: 0 },
        lastUpdatedIso: firstIso,
      }),
    );
    render(<FlightDeckPage />);
    await waitFor(() => {
      expect(screen.getByTestId('flight-deck-on-track')).toBeInTheDocument();
    });
    expect(screen.getByTestId('flight-deck-last-updated').getAttribute('data-timestamp')).toBe(
      firstIso,
    );

    // Click refresh — queue a second response, then click.
    mockFetchOnce(
      makeData({
        empty: false,
        onTrack: [
          makeOnTrackCard({ id: 'E1', name: 'E1: auth' }),
          makeOnTrackCard({ id: 'E2', name: 'E2: billing' }),
        ],
        metrics: { epicsInFlight: 2, activeDevelopers: 1, playsToday: 1, openIssues: 0 },
        lastUpdatedIso: secondIso,
      }),
    );

    const refreshBtn = screen.getByTestId('flight-deck-refresh');
    fireEvent.click(refreshBtn);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(2);
    });
    await waitFor(() => {
      expect(screen.getByTestId('flight-deck-last-updated').getAttribute('data-timestamp')).toBe(
        secondIso,
      );
    });
    // Two epics now visible, metrics updated.
    expect(screen.getAllByTestId('flight-deck-on-track-card')).toHaveLength(2);
    const metrics = screen.getByTestId('flight-deck-metrics');
    expect(within(metrics).getByText('2')).toBeInTheDocument();
  });

  it('refresh button is disabled while a fetch is in flight', async () => {
    // First resolves synchronously on mount
    mockFetchOnce(
      makeData({
        empty: false,
        onTrack: [makeOnTrackCard()],
        metrics: { epicsInFlight: 1, activeDevelopers: 1, playsToday: 0, openIssues: 0 },
      }),
    );
    render(<FlightDeckPage />);
    await waitFor(() => {
      expect(screen.getByTestId('flight-deck-on-track')).toBeInTheDocument();
    });

    // Second request never resolves until we let it.
    let resolver:
      | ((value: { ok: boolean; status: number; json: () => Promise<unknown> }) => void)
      | null = null;
    (fetch as unknown as ReturnType<typeof vi.fn>).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolver = resolve;
        }),
    );

    const refreshBtn = screen.getByTestId('flight-deck-refresh') as HTMLButtonElement;
    fireEvent.click(refreshBtn);

    // Button disabled while fetch pending.
    await waitFor(() => {
      expect(refreshBtn.disabled).toBe(true);
    });

    // Resolve the fetch — button re-enabled.
    await act(async () => {
      resolver?.({
        ok: true,
        status: 200,
        json: async () =>
          makeData({
            empty: false,
            onTrack: [makeOnTrackCard()],
            metrics: { epicsInFlight: 1, activeDevelopers: 1, playsToday: 0, openIssues: 0 },
          }),
      });
    });
    await waitFor(() => {
      expect(refreshBtn.disabled).toBe(false);
    });
  });

  it('persists scroll position to sessionStorage when the component unmounts (VAL-FLIGHT-029)', async () => {
    mockFetchOnce(
      makeData({
        empty: false,
        onTrack: [makeOnTrackCard()],
        metrics: { epicsInFlight: 1, activeDevelopers: 1, playsToday: 0, openIssues: 0 },
      }),
    );
    const { unmount } = render(<FlightDeckPage />);
    await waitFor(() => {
      expect(screen.getByTestId('flight-deck-on-track')).toBeInTheDocument();
    });

    // Simulate the user scrolling.
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 742 });
    unmount();

    expect(sessionStorage.getItem('mdb:flight-deck:scroll-y')).toBe('742');
  });

  it('restores scroll position from sessionStorage on mount (VAL-FLIGHT-029)', async () => {
    sessionStorage.setItem('mdb:flight-deck:scroll-y', '512');
    const scrollSpy = vi.fn();
    const original = window.scrollTo;
    // jsdom's scrollTo is a noop — replace with a spy.
    Object.defineProperty(window, 'scrollTo', {
      configurable: true,
      value: scrollSpy,
      writable: true,
    });

    mockFetchOnce(
      makeData({
        empty: false,
        onTrack: [makeOnTrackCard()],
        metrics: { epicsInFlight: 1, activeDevelopers: 1, playsToday: 0, openIssues: 0 },
      }),
    );
    render(<FlightDeckPage />);
    await waitFor(() => {
      expect(screen.getByTestId('flight-deck-on-track')).toBeInTheDocument();
    });

    expect(scrollSpy).toHaveBeenCalledWith({ top: 512, left: 0, behavior: 'auto' });

    Object.defineProperty(window, 'scrollTo', {
      configurable: true,
      value: original,
      writable: true,
    });
  });

  it('persists expansion state across unmount / remount (VAL-FLIGHT-029)', async () => {
    mockFetchOnce(
      makeData({
        empty: false,
        onTrack: [makeOnTrackCard({ id: 'E1' }), makeOnTrackCard({ id: 'E2' })],
        metrics: { epicsInFlight: 2, activeDevelopers: 1, playsToday: 0, openIssues: 0 },
      }),
    );
    const first = render(<FlightDeckPage />);
    await waitFor(() => {
      expect(screen.getAllByTestId('flight-deck-on-track-card')).toHaveLength(2);
    });

    // Expand the E1 card.
    const expandBtn = screen.getAllByTestId('epic-expand-toggle')[0]!;
    fireEvent.click(expandBtn);
    // The expanded details panel is rendered.
    expect(screen.getByTestId('epic-details-E1')).toBeInTheDocument();

    first.unmount();
    // sessionStorage carries the expansion.
    const raw = sessionStorage.getItem('mdb:flight-deck:expanded');
    expect(raw).toBeTruthy();
    expect(JSON.parse(raw!)).toEqual(['E1']);

    // Remount — expansion survives.
    mockFetchOnce(
      makeData({
        empty: false,
        onTrack: [makeOnTrackCard({ id: 'E1' }), makeOnTrackCard({ id: 'E2' })],
        metrics: { epicsInFlight: 2, activeDevelopers: 1, playsToday: 0, openIssues: 0 },
      }),
    );
    render(<FlightDeckPage />);
    await waitFor(() => {
      expect(screen.getByTestId('epic-details-E1')).toBeInTheDocument();
    });
    expect(screen.queryByTestId('epic-details-E2')).not.toBeInTheDocument();
  });

  it('clicking a play-log row navigates to Playbook Reader with play context (VAL-FLIGHT-032)', async () => {
    mockFetchOnce(
      makeData({
        empty: false,
        onTrack: [makeOnTrackCard()],
        metrics: { epicsInFlight: 1, activeDevelopers: 1, playsToday: 1, openIssues: 0 },
        playLog: [
          makePlayLogEntry({
            id: 'E1|play-quality-check|2025-04-17T11:45:00Z',
            playName: 'play-quality-check',
          }),
        ],
        playLogEmpty: false,
      }),
    );
    render(<FlightDeckPage />);
    await waitFor(() => {
      expect(screen.getByTestId('flight-deck-play-log-table')).toBeInTheDocument();
    });
    const row = screen.getByTestId('flight-deck-play-log-row');
    fireEvent.click(row);
    expect(pushMock).toHaveBeenCalledWith(
      '/playbook?context=E1&play=play-quality-check&timestamp=2025-04-17T11%3A45%3A00Z',
    );
  });

  it('play-log rows are keyboard-activatable (Enter key)', async () => {
    mockFetchOnce(
      makeData({
        empty: false,
        onTrack: [makeOnTrackCard()],
        metrics: { epicsInFlight: 1, activeDevelopers: 1, playsToday: 1, openIssues: 0 },
        playLog: [makePlayLogEntry({ playName: 'play-quality-check' })],
        playLogEmpty: false,
      }),
    );
    render(<FlightDeckPage />);
    await waitFor(() => {
      expect(screen.getByTestId('flight-deck-play-log-table')).toBeInTheDocument();
    });
    const row = screen.getByTestId('flight-deck-play-log-row');
    fireEvent.keyDown(row, { key: 'Enter' });
    expect(pushMock).toHaveBeenCalledTimes(1);
  });
});
