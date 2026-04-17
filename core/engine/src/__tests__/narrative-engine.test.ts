/**
 * Narrative Engine — composition, caching, and density behaviour.
 *
 * Covers:
 *   - AI-composed narrative with section headings for E1 context (VAL-PLAY-001)
 *   - Content-hash cache hit returns stored narrative instantly (VAL-PLAY-014)
 *   - Cache invalidation when underlying artifacts change (VAL-PLAY-015)
 *   - High density (≥10 features) → grouped subsections (VAL-PLAY-012)
 *   - Low density (1–3 features) → depth + richer prose (VAL-PLAY-013)
 *   - No raw YAML in any narrative chunk text (VAL-PLAY-023)
 */

import path from 'node:path';
import { describe, it, expect, beforeEach } from 'vitest';
import type { ArtifactResult, FeaturesContent, RoadmapContent } from '@/lib/artifact-parser';
import { parseArtifacts } from '@/lib/artifact-parser';
import { buildCrossRefGraph } from '@/lib/crossref-resolver';
import {
  composeEpicNarrativeDeterministic,
  computeContentHash,
  getEpicNarrative,
  invalidateNarrativeCache,
  narrativeCacheSize,
  type ComposeContext,
  type Narrative,
  type NarrativeChunk,
  type NarrativeSection,
} from '@/lib/narrative-engine';

const FIXTURES_DIR = path.resolve(__dirname, '..', '..', 'test-fixtures', 'artifacts');

// Helper — load the full fixture set identical to what the API route sees.
function loadFixtureArtifacts(): ArtifactResult[] {
  return parseArtifacts([
    { path: path.join(FIXTURES_DIR, 'product.yaml'), type: 'product' },
    { path: path.join(FIXTURES_DIR, 'features.yaml'), type: 'features' },
    { path: path.join(FIXTURES_DIR, 'scenarios.yaml'), type: 'scenarios' },
    { path: path.join(FIXTURES_DIR, 'plan.yaml'), type: 'plan' },
    { path: path.join(FIXTURES_DIR, 'architecture.yaml'), type: 'architecture' },
    { path: path.join(FIXTURES_DIR, 'tech.yaml'), type: 'tech' },
    { path: path.join(FIXTURES_DIR, 'roadmap.yaml'), type: 'roadmap' },
  ]);
}

function buildCtx(epicId: string, overrides?: ReadonlyArray<ArtifactResult>): ComposeContext {
  const artifacts = overrides ?? loadFixtureArtifacts();
  return {
    epicId,
    artifacts,
    graph: buildCrossRefGraph(artifacts, null),
  };
}

/** Recursively collect every text chunk from a narrative. */
function allText(narrative: Narrative): string {
  const parts: string[] = [];
  const walk = (sections: readonly NarrativeSection[]) => {
    for (const s of sections) {
      parts.push(s.heading);
      for (const c of s.chunks) {
        if (c.type === 'text') parts.push(c.text);
      }
      if (s.subsections) walk(s.subsections);
    }
  };
  walk(narrative.sections);
  return parts.join('\n');
}

/** Recursively collect every token from a narrative. */
function allTokens(narrative: Narrative): string[] {
  const out: string[] = [];
  const walk = (sections: readonly NarrativeSection[]) => {
    for (const s of sections) {
      for (const c of s.chunks) {
        if (c.type === 'token') out.push(c.token.refId);
      }
      if (s.subsections) walk(s.subsections);
    }
  };
  walk(narrative.sections);
  return out;
}

beforeEach(() => {
  invalidateNarrativeCache();
});

// ---------------------------------------------------------------------------
// Content hash
// ---------------------------------------------------------------------------

