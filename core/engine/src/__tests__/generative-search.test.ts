/**
 * Tests for the Garura Generative Search composer.
 *
 * Verifies:
 *   - Results are AI-composed prose chunks (NarrativeChunks with inline
 *     CrossRefTokens), never raw YAML (VAL-PLAY-017, mdb-generative-search).
 *   - Results are grouped and ordered by semantic relevance, with the top
 *     result potentially synthesizing multiple source artifacts
 *     (VAL-PLAY-018).
 *   - Cross-epic relevance: a single query can return results from
 *     multiple epics (VAL-PLAY-020).
 *   - CrossRefTokens inside the snippets point at real entity ids that
 *     the UI can route to (VAL-PLAY-019).
 *   - Graceful empty-results handling (VAL-FOUND-042).
 */

import { describe, it, expect } from 'vitest';
import {
  composeGenerativeSearch,
  distinctEpicsInResults,
  type GenerativeSearchResult,
} from '@/lib/generative-search';
import { createSearchIndex } from '@/lib/search-index';
import { buildCrossRefGraph } from '@/lib/crossref-resolver';
import type {
  ArtifactResult,
  FeaturesContent,
  ScenariosContent,
  RoadmapContent,
  PlanContent,
  ArchitectureContent,
} from '@/lib/artifact-parser';
import type { NarrativeChunk } from '@/lib/narrative-engine';

// ---------------------------------------------------------------------------
// Fixture builders — small synthetic artifacts so each test is isolated.
// ---------------------------------------------------------------------------

function featuresArtifact(): ArtifactResult<FeaturesContent> {
  return {
    type: 'features',
    path: '/tmp/features.yaml',
    status: 'ok',
    content: {
      features: [
        {
          id: 'F1',
          name: 'Task Inbox',
          description:
            'Unified inbox showing all tasks assigned to the current user across projects.',
          capabilityDomain: 'task-management',
        },
        {
          id: 'F2',
          name: 'Smart Prioritization',
          description: 'AI-powered task ranking.',
          capabilityDomain: 'ai-intelligence',
        },
        {
          id: 'F3',
          name: 'Workflow Automation',
          description: 'Automated task state transitions triggered by git events.',
          capabilityDomain: 'automation',
        },
      ],
    },
  };
}

function scenariosArtifact(): ArtifactResult<ScenariosContent> {
  return {
    type: 'scenarios',
    path: '/tmp/scenarios.yaml',
    status: 'ok',
    content: {
      scenarios: [
        {
          id: 'SC-TASK-001',
          featureRef: 'F1',
          description: 'Inbox displays tasks sorted by priority',
          passCriteria: ['Sorted by priority score'],
        },
        {
          id: 'SC-TASK-016',
          featureRef: 'F1',
          description: 'Inbox session timeout re-prompts the user to re-authenticate',
          passCriteria: ['Session timeout triggers re-authentication prompt'],
        },
        {
          id: 'SC-AUTO-016',
          featureRef: 'F3',
          description: 'Webhook timeout is retried with exponential backoff',
          passCriteria: ['Webhook timeout triggers retry'],
        },
      ],
    },
  };
}

function roadmapArtifact(): ArtifactResult<RoadmapContent> {
  return {
    type: 'roadmap',
    path: '/tmp/roadmap.yaml',
    status: 'ok',
    content: {
      epics: [
        {
          id: 'EPIC-E1',
          name: 'Core Task Management',
          description: 'Foundation epic',
          features: ['F1'],
          phase: 'phase-1',
        },
        {
          id: 'EPIC-E2',
          name: 'AI Intelligence',
          description: 'Prioritization epic',
          features: ['F2'],
          phase: 'phase-2',
        },
        {
          id: 'EPIC-E3',
          name: 'Workflow Automation',
          description: 'Webhook-driven automation epic',
          features: ['F3'],
          phase: 'phase-2',
        },
      ],
      phases: [],
      sequencing: [],
    },
  };
}

function planArtifact(): ArtifactResult<PlanContent> {
  return {
    type: 'plan',
    path: '/tmp/plan.yaml',
    status: 'ok',
    content: {
      executionOrder: [
        {
          id: 'TP-M1-T1',
          featureId: 'F1',
          description: 'Implement inbox session timeout handling',
          dependsOn: [],
        },
      ],
      milestones: [],
    },
  };
}

