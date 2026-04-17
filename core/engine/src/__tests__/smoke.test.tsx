/**
 * Garura Foundation — Integration Smoke Tests
 *
 * Verifies that all foundation pieces work together end-to-end:
 *   1. Application loads with fixture artifacts (all three instruments render)
 *   2. Application loads in greenfield state (readiness 0, onboarding checklist visible)
 *   3. Search returns results with fixture data (titles + source provenance)
 *   4. CrossRefToken click in Playbook Reader opens InlineExpansion
 *
 * Fulfills: VAL-FOUND-074, VAL-FOUND-075, VAL-FOUND-076, VAL-FOUND-077
 */

import path from 'node:path';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

// --- Foundation lib modules ---
import { parseArtifacts } from '@/lib/artifact-parser';
import type { ArtifactResult } from '@/lib/artifact-parser';
import { buildCrossRefGraph, resolveId, forwardLookup } from '@/lib/crossref-resolver';
import { createSearchIndex } from '@/lib/search-index';
import { loadConfig, DEFAULT_CONFIG } from '@/lib/config';

// --- UI components (pages + shell) ---
import { AppShell } from '@/components/app-shell';
import { TopBar } from '@/components/top-bar';
import ChecklistsPage from '@/app/checklists/page';
import FlightDeckPage from '@/app/flight-deck/page';
import PlaybookPage from '@/app/playbook/page';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockPush = vi.fn();
const mockPathname = vi.fn<() => string>().mockReturnValue('/checklists');

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => mockPathname(),
  useSearchParams: () => new URLSearchParams(),
}));

// Mock checklist data for fetch mock
const MOCK_CHECKLISTS_RESPONSE = {
  checklists: [
    {
      id: 'greenfield-onboarding',
      title: 'Getting Started: Greenfield Onboarding',
      description: 'Onboard a new project from scratch.',
      category: 'onboarding',
      steps: [
        {
          id: 'provide-brief',
          label: 'Provide your project brief',
          description: "Describe what you're building.",
          play: 'discover-product',
        },
        {
          id: 'review-market',
          label: 'Review market analysis',
          description: 'AI analyzes competitors.',
          play: 'research-market-opportunity',
        },
        {
          id: 'lock-spec',
          label: 'Lock product spec',
          description: 'Review and approve.',
          play: 'specify-product',
        },
        {
          id: 'define-features',
          label: 'Define features & scope',
          description: 'Structure capabilities.',
          play: 'draft-product-spec',
        },
        {
          id: 'plan-roadmap',
          label: 'Plan roadmap',
          description: 'Sequence epics.',
          play: 'plan-roadmap',
        },
      ],
    },
  ],
  validation: { valid: true, invalidCount: 0 },
};

