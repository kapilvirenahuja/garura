/**
 * Fix: ContentSlot persistence + CTA ref-based debounce
 *
 * Covers the two user-testing failures addressed by the
 * `fix-checklists-contentslot-debounce` feature:
 *
 *   VAL-CHECK-021 — ContentSlot must appear below the active step when a
 *                  play is triggered AND remain visible after completion
 *                  so the output is observable.
 *   VAL-CHECK-035 — Rapid CTA clicks must produce exactly one execution.
 *                  The fix adds a synchronous ref-based guard so the second
 *                  click is rejected even before React re-renders the
 *                  `disabled` attribute.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, within } from '@testing-library/react';

import { CTAButton } from '@/components/cta-button';
import { ChecklistCard } from '@/components/checklist-card';
import type { ActiveExecution } from '@/hooks/use-step-execution';

const MOCK_STEPS = [
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
  {
    id: 'step-3',
    label: 'Lock product spec',
    description: 'Review and approve product definition.',
    play: 'specify-product',
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// VAL-CHECK-021: ContentSlot remains visible after completion
// ═══════════════════════════════════════════════════════════════════════════

describe('Fix — ContentSlot stays visible after completion (VAL-CHECK-021)', () => {
  it('renders ContentSlot with final output when execution status is "complete"', () => {
    // Simulates the state *after* the SSE stream has finished: execution
    // remains in the activeExecutions map with status='complete' and the
    // accumulated output attached.
    const completed: ActiveExecution = {
      checklistId: 'test-checklist',
      stepId: 'step-1',
      playName: 'discover-product',
      output: '[garura] discover-product completed successfully.\n',
      status: 'complete',
    };

    render(
      <ChecklistCard
        id="test-checklist"
        title="Test Checklist"
        steps={MOCK_STEPS}
        completedSteps={0}
        totalSteps={3}
        status="in-progress"
        defaultExpanded
        activeExecution={completed}
      />,
    );

    const contentSlot = screen.getByTestId('step-content-slot');
    expect(contentSlot).toBeInTheDocument();

    const content = within(contentSlot).getByTestId('content-slot-content');
    expect(content).toHaveTextContent('discover-product completed successfully.');
  });

  it('does NOT show the "Running …" indicator for completed executions', () => {
    const completed: ActiveExecution = {
      checklistId: 'test-checklist',
      stepId: 'step-1',
      playName: 'discover-product',
      output: 'done',
      status: 'complete',
    };

    render(
      <ChecklistCard
        id="test-checklist"
        title="Test Checklist"
        steps={MOCK_STEPS}
        completedSteps={0}
        totalSteps={3}
        status="in-progress"
        defaultExpanded
        activeExecution={completed}
      />,
    );

    // Running indicator is gated on `isStepRunning` (status === 'running').
    expect(screen.queryByTestId('step-executing-indicator')).toBeNull();
  });

  it('ContentSlot is attached to the step the execution ran on (not the next step)', () => {
    const completed: ActiveExecution = {
      checklistId: 'test-checklist',
      stepId: 'step-1',
      playName: 'discover-product',
      output: 'finished',
      status: 'complete',
    };

    render(
      <ChecklistCard
        id="test-checklist"
        title="Test Checklist"
        steps={MOCK_STEPS}
        completedSteps={0}
        totalSteps={3}
        status="in-progress"
        defaultExpanded
        activeExecution={completed}
      />,
    );

    const steps = screen.getAllByTestId('checklist-step');
    // Step-1 carries the completed ContentSlot.
    expect(within(steps[0]!).getByTestId('step-content-slot')).toBeInTheDocument();
    // Step-2 does NOT carry a ContentSlot for a different step's execution.
    expect(within(steps[1]!).queryByTestId('step-content-slot')).toBeNull();
  });

  it('shows error slot (not active slot) when completed execution errored', () => {
    const errored: ActiveExecution = {
      checklistId: 'test-checklist',
      stepId: 'step-1',
      playName: 'discover-product',
      output: 'boom',
      status: 'error',
      error: 'Play failed',
    };

    render(
      <ChecklistCard
        id="test-checklist"
        title="Test Checklist"
        steps={MOCK_STEPS}
        completedSteps={0}
        totalSteps={3}
        status="in-progress"
        defaultExpanded
        activeExecution={errored}
      />,
    );

    expect(screen.queryByTestId('step-content-slot')).toBeNull();
    expect(screen.getByTestId('step-error-slot')).toBeInTheDocument();
  });

  it('ContentSlot is visible during the "running" phase too (regression guard)', () => {
    const running: ActiveExecution = {
      checklistId: 'test-checklist',
      stepId: 'step-1',
      playName: 'discover-product',
      output: '[garura] Starting play: discover-product\n',
      status: 'running',
    };

    render(
      <ChecklistCard
        id="test-checklist"
        title="Test Checklist"
        steps={MOCK_STEPS}
        completedSteps={0}
        totalSteps={3}
        status="in-progress"
        defaultExpanded
        activeExecution={running}
      />,
    );

    const contentSlot = screen.getByTestId('step-content-slot');
    const slot = within(contentSlot).getByTestId('content-slot');
    expect(slot).toHaveAttribute('data-state', 'active');
    expect(within(contentSlot).getByTestId('content-slot-content')).toHaveTextContent(
      'Starting play: discover-product',
    );
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// VAL-CHECK-035: Synchronous ref-based debounce
// ═══════════════════════════════════════════════════════════════════════════

describe('Fix — CTAButton synchronous ref-based debounce (VAL-CHECK-035)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('rejects a synthetic second click that fires BEFORE React re-renders', () => {
    // Even though the `disabled` attribute may not yet be applied to the DOM
    // between back-to-back click events in the same event loop tick, the
    // ref-based guard must reject re-entry. We dispatch a mouseup/down/click
    // triple synchronously with no awaits in between.
    const mockExecute = vi.fn();
    render(<CTAButton label="Run" playName="specify-product" onExecute={mockExecute} />);

    const btn = screen.getByTestId('cta-button');

    // Rapid-fire 5 clicks in the same synchronous flow.
    fireEvent.click(btn);
    fireEvent.click(btn);
    fireEvent.click(btn);
    fireEvent.click(btn);
    fireEvent.click(btn);

    expect(mockExecute).toHaveBeenCalledTimes(1);
  });

  it('second click is rejected even if the button is forcibly re-enabled in the DOM', () => {
    // Attack the synchronous path: the `disabled` attribute is the LAST line
    // of defence. The ref-based guard must reject the second click even when
    // `disabled` is removed from the DOM between clicks.
    const mockExecute = vi.fn();
    render(<CTAButton label="Run" playName="specify-product" onExecute={mockExecute} />);

    const btn = screen.getByTestId('cta-button') as HTMLButtonElement;

    fireEvent.click(btn);
    expect(mockExecute).toHaveBeenCalledTimes(1);

    // Tamper: drop the disabled attribute before React's next render.
    btn.disabled = false;
    btn.removeAttribute('disabled');
    btn.setAttribute('aria-disabled', 'false');

    fireEvent.click(btn);
    fireEvent.click(btn);

    // The synchronous ref guard (timestamp window) rejects both tampered
    // clicks because < 500 ms have passed since the first accepted click.
    expect(mockExecute).toHaveBeenCalledTimes(1);
  });

  it('after the 500ms debounce window expires, a new click is accepted', () => {
    const mockExecute = vi.fn();
    render(<CTAButton label="Run" playName="specify-product" onExecute={mockExecute} />);

    const btn = screen.getByTestId('cta-button');

    fireEvent.click(btn);
    expect(mockExecute).toHaveBeenCalledTimes(1);

    act(() => {
      vi.advanceTimersByTime(600);
    });

    // Button re-enabled after the debounce window — new click accepted.
    expect(btn).not.toBeDisabled();
    fireEvent.click(btn);
    expect(mockExecute).toHaveBeenCalledTimes(2);
  });

  it('disabled prop still short-circuits the click (unchanged behaviour)', () => {
    const mockExecute = vi.fn();
    render(<CTAButton label="Run" playName="specify-product" onExecute={mockExecute} disabled />);

    fireEvent.click(screen.getByTestId('cta-button'));
    expect(mockExecute).not.toHaveBeenCalled();
  });

  it('button exposes disabled + aria-disabled immediately after the first click', () => {
    render(<CTAButton label="Run" playName="specify-product" onExecute={vi.fn()} />);

    const btn = screen.getByTestId('cta-button');
    fireEvent.click(btn);

    expect(btn).toBeDisabled();
    expect(btn).toHaveAttribute('aria-disabled', 'true');
  });
});
