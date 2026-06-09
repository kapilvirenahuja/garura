---
name: diff-context-baseline
description: Compare the context baseline captured by /prepare against implementation outcomes observed post-epic, classify differences into Tier 1 (ADR-worthy), Tier 2 (enrichment-worthy), or Tier 3 (addition-worthy) findings, and emit context-diff.yaml. Each finding carries a two-level learning taxonomy (learning_category + sub_category) aligned to the core/components/memory/ KB structure, replacing the prior six-value dimension field. First stage of knowledge-extractor ANALYZE mode.
user-invocable: false
model: sonnet
allowed-tools: Read, Write, Grep, Glob
deprecated: true
deprecated_note: '#434 ProductOS realignment — superseded by the command model; retained for Phase E reference, not installed'
---

# diff-context-baseline

Model-invocable skill for context-baseline vs. implementation-outcome diffing.

## Purpose

Post-epic, compare what `prepare` knew (context baseline) against what `implement` actually did (milestone verdicts, arbiter verdicts, implementation evidence). Classify every meaningful divergence into a tier that later skills will turn into proposals. Assign each finding a two-level learning taxonomy so proposals carry routing information for the KB.

First of three knowledge-extractor skills — its output feeds `draft-enrichment-proposals`.

## Input

| Field | Required | Description |
|-------|----------|-------------|
| `context_baseline_path` | yes | Path to prepare's context/ baseline directory or index |
| `milestone_verdicts_paths` | yes | List of milestone verdict YAMLs from implement |
| `arbiter_verdicts_paths` | optional | List of arbiter verdict YAMLs when arbiter ran |
| `stm_evidence_root` | yes | Root of the epic's STM evidence tree |
| `output_base` | yes | Directory to write context-diff.yaml |

## Process

1. **Load baseline.** Read context/ artifacts: LLD, architecture, chosen patterns, library picks, assumptions index.

2. **Load outcomes.** Read milestone verdicts + implementation reports + arbiter verdicts. Extract: files actually modified, libraries actually added, patterns actually applied, invariants actually enforced.

3. **Classify by learning category.** For each meaningful divergence between baseline and outcomes, assign both a tier AND a two-level learning taxonomy. Use the canonical taxonomy tree (source of truth: `core/components/memory/`):

   **Canonical taxonomy tree:**
   ```
   learning_category: arch | domain | product | quality | standards
   sub_category per parent:
     arch      → agentic | data | operations | patterns | platforms | stacks
     domain    → (flat — sub_category null)
     product   → (flat — sub_category null)
     quality   → architecture | backend | code | data | documentation | frontend |
                 operations | performance | security | tech-debt | testing
     standards → rules | schemas | templates
   ```

   **Dimension → taxonomy mapping (for findings derived from baseline diff):**
   | Old dimension | New learning_category | New sub_category |
   |---------------|----------------------|-----------------|
   | architecture  | arch                 | content-routed (e.g., patterns, platforms, stacks) |
   | libraries     | arch                 | stacks           |
   | patterns      | arch                 | patterns         |
   | invariants    | domain               | null             |
   | quality       | quality              | content-routed (e.g., code, testing, performance) |
   | assumptions   | domain               | null (default)   |

   **Sub_category assignment for content-routed cases:** Route to the canonical sub_category
   that best matches the finding content. For `arch` findings not matching agentic/data/
   operations/patterns/platforms/stacks, default to `patterns`. For `quality` findings,
   route to the most specific applicable child (architecture, backend, code, data,
   documentation, frontend, operations, performance, security, tech-debt, testing).

   **Note on canonical taxonomy:** The canonical taxonomy above is a **starting point, not a closed enum**. New categories or sub-categories may be proposed when none of the canonical values fit — the invention mechanism (`learning_category_proposed` / `sub_category_proposed` + `taxonomy_justification`) is the structured path for proposing additions. Proposed-new values signal taxonomy evolution to reviewers; they are not automatically promoted to canonical — that is a reviewer/enrich-play decision.

   **Proposed new categories:** If no canonical learning_category or sub_category fits the
   finding, the skill MAY emit a proposed-new value — BUT ONLY when:
   (a) No canonical value reasonably covers the finding's nature.
   (b) The finding carries a complete taxonomy_justification block containing:
       - evidence_path: a specific STM artifact path demonstrating the learning type
       - excerpt: a verbatim excerpt from that artifact
       - reasoning: why no canonical taxonomy value fits
   Findings proposing a new category without a complete taxonomy_justification block
   are invalid and must be rejected by this skill with a structured error before writing
   context-diff.yaml.

4. **Classify each finding into a tier.** Criteria:
   - **Tier 1 (ADR)** — a LOCKED artifact's claim is contradicted by implementation evidence. Warrants an ADR.
   - **Tier 2 (enrichment)** — an existing LTM artifact's content is reinforced or refined by implementation evidence.
   - **Tier 3 (addition)** — a new pattern, library, or convention emerged that no LTM artifact captured.

5. **Emit context-diff.yaml:**

   ```yaml
   baseline: "{context_baseline_path}"
   outcomes_sources:
     milestones: [ ... ]
     arbiter: [ ... ]
   generated_at: "{ISO-8601}"
   findings:
     - id: F-001
       tier: 1 | 2 | 3
       learning_category: "<canonical: arch|domain|product|quality|standards  OR  proposed-new>"
       sub_category: "<canonical child of parent  OR  proposed-new  OR  null for flat parents>"
       learning_category_proposed: false   # true iff learning_category is not in canonical enum
       sub_category_proposed: false        # true iff sub_category is not in canonical children for parent
       taxonomy_justification:             # REQUIRED iff either _proposed flag is true
         evidence_path: "<path to STM artifact>"
         excerpt: "<verbatim excerpt demonstrating the learning type>"
         reasoning: "<why canonical taxonomy does not fit>"
       claim_in_baseline: "{what baseline said}"
       observed_in_implementation: "{what actually happened}"
       evidence_paths: [ ... ]
       impact: "{one-line summary}"
   summary:
     tier_1_count: {n}
     tier_2_count: {n}
     tier_3_count: {n}
   ```

   **Field rules:**
   - `learning_category` is REQUIRED on every finding. Absence is a structural error.
   - `sub_category` is REQUIRED (non-null) when `learning_category` is `arch`, `quality`, or `standards`. It is explicitly null for `domain` and `product`.
   - `learning_category_proposed` and `sub_category_proposed` default to `false`. Set to `true` only when the value is not in the canonical enum.
   - `taxonomy_justification` is REQUIRED (with all three sub-fields) when either `_proposed` flag is `true`. Omit (or set to null) when both flags are `false`.
   - Findings failing these rules must be rejected by this skill with a structured error before writing context-diff.yaml.

## Output

```yaml
context_diff_path: "{output_base}/context-diff.yaml"
findings_count: {n}
status: written
```

## Boundaries

- Read-only against STM — NEVER modifies STM artifacts.
- Read-only against LTM — NEVER modifies LTM here. (Only the LTM-write skill writes LTM, and only in ENRICH mode with approvals.)
- No judgment calls about whether to write — that is `draft-enrichment-proposals`'s job.
- The `dimension` field is retired. Do not emit `dimension` on any finding. The `learning_category` + `sub_category` pair replaces it entirely.
