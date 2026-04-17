'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CrossRefToken } from '@/components/cross-ref-token';
import { InlineExpansion } from '@/components/inline-expansion';
import { NarrativeView } from '@/components/narrative-view';
import { SearchResultsView } from '@/components/search-results-view';
import { useBreadcrumbExtras } from '@/components/breadcrumb-context';
import type { BreadcrumbSegment } from '@/components/breadcrumb';

/** Represents a resolved entity detail for display in expansions (foundation sample). */
interface EntityDetail {
  readonly refId: string;
  readonly type: string;
  readonly title: string;
  readonly description: string;
  readonly source: string;
}

/**
 * Sample entity data used for the no-context foundation view.
 * When an actual epic context is present on the URL, the AI-composed narrative
 * takes over via `NarrativeView`.
 */
const SAMPLE_ENTITIES: Readonly<Record<string, EntityDetail>> = {
  F1: {
    refId: 'F1',
    type: 'Feature',
    title: 'Task Inbox',
    description: 'Unified inbox showing all tasks assigned to the current user across projects.',
    source: 'features.yaml',
  },
  F2: {
    refId: 'F2',
    type: 'Feature',
    title: 'Smart Prioritization',
    description: 'AI-powered task ranking based on project health, deadlines, and dependencies.',
    source: 'features.yaml',
  },
  'SC-TASK-001': {
    refId: 'SC-TASK-001',
    type: 'Scenario',
    title: 'Inbox displays tasks sorted by priority',
    description:
      'User opens inbox. Tasks from all linked projects appear sorted by descending priority score.',
    source: 'scenarios.yaml',
  },
};

/**
 * Playbook Reader instrument page.
 *
 * Supports four entry modes:
 *   1. `/playbook` (no params)      — empty-state guidance (VAL-PLAY-028)
 *   2. `/playbook?context=E1`       — AI-composed narrative for an epic
 *                                     (VAL-PLAY-008, VAL-PLAY-009,
 *                                     VAL-PLAY-011, VAL-CROSS-001,
 *                                     VAL-CROSS-003)
 *   3. `/playbook?context=SC-AUTH-1` — narrative composed around a cross-ref
 *                                     entity (e.g. scenario clicked in a
 *                                     search result — VAL-PLAY-010)
 *   4. `/playbook?query=foo`         — search results view (VAL-CROSS-007)
 *
 * Every non-root entry updates the breadcrumb via the BreadcrumbExtras
 * context so the trail reflects the active context (VAL-PLAY-021). The
 * trailing segment is current-page (non-clickable); the "Playbook"
 * segment is linked to `/playbook` for root navigation (VAL-PLAY-022).
 *
 * Fulfills: mdb-playbook-entry-points
 */
/**
 * sessionStorage key holding the last non-trivial Playbook URL
 * (including `?context=` or `?query=`) so returning to the Playbook tab
 * via the shell's instrument switcher lands on the last-viewed narrative
 * rather than the generic empty state (VAL-CROSS-012).
 */
const PLAYBOOK_LAST_URL_KEY = 'mdb:playbook:last-url';