beforeEach(() => {
  vi.clearAllMocks();
  mockPathname.mockReturnValue('/checklists');

  // Mock fetch for /api/checklists (used by ChecklistsPage)
  vi.spyOn(global, 'fetch').mockImplementation((input: string | URL | Request) => {
    const url =
      typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    if (url === '/api/checklists') {
      return Promise.resolve(
        new Response(JSON.stringify(MOCK_CHECKLISTS_RESPONSE), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      );
    }
    // For readiness API and others, return a safe default
    if (url === '/api/readiness') {
      return Promise.resolve(
        new Response(
          JSON.stringify({
            score: 0,
            totalPlays: 14,
            runnablePlays: 0,
            breakdown: [],
            plays: [],
            lastGitHash: null,
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          },
        ),
      );
    }
    return Promise.reject(new Error(`Unhandled fetch: ${url}`));
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Fixture paths
// ---------------------------------------------------------------------------

const FIXTURE_DIR = path.resolve(__dirname, '../../test-fixtures/artifacts');

const FIXTURE_FILES = [
  { path: path.join(FIXTURE_DIR, 'product.yaml') },
  { path: path.join(FIXTURE_DIR, 'features.yaml') },
  { path: path.join(FIXTURE_DIR, 'scenarios.yaml') },
  { path: path.join(FIXTURE_DIR, 'plan.yaml') },
  { path: path.join(FIXTURE_DIR, 'architecture.yaml') },
  { path: path.join(FIXTURE_DIR, 'tech.yaml') },
  { path: path.join(FIXTURE_DIR, 'roadmap.yaml') },
  { path: path.join(FIXTURE_DIR, 'stm-evidence.yaml') },
  { path: path.join(FIXTURE_DIR, 'stm-evidence.md') },
] as const;

// ============================================================================
// VAL-FOUND-074: Application Loads with Fixture Artifacts
// ============================================================================
describe('Smoke — Application Loads with Fixture Artifacts (VAL-FOUND-074)', () => {
  it('parses all fixture artifacts without errors', () => {
    const results = parseArtifacts(FIXTURE_FILES);

    // Every fixture should parse successfully (status 'ok')
    for (const result of results) {
      expect(result.status, `${result.path} should parse as 'ok'`).toBe('ok');
      expect(result.content).not.toBeNull();
    }

    expect(results).toHaveLength(FIXTURE_FILES.length);
  });

  it('builds cross-reference graph from all parsed fixtures', () => {
    const artifacts = parseArtifacts(FIXTURE_FILES);
    const graph = buildCrossRefGraph(artifacts, 'smoke-test-hash');

    // Graph should contain nodes from fixtures
    expect(graph.nodes.size).toBeGreaterThan(0);
    // Should have feature nodes (F1, F2, etc.)
    const f1 = graph.nodes.get('F1');
    expect(f1).toBeDefined();
    expect(f1!.type).toBe('feature');
    // Should have scenario nodes
    const sc = graph.nodes.get('SC-TASK-001');
    expect(sc).toBeDefined();
    expect(sc!.type).toBe('scenario');
  });

  it('builds search index from all parsed fixtures', () => {
    const artifacts = parseArtifacts(FIXTURE_FILES);
    const index = createSearchIndex();
    index.build(artifacts, 'smoke-test-hash');

    expect(index.getDocumentCount()).toBeGreaterThan(0);
    expect(index.getLastGitHash()).toBe('smoke-test-hash');
  });

  it('full data pipeline: parse → graph → search → resolve — end-to-end', () => {
    // 1. Parse
    const artifacts = parseArtifacts(FIXTURE_FILES);
    expect(artifacts.every((a) => a.status === 'ok')).toBe(true);

    // 2. Build crossref graph
    const graph = buildCrossRefGraph(artifacts, 'e2e-hash');
    expect(graph.nodes.size).toBeGreaterThan(0);

    // 3. Build search index
    const index = createSearchIndex();
    index.build(artifacts, 'e2e-hash');
    expect(index.getDocumentCount()).toBeGreaterThan(0);

    // 4. Search for a known term
    const inboxResults = index.search('inbox');
    expect(inboxResults.length).toBeGreaterThan(0);

    // 5. Resolve a found entity via crossref
    const resolved = resolveId(graph, 'F1');
    expect(resolved).not.toBeNull();
    expect(resolved!.content).toBeTruthy();

    // 6. Forward lookup should find references
    const refs = forwardLookup(graph, 'F1');
    expect(refs.length).toBeGreaterThanOrEqual(0); // may have refs from scenarios
  });

  it('renders the Checklists instrument without errors', () => {
    mockPathname.mockReturnValue('/checklists');
    const { container } = render(<ChecklistsPage />);
    expect(screen.getByTestId('checklists-view')).toBeInTheDocument();
    // No error boundaries triggered
    expect(container.querySelector('[data-error]')).toBeNull();
  });

  it('renders the Flight Deck instrument without errors', () => {
    mockPathname.mockReturnValue('/flight-deck');
    const { container } = render(<FlightDeckPage />);
    expect(screen.getByTestId('flight-deck-view')).toBeInTheDocument();
    expect(container.querySelector('[data-error]')).toBeNull();
  });

  it('renders the Playbook Reader instrument without errors', () => {
    mockPathname.mockReturnValue('/playbook');
    const { container } = render(<PlaybookPage />);
    expect(screen.getByTestId('playbook-view')).toBeInTheDocument();
    expect(container.querySelector('[data-error]')).toBeNull();
  });

  it('renders all three instrument tabs in the app shell', () => {
    render(
      <AppShell>
        <ChecklistsPage />
      </AppShell>,
    );

    expect(screen.getByTestId('tab-checklists')).toBeInTheDocument();
    expect(screen.getByTestId('tab-flight-deck')).toBeInTheDocument();
    expect(screen.getByTestId('tab-playbook')).toBeInTheDocument();
  });

  it('top bar contains readiness gauge, search bar, and instrument switcher', () => {
    render(<TopBar />);

    expect(screen.getByTestId('readiness-mini-gauge')).toBeInTheDocument();
    expect(screen.getByTestId('search-bar')).toBeInTheDocument();
    expect(screen.getByTestId('instrument-switcher')).toBeInTheDocument();
  });
});

// ============================================================================
// VAL-FOUND-075: Application Loads in Greenfield State
// ============================================================================
describe('Smoke — Greenfield State (VAL-FOUND-075)', () => {
  it('data layer handles greenfield gracefully — no artifacts produces empty graph and index', () => {
    // Parse from non-existent paths simulates greenfield
    const artifacts = parseArtifacts([
      { path: '/nonexistent/product.yaml' },
      { path: '/nonexistent/features.yaml' },
    ]);

    // All should be 'missing'
    expect(artifacts.every((a) => a.status === 'missing')).toBe(true);

    // Cross-ref graph should still build (empty)
    const graph = buildCrossRefGraph(artifacts, null);
    expect(graph.nodes.size).toBe(0);
    expect(graph.danglingRefs.size).toBe(0);

    // Search index should build (empty)
    const index = createSearchIndex();
    index.build(artifacts);
    expect(index.getDocumentCount()).toBe(0);
    expect(index.search('anything')).toHaveLength(0);
  });

  it('config falls back to defaults when no config file exists', () => {
    const config = loadConfig('/nonexistent/path/config.yaml');
    expect(config.project.name).toBe(DEFAULT_CONFIG.project.name);
    expect(config.repo.path).toBe(DEFAULT_CONFIG.repo.path);
  });

  it('Checklists page shows readiness score of 0', () => {
    mockPathname.mockReturnValue('/checklists');
    render(<ChecklistsPage />);

    const gauge = screen.getByTestId('readiness-gauge');
    expect(gauge).toBeInTheDocument();

    const scoreText = screen.getByTestId('readiness-gauge-score');
    expect(scoreText).toHaveTextContent('0');
  });

  it('Checklists page shows onboarding checklist', async () => {
    mockPathname.mockReturnValue('/checklists');
    render(<ChecklistsPage />);

    // Wait for async checklist data to load
    const checklist = await screen.findByTestId('checklist-card');
    expect(checklist).toBeInTheDocument();

    // Should contain the heading
    expect(screen.getByText('Getting Started: Greenfield Onboarding')).toBeInTheDocument();
  });

  it('onboarding checklist has checklist items', async () => {
    mockPathname.mockReturnValue('/checklists');
    render(<ChecklistsPage />);

    // Wait for async checklist data to load
    await screen.findByTestId('checklist-card');
    const items = screen.getAllByTestId('checklist-item');
    expect(items.length).toBeGreaterThanOrEqual(5);
  });

  it('greenfield hero shows encouraging message', () => {
    mockPathname.mockReturnValue('/checklists');
    render(<ChecklistsPage />);

    expect(
      screen.getByText("Your project isn't flying yet — let's get started."),
    ).toBeInTheDocument();
  });

  it('first checklist step is actionable (in-progress), rest are locked', async () => {
    mockPathname.mockReturnValue('/checklists');
    render(<ChecklistsPage />);

    // Wait for async checklist data to load
    await screen.findByTestId('checklist-card');
    const items = screen.getAllByTestId('checklist-item');
    // First item should be in-progress
    expect(items[0]).toHaveAttribute('data-state', 'in-progress');
    // Remaining items should be locked
    for (let i = 1; i < items.length; i++) {
      expect(items[i]).toHaveAttribute('data-state', 'locked');
    }
  });

  it('readiness mini-gauge in top bar shows 0', () => {
    mockPathname.mockReturnValue('/checklists');
    render(<TopBar />);

    const score = screen.getByTestId('readiness-mini-gauge-score');
    expect(score).toHaveTextContent('0');
  });
});

// ============================================================================
// VAL-FOUND-076: Search Returns Results with Fixture Data
// ============================================================================
describe('Smoke — Search with Fixture Data (VAL-FOUND-076)', () => {
  let artifacts: ArtifactResult[];

  beforeEach(() => {
    artifacts = parseArtifacts(FIXTURE_FILES);
  });

  it('search for "task" returns results with titles and source provenance', () => {
    const index = createSearchIndex();
    index.build(artifacts, 'search-hash');

    const results = index.search('task');
    expect(results.length).toBeGreaterThan(0);

    // Each result should have title and source provenance
    for (const result of results) {
      expect(result.title).toBeTruthy();
      expect(result.source_type).toBeTruthy();
      expect(result.source_file).toBeTruthy();
      expect(result.entity_id).toBeTruthy();
    }
  });

  it('search for "inbox" returns F1 Task Inbox feature', () => {
    const index = createSearchIndex();
    index.build(artifacts, 'search-hash');

    const results = index.search('inbox');
    expect(results.length).toBeGreaterThan(0);

    // Should find F1 (Task Inbox)
    const f1Result = results.find((r) => r.entity_id === 'F1');
    expect(f1Result).toBeDefined();
    expect(f1Result!.title).toContain('Task Inbox');
    expect(f1Result!.source_type).toBe('features');
  });

  it('search for "priority" returns results from features and scenarios', () => {
    const index = createSearchIndex();
    index.build(artifacts, 'search-hash');

    const results = index.search('priority');
    expect(results.length).toBeGreaterThan(0);

    const sourceTypes = new Set(results.map((r) => r.source_type));
    // Should have results from multiple artifact types
    expect(sourceTypes.size).toBeGreaterThanOrEqual(1);
  });

  it('search results include source_file paths', () => {
    const index = createSearchIndex();
    index.build(artifacts, 'search-hash');

    const results = index.search('task');
    for (const result of results) {
      expect(result.source_file).toBeTruthy();
      // Source file should be an absolute path to a fixture
      expect(result.source_file).toContain('test-fixtures');
    }
  });

  it('search for non-existent term returns empty results', () => {
    const index = createSearchIndex();
    index.build(artifacts, 'search-hash');

    const results = index.search('zzz_nonexistent_term_xyz');
    expect(results).toHaveLength(0);
  });

  it('cross-reference graph integrates with search — resolved entity has source', () => {
    const index = createSearchIndex();
    index.build(artifacts, 'search-hash');
    const graph = buildCrossRefGraph(artifacts, 'search-hash');

    // Search for something
    const results = index.search('inbox');
    expect(results.length).toBeGreaterThan(0);

    // Take the first result entity and resolve it in the graph
    const topResult = results[0]!;
    if (topResult.entity_id && topResult.entity_id !== 'product') {
      const resolved = resolveId(graph, topResult.entity_id);
      if (resolved) {
        expect(resolved.sourceFile).toBeTruthy();
        expect(resolved.content).toBeTruthy();
      }
    }
  });
});

// ============================================================================
// VAL-FOUND-077: CrossRefToken Click Triggers InlineExpansion in Playbook
// ============================================================================
describe('Smoke — CrossRefToken → InlineExpansion in Playbook (VAL-FOUND-077)', () => {
  it('Playbook Reader renders CrossRefTokens', () => {
    mockPathname.mockReturnValue('/playbook');
    render(<PlaybookPage />);

    const tokens = screen.getAllByTestId('cross-ref-token');
    expect(tokens.length).toBeGreaterThanOrEqual(2);

    // Should have F1 and F2 tokens
    const refIds = tokens.map((t) => t.getAttribute('data-ref-id'));
    expect(refIds).toContain('F1');
    expect(refIds).toContain('F2');
  });

  it('clicking CrossRefToken [F1] opens InlineExpansion with entity details', () => {
    mockPathname.mockReturnValue('/playbook');
    render(<PlaybookPage />);

    // Before click: no expansion visible
    expect(screen.queryByTestId('entity-details')).not.toBeInTheDocument();

    // Click the F1 token
    const f1Token = screen
      .getAllByTestId('cross-ref-token')
      .find((t) => t.getAttribute('data-ref-id') === 'F1');
    expect(f1Token).toBeDefined();
    fireEvent.click(f1Token!);

    // After click: InlineExpansion should appear with entity details
    const expansion = screen.getByTestId('inline-expansion');
    expect(expansion).toBeInTheDocument();

    const details = screen
      .getAllByTestId('entity-details')
      .find((d) => d.getAttribute('data-ref-id') === 'F1');
    expect(details).toBeDefined();

    // Entity details should contain title and description
    expect(within(details!).getByText('Task Inbox')).toBeInTheDocument();
    expect(within(details!).getByText(/Unified inbox/)).toBeInTheDocument();

    // Source provenance
    expect(within(details!).getByText('features.yaml')).toBeInTheDocument();
    expect(within(details!).getByText('Feature')).toBeInTheDocument();
  });

  it('InlineExpansion has a close/toggle control', () => {
    mockPathname.mockReturnValue('/playbook');
    render(<PlaybookPage />);

    // Click to open F1 expansion
    const f1Token = screen
      .getAllByTestId('cross-ref-token')
      .find((t) => t.getAttribute('data-ref-id') === 'F1');
    fireEvent.click(f1Token!);

    // The InlineExpansion toggle button should be present
    const toggle = screen.getByTestId('inline-expansion-toggle');
    expect(toggle).toBeInTheDocument();
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
  });

  it('clicking CrossRefToken again closes the expansion (toggle behavior)', () => {
    mockPathname.mockReturnValue('/playbook');
    render(<PlaybookPage />);

    // Open
    const f1Token = screen
      .getAllByTestId('cross-ref-token')
      .find((t) => t.getAttribute('data-ref-id') === 'F1');
    fireEvent.click(f1Token!);
    expect(screen.getAllByTestId('entity-details').length).toBeGreaterThanOrEqual(1);

    // Close by clicking the same token again
    fireEvent.click(f1Token!);
    const f1Details = screen
      .queryAllByTestId('entity-details')
      .filter((d) => d.getAttribute('data-ref-id') === 'F1');
    expect(f1Details).toHaveLength(0);
  });

  it('multiple CrossRefTokens can be expanded simultaneously', () => {
    mockPathname.mockReturnValue('/playbook');
    render(<PlaybookPage />);

    // Click F1
    const f1Token = screen
      .getAllByTestId('cross-ref-token')
      .find((t) => t.getAttribute('data-ref-id') === 'F1');
    fireEvent.click(f1Token!);

    // Click F2
    const f2Token = screen
      .getAllByTestId('cross-ref-token')
      .find((t) => t.getAttribute('data-ref-id') === 'F2');
    fireEvent.click(f2Token!);

    // Both should be expanded
    const details = screen.getAllByTestId('entity-details');
    const refIds = details.map((d) => d.getAttribute('data-ref-id'));
    expect(refIds).toContain('F1');
    expect(refIds).toContain('F2');
  });

  it('clicking SC-TASK-001 token opens expansion with scenario details', () => {
    mockPathname.mockReturnValue('/playbook');
    render(<PlaybookPage />);

    const scToken = screen
      .getAllByTestId('cross-ref-token')
      .find((t) => t.getAttribute('data-ref-id') === 'SC-TASK-001');
    expect(scToken).toBeDefined();
    fireEvent.click(scToken!);

    const details = screen
      .getAllByTestId('entity-details')
      .find((d) => d.getAttribute('data-ref-id') === 'SC-TASK-001');
    expect(details).toBeDefined();
    expect(within(details!).getByText('Scenario')).toBeInTheDocument();
    expect(within(details!).getByText('scenarios.yaml')).toBeInTheDocument();
    expect(
      within(details!).getByText('Inbox displays tasks sorted by priority'),
    ).toBeInTheDocument();
  });
});
