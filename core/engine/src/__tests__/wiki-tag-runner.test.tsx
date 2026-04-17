/**
 * Tests for the interactive `WikiTagRunner` component.
 *
 * Covers:
 *   - VAL-ACTION-002: pending tag is visually differentiated + triggerable.
 *   - VAL-ACTION-003: running tag shows a spinner during execution.
 *   - VAL-ACTION-004: complete tag shows checkmark + collapsed summary with
 *                     an expand control.
 *   - VAL-ACTION-005: state transitions are forward-only (clicks after
 *                     completion do not re-enter running/pending).
 *   - VAL-ACTION-031: runs successfully inside an InlineExpansion.
 *   - VAL-ACTION-032: no auto-execution on mount — initial state is pending
 *                     with no network request.
 */

import React from 'react';
import { act } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { WikiTagRunner } from '@/components/wiki-tag-runner';
import { InlineExpansion } from '@/components/inline-expansion';

type FetchMock = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

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

function mockFetch(impl: FetchMock): ReturnType<typeof vi.fn> {
  const spy = vi.fn(impl);
  globalThis.fetch = spy as unknown as typeof fetch;
  return spy;
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('<WikiTagRunner /> — initial render (VAL-ACTION-002, VAL-ACTION-032)', () => {
  it('renders a pending tag and makes NO network request on mount', () => {
    const spy = mockFetch(() => Promise.resolve(makeSseStream([])));
    render(<WikiTagRunner play="research" prompt="query" />);
    const wrapper = screen.getByTestId('wiki-tag-runner');
    expect(wrapper).toHaveAttribute('data-state', 'pending');
    expect(wrapper).toHaveAttribute('data-play', 'research');
    // Inner presentational WikiTag shows the "play:prompt" label.
    expect(screen.getByTestId('wiki-tag-text')).toHaveTextContent('research:query');
    // VAL-ACTION-032 — no autocall.
    expect(spy).not.toHaveBeenCalled();
  });

  it('preserves special characters and shell metacharacters in the displayed label', () => {
    mockFetch(() => Promise.resolve(makeSseStream([])));
    const prompt = 'what\'s the impact of "timeout" on <system>?';
    render(<WikiTagRunner play="research" prompt={prompt} />);
    expect(screen.getByTestId('wiki-tag-text')).toHaveTextContent(`research:${prompt}`);
  });
});

describe('<WikiTagRunner /> — execution lifecycle (VAL-ACTION-003, VAL-ACTION-004)', () => {
  it('transitions pending → running → complete via SSE stream', async () => {
    const spy = mockFetch(() =>
      Promise.resolve(
        makeSseStream([
          { type: 'output', content: 'first chunk ' },
          { type: 'output', content: 'second chunk' },
          { type: 'complete' },
        ]),
      ),
    );
    render(<WikiTagRunner play="research" prompt="query" />);

    await act(async () => {
      fireEvent.click(screen.getByTestId('wiki-tag-runner'));
    });

    await waitFor(() =>
      expect(screen.getByTestId('wiki-tag-runner')).toHaveAttribute('data-state', 'complete'),
    );

    // The inner WikiTag exposes the expand control on completion.
    const expand = screen.getByTestId('wiki-tag-expand');
    fireEvent.click(expand);
    expect(screen.getByTestId('wiki-tag-result')).toHaveTextContent('first chunk second chunk');

    // Verify the POST target and payload shape.
    expect(spy).toHaveBeenCalledTimes(1);
    const call = spy.mock.calls[0];
    if (!call) throw new Error('fetch was not called');
    const [url, init] = call as [RequestInfo | URL, RequestInit | undefined];
    expect(String(url)).toContain('/api/checklists/execute');
    expect(init?.method).toBe('POST');
    const body = JSON.parse(String(init?.body)) as Record<string, unknown>;
    expect(body.playName).toBe('research');
    expect(body.prompt).toBe('query');
  });

  it('shows the running state while the stream is in flight', async () => {
    // A stream whose first chunk resolves on `release()` lets us observe
    // the running state before completion.
    let release = () => {};
    const encoder = new TextEncoder();
    const delayedStream = new ReadableStream({
      start(controller) {
        release = () => {
          controller.enqueue(encoder.encode('data: {"type":"complete"}\n\n'));
          controller.close();
        };
      },
    });
    mockFetch(() =>
      Promise.resolve(
        new Response(delayedStream, {
          status: 200,
          headers: { 'content-type': 'text/event-stream' },
        }),
      ),
    );

    render(<WikiTagRunner play="research" prompt="query" />);

    await act(async () => {
      fireEvent.click(screen.getByTestId('wiki-tag-runner'));
    });

    // Running state visible while the stream is open.
    await waitFor(() =>
      expect(screen.getByTestId('wiki-tag-runner')).toHaveAttribute('data-state', 'running'),
    );
    expect(screen.getByTestId('wiki-tag-spinner')).toBeInTheDocument();

    // Release — stream completes, state advances.
    await act(async () => {
      release();
    });
    await waitFor(() =>
      expect(screen.getByTestId('wiki-tag-runner')).toHaveAttribute('data-state', 'complete'),
    );
  });
});

describe('<WikiTagRunner /> — forward-only lifecycle (VAL-ACTION-005)', () => {
  it('does not re-trigger execution after completion', async () => {
    const spy = mockFetch(() =>
      Promise.resolve(makeSseStream([{ type: 'output', content: 'ok' }, { type: 'complete' }])),
    );

    render(<WikiTagRunner play="research" prompt="query" />);
    await act(async () => {
      fireEvent.click(screen.getByTestId('wiki-tag-runner'));
    });
    await waitFor(() =>
      expect(screen.getByTestId('wiki-tag-runner')).toHaveAttribute('data-state', 'complete'),
    );

    // Subsequent clicks are rejected — the runner has advanced past pending.
    fireEvent.click(screen.getByTestId('wiki-tag-runner'));
    expect(spy).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('wiki-tag-runner')).toHaveAttribute('data-state', 'complete');
  });

  it('hydrates directly to complete when seeded with a cached result', () => {
    mockFetch(() => Promise.resolve(makeSseStream([])));
    render(
      <WikiTagRunner
        play="research"
        prompt="query"
        initialState="complete"
        initialResult="seeded result"
      />,
    );
    expect(screen.getByTestId('wiki-tag-runner')).toHaveAttribute('data-state', 'complete');
    fireEvent.click(screen.getByTestId('wiki-tag-expand'));
    expect(screen.getByTestId('wiki-tag-result')).toHaveTextContent('seeded result');
  });
});

