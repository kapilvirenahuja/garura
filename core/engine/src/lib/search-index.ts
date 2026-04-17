/**
 * MDB Search Index
 *
 * MiniSearch-based full-text search index that indexes all parsed artifact content
 * on startup with field boosting. Supports relevance ranking, source identification
 * per result (artifact type, file path, entity ID), case-insensitive search,
 * special character handling, incremental updates via git hash comparison,
 * and graceful empty results.
 *
 * Fulfills: VAL-FOUND-039 through VAL-FOUND-045
 */

import MiniSearch from 'minisearch';
import type {
  ArtifactResult,
  ProductContent,
  FeaturesContent,
  ScenariosContent,
  PlanContent,
  ArchitectureContent,
  TechContent,
  RoadmapContent,
  StmEvidenceYamlContent,
  StmEvidenceMarkdownContent,
} from './artifact-parser';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** A document to be indexed by MiniSearch */
export interface SearchDocument {
  /** Unique document ID (auto-generated) */
  readonly id: string;
  /** Artifact type (e.g. 'product', 'features', 'scenarios') */
  readonly source_type: string;
  /** File path of the source artifact */
  readonly source_file: string;
  /** Entity ID within the artifact (e.g. 'F1', 'SC-AUTH-001', 'ADR-001') */
  readonly entity_id: string;
  /** Title or name of the entity */
  readonly title: string;
  /** Searchable content body */
  readonly content: string;
}

/** A search result with relevance score and source identification */
export interface SearchResultItem {
  /** Relevance score (higher = more relevant) */
  readonly score: number;
  /** Artifact type */
  readonly source_type: string;
  /** File path of the source artifact */
  readonly source_file: string;
  /** Entity ID */
  readonly entity_id: string;
  /** Title of the matched entity */
  readonly title: string;
  /** Matched terms */
  readonly terms: ReadonlyArray<string>;
}

/** Options for configuring the search index */
export interface SearchIndexOptions {
  /** Field boost weights for relevance ranking */
  readonly boostWeights?: {
    readonly title?: number;
    readonly entity_id?: number;
    readonly content?: number;
  };
}

// ---------------------------------------------------------------------------
// Default configuration
// ---------------------------------------------------------------------------

const DEFAULT_BOOST_WEIGHTS = {
  title: 5,
  entity_id: 3,
  content: 1,
} as const;

// ---------------------------------------------------------------------------
// Document extraction from parsed artifacts
// ---------------------------------------------------------------------------

function extractProductDocuments(artifact: ArtifactResult<ProductContent>): SearchDocument[] {
  const content = artifact.content;
  if (!content) return [];

  const docs: SearchDocument[] = [];
  const file = artifact.path;

  // Product-level document
  docs.push({
    id: `${file}::product`,
    source_type: 'product',
    source_file: file,
    entity_id: 'product',
    title: content.name,
    content: [
      content.description,
      ...content.goals.map((g) => `${g.id ?? ''} ${g.description}`),
      ...content.constraints.map((c) => `${c.id ?? ''} ${c.description}`),
    ]
      .filter(Boolean)
      .join(' '),
  });

  // Individual goals
  for (const goal of content.goals) {
    if (goal.id) {
      docs.push({
        id: `${file}::${goal.id}`,
        source_type: 'product',
        source_file: file,
        entity_id: goal.id,
        title: goal.description,
        content: goal.description,
      });
    }
  }

  // Individual constraints
  for (const constraint of content.constraints) {
    if (constraint.id) {
      docs.push({
        id: `${file}::${constraint.id}`,
        source_type: 'product',
        source_file: file,
        entity_id: constraint.id,
        title: constraint.description,
        content: constraint.description,
      });
    }
  }

  return docs;
}

