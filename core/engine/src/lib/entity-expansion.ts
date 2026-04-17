/**
 * Garura — Entity Expansion resolver
 *
 * Given any convention-based cross-reference ID (F*, SC-*, EPIC-*, ADR-*, DD-*,
 * NFR-*, INV-*, TP-*, SG*), returns a structured description suitable for
 * rendering an InlineExpansion panel in the Playbook Reader:
 *
 *   - type badge (Feature / Scenario / Architecture Decision / NFR / ...)
 *   - human title and description
 *   - source file provenance (and the artifact it came from)
 *   - Connections — parent references, architecture links, NFR dependencies,
 *     implementation tasks — each presented as a labelled token so the
 *     client can render clickable CrossRefTokens without doing any graph
 *     traversal itself.
 *
 * Used by the `/api/expansion` route and the `EntityExpansion` client
 * component. Pure function of (refId, artifacts, graph) so it's trivially
 * testable and cache-safe.
 *
 * Fulfills: mdb-progressive-disclosure (server-side resolver layer).
 */

import type {
  ArtifactResult,
  FeaturesContent,
  ScenariosContent,
  PlanContent,
  RoadmapContent,
  ArchitectureContent,
} from './artifact-parser';
import type { CrossRefGraph, GraphNode } from './crossref-resolver';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** A single labelled connection shown in the "Connections" section. */
export interface EntityConnection {
  /** Human-readable group label (e.g. "Parent feature", "Architecture"). */
  readonly label: string;
  /** Reference IDs to render as CrossRefTokens. */
  readonly refIds: readonly string[];
}

export interface EntityExpansionData {
  readonly refId: string;
  readonly found: boolean;
  /** Human-friendly type label — "Feature", "Scenario", "Architecture Decision" etc. */
  readonly typeLabel: string;
  /** Short title (e.g. feature name, scenario summary). */
  readonly title: string;
  /** Multi-line description / prose details. */
  readonly description: string;
  /** Source artifact file (basename — not an absolute path). */
  readonly source: string;
  /** Optional structured metadata rendered as a definition list. */
  readonly facts: ReadonlyArray<{ readonly label: string; readonly value: string }>;
  /** Grouped connections to other entities. */
  readonly connections: readonly EntityConnection[];
}

// ---------------------------------------------------------------------------
// Type label map
// ---------------------------------------------------------------------------

