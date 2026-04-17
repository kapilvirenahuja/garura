/**
 * Garura Generative Search
 *
 * Composes AI-style contextual prose snippets from raw search hits.
 * Unlike the underlying MiniSearch index (which returns keyword-matched
 * documents with scores) this module:
 *
 *   1. Runs the keyword search to get raw hits.
 *   2. Groups hits by their "topic" — typically the owning feature when the
 *      hit is a scenario, architecture decision, or plan task, else the hit
 *      stands alone. Groups may synthesize information from multiple source
 *      artifacts for the same topic.
 *   3. Maps each topic to its enclosing epic(s) via roadmap.yaml so the UI
 *      can surface cross-epic relevance (a search for "timeout" should
 *      return hits from E1 and from E2 as distinct results).
 *   4. Composes a prose snippet per result as a NarrativeChunk stream. The
 *      prose embeds CrossRefTokens (never raw `[F1]` text in strings) so
 *      the renderer can render them as interactive components.
 *   5. Orders results by relevance score (descending), with the top result
 *      synthesizing multiple sources when available.
 *
 * The composer is deterministic — no LLM is required — but the output
 * shape mirrors what an AI SDK tool would produce, so swapping in a
 * language-model composer later is a drop-in replacement.
 *
 * CRITICAL INVARIANTS:
 *   - Snippets never contain raw YAML. All data comes from the parser's
 *     normalized content model.
 *   - CrossRef IDs are emitted as NarrativeToken chunks so the renderer
 *     can display them as clickable tokens, never as inline text.
 *   - A result's `epicIds` always reflects the roadmap mapping from
 *     feature id → epic id. If an entity is not linked to any epic the
 *     `epicIds` array is empty (the snippet still renders).
 *
 * Fulfills: mdb-generative-search
 */

import type {
  ArtifactResult,
  FeaturesContent,
  FeatureEntry,
  ScenariosContent,
  ScenarioEntry,
  ArchitectureContent,
  DecisionEntry,
  NfrMapping,
  RoadmapContent,
  EpicEntry,
  PlanContent,
  TaskEntry,
} from './artifact-parser';
import { SearchIndex, type SearchResultItem } from './search-index';
import type { NarrativeChunk, NarrativeTextChunk, NarrativeTokenChunk } from './narrative-engine';
import type { CrossRefGraph } from './crossref-resolver';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/** A source record attached to a generative search result. */
export interface GenerativeSearchSource {
  /** Entity id from the artifact parser (e.g. "F1", "SC-TASK-016"). */
  readonly entityId: string;
  /** Artifact type (e.g. "features", "scenarios"). */
  readonly sourceType: string;
  /** Artifact file path as reported by the search index. */
  readonly sourceFile: string;
  /** Raw match score contributed by this source. */
  readonly score: number;
  /** Short human-readable title for the source. */
  readonly title: string;
}

/** An epic reference attached to a generative search result. */
export interface GenerativeSearchEpicRef {
  /** Canonical epic id (e.g. "EPIC-E1"). */
  readonly id: string;
  /** Short epic label (e.g. "E1"). */
  readonly shortId: string;
  /** Epic name from roadmap.yaml. */
  readonly name: string;
}

/** A single composed search result card. */
export interface GenerativeSearchResult {
  /** Stable grouping key (e.g. "feature:F1", "decision:ADR-001", "nfr:NFR-01"). */
  readonly id: string;
  /** Result card headline. */
  readonly title: string;
  /** Kind of topic: 'feature', 'decision', 'nfr', 'plan', 'product' or 'standalone'. */
  readonly kind: GenerativeSearchKind;
  /** Aggregate relevance score — higher first. */
  readonly relevance: number;
  /** Structured prose chunks with inline CrossRefTokens. Never raw YAML. */
  readonly chunks: readonly NarrativeChunk[];
  /** Sources that fed into the composition. May include multiple artifacts. */
  readonly sources: readonly GenerativeSearchSource[];
  /** Epics this result is related to — drives cross-epic relevance UI. */
  readonly epics: readonly GenerativeSearchEpicRef[];
  /** Primary cross-reference id the UI should navigate to on card click. */
  readonly primaryRefId: string;
}

/** The full response returned by the generative search API. */
export interface GenerativeSearchResponse {
  readonly query: string;
  readonly results: readonly GenerativeSearchResult[];
  /** Count of raw hits across all sources before grouping. */
  readonly hitCount: number;
  /** Distinct epics observed across all results. */
  readonly epics: readonly GenerativeSearchEpicRef[];
  /** Timestamp the response was composed. */
  readonly composedAt: string;
}

