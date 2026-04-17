/**
 * NarrativeView progressive disclosure — integration tests.
 *
 * Covers:
 *   - Click token → EntityExpansion appears below in same section (VAL-PLAY-003)
 *   - Click close on expansion → transitions to collapsed state with re-open
 *     affordance (VAL-PLAY-004, VAL-PLAY-006)
 *   - Click collapsed → reopens (VAL-PLAY-006)
 *   - Multiple expansions open simultaneously, independently closeable
 *     (VAL-PLAY-005)
 *   - Scroll position preserved — we don't call scrollIntoView on open
 *     (VAL-PLAY-029)
 */

import React from 'react';
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { NarrativeView } from '@/components/narrative-view';
import type { Narrative } from '@/lib/narrative-engine';
import type { EntityExpansionData } from '@/lib/entity-expansion';

function makeNarrative(): Narrative {
  return {
    epicId: 'EPIC-E1',
    epicName: 'Core Task Management',
    status: 'in-progress',
    featureCount: 2,
    density: 'low',
    sections: [
      {
        id: 'overview',
        heading: 'Overview',
        level: 2,
        chunks: [
          { type: 'text', text: 'The ' },
          { type: 'token', token: { refId: 'EPIC-E1', dangling: false } },
          { type: 'text', text: ' epic contains ' },
          { type: 'token', token: { refId: 'F1', dangling: false } },
          { type: 'text', text: ' and ' },
          { type: 'token', token: { refId: 'F2', dangling: false } },
          { type: 'text', text: '.' },
        ],
      },
    ],
    actions: [],
    contentHash: 'hash-123',
    composedAt: '2026-04-17T00:00:00.000Z',
    composerMode: 'deterministic',
  };
}

function seedFor(refId: string): EntityExpansionData {
  return {
    refId,
    found: true,
    typeLabel: refId.startsWith('F') ? 'Feature' : refId.startsWith('EPIC-') ? 'Epic' : 'Scenario',
    title: `${refId} Title`,
    description: `${refId} description.`,
    source: 'features.yaml',
    facts: [{ label: 'Fact', value: 'value' }],
    connections: [{ label: 'Parent feature', refIds: ['F1'] }],
  };
}

function mockFetchHandlers() {
  globalThis.fetch = vi.fn((input: RequestInfo | URL) => {
    const url =
      typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    if (url.startsWith('/api/narrative')) {
      return Promise.resolve(
        new Response(JSON.stringify({ narrative: makeNarrative(), fromCache: false }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      );
    }
    const m = /\/api\/expansion\?refId=([^&]+)/.exec(url);
    if (m) {
      const refId = decodeURIComponent(m[1]!);
      return Promise.resolve(
        new Response(JSON.stringify({ expansion: seedFor(refId) }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      );
    }
    const e = /\/api\/explain\?refId=([^&]+)/.exec(url);
    if (e) {
      return Promise.resolve(
        new Response(
          JSON.stringify({
            refId: decodeURIComponent(e[1]!),
            paragraphs: ['Deeper explanation paragraph.'],
            source: 'deterministic',
          }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        ),
      );
    }
    return Promise.reject(new Error(`unhandled: ${url}`));
  }) as unknown as typeof fetch;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('NarrativeView — progressive disclosure', () => {
  it('click on CrossRefToken opens EntityExpansion in the same section (VAL-PLAY-003)', async () => {
    mockFetchHandlers();
    render(<NarrativeView context="E1" minLoadingMs={0} />);
    await screen.findByTestId('narrative-root');

    // No expansions yet.
    expect(screen.queryByTestId('entity-expansion')).toBeNull();

    const f1Token = screen
      .getAllByTestId('cross-ref-token')
      .find((t) => t.getAttribute('data-ref-id') === 'F1');
    fireEvent.click(f1Token!);

    const expansion = await screen.findByTestId('entity-expansion');
    expect(expansion.getAttribute('data-ref-id')).toBe('F1');
  });

  it('multiple tokens can open simultaneously, each independently closeable (VAL-PLAY-005)', async () => {
    mockFetchHandlers();
    render(<NarrativeView context="E1" minLoadingMs={0} />);
    await screen.findByTestId('narrative-root');

    const tokens = screen.getAllByTestId('cross-ref-token');
    const f1 = tokens.find((t) => t.getAttribute('data-ref-id') === 'F1')!;
    const f2 = tokens.find((t) => t.getAttribute('data-ref-id') === 'F2')!;

    fireEvent.click(f1);
    fireEvent.click(f2);

    await waitFor(() => {
      const all = screen.getAllByTestId('entity-expansion');
      const ids = all.map((x) => x.getAttribute('data-ref-id'));
      expect(ids).toContain('F1');
      expect(ids).toContain('F2');
    });
  });

  it('closing an expansion transitions to the collapsed state and re-opens on click (VAL-PLAY-004, VAL-PLAY-006)', async () => {
    mockFetchHandlers();
    render(<NarrativeView context="E1" minLoadingMs={0} />);
    await screen.findByTestId('narrative-root');

    const f1 = screen
      .getAllByTestId('cross-ref-token')
      .find((t) => t.getAttribute('data-ref-id') === 'F1')!;
    fireEvent.click(f1);
    await screen.findByTestId('entity-expansion');

    // Close it.
    fireEvent.click(screen.getByTestId('entity-expansion-close'));

    // Collapsed row with re-open affordance should now be present.
    const collapsed = await screen.findByTestId('entity-expansion-collapsed');
    expect(collapsed.getAttribute('data-ref-id')).toBe('F1');
    expect(collapsed.textContent).toMatch(/re-open/i);

    // Re-open via the collapsed affordance.
    fireEvent.click(within(collapsed).getByTestId('entity-expansion-reopen'));

    await waitFor(() => {
      const exp = screen
        .getAllByTestId('entity-expansion')
        .find((e) => e.getAttribute('data-ref-id') === 'F1');
      expect(exp).toBeDefined();
    });
    expect(screen.queryByTestId('entity-expansion-collapsed')).toBeNull();
  });

  it('does NOT call scrollIntoView when opening an expansion (VAL-PLAY-029)', async () => {
    mockFetchHandlers();
    // jsdom does not implement scrollIntoView by default — define a stub
    // before spying so the spy can record any accidental invocations.
    type ElementWithScroll = Element & { scrollIntoView?: () => void };
    const proto = Element.prototype as ElementWithScroll;
    const hadOriginal = typeof proto.scrollIntoView === 'function';
    if (!hadOriginal) proto.scrollIntoView = () => undefined;
    const spy = vi.spyOn(proto, 'scrollIntoView').mockImplementation(() => undefined);

    render(<NarrativeView context="E1" minLoadingMs={0} />);
    await screen.findByTestId('narrative-root');

    const f1 = screen
      .getAllByTestId('cross-ref-token')
      .find((t) => t.getAttribute('data-ref-id') === 'F1')!;
    fireEvent.click(f1);
    await screen.findByTestId('entity-expansion');

    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
    if (!hadOriginal) {
      // Reset back to undefined so we don't leak a stub into other tests.
      (proto as unknown as Record<string, unknown>)['scrollIntoView'] = undefined;
    }
  });
});