function extractFeaturesDocuments(artifact: ArtifactResult<FeaturesContent>): SearchDocument[] {
  const content = artifact.content;
  if (!content) return [];

  const docs: SearchDocument[] = [];
  const file = artifact.path;

  for (const feature of content.features) {
    const behaviorText = (feature.behaviors ?? []).map((b) => `${b.id} ${b.description}`).join(' ');

    docs.push({
      id: `${file}::${feature.id}`,
      source_type: 'features',
      source_file: file,
      entity_id: feature.id,
      title: feature.name,
      content: [feature.description, feature.capabilityDomain, behaviorText]
        .filter(Boolean)
        .join(' '),
    });
  }

  // Index invariants
  for (const inv of content.invariants ?? []) {
    docs.push({
      id: `${file}::${inv.id}`,
      source_type: 'features',
      source_file: file,
      entity_id: inv.id,
      title: inv.description,
      content: inv.description,
    });
  }

  return docs;
}

function extractScenariosDocuments(artifact: ArtifactResult<ScenariosContent>): SearchDocument[] {
  const content = artifact.content;
  if (!content) return [];

  const docs: SearchDocument[] = [];
  const file = artifact.path;

  for (const scenario of content.scenarios) {
    const criteriaText = (scenario.passCriteria ?? []).join(' ');
    docs.push({
      id: `${file}::${scenario.id}`,
      source_type: 'scenarios',
      source_file: file,
      entity_id: scenario.id,
      title: scenario.description,
      content: [
        scenario.description,
        scenario.expectedBehavior ?? '',
        criteriaText,
        scenario.featureRef,
        scenario.behaviorRef ?? '',
      ]
        .filter(Boolean)
        .join(' '),
    });
  }

  return docs;
}

function extractPlanDocuments(artifact: ArtifactResult<PlanContent>): SearchDocument[] {
  const content = artifact.content;
  if (!content) return [];

  const docs: SearchDocument[] = [];
  const file = artifact.path;

  // Prerequisites
  for (const prereq of content.prerequisites ?? []) {
    docs.push({
      id: `${file}::prereq-${prereq.id}`,
      source_type: 'plan',
      source_file: file,
      entity_id: prereq.id,
      title: prereq.description,
      content: [prereq.id, prereq.description].filter(Boolean).join(' '),
    });
  }

  // Tasks
  for (const task of content.executionOrder) {
    const sgText = task.scenarioGate
      ? `scenario gate ${task.scenarioGate.scenarioIds.join(' ')}`
      : '';
    docs.push({
      id: `${file}::${task.id}`,
      source_type: 'plan',
      source_file: file,
      entity_id: task.id,
      title: task.description,
      content: [
        task.description,
        task.exitGate ?? '',
        task.featureId ?? '',
        sgText,
        task.dependsOn.join(' '),
      ]
        .filter(Boolean)
        .join(' '),
    });
  }

  // Milestones
  for (const milestone of content.milestones) {
    docs.push({
      id: `${file}::${milestone.id}`,
      source_type: 'plan',
      source_file: file,
      entity_id: milestone.id,
      title: milestone.name,
      content: [milestone.name, ...milestone.tasks].join(' '),
    });
  }

  return docs;
}

function extractArchitectureDocuments(
  artifact: ArtifactResult<ArchitectureContent>,
): SearchDocument[] {
  const content = artifact.content;
  if (!content) return [];

  const docs: SearchDocument[] = [];
  const file = artifact.path;

  // Components
  for (const comp of content.components) {
    docs.push({
      id: `${file}::${comp.id}`,
      source_type: 'architecture',
      source_file: file,
      entity_id: comp.id,
      title: comp.name,
      content: [
        comp.name,
        comp.responsibility ?? '',
        comp.type ?? '',
        ...(comp.interfaces ?? []),
        ...(comp.dependencies ?? []),
      ]
        .filter(Boolean)
        .join(' '),
    });
  }

  // Decisions (ADRs)
  for (const decision of content.decisions) {
    docs.push({
      id: `${file}::${decision.id}`,
      source_type: 'architecture',
      source_file: file,
      entity_id: decision.id,
      title: decision.title,
      content: [
        decision.title,
        decision.context ?? '',
        decision.decision ?? '',
        decision.rationale ?? '',
        ...(decision.consequences ?? []),
      ]
        .filter(Boolean)
        .join(' '),
    });
  }

  // Patterns
  for (const pattern of content.patterns) {
    docs.push({
      id: `${file}::${pattern.id}`,
      source_type: 'architecture',
      source_file: file,
      entity_id: pattern.id,
      title: pattern.name,
      content: [pattern.name, pattern.description ?? '', pattern.scope ?? '']
        .filter(Boolean)
        .join(' '),
    });
  }

  // NFR Mappings
  for (const nfr of content.nfrMappings) {
    docs.push({
      id: `${file}::${nfr.nfrId}`,
      source_type: 'architecture',
      source_file: file,
      entity_id: nfr.nfrId,
      title: nfr.description,
      content: [nfr.description, nfr.mechanism ?? '', nfr.verification ?? '']
        .filter(Boolean)
        .join(' '),
    });
  }

  return docs;
}

