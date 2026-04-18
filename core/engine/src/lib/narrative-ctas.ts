/**
 * Garura Narrative CTAs
 *
 * Selects the contextual call-to-action buttons that should appear at the
 * bottom of a Playbook Reader narrative. CTA selection is *dynamic* — it
 * depends on the epic's current lifecycle state:
 *
 *   • No features yet        → Run specify-product
 *   • Features, no arch      → Run build-arch
 *   • Arch, no plan          → Run prepare-epic
 *   • Plan, not implemented  → Run implement-epic
 *   • Implemented, no QA     → Run quality-check
 *   • QA present             → Run validate-epic
 *
 * In every state we also expose a secondary "Run check-drift" CTA so
 * drift analysis is always one click away from the narrative.
 *
 * This module intentionally knows nothing about React or the HTTP layer —
 * it takes plain state signals and returns plain data so both the server
 * composer (narrative-engine) and future unit tests can drive it
 * deterministically.
 *
 * CRITICAL: every CTA's `playName` must be a real Garura play registered in
 * `GARURA_PLAY_NAMES` (see play-registry.ts). The execute route rejects any
 * playName that is not in the registry. A dedicated test
 * (`narrative-ctas.test.ts`) enforces this invariant.
 *
 * Fulfills: mdb-playbook-ctas
 */

import { isValidPlay } from './play-registry';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** A single CTA button placement in the Playbook Reader narrative. */
export interface CtaAction {
  /** Stable identifier — used as the React key and the execution slot key. */
  readonly id: string;
  /** Human-readable label shown on the CTA button (e.g. "Run prepare-epic"). */
  readonly label: string;
  /** Garura play to execute when the CTA is clicked. */
  readonly playName: string;
  /** One-line rationale shown below the button — explains why this CTA is suggested now. */
  readonly description: string;
  /** Short machine-readable reason code — used by tests and logging. */
  readonly reason: NarrativeStateReason;
  /** Primary actions are visually prominent; secondaries are lower-emphasis. */
  readonly primary: boolean;
}

/** Machine-readable explanation of which epic signal drove the CTA selection. */
export type NarrativeStateReason =
  | 'no-features'
  | 'no-architecture'
  | 'no-plan'
  | 'not-implemented'
  | 'no-quality-check'
  | 'ready-to-validate'
  | 'always-available';

/** Signals derived from the narrative composition context. */
export interface CtaSelectionInput {
  /** Number of features assigned to this epic. */
  readonly featureCount: number;
  /** True when architecture.yaml contributed decisions / patterns / NFRs. */
  readonly hasArchitecture: boolean;
  /** True when plan.yaml has at least one task assigned to this epic. */
  readonly hasPlan: boolean;
  /** True when STM evidence shows an implement-epic run (successful or not). */
  readonly hasImplementationEvidence: boolean;
  /** True when STM evidence shows a quality-check or validation run. */
  readonly hasQualityEvidence: boolean;
}

// ---------------------------------------------------------------------------
// CTA selection
// ---------------------------------------------------------------------------

/**
 * Select the contextual CTAs to show at the bottom of the epic narrative.
 *
 * The primary CTA is chosen by the *first* missing signal in the lifecycle
 * cascade. A secondary `check-drift` CTA is always included so drift analysis
 * is available from every narrative — the description for the always-available
 * action differs slightly from the primary recommendation to make the
 * contextual intent obvious in the UI.
 */
export function selectNarrativeCtas(input: CtaSelectionInput): CtaAction[] {
  const primary = selectPrimary(input);
  const secondary: CtaAction = {
    id: 'run-check-drift',
    label: 'Run check-drift',
    playName: 'check-drift',
    description: 'Detect drift between locked specs and the implemented codebase.',
    reason: 'always-available',
    primary: false,
  };
  return [primary, secondary];
}

function selectPrimary(input: CtaSelectionInput): CtaAction {
  if (input.featureCount === 0) {
    return {
      id: 'run-specify-product',
      label: 'Run specify-product',
      playName: 'specify-product',
      description:
        "No features are assigned yet — run specify-product to establish this epic's feature set.",
      reason: 'no-features',
      primary: true,
    };
  }

  if (!input.hasArchitecture) {
    return {
      id: 'run-build-arch',
      label: 'Run build-arch',
      playName: 'build-arch',
      description:
        'Features exist but no architecture has been derived — run build-arch to generate the logical and physical architecture.',
      reason: 'no-architecture',
      primary: true,
    };
  }

  if (!input.hasPlan) {
    return {
      id: 'run-prepare-epic',
      label: 'Run prepare-epic',
      playName: 'prepare-epic',
      description:
        'Architecture is in place but the epic has no implementation plan — run prepare-epic to produce tech.yaml and the task DAG.',
      reason: 'no-plan',
      primary: true,
    };
  }

  if (!input.hasImplementationEvidence) {
    return {
      id: 'run-implement-epic',
      label: 'Run implement-epic',
      playName: 'implement-epic',
      description:
        'The plan is ready but nothing has been implemented yet — run implement-epic to start the eval-driven TDD loop.',
      reason: 'not-implemented',
      primary: true,
    };
  }

  if (!input.hasQualityEvidence) {
    return {
      id: 'run-quality-check',
      label: 'Run quality-check',
      playName: 'quality-check',
      description:
        'Implementation is underway — run quality-check to score the current state against project standards.',
      reason: 'no-quality-check',
      primary: true,
    };
  }

  return {
    id: 'run-validate-epic',
    label: 'Run validate-epic',
    playName: 'validate-epic',
    description:
      'The epic has quality evidence — run validate-epic to verify scenarios and certify readiness.',
    reason: 'ready-to-validate',
    primary: true,
  };
}

