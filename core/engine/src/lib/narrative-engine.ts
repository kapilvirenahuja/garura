/**
 * Garura Narrative Composition Engine
 *
 * Composes structured narrative prose from underlying Garura artifacts via
 * the tool layer in `narrative-tools.ts`. Output is a Narrative tree of
 * sections, each section holding an ordered list of chunks — plain text or
 * embedded CrossRefTokens.
 *
 * Content caching is keyed by epic id + SHA-256 of every relevant artifact
 * (path + parsed content). The cache is invalidated automatically when any
 * parsed artifact changes; cache hits return the stored narrative without
 * recomposition.
 *
 * CRITICAL INVARIANTS:
 *   - No raw YAML is ever embedded in the narrative. All data comes from
 *     already-normalized parsed artifact content.
 *   - CrossRef IDs are emitted as NarrativeToken chunks — never inline in
 *     text strings — so the renderer can display them as interactive
 *     components (never raw `[F1]` text in prose strings).
 *   - Density modes ("low" ≤3 features, "high" ≥10 features) drive
 *     progressive disclosure and grouping — ensuring low-density epics feel
 *     substantive and high-density epics stay readable.
 *
 * Fulfills: mdb-narrative-engine (caching + composition).
 */

import crypto from 'node:crypto';
import type { ArtifactResult } from './artifact-parser';
import type { CrossRefGraph } from './crossref-resolver';
import {
  narrativeTools,
  normalizeEpicId,
  type ArchitectureSummary,
  type EpicContextResult,
  type FeatureSummary,
  type PlanStatusSummary,
  type ProductSummaryResult,
  type ScenarioSummary,
  type StmEvidenceSummaryForNarrative,
  type ToolResolverContext,
} from './narrative-tools';
import { selectNarrativeCtas, type CtaAction } from './narrative-ctas';

// ---------------------------------------------------------------------------
// Types — Narrative tree
// ---------------------------------------------------------------------------

export interface NarrativeToken {
  readonly refId: string;
  readonly dangling: boolean;
}

export interface NarrativeTextChunk {
  readonly type: 'text';
  readonly text: string;
}

export interface NarrativeTokenChunk {
  readonly type: 'token';
  readonly token: NarrativeToken;
}

export type NarrativeChunk = NarrativeTextChunk | NarrativeTokenChunk;

export interface NarrativeSection {
  readonly id: string;
  readonly heading: string;
  readonly level: 2 | 3;
  readonly chunks: readonly NarrativeChunk[];
  readonly subsections?: readonly NarrativeSection[];
  readonly collapseByDefault?: boolean;
}

export type NarrativeDensity = 'low' | 'normal' | 'high';

export interface Narrative {
  readonly epicId: string;
  readonly epicName: string;
  readonly status: string;
  readonly featureCount: number;
  readonly density: NarrativeDensity;
  readonly sections: readonly NarrativeSection[];
  /**
   * Contextual CTAs surfaced at the bottom of the narrative. Selection is
   * dynamic — driven by the epic's current lifecycle state. Always contains
   * at least one primary action and one always-available secondary action.
   */
  readonly actions: readonly CtaAction[];
  readonly contentHash: string;
  readonly composedAt: string;
  readonly composerMode: 'deterministic' | 'ai';
}

export interface ComposeContext {
  readonly epicId: string;
  readonly artifacts: ReadonlyArray<ArtifactResult>;
  readonly graph: CrossRefGraph;
}

export interface NarrativeResponse {
  readonly narrative: Narrative;
  readonly fromCache: boolean;
}

// ---------------------------------------------------------------------------
// Content hashing
// ---------------------------------------------------------------------------

/**
 * Compute a content hash over all artifact identity+content.
 * Any change to a parsed artifact's content (or its presence) produces a
 * different hash, invalidating the narrative cache.
 */
export function computeContentHash(artifacts: ReadonlyArray<ArtifactResult>): string {
  const h = crypto.createHash('sha256');
  const sorted = [...artifacts].sort((a, b) => {
    if (a.path !== b.path) return a.path.localeCompare(b.path);
    return a.type.localeCompare(b.type);
  });
  for (const art of sorted) {
    h.update(`type:${art.type}\n`);
    h.update(`path:${art.path}\n`);
    h.update(`status:${art.status}\n`);
    h.update(`content:${stableStringify(art.content)}\n`);
    h.update('---\n');
  }
  return h.digest('hex');
}