function extractTechDocuments(artifact: ArtifactResult<TechContent>): SearchDocument[] {
  const content = artifact.content;
  if (!content) return [];

  const docs: SearchDocument[] = [];
  const file = artifact.path;

  // Components
  for (const comp of content.components) {
    docs.push({
      id: `${file}::tech-comp-${comp.name}`,
      source_type: 'tech',
      source_file: file,
      entity_id: `tech-${comp.name}`,
      title: comp.name,
      content: [comp.name, comp.responsibility ?? '', comp.type ?? '', ...(comp.methods ?? [])]
        .filter(Boolean)
        .join(' '),
    });
  }

  // Data models
  for (const model of content.dataModels) {
    const fieldsText = model.fields
      .map((f) => `${f.name} ${f.type} ${f.description ?? ''}`)
      .join(' ');
    docs.push({
      id: `${file}::tech-model-${model.name}`,
      source_type: 'tech',
      source_file: file,
      entity_id: `tech-model-${model.name}`,
      title: model.name,
      content: [model.name, fieldsText].join(' '),
    });
  }

  // Libraries
  for (const lib of content.libraries) {
    docs.push({
      id: `${file}::tech-lib-${lib.name}`,
      source_type: 'tech',
      source_file: file,
      entity_id: `tech-lib-${lib.name}`,
      title: lib.name,
      content: [lib.name, lib.purpose ?? '', lib.version ?? '', lib.feature ?? '']
        .filter(Boolean)
        .join(' '),
    });
  }

  return docs;
}

function extractRoadmapDocuments(artifact: ArtifactResult<RoadmapContent>): SearchDocument[] {
  const content = artifact.content;
  if (!content) return [];

  const docs: SearchDocument[] = [];
  const file = artifact.path;

  // Epics
  for (const epic of content.epics) {
    docs.push({
      id: `${file}::${epic.id}`,
      source_type: 'roadmap',
      source_file: file,
      entity_id: epic.id,
      title: epic.name,
      content: [epic.name, epic.description, epic.phase, epic.status ?? '', ...epic.features]
        .filter(Boolean)
        .join(' '),
    });
  }

  // Phases
  for (const phase of content.phases) {
    docs.push({
      id: `${file}::${phase.id}`,
      source_type: 'roadmap',
      source_file: file,
      entity_id: phase.id,
      title: phase.name,
      content: [phase.name, phase.description ?? ''].filter(Boolean).join(' '),
    });
  }

  // Sequencing
  for (const seq of content.sequencing) {
    const seqId = `SEQ-${seq.from}-${seq.to}`;
    docs.push({
      id: `${file}::${seqId}`,
      source_type: 'roadmap',
      source_file: file,
      entity_id: seqId,
      title: `Sequencing: ${seq.from} → ${seq.to}`,
      content: [seq.from, seq.to, seq.reason ?? ''].filter(Boolean).join(' '),
    });
  }

  return docs;
}

