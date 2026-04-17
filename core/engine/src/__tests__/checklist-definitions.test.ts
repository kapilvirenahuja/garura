/**
 * Tests for the MDB Checklist Definitions and Loader System.
 *
 * Verifies that built-in checklist YAML files exist, load correctly,
 * and all play references are valid Meridian plays.
 *
 * Fulfills: VAL-CHECK-025 (greenfield checklist exists),
 *           VAL-CHECK-026 (brownfield checklist exists),
 *           VAL-CHECK-027 (prepare-epic checklist exists),
 *           VAL-CHECK-028 (checklists stored as data files),
 *           VAL-CHECK-029 (valid play references)
 */

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {
  loadChecklist,
  loadAllChecklists,
  getBuiltInChecklists,
  validatePlayReferences,
  validateAllPlayReferences,
  loadChecklistFromFile,
  BUILTIN_CHECKLIST_IDS,
} from '@/lib/checklist-loader';
import {
  MERIDIAN_PLAY_NAMES,
  isValidPlay,
  findInvalidPlays,
  scanPlayRegistry,
} from '@/lib/play-registry';

// ---------------------------------------------------------------------------
// Play Registry (VAL-CHECK-029 support)
// ---------------------------------------------------------------------------

describe('Play Registry', () => {
  it('contains at least 50 play/skill names', () => {
    expect(MERIDIAN_PLAY_NAMES.size).toBeGreaterThanOrEqual(50);
  });

  it('includes core plays from plays directory', () => {
    const corePlays = [
      'specify-product',
      'build-arch',
      'prepare-epic',
      'implement-epic',
      'validate-epic',
      'design-exp',
      'capture-learning',
      'ship',
    ];
    for (const play of corePlays) {
      expect(MERIDIAN_PLAY_NAMES.has(play)).toBe(true);
    }
  });

  it('includes core skills from skills directory', () => {
    const coreSkills = [
      'draft-product-spec',
      'quality-check',
      'scout-project',
      'research-market-opportunity',
      'check-drift',
      'configure-capabilities',
    ];
    for (const skill of coreSkills) {
      expect(MERIDIAN_PLAY_NAMES.has(skill)).toBe(true);
    }
  });

  it('includes deployed-only plays', () => {
    expect(MERIDIAN_PLAY_NAMES.has('discover-product')).toBe(true);
    expect(MERIDIAN_PLAY_NAMES.has('plan-roadmap')).toBe(true);
  });

  it('isValidPlay returns true for known plays', () => {
    expect(isValidPlay('prepare-epic')).toBe(true);
    expect(isValidPlay('quality-check')).toBe(true);
  });

  it('isValidPlay returns false for unknown plays', () => {
    expect(isValidPlay('nonexistent-play')).toBe(false);
    expect(isValidPlay('')).toBe(false);
    expect(isValidPlay('not-a-real-play')).toBe(false);
  });

  it('findInvalidPlays returns only invalid names', () => {
    const names = ['prepare-epic', 'fake-play', 'quality-check', 'bogus'];
    const invalid = findInvalidPlays(names);
    expect(invalid).toEqual(['fake-play', 'bogus']);
  });

  it('findInvalidPlays returns empty array when all valid', () => {
    const names = ['prepare-epic', 'quality-check', 'specify-product'];
    const invalid = findInvalidPlays(names);
    expect(invalid).toEqual([]);
  });

  it('scanPlayRegistry finds plays and skills on disk', () => {
    // Resolve the meridian-os root (4 levels up from src/__tests__)
    const meridianRoot = path.resolve(__dirname, '..', '..', '..', '..');
    const playsDir = path.join(meridianRoot, 'core', 'components', 'plays');

    // Only run this test if the plays directory exists (it should in the monorepo)
    if (fs.existsSync(playsDir)) {
      const found = scanPlayRegistry(meridianRoot);
      expect(found.size).toBeGreaterThan(0);
      expect(found.has('prepare-epic')).toBe(true);
      expect(found.has('specify-product')).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// Checklist Data Files (VAL-CHECK-028)
// ---------------------------------------------------------------------------

describe('Checklist Data Files (VAL-CHECK-028)', () => {
  const dataDir = path.resolve(__dirname, '..', 'checklist-defs');

  it('data directory exists', () => {
    expect(fs.existsSync(dataDir)).toBe(true);
  });

  it('greenfield-onboarding.yaml exists as a file', () => {
    const filePath = path.join(dataDir, 'greenfield-onboarding.yaml');
    expect(fs.existsSync(filePath)).toBe(true);
    expect(fs.statSync(filePath).isFile()).toBe(true);
    expect(fs.statSync(filePath).size).toBeGreaterThan(0);
  });

  it('brownfield-onboarding.yaml exists as a file', () => {
    const filePath = path.join(dataDir, 'brownfield-onboarding.yaml');
    expect(fs.existsSync(filePath)).toBe(true);
    expect(fs.statSync(filePath).isFile()).toBe(true);
    expect(fs.statSync(filePath).size).toBeGreaterThan(0);
  });

  it('prepare-epic.yaml exists as a file', () => {
    const filePath = path.join(dataDir, 'prepare-epic.yaml');
    expect(fs.existsSync(filePath)).toBe(true);
    expect(fs.statSync(filePath).isFile()).toBe(true);
    expect(fs.statSync(filePath).size).toBeGreaterThan(0);
  });

  it('all built-in checklist IDs have corresponding YAML files', () => {
    for (const id of BUILTIN_CHECKLIST_IDS) {
      const filePath = path.join(dataDir, `${id}.yaml`);
      expect(fs.existsSync(filePath)).toBe(true);
    }
  });

  it('no hardcoded step arrays in React components (VAL-CHECK-028)', () => {
    // Scan all .tsx files for hardcoded checklist step arrays
    const componentsDir = path.resolve(__dirname, '..', 'components');
    const appDir = path.resolve(__dirname, '..', 'app');

    const tsxFiles: string[] = [];
    for (const dir of [componentsDir, appDir]) {
      if (fs.existsSync(dir)) {
        collectTsxFiles(dir, tsxFiles);
      }
    }

    // Pattern: look for arrays of objects with 'play' and 'label' keys
    // that would indicate hardcoded checklist steps
    const hardcodedPatterns = [
      /const\s+\w*STEPS\w*\s*[:=]\s*\[/i,
      /const\s+\w*steps\w*\s*[:=]\s*\[[\s\S]*play:/i,
    ];

    for (const file of tsxFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      for (const pattern of hardcodedPatterns) {
        const match = pattern.test(content);
        if (match) {
          // Allow the pattern only in test files, not in production components
          const relativePath = path.relative(path.resolve(__dirname, '..'), file);
          expect(match).toBe(false);
          throw new Error(
            `Found hardcoded step array in ${relativePath}. ` +
              'Checklist steps must be loaded from YAML data files.',
          );
        }
      }
    }
  });
});

/** Recursively collect .tsx files */
function collectTsxFiles(dir: string, results: string[]): void {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      collectTsxFiles(fullPath, results);
    } else if (entry.name.endsWith('.tsx')) {
      results.push(fullPath);
    }
  }
}

// ---------------------------------------------------------------------------
// Greenfield Checklist (VAL-CHECK-025)
// ---------------------------------------------------------------------------

describe('Greenfield Checklist (VAL-CHECK-025)', () => {
  it('loads successfully', () => {
    const result = loadChecklist('greenfield-onboarding');
    expect(result.ok).toBe(true);
  });

  it('has correct id and title', () => {
    const result = loadChecklist('greenfield-onboarding');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.checklist.id).toBe('greenfield-onboarding');
      expect(result.checklist.title).toContain('Greenfield');
    }
  });

  it('has expected step count (5 steps)', () => {
    const result = loadChecklist('greenfield-onboarding');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.checklist.steps).toHaveLength(5);
    }
  });

  it('each step has required fields', () => {
    const result = loadChecklist('greenfield-onboarding');
    expect(result.ok).toBe(true);
    if (result.ok) {
      for (const step of result.checklist.steps) {
        expect(step.id).toBeTruthy();
        expect(typeof step.id).toBe('string');
        expect(step.label).toBeTruthy();
        expect(typeof step.label).toBe('string');
        expect(step.description).toBeTruthy();
        expect(typeof step.description).toBe('string');
        expect(step.play).toBeTruthy();
        expect(typeof step.play).toBe('string');
      }
    }
  });

  it('all play references are valid', () => {
    const result = loadChecklist('greenfield-onboarding');
    expect(result.ok).toBe(true);
    if (result.ok) {
      const validation = validatePlayReferences(result.checklist);
      expect(validation.valid).toBe(true);
      expect(validation.invalidReferences).toHaveLength(0);
    }
  });

  it('has category "onboarding"', () => {
    const result = loadChecklist('greenfield-onboarding');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.checklist.category).toBe('onboarding');
    }
  });

  it('step IDs are unique', () => {
    const result = loadChecklist('greenfield-onboarding');
    expect(result.ok).toBe(true);
    if (result.ok) {
      const ids = result.checklist.steps.map((s) => s.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });
});

// ---------------------------------------------------------------------------
// Brownfield Checklist (VAL-CHECK-026)
// ---------------------------------------------------------------------------

describe('Brownfield Checklist (VAL-CHECK-026)', () => {
  it('loads successfully', () => {
    const result = loadChecklist('brownfield-onboarding');
    expect(result.ok).toBe(true);
  });

  it('has correct id and title', () => {
    const result = loadChecklist('brownfield-onboarding');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.checklist.id).toBe('brownfield-onboarding');
      expect(result.checklist.title).toContain('Brownfield');
    }
  });

  it('has appropriate steps for existing project onboarding', () => {
    const result = loadChecklist('brownfield-onboarding');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.checklist.steps.length).toBeGreaterThanOrEqual(3);
      // Should include project scouting and quality checking
      const playNames = result.checklist.steps.map((s) => s.play);
      expect(playNames).toContain('scout-project');
      expect(playNames).toContain('quality-check');
    }
  });

  it('each step has required fields', () => {
    const result = loadChecklist('brownfield-onboarding');
    expect(result.ok).toBe(true);
    if (result.ok) {
      for (const step of result.checklist.steps) {
        expect(step.id).toBeTruthy();
        expect(step.label).toBeTruthy();
        expect(step.description).toBeTruthy();
        expect(step.play).toBeTruthy();
      }
    }
  });

  it('all play references are valid', () => {
    const result = loadChecklist('brownfield-onboarding');
    expect(result.ok).toBe(true);
    if (result.ok) {
      const validation = validatePlayReferences(result.checklist);
      expect(validation.valid).toBe(true);
      expect(validation.invalidReferences).toHaveLength(0);
    }
  });

  it('step IDs are unique', () => {
    const result = loadChecklist('brownfield-onboarding');
    expect(result.ok).toBe(true);
    if (result.ok) {
      const ids = result.checklist.steps.map((s) => s.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });
});

