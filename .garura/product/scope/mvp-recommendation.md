# MVP Recommendation — Garura

**Slug:** garura-platform
**Author:** specify-product play (drafted by orchestrator; pending human Tether)
**Created:** 2026-04-18
**Revised:** 2026-04-18 (aligned with features.yaml — 5 domains / 23 capabilities / 85 features)
**Timeline anchor:** Apr 2026 MVP (solo-greenfield) → May 2026 (small-squads + brownfield) → Jul 2026 (enterprise-ready)

---

## Context — Garura Is Applied + Evolving

Garura's Agentic Methodology substrate is LIVE and dogfooded. 21 plays, 19 agents, 47 skills, three memory layers (STM live; Project LTM + Global KB partial — KB content has active review issues), three-layer hierarchy, human-in-the-loop approval, evidence substrate. The L2 pipeline is applied end-to-end (specify-product → validate-epic). The SDLC phase coverage is already substantial: **product-to-spec and spec-to-design are LIVE**; design-to-code, code-to-test, and test-to-run are PARTIAL.

**v1 MVP is therefore a stabilization + onboarding-gap-closure milestone.** One net-new capability (first-run-onboarding) carries v1.

### Built-state rollup (from features.yaml)

| Domain | Capabilities | Features | LIVE / PARTIAL / PLANNED |
|---|---|---|---|
| Agentic Methodology | 5 | 23 | 13 / 3 / 7 |
| Engineering Observability | 4 | 14 | 0 / 4 / 10 |
| AI Governance | 4 | 16 | 0 / 4 / 12 |
| Work Intelligence | 4 | 11 | 3 / 2 / 6 |
| Engineering Experience | 6 | 21 | 6 / 1 / 14 |
| **Total** | **23** | **85** | **22 / 14 / 49** |

LIVE-rollup capabilities: `component-architecture`, `l2-spec-driven` (applied), `agent-integrations`, `cli-slash-commands`. Everything else is PARTIAL or PLANNED.

---

## Primary Capabilities (v1 — Apr 2026, solo-greenfield)

Eight capabilities in scope for v1.

### PC-1 — `agentic-methodology / component-architecture` — **stabilize + close KB review**
- **Status:** LIVE rollup; AM-F005 (Project LTM) + AM-F006 (Global KB) PARTIAL
- **Scope in v1:** Stabilization + **close open KB-review issues** (AM-F006 gap). Automated STM→LTM promotion (AM-F005) stays partial through v1.

### PC-2 — `agentic-methodology / l2-spec-driven` — **applied (not a build target)**
- **Status:** APPLIED; AM-F010 Maturity Ladder + AM-F012 Spec-to-Test PARTIAL
- **Scope in v1:** Close drift-propagation gaps surfaced by `check-drift`. No new engine work — Garura applies L2; it does not rebuild L2 theory.

### PC-3 — `engineering-experience / sdlc-phase-coverage` — **stabilize existing phases**
- **Status:** PARTIAL (2 LIVE / 3 PARTIAL)
- **Scope in v1:** No new phases. Harden the 3 PARTIAL phases (design-to-code, code-to-test, test-to-run). This is the integrated end-to-end demo story; stabilization here is the top v1 outcome.

### PC-4 — `engineering-experience / cli-slash-commands` — **stabilize**
- **Status:** LIVE (4/4)
- **Scope in v1:** Regression-protect. Primary UX backbone.

### PC-5 — `engineering-experience / agent-integrations` — **stabilize (all 3)**
- **Status:** LIVE (Claude Code, Factory.ai, Codex)
- **Scope in v1:** Stabilize all three agent surfaces; keep invocation-contract parity. No new adapters.

### PC-6 — `engineering-experience / first-run-onboarding` — **NET-NEW BUILD (the v1 delivery)**
- **Status:** PARTIAL — EE-F011 (Installer) is the sole partial; EE-F010 (Wizard) is PLANNED for v1 Apr
- **Scope in v1:** Ship EE-F010 (3-question wizard) + finish EE-F011 (unified npm + end-user Claude Code installer). EE-F013 (Bootcamp) + EE-F014 (Demos) remain deferred to v1.1.
- **Rationale:** The one net-new capability. Without it, new users can't reach the methodology engine.