/** Deterministic JSON stringify with sorted keys so the hash is stable. */
function stableStringify(value: unknown): string {
  if (value === null || value === undefined) return 'null';
  if (typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) {
    return '[' + value.map(stableStringify).join(',') + ']';
  }
  const rec = value as Record<string, unknown>;
  const keys = Object.keys(rec).sort();
  return '{' + keys.map((k) => JSON.stringify(k) + ':' + stableStringify(rec[k])).join(',') + '}';
}

// ---------------------------------------------------------------------------
// In-memory narrative cache
// ---------------------------------------------------------------------------

interface CacheEntry {
  readonly contentHash: string;
  readonly narrative: Narrative;
}

const narrativeCache: Map<string, CacheEntry> = new Map();

/** Build the cache key — scoped by epic id so different epics don't collide. */
function cacheKey(epicId: string): string {
  return normalizeEpicId(epicId);
}

/** Clear a single epic's cached narrative (or all when no id is supplied). */
export function invalidateNarrativeCache(epicId?: string): void {
  if (epicId === undefined) {
    narrativeCache.clear();
    return;
  }
  narrativeCache.delete(cacheKey(epicId));
}

/** Test-only helper — expose cache size. */
export function narrativeCacheSize(): number {
  return narrativeCache.size;
}

// ---------------------------------------------------------------------------
// Chunk helpers
// ---------------------------------------------------------------------------

function txt(text: string): NarrativeTextChunk {
  return { type: 'text', text };
}

function tok(refId: string, graph: CrossRefGraph): NarrativeTokenChunk {
  return {
    type: 'token',
    token: { refId, dangling: !graph.nodes.has(refId) },
  };
}

/**
 * Render a list of ref IDs as a conversational list interleaved with text:
 *   "A", "B and C" with embedded CrossRefTokens.
 */
