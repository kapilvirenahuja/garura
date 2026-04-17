/**
 * Tests for the ChecklistCard component — expand/collapse, title/progress/status display.
 *
 * Fulfills: VAL-CHECK-013 (title, progress, status without expanding),
 *           VAL-CHECK-014 (expand/collapse toggling)
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChecklistCard } from '@/components/checklist-card';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const MOCK_STEPS = [
  {
    id: 's1',
    label: 'Lock features for E1',
    description: 'Finalize the feature spec.',
    play: 'draft-product-spec',
  },
  {
    id: 's2',
    label: 'Design experience',
    description: 'Synthesize personas and screens.',
    play: 'design-exp',
  },
  {
    id: 's3',
    label: 'Build architecture',
    description: 'Produce architecture package.',
    play: 'build-arch',
  },
  {
    id: 's4',
    label: 'Prepare epic',
    description: 'Generate LLD, scenarios, plan.',
    play: 'prepare-epic',
  },
  {
    id: 's5',
    label: 'Begin implementation',
    description: 'Start implementation loop.',
    play: 'implement-epic',
  },
];

// ---------------------------------------------------------------------------
// VAL-CHECK-013: Title, progress, status without expanding
// ---------------------------------------------------------------------------

describe('ChecklistCard — collapsed state (VAL-CHECK-013)', () => {
  it('displays title without expanding', () => {
    render(
      <ChecklistCard
        id="prepare-epic"
        title="Prepare Epic for Implementation"
        steps={MOCK_STEPS}
        completedSteps={3}
        totalSteps={5}
        status="in-progress"
      />,
    );

    expect(screen.getByTestId('checklist-card-title')).toHaveTextContent(
      'Prepare Epic for Implementation',
    );
  });

  it('displays progress (N/M done) without expanding', () => {
    render(
      <ChecklistCard
        id="prepare-epic"
        title="Prepare Epic"
        steps={MOCK_STEPS}
        completedSteps={3}
        totalSteps={5}
        status="in-progress"
      />,
    );

    expect(screen.getByTestId('checklist-card-progress')).toHaveTextContent('3 / 5 done');
  });

  it('displays status marker without expanding', () => {
    render(
      <ChecklistCard
        id="prepare-epic"
        title="Prepare Epic"
        steps={MOCK_STEPS}
        completedSteps={3}
        totalSteps={5}
        status="in-progress"
      />,
    );

    const statusEl = screen.getByTestId('checklist-card-status');
    expect(statusEl).toHaveTextContent('◐');
    expect(statusEl).toHaveAttribute('title', 'In Progress');
  });

  it('does not show steps when collapsed', () => {
    render(
      <ChecklistCard
        id="prepare-epic"
        title="Prepare Epic"
        steps={MOCK_STEPS}
        completedSteps={0}
        totalSteps={5}
        status="not-started"
      />,
    );

    expect(screen.queryByTestId('checklist-card-steps')).toBeNull();
  });

  it('shows not-started status marker correctly', () => {
    render(
      <ChecklistCard
        id="test"
        title="Test"
        steps={MOCK_STEPS}
        completedSteps={0}
        totalSteps={5}
        status="not-started"
      />,
    );

    const statusEl = screen.getByTestId('checklist-card-status');
    expect(statusEl).toHaveTextContent('○');
    expect(statusEl).toHaveAttribute('title', 'Not Started');
  });

  it('shows completed status marker correctly', () => {
    render(
      <ChecklistCard
        id="test"
        title="Test"
        steps={MOCK_STEPS}
        completedSteps={5}
        totalSteps={5}
        status="completed"
      />,
    );

    const statusEl = screen.getByTestId('checklist-card-status');
    expect(statusEl).toHaveTextContent('●');
    expect(statusEl).toHaveAttribute('title', 'Completed');
  });
});

// ---------------------------------------------------------------------------
// VAL-CHECK-014: Expand/collapse toggling
// ---------------------------------------------------------------------------

describe('ChecklistCard — expand/collapse (VAL-CHECK-014)', () => {
  it('expands when header is clicked', () => {
    render(
      <ChecklistCard
        id="prepare-epic"
        title="Prepare Epic"
        steps={MOCK_STEPS}
        completedSteps={3}
        totalSteps={5}
        status="in-progress"
      />,
    );

    // Initially collapsed
    expect(screen.queryByTestId('checklist-card-steps')).toBeNull();

    // Click to expand
    fireEvent.click(screen.getByTestId('checklist-card-header'));

    // Steps should now be visible
    expect(screen.getByTestId('checklist-card-steps')).toBeInTheDocument();
    const steps = screen.getAllByTestId('checklist-step');
    expect(steps.length).toBe(5);
  });

  it('collapses when header is clicked again', () => {
    render(
      <ChecklistCard
        id="prepare-epic"
        title="Prepare Epic"
        steps={MOCK_STEPS}
        completedSteps={0}
        totalSteps={5}
        status="not-started"
      />,
    );

    const header = screen.getByTestId('checklist-card-header');

    // Expand
    fireEvent.click(header);
    expect(screen.getByTestId('checklist-card-steps')).toBeInTheDocument();

    // Collapse
    fireEvent.click(header);
    expect(screen.queryByTestId('checklist-card-steps')).toBeNull();
  });

  it('starts expanded when defaultExpanded is true', () => {
    render(
      <ChecklistCard
        id="prepare-epic"
        title="Prepare Epic"
        steps={MOCK_STEPS}
        completedSteps={3}
        totalSteps={5}
        status="in-progress"
        defaultExpanded
      />,
    );

    expect(screen.getByTestId('checklist-card-steps')).toBeInTheDocument();
  });

  it('shows completed steps as done in expanded view', () => {
    render(
      <ChecklistCard
        id="prepare-epic"
        title="Prepare Epic"
        steps={MOCK_STEPS}
        completedSteps={3}
        totalSteps={5}
        status="in-progress"
        defaultExpanded
      />,
    );

    const steps = screen.getAllByTestId('checklist-step');
    // First 3 steps should be done
    expect(steps[0]).toHaveAttribute('data-step-state', 'done');
    expect(steps[1]).toHaveAttribute('data-step-state', 'done');
    expect(steps[2]).toHaveAttribute('data-step-state', 'done');
    // Step 4 should be in-progress (actionable)
    expect(steps[3]).toHaveAttribute('data-step-state', 'in-progress');
    // Step 5 should be locked
    expect(steps[4]).toHaveAttribute('data-step-state', 'locked');
  });
});

// ---------------------------------------------------------------------------
// Muted styling for completed checklists (VAL-CHECK-015)
// ---------------------------------------------------------------------------

describe('ChecklistCard — muted style (VAL-CHECK-015)', () => {
  it('applies muted styling when muted prop is true', () => {
    render(
      <ChecklistCard
        id="test-complete"
        title="Completed Checklist"
        steps={MOCK_STEPS}
        completedSteps={5}
        totalSteps={5}
        status="completed"
        muted
      />,
    );

    const card = screen.getByTestId('checklist-card');
    expect(card.className).toContain('opacity-60');
  });

  it('does not show CTA buttons when muted', () => {
    render(
      <ChecklistCard
        id="test"
        title="Muted Checklist"
        steps={MOCK_STEPS}
        completedSteps={0}
        totalSteps={5}
        status="not-started"
        muted
        defaultExpanded
      />,
    );

    expect(screen.queryByTestId('step-cta-container')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Step CTA execution
// ---------------------------------------------------------------------------

describe('ChecklistCard — step CTA interaction', () => {
  it('calls onStepExecute when CTA is clicked', () => {
    const mockExecute = vi.fn();

    render(
      <ChecklistCard
        id="prepare-epic"
        title="Prepare Epic"
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

    expect(mockExecute).toHaveBeenCalledWith('draft-product-spec', 's1');
  });
});

// ---------------------------------------------------------------------------
// Data attributes
// ---------------------------------------------------------------------------

describe('ChecklistCard — data attributes', () => {
  it('has checklist-id and status data attributes', () => {
    render(
      <ChecklistCard
        id="prepare-epic"
        title="Prepare Epic"
        steps={MOCK_STEPS}
        completedSteps={2}
        totalSteps={5}
        status="in-progress"
      />,
    );

    const card = screen.getByTestId('checklist-card');
    expect(card).toHaveAttribute('data-checklist-id', 'prepare-epic');
    expect(card).toHaveAttribute('data-status', 'in-progress');
  });

  it('has expanded data attribute that tracks state', () => {
    render(
      <ChecklistCard
        id="test"
        title="Test"
        steps={MOCK_STEPS}
        completedSteps={0}
        totalSteps={5}
        status="not-started"
      />,
    );

    const card = screen.getByTestId('checklist-card');
    expect(card).toHaveAttribute('data-expanded', 'false');

    fireEvent.click(screen.getByTestId('checklist-card-header'));
    expect(card).toHaveAttribute('data-expanded', 'true');
  });
});
