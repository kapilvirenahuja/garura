/**
 * Artifact Parser — Unit Tests
 *
 * Covers all validation assertions:
 * - VAL-FOUND-012: Reads product.yaml
 * - VAL-FOUND-013: Reads features.yaml
 * - VAL-FOUND-014: Reads scenarios.yaml
 * - VAL-FOUND-015: Reads plan.yaml
 * - VAL-FOUND-016: Reads architecture.yaml
 * - VAL-FOUND-017: Reads tech.yaml
 * - VAL-FOUND-018: Reads roadmap.yaml
 * - VAL-FOUND-019: Reads STM Evidence — YAML
 * - VAL-FOUND-020: Reads STM Evidence — Markdown
 * - VAL-FOUND-021: Missing file does not crash
 * - VAL-FOUND-022: Malformed YAML graceful handling
 * - VAL-FOUND-023: Empty file graceful handling
 * - VAL-FOUND-024: Schema normalization
 */

import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  type ArchitectureContent,
  type FeaturesContent,
  type PlanContent,
  type ProductContent,
  type RoadmapContent,
  type ScenariosContent,
  type StmEvidenceMarkdownContent,
  type StmEvidenceYamlContent,
  type TechContent,
  detectArtifactType,
  parseArtifact,
  parseArtifacts,
} from '@/lib/artifact-parser';

const FIXTURES_DIR = path.resolve(__dirname, '../../test-fixtures/artifacts');

function fixturePath(name: string): string {
  return path.join(FIXTURES_DIR, name);
}

// ---------------------------------------------------------------------------
// Type detection
// ---------------------------------------------------------------------------
describe('detectArtifactType', () => {
  it('detects product.yaml', () => {
    expect(detectArtifactType('/some/path/product.yaml')).toBe('product');
  });

  it('detects features.yaml', () => {
    expect(detectArtifactType('/repo/features.yaml')).toBe('features');
  });

  it('detects scenarios.yaml', () => {
    expect(detectArtifactType('/repo/scenarios.yaml')).toBe('scenarios');
  });

  it('detects plan.yaml', () => {
    expect(detectArtifactType('/repo/plan.yaml')).toBe('plan');
  });

  it('detects architecture.yaml', () => {
    expect(detectArtifactType('/repo/architecture.yaml')).toBe('architecture');
  });

  it('detects tech.yaml', () => {
    expect(detectArtifactType('/repo/tech.yaml')).toBe('tech');
  });

  it('detects roadmap.yaml', () => {
    expect(detectArtifactType('/repo/roadmap.yaml')).toBe('roadmap');
  });

  it('detects markdown as stm-evidence-markdown', () => {
    expect(detectArtifactType('/evidence/20260326-062345.md')).toBe('stm-evidence-markdown');
  });

  it('defaults unknown yaml to stm-evidence-yaml', () => {
    expect(detectArtifactType('/evidence/issue-resolution.yaml')).toBe('stm-evidence-yaml');
  });

  it('uses explicit hint when provided', () => {
    expect(detectArtifactType('/any/file.yaml', 'product')).toBe('product');
  });
});

// ---------------------------------------------------------------------------
// VAL-FOUND-012: Reads product.yaml
// ---------------------------------------------------------------------------
describe('parseArtifact — product.yaml (VAL-FOUND-012)', () => {
  it('reads product.yaml and extracts name, description, goals, constraints', () => {
    const result = parseArtifact<ProductContent>(fixturePath('product.yaml'));

    expect(result.status).toBe('ok');
    expect(result.type).toBe('product');
    expect(result.content).not.toBeNull();

    const content = result.content!;
    expect(content.name).toBe('TaskFlow');
    expect(content.description).toContain('intelligent task management');
    expect(content.goals).toHaveLength(3);
    expect(content.goals[0]!.id).toBe('G1');
    expect(content.goals[0]!.description).toContain('context-switching');
    expect(content.constraints).toHaveLength(3);
    expect(content.constraints[0]!.id).toBe('C1');
    expect(content.constraints[0]!.description).toContain('offline');
    expect(content.status).toBe('LOCKED');
  });
});

