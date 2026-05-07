---
name: draft-distill-proposals
description: Lightweight diff-to-proposal analysis. Reads a merged PR diff and any available issue STM evidence to detect learning signals and produce 1–2 staged proposals.
user-invocable: false
model: sonnet
allowed-tools: Bash, Read, Write, Grep, Glob
---

# draft-distill-proposals

Analyze a merged PR diff and available issue STM evidence to detect whether
learnings exist, then produce a lightweight `proposals.yaml` staged to STM.
Non-trivial PRs produce 1–2 proposals; trivial PRs produce no output.

## Purpose

Detect learning signals from a merged PR and stage proposals for optional human
review. This skill performs the analysis and writes proposals to STM only.

You DO the signal detection and proposal generation. You do NOT decide whether
proposals should be applied to product LTM — that decision belongs to the
calling agent or a future `/capture-learning --review` invocation.

**Decision boundary:** This skill produces proposals. It NEVER writes to product
LTM (`product_base`). Proposals go to `{stm_base}/{issue}/evidence/distill/`
and remain staged until a human reviews them.

## Input

Receive from the calling agent (knowledge-extractor in FAST mode):

- `pr_diff` — merged PR diff content (full diff or stat summary if diff is large)
- `stm_base` — path to the issue STM root (`{stm_base}/{issue}/`)
- `product_base` — path to product LTM root (read-only reference for context)
- `issue_body` — issue description text (for learning signal context)
- `stm_evidence_paths` — (optional) paths to available STM evidence artifacts
  from enhance/ or fix-it/ runs for this issue

## Process

1. **Assess PR Diff**

   Review the PR diff content for learning signals:
   - What problem was being solved? (use issue body + diff together)
   - Did the implementation reveal unexpected complexity or edge cases?
   - Were there design decisions embedded in the code changes?
   - Are there patterns that would help future implementations avoid mistakes?

   Apply agent judgment — do NOT apply hardcoded extension lists or regex
   patterns. Assess the semantic content of changes, not file names alone.

   **Trivial signals** (no proposal if all apply):
   - Changes are purely cosmetic (formatting, comments, whitespace)
   - Changes are documentation-only with no implementation insight
   - Changes are version bumps or lock file updates with no dependency rationale

2. **Scan Available STM Evidence**

   If `stm_evidence_paths` is provided and non-empty, read those artifacts:

   ```bash
   # Examples of what may be present
   cat {stm_base}/{issue}/evidence/enhance/*.yaml 2>/dev/null
   cat {stm_base}/{issue}/evidence/fix-it/*.md 2>/dev/null
   ```

   Extract learning-relevant content: RCA findings, design rationale, unexpected
   discoveries, constraint violations, or approach changes.

   **Without STM evidence:** Limit output to 1 proposal maximum with confidence `"low"`.
   **With STM evidence:** Up to 2 proposals with confidence based on evidence quality.

3. **Classify Learnings**

   For each detected learning signal, determine:
   - **Target:** Which product LTM artifact would benefit from this learning?
     (e.g., `research/{domain}.md` Experiential section, or an architecture note)
   - **Section:** The specific section within the target artifact
   - **Content:** The proposed addition in format matching the target artifact
   - **Confidence:** `low` (diff-only, no STM evidence) | `medium` (diff + partial
     evidence) | `high` (diff + strong RCA or design evidence)

   **Quantity cap:** Produce at most **2 proposals total**. Quality over quantity.
   Select only the highest-signal learnings — suppress weak or speculative proposals.

4. **Write proposals.yaml**

   If any learnings are classified, write the proposals file using the schema
   defined in `templates/proposals-output.md`.

   Output path: `{stm_base}/{issue}/evidence/distill/proposals.yaml`

   ```bash
   mkdir -p {stm_base}/{issue}/evidence/distill/
   ```

   If no learnings are classified (trivial diff with no STM signal):
   - Do NOT write a proposals.yaml file
   - Return `no_learnings: true` to the calling agent

## Output

Produce output using template: `templates/proposals-output.md`

**IMPORTANT**: This skill produces a staged `proposals.yaml` or a no-op result.
The calling agent receives this output and decides what to report. Do NOT
instruct the agent to return or stop — the agent continues its workflow after
receiving this output.

## Constraints

1. **Never write to product LTM.** `product_base` is read-only reference context.
   All output goes to `{stm_base}/{issue}/evidence/distill/`. Writing
   to any path under `product_base` is a hard constraint violation.

2. **Maximum 2 proposals.** Exceeding this cap is a constraint violation — it
   indicates analysis scope creep, not thoroughness.

3. **No hardcoded triviality patterns.** Triviality is assessed by agent judgment
   on diff semantics, not by file extension lists or path prefixes.

4. **No-op on trivial diffs.** Do not write a proposals.yaml file for trivial
   diffs. An empty or near-empty proposals.yaml is worse than no file at all
   because it creates false signal for reviewers.

5. **Proposals format forward-compatible with Mode 2.** Use the same top-level
   keys as Mode 2's `reconciliation-proposals.yaml` (`issue`, `analyzed_at`,
   `total_proposals`, `proposals[]`) so future mode alignment requires no migration.

## Version

| Field | Value |
|-------|-------|
| Version | 1.0.0 |
| Category | analysis |