describe('computeContentHash', () => {
  it('produces the same hash for the same artifact set', () => {
    const a = loadFixtureArtifacts();
    const b = loadFixtureArtifacts();
    expect(computeContentHash(a)).toBe(computeContentHash(b));
  });

  it('is stable under artifact-list reordering', () => {
    const a = loadFixtureArtifacts();
    const reversed = [...a].reverse();
    expect(computeContentHash(a)).toBe(computeContentHash(reversed));
  });

  it('changes when parsed content changes', () => {
    const a = loadFixtureArtifacts();
    const original = computeContentHash(a);

    // Swap the features artifact content with a smaller synthetic variant.
    const featuresIdx = a.findIndex((x) => x.type === 'features');
    expect(featuresIdx).toBeGreaterThanOrEqual(0);
    const smaller: FeaturesContent = {
      ...(a[featuresIdx]!.content as FeaturesContent),
      features: (a[featuresIdx]!.content as FeaturesContent).features.slice(0, 1),
    };
    const mutated: ArtifactResult[] = [...a];
    mutated[featuresIdx] = {
      ...a[featuresIdx]!,
      content: smaller,
    } as ArtifactResult;

    expect(computeContentHash(mutated)).not.toBe(original);
  });

  it('is deterministic regardless of key insertion order in content', () => {
    const a = loadFixtureArtifacts();
    const productIdx = a.findIndex((x) => x.type === 'product');
    expect(productIdx).toBeGreaterThanOrEqual(0);

    const product = a[productIdx]!.content as unknown as Record<string, unknown>;
    const reordered = {
      // Same keys, different insertion order.
      updatedAt: product['updatedAt'],
      name: product['name'],
      goals: product['goals'],
      constraints: product['constraints'],
      description: product['description'],
      status: product['status'],
      createdAt: product['createdAt'],
    };
    const b: ArtifactResult[] = [...a];
    b[productIdx] = { ...a[productIdx]!, content: reordered } as ArtifactResult;

    expect(computeContentHash(b)).toBe(computeContentHash(a));
  });
});

// ---------------------------------------------------------------------------
// Composition — structured sections with headings
// ---------------------------------------------------------------------------

describe('composeEpicNarrativeDeterministic', () => {
  it('renders a structured narrative with section headings for E1 (VAL-PLAY-001)', () => {
    const ctx = buildCtx('E1');
    const narrative = composeEpicNarrativeDeterministic(ctx);

    expect(narrative.epicId).toBe('EPIC-E1');
    expect(narrative.sections.length).toBeGreaterThanOrEqual(3);
    const headings = narrative.sections.map((s) => s.heading);
    expect(headings).toContain('Overview');
    expect(headings).toContain('Features');
    expect(headings).toContain('Verification Coverage');
  });

  it('normalises short-form epic ids ("E1" → "EPIC-E1")', () => {
    const ctx = buildCtx('E1');
    const narrative = composeEpicNarrativeDeterministic(ctx);
    expect(narrative.epicId).toBe('EPIC-E1');
    // The overview should reference the feature ids via tokens.
    const tokens = allTokens(narrative);
    expect(tokens).toContain('F1');
    expect(tokens).toContain('F4');
  });

  it('emits cross-reference IDs as tokens, never raw `[F1]` substrings in text chunks (VAL-PLAY-023)', () => {
    const ctx = buildCtx('E1');
    const narrative = composeEpicNarrativeDeterministic(ctx);
    const text = allText(narrative);

    // Text chunks must never contain a bare "[F<digit>" — those must be tokens.
    expect(text).not.toMatch(/\[F\d+\]/);
    expect(text).not.toMatch(/\[SC-[A-Z]+-\d+\]/);
    // Also: no YAML indicators (dashes for array items, colons for keys at line start).
    const linesWithYamlList = text.split('\n').filter((l) => /^\s*-\s+\w+:/.test(l));
    expect(linesWithYamlList.length).toBe(0);
  });

  it('marks dangling cross-ref tokens when the target is not in the graph', () => {
    // Build an artifact set that references a non-existent feature.
    const artifacts = loadFixtureArtifacts();
    const roadmapIdx = artifacts.findIndex((a) => a.type === 'roadmap');
    const roadmap = artifacts[roadmapIdx]!.content as RoadmapContent;
    const mutated: ArtifactResult[] = [...artifacts];
    mutated[roadmapIdx] = {
      ...artifacts[roadmapIdx]!,
      content: {
        ...roadmap,
        epics: [
          {
            ...roadmap.epics[0]!,
            id: 'EPIC-E1',
            features: ['F999'], // dangling
          },
        ],
      },
    } as ArtifactResult;
    const ctx: ComposeContext = {
      epicId: 'E1',
      artifacts: mutated,
      graph: buildCrossRefGraph(mutated, null),
    };
    const narrative = composeEpicNarrativeDeterministic(ctx);
    const tokens: NarrativeChunk[] = [];
    const walk = (sections: readonly NarrativeSection[]) => {
      for (const s of sections) {
        tokens.push(...s.chunks);
        if (s.subsections) walk(s.subsections);
      }
    };
    walk(narrative.sections);
    const dangling = tokens
      .filter((c): c is Extract<NarrativeChunk, { type: 'token' }> => c.type === 'token')
      .find((c) => c.token.refId === 'F999');
    expect(dangling?.token.dangling).toBe(true);
  });

  it('includes an Implementation Plan section when plan tasks exist', () => {
    const ctx = buildCtx('E1');
    const narrative = composeEpicNarrativeDeterministic(ctx);
    const headings = narrative.sections.map((s) => s.heading);
    expect(headings).toContain('Implementation Plan');
  });
});