describe('<WikiTagRunner /> — error path', () => {
  it('renders the error message in the complete state when the stream errors', async () => {
    mockFetch(() =>
      Promise.resolve(
        makeSseStream([
          { type: 'output', content: 'partial ' },
          { type: 'error', message: 'Play failed: exit code 1' },
        ]),
      ),
    );

    render(<WikiTagRunner play="research" prompt="query" />);
    await act(async () => {
      fireEvent.click(screen.getByTestId('wiki-tag-runner'));
    });
    await waitFor(() =>
      expect(screen.getByTestId('wiki-tag-runner')).toHaveAttribute('data-state', 'complete'),
    );
    fireEvent.click(screen.getByTestId('wiki-tag-expand'));
    expect(screen.getByTestId('wiki-tag-result')).toHaveTextContent(
      'Error: Play failed: exit code 1',
    );
  });

  it('still completes when the network throws', async () => {
    mockFetch(() => Promise.reject(new Error('network down')));

    render(<WikiTagRunner play="research" prompt="query" />);
    await act(async () => {
      fireEvent.click(screen.getByTestId('wiki-tag-runner'));
    });
    await waitFor(() =>
      expect(screen.getByTestId('wiki-tag-runner')).toHaveAttribute('data-state', 'complete'),
    );
    fireEvent.click(screen.getByTestId('wiki-tag-expand'));
    expect(screen.getByTestId('wiki-tag-result')).toHaveTextContent('Error: network down');
  });
});

describe('<WikiTagRunner /> — nested inside InlineExpansion (VAL-ACTION-031)', () => {
  it('runs correctly when rendered inside an open InlineExpansion', async () => {
    mockFetch(() =>
      Promise.resolve(
        makeSseStream([{ type: 'output', content: 'hi from expansion' }, { type: 'complete' }]),
      ),
    );

    render(
      <InlineExpansion defaultOpen summary="nested tag">
        <WikiTagRunner play="research" prompt="nested-query" />
      </InlineExpansion>,
    );

    await act(async () => {
      fireEvent.click(screen.getByTestId('wiki-tag-runner'));
    });
    await waitFor(() =>
      expect(screen.getByTestId('wiki-tag-runner')).toHaveAttribute('data-state', 'complete'),
    );

    fireEvent.click(screen.getByTestId('wiki-tag-expand'));
    expect(screen.getByTestId('wiki-tag-result')).toHaveTextContent('hi from expansion');
  });
});
