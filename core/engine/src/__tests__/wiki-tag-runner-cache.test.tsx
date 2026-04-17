/**
 * Tests for the WikiTagRunner's annotation-backed cache integration.
 *
 * Covers:
 *   - VAL-ACTION-025: a runner rendered with a cached result hydrates
 *     directly to the `complete` lifecycle, without executing the play.
 *   - VAL-ACTION-025 (write path): when a runner completes normally, the
 *     context's `recordWikiTagResult` is invoked so the sidecar gets an
 *     updated entry.
 *   - VAL-ACTION-026: the "re-run" button on a complete tag forces a new
 *     execution whose result is persisted via `recordWikiTagResult` —
 *     overwriting the prior sidecar entry server-side.
 *   - VAL-ACTION-032: the runner never issues a network request on mount
 *     even when the narrative context hydrates it from cache (beyond the
 *     initial context API fetches which are wired through fetch).
 */

import { act } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

import { WikiTagRunner } from '@/components/wiki-tag-runner';
import {
  NarrativeAnnotationProvider,
  useNarrativeAnnotations,
} from '@/components/narrative-annotation-context';

type FetchMock = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function makeSseStream(frames: ReadonlyArray<Record<string, unknown>>): Response {
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

interface FetchRecorder {
  readonly calls: Array<{
    url: string;
    method: string;
    body?: unknown;
  }>;
}

function installFetch(opts: {
  initialCache?: Array<{ play: string; prompt: string; result: string }>;
  executeFrames?: Array<Record<string, unknown>>;
}): FetchRecorder {
  const recorder: FetchRecorder = { calls: [] };
  const impl: FetchMock = (input, init) => {
    const url = String(input);
    const method = (init?.method ?? 'GET').toUpperCase();
    let body: unknown;
    if (init?.body && typeof init.body === 'string') {
      try {
        body = JSON.parse(init.body) as unknown;
      } catch {
        body = init.body;
      }
    }
    recorder.calls.push({ url, method, body });

    if (url.includes('/api/annotations/wiki-tag-cache') && method === 'GET') {
      const entries = (opts.initialCache ?? []).map((c) => ({
        id: `wtc-${c.play}-${c.prompt}`,
        play: c.play,
        prompt: c.prompt,
        result: c.result,
        author: 'Alice',
        timestamp: '2026-04-17T10:00:00Z',
        key: `${c.play}::${c.prompt}`,
      }));
      return Promise.resolve(jsonResponse({ context: 'E1', entries }));
    }
    if (url.includes('/api/annotations/wiki-tag-cache') && method === 'POST') {
      const { play, prompt, result } = body as {
        play: string;
        prompt: string;
        result: string;
      };
      return Promise.resolve(
        jsonResponse({
          entry: {
            id: `wtc-${play}-${prompt}`,
            type: 'wiki-tag-cache',
            content: result,
            author: 'Alice',
            timestamp: new Date().toISOString(),
            position: { play, prompt },
          },
        }),
      );
    }
    if (url.endsWith('/api/annotations') && method === 'GET') {
      return Promise.resolve(
        jsonResponse({ context: 'E1', annotations: [], comments: [], author: 'Alice' }),
      );
    }
    if (url.includes('/api/checklists/execute') && method === 'POST') {
      return Promise.resolve(
        makeSseStream(
          opts.executeFrames ?? [{ type: 'output', content: 'ok' }, { type: 'complete' }],
        ),
      );
    }
    return Promise.resolve(jsonResponse({ error: `unexpected ${method} ${url}` }, 400));
  };
  globalThis.fetch = vi.fn(impl) as unknown as typeof fetch;
  return recorder;
}

// Small helper that exposes the runtime context state for assertions.
function CacheProbe() {
  const api = useNarrativeAnnotations();
  return (
    <div
      data-testid="cache-probe"
      data-cache-size={api.wikiTagCache.size}
      data-loading={api.loading ? 'true' : 'false'}
    >
      {Array.from(api.wikiTagCache.entries())
        .map(([k, v]) => `${k}=${v.result}`)
        .join('|')}
    </div>
  );
}

describe('WikiTagRunner cache hydration (VAL-ACTION-025)', () => {
  it('hydrates to complete when the sidecar already has a cached result — no execute call on mount', async () => {
    const recorder = installFetch({
      initialCache: [{ play: 'research', prompt: 'scope', result: 'cached scope result' }],
    });

    render(
      <NarrativeAnnotationProvider context="E1">
        <WikiTagRunner play="research" prompt="scope" />
      </NarrativeAnnotationProvider>,
    );

    // Wait until the provider finishes hydrating from the mocked cache.
    await waitFor(() =>
      expect(screen.getByTestId('wiki-tag-runner')).toHaveAttribute('data-state', 'complete'),
    );

    fireEvent.click(screen.getByTestId('wiki-tag-expand'));
    expect(screen.getByTestId('wiki-tag-result')).toHaveTextContent('cached scope result');

    // VAL-ACTION-032 — no execute call was made on mount.
    const executeCalls = recorder.calls.filter((c) => c.url.includes('/api/checklists/execute'));
    expect(executeCalls).toHaveLength(0);
  });
});

describe('WikiTagRunner cache write on complete (VAL-ACTION-025)', () => {
  it('POSTs the aggregated result to /api/annotations/wiki-tag-cache after a successful run', async () => {
    const recorder = installFetch({
      executeFrames: [
        { type: 'output', content: 'chunk-a ' },
        { type: 'output', content: 'chunk-b' },
        { type: 'complete' },
      ],
    });

    render(
      <NarrativeAnnotationProvider context="E1">
        <WikiTagRunner play="research" prompt="scope" sectionId="overview" />
      </NarrativeAnnotationProvider>,
    );

    await waitFor(() =>
      expect(screen.getByTestId('wiki-tag-runner')).toHaveAttribute('data-state', 'pending'),
    );

    await act(async () => {
      fireEvent.click(screen.getByTestId('wiki-tag-runner'));
    });

    await waitFor(() =>
      expect(screen.getByTestId('wiki-tag-runner')).toHaveAttribute('data-state', 'complete'),
    );

    // Wait for the async cache POST scheduled in the finally/then tail.
    await waitFor(() => {
      const cachePost = recorder.calls.find(
        (c) => c.url.includes('/api/annotations/wiki-tag-cache') && c.method === 'POST',
      );
      expect(cachePost).toBeDefined();
      const body = cachePost!.body as {
        play: string;
        prompt: string;
        result: string;
        sectionId: string;
        context: string;
      };
      expect(body.context).toBe('E1');
      expect(body.play).toBe('research');
      expect(body.prompt).toBe('scope');
      expect(body.result).toBe('chunk-a chunk-b');
      expect(body.sectionId).toBe('overview');
    });
  });
});

describe('WikiTagRunner re-run (VAL-ACTION-026)', () => {
  it('re-run button forces another execution and persists the new result with the same key', async () => {
    const recorder = installFetch({
      initialCache: [{ play: 'research', prompt: 'scope', result: 'v1 cached' }],
      executeFrames: [{ type: 'output', content: 'v2 result' }, { type: 'complete' }],
    });

    render(
      <NarrativeAnnotationProvider context="E1">
        <WikiTagRunner play="research" prompt="scope" />
        <CacheProbe />
      </NarrativeAnnotationProvider>,
    );

    // Hydrated from cache.
    await waitFor(() =>
      expect(screen.getByTestId('wiki-tag-runner')).toHaveAttribute('data-state', 'complete'),
    );

    const rerun = screen.getByTestId('wiki-tag-rerun');
    expect(rerun).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(rerun);
    });

    await waitFor(() => {
      const executeCalls = recorder.calls.filter((c) => c.url.includes('/api/checklists/execute'));
      expect(executeCalls).toHaveLength(1);
    });

    await waitFor(() =>
      expect(screen.getByTestId('wiki-tag-runner')).toHaveAttribute('data-state', 'complete'),
    );

    // After the stream completes, the fresh result is POSTed to the cache.
    await waitFor(() => {
      const cachePosts = recorder.calls.filter(
        (c) => c.url.includes('/api/annotations/wiki-tag-cache') && c.method === 'POST',
      );
      expect(cachePosts).toHaveLength(1);
      expect((cachePosts[0]?.body as { result: string }).result).toBe('v2 result');
    });

    // And the in-memory cache probe reflects the override.
    await waitFor(() => {
      expect(screen.getByTestId('cache-probe')).toHaveAttribute('data-cache-size', '1');
      expect(screen.getByTestId('cache-probe').textContent).toContain('research::scope=v2 result');
    });
  });
});

describe('WikiTagRunner outside a provider', () => {
  it('does not render a re-run button when there is no narrative context', async () => {
    installFetch({});
    render(
      <WikiTagRunner
        play="research"
        prompt="scope"
        initialState="complete"
        initialResult="legacy"
      />,
    );
    expect(screen.queryByTestId('wiki-tag-rerun')).toBeNull();
  });
});
