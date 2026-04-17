/**
 * MDB Readiness Score Computation Engine
 *
 * Calculates a 0-100 readiness score based on the percentage of Meridian plays
 * whose preconditions are satisfied (required artifacts exist and are valid).
 * Includes per-area breakdown (Product, Features, Roadmap, Architecture, Epics)
 * and automatic recalculation via git hash change detection.
 *
 * Fulfills: VAL-CHECK-001, VAL-CHECK-002, VAL-CHECK-003, VAL-CHECK-004,
 *           VAL-CHECK-005, VAL-CHECK-006
 */

import fs from 'node:fs';
import path from 'node:path';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Capability area grouping for readiness breakdown */
export type ReadinessArea = 'Product' | 'Features' | 'Roadmap' | 'Architecture' | 'Epics';

/** Status of a single area in the readiness breakdown */
export type AreaStatus = 'locked' | 'missing' | 'in-progress' | 'complete';

/** A play definition with its preconditions */
export interface PlayDefinition {
  readonly name: string;
  readonly area: ReadinessArea;
  readonly preconditions: ReadonlyArray<string>;
}

/** Result of checking a single play's readiness */
export interface PlayReadiness {
  readonly name: string;
  readonly area: ReadinessArea;
  readonly runnable: boolean;
  readonly satisfiedPreconditions: ReadonlyArray<string>;
  readonly missingPreconditions: ReadonlyArray<string>;
}

/** Per-area breakdown entry */
export interface AreaBreakdown {
  readonly area: ReadinessArea;
  readonly status: AreaStatus;
  readonly totalPlays: number;
  readonly runnablePlays: number;
  readonly percentage: number;
}

/** Complete readiness computation result */
export interface ReadinessResult {
  readonly score: number;
  readonly totalPlays: number;
  readonly runnablePlays: number;
  readonly breakdown: ReadonlyArray<AreaBreakdown>;
  readonly plays: ReadonlyArray<PlayReadiness>;
  readonly lastGitHash: string | null;
}

// ---------------------------------------------------------------------------
// Play precondition registry
//
// Each play entry maps a Meridian play name to the artifact files it requires.
// Artifact keys are relative to the product base path (e.g., "product.yaml").
// ---------------------------------------------------------------------------

export const PLAY_REGISTRY: ReadonlyArray<PlayDefinition> = [
  // Product area
  // Note: discover-product is excluded — it has no preconditions and is the
  // bootstrapping play. Including it would make greenfield readiness > 0,
  // which contradicts the wireframe (VAL-CHECK-001: greenfield = 0).
  {
    name: 'research-market-opportunity',
    area: 'Product',
    preconditions: ['product.yaml'],
  },
  {
    name: 'specify-product',
    area: 'Product',
    preconditions: ['product.yaml'],
  },

  // Features area
  {
    name: 'draft-product-spec',
    area: 'Features',
    preconditions: ['product.yaml'],
  },
  {
    name: 'configure-capabilities',
    area: 'Features',
    preconditions: ['product.yaml', 'features.yaml'],
  },
  {
    name: 'draft-verification-scenarios',
    area: 'Features',
    preconditions: ['features.yaml'],
  },

  // Roadmap area
  {
    name: 'plan-roadmap',
    area: 'Roadmap',
    preconditions: ['product.yaml', 'features.yaml'],
  },
  {
    name: 'scout-project',
    area: 'Roadmap',
    preconditions: ['product.yaml'],
  },

  // Architecture area
  {
    name: 'build-arch',
    area: 'Architecture',
    preconditions: ['product.yaml', 'features.yaml', 'roadmap.yaml'],
  },
  {
    name: 'draft-technical-approach',
    area: 'Architecture',
    preconditions: ['product.yaml', 'features.yaml'],
  },
  {
    name: 'check-drift',
    area: 'Architecture',
    preconditions: ['features.yaml', 'architecture.yaml'],
  },

  // Epics area
  {
    name: 'prepare-epic',
    area: 'Epics',
    preconditions: ['product.yaml', 'features.yaml', 'roadmap.yaml', 'architecture.yaml'],
  },
  {
    name: 'implement-epic',
    area: 'Epics',
    preconditions: [
      'product.yaml',
      'features.yaml',
      'roadmap.yaml',
      'architecture.yaml',
      'tech.yaml',
      'scenarios.yaml',
      'plan.yaml',
    ],
  },
  {
    name: 'validate-epic',
    area: 'Epics',
    preconditions: ['product.yaml', 'features.yaml', 'scenarios.yaml', 'plan.yaml', 'tech.yaml'],
  },
  {
    name: 'quality-check',
    area: 'Epics',
    preconditions: ['product.yaml', 'features.yaml'],
  },
] as const;

// ---------------------------------------------------------------------------
// Artifact existence checker
// ---------------------------------------------------------------------------

