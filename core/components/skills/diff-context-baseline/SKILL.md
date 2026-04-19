---
name: diff-context-baseline
description: Compare the context baseline captured by /prepare against implementation outcomes observed post-epic, classify differences into Tier 1 (ADR-worthy), Tier 2 (enrichment-worthy), or Tier 3 (addition-worthy) findings, and emit context-diff.yaml. First stage of knowledge-extractor ANALYZE mode.
user-invocable: false
model: sonnet
allowed-tools: Read, Write, Grep, Glob
---

# diff-context-baseline

Model-invocable skill for context-baseline vs. implementation-outcome diffing.

## Purpose

Post-epic, compare what `prepare` knew (context baseline) against what `implement` actually did (milestone verdicts, arbiter verdicts, implementation evidence). Classify every meaningful divergence into a tier that later skills will turn into proposals.

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

3. **Diff by dimension:** architecture, libraries, patterns, invariants, quality-profile thresholds met/missed, assumption collisions.

4. **Classify each finding.** Criteria:
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
       dimension: architecture | libraries | patterns | invariants | quality | assumptions
       claim_in_baseline: "{what baseline said}"
       observed_in_implementation: "{what actually happened}"
       evidence_paths: [ ... ]
       impact: "{one-line summary}"
   summary:
     tier_1_count: {n}
     tier_2_count: {n}
     tier_3_count: {n}
   ```

## Output

```yaml
context_diff_path: "{output_base}/context-diff.yaml"
findings_count: {n}
status: written
```

## Boundaries

- Read-only against STM — NEVER modifies STM artifacts.
- Read-only against LTM — NEVER modifies LTM here. (Only `apply-ltm-enrichment` writes LTM, and only in ENRICH mode with approvals.)
- No judgment calls about whether to write — that is `draft-enrichment-proposals`'s job.
