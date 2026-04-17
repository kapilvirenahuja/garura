/**
 * Tests for the mid-project Checklists view — verifies the full page renders
 * correctly when readiness > 0, with multiple checklists, generative region,
 * and completed section.
 *
 * Fulfills: VAL-CHECK-012 (multiple checklists displayed),
 *           VAL-CHECK-013 (title, progress, status),
 *           VAL-CHECK-014 (expand/collapse),
 *           VAL-CHECK-015 (completed at bottom),
 *           VAL-CHECK-016 (ordered by impact),
 *           VAL-CHECK-017 (generative region)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ChecklistsPage from '@/app/checklists/page';

// ---------------------------------------------------------------------------
// Mock readiness context at mid-project state (score > 0)
// ---------------------------------------------------------------------------

const mockRefresh = vi.fn();
let mockScore = 45;

vi.mock('@/components/readiness-provider', () => ({
  useReadiness: () => ({
    score: mockScore,
    breakdown: [
      { area: 'Product', status: 'complete', totalPlays: 2, runnablePlays: 2, percentage: 100 },
      { area: 'Features', status: 'complete', totalPlays: 3, runnablePlays: 3, percentage: 100 },
      { area: 'Roadmap', status: 'in-progress', totalPlays: 2, runnablePlays: 1, percentage: 50 },
      { area: 'Architecture', status: 'missing', totalPlays: 3, runnablePlays: 0, percentage: 0 },
      { area: 'Epics', status: 'missing', totalPlays: 4, runnablePlays: 0, percentage: 0 },
    ],
    totalPlays: 14,
    runnablePlays: 6,
    lastGitHash: 'abc123',
    loading: false,
    error: null,
    refresh: mockRefresh,
  }),
}));

// ---------------------------------------------------------------------------
// Mock fetch
// ---------------------------------------------------------------------------

const MOCK_MIDPROJECT_RESPONSE = {
  active: [
    {
      checklist: {
        id: 'prepare-epic',
        title: 'Prepare Epic for Implementation',
        description: 'Produce design artifacts before implementation.',
        category: 'epic-preparation',
        steps: [
          {
            id: 'p1',
            label: 'Lock features',
            description: 'Lock features for the epic.',
            play: 'draft-product-spec',
          },
          { id: 'p2', label: 'Design experience', description: 'Design UX.', play: 'design-exp' },
          { id: 'p3', label: 'Build architecture', description: 'Build arch.', play: 'build-arch' },
          { id: 'p4', label: 'Prepare epic', description: 'Generate LLD.', play: 'prepare-epic' },
          {
            id: 'p5',
            label: 'Begin implementation',
            description: 'Start impl.',
            play: 'implement-epic',
          },
        ],
      },
      status: 'in-progress' as const,
      completedSteps: 2,
      totalSteps: 5,
      readinessImpact: 35,
    },
    {
      checklist: {
        id: 'brownfield-onboarding',
        title: 'Brownfield Project Onboarding',
        description: 'Onboard to an existing project.',
        category: 'onboarding',
        steps: [
          {
            id: 'b1',
            label: 'Scout the project',
            description: 'Scan the codebase.',
            play: 'scout-project',
          },
          {
            id: 'b2',
            label: 'Check drift',
            description: 'Compare spec vs code.',
            play: 'check-drift',
          },
          {
            id: 'b3',
            label: 'Quality audit',
            description: 'Run quality audit.',
            play: 'quality-check',
          },
        ],
      },
      status: 'not-started' as const,
      completedSteps: 0,
      totalSteps: 3,
      readinessImpact: 20,
    },
  ],
  completed: [
    {
      checklist: {
        id: 'greenfield-onboarding',
        title: 'Getting Started: Greenfield Onboarding',
        description: 'Onboard a new project from scratch.',
        category: 'onboarding',
        steps: [
          { id: 's1', label: 'Step 1', description: 'Desc 1', play: 'discover-product' },
          { id: 's2', label: 'Step 2', description: 'Desc 2', play: 'research-market-opportunity' },
        ],
      },
      status: 'completed' as const,
      completedSteps: 2,
      totalSteps: 2,
      readinessImpact: 0,
    },
  ],
  selectionRationale:
    '2 checklists are relevant to your project right now. Ordered by impact on readiness. Architecture and Epics need attention.',
};

let mockFetchImpl: ReturnType<typeof vi.fn>;

beforeEach(() => {
  mockScore = 45;
  mockFetchImpl = vi.fn().mockImplementation((url: string) => {
    if (url === '/api/checklists/midproject') {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(MOCK_MIDPROJECT_RESPONSE),
      });
    }
    if (url === '/api/checklists') {
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            checklists: [],
            validation: { valid: true, invalidCount: 0 },
          }),
      });
    }
    return Promise.resolve({ ok: false, status: 404 });
  });

  vi.stubGlobal('fetch', mockFetchImpl);
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// VAL-CHECK-012: Multiple checklists displayed
// ---------------------------------------------------------------------------

describe('Mid-Project Checklists — Multiple Cards (VAL-CHECK-012)', () => {
  it('displays 2+ checklist cards with different titles', async () => {
    render(<ChecklistsPage />);

    await waitFor(() => {
      expect(screen.getByTestId('midproject-checklists')).toBeInTheDocument();
    });

    const cards = screen.getAllByTestId('checklist-card');
    expect(cards.length).toBeGreaterThanOrEqual(2);

    // All visible cards should have different titles
    const titles = screen.getAllByTestId('checklist-card-title').map((el) => el.textContent);
    const uniqueTitles = new Set(titles);
    expect(uniqueTitles.size).toBe(titles.length);
  });

  it('calls /api/checklists/midproject endpoint', async () => {
    render(<ChecklistsPage />);

    await waitFor(() => {
      expect(mockFetchImpl).toHaveBeenCalledWith('/api/checklists/midproject');
    });
  });
});

// ---------------------------------------------------------------------------
// VAL-CHECK-013: Title, progress, status without expanding
// ---------------------------------------------------------------------------

describe('Mid-Project Checklists — Card Info (VAL-CHECK-013)', () => {
  it('each card shows title, progress, and status marker without expanding', async () => {
    render(<ChecklistsPage />);

    await waitFor(() => {
      expect(screen.getByTestId('midproject-checklists')).toBeInTheDocument();
    });

    // The second card (brownfield) is collapsed by default
    const brownfieldCard = screen
      .getByText('Brownfield Project Onboarding')
      .closest('[data-testid="checklist-card"]');
    expect(brownfieldCard).toBeTruthy();

    // Should have title visible
    expect(screen.getByText('Brownfield Project Onboarding')).toBeInTheDocument();

    // Should have progress visible
    const progressElements = screen.getAllByTestId('checklist-card-progress');
    const brownfieldProgress = progressElements.find((el) => el.textContent === '0 / 3 done');
    expect(brownfieldProgress).toBeTruthy();

    // Should have status marker visible
    const statusElements = screen.getAllByTestId('checklist-card-status');
    expect(statusElements.length).toBeGreaterThanOrEqual(2);
  });
});

// ---------------------------------------------------------------------------
// VAL-CHECK-014: Expand/collapse toggling
// ---------------------------------------------------------------------------

describe('Mid-Project Checklists — Expand/Collapse (VAL-CHECK-014)', () => {
  it('clicking collapsed checklist expands it', async () => {
    render(<ChecklistsPage />);

    await waitFor(() => {
      expect(screen.getByTestId('midproject-checklists')).toBeInTheDocument();
    });

    // Find the brownfield card header (initially collapsed — second in order)
    const headers = screen.getAllByTestId('checklist-card-header');
    const brownfieldHeader = headers[1];
    if (!brownfieldHeader) throw new Error('brownfield header not found');

    // Should NOT have steps visible
    const brownfieldCard = brownfieldHeader.closest('[data-testid="checklist-card"]');
    if (!brownfieldCard) throw new Error('brownfield card not found');
    expect(brownfieldCard.getAttribute('data-expanded')).toBe('false');

    // Click to expand
    fireEvent.click(brownfieldHeader);

    // Now should have steps visible
    expect(brownfieldCard.getAttribute('data-expanded')).toBe('true');
  });

  it('clicking expanded checklist collapses it', async () => {
    render(<ChecklistsPage />);

    await waitFor(() => {
      expect(screen.getByTestId('midproject-checklists')).toBeInTheDocument();
    });

    // First card starts expanded (defaultExpanded for first active)
    const headers = screen.getAllByTestId('checklist-card-header');
    const firstHeader = headers[0];
    if (!firstHeader) throw new Error('first header not found');
    const firstCard = firstHeader.closest('[data-testid="checklist-card"]');
    if (!firstCard) throw new Error('first card not found');
    expect(firstCard.getAttribute('data-expanded')).toBe('true');

    // Click to collapse
    fireEvent.click(firstHeader);
    expect(firstCard.getAttribute('data-expanded')).toBe('false');
  });
});

// ---------------------------------------------------------------------------
// VAL-CHECK-015: Completed checklists at bottom
// ---------------------------------------------------------------------------

describe('Mid-Project Checklists — Completed at Bottom (VAL-CHECK-015)', () => {
  it('completed checklists in separate section below active ones', async () => {
    render(<ChecklistsPage />);

    await waitFor(() => {
      expect(screen.getByTestId('midproject-checklists')).toBeInTheDocument();
    });

    // Completed section should exist
    const completedSection = screen.getByTestId('completed-checklists');
    expect(completedSection).toBeInTheDocument();

    // Should contain the greenfield checklist
    expect(screen.getByText('Getting Started: Greenfield Onboarding')).toBeInTheDocument();
  });

  it('completed checklists have muted styling', async () => {
    render(<ChecklistsPage />);

    await waitFor(() => {
      expect(screen.getByTestId('midproject-checklists')).toBeInTheDocument();
    });

    // Find the completed card — it should have opacity-60 class
    const completedSection = screen.getByTestId('completed-checklists');
    const completedCard = completedSection.querySelector('[data-testid="checklist-card"]');
    expect(completedCard).toBeTruthy();
    expect(completedCard!.className).toContain('opacity-60');
  });

  it('active checklists appear before completed section', async () => {
    render(<ChecklistsPage />);

    await waitFor(() => {
      expect(screen.getByTestId('midproject-checklists')).toBeInTheDocument();
    });

    const activeSection = screen.getByTestId('active-checklists');
    const completedSection = screen.getByTestId('completed-checklists');

    // Active should appear before completed in DOM order
    const container = screen.getByTestId('midproject-checklists');
    const children = Array.from(container.children);
    const activeIndex = children.indexOf(activeSection);
    const completedIndex = children.indexOf(completedSection);

    expect(activeIndex).toBeLessThan(completedIndex);
  });
});

// ---------------------------------------------------------------------------
// VAL-CHECK-016: Ordered by readiness impact
// ---------------------------------------------------------------------------

describe('Mid-Project Checklists — Impact Ordering (VAL-CHECK-016)', () => {
  it('first active card has highest readiness impact', async () => {
    render(<ChecklistsPage />);

    await waitFor(() => {
      expect(screen.getByTestId('midproject-checklists')).toBeInTheDocument();
    });

    const activeCards = screen
      .getByTestId('active-checklists')
      .querySelectorAll('[data-testid="checklist-card"]');
    expect(activeCards.length).toBe(2);

    // First card should be prepare-epic (impact 35 > brownfield 20)
    expect(activeCards[0]).toHaveAttribute('data-checklist-id', 'prepare-epic');
    expect(activeCards[1]).toHaveAttribute('data-checklist-id', 'brownfield-onboarding');
  });
});

// ---------------------------------------------------------------------------
// VAL-CHECK-017: Generative region above checklists
// ---------------------------------------------------------------------------

describe('Mid-Project Checklists — Generative Region (VAL-CHECK-017)', () => {
  it('shows generative region above checklists', async () => {
    render(<ChecklistsPage />);

    await waitFor(() => {
      expect(screen.getByTestId('midproject-checklists')).toBeInTheDocument();
    });

    const region = screen.getByTestId('generative-region');
    expect(region).toBeInTheDocument();
  });

  it('generative region contains contextual explanation', async () => {
    render(<ChecklistsPage />);

    await waitFor(() => {
      expect(screen.getByTestId('midproject-checklists')).toBeInTheDocument();
    });

    const rationale = screen.getByTestId('selection-rationale');
    expect(rationale.textContent).toBeTruthy();
    expect(rationale.textContent!.length).toBeGreaterThan(10);
    // Should mention checklists and readiness context
    expect(rationale.textContent!.toLowerCase()).toContain('checklist');
  });

  it('generative region appears before active checklists in DOM', async () => {
    render(<ChecklistsPage />);

    await waitFor(() => {
      expect(screen.getByTestId('midproject-checklists')).toBeInTheDocument();
    });

    const container = screen.getByTestId('midproject-checklists');
    const children = Array.from(container.children);
    const generativeIndex = children.findIndex(
      (c) => (c as HTMLElement).getAttribute('data-testid') === 'generative-region',
    );
    const activeIndex = children.findIndex(
      (c) => (c as HTMLElement).getAttribute('data-testid') === 'active-checklists',
    );

    expect(generativeIndex).toBeLessThan(activeIndex);
  });
});

// ---------------------------------------------------------------------------
// Hero gauge in mid-project state
// ---------------------------------------------------------------------------

describe('Mid-Project Checklists — Hero Gauge', () => {
  it('hero gauge shows current score (not 0)', async () => {
    render(<ChecklistsPage />);

    await waitFor(() => {
      expect(screen.getByTestId('midproject-checklists')).toBeInTheDocument();
    });

    const gaugeScore = screen.getByTestId('readiness-gauge-score');
    expect(gaugeScore).toHaveTextContent('45');
  });

  it('hero supporting text reflects mid-project state', async () => {
    render(<ChecklistsPage />);

    await waitFor(() => {
      expect(screen.getByTestId('midproject-checklists')).toBeInTheDocument();
    });

    const text = screen.getByTestId('hero-supporting-text');
    expect(text).toHaveTextContent('45% of plays can run with current artifacts.');
  });
});

// ---------------------------------------------------------------------------
// Error handling
// ---------------------------------------------------------------------------

describe('Mid-Project Checklists — Error Handling', () => {
  it('shows error when midproject endpoint fails', async () => {
    mockFetchImpl.mockImplementation((url: string) => {
      if (url === '/api/checklists/midproject') {
        return Promise.resolve({
          ok: false,
          status: 500,
        });
      }
      return Promise.resolve({ ok: false, status: 404 });
    });

    render(<ChecklistsPage />);

    await waitFor(() => {
      expect(screen.getByTestId('checklists-error')).toBeInTheDocument();
    });
  });
});
