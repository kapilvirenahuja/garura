/**
 * Tests for locked steps displaying play reference with dimmed styling.
 *
 * Verifies that ALL steps (including locked) show the play name,
 * with locked steps using dimmed text-gray-600 styling instead of hidden.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ChecklistCard } from '@/components/checklist-card';

const MOCK_STEPS = [
  {
    id: 's1',
    label: 'Step 1',
    description: 'First step',
    play: 'discover-product',
  },
  {
    id: 's2',
    label: 'Step 2',
    description: 'Second step',
    play: 'research-market-opportunity',
  },
  {
    id: 's3',
    label: 'Step 3',
    description: 'Third step',
    play: 'specify-product',
  },
];

describe('Locked steps play reference display', () => {
  it('all steps show play reference when expanded', () => {
    render(
      <ChecklistCard
        id="test"
        title="Test"
        steps={MOCK_STEPS}
        completedSteps={0}
        totalSteps={3}
        status="not-started"
        defaultExpanded
      />,
    );

    const playRefs = screen.getAllByTestId('step-play-ref');
    // All 3 steps show play ref (1 actionable + 2 locked)
    expect(playRefs.length).toBe(3);
    expect(playRefs[0]).toHaveTextContent('→ discover-product');
    expect(playRefs[1]).toHaveTextContent('→ research-market-opportunity');
    expect(playRefs[2]).toHaveTextContent('→ specify-product');
  });

  it('locked steps have dimmed play reference styling (text-gray-600)', () => {
    render(
      <ChecklistCard
        id="test"
        title="Test"
        steps={MOCK_STEPS}
        completedSteps={0}
        totalSteps={3}
        status="not-started"
        defaultExpanded
      />,
    );

    const playRefs = screen.getAllByTestId('step-play-ref');

    // Actionable step (index 0) — normal styling
    expect(playRefs[0]?.className).toContain('text-gray-500');
    expect(playRefs[0]?.className).not.toContain('text-gray-600');

    // Locked steps (index 1, 2) — dimmed styling
    expect(playRefs[1]?.className).toContain('text-gray-600');
    expect(playRefs[2]?.className).toContain('text-gray-600');
  });

  it('done steps have normal play reference styling', () => {
    render(
      <ChecklistCard
        id="test"
        title="Test"
        steps={MOCK_STEPS}
        completedSteps={2}
        totalSteps={3}
        status="in-progress"
        defaultExpanded
      />,
    );

    const playRefs = screen.getAllByTestId('step-play-ref');
    expect(playRefs.length).toBe(3);

    // Done steps — normal styling (not dimmed)
    expect(playRefs[0]?.className).toContain('text-gray-500');
    expect(playRefs[1]?.className).toContain('text-gray-500');
    // Locked step — dimmed
    // Step 3 is in-progress (actionable), not locked, when completedSteps=2
    expect(playRefs[2]?.className).toContain('text-gray-500');
  });

  it('locked steps show metadata but do NOT have CTAs', () => {
    render(
      <ChecklistCard
        id="test"
        title="Test"
        steps={MOCK_STEPS}
        completedSteps={0}
        totalSteps={3}
        status="not-started"
        defaultExpanded
      />,
    );

    const steps = screen.getAllByTestId('checklist-step');

    // Step 1 (actionable) should have CTA
    const ctaButtons = screen.getAllByTestId('cta-button');
    expect(ctaButtons.length).toBe(1);

    // Locked steps should have play ref visible but no CTA
    expect(steps[1]).toHaveAttribute('data-step-state', 'locked');
    expect(steps[2]).toHaveAttribute('data-step-state', 'locked');

    // All steps have play references
    const playRefs = screen.getAllByTestId('step-play-ref');
    expect(playRefs.length).toBe(3);

    // But only 1 CTA exists (for the actionable step)
    expect(screen.getAllByTestId('cta-button').length).toBe(1);
  });
});
