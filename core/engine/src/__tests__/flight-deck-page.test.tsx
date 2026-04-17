/**
 * Tests for Flight Deck page rendering — focused on the empty-state path.
 *
 * Fulfills: VAL-FLIGHT-004 (No Branch Graceful — empty state)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import FlightDeckPage from '@/app/flight-deck/page';

// Mock next/navigation (needed because layout-level client components use it)
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => '/flight-deck',
}));

describe('Flight Deck page', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('renders the "No epics in flight" empty state when no matching branches exist (VAL-FLIGHT-004)', async () => {
    (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ epics: [], empty: true, error: null }),
    });

    render(<FlightDeckPage />);

    await waitFor(() => {
      expect(screen.getByTestId('flight-deck-empty-state')).toBeInTheDocument();
    });
    expect(screen.getByText(/no epics in flight/i)).toBeInTheDocument();
    expect(screen.queryByTestId('flight-deck-epics')).not.toBeInTheDocument();
  });

  it('renders discovered epics with stage badges when epics are present', async () => {
    (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        epics: [
          {
            id: 'E1',
            slug: 'auth',
            branchName: 'feat/e1-auth',
            stage: 'Implementation',
            developer: 'Kapil',
            lastCommit: {
              hash: 'abc123',
              author: 'Kapil',
              timestamp: '2025-01-01T12:00:00Z',
              message: 'work on auth',
            },
          },
        ],
        empty: false,
        error: null,
      }),
    });

    render(<FlightDeckPage />);

    await waitFor(() => {
      expect(screen.getByTestId('flight-deck-epics')).toBeInTheDocument();
    });
    expect(screen.getByText(/E1: auth/)).toBeInTheDocument();
    expect(screen.getByTestId('flight-deck-epic-stage')).toHaveTextContent('Implementation');
    expect(screen.queryByTestId('flight-deck-empty-state')).not.toBeInTheDocument();
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
    // Error note should be surfaced alongside the empty state so the user isn't stranded.
    expect(screen.getByTestId('flight-deck-error-note')).toBeInTheDocument();
  });
});
