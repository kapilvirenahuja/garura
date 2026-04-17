/**
 * Tests for fix-checklists-completion-ordering feature.
 *
 * Verifies that completed checklists (all steps done via useStepExecution)
 * move to the bottom "Completed" section in real-time, while active/incomplete
 * checklists remain above in impact order.
 *
 * Fulfills: VAL-CHECK-015 (completed checklists at bottom)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import ChecklistsPage from '@/app/checklists/page';

// ---------------------------------------------------------------------------
// Mutable mock state for useStepExecution hook
// ---------------------------------------------------------------------------

let mockCompletedCounts = new Map<string, number>();

vi.mock('@/hooks/use-step-execution', () => ({
  useStepExecution: () => ({
    activeExecutions: new Map(),
    activeExecution: null,
    completedCounts: mockCompletedCounts,
    executeStep: vi.fn(),
    getCompletedCount: (id: string) => mockCompletedCounts.get(id) ?? 0,
    isExecuting: false,
    isChecklistExecuting: () => false,
    getExecution: () => null,
    initCompletedCounts: vi.fn(),
  }),
}));

// ---------------------------------------------------------------------------
// Mock readiness context at mid-project state (score > 0)
// ---------------------------------------------------------------------------

vi.mock('@/components/readiness-provider', () => ({
  useReadiness: () => ({
    score: 45,
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
    refresh: vi.fn(),
  }),
}));

// ---------------------------------------------------------------------------
// Mock fetch — mid-project response with 3 active, 0 completed
// ---------------------------------------------------------------------------

const ACTIVE_CHECKLISTS = [
  {
    checklist: {
      id: 'prepare-epic',
      title: 'Prepare Epic for Implementation',
      description: 'Produce design artifacts.',
      category: 'epic-preparation',
      steps: [
        { id: 'p1', label: 'Lock features', description: 'Lock.', play: 'draft-product-spec' },
        { id: 'p2', label: 'Design', description: 'Design.', play: 'design-exp' },
        { id: 'p3', label: 'Build arch', description: 'Arch.', play: 'build-arch' },
      ],
    },
    status: 'not-started' as const,
    completedSteps: 0,
    totalSteps: 3,
    readinessImpact: 35,
  },
  {
    checklist: {
      id: 'brownfield-onboarding',
      title: 'Brownfield Project Onboarding',
      description: 'Onboard to an existing project.',
      category: 'onboarding',
      steps: [
        { id: 'b1', label: 'Scout', description: 'Scout.', play: 'scout-project' },
        { id: 'b2', label: 'Check drift', description: 'Drift.', play: 'check-drift' },
      ],
    },
    status: 'not-started' as const,
    completedSteps: 0,
    totalSteps: 2,
    readinessImpact: 20,
  },
  {
    checklist: {
      id: 'greenfield-onboarding',
      title: 'Getting Started: Greenfield Onboarding',
      description: 'Onboard a new project.',
      category: 'onboarding',
      steps: [
        { id: 's1', label: 'Step 1', description: 'Desc.', play: 'discover-product' },
        { id: 's2', label: 'Step 2', description: 'Desc.', play: 'specify-product' },
      ],
    },
    status: 'not-started' as const,
    completedSteps: 0,
    totalSteps: 2,
    readinessImpact: 10,
  },
];

let mockFetchImpl: ReturnType<typeof vi.fn>;

beforeEach(() => {
  mockCompletedCounts = new Map();

  mockFetchImpl = vi.fn().mockImplementation((url: string) => {
    if (url === '/api/checklists/midproject') {
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            active: ACTIVE_CHECKLISTS,
            completed: [],
            selectionRationale: '3 checklists are relevant. Ordered by impact on readiness.',
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
// No completions — all checklists are active
// ---------------------------------------------------------------------------

describe('Completion Ordering — No completions', () => {
  it('all checklists display in active section when none completed', async () => {
    render(<ChecklistsPage />);

    await waitFor(() => {
      expect(screen.getByTestId('midproject-checklists')).toBeInTheDocument();
    });

    const activeSection = screen.getByTestId('active-checklists');
    const activeCards = activeSection.querySelectorAll('[data-testid="checklist-card"]');
    expect(activeCards.length).toBe(3);

    // No completed section should exist
    expect(screen.queryByTestId('completed-checklists')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Client-side completion moves checklist to bottom
// ---------------------------------------------------------------------------

describe('Completion Ordering — Client-side completion moves to bottom (VAL-CHECK-015)', () => {
  it('completed checklist moves to bottom section', async () => {
    // Mark brownfield as fully completed (2/2 steps done)
    mockCompletedCounts.set('brownfield-onboarding', 2);

    render(<ChecklistsPage />);

    await waitFor(() => {
      expect(screen.getByTestId('midproject-checklists')).toBeInTheDocument();
    });

    // Active section should have 2 checklists
    const activeSection = screen.getByTestId('active-checklists');
    const activeCards = activeSection.querySelectorAll('[data-testid="checklist-card"]');
    expect(activeCards.length).toBe(2);

    // Brownfield should NOT be in active section
    const activeIds = Array.from(activeCards).map((c) => c.getAttribute('data-checklist-id'));
    expect(activeIds).not.toContain('brownfield-onboarding');

    // Completed section should exist and contain brownfield
    const completedSection = screen.getByTestId('completed-checklists');
    const completedCards = completedSection.querySelectorAll('[data-testid="checklist-card"]');
    expect(completedCards.length).toBe(1);
    expect(completedCards[0]!.getAttribute('data-checklist-id')).toBe('brownfield-onboarding');
  });

  it('completed checklist has muted styling', async () => {
    mockCompletedCounts.set('greenfield-onboarding', 2);

    render(<ChecklistsPage />);

    await waitFor(() => {
      expect(screen.getByTestId('midproject-checklists')).toBeInTheDocument();
    });

    const completedSection = screen.getByTestId('completed-checklists');
    const completedCard = completedSection.querySelector('[data-testid="checklist-card"]');
    expect(completedCard).toBeTruthy();
    expect(completedCard!.className).toContain('opacity-60');
  });

  it('completed checklist has status "completed"', async () => {
    mockCompletedCounts.set('brownfield-onboarding', 2);

    render(<ChecklistsPage />);

    await waitFor(() => {
      expect(screen.getByTestId('midproject-checklists')).toBeInTheDocument();
    });

    const completedSection = screen.getByTestId('completed-checklists');
    const completedCard = completedSection.querySelector('[data-testid="checklist-card"]');
    expect(completedCard).toBeTruthy();
    expect(completedCard!.getAttribute('data-status')).toBe('completed');
  });

  it('active checklists appear above completed section in DOM', async () => {
    mockCompletedCounts.set('greenfield-onboarding', 2);

    render(<ChecklistsPage />);

    await waitFor(() => {
      expect(screen.getByTestId('midproject-checklists')).toBeInTheDocument();
    });

    const container = screen.getByTestId('midproject-checklists');
    const children = Array.from(container.children);
    const activeIndex = children.findIndex(
      (c) => (c as HTMLElement).getAttribute('data-testid') === 'active-checklists',
    );
    const completedIndex = children.findIndex(
      (c) => (c as HTMLElement).getAttribute('data-testid') === 'completed-checklists',
    );

    expect(activeIndex).toBeGreaterThanOrEqual(0);
    expect(completedIndex).toBeGreaterThan(activeIndex);
  });
});

// ---------------------------------------------------------------------------
// Multiple completions
// ---------------------------------------------------------------------------

describe('Completion Ordering — Multiple completed checklists', () => {
  it('all completed checklists move to bottom section', async () => {
    // Mark two checklists as completed
    mockCompletedCounts.set('brownfield-onboarding', 2);
    mockCompletedCounts.set('greenfield-onboarding', 2);

    render(<ChecklistsPage />);

    await waitFor(() => {
      expect(screen.getByTestId('midproject-checklists')).toBeInTheDocument();
    });

    // Active section should have 1 checklist (prepare-epic)
    const activeSection = screen.getByTestId('active-checklists');
    const activeCards = activeSection.querySelectorAll('[data-testid="checklist-card"]');
    expect(activeCards.length).toBe(1);
    expect(activeCards[0]!.getAttribute('data-checklist-id')).toBe('prepare-epic');

    // Completed section should have 2 checklists
    const completedSection = screen.getByTestId('completed-checklists');
    const completedCards = completedSection.querySelectorAll('[data-testid="checklist-card"]');
    expect(completedCards.length).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// Impact ordering preserved among active checklists
// ---------------------------------------------------------------------------

describe('Completion Ordering — Active checklists remain impact-ordered', () => {
  it('active checklists sorted by readinessImpact descending', async () => {
    // Only greenfield is completed → prepare-epic (35) and brownfield (20) remain active
    mockCompletedCounts.set('greenfield-onboarding', 2);

    render(<ChecklistsPage />);

    await waitFor(() => {
      expect(screen.getByTestId('midproject-checklists')).toBeInTheDocument();
    });

    const activeSection = screen.getByTestId('active-checklists');
    const activeCards = activeSection.querySelectorAll('[data-testid="checklist-card"]');
    expect(activeCards.length).toBe(2);

    // prepare-epic (impact 35) should come before brownfield (impact 20)
    expect(activeCards[0]!.getAttribute('data-checklist-id')).toBe('prepare-epic');
    expect(activeCards[1]!.getAttribute('data-checklist-id')).toBe('brownfield-onboarding');
  });
});

// ---------------------------------------------------------------------------
// Partial completion does NOT move to bottom
// ---------------------------------------------------------------------------

describe('Completion Ordering — Partial completion', () => {
  it('partially completed checklist stays in active section', async () => {
    // prepare-epic has 3 steps, only 2 completed
    mockCompletedCounts.set('prepare-epic', 2);

    render(<ChecklistsPage />);

    await waitFor(() => {
      expect(screen.getByTestId('midproject-checklists')).toBeInTheDocument();
    });

    const activeSection = screen.getByTestId('active-checklists');
    const activeCards = activeSection.querySelectorAll('[data-testid="checklist-card"]');

    // All 3 should still be active
    expect(activeCards.length).toBe(3);
    expect(screen.queryByTestId('completed-checklists')).toBeNull();
  });

  it('partially completed checklist shows in-progress status', async () => {
    mockCompletedCounts.set('prepare-epic', 1);

    render(<ChecklistsPage />);

    await waitFor(() => {
      expect(screen.getByTestId('midproject-checklists')).toBeInTheDocument();
    });

    const activeSection = screen.getByTestId('active-checklists');
    const prepareCard = activeSection.querySelector('[data-checklist-id="prepare-epic"]');
    expect(prepareCard).toBeTruthy();
    expect(prepareCard!.getAttribute('data-status')).toBe('in-progress');
  });
});

// ---------------------------------------------------------------------------
// Server-side completed checklists also honored
// ---------------------------------------------------------------------------

describe('Completion Ordering — Server-side completed checklists', () => {
  it('server-side completed checklists display in completed section', async () => {
    // Override fetch to return one checklist in completed array
    mockFetchImpl.mockImplementation((url: string) => {
      if (url === '/api/checklists/midproject') {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              active: [ACTIVE_CHECKLISTS[0], ACTIVE_CHECKLISTS[1]],
              completed: [
                {
                  ...ACTIVE_CHECKLISTS[2],
                  status: 'completed',
                  completedSteps: 2,
                },
              ],
              selectionRationale: '2 checklists relevant.',
            }),
        });
      }
      return Promise.resolve({ ok: false, status: 404 });
    });

    render(<ChecklistsPage />);

    await waitFor(() => {
      expect(screen.getByTestId('midproject-checklists')).toBeInTheDocument();
    });

    // Active should have 2
    const activeSection = screen.getByTestId('active-checklists');
    const activeCards = activeSection.querySelectorAll('[data-testid="checklist-card"]');
    expect(activeCards.length).toBe(2);

    // Completed should have the server-side completed one
    const completedSection = screen.getByTestId('completed-checklists');
    const completedCards = completedSection.querySelectorAll('[data-testid="checklist-card"]');
    expect(completedCards.length).toBe(1);
    expect(completedCards[0]!.getAttribute('data-checklist-id')).toBe('greenfield-onboarding');
  });
});