// ---------------------------------------------------------------------------
// VAL-FOUND-013: Reads features.yaml
// ---------------------------------------------------------------------------
describe('parseArtifact — features.yaml (VAL-FOUND-013)', () => {
  it('reads features.yaml extracting feature IDs, names, descriptions, capability domains', () => {
    const result = parseArtifact<FeaturesContent>(fixturePath('features.yaml'));

    expect(result.status).toBe('ok');
    expect(result.type).toBe('features');
    expect(result.content).not.toBeNull();

    const content = result.content!;
    expect(content.features).toHaveLength(4);

    const f1 = content.features[0]!;
    expect(f1.id).toBe('F1');
    expect(f1.name).toBe('Task Inbox');
    expect(f1.description).toContain('Unified inbox');
    expect(f1.capabilityDomain).toBe('task-management');
    expect(f1.behaviors).toHaveLength(2);
    expect(f1.behaviors![0]!.id).toBe('F1-B1');

    const f2 = content.features[1]!;
    expect(f2.id).toBe('F2');
    expect(f2.capabilityDomain).toBe('ai-intelligence');
  });

  it('extracts invariants and identity sections', () => {
    const result = parseArtifact<FeaturesContent>(fixturePath('features.yaml'));
    const content = result.content!;

    expect(content.invariants).toHaveLength(2);
    expect(content.invariants![0]!.id).toBe('INV-TF-01');
    expect(content.identity).toBeDefined();
    expect(content.identity!.whatItIs).toContain('task management');
    expect(content.identity!.coreJobs).toHaveLength(3);
    expect(content.slug).toBe('taskflow');
    expect(content.status).toBe('LOCKED');
  });
});

// ---------------------------------------------------------------------------
// VAL-FOUND-014: Reads scenarios.yaml
// ---------------------------------------------------------------------------
describe('parseArtifact — scenarios.yaml (VAL-FOUND-014)', () => {
  it('reads scenarios.yaml extracting IDs, given/when/then, feature linkages', () => {
    const result = parseArtifact<ScenariosContent>(fixturePath('scenarios.yaml'));

    expect(result.status).toBe('ok');
    expect(result.type).toBe('scenarios');
    expect(result.content).not.toBeNull();

    const content = result.content!;
    expect(content.scenarios).toHaveLength(4);

    const sc1 = content.scenarios[0]!;
    expect(sc1.id).toBe('SC-TASK-001');
    expect(sc1.featureRef).toBe('F1');
    expect(sc1.behaviorRef).toBe('F1-B1');
    expect(sc1.description).toContain('Inbox displays tasks sorted');
    expect(sc1.expectedBehavior).toContain('sorted by');
    expect(sc1.passCriteria).toHaveLength(2);
    expect(sc1.automation).toBe('automated');

    // Verify feature linkage across scenarios
    const featureRefs = content.scenarios.map((s) => s.featureRef);
    expect(featureRefs).toContain('F1');
    expect(featureRefs).toContain('F2');
    expect(featureRefs).toContain('F3');
  });

  it('extracts given/when/then BDD fields when present', () => {
    const result = parseArtifact<ScenariosContent>(fixturePath('scenarios.yaml'));
    const content = result.content!;

    // SC-AI-001 has given/when/then
    const scAi = content.scenarios.find((s) => s.id === 'SC-AI-001')!;
    expect(scAi.given).toContain('upcoming deadline');
    expect(scAi.when).toContain('priority score is computed');
    expect(scAi.then).toContain('score is higher');

    // SC-AUTO-001 also has given/when/then
    const scAuto = content.scenarios.find((s) => s.id === 'SC-AUTO-001')!;
    expect(scAuto.given).toContain('PR is opened');
    expect(scAuto.when).toContain('webhook handler');
    expect(scAuto.then).toContain('in-review');
  });

  it('omits given/when/then fields when not present in YAML', () => {
    const result = parseArtifact<ScenariosContent>(fixturePath('scenarios.yaml'));
    const content = result.content!;

    // SC-TASK-001 does NOT have given/when/then
    const scTask = content.scenarios.find((s) => s.id === 'SC-TASK-001')!;
    expect(scTask.given).toBeUndefined();
    expect(scTask.when).toBeUndefined();
    expect(scTask.then).toBeUndefined();

    // existing fields still present
    expect(scTask.expectedBehavior).toContain('sorted by');
  });
});