export type GenerativeSearchKind =
  | 'feature'
  | 'decision'
  | 'nfr'
  | 'plan'
  | 'product'
  | 'standalone';

// ---------------------------------------------------------------------------
// Chunk helpers (mirror narrative-engine semantics for consistency)
// ---------------------------------------------------------------------------

function txt(text: string): NarrativeTextChunk {
  return { type: 'text', text };
}

function tok(refId: string, graph: CrossRefGraph | null): NarrativeTokenChunk {
  const dangling = graph ? !graph.nodes.has(refId) : false;
  return { type: 'token', token: { refId, dangling } };
}

function joinRefs(
  refIds: readonly string[],
  graph: CrossRefGraph | null,
  withLabel?: (id: string) => string | null,
): NarrativeChunk[] {
  if (refIds.length === 0) return [];
  const out: NarrativeChunk[] = [];
  refIds.forEach((id, i) => {
    if (i > 0) {
      out.push(txt(refIds.length === 2 ? ' and ' : i === refIds.length - 1 ? ', and ' : ', '));
    }
    out.push(tok(id, graph));
    const label = withLabel?.(id);
    if (label) out.push(txt(` (${label})`));
  });
  return out;
}

// ---------------------------------------------------------------------------
// Internal indices derived from parsed artifacts
// ---------------------------------------------------------------------------

interface ArtifactIndex {
  readonly featureById: Map<string, FeatureEntry>;
  readonly scenarioById: Map<string, ScenarioEntry>;
  readonly decisionById: Map<string, DecisionEntry>;
  readonly nfrById: Map<string, NfrMapping>;
  readonly taskById: Map<string, TaskEntry>;
  readonly epicByFeatureId: Map<string, EpicEntry[]>;
  readonly epicById: Map<string, EpicEntry>;
}

function buildArtifactIndex(artifacts: ReadonlyArray<ArtifactResult>): ArtifactIndex {
  const featureById = new Map<string, FeatureEntry>();
  const scenarioById = new Map<string, ScenarioEntry>();
  const decisionById = new Map<string, DecisionEntry>();
  const nfrById = new Map<string, NfrMapping>();
  const taskById = new Map<string, TaskEntry>();
  const epicById = new Map<string, EpicEntry>();
  const epicByFeatureId = new Map<string, EpicEntry[]>();

  for (const art of artifacts) {
    if (art.status !== 'ok' || !art.content) continue;
    if (art.type === 'features') {
      const content = art.content as FeaturesContent;
      for (const f of content.features) featureById.set(f.id, f);
    } else if (art.type === 'scenarios') {
      const content = art.content as ScenariosContent;
      for (const s of content.scenarios) scenarioById.set(s.id, s);
    } else if (art.type === 'architecture') {
      const content = art.content as ArchitectureContent;
      for (const d of content.decisions) decisionById.set(d.id, d);
      for (const n of content.nfrMappings) nfrById.set(n.nfrId, n);
    } else if (art.type === 'plan') {
      const content = art.content as PlanContent;
      for (const t of content.executionOrder) taskById.set(t.id, t);
    } else if (art.type === 'roadmap') {
      const content = art.content as RoadmapContent;
      for (const e of content.epics) {
        epicById.set(e.id, e);
        for (const fid of e.features) {
          const list = epicByFeatureId.get(fid);
          if (list) list.push(e);
          else epicByFeatureId.set(fid, [e]);
        }
      }
    }
  }

  return { featureById, scenarioById, decisionById, nfrById, taskById, epicByFeatureId, epicById };
}

function epicRefFromEntry(epic: EpicEntry): GenerativeSearchEpicRef {
  const shortId = epic.id.startsWith('EPIC-') ? epic.id.slice('EPIC-'.length) : epic.id;
  return { id: epic.id, shortId, name: epic.name };
}

function epicsForFeature(index: ArtifactIndex, featureId: string): GenerativeSearchEpicRef[] {
  const epics = index.epicByFeatureId.get(featureId) ?? [];
  return epics.map(epicRefFromEntry);
}

// ---------------------------------------------------------------------------
// Grouping — map raw search hits into composed result groups
// ---------------------------------------------------------------------------

interface GroupAccumulator {
  readonly id: string;
  readonly kind: GenerativeSearchKind;
  readonly primaryRefId: string;
  readonly featureId: string | null;
  title: string;
  sources: GenerativeSearchSource[];
  totalScore: number;
  bestScore: number;
}

