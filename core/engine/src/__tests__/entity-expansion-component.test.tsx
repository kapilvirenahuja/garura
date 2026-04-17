/**
 * EntityExpansion + CollapsedEntityExpansion — component tests.
 *
 * Covers the mdb-progressive-disclosure behaviours:
 *   - Open state shows type badge, title, description, close control, and
 *     Connections section with labelled clickable tokens (VAL-PLAY-003, 024)
 *   - Close control fires onClose (VAL-PLAY-004)
 *   - Collapsed state shows summary and re-open affordance (VAL-PLAY-006)
 *   - Clicking a connection token opens a nested EntityExpansion (VAL-PLAY-025)
 *   - "Explain further" button triggers /api/explain and renders paragraphs
 *     inline within the expansion (VAL-PLAY-007)
 */

import React from 'react';
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { CollapsedEntityExpansion, EntityExpansion } from '@/components/entity-expansion';
import type { EntityExpansionData } from '@/lib/entity-expansion';

const SEED_F1: EntityExpansionData = {
  refId: 'F1',
  found: true,
  typeLabel: 'Feature',
  title: 'Task Inbox',
  description: 'Unified inbox showing tasks across projects.',
  source: 'features.yaml',
  facts: [
    { label: 'Capability domain', value: 'task-management' },
    { label: 'Observable behaviours', value: 'F1-B1: Shows tasks sorted by priority' },
  ],
  connections: [
    { label: 'Verification scenarios', refIds: ['SC-TASK-001'] },
    { label: 'Epics', refIds: ['EPIC-E1'] },
  ],
};

const SEED_SC: EntityExpansionData = {
  refId: 'SC-TASK-001',
  found: true,
  typeLabel: 'Scenario',
  title: 'Inbox displays tasks sorted by priority',
  description: 'Given the user opens the inbox, tasks appear sorted by priority.',
  source: 'scenarios.yaml',
  facts: [{ label: 'Given', value: 'user has tasks' }],
  connections: [{ label: 'Parent feature', refIds: ['F1'] }],
};