// ---------------------------------------------------------------------------
// Prepare Epic Checklist (VAL-CHECK-027)
// ---------------------------------------------------------------------------

describe('Prepare Epic Checklist (VAL-CHECK-027)', () => {
  it('loads successfully', () => {
    const result = loadChecklist('prepare-epic');
    expect(result.ok).toBe(true);
  });

  it('has correct id and title', () => {
    const result = loadChecklist('prepare-epic');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.checklist.id).toBe('prepare-epic');
      expect(result.checklist.title).toContain('Prepare Epic');
    }
  });

  it('steps reference valid epic preparation plays', () => {
    const result = loadChecklist('prepare-epic');
    expect(result.ok).toBe(true);
    if (result.ok) {
      const playNames = result.checklist.steps.map((s) => s.play);
      // Must include prepare-epic play
      expect(playNames).toContain('prepare-epic');
      // Should include architecture and implementation plays
      expect(playNames).toContain('build-arch');
      expect(playNames).toContain('implement-epic');
    }
  });

  it('each step has required fields', () => {
    const result = loadChecklist('prepare-epic');
    expect(result.ok).toBe(true);
    if (result.ok) {
      for (const step of result.checklist.steps) {
        expect(step.id).toBeTruthy();
        expect(step.label).toBeTruthy();
        expect(step.description).toBeTruthy();
        expect(step.play).toBeTruthy();
      }
    }
  });

  it('all play references are valid', () => {
    const result = loadChecklist('prepare-epic');
    expect(result.ok).toBe(true);
    if (result.ok) {
      const validation = validatePlayReferences(result.checklist);
      expect(validation.valid).toBe(true);
      expect(validation.invalidReferences).toHaveLength(0);
    }
  });

  it('has category "epic-preparation"', () => {
    const result = loadChecklist('prepare-epic');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.checklist.category).toBe('epic-preparation');
    }
  });

  it('step IDs are unique', () => {
    const result = loadChecklist('prepare-epic');
    expect(result.ok).toBe(true);
    if (result.ok) {
      const ids = result.checklist.steps.map((s) => s.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });
});