function pickGroupingKey(
  hit: SearchResultItem,
  index: ArtifactIndex,
): {
  groupKey: string;
  kind: GenerativeSearchKind;
  primaryRefId: string;
  featureId: string | null;
} {
  const { source_type: sourceType, entity_id: entityId } = hit;

  // Scenario → owning feature
  if (sourceType === 'scenarios') {
    const scenario = index.scenarioById.get(entityId);
    if (scenario) {
      return {
        groupKey: `feature:${scenario.featureRef}`,
        kind: 'feature',
        primaryRefId: scenario.featureRef,
        featureId: scenario.featureRef,
      };
    }
  }

  // Plan task tied to a feature → owning feature
  if (sourceType === 'plan') {
    const task = index.taskById.get(entityId);
    if (task?.featureId) {
      return {
        groupKey: `feature:${task.featureId}`,
        kind: 'feature',
        primaryRefId: task.featureId,
        featureId: task.featureId,
      };
    }
    return {
      groupKey: `plan:${entityId}`,
      kind: 'plan',
      primaryRefId: entityId,
      featureId: null,
    };
  }

  if (sourceType === 'features') {
    // Feature hits may refer to the feature itself or to an invariant; we
    // group by feature when the id resolves to a feature, otherwise stand
    // the hit on its own.
    if (index.featureById.has(entityId)) {
      return {
        groupKey: `feature:${entityId}`,
        kind: 'feature',
        primaryRefId: entityId,
        featureId: entityId,
      };
    }
    return {
      groupKey: `standalone:${entityId}`,
      kind: 'standalone',
      primaryRefId: entityId,
      featureId: null,
    };
  }

  if (sourceType === 'architecture') {
    if (index.decisionById.has(entityId)) {
      return {
        groupKey: `decision:${entityId}`,
        kind: 'decision',
        primaryRefId: entityId,
        featureId: null,
      };
    }
    if (index.nfrById.has(entityId)) {
      return {
        groupKey: `nfr:${entityId}`,
        kind: 'nfr',
        primaryRefId: entityId,
        featureId: null,
      };
    }
    return {
      groupKey: `standalone:${entityId}`,
      kind: 'standalone',
      primaryRefId: entityId,
      featureId: null,
    };
  }

  if (sourceType === 'product') {
    return {
      groupKey: `product:${entityId}`,
      kind: 'product',
      primaryRefId: entityId,
      featureId: null,
    };
  }

  return {
    groupKey: `standalone:${entityId}`,
    kind: 'standalone',
    primaryRefId: entityId,
    featureId: null,
  };
}

function sourceFromHit(hit: SearchResultItem): GenerativeSearchSource {
  return {
    entityId: hit.entity_id,
    sourceType: hit.source_type,
    sourceFile: hit.source_file,
    score: hit.score,
    title: hit.title,
  };
}

function groupTitle(group: GroupAccumulator, index: ArtifactIndex): string {
  if (group.kind === 'feature' && group.featureId) {
    const feature = index.featureById.get(group.featureId);
    return feature?.name ?? group.primaryRefId;
  }
  if (group.kind === 'decision') {
    const decision = index.decisionById.get(group.primaryRefId);
    return decision?.title ?? group.primaryRefId;
  }
  if (group.kind === 'nfr') {
    const nfr = index.nfrById.get(group.primaryRefId);
    return nfr?.description ?? group.primaryRefId;
  }
  if (group.kind === 'plan') {
    const task = index.taskById.get(group.primaryRefId);
    return task?.description ?? group.primaryRefId;
  }
  return group.sources[0]?.title ?? group.primaryRefId;
}

// ---------------------------------------------------------------------------
// Composition — produce the prose chunks for a single group
// ---------------------------------------------------------------------------

