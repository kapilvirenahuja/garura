/**
 * MDB Artifact Parser
 *
 * Server-side YAML/Markdown parser for all Meridian artifact types.
 * Uses js-yaml for YAML parsing and gray-matter for Markdown frontmatter extraction.
 * Returns normalized ArtifactResult objects with schema normalization for version variations.
 *
 * Fulfills: VAL-FOUND-012 through VAL-FOUND-024
 */

import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';
import matter from 'gray-matter';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Supported artifact types */
export type ArtifactType =
  | 'product'
  | 'features'
  | 'scenarios'
  | 'plan'
  | 'architecture'
  | 'tech'
  | 'roadmap'
  | 'stm-evidence-yaml'
  | 'stm-evidence-markdown';

/** Parse result status */
export type ArtifactStatus = 'ok' | 'missing' | 'empty' | 'error';

// --- Normalized content models ---

export interface ProductContent {
  readonly name: string;
  readonly description: string;
  readonly goals: ReadonlyArray<{ readonly id?: string; readonly description: string }>;
  readonly constraints: ReadonlyArray<{ readonly id?: string; readonly description: string }>;
  readonly status?: string;
  readonly createdAt?: string;
  readonly updatedAt?: string;
}

export interface FeatureEntry {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly capabilityDomain: string;
  readonly behaviors?: ReadonlyArray<{
    readonly id: string;
    readonly description: string;
  }>;
}

export interface FeaturesContent {
  readonly slug?: string;
  readonly status?: string;
  readonly features: ReadonlyArray<FeatureEntry>;
  readonly invariants?: ReadonlyArray<{
    readonly id: string;
    readonly description: string;
  }>;
  readonly identity?: {
    readonly whatItIs?: string;
    readonly whatItIsNot?: string;
    readonly coreJobs?: ReadonlyArray<string>;
  };
}

export interface ScenarioEntry {
  readonly id: string;
  readonly featureRef: string;
  readonly behaviorRef?: string;
  readonly description: string;
  readonly given?: string;
  readonly when?: string;
  readonly then?: string;
  readonly expectedBehavior?: string;
  readonly passCriteria?: ReadonlyArray<string>;
  readonly automation?: string;
}

export interface ScenariosContent {
  readonly slug?: string;
  readonly status?: string;
  readonly scenarios: ReadonlyArray<ScenarioEntry>;
}

export interface TaskEntry {
  readonly id: string;
  readonly featureId?: string;
  readonly description: string;
  readonly dependsOn: ReadonlyArray<string>;
  readonly exitGate?: string;
  readonly scenarioGate?: {
    readonly scenarioIds: ReadonlyArray<string>;
    readonly count: number;
  };
}

export interface MilestoneEntry {
  readonly id: string;
  readonly name: string;
  readonly tasks: ReadonlyArray<string>;
}

export interface PlanContent {
  readonly slug?: string;
  readonly status?: string;
  readonly executionOrder: ReadonlyArray<TaskEntry>;
  readonly milestones: ReadonlyArray<MilestoneEntry>;
  readonly prerequisites?: ReadonlyArray<{
    readonly id: string;
    readonly description: string;
  }>;
}

export interface ComponentEntry {
  readonly id: string;
  readonly name: string;
  readonly type?: string;
  readonly responsibility?: string;
  readonly interfaces?: ReadonlyArray<string>;
  readonly dependencies?: ReadonlyArray<string>;
}

export interface DecisionEntry {
  readonly id: string;
  readonly title: string;
  readonly status: string;
  readonly context?: string;
  readonly decision?: string;
  readonly rationale?: string;
  readonly consequences?: ReadonlyArray<string>;
}

export interface PatternEntry {
  readonly id: string;
  readonly name: string;
  readonly scope?: string;
  readonly description?: string;
}

export interface NfrMapping {
  readonly nfrId: string;
  readonly description: string;
  readonly mechanism?: string;
  readonly verification?: string;
}

export interface ArchitectureContent {
  readonly slug?: string;
  readonly status?: string;
  readonly components: ReadonlyArray<ComponentEntry>;
  readonly decisions: ReadonlyArray<DecisionEntry>;
  readonly patterns: ReadonlyArray<PatternEntry>;
  readonly nfrMappings: ReadonlyArray<NfrMapping>;
}

export interface TechProjectFile {
  readonly path: string;
  readonly component?: string;
  readonly feature?: string;
  readonly description?: string;
}

