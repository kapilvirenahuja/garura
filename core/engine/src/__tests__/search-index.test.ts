/**
 * Tests for MDB Search Index
 *
 * Covers: VAL-FOUND-039 through VAL-FOUND-045
 */

import path from 'node:path';
import { describe, it, expect, beforeAll } from 'vitest';
import { parseArtifact, parseArtifacts } from '../lib/artifact-parser';
import type { ArtifactResult } from '../lib/artifact-parser';
import { SearchIndex, createSearchIndex, extractDocuments } from '../lib/search-index';

// ---------------------------------------------------------------------------
// Paths to test fixtures
// ---------------------------------------------------------------------------

const FIXTURES_DIR = path.resolve(__dirname, '../../test-fixtures/artifacts');

function fixturePath(name: string): string {
  return path.join(FIXTURES_DIR, name);
}

// ---------------------------------------------------------------------------
// Shared state for fixture-based tests
// ---------------------------------------------------------------------------

let allArtifacts: ArtifactResult[];
let searchIndex: SearchIndex;

beforeAll(() => {
  // Parse all fixture artifacts
  allArtifacts = parseArtifacts([
    { path: fixturePath('product.yaml'), type: 'product' },
    { path: fixturePath('features.yaml'), type: 'features' },
    { path: fixturePath('scenarios.yaml'), type: 'scenarios' },
    { path: fixturePath('plan.yaml'), type: 'plan' },
    { path: fixturePath('architecture.yaml'), type: 'architecture' },
    { path: fixturePath('tech.yaml'), type: 'tech' },
    { path: fixturePath('roadmap.yaml'), type: 'roadmap' },
    { path: fixturePath('stm-evidence.yaml'), type: 'stm-evidence-yaml' },
    { path: fixturePath('stm-evidence.md'), type: 'stm-evidence-markdown' },
  ]);

  // Build search index from all artifacts
  searchIndex = createSearchIndex();
  searchIndex.build(allArtifacts, 'abc123');
});

// ---------------------------------------------------------------------------
// VAL-FOUND-039: Indexes All Artifacts on Startup
// ---------------------------------------------------------------------------

describe('VAL-FOUND-039: Indexes all artifacts on startup', () => {
  it('index document count matches total entity count from all artifacts', () => {
    const totalDocs = allArtifacts.reduce((sum, a) => sum + extractDocuments(a).length, 0);
    expect(searchIndex.getDocumentCount()).toBe(totalDocs);
    expect(totalDocs).toBeGreaterThan(0);
  });

  it('indexes product.yaml content', () => {
    const results = searchIndex.search('TaskFlow');
    expect(results.length).toBeGreaterThan(0);
    const productResult = results.find((r) => r.source_type === 'product');
    expect(productResult).toBeDefined();
  });

  it('indexes features.yaml content', () => {
    const results = searchIndex.search('Task Inbox');
    expect(results.length).toBeGreaterThan(0);
    const featureResult = results.find((r) => r.source_type === 'features');
    expect(featureResult).toBeDefined();
  });

  it('indexes scenarios.yaml content', () => {
    const results = searchIndex.search('priority');
    expect(results.length).toBeGreaterThan(0);
    const scenarioResult = results.find((r) => r.source_type === 'scenarios');
    expect(scenarioResult).toBeDefined();
  });

  it('indexes plan.yaml content', () => {
    const results = searchIndex.search('data model storage');
    expect(results.length).toBeGreaterThan(0);
    const planResult = results.find((r) => r.source_type === 'plan');
    expect(planResult).toBeDefined();
  });

  it('indexes architecture.yaml content', () => {
    const results = searchIndex.search('filesystem storage');
    expect(results.length).toBeGreaterThan(0);
    const archResult = results.find((r) => r.source_type === 'architecture');
    expect(archResult).toBeDefined();
  });

  it('indexes tech.yaml content', () => {
    const results = searchIndex.search('zod schema validation');
    expect(results.length).toBeGreaterThan(0);
    const techResult = results.find((r) => r.source_type === 'tech');
    expect(techResult).toBeDefined();
  });

  it('indexes roadmap.yaml content', () => {
    const results = searchIndex.search('AI Intelligence Layer');
    expect(results.length).toBeGreaterThan(0);
    const roadmapResult = results.find((r) => r.source_type === 'roadmap');
    expect(roadmapResult).toBeDefined();
  });

  it('indexes STM evidence YAML content', () => {
    const results = searchIndex.search('task inbox sorting');
    expect(results.length).toBeGreaterThan(0);
    const stmResult = results.find((r) => r.source_type === 'stm-evidence-yaml');
    expect(stmResult).toBeDefined();
  });

  it('indexes STM evidence Markdown content', () => {
    const results = searchIndex.search('commit-code');
    expect(results.length).toBeGreaterThan(0);
    const stmMdResult = results.find((r) => r.source_type === 'stm-evidence-markdown');
    expect(stmMdResult).toBeDefined();
  });

  it('builds index within 5 seconds for fixture artifacts', () => {
    const idx = createSearchIndex();
    const startTime = performance.now();
    idx.build(allArtifacts, 'perf-test');
    const elapsedMs = performance.now() - startTime;
    // Index build should complete well under 5 seconds (5000ms)
    expect(elapsedMs).toBeLessThan(5000);
  });
});

