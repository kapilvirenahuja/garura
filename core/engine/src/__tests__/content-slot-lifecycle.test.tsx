/**
 * ContentSlot Lifecycle Tests (mdb-content-slots)
 *
 * Covers the lifecycle transitions added by the ContentSlot expansion,
 * streaming, and collapse feature:
 *
 *   - VAL-ACTION-017: ContentSlot expands smoothly on play start with a
 *                     progress indicator and streaming output.
 *   - VAL-ACTION-018: Post-completion the slot collapses to a compact
 *                     summary view with an expand control; clicking
 *                     the control reveals the full output.
 *   - VAL-ACTION-019: Multiple simultaneous ContentSlots (rendered in
 *                     parallel) operate independently — the state of
 *                     one never bleeds into another.
 *   - VAL-ACTION-028: The component never manipulates scroll position
 *                     on mount, update, or content change — the
 *                     browser's scroll Y remains stable while output
 *                     streams in below the current viewport.
 *   - VAL-ACTION-032: No auto-execute on page load — pending WikiTags
 *                     never trigger play execution without an explicit
 *                     user click.
 */

import React from 'react';
import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

import { ContentSlot } from '@/components/content-slot';
import { ChecklistCard } from '@/components/checklist-card';
import { WikiTagRunner } from '@/components/wiki-tag-runner';
import type { ActiveExecution } from '@/hooks/use-step-execution';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const STEPS = [
  {
    id: 'step-1',
    label: 'Provide project brief',
    description: 'Describe what you are building.',
    play: 'discover-product',
  },
  {
    id: 'step-2',
    label: 'Review market analysis',
    description: 'AI analyzes competitors, TAM/SAM.',
    play: 'research-market-opportunity',
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// VAL-ACTION-017: ContentSlot expansion on play start (smooth entrance
// transition + progress indicator).
// ═══════════════════════════════════════════════════════════════════════════

describe('ContentSlot — expansion on play start (VAL-ACTION-017)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the active state with a visible progress indicator and streaming content', () => {
    render(<ContentSlot state="active" content="Hello" />);
    const slot = screen.getByTestId('content-slot');
    expect(slot).toHaveAttribute('data-state', 'active');
    // Progress indicator is always shown in active state so the user
    // knows the play is in flight (even before a progress fraction is
    // available).
    expect(screen.getByTestId('content-slot-progress-indicator')).toBeInTheDocument();
    expect(screen.getByTestId('content-slot-content')).toHaveTextContent('Hello');
  });

  it('applies a mount transition class set (opacity + translate) so the slot animates into view', () => {
    render(<ContentSlot state="active" content="streaming" />);
    const slot = screen.getByTestId('content-slot');
    // Before the useEffect tick runs the node carries the "pre-mount"
    // transform classes; after the tick, it flips to the mounted state
    // so CSS transitions run.
    expect(slot).toHaveAttribute('data-mounted', 'false');
    // Pre-mount class list contains the initial invisible transform.
    expect(slot.className).toMatch(/-translate-y-1/);
    expect(slot.className).toMatch(/opacity-0/);
    // After flushing the mount microtask, the slot transitions into
    // its visible resting state.
    act(() => {
      vi.runAllTimers();
    });
    expect(slot).toHaveAttribute('data-mounted', 'true');
    expect(slot.className).toMatch(/translate-y-0/);
    expect(slot.className).toMatch(/opacity-100/);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// VAL-ACTION-018: Post-completion the slot collapses to a compact view
// with a summary line and an expand control. Clicking the control
// reveals the full output; clicking again collapses it.
// ═══════════════════════════════════════════════════════════════════════════

describe('ContentSlot — post-completion collapse (VAL-ACTION-018)', () => {
  it('renders the compact summary + expand control when state is complete', () => {
    render(
      <ContentSlot
        state="complete"
        content={'Line one\nLine two\nLine three'}
        summary="discover-product completed"
      />,
    );
    const slot = screen.getByTestId('content-slot');
    expect(slot).toHaveAttribute('data-state', 'complete');
    expect(slot).toHaveAttribute('data-expanded', 'false');
    expect(screen.getByTestId('content-slot-summary')).toHaveTextContent(
      'discover-product completed',
    );
    // Expand control is visible and labelled for assistive tech.
    const control = screen.getByTestId('content-slot-expand');
    expect(control).toBeInTheDocument();
    expect(control).toHaveAttribute('aria-expanded', 'false');
  });

  it('derives a summary from the first non-empty output line when no explicit summary is provided', () => {
    render(<ContentSlot state="complete" content={'\n\nFirst line\nSecond line\n'} />);
    expect(screen.getByTestId('content-slot-summary')).toHaveTextContent('First line');
  });

  it('falls back to a neutral summary when the play produced no output', () => {
    render(<ContentSlot state="complete" content="" />);
    expect(screen.getByTestId('content-slot-summary')).toHaveTextContent(/Play completed/i);
  });

  it('toggles the expanded body when the expand control is clicked', () => {
    render(<ContentSlot state="complete" content="Full output line A\nFull output line B" />);
    const slot = screen.getByTestId('content-slot');
    const body = screen.getByTestId('content-slot-expanded-body');
    expect(body).toHaveAttribute('data-visible', 'false');
    expect(body).toHaveAttribute('aria-hidden', 'true');

    const control = screen.getByTestId('content-slot-expand');
    fireEvent.click(control);
    expect(slot).toHaveAttribute('data-expanded', 'true');
    expect(body).toHaveAttribute('data-visible', 'true');
    expect(body).toHaveAttribute('aria-hidden', 'false');
    expect(within(body).getByTestId('content-slot-content')).toHaveTextContent(
      'Full output line A',
    );

    // Collapsing again hides the body without losing the content.
    fireEvent.click(control);
    expect(slot).toHaveAttribute('data-expanded', 'false');
    expect(body).toHaveAttribute('data-visible', 'false');
  });

  it('resets the expanded state when the slot transitions from active to complete', () => {
    const { rerender } = render(<ContentSlot state="active" content="streaming…" />);
    // Flip to complete — slot should render collapsed (default).
    rerender(<ContentSlot state="complete" content="final output" />);
    const slot = screen.getByTestId('content-slot');
    expect(slot).toHaveAttribute('data-state', 'complete');
    expect(slot).toHaveAttribute('data-expanded', 'false');
  });

  it('checklist-card maps status=complete to ContentSlot state=complete', () => {
    const completed: ActiveExecution = {
      checklistId: 'c1',
      stepId: 'step-1',
      playName: 'discover-product',
      output: 'Collected project brief',
      status: 'complete',
    };
    render(
      <ChecklistCard
        id="c1"
        title="Getting Started"
        steps={STEPS}
        completedSteps={0}
        totalSteps={STEPS.length}
        status="in-progress"
        defaultExpanded
        activeExecution={completed}
      />,
    );
    const stepSlot = screen.getByTestId('step-content-slot');
    const slot = within(stepSlot).getByTestId('content-slot');
    expect(slot).toHaveAttribute('data-state', 'complete');
    expect(within(slot).getByTestId('content-slot-summary')).toHaveTextContent(
      'discover-product completed',
    );
    expect(within(slot).getByTestId('content-slot-expand')).toBeInTheDocument();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// VAL-ACTION-019: Multiple simultaneous ContentSlots operate
// independently — expanding or collapsing one does not affect another.
// ═══════════════════════════════════════════════════════════════════════════

describe('ContentSlot — multiple simultaneous slots operate independently (VAL-ACTION-019)', () => {
  it("toggling one slot's expand control does not affect a sibling slot", () => {
    render(
      <div>
        <div data-testid="wrap-a">
          <ContentSlot state="complete" content="alpha output" summary="A done" />
        </div>
        <div data-testid="wrap-b">
          <ContentSlot state="complete" content="beta output" summary="B done" />
        </div>
      </div>,
    );

    const slotA = within(screen.getByTestId('wrap-a')).getByTestId('content-slot');
    const slotB = within(screen.getByTestId('wrap-b')).getByTestId('content-slot');

    expect(slotA).toHaveAttribute('data-expanded', 'false');
    expect(slotB).toHaveAttribute('data-expanded', 'false');

    fireEvent.click(within(slotA).getByTestId('content-slot-expand'));
    expect(slotA).toHaveAttribute('data-expanded', 'true');
    // Sibling slot stays collapsed — lifecycle state is per-instance.
    expect(slotB).toHaveAttribute('data-expanded', 'false');
  });

  it('renders mixed active + complete states side by side without interference', () => {
    render(
      <div>
        <div data-testid="wrap-running">
          <ContentSlot state="active" content="still streaming…" />
        </div>
        <div data-testid="wrap-done">
          <ContentSlot state="complete" content="finished" summary="done" />
        </div>
      </div>,
    );

    const running = within(screen.getByTestId('wrap-running')).getByTestId('content-slot');
    const done = within(screen.getByTestId('wrap-done')).getByTestId('content-slot');
    expect(running).toHaveAttribute('data-state', 'active');
    expect(done).toHaveAttribute('data-state', 'complete');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// VAL-ACTION-028: Scroll position preserved during streaming. The
// ContentSlot never invokes scrollIntoView or otherwise programmatically
// moves the viewport.
// ═══════════════════════════════════════════════════════════════════════════

describe('ContentSlot — scroll position preserved during streaming (VAL-ACTION-028)', () => {
  it('does not call scrollIntoView on mount or when streaming content grows', () => {
    // jsdom does not implement scrollIntoView; define a stub so the
    // spy can observe (non-)invocations.
    const scrollSpy = vi.fn();
    const proto = Element.prototype as unknown as {
      scrollIntoView: (...args: unknown[]) => void;
    };
    const original = proto.scrollIntoView;
    proto.scrollIntoView = scrollSpy;
    try {
      const { rerender } = render(<ContentSlot state="active" content="Chunk 1\n" />);
      expect(scrollSpy).not.toHaveBeenCalled();
      // Simulate additional SSE chunks being appended — the component
      // must remain quiet about scroll.
      rerender(<ContentSlot state="active" content="Chunk 1\nChunk 2\n" />);
      rerender(<ContentSlot state="active" content="Chunk 1\nChunk 2\nChunk 3\n" />);
      rerender(<ContentSlot state="complete" content="Chunk 1\nChunk 2\nChunk 3\n" />);
      expect(scrollSpy).not.toHaveBeenCalled();
    } finally {
      if (original) {
        proto.scrollIntoView = original;
      } else {
        delete (proto as { scrollIntoView?: unknown }).scrollIntoView;
      }
    }
  });

  it('does not invoke window.scrollTo during mount or transitions', () => {
    const windowScrollSpy = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    const { rerender } = render(<ContentSlot state="active" content="" />);
    rerender(<ContentSlot state="active" content="growing…" />);
    rerender(<ContentSlot state="complete" content="done" summary="ok" />);
    expect(windowScrollSpy).not.toHaveBeenCalled();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// VAL-ACTION-032: No auto-execute on page load. WikiTagRunner renders
// pending tags without firing any play execution until the user clicks.
// ═══════════════════════════════════════════════════════════════════════════

describe('ContentSlot / WikiTags — no auto-execute on page load (VAL-ACTION-032)', () => {
  it('WikiTagRunner renders pending state and does not call the execute endpoint on mount', () => {
    const fetchSpy = vi.fn();
    globalThis.fetch = fetchSpy as unknown as typeof fetch;

    render(<WikiTagRunner play="research" prompt="market trends" />);
    const tag = screen.getByTestId('wiki-tag-runner');
    expect(tag).toHaveAttribute('data-state', 'pending');
    // CRITICAL: no automatic fetch to the execute endpoint on mount.
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('ChecklistCard rendering does not automatically spawn a play execution', () => {
    const fetchSpy = vi.fn();
    globalThis.fetch = fetchSpy as unknown as typeof fetch;
    render(
      <ChecklistCard
        id="c1"
        title="Getting Started"
        steps={STEPS}
        completedSteps={0}
        totalSteps={STEPS.length}
        status="in-progress"
        defaultExpanded
      />,
    );
    // ChecklistCard is a presentational component — it renders the
    // actionable CTA, but never auto-fires the play. `fetch` must
    // remain untouched until an explicit click occurs.
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
