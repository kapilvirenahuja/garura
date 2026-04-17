/**
 * MDB Cross-Reference Resolver
 *
 * Server-side singleton cross-reference graph builder that scans all parsed artifacts
 * and builds an in-memory graph of convention-based IDs:
 *   Feature (F*), Scenario (SC-*), Scenario Gate (SG*), Epic (EPIC-*),
 *   ADR (ADR-*), NFR (NFR-*), Invariant (INV-*), Design Decision (DD-*),
 *   and Task/Plan (TP-*).
 *
 * Supports forward lookup, reverse lookup, ID resolution to source artifact,
 * and dangling reference detection. Invalidates via git hash comparison.
 *
 * Fulfills: VAL-FOUND-025 through VAL-FOUND-038
 */

import fs from 'node:fs';

import type {
  ArtifactResult,
  ArchitectureContent,
  FeaturesContent,
  PlanContent,
  RoadmapContent,
  ScenariosContent,
} from './artifact-parser';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Convention-based ID node types */
export type NodeType =
  | 'feature'
  | 'scenario'
  | 'scenario-gate'
  | 'epic'
  | 'adr'
  | 'nfr'
  | 'invariant'
  | 'design-decision'
  | 'task-plan';

/** A node in the cross-reference graph */
export interface GraphNode {
  readonly id: string;
  readonly type: NodeType;
  readonly sourceFile: string;
  readonly line: number;
  readonly content: string;
  readonly parentId: string | null;
  readonly metadata: Readonly<Record<string, unknown>>;
}

/** Result of resolving an ID to its source */
export interface ResolvedReference {
  readonly id: string;
  readonly type: NodeType;
  readonly sourceFile: string;
  readonly line: number;
  readonly content: string;
}

/** An edge in the cross-reference graph */
interface GraphEdge {
  readonly from: string;
  readonly to: string;
}

/** The full cross-reference graph */
export interface CrossRefGraph {
  /** All defined nodes keyed by ID */
  readonly nodes: ReadonlyMap<string, GraphNode>;
  /** Forward index: targetId → Set of IDs that reference the target */
  readonly forwardIndex: ReadonlyMap<string, ReadonlySet<string>>;
  /** Reverse index: childId → parentId (primary hierarchical parent) */
  readonly reverseIndex: ReadonlyMap<string, string>;
  /** IDs that are referenced but never defined */
  readonly danglingRefs: ReadonlySet<string>;
  /** Git hash at the time the graph was built */
  readonly gitHash: string | null;
}

// ---------------------------------------------------------------------------
// Line number resolution
// ---------------------------------------------------------------------------

/**
 * Find the 1-based line number where an ID first appears in a file.
 * Returns 0 if the file cannot be read or the ID is not found.
 */
function findLineForId(filePath: string, id: string): number {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (lines[i]?.includes(id)) {
        return i + 1;
      }
    }
    return 1; // fallback to first line if ID pattern not found literally
  } catch {
    return 0;
  }
}

// ---------------------------------------------------------------------------
// Graph construction helpers
// ---------------------------------------------------------------------------

function addNode(
  nodes: Map<string, GraphNode>,
  id: string,
  type: NodeType,
  sourceFile: string,
  content: string,
  parentId: string | null,
  metadata: Record<string, unknown>,
): void {
  if (!id || nodes.has(id)) return;
  const line = findLineForId(sourceFile, id);
  nodes.set(id, { id, type, sourceFile, line, content, parentId, metadata });
}

function addEdge(edges: GraphEdge[], from: string, to: string): void {
  if (from && to && from !== to) {
    edges.push({ from, to });
  }
}

// ---------------------------------------------------------------------------
// Extraction from each artifact type
// ---------------------------------------------------------------------------

function extractFromFeatures(
  artifact: ArtifactResult<FeaturesContent>,
  nodes: Map<string, GraphNode>,
): void {
  const content = artifact.content;
  if (!content) return;
  const filePath = artifact.path;

  // Extract Feature IDs (F*)
  for (const feature of content.features) {
    addNode(nodes, feature.id, 'feature', filePath, feature.description, null, {
      name: feature.name,
      capabilityDomain: feature.capabilityDomain,
      behaviors: feature.behaviors,
    });
  }

  // Extract Invariant IDs (INV-*)
  if (content.invariants) {
    for (const inv of content.invariants) {
      addNode(nodes, inv.id, 'invariant', filePath, inv.description, null, {});
    }
  }
}

