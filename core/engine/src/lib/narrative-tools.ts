/**
 * Garura Narrative Composition — Tools
 *
 * Tool-shaped functions that read underlying parsed Garura artifacts
 * (features.yaml, scenarios.yaml, architecture.yaml, plan.yaml, roadmap.yaml,
 * product.yaml, STM evidence) and return structured data suitable for
 * narrative composition.
 *
 * Shape follows the Vercel AI SDK v6 tool convention (description +
 * inputSchema + execute). Each tool is a pure function: all state lives in
 * the artifact set / cross-ref graph passed via the resolver context, never
 * in module-local state. This keeps the tools trivially testable and makes
 * them safe to invoke in parallel.
 *
 * CRITICAL: These tools NEVER return raw YAML strings. They only return
 * structured JavaScript values derived from the already-normalized parser
 * output. The consumer (narrative engine) renders these values as prose or
 * component props — never as YAML.
 *
 * Fulfills: portion of mdb-narrative-engine (tool layer)
 */

import type {
  ArchitectureContent,
  ArtifactResult,
  FeatureEntry,
  FeaturesContent,
  PlanContent,
  ProductContent,
  RoadmapContent,
  ScenarioEntry,
  ScenariosContent,
  StmEvidenceYamlContent,
  StmEvidenceMarkdownContent,
  TaskEntry,
} from './artifact-parser';
import type { CrossRefGraph } from './crossref-resolver';

// ---------------------------------------------------------------------------
// Tool resolver context
// ---------------------------------------------------------------------------

/** Context passed to every tool's execute() — the data source. */
export interface ToolResolverContext {
  readonly artifacts: ReadonlyArray<ArtifactResult>;
  readonly graph: CrossRefGraph;
}

// ---------------------------------------------------------------------------
// Tool result types
// ---------------------------------------------------------------------------

/** Normalized epic context for narrative composition. */
export interface EpicContextResult {
  readonly epicId: string;
  readonly name: string;
  readonly description: string;
  readonly status: string;
  readonly phase: string;
  readonly priority: number | null;
  readonly featureIds: readonly string[];
  readonly timeline: { readonly start: string; readonly end: string } | null;
  readonly found: boolean;
}

export interface ProductSummaryResult {
  readonly name: string;
  readonly description: string;
  readonly goals: readonly string[];
  readonly constraints: readonly string[];
}

export interface FeatureSummary {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly capabilityDomain: string;
  readonly behaviors: ReadonlyArray<{ readonly id: string; readonly description: string }>;
}

export interface ScenarioSummary {
  readonly id: string;
  readonly featureRef: string;
  readonly description: string;
  readonly given: string | null;
  readonly when: string | null;
  readonly then: string | null;
  readonly passCriteria: readonly string[];
}

export interface ArchitectureDecisionSummary {
  readonly id: string;
  readonly title: string;
  readonly status: string;
  readonly rationale: string | null;
}

export interface ArchitectureSummary {
  readonly decisions: readonly ArchitectureDecisionSummary[];
  readonly patterns: ReadonlyArray<{ readonly id: string; readonly name: string }>;
  readonly nfrs: ReadonlyArray<{
    readonly id: string;
    readonly description: string;
    readonly mechanism: string | null;
  }>;
}

export interface PlanStatusSummary {
  readonly tasks: ReadonlyArray<{
    readonly id: string;
    readonly featureId: string;
    readonly description: string;
    readonly exitGate: string | null;
    readonly scenarioIds: readonly string[];
    readonly milestoneId: string | null;
  }>;
  readonly milestones: ReadonlyArray<{
    readonly id: string;
    readonly name: string;
    readonly taskIds: readonly string[];
  }>;
}

export interface StmEvidenceSummaryForNarrative {
  readonly playHistory: ReadonlyArray<{
    readonly name: string;
    readonly status: string;
    readonly timestamp: string | null;
  }>;
  readonly qualityChecks: ReadonlyArray<{
    readonly status: string;
    readonly timestamp: string | null;
  }>;
  readonly evidenceFiles: readonly string[];
}

// ---------------------------------------------------------------------------
// Tool interface
// ---------------------------------------------------------------------------

/**
 * Tool shape follows Vercel AI SDK v6 convention: a description, an input
 * schema describing expected parameters (kept as plain TypeScript types so
 * the module has zero runtime deps), and an execute() callback returning
 * structured data.
 */