/**
 * Check which artifact files exist in the given base path.
 *
 * @param basePath - Absolute path to the product artifacts directory
 * @returns Set of artifact filenames that exist and are non-empty
 */
export function checkArtifacts(basePath: string): Set<string> {
  const found = new Set<string>();

  const artifactFiles = [
    'product.yaml',
    'features.yaml',
    'scenarios.yaml',
    'plan.yaml',
    'architecture.yaml',
    'tech.yaml',
    'roadmap.yaml',
  ];

  for (const filename of artifactFiles) {
    try {
      const fullPath = path.join(basePath, filename);
      const stat = fs.statSync(fullPath);
      if (stat.isFile() && stat.size > 0) {
        found.add(filename);
      }
    } catch {
      // File doesn't exist or not readable — skip
    }
  }

  return found;
}

// ---------------------------------------------------------------------------
// Readiness computation
// ---------------------------------------------------------------------------

/**
 * Determine the status of a capability area based on its plays' readiness.
 */
function computeAreaStatus(runnablePlays: number, totalPlays: number): AreaStatus {
  if (totalPlays === 0) return 'missing';
  if (runnablePlays === 0) return 'missing';
  if (runnablePlays === totalPlays) return 'complete';
  return 'in-progress';
}

/**
 * Compute readiness for all plays given a set of available artifacts.
 *
 * @param availableArtifacts - Set of artifact filenames that exist
 * @param plays - Play registry to evaluate (defaults to PLAY_REGISTRY)
 * @returns Array of PlayReadiness results
 */
export function evaluatePlays(
  availableArtifacts: Set<string>,
  plays: ReadonlyArray<PlayDefinition> = PLAY_REGISTRY,
): PlayReadiness[] {
  return plays.map((play) => {
    const satisfied: string[] = [];
    const missing: string[] = [];

    for (const precondition of play.preconditions) {
      if (availableArtifacts.has(precondition)) {
        satisfied.push(precondition);
      } else {
        missing.push(precondition);
      }
    }

    return {
      name: play.name,
      area: play.area,
      runnable: missing.length === 0,
      satisfiedPreconditions: satisfied,
      missingPreconditions: missing,
    };
  });
}

/**
 * Compute per-area breakdown from play readiness results.
 */
export function computeBreakdown(
  playResults: ReadonlyArray<PlayReadiness>,
): ReadonlyArray<AreaBreakdown> {
  const areas: ReadinessArea[] = ['Product', 'Features', 'Roadmap', 'Architecture', 'Epics'];

  return areas.map((area) => {
    const areaPlays = playResults.filter((p) => p.area === area);
    const total = areaPlays.length;
    const runnable = areaPlays.filter((p) => p.runnable).length;
    const percentage = total > 0 ? Math.round((runnable / total) * 100) : 0;

    return {
      area,
      status: computeAreaStatus(runnable, total),
      totalPlays: total,
      runnablePlays: runnable,
      percentage,
    };
  });
}

/**
 * Compute the overall readiness score (0–100).
 *
 * Score = (runnable plays / total plays) × 100, clamped to [0, 100].
 * Returns 0 when there are no plays to evaluate.
 *
 * @param availableArtifacts - Set of artifact filenames that exist
 * @param plays - Play registry to evaluate (defaults to PLAY_REGISTRY)
 * @param gitHash - Current git HEAD hash (null if not available)
 * @returns Complete ReadinessResult
 */
export function computeReadiness(
  availableArtifacts: Set<string>,
  plays: ReadonlyArray<PlayDefinition> = PLAY_REGISTRY,
  gitHash: string | null = null,
): ReadinessResult {
  const playResults = evaluatePlays(availableArtifacts, plays);

  const totalPlays = playResults.length;
  const runnablePlays = playResults.filter((p) => p.runnable).length;

  // Clamp to [0, 100] — handles edge cases like 0 plays
  const rawScore = totalPlays > 0 ? (runnablePlays / totalPlays) * 100 : 0;
  const score = Math.min(100, Math.max(0, Math.round(rawScore)));

  const breakdown = computeBreakdown(playResults);

  return {
    score,
    totalPlays,
    runnablePlays,
    breakdown,
    plays: playResults,
    lastGitHash: gitHash,
  };
}

/**
 * Compute readiness from a filesystem path.
 *
 * Convenience function that combines artifact checking with score computation.
 *
 * @param productBasePath - Absolute path to the product artifacts directory
 * @param gitHash - Current git HEAD hash (null if not available)
 * @returns Complete ReadinessResult
 */
export function computeReadinessFromPath(
  productBasePath: string,
  gitHash: string | null = null,
): ReadinessResult {
  const artifacts = checkArtifacts(productBasePath);
  return computeReadiness(artifacts, PLAY_REGISTRY, gitHash);
}