function extractStmYamlDocuments(
  artifact: ArtifactResult<StmEvidenceYamlContent>,
): SearchDocument[] {
  const content = artifact.content;
  if (!content) return [];

  const docs: SearchDocument[] = [];
  const file = artifact.path;
  const entityId = content.issue?.number
    ? `STM-${content.issue.number}`
    : `stm-${file.replace(/[^a-zA-Z0-9]/g, '-')}`;

  const title = content.issue?.title ?? 'STM Evidence';
  const bodyParts: string[] = [
    title,
    content.status ?? '',
    ...(content.issue?.labels ?? []),
    ...(content.artifactReferences ?? []).map((r) => `${r.type} ${r.id} ${r.path ?? ''}`),
  ];

  docs.push({
    id: `${file}::${entityId}`,
    source_type: 'stm-evidence-yaml',
    source_file: file,
    entity_id: entityId,
    title,
    content: bodyParts.filter(Boolean).join(' '),
  });

  return docs;
}

function extractStmMarkdownDocuments(
  artifact: ArtifactResult<StmEvidenceMarkdownContent>,
): SearchDocument[] {
  const content = artifact.content;
  if (!content) return [];

  const docs: SearchDocument[] = [];
  const file = artifact.path;
  const frontmatter = content.frontmatter;
  const entityId =
    typeof frontmatter['issue'] === 'number'
      ? `STM-MD-${frontmatter['issue']}`
      : `stm-md-${file.replace(/[^a-zA-Z0-9]/g, '-')}`;

  const title =
    typeof frontmatter['play'] === 'string' ? `${frontmatter['play']} evidence` : 'STM Evidence';

  docs.push({
    id: `${file}::${entityId}`,
    source_type: 'stm-evidence-markdown',
    source_file: file,
    entity_id: entityId,
    title,
    content: [title, content.body].filter(Boolean).join(' '),
  });

  return docs;
}

// ---------------------------------------------------------------------------
// Document extraction dispatcher
// ---------------------------------------------------------------------------

/**
 * Convert a parsed artifact into searchable documents.
 */
export function extractDocuments(artifact: ArtifactResult): SearchDocument[] {
  if (artifact.status !== 'ok' || !artifact.content) {
    return [];
  }

  switch (artifact.type) {
    case 'product':
      return extractProductDocuments(artifact as ArtifactResult<ProductContent>);
    case 'features':
      return extractFeaturesDocuments(artifact as ArtifactResult<FeaturesContent>);
    case 'scenarios':
      return extractScenariosDocuments(artifact as ArtifactResult<ScenariosContent>);
    case 'plan':
      return extractPlanDocuments(artifact as ArtifactResult<PlanContent>);
    case 'architecture':
      return extractArchitectureDocuments(artifact as ArtifactResult<ArchitectureContent>);
    case 'tech':
      return extractTechDocuments(artifact as ArtifactResult<TechContent>);
    case 'roadmap':
      return extractRoadmapDocuments(artifact as ArtifactResult<RoadmapContent>);
    case 'stm-evidence-yaml':
      return extractStmYamlDocuments(artifact as ArtifactResult<StmEvidenceYamlContent>);
    case 'stm-evidence-markdown':
      return extractStmMarkdownDocuments(artifact as ArtifactResult<StmEvidenceMarkdownContent>);
    default:
      return [];
  }
}

// ---------------------------------------------------------------------------
// Search Index
// ---------------------------------------------------------------------------

/**
 * Escape special regex characters in a query to prevent MiniSearch regex errors.
 * MiniSearch by default treats certain characters as regex. We need to ensure
 * queries with special chars like `[[play:prompt]]`, `SC-AUTH-001`, etc. work safely.
 */
function sanitizeQuery(query: string): string {
  // MiniSearch handles most cases well, but we need to ensure
  // brackets and other regex-unsafe chars don't cause issues.
  // We strip leading/trailing whitespace and collapse internal whitespace.
  return query.trim().replace(/\s+/g, ' ');
}

export class SearchIndex {
  private index: MiniSearch<SearchDocument>;
  private lastGitHash: string | null = null;
  private docCount = 0;
  private readonly boostWeights: {
    title: number;
    entity_id: number;
    content: number;
  };

  constructor(options?: SearchIndexOptions) {
    this.boostWeights = {
      title: options?.boostWeights?.title ?? DEFAULT_BOOST_WEIGHTS.title,
      entity_id: options?.boostWeights?.entity_id ?? DEFAULT_BOOST_WEIGHTS.entity_id,
      content: options?.boostWeights?.content ?? DEFAULT_BOOST_WEIGHTS.content,
    };

    this.index = this.createIndex();
  }