function extractFromScenarios(
  artifact: ArtifactResult<ScenariosContent>,
  nodes: Map<string, GraphNode>,
  edges: GraphEdge[],
): void {
  const content = artifact.content;
  if (!content) return;
  const filePath = artifact.path;

  for (const scenario of content.scenarios) {
    // Scenario's parent is its feature
    addNode(nodes, scenario.id, 'scenario', filePath, scenario.description, scenario.featureRef, {
      featureRef: scenario.featureRef,
      behaviorRef: scenario.behaviorRef,
      expectedBehavior: scenario.expectedBehavior,
      passCriteria: scenario.passCriteria,
    });

    // Edge: scenario references its feature
    if (scenario.featureRef) {
      addEdge(edges, scenario.id, scenario.featureRef);
    }

    // Edge: scenario references its behavior
    if (scenario.behaviorRef) {
      addEdge(edges, scenario.id, scenario.behaviorRef);
    }
  }
}

function extractFromPlan(
  artifact: ArtifactResult<PlanContent>,
  nodes: Map<string, GraphNode>,
  edges: GraphEdge[],
): void {
  const content = artifact.content;
  if (!content) return;
  const filePath = artifact.path;

  // Build milestone → task mapping
  const taskToMilestone = new Map<string, string>();
  for (const milestone of content.milestones) {
    for (const taskId of milestone.tasks) {
      taskToMilestone.set(taskId, milestone.id);
    }
  }

  // Track scenario gate counter for SG ID generation
  let sgCounter = 0;

  // Extract Task/Plan IDs from execution order
  for (const task of content.executionOrder) {
    const milestoneId = taskToMilestone.get(task.id) ?? null;

    addNode(nodes, task.id, 'task-plan', filePath, task.description, task.featureId ?? null, {
      featureId: task.featureId,
      dependsOn: task.dependsOn,
      exitGate: task.exitGate,
      milestoneId,
      scenarioGate: task.scenarioGate,
    });

    // Edge: task references its feature
    if (task.featureId) {
      addEdge(edges, task.id, task.featureId);
    }

    // Edge: task depends on other tasks
    for (const dep of task.dependsOn) {
      addEdge(edges, task.id, dep);
    }

    // Generate Scenario Gate nodes from scenario_gate
    if (task.scenarioGate && task.scenarioGate.scenarioIds.length > 0) {
      sgCounter++;
      const sgId = `SG${sgCounter}`;

      addNode(nodes, sgId, 'scenario-gate', filePath, `Scenario gate for ${task.id}`, null, {
        taskId: task.id,
        milestoneId,
        scenarioIds: task.scenarioGate.scenarioIds,
        count: task.scenarioGate.count,
      });

      // Edge: SG references its scenarios
      for (const scenarioId of task.scenarioGate.scenarioIds) {
        addEdge(edges, sgId, scenarioId);
      }

      // Edge: SG references its task
      addEdge(edges, sgId, task.id);

      // Edge: task references its SG
      addEdge(edges, task.id, sgId);
    }
  }
}

function extractFromArchitecture(
  artifact: ArtifactResult<ArchitectureContent>,
  nodes: Map<string, GraphNode>,
): void {
  const content = artifact.content;
  if (!content) return;
  const filePath = artifact.path;

  // Extract decisions — classify as ADR or Design Decision based on prefix
  for (const decision of content.decisions) {
    const type: NodeType = decision.id.startsWith('DD-') ? 'design-decision' : 'adr';

    addNode(nodes, decision.id, type, filePath, decision.title, null, {
      status: decision.status,
      context: decision.context,
      decision: decision.decision,
      rationale: decision.rationale,
      consequences: decision.consequences,
    });
  }

  // Extract NFR IDs (NFR-*)
  for (const nfr of content.nfrMappings) {
    addNode(nodes, nfr.nfrId, 'nfr', filePath, nfr.description, null, {
      mechanism: nfr.mechanism,
      verification: nfr.verification,
    });
  }
}

function extractFromRoadmap(
  artifact: ArtifactResult<RoadmapContent>,
  nodes: Map<string, GraphNode>,
  edges: GraphEdge[],
): void {
  const content = artifact.content;
  if (!content) return;
  const filePath = artifact.path;

  for (const epic of content.epics) {
    addNode(nodes, epic.id, 'epic', filePath, epic.description, null, {
      name: epic.name,
      features: epic.features,
      phase: epic.phase,
      timeline: epic.timeline,
      status: epic.status,
      priority: epic.priority,
    });

    // Edge: epic references its features
    for (const featureId of epic.features) {
      addEdge(edges, epic.id, featureId);
    }
  }

  // Build sequencing edges
  for (const seq of content.sequencing) {
    addEdge(edges, seq.from, seq.to);
  }
}

// ---------------------------------------------------------------------------
// Public API — Graph building
// ---------------------------------------------------------------------------

/**
 * Build a cross-reference graph from parsed artifacts.
 *
 * @param artifacts - Array of parsed ArtifactResult objects
 * @param gitHash - Current git commit hash (for cache invalidation)
 * @returns The built CrossRefGraph
 */