// ---------------------------------------------------------------------------
// VAL-FOUND-015: Reads plan.yaml
// ---------------------------------------------------------------------------
describe('parseArtifact — plan.yaml (VAL-FOUND-015)', () => {
  it('reads plan.yaml extracting execution order, milestones, tasks, dependencies', () => {
    const result = parseArtifact<PlanContent>(fixturePath('plan.yaml'));

    expect(result.status).toBe('ok');
    expect(result.type).toBe('plan');
    expect(result.content).not.toBeNull();

    const content = result.content!;

    // Execution order
    expect(content.executionOrder).toHaveLength(4);
    const t11 = content.executionOrder[0]!;
    expect(t11.id).toBe('T1.1');
    expect(t11.featureId).toBe('F1');
    expect(t11.dependsOn).toEqual([]);
    expect(t11.exitGate).toContain('Task model');

    // Dependencies
    const t21 = content.executionOrder[2]!;
    expect(t21.id).toBe('T2.1');
    expect(t21.dependsOn).toContain('T1.1');
    expect(t21.scenarioGate).toBeDefined();
    expect(t21.scenarioGate!.scenarioIds).toContain('SC-AI-001');

    // Milestones
    expect(content.milestones).toHaveLength(3);
    expect(content.milestones[0]!.id).toBe('M1');
    expect(content.milestones[0]!.name).toBe('Core Data Layer');
    expect(content.milestones[0]!.tasks).toContain('T1.1');

    // Prerequisites
    expect(content.prerequisites).toHaveLength(1);
    expect(content.prerequisites![0]!.id).toBe('P0-S1');
  });
});

// ---------------------------------------------------------------------------
// VAL-FOUND-016: Reads architecture.yaml
// ---------------------------------------------------------------------------
describe('parseArtifact — architecture.yaml (VAL-FOUND-016)', () => {
  it('reads architecture.yaml extracting components, decisions, patterns, NFR mappings', () => {
    const result = parseArtifact<ArchitectureContent>(fixturePath('architecture.yaml'));

    expect(result.status).toBe('ok');
    expect(result.type).toBe('architecture');
    expect(result.content).not.toBeNull();

    const content = result.content!;

    // Components
    expect(content.components).toHaveLength(3);
    expect(content.components[0]!.id).toBe('COMP-001');
    expect(content.components[0]!.name).toBe('Task Service');
    expect(content.components[0]!.type).toBe('bounded_context');
    expect(content.components[0]!.interfaces).toContain('TaskRepository');
    expect(content.components[0]!.dependencies).toContain('COMP-003');

    // Decisions (ADRs)
    expect(content.decisions).toHaveLength(2);
    expect(content.decisions[0]!.id).toBe('ADR-001');
    expect(content.decisions[0]!.title).toContain('filesystem storage');
    expect(content.decisions[0]!.status).toBe('accepted');
    expect(content.decisions[0]!.rationale).toContain('C1');

    // Patterns
    expect(content.patterns).toHaveLength(2);
    expect(content.patterns[0]!.id).toBe('PAT-001');
    expect(content.patterns[0]!.name).toBe('Repository Pattern');

    // NFR mappings
    expect(content.nfrMappings).toHaveLength(2);
    expect(content.nfrMappings[0]!.nfrId).toBe('NFR-PERF-01');
    expect(content.nfrMappings[0]!.mechanism).toContain('caching');
  });
});

// ---------------------------------------------------------------------------
// VAL-FOUND-017: Reads tech.yaml
// ---------------------------------------------------------------------------
describe('parseArtifact — tech.yaml (VAL-FOUND-017)', () => {
  it('reads tech.yaml extracting project structure, libraries, data models, components', () => {
    const result = parseArtifact<TechContent>(fixturePath('tech.yaml'));

    expect(result.status).toBe('ok');
    expect(result.type).toBe('tech');
    expect(result.content).not.toBeNull();

    const content = result.content!;

    // Project structure
    expect(content.projectStructure.create).toHaveLength(3);
    expect(content.projectStructure.create[0]!.path).toBe('src/models/task.ts');
    expect(content.projectStructure.create[0]!.feature).toBe('F1');
    expect(content.projectStructure.modify).toHaveLength(1);
    expect(content.projectStructure.modify[0]!.path).toBe('src/config.ts');

    // Libraries
    expect(content.libraries).toHaveLength(2);
    expect(content.libraries[0]!.name).toBe('zod');
    expect(content.libraries[0]!.purpose).toContain('schema validation');

    // Data models
    expect(content.dataModels).toHaveLength(2);
    expect(content.dataModels[0]!.name).toBe('Task');
    expect(content.dataModels[0]!.fields).toHaveLength(5);
    expect(content.dataModels[0]!.fields[0]!.name).toBe('id');
    expect(content.dataModels[0]!.fields[0]!.type).toBe('string');

    // Components
    expect(content.components).toHaveLength(2);
    expect(content.components[0]!.name).toBe('TaskRepository');
    expect(content.components[0]!.methods).toHaveLength(3);

    // Feature mapping
    expect(content.featureMapping['F1']).toContain('src/models/task.ts');
    expect(content.featureMapping['F2']).toContain('src/services/priority.ts');
  });
});

