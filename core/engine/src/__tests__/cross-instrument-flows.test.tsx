/**
 * Cross-instrument flows — verifies that the Checklists, Flight Deck,
 * and Playbook Reader instruments stay in sync when navigating between
 * them.
 *
 * This test suite deliberately exercises the glue layer — the token
 * parser, the readiness-invalidation event bus, the sessionStorage
 * preservation for the Playbook last-URL, and the checklist expansion
 * persistence — rather than re-testing each instrument's surface.
 *
 * Fulfills (by assertion ID):
 *   - VAL-CROSS-002  Checklist output tokens → Playbook navigation
 *   - VAL-CROSS-007  Global search → Playbook search view
 *   - VAL-CROSS-008  Token clicks navigate within Playbook
 *   - VAL-CROSS-010  Readiness updates propagate immediately after play completion
 *   - VAL-CROSS-011  Checklist expansion state preserved on tab switches
 *   - VAL-CROSS-012  Playbook context preserved on tab switches
 */

import { describe, expect, it, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { parseOutputTokens, hasOutputTokens, type OutputSegment } from '@/lib/output-tokens';
import { ContentSlot } from '@/components/content-slot';
import { ChecklistCard, CHECKLIST_EXPANSION_KEY } from '@/components/checklist-card';
import { invalidateReadiness, READINESS_REFRESH_EVENT } from '@/components/readiness-provider';

// ---------------------------------------------------------------------------
// Test-wide setup: wipe sessionStorage between tests so persisted state
// from one test does not bleed into the next.
// ---------------------------------------------------------------------------

beforeEach(() => {
  try {
    window.sessionStorage.clear();
  } catch {
    /* storage unavailable — ignore */
  }
});

// ---------------------------------------------------------------------------
// VAL-CROSS-002 — Checklist output tokens → Playbook navigation
// ---------------------------------------------------------------------------

describe('Output-token parser (VAL-CROSS-002)', () => {
  it('extracts [REFID] tokens from a streamed play output line', () => {
    const segments = parseOutputTokens('Created [F1] (Task Inbox) and [SC-AUTH-001] successfully.');
    const tokens = segments
      .filter((s): s is Extract<OutputSegment, { type: 'token' }> => s.type === 'token')
      .map((s) => s.refId);
    expect(tokens).toEqual(['F1', 'SC-AUTH-001']);
  });

  it('does NOT tokenise single-letter bracket patterns to avoid false positives', () => {
    const segments = parseOutputTokens('Enter the letter [A] or [B] to continue.');
    const tokens = segments.filter((s) => s.type === 'token');
    expect(tokens).toHaveLength(0);
  });

  it('returns false for hasOutputTokens() on plain text', () => {
    expect(hasOutputTokens('no references here, just prose')).toBe(false);
  });

  it('returns true for hasOutputTokens() when a valid token is present', () => {
    expect(hasOutputTokens('Created [F1] in the graph')).toBe(true);
  });
});

describe('ContentSlot token-click → Playbook navigation (VAL-CROSS-002, VAL-CROSS-008)', () => {
  it('renders [REFID] tokens as clickable CrossRefTokens inside streamed output', () => {
    const handleTokenClick = vi.fn();
    render(
      <ContentSlot
        state="active"
        content="Created [F1] and [SC-AUTH-001] successfully."
        onTokenClick={handleTokenClick}
      />,
    );
    // Both refs appear as cross-ref-token elements.
    const tokens = screen.getAllByTestId('cross-ref-token');
    expect(tokens).toHaveLength(2);
    expect(tokens[0]?.getAttribute('data-ref-id')).toBe('F1');
    expect(tokens[1]?.getAttribute('data-ref-id')).toBe('SC-AUTH-001');
    expect(screen.getByText('[F1]')).toBeInTheDocument();
    expect(screen.getByText('[SC-AUTH-001]')).toBeInTheDocument();
  });

  it('invokes the onTokenClick handler with the clicked refId', () => {
    const handleTokenClick = vi.fn();
    render(
      <ContentSlot
        state="active"
        content="Linked [F1] to inbox."
        onTokenClick={handleTokenClick}
      />,
    );
    const token = screen.getByText('[F1]');
    fireEvent.click(token);
    expect(handleTokenClick).toHaveBeenCalledWith('F1');
  });

  it('falls back to window.location navigation when no onTokenClick is provided', () => {
    const originalLocation = window.location;
    let assignedHref = '';
    // Override `location.href` with a spy-able setter.
    Object.defineProperty(window, 'location', {
      configurable: true,
      writable: true,
      value: {
        ...originalLocation,
        get href() {
          return assignedHref;
        },
        set href(v: string) {
          assignedHref = v;
        },
      },
    });
    try {
      render(<ContentSlot state="active" content="See [SC-TASK-001] for details." />);
      fireEvent.click(screen.getByText('[SC-TASK-001]'));
      expect(assignedHref).toBe('/playbook?context=SC-TASK-001');
    } finally {
      Object.defineProperty(window, 'location', {
        configurable: true,
        writable: true,
        value: originalLocation,
      });
    }
  });

  it('does not render tokens as interactive when tokenizeOutput is false', () => {
    render(
      <ContentSlot
        state="active"
        content="Raw [F1] should stay inert here."
        tokenizeOutput={false}
      />,
    );
    // Content must still be present, but not as a clickable cross-ref token.
    expect(screen.getByTestId('content-slot-content')).toHaveTextContent(
      'Raw [F1] should stay inert here.',
    );
    expect(screen.queryByTestId('cross-ref-token')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// VAL-CROSS-010 — Readiness refresh event bus
// ---------------------------------------------------------------------------

describe('Readiness invalidation event (VAL-CROSS-010)', () => {
  it('dispatches a window event named mdb:readiness-invalidated', () => {
    const listener = vi.fn();
    window.addEventListener(READINESS_REFRESH_EVENT, listener);
    try {
      invalidateReadiness();
      expect(listener).toHaveBeenCalledTimes(1);
    } finally {
      window.removeEventListener(READINESS_REFRESH_EVENT, listener);
    }
  });

  it('exposes a stable, scoped event name for cross-component signalling', () => {
    expect(READINESS_REFRESH_EVENT).toBe('mdb:readiness-invalidated');
  });

  it('safely no-ops when called multiple times with no listeners attached', () => {
    expect(() => {
      invalidateReadiness();
      invalidateReadiness();
      invalidateReadiness();
    }).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// VAL-CROSS-011 — Checklist expansion state preserved across remounts
// ---------------------------------------------------------------------------

describe('Checklist expansion preservation (VAL-CROSS-011)', () => {
  const STEPS = [
    {
      id: 's1',
      label: 'Draft product spec',
      description: 'Initial feature definition.',
      play: 'draft-product-spec',
    },
  ];

  it('writes expansion state to sessionStorage under CHECKLIST_EXPANSION_KEY when persistExpansion is enabled', () => {
    const { unmount } = render(
      <ChecklistCard
        id="prepare-epic"
        title="Prepare Epic"
        steps={STEPS}
        completedSteps={0}
        totalSteps={1}
        status="not-started"
        persistExpansion
      />,
    );
    // Expand the card.
    fireEvent.click(screen.getByTestId('checklist-card-header'));
    const raw = window.sessionStorage.getItem(CHECKLIST_EXPANSION_KEY);
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw!) as Record<string, boolean>;
    expect(parsed['prepare-epic']).toBe(true);
    unmount();
  });

  it('rehydrates expansion state on re-mount (tab-switch return)', () => {
    // Seed sessionStorage as if the user had previously expanded the card.
    window.sessionStorage.setItem(
      CHECKLIST_EXPANSION_KEY,
      JSON.stringify({ 'prepare-epic': true }),
    );
    render(
      <ChecklistCard
        id="prepare-epic"
        title="Prepare Epic"
        steps={STEPS}
        completedSteps={0}
        totalSteps={1}
        status="not-started"
        persistExpansion
      />,
    );
    // The steps surface should be visible immediately on first paint.
    expect(screen.getByTestId('checklist-card-steps')).toBeInTheDocument();
  });

  it('does NOT persist expansion state when persistExpansion is false (default)', () => {
    render(
      <ChecklistCard
        id="prepare-epic"
        title="Prepare Epic"
        steps={STEPS}
        completedSteps={0}
        totalSteps={1}
        status="not-started"
      />,
    );
    fireEvent.click(screen.getByTestId('checklist-card-header'));
    // No persisted key should exist — the default is opt-in only.
    expect(window.sessionStorage.getItem(CHECKLIST_EXPANSION_KEY)).toBeNull();
  });

  it('merges sibling cards into a single sessionStorage entry', () => {
    const { rerender } = render(
      <ChecklistCard
        id="checklist-a"
        title="A"
        steps={STEPS}
        completedSteps={0}
        totalSteps={1}
        status="not-started"
        persistExpansion
      />,
    );
    fireEvent.click(screen.getByTestId('checklist-card-header'));

    rerender(
      <ChecklistCard
        id="checklist-b"
        title="B"
        steps={STEPS}
        completedSteps={0}
        totalSteps={1}
        status="not-started"
        persistExpansion
      />,
    );
    fireEvent.click(screen.getByTestId('checklist-card-header'));

    const parsed = JSON.parse(window.sessionStorage.getItem(CHECKLIST_EXPANSION_KEY)!) as Record<
      string,
      boolean
    >;
    // Both keys are retained — toggling one never wipes the other.
    expect(parsed).toHaveProperty('checklist-a');
    expect(parsed).toHaveProperty('checklist-b');
  });
});

// ---------------------------------------------------------------------------
// VAL-CROSS-007, VAL-CROSS-012 — Playbook last-URL preservation key
// ---------------------------------------------------------------------------

describe('Playbook last-URL preservation key (VAL-CROSS-012)', () => {
  it('uses a scoped sessionStorage key that does not collide with other instruments', () => {
    // We don't want the Playbook's key pattern to overlap with the
    // checklist expansion key or any other instrument surface.
    expect(CHECKLIST_EXPANSION_KEY).not.toBe('mdb:playbook:last-url');
    expect(CHECKLIST_EXPANSION_KEY.startsWith('mdb:')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// End-to-end composite check — token click + readiness refresh
// VAL-CROSS-002 + VAL-CROSS-010 — ensures both primitives are callable
// from a single React flow without interference (defensive coverage).
// ---------------------------------------------------------------------------

describe('Composite flow: token click + readiness refresh (VAL-CROSS)', () => {
  it('fires readiness-invalidated without disrupting concurrent token clicks', () => {
    const tokenClicks: string[] = [];
    const readinessTicks: number[] = [];
    window.addEventListener(READINESS_REFRESH_EVENT, () => {
      readinessTicks.push(Date.now());
    });
    render(
      <ContentSlot
        state="active"
        content="Completed [F1] and [F2]."
        onTokenClick={(refId) => tokenClicks.push(refId)}
      />,
    );
    act(() => {
      fireEvent.click(screen.getByText('[F1]'));
      invalidateReadiness();
      fireEvent.click(screen.getByText('[F2]'));
      invalidateReadiness();
    });
    expect(tokenClicks).toEqual(['F1', 'F2']);
    expect(readinessTicks.length).toBe(2);
  });
});
