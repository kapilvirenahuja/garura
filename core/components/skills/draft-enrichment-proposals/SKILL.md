---
name: draft-enrichment-proposals
description: Given a tiered context-diff, author reconciliation-proposals.yaml — one proposal per finding with target LTM artifact, proposed change, impact assessment, and (for Tier 1) an ADR draft. Writes the proposals file plus any ADR drafts. Does NOT write LTM — that is apply-ltm-enrichment.
user-invocable: false
model: sonnet
allowed-tools: Read, Write, Glob, Grep
---

# draft-enrichment-proposals

Model-invocable skill for reconciliation-proposal authorship.

## Purpose

Turn findings from `diff-context-baseline` into actionable proposals for the human reviewer. Each proposal names a target LTM artifact, a proposed change, an impact assessment, and — for Tier 1 — a linked ADR draft. The output is a staging artifact; no LTM is written until `apply-ltm-enrichment` runs on approved proposals.

## Input

| Field | Required | Description |
|-------|----------|-------------|
| `context_diff_path` | yes | Path to context-diff.yaml from diff-context-baseline |
| `product_ltm_root` | yes | Root of product LTM to identify candidate target files for Tier 2 enrichments |
| `core_ltm_root` | optional | Root of core LTM (for cross-reference only — core LTM is never modified by this skill) |
| `adr_template_path` | optional | Path to ADR template (default: `memory/standards/templates/adr.md`) |
| `output_base` | yes | Directory to write reconciliation-proposals.yaml and any ADR drafts |

## Process

1. **Read context-diff.** Enumerate findings.

2. **Per finding, identify target.** For Tier 2, grep the product LTM root for the artifact most directly addressing the finding's dimension. For Tier 3, name the new file that would be created (under the appropriate LTM subdirectory). For Tier 1, target is the LOCKED artifact + a new ADR.

3. **Draft the change.** For Tier 2 / Tier 3: explicit diff or addition block in the form the target artifact expects. Match the artifact's existing tone, section structure, and YAML shape.

4. **Impact assessment.** Per proposal: downstream artifacts that will need re-read, plays that consume the target, risk class (low / medium / high).

5. **ADR draft (Tier 1 only).** Use the ADR template. Fill: context, decision, consequences, status (`PROPOSED`). Write each ADR to `{output_base}/adr-drafts/ADR-NNNN-{slug}.md`.

6. **Emit reconciliation-proposals.yaml:**

   ```yaml
   sourced_from: "{context_diff_path}"
   generated_at: "{ISO-8601}"
   proposals:
     - proposal_id: P-001
       from_finding: F-001
       tier: 1 | 2 | 3
       target_path: "{LTM artifact path}"
       action: modify | add | contradict_with_adr
       change: |
         {block or diff}
       impact:
         downstream_artifacts: [ ... ]
         plays_affected: [ ... ]
         risk: low | medium | high
       adr_draft_path: "{path to ADR draft, Tier 1 only}"
       approval_status: pending
   summary:
     tier_1: {n}
     tier_2: {n}
     tier_3: {n}
   ```

## Output

```yaml
reconciliation_proposals_path: "{output_base}/reconciliation-proposals.yaml"
adr_draft_paths: [ ... ]
proposal_count: {n}
status: written
```

## Boundaries

- You do NOT write anything under `product_ltm_root` or `core_ltm_root`.
- Tier 1 findings MUST have an ADR draft. Tier 1 with no ADR is a failure.
- Approvals are collected by the agent / play — this skill only writes `approval_status: pending`.