export default function PlaybookPage() {
  // usePathname() is retained for test environments that mock it, and to
  // keep the shell consistent with other instruments.
  usePathname();

  const { setExtras, clearExtras } = useBreadcrumbExtras();
  const router = useRouter();

  // Read `context` and `query` search params via Next.js'
  // `useSearchParams()` hook so that client-side router navigation
  // (breadcrumb Link clicks, router.push) re-renders this component.
  // We normalise to trimmed strings and treat blank as absent.
  const searchParams = useSearchParams();
  const context = (searchParams?.get('context') ?? '').trim();
  const query = (searchParams?.get('query') ?? '').trim();

  // Last-URL preservation (VAL-CROSS-012).
  //
  // When the user is reading a narrative (e.g. `/playbook?context=E1`) and
  // switches to another instrument via the top-bar tab, the shell's link
  // points to `/playbook` (base href). On return, React would otherwise
  // drop them into the empty state — losing the reading context.
  //
  // To preserve context, we:
  //   1. Persist every non-empty context/query URL to sessionStorage.
  //   2. On entry with NO params (i.e. the user landed on `/playbook`
  //      root), check sessionStorage and redirect to the last URL if
  //      one was saved.
  //
  // We use `router.replace` so the restored URL does not add a history
  // entry — the Checklists/Flight-Deck → Playbook tab-switch remains a
  // single forward navigation from the browser's perspective.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (context || query) {
      // Save current URL for future restoration.
      try {
        const current = `${window.location.pathname}${window.location.search}`;
        window.sessionStorage.setItem(PLAYBOOK_LAST_URL_KEY, current);
      } catch {
        /* sessionStorage disabled — ignore */
      }
      return;
    }
    // No params — try to restore the last URL.
    try {
      const saved = window.sessionStorage.getItem(PLAYBOOK_LAST_URL_KEY);
      if (saved && saved.startsWith('/playbook?') && saved !== window.location.pathname) {
        router.replace(saved);
      }
    } catch {
      /* sessionStorage disabled — ignore */
    }
  }, [context, query, router]);

  // Narrative metadata flows back up from NarrativeView once the epic
  // name is known so the breadcrumb can show "Playbook › E1: Authentication"
  // (VAL-PLAY-021). While loading, we fall back to the raw id.
  const [epicName, setEpicName] = useState<string | null>(null);

  const onNarrativeLoaded = useCallback(
    (loadedContext: string, loadedEpicName: string | undefined) => {
      if (loadedContext !== context) return;
      if (loadedEpicName && loadedEpicName.trim().length > 0) {
        setEpicName(loadedEpicName);
      }
    },
    [context],
  );

  // Reset name cache when the context changes, so the breadcrumb falls
  // back to the id until the new narrative loads.
  useEffect(() => {
    setEpicName(null);
  }, [context]);

  // Drive the breadcrumb from (context, query) state.
  useEffect(() => {
    if (context) {
      const label = epicName ? `${context}: ${epicName}` : context;
      const extras: BreadcrumbSegment[] = [
        { label, href: `/playbook?context=${encodeURIComponent(context)}` },
      ];
      setExtras(extras);
    } else if (query) {
      const extras: BreadcrumbSegment[] = [
        {
          label: `Search: "${query}"`,
          href: `/playbook?query=${encodeURIComponent(query)}`,
        },
      ];
      setExtras(extras);
    } else {
      clearExtras();
    }
    return () => {
      clearExtras();
    };
  }, [context, query, epicName, setExtras, clearExtras]);

  // ---------------------------------------------------------------------
  // Render — one of four modes based on URL state.
  // ---------------------------------------------------------------------
  if (context) {
    return (
      <div data-testid="playbook-view" data-mode="narrative" className="space-y-4">
        <NarrativeView context={context} onMetaLoaded={onNarrativeLoaded} />
      </div>
    );
  }

  if (query) {
    return (
      <div data-testid="playbook-view" data-mode="search" className="space-y-4">
        <PlaybookSearchView query={query} />
      </div>
    );
  }

  return (
    <div data-testid="playbook-view" data-mode="empty">
      <PlaybookEmptyState />
      <PlaybookSampleView />
    </div>
  );
}

/**
 * Empty state shown when the reader is opened without a context or query.
 * Matches VAL-PLAY-028 / VAL-CROSS-015: guidance message with actionable
 * next steps (jump to Checklists or focus the search bar), not a blank
 * page.
 */
function PlaybookEmptyState() {
  return (
    <section
      data-testid="playbook-empty-state"
      aria-label="Playbook Reader empty state"
      className="mb-8 rounded-lg border border-dashed border-gray-700 bg-gray-900/30 px-6 py-10 text-center"
    >
      <span className="mb-3 block text-4xl" aria-hidden="true">
        📖
      </span>
      <h2
        className="text-lg font-semibold text-gray-200"
        data-testid="playbook-empty-state-heading"
      >
        Nothing to read yet
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-gray-400">
        Start from{' '}
        <Link
          href="/checklists"
          data-testid="playbook-empty-state-checklists-link"
          className="text-blue-400 underline-offset-2 hover:underline"
        >
          Checklists
        </Link>{' '}
        or search for something using the top-bar search.
      </p>
    </section>
  );
}

