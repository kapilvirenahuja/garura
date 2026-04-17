/**
 * Tests for the SearchResultsView client component.
 *
 * Verifies:
 *   - Renders composed prose from the /api/search response (VAL-PLAY-017).
 *   - Lists results in the order returned by the server (VAL-PLAY-018).
 *   - Surfaces cross-epic chip when results span multiple epics (VAL-PLAY-020).
 *   - CrossRefTokens in results navigate to the Playbook Reader
 *     (VAL-PLAY-019).
 *   - Graceful empty/error states (VAL-FOUND-042).
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent, cleanup, within } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

import { SearchResultsView } from '@/components/search-results-view';
import type { GenerativeSearchResponse } from '@/lib/generative-search';

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
}));

function mockSearchResponse(response: GenerativeSearchResponse, status = 200): void {
  globalThis.fetch = vi.fn(() =>
    Promise.resolve(
      new Response(JSON.stringify(response), {
        status,
        headers: { 'content-type': 'application/json' },
      }),
    ),
  ) as unknown as typeof fetch;
}

function mockErrorResponse(status = 500, error = 'boom'): void {
  globalThis.fetch = vi.fn(() =>
    Promise.resolve(
      new Response(JSON.stringify({ error }), {
        status,
        headers: { 'content-type': 'application/json' },
      }),
    ),
  ) as unknown as typeof fetch;
}

function makeResponse(query: string): GenerativeSearchResponse {
  return {
    query,
    hitCount: 5,
    composedAt: '2026-04-17T00:00:00.000Z',
    epics: [
      { id: 'EPIC-E1', shortId: 'E1', name: 'Core Task Management' },
      { id: 'EPIC-E3', shortId: 'E3', name: 'Workflow Automation' },
    ],
    results: [
      {
        id: 'feature:F1',
        title: 'Task Inbox',
        kind: 'feature',
        relevance: 9.42,
        primaryRefId: 'F1',
        chunks: [
          { type: 'text', text: `Your search for "${query}" surfaces feature ` },
          { type: 'token', token: { refId: 'F1', dangling: false } },
          { type: 'text', text: ' — the session timeout scenario is ' },
          { type: 'token', token: { refId: 'SC-TASK-016', dangling: false } },
          { type: 'text', text: '.' },
        ],
        sources: [
          {
            entityId: 'SC-TASK-016',
            sourceType: 'scenarios',
            sourceFile: '/tmp/scenarios.yaml',
            score: 5,
            title: 'Inbox session timeout re-prompts the user to re-authenticate',
          },
          {
            entityId: 'F1',
            sourceType: 'features',
            sourceFile: '/tmp/features.yaml',
            score: 3,
            title: 'Task Inbox',
          },
        ],
        epics: [{ id: 'EPIC-E1', shortId: 'E1', name: 'Core Task Management' }],
      },
      {
        id: 'feature:F3',
        title: 'Workflow Automation',
        kind: 'feature',
        relevance: 4.12,
        primaryRefId: 'F3',
        chunks: [
          { type: 'text', text: `Your search for "${query}" surfaces feature ` },
          { type: 'token', token: { refId: 'F3', dangling: false } },
          { type: 'text', text: '.' },
        ],
        sources: [
          {
            entityId: 'SC-AUTO-016',
            sourceType: 'scenarios',
            sourceFile: '/tmp/scenarios.yaml',
            score: 4,
            title: 'Webhook timeout is retried with exponential backoff',
          },
        ],
        epics: [{ id: 'EPIC-E3', shortId: 'E3', name: 'Workflow Automation' }],
      },
    ],
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('SearchResultsView — rendering states', () => {
  it('shows a loading indicator while the search is in flight', async () => {
    let resolveFetch!: (value: Response) => void;
    globalThis.fetch = vi.fn(
      () =>
        new Promise<Response>((resolve) => {
          resolveFetch = resolve;
        }),
    ) as unknown as typeof fetch;

    render(<SearchResultsView query="timeout" />);
    expect(await screen.findByTestId('search-results-loading')).toBeInTheDocument();

    resolveFetch(
      new Response(JSON.stringify(makeResponse('timeout')), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );
    await waitFor(() =>
      expect(screen.queryByTestId('search-results-loading')).not.toBeInTheDocument(),
    );
  });

  it('renders composed prose results from the API response (VAL-PLAY-017)', async () => {
    mockSearchResponse(makeResponse('timeout'));
    render(<SearchResultsView query="timeout" />);

    await screen.findByTestId('search-results-view');
    const cards = screen.getAllByTestId('search-result-card');
    expect(cards).toHaveLength(2);

    const firstCard = cards[0]!;
    // Title visible.
    expect(within(firstCard).getByTestId('search-result-title')).toHaveTextContent('Task Inbox');
    // Prose is composed natural language, not raw YAML.
    const prose = within(firstCard).getByTestId('search-result-prose');
    expect(prose).toHaveTextContent(/your search for "timeout" surfaces feature/i);
    expect(prose.textContent).not.toMatch(/feature_ref:/);
    expect(prose.textContent).not.toMatch(/pass_criteria:/);
  });

  it('lists results in the order returned by the server (VAL-PLAY-018)', async () => {
    mockSearchResponse(makeResponse('timeout'));
    render(<SearchResultsView query="timeout" />);
    const cards = await screen.findAllByTestId('search-result-card');
    expect(cards[0]).toHaveAttribute('data-result-rank', '1');
    expect(cards[0]).toHaveAttribute('data-result-id', 'feature:F1');
    expect(cards[1]).toHaveAttribute('data-result-id', 'feature:F3');
  });

  it('surfaces cross-epic chip when multiple epics are represented (VAL-PLAY-020)', async () => {
    mockSearchResponse(makeResponse('timeout'));
    render(<SearchResultsView query="timeout" />);
    const crossEpic = await screen.findByTestId('search-results-cross-epic');
    expect(crossEpic).toHaveTextContent(/cross-epic/i);
    expect(crossEpic).toHaveTextContent(/2 epics/);
  });

  it('renders source count per card (top result may synthesize multiple sources)', async () => {
    mockSearchResponse(makeResponse('timeout'));
    render(<SearchResultsView query="timeout" />);
    const cards = await screen.findAllByTestId('search-result-card');
    expect(cards[0]).toHaveAttribute('data-source-count', '2');
    expect(cards[1]).toHaveAttribute('data-source-count', '1');
  });

  it('shows a "no results" empty state when the response has zero results', async () => {
    mockSearchResponse({
      query: 'nothingmatches',
      hitCount: 0,
      composedAt: '2026-04-17T00:00:00.000Z',
      epics: [],
      results: [],
    });
    render(<SearchResultsView query="nothingmatches" />);
    expect(await screen.findByTestId('search-results-empty')).toBeInTheDocument();
  });

  it('shows an error state when the API responds non-2xx', async () => {
    mockErrorResponse(500, 'kaboom');
    render(<SearchResultsView query="timeout" />);
    expect(await screen.findByTestId('search-results-error')).toHaveTextContent(/kaboom/);
  });
});

describe('SearchResultsView — CrossRefToken navigation (VAL-PLAY-019)', () => {
  it('clicking a CrossRefToken pushes /playbook?context=<refId>', async () => {
    mockSearchResponse(makeResponse('timeout'));
    render(<SearchResultsView query="timeout" />);

    const cards = await screen.findAllByTestId('search-result-card');
    const firstCard = cards[0]!;
    const tokens = within(firstCard).getAllByTestId('cross-ref-token');
    // First token should be [F1]
    expect(tokens[0]).toHaveAttribute('data-ref-id', 'F1');
    fireEvent.click(tokens[0]!);
    expect(pushMock).toHaveBeenCalledWith('/playbook?context=F1');

    // Clicking the SC-TASK-016 token should navigate to that context too.
    fireEvent.click(tokens[1]!);
    expect(pushMock).toHaveBeenCalledWith('/playbook?context=SC-TASK-016');
  });

  it('epic badges link to the Playbook Reader with the epic id as context', async () => {
    mockSearchResponse(makeResponse('timeout'));
    render(<SearchResultsView query="timeout" />);
    const firstCard = (await screen.findAllByTestId('search-result-card'))[0]!;
    const badges = within(firstCard).getAllByTestId('search-result-epic-badge');
    expect(badges[0]).toHaveAttribute('href', '/playbook?context=EPIC-E1');
  });
});
