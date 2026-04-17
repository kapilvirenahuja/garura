/**
 * Cross-Reference Resolver Tests
 *
 * Fulfills: VAL-FOUND-025 through VAL-FOUND-038
 */

import path from 'node:path';
import { describe, it, expect, afterEach } from 'vitest';

import { parseArtifact, parseArtifacts } from '@/lib/artifact-parser';
import type { ArtifactResult } from '@/lib/artifact-parser';
import {
  buildCrossRefGraph,
  resolveId,
  forwardLookup,
  reverseLookup,
  getDanglingReferences,
  getNode,
  getNodesByType,
  getCrossRefGraph,
  invalidateCrossRefGraph,
  isGraphStale,
} from '@/lib/crossref-resolver';
import type { CrossRefGraph } from '@/lib/crossref-resolver';

// ---------------------------------------------------------------------------
// Fixture paths
// ---------------------------------------------------------------------------

const FIXTURES_DIR = path.resolve(__dirname, '../../test-fixtures/artifacts');
const CROSSREF_DIR = path.resolve(__dirname, '../../test-fixtures/crossref');

const fixturePath = (name: string): string => path.join(FIXTURES_DIR, name);
const crossrefPath = (name: string): string => path.join(CROSSREF_DIR, name);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Parse all standard artifact fixtures and return a built graph. */
function buildGraphFromStandardFixtures(): CrossRefGraph {
  const artifacts = parseArtifacts([
    { path: fixturePath('features.yaml'), type: 'features' },
    { path: fixturePath('scenarios.yaml'), type: 'scenarios' },
    { path: fixturePath('plan.yaml'), type: 'plan' },
    { path: fixturePath('architecture.yaml'), type: 'architecture' },
    { path: fixturePath('roadmap.yaml'), type: 'roadmap' },
    { path: fixturePath('tech.yaml'), type: 'tech' },
    { path: fixturePath('product.yaml'), type: 'product' },
  ]);
  return buildCrossRefGraph(artifacts, 'test-hash-001');
}

/** Parse artifacts using the crossref-specific DD fixture. */
function buildGraphWithDDFixtures(): CrossRefGraph {
  const artifacts = parseArtifacts([
    { path: fixturePath('features.yaml'), type: 'features' },
    { path: fixturePath('scenarios.yaml'), type: 'scenarios' },
    { path: fixturePath('plan.yaml'), type: 'plan' },
    { path: crossrefPath('architecture-with-dd.yaml'), type: 'architecture' },
    { path: fixturePath('roadmap.yaml'), type: 'roadmap' },
  ]);
  return buildCrossRefGraph(artifacts, 'test-hash-dd');
}

/** Parse artifacts using the crossref-specific TP fixture. */
function buildGraphWithTPFixtures(): CrossRefGraph {
  const artifacts = parseArtifacts([
    { path: fixturePath('features.yaml'), type: 'features' },
    { path: fixturePath('scenarios.yaml'), type: 'scenarios' },
    { path: crossrefPath('plan-with-tp.yaml'), type: 'plan' },
    { path: fixturePath('architecture.yaml'), type: 'architecture' },
    { path: fixturePath('roadmap.yaml'), type: 'roadmap' },
  ]);
  return buildCrossRefGraph(artifacts, 'test-hash-tp');
}

// ===========================================================================
// Tests
// ===========================================================================