### PC-7 — `work-intelligence / intent-driven-verification` — **stabilize eval + fix-it**
- **Status:** PARTIAL (2 LIVE / 1 PARTIAL / 1 PLANNED)
- **Scope in v1:** Harden WI-F010 (Eval Generation) + WI-F013 (Fix-It Loop). Close eval under-generation on failure scenarios. WI-F011 (Test Generation) + WI-F012 (RCA corpus) stay deferred.

### PC-8 — `ai-governance / audit-attribution` — **decision-trail brief extension**
- **Status:** PARTIAL (3 PARTIAL / 1 PLANNED)
- **Scope in v1:** Extend AG-F006 (Evidence Export via `briefs`) with per-issue decision-trail brief template. AG-F004 + AG-F005 polish only. AG-F007 (Compliance Reports) stays PLANNED.

---

## Deferred Capabilities

### v1.1 May 2026 (small-squads + brownfield)
- `agentic-methodology / l3-intent-driven` (full) — cross-play intent inference (AM-F014)
- `engineering-observability / quality-signals` — coverage + lint aggregation
- `engineering-observability / debt-signals` — tech/spec/domain debt surfaces
- `engineering-observability / methodology-posture` — ladder-position, play success rate, **OTEL integration (EO-F015)**
- `engineering-observability / delivery-signals` — DORA four, cycle/lead time
- `ai-governance / consumption-tracking` — token tracking (AG-F001) + **autonomy tracking (AG-F011, key differentiator)**
- `ai-governance / memory-governance` — LTM curation + promotion workflow
- `work-intelligence / agentic-triage` — profile-based auto-triage, vision-anchored priority, agent-time allocation
- `engineering-experience / engineering-portal` — role-aware dashboards + project browser + decision-trail search (EE-F006/F007/F009)
- `engineering-experience / first-run-onboarding` (bootcamp + demos) — EE-F013, EE-F014

### v1.2 Jul 2026 (enterprise-ready)
- `agentic-methodology / l4-signal-driven` — direction only (runtime intent-resolution replaces /create-play); no concrete feature list yet
- `engineering-observability` (full Control Tower) — cross-project aggregation + AI adoption maturity (EO-F009)
- `ai-governance / consumption-tracking` (full) — budget enforcement + cost attribution
- `ai-governance / audit-attribution` — compliance reports (AG-F007)
- `ai-governance / memory-governance` — access control (AG-F009)
- `ai-governance / governance-hierarchy` — full 4-tier Project → Account → Portfolio → Org (AG-F012..F016)
- `work-intelligence / agentic-planning` — release planning, agentic iteration, people + agent capacity with token budget (WI-F004..F006)
- `engineering-experience / design-to-code` — Figma integration + design tokens (EE-F019, EE-F020)

### Post-v1 (continuous / TBD)
- `agentic-methodology / l5-goal-driven` — no feature list yet
- `work-intelligence / backlog-lifecycle` — deferred for reconsideration (stories, grooming may not belong in agentic world)

---

## Architecture Direction (Committed at Spec Time)

Reaffirmed:
- **Single-tenant, local-first** — every artifact under `.garura/`. No hosted service in v1.
- **Claude-primary, model-agnostic abstraction** — agents intermediate LLM calls. Claude Code is anchor; Factory.ai + Codex are LIVE.
- **Markdown + YAML artifacts** — grep/glob is the retrieval primitive.
- **Three-layer hierarchy** (ADR 001): Play → Agent → Skill.
- **Three-tier memory** (ADR 008, 017): STM → Project LTM → Global KB.
- **Evidence + checkpoint substrate** (ADR 012): mandatory play outputs.
- **Human-in-the-loop approval** with bypass config: Tether convention is user-owned; bypass is policy-configurable.

New v1 commitments (not yet in `build-arch`):
- **Unified installer** (npm + end-user Claude Code bootstrap) — EE-F011
- **3-question greenfield wizard** — EE-F010
- **Decision-trail brief template** — extends existing `briefs` skill (AG-F006)

---

## Directional Pricing

| Tier | Audience | v1 (Apr) | v1.1 (May) | v1.2 (Jul) |
|---|---|---|---|---|
| Solo / Indie | Individual builders | **Free** (OSS core, BYO-LLM key) | Free | Free |
| Squad | 3–10 engineers | — | **$15–25/seat/mo** | $15–25/seat/mo |
| Enterprise | 50–500+ engineers | — | — | **$50K–$150K/yr** |