function composeFeatureSnippet(
  group: GroupAccumulator,
  index: ArtifactIndex,
  graph: CrossRefGraph | null,
  query: string,
): NarrativeChunk[] {
  const featureId = group.featureId!;
  const feature = index.featureById.get(featureId);
  const scenarioSources = group.sources.filter((s) => s.sourceType === 'scenarios');
  const taskSources = group.sources.filter((s) => s.sourceType === 'plan');
  const otherSources = group.sources.filter(
    (s) => s.sourceType !== 'scenarios' && s.sourceType !== 'plan' && s.sourceType !== 'features',
  );
  const epics = epicsForFeature(index, featureId);

  const chunks: NarrativeChunk[] = [];
  chunks.push(txt(`Your search for "${query}" surfaces feature `));
  chunks.push(tok(featureId, graph));
  if (feature) {
    chunks.push(txt(` — ${feature.name}. ${feature.description.trim()} `));
  } else {
    chunks.push(txt('. '));
  }

  if (epics.length > 0) {
    chunks.push(txt(`This feature belongs to epic${epics.length === 1 ? '' : 's'} `));
    chunks.push(
      ...joinRefs(
        epics.map((e) => e.id),
        graph,
        (id) => index.epicById.get(id)?.name ?? null,
      ),
    );
    chunks.push(txt('. '));
  }

  if (scenarioSources.length > 0) {
    chunks.push(
      txt(
        `Verification coverage includes ${scenarioSources.length} related scenario${
          scenarioSources.length === 1 ? '' : 's'
        }: `,
      ),
    );
    chunks.push(
      ...joinRefs(
        scenarioSources.map((s) => s.entityId),
        graph,
        (id) => index.scenarioById.get(id)?.description ?? null,
      ),
    );
    chunks.push(txt('. '));
  }

  if (taskSources.length > 0) {
    chunks.push(txt(`Implementation plan tasks `));
    chunks.push(
      ...joinRefs(
        taskSources.map((s) => s.entityId),
        graph,
      ),
    );
    chunks.push(txt(` are linked to this feature. `));
  }

  if (otherSources.length > 0) {
    chunks.push(
      txt(
        `Additional references from ${otherSources
          .map((s) => s.sourceType)
          .filter((t, i, arr) => arr.indexOf(t) === i)
          .join(', ')} reinforce this topic.`,
      ),
    );
  }

  return chunks;
}

function composeDecisionSnippet(
  group: GroupAccumulator,
  index: ArtifactIndex,
  graph: CrossRefGraph | null,
  query: string,
): NarrativeChunk[] {
  const decision = index.decisionById.get(group.primaryRefId);
  const chunks: NarrativeChunk[] = [];
  chunks.push(txt(`Architecture decision `));
  chunks.push(tok(group.primaryRefId, graph));
  if (decision) {
    chunks.push(txt(` — ${decision.title}`));
    if (decision.rationale) chunks.push(txt(` — ${decision.rationale.trim()}`));
    else if (decision.decision) chunks.push(txt(` — ${decision.decision.trim()}`));
  }
  chunks.push(txt(`. This decision matches your search for "${query}".`));
  return chunks;
}

function composeNfrSnippet(
  group: GroupAccumulator,
  index: ArtifactIndex,
  graph: CrossRefGraph | null,
  query: string,
): NarrativeChunk[] {
  const nfr = index.nfrById.get(group.primaryRefId);
  const chunks: NarrativeChunk[] = [];
  chunks.push(txt(`Non-functional requirement `));
  chunks.push(tok(group.primaryRefId, graph));
  if (nfr) {
    chunks.push(txt(` — ${nfr.description.trim()}`));
    if (nfr.mechanism) chunks.push(txt(`. Mechanism: ${nfr.mechanism.trim()}`));
  }
  chunks.push(txt(`. Surfaced by your search for "${query}".`));
  return chunks;
}

function composePlanSnippet(
  group: GroupAccumulator,
  index: ArtifactIndex,
  graph: CrossRefGraph | null,
  query: string,
): NarrativeChunk[] {
  const task = index.taskById.get(group.primaryRefId);
  const chunks: NarrativeChunk[] = [];
  chunks.push(txt(`Plan task `));
  chunks.push(tok(group.primaryRefId, graph));
  if (task) {
    chunks.push(txt(` — ${task.description.trim()}`));
  }
  chunks.push(txt(`. Matches your search for "${query}".`));
  return chunks;
}

function composeProductSnippet(
  group: GroupAccumulator,
  _index: ArtifactIndex,
  graph: CrossRefGraph | null,
  query: string,
): NarrativeChunk[] {
  const chunks: NarrativeChunk[] = [];
  chunks.push(txt(`Product-level context `));
  chunks.push(tok(group.primaryRefId, graph));
  if (group.sources[0]?.title) {
    chunks.push(txt(` — ${group.sources[0].title.trim()}`));
  }
  chunks.push(txt(`. Related to your search for "${query}".`));
  return chunks;
}

