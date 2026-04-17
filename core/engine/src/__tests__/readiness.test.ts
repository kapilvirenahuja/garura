/**
 * Tests for the Garura Readiness Score Computation Engine.
 *
 * Fulfills: VAL-CHECK-001, VAL-CHECK-002, VAL-CHECK-003, VAL-CHECK-005,
 *           VAL-CHECK-006, VAL-CHECK-036
 */

import { describe, it, expect, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {
  computeReadiness,
  computeReadinessFromPath,
  checkArtifacts,
  evaluatePlays,
  computeBreakdown,
  PLAY_REGISTRY,
  type PlayDefinition,
  type ReadinessArea,
} from '@/lib/readiness';

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

/** Create a temp directory with optional artifact files */
function createTempArtifactDir(artifacts: string[] = []): string {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'garura-readiness-'));
  for (const name of artifacts) {
    fs.writeFileSync(path.join(tmpDir, name), `# ${name}\nstatus: locked\n`, 'utf-8');
  }
  return tmpDir;
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('Readiness Engine', () => {
  let tmpDir: string | null = null;

  afterEach(() => {
    if (tmpDir && fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
      tmpDir = null;
    }
  });

  // -----------------------------------------------------------------------
  // PLAY_REGISTRY structure
  // -----------------------------------------------------------------------

  describe('PLAY_REGISTRY', () => {
    it('contains at least 10 plays', () => {
      expect(PLAY_REGISTRY.length).toBeGreaterThanOrEqual(10);
    });

    it('covers all five readiness areas', () => {
      const areas = new Set(PLAY_REGISTRY.map((p) => p.area));
      expect(areas).toContain('Product');
      expect(areas).toContain('Features');
      expect(areas).toContain('Roadmap');
      expect(areas).toContain('Architecture');
      expect(areas).toContain('Epics');
    });

    it('every play has a non-empty name', () => {
      for (const play of PLAY_REGISTRY) {
        expect(play.name).toBeTruthy();
        expect(typeof play.name).toBe('string');
      }
    });

    it('preconditions are arrays of strings', () => {
      for (const play of PLAY_REGISTRY) {
        expect(Array.isArray(play.preconditions)).toBe(true);
        for (const pre of play.preconditions) {
          expect(typeof pre).toBe('string');
        }
      }
    });

    it('all plays have at least one precondition (greenfield = score 0)', () => {
      // discover-product is excluded from the registry because it has no
      // preconditions. Including it would make greenfield readiness > 0.
      for (const play of PLAY_REGISTRY) {
        expect(play.preconditions.length).toBeGreaterThanOrEqual(1);
      }
    });
  });

  // -----------------------------------------------------------------------
  // checkArtifacts
  // -----------------------------------------------------------------------

  describe('checkArtifacts', () => {
    it('returns empty set for non-existent directory', () => {
      const result = checkArtifacts('/nonexistent/path/that/should/not/exist');
      expect(result.size).toBe(0);
    });

    it('returns empty set for empty directory', () => {
      tmpDir = createTempArtifactDir();
      const result = checkArtifacts(tmpDir);
      expect(result.size).toBe(0);
    });

    it('detects product.yaml when present', () => {
      tmpDir = createTempArtifactDir(['product.yaml']);
      const result = checkArtifacts(tmpDir);
      expect(result.has('product.yaml')).toBe(true);
      expect(result.size).toBe(1);
    });

    it('detects multiple artifact files', () => {
      tmpDir = createTempArtifactDir(['product.yaml', 'features.yaml', 'roadmap.yaml']);
      const result = checkArtifacts(tmpDir);
      expect(result.has('product.yaml')).toBe(true);
      expect(result.has('features.yaml')).toBe(true);
      expect(result.has('roadmap.yaml')).toBe(true);
      expect(result.size).toBe(3);
    });

    it('ignores empty files', () => {
      tmpDir = createTempArtifactDir();
      fs.writeFileSync(path.join(tmpDir, 'product.yaml'), '', 'utf-8');
      const result = checkArtifacts(tmpDir);
      expect(result.has('product.yaml')).toBe(false);
    });

    it('ignores non-artifact files', () => {
      tmpDir = createTempArtifactDir();
      fs.writeFileSync(path.join(tmpDir, 'readme.md'), 'hello', 'utf-8');
      fs.writeFileSync(path.join(tmpDir, 'random.yaml'), 'hello', 'utf-8');
      const result = checkArtifacts(tmpDir);
      expect(result.size).toBe(0);
    });

    it('detects all seven artifact types', () => {
      const allArtifacts = [
        'product.yaml',
        'features.yaml',
        'scenarios.yaml',
        'plan.yaml',
        'architecture.yaml',
        'tech.yaml',
        'roadmap.yaml',
      ];
      tmpDir = createTempArtifactDir(allArtifacts);
      const result = checkArtifacts(tmpDir);
      expect(result.size).toBe(7);
      for (const name of allArtifacts) {
        expect(result.has(name)).toBe(true);
      }
    });
  });

  // -----------------------------------------------------------------------
  // evaluatePlays
  // -----------------------------------------------------------------------

  describe('evaluatePlays', () => {
    it('marks all plays as not runnable when no artifacts exist', () => {
      const results = evaluatePlays(new Set());
      // All plays in registry have preconditions, so none should be runnable
      for (const r of results) {
        expect(r.runnable).toBe(false);
      }
    });

    it('marks plays with all preconditions met as runnable', () => {
      const artifacts = new Set(['product.yaml', 'features.yaml']);
      const results = evaluatePlays(artifacts);

      const configureCapabilities = results.find((r) => r.name === 'configure-capabilities');
      expect(configureCapabilities?.runnable).toBe(true);
      expect(configureCapabilities?.missingPreconditions).toEqual([]);
    });

    it('marks plays with missing preconditions as not runnable', () => {
      const artifacts = new Set(['product.yaml']);
      const results = evaluatePlays(artifacts);

      const configureCapabilities = results.find((r) => r.name === 'configure-capabilities');
      expect(configureCapabilities?.runnable).toBe(false);
      expect(configureCapabilities?.missingPreconditions).toContain('features.yaml');
    });

    it('correctly reports satisfied and missing preconditions', () => {
      const artifacts = new Set(['product.yaml', 'features.yaml']);
      const results = evaluatePlays(artifacts);

      const buildArch = results.find((r) => r.name === 'build-arch');
      expect(buildArch?.satisfiedPreconditions).toContain('product.yaml');
      expect(buildArch?.satisfiedPreconditions).toContain('features.yaml');
      expect(buildArch?.missingPreconditions).toContain('roadmap.yaml');
      expect(buildArch?.runnable).toBe(false);
    });

    it('works with custom play registry', () => {
      const customPlays: PlayDefinition[] = [
        { name: 'test-play', area: 'Product', preconditions: ['product.yaml'] },
      ];
      const results = evaluatePlays(new Set(['product.yaml']), customPlays);
      expect(results).toHaveLength(1);
      expect(results[0]?.runnable).toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  // computeBreakdown
  // -----------------------------------------------------------------------

  describe('computeBreakdown', () => {
    it('returns entries for all five areas', () => {
      const playResults = evaluatePlays(new Set());
      const breakdown = computeBreakdown(playResults);
      const areas = breakdown.map((b) => b.area);
      expect(areas).toContain('Product');
      expect(areas).toContain('Features');
      expect(areas).toContain('Roadmap');
      expect(areas).toContain('Architecture');
      expect(areas).toContain('Epics');
    });

    it('reports "missing" for areas with no runnable plays', () => {
      // With no artifacts, only plays with no preconditions are runnable
      const playResults = evaluatePlays(new Set());
      const breakdown = computeBreakdown(playResults);

      // Features area has only plays that require artifacts → missing or in-progress
      const features = breakdown.find((b) => b.area === 'Features');
      expect(features?.status).toBe('missing');
    });

    it('reports "complete" for areas where all plays are runnable', () => {
      const allArtifacts = new Set([
        'product.yaml',
        'features.yaml',
        'scenarios.yaml',
        'plan.yaml',
        'architecture.yaml',
        'tech.yaml',
        'roadmap.yaml',
      ]);
      const playResults = evaluatePlays(allArtifacts);
      const breakdown = computeBreakdown(playResults);

      // All areas should be complete with all artifacts present
      for (const entry of breakdown) {
        expect(entry.status).toBe('complete');
      }
    });

    it('reports "in-progress" for areas with mixed runnable/not-runnable plays', () => {
      // With only product.yaml: research-market-opportunity and specify-product
      // are runnable, but configure-capabilities (needs features.yaml too) is not
      const playResults = evaluatePlays(new Set(['product.yaml']));
      const breakdown = computeBreakdown(playResults);

      const features = breakdown.find((b) => b.area === 'Features');
      // draft-product-spec is runnable (needs product.yaml only),
      // configure-capabilities is not (needs features.yaml too)
      expect(features?.status).toBe('in-progress');
    });

    it('computes correct percentages', () => {
      const allArtifacts = new Set([
        'product.yaml',
        'features.yaml',
        'scenarios.yaml',
        'plan.yaml',
        'architecture.yaml',
        'tech.yaml',
        'roadmap.yaml',
      ]);
      const playResults = evaluatePlays(allArtifacts);
      const breakdown = computeBreakdown(playResults);

      for (const entry of breakdown) {
        expect(entry.percentage).toBe(100);
        expect(entry.runnablePlays).toBe(entry.totalPlays);
      }
    });
  });

  // -----------------------------------------------------------------------
  // computeReadiness — Score Computation (VAL-CHECK-001, VAL-CHECK-002)
  // -----------------------------------------------------------------------

  describe('computeReadiness', () => {
    it('returns score 0 for greenfield project with no artifacts (VAL-CHECK-001)', () => {
      const result = computeReadiness(new Set());

      // All plays in the registry require at least one artifact,
      // so greenfield (no artifacts) produces score 0
      expect(result.score).toBe(0);
      expect(result.runnablePlays).toBe(0);
      expect(result.totalPlays).toBe(PLAY_REGISTRY.length);
    });

    it('computes score as (runnable / total * 100) (VAL-CHECK-002)', () => {
      const artifacts = new Set(['product.yaml']);
      const result = computeReadiness(artifacts);

      const expectedRunnable = PLAY_REGISTRY.filter((p) =>
        p.preconditions.every((pre) => artifacts.has(pre)),
      ).length;

      expect(result.runnablePlays).toBe(expectedRunnable);
      const expectedScore = Math.round((expectedRunnable / PLAY_REGISTRY.length) * 100);
      expect(result.score).toBe(expectedScore);
    });

    it('returns score 100 when all artifacts are present', () => {
      const allArtifacts = new Set([
        'product.yaml',
        'features.yaml',
        'scenarios.yaml',
        'plan.yaml',
        'architecture.yaml',
        'tech.yaml',
        'roadmap.yaml',
      ]);
      const result = computeReadiness(allArtifacts);
      expect(result.score).toBe(100);
      expect(result.runnablePlays).toBe(result.totalPlays);
    });

    it('score increases monotonically as artifacts are added', () => {
      const artifacts: string[] = [];
      const allFiles = [
        'product.yaml',
        'features.yaml',
        'roadmap.yaml',
        'architecture.yaml',
        'scenarios.yaml',
        'tech.yaml',
        'plan.yaml',
      ];

      let lastScore = -1;
      for (const file of allFiles) {
        artifacts.push(file);
        const result = computeReadiness(new Set(artifacts));
        expect(result.score).toBeGreaterThanOrEqual(lastScore);
        lastScore = result.score;
      }

      // Final score should be 100
      expect(lastScore).toBe(100);
    });

    it('includes breakdown in result (VAL-CHECK-005)', () => {
      const result = computeReadiness(new Set(['product.yaml']));
      expect(result.breakdown.length).toBe(5);

      const areas = result.breakdown.map((b) => b.area);
      expect(areas).toEqual(['Product', 'Features', 'Roadmap', 'Architecture', 'Epics']);
    });

    it('includes git hash in result', () => {
      const result = computeReadiness(new Set(), PLAY_REGISTRY, 'abc123');
      expect(result.lastGitHash).toBe('abc123');
    });

    it('git hash defaults to null', () => {
      const result = computeReadiness(new Set());
      expect(result.lastGitHash).toBeNull();
    });

    it('includes per-play readiness details', () => {
      const result = computeReadiness(new Set(['product.yaml']));
      expect(result.plays.length).toBe(PLAY_REGISTRY.length);

      const specifyProduct = result.plays.find((p) => p.name === 'specify-product');
      expect(specifyProduct?.runnable).toBe(true);
      expect(specifyProduct?.area).toBe('Product');
    });
  });

  // -----------------------------------------------------------------------
  // Score clamping (VAL-CHECK-036)
  // -----------------------------------------------------------------------

  describe('score clamping (VAL-CHECK-036)', () => {
    it('never returns score below 0', () => {
      const result = computeReadiness(new Set());
      expect(result.score).toBeGreaterThanOrEqual(0);
    });

    it('never returns score above 100', () => {
      const allArtifacts = new Set([
        'product.yaml',
        'features.yaml',
        'scenarios.yaml',
        'plan.yaml',
        'architecture.yaml',
        'tech.yaml',
        'roadmap.yaml',
      ]);
      const result = computeReadiness(allArtifacts);
      expect(result.score).toBeLessThanOrEqual(100);
    });

    it('returns 0 when registry has no plays (edge case)', () => {
      const result = computeReadiness(new Set(), []);
      expect(result.score).toBe(0);
      expect(result.totalPlays).toBe(0);
    });

    it('handles negative precondition scenario gracefully', () => {
      // Edge case: custom plays with impossible preconditions
      const impossiblePlays: PlayDefinition[] = [
        {
          name: 'impossible',
          area: 'Product',
          preconditions: ['nonexistent-artifact.yaml'],
        },
      ];
      const result = computeReadiness(new Set(), impossiblePlays);
      expect(result.score).toBe(0);
      expect(result.score).toBeGreaterThanOrEqual(0);
    });
  });

  // -----------------------------------------------------------------------
  // computeReadinessFromPath (integration with filesystem)
  // -----------------------------------------------------------------------

  describe('computeReadinessFromPath', () => {
    it('returns score 0 for empty directory', () => {
      tmpDir = createTempArtifactDir();
      const result = computeReadinessFromPath(tmpDir);
      // All plays require artifacts, so empty directory = score 0
      expect(result.score).toBe(0);
    });

    it('returns higher score when artifacts are added (VAL-CHECK-006 logic)', () => {
      tmpDir = createTempArtifactDir();
      const baseline = computeReadinessFromPath(tmpDir);

      // Add product.yaml
      fs.writeFileSync(path.join(tmpDir, 'product.yaml'), 'name: Test\n', 'utf-8');
      const withProduct = computeReadinessFromPath(tmpDir);
      expect(withProduct.score).toBeGreaterThanOrEqual(baseline.score);

      // Add features.yaml
      fs.writeFileSync(path.join(tmpDir, 'features.yaml'), 'features: []\n', 'utf-8');
      const withFeatures = computeReadinessFromPath(tmpDir);
      expect(withFeatures.score).toBeGreaterThanOrEqual(withProduct.score);
    });

    it('returns score 100 with all artifacts present', () => {
      const allArtifacts = [
        'product.yaml',
        'features.yaml',
        'scenarios.yaml',
        'plan.yaml',
        'architecture.yaml',
        'tech.yaml',
        'roadmap.yaml',
      ];
      tmpDir = createTempArtifactDir(allArtifacts);
      const result = computeReadinessFromPath(tmpDir);
      expect(result.score).toBe(100);
    });

    it('includes git hash when provided', () => {
      tmpDir = createTempArtifactDir();
      const result = computeReadinessFromPath(tmpDir, 'deadbeef');
      expect(result.lastGitHash).toBe('deadbeef');
    });

    it('returns gracefully for non-existent path', () => {
      const result = computeReadinessFromPath('/nonexistent/path/xyz');
      // Should not crash, just return minimal runnable plays
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
    });
  });

  // -----------------------------------------------------------------------
  // Breakdown status values (VAL-CHECK-005)
  // -----------------------------------------------------------------------

  describe('breakdown status values (VAL-CHECK-005)', () => {
    it('shows distinct status indicators per area', () => {
      // With just product.yaml, some areas should differ
      const result = computeReadiness(new Set(['product.yaml']));

      const statuses = new Set(result.breakdown.map((b) => b.status));
      // Should have at least two different statuses
      expect(statuses.size).toBeGreaterThanOrEqual(2);
    });

    it('Product area is missing with no artifacts', () => {
      const result = computeReadiness(new Set());
      const product = result.breakdown.find((b) => b.area === 'Product');
      // All Product plays require at least product.yaml → none runnable
      expect(product?.status).toBe('missing');
    });

    it('all areas complete with all artifacts', () => {
      const allArtifacts = new Set([
        'product.yaml',
        'features.yaml',
        'scenarios.yaml',
        'plan.yaml',
        'architecture.yaml',
        'tech.yaml',
        'roadmap.yaml',
      ]);
      const result = computeReadiness(allArtifacts);
      for (const entry of result.breakdown) {
        expect(entry.status).toBe('complete');
      }
    });

    it('each breakdown entry has correct area name', () => {
      const result = computeReadiness(new Set());
      const expectedAreas: ReadinessArea[] = [
        'Product',
        'Features',
        'Roadmap',
        'Architecture',
        'Epics',
      ];
      expect(result.breakdown.map((b) => b.area)).toEqual(expectedAreas);
    });

    it('each breakdown entry includes play counts', () => {
      const result = computeReadiness(new Set());
      for (const entry of result.breakdown) {
        expect(entry.totalPlays).toBeGreaterThanOrEqual(0);
        expect(entry.runnablePlays).toBeGreaterThanOrEqual(0);
        expect(entry.runnablePlays).toBeLessThanOrEqual(entry.totalPlays);
      }
    });
  });
});
