/**
 * Playbook Reader entry-point tests — mdb-playbook-entry-points.
 *
 * Covers:
 *   VAL-PLAY-008   Entry from Checklists (epic reference click)
 *   VAL-PLAY-010   Entry from Search results
 *   VAL-PLAY-011   Entry via direct URL (/playbook?context=E1)
 *   VAL-PLAY-021   Breadcrumb updates on Playbook navigation
 *   VAL-PLAY-022   Breadcrumb segment navigation (clickable parent)
 *   VAL-PLAY-028   Empty Playbook state
 *   VAL-PLAY-030   Instrument switcher active state for Playbook
 *   VAL-CROSS-001  Checklist epic link opens Playbook
 *   VAL-CROSS-007  Global search from any instrument lands in Playbook
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent, cleanup, within } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

import { EpicRefLink } from '@/components/epic-ref-link';
import { ChecklistCard } from '@/components/checklist-card';
import { Breadcrumb, deriveBreadcrumbs, type BreadcrumbSegment } from '@/components/breadcrumb';
import { BreadcrumbExtrasProvider, useBreadcrumbExtras } from '@/components/breadcrumb-context';
import { TopBar } from '@/components/top-bar';
import { InstrumentSwitcher } from '@/components/instrument-switcher';
import PlaybookPage from '@/app/playbook/page';
import { AppShell } from '@/components/app-shell';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const pushMock = vi.fn();
const mockPathname = vi.fn<() => string>().mockReturnValue('/playbook');

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => mockPathname(),
  // In tests we drive URL changes via window.history.replaceState(), so
  // the mock simply reads from window.location.search each call.
  useSearchParams: () =>
    new URLSearchParams(typeof window !== 'undefined' ? window.location.search : ''),
}));

beforeEach(() => {
  vi.clearAllMocks();
  mockPathname.mockReturnValue('/playbook');
  // Reset URL so Playbook reads a clean context/query each test.
  window.history.replaceState({}, '', '/playbook');
});

afterEach(() => {
  cleanup();
});

// Reusable mock for the generative search API. Produces a response the
// SearchResultsView can render, including two CrossRefToken chunks in
// the first card so tests can click them to verify navigation wiring.
function mockSearchFetch(query: string) {
  const payload = {
    query,
    hitCount: 2,
    composedAt: '2026-04-17T00:00:00.000Z',
    epics: [{ id: 'EPIC-E1', shortId: 'E1', name: 'Core Task Management' }],
    results: [
      {
        id: 'feature:F1',
        title: 'Task Inbox',
        kind: 'feature',
        relevance: 9.42,
        primaryRefId: 'F1',
        chunks: [
          { type: 'text', text: `Your search for "${query}" surfaces feature ` },
          { type: 'token', token: { refId: 'F1', dangling: false } },
          { type: 'text', text: ' — see scenario ' },
          { type: 'token', token: { refId: 'SC-TASK-001', dangling: false } },
          { type: 'text', text: '.' },
        ],
        sources: [
          {
            entityId: 'F1',
            sourceType: 'features',
            sourceFile: '/tmp/features.yaml',
            score: 5,
            title: 'Task Inbox',
          },
        ],
        epics: [{ id: 'EPIC-E1', shortId: 'E1', name: 'Core Task Management' }],
      },
    ],
  };
  globalThis.fetch = vi.fn(() =>
    Promise.resolve(
      new Response(JSON.stringify(payload), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    ),
  ) as unknown as typeof fetch;
}

// Reusable mock narrative payload. Uses a fresh Response per call so
// multiple fetch invocations (e.g. React effects firing twice in
// development mode) don't trip the "body already read" error.
function mockNarrativeFetch(epicName = 'Authentication') {
  const narrative = {
    epicId: 'EPIC-E1',
    epicName,
    status: 'in-progress',
    featureCount: 2,
    density: 'low' as const,
    sections: [
      {
        id: 'overview',
        heading: 'Overview',
        level: 2 as const,
        chunks: [{ type: 'text' as const, text: 'Epic overview.' }],
      },
    ],
    actions: [],
    contentHash: 'hash-1',
    composedAt: '2026-04-17T00:00:00.000Z',
    composerMode: 'deterministic' as const,
  };
  globalThis.fetch = vi.fn(() =>
    Promise.resolve(
      new Response(JSON.stringify({ narrative, fromCache: false }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    ),
  ) as unknown as typeof fetch;
}

// ---------------------------------------------------------------------------
// EpicRefLink — the primitive used by Checklists/other surfaces
// ---------------------------------------------------------------------------

describe('EpicRefLink (VAL-CROSS-001, VAL-PLAY-008)', () => {
  it('renders the epic id as label when no explicit label is provided', () => {
    render(<EpicRefLink epicId="E1" />);
    const link = screen.getByTestId('epic-ref-link');
    expect(link).toHaveAttribute('data-epic-id', 'E1');
    expect(link).toHaveTextContent('E1');
  });

  it('renders the provided label when given', () => {
    render(<EpicRefLink epicId="E1" label="E1: Authentication" />);
    expect(screen.getByTestId('epic-ref-link')).toHaveTextContent('E1: Authentication');
  });

  it('links to /playbook?context=<epicId>', () => {
    render(<EpicRefLink epicId="E1" />);
    expect(screen.getByTestId('epic-ref-link')).toHaveAttribute('href', '/playbook?context=E1');
  });

  it('URL-encodes epic ids with special characters', () => {
    render(<EpicRefLink epicId="EPIC-E1/sub" />);
    expect(screen.getByTestId('epic-ref-link')).toHaveAttribute(
      'href',
      '/playbook?context=EPIC-E1%2Fsub',
    );
  });
});

// ---------------------------------------------------------------------------
// ChecklistCard → EpicRefLink wiring (VAL-CROSS-001)
// ---------------------------------------------------------------------------

const DEMO_STEPS = [
  {
    id: 'step-1',
    label: 'First step',
    description: 'Do something first.',
    play: 'draft-product-spec',
  },
  {
    id: 'step-2',
    label: 'Second step',
    description: 'Then do something else.',
    play: 'design-exp',
  },
];

describe('ChecklistCard — relatedEpic chip (VAL-CROSS-001)', () => {
  it('does NOT render the related-epic chip when relatedEpic is absent', () => {
    render(
      <ChecklistCard
        id="checklist-1"
        title="Prepare epic"
        steps={DEMO_STEPS}
        completedSteps={0}
        totalSteps={DEMO_STEPS.length}
        status="in-progress"
      />,
    );
    expect(screen.queryByTestId('checklist-related-epic')).not.toBeInTheDocument();
  });

  it('renders a clickable chip linking to /playbook?context=<id> when relatedEpic is set', () => {
    render(
      <ChecklistCard
        id="checklist-1"
        title="Prepare epic"
        steps={DEMO_STEPS}
        completedSteps={0}
        totalSteps={DEMO_STEPS.length}
        status="in-progress"
        relatedEpic={{ id: 'E1', label: 'E1: Authentication' }}
      />,
    );
    const chip = screen.getByTestId('checklist-related-epic-link');
    expect(chip).toHaveAttribute('href', '/playbook?context=E1');
    expect(chip).toHaveTextContent('E1: Authentication');
  });

  it('falls back to the epic id when no label is provided', () => {
    render(
      <ChecklistCard
        id="checklist-1"
        title="Prepare epic"
        steps={DEMO_STEPS}
        completedSteps={0}
        totalSteps={DEMO_STEPS.length}
        status="in-progress"
        relatedEpic={{ id: 'E2' }}
      />,
    );
    const chip = screen.getByTestId('checklist-related-epic-link');
    expect(chip).toHaveAttribute('href', '/playbook?context=E2');
    expect(chip).toHaveTextContent('E2');
  });
});

// ---------------------------------------------------------------------------
// Breadcrumb — derivation with extras (VAL-PLAY-021, VAL-PLAY-022)
// ---------------------------------------------------------------------------

describe('deriveBreadcrumbs — extras handling (VAL-PLAY-021, VAL-PLAY-022)', () => {
  it('returns Home › Playbook when no extras are provided', () => {
    const segments = deriveBreadcrumbs('/playbook');
    expect(segments).toHaveLength(2);
    expect(segments[0]).toMatchObject({ label: 'Home', href: '/checklists' });
    expect(segments[1]).toMatchObject({ label: 'Playbook' });
    expect(segments[1]?.href).toBeUndefined();
  });

  it('appends an extras segment after Playbook when provided (VAL-PLAY-022)', () => {
    const extras: BreadcrumbSegment[] = [
      { label: 'E1: Authentication', href: '/playbook?context=E1' },
    ];
    const segments = deriveBreadcrumbs('/playbook', extras);
    expect(segments).toHaveLength(3);
    expect(segments[0]).toMatchObject({ label: 'Home', href: '/checklists' });
    // Playbook is now a clickable parent segment.
    expect(segments[1]).toMatchObject({ label: 'Playbook', href: '/playbook' });
    // Current (last) context segment keeps its href so it is clickable
    // per VAL-PLAY-022 — the Breadcrumb component applies
    // aria-current="page" at render time to preserve a11y semantics.
    expect(segments[2]?.label).toBe('E1: Authentication');
    expect(segments[2]?.href).toBe('/playbook?context=E1');
  });

  it('supports multiple extra segments (deep Playbook contexts, VAL-PLAY-022)', () => {
    const extras: BreadcrumbSegment[] = [
      { label: 'E1: Authentication', href: '/playbook?context=E1' },
      { label: 'SC-AUTH-016', href: '/playbook?context=SC-AUTH-016' },
    ];
    const segments = deriveBreadcrumbs('/playbook', extras);
    expect(segments.map((s) => s.label)).toEqual([
      'Home',
      'Playbook',
      'E1: Authentication',
      'SC-AUTH-016',
    ]);
    // Every segment — including the trailing context segment — keeps its
    // href so it remains clickable (VAL-PLAY-022).
    expect(segments[0]?.href).toBe('/checklists');
    expect(segments[1]?.href).toBe('/playbook');
    expect(segments[2]?.href).toBe('/playbook?context=E1');
    expect(segments[3]?.href).toBe('/playbook?context=SC-AUTH-016');
  });

  it('does not mutate the extras array passed in', () => {
    const extras: BreadcrumbSegment[] = [
      { label: 'E1: Authentication', href: '/playbook?context=E1' },
    ];
    const frozenHref = extras[0]?.href;
    deriveBreadcrumbs('/playbook', extras);
    expect(extras[0]?.href).toBe(frozenHref);
  });
});

describe('Breadcrumb — renders extras from context (VAL-PLAY-021)', () => {
  // Small harness that wraps <Breadcrumb /> in an extras provider and
  // offers a button to inject extras mid-test.
  function ExtrasHarness({ initialExtras }: { initialExtras: BreadcrumbSegment[] }) {
    return (
      <BreadcrumbExtrasProvider>
        <InjectExtras extras={initialExtras} />
        <Breadcrumb />
      </BreadcrumbExtrasProvider>
    );
  }

  function InjectExtras({ extras }: { extras: BreadcrumbSegment[] }) {
    const { setExtras } = useBreadcrumbExtras();
    React.useEffect(() => setExtras(extras), [extras, setExtras]);
    return null;
  }

  it('shows the epic segment when extras are pushed', async () => {
    mockPathname.mockReturnValue('/playbook');
    render(
      <ExtrasHarness
        initialExtras={[{ label: 'E1: Authentication', href: '/playbook?context=E1' }]}
      />,
    );
    const breadcrumb = screen.getByTestId('breadcrumb');
    await waitFor(() => {
      expect(within(breadcrumb).getByText('E1: Authentication')).toBeInTheDocument();
    });
    // Playbook becomes a clickable link within the breadcrumb.
    expect(within(breadcrumb).getByText('Playbook').closest('a')).toHaveAttribute(
      'href',
      '/playbook',
    );
    // The deepest segment is current-page.
    expect(within(breadcrumb).getByText('E1: Authentication')).toHaveAttribute(
      'aria-current',
      'page',
    );
  });
});

// ---------------------------------------------------------------------------
// TopBar — global search wiring (VAL-CROSS-007)
// ---------------------------------------------------------------------------

describe('TopBar — search submit navigates to Playbook (VAL-CROSS-007)', () => {
  it('pushes /playbook?query=<encoded> on Enter', () => {
    render(<TopBar />);
    const input = screen.getByTestId('search-bar-input');
    fireEvent.change(input, { target: { value: 'authentication timeout' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(pushMock).toHaveBeenCalledWith('/playbook?query=authentication%20timeout');
  });

  it('does nothing when the query is whitespace-only', () => {
    render(<TopBar />);
    const input = screen.getByTestId('search-bar-input');
    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(pushMock).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// PlaybookPage — empty state, direct URL, search mode (VAL-PLAY-011,
// VAL-PLAY-028, VAL-PLAY-010)
// ---------------------------------------------------------------------------

describe('PlaybookPage — entry modes', () => {
  it('shows the Nothing to read yet empty state when no params are present (VAL-PLAY-028)', () => {
    window.history.replaceState({}, '', '/playbook');
    render(<PlaybookPage />);
    expect(screen.getByTestId('playbook-empty-state')).toBeInTheDocument();
    expect(screen.getByTestId('playbook-empty-state-heading')).toHaveTextContent(
      /Nothing to read yet/i,
    );
    // Empty state guidance links to Checklists for onboarding.
    expect(screen.getByTestId('playbook-empty-state-checklists-link')).toHaveAttribute(
      'href',
      '/checklists',
    );
    // Sample foundation narrative is also visible (VAL-FOUND-077 preserved).
    expect(screen.getByTestId('playbook-narrative')).toBeInTheDocument();
  });

  it('renders the NarrativeView when ?context=E1 is present (VAL-PLAY-011)', async () => {
    mockNarrativeFetch('Authentication');
    window.history.replaceState({}, '', '/playbook?context=E1');
    render(<PlaybookPage />);
    await waitFor(() => {
      expect(screen.getByTestId('playbook-view')).toHaveAttribute('data-mode', 'narrative');
    });
    // Wait for fetch to resolve and narrative to render.
    await screen.findByTestId('narrative-root');
    expect(screen.getByTestId('narrative-title')).toHaveTextContent('Authentication');
  });

  it('renders the search view when ?query=... is present (VAL-PLAY-010, VAL-CROSS-007)', async () => {
    mockSearchFetch('authentication');
    window.history.replaceState({}, '', '/playbook?query=authentication');
    render(<PlaybookPage />);
    await waitFor(() => {
      expect(screen.getByTestId('playbook-view')).toHaveAttribute('data-mode', 'search');
    });
    expect(screen.getByTestId('playbook-search-heading')).toHaveTextContent(/authentication/);
    // Search-mode view exposes a link back to the Playbook root so
    // users can return to the empty state (VAL-PLAY-022).
    expect(screen.getByTestId('playbook-search-root-link')).toHaveAttribute('href', '/playbook');
  });

  it(
    'renders clickable SearchResultsView in search mode and clicking a ' +
      'CrossRefToken navigates to /playbook?context=<refId> ' +
      '(VAL-PLAY-010, VAL-PLAY-019, fix-playbook-search-mode)',
    async () => {
      mockSearchFetch('timeout');
      window.history.replaceState({}, '', '/playbook?query=timeout');
      render(<PlaybookPage />);

      // Search mode activates immediately …
      await waitFor(() => {
        expect(screen.getByTestId('playbook-view')).toHaveAttribute('data-mode', 'search');
      });

      // … and the generative SearchResultsView renders below the legacy
      // wrapper — this is the wiring the feature "fix-playbook-search-mode"
      // is guarding against regressing back to a stub.
      const resultsView = await screen.findByTestId('search-results-view');
      const firstCard = within(resultsView).getAllByTestId('search-result-card')[0]!;
      expect(firstCard).toHaveAttribute('data-result-id', 'feature:F1');

      // CrossRefTokens inside the result prose are rendered as real
      // interactive buttons — not inert text — so clicking the [F1]
      // token navigates to the playbook narrative context for F1.
      const tokens = within(firstCard).getAllByTestId('cross-ref-token');
      expect(tokens[0]).toHaveAttribute('data-ref-id', 'F1');
      fireEvent.click(tokens[0]!);
      expect(pushMock).toHaveBeenCalledWith('/playbook?context=F1');

      // The second token drills into a scenario context, exercising the
      // same wiring for non-feature refIds.
      expect(tokens[1]).toHaveAttribute('data-ref-id', 'SC-TASK-001');
      fireEvent.click(tokens[1]!);
      expect(pushMock).toHaveBeenCalledWith('/playbook?context=SC-TASK-001');
    },
  );
});

// ---------------------------------------------------------------------------
// Breadcrumb extras pushed by PlaybookPage (integration via AppShell).
// ---------------------------------------------------------------------------

describe('Playbook breadcrumb integration (VAL-PLAY-021)', () => {
  it('adds an E1 breadcrumb segment when ?context=E1 is present', async () => {
    mockNarrativeFetch('Authentication');
    window.history.replaceState({}, '', '/playbook?context=E1');

    render(
      <AppShell>
        <PlaybookPage />
      </AppShell>,
    );

    // Narrative loads → breadcrumb receives the epicName via onMetaLoaded.
    await screen.findByTestId('narrative-root');
    const breadcrumb = screen.getByTestId('breadcrumb');
    await waitFor(() => {
      expect(within(breadcrumb).getByText('E1: Authentication')).toBeInTheDocument();
    });
    expect(within(breadcrumb).getByText('E1: Authentication')).toHaveAttribute(
      'aria-current',
      'page',
    );
    // Playbook segment above it is clickable (VAL-PLAY-022).
    expect(within(breadcrumb).getByText('Playbook').closest('a')).toHaveAttribute(
      'href',
      '/playbook',
    );
  });

  it('adds a search breadcrumb segment when ?query=... is present', async () => {
    window.history.replaceState({}, '', '/playbook?query=timeout');

    render(
      <AppShell>
        <PlaybookPage />
      </AppShell>,
    );

    const breadcrumb = screen.getByTestId('breadcrumb');
    await waitFor(() => {
      expect(within(breadcrumb).getByText('Search: "timeout"')).toBeInTheDocument();
    });
    expect(within(breadcrumb).getByText('Search: "timeout"')).toHaveAttribute(
      'aria-current',
      'page',
    );
  });
});

// ---------------------------------------------------------------------------
// Instrument switcher — active state on Playbook (VAL-PLAY-030)
// ---------------------------------------------------------------------------

describe('InstrumentSwitcher — active state when on Playbook (VAL-PLAY-030)', () => {
  it('marks the Playbook tab as selected on /playbook', () => {
    mockPathname.mockReturnValue('/playbook');
    render(<InstrumentSwitcher />);
    expect(screen.getByTestId('tab-playbook')).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByTestId('tab-flight-deck')).toHaveAttribute('aria-selected', 'false');
    expect(screen.getByTestId('tab-checklists')).toHaveAttribute('aria-selected', 'false');
  });

  it('also marks Playbook as selected on deeper playbook contexts', () => {
    mockPathname.mockReturnValue('/playbook/e1-auth');
    render(<InstrumentSwitcher />);
    expect(screen.getByTestId('tab-playbook')).toHaveAttribute('aria-selected', 'true');
  });
});
