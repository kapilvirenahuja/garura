/**
 * Entity Expansion resolver — unit tests.
 *
 * Verifies that resolveEntityExpansion produces:
 *   - Feature details with observable behaviours as facts (VAL-PLAY-003)
 *   - Scenario details with Given/When/Then facts
 *   - Connections section grouped by kind — parent feature, verification
 *     scenarios, implementation tasks, scenario gates (VAL-PLAY-024)
 *   - Dangling / unknown IDs return `found=false` without throwing
 *
 * Also verifies composeExplainFurther produces a multi-paragraph trace.
 */

import path from 'node:path';
import { describe, it, expect } from 'vitest';
import { parseArtifacts } from '@/lib/artifact-parser';
import { buildCrossRefGraph } from '@/lib/crossref-resolver';
import { composeExplainFurther, resolveEntityExpansion } from '@/lib/entity-expansion';

const FIXTURES_DIR = path.resolve(__dirname, '..', '..', 'test-fixtures', 'artifacts');

function loadArtifacts() {
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

describe('resolveEntityExpansion', () => {
  it('resolves a Feature and returns its name, description, domain, and behaviours', () => {
    const artifacts = loadArtifacts();
    const graph = buildCrossRefGraph(artifacts, null);
    const data = resolveEntityExpansion('F1', artifacts, graph);

    expect(data.found).toBe(true);
    expect(data.refId).toBe('F1');
    expect(data.typeLabel).toBe('Feature');
    expect(data.title).toBe('Task Inbox');
    expect(data.description).toContain('Unified inbox');
    expect(data.source).toBe('features.yaml');
    const factLabels = data.facts.map((f) => f.label);
    expect(factLabels).toContain('Capability domain');
    expect(factLabels).toContain('Observable behaviours');
  });

  it('surfaces verification-scenario connections for a Feature (VAL-PLAY-024)', () => {
    const artifacts = loadArtifacts();
    const graph = buildCrossRefGraph(artifacts, null);
    const data = resolveEntityExpansion('F1', artifacts, graph);
    const labels = data.connections.map((c) => c.label);
    expect(labels).toContain('Verification scenarios');
    const scenarios = data.connections.find((c) => c.label === 'Verification scenarios');
    expect(scenarios?.refIds.length ?? 0).toBeGreaterThan(0);
    // All scenario IDs follow the SC- pattern.
    for (const id of scenarios!.refIds) {
      expect(id).toMatch(/^SC-/);
    }
  });

  it('resolves a Scenario with Given/When/Then facts and a parent-feature connection', () => {
    const artifacts = loadArtifacts();
    const graph = buildCrossRefGraph(artifacts, null);
    // SC-AI-001 declares given/when/then explicitly in the fixture.
    const data = resolveEntityExpansion('SC-AI-001', artifacts, graph);

    expect(data.found).toBe(true);
    expect(data.typeLabel).toBe('Scenario');
    expect(data.source).toBe('scenarios.yaml');

    const factLabels = data.facts.map((f) => f.label);
    // At least one of the Given/When/Then facts should appear.
    expect(factLabels.some((l) => ['Given', 'When', 'Then'].includes(l))).toBe(true);

    // Parent feature connection is present.
    const parent = data.connections.find((c) => c.label.startsWith('Parent'));
    expect(parent).toBeDefined();
    expect(parent!.refIds).toContain('F2');
  });

  it('resolves an Epic with features listed as connections', () => {
    const artifacts = loadArtifacts();
    const graph = buildCrossRefGraph(artifacts, null);
    const data = resolveEntityExpansion('EPIC-E1', artifacts, graph);
    expect(data.found).toBe(true);
    expect(data.typeLabel).toBe('Epic');
    const features = data.connections.find((c) => c.label === 'Features');
    expect(features).toBeDefined();
    expect(features!.refIds).toEqual(expect.arrayContaining(['F1', 'F4']));
  });

  it('returns found=false for an unknown reference without throwing', () => {
    const artifacts = loadArtifacts();
    const graph = buildCrossRefGraph(artifacts, null);
    const data = resolveEntityExpansion('F999', artifacts, graph);
    expect(data.found).toBe(false);
    expect(data.refId).toBe('F999');
    expect(data.connections).toEqual([]);
  });
});

describe('composeExplainFurther', () => {
  it('produces multiple paragraphs for a known feature', () => {
    const artifacts = loadArtifacts();
    const graph = buildCrossRefGraph(artifacts, null);
    const result = composeExplainFurther('F1', artifacts, graph);
    expect(result.paragraphs.length).toBeGreaterThanOrEqual(2);
    // Traces connections — mentions at least one connected ID.
    const joined = result.paragraphs.join('\n');
    expect(joined).toMatch(/(SC-|F\d+|EPIC-)/);
  });

  it('returns a dangling-reference message for an unknown id', () => {
    const artifacts = loadArtifacts();
    const graph = buildCrossRefGraph(artifacts, null);
    const result = composeExplainFurther('SC-UNKNOWN-999', artifacts, graph);
    expect(result.paragraphs.length).toBeGreaterThan(0);
    expect(result.paragraphs.join(' ')).toMatch(/dangling/i);
  });
});
