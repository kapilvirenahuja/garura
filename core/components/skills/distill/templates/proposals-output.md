# proposals-output.md — Output Template for distill Skill

This template defines the schema for `proposals.yaml` produced by the
`distill` skill. Write the file at:

```
{stm_base}/{issue}/evidence/distill/proposals.yaml
```

## Schema

```yaml
# Learning proposals staged by distill (Mode 1).
# These proposals are STAGED ONLY — they are NOT written to product LTM until
# a human reviews them via /capture-learning --review.
#
# Forward-compatible with Mode 2's reconciliation-proposals.yaml:
# top-level keys (issue, analyzed_at, total_proposals, proposals[]) are shared.
# Mode 2 uses a full tier-based analysis; Mode 1 uses a lightweight diff-based approach.

issue: "{issue number}"                   # Maps to: reconciliation-proposals.yaml `issue`
pr_number: "{PR number}"                  # Mode 1 specific — the merged PR this came from
analyzed_at: "{ISO-8601 timestamp}"       # Maps to: reconciliation-proposals.yaml `analyzed_at`
no_learnings: false                        # true when no proposals exist (file not written in that case)
source: "distill"            # Mode discriminant — distinguishes from Mode 2 proposals
stm_evidence_used: false                   # true when enhance/ or fix-it/ STM evidence was read

proposals:                                 # Maps to: reconciliation-proposals.yaml `proposals[]`
  - target_path: "{path to product LTM artifact to enrich}"
    # Example: .garura/product/garura-os/research/knowledge-management.md
    # Example: .garura/product/garura-os/architecture/design-patterns.yaml

    section: "{which section within the target artifact}"
    # Example: Experiential
    # Example: common_mistakes
    # Example: post_implementation

    proposed_content: |
      {The exact content to add or the change to make, in the format of the target
      artifact. For Experiential sections: follows kb-extension.md format with
      scenarios_observed / common_mistakes entries. For architecture annotations:
      follows existing YAML structure of the target artifact.}

    evidence_diff_reference: "{description of where in the diff this learning signal came from}"
    # Example: "enhance/approach.yaml — rationale section shows non-obvious constraint on agent invocation order"
    # Example: "git diff shows three failed attempts before landing on JSON contract approach"

    confidence: "low | medium | high"
    # low    — diff-only analysis, no STM evidence available
    # medium — diff + partial STM evidence (e.g., issue body or enhance/understanding.md)
    # high   — diff + strong RCA or design rationale evidence from enhance/ or fix-it/

total_proposals: 1                        # Maps to: reconciliation-proposals.yaml `total_proposals`
                                          # Max value: 2 (hard cap enforced by skill)
```

## No-Learnings Case

When the skill determines no learnings exist (trivial diff, no STM evidence signal),
the `distill` skill does **NOT** write a proposals.yaml file.

Instead, the calling agent (knowledge-extractor FAST mode) returns:
```json
{
  "no_learnings": true,
  "proposals_path": null
}
```

The ship play logs this as: `"distill: no learnings detected"`.

## Example — Single Proposal (Low Confidence, Diff-Only)

```yaml
issue: "240"
pr_number: "249"
analyzed_at: "2026-04-16T12:34:56Z"
no_learnings: false
source: "distill"
stm_evidence_used: false

proposals:
  - target_path: ".garura/product/garura-os/research/knowledge-management.md"
    section: "Experiential"
    proposed_content: |
      common_mistakes:
        - Direct edits to compiled SKILL.md artifacts bypass the intent.yaml
          → /create-play pipeline, causing intent_hash drift. Always update
          intent.yaml first and note the direct-edit exception in Compilation Metadata.
    evidence_diff_reference: "Compilation Metadata section in ship SKILL.md was edited directly per enhance/#240 approach — indicates pattern worth recording"
    confidence: "low"

total_proposals: 1
```

## Example — Two Proposals (High Confidence, STM Evidence Used)

```yaml
issue: "240"
pr_number: "249"
analyzed_at: "2026-04-16T12:34:56Z"
no_learnings: false
source: "distill"
stm_evidence_used: true

proposals:
  - target_path: ".garura/product/garura-os/research/agent-design.md"
    section: "Experiential"
    proposed_content: |
      scenarios_observed:
        - Fire-and-forget sub-play invocations (non-blocking wrappers in ship)
          require explicit "skipped" status in the status file rather than "failed"
          to prevent unintended resume-from-Step-N behavior on next ship invocation.
      common_mistakes:
        - Using "failed" status for skipped optional steps causes ship to re-attempt
          them on resume, violating the fire-and-forget semantics.
    evidence_diff_reference: "enhance/approach.yaml risk R4 mitigation — explicitly documented in risks section"
    confidence: "high"

  - target_path: ".garura/product/garura-os/architecture/design-patterns.yaml"
    section: "non_blocking_orchestration"
    proposed_content: |
      pattern: non_blocking_step
      applicability: ship-level orchestration for optional post-merge steps
      decision: Wrap optional sub-play in try/catch; on failure set status="skipped"
        and continue pipeline. Never use status="failed" for fire-and-forget steps.
      driver: "enhance/#240 — post-merge learning capture must not block delivery"
    evidence_diff_reference: "ship SKILL.md Step 4 non-blocking wrapper pattern"
    confidence: "high"

total_proposals: 2
```
