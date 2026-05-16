# Agent Audit Gate — Decision (issue #370 rebake)

## Audit result

| Agent | Overall | Notes |
|-------|---------|-------|
| product-keeper | FAIL (P7, P10) | Pre-existing drift, unrelated to #370 |
| project-orchestrator | PASS | — |
| repo-orchestrator | PASS | — |

product-keeper P7: invokes `research-domain-context` in define Phase 4 but
does not list it in its declared skill inventory.
product-keeper P10: no Task Graph / TaskUpdate section in its definition.

Both confirmed pre-existing and **not introduced or worsened by the #370
change** (C17 Decision Surfacing + F11 are play-owned orchestration at the
Phase 5 / Phase 9 gates; no agent definition is touched). define already
ships with product-keeper in this state; runtime is not broken (the play
drives TaskUpdate at the play layer; product-keeper still produces all three
decision manifests to STM correctly).

## Decision

User decision (2026-05-16): **Proceed — option 1.** Finish the #370 rebake
and record the product-keeper drift as a separate tracked follow-up issue.

Rationale: issue #370 is explicitly scoped define-local ("do not expand the
blast radius"). product-keeper is shared by specify, design, and arch —
fixing it here would be scope creep against the approved, user-Tethered fix
and a one-way door into three other working plays. The #370 SKILL.md
regeneration does not depend on the product-keeper drift.

create-play Step 4 gate is discharged via the skill's own
"present options → Skip (proceed)" failure path, with the drift captured
as a follow-up issue.

**Follow-up issue:** #373 — https://github.com/kapilvirenahuja/garura/issues/373