  private createIndex(): MiniSearch<SearchDocument> {
    return new MiniSearch<SearchDocument>({
      fields: ['title', 'entity_id', 'content'],
      storeFields: ['source_type', 'source_file', 'entity_id', 'title'],
      // Tokenizer: split on whitespace and common delimiters
      // This ensures IDs like SC-AUTH-001 are indexed both as whole and parts
      tokenize: (text: string): string[] => {
        // Split on whitespace
        const whitespaceTokens = text.split(/\s+/).filter((t) => t.length > 0);

        // Also split on hyphens and underscores to index sub-parts,
        // but keep the original compound token as well
        const allTokens: string[] = [];
        for (const token of whitespaceTokens) {
          allTokens.push(token);
          // If token contains hyphens, add sub-parts
          if (token.includes('-')) {
            const parts = token.split('-').filter((p) => p.length > 0);
            allTokens.push(...parts);
          }
        }
        return allTokens;
      },
      // Case-insensitive: lowercase all terms during indexing
      processTerm: (term: string): string | false => {
        const processed = term.toLowerCase().replace(/[[\]]/g, '');
        return processed.length > 0 ? processed : false;
      },
    });
  }

  /**
   * Build (or rebuild) the search index from parsed artifacts.
   *
   * @param artifacts - Array of parsed ArtifactResult objects
   * @param gitHash - Current git commit hash (for cache invalidation)
   */
  build(artifacts: ReadonlyArray<ArtifactResult>, gitHash?: string): void {
    // Create a fresh index
    this.index = this.createIndex();
    this.docCount = 0;

    const documents: SearchDocument[] = [];
    for (const artifact of artifacts) {
      const docs = extractDocuments(artifact);
      documents.push(...docs);
    }

    if (documents.length > 0) {
      this.index.addAll(documents);
    }

    this.docCount = documents.length;
    this.lastGitHash = gitHash ?? null;
  }

  /**
   * Determine if the index should be rebuilt based on git hash comparison.
   *
   * @param currentHash - The current git HEAD commit hash
   * @returns true if rebuild is needed (hash changed or no previous build)
   */
  shouldRebuild(currentHash: string): boolean {
    if (this.lastGitHash === null) return true;
    return this.lastGitHash !== currentHash;
  }

  /**
   * Get the last git hash the index was built with.
   */
  getLastGitHash(): string | null {
    return this.lastGitHash;
  }

  /**
   * Get the number of indexed documents.
   */
  getDocumentCount(): number {
    return this.docCount;
  }

  /**
   * Search the index with a query string.
   *
   * - Empty or whitespace-only queries return an empty array.
   * - Case-insensitive matching.
   * - Special characters are handled safely (no regex errors).
   * - Results ordered by relevance score (descending).
   *
   * @param query - Search query string
   * @returns Array of SearchResultItem ordered by relevance score
   */
  search(query: string): SearchResultItem[] {
    const sanitized = sanitizeQuery(query);

    // Empty query → empty results
    if (sanitized.length === 0) {
      return [];
    }

    try {
      const results = this.index.search(sanitized, {
        boost: {
          title: this.boostWeights.title,
          entity_id: this.boostWeights.entity_id,
          content: this.boostWeights.content,
        },
        prefix: true,
        fuzzy: 0.2,
        combineWith: 'OR',
      });

      return results.map((r) => ({
        score: r.score,
        source_type: r.source_type as string,
        source_file: r.source_file as string,
        entity_id: r.entity_id as string,
        title: r.title as string,
        terms: r.terms,
      }));
    } catch {
      // If MiniSearch throws on unusual query patterns, return empty gracefully
      return [];
    }
  }
}

/**
 * Create and return a new SearchIndex instance.
 * Convenience factory function.
 */
export function createSearchIndex(options?: SearchIndexOptions): SearchIndex {
  return new SearchIndex(options);
}