// ---------------------------------------------------------------------------
// VAL-FOUND-040: Relevance Ranking
// ---------------------------------------------------------------------------

describe('VAL-FOUND-040: Relevance ranking', () => {
  it('returns results ordered by descending score', () => {
    const results = searchIndex.search('task');
    expect(results.length).toBeGreaterThan(1);

    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1]!.score).toBeGreaterThanOrEqual(results[i]!.score);
    }
  });

  it('ranks exact title matches higher than general content', () => {
    // "Smart Prioritization" is a feature title (F2)
    const results = searchIndex.search('Smart Prioritization');
    expect(results.length).toBeGreaterThan(0);
    // The first result should be the F2 feature that has "Smart Prioritization" as its title
    const f2Result = results.find((r) => r.entity_id === 'F2');
    expect(f2Result).toBeDefined();
    // F2 should rank very high since its title matches exactly
    const f2Index = results.indexOf(f2Result!);
    expect(f2Index).toBeLessThan(3); // Should be in top 3
  });

  it('ranks specific entity ID matches higher than general content', () => {
    // Search for a specific scenario ID
    const results = searchIndex.search('SC-TASK-001');
    expect(results.length).toBeGreaterThan(0);
    // The first result should be the scenario with that ID
    expect(results[0]!.entity_id).toBe('SC-TASK-001');
  });

  it('boosts title field over content field', () => {
    // "Workflow Automation" is a feature title (F3) and epic name (EPIC-E3)
    // Both should rank high since they have it in their title
    const results = searchIndex.search('Workflow Automation');
    expect(results.length).toBeGreaterThan(0);
    const f3Result = results.find((r) => r.entity_id === 'F3');
    expect(f3Result).toBeDefined();
    // F3 should rank in top 3 (title match boosted over content-only matches)
    const f3Index = results.indexOf(f3Result!);
    expect(f3Index).toBeLessThan(3);
    // Also verify the top result has "Workflow Automation" in its title
    expect(results[0]!.title.toLowerCase()).toContain('workflow automation');
  });
});

// ---------------------------------------------------------------------------
// VAL-FOUND-041: Source Identification
// ---------------------------------------------------------------------------

