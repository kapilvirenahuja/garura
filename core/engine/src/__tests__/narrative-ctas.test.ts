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
  assertSuggestionsAreRegisteredPlays,
  selectNarrativeCtas,
  selectNarrativeWikiTagSuggestions,
  type CtaSelectionInput,
} from '@/lib/narrative-ctas';
import { GARURA_PLAY_NAMES } from '@/lib/play-registry';
import { composeEpicNarrativeDeterministic, type ComposeContext } from '@/lib/narrative-engine';
import { parseWikiTagSegments } from '@/lib/wiki-tag-parser';
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

// ---------------------------------------------------------------------------
// Wiki-tag suggestions — embedded [[play:prompt]] lifecycle cascade.
// ---------------------------------------------------------------------------

describe('selectNarrativeWikiTagSuggestions — lifecycle cascade', () => {
  it('suggests specify-product when no features exist', () => {
    const [primary] = selectNarrativeWikiTagSuggestions(inputFor({ featureCount: 0 }));
    expect(primary?.playName).toBe('specify-product');
    expect(primary?.reason).toBe('no-features');
  });

  it('suggests build-arch when architecture has not been derived', () => {
    const [primary] = selectNarrativeWikiTagSuggestions(inputFor({ hasArchitecture: false }));
    expect(primary?.playName).toBe('build-arch');
    expect(primary?.reason).toBe('no-architecture');
  });

  it('suggests prepare-epic when no plan exists', () => {
    const [primary] = selectNarrativeWikiTagSuggestions(inputFor({ hasPlan: false }));
    expect(primary?.playName).toBe('prepare-epic');
    expect(primary?.reason).toBe('no-plan');
  });

  it('suggests implement-epic when the plan is ready but nothing is implemented', () => {
    const [primary] = selectNarrativeWikiTagSuggestions(
      inputFor({ hasImplementationEvidence: false }),
    );
    expect(primary?.playName).toBe('implement-epic');
    expect(primary?.reason).toBe('not-implemented');
  });

  it('suggests quality-check once implementation evidence exists', () => {
    const [primary] = selectNarrativeWikiTagSuggestions(
      inputFor({ hasImplementationEvidence: true, hasQualityEvidence: false }),
    );
    expect(primary?.playName).toBe('quality-check');
    expect(primary?.reason).toBe('no-quality-check');
  });

  it('suggests validate-epic when QA evidence exists', () => {
    const [primary] = selectNarrativeWikiTagSuggestions(
      inputFor({ hasImplementationEvidence: true, hasQualityEvidence: true }),
    );
    expect(primary?.playName).toBe('validate-epic');
    expect(primary?.reason).toBe('ready-to-validate');
  });

  it('always includes a check-drift secondary suggestion', () => {
    const suggestions = selectNarrativeWikiTagSuggestions(inputFor({}));
    const secondary = suggestions.find((s) => s.reason === 'always-available');
    expect(secondary?.playName).toBe('check-drift');
  });

  it('returns primary + always-available secondary for every input', () => {
    const suggestions = selectNarrativeWikiTagSuggestions(inputFor({ featureCount: 0 }));
    expect(suggestions.length).toBeGreaterThanOrEqual(2);
    expect(suggestions[0]?.reason).not.toBe('always-available');
    expect(suggestions.find((s) => s.reason === 'always-available')).toBeDefined();
  });

  it('never emits prompts containing the wiki-tag closing delimiter', () => {
    // Any `]]` inside a prompt would break the downstream parser.
    const cascade: CtaSelectionInput[] = [
      inputFor({ featureCount: 0 }),
      inputFor({ hasArchitecture: false }),
      inputFor({ hasPlan: false }),
      inputFor({ hasImplementationEvidence: false }),
      inputFor({ hasImplementationEvidence: true, hasQualityEvidence: false }),
      inputFor({ hasImplementationEvidence: true, hasQualityEvidence: true }),
    ];
    for (const input of cascade) {
      const suggestions = selectNarrativeWikiTagSuggestions(input);
      for (const s of suggestions) {
        expect(s.prompt).not.toContain(']]');
        expect(s.prompt.length).toBeGreaterThan(0);
      }
    }
  });

  it('mirrors the CTA primary playName for every input in the cascade', () => {
    const cascade: CtaSelectionInput[] = [
      inputFor({ featureCount: 0 }),
      inputFor({ hasArchitecture: false }),
      inputFor({ hasPlan: false }),
      inputFor({ hasImplementationEvidence: false }),
      inputFor({ hasImplementationEvidence: true, hasQualityEvidence: false }),
      inputFor({ hasImplementationEvidence: true, hasQualityEvidence: true }),
    ];
    for (const input of cascade) {
      const [primaryCta] = selectNarrativeCtas(input);
      const [primarySuggestion] = selectNarrativeWikiTagSuggestions(input);
      expect(primarySuggestion?.playName).toBe(primaryCta?.playName);
      expect(primarySuggestion?.reason).toBe(primaryCta?.reason);
    }
  });

  it('every suggestion references a registered Garura play', () => {
    const suggestions = selectNarrativeWikiTagSuggestions(inputFor({}));
    expect(() => assertSuggestionsAreRegisteredPlays(suggestions)).not.toThrow();
    for (const s of suggestions) {
      expect(GARURA_PLAY_NAMES.has(s.playName)).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// Wiki-tag embedding — composer must emit [[play:prompt]] patterns.
// ---------------------------------------------------------------------------

describe('composeEpicNarrativeDeterministic — wiki-tag integration', () => {
  function buildCtx(epicId: string): ComposeContext {
    const artifacts = parseArtifacts([
      { path: path.join(FIXTURES_DIR, 'product.yaml'), type: 'product' },
      { path: path.join(FIXTURES_DIR, 'features.yaml'), type: 'features' },
      { path: path.join(FIXTURES_DIR, 'scenarios.yaml'), type: 'scenarios' },
      { path: path.join(FIXTURES_DIR, 'plan.yaml'), type: 'plan' },
      { path: path.join(FIXTURES_DIR, 'architecture.yaml'), type: 'architecture' },
      { path: path.join(FIXTURES_DIR, 'tech.yaml'), type: 'tech' },
      { path: path.join(FIXTURES_DIR, 'roadmap.yaml'), type: 'roadmap' },
    ]);
    return { epicId, artifacts, graph: buildCrossRefGraph(artifacts, null) };
  }

  it('emits a Next Steps section containing [[play:prompt]] wiki-tag text', () => {
    const narrative = composeEpicNarrativeDeterministic(buildCtx('E1'));
    const nextSteps = narrative.sections.find((s) => s.id === 'next-steps');
    expect(nextSteps).toBeDefined();
    expect(nextSteps!.heading).toBe('Next Steps');

    const text = nextSteps!.chunks
      .filter((c) => c.type === 'text')
      .map((c) => (c as { type: 'text'; text: string }).text)
      .join('');
    expect(text).toMatch(/\[\[[a-z0-9-]+:[^\]]+\]\]/);
  });

  it('produces at least two parseable wiki tags in the narrative', () => {
    const narrative = composeEpicNarrativeDeterministic(buildCtx('E1'));
    const text = narrative.sections
      .flatMap((s) => s.chunks)
      .filter((c) => c.type === 'text')
      .map((c) => (c as { type: 'text'; text: string }).text)
      .join(' ');
    const tags = parseWikiTagSegments(text).filter((s) => s.type === 'wikitag');
    expect(tags.length).toBeGreaterThanOrEqual(2);
    const plays = tags.map((t) => (t as { type: 'wikitag'; play: string }).play);
    // check-drift is always present as the secondary suggestion.
    expect(plays).toContain('check-drift');
    // Every embedded wiki tag must reference a registered Garura play.
    for (const play of plays) {
      expect(GARURA_PLAY_NAMES.has(play)).toBe(true);
    }
  });
});