function mockFetchMap(map: Record<string, unknown>) {
  globalThis.fetch = vi.fn((input: RequestInfo | URL) => {
    const url =
      typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    for (const key of Object.keys(map)) {
      if (url.includes(key)) {
        return Promise.resolve(
          new Response(JSON.stringify(map[key]), {
            status: 200,
            headers: { 'content-type': 'application/json' },
          }),
        );
      }
    }
    return Promise.reject(new Error(`unhandled fetch: ${url}`));
  }) as unknown as typeof fetch;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('<EntityExpansion /> — open state', () => {
  it('renders header with type badge, ref id, title, and close control (seed)', () => {
    render(<EntityExpansion refId="F1" seed={SEED_F1} onClose={() => {}} />);
    const exp = screen.getByTestId('entity-expansion');
    expect(exp).toHaveAttribute('data-open', 'true');

    expect(within(exp).getByText('Feature')).toBeInTheDocument();
    expect(within(exp).getByText('[F1]')).toBeInTheDocument();
    expect(within(exp).getByText('Task Inbox')).toBeInTheDocument();
    expect(within(exp).getByTestId('entity-expansion-close')).toBeInTheDocument();
  });

  it('renders description, facts, and connections (VAL-PLAY-003, VAL-PLAY-024)', () => {
    render(<EntityExpansion refId="F1" seed={SEED_F1} onClose={() => {}} />);

    expect(screen.getByTestId('entity-expansion-description')).toHaveTextContent(/Unified inbox/i);
    // Facts
    expect(screen.getByText('Capability domain')).toBeInTheDocument();
    expect(screen.getByText('task-management')).toBeInTheDocument();

    // Connections section with labelled tokens
    const connections = screen.getByTestId('entity-expansion-connections');
    expect(within(connections).getByText('Verification scenarios')).toBeInTheDocument();
    expect(within(connections).getByText('Epics')).toBeInTheDocument();

    const tokens = within(connections).getAllByTestId('cross-ref-token');
    const ids = tokens.map((t) => t.getAttribute('data-ref-id'));
    expect(ids).toContain('SC-TASK-001');
    expect(ids).toContain('EPIC-E1');
  });

  it('clicking close fires onClose (VAL-PLAY-004)', () => {
    const onClose = vi.fn();
    render(<EntityExpansion refId="F1" seed={SEED_F1} onClose={onClose} />);
    fireEvent.click(screen.getByTestId('entity-expansion-close'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('clicking a connection token opens a nested expansion (VAL-PLAY-025)', async () => {
    mockFetchMap({
      '/api/expansion?refId=SC-TASK-001': { expansion: SEED_SC },
    });

    render(<EntityExpansion refId="F1" seed={SEED_F1} onClose={() => {}} />);

    const connections = screen.getByTestId('entity-expansion-connections');
    const scToken = within(connections)
      .getAllByTestId('cross-ref-token')
      .find((t) => t.getAttribute('data-ref-id') === 'SC-TASK-001');
    expect(scToken).toBeDefined();
    fireEvent.click(scToken!);

    // A nested container appears with a child expansion for SC-TASK-001.
    await waitFor(() => {
      expect(screen.getByTestId('entity-expansion-nested')).toBeInTheDocument();
    });
    const allExpansions = screen.getAllByTestId('entity-expansion');
    // Parent F1 + nested SC-TASK-001.
    expect(allExpansions.length).toBeGreaterThanOrEqual(2);
    const nestedRefs = allExpansions.map((e) => e.getAttribute('data-ref-id'));
    expect(nestedRefs).toContain('F1');
    expect(nestedRefs).toContain('SC-TASK-001');
  });

  it('"Explain further" fetches /api/explain and renders paragraphs inline (VAL-PLAY-007)', async () => {
    mockFetchMap({
      '/api/explain?refId=F1': {
        refId: 'F1',
        paragraphs: [
          'F1 is the unified inbox feature — it aggregates tasks across projects.',
          'It connects to verification scenario SC-TASK-001 and belongs to EPIC-E1.',
        ],
        source: 'deterministic',
      },
    });

    render(<EntityExpansion refId="F1" seed={SEED_F1} onClose={() => {}} />);
    const btn = screen.getByTestId('entity-expansion-explain-btn');
    fireEvent.click(btn);

    await waitFor(() => {
      expect(screen.getByTestId('entity-expansion-explain-result')).toBeInTheDocument();
    });
    const result = screen.getByTestId('entity-expansion-explain-result');
    expect(result.textContent).toMatch(/unified inbox/i);
    expect(result.textContent).toMatch(/SC-TASK-001/);
  });
});

describe('<EntityExpansion /> — fetch flow', () => {
  it('fetches /api/expansion when no seed is provided', async () => {
    mockFetchMap({
      '/api/expansion?refId=F1': { expansion: SEED_F1 },
    });
    render(<EntityExpansion refId="F1" onClose={() => {}} />);
    await waitFor(() => {
      expect(screen.getByTestId('entity-expansion-title')).toHaveTextContent('Task Inbox');
    });
  });

  it('renders an error state when the API returns an error payload', async () => {
    mockFetchMap({
      '/api/expansion?refId=F999': { error: 'not found', expansion: null },
    });
    // Simulate 400: mockFetchMap returns 200; override specifically.
    globalThis.fetch = vi.fn(() =>
      Promise.resolve(
        new Response(JSON.stringify({ error: 'not found', expansion: null }), {
          status: 400,
          headers: { 'content-type': 'application/json' },
        }),
      ),
    ) as unknown as typeof fetch;

    render(<EntityExpansion refId="F999" onClose={() => {}} />);
    await waitFor(() => {
      const exp = screen.getByTestId('entity-expansion');
      expect(exp.getAttribute('data-state')).toBe('error');
    });
  });
});

describe('<CollapsedEntityExpansion />', () => {
  it('renders summary with a re-open affordance (VAL-PLAY-006)', () => {
    const onReopen = vi.fn();
    render(
      <CollapsedEntityExpansion
        refId="F1"
        summary="[F1] previously opened — click to re-open."
        onReopen={onReopen}
      />,
    );
    const collapsed = screen.getByTestId('entity-expansion-collapsed');
    expect(collapsed).toHaveAttribute('data-open', 'false');
    expect(collapsed.textContent).toMatch(/previously opened/i);

    const reopen = screen.getByTestId('entity-expansion-reopen');
    fireEvent.click(reopen);
    expect(onReopen).toHaveBeenCalledTimes(1);
  });
});