// ---------------------------------------------------------------------------
// Density modes — high density (grouping) + low density (depth)
// ---------------------------------------------------------------------------

describe('feature density modes', () => {
  it('groups features into subsections when density is high (≥10 features)', () => {
    // Synthesize a roadmap where E-HIGH has 12 features across 3 domains,
    // plus matching features.yaml content so the tool layer resolves them.
    const artifacts = loadFixtureArtifacts();
    const featuresIdx = artifacts.findIndex((a) => a.type === 'features');
    const roadmapIdx = artifacts.findIndex((a) => a.type === 'roadmap');

    const domains = ['auth', 'billing', 'reporting'];
    const synthFeatures = Array.from({ length: 12 }, (_, i) => ({
      id: `FH${i + 1}`,
      name: `High-density feature ${i + 1}`,
      description: `Feature ${i + 1} of the high-density epic`,
      capabilityDomain: domains[i % domains.length]!,
      behaviors: [],
    }));
    const features = artifacts[featuresIdx]!.content as FeaturesContent;
    const mutatedFeatures: FeaturesContent = {
      ...features,
      features: [...features.features, ...synthFeatures],
    };

    const roadmap = artifacts[roadmapIdx]!.content as RoadmapContent;
    const mutatedRoadmap: RoadmapContent = {
      ...roadmap,
      epics: [
        ...roadmap.epics,
        {
          id: 'EPIC-EHIGH',
          name: 'High Density Epic',
          description: 'Synthetic high-density epic for narrative density tests',
          features: synthFeatures.map((f) => f.id),
          phase: 'phase-1',
          status: 'planned',
          priority: 9,
        },
      ],
    };

    const mutated: ArtifactResult[] = [...artifacts];
    mutated[featuresIdx] = {
      ...artifacts[featuresIdx]!,
      content: mutatedFeatures,
    } as ArtifactResult;
    mutated[roadmapIdx] = {
      ...artifacts[roadmapIdx]!,
      content: mutatedRoadmap,
    } as ArtifactResult;

    const ctx: ComposeContext = {
      epicId: 'EPIC-EHIGH',
      artifacts: mutated,
      graph: buildCrossRefGraph(mutated, null),
    };
    const narrative = composeEpicNarrativeDeterministic(ctx);

    expect(narrative.density).toBe('high');
    expect(narrative.featureCount).toBe(12);
    const featuresSection = narrative.sections.find((s) => s.id === 'features');
    expect(featuresSection).toBeDefined();
    expect(featuresSection!.subsections?.length).toBeGreaterThanOrEqual(3);
    // Subsection headings should reflect the distinct capability domains.
    const domainHeadings = featuresSection!.subsections!.map((s) => s.heading);
    expect(domainHeadings).toEqual(expect.arrayContaining(['Auth', 'Billing', 'Reporting']));
  });

  it('produces deep per-feature subsections when density is low (≤3 features)', () => {
    // Fixture E1 has 2 features — fits the "low" density mode.
    const ctx = buildCtx('E1');
    const narrative = composeEpicNarrativeDeterministic(ctx);
    expect(narrative.density).toBe('low');
    const featuresSection = narrative.sections.find((s) => s.id === 'features');
    expect(featuresSection).toBeDefined();
    expect(featuresSection!.subsections?.length).toBe(2);
    // Each feature subsection must have substantive content (>80 chars of text).
    const subsectionTextLengths = featuresSection!.subsections!.map(
      (sub) =>
        sub.chunks
          .filter((c) => c.type === 'text')
          .map((c) => (c as Extract<NarrativeChunk, { type: 'text' }>).text)
          .join('').length,
    );
    for (const len of subsectionTextLengths) {
      expect(len).toBeGreaterThan(80);
    }
  });
});