export interface TechLibrary {
  readonly name: string;
  readonly version?: string;
  readonly purpose?: string;
  readonly feature?: string;
}

export interface TechDataModel {
  readonly name: string;
  readonly fields: ReadonlyArray<{
    readonly name: string;
    readonly type: string;
    readonly description?: string;
  }>;
}

export interface TechComponent {
  readonly name: string;
  readonly type?: string;
  readonly responsibility?: string;
  readonly methods?: ReadonlyArray<string>;
}

export interface TechContent {
  readonly slug?: string;
  readonly status?: string;
  readonly projectStructure: {
    readonly create: ReadonlyArray<TechProjectFile>;
    readonly modify: ReadonlyArray<TechProjectFile>;
  };
  readonly libraries: ReadonlyArray<TechLibrary>;
  readonly dataModels: ReadonlyArray<TechDataModel>;
  readonly components: ReadonlyArray<TechComponent>;
  readonly featureMapping: Record<string, ReadonlyArray<string>>;
}

export interface EpicEntry {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly features: ReadonlyArray<string>;
  readonly phase: string;
  readonly timeline?: {
    readonly start: string;
    readonly end: string;
  };
  readonly status?: string;
  readonly priority?: number;
}

export interface PhaseEntry {
  readonly id: string;
  readonly name: string;
  readonly description?: string;
  readonly start?: string;
  readonly end?: string;
}

export interface SequencingEntry {
  readonly from: string;
  readonly to: string;
  readonly reason?: string;
}

export interface RoadmapContent {
  readonly slug?: string;
  readonly status?: string;
  readonly epics: ReadonlyArray<EpicEntry>;
  readonly phases: ReadonlyArray<PhaseEntry>;
  readonly sequencing: ReadonlyArray<SequencingEntry>;
}

export interface StmEvidenceYamlContent {
  readonly issue?: {
    readonly number?: number;
    readonly title?: string;
    readonly state?: string;
    readonly labels?: ReadonlyArray<string>;
    readonly url?: string;
  };
  readonly status?: string;
  readonly timestamp?: string;
  readonly artifactReferences?: ReadonlyArray<{
    readonly type: string;
    readonly id: string;
    readonly path?: string;
  }>;
  /** Raw parsed data for fields not in the normalized model */
  readonly raw: Record<string, unknown>;
}

export interface StmEvidenceMarkdownContent {
  readonly frontmatter: Record<string, unknown>;
  readonly body: string;
  readonly sections: ReadonlyArray<{
    readonly heading: string;
    readonly level: number;
    readonly content: string;
  }>;
}

/** Union of all possible content types */
export type ArtifactContent =
  | ProductContent
  | FeaturesContent
  | ScenariosContent
  | PlanContent
  | ArchitectureContent
  | TechContent
  | RoadmapContent
  | StmEvidenceYamlContent
  | StmEvidenceMarkdownContent;