function architectureArtifact(): ArtifactResult<ArchitectureContent> {
  return {
    type: 'architecture',
    path: '/tmp/architecture.yaml',
    status: 'ok',
    content: {
      components: [],
      decisions: [
        {
          id: 'ADR-001',
          title: 'Session timeout policy',
          status: 'accepted',
          rationale: 'Sessions must expire after 30 minutes idle to limit token exposure.',
        },
      ],
      patterns: [],
      nfrMappings: [
        {
          nfrId: 'NFR-SEC-01',
          description: 'All sensitive operations must time out within 30 minutes of inactivity.',
          mechanism: 'session-manager-middleware',
        },
      ],
    },
  };
}

function buildFixtureArtifacts(): ReadonlyArray<ArtifactResult> {
  return [
    featuresArtifact(),
    scenariosArtifact(),
    roadmapArtifact(),
    planArtifact(),
    architectureArtifact(),
  ];
}

// ---------------------------------------------------------------------------
// Chunk helpers
// ---------------------------------------------------------------------------

function chunkText(chunks: readonly NarrativeChunk[]): string {
  return chunks.map((c) => (c.type === 'text' ? c.text : `[${c.token.refId}]`)).join('');
}

function tokenRefIds(chunks: readonly NarrativeChunk[]): string[] {
  return chunks.filter((c) => c.type === 'token').map((c) => c.token.refId);
}

function resultChunksContain(result: GenerativeSearchResult, text: string): boolean {
  return chunkText(result.chunks).toLowerCase().includes(text.toLowerCase());
}

// ---------------------------------------------------------------------------
// Shared setup helper
// ---------------------------------------------------------------------------