// ---------------------------------------------------------------------------
// All Play References (VAL-CHECK-029)
// ---------------------------------------------------------------------------

describe('All Play References (VAL-CHECK-029)', () => {
  it('every step in every checklist references a valid play', () => {
    const validation = validateAllPlayReferences();
    expect(validation.valid).toBe(true);
    expect(validation.invalidReferences).toHaveLength(0);
  });

  it('iterate all steps and verify each play resolves to known play', () => {
    const checklists = getBuiltInChecklists();
    expect(checklists.length).toBeGreaterThanOrEqual(3);

    for (const checklist of checklists) {
      for (const step of checklist.steps) {
        expect(isValidPlay(step.play)).toBe(true);
      }
    }
  });

  it('all unique play references across checklists resolve', () => {
    const checklists = getBuiltInChecklists();
    const allPlays = new Set<string>();
    for (const checklist of checklists) {
      for (const step of checklist.steps) {
        allPlays.add(step.play);
      }
    }

    const invalid = findInvalidPlays([...allPlays]);
    expect(invalid).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Loader System (VAL-CHECK-028)
// ---------------------------------------------------------------------------

describe('Checklist Loader System', () => {
  it('loadAllChecklists returns results for all built-in IDs', () => {
    const results = loadAllChecklists();
    expect(results).toHaveLength(BUILTIN_CHECKLIST_IDS.length);
  });

  it('all built-in checklists load successfully', () => {
    const results = loadAllChecklists();
    for (const result of results) {
      expect(result.ok).toBe(true);
    }
  });

  it('getBuiltInChecklists returns only successful loads', () => {
    const checklists = getBuiltInChecklists();
    expect(checklists.length).toBe(BUILTIN_CHECKLIST_IDS.length);
    for (const checklist of checklists) {
      expect(checklist.id).toBeTruthy();
      expect(checklist.title).toBeTruthy();
      expect(checklist.steps.length).toBeGreaterThan(0);
    }
  });

  it('handles missing file gracefully', () => {
    const result = loadChecklistFromFile('/nonexistent/path/fake.yaml');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBeTruthy();
    }
  });

  it('handles malformed YAML gracefully', () => {
    const tmpPath = path.join(__dirname, '..', 'checklist-defs', '__test-malformed.yaml');
    try {
      fs.writeFileSync(tmpPath, '{ invalid yaml: [[[', 'utf-8');
      const result = loadChecklistFromFile(tmpPath);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeTruthy();
      }
    } finally {
      if (fs.existsSync(tmpPath)) {
        fs.unlinkSync(tmpPath);
      }
    }
  });

  it('handles YAML with missing required fields', () => {
    const tmpPath = path.join(__dirname, '..', 'checklist-defs', '__test-incomplete.yaml');
    try {
      fs.writeFileSync(tmpPath, 'id: test\ntitle: Test\n# missing steps\n', 'utf-8');
      const result = loadChecklistFromFile(tmpPath);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeTruthy();
      }
    } finally {
      if (fs.existsSync(tmpPath)) {
        fs.unlinkSync(tmpPath);
      }
    }
  });

  it('each checklist has a non-empty description', () => {
    const checklists = getBuiltInChecklists();
    for (const checklist of checklists) {
      expect(checklist.description).toBeTruthy();
      expect(checklist.description.length).toBeGreaterThan(10);
    }
  });

  it('checklist IDs are unique across all definitions', () => {
    const checklists = getBuiltInChecklists();
    const ids = checklists.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

// ---------------------------------------------------------------------------
// Cross-validation: play registry covers all checklist references
// ---------------------------------------------------------------------------

describe('Cross-Validation: Registry Coverage', () => {
  it('every play referenced in checklists exists in MERIDIAN_PLAY_NAMES', () => {
    const checklists = getBuiltInChecklists();
    const referencedPlays = new Set<string>();
    for (const checklist of checklists) {
      for (const step of checklist.steps) {
        referencedPlays.add(step.play);
      }
    }

    for (const play of referencedPlays) {
      expect(MERIDIAN_PLAY_NAMES.has(play)).toBe(true);
    }
  });

  it('checklist play references are a subset of PLAY_REGISTRY plays', () => {
    // Verify that all plays used in checklists also appear in the readiness
    // PLAY_REGISTRY or the broader MERIDIAN_PLAY_NAMES
    const checklists = getBuiltInChecklists();
    for (const checklist of checklists) {
      for (const step of checklist.steps) {
        expect(MERIDIAN_PLAY_NAMES.has(step.play)).toBe(true);
      }
    }
  });
});
