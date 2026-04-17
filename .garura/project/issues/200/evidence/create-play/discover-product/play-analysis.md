# Play Analysis: discover-product (rebake)

**Mode:** Rebake
**Intent path:** `core/components/plays/discover-product/reference/intent.yaml`
**Intent hash:** `sha256:0474d47cc799c28e49220cb644bc6c950ecbe294cb261d7536323161f85666bc`
**Compiled at:** 2026-04-13
**Issue:** 200

## Gate (Step 1)

Rebake of an existing play. Identity preserved:
- name: `discover-product`
- maturity: L2
- user-invocable: true

## Deep Read (Step R1)

Read all prior-step inputs: existing SKILL.md, intent.yaml, config.yaml,
audit-checklist, compiled-example, agent definitions (product-strategist, judge,
repo-orchestrator), skill contracts (discover-product-opportunity,
draft-product-vision, validate-product-vision), agent-contract.md.

## Intent Crafting (Step 2)

**SKIPPED per user direction at rebake invocation time.**

The intent.yaml was edited immediately before this rebake to remove all brief
generation. User explicitly stated the intent is final and pre-approved. No
intent-crafter invocation. No Tether gate. The intent is consumed as-is.

## Key change vs prior compilation

Prior compiled play included a `doc-builder` dispatch at Step 4 (Generate
HTML Brief) and used the HTML brief as the Step 5 checkpoint review surface.
The new intent.yaml (C8) makes the checkpoint review surface the `product.yaml`
path directly. Briefs become opt-in via a separate `/briefs` command.

**Consequences:**
- Drop `doc-builder` from agent boundary table.
- Remove Step 4 (Generate HTML Brief) entirely. Renumber subsequent steps.
- Checkpoint (new Step 4) writes a checkpoint `.md` artifact and presents the
  `product.yaml` path as review surface. The `.md` artifact satisfies F9
  (audit trail) since C8 mandates writing a checkpoint artifact before each
  user-facing pause.
- Drop SE-10 (brief path), SE-13 (C10 — C10 no longer exists in intent), and
  the old SE-7/SE-12 forms that reference `product-brief.html`.
- Rewrite SE-7 (F9) to anchor on the checkpoint `.md` artifact.
- Rewrite SE-12 (C8) to anchor on the checkpoint `.md` artifact.
- Remove HTML brief language from SCE-1, SCE-7 and from Step 10 summary and
  Step 9 evidence file list.
- Workflow structure remains `B` (unchanged per prior compilation).
- Agent count becomes: 1 domain (product-strategist) + 1 validator (judge)
  + 1 utility (repo-orchestrator).

## Workflow Selection (Step 5)

Structure B (preserved): a single linear flow with a domain agent, a
context-isolated validator, and a play-owned pre-lock gate. No L1 chaining.
Steps 3a (coverage check) and 3b (profile validation) remain inline sub-steps.