/** The result returned by the parser for every artifact read */
export interface ArtifactResult<T extends ArtifactContent = ArtifactContent> {
  readonly type: ArtifactType;
  readonly path: string;
  readonly status: ArtifactStatus;
  readonly content: T | null;
  readonly error?: string;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function readFileSync(filePath: string): string | null {
  try {
    if (!fs.existsSync(filePath)) {
      return null;
    }
    return fs.readFileSync(filePath, 'utf-8');
  } catch {
    return null;
  }
}

function parseYaml(raw: string): Record<string, unknown> | null {
  const parsed = yaml.load(raw);
  if (!parsed || typeof parsed !== 'object') {
    return null;
  }
  return parsed as Record<string, unknown>;
}

function asString(val: unknown, fallback = ''): string {
  if (typeof val === 'string') return val;
  if (val === null || val === undefined) return fallback;
  return String(val);
}

function asArray<T>(val: unknown): T[] {
  if (Array.isArray(val)) return val as T[];
  return [];
}

function asRecord(val: unknown): Record<string, unknown> {
  if (val && typeof val === 'object' && !Array.isArray(val)) {
    return val as Record<string, unknown>;
  }
  return {};
}

// ---------------------------------------------------------------------------
// Markdown section parser
// ---------------------------------------------------------------------------

function parseMarkdownSections(
  body: string,
): Array<{ heading: string; level: number; content: string }> {
  const lines = body.split('\n');
  const sections: Array<{ heading: string; level: number; content: string }> = [];
  let currentHeading = '';
  let currentLevel = 0;
  let currentContent: string[] = [];

  for (const line of lines) {
    const headingMatch = /^(#{1,6})\s+(.+)$/.exec(line);
    if (headingMatch) {
      // Flush previous section
      if (currentHeading || currentContent.length > 0) {
        sections.push({
          heading: currentHeading,
          level: currentLevel,
          content: currentContent.join('\n').trim(),
        });
      }
      currentLevel = headingMatch[1]!.length;
      currentHeading = headingMatch[2]!.trim();
      currentContent = [];
    } else {
      currentContent.push(line);
    }
  }

  // Flush last section
  if (currentHeading || currentContent.length > 0) {
    sections.push({
      heading: currentHeading,
      level: currentLevel,
      content: currentContent.join('\n').trim(),
    });
  }

  return sections;
}

// ---------------------------------------------------------------------------
// Normalizers — convert raw YAML data into normalized models
// ---------------------------------------------------------------------------

function normalizeProduct(raw: Record<string, unknown>): ProductContent {
  // Schema v1: name, description, goals (array of {id, description}), constraints
  // Schema v2: project_name, project_description, strategic_goals (string[]), project_constraints (string[])
  const name = asString(raw['name'] ?? raw['project_name']);
  const description = asString(raw['description'] ?? raw['project_description']);

  // Normalize goals — support both object array and string array
  const rawGoals = asArray<unknown>(raw['goals'] ?? raw['strategic_goals']);
  const goals = rawGoals.map((g, idx) => {
    if (typeof g === 'string') {
      return { description: g };
    }
    const obj = asRecord(g);
    return {
      id: asString(obj['id'] ?? `G${idx + 1}`),
      description: asString(obj['description'] ?? obj['goal'] ?? ''),
    };
  });

  // Normalize constraints — support both object array and string array
  const rawConstraints = asArray<unknown>(raw['constraints'] ?? raw['project_constraints']);
  const constraints = rawConstraints.map((c, idx) => {
    if (typeof c === 'string') {
      return { description: c };
    }
    const obj = asRecord(c);
    return {
      id: asString(obj['id'] ?? `C${idx + 1}`),
      description: asString(obj['description'] ?? ''),
    };
  });

  return {
    name,
    description,
    goals,
    constraints,
    status: asString(raw['status'] ?? raw['lifecycle']),
    createdAt: asString(raw['created_at']),
    updatedAt: asString(raw['updated_at']),
  };
}

function normalizeFeatures(raw: Record<string, unknown>): FeaturesContent {
  const rawFeatures = asArray<unknown>(raw['features']);
  const features: FeatureEntry[] = rawFeatures.map((f) => {
    const obj = asRecord(f);
    return {
      id: asString(obj['id']),
      name: asString(obj['name']),
      description: asString(obj['description']),
      capabilityDomain: asString(obj['capability_domain'] ?? obj['capabilityDomain']),
      behaviors: asArray<unknown>(obj['behaviors']).map((b) => {
        const bObj = asRecord(b);
        return {
          id: asString(bObj['id']),
          description: asString(bObj['description']),
        };
      }),
    };
  });

  const rawInvariants = asArray<unknown>(raw['invariants']);
  const invariants = rawInvariants.map((inv) => {
    const obj = asRecord(inv);
    return {
      id: asString(obj['id']),
      description: asString(obj['description']),
    };
  });

  const identity = asRecord(raw['identity']);

  return {
    slug: asString(raw['slug']),
    status: asString(raw['status']),
    features,
    invariants,
    identity:
      Object.keys(identity).length > 0
        ? {
            whatItIs: asString(identity['what_it_is'] ?? identity['whatItIs']),
            whatItIsNot: asString(identity['what_it_is_not'] ?? identity['whatItIsNot']),
            coreJobs: asArray<string>(identity['core_jobs'] ?? identity['coreJobs']),
          }
        : undefined,
  };
}

function normalizeScenarios(raw: Record<string, unknown>): ScenariosContent {
  const rawScenarios = asArray<unknown>(raw['scenarios']);
  const scenarios: ScenarioEntry[] = rawScenarios.map((s) => {
    const obj = asRecord(s);
    const givenVal = obj['given'];
    const whenVal = obj['when'];
    const thenVal = obj['then'];
    return {
      id: asString(obj['id']),
      featureRef: asString(obj['feature_ref'] ?? obj['featureRef']),
      behaviorRef: asString(obj['behavior_ref'] ?? obj['behaviorRef']),
      description: asString(obj['description']),
      ...(givenVal !== undefined && givenVal !== null ? { given: asString(givenVal) } : {}),
      ...(whenVal !== undefined && whenVal !== null ? { when: asString(whenVal) } : {}),
      ...(thenVal !== undefined && thenVal !== null ? { then: asString(thenVal) } : {}),
      expectedBehavior: asString(obj['expected_behavior'] ?? obj['expectedBehavior']),
      passCriteria: asArray<string>(obj['pass_criteria'] ?? obj['passCriteria']),
      automation: asString(obj['automation']),
    };
  });

  return {
    slug: asString(raw['slug']),
    status: asString(raw['status']),
    scenarios,
  };
}

function normalizePlan(raw: Record<string, unknown>): PlanContent {
  const rawExecOrder = asArray<unknown>(raw['execution_order'] ?? raw['executionOrder']);
  const executionOrder: TaskEntry[] = rawExecOrder.map((t) => {
    const obj = asRecord(t);
    const scenarioGateRaw = asRecord(obj['scenario_gate'] ?? obj['scenarioGate']);
    return {
      id: asString(obj['id']),
      featureId: asString(obj['feature_id'] ?? obj['featureId']),
      description: asString(obj['description']),
      dependsOn: asArray<string>(obj['depends_on'] ?? obj['dependsOn']),
      exitGate: asString(obj['exit_gate'] ?? obj['exitGate']),
      scenarioGate:
        Object.keys(scenarioGateRaw).length > 0
          ? {
              scenarioIds: asArray<string>(
                scenarioGateRaw['scenario_ids'] ?? scenarioGateRaw['scenarioIds'],
              ),
              count: typeof scenarioGateRaw['count'] === 'number' ? scenarioGateRaw['count'] : 0,
            }
          : undefined,
    };
  });

  const rawMilestones = asArray<unknown>(raw['milestones']);
  const milestones: MilestoneEntry[] = rawMilestones.map((m) => {
    const obj = asRecord(m);
    return {
      id: asString(obj['id']),
      name: asString(obj['name']),
      tasks: asArray<string>(obj['tasks']),
    };
  });

  const rawPrereqs = asArray<unknown>(raw['prerequisites']);
  const prerequisites = rawPrereqs.map((p) => {
    const obj = asRecord(p);
    return {
      id: asString(obj['id']),
      description: asString(obj['description']),
    };
  });

  return {
    slug: asString(raw['slug']),
    status: asString(raw['status']),
    executionOrder,
    milestones,
    prerequisites,
  };
}

function normalizeArchitecture(raw: Record<string, unknown>): ArchitectureContent {
  const rawComponents = asArray<unknown>(raw['components']);
  const components: ComponentEntry[] = rawComponents.map((c) => {
    const obj = asRecord(c);
    return {
      id: asString(obj['id']),
      name: asString(obj['name']),
      type: asString(obj['type']),
      responsibility: asString(obj['responsibility']),
      interfaces: asArray<string>(obj['interfaces']),
      dependencies: asArray<string>(obj['dependencies']),
    };
  });

  const rawDecisions = asArray<unknown>(raw['decisions']);
  const decisions: DecisionEntry[] = rawDecisions.map((d) => {
    const obj = asRecord(d);
    return {
      id: asString(obj['id']),
      title: asString(obj['title']),
      status: asString(obj['status']),
      context: asString(obj['context']),
      decision: asString(obj['decision']),
      rationale: asString(obj['rationale']),
      consequences: asArray<string>(obj['consequences']),
    };
  });

  const rawPatterns = asArray<unknown>(raw['patterns']);
  const patterns: PatternEntry[] = rawPatterns.map((p) => {
    const obj = asRecord(p);
    return {
      id: asString(obj['id']),
      name: asString(obj['name']),
      scope: asString(obj['scope']),
      description: asString(obj['description']),
    };
  });

  const rawNfrMappings = asArray<unknown>(raw['nfr_mappings'] ?? raw['nfrMappings']);
  const nfrMappings: NfrMapping[] = rawNfrMappings.map((n) => {
    const obj = asRecord(n);
    return {
      nfrId: asString(obj['nfr_id'] ?? obj['nfrId']),
      description: asString(obj['description']),
      mechanism: asString(obj['mechanism']),
      verification: asString(obj['verification']),
    };
  });

  return {
    slug: asString(raw['slug']),
    status: asString(raw['status']),
    components,
    decisions,
    patterns,
    nfrMappings,
  };
}

function normalizeTech(raw: Record<string, unknown>): TechContent {
  const projectStructureRaw = asRecord(raw['project_structure'] ?? raw['projectStructure']);
  const createFiles = asArray<unknown>(projectStructureRaw['create']).map((f) => {
    const obj = asRecord(f);
    return {
      path: asString(obj['path']),
      component: asString(obj['component']),
      feature: asString(obj['feature']),
      description: asString(obj['description']),
    };
  });
  const modifyFiles = asArray<unknown>(projectStructureRaw['modify']).map((f) => {
    const obj = asRecord(f);
    return {
      path: asString(obj['path']),
      component: asString(obj['component']),
      feature: asString(obj['feature']),
      description: asString(obj['description']),
    };
  });

  const libraries = asArray<unknown>(raw['libraries']).map((l) => {
    const obj = asRecord(l);
    return {
      name: asString(obj['name']),
      version: asString(obj['version']),
      purpose: asString(obj['purpose']),
      feature: asString(obj['feature']),
    };
  });

  const dataModels = asArray<unknown>(raw['data_models'] ?? raw['dataModels']).map((m) => {
    const obj = asRecord(m);
    return {
      name: asString(obj['name']),
      fields: asArray<unknown>(obj['fields']).map((fld) => {
        const fObj = asRecord(fld);
        return {
          name: asString(fObj['name']),
          type: asString(fObj['type']),
          description: asString(fObj['description']),
        };
      }),
    };
  });

  const components = asArray<unknown>(raw['components']).map((c) => {
    const obj = asRecord(c);
    return {
      name: asString(obj['name']),
      type: asString(obj['type']),
      responsibility: asString(obj['responsibility']),
      methods: asArray<string>(obj['methods']),
    };
  });

  const featureMappingRaw = asRecord(raw['feature_mapping'] ?? raw['featureMapping']);
  const featureMapping: Record<string, ReadonlyArray<string>> = {};
  for (const [key, val] of Object.entries(featureMappingRaw)) {
    featureMapping[key] = asArray<string>(val);
  }

  return {
    slug: asString(raw['slug']),
    status: asString(raw['status']),
    projectStructure: { create: createFiles, modify: modifyFiles },
    libraries,
    dataModels,
    components,
    featureMapping,
  };
}

function normalizeRoadmap(raw: Record<string, unknown>): RoadmapContent {
  const epics: EpicEntry[] = asArray<unknown>(raw['epics']).map((e) => {
    const obj = asRecord(e);
    const timelineRaw = asRecord(obj['timeline']);
    return {
      id: asString(obj['id']),
      name: asString(obj['name']),
      description: asString(obj['description']),
      features: asArray<string>(obj['features']),
      phase: asString(obj['phase']),
      timeline:
        Object.keys(timelineRaw).length > 0
          ? {
              start: asString(timelineRaw['start']),
              end: asString(timelineRaw['end']),
            }
          : undefined,
      status: asString(obj['status']),
      priority: typeof obj['priority'] === 'number' ? obj['priority'] : undefined,
    };
  });

  const phases: PhaseEntry[] = asArray<unknown>(raw['phases']).map((p) => {
    const obj = asRecord(p);
    return {
      id: asString(obj['id']),
      name: asString(obj['name']),
      description: asString(obj['description']),
      start: asString(obj['start']),
      end: asString(obj['end']),
    };
  });

  const sequencing: SequencingEntry[] = asArray<unknown>(raw['sequencing']).map((s) => {
    const obj = asRecord(s);
    return {
      from: asString(obj['from']),
      to: asString(obj['to']),
      reason: asString(obj['reason']),
    };
  });

  return {
    slug: asString(raw['slug']),
    status: asString(raw['status']),
    epics,
    phases,
    sequencing,
  };
}

function normalizeStmEvidenceYaml(raw: Record<string, unknown>): StmEvidenceYamlContent {
  const issueRaw = asRecord(raw['issue']);
  const issue =
    Object.keys(issueRaw).length > 0
      ? {
          number: typeof issueRaw['number'] === 'number' ? issueRaw['number'] : undefined,
          title: asString(issueRaw['title']),
          state: asString(issueRaw['state']),
          labels: asArray<string>(issueRaw['labels']),
          url: asString(issueRaw['url']),
        }
      : undefined;

  const rawRefs = asArray<unknown>(raw['artifact_references'] ?? raw['artifactReferences']);
  const artifactReferences = rawRefs.map((r) => {
    const obj = asRecord(r);
    return {
      type: asString(obj['type']),
      id: asString(obj['id']),
      path: asString(obj['path']),
    };
  });

  return {
    issue,
    status: asString(raw['status']),
    timestamp: asString(raw['timestamp']),
    artifactReferences,
    raw,
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Detect artifact type from file path and optional hint.
 */
export function detectArtifactType(filePath: string, hint?: ArtifactType): ArtifactType {
  if (hint) return hint;

  const basename = path.basename(filePath).toLowerCase();
  const ext = path.extname(filePath).toLowerCase();

  // Markdown files are STM evidence
  if (ext === '.md') return 'stm-evidence-markdown';

  // YAML-based detection
  if (basename === 'product.yaml') return 'product';
  if (basename === 'features.yaml') return 'features';
  if (basename === 'scenarios.yaml') return 'scenarios';
  if (basename === 'plan.yaml') return 'plan';
  if (basename === 'architecture.yaml') return 'architecture';
  if (basename === 'tech.yaml') return 'tech';
  if (basename === 'roadmap.yaml') return 'roadmap';

  // Default: treat YAML in evidence directories as STM evidence
  return 'stm-evidence-yaml';
}

/**
 * Parse a single Meridian artifact file.
 *
 * @param filePath - Absolute path to the artifact file
 * @param type - Optional artifact type hint (auto-detected from filename if omitted)
 * @returns ArtifactResult with parsed content or error/empty/missing status
 */
export function parseArtifact<T extends ArtifactContent = ArtifactContent>(
  filePath: string,
  type?: ArtifactType,
): ArtifactResult<T> {
  const artifactType = detectArtifactType(filePath, type);
  const baseResult = { type: artifactType, path: filePath };

  // 1. Check if file exists
  const raw = readFileSync(filePath);
  if (raw === null) {
    return { ...baseResult, status: 'missing', content: null };
  }

  // 2. Check if file is empty
  if (raw.trim().length === 0) {
    return { ...baseResult, status: 'empty', content: null };
  }

  // 3. Handle Markdown files (STM evidence with frontmatter)
  if (artifactType === 'stm-evidence-markdown') {
    try {
      const { data, content: body } = matter(raw);
      const sections = parseMarkdownSections(body);
      const result: StmEvidenceMarkdownContent = {
        frontmatter: data,
        body,
        sections,
      };
      return { ...baseResult, status: 'ok', content: result as T };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return { ...baseResult, status: 'error', content: null, error: message };
    }
  }

  // 4. Parse YAML
  let parsed: Record<string, unknown> | null;
  try {
    parsed = parseYaml(raw);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { ...baseResult, status: 'error', content: null, error: message };
  }

  if (parsed === null) {
    return { ...baseResult, status: 'empty', content: null };
  }

  // 5. Normalize based on type
  try {
    let content: ArtifactContent;
    switch (artifactType) {
      case 'product':
        content = normalizeProduct(parsed);
        break;
      case 'features':
        content = normalizeFeatures(parsed);
        break;
      case 'scenarios':
        content = normalizeScenarios(parsed);
        break;
      case 'plan':
        content = normalizePlan(parsed);
        break;
      case 'architecture':
        content = normalizeArchitecture(parsed);
        break;
      case 'tech':
        content = normalizeTech(parsed);
        break;
      case 'roadmap':
        content = normalizeRoadmap(parsed);
        break;
      case 'stm-evidence-yaml':
        content = normalizeStmEvidenceYaml(parsed);
        break;
      default:
        content = normalizeStmEvidenceYaml(parsed);
    }
    return { ...baseResult, status: 'ok', content: content as T };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { ...baseResult, status: 'error', content: null, error: message };
  }
}

/**
 * Parse multiple artifact files in batch.
 *
 * @param files - Array of { path, type? } entries
 * @returns Array of ArtifactResult objects
 */
export function parseArtifacts(
  files: ReadonlyArray<{ path: string; type?: ArtifactType }>,
): ArtifactResult[] {
  return files.map((f) => parseArtifact(f.path, f.type));
}