export function buildCrossRefGraph(
  artifacts: ReadonlyArray<ArtifactResult>,
  gitHash: string | null = null,
): CrossRefGraph {
  const nodes = new Map<string, GraphNode>();
  const edges: GraphEdge[] = [];

  for (const artifact of artifacts) {
    if (artifact.status !== 'ok' || !artifact.content) continue;

    switch (artifact.type) {
      case 'features':
        extractFromFeatures(artifact as ArtifactResult<FeaturesContent>, nodes);
        break;
      case 'scenarios':
        extractFromScenarios(artifact as ArtifactResult<ScenariosContent>, nodes, edges);
        break;
      case 'plan':
        extractFromPlan(artifact as ArtifactResult<PlanContent>, nodes, edges);
        break;
      case 'architecture':
        extractFromArchitecture(artifact as ArtifactResult<ArchitectureContent>, nodes);
        break;
      case 'roadmap':
        extractFromRoadmap(artifact as ArtifactResult<RoadmapContent>, nodes, edges);
        break;
      // product, tech, stm-evidence — no primary ID definitions
    }
  }

  // Build forward index: targetId → set of IDs that reference target
  const forwardIndex = new Map<string, Set<string>>();
  for (const edge of edges) {
    let refs = forwardIndex.get(edge.to);
    if (!refs) {
      refs = new Set<string>();
      forwardIndex.set(edge.to, refs);
    }
    refs.add(edge.from);
  }

  // Build reverse index from parentId links in nodes
  const reverseIndex = new Map<string, string>();
  for (const [id, node] of nodes) {
    if (node.parentId) {
      reverseIndex.set(id, node.parentId);
    }
  }

  // Detect dangling references: referenced IDs that have no definition
  const danglingRefs = new Set<string>();
  for (const edge of edges) {
    if (!nodes.has(edge.to)) {
      danglingRefs.add(edge.to);
    }
  }

  return { nodes, forwardIndex, reverseIndex, danglingRefs, gitHash };
}

// ---------------------------------------------------------------------------
// Public API — Lookups
// ---------------------------------------------------------------------------

/**
 * Resolve any valid cross-reference ID to its source artifact, line, and content.
 * Returns null for dangling or unknown IDs.
 */
export function resolveId(graph: CrossRefGraph, id: string): ResolvedReference | null {
  const node = graph.nodes.get(id);
  if (!node) return null;
  return {
    id: node.id,
    type: node.type,
    sourceFile: node.sourceFile,
    line: node.line,
    content: node.content,
  };
}

/**
 * Forward lookup: given a source entity ID, return all IDs that reference it.
 * Example: F1 → [SC-TASK-001, SC-TASK-002, EPIC-E1, T1.1]
 */
export function forwardLookup(graph: CrossRefGraph, id: string): ReadonlyArray<string> {
  const refs = graph.forwardIndex.get(id);
  if (!refs) return [];
  return Array.from(refs);
}

/**
 * Reverse lookup: given a reference ID, return the parent entity.
 * Example: SC-TASK-001 → F1 (parent feature)
 */
export function reverseLookup(graph: CrossRefGraph, id: string): string | null {
  return graph.reverseIndex.get(id) ?? null;
}

/**
 * Get the full node for a given ID, or null if not found.
 */
export function getNode(graph: CrossRefGraph, id: string): GraphNode | null {
  return graph.nodes.get(id) ?? null;
}

/**
 * Get all dangling references (IDs referenced but not defined).
 */
export function getDanglingReferences(graph: CrossRefGraph): ReadonlyArray<string> {
  return Array.from(graph.danglingRefs);
}

/**
 * Check if the graph needs rebuilding by comparing git hashes.
 */
export function isGraphStale(graph: CrossRefGraph, currentGitHash: string | null): boolean {
  if (graph.gitHash === null || currentGitHash === null) return true;
  return graph.gitHash !== currentGitHash;
}

// ---------------------------------------------------------------------------
// Singleton management
// ---------------------------------------------------------------------------

let cachedGraph: CrossRefGraph | null = null;

/**
 * Get the cached cross-reference graph, rebuilding if the git hash has changed.
 */
export function getCrossRefGraph(
  artifacts: ReadonlyArray<ArtifactResult>,
  gitHash: string | null = null,
): CrossRefGraph {
  if (cachedGraph && !isGraphStale(cachedGraph, gitHash)) {
    return cachedGraph;
  }
  cachedGraph = buildCrossRefGraph(artifacts, gitHash);
  return cachedGraph;
}

/**
 * Invalidate the cached graph, forcing a rebuild on next access.
 */
export function invalidateCrossRefGraph(): void {
  cachedGraph = null;
}

/**
 * Get all nodes of a specific type.
 */
export function getNodesByType(graph: CrossRefGraph, type: NodeType): ReadonlyArray<GraphNode> {
  const result: GraphNode[] = [];
  for (const node of graph.nodes.values()) {
    if (node.type === type) {
      result.push(node);
    }
  }
  return result;
}