const TYPE_LABELS: Record<string, string> = {
  feature: 'Feature',
  scenario: 'Scenario',
  'scenario-gate': 'Scenario Gate',
  epic: 'Epic',
  adr: 'Architecture Decision',
  nfr: 'Non-Functional Requirement',
  invariant: 'Invariant',
  'design-decision': 'Design Decision',
  'task-plan': 'Implementation Task',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function basename(p: string): string {
  const idx = Math.max(p.lastIndexOf('/'), p.lastIndexOf('\\'));
  return idx >= 0 ? p.slice(idx + 1) : p;
}

function findArtifact<T>(
  artifacts: ReadonlyArray<ArtifactResult>,
  type: ArtifactResult['type'],
): T | null {
  const hit = artifacts.find((a) => a.type === type && a.status === 'ok' && a.content !== null);
  return (hit?.content as T | undefined) ?? null;
}

function pickString(meta: Readonly<Record<string, unknown>>, key: string): string {
  const v = meta[key];
  return typeof v === 'string' ? v : '';
}

function pickArray(meta: Readonly<Record<string, unknown>>, key: string): readonly string[] {
  const v = meta[key];
  return Array.isArray(v) ? (v.filter((x) => typeof x === 'string') as string[]) : [];
}

function dedupe(arr: readonly string[]): string[] {
  return Array.from(new Set(arr));
}

/** Partition a list of related IDs by their ID prefix so we can label them. */
function partitionByKind(ids: readonly string[]): {
  scenarios: string[];
  features: string[];
  epics: string[];
  tasks: string[];
  adrs: string[];
  nfrs: string[];
  designDecisions: string[];
  gates: string[];
  invariants: string[];
  other: string[];
} {
  const out = {
    scenarios: [] as string[],
    features: [] as string[],
    epics: [] as string[],
    tasks: [] as string[],
    adrs: [] as string[],
    nfrs: [] as string[],
    designDecisions: [] as string[],
    gates: [] as string[],
    invariants: [] as string[],
    other: [] as string[],
  };
  for (const id of ids) {
    if (/^SC-/.test(id)) out.scenarios.push(id);
    else if (/^F\d+$/.test(id)) out.features.push(id);
    else if (/^EPIC-/.test(id)) out.epics.push(id);
    else if (/^(TP-|T\d)/.test(id)) out.tasks.push(id);
    else if (/^ADR-/.test(id)) out.adrs.push(id);
    else if (/^NFR-/.test(id)) out.nfrs.push(id);
    else if (/^DD-/.test(id)) out.designDecisions.push(id);
    else if (/^SG\d+$/.test(id)) out.gates.push(id);
    else if (/^INV-/.test(id)) out.invariants.push(id);
    else out.other.push(id);
  }
  return out;
}

// ---------------------------------------------------------------------------
// Feature-specific details — richer than generic node.content
// ---------------------------------------------------------------------------

function describeFeature(
  node: GraphNode,
  artifacts: ReadonlyArray<ArtifactResult>,
): { title: string; description: string; facts: Array<{ label: string; value: string }> } {
  const featuresContent = findArtifact<FeaturesContent>(artifacts, 'features');
  const feature = featuresContent?.features.find((f) => f.id === node.id);

  const title = feature?.name ?? (node.metadata['name'] as string) ?? node.id;
  const description = feature?.description ?? node.content ?? '';
  const facts: Array<{ label: string; value: string }> = [];

  const domain = feature?.capabilityDomain ?? pickString(node.metadata, 'capabilityDomain');
  if (domain) facts.push({ label: 'Capability domain', value: domain });

  const behaviors = feature?.behaviors ?? [];
  if (behaviors.length > 0) {
    facts.push({
      label: 'Observable behaviours',
      value: behaviors.map((b) => `${b.id}: ${b.description}`).join(' · '),
    });
  }

  return { title, description, facts };
}

function describeScenario(
  node: GraphNode,
  artifacts: ReadonlyArray<ArtifactResult>,
): { title: string; description: string; facts: Array<{ label: string; value: string }> } {
  const scenariosContent = findArtifact<ScenariosContent>(artifacts, 'scenarios');
  const scenario = scenariosContent?.scenarios.find((s) => s.id === node.id);

  const title = scenario?.description ?? node.content ?? node.id;
  const facts: Array<{ label: string; value: string }> = [];

  if (scenario?.given) facts.push({ label: 'Given', value: scenario.given });
  if (scenario?.when) facts.push({ label: 'When', value: scenario.when });
  if (scenario?.then) facts.push({ label: 'Then', value: scenario.then });
  if (scenario?.expectedBehavior) {
    facts.push({ label: 'Expected behaviour', value: scenario.expectedBehavior });
  }
  if (scenario?.passCriteria && scenario.passCriteria.length > 0) {
    facts.push({ label: 'Pass criteria', value: scenario.passCriteria.join(' · ') });
  }

  const description = scenario
    ? [scenario.given, scenario.when, scenario.then].filter(Boolean).join(' ')
    : node.content;

  return { title, description, facts };
}

function describeEpic(
  node: GraphNode,
  artifacts: ReadonlyArray<ArtifactResult>,
): { title: string; description: string; facts: Array<{ label: string; value: string }> } {
  const roadmap = findArtifact<RoadmapContent>(artifacts, 'roadmap');
  const epic = roadmap?.epics.find((e) => e.id === node.id);
  const title = epic?.name ?? pickString(node.metadata, 'name') ?? node.id;
  const description = epic?.description ?? node.content ?? '';
  const facts: Array<{ label: string; value: string }> = [];
  if (epic?.phase) facts.push({ label: 'Phase', value: epic.phase });
  if (epic?.status) facts.push({ label: 'Status', value: epic.status });
  if (epic?.timeline) {
    facts.push({ label: 'Timeline', value: `${epic.timeline.start} → ${epic.timeline.end}` });
  }
  return { title, description, facts };
}

function describeTask(
  node: GraphNode,
  artifacts: ReadonlyArray<ArtifactResult>,
): { title: string; description: string; facts: Array<{ label: string; value: string }> } {
  const plan = findArtifact<PlanContent>(artifacts, 'plan');
  const task = plan?.executionOrder.find((t) => t.id === node.id);
  const title = task?.description ?? node.content ?? node.id;
  const facts: Array<{ label: string; value: string }> = [];
  if (task?.exitGate) facts.push({ label: 'Exit gate', value: task.exitGate });
  if (task?.featureId) facts.push({ label: 'Delivers', value: task.featureId });
  if (task?.dependsOn && task.dependsOn.length > 0) {
    facts.push({ label: 'Depends on', value: task.dependsOn.join(', ') });
  }
  return { title, description: task?.description ?? node.content, facts };
}

function describeDecision(
  node: GraphNode,
  artifacts: ReadonlyArray<ArtifactResult>,
): { title: string; description: string; facts: Array<{ label: string; value: string }> } {
  const arch = findArtifact<ArchitectureContent>(artifacts, 'architecture');
  const decision = arch?.decisions.find((d) => d.id === node.id);
  const title = decision?.title ?? node.content ?? node.id;
  const description = decision?.decision ?? decision?.rationale ?? decision?.context ?? '';
  const facts: Array<{ label: string; value: string }> = [];
  if (decision?.status) facts.push({ label: 'Status', value: decision.status });
  if (decision?.context) facts.push({ label: 'Context', value: decision.context });
  if (decision?.rationale) facts.push({ label: 'Rationale', value: decision.rationale });
  if (decision?.consequences && decision.consequences.length > 0) {
    facts.push({ label: 'Consequences', value: decision.consequences.join(' · ') });
  }
  return { title, description, facts };
}

function describeNfr(
  node: GraphNode,
  artifacts: ReadonlyArray<ArtifactResult>,
): { title: string; description: string; facts: Array<{ label: string; value: string }> } {
  const arch = findArtifact<ArchitectureContent>(artifacts, 'architecture');
  const nfr = arch?.nfrMappings.find((n) => n.nfrId === node.id);
  const title = nfr?.description ?? node.content ?? node.id;
  const facts: Array<{ label: string; value: string }> = [];
  if (nfr?.mechanism) facts.push({ label: 'Mechanism', value: nfr.mechanism });
  if (nfr?.verification) facts.push({ label: 'Verification', value: nfr.verification });
  return { title, description: nfr?.description ?? node.content, facts };
}

function describeGeneric(node: GraphNode): {
  title: string;
  description: string;
  facts: Array<{ label: string; value: string }>;
} {
  const meta = node.metadata ?? {};
  const title = (meta['name'] as string) || node.content || node.id;
  const description = node.content || '';
  const facts: Array<{ label: string; value: string }> = [];
  if (typeof meta['status'] === 'string' && meta['status']) {
    facts.push({ label: 'Status', value: meta['status'] });
  }
  return { title, description, facts };
}

// ---------------------------------------------------------------------------
// Connections resolution
// ---------------------------------------------------------------------------

function resolveConnections(node: GraphNode, graph: CrossRefGraph): EntityConnection[] {
  const connections: EntityConnection[] = [];

  // 1) Parent reference (reverse index) — labelled by the parent's type.
  const parentId = graph.reverseIndex.get(node.id);
  if (parentId) {
    const parentNode = graph.nodes.get(parentId);
    if (parentNode) {
      const label = parentNode.type === 'feature' ? 'Parent feature' : `Parent ${parentNode.type}`;
      connections.push({ label: toTitle(label), refIds: [parentId] });
    }
  }

  // 2) Forward lookup — everything that references this node.
  //    Partition by kind so we can present them under meaningful headers.
  const forwardRefs = Array.from(graph.forwardIndex.get(node.id) ?? []);
  const partitioned = partitionByKind(forwardRefs);

  // 3) Node-type-specific extras (pulled from metadata).
  const meta = node.metadata as Record<string, unknown>;

  if (node.type === 'feature') {
    // scenarios that reference this feature, plus tasks/epics referencing it
    if (partitioned.scenarios.length > 0) {
      connections.push({ label: 'Verification scenarios', refIds: partitioned.scenarios });
    }
    if (partitioned.epics.length > 0) {
      connections.push({ label: 'Epics', refIds: partitioned.epics });
    }
    if (partitioned.tasks.length > 0) {
      connections.push({ label: 'Implementation tasks', refIds: partitioned.tasks });
    }
  } else if (node.type === 'scenario') {
    // feature (parent already rendered), plus the tasks and gates referencing it
    if (partitioned.gates.length > 0) {
      connections.push({ label: 'Scenario gates', refIds: partitioned.gates });
    }
    if (partitioned.tasks.length > 0) {
      connections.push({ label: 'Implementation', refIds: partitioned.tasks });
    }
    // Scenarios may also declare a behavior ref — surface it as a fact
    // through metadata (we do NOT surface strings as tokens).
    const behaviorRef = meta['behaviorRef'];
    if (typeof behaviorRef === 'string' && behaviorRef) {
      // behaviour refs are not graph nodes, so skip as token — render as fact
      // via describe function (already present above).
    }
    // Include any architecture hints (ADR/NFR) from forward refs — unusual
    // but safe.
    if (partitioned.adrs.length > 0) {
      connections.push({ label: 'Architecture', refIds: partitioned.adrs });
    }
    if (partitioned.nfrs.length > 0) {
      connections.push({ label: 'NFR dependencies', refIds: partitioned.nfrs });
    }
  } else if (node.type === 'epic') {
    const featureIds = pickArray(meta, 'features');
    if (featureIds.length > 0) {
      connections.push({ label: 'Features', refIds: dedupe([...featureIds]) });
    }
    if (partitioned.tasks.length > 0) {
      connections.push({ label: 'Implementation tasks', refIds: partitioned.tasks });
    }
  } else if (node.type === 'task-plan') {
    const featureId = pickString(meta, 'featureId');
    if (featureId) {
      connections.push({ label: 'Delivers feature', refIds: [featureId] });
    }
    const scenarioGate = meta['scenarioGate'] as { scenarioIds?: string[] } | undefined;
    const gateScenarios = scenarioGate?.scenarioIds ?? [];
    if (gateScenarios.length > 0) {
      connections.push({ label: 'Verifies scenarios', refIds: gateScenarios });
    }
    const dependsOn = pickArray(meta, 'dependsOn');
    if (dependsOn.length > 0) {
      connections.push({ label: 'Depends on', refIds: dependsOn });
    }
  } else if (node.type === 'scenario-gate') {
    const scenarioIds = pickArray(meta, 'scenarioIds');
    if (scenarioIds.length > 0) {
      connections.push({ label: 'Scenarios', refIds: scenarioIds });
    }
    const taskId = pickString(meta, 'taskId');
    if (taskId) connections.push({ label: 'Task', refIds: [taskId] });
  } else if (node.type === 'adr' || node.type === 'design-decision') {
    // Decisions do not usually have graph edges, but surface anything that
    // references them.
    if (forwardRefs.length > 0) {
      connections.push({ label: 'Referenced by', refIds: forwardRefs });
    }
  } else if (node.type === 'nfr') {
    if (forwardRefs.length > 0) {
      connections.push({ label: 'Referenced by', refIds: forwardRefs });
    }
  } else if (forwardRefs.length > 0) {
    connections.push({ label: 'Referenced by', refIds: forwardRefs });
  }

  // Deduplicate refIds within each group.
  return connections
    .map((c) => ({ label: c.label, refIds: dedupe(c.refIds) }))
    .filter((c) => c.refIds.length > 0);
}

function toTitle(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Resolve a cross-reference ID to a structured expansion payload.
 * Returns a "not found" shell when the ID is unknown — callers should use
 * the `found` flag to decide whether to show the dangling state.
 */
export function resolveEntityExpansion(
  refId: string,
  artifacts: ReadonlyArray<ArtifactResult>,
  graph: CrossRefGraph,
): EntityExpansionData {
  const node = graph.nodes.get(refId);

  if (!node) {
    return {
      refId,
      found: false,
      typeLabel: 'Unknown reference',
      title: refId,
      description:
        'This cross-reference could not be resolved in the current artifact set. ' +
        'It may point to content that was removed or never defined.',
      source: '',
      facts: [],
      connections: [],
    };
  }

  const typeLabel = TYPE_LABELS[node.type] ?? toTitle(node.type);

  let descriptor: {
    title: string;
    description: string;
    facts: Array<{ label: string; value: string }>;
  };
  switch (node.type) {
    case 'feature':
      descriptor = describeFeature(node, artifacts);
      break;
    case 'scenario':
      descriptor = describeScenario(node, artifacts);
      break;
    case 'epic':
      descriptor = describeEpic(node, artifacts);
      break;
    case 'task-plan':
      descriptor = describeTask(node, artifacts);
      break;
    case 'adr':
    case 'design-decision':
      descriptor = describeDecision(node, artifacts);
      break;
    case 'nfr':
      descriptor = describeNfr(node, artifacts);
      break;
    default:
      descriptor = describeGeneric(node);
  }

  const connections = resolveConnections(node, graph);

  return {
    refId: node.id,
    found: true,
    typeLabel,
    title: descriptor.title,
    description: descriptor.description,
    source: basename(node.sourceFile),
    facts: descriptor.facts,
    connections,
  };
}

/**
 * Compose a deterministic "explain further" narrative for an entity —
 * traces through the artifact graph and produces a multi-paragraph prose
 * block. This stand-in is used when no LLM is configured; the LLM composer
 * can be wired in later behind the same signature.
 */
export function composeExplainFurther(
  refId: string,
  artifacts: ReadonlyArray<ArtifactResult>,
  graph: CrossRefGraph,
): { readonly paragraphs: readonly string[]; readonly source: 'deterministic' | 'ai' } {
  const data = resolveEntityExpansion(refId, artifacts, graph);
  if (!data.found) {
    return {
      paragraphs: [
        `The reference ${refId} is dangling — it is cited somewhere in the artifact graph but never defined.`,
      ],
      source: 'deterministic',
    };
  }

  const out: string[] = [];
  out.push(
    `${data.title} is a ${data.typeLabel.toLowerCase()} sourced from ${data.source || 'the artifact set'}.` +
      (data.description ? ` ${data.description}` : ''),
  );

  if (data.facts.length > 0) {
    const factLine = data.facts.map((f) => `${f.label} — ${f.value}`).join('; ');
    out.push(`Key attributes: ${factLine}.`);
  }

  if (data.connections.length > 0) {
    const trace = data.connections.map((c) => `${c.label}: ${c.refIds.join(', ')}`).join('. ');
    out.push(
      `Connections into the broader artifact graph make this traceable end-to-end. ${trace}. Following these cross-references surfaces the full context — upstream rationale, downstream implementation, and the verification scenarios that hold the contract stable.`,
    );
  } else {
    out.push(
      'No outgoing connections were discovered in the graph. This entity stands alone — ' +
        'likely a leaf specification with no cross-cutting concerns surfaced in the current artifact set.',
    );
  }

  // One final synthesizing paragraph to make the "deeper" narrative feel
  // like real prose, not just metadata.
  out.push(
    `In the wider narrative, ${data.title} is one of the load-bearing entities behind the epic — ` +
      'following it through scenarios, architecture decisions, and plan tasks makes its contract visible in full.',
  );

  return { paragraphs: out, source: 'deterministic' };
}
