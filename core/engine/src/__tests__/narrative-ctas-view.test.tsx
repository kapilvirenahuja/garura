/**
 * <NarrativeView /> — contextual CTA rendering + execution.
 *
 * Covers:
 *   - VAL-PLAY-026: CTAs appear at the bottom of the narrative (not a toolbar).
 *   - VAL-PLAY-027: Clicking a CTA triggers play execution; a ContentSlot
 *     appears below the CTA and streams output; the narrative above
 *     remains rendered.
 *   - VAL-ACTION-007: ContentSlot is initially hidden before the CTA is
 *     clicked — no visible empty space in the DOM.
 *   - VAL-ACTION-008: CTAs are placed contextually (inside the Actions
 *     section at the bottom of the narrative) — never in a disconnected
 *     top/side toolbar.
 */

import React from 'react';
import { act } from 'react';
import { describe, it, expect, afterEach, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { NarrativeView } from '@/components/narrative-view';
import type { Narrative } from '@/lib/narrative-engine';
import type { CtaAction } from '@/lib/narrative-ctas';

type FetchMockImpl = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

function mockFetch(impl: FetchMockImpl): void {
  globalThis.fetch = vi.fn(impl) as unknown as typeof fetch;
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function makeNarrativeWithActions(actions: readonly CtaAction[]): Narrative {
  return {
    epicId: 'EPIC-E1',
    epicName: 'Core Task Management',
    status: 'in-progress',
    featureCount: 3,
    density: 'low',
    sections: [
      {
        id: 'overview',
        heading: 'Overview',
        level: 2,
        chunks: [
          { type: 'text', text: 'The ' },
          { type: 'token', token: { refId: 'EPIC-E1', dangling: false } },
          { type: 'text', text: ' epic covers the core task flow.' },
        ],
      },
    ],
    actions,
    contentHash: 'hash-actions-1',
    composedAt: '2026-04-17T00:00:00.000Z',
    composerMode: 'deterministic',
  };
}

const SAMPLE_ACTIONS: readonly CtaAction[] = [
  {
    id: 'run-prepare-epic',
    label: 'Run prepare-epic',
    playName: 'prepare-epic',
    description: 'Architecture is ready — produce tech.yaml and the task DAG.',
    reason: 'no-plan',
    primary: true,
  },
  {
    id: 'run-check-drift',
    label: 'Run check-drift',
    playName: 'check-drift',
    description: 'Detect drift between locked specs and the implemented codebase.',
    reason: 'always-available',
    primary: false,
  },
];

/** Build a ReadableStream of SSE frames for the execute endpoint. */
function makeSseResponse(frames: ReadonlyArray<Record<string, unknown>>): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      for (const frame of frames) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(frame)}\n\n`));
      }
      controller.close();
    },
  });
  return new Response(stream, {
    status: 200,
    headers: { 'content-type': 'text/event-stream' },
  });
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('<NarrativeView /> — contextual CTAs', () => {
  it('renders CTA buttons inside an Actions section at the bottom of the narrative (VAL-PLAY-026, VAL-ACTION-008)', async () => {
    mockFetch(() =>
      Promise.resolve(
        jsonResponse({ narrative: makeNarrativeWithActions(SAMPLE_ACTIONS), fromCache: false }),
      ),
    );

    render(<NarrativeView context="E1" minLoadingMs={0} />);
    await screen.findByTestId('narrative-root');

    const actionsSection = await screen.findByTestId('narrative-actions');
    expect(actionsSection).toBeInTheDocument();
    expect(actionsSection.getAttribute('aria-label')).toBe('Actions');

    // CTA buttons rendered for every action.
    const ctaGroups = screen.getAllByTestId('narrative-cta-group');
    expect(ctaGroups).toHaveLength(2);

    // The primary CTA is explicitly tagged so the UI can emphasise it.
    const primary = ctaGroups.find((el) => el.getAttribute('data-cta-primary') === 'true');
    expect(primary).toBeDefined();
    expect(primary?.getAttribute('data-cta-id')).toBe('run-prepare-epic');

    // CTAs are placed AFTER the narrative sections — wireframe: bottom of
    // narrative, not in a toolbar above the content.
    const root = screen.getByTestId('narrative-root');
    const sectionEls = screen.getAllByTestId('narrative-section');
    const lastSection = sectionEls[sectionEls.length - 1]!;
    expect(
      lastSection.compareDocumentPosition(actionsSection) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    // Actions section is a child of the narrative root (same article).
    expect(root.contains(actionsSection)).toBe(true);
  });

  it('does not render a ContentSlot before the CTA is clicked (VAL-ACTION-007)', async () => {
    mockFetch(() =>
      Promise.resolve(
        jsonResponse({ narrative: makeNarrativeWithActions(SAMPLE_ACTIONS), fromCache: false }),
      ),
    );

    render(<NarrativeView context="E1" minLoadingMs={0} />);
    await screen.findByTestId('narrative-actions');

    expect(screen.queryAllByTestId('narrative-cta-slot')).toHaveLength(0);
  });

  it('shows a ContentSlot with streaming output below the clicked CTA and keeps the narrative above visible (VAL-PLAY-027)', async () => {
    // First call loads the narrative; subsequent call streams SSE events.
    const narrativeResp = () =>
      jsonResponse({ narrative: makeNarrativeWithActions(SAMPLE_ACTIONS), fromCache: false });

    const sseResp = () =>
      makeSseResponse([
        { type: 'output', content: 'Starting prepare-epic...\n' },
        { type: 'output', content: 'Analyzing features...\n' },
        { type: 'complete' },
      ]);

    mockFetch((input) => {
      const url = typeof input === 'string' ? input : (input as URL | Request).toString();
      if (url.includes('/api/narrative')) return Promise.resolve(narrativeResp());
      if (url.includes('/api/checklists/execute')) return Promise.resolve(sseResp());
      return Promise.reject(new Error(`Unexpected fetch: ${url}`));
    });

    render(<NarrativeView context="E1" minLoadingMs={0} />);
    await screen.findByTestId('narrative-actions');

    // Click the primary CTA.
    const primaryCta = screen
      .getAllByTestId('cta-button')
      .find((btn) => btn.getAttribute('data-play') === 'prepare-epic');
    expect(primaryCta).toBeDefined();

    await act(async () => {
      primaryCta!.click();
    });

    // ContentSlot should appear, keyed to the primary CTA.
    const slot = await screen.findByTestId('narrative-cta-slot');
    expect(slot.getAttribute('data-cta-id')).toBe('run-prepare-epic');

    // Streaming content accumulates into the slot.
    await waitFor(() => {
      const contentEl = slot.querySelector('[data-testid="content-slot-content"]');
      expect(contentEl?.textContent ?? '').toContain('Starting prepare-epic');
    });
    await waitFor(() => {
      const contentEl = slot.querySelector('[data-testid="content-slot-content"]');
      expect(contentEl?.textContent ?? '').toContain('Analyzing features');
    });

    // Narrative sections above remain rendered (visible + scrollable).
    expect(screen.getByTestId('narrative-title')).toBeInTheDocument();
    expect(screen.getAllByTestId('narrative-section').length).toBeGreaterThan(0);
  });

  it('routes the CTA click to /api/checklists/execute with the correct play name', async () => {
    const fetchSpy = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : (input as URL | Request).toString();
      if (url.includes('/api/narrative')) {
        return jsonResponse({
          narrative: makeNarrativeWithActions(SAMPLE_ACTIONS),
          fromCache: false,
        });
      }
      if (url.includes('/api/checklists/execute')) {
        // Verify the POST body carries the expected play name.
        const body = JSON.parse((init?.body as string) ?? '{}');
        expect(body.playName).toBe('check-drift');
        return makeSseResponse([{ type: 'output', content: 'ok\n' }, { type: 'complete' }]);
      }
      throw new Error(`Unexpected fetch: ${url}`);
    });
    globalThis.fetch = fetchSpy as unknown as typeof fetch;

    render(<NarrativeView context="E1" minLoadingMs={0} />);
    await screen.findByTestId('narrative-actions');

    const driftCta = screen
      .getAllByTestId('cta-button')
      .find((btn) => btn.getAttribute('data-play') === 'check-drift');
    expect(driftCta).toBeDefined();

    await act(async () => {
      driftCta!.click();
    });

    await waitFor(() => {
      expect(
        fetchSpy.mock.calls.some(([input]) => {
          const url = typeof input === 'string' ? input : (input as URL | Request).toString();
          return url.includes('/api/checklists/execute');
        }),
      ).toBe(true);
    });
  });

  it('shows an error ContentSlot when the execute endpoint streams a play failure', async () => {
    mockFetch((input) => {
      const url = typeof input === 'string' ? input : (input as URL | Request).toString();
      if (url.includes('/api/narrative')) {
        return Promise.resolve(
          jsonResponse({ narrative: makeNarrativeWithActions(SAMPLE_ACTIONS), fromCache: false }),
        );
      }
      if (url.includes('/api/checklists/execute')) {
        return Promise.resolve(
          makeSseResponse([
            { type: 'output', content: 'Starting...\n' },
            { type: 'error', message: 'play exited with code 2' },
          ]),
        );
      }
      return Promise.reject(new Error(`Unexpected fetch: ${url}`));
    });

    render(<NarrativeView context="E1" minLoadingMs={0} />);
    await screen.findByTestId('narrative-actions');

    const primaryCta = screen
      .getAllByTestId('cta-button')
      .find((btn) => btn.getAttribute('data-play') === 'prepare-epic');
    await act(async () => {
      primaryCta!.click();
    });

    const slot = await screen.findByTestId('narrative-cta-slot');
    await waitFor(() => {
      expect(slot.querySelector('[data-state="error"]')).not.toBeNull();
    });
    expect(slot.textContent).toMatch(/play exited with code 2/);
  });
});
