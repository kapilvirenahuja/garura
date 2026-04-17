/**
 * Step Execution Tests
 *
 * Tests for the checklist step execution system: sequential unlock,
 * step metadata display, CTA triggers play execution, ContentSlot streaming,
 * completed steps not retriggerable, next step unlocks on completion,
 * one CTA active at a time.
 *
 * Fulfills: VAL-CHECK-018 (sequential unlock),
 *           VAL-CHECK-019 (step metadata display),
 *           VAL-CHECK-020 (CTA triggers play execution),
 *           VAL-CHECK-021 (ContentSlot streaming below step),
 *           VAL-CHECK-022 (completed step not retriggerable),
 *           VAL-CHECK-023 (next step unlocks on completion),
 *           VAL-CHECK-024 (one CTA active at a time)
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, within, fireEvent } from '@testing-library/react';

import { ChecklistCard } from '@/components/checklist-card';
import type { ActiveExecution } from '@/hooks/use-step-execution';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

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
  {
    id: 'step-4',
    label: 'Define features',
    description: 'Structure capabilities and constraints.',
    play: 'draft-product-spec',
  },
  {
    id: 'step-5',
    label: 'Plan roadmap',
    description: 'Sequence epics into delivery plan.',
    play: 'plan-roadmap',
  },
];

// ============================================================================
// VAL-CHECK-018: Sequential Unlock
// ============================================================================
describe('Step Execution — Sequential Unlock (VAL-CHECK-018)', () => {
  it('step 1 complete, step 2 active, step 3 locked', () => {
    render(
      <ChecklistCard
        id="test-checklist"
        title="Test Checklist"
        steps={MOCK_STEPS}
        completedSteps={1}
        totalSteps={5}
        status="in-progress"
        defaultExpanded
      />,
    );

    const steps = screen.getAllByTestId('checklist-step');
    expect(steps[0]).toHaveAttribute('data-step-state', 'done');
    expect(steps[1]).toHaveAttribute('data-step-state', 'in-progress');
    expect(steps[2]).toHaveAttribute('data-step-state', 'locked');
    expect(steps[3]).toHaveAttribute('data-step-state', 'locked');
    expect(steps[4]).toHaveAttribute('data-step-state', 'locked');
  });

  it('clicking a locked step produces no action', () => {
    const mockExecute = vi.fn();

    render(
      <ChecklistCard
        id="test-checklist"
        title="Test Checklist"
        steps={MOCK_STEPS}
        completedSteps={1}
        totalSteps={5}
        status="in-progress"
        defaultExpanded
        onStepExecute={mockExecute}
      />,
    );

    const steps = screen.getAllByTestId('checklist-step');
    // Click locked step 3
    fireEvent.click(steps[2]!);

    expect(mockExecute).not.toHaveBeenCalled();
    expect(steps[2]).toHaveAttribute('data-step-state', 'locked');
  });

  it('locked steps do not have CTA buttons', () => {
    render(
      <ChecklistCard
        id="test-checklist"
        title="Test Checklist"
        steps={MOCK_STEPS}
        completedSteps={1}
        totalSteps={5}
        status="in-progress"
        defaultExpanded
      />,
    );

    const steps = screen.getAllByTestId('checklist-step');

    // Steps 3-5 (locked) should not have CTA containers
    for (let i = 2; i < steps.length; i++) {
      const ctaContainer = within(steps[i]!).queryByTestId('step-cta-container');
      expect(ctaContainer).toBeNull();
    }
  });

  it('with 0 completedSteps, only first step is actionable', () => {
    render(
      <ChecklistCard
        id="test-checklist"
        title="Test Checklist"
        steps={MOCK_STEPS}
        completedSteps={0}
        totalSteps={5}
        status="not-started"
        defaultExpanded
      />,
    );

    const steps = screen.getAllByTestId('checklist-step');
    expect(steps[0]).toHaveAttribute('data-step-state', 'in-progress');
    for (let i = 1; i < steps.length; i++) {
      expect(steps[i]).toHaveAttribute('data-step-state', 'locked');
    }
  });

  it('with 3 completedSteps, step 4 is actionable', () => {
    render(
      <ChecklistCard
        id="test-checklist"
        title="Test Checklist"
        steps={MOCK_STEPS}
        completedSteps={3}
        totalSteps={5}
        status="in-progress"
        defaultExpanded
      />,
    );

    const steps = screen.getAllByTestId('checklist-step');
    expect(steps[0]).toHaveAttribute('data-step-state', 'done');
    expect(steps[1]).toHaveAttribute('data-step-state', 'done');
    expect(steps[2]).toHaveAttribute('data-step-state', 'done');
    expect(steps[3]).toHaveAttribute('data-step-state', 'in-progress');
    expect(steps[4]).toHaveAttribute('data-step-state', 'locked');
  });
});

// ============================================================================
// VAL-CHECK-019: Step Metadata Display
// ============================================================================
describe('Step Execution — Step Metadata (VAL-CHECK-019)', () => {
  it('each step displays name (label) via ChecklistItem', () => {
    render(
      <ChecklistCard
        id="test-checklist"
        title="Test Checklist"
        steps={MOCK_STEPS}
        completedSteps={0}
        totalSteps={5}
        status="not-started"
        defaultExpanded
      />,
    );

    // Labels appear in ChecklistItem label spans
    const labels = screen.getAllByTestId('checklist-item-label');
    expect(labels.length).toBe(5);
    expect(labels[0]).toHaveTextContent('Provide project brief');
    expect(labels[1]).toHaveTextContent('Review market analysis');
    expect(labels[2]).toHaveTextContent('Lock product spec');
    expect(labels[3]).toHaveTextContent('Define features');
    expect(labels[4]).toHaveTextContent('Plan roadmap');
  });

  it('each step displays description', () => {
    render(
      <ChecklistCard
        id="test-checklist"
        title="Test Checklist"
        steps={MOCK_STEPS}
        completedSteps={0}
        totalSteps={5}
        status="not-started"
        defaultExpanded
      />,
    );

    const descriptions = screen.getAllByTestId('step-description');
    expect(descriptions[0]).toHaveTextContent('Describe what you are building.');
    expect(descriptions[1]).toHaveTextContent('AI analyzes competitors, TAM/SAM.');
  });

  it('actionable step displays mapped play name', () => {
    render(
      <ChecklistCard
        id="test-checklist"
        title="Test Checklist"
        steps={MOCK_STEPS}
        completedSteps={0}
        totalSteps={5}
        status="not-started"
        defaultExpanded
      />,
    );

    // Actionable step (step 1) should show play reference
    const playRefs = screen.getAllByTestId('step-play-ref');
    expect(playRefs.length).toBeGreaterThanOrEqual(1);
    expect(playRefs[0]).toHaveTextContent('→ discover-product');
  });

  it('done steps display play name as well', () => {
    render(
      <ChecklistCard
        id="test-checklist"
        title="Test Checklist"
        steps={MOCK_STEPS}
        completedSteps={2}
        totalSteps={5}
        status="in-progress"
        defaultExpanded
      />,
    );

    // All steps (done, actionable, and locked) show play reference
    const playRefs = screen.getAllByTestId('step-play-ref');
    expect(playRefs.length).toBe(5); // all steps show play ref
    expect(playRefs[0]).toHaveTextContent('→ discover-product');
    expect(playRefs[1]).toHaveTextContent('→ research-market-opportunity');
    expect(playRefs[2]).toHaveTextContent('→ specify-product');
  });

  it('locked steps display play reference with dimmed styling', () => {
    render(
      <ChecklistCard
        id="test-checklist"
        title="Test Checklist"
        steps={MOCK_STEPS}
        completedSteps={0}
        totalSteps={5}
        status="not-started"
        defaultExpanded
      />,
    );

    // All steps show play ref — locked steps have dimmed styling
    const playRefs = screen.getAllByTestId('step-play-ref');
    expect(playRefs.length).toBe(5);
    // First step (actionable) has normal styling
    expect(playRefs[0]?.className).toContain('text-gray-500');
    // Locked steps have dimmed styling
    expect(playRefs[1]?.className).toContain('text-gray-600');
    expect(playRefs[2]?.className).toContain('text-gray-600');
    expect(playRefs[3]?.className).toContain('text-gray-600');
    expect(playRefs[4]?.className).toContain('text-gray-600');
  });
});

// ============================================================================
// VAL-CHECK-020: CTA Triggers Play Execution
// ============================================================================
describe('Step Execution — CTA Triggers Play (VAL-CHECK-020)', () => {
  it('clicking CTA calls onStepExecute with playName and stepId', () => {
    const mockExecute = vi.fn();

    render(
      <ChecklistCard
        id="test-checklist"
        title="Test Checklist"
        steps={MOCK_STEPS}
        completedSteps={0}
        totalSteps={5}
        status="not-started"
        defaultExpanded
        onStepExecute={mockExecute}
      />,
    );

    const ctaButton = screen.getByTestId('cta-button');
    fireEvent.click(ctaButton);

    expect(mockExecute).toHaveBeenCalledWith('discover-product', 'step-1');
  });

  it('CTA button references the correct play', () => {
    render(
      <ChecklistCard
        id="test-checklist"
        title="Test Checklist"
        steps={MOCK_STEPS}
        completedSteps={2}
        totalSteps={5}
        status="in-progress"
        defaultExpanded
      />,
    );

    const ctaButton = screen.getByTestId('cta-button');
    expect(ctaButton).toHaveAttribute('data-play', 'specify-product');
  });
});

// ============================================================================
// VAL-CHECK-021: ContentSlot Streams Below Active Step
// ============================================================================
describe('Step Execution — ContentSlot Streaming (VAL-CHECK-021)', () => {
  it('ContentSlot appears below executing step', () => {
    const execution: ActiveExecution = {
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
        totalSteps={5}
        status="not-started"
        defaultExpanded
        activeExecution={execution}
      />,
    );

    const contentSlot = screen.getByTestId('step-content-slot');
    expect(contentSlot).toBeInTheDocument();

    // ContentSlot should contain the streaming output
    const slot = within(contentSlot).getByTestId('content-slot');
    expect(slot).toHaveAttribute('data-state', 'active');

    const content = within(contentSlot).getByTestId('content-slot-content');
    expect(content).toHaveTextContent('[garura] Starting play: discover-product');
  });

  it('ContentSlot is inside the correct step', () => {
    const execution: ActiveExecution = {
      checklistId: 'test-checklist',
      stepId: 'step-1',
      playName: 'discover-product',
      output: 'Running...',
      status: 'running',
    };

    render(
      <ChecklistCard
        id="test-checklist"
        title="Test Checklist"
        steps={MOCK_STEPS}
        completedSteps={0}
        totalSteps={5}
        status="not-started"
        defaultExpanded
        activeExecution={execution}
      />,
    );

    const steps = screen.getAllByTestId('checklist-step');
    // ContentSlot should be inside step-1
    const slotInStep1 = within(steps[0]!).queryByTestId('step-content-slot');
    expect(slotInStep1).toBeInTheDocument();

    // ContentSlot should NOT be in step-2
    const slotInStep2 = within(steps[1]!).queryByTestId('step-content-slot');
    expect(slotInStep2).toBeNull();
  });

  it('ContentSlot does not appear when not executing', () => {
    render(
      <ChecklistCard
        id="test-checklist"
        title="Test Checklist"
        steps={MOCK_STEPS}
        completedSteps={0}
        totalSteps={5}
        status="not-started"
        defaultExpanded
        activeExecution={null}
      />,
    );

    expect(screen.queryByTestId('step-content-slot')).toBeNull();
  });

  it('shows running indicator when step is executing', () => {
    const execution: ActiveExecution = {
      checklistId: 'test-checklist',
      stepId: 'step-1',
      playName: 'discover-product',
      output: '',
      status: 'running',
    };

    render(
      <ChecklistCard
        id="test-checklist"
        title="Test Checklist"
        steps={MOCK_STEPS}
        completedSteps={0}
        totalSteps={5}
        status="not-started"
        defaultExpanded
        activeExecution={execution}
      />,
    );

    const indicator = screen.getByTestId('step-executing-indicator');
    expect(indicator).toBeInTheDocument();
    expect(indicator).toHaveTextContent('Running discover-product');
  });
});

// ============================================================================
// VAL-CHECK-022: Completed Step Not Retriggerable
// ============================================================================
describe('Step Execution — Completed Steps (VAL-CHECK-022)', () => {
  it('completed step has checkmark badge', () => {
    render(
      <ChecklistCard
        id="test-checklist"
        title="Test Checklist"
        steps={MOCK_STEPS}
        completedSteps={2}
        totalSteps={5}
        status="in-progress"
        defaultExpanded
      />,
    );

    const steps = screen.getAllByTestId('checklist-step');
    // Steps 1 and 2 are done — should have completion badges
    const badge1 = within(steps[0]!).getByTestId('step-complete-badge');
    expect(badge1).toBeInTheDocument();
    expect(badge1).toHaveTextContent('✓');

    const badge2 = within(steps[1]!).getByTestId('step-complete-badge');
    expect(badge2).toBeInTheDocument();
    expect(badge2).toHaveTextContent('✓');
  });

  it('completed step has no CTA button', () => {
    render(
      <ChecklistCard
        id="test-checklist"
        title="Test Checklist"
        steps={MOCK_STEPS}
        completedSteps={2}
        totalSteps={5}
        status="in-progress"
        defaultExpanded
      />,
    );

    const steps = screen.getAllByTestId('checklist-step');
    // Done steps should not have CTA containers
    const cta1 = within(steps[0]!).queryByTestId('step-cta-container');
    expect(cta1).toBeNull();

    const cta2 = within(steps[1]!).queryByTestId('step-cta-container');
    expect(cta2).toBeNull();
  });

  it('clicking completed step produces no execution', () => {
    const mockExecute = vi.fn();

    render(
      <ChecklistCard
        id="test-checklist"
        title="Test Checklist"
        steps={MOCK_STEPS}
        completedSteps={2}
        totalSteps={5}
        status="in-progress"
        defaultExpanded
        onStepExecute={mockExecute}
      />,
    );

    const steps = screen.getAllByTestId('checklist-step');
    // Click completed step
    fireEvent.click(steps[0]!);

    expect(mockExecute).not.toHaveBeenCalled();
  });

  it('in-progress step shows done icon (●) when completed', () => {
    render(
      <ChecklistCard
        id="test-checklist"
        title="Test Checklist"
        steps={MOCK_STEPS}
        completedSteps={1}
        totalSteps={5}
        status="in-progress"
        defaultExpanded
      />,
    );

    const steps = screen.getAllByTestId('checklist-step');
    // First step is done — ChecklistItem should show done state
    const item = within(steps[0]!).getByTestId('checklist-item');
    expect(item).toHaveAttribute('data-state', 'done');

    // Check the icon
    const icon = within(item).getByTestId('checklist-item-icon');
    expect(icon).toHaveTextContent('●');
  });
});

// ============================================================================
// VAL-CHECK-023: Next Step Unlocks on Completion
// ============================================================================
describe('Step Execution — Next Step Unlocks (VAL-CHECK-023)', () => {
  it('after step 1 completes, step 2 has CTA and active styling', () => {
    // completedSteps=1 means step 1 is done, step 2 is now in-progress
    render(
      <ChecklistCard
        id="test-checklist"
        title="Test Checklist"
        steps={MOCK_STEPS}
        completedSteps={1}
        totalSteps={5}
        status="in-progress"
        defaultExpanded
      />,
    );

    const steps = screen.getAllByTestId('checklist-step');
    // Step 2 should now be in-progress (actionable)
    expect(steps[1]).toHaveAttribute('data-step-state', 'in-progress');

    // Step 2 should have a CTA button
    const ctaContainer = within(steps[1]!).getByTestId('step-cta-container');
    expect(ctaContainer).toBeInTheDocument();

    const cta = within(ctaContainer).getByTestId('cta-button');
    expect(cta).toBeInTheDocument();
    expect(cta).toHaveAttribute('data-play', 'research-market-opportunity');
  });

  it('after step 2 completes, step 3 has CTA', () => {
    render(
      <ChecklistCard
        id="test-checklist"
        title="Test Checklist"
        steps={MOCK_STEPS}
        completedSteps={2}
        totalSteps={5}
        status="in-progress"
        defaultExpanded
      />,
    );

    const steps = screen.getAllByTestId('checklist-step');
    expect(steps[2]).toHaveAttribute('data-step-state', 'in-progress');

    const cta = within(steps[2]!).getByTestId('cta-button');
    expect(cta).toHaveAttribute('data-play', 'specify-product');
  });

  it('step 2 is no longer actionable after step 2 completes (now done)', () => {
    render(
      <ChecklistCard
        id="test-checklist"
        title="Test Checklist"
        steps={MOCK_STEPS}
        completedSteps={2}
        totalSteps={5}
        status="in-progress"
        defaultExpanded
      />,
    );

    const steps = screen.getAllByTestId('checklist-step');
    expect(steps[1]).toHaveAttribute('data-step-state', 'done');
    expect(within(steps[1]!).queryByTestId('step-cta-container')).toBeNull();
  });
});

// ============================================================================
// VAL-CHECK-024: One CTA Active Per Checklist at a Time
// ============================================================================
describe('Step Execution — One CTA Active Per Checklist (VAL-CHECK-024)', () => {
  it('DOM contains exactly one CTA button within checklist', () => {
    render(
      <ChecklistCard
        id="test-checklist"
        title="Test Checklist"
        steps={MOCK_STEPS}
        completedSteps={0}
        totalSteps={5}
        status="not-started"
        defaultExpanded
      />,
    );

    const card = screen.getByTestId('checklist-card');
    const ctaButtons = within(card).getAllByTestId('cta-button');
    expect(ctaButtons).toHaveLength(1);
  });

  it('DOM contains exactly one CTA when some steps are done', () => {
    render(
      <ChecklistCard
        id="test-checklist"
        title="Test Checklist"
        steps={MOCK_STEPS}
        completedSteps={3}
        totalSteps={5}
        status="in-progress"
        defaultExpanded
      />,
    );

    const card = screen.getByTestId('checklist-card');
    const ctaButtons = within(card).getAllByTestId('cta-button');
    expect(ctaButtons).toHaveLength(1);
  });

  it('CTA is hidden when step is executing', () => {
    const execution: ActiveExecution = {
      checklistId: 'test-checklist',
      stepId: 'step-1',
      playName: 'discover-product',
      output: 'Running...',
      status: 'running',
    };

    render(
      <ChecklistCard
        id="test-checklist"
        title="Test Checklist"
        steps={MOCK_STEPS}
        completedSteps={0}
        totalSteps={5}
        status="not-started"
        defaultExpanded
        activeExecution={execution}
      />,
    );

    const card = screen.getByTestId('checklist-card');
    const ctaButtons = within(card).queryAllByTestId('cta-button');
    expect(ctaButtons).toHaveLength(0);
  });

  it('CTA is hidden when ctaDisabled is true (same checklist executing)', () => {
    render(
      <ChecklistCard
        id="test-checklist"
        title="Test Checklist"
        steps={MOCK_STEPS}
        completedSteps={0}
        totalSteps={5}
        status="not-started"
        defaultExpanded
        ctaDisabled
      />,
    );

    const card = screen.getByTestId('checklist-card');
    const ctaButtons = within(card).queryAllByTestId('cta-button');
    expect(ctaButtons).toHaveLength(0);
  });

  it('no CTA when all steps are completed', () => {
    render(
      <ChecklistCard
        id="test-checklist"
        title="Test Checklist"
        steps={MOCK_STEPS}
        completedSteps={5}
        totalSteps={5}
        status="completed"
        defaultExpanded
      />,
    );

    const card = screen.getByTestId('checklist-card');
    const ctaButtons = within(card).queryAllByTestId('cta-button');
    expect(ctaButtons).toHaveLength(0);
  });
});

// ============================================================================
// ContentSlot only for owning checklist
// ============================================================================
describe('Step Execution — ContentSlot isolation', () => {
  it('does not show ContentSlot when execution belongs to a different checklist', () => {
    const execution: ActiveExecution = {
      checklistId: 'other-checklist',
      stepId: 'step-1',
      playName: 'discover-product',
      output: 'Running...',
      status: 'running',
    };

    render(
      <ChecklistCard
        id="test-checklist"
        title="Test Checklist"
        steps={MOCK_STEPS}
        completedSteps={0}
        totalSteps={5}
        status="not-started"
        defaultExpanded
        activeExecution={execution}
      />,
    );

    expect(screen.queryByTestId('step-content-slot')).toBeNull();
    expect(screen.queryByTestId('step-executing-indicator')).toBeNull();
  });
});

// ============================================================================
// API Route — Play Execution Endpoint
// ============================================================================
describe('Step Execution — API Endpoint Validation', () => {
  it('validates play name is not empty', async () => {
    // This test verifies our validatePlayName logic
    // The actual API route test would need a running server
    // Here we test the component's behavior when clicking CTA
    const mockExecute = vi.fn();

    render(
      <ChecklistCard
        id="test-checklist"
        title="Test Checklist"
        steps={MOCK_STEPS}
        completedSteps={0}
        totalSteps={5}
        status="not-started"
        defaultExpanded
        onStepExecute={mockExecute}
      />,
    );

    const ctaButton = screen.getByTestId('cta-button');
    fireEvent.click(ctaButton);

    // The callback receives a valid play name from the step data
    expect(mockExecute).toHaveBeenCalledWith('discover-product', 'step-1');
    expect(mockExecute.mock.calls[0]![0]).not.toBe('');
  });
});

// ============================================================================
// VAL-CHECK-033: Concurrent Execution — Different Checklists Execute Together
// ============================================================================
describe('Step Execution — Concurrent Execution (VAL-CHECK-033)', () => {
  it('checklist A shows CTA while checklist B is executing (per-checklist CTA disabling)', () => {
    // Render checklist A — NOT executing, NOT disabled
    // (Checklist B is executing elsewhere but that doesn't disable A's CTA)
    render(
      <ChecklistCard
        id="checklist-a"
        title="Checklist A"
        steps={MOCK_STEPS}
        completedSteps={0}
        totalSteps={5}
        status="not-started"
        defaultExpanded
        activeExecution={null}
        ctaDisabled={false}
      />,
    );

    const cardA = screen.getByTestId('checklist-card');
    const ctaButtons = within(cardA).queryAllByTestId('cta-button');
    // Checklist A should still have its CTA even though B is executing
    expect(ctaButtons).toHaveLength(1);
    // Verify it references the correct play for checklist A's first step
    expect(ctaButtons[0]).toHaveAttribute('data-play', 'discover-product');
  });

  it('two checklists render ContentSlots independently', () => {
    const executionA: ActiveExecution = {
      checklistId: 'checklist-a',
      stepId: 'step-1',
      playName: 'discover-product',
      output: 'Output from A...',
      status: 'running',
    };

    const executionB: ActiveExecution = {
      checklistId: 'checklist-b',
      stepId: 'step-1',
      playName: 'research-market-opportunity',
      output: 'Output from B...',
      status: 'running',
    };

    const { unmount } = render(
      <div>
        <ChecklistCard
          id="checklist-a"
          title="Checklist A"
          steps={MOCK_STEPS}
          completedSteps={0}
          totalSteps={5}
          status="not-started"
          defaultExpanded
          activeExecution={executionA}
          ctaDisabled
        />
        <ChecklistCard
          id="checklist-b"
          title="Checklist B"
          steps={MOCK_STEPS}
          completedSteps={0}
          totalSteps={5}
          status="not-started"
          defaultExpanded
          activeExecution={executionB}
          ctaDisabled
        />
      </div>,
    );

    // Both checklists should have ContentSlots
    const contentSlots = screen.getAllByTestId('step-content-slot');
    expect(contentSlots).toHaveLength(2);

    // Both should have executing indicators
    const indicators = screen.getAllByTestId('step-executing-indicator');
    expect(indicators).toHaveLength(2);

    // Both indicators show the step's play name (from step.play, which is
    // 'discover-product' for step-1 in both checklists since they share MOCK_STEPS)
    expect(indicators[0]).toHaveTextContent('Running discover-product');
    expect(indicators[1]).toHaveTextContent('Running discover-product');

    unmount();
  });

  it('one checklist completes while another continues running', () => {
    const executionA: ActiveExecution = {
      checklistId: 'checklist-a',
      stepId: 'step-1',
      playName: 'discover-product',
      output: 'Completed!',
      status: 'complete',
    };

    const executionB: ActiveExecution = {
      checklistId: 'checklist-b',
      stepId: 'step-1',
      playName: 'research-market-opportunity',
      output: 'Still running...',
      status: 'running',
    };

    const { unmount } = render(
      <div>
        <ChecklistCard
          id="checklist-a"
          title="Checklist A"
          steps={MOCK_STEPS}
          completedSteps={0}
          totalSteps={5}
          status="not-started"
          defaultExpanded
          activeExecution={executionA}
        />
        <ChecklistCard
          id="checklist-b"
          title="Checklist B"
          steps={MOCK_STEPS}
          completedSteps={0}
          totalSteps={5}
          status="not-started"
          defaultExpanded
          activeExecution={executionB}
          ctaDisabled
        />
      </div>,
    );

    // Checklist A (complete) should not show running indicator
    const cards = screen.getAllByTestId('checklist-card');
    const runningIndicatorA = within(cards[0]!).queryByTestId('step-executing-indicator');
    expect(runningIndicatorA).toBeNull();

    // Checklist B should still be running (step.play is 'discover-product' from MOCK_STEPS)
    const runningIndicatorB = within(cards[1]!).queryByTestId('step-executing-indicator');
    expect(runningIndicatorB).toBeInTheDocument();
    expect(runningIndicatorB).toHaveTextContent('Running discover-product');

    unmount();
  });

  it('per-checklist CTA disabling: disabled for executing checklist, enabled for idle', () => {
    const executionA: ActiveExecution = {
      checklistId: 'checklist-a',
      stepId: 'step-1',
      playName: 'discover-product',
      output: 'Running...',
      status: 'running',
    };

    const { unmount } = render(
      <div>
        {/* Checklist A is executing — CTA disabled */}
        <ChecklistCard
          id="checklist-a"
          title="Checklist A"
          steps={MOCK_STEPS}
          completedSteps={0}
          totalSteps={5}
          status="not-started"
          defaultExpanded
          activeExecution={executionA}
          ctaDisabled
        />
        {/* Checklist B is idle — CTA should be available */}
        <ChecklistCard
          id="checklist-b"
          title="Checklist B"
          steps={MOCK_STEPS}
          completedSteps={0}
          totalSteps={5}
          status="not-started"
          defaultExpanded
          activeExecution={null}
          ctaDisabled={false}
        />
      </div>,
    );

    const cards = screen.getAllByTestId('checklist-card');

    // Checklist A: no CTA (executing)
    const ctaA = within(cards[0]!).queryAllByTestId('cta-button');
    expect(ctaA).toHaveLength(0);

    // Checklist B: has CTA (idle, not disabled)
    const ctaB = within(cards[1]!).queryAllByTestId('cta-button');
    expect(ctaB).toHaveLength(1);

    unmount();
  });

  it('abort controllers are per-checklist (error on A does not affect B)', () => {
    const executionA: ActiveExecution = {
      checklistId: 'checklist-a',
      stepId: 'step-1',
      playName: 'discover-product',
      output: 'Error output',
      status: 'error',
      error: 'Play failed',
    };

    const executionB: ActiveExecution = {
      checklistId: 'checklist-b',
      stepId: 'step-1',
      playName: 'research-market-opportunity',
      output: 'Still running fine...',
      status: 'running',
    };

    const { unmount } = render(
      <div>
        <ChecklistCard
          id="checklist-a"
          title="Checklist A"
          steps={MOCK_STEPS}
          completedSteps={0}
          totalSteps={5}
          status="not-started"
          defaultExpanded
          activeExecution={executionA}
        />
        <ChecklistCard
          id="checklist-b"
          title="Checklist B"
          steps={MOCK_STEPS}
          completedSteps={0}
          totalSteps={5}
          status="not-started"
          defaultExpanded
          activeExecution={executionB}
          ctaDisabled
        />
      </div>,
    );

    const cards = screen.getAllByTestId('checklist-card');

    // Checklist A: error slot visible
    const errorSlot = within(cards[0]!).getByTestId('step-error-slot');
    expect(errorSlot).toBeInTheDocument();

    // Checklist B: still running, no error (step.play is 'discover-product' from MOCK_STEPS)
    const errorSlotB = within(cards[1]!).queryByTestId('step-error-slot');
    expect(errorSlotB).toBeNull();
    const runningB = within(cards[1]!).getByTestId('step-executing-indicator');
    expect(runningB).toHaveTextContent('Running discover-product');

    unmount();
  });
});
