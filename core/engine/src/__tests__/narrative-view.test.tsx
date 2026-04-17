/**
 * NarrativeView — loading state, section rendering, cache badge, and the
 * "no raw YAML" invariant (VAL-PLAY-016, VAL-PLAY-023).
 */

import React from 'react';
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { NarrativeView } from '@/components/narrative-view';
import type { Narrative } from '@/lib/narrative-engine';

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
          { type: 'text', text: ' epic — Core Task Management — is the foundation.' },
        ],
      },
      {
        id: 'features',
        heading: 'Features',
        level: 2,
        chunks: [
          {
            type: 'text',
            text: 'This epic is scoped to 2 features so each one gets detailed treatment.',
          },
        ],
        subsections: [
          {
            id: 'feature-f1',
            heading: 'Task Inbox',
            level: 3,
            chunks: [
              { type: 'token', token: { refId: 'F1', dangling: false } },
              { type: 'text', text: ' — unified inbox showing tasks.' },
            ],
          },
        ],
      },
    ],
    actions: [],
    contentHash: 'abc123',
    composedAt: '2026-04-17T00:00:00.000Z',
    composerMode: 'deterministic',
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('<NarrativeView />', () => {
  it('shows a loading indicator while composition is in progress (VAL-PLAY-016)', async () => {
    let resolve!: (resp: Response) => void;
    const pending = new Promise<Response>((r) => {
      resolve = r;
    });
    mockFetch(() => pending);

    render(<NarrativeView context="E1" />);

    const loading = await screen.findByTestId('narrative-loading');
    expect(loading).toBeInTheDocument();
    expect(loading.textContent).toMatch(/Composing narrative/i);

    // Finish the request so the component unmounts cleanly.
    resolve(jsonResponse({ narrative: makeNarrative(), fromCache: false }));
    await waitFor(() => expect(screen.queryByTestId('narrative-loading')).toBeNull());
  });

  it('renders section headings and embedded cross-ref tokens (VAL-PLAY-001, VAL-PLAY-002)', async () => {
    mockFetch(() =>
      Promise.resolve(jsonResponse({ narrative: makeNarrative(), fromCache: false })),
    );

    render(<NarrativeView context="E1" />);

    await screen.findByTestId('narrative-root');
    expect(screen.getByTestId('narrative-title')).toHaveTextContent('Core Task Management');

    const sections = screen.getAllByTestId('narrative-section');
    expect(sections.length).toBeGreaterThanOrEqual(2);
    const sectionHeadings = sections
      .map((s) => s.querySelector('h2,h3')?.textContent)
      .filter(Boolean);
    expect(sectionHeadings).toContain('Overview');
    expect(sectionHeadings).toContain('Features');

    // Tokens rendered as CrossRefToken instances.
    const tokens = screen.getAllByTestId('cross-ref-token');
    const tokenIds = tokens.map((t) => t.getAttribute('data-ref-id'));
    expect(tokenIds).toContain('F1');
    expect(tokenIds).toContain('EPIC-E1');
  });

  it('shows a cache-hit badge when the API returns fromCache=true (VAL-PLAY-014)', async () => {
    mockFetch(() => Promise.resolve(jsonResponse({ narrative: makeNarrative(), fromCache: true })));

    render(<NarrativeView context="E1" />);

    await screen.findByTestId('narrative-root');
    expect(screen.getByTestId('narrative-cache-badge')).toBeInTheDocument();
    expect(screen.getByTestId('narrative-root').getAttribute('data-from-cache')).toBe('true');
  });

  it('does not emit raw YAML or bracket-ID text in the rendered DOM (VAL-PLAY-023)', async () => {
    mockFetch(() =>
      Promise.resolve(jsonResponse({ narrative: makeNarrative(), fromCache: false })),
    );

    const { container } = render(<NarrativeView context="E1" />);
    await screen.findByTestId('narrative-root');

    // The HTML must not contain YAML-style key-value pairs for our artifact fields,
    // nor `- id:` list syntax, nor plain [F1] bracket text (tokens render as buttons).
    const html = container.innerHTML;
    expect(html).not.toMatch(/^\s*- id:/m);
    expect(html).not.toMatch(/^\s*slug:\s+["']taskflow["']/m);

    // Raw "[F1]" text should only appear inside <button> cross-ref token elements,
    // never as bare text. Strip the buttons and re-check.
    const withoutTokens = html.replace(
      /<button[^>]*data-testid="cross-ref-token"[\s\S]*?<\/button>/g,
      '',
    );
    expect(withoutTokens).not.toMatch(/\[F\d+\]/);
    expect(withoutTokens).not.toMatch(/\[SC-[A-Z]+-\d+\]/);
  });

  it('surfaces an error when the API returns an error payload', async () => {
    mockFetch(() =>
      Promise.resolve(
        jsonResponse(
          { error: 'Missing required query parameter: context', narrative: null, fromCache: false },
          400,
        ),
      ),
    );

    render(<NarrativeView context="" />);
    const err = await screen.findByTestId('narrative-error');
    expect(err.textContent).toMatch(/Failed to compose narrative/);
  });

  it('emits a loading indicator immediately on mount (role="status")', () => {
    let resolve!: (resp: Response) => void;
    mockFetch(() => new Promise<Response>((r) => (resolve = r)));

    render(<NarrativeView context="E1" />);
    expect(screen.getByRole('status')).toBeInTheDocument();

    // Clean up pending promise.
    resolve(jsonResponse({ narrative: makeNarrative(), fromCache: false }));
  });
});
