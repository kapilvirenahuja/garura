/**
 * mdb-cta-engine — CTA button rendering + interaction engine.
 *
 * Fulfills:
 *   - VAL-ACTION-006: CTA buttons render with label, icon, AND the mapped
 *     play name in prominent (double-border / accent) styling.
 *   - VAL-ACTION-007: Associated ContentSlot is initially hidden (no
 *     visible empty space) until the CTA is triggered.
 *   - VAL-ACTION-008: CTAs are placed contextually within the narrative
 *     (inside an "Actions" section at the end of the narrative article) —
 *     NEVER in a disconnected top/side toolbar.
 *
 * These assertions reinforce the wireframe contract: a CTA looks like
 *   ╔════════════════════════════════════════════════════╗
 *   ║  🐛 Run RCA: fix the thing          → fix-it      ║
 *   ╚════════════════════════════════════════════════════╝
 * and the ContentSlot underneath only materialises when the user clicks.
 */

import React from 'react';
import { act } from 'react';
import { describe, it, expect, afterEach, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

import { CTAButton } from '@/components/cta-button';
import { NarrativeView } from '@/components/narrative-view';
import type { CtaAction } from '@/lib/narrative-ctas';
import type { Narrative } from '@/lib/narrative-engine';

// ---------------------------------------------------------------------------
// Fixtures + fetch helpers
// ---------------------------------------------------------------------------

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
    contentHash: 'hash-cta-engine-1',
    composedAt: '2026-04-18T00:00:00.000Z',
    composerMode: 'deterministic',
  };
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

// ===========================================================================
// VAL-ACTION-006: CTA rendering with label, icon, AND play name in prominent
//                  double-border / accent styling.
// ===========================================================================

describe('CTAButton — rendering (VAL-ACTION-006)', () => {
  it('renders the label as direct text on the button', () => {
    render(<CTAButton label="Run RCA" playName="fix-it" />);
    const btn = screen.getByTestId('cta-button');
    // Label remains a direct child text node so legacy tests using
    // `getByText('Run RCA')` continue to resolve the button element.
    expect(btn).toHaveTextContent('Run RCA');
  });

  it('renders an icon element inside the button', () => {
    render(<CTAButton label="Run prepare-epic" playName="prepare-epic" />);
    const btn = screen.getByTestId('cta-button');
    const icon = btn.querySelector('[data-testid="cta-button-icon"]');
    expect(icon).not.toBeNull();
    // Icon should be aria-hidden — it's decorative, the label + play name
    // carry the semantics.
    expect(icon?.getAttribute('aria-hidden')).toBe('true');
  });

  it('renders the mapped play name as a visible element (not only a data attribute)', () => {
    render(<CTAButton label="Run prepare-epic" playName="prepare-epic" />);
    const btn = screen.getByTestId('cta-button');
    const play = btn.querySelector('[data-testid="cta-button-play"]');
    expect(play).not.toBeNull();
    // Per wireframe the play name is surfaced with an arrow prefix.
    expect(play?.textContent ?? '').toMatch(/→\s*prepare-epic/);

    // Also still exposed as a data attribute for programmatic use.
    expect(btn).toHaveAttribute('data-play', 'prepare-epic');
  });

  it('renders visibly distinct play names for different CTAs in the same view', () => {
    render(
      <div>
        <CTAButton label="Run prepare-epic" playName="prepare-epic" />
        <CTAButton label="Run check-drift" playName="check-drift" />
      </div>,
    );
    const plays = screen.getAllByTestId('cta-button-play').map((el) => el.textContent ?? '');
    expect(plays.some((t) => /prepare-epic/.test(t))).toBe(true);
    expect(plays.some((t) => /check-drift/.test(t))).toBe(true);
  });

  it('applies prominent double-border + accent styling to distinguish CTAs from secondary buttons', () => {
    render(<CTAButton label="Run RCA" playName="fix-it" />);
    const btn = screen.getByTestId('cta-button');
    const className = btn.getAttribute('class') ?? '';

    // Double-border: rendered via `border-double` utility. Browsers require
    // border width >= 3px for the double line to be visible — our component
    // opts into `border-[3px]` (or equivalent) for that reason.
    expect(className).toMatch(/\bborder-double\b/);
    expect(className).toMatch(/border-\[3px\]/);

    // Accent color — CTAs use a distinct accent hue (blue family) so they
    // visually stand out from plain secondary buttons (which use gray).
    expect(className).toMatch(/border-blue/);

    // Declarative marker for browser-based validation so agent-browser
    // can assert the prominent styling without string-matching Tailwind.
    expect(btn).toHaveAttribute('data-cta-prominent', 'true');
  });
});