// ---------------------------------------------------------------------------
// VAL-FOUND-018: Reads roadmap.yaml
// ---------------------------------------------------------------------------
describe('parseArtifact — roadmap.yaml (VAL-FOUND-018)', () => {
  it('reads roadmap.yaml extracting epics, phases, timelines, sequencing', () => {
    const result = parseArtifact<RoadmapContent>(fixturePath('roadmap.yaml'));

    expect(result.status).toBe('ok');
    expect(result.type).toBe('roadmap');
    expect(result.content).not.toBeNull();

    const content = result.content!;

    // Epics
    expect(content.epics).toHaveLength(3);
    const e1 = content.epics[0]!;
    expect(e1.id).toBe('EPIC-E1');
    expect(e1.name).toBe('Core Task Management');
    expect(e1.features).toContain('F1');
    expect(e1.phase).toBe('phase-1');
    expect(e1.timeline).toBeDefined();
    expect(e1.timeline!.start).toBe('2026-02-01');
    expect(e1.timeline!.end).toBe('2026-03-15');
    expect(e1.status).toBe('in-progress');
    expect(e1.priority).toBe(1);

    // Phases
    expect(content.phases).toHaveLength(2);
    expect(content.phases[0]!.id).toBe('phase-1');
    expect(content.phases[0]!.name).toBe('Foundation');

    // Sequencing
    expect(content.sequencing).toHaveLength(2);
    expect(content.sequencing[0]!.from).toBe('EPIC-E1');
    expect(content.sequencing[0]!.to).toBe('EPIC-E2');
    expect(content.sequencing[0]!.reason).toContain('AI features depend');
  });
});

// ---------------------------------------------------------------------------
// VAL-FOUND-019: Reads STM Evidence — YAML
// ---------------------------------------------------------------------------
describe('parseArtifact — STM Evidence YAML (VAL-FOUND-019)', () => {
  it('reads STM evidence YAML extracting status, timestamps, and artifact references', () => {
    const result = parseArtifact<StmEvidenceYamlContent>(fixturePath('stm-evidence.yaml'));

    expect(result.status).toBe('ok');
    expect(result.type).toBe('stm-evidence-yaml');
    expect(result.content).not.toBeNull();

    const content = result.content!;
    expect(content.issue).toBeDefined();
    expect(content.issue!.number).toBe(42);
    expect(content.issue!.title).toContain('inbox sorting');
    expect(content.issue!.state).toBe('closed');
    expect(content.issue!.labels).toContain('feature');
    expect(content.status).toBe('completed');
    expect(content.timestamp).toBe('2026-03-15T14:30:00Z');
    expect(content.artifactReferences).toHaveLength(2);
    expect(content.artifactReferences![0]!.type).toBe('feature');
    expect(content.artifactReferences![0]!.id).toBe('F1');
  });
});