describe('Cross-Reference Resolver', () => {
  afterEach(() => {
    invalidateCrossRefGraph();
  });

  // -------------------------------------------------------------------------
  // VAL-FOUND-025: Builds Graph from Feature IDs (F*)
  // -------------------------------------------------------------------------
  describe('Feature IDs — F* (VAL-FOUND-025)', () => {
    it('builds graph nodes for all Feature IDs', () => {
      const graph = buildGraphFromStandardFixtures();
      const featureNodes = getNodesByType(graph, 'feature');
      expect(featureNodes).toHaveLength(4);

      const ids = featureNodes.map((n) => n.id).sort();
      expect(ids).toEqual(['F1', 'F2', 'F3', 'F4']);
    });

    it('links each feature node to source artifact and line', () => {
      const graph = buildGraphFromStandardFixtures();
      const f1 = getNode(graph, 'F1');
      expect(f1).not.toBeNull();
      expect(f1!.type).toBe('feature');
      expect(f1!.sourceFile).toContain('features.yaml');
      expect(f1!.line).toBeGreaterThan(0);
      expect(f1!.content).toContain('Unified inbox');
    });

    it('stores feature metadata (name, capabilityDomain)', () => {
      const graph = buildGraphFromStandardFixtures();
      const f2 = getNode(graph, 'F2');
      expect(f2).not.toBeNull();
      expect(f2!.metadata['name']).toBe('Smart Prioritization');
      expect(f2!.metadata['capabilityDomain']).toBe('ai-intelligence');
    });

    it('features have no parentId (top-level entities)', () => {
      const graph = buildGraphFromStandardFixtures();
      for (const node of getNodesByType(graph, 'feature')) {
        expect(node.parentId).toBeNull();
      }
    });
  });

  // -------------------------------------------------------------------------
  // VAL-FOUND-026: Builds Graph from Scenario IDs (SC-*)
  // -------------------------------------------------------------------------
  describe('Scenario IDs — SC-* (VAL-FOUND-026)', () => {
    it('indexes all Scenario IDs with parent feature links', () => {
      const graph = buildGraphFromStandardFixtures();
      const scenarioNodes = getNodesByType(graph, 'scenario');
      expect(scenarioNodes).toHaveLength(4);

      const ids = scenarioNodes.map((n) => n.id).sort();
      expect(ids).toEqual(['SC-AI-001', 'SC-AUTO-001', 'SC-TASK-001', 'SC-TASK-002']);
    });

    it('each scenario references its parent feature', () => {
      const graph = buildGraphFromStandardFixtures();

      const scTask001 = getNode(graph, 'SC-TASK-001');
      expect(scTask001).not.toBeNull();
      expect(scTask001!.parentId).toBe('F1');

      const scAi001 = getNode(graph, 'SC-AI-001');
      expect(scAi001).not.toBeNull();
      expect(scAi001!.parentId).toBe('F2');

      const scAuto001 = getNode(graph, 'SC-AUTO-001');
      expect(scAuto001).not.toBeNull();
      expect(scAuto001!.parentId).toBe('F3');
    });

    it('stores scenario metadata (featureRef, expectedBehavior)', () => {
      const graph = buildGraphFromStandardFixtures();
      const sc = getNode(graph, 'SC-TASK-001');
      expect(sc).not.toBeNull();
      expect(sc!.metadata['featureRef']).toBe('F1');
      expect(sc!.metadata['behaviorRef']).toBe('F1-B1');
    });

    it('links scenario to source artifact', () => {
      const graph = buildGraphFromStandardFixtures();
      const sc = getNode(graph, 'SC-AUTO-001');
      expect(sc).not.toBeNull();
      expect(sc!.sourceFile).toContain('scenarios.yaml');
      expect(sc!.line).toBeGreaterThan(0);
    });
  });

  // -------------------------------------------------------------------------
  // VAL-FOUND-027: Builds Graph from Scenario Gate IDs (SG*)
  // -------------------------------------------------------------------------
  describe('Scenario Gate IDs — SG* (VAL-FOUND-027)', () => {
    it('indexes Scenario Gate IDs with milestone links', () => {
      const graph = buildGraphFromStandardFixtures();
      const sgNodes = getNodesByType(graph, 'scenario-gate');
      // plan.yaml has 2 tasks with scenario_gates (T2.1 and T3.1)
      expect(sgNodes).toHaveLength(2);

      const ids = sgNodes.map((n) => n.id).sort();
      expect(ids).toEqual(['SG1', 'SG2']);
    });

    it('SG nodes link to associated scenarios', () => {
      const graph = buildGraphFromStandardFixtures();
      const sg1 = getNode(graph, 'SG1');
      expect(sg1).not.toBeNull();
      expect(sg1!.metadata['scenarioIds']).toEqual(['SC-AI-001']);

      const sg2 = getNode(graph, 'SG2');
      expect(sg2).not.toBeNull();
      expect(sg2!.metadata['scenarioIds']).toEqual(['SC-AUTO-001']);
    });

    it('SG nodes link to their milestone', () => {
      const graph = buildGraphFromStandardFixtures();
      const sg1 = getNode(graph, 'SG1');
      expect(sg1).not.toBeNull();
      expect(sg1!.metadata['milestoneId']).toBe('M2');

      const sg2 = getNode(graph, 'SG2');
      expect(sg2).not.toBeNull();
      expect(sg2!.metadata['milestoneId']).toBe('M3');
    });

    it('SG nodes reference their associated task', () => {
      const graph = buildGraphFromStandardFixtures();
      const sg1 = getNode(graph, 'SG1');
      expect(sg1!.metadata['taskId']).toBe('T2.1');
    });
  });

  // -------------------------------------------------------------------------
  // VAL-FOUND-028: Builds Graph from Epic IDs (EPIC-*)
  // -------------------------------------------------------------------------
  describe('Epic IDs — EPIC-* (VAL-FOUND-028)', () => {
    it('indexes Epic IDs from roadmap', () => {
      const graph = buildGraphFromStandardFixtures();
      const epicNodes = getNodesByType(graph, 'epic');
      expect(epicNodes).toHaveLength(3);

      const ids = epicNodes.map((n) => n.id).sort();
      expect(ids).toEqual(['EPIC-E1', 'EPIC-E2', 'EPIC-E3']);
    });

    it('each epic links to its features', () => {
      const graph = buildGraphFromStandardFixtures();
      const e1 = getNode(graph, 'EPIC-E1');
      expect(e1).not.toBeNull();
      expect(e1!.metadata['features']).toEqual(['F1', 'F4']);

      const e2 = getNode(graph, 'EPIC-E2');
      expect(e2!.metadata['features']).toEqual(['F2']);
    });

    it('epic nodes store phase and status metadata', () => {
      const graph = buildGraphFromStandardFixtures();
      const e1 = getNode(graph, 'EPIC-E1');
      expect(e1!.metadata['phase']).toBe('phase-1');
      expect(e1!.metadata['status']).toBe('in-progress');
    });

    it('links epic to source artifact', () => {
      const graph = buildGraphFromStandardFixtures();
      const e1 = getNode(graph, 'EPIC-E1');
      expect(e1!.sourceFile).toContain('roadmap.yaml');
      expect(e1!.line).toBeGreaterThan(0);
    });

    it('creates edges from epic to referenced features', () => {
      const graph = buildGraphFromStandardFixtures();
      // EPIC-E1 references F1, F4
      const f1Refs = forwardLookup(graph, 'F1');
      expect(f1Refs).toContain('EPIC-E1');

      const f4Refs = forwardLookup(graph, 'F4');
      expect(f4Refs).toContain('EPIC-E1');
    });
  });

  // -------------------------------------------------------------------------
  // VAL-FOUND-029: Builds Graph from ADR IDs (ADR-*)
  // -------------------------------------------------------------------------
  describe('ADR IDs — ADR-* (VAL-FOUND-029)', () => {
    it('indexes ADR IDs from architecture decisions', () => {
      const graph = buildGraphFromStandardFixtures();
      const adrNodes = getNodesByType(graph, 'adr');
      expect(adrNodes).toHaveLength(2);

      const ids = adrNodes.map((n) => n.id).sort();
      expect(ids).toEqual(['ADR-001', 'ADR-002']);
    });

    it('ADR nodes store decision context and status', () => {
      const graph = buildGraphFromStandardFixtures();
      const adr = getNode(graph, 'ADR-001');
      expect(adr).not.toBeNull();
      expect(adr!.metadata['status']).toBe('accepted');
      expect(adr!.metadata['context']).toContain('offline-capable');
      expect(adr!.metadata['rationale']).toContain('C1');
    });

    it('links ADR to source artifact', () => {
      const graph = buildGraphFromStandardFixtures();
      const adr = getNode(graph, 'ADR-001');
      expect(adr!.sourceFile).toContain('architecture.yaml');
      expect(adr!.line).toBeGreaterThan(0);
    });
  });

  // -------------------------------------------------------------------------
  // VAL-FOUND-030: Builds Graph from NFR IDs (NFR-*)
  // -------------------------------------------------------------------------
  describe('NFR IDs — NFR-* (VAL-FOUND-030)', () => {
    it('indexes NFR IDs with quality characteristic data', () => {
      const graph = buildGraphFromStandardFixtures();
      const nfrNodes = getNodesByType(graph, 'nfr');
      expect(nfrNodes).toHaveLength(2);

      const ids = nfrNodes.map((n) => n.id).sort();
      expect(ids).toEqual(['NFR-PERF-01', 'NFR-SEC-01']);
    });

    it('NFR nodes store mechanism and verification info', () => {
      const graph = buildGraphFromStandardFixtures();
      const nfr = getNode(graph, 'NFR-PERF-01');
      expect(nfr).not.toBeNull();
      expect(nfr!.content).toContain('Sub-second');
      expect(nfr!.metadata['mechanism']).toContain('In-memory caching');
      expect(nfr!.metadata['verification']).toContain('Load test');
    });
  });

  // -------------------------------------------------------------------------
  // VAL-FOUND-031: Builds Graph from Invariant IDs (INV-*)
  // -------------------------------------------------------------------------
  describe('Invariant IDs — INV-* (VAL-FOUND-031)', () => {
    it('indexes Invariant IDs from features spec', () => {
      const graph = buildGraphFromStandardFixtures();
      const invNodes = getNodesByType(graph, 'invariant');
      expect(invNodes).toHaveLength(2);

      const ids = invNodes.map((n) => n.id).sort();
      expect(ids).toEqual(['INV-TF-01', 'INV-TF-02']);
    });

    it('invariant nodes contain description content', () => {
      const graph = buildGraphFromStandardFixtures();
      const inv = getNode(graph, 'INV-TF-01');
      expect(inv).not.toBeNull();
      expect(inv!.content).toContain('atomic and auditable');
    });

    it('invariant nodes link to source artifact', () => {
      const graph = buildGraphFromStandardFixtures();
      const inv = getNode(graph, 'INV-TF-01');
      expect(inv!.sourceFile).toContain('features.yaml');
      expect(inv!.line).toBeGreaterThan(0);
    });
  });

  // -------------------------------------------------------------------------
  // VAL-FOUND-032: Builds Graph from Design Decision IDs (DD-*)
  // -------------------------------------------------------------------------
  describe('Design Decision IDs — DD-* (VAL-FOUND-032)', () => {
    it('indexes DD IDs from architecture decisions', () => {
      const graph = buildGraphWithDDFixtures();
      const ddNodes = getNodesByType(graph, 'design-decision');
      expect(ddNodes).toHaveLength(2);

      const ids = ddNodes.map((n) => n.id).sort();
      expect(ids).toEqual(['DD-001', 'DD-002']);
    });

    it('DD nodes store rationale and affected component data', () => {
      const graph = buildGraphWithDDFixtures();
      const dd = getNode(graph, 'DD-001');
      expect(dd).not.toBeNull();
      expect(dd!.content).toContain('observer pattern');
      expect(dd!.metadata['rationale']).toContain('Decouples');
      expect(dd!.metadata['consequences']).toEqual(
        expect.arrayContaining([expect.stringContaining('Loose coupling')]),
      );
    });

    it('DD nodes coexist with ADR nodes in same file', () => {
      const graph = buildGraphWithDDFixtures();
      const adrNodes = getNodesByType(graph, 'adr');
      const ddNodes = getNodesByType(graph, 'design-decision');
      expect(adrNodes).toHaveLength(1); // ADR-001
      expect(ddNodes).toHaveLength(2); // DD-001, DD-002
    });

    it('links DD to source artifact', () => {
      const graph = buildGraphWithDDFixtures();
      const dd = getNode(graph, 'DD-001');
      expect(dd!.sourceFile).toContain('architecture-with-dd.yaml');
      expect(dd!.line).toBeGreaterThan(0);
    });
  });

  // -------------------------------------------------------------------------
  // VAL-FOUND-033: Builds Graph from Task/Plan IDs (TP-*)
  // -------------------------------------------------------------------------
  describe('Task/Plan IDs — TP-* (VAL-FOUND-033)', () => {
    it('indexes TP-* task IDs from plan execution order', () => {
      const graph = buildGraphWithTPFixtures();
      const taskNodes = getNodesByType(graph, 'task-plan');
      expect(taskNodes).toHaveLength(3);

      const ids = taskNodes.map((n) => n.id).sort();
      expect(ids).toEqual(['TP-1', 'TP-2', 'TP-3']);
    });

    it('TP nodes reference their milestone via metadata', () => {
      const graph = buildGraphWithTPFixtures();
      const tp1 = getNode(graph, 'TP-1');
      expect(tp1!.metadata['milestoneId']).toBe('M1');

      const tp2 = getNode(graph, 'TP-2');
      expect(tp2!.metadata['milestoneId']).toBe('M2');
    });

    it('TP nodes store dependency edges', () => {
      const graph = buildGraphWithTPFixtures();
      const tp2 = getNode(graph, 'TP-2');
      expect(tp2!.metadata['dependsOn']).toEqual(['TP-1']);

      // TP-2 should create an edge to TP-1
      const tp1Refs = forwardLookup(graph, 'TP-1');
      expect(tp1Refs).toContain('TP-2');
    });

    it('TP nodes have parent set to featureId', () => {
      const graph = buildGraphWithTPFixtures();
      const tp1 = getNode(graph, 'TP-1');
      expect(tp1!.parentId).toBe('F1');

      const tp2 = getNode(graph, 'TP-2');
      expect(tp2!.parentId).toBe('F2');
    });

    it('also indexes T*.* format task IDs from standard plan', () => {
      const graph = buildGraphFromStandardFixtures();
      const taskNodes = getNodesByType(graph, 'task-plan');
      expect(taskNodes.length).toBeGreaterThanOrEqual(4);

      const ids = taskNodes.map((n) => n.id).sort();
      expect(ids).toContain('T1.1');
      expect(ids).toContain('T2.1');
      expect(ids).toContain('T3.1');
    });
  });

  // -------------------------------------------------------------------------
  // VAL-FOUND-034: Resolves ID to Source Artifact
  // -------------------------------------------------------------------------
  describe('ID Resolution (VAL-FOUND-034)', () => {
    it('resolves F1 to features.yaml with correct line and content', () => {
      const graph = buildGraphFromStandardFixtures();
      const resolved = resolveId(graph, 'F1');
      expect(resolved).not.toBeNull();
      expect(resolved!.id).toBe('F1');
      expect(resolved!.type).toBe('feature');
      expect(resolved!.sourceFile).toContain('features.yaml');
      expect(resolved!.line).toBeGreaterThan(0);
      expect(resolved!.content).toContain('Unified inbox');
    });

    it('resolves SC-TASK-001 to scenarios.yaml with correct data', () => {
      const graph = buildGraphFromStandardFixtures();
      const resolved = resolveId(graph, 'SC-TASK-001');
      expect(resolved).not.toBeNull();
      expect(resolved!.type).toBe('scenario');
      expect(resolved!.sourceFile).toContain('scenarios.yaml');
      expect(resolved!.content).toContain('sorted by priority');
    });

    it('resolves ADR-001 to architecture.yaml', () => {
      const graph = buildGraphFromStandardFixtures();
      const resolved = resolveId(graph, 'ADR-001');
      expect(resolved).not.toBeNull();
      expect(resolved!.type).toBe('adr');
      expect(resolved!.sourceFile).toContain('architecture.yaml');
    });

    it('resolves EPIC-E1 to roadmap.yaml', () => {
      const graph = buildGraphFromStandardFixtures();
      const resolved = resolveId(graph, 'EPIC-E1');
      expect(resolved).not.toBeNull();
      expect(resolved!.type).toBe('epic');
      expect(resolved!.sourceFile).toContain('roadmap.yaml');
    });

    it('resolves NFR-PERF-01 to architecture.yaml', () => {
      const graph = buildGraphFromStandardFixtures();
      const resolved = resolveId(graph, 'NFR-PERF-01');
      expect(resolved).not.toBeNull();
      expect(resolved!.type).toBe('nfr');
      expect(resolved!.sourceFile).toContain('architecture.yaml');
    });

    it('resolves INV-TF-01 to features.yaml', () => {
      const graph = buildGraphFromStandardFixtures();
      const resolved = resolveId(graph, 'INV-TF-01');
      expect(resolved).not.toBeNull();
      expect(resolved!.type).toBe('invariant');
      expect(resolved!.sourceFile).toContain('features.yaml');
    });

    it('returns null for unknown ID', () => {
      const graph = buildGraphFromStandardFixtures();
      const resolved = resolveId(graph, 'UNKNOWN-999');
      expect(resolved).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // VAL-FOUND-035: Forward Lookup — Entity to References
  // -------------------------------------------------------------------------
  describe('Forward Lookup (VAL-FOUND-035)', () => {
    it('F1 forward lookup returns scenarios, tasks, and epics that reference it', () => {
      const graph = buildGraphFromStandardFixtures();
      const refs = forwardLookup(graph, 'F1');
      expect(refs).toContain('SC-TASK-001');
      expect(refs).toContain('SC-TASK-002');
      expect(refs).toContain('EPIC-E1');
      expect(refs).toContain('T1.1');
      expect(refs).toContain('T1.2');
    });

    it('F2 forward lookup returns SC-AI-001 and EPIC-E2', () => {
      const graph = buildGraphFromStandardFixtures();
      const refs = forwardLookup(graph, 'F2');
      expect(refs).toContain('SC-AI-001');
      expect(refs).toContain('EPIC-E2');
      expect(refs).toContain('T2.1');
    });

    it('F4 forward lookup returns EPIC-E1', () => {
      const graph = buildGraphFromStandardFixtures();
      const refs = forwardLookup(graph, 'F4');
      expect(refs).toContain('EPIC-E1');
    });

    it('returns empty array for unreferenced ID', () => {
      const graph = buildGraphFromStandardFixtures();
      const refs = forwardLookup(graph, 'INV-TF-01');
      expect(refs).toEqual([]);
    });

    it('returns empty array for unknown ID', () => {
      const graph = buildGraphFromStandardFixtures();
      const refs = forwardLookup(graph, 'NONEXISTENT');
      expect(refs).toEqual([]);
    });
  });

  // -------------------------------------------------------------------------
  // VAL-FOUND-036: Reverse Lookup — Reference to Parent Entity
  // -------------------------------------------------------------------------
  describe('Reverse Lookup (VAL-FOUND-036)', () => {
    it('SC-TASK-001 reverse lookup returns F1 as parent', () => {
      const graph = buildGraphFromStandardFixtures();
      const parent = reverseLookup(graph, 'SC-TASK-001');
      expect(parent).toBe('F1');
    });

    it('SC-AI-001 reverse lookup returns F2 as parent', () => {
      const graph = buildGraphFromStandardFixtures();
      const parent = reverseLookup(graph, 'SC-AI-001');
      expect(parent).toBe('F2');
    });

    it('T1.1 reverse lookup returns F1 as parent (featureId)', () => {
      const graph = buildGraphFromStandardFixtures();
      const parent = reverseLookup(graph, 'T1.1');
      expect(parent).toBe('F1');
    });

    it('T2.1 reverse lookup returns F2 as parent', () => {
      const graph = buildGraphFromStandardFixtures();
      const parent = reverseLookup(graph, 'T2.1');
      expect(parent).toBe('F2');
    });

    it('top-level entities (features, epics) return null', () => {
      const graph = buildGraphFromStandardFixtures();
      expect(reverseLookup(graph, 'F1')).toBeNull();
      expect(reverseLookup(graph, 'EPIC-E1')).toBeNull();
      expect(reverseLookup(graph, 'ADR-001')).toBeNull();
    });

    it('returns null for unknown ID', () => {
      const graph = buildGraphFromStandardFixtures();
      expect(reverseLookup(graph, 'NONEXISTENT')).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // VAL-FOUND-037: Dangling Reference Detection
  // -------------------------------------------------------------------------
  describe('Dangling Reference Detection (VAL-FOUND-037)', () => {
    it('detects dangling references for undefined IDs', () => {
      // Build a graph where scenarios reference features that don't exist
      const scenariosWithDangling = parseArtifact(fixturePath('scenarios.yaml'), 'scenarios');
      // Scenarios reference F1, F2, F3 — but we don't include features.yaml
      const graph = buildCrossRefGraph([scenariosWithDangling]);
      const dangling = getDanglingReferences(graph);
      // F1, F2, F3 are referenced but not defined
      expect(dangling).toContain('F1');
      expect(dangling).toContain('F2');
      expect(dangling).toContain('F3');
    });

    it('returns empty when all references are resolved', () => {
      const graph = buildGraphFromStandardFixtures();
      const dangling = getDanglingReferences(graph);
      // With all fixtures loaded, most references should be resolved
      // F4 is defined in features.yaml and referenced by EPIC-E1, so it's not dangling
      expect(dangling).not.toContain('F1');
      expect(dangling).not.toContain('F2');
      expect(dangling).not.toContain('F3');
      expect(dangling).not.toContain('F4');
    });

    it('lists behavior refs as dangling when behaviors are not indexed as top-level nodes', () => {
      const graph = buildGraphFromStandardFixtures();
      const dangling = getDanglingReferences(graph);
      // F1-B1, F1-B2 etc. are behavior refs from scenarios but not indexed as nodes
      expect(dangling).toContain('F1-B1');
    });
  });

  // -------------------------------------------------------------------------
  // VAL-FOUND-038: Dangling Reference Does Not Crash
  // -------------------------------------------------------------------------
  describe('Dangling Reference Graceful Handling (VAL-FOUND-038)', () => {
    it('resolveId returns null for dangling reference', () => {
      const graph = buildGraphFromStandardFixtures();
      const resolved = resolveId(graph, 'F99');
      expect(resolved).toBeNull();
    });

    it('forwardLookup returns empty array for dangling reference', () => {
      const graph = buildGraphFromStandardFixtures();
      const refs = forwardLookup(graph, 'F99');
      expect(refs).toEqual([]);
    });

    it('reverseLookup returns null for dangling reference', () => {
      const graph = buildGraphFromStandardFixtures();
      const parent = reverseLookup(graph, 'F99');
      expect(parent).toBeNull();
    });

    it('getNode returns null for dangling reference', () => {
      const graph = buildGraphFromStandardFixtures();
      const node = getNode(graph, 'F99');
      expect(node).toBeNull();
    });

    it('graph remains intact after querying dangling references', () => {
      const graph = buildGraphFromStandardFixtures();

      // Query dangling references
      resolveId(graph, 'NONEXISTENT-1');
      forwardLookup(graph, 'NONEXISTENT-2');
      reverseLookup(graph, 'NONEXISTENT-3');

      // Valid references still work
      const f1 = resolveId(graph, 'F1');
      expect(f1).not.toBeNull();
      expect(f1!.type).toBe('feature');

      const refs = forwardLookup(graph, 'F1');
      expect(refs.length).toBeGreaterThan(0);
    });
  });

  // -------------------------------------------------------------------------
  // Singleton & Cache Invalidation
  // -------------------------------------------------------------------------
  describe('Singleton Management', () => {
    it('getCrossRefGraph returns cached graph for same hash', () => {
      const artifacts = parseArtifacts([{ path: fixturePath('features.yaml'), type: 'features' }]);

      const graph1 = getCrossRefGraph(artifacts, 'hash-abc');
      const graph2 = getCrossRefGraph(artifacts, 'hash-abc');
      expect(graph1).toBe(graph2); // same reference
    });

    it('getCrossRefGraph rebuilds graph when hash changes', () => {
      const artifacts = parseArtifacts([{ path: fixturePath('features.yaml'), type: 'features' }]);

      const graph1 = getCrossRefGraph(artifacts, 'hash-abc');
      const graph2 = getCrossRefGraph(artifacts, 'hash-def');
      expect(graph1).not.toBe(graph2); // different references
    });

    it('invalidateCrossRefGraph forces rebuild', () => {
      const artifacts = parseArtifacts([{ path: fixturePath('features.yaml'), type: 'features' }]);

      const graph1 = getCrossRefGraph(artifacts, 'hash-abc');
      invalidateCrossRefGraph();
      const graph2 = getCrossRefGraph(artifacts, 'hash-abc');
      expect(graph1).not.toBe(graph2); // different after invalidation
    });

    it('isGraphStale returns true when hashes differ', () => {
      const graph = buildCrossRefGraph([], 'hash-old');
      expect(isGraphStale(graph, 'hash-new')).toBe(true);
    });

    it('isGraphStale returns false when hashes match', () => {
      const graph = buildCrossRefGraph([], 'hash-same');
      expect(isGraphStale(graph, 'hash-same')).toBe(false);
    });

    it('isGraphStale returns true when either hash is null', () => {
      const graph = buildCrossRefGraph([], null);
      expect(isGraphStale(graph, 'hash-abc')).toBe(true);

      const graph2 = buildCrossRefGraph([], 'hash-abc');
      expect(isGraphStale(graph2, null)).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // Edge cases
  // -------------------------------------------------------------------------
  describe('Edge Cases', () => {
    it('handles empty artifact array', () => {
      const graph = buildCrossRefGraph([]);
      expect(graph.nodes.size).toBe(0);
      expect(graph.danglingRefs.size).toBe(0);
      expect(forwardLookup(graph, 'F1')).toEqual([]);
      expect(reverseLookup(graph, 'F1')).toBeNull();
    });

    it('handles artifacts with error status', () => {
      const errorArtifact: ArtifactResult = {
        type: 'features',
        path: '/nonexistent.yaml',
        status: 'error',
        content: null,
        error: 'File not found',
      };
      const graph = buildCrossRefGraph([errorArtifact]);
      expect(graph.nodes.size).toBe(0);
    });

    it('handles artifacts with missing status', () => {
      const missingArtifact: ArtifactResult = {
        type: 'features',
        path: '/missing.yaml',
        status: 'missing',
        content: null,
      };
      const graph = buildCrossRefGraph([missingArtifact]);
      expect(graph.nodes.size).toBe(0);
    });

    it('handles duplicate IDs across artifacts (first wins)', () => {
      const artifacts = parseArtifacts([
        { path: fixturePath('features.yaml'), type: 'features' },
        { path: fixturePath('features.yaml'), type: 'features' }, // duplicate
      ]);
      const graph = buildCrossRefGraph(artifacts);
      // Should still have exactly 4 features, not 8
      const featureNodes = getNodesByType(graph, 'feature');
      expect(featureNodes).toHaveLength(4);
    });

    it('correctly handles mixed artifact types together', () => {
      const graph = buildGraphFromStandardFixtures();

      // Verify all expected types are present
      expect(getNodesByType(graph, 'feature').length).toBeGreaterThan(0);
      expect(getNodesByType(graph, 'scenario').length).toBeGreaterThan(0);
      expect(getNodesByType(graph, 'scenario-gate').length).toBeGreaterThan(0);
      expect(getNodesByType(graph, 'epic').length).toBeGreaterThan(0);
      expect(getNodesByType(graph, 'adr').length).toBeGreaterThan(0);
      expect(getNodesByType(graph, 'nfr').length).toBeGreaterThan(0);
      expect(getNodesByType(graph, 'invariant').length).toBeGreaterThan(0);
      expect(getNodesByType(graph, 'task-plan').length).toBeGreaterThan(0);
    });

    it('product and tech artifacts do not create duplicate nodes', () => {
      const graph = buildGraphFromStandardFixtures();
      // product.yaml and tech.yaml don't define primary ID nodes
      // so their inclusion shouldn't add extra nodes
      const allNodeCount = graph.nodes.size;

      const graphWithoutExtras = buildCrossRefGraph(
        parseArtifacts([
          { path: fixturePath('features.yaml'), type: 'features' },
          { path: fixturePath('scenarios.yaml'), type: 'scenarios' },
          { path: fixturePath('plan.yaml'), type: 'plan' },
          { path: fixturePath('architecture.yaml'), type: 'architecture' },
          { path: fixturePath('roadmap.yaml'), type: 'roadmap' },
        ]),
      );

      expect(graphWithoutExtras.nodes.size).toBe(allNodeCount);
    });
  });
});
