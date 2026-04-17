/**
 * MDB Play Registry
 *
 * Comprehensive registry of all valid Meridian play and skill names.
 * Used to validate checklist step references against known plays.
 *
 * The registry is populated from:
 * 1. core/components/plays/ — high-level orchestration plays
 * 2. core/components/skills/ — atomic skill modules
 * 3. Deployed-only plays not yet in source (discover-product, plan-roadmap)
 *
 * Also provides a filesystem scanner for dynamic validation.
 *
 * Fulfills: VAL-CHECK-029 (valid play references)
 */

import fs from 'node:fs';
import path from 'node:path';

// ---------------------------------------------------------------------------
// Static registry — all known Meridian play and skill names
// ---------------------------------------------------------------------------

/**
 * Complete set of valid Meridian play names.
 *
 * Includes plays (from core/components/plays/) and skills
 * (from core/components/skills/) since both are invocable via the
 * Meridian execution model.
 */
export const MERIDIAN_PLAY_NAMES: ReadonlySet<string> = new Set([
  // --- Plays (core/components/plays/) ---
  'briefs',
  'build-arch',
  'capture-learning',
  'check-drift',
  'commit-code',
  'create-play',
  'create-pr',
  'design-exp',
  'distill',
  'enhance',
  'fix-it',
  'implement-epic',
  'merge-pr',
  'prepare-epic',
  'report-issue',
  'review-pr',
  'ship',
  'specify-product',
  'start-feature',
  'start-feature-planning',
  'validate-epic',

  // --- Skills (core/components/skills/) ---
  'analyze-changes',
  'analyze-pr',
  'archive-issue-stm',
  'audit-spec-gaps',
  'compile-design-spec',
  'configure-capabilities',
  'create-commit',
  'derive-design-patterns',
  'derive-logical-architecture',
  'derive-nfr-spec',
  'derive-physical-architecture',
  'derive-quality-profile-from-epics',
  'derive-quality-vision',
  'draft-implementation-plan',
  'draft-lld',
  'draft-product-spec',
  'draft-technical-approach',
  'draft-verification-scenarios',
  'enrich-capabilities',
  'evals-creator',
  'generate-intent-epics',
  'generate-screen-inventory',
  'generate-wireframes',
  'manage-issue',
  'map-user-flows',
  'quality-check',
  'quality-check-scoped',
  'recommend-mvp',
  'research-domain-context',
  'research-market-opportunity',
  'resolve-issues',
  'scout-project',
  'setup-branch',
  'submit-pr',
  'sync-claude',
  'sync-droids',
  'synthesize-personas',
  'validate-abstraction-layer',
  'validate-architecture-spec',
  'validate-implementation-design',
  'validate-intent-epics',
  'validate-kb-extension',
  'validate-screen-coverage',
  'write-evidence',

  // --- Deployed plays (compiled but not in source tree) ---
  'discover-product',
  'discover-product-opportunity',
  'plan-roadmap',
]);

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

/**
 * Check whether a play name is a valid Meridian play or skill.
 *
 * @param name - The play name to validate
 * @returns true if the name is in the registry
 */
export function isValidPlay(name: string): boolean {
  return MERIDIAN_PLAY_NAMES.has(name);
}

/**
 * Validate an array of play names, returning any that are invalid.
 *
 * @param names - Array of play names to check
 * @returns Array of invalid play names (empty if all valid)
 */
export function findInvalidPlays(names: ReadonlyArray<string>): string[] {
  return names.filter((name) => !MERIDIAN_PLAY_NAMES.has(name));
}

// ---------------------------------------------------------------------------
// Dynamic filesystem scanner
// ---------------------------------------------------------------------------

/**
 * Scan the Meridian source directories for play and skill names.
 *
 * Reads directory names from core/components/plays/ and core/components/skills/
 * to build a dynamic registry. Useful for validation against the actual
 * filesystem state.
 *
 * @param meridianRoot - Path to the meridian-os repository root
 * @returns Set of play/skill names found on disk
 */
export function scanPlayRegistry(meridianRoot: string): Set<string> {
  const found = new Set<string>();

  const dirs = [
    path.join(meridianRoot, 'core', 'components', 'plays'),
    path.join(meridianRoot, 'core', 'components', 'skills'),
  ];

  for (const dir of dirs) {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory() && !entry.name.startsWith('.')) {
          found.add(entry.name);
        }
      }
    } catch {
      // Directory doesn't exist or not readable — skip
    }
  }

  return found;
}