// ---------------------------------------------------------------------------
// VAL-FOUND-020: Reads STM Evidence — Markdown
// ---------------------------------------------------------------------------
describe('parseArtifact — STM Evidence Markdown (VAL-FOUND-020)', () => {
  it('reads STM evidence Markdown extracting frontmatter, body, and sections', () => {
    const result = parseArtifact<StmEvidenceMarkdownContent>(fixturePath('stm-evidence.md'));

    expect(result.status).toBe('ok');
    expect(result.type).toBe('stm-evidence-markdown');
    expect(result.content).not.toBeNull();

    const content = result.content!;

    // Frontmatter
    expect(content.frontmatter).toBeDefined();
    expect(content.frontmatter['type']).toBe('evidence');
    expect(content.frontmatter['play']).toBe('commit-code');
    expect(content.frontmatter['issue']).toBe(42);
    expect(content.frontmatter['status']).toBe('completed');

    // Body contains markdown
    expect(content.body).toContain('commit-code complete');
    expect(content.body).toContain('Step Evals');
    expect(content.body).toContain('Scenario Evals');

    // Sections parsed
    expect(content.sections.length).toBeGreaterThan(0);

    const headings = content.sections.map((s) => s.heading);
    expect(headings).toContain('commit-code complete');
    expect(headings).toContain('Step Evals');
    expect(headings).toContain('Scenario Evals');
    expect(headings).toContain('Summary');

    // Section content
    const summarySection = content.sections.find((s) => s.heading === 'Summary');
    expect(summarySection).toBeDefined();
    expect(summarySection!.content).toContain('task inbox sorting');
  });
});

// ---------------------------------------------------------------------------
// VAL-FOUND-021: Missing file does not crash
// ---------------------------------------------------------------------------
describe('parseArtifact — missing file (VAL-FOUND-021)', () => {
  it('returns null/empty gracefully for missing files without crashing', () => {
    const result = parseArtifact('/nonexistent/path/to/product.yaml');

    expect(result.status).toBe('missing');
    expect(result.content).toBeNull();
    expect(result.error).toBeUndefined();
    expect(result.type).toBe('product');
    expect(result.path).toBe('/nonexistent/path/to/product.yaml');
  });

  it('does not throw when missing file is requested', () => {
    expect(() => parseArtifact('/does/not/exist/features.yaml')).not.toThrow();
  });

  it('returns missing for various file types', () => {
    const types = [
      'product.yaml',
      'features.yaml',
      'scenarios.yaml',
      'plan.yaml',
      'architecture.yaml',
      'tech.yaml',
      'roadmap.yaml',
      'evidence.yaml',
      'evidence.md',
    ];
    for (const name of types) {
      const result = parseArtifact(`/nonexistent/${name}`);
      expect(result.status).toBe('missing');
      expect(result.content).toBeNull();
    }
  });
});

// ---------------------------------------------------------------------------
// VAL-FOUND-022: Malformed YAML graceful handling
// ---------------------------------------------------------------------------
describe('parseArtifact — malformed YAML (VAL-FOUND-022)', () => {
  it('returns error result with descriptive message for malformed YAML', () => {
    const result = parseArtifact(fixturePath('malformed.yaml'));

    expect(result.status).toBe('error');
    expect(result.content).toBeNull();
    expect(result.error).toBeDefined();
    expect(typeof result.error).toBe('string');
    expect(result.error!.length).toBeGreaterThan(0);
  });

  it('does not throw an unhandled exception for malformed YAML', () => {
    expect(() => parseArtifact(fixturePath('malformed.yaml'))).not.toThrow();
  });

  it('includes the file path in the result', () => {
    const result = parseArtifact(fixturePath('malformed.yaml'));
    expect(result.path).toBe(fixturePath('malformed.yaml'));
  });
});