describe('VAL-FOUND-041: Source identification per result', () => {
  it('each result has source_type field', () => {
    const results = searchIndex.search('task');
    expect(results.length).toBeGreaterThan(0);
    for (const result of results) {
      expect(result.source_type).toBeDefined();
      expect(typeof result.source_type).toBe('string');
      expect(result.source_type.length).toBeGreaterThan(0);
    }
  });

  it('each result has source_file field', () => {
    const results = searchIndex.search('task');
    expect(results.length).toBeGreaterThan(0);
    for (const result of results) {
      expect(result.source_file).toBeDefined();
      expect(typeof result.source_file).toBe('string');
      expect(result.source_file.length).toBeGreaterThan(0);
    }
  });

  it('each result has entity_id field', () => {
    const results = searchIndex.search('task');
    expect(results.length).toBeGreaterThan(0);
    for (const result of results) {
      expect(result.entity_id).toBeDefined();
      expect(typeof result.entity_id).toBe('string');
      expect(result.entity_id.length).toBeGreaterThan(0);
    }
  });

  it('source_type values are valid artifact types', () => {
    const validTypes = new Set([
      'product',
      'features',
      'scenarios',
      'plan',
      'architecture',
      'tech',
      'roadmap',
      'stm-evidence-yaml',
      'stm-evidence-markdown',
    ]);
    const results = searchIndex.search('task');
    for (const result of results) {
      expect(validTypes.has(result.source_type)).toBe(true);
    }
  });

  it('source_file contains actual file path', () => {
    const results = searchIndex.search('F1');
    const featureResult = results.find((r) => r.source_type === 'features');
    expect(featureResult).toBeDefined();
    expect(featureResult!.source_file).toContain('features.yaml');
  });

  it('entity_id identifies specific entity (F1, SC-TASK-001, ADR-001, etc.)', () => {
    // Feature
    const featureResults = searchIndex.search('Task Inbox');
    const f1 = featureResults.find((r) => r.entity_id === 'F1');
    expect(f1).toBeDefined();

    // Scenario
    const scenarioResults = searchIndex.search('SC-TASK-001');
    const sc = scenarioResults.find((r) => r.entity_id === 'SC-TASK-001');
    expect(sc).toBeDefined();

    // ADR
    const adrResults = searchIndex.search('ADR-001');
    const adr = adrResults.find((r) => r.entity_id === 'ADR-001');
    expect(adr).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// VAL-FOUND-042: Empty Results Handled
// ---------------------------------------------------------------------------

describe('VAL-FOUND-042: Empty results handled gracefully', () => {
  it('returns empty array for nonsense query', () => {
    const results = searchIndex.search('xyzzyplugh12345');
    expect(results).toEqual([]);
  });

  it('returns empty array for empty string query', () => {
    const results = searchIndex.search('');
    expect(results).toEqual([]);
  });

  it('returns empty array for whitespace-only query', () => {
    const results = searchIndex.search('   ');
    expect(results).toEqual([]);
  });

  it('returns empty array for tab/newline-only query', () => {
    const results = searchIndex.search('\t\n  \t');
    expect(results).toEqual([]);
  });

  it('empty result is a proper array (no errors thrown)', () => {
    const results = searchIndex.search('nonexistent_gibberish_text');
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// VAL-FOUND-043: Case-Insensitive Search
// ---------------------------------------------------------------------------

describe('VAL-FOUND-043: Case-insensitive search', () => {
  it('lowercase query returns same results as uppercase', () => {
    const lowerResults = searchIndex.search('taskflow');
    const upperResults = searchIndex.search('TASKFLOW');
    expect(lowerResults.length).toBeGreaterThan(0);
    expect(upperResults.length).toBeGreaterThan(0);
    // Same entity IDs should appear in both result sets
    const lowerIds = lowerResults.map((r) => r.entity_id).sort();
    const upperIds = upperResults.map((r) => r.entity_id).sort();
    expect(lowerIds).toEqual(upperIds);
  });

  it('mixed-case query returns same results', () => {
    const mixedResults = searchIndex.search('TaskFlow');
    const lowerResults = searchIndex.search('taskflow');
    expect(mixedResults.length).toBeGreaterThan(0);
    const mixedIds = mixedResults.map((r) => r.entity_id).sort();
    const lowerIds = lowerResults.map((r) => r.entity_id).sort();
    expect(mixedIds).toEqual(lowerIds);
  });

  it('three case variations return identical result sets', () => {
    const lower = searchIndex.search('automation');
    const upper = searchIndex.search('AUTOMATION');
    const title = searchIndex.search('Automation');

    expect(lower.length).toBeGreaterThan(0);
    expect(upper.length).toBe(lower.length);
    expect(title.length).toBe(lower.length);

    const lIds = lower.map((r) => r.entity_id).sort();
    const uIds = upper.map((r) => r.entity_id).sort();
    const tIds = title.map((r) => r.entity_id).sort();
    expect(uIds).toEqual(lIds);
    expect(tIds).toEqual(lIds);
  });
});

// ---------------------------------------------------------------------------
// VAL-FOUND-044: Incremental Update via Git Hash
// ---------------------------------------------------------------------------

describe('VAL-FOUND-044: Incremental update via git hash', () => {
  it('shouldRebuild returns true when no previous hash exists', () => {
    const idx = createSearchIndex();
    expect(idx.shouldRebuild('abc123')).toBe(true);
  });

  it('shouldRebuild returns false when hash matches', () => {
    const idx = createSearchIndex();
    idx.build(allArtifacts, 'hash-v1');
    expect(idx.shouldRebuild('hash-v1')).toBe(false);
  });

  it('shouldRebuild returns true when hash differs', () => {
    const idx = createSearchIndex();
    idx.build(allArtifacts, 'hash-v1');
    expect(idx.shouldRebuild('hash-v2')).toBe(true);
  });

  it('rebuild replaces index content on hash change', () => {
    const idx = createSearchIndex();

    // First build with all artifacts
    idx.build(allArtifacts, 'hash-v1');
    const originalCount = idx.getDocumentCount();
    expect(originalCount).toBeGreaterThan(0);

    // Second build with a subset (simulating change)
    const subset = allArtifacts.slice(0, 2);
    idx.build(subset, 'hash-v2');
    const newCount = idx.getDocumentCount();

    // New count should be different (smaller, since fewer artifacts)
    expect(newCount).toBeLessThan(originalCount);
    expect(newCount).toBeGreaterThan(0);
  });

  it('getLastGitHash returns the hash from the last build', () => {
    const idx = createSearchIndex();
    expect(idx.getLastGitHash()).toBeNull();

    idx.build(allArtifacts, 'my-hash');
    expect(idx.getLastGitHash()).toBe('my-hash');
  });

  it('same hash reuses index (no rebuild needed)', () => {
    const idx = createSearchIndex();
    idx.build(allArtifacts, 'stable-hash');
    const count1 = idx.getDocumentCount();

    // Don't rebuild — just check
    expect(idx.shouldRebuild('stable-hash')).toBe(false);
    // Document count should not change
    expect(idx.getDocumentCount()).toBe(count1);
  });

  it('new hash triggers different index state', () => {
    const idx = createSearchIndex();
    idx.build(allArtifacts, 'hash-A');

    // Search finds content
    const resultsBefore = idx.search('TaskFlow');
    expect(resultsBefore.length).toBeGreaterThan(0);

    // Rebuild with empty artifacts (simulating drastic change)
    idx.build([], 'hash-B');
    const resultsAfter = idx.search('TaskFlow');
    expect(resultsAfter.length).toBe(0);
    expect(idx.getLastGitHash()).toBe('hash-B');
  });
});

// ---------------------------------------------------------------------------
// VAL-FOUND-045: Special Characters in Search
// ---------------------------------------------------------------------------

describe('VAL-FOUND-045: Special characters in search queries', () => {
  it('handles hyphenated IDs: SC-AUTH-001 pattern', () => {
    // SC-TASK-001 exists in our fixtures
    const results = searchIndex.search('SC-TASK-001');
    expect(results.length).toBeGreaterThan(0);
    // Should not throw
  });

  it('handles hyphenated IDs: SC-AI-001 pattern', () => {
    const results = searchIndex.search('SC-AI-001');
    expect(results.length).toBeGreaterThan(0);
  });

  it('handles wiki tag pattern: [[play:prompt]]', () => {
    // Should not throw a regex error
    expect(() => searchIndex.search('[[play:prompt]]')).not.toThrow();
    const results = searchIndex.search('[[play:prompt]]');
    expect(Array.isArray(results)).toBe(true);
  });

  it('handles NFR ID pattern: NFR-SEC-01', () => {
    const results = searchIndex.search('NFR-SEC-01');
    expect(results.length).toBeGreaterThan(0);
    // Should find the NFR mapping from architecture
    const nfrResult = results.find((r) => r.entity_id === 'NFR-SEC-01');
    expect(nfrResult).toBeDefined();
  });

  it('handles NFR ID pattern: NFR-PERF-01', () => {
    const results = searchIndex.search('NFR-PERF-01');
    expect(results.length).toBeGreaterThan(0);
    const nfrResult = results.find((r) => r.entity_id === 'NFR-PERF-01');
    expect(nfrResult).toBeDefined();
  });

  it('handles ADR ID pattern: ADR-001', () => {
    const results = searchIndex.search('ADR-001');
    expect(results.length).toBeGreaterThan(0);
    const adrResult = results.find((r) => r.entity_id === 'ADR-001');
    expect(adrResult).toBeDefined();
  });

  it('handles EPIC ID pattern: EPIC-E1', () => {
    const results = searchIndex.search('EPIC-E1');
    expect(results.length).toBeGreaterThan(0);
    const epicResult = results.find((r) => r.entity_id === 'EPIC-E1');
    expect(epicResult).toBeDefined();
  });

  it('handles parentheses without regex error', () => {
    expect(() => searchIndex.search('(test)')).not.toThrow();
  });

  it('handles asterisks without regex error', () => {
    expect(() => searchIndex.search('F*')).not.toThrow();
  });

  it('handles plus signs without regex error', () => {
    expect(() => searchIndex.search('C++')).not.toThrow();
  });

  it('handles dots without regex error', () => {
    expect(() => searchIndex.search('v3.22')).not.toThrow();
  });

  it('handles colon in query', () => {
    expect(() => searchIndex.search('play:prompt')).not.toThrow();
  });

  it('handles pipe character', () => {
    expect(() => searchIndex.search('A | B')).not.toThrow();
  });

  it('handles curly braces', () => {
    expect(() => searchIndex.search('{json}')).not.toThrow();
  });

  it('handles backslash', () => {
    expect(() => searchIndex.search('path\\to\\file')).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// Document extraction tests
// ---------------------------------------------------------------------------

describe('extractDocuments', () => {
  it('returns empty array for missing artifact', () => {
    const artifact = parseArtifact('/nonexistent/path.yaml', 'product');
    const docs = extractDocuments(artifact);
    expect(docs).toEqual([]);
  });

  it('returns empty array for malformed artifact', () => {
    const artifact = parseArtifact(fixturePath('malformed.yaml'));
    const docs = extractDocuments(artifact);
    expect(docs).toEqual([]);
  });

  it('returns empty array for empty artifact', () => {
    const artifact = parseArtifact(fixturePath('empty.yaml'));
    const docs = extractDocuments(artifact);
    expect(docs).toEqual([]);
  });

  it('extracts product-level document with goals and constraints', () => {
    const artifact = parseArtifact(fixturePath('product.yaml'), 'product');
    const docs = extractDocuments(artifact);
    expect(docs.length).toBeGreaterThan(0);
    // Should have product-level doc + individual goals + constraints
    const productDoc = docs.find((d) => d.entity_id === 'product');
    expect(productDoc).toBeDefined();
    expect(productDoc!.title).toBe('TaskFlow');
  });

  it('extracts individual feature documents', () => {
    const artifact = parseArtifact(fixturePath('features.yaml'), 'features');
    const docs = extractDocuments(artifact);
    const f1 = docs.find((d) => d.entity_id === 'F1');
    const f2 = docs.find((d) => d.entity_id === 'F2');
    expect(f1).toBeDefined();
    expect(f2).toBeDefined();
    expect(f1!.title).toBe('Task Inbox');
    expect(f2!.title).toBe('Smart Prioritization');
  });

  it('extracts invariant documents', () => {
    const artifact = parseArtifact(fixturePath('features.yaml'), 'features');
    const docs = extractDocuments(artifact);
    const inv = docs.find((d) => d.entity_id === 'INV-TF-01');
    expect(inv).toBeDefined();
  });

  it('extracts scenario documents with feature refs', () => {
    const artifact = parseArtifact(fixturePath('scenarios.yaml'), 'scenarios');
    const docs = extractDocuments(artifact);
    const sc1 = docs.find((d) => d.entity_id === 'SC-TASK-001');
    expect(sc1).toBeDefined();
    expect(sc1!.content).toContain('F1');
  });

  it('extracts plan task and milestone documents', () => {
    const artifact = parseArtifact(fixturePath('plan.yaml'), 'plan');
    const docs = extractDocuments(artifact);
    const task = docs.find((d) => d.entity_id === 'T1.1');
    const milestone = docs.find((d) => d.entity_id === 'M1');
    expect(task).toBeDefined();
    expect(milestone).toBeDefined();
  });

  it('extracts architecture components, decisions, patterns, and NFRs', () => {
    const artifact = parseArtifact(fixturePath('architecture.yaml'), 'architecture');
    const docs = extractDocuments(artifact);
    const comp = docs.find((d) => d.entity_id === 'COMP-001');
    const adr = docs.find((d) => d.entity_id === 'ADR-001');
    const pat = docs.find((d) => d.entity_id === 'PAT-001');
    const nfr = docs.find((d) => d.entity_id === 'NFR-PERF-01');
    expect(comp).toBeDefined();
    expect(adr).toBeDefined();
    expect(pat).toBeDefined();
    expect(nfr).toBeDefined();
  });

  it('extracts roadmap epics and phases', () => {
    const artifact = parseArtifact(fixturePath('roadmap.yaml'), 'roadmap');
    const docs = extractDocuments(artifact);
    const epic = docs.find((d) => d.entity_id === 'EPIC-E1');
    const phase = docs.find((d) => d.entity_id === 'phase-1');
    expect(epic).toBeDefined();
    expect(phase).toBeDefined();
  });

  it('extracts tech components, data models, and libraries', () => {
    const artifact = parseArtifact(fixturePath('tech.yaml'), 'tech');
    const docs = extractDocuments(artifact);
    expect(docs.length).toBeGreaterThan(0);
    // Should have tech components
    const taskRepo = docs.find((d) => d.entity_id === 'tech-TaskRepository');
    expect(taskRepo).toBeDefined();
    // Should have data models
    const taskModel = docs.find((d) => d.entity_id === 'tech-model-Task');
    expect(taskModel).toBeDefined();
    // Should have libraries
    const zodLib = docs.find((d) => d.entity_id === 'tech-lib-zod');
    expect(zodLib).toBeDefined();
  });

  it('extracts STM evidence YAML documents', () => {
    const artifact = parseArtifact(fixturePath('stm-evidence.yaml'), 'stm-evidence-yaml');
    const docs = extractDocuments(artifact);
    expect(docs.length).toBe(1);
    expect(docs[0]!.source_type).toBe('stm-evidence-yaml');
    expect(docs[0]!.title).toContain('task inbox sorting');
  });

  it('extracts STM evidence Markdown documents', () => {
    const artifact = parseArtifact(fixturePath('stm-evidence.md'), 'stm-evidence-markdown');
    const docs = extractDocuments(artifact);
    expect(docs.length).toBe(1);
    expect(docs[0]!.source_type).toBe('stm-evidence-markdown');
    expect(docs[0]!.content).toContain('commit-code');
  });
});

// ---------------------------------------------------------------------------
// Factory function and constructor tests
// ---------------------------------------------------------------------------

describe('SearchIndex constructor and factory', () => {
  it('creates index via factory function', () => {
    const idx = createSearchIndex();
    expect(idx).toBeInstanceOf(SearchIndex);
    expect(idx.getDocumentCount()).toBe(0);
  });

  it('creates index with custom boost weights', () => {
    const idx = createSearchIndex({
      boostWeights: {
        title: 10,
        entity_id: 5,
        content: 1,
      },
    });
    idx.build(allArtifacts, 'test');
    expect(idx.getDocumentCount()).toBeGreaterThan(0);
  });

  it('fresh index has 0 documents', () => {
    const idx = new SearchIndex();
    expect(idx.getDocumentCount()).toBe(0);
  });

  it('fresh index returns empty for any search', () => {
    const idx = new SearchIndex();
    expect(idx.search('anything')).toEqual([]);
  });

  it('fresh index has null git hash', () => {
    const idx = new SearchIndex();
    expect(idx.getLastGitHash()).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

describe('Edge cases', () => {
  it('handles build with empty artifacts array', () => {
    const idx = createSearchIndex();
    idx.build([], 'empty-hash');
    expect(idx.getDocumentCount()).toBe(0);
    expect(idx.search('anything')).toEqual([]);
    expect(idx.getLastGitHash()).toBe('empty-hash');
  });

  it('handles build without git hash', () => {
    const idx = createSearchIndex();
    idx.build(allArtifacts);
    expect(idx.getDocumentCount()).toBeGreaterThan(0);
    expect(idx.getLastGitHash()).toBeNull();
    // shouldRebuild returns true when no hash was set
    expect(idx.shouldRebuild('any-hash')).toBe(true);
  });

  it('rebuild clears previous index data', () => {
    const idx = createSearchIndex();
    idx.build(allArtifacts, 'v1');
    const results1 = idx.search('TaskFlow');
    expect(results1.length).toBeGreaterThan(0);

    // Rebuild with empty
    idx.build([], 'v2');
    const results2 = idx.search('TaskFlow');
    expect(results2.length).toBe(0);
  });

  it('multiple sequential rebuilds work correctly', () => {
    const idx = createSearchIndex();

    idx.build(allArtifacts, 'v1');
    expect(idx.getDocumentCount()).toBeGreaterThan(0);

    idx.build([], 'v2');
    expect(idx.getDocumentCount()).toBe(0);

    idx.build(allArtifacts, 'v3');
    expect(idx.getDocumentCount()).toBeGreaterThan(0);

    const results = idx.search('TaskFlow');
    expect(results.length).toBeGreaterThan(0);
  });

  it('query with only special characters returns empty without error', () => {
    expect(() => searchIndex.search('[]{}()*+?.\\')).not.toThrow();
    const results = searchIndex.search('[]{}()*+?.\\');
    expect(Array.isArray(results)).toBe(true);
  });

  it('very long query does not crash', () => {
    const longQuery = 'task '.repeat(100);
    expect(() => searchIndex.search(longQuery)).not.toThrow();
  });

  it('single character query works', () => {
    expect(() => searchIndex.search('a')).not.toThrow();
  });
});