// ===========================================================================
// VAL-ACTION-007: Associated ContentSlot initially hidden.
// ===========================================================================

describe('NarrativeView CTA — initially hidden ContentSlot (VAL-ACTION-007)', () => {
  it('renders no ContentSlot elements before any CTA is clicked', async () => {
    mockFetch(() =>
      Promise.resolve(
        jsonResponse({ narrative: makeNarrativeWithActions(SAMPLE_ACTIONS), fromCache: false }),
      ),
    );

    render(<NarrativeView context="E1" minLoadingMs={0} />);
    await screen.findByTestId('narrative-actions');

    // No execution has been requested yet — the narrative must not reserve
    // any visible space for a content slot. This is the "hidden until
    // triggered" contract from the wireframe.
    expect(screen.queryAllByTestId('narrative-cta-slot')).toHaveLength(0);
    expect(screen.queryAllByTestId('content-slot')).toHaveLength(0);
  });

  it('reveals the ContentSlot exactly once the CTA is clicked and streams into it', async () => {
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
            { type: 'output', content: 'Preparing epic...\n' },
            { type: 'output', content: 'Generating tech.yaml...\n' },
            { type: 'complete' },
          ]),
        );
      }
      return Promise.reject(new Error(`Unexpected fetch: ${url}`));
    });

    render(<NarrativeView context="E1" minLoadingMs={0} />);
    await screen.findByTestId('narrative-actions');

    // Before click: no slots.
    expect(screen.queryAllByTestId('narrative-cta-slot')).toHaveLength(0);

    // Click the primary CTA.
    const primary = screen
      .getAllByTestId('cta-button')
      .find((b) => b.getAttribute('data-play') === 'prepare-epic');
    expect(primary).toBeDefined();
    await act(async () => {
      primary!.click();
    });

    // After click: slot appears and streams content.
    const slot = await screen.findByTestId('narrative-cta-slot');
    expect(slot.getAttribute('data-cta-id')).toBe('run-prepare-epic');
    await waitFor(() => {
      const contentEl = slot.querySelector('[data-testid="content-slot-content"]');
      expect(contentEl?.textContent ?? '').toMatch(/Preparing epic/);
    });
  });
});

// ===========================================================================
// VAL-ACTION-008: CTAs placed contextually — NOT in a disconnected top/side
//                  toolbar. They live inside the narrative's `Actions`
//                  section at the bottom of the narrative article.
// ===========================================================================

describe('NarrativeView CTA — contextual placement (VAL-ACTION-008)', () => {
  it('places CTAs inside the narrative article (not in a top/side toolbar)', async () => {
    mockFetch(() =>
      Promise.resolve(
        jsonResponse({ narrative: makeNarrativeWithActions(SAMPLE_ACTIONS), fromCache: false }),
      ),
    );

    render(<NarrativeView context="E1" minLoadingMs={0} />);
    const root = await screen.findByTestId('narrative-root');
    const actionsSection = screen.getByTestId('narrative-actions');

    // CTAs are CHILDREN of the narrative root — not siblings, not in a
    // global toolbar.
    expect(root.contains(actionsSection)).toBe(true);

    // Every CTA button is inside the narrative root — no stray CTAs floating
    // outside the narrative article.
    const allCtas = screen.getAllByTestId('cta-button');
    expect(allCtas.length).toBeGreaterThan(0);
    for (const cta of allCtas) {
      expect(root.contains(cta)).toBe(true);
    }

    // Actions section is semantically labelled "Actions" — visible anchor
    // for screen readers.
    expect(actionsSection.getAttribute('aria-label')).toBe('Actions');
  });

  it('places the Actions section at the end of the narrative, after every content section', async () => {
    mockFetch(() =>
      Promise.resolve(
        jsonResponse({ narrative: makeNarrativeWithActions(SAMPLE_ACTIONS), fromCache: false }),
      ),
    );

    render(<NarrativeView context="E1" minLoadingMs={0} />);
    await screen.findByTestId('narrative-root');

    const sections = screen.getAllByTestId('narrative-section');
    const actionsSection = screen.getByTestId('narrative-actions');
    const lastSection = sections[sections.length - 1]!;
    const relation = lastSection.compareDocumentPosition(actionsSection);

    // Bit 0x04 = DOCUMENT_POSITION_FOLLOWING — the Actions section comes
    // AFTER the last narrative content section in document order.
    expect(relation & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
