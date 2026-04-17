/**
 * narrative-ctas — CTA selection logic.
 *
 * Covers the VAL-PLAY-026 requirement that CTA selection is dynamic based on
 * epic state. Each lifecycle state maps to a specific primary CTA, and every
 * narrative always gets the always-available "Run check-drift" secondary CTA.
 *
 * Also enforces the "valid play" invariant — every CTA's playName must be
 * registered in GARURA_PLAY_NAMES (mirrors VAL-CHECK-029 for checklist steps).
 */

import { describe, expect, it } from 'vitest';
import {
  assertActionsAreRegisteredPlays,
  selectNarrativeCtas,
  type CtaSelectionInput,
} from '@/lib/narrative-ctas';
import { GARURA_PLAY_NAMES } from '@/lib/play-registry';
import { composeEpicNarrativeDeterministic, type ComposeContext } from '@/lib/narrative-engine';
import path from 'node:path';
import { parseArtifacts } from '@/lib/artifact-parser';
import { buildCrossRefGraph } from '@/lib/crossref-resolver';

const FIXTURES_DIR = path.resolve(__dirname, '..', '..', 'test-fixtures', 'artifacts');

function inputFor(overrides: Partial<CtaSelectionInput>): CtaSelectionInput {
  return {
    featureCount: 3,
    hasArchitecture: true,
    hasPlan: true,
    hasImplementationEvidence: false,
    hasQualityEvidence: false,
    ...overrides,
  };
}

describe('selectNarrativeCtas — lifecycle cascade', () => {
  it('suggests specify-product when no features exist', () => {
    const actions = selectNarrativeCtas(inputFor({ featureCount: 0 }));
    expect(actions[0]?.playName).toBe('specify-product');
    expect(actions[0]?.reason).toBe('no-features');
    expect(actions[0]?.primary).toBe(true);
  });

  it('suggests build-arch when features exist but architecture does not', () => {
    const actions = selectNarrativeCtas(inputFor({ hasArchitecture: false }));
    expect(actions[0]?.playName).toBe('build-arch');
    expect(actions[0]?.reason).toBe('no-architecture');
  });

  it('suggests prepare-epic when architecture is present but no plan exists', () => {
    const actions = selectNarrativeCtas(inputFor({ hasPlan: false }));
    expect(actions[0]?.playName).toBe('prepare-epic');
    expect(actions[0]?.reason).toBe('no-plan');
  });

  it('suggests implement-epic when a plan exists but nothing has been implemented', () => {
    const actions = selectNarrativeCtas(inputFor({ hasImplementationEvidence: false }));
    expect(actions[0]?.playName).toBe('implement-epic');
    expect(actions[0]?.reason).toBe('not-implemented');
  });

  it('suggests quality-check once implementation evidence exists but no QA has run', () => {
    const actions = selectNarrativeCtas(
      inputFor({ hasImplementationEvidence: true, hasQualityEvidence: false }),
    );
    expect(actions[0]?.playName).toBe('quality-check');
    expect(actions[0]?.reason).toBe('no-quality-check');
  });

  it('suggests validate-epic when QA evidence exists', () => {
    const actions = selectNarrativeCtas(
      inputFor({ hasImplementationEvidence: true, hasQualityEvidence: true }),
    );
    expect(actions[0]?.playName).toBe('validate-epic');
    expect(actions[0]?.reason).toBe('ready-to-validate');
  });
});

describe('selectNarrativeCtas — always-available secondaries', () => {
  it('always includes the check-drift CTA as a secondary action', () => {
    const actions = selectNarrativeCtas(inputFor({}));
    const secondary = actions.find((a) => a.reason === 'always-available');
    expect(secondary?.playName).toBe('check-drift');
    expect(secondary?.primary).toBe(false);
  });

  it('returns at least two CTAs (primary + always-available)', () => {
    const actions = selectNarrativeCtas(inputFor({ featureCount: 0 }));
    expect(actions.length).toBeGreaterThanOrEqual(2);
    expect(actions.filter((a) => a.primary).length).toBe(1);
  });
});

describe('narrative CTAs — integration with compose engine', () => {
  it('embeds at least one primary CTA into the composed narrative', () => {
    const artifacts = parseArtifacts([
      { path: path.join(FIXTURES_DIR, 'product.yaml'), type: 'product' },
      { path: path.join(FIXTURES_DIR, 'features.yaml'), type: 'features' },
      { path: path.join(FIXTURES_DIR, 'scenarios.yaml'), type: 'scenarios' },
      { path: path.join(FIXTURES_DIR, 'plan.yaml'), type: 'plan' },
      { path: path.join(FIXTURES_DIR, 'architecture.yaml'), type: 'architecture' },
      { path: path.join(FIXTURES_DIR, 'tech.yaml'), type: 'tech' },
      { path: path.join(FIXTURES_DIR, 'roadmap.yaml'), type: 'roadmap' },
    ]);
    const ctx: ComposeContext = {
      epicId: 'E1',
      artifacts,
      graph: buildCrossRefGraph(artifacts, null),
    };

    const narrative = composeEpicNarrativeDeterministic(ctx);
    expect(narrative.actions.length).toBeGreaterThanOrEqual(2);

    const primaries = narrative.actions.filter((a) => a.primary);
    expect(primaries.length).toBe(1);

    // Every action must reference a valid Garura play.
    for (const action of narrative.actions) {
      expect(GARURA_PLAY_NAMES.has(action.playName)).toBe(true);
    }
  });

  it('enforces the play-registry invariant via assertActionsAreRegisteredPlays', () => {
    const input = inputFor({});
    const actions = selectNarrativeCtas(input);
    expect(() => assertActionsAreRegisteredPlays(actions)).not.toThrow();
  });

  it('surfaces the "no-plan" CTA when plan evidence is absent', () => {
    const actions = selectNarrativeCtas(
      inputFor({
        hasArchitecture: true,
        hasPlan: false,
      }),
    );
    expect(actions[0]?.label).toMatch(/prepare-epic/i);
    expect(actions[0]?.description.toLowerCase()).toMatch(/plan|prepare|task/);
  });
});
