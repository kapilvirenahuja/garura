---
name: draft-enrichment-proposals
description: Given a tiered context-diff with taxonomy-classified findings, author proposals.yaml — one proposal per finding with target LTM artifact, proposed change, impact assessment, taxonomy fields carried forward from the finding, and (for Tier 1) an ADR draft. Writes the proposals file plus any ADR drafts. Does NOT write LTM — that is a separate LTM-write skill invoked only by the enrich play.
user-invocable: false
model: sonnet
allowed-tools: Read, Write, Glob, Grep
deprecated: true
deprecated_note: '#434 ProductOS realignment — superseded by the command model; retained for Phase E reference, not installed'
---

# draft-enrichment-proposals

Model-invocable skill for reconciliation-proposal authorship.

## Purpose

Turn findings from `diff-context-baseline` into actionable proposals for the human reviewer. Each proposal names a target LTM artifact, a proposed change, an impact assessment, and — for Tier 1 — a linked ADR draft. The full two-level learning taxonomy from the originating finding is carried forward faithfully into each proposal. This skill does NOT re-classify findings — it passes through the taxonomy assigned by `diff-context-baseline`. The output is a staging artifact; no LTM is written until the enrich play runs on approved proposals.

## Input

| Field | Required | Description |
|-------|----------|-------------|
| `context_diff_path` | yes | Path to context-diff.yaml from diff-context-baseline |
| `product_ltm_root` | yes | Root of product LTM to identify candidate target files for Tier 2 enrichments |
| `core_ltm_root` | optional | Root of core LTM (for cross-reference only — core LTM is never modified by this skill) |
| `adr_template_path` | optional | Path to ADR template (default: `memory/standards/templates/adr.md`) |
| `output_base` | yes | Directory to write proposals.yaml and any ADR drafts |

## Process

1. **Read context-diff.** Enumerate findings. For each finding, note its full taxonomy fields: `learning_category`, `sub_category`, `learning_category_proposed`, `sub_category_proposed`, `taxonomy_justification`.

2. **Per finding, identify target.** For Tier 2, grep the product LTM root for the artifact most directly addressing the finding's learning_category and sub_category. For Tier 3, name the new file that would be created (under the appropriate LTM subdirectory). For Tier 1, target is the LOCKED artifact + a new ADR.

3. **Draft the change.** For Tier 2 / Tier 3: explicit diff or addition block in the form the target artifact expects. Match the artifact's existing tone, section structure, and YAML shape.

4. **Impact assessment.** Per proposal: downstream artifacts that will need re-read, plays that consume the target, risk class (low / medium / high).

5. **ADR draft (Tier 1 only).** Use the ADR template. Fill: context, decision, consequences, status (`PROPOSED`). Write each ADR to `{output_base}/adr-drafts/ADR-NNNN-{slug}.md`.

6. **Emit proposals.yaml:**

   **Canonical taxonomy (carried from findings — do not re-classify):**
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

   **Note on canonical taxonomy:** The canonical taxonomy above is a **starting point, not a closed enum**. New categories or sub-categories may be proposed when none of the canonical values fit — the invention mechanism (`learning_category_proposed` / `sub_category_proposed` + `taxonomy_justification`) is the structured path for proposing additions. Proposed-new values signal taxonomy evolution to reviewers; they are not automatically promoted to canonical — that is a reviewer/enrich-play decision.

   **Invention-with-justification rule (enforced at proposals-drafting boundary):** When either `learning_category_proposed` or `sub_category_proposed` is true, the proposal MUST carry a complete `taxonomy_justification` block (`evidence_path`, `excerpt`, `reasoning`). Proposals that propose a new category or sub-category without a complete justification block MUST be rejected by this skill with a structured error — this skill does not rely on upstream validation; it validates the invariant at its own boundary.

   ```yaml
   sourced_from: "{context_diff_path}"
   generated_at: "{ISO-8601}"
   source_play: "reap"
   proposals:
     - proposal_id: P-001
       from_finding: F-001
       tier: 1 | 2 | 3
       learning_category: "<canonical: arch|domain|product|quality|standards  OR  proposed-new>"
       sub_category: "<canonical child of parent  OR  proposed-new  OR  null for flat parents>"
       learning_category_proposed: false
       sub_category_proposed: false
       taxonomy_justification:             # REQUIRED iff either _proposed flag is true; omit otherwise
         evidence_path: "<path to STM artifact>"
         excerpt: "<verbatim excerpt>"
         reasoning: "<why canonical taxonomy does not fit>"
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
     by_learning_category:
       arch: {n}
       domain: {n}
       product: {n}
       quality: {n}
       standards: {n}
     proposed_categories:                  # distinct proposed-new learning_category values this run
       - value: "<proposed name>"
         count: {n}
         first_evidence_path: "<path>"
     proposed_sub_categories:             # distinct proposed-new sub_category values this run
       - parent: "<learning_category>"
         value: "<proposed name>"
         count: {n}
         first_evidence_path: "<path>"
     tiers_skipped: ["{list of tiers skipped due to missing artifacts}"]
   ```

   **total_proposals:** Implicit from `len(proposals)`. A zero-proposal run writes the file
   with an empty `proposals` list and all tier/category counts at 0.

## Output

```yaml
proposals_path: "{output_base}/proposals.yaml"
adr_draft_paths: [ ... ]
proposal_count: {n}
status: written
```

## Boundaries

- You do NOT write anything under `product_ltm_root` or `core_ltm_root`.
- Tier 1 findings MUST have an ADR draft. Tier 1 with no ADR is a failure.
- Approvals are collected by the agent / play — this skill only writes `approval_status: pending`.
- Taxonomy fields are sourced from the originating finding via `from_finding` link — do NOT re-classify. Faithful pass-through from `diff-context-baseline` findings is required.
- Output filename is `proposals.yaml` (not `reconciliation-proposals.yaml`). The contract key is `proposals_path` (not `reconciliation_proposals_path`).
