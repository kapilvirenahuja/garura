# Remediation — Iteration 1

One eval failed on the prior run. Fix its two specific deficiencies below. Do NOT make any other changes.

---

## Failing eval

**E-11** — invention-with-justification rule must be documented in both skills AND encoded in intent.yaml.

### Pass criteria (restated)

- Both `core/components/skills/diff-context-baseline/SKILL.md` AND `core/components/skills/draft-enrichment-proposals/SKILL.md` contain explicit documentation stating that when a `_proposed` flag (either `learning_category_proposed` or `sub_category_proposed`) is true, the `taxonomy_justification` block (evidence_path, excerpt, reasoning) is REQUIRED, and findings/proposals lacking this block must be rejected.
- Both skills document the canonical taxonomy tree (5 top-level + children) as the starting point, with an explicit note that canonical is the baseline, not a closed enum.
- reap's intent.yaml contains two dedicated constraints (equivalent to C7a and C7b in the spec): one encoding the invention-requires-justification rule, one encoding the "canonical is starting point, not closed" rule.

### Observed failure (two deficiencies)

1. **`draft-enrichment-proposals/SKILL.md` does not contain its own explicit rejection rule for proposals lacking `taxonomy_justification`.** It delegates the rejection to `diff-context-baseline` ("the diff skill rejects invalid findings"). The eval requires both skills to explicitly state that findings/proposals without the justification block when a `_proposed` flag is true MUST BE REJECTED — not just rely on upstream rejection.

2. **Neither skill contains an explicit "canonical is a starting point, not a closed enum" note.**
   - `diff-context-baseline` implies the idea through "MAY emit proposed values" language, but does not state the baseline/starting-point framing verbatim.
   - `draft-enrichment-proposals` has no such note at all.

The eval requires the explicit phrasing (or clearly equivalent wording) in both files.

---

## What to fix (precise edits)

### Fix 1 — `core/components/skills/draft-enrichment-proposals/SKILL.md`

Add an explicit rejection rule stating that proposals lacking `taxonomy_justification` when either `learning_category_proposed` or `sub_category_proposed` is true MUST be rejected by this skill (not just by an upstream skill). Even though this skill carries fields forward from findings, it is responsible for validating the invariant at its own boundary.

Suggested insertion (or equivalent wording — the exact phrasing is yours, as long as it is self-contained and clearly states both that (a) the justification block is required when a `_proposed` flag is true and (b) proposals failing this rule MUST be rejected by THIS skill):

> **Invention-with-justification rule (enforced at proposals-drafting boundary):** When either `learning_category_proposed` or `sub_category_proposed` is true, the proposal MUST carry a complete `taxonomy_justification` block (`evidence_path`, `excerpt`, `reasoning`). Proposals that propose a new category or sub-category without a complete justification block MUST be rejected by this skill with a structured error — this skill does not rely on upstream validation; it validates the invariant at its own boundary.

### Fix 2 — Both skill files: explicit "canonical is starting point" note

Add (to both `diff-context-baseline/SKILL.md` AND `draft-enrichment-proposals/SKILL.md`) a verbatim or clearly-equivalent statement that the canonical taxonomy tree is a **starting point, not a closed enum** — alongside the canonical taxonomy documentation.

Suggested wording (use this exact text or equivalent — the keyword "starting point, not a closed enum" should appear, so reviewers / automated checks can find it):

> **Note on canonical taxonomy:** The canonical taxonomy above is a **starting point, not a closed enum**. New categories or sub-categories may be proposed when none of the canonical values fit — the invention mechanism (`learning_category_proposed` / `sub_category_proposed` + `taxonomy_justification`) is the structured path for proposing additions. Proposed-new values signal taxonomy evolution to reviewers; they are not automatically promoted to canonical — that is a reviewer/enrich-play decision.

---

## What NOT to change

- Do not edit `intent.yaml` — C7a and C7b are already present and passing.
- Do not re-run `/create-play --build reap` — intent.yaml is unchanged, so the SKILL.md hash remains valid.
- Do not touch `knowledge-extractor.md`.
- Do not modify any unrelated sections in the two skill files — targeted additions only.
- Do not reformat whole files.

---

## After the fix

Do nothing beyond Fix 1 and Fix 2. Record in your build-report.yaml under the remediation iteration note. Tester will re-run all 11 evals in iteration 2.
