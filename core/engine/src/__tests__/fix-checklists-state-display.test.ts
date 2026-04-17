/**
 * Tests for fix-checklists-state-display feature.
 *
 * Covers:
 * 1. Scalar YAML rejection in readiness checkArtifacts()
 * 2. Locked steps showing play name with dimmed styling (tested in checklist-card)
 * 3. isAllDone requiring BOTH score===100 AND all checklists complete
 * 4. Midproject route step completion placeholder wiring
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

import { checkArtifacts, computeReadinessFromPath, computeReadiness } from '@/lib/readiness';
import { selectChecklists, type StepCompletionState } from '@/lib/checklist-engine';
import type { ChecklistDefinition } from '@/lib/checklist-loader';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createTempDir(files: Record<string, string> = {}): string {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mdb-fix-state-'));
  for (const [name, content] of Object.entries(files)) {
    fs.writeFileSync(path.join(tmpDir, name), content, 'utf-8');
  }
  return tmpDir;
}

// ---------------------------------------------------------------------------
// 1. Scalar YAML rejection in readiness
// ---------------------------------------------------------------------------

describe('Readiness — scalar YAML rejection', () => {
  let tmpDir: string | null = null;

  afterEach(() => {
    if (tmpDir && fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
      tmpDir = null;
    }
  });

  it('rejects YAML that parses to a plain string', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    tmpDir = createTempDir({
      'product.yaml': 'hello world',
    });

    const artifacts = checkArtifacts(tmpDir);
    expect(artifacts.has('product.yaml')).toBe(false);

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Skipping malformed artifact: product.yaml'),
    );
    warnSpy.mockRestore();
  });

  it('rejects YAML that parses to a number', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    tmpDir = createTempDir({
      'features.yaml': '42',
    });

    const artifacts = checkArtifacts(tmpDir);
    expect(artifacts.has('features.yaml')).toBe(false);
    warnSpy.mockRestore();
  });

  it('rejects YAML that parses to a boolean', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    tmpDir = createTempDir({
      'roadmap.yaml': 'true',
    });

    const artifacts = checkArtifacts(tmpDir);
    expect(artifacts.has('roadmap.yaml')).toBe(false);
    warnSpy.mockRestore();
  });

  it('accepts YAML that parses to an object', () => {
    tmpDir = createTempDir({
      'product.yaml': 'name: Test\nstatus: locked\n',
    });

    const artifacts = checkArtifacts(tmpDir);
    expect(artifacts.has('product.yaml')).toBe(true);
  });

  it('accepts YAML that parses to an array', () => {
    tmpDir = createTempDir({
      'features.yaml': '- id: F1\n  name: Auth\n- id: F2\n  name: Payments\n',
    });

    const artifacts = checkArtifacts(tmpDir);
    expect(artifacts.has('features.yaml')).toBe(true);
  });

  it('scalar YAML does not inflate readiness score', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    tmpDir = createTempDir({
      'product.yaml': 'just a string',
      'features.yaml': '99',
      'roadmap.yaml': 'false',
    });

    const result = computeReadinessFromPath(tmpDir);
    expect(result.score).toBe(0);
    expect(result.runnablePlays).toBe(0);
    warnSpy.mockRestore();
  });

  it('mixed scalar and object YAML only counts objects', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    tmpDir = createTempDir({
      'product.yaml': 'name: Valid\n',
      'features.yaml': 'just a string scalar',
    });

    const artifacts = checkArtifacts(tmpDir);
    expect(artifacts.has('product.yaml')).toBe(true);
    expect(artifacts.has('features.yaml')).toBe(false);
    expect(artifacts.size).toBe(1);
    warnSpy.mockRestore();
  });
});

// ---------------------------------------------------------------------------
// 3. isAllDone requires BOTH score===100 AND all checklists complete
// ---------------------------------------------------------------------------

describe('isAllDone logic — score AND checklists', () => {
  const mockChecklist: ChecklistDefinition = {
    id: 'test-checklist',
    title: 'Test',
    description: 'Test checklist',
    category: 'test',
    steps: [
      { id: 's1', label: 'Step 1', description: 'Do step 1', play: 'discover-product' },
      { id: 's2', label: 'Step 2', description: 'Do step 2', play: 'specify-product' },
    ],
  };

  it('score===100 with active checklists should NOT be all-done', () => {
    // Create a readiness result with score 100
    const allArtifacts = new Set([
      'product.yaml',
      'features.yaml',
      'scenarios.yaml',
      'plan.yaml',
      'architecture.yaml',
      'tech.yaml',
      'roadmap.yaml',
    ]);
    const readiness = computeReadiness(allArtifacts);
    expect(readiness.score).toBe(100);

    // No step completions — checklists are not done
    const result = selectChecklists([mockChecklist], readiness);
    // Active should contain the checklist (not completed)
    expect(result.active.length).toBeGreaterThan(0);
    expect(result.completed.length).toBe(0);

    // Therefore isAllDone should be false (score===100 but active.length > 0)
    const isAllDone =
      readiness.score === 100 && result.active.length === 0 && result.completed.length > 0;
    expect(isAllDone).toBe(false);
  });

  it('all checklists complete but score < 100 should NOT be all-done', () => {
    // Only product.yaml → score < 100
    const artifacts = new Set(['product.yaml']);
    const readiness = computeReadiness(artifacts);
    expect(readiness.score).toBeLessThan(100);

    // All steps completed
    const completions = new Map<string, ReadonlyArray<StepCompletionState>>([
      [
        'test-checklist',
        [
          { stepId: 's1', completed: true },
          { stepId: 's2', completed: true },
        ],
      ],
    ]);
    const result = selectChecklists([mockChecklist], readiness, completions);

    // Checklist should be completed
    expect(result.completed.length).toBe(1);
    expect(result.active.length).toBe(0);

    // But isAllDone should be false because score < 100
    const isAllDone =
      readiness.score === 100 && result.active.length === 0 && result.completed.length > 0;
    expect(isAllDone).toBe(false);
  });

  it('score===100 AND all checklists complete should be all-done', () => {
    const allArtifacts = new Set([
      'product.yaml',
      'features.yaml',
      'scenarios.yaml',
      'plan.yaml',
      'architecture.yaml',
      'tech.yaml',
      'roadmap.yaml',
    ]);
    const readiness = computeReadiness(allArtifacts);
    expect(readiness.score).toBe(100);

    const completions = new Map<string, ReadonlyArray<StepCompletionState>>([
      [
        'test-checklist',
        [
          { stepId: 's1', completed: true },
          { stepId: 's2', completed: true },
        ],
      ],
    ]);
    const result = selectChecklists([mockChecklist], readiness, completions);

    expect(result.completed.length).toBe(1);
    expect(result.active.length).toBe(0);

    const isAllDone =
      readiness.score === 100 && result.active.length === 0 && result.completed.length > 0;
    expect(isAllDone).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 4. selectChecklists accepts explicit stepCompletions map
// ---------------------------------------------------------------------------

describe('selectChecklists — explicit stepCompletions parameter', () => {
  const mockChecklist: ChecklistDefinition = {
    id: 'greenfield-onboarding',
    title: 'Greenfield Onboarding',
    description: 'Test',
    category: 'onboarding',
    steps: [
      { id: 's1', label: 'Step 1', description: 'Do step 1', play: 'discover-product' },
      { id: 's2', label: 'Step 2', description: 'Do step 2', play: 'specify-product' },
    ],
  };

  it('accepts an explicit empty Map as placeholder', () => {
    const readiness = computeReadiness(new Set(['product.yaml']));
    const emptyMap = new Map<string, ReadonlyArray<StepCompletionState>>();

    const result = selectChecklists([mockChecklist], readiness, emptyMap);
    // Should work without errors, all steps treated as not-started
    expect(result.active.length + result.completed.length).toBe(1);
    const checklist = result.active[0] ?? result.completed[0];
    expect(checklist?.completedSteps).toBe(0);
  });

  it('uses completion data when provided', () => {
    const readiness = computeReadiness(new Set(['product.yaml']));
    const completions = new Map<string, ReadonlyArray<StepCompletionState>>([
      [
        'greenfield-onboarding',
        [
          { stepId: 's1', completed: true },
          { stepId: 's2', completed: false },
        ],
      ],
    ]);

    const result = selectChecklists([mockChecklist], readiness, completions);
    const checklist = result.active[0] ?? result.completed[0];
    expect(checklist?.completedSteps).toBe(1);
    expect(checklist?.status).toBe('in-progress');
  });

  it('defaults to empty map when not provided', () => {
    const readiness = computeReadiness(new Set(['product.yaml']));

    // No third arg — defaults to empty Map
    const result = selectChecklists([mockChecklist], readiness);
    const checklist = result.active[0] ?? result.completed[0];
    expect(checklist?.completedSteps).toBe(0);
  });
});