function composeStandaloneSnippet(
  group: GroupAccumulator,
  graph: CrossRefGraph | null,
  query: string,
): NarrativeChunk[] {
  const chunks: NarrativeChunk[] = [];
  chunks.push(txt(`Reference `));
  chunks.push(tok(group.primaryRefId, graph));
  if (group.sources[0]?.title) {
    chunks.push(txt(` — ${group.sources[0].title.trim()}`));
  }
  chunks.push(txt(`. Matches your search for "${query}".`));
  return chunks;
}

function composeChunksFor(
  group: GroupAccumulator,
  index: ArtifactIndex,
  graph: CrossRefGraph | null,
  query: string,
): NarrativeChunk[] {
  switch (group.kind) {
    case 'feature':
      return composeFeatureSnippet(group, index, graph, query);
    case 'decision':
      return composeDecisionSnippet(group, index, graph, query);
    case 'nfr':
      return composeNfrSnippet(group, index, graph, query);
    case 'plan':
      return composePlanSnippet(group, index, graph, query);
    case 'product':
      return composeProductSnippet(group, index, graph, query);
    default:
      return composeStandaloneSnippet(group, graph, query);
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface ComposeSearchOptions {
  /** Optional cap on the number of results. */
  readonly limit?: number;
}

/**
 * Compose AI-style generative search results for a given query.
 */
export function composeGenerativeSearch(
  query: string,
  searchIndex: SearchIndex,
  artifacts: ReadonlyArray<ArtifactResult>,
  graph: CrossRefGraph | null,
  options?: ComposeSearchOptions,
): GenerativeSearchResponse {
  const trimmed = query.trim();
  if (trimmed.length === 0) {
    return {
      query: '',
      results: [],
      hitCount: 0,
      epics: [],
      composedAt: new Date().toISOString(),
    };
  }

  const hits = searchIndex.search(trimmed);
  if (hits.length === 0) {
    return {
      query: trimmed,
      results: [],
      hitCount: 0,
      epics: [],
      composedAt: new Date().toISOString(),
    };
  }

  const index = buildArtifactIndex(artifacts);

  // Group hits by topic key.
  const groups = new Map<string, GroupAccumulator>();
  for (const hit of hits) {
    const { groupKey, kind, primaryRefId, featureId } = pickGroupingKey(hit, index);
    const existing = groups.get(groupKey);
    if (existing) {
      existing.sources.push(sourceFromHit(hit));
      existing.totalScore += hit.score;
      if (hit.score > existing.bestScore) existing.bestScore = hit.score;
    } else {
      groups.set(groupKey, {
        id: groupKey,
        kind,
        primaryRefId,
        featureId,
        title: '',
        sources: [sourceFromHit(hit)],
        totalScore: hit.score,
        bestScore: hit.score,
      });
    }
  }

  // Finalize titles.
  for (const group of groups.values()) {
    group.title = groupTitle(group, index);
  }

  // Sort groups by aggregate relevance (sum score), tie-broken by best score.
  const ordered = [...groups.values()].sort((a, b) => {
    if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
    return b.bestScore - a.bestScore;
  });

  const limit = options?.limit ?? ordered.length;
  const sliced = ordered.slice(0, limit);

  const epicSet = new Map<string, GenerativeSearchEpicRef>();
  const results: GenerativeSearchResult[] = sliced.map((group) => {
    const epics = group.featureId ? epicsForFeature(index, group.featureId) : [];
    for (const e of epics) {
      if (!epicSet.has(e.id)) epicSet.set(e.id, e);
    }
    const chunks = composeChunksFor(group, index, graph, trimmed);
    return {
      id: group.id,
      title: group.title,
      kind: group.kind,
      relevance: group.totalScore,
      chunks,
      sources: group.sources.slice().sort((a, b) => b.score - a.score),
      epics,
      primaryRefId: group.primaryRefId,
    };
  });

  return {
    query: trimmed,
    results,
    hitCount: hits.length,
    epics: [...epicSet.values()],
    composedAt: new Date().toISOString(),
  };
}

/**
 * Count the distinct set of epics referenced across all results.
 * Exposed for test/UI convenience.
 */
export function distinctEpicsInResults(
  results: readonly GenerativeSearchResult[],
): readonly GenerativeSearchEpicRef[] {
  const map = new Map<string, GenerativeSearchEpicRef>();
  for (const r of results) {
    for (const e of r.epics) {
      if (!map.has(e.id)) map.set(e.id, e);
    }
  }
  return [...map.values()];
}