// ---------------------------------------------------------------------------
// VAL-FOUND-023: Empty file graceful handling
// ---------------------------------------------------------------------------
describe('parseArtifact — empty file (VAL-FOUND-023)', () => {
  it('returns null/empty for empty files without crashing', () => {
    const result = parseArtifact(fixturePath('empty.yaml'));

    expect(result.status).toBe('empty');
    expect(result.content).toBeNull();
    expect(result.error).toBeUndefined();
  });

  it('does not throw TypeError or undefined access', () => {
    expect(() => parseArtifact(fixturePath('empty.yaml'))).not.toThrow();
  });

  it('downstream access does not cause TypeError', () => {
    const result = parseArtifact(fixturePath('empty.yaml'));
    // Simulating downstream code that might try to access content
    expect(result.content?.toString()).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// VAL-FOUND-024: Schema normalization
// ---------------------------------------------------------------------------
describe('parseArtifact — schema normalization (VAL-FOUND-024)', () => {
  it('normalizes product.yaml v2 schema to consistent internal model', () => {
    const v1 = parseArtifact<ProductContent>(fixturePath('product.yaml'));
    const v2 = parseArtifact<ProductContent>(fixturePath('product-v2.yaml'), 'product');

    expect(v1.status).toBe('ok');
    expect(v2.status).toBe('ok');

    // Both versions produce name and description
    expect(v1.content!.name).toBe('TaskFlow');
    expect(v2.content!.name).toBe('TaskFlow Pro');

    // Both produce normalized goals array (even though v2 uses string[])
    expect(v1.content!.goals.length).toBeGreaterThan(0);
    expect(v2.content!.goals.length).toBeGreaterThan(0);

    // v2 string goals are wrapped into { description } objects
    for (const goal of v2.content!.goals) {
      expect(typeof goal.description).toBe('string');
      expect(goal.description.length).toBeGreaterThan(0);
    }

    // Both produce normalized constraints
    expect(v1.content!.constraints.length).toBeGreaterThan(0);
    expect(v2.content!.constraints.length).toBeGreaterThan(0);
    for (const constraint of v2.content!.constraints) {
      expect(typeof constraint.description).toBe('string');
    }

    // v2 lifecycle maps to status
    expect(v2.content!.status).toBe('active');
  });

  it('normalizes snake_case to camelCase in all artifact types', () => {
    // features.yaml: capability_domain → capabilityDomain
    const features = parseArtifact<FeaturesContent>(fixturePath('features.yaml'));
    expect(features.content!.features[0]!.capabilityDomain).toBe('task-management');

    // scenarios.yaml: feature_ref → featureRef, behavior_ref → behaviorRef, pass_criteria → passCriteria
    const scenarios = parseArtifact<ScenariosContent>(fixturePath('scenarios.yaml'));
    expect(scenarios.content!.scenarios[0]!.featureRef).toBe('F1');
    expect(scenarios.content!.scenarios[0]!.behaviorRef).toBe('F1-B1');
    expect(scenarios.content!.scenarios[0]!.passCriteria).toHaveLength(2);

    // plan.yaml: execution_order → executionOrder, depends_on → dependsOn
    const plan = parseArtifact<PlanContent>(fixturePath('plan.yaml'));
    expect(plan.content!.executionOrder.length).toBeGreaterThan(0);
    expect(plan.content!.executionOrder[2]!.dependsOn).toContain('T1.1');

    // architecture.yaml: nfr_mappings → nfrMappings
    const arch = parseArtifact<ArchitectureContent>(fixturePath('architecture.yaml'));
    expect(arch.content!.nfrMappings.length).toBeGreaterThan(0);
    expect(arch.content!.nfrMappings[0]!.nfrId).toBe('NFR-PERF-01');

    // tech.yaml: project_structure → projectStructure, data_models → dataModels
    const tech = parseArtifact<TechContent>(fixturePath('tech.yaml'));
    expect(tech.content!.projectStructure.create.length).toBeGreaterThan(0);
    expect(tech.content!.dataModels.length).toBeGreaterThan(0);
  });

  it('provides default empty arrays when optional sections are absent', () => {
    // Parse product.yaml which has no invariants section
    const product = parseArtifact<ProductContent>(fixturePath('product.yaml'));
    expect(product.content!.goals).toBeDefined();
    expect(Array.isArray(product.content!.goals)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// parseArtifacts — batch parsing
// ---------------------------------------------------------------------------
describe('parseArtifacts — batch parsing', () => {
  it('parses multiple files in one call', () => {
    const results = parseArtifacts([
      { path: fixturePath('product.yaml') },
      { path: fixturePath('features.yaml') },
      { path: '/nonexistent/missing.yaml' },
      { path: fixturePath('empty.yaml') },
    ]);

    expect(results).toHaveLength(4);
    expect(results[0]!.status).toBe('ok');
    expect(results[0]!.type).toBe('product');
    expect(results[1]!.status).toBe('ok');
    expect(results[1]!.type).toBe('features');
    expect(results[2]!.status).toBe('missing');
    expect(results[3]!.status).toBe('empty');
  });

  it('supports explicit type hints in batch', () => {
    const results = parseArtifacts([{ path: fixturePath('product-v2.yaml'), type: 'product' }]);

    expect(results[0]!.type).toBe('product');
    expect(results[0]!.status).toBe('ok');
    expect((results[0]!.content as ProductContent).name).toBe('TaskFlow Pro');
  });
});
