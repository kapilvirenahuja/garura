/**
 * Tests for the `<AnnotationLayer />` UI component.
 *
 * Covers (in isolation, via a stubbed annotation API):
 *   - VAL-ACTION-020 / VAL-ACTION-022 — clicking "Add comment", typing into
 *     the composer, and pressing Save forwards a POST to the annotation
 *     context with the selection metadata.
 *   - VAL-ACTION-021 — the composer surfaces the resolved author string
 *     so users can see whose identity will be stamped.
 *   - VAL-ACTION-023 — wiki-tag syntax in annotation content is rendered
 *     through {@link WikiTagText}, producing an interactive runner.
 *   - VAL-ACTION-024 — existing sidecar annotations render at their
 *     anchored section position on first load.
 */

import { act } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { AnnotationLayer } from '@/components/annotation-layer';
import { NarrativeAnnotationProvider } from '@/components/narrative-annotation-context';

interface Saved {
  content: string;
  position: Record<string, unknown>;
}

type FetchMock = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function installFetch(initialAnns: unknown[] = [], captured: Saved[] = []): FetchMock {
  const fetchImpl: FetchMock = (input, init) => {
    const url = String(input);
    const method = (init?.method ?? 'GET').toUpperCase();
    if (url.includes('/api/annotations/wiki-tag-cache')) {
      return Promise.resolve(jsonResponse({ context: 'E1', entries: [] }));
    }
    if (url.includes('/api/annotations') && method === 'GET') {
      return Promise.resolve(
        jsonResponse({
          context: 'E1',
          annotations: initialAnns,
          author: 'Alice Author',
        }),
      );
    }
    if (url.includes('/api/annotations') && method === 'POST') {
      const payload = JSON.parse(String(init?.body)) as {
        content: string;
        position: Record<string, unknown>;
      };
      captured.push({ content: payload.content, position: payload.position });
      const saved = {
        id: `ann-test-${captured.length}`,
        type: 'comment',
        content: payload.content,
        author: 'Alice Author',
        timestamp: new Date('2026-04-18T10:00:00Z').toISOString(),
        position: payload.position,
      };
      return Promise.resolve(jsonResponse({ annotation: saved, author: 'Alice Author' }, 201));
    }
    return Promise.resolve(jsonResponse({ error: 'unexpected' }, 400));
  };
  globalThis.fetch = vi.fn(fetchImpl) as unknown as typeof fetch;
  return fetchImpl;
}

describe('<AnnotationLayer /> — composer (VAL-ACTION-020 / VAL-ACTION-022)', () => {
  it('renders the "Add comment" button and saves a new comment via the context API', async () => {
    const captured: Saved[] = [];
    installFetch([], captured);

    render(
      <NarrativeAnnotationProvider context="E1">
        <AnnotationLayer sectionId="overview" />
      </NarrativeAnnotationProvider>,
    );

    // Wait for the initial fetch to settle so loading=false enables the
    // add-comment affordance.
    await waitFor(() => expect(screen.getByTestId('annotation-add-button')).not.toBeDisabled());

    await act(async () => {
      fireEvent.click(screen.getByTestId('annotation-add-button'));
    });

    const composer = screen.getByTestId('annotation-composer');
    expect(composer).toBeInTheDocument();
    expect(composer).toHaveTextContent('Alice Author');

    const textarea = screen.getByTestId('annotation-textarea');
    fireEvent.change(textarea, { target: { value: 'Needs clarification on scope.' } });

    const saveBtn = screen.getByTestId('annotation-save-button');
    await act(async () => {
      fireEvent.click(saveBtn);
    });

    await waitFor(() => {
      expect(captured).toHaveLength(1);
    });
    expect(captured[0]?.content).toBe('Needs clarification on scope.');
    expect(captured[0]?.position?.sectionId).toBe('overview');

    // The newly-saved annotation should now be rendered in the list.
    await waitFor(() =>
      expect(screen.getByTestId('annotation-content')).toHaveTextContent(
        'Needs clarification on scope.',
      ),
    );
  });

  it('disables the Save button when the textarea is empty', async () => {
    installFetch([]);

    render(
      <NarrativeAnnotationProvider context="E1">
        <AnnotationLayer sectionId="overview" />
      </NarrativeAnnotationProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('annotation-add-button')).not.toBeDisabled());
    await act(async () => {
      fireEvent.click(screen.getByTestId('annotation-add-button'));
    });
    expect(screen.getByTestId('annotation-save-button')).toBeDisabled();
  });
});

describe('<AnnotationLayer /> — existing annotations (VAL-ACTION-024)', () => {
  it('renders saved comments anchored to this section, with author + timestamp', async () => {
    installFetch([
      {
        id: 'ann-1',
        type: 'comment',
        content: 'pre-existing',
        author: 'Bob Reviewer',
        timestamp: '2026-04-17T09:00:00Z',
        position: { sectionId: 'overview' },
      },
      {
        id: 'ann-2',
        type: 'comment',
        content: 'unrelated section — should not render here',
        author: 'Cara',
        timestamp: '2026-04-17T09:01:00Z',
        position: { sectionId: 'architecture' },
      },
    ]);

    render(
      <NarrativeAnnotationProvider context="E1">
        <AnnotationLayer sectionId="overview" />
      </NarrativeAnnotationProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('annotation-list')).toBeInTheDocument();
    });
    const list = screen.getByTestId('annotation-list');
    const items = within(list).getAllByTestId('annotation-item');
    expect(items).toHaveLength(1);
    expect(within(items[0]!).getByTestId('annotation-author')).toHaveTextContent('Bob Reviewer');
    expect(within(items[0]!).getByTestId('annotation-content')).toHaveTextContent('pre-existing');
  });

  it('renders wiki tags inside annotation content as interactive runners (VAL-ACTION-023)', async () => {
    installFetch([
      {
        id: 'ann-1',
        type: 'comment',
        content: 'look into [[research:scope]] next sprint',
        author: 'Bob',
        timestamp: '2026-04-17T09:00:00Z',
        position: { sectionId: 'overview' },
      },
    ]);

    render(
      <NarrativeAnnotationProvider context="E1">
        <AnnotationLayer sectionId="overview" />
      </NarrativeAnnotationProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('annotation-list')).toBeInTheDocument());
    // The WikiTagRunner's inner presentational element carries the label.
    const runner = screen.getByTestId('wiki-tag-runner');
    expect(runner).toHaveAttribute('data-state', 'pending');
    expect(runner).toHaveAttribute('data-play', 'research');
  });
});