// ---------------------------------------------------------------------------
// Caching — hit, invalidation on content change
// ---------------------------------------------------------------------------

describe('narrative cache', () => {
  it('first call composes fresh; second call hits cache (VAL-PLAY-014)', () => {
    const ctx = buildCtx('E1');
    expect(narrativeCacheSize()).toBe(0);
    const first = getEpicNarrative(ctx);
    expect(first.fromCache).toBe(false);
    expect(narrativeCacheSize()).toBe(1);

    const second = getEpicNarrative(ctx);
    expect(second.fromCache).toBe(true);
    // Same narrative object reference → genuine cache hit.
    expect(second.narrative).toBe(first.narrative);
  });

  it('cache hit is sub-100ms on a warm cache (VAL-PLAY-014 perf)', () => {
    const ctx = buildCtx('E1');
    getEpicNarrative(ctx); // prime

    const start = performance.now();
    const second = getEpicNarrative(ctx);
    const elapsed = performance.now() - start;

    expect(second.fromCache).toBe(true);
    expect(elapsed).toBeLessThan(100);
  });

  it('invalidates the cache when underlying artifact content changes (VAL-PLAY-015)', () => {
    const artifacts = loadFixtureArtifacts();
    const ctx1: ComposeContext = {
      epicId: 'E1',
      artifacts,
      graph: buildCrossRefGraph(artifacts, null),
    };
    const first = getEpicNarrative(ctx1);
    expect(first.fromCache).toBe(false);

    // Mutate the roadmap entry for E1 to change epic description — this must
    // bust the content hash.
    const roadmapIdx = artifacts.findIndex((a) => a.type === 'roadmap');
    const roadmap = artifacts[roadmapIdx]!.content as RoadmapContent;
    const changed: RoadmapContent = {
      ...roadmap,
      epics: roadmap.epics.map((e) =>
        e.id === 'EPIC-E1' ? { ...e, description: 'Updated description' } : e,
      ),
    };
    const nextArtifacts: ArtifactResult[] = [...artifacts];
    nextArtifacts[roadmapIdx] = {
      ...artifacts[roadmapIdx]!,
      content: changed,
    } as ArtifactResult;

    const ctx2: ComposeContext = {
      epicId: 'E1',
      artifacts: nextArtifacts,
      graph: buildCrossRefGraph(nextArtifacts, null),
    };
    const second = getEpicNarrative(ctx2);
    expect(second.fromCache).toBe(false);
    expect(second.narrative.contentHash).not.toBe(first.narrative.contentHash);
  });

  it('invalidateNarrativeCache() clears all entries when called with no args', () => {
    getEpicNarrative(buildCtx('E1'));
    getEpicNarrative(buildCtx('E2'));
    expect(narrativeCacheSize()).toBe(2);
    invalidateNarrativeCache();
    expect(narrativeCacheSize()).toBe(0);
  });

  it('invalidateNarrativeCache("E1") clears only that epic', () => {
    getEpicNarrative(buildCtx('E1'));
    getEpicNarrative(buildCtx('E2'));
    invalidateNarrativeCache('E1');
    expect(narrativeCacheSize()).toBe(1);

    // Re-fetch E1 → miss again; E2 still cached.
    expect(getEpicNarrative(buildCtx('E1')).fromCache).toBe(false);
    expect(getEpicNarrative(buildCtx('E2')).fromCache).toBe(true);
  });
});
