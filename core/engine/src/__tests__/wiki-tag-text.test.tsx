/**
 * Tests for `WikiTagText` — the prose renderer that substitutes interactive
 * {@link WikiTagRunner} components for every `[[play:prompt]]` pattern it
 * detects in a text string.
 *
 * Covers:
 *   - VAL-ACTION-001: valid wiki tags become interactive components.
 *   - VAL-ACTION-027: malformed patterns render verbatim as plain text.
 */

import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { WikiTagText } from '@/components/wiki-tag-text';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('<WikiTagText />', () => {
  it('renders plain text when no wiki tags are present', () => {
    const { container } = render(<WikiTagText text="plain prose here" />);
    expect(container.textContent).toBe('plain prose here');
    expect(screen.queryByTestId('wiki-tag-runner')).not.toBeInTheDocument();
  });

  it('substitutes valid [[play:prompt]] patterns with interactive runners', () => {
    globalThis.fetch = vi.fn() as unknown as typeof fetch; // unused, but defined for safety
    render(<WikiTagText text="See [[research:find latest docs]] for background." />);
    const runner = screen.getByTestId('wiki-tag-runner');
    expect(runner).toHaveAttribute('data-state', 'pending');
    expect(runner).toHaveAttribute('data-play', 'research');
    expect(screen.getByTestId('wiki-tag-text')).toHaveTextContent('research:find latest docs');
  });

  it('substitutes multiple wiki tags in the same string', () => {
    render(<WikiTagText text="[[a:one]] then [[b:two]]" />);
    const runners = screen.getAllByTestId('wiki-tag-runner');
    expect(runners).toHaveLength(2);
    expect(runners[0]).toHaveAttribute('data-play', 'a');
    expect(runners[1]).toHaveAttribute('data-play', 'b');
  });

  it('leaves malformed patterns as plain text (VAL-ACTION-027)', () => {
    const { container } = render(<WikiTagText text="bad [[play:]] tag" />);
    expect(container.textContent).toBe('bad [[play:]] tag');
    expect(screen.queryByTestId('wiki-tag-runner')).not.toBeInTheDocument();
  });

  it('preserves surrounding text around a valid tag', () => {
    render(<WikiTagText text="before [[research:query]] after" />);
    const runner = screen.getByTestId('wiki-tag-runner');
    expect(runner).toBeInTheDocument();
    // The surrounding text must still be present in the rendered output.
    const textNodes = runner.parentElement?.textContent ?? '';
    expect(textNodes).toContain('before');
    expect(textNodes).toContain('after');
  });

  it('renders nothing when given an empty string', () => {
    const { container } = render(<WikiTagText text="" />);
    expect(container.textContent).toBe('');
  });
});