function joinRefs(
  refIds: readonly string[],
  graph: CrossRefGraph,
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
// Deterministic composer
// ---------------------------------------------------------------------------

function composeOverview(
  epic: EpicContextResult,
  product: ProductSummaryResult,
  featureCount: number,
  graph: CrossRefGraph,
): NarrativeSection {
  const chunks: NarrativeChunk[] = [];
  chunks.push(txt('The '));
  chunks.push(tok(epic.epicId, graph));
  chunks.push(txt(` epic — ${epic.name} — `));
  if (product.description) {
    chunks.push(txt(`sits within ${product.description.trim()} `));
  } else {
    chunks.push(txt('is part of the product. '));
  }
  chunks.push(txt(`It encompasses ${featureCount} feature${featureCount === 1 ? '' : 's'}`));
  if (epic.featureIds.length > 0) {
    chunks.push(txt(': '));
    chunks.push(...joinRefs(epic.featureIds, graph));
  }
  chunks.push(txt('.'));

  if (epic.status) {
    chunks.push(txt(` The epic is currently ${humaniseStatus(epic.status)}`));
    if (epic.phase) chunks.push(txt(` in the ${epic.phase} phase`));
    if (epic.timeline?.start && epic.timeline.end) {
      chunks.push(txt(`, scheduled ${epic.timeline.start} → ${epic.timeline.end}`));
    }
    chunks.push(txt('.'));
  }

  return {
    id: 'overview',
    heading: 'Overview',
    level: 2,
    chunks,
  };
}

function humaniseStatus(status: string): string {
  const s = status.trim();
  if (!s) return 'in progress';
  return s.replace(/[-_]/g, ' ');
}

function composeContext(product: ProductSummaryResult): NarrativeSection | null {
  if (!product.goals.length && !product.constraints.length) return null;
  const chunks: NarrativeChunk[] = [];
  if (product.goals.length) {
    chunks.push(
      txt(
        `The enclosing product pursues ${product.goals.length} strategic goal${
          product.goals.length === 1 ? '' : 's'
        }: ${product.goals.slice(0, 4).join('; ')}. `,
      ),
    );
  }
  if (product.constraints.length) {
    chunks.push(
      txt(
        `It operates under ${product.constraints.length} constraint${
          product.constraints.length === 1 ? '' : 's'
        }: ${product.constraints.slice(0, 4).join('; ')}.`,
      ),
    );
  }
  return {
    id: 'context',
    heading: 'Strategic Context',
    level: 2,
    chunks,
  };
}

function composeFeatures(
  features: readonly FeatureSummary[],
  density: NarrativeDensity,
  graph: CrossRefGraph,
): NarrativeSection {
  if (features.length === 0) {
    return {
      id: 'features',
      heading: 'Features',
      level: 2,
      chunks: [txt('No features are currently assigned to this epic in features.yaml.')],
    };
  }

  // High density (≥10) → group by capability domain, one subsection per group.
  if (density === 'high') {
    const groups = new Map<string, FeatureSummary[]>();
    for (const f of features) {
      const key = f.capabilityDomain || 'general';
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(f);
    }
    const chunks: NarrativeChunk[] = [
      txt(
        `This epic spans ${features.length} features across ${groups.size} capability domain${
          groups.size === 1 ? '' : 's'
        }. ` +
          'Features are grouped below so related work stays together and the reader can drill in one area at a time.',
      ),
    ];
    const subsections: NarrativeSection[] = [];
    for (const [domain, feats] of groups) {
      const subChunks: NarrativeChunk[] = [
        txt(`${feats.length} feature${feats.length === 1 ? '' : 's'} in this domain: `),
        ...joinRefs(
          feats.map((f) => f.id),
          graph,
          (id) => feats.find((f) => f.id === id)?.name ?? null,
        ),
        txt('. '),
      ];
      subsections.push({
        id: `features-${slug(domain)}`,
        heading: humaniseDomain(domain),
        level: 3,
        chunks: subChunks,
        collapseByDefault: true,
      });
    }
    return {
      id: 'features',
      heading: 'Features',
      level: 2,
      chunks,
      subsections,
    };
  }

  // Low density (≤3) → expand each feature with behaviours and richer prose.
  if (density === 'low') {
    const chunks: NarrativeChunk[] = [
      features.length === 1
        ? txt(
            'This epic is built around a single focused feature. Below we describe what it delivers, how it behaves, and how it connects to the rest of the product.',
          )
        : txt(
            `This epic is scoped to ${features.length} features so each one gets detailed treatment. Below we describe what each feature delivers, how it behaves, and how it connects to the rest of the product.`,
          ),
    ];
    const subsections: NarrativeSection[] = features.map((f) => {
      const sub: NarrativeChunk[] = [];
      sub.push(tok(f.id, graph));
      sub.push(txt(` — ${f.description} `));
      if (f.capabilityDomain) {
        sub.push(
          txt(`It belongs to the ${humaniseDomain(f.capabilityDomain)} capability domain. `),
        );
      }
      if (f.behaviors.length) {
        sub.push(
          txt(
            `The feature encodes ${f.behaviors.length} observable behaviour${
              f.behaviors.length === 1 ? '' : 's'
            }: ${f.behaviors.map((b) => b.description).join('; ')}.`,
          ),
        );
      } else {
        sub.push(
          txt(
            "No explicit behaviours are declared — the feature's contract is expressed entirely through its verification scenarios.",
          ),
        );
      }
      return {
        id: `feature-${slug(f.id)}`,
        heading: f.name,
        level: 3,
        chunks: sub,
      };
    });
    return {
      id: 'features',
      heading: 'Features',
      level: 2,
      chunks,
      subsections,
    };
  }

  // Normal density → flowing prose with token list.
  const chunks: NarrativeChunk[] = [];
  chunks.push(txt(`This epic delivers ${features.length} features: `));
  chunks.push(
    ...joinRefs(
      features.map((f) => f.id),
      graph,
      (id) => features.find((f) => f.id === id)?.name ?? null,
    ),
  );
  chunks.push(
    txt(
      ". Each feature contributes a distinct capability; together they form the epic's vertical slice.",
    ),
  );
  return {
    id: 'features',
    heading: 'Features',
    level: 2,
    chunks,
  };
}

function composeCoverage(
  features: readonly FeatureSummary[],
  scenarios: readonly ScenarioSummary[],
  graph: CrossRefGraph,
): NarrativeSection {
  const byFeature = new Map<string, ScenarioSummary[]>();
  for (const s of scenarios) {
    if (!byFeature.has(s.featureRef)) byFeature.set(s.featureRef, []);
    byFeature.get(s.featureRef)!.push(s);
  }

  if (scenarios.length === 0) {
    return {
      id: 'coverage',
      heading: 'Verification Coverage',
      level: 2,
      chunks: [
        txt(
          "No verification scenarios are currently linked to this epic's features. Coverage will appear here once scenarios.yaml references them.",
        ),
      ],
    };
  }

  const totalFeatures = features.length;
  const coveredFeatures = Array.from(byFeature.keys()).filter((id) =>
    features.some((f) => f.id === id),
  ).length;

  const chunks: NarrativeChunk[] = [
    txt(
      `${scenarios.length} verification scenario${scenarios.length === 1 ? '' : 's'} cover ` +
        `${coveredFeatures} of this epic\'s ${totalFeatures} feature${totalFeatures === 1 ? '' : 's'}. ` +
        'Scenarios describe the observable contract that must hold before the epic can ship. ',
    ),
  ];
  features.forEach((f, i) => {
    const scenariosForFeature = byFeature.get(f.id) ?? [];
    if (scenariosForFeature.length === 0) return;
    if (i > 0 || chunks.length > 1) chunks.push(txt(' '));
    chunks.push(tok(f.id, graph));
    chunks.push(txt(` is verified by `));
    chunks.push(
      ...joinRefs(
        scenariosForFeature.map((s) => s.id),
        graph,
      ),
    );
    chunks.push(txt('.'));
  });
  return {
    id: 'coverage',
    heading: 'Verification Coverage',
    level: 2,
    chunks,
  };
}

function composeArchitecture(
  arch: ArchitectureSummary,
  graph: CrossRefGraph,
): NarrativeSection | null {
  if (!arch.decisions.length && !arch.nfrs.length && !arch.patterns.length) return null;

  const chunks: NarrativeChunk[] = [];
  if (arch.decisions.length) {
    chunks.push(
      txt(
        `${arch.decisions.length} architecture decision${arch.decisions.length === 1 ? '' : 's'} shape${
          arch.decisions.length === 1 ? 's' : ''
        } how this epic is built: `,
      ),
    );
    chunks.push(
      ...joinRefs(
        arch.decisions.map((d) => d.id),
        graph,
        (id) => arch.decisions.find((d) => d.id === id)?.title ?? null,
      ),
    );
    chunks.push(txt('. '));
  }
  if (arch.patterns.length) {
    chunks.push(
      txt(
        `The implementation applies the following pattern${arch.patterns.length === 1 ? '' : 's'}: ${arch.patterns.map((p) => p.name).join('; ')}. `,
      ),
    );
  }
  if (arch.nfrs.length) {
    chunks.push(
      txt(
        `${arch.nfrs.length} non-functional requirement${arch.nfrs.length === 1 ? '' : 's'} apply: `,
      ),
    );
    chunks.push(
      ...joinRefs(
        arch.nfrs.map((n) => n.id),
        graph,
      ),
    );
    chunks.push(txt('.'));
  }

  return {
    id: 'architecture',
    heading: 'Architecture Decisions',
    level: 2,
    chunks,
  };
}

function composeImplementation(
  plan: PlanStatusSummary,
  graph: CrossRefGraph,
): NarrativeSection | null {
  if (plan.tasks.length === 0 && plan.milestones.length === 0) return null;
  const chunks: NarrativeChunk[] = [];
  chunks.push(
    txt(
      `${plan.tasks.length} implementation task${plan.tasks.length === 1 ? '' : 's'} are planned ` +
        `across ${plan.milestones.length} milestone${plan.milestones.length === 1 ? '' : 's'}. `,
    ),
  );
  plan.milestones.forEach((m, i) => {
    if (i > 0) chunks.push(txt(' '));
    chunks.push(txt(`${m.name}: `));
    chunks.push(...joinRefs(m.taskIds, graph));
    chunks.push(txt('.'));
  });
  return {
    id: 'implementation',
    heading: 'Implementation Plan',
    level: 2,
    chunks,
  };
}

function composeEvidence(evidence: StmEvidenceSummaryForNarrative): NarrativeSection | null {
  if (evidence.playHistory.length === 0 && evidence.qualityChecks.length === 0) return null;
  const chunks: NarrativeChunk[] = [];
  if (evidence.playHistory.length) {
    chunks.push(
      txt(
        `${evidence.playHistory.length} play execution${evidence.playHistory.length === 1 ? '' : 's'} have been recorded: ` +
          `${evidence.playHistory.map((p) => `${p.name} (${p.status})`).join('; ')}.`,
      ),
    );
  }
  if (evidence.qualityChecks.length) {
    chunks.push(
      txt(
        ` ${evidence.qualityChecks.length} quality-check run${evidence.qualityChecks.length === 1 ? '' : 's'} have been captured` +
          `${evidence.qualityChecks.some((q) => /fail|fail/i.test(q.status)) ? ' — some with failures to review' : ''}.`,
      ),
    );
  }
  return {
    id: 'evidence',
    heading: 'Execution Evidence',
    level: 2,
    chunks,
  };
}

// ---------------------------------------------------------------------------
// Public API — compose + cache
// ---------------------------------------------------------------------------

/**
 * Compose an epic narrative deterministically from the resolver context.
 * Uses the tool layer so the composition path is identical to what an LLM
 * would invoke when the AI SDK composer is wired in.
 */
export function composeEpicNarrativeDeterministic(ctx: ComposeContext): Narrative {
  const toolCtx: ToolResolverContext = { artifacts: ctx.artifacts, graph: ctx.graph };

  const epic = narrativeTools.readEpicContext.execute({ epicId: ctx.epicId }, toolCtx);
  const product = narrativeTools.readProductSummary.execute({}, toolCtx);
  const features = narrativeTools.readFeaturesForEpic.execute(
    { featureIds: epic.featureIds },
    toolCtx,
  );
  const scenarios = narrativeTools.readScenariosForFeatures.execute(
    { featureIds: epic.featureIds },
    toolCtx,
  );
  const arch = narrativeTools.readArchitectureContext.execute({}, toolCtx);
  const plan = narrativeTools.readPlanStatusForEpic.execute(
    { featureIds: epic.featureIds },
    toolCtx,
  );
  const evidence = narrativeTools.readStmEvidenceForEpic.execute({ epicId: epic.epicId }, toolCtx);

  const density: NarrativeDensity =
    features.length <= 3 ? 'low' : features.length >= 10 ? 'high' : 'normal';

  const sections: NarrativeSection[] = [];
  sections.push(composeOverview(epic, product, features.length, ctx.graph));
  const context = composeContext(product);
  if (context) sections.push(context);
  sections.push(composeFeatures(features, density, ctx.graph));
  sections.push(composeCoverage(features, scenarios, ctx.graph));
  const archSection = composeArchitecture(arch, ctx.graph);
  if (archSection) sections.push(archSection);
  const implSection = composeImplementation(plan, ctx.graph);
  if (implSection) sections.push(implSection);
  const evSection = composeEvidence(evidence);
  if (evSection) sections.push(evSection);

  const actions = selectNarrativeCtas({
    featureCount: features.length,
    hasArchitecture: arch.decisions.length + arch.patterns.length + arch.nfrs.length > 0,
    hasPlan: plan.tasks.length > 0,
    hasImplementationEvidence: evidence.playHistory.some((p) =>
      /(^|-)implement(-|$)|implementation/i.test(p.name),
    ),
    hasQualityEvidence:
      evidence.qualityChecks.length > 0 ||
      evidence.playHistory.some((p) => /quality[-_]?check|validate-epic/i.test(p.name)),
  });

  return {
    epicId: epic.epicId,
    epicName: epic.name,
    status: epic.status,
    featureCount: features.length,
    density,
    sections,
    actions,
    contentHash: computeContentHash(ctx.artifacts),
    composedAt: new Date().toISOString(),
    composerMode: 'deterministic',
  };
}

/**
 * Returns a narrative for the given epic context, serving from cache when the
 * artifact content hash is unchanged. Cache invalidates automatically when
 * the hash differs (i.e. any parsed artifact changed).
 */
export function getEpicNarrative(ctx: ComposeContext): NarrativeResponse {
  const key = cacheKey(ctx.epicId);
  const hash = computeContentHash(ctx.artifacts);
  const cached = narrativeCache.get(key);
  if (cached && cached.contentHash === hash) {
    return { narrative: cached.narrative, fromCache: true };
  }
  const narrative = composeEpicNarrativeDeterministic(ctx);
  narrativeCache.set(key, { contentHash: hash, narrative });
  return { narrative, fromCache: false };
}

// ---------------------------------------------------------------------------
// Minor helpers
// ---------------------------------------------------------------------------

function slug(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function humaniseDomain(domain: string): string {
  if (!domain) return 'General';
  return domain
    .split(/[-_\s]+/)
    .filter((part) => part.length > 0)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}