function setupSearch(query: string) {
  const artifacts = buildFixtureArtifacts();
  const index = createSearchIndex();
  index.build(artifacts);
  const graph = buildCrossRefGraph(artifacts, null);
  return composeGenerativeSearch(query, index, artifacts, graph);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('composeGenerativeSearch — empty / missing input', () => {
  it('returns an empty response for an empty query string (VAL-FOUND-042)', () => {
    const response = setupSearch('');
    expect(response.results).toHaveLength(0);
    expect(response.hitCount).toBe(0);
    expect(response.epics).toHaveLength(0);
  });

  it('returns empty results for a query with no matches', () => {
    const response = setupSearch('xyzxyzxyz');
    expect(response.results).toHaveLength(0);
    expect(response.hitCount).toBe(0);
    expect(response.epics).toHaveLength(0);
  });
});

describe('composeGenerativeSearch — AI-composed prose (VAL-PLAY-017)', () => {
  it('produces prose chunks containing human language, not YAML', () => {
    const response = setupSearch('timeout');
    expect(response.results.length).toBeGreaterThan(0);

    for (const result of response.results) {
      const prose = chunkText(result.chunks);
      // Prose should be composed natural language, not a YAML dump.
      expect(prose).toMatch(/your search for "timeout"/i);
      // Must not contain raw YAML syntax markers (key: value on a line,
      // list markers, etc. — these are the shapes we explicitly reject).
      expect(prose).not.toMatch(/^\s*-\s/m);
      expect(prose).not.toMatch(/^\s*feature_ref:/m);
      expect(prose).not.toMatch(/^\s*pass_criteria:/m);
    }
  });

  it('embeds CrossRefToken chunks (not literal [ID] text)', () => {
    const response = setupSearch('inbox');
    const first = response.results[0];
    expect(first).toBeDefined();
    const tokenIds = tokenRefIds(first!.chunks);
    // The F1 group must surface the feature token explicitly.
    expect(tokenIds).toContain('F1');
    // And scenarios the user clicked through should appear as tokens too
    // once present in the sources.
    const scenarioSources = first!.sources.filter((s) => s.sourceType === 'scenarios');
    for (const s of scenarioSources) {
      expect(tokenIds).toContain(s.entityId);
    }
  });
});

describe('composeGenerativeSearch — grouping & relevance (VAL-PLAY-018)', () => {
  it('groups scenarios under their owning feature, synthesizing multiple sources', () => {
    const response = setupSearch('timeout');
    const f1 = response.results.find((r) => r.id === 'feature:F1');
    expect(f1).toBeDefined();
    // F1 must aggregate both the session-timeout scenario and the plan
    // task that references it — at least two distinct source artifacts.
    const sourceTypes = new Set(f1!.sources.map((s) => s.sourceType));
    expect(sourceTypes.size).toBeGreaterThanOrEqual(2);
    expect(sourceTypes.has('scenarios')).toBe(true);
  });

  it('orders results by aggregate relevance (descending)', () => {
    const response = setupSearch('timeout');
    const scores = response.results.map((r) => r.relevance);
    for (let i = 1; i < scores.length; i++) {
      expect(scores[i - 1]).toBeGreaterThanOrEqual(scores[i]!);
    }
  });

  it('top result may synthesize multiple sources', () => {
    const response = setupSearch('timeout');
    expect(response.results.length).toBeGreaterThan(0);
    const top = response.results[0]!;
    // Top result for "timeout" should have more than one contributing source
    // because the feature group combines scenario + plan task + feature hit.
    expect(top.sources.length).toBeGreaterThanOrEqual(2);
  });
});

describe('composeGenerativeSearch — cross-epic relevance (VAL-PLAY-020)', () => {
  it('returns results from multiple epics for the same topic', () => {
    const response = setupSearch('timeout');
    // Both F1 (E1) and F3 (E3) have timeout scenarios — the response must
    // expose results from at least two distinct epics.
    const distinctEpics = distinctEpicsInResults(response.results);
    const epicIds = distinctEpics.map((e) => e.id).sort();
    expect(epicIds).toContain('EPIC-E1');
    expect(epicIds).toContain('EPIC-E3');
    expect(response.epics.length).toBeGreaterThanOrEqual(2);
  });

  it('each feature-kind result carries its owning epic reference', () => {
    const response = setupSearch('timeout');
    const featureResults = response.results.filter((r) => r.kind === 'feature');
    expect(featureResults.length).toBeGreaterThan(0);
    for (const r of featureResults) {
      expect(r.epics.length).toBeGreaterThan(0);
    }
  });
});

describe('composeGenerativeSearch — tokens navigate to Playbook (VAL-PLAY-019)', () => {
  it('every feature-kind result exposes a primaryRefId suitable for /playbook?context=', () => {
    const response = setupSearch('inbox');
    const featureResults = response.results.filter((r) => r.kind === 'feature');
    expect(featureResults.length).toBeGreaterThan(0);
    for (const r of featureResults) {
      expect(r.primaryRefId).toMatch(/^F\d+$/);
    }
  });

  it('embeds scenario CrossRefTokens in the prose when scenarios matched', () => {
    const response = setupSearch('timeout');
    const f1 = response.results.find((r) => r.id === 'feature:F1');
    expect(f1).toBeDefined();
    const ids = tokenRefIds(f1!.chunks);
    // The session-timeout scenario is in the F1 group and must appear as
    // a token in the prose so the UI can render it as an interactive chip.
    expect(ids).toContain('SC-TASK-016');
  });
});

describe('composeGenerativeSearch — architecture & NFR grouping', () => {
  it('routes ADR hits into a decision group', () => {
    const response = setupSearch('session timeout policy');
    const adr = response.results.find((r) => r.id === 'decision:ADR-001');
    expect(adr).toBeDefined();
    expect(adr!.kind).toBe('decision');
    expect(resultChunksContain(adr!, 'architecture decision')).toBe(true);
  });

  it('routes NFR hits into an NFR group', () => {
    const response = setupSearch('sensitive operations');
    const nfr = response.results.find((r) => r.id === 'nfr:NFR-SEC-01');
    expect(nfr).toBeDefined();
    expect(nfr!.kind).toBe('nfr');
    expect(tokenRefIds(nfr!.chunks)).toContain('NFR-SEC-01');
  });
});

describe('composeGenerativeSearch — response metadata', () => {
  it('records hitCount reflecting the raw index hits', () => {
    const response = setupSearch('timeout');
    expect(response.hitCount).toBeGreaterThan(0);
    expect(response.hitCount).toBeGreaterThanOrEqual(response.results.length);
  });

  it('echoes the trimmed query back on the response', () => {
    const response = setupSearch('  timeout  ');
    expect(response.query).toBe('timeout');
  });

  it('composedAt is a valid ISO timestamp', () => {
    const response = setupSearch('timeout');
    expect(() => new Date(response.composedAt).toISOString()).not.toThrow();
  });
});
