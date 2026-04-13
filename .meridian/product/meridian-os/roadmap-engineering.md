---
for: Engineering
product: "Meridian OS"
slug: "meridian-os"
roadmap_ref: ".meridian/project/product/meridian-os/roadmap.md"
created: "2026-03-04"
---

# Engineering Roadmap View — Meridian OS

> This view is for engineering use only. It contains no business context, revenue projections, or market framing.

## Epic Breakdown

| Epic | Work Packages | Complexity | Risk | Status | Issue Ref |
|------|---------------|------------|------|--------|-----------|
| E1 — Persistent Context Engine | STM storage/retrieval, LTM storage/retrieval, CLAUDE.md auto-population, context loading protocol, memory indexing | High | Medium | planned | TBD |
| E2 — Play Execution Engine | Atomic play execution, high-order orchestration, Tether/Vanish protocol, agent delegation framework, checkpoint/evidence production, play definition format | High | Medium | planned | TBD |
| E4 — Strategic Planning Track | discover-product play, plan-roadmap play, audience-separated artifact generation, vision lock protocol | Medium | Low | planned | TBD |
| E3 — Quality & Verification Layer | quality-validator agent, verification scenario execution, evidence artifact production, quality gate definitions, play checkpoint integration | Medium | Medium | planned | TBD |
| E5 — Feature Development Track | start-feature-planning play, implement play, ship play, end-to-end artifact traceability, branch management integration | High | Medium | planned | TBD |
| E6 — Adoption & Onboarding | Project init play, directory scaffolding, CLAUDE.md starter population, progressive enrichment templates, setup validation | Low | Medium | planned | TBD |

## Dependency Sequence

E1 (Persistent Context Engine) must be delivered first. It has no upstream dependencies and is a hard prerequisite for E2. All downstream epics read from and write to the memory layer E1 provides.

E2 (Play Execution Engine) depends on E1. It is the critical path bottleneck — three epics (E3, E4, E5) are blocked until E2 is stable. E2 is the largest single effort (XL) on the roadmap. Delays to E2 cascade across the entire plan.

Once E2 is stable, E4 (Strategic Planning Track) and E3 (Quality & Verification Layer) can proceed in parallel. E4 depends only on E2. E3 depends only on E2. There is no dependency between E3 and E4.

E5 (Feature Development Track) is blocked by both E2 and E3. It cannot begin until the quality layer is operational because the feature pipeline requires verification at multiple stages.

E6 (Adoption & Onboarding) is the terminal node. It depends on E1, E2, E4, and E5. It cannot be started until the system is functionally complete.

**Critical path:** E1 -> E2 -> E3 -> E5 -> E6

**Parallel track (off critical path):** E2 -> E4 (can run alongside E3)

## Architecture Impact

**E1 — Persistent Context Engine**
- Introduces STM and LTM storage layers. STM is issue-scoped (`.meridian/{issue}/`), LTM is project-scoped (`~/.meridian/core/memory/`).
- Introduces context loading protocol — determines what gets loaded into AI session context at start.
- Introduces CLAUDE.md auto-population — writes to `.claude/CLAUDE.md` or project-level CLAUDE.md.
- New pattern: selective memory retrieval via Glob/Grep against memory indices.

**E2 — Play Execution Engine**
- Introduces the play definition format (L1/L2 YAML or markdown specs).
- Introduces agent delegation framework — plays invoke agents via Task tool with structured contracts.
- Introduces checkpoint/evidence artifact protocol — standardized paths under STM.
- Introduces Tether/Vanish approval protocol as a first-class execution primitive.
- Foundation required: true — all downstream workflow capabilities depend on this engine.

**E4 — Strategic Planning Track**
- Adds product-strategist agent and associated skills (discover-product-opportunity, draft-product-vision, etc.).
- Introduces audience-separated artifact pattern — single source of truth generating multiple views.
- Introduces vision lock protocol — state machine on artifact status (DRAFT -> LOCKED).

**E3 — Quality & Verification Layer**
- Introduces quality-validator agent.
- Introduces verification scenario execution framework (given/when/then runner).
- Introduces evidence artifact format and storage protocol.
- Adds quality gate integration points to the play checkpoint system from E2.

**E5 — Feature Development Track**
- Composes existing agents (code-builder, tech-designer, repo-orchestrator, quality-validator) into end-to-end pipeline.
- Introduces artifact traceability chain: issue -> spec -> design -> code -> PR.
- Extends repo-orchestrator with branch lifecycle management tied to play execution.

**E6 — Adoption & Onboarding**
- Introduces project initialization play — scaffolds directory structure, memory, CLAUDE.md.
- Introduces setup validation protocol — verifies working state post-init.
- No new architectural patterns; composes existing capabilities into a guided flow.

## Technical Risks

| Risk | Affected Epics | Severity | Notes |
|------|---------------|----------|-------|
| Context loading latency — memory retrieval may be too slow with large LTM | E1, E2 | Medium | Need selective retrieval with indexing; bulk-load is not viable. Monitor retrieval time as LTM grows. |
| Play execution determinism — ensuring same inputs produce same step sequences | E2, E4, E5 | Medium | Agent delegation introduces non-determinism from LLM responses. Plays must validate agent output structure, not content. |
| CLAUDE.md conflict with user-authored content | E1, E6 | Medium | Auto-population must merge, not overwrite. Requires section-based ownership markers or append-only strategy. |
| XL effort estimates for E2 and E5 may exceed capacity | E2, E5 | Medium | If E2 scope is too large, decomposition into sub-epics is required before implementation begins. Same applies to E5. |
| Agent delegation failure propagation | E2, E3, E5 | Medium | Structured failure protocol must be enforced across all agents. Silent failures in delegated agents would produce corrupted pipeline state. |
| Foundation coupling — E1 changes cascade to all downstream epics | E1, E2, E3, E4, E5, E6 | Medium | E1 interfaces must stabilize early. Breaking changes to memory layer after E2 begins would require rework across the dependency graph. |

## Open Questions

- What is the indexing strategy for LTM as project memory grows? Flat file Glob/Grep may not scale beyond a threshold.
- Should play definitions be YAML, markdown, or a hybrid format? Format choice affects tooling for play authoring and validation.
- How does CLAUDE.md auto-population handle multi-user projects where different engineers have different CLAUDE.md preferences?
- What is the upper bound on agent calls per play before latency becomes unacceptable? L2 allows 5 but real-world timing is untested.
- Should E2 be decomposed into sub-epics (e.g., L1 engine first, L2 orchestration second) to reduce single-epic risk?
- What is the verification scenario execution model — in-process (same Claude session) or delegated (separate agent session)?
- How does artifact traceability in E5 handle cases where an engineer skips a pipeline step (e.g., implements without a design)?
<!-- open_questions_count: 7 -->