/**
 * Search results view — wraps the generative `SearchResultsView`
 * component with the legacy wrapper elements (`playbook-search-view`,
 * `playbook-search-heading`, `playbook-search-root-link`) that older
 * entry-point tests rely on. The heading and root link remain but the
 * actual result prose is rendered by `SearchResultsView` which hits
 * `/api/search` for AI-composed snippets.
 *
 * Fulfills: mdb-generative-search (wiring into Playbook Reader).
 */
function PlaybookSearchView({ query }: { query: string }) {
  return (
    <section
      data-testid="playbook-search-view"
      aria-label={`Search results for ${query}`}
      className="space-y-4"
    >
      <div className="sr-only" data-testid="playbook-search-heading">
        “{query}”
      </div>
      <SearchResultsView query={query} />
      <Link
        href="/playbook"
        data-testid="playbook-search-root-link"
        className="inline-flex text-xs text-blue-400 underline-offset-2 hover:underline"
      >
        Return to Playbook root
      </Link>
    </section>
  );
}

/**
 * Foundation sample view — shown alongside the empty state when no
 * `?context=` query param is present. Preserves the VAL-FOUND-077 wiring:
 * a small narrative with CrossRefToken → InlineExpansion demonstration
 * for foundation smoke tests.
 */
function PlaybookSampleView() {
  const [expandedTokens, setExpandedTokens] = useState<Set<string>>(new Set());

  const handleTokenClick = useCallback((refId: string) => {
    setExpandedTokens((prev) => {
      const next = new Set(prev);
      if (next.has(refId)) {
        next.delete(refId);
      } else {
        next.add(refId);
      }
      return next;
    });
  }, []);

  return (
    <div>
      <h2 className="text-2xl font-bold text-white">Playbook Reader</h2>
      <p className="mt-2 text-gray-400">
        AI-composed narrative views from the artifact cross-reference graph. Provide a{' '}
        <code className="text-blue-400">?context=E1</code> URL parameter to compose the narrative
        for a specific epic.
      </p>

      <div className="mt-6 space-y-4" data-testid="playbook-narrative">
        <p className="text-gray-300">
          The system centres on the <CrossRefToken refId="F1" onClick={handleTokenClick} /> feature,
          which provides a unified inbox for task management. Tasks are ranked using{' '}
          <CrossRefToken refId="F2" onClick={handleTokenClick} /> algorithms to surface the most
          important work first.
        </p>

        {expandedTokens.has('F1') && (
          <InlineExpansion summary="F1 — Task Inbox" defaultOpen>
            <EntityExpansionContent entity={SAMPLE_ENTITIES['F1']!} />
          </InlineExpansion>
        )}

        {expandedTokens.has('F2') && (
          <InlineExpansion summary="F2 — Smart Prioritization" defaultOpen>
            <EntityExpansionContent entity={SAMPLE_ENTITIES['F2']!} />
          </InlineExpansion>
        )}

        <p className="text-gray-300">
          The primary verification scenario{' '}
          <CrossRefToken refId="SC-TASK-001" onClick={handleTokenClick} /> validates that the inbox
          correctly sorts tasks by priority score.
        </p>

        {expandedTokens.has('SC-TASK-001') && (
          <InlineExpansion
            summary="SC-TASK-001 — Inbox displays tasks sorted by priority"
            defaultOpen
          >
            <EntityExpansionContent entity={SAMPLE_ENTITIES['SC-TASK-001']!} />
          </InlineExpansion>
        )}
      </div>
    </div>
  );
}

/** Renders entity details inside an InlineExpansion. */
function EntityExpansionContent({ entity }: { entity: EntityDetail }) {
  return (
    <div data-testid="entity-details" data-ref-id={entity.refId} className="space-y-2 text-sm">
      <div className="flex items-center gap-2">
        <span className="rounded bg-gray-700 px-2 py-0.5 text-xs font-medium text-gray-300">
          {entity.type}
        </span>
        <span className="text-gray-400">·</span>
        <span className="text-xs text-gray-500">{entity.source}</span>
      </div>
      <h4 className="font-medium text-white">{entity.title}</h4>
      <p className="text-gray-400">{entity.description}</p>
    </div>
  );
}