export interface NarrativeTool<Input, Output> {
  readonly name: string;
  readonly description: string;
  readonly inputSchema: {
    readonly type: 'object';
    readonly required: readonly string[];
    readonly properties: Record<string, { readonly type: string; readonly description: string }>;
  };
  execute(input: Input, ctx: ToolResolverContext): Output;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function findArtifact<T>(
  artifacts: ReadonlyArray<ArtifactResult>,
  type: ArtifactResult['type'],
): T | null {
  const hit = artifacts.find((a) => a.type === type && a.status === 'ok' && a.content !== null);
  return (hit?.content as T | undefined) ?? null;
}

function findAllArtifacts<T>(
  artifacts: ReadonlyArray<ArtifactResult>,
  type: ArtifactResult['type'],
): T[] {
  return artifacts
    .filter((a) => a.type === type && a.status === 'ok' && a.content !== null)
    .map((a) => a.content as unknown as T);
}

/** Normalize an epic id input — accepts "E1" or "EPIC-E1". */
export function normalizeEpicId(input: string): string {
  const trimmed = input.trim();
  if (trimmed.startsWith('EPIC-')) return trimmed;
  if (/^E\d+$/i.test(trimmed)) return `EPIC-${trimmed.toUpperCase()}`;
  return trimmed;
}

// ---------------------------------------------------------------------------
// Tool: readEpicContext
// ---------------------------------------------------------------------------

export const readEpicContextTool: NarrativeTool<{ readonly epicId: string }, EpicContextResult> = {
  name: 'readEpicContext',
  description:
    'Reads the roadmap entry for an epic and returns its name, description, phase, priority, ' +
    'timeline, and the list of feature IDs it encompasses. Epic id may be "E1" or "EPIC-E1".',
  inputSchema: {
    type: 'object',
    required: ['epicId'],
    properties: {
      epicId: {
        type: 'string',
        description: 'Epic identifier — accepts short form ("E1") or canonical ("EPIC-E1").',
      },
    },
  },
  execute(input, ctx) {
    const epicId = normalizeEpicId(input.epicId);
    const node = ctx.graph.nodes.get(epicId);
    const meta = (node?.metadata ?? {}) as Record<string, unknown>;

    const name =
      typeof meta['name'] === 'string' && meta['name'] ? (meta['name'] as string) : epicId;
    const description = node?.content ?? '';
    const status = typeof meta['status'] === 'string' ? (meta['status'] as string) : '';
    const phase = typeof meta['phase'] === 'string' ? (meta['phase'] as string) : '';
    const priority = typeof meta['priority'] === 'number' ? (meta['priority'] as number) : null;
    const featureIds = Array.isArray(meta['features']) ? (meta['features'] as string[]) : [];
    const timeline =
      meta['timeline'] && typeof meta['timeline'] === 'object'
        ? (meta['timeline'] as { start: string; end: string })
        : null;

    return {
      epicId,
      name,
      description,
      status,
      phase,
      priority,
      featureIds,
      timeline,
      found: node !== undefined,
    };
  },
};

// ---------------------------------------------------------------------------
// Tool: readProductSummary
// ---------------------------------------------------------------------------

export const readProductSummaryTool: NarrativeTool<Record<string, never>, ProductSummaryResult> = {
  name: 'readProductSummary',
  description:
    'Reads product.yaml and returns the product name, short description, goals, and ' +
    'constraints. All values are returned as structured strings — never raw YAML.',
  inputSchema: {
    type: 'object',
    required: [],
    properties: {},
  },
  execute(_input, ctx) {
    const content = findArtifact<ProductContent>(ctx.artifacts, 'product');
    if (!content) {
      return { name: '', description: '', goals: [], constraints: [] };
    }
    return {
      name: content.name,
      description: content.description,
      goals: content.goals.map((g) => g.description).filter((s) => s.length > 0),
      constraints: content.constraints.map((c) => c.description).filter((s) => s.length > 0),
    };
  },
};

// ---------------------------------------------------------------------------
// Tool: readFeaturesForEpic
// ---------------------------------------------------------------------------

export const readFeaturesForEpicTool: NarrativeTool<
  { readonly featureIds: readonly string[] },
  readonly FeatureSummary[]
> = {
  name: 'readFeaturesForEpic',
  description:
    "Reads features.yaml, filters to the provided feature IDs, and returns each feature's " +
    'name, description, capability domain, and behavior list.',
  inputSchema: {
    type: 'object',
    required: ['featureIds'],
    properties: {
      featureIds: {
        type: 'array',
        description: 'Feature identifiers (e.g. ["F1", "F2"]).',
      },
    },
  },
  execute(input, ctx) {
    const content = findArtifact<FeaturesContent>(ctx.artifacts, 'features');
    if (!content) return [];
    const want = new Set(input.featureIds);
    return content.features
      .filter((f: FeatureEntry) => want.has(f.id))
      .map<FeatureSummary>((f) => ({
        id: f.id,
        name: f.name,
        description: f.description,
        capabilityDomain: f.capabilityDomain,
        behaviors: f.behaviors ?? [],
      }));
  },
};

// ---------------------------------------------------------------------------
// Tool: readScenariosForFeatures
// ---------------------------------------------------------------------------

export const readScenariosForFeaturesTool: NarrativeTool<
  { readonly featureIds: readonly string[] },
  readonly ScenarioSummary[]
> = {
  name: 'readScenariosForFeatures',
  description:
    'Reads scenarios.yaml, filters to scenarios whose feature_ref is in the given feature ID ' +
    "set, and returns each scenario's description, given/when/then, and pass criteria.",
  inputSchema: {
    type: 'object',
    required: ['featureIds'],
    properties: {
      featureIds: {
        type: 'array',
        description: 'Feature identifiers whose scenarios should be returned.',
      },
    },
  },
  execute(input, ctx) {
    const content = findArtifact<ScenariosContent>(ctx.artifacts, 'scenarios');
    if (!content) return [];
    const want = new Set(input.featureIds);
    return content.scenarios
      .filter((s: ScenarioEntry) => want.has(s.featureRef))
      .map<ScenarioSummary>((s) => ({
        id: s.id,
        featureRef: s.featureRef,
        description: s.description,
        given: s.given ?? null,
        when: s.when ?? null,
        then: s.then ?? null,
        passCriteria: s.passCriteria ?? [],
      }));
  },
};

// ---------------------------------------------------------------------------
// Tool: readArchitectureContext
// ---------------------------------------------------------------------------

export const readArchitectureContextTool: NarrativeTool<
  Record<string, never>,
  ArchitectureSummary
> = {
  name: 'readArchitectureContext',
  description:
    'Reads architecture.yaml and returns the decisions (ADRs), applied patterns, and NFR ' +
    'mappings. Returns structured summaries — never raw YAML.',
  inputSchema: {
    type: 'object',
    required: [],
    properties: {},
  },
  execute(_input, ctx) {
    const content = findArtifact<ArchitectureContent>(ctx.artifacts, 'architecture');
    if (!content) return { decisions: [], patterns: [], nfrs: [] };
    return {
      decisions: content.decisions.map((d) => ({
        id: d.id,
        title: d.title,
        status: d.status,
        rationale: d.rationale ?? d.decision ?? null,
      })),
      patterns: content.patterns.map((p) => ({ id: p.id, name: p.name })),
      nfrs: content.nfrMappings.map((n) => ({
        id: n.nfrId,
        description: n.description,
        mechanism: n.mechanism ?? null,
      })),
    };
  },
};

// ---------------------------------------------------------------------------
// Tool: readPlanStatusForEpic
// ---------------------------------------------------------------------------

export const readPlanStatusForEpicTool: NarrativeTool<
  { readonly featureIds: readonly string[] },
  PlanStatusSummary
> = {
  name: 'readPlanStatusForEpic',
  description:
    'Reads plan.yaml, filters tasks to those whose feature_id is in the given set, and returns ' +
    "each task's description, exit gate, linked scenario IDs, and milestone. Also returns the " +
    'milestones those tasks belong to.',
  inputSchema: {
    type: 'object',
    required: ['featureIds'],
    properties: {
      featureIds: {
        type: 'array',
        description: 'Feature identifiers whose plan tasks should be returned.',
      },
    },
  },
  execute(input, ctx) {
    const content = findArtifact<PlanContent>(ctx.artifacts, 'plan');
    if (!content) return { tasks: [], milestones: [] };

    const want = new Set(input.featureIds);
    const taskToMilestone = new Map<string, string>();
    for (const m of content.milestones) {
      for (const tid of m.tasks) taskToMilestone.set(tid, m.id);
    }

    const tasks = content.executionOrder
      .filter((t: TaskEntry) => (t.featureId ? want.has(t.featureId) : false))
      .map((t) => ({
        id: t.id,
        featureId: t.featureId ?? '',
        description: t.description,
        exitGate: t.exitGate ?? null,
        scenarioIds: t.scenarioGate?.scenarioIds ?? [],
        milestoneId: taskToMilestone.get(t.id) ?? null,
      }));

    const relevantMilestoneIds = new Set(
      tasks.map((t) => t.milestoneId).filter((id): id is string => id !== null),
    );

    const milestones = content.milestones
      .filter((m) => relevantMilestoneIds.has(m.id))
      .map((m) => ({ id: m.id, name: m.name, taskIds: m.tasks }));

    return { tasks, milestones };
  },
};

// ---------------------------------------------------------------------------
// Tool: readStmEvidenceForEpic
// ---------------------------------------------------------------------------

export const readStmEvidenceForEpicTool: NarrativeTool<
  { readonly epicId: string },
  StmEvidenceSummaryForNarrative
> = {
  name: 'readStmEvidenceForEpic',
  description:
    'Summarises any STM evidence artifacts visible to the parser, returning play run history, ' +
    'quality-check outcomes, and the list of evidence file paths attached to the epic.',
  inputSchema: {
    type: 'object',
    required: ['epicId'],
    properties: {
      epicId: { type: 'string', description: 'Epic identifier (e.g. "E1" or "EPIC-E1").' },
    },
  },
  execute(input, ctx) {
    const normalizedEpicId = normalizeEpicId(input.epicId);
    const shortEpicId = normalizedEpicId.startsWith('EPIC-')
      ? normalizedEpicId.slice(5)
      : normalizedEpicId;

    const yamlEvidence = ctx.artifacts.filter(
      (a) => a.type === 'stm-evidence-yaml' && a.status === 'ok' && a.content,
    );
    const mdEvidence = ctx.artifacts.filter(
      (a) => a.type === 'stm-evidence-markdown' && a.status === 'ok' && a.content,
    );

    const filterPath = (p: string): boolean =>
      p.toLowerCase().includes(`/${shortEpicId.toLowerCase()}/`) ||
      p.toLowerCase().includes(`${shortEpicId.toLowerCase()}-`) ||
      yamlEvidence.length + mdEvidence.length <= 3; // fallback: if we have few, include all

    const playHistory: Array<{ name: string; status: string; timestamp: string | null }> = [];
    const qualityChecks: Array<{ status: string; timestamp: string | null }> = [];
    const evidenceFiles: string[] = [];

    for (const art of yamlEvidence) {
      if (!filterPath(art.path)) continue;
      evidenceFiles.push(art.path);
      const c = art.content as StmEvidenceYamlContent;
      const raw = c.raw as Record<string, unknown>;
      const play = raw['play'];
      if (play && typeof play === 'object') {
        const p = play as Record<string, unknown>;
        playHistory.push({
          name: typeof p['name'] === 'string' ? (p['name'] as string) : 'unknown',
          status:
            typeof p['status'] === 'string' ? (p['status'] as string) : (c.status ?? 'unknown'),
          timestamp:
            typeof p['timestamp'] === 'string' ? (p['timestamp'] as string) : (c.timestamp ?? null),
        });
      }
      if (raw['quality_check']) {
        const q = raw['quality_check'] as Record<string, unknown>;
        qualityChecks.push({
          status:
            typeof q['status'] === 'string' ? (q['status'] as string) : (c.status ?? 'unknown'),
          timestamp:
            typeof q['timestamp'] === 'string' ? (q['timestamp'] as string) : (c.timestamp ?? null),
        });
      }
    }

    for (const art of mdEvidence) {
      if (!filterPath(art.path)) continue;
      evidenceFiles.push(art.path);
    }

    return { playHistory, qualityChecks, evidenceFiles };
  },
};

// ---------------------------------------------------------------------------
// Tool: listEpics
// ---------------------------------------------------------------------------

export const listEpicsTool: NarrativeTool<
  Record<string, never>,
  readonly { id: string; name: string; featureCount: number }[]
> = {
  name: 'listEpics',
  description:
    'Returns every epic defined in roadmap.yaml with its canonical id, name, and feature count.',
  inputSchema: {
    type: 'object',
    required: [],
    properties: {},
  },
  execute(_input, ctx) {
    const roadmaps = findAllArtifacts<RoadmapContent>(ctx.artifacts, 'roadmap');
    const out: { id: string; name: string; featureCount: number }[] = [];
    for (const r of roadmaps) {
      for (const e of r.epics) {
        out.push({ id: e.id, name: e.name, featureCount: e.features.length });
      }
    }
    return out;
  },
};

// ---------------------------------------------------------------------------
// Tool registry (AI SDK v6 tools object)
// ---------------------------------------------------------------------------

export const narrativeTools = {
  readEpicContext: readEpicContextTool,
  readProductSummary: readProductSummaryTool,
  readFeaturesForEpic: readFeaturesForEpicTool,
  readScenariosForFeatures: readScenariosForFeaturesTool,
  readArchitectureContext: readArchitectureContextTool,
  readPlanStatusForEpic: readPlanStatusForEpicTool,
  readStmEvidenceForEpic: readStmEvidenceForEpicTool,
  listEpics: listEpicsTool,
} as const;

export type NarrativeTools = typeof narrativeTools;

// Explicit exports for markdown type used inline above to avoid unused import warnings.
export type { StmEvidenceMarkdownContent };