// ---------------------------------------------------------------------------
// Wiki-tag suggestions — embedded [[play:prompt]] patterns in narrative prose
// ---------------------------------------------------------------------------

/**
 * A single wiki-tag suggestion — a contextually relevant play plus a concrete
 * prompt — that the narrative composer embeds as `[[playName:prompt]]` text
 * inside a dedicated "Next Steps" section. `WikiTagText` parses this syntax
 * at render-time and substitutes an interactive {@link WikiTagRunner}, giving
 * browser validators a live wiki-tag lifecycle to observe (VAL-ACTION-002,
 * VAL-ACTION-003, VAL-ACTION-004).
 */
export interface WikiTagSuggestion {
  /** Garura play to invoke when the wiki tag is triggered. */
  readonly playName: string;
  /** Free-form prompt passed through to the play — embedded verbatim. */
  readonly prompt: string;
  /** Short machine-readable reason code — mirrors the CTA selection cascade. */
  readonly reason: NarrativeStateReason;
}

/**
 * Select the wiki-tag suggestions to embed in the narrative's "Next Steps"
 * section. Mirrors {@link selectNarrativeCtas} so the wiki-tag prompts always
 * reflect the same lifecycle cascade the CTAs expose — only the format
 * differs (inline `[[play:prompt]]` wiki tags vs. standalone CTA buttons).
 *
 * Contract:
 *   - Always returns at least two suggestions (primary + always-available).
 *   - Primary playName matches {@link selectPrimary}'s playName for the same
 *     input, enforced by test.
 *   - Prompts never contain `]]` (would break the wiki-tag parser) nor
 *     leading-dash-colon sequences (would false-positive YAML detection
 *     in narrative tests).
 */
export function selectNarrativeWikiTagSuggestions(input: CtaSelectionInput): WikiTagSuggestion[] {
  const primary = selectPrimaryWikiTag(input);
  const secondary: WikiTagSuggestion = {
    playName: 'check-drift',
    prompt: 'Detect drift between locked specs and the implemented codebase',
    reason: 'always-available',
  };
  return [primary, secondary];
}

function selectPrimaryWikiTag(input: CtaSelectionInput): WikiTagSuggestion {
  if (input.featureCount === 0) {
    return {
      playName: 'specify-product',
      prompt: 'Define product vision',
      reason: 'no-features',
    };
  }
  if (!input.hasArchitecture) {
    return {
      playName: 'build-arch',
      prompt: 'Derive logical and physical architecture for this epic',
      reason: 'no-architecture',
    };
  }
  if (!input.hasPlan) {
    return {
      playName: 'prepare-epic',
      prompt: 'Produce implementation plan and task DAG for this epic',
      reason: 'no-plan',
    };
  }
  if (!input.hasImplementationEvidence) {
    return {
      playName: 'implement-epic',
      prompt: 'Begin the eval-driven TDD implementation loop for this epic',
      reason: 'not-implemented',
    };
  }
  if (!input.hasQualityEvidence) {
    return {
      playName: 'quality-check',
      prompt: 'Score the current implementation against project standards',
      reason: 'no-quality-check',
    };
  }
  return {
    playName: 'validate-epic',
    prompt: 'Verify scenarios and certify epic readiness',
    reason: 'ready-to-validate',
  };
}

// ---------------------------------------------------------------------------
// Guards
// ---------------------------------------------------------------------------

/**
 * Assert that every action's playName is in the Garura play registry.
 * Used by tests to prevent regressions — production code does not need
 * this guard at runtime because selection is deterministic.
 */
export function assertActionsAreRegisteredPlays(actions: ReadonlyArray<CtaAction>): void {
  const invalid = actions.filter((a) => !isValidPlay(a.playName));
  if (invalid.length > 0) {
    throw new Error(
      `Narrative CTAs reference unknown plays: ${invalid.map((a) => a.playName).join(', ')}`,
    );
  }
}

/**
 * Assert that every wiki-tag suggestion references a registered Garura play.
 * Mirrors {@link assertActionsAreRegisteredPlays} for the wiki-tag path so
 * regressions (e.g. a typo'd play name) fail loudly in tests.
 */
export function assertSuggestionsAreRegisteredPlays(
  suggestions: ReadonlyArray<WikiTagSuggestion>,
): void {
  const invalid = suggestions.filter((s) => !isValidPlay(s.playName));
  if (invalid.length > 0) {
    throw new Error(
      `Narrative wiki-tag suggestions reference unknown plays: ${invalid.map((s) => s.playName).join(', ')}`,
    );
  }
}