OSS-core → solo procurement-free. Squad tier gates portal + triage. Enterprise gates governance-hierarchy + full Control Tower + compliance reports.

---

## Success Criteria — v1 (Apr 2026)

- **Install-to-first-spec time:** < 30 minutes (end-to-end through the Wizard + Installer)
- **AI sessions with full project context auto-loaded:** ≥ 90%
- **End-to-end pipeline success (`specify-product` → `ship`) on first attempt for a dogfooded project:** ≥ 80%
- **Phase coverage demonstrable:** a dogfooded run traverses all 5 phases (product-to-spec → test-to-run) with recoverable artifacts at each boundary
- **Spec-to-test traceability:** every committed feature traceable from intent epic → acceptance scenarios → generated evals → passing implementation
- **Decision-trail brief readability:** a compliance-minded reviewer reconstructs "what AI did and what human approved" from the brief alone on ≥ 80% of dogfood runs
- **Solo-user NPS after 30-day cohort:** ≥ +40

---

## Risks That Could Kill the MVP

### R1 — KB review debt blocks Stage-3 capability configuration
- **Severity:** Medium-High
- **Signal:** configure-capabilities flags dangling CTC refs or missing KB features for new projects.
- **Mitigation:** Close open KB review issues (AM-F006 gap) during v1 stabilization; treat KB content as v1-blocking, not v1.1.

### R2 — Installer + Wizard underdeliver the 30-minute promise
- **Severity:** High
- **Signal:** Beta first-run latency > 45 min.
- **Mitigation:** `first-run-onboarding` is P0 for v1. Hold launch if > 30 min.

### R3 — Phase-coverage stabilization exposes deeper drift than expected
- **Severity:** Medium-High
- **Signal:** Dogfooding surfaces architectural drift in design-to-code / code-to-test / test-to-run boundaries.
- **Mitigation:** `check-drift` exists; scope dogfooding to 3 real projects before launch; ship v1 as "pipeline beta" with known-gaps doc if drift cannot be closed.

### R4 — Dominant platform closes the methodology-memory gap before Jul 2026
- **Severity:** Medium
- **Signal:** Anthropic / Microsoft / Google ships persistent methodology memory natively.
- **Mitigation:** Compete on breadth (5 domains integrated, 23 capabilities). Accelerate v1.1/v1.2 to lock enterprise distribution.

### R5 — Decision-trail brief doesn't satisfy non-technical reviewer bar
- **Severity:** Low-Medium
- **Signal:** Reviewers can't reconstruct AI decisions without engineering help.
- **Mitigation:** Scope v1 to "decision trail exists and is parseable"; upgrade to "compliance-dashboard-ready" in v1.2.

---

## Capability Narrowing for Stage 3

`configure-capabilities` should select for v1 scope:

**Primary (8 capabilities):**
- `agentic-methodology / component-architecture` (stabilize + close KB review)
- `agentic-methodology / l2-spec-driven` (applied — stabilize)
- `engineering-experience / sdlc-phase-coverage` (stabilize 3 PARTIAL phases)
- `engineering-experience / cli-slash-commands` (stabilize)
- `engineering-experience / agent-integrations` (stabilize — CC + Factory.ai + Codex)
- `engineering-experience / first-run-onboarding` (**NET-NEW** — wizard + unified installer)
- `work-intelligence / intent-driven-verification` (stabilize eval + fix-it)
- `ai-governance / audit-attribution` (decision-trail brief extension)

**Deferred to v1.1 (10 capabilities):** `l3-intent-driven`, `quality-signals`, `debt-signals`, `methodology-posture` (+ OTEL), `delivery-signals`, `consumption-tracking` (partial — token + autonomy tracking), `memory-governance`, `agentic-triage`, `engineering-portal`, `first-run-onboarding` (bootcamp + demos)

**Deferred to v1.2 (5 capabilities or rollups):** `l4-signal-driven`, `consumption-tracking` (full — budget + cost), `audit-attribution` (compliance reports), `memory-governance` (access control), `governance-hierarchy`, `agentic-planning`, `design-to-code`

**Post-v1:** `l5-goal-driven`, `backlog-lifecycle` (deferred-for-reconsideration)

**v1 rollup:** 8 primary capabilities. 6 are stabilization-only; only `first-run-onboarding` is a net-new build (+ KB review closure as P0 stabilization work). The entire Engineering Observability domain is deferred to v1.1 — no v1 Control Tower.
