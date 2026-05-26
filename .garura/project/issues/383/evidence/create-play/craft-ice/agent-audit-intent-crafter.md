## Agent Audit: intent-crafter

Role in craft-ice: **Intent layer** — authors the feature's clean triple (goal, constraints, failure conditions) via `author-intent-yaml`, applying its quality gate.

**Audit classification: EXEMPT from runtime P1-P11.** Per `reference/audit-checklist.md` line 3, the P1-P11 principles "do NOT apply to build-time agents like `intent-crafter`." intent-crafter is the interview agent — its core value (asking the user questions) is a build-time/authoring activity, not a compiled-play runtime domain task.

**Runtime usage pattern in craft-ice (the interview wrinkle).** A sub-agent dispatched via the Task/Agent tool cannot interview the user interactively — it runs to completion and returns. So craft-ice does NOT rely on intent-crafter to interview at runtime. Instead, mirroring the enhance play:

1. The **play orchestrator** conducts the Q&A discovery with the user (about the epic/feature) and writes the digest to STM — the play, not an agent, owns user interaction (no P5 conflict).
2. craft-ice then dispatches **intent-crafter in authoring mode**: it reads the discovery digest from STM, applies its quality gate (boundaries-not-methods, falsifiable, implementation-agnostic, observable failure states), and invokes `author-intent-yaml` to write the feature intent triple. No interview occurs in this dispatch.

In this authoring-mode dispatch, intent-crafter behaves compliantly — reads from STM, no direct user interaction, delegates the write to `author-intent-yaml`, returns the path. This is the same pattern used to author craft-ice's own intent during this build.

**Verdict: EXEMPT (build-time/interview agent); compliant in authoring-mode runtime dispatch.** No changes required.
