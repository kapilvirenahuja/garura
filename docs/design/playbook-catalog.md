# Playbook Catalog — Design Note (Draft)

**Status:** Discovery draft. Not scoped, not implemented. Pre-feature artifact to capture thinking for later mapping into a scope/domain via `/scope`.

**Date:** 2026-04-23

**Author notes:** Produced from an audit of all 24 existing plays under `core/components/plays/` (actual SKILL.md bodies read, not paraphrased from one-liners) cross-referenced against the end-to-end product + software-engineering lifecycle. This document captures the playbook concept, the transformation surface it targets, the gap analysis, and a first-draft catalog.

---

## 1. Purpose

Garura today exposes 24 plays. Each play is a focused unit (e.g., `specify`, `prepare`, `implement`, `validate`, `fix-it`). In practice, teams rarely run a single play in isolation — they run ordered sequences tuned to a situation: "greenfield MVP," "brownfield migration," "defect sprint," etc.

A **playbook** is a named, situation-tuned sequence of plays with explicit gates, loops, and optimization principles. Plays are reusable building blocks; the same play (e.g., `validate`) appears in many playbooks. The value of a playbook is not *which* plays it lists — it is the *order, the skips, the gates, and the optimization* it commits to.

This document:
- Defines the playbook concept.
- Inventories the actual (not assumed) scope of every existing play.
- Maps the full product + SE transformation surface to identify where plays are missing.
- Proposes 19 draft playbooks covering greenfield, brownfield, specialized, ops, and feedback scenarios.
- Flags which steps rely on existing plays and which would require new plays, tiered by criticality.

This is not a feature spec. It is material to feed into `/scope` when we decide to turn it into one.

---

## 2. Playbook concept

A playbook is:

- **Situation** — the project state and goal that triggers this playbook (the recognizable entry condition).
- **Optimization** — the explicit tradeoff this playbook commits to (e.g., safety over speed, cycle time over rigor, boundary clarity over convenience).
- **Sequence** — the ordered plays with loops (marked `*`), branches, and skip conditions.
- **Gates** — where the sequence pauses for human approval, drift checks, quality thresholds, or verdict.
- **Exit** — what state the project lands in when the playbook completes.

A playbook is not a category. The same play can appear in any number of playbooks; only the surrounding context differs.

---

## 3. Play inventory — actual scope

Summary of every play under `core/components/plays/` as of this audit. Scope statements are drawn from the SKILL.md bodies, not the one-line `description:` field.

| Play | Actual Scope | Lifecycle Stage |
|---|---|---|
| `specify` | Six-stage product specification: market research → domain selection → MVP gate → capability configuration → enrichment → epic generation → quality profile. Four human checkpoints + four decision-surfacing sub-gates. Locks product LTM. | Discovery |
| `design` | UX design end-to-end: JTBD personas, screen inventory with wireframes, user flows, design system, consolidated design spec. Three modes (product-wide / single-epic / single-feature). Brownfield gap-only. Three gates + six sub-gates. | Discovery |
| `arch` | Five-artifact architecture package: logical-architecture, physical-architecture, nfr-spec, quality-vision, design-patterns. Five sequential checkpoints with tier-batched decision surfacing. Locks product LTM. | Discovery |
| `codify` | **Brownfield bootstrap.** Reverse-engineers the full `specify + design + arch` artifact tree from an existing codebase. All output staged as proposals in STM. Captures product **shape**. | Brownfield bootstrap |
| `decode` | **Brownfield behavior extraction with executable verification.** For each feature in the catalog, extracts business logic, flow specs, aspect specs with tests that run green before capture. Captures product **logic**. Pairs with `codify`. | Brownfield bootstrap |
| `scope` | 13-phase feature scoping: issue resolution → catalog match → constraint fit → LTM grounding → placement → product spec update → epic generation → gap interview. Four gates. Produces a features.yaml row + intent epic(s). | Feature onboarding |
| `prepare` | Epic-level LLD: deep parallel codebase analysis, blast radius (directly/transitively impacted + coverage gaps), baseline test specs, interface-level tech.yaml, 3-tier scenarios, task DAG. Two gates. | Planning |
| `implement` | Per-milestone spec-driven execution. Strict context isolation: test-writer sees TEST-CONTEXT only, code-builder sees architecture only, neither sees the other. Quality-auditor CERTIFIED gate + judge-as-arbiter on stuck loops. Max 3 outer iterations. | Build |
| `validate` | Per-milestone system-level QA: 3-tier E2E (baseline regression + new + regression), judge evaluation, manual test scenarios. Strict agent context isolation. Remediation loop back to `implement`, max 3 iterations. | Quality gate |
| `enhance` | Autonomous enhancement: scope gate (redirects to `fix-it` if too small, `prepare` if too large) → discovery Q&A → design with alternatives → independent verification (code-builder + quality-auditor) → judge confidence → PR. Two gates. | Build |
| `fix-it` | RCA-driven defect resolution: trace root cause → design with alternatives → failing regression test → one mandatory (never-skippable) checkpoint → implement with retry loop → autonomous ship. | Build |
| `check-drift` | Implementation drift against locked specs. Produces drift report, ADR drafts, debt catalog, memory items. | Quality gate |
| `review-pr` | Diff-scoped PR review with deterministic P1/P2/P3 severity taxonomy. Confidence formula routes decision (PASS / BLOCK / ESCALATE). Gates `ship` unless `review-pr.bypass=false`. | Quality gate |
| `start-feature` | Issue resolution + branch creation + STM init. Three input patterns converge on the same flow. No planning artifacts. | Work setup |
| `start-feature-planning` | Lightweight planning alternative to the full specify → design → arch → prepare pipeline. Uses built-in Plan sub-agent. Produces spec.md, verify.md, tasks.md. One Tether/Vanish gate. | Work setup |
| `capture` | Async GitHub issue filing with type inference. Fire-and-forget; non-blocking. | Utility |
| `report-issue` | **Deprecated alias for `capture`.** Will be removed next major release. | Utility |
| `commit-code` | Concern-grouped conventional commits with issue references. Optional checkpoint when confidence low. | Delivery |
| `create-pr` | PR creation with dynamic, context-aware quality checklist. Optional checkpoint. | Delivery |
| `merge-pr` | Merge PR, switch to main, pull latest, delete feature branch. Fully automated if review-pr passed. | Delivery |
| `ship` | End-to-end delivery chain: `commit-code → create-pr → review-pr → merge-pr → distill`. Auto-proceeds unless review-pr blocks/escalates. Structure C (chained sub-plays). | Delivery |
| `distill` | Lightweight post-merge learning extraction. Fires non-blocking after `merge-pr`. knowledge-extractor in FAST mode, max 2 proposals. | Learning |
| `reap` | Post-epic learning extraction. Reads build trinity (prepare context + all implement status reports + all validate verdicts). knowledge-extractor in ANALYZE mode with 2-level taxonomy. One gate. | Learning |
| `briefs` | YAML→JSON→HTML brief regeneration with checksum-driven caching. Zero agent delegation. | Utility |
| `create-play` | Play compiler (meta). Three modes: New / Rebake / Review. Deterministic compilation from intent.yaml. 11-principle agent audit gate. | Meta |

**Cross-cutting notes from the audit:**
- `report-issue` is a deprecated thin alias for `capture`.
- `start-feature` vs. `start-feature-planning` are not overlapping: the first is setup-only, the second is setup + IDD planning via the Plan sub-agent.
- `codify` and `decode` pair: `codify` captures shape (LTM tree), `decode` captures logic (per-feature behavior, test-verified). Both SKILL.md files state **`/enrich is the sole promotion gate to product LTM`** — see §5 Tier 1.
- Decision-surfacing discipline (tier-batched HIGH/MID/LOW) appears in `specify`, `design`, `arch` — three different implementations of the same pattern.
- Context-isolation invariants are strictest in `validate`: evals-engineer, judge, test-engineer, and feature-steward each receive a tightly scoped input and never see each other's prompts or outputs.
- Most plays bound retry loops (max 2–3 iterations) with defined escalation paths. No infinite loops exist in the framework.

---

## 4. Transformation surface — what the lifecycle actually requires

Beyond specification → build → delivery, a full product + SE lifecycle includes:

```
Discover → Specify → Design → Architect → Plan → Build → Deliver → Release → Measure → Learn → Evolve → Retire
```

Plus cross-cutting concerns:
- **Ops / Incidents** — live production response, postmortems, runbooks
- **Compliance / Audit** — SOC2, HIPAA, GDPR evidence trails
- **Security** — threat modeling, vuln response, hardening
- **Cost / FinOps** — spend analysis, rightsizing
- **Accessibility** — WCAG audits and remediation
- **Data** — migrations, backfills, schema evolution (different risk profile from code)
- **API contracts** — versioning, deprecation, consumer notification
- **Docs / DX** — user-facing docs, developer onboarding
- **Customer feedback** — ingesting production signal back into backlog

Garura's 24 plays cover **Specify through Deliver plus Learn** with unusual rigor. Much of what sits **before Specify** (Discover) and **after Deliver** (Release → Measure → Retire) is unserved. Cross-cutting concerns are partially covered (compliance trail is latent in decision manifests; security has `review-pr` standards but no dedicated play).

---

## 5. Gap analysis — missing plays

Tiered by how much their absence hurts.

### Tier 1 — pipeline-breaking

These must exist for the framework to be internally consistent or for a major lifecycle arc to close.

1. **`enrich`** — Promote STM proposals from `codify` / `decode` / `reap` into product LTM. `codify` and `decode` SKILL.md bodies both reference `/enrich is the sole promotion gate to product LTM` but no play exists. This is a literal broken reference; brownfield bootstrap lands artifacts in STM that never graduate.
2. **`release`** (or `rollout`) — Staged rollout, canary configuration, feature-flag wiring, release notes, stakeholder comms. `ship` terminates at merge-to-main; nothing turns the code on for users.
3. **`measure`** — Close the intent→outcome loop. Wires telemetry, monitors the success criteria declared in intent.yaml against production signal. `reap` extracts *process* learning (how we built); nothing measures *product* learning (did it work).

### Tier 2 — lifecycle completeness

Common real-world scenarios with no play to anchor them.

4. **`discover`** — Problem validation *before* specify (customer interviews, pain synthesis, hypothesis framing). Today `specify` assumes "we are building this"; nothing decides "should we?"
5. **`incident`** — Production incident workflow: detect → triage → mitigate → postmortem. `fix-it` handles already-diagnosed bug *issues*, not live production operations.
6. **`deprecate`** / `retire` — Remove a feature cleanly (consumer notice, traffic ramp-down, code + data + LTM cleanup). Scope grows monotonically today; nothing reduces.
7. **`plan-migration`** — Multi-epic program planning: strangler sequencing, cutover criteria, rollback plans, parallel-running strategy. Nothing bridges `codify`/`decode` (understand) and per-epic `prepare` (execute) for large change programs.
8. **`upgrade-deps`** — Dependency/version upgrade as a structured scenario: manifest scan → breaking-surface detection via `decode` → per-dep fix plan.
9. **`migrate-data`** — Data migrations / backfills / schema evolution. Different risk profile from code changes (irreversible, blast radius includes production data); deserves a dedicated play with backup, validation, rollback.
10. **`document`** — User-facing documentation from intent + feature specs + design. Bridges "we built it" to "users know how to use it."
11. **`refactor`** — Behavior-preserving restructure (decode locks behavior, implement runs with a no-spec-change invariant, validate proves behavior unchanged). `enhance` and `fix-it` always change something; `refactor` is explicitly about not changing.

### Tier 3 — specializations (debatable as new plays vs. modes of existing plays)

Several of these may be better implemented as modes or flags on existing plays than as standalone plays. Captured here for completeness; premature abstraction discouraged.

12. **`harden`** — Security-lens scan: threat model, secret scan, dep vuln scan, security-focused `review-pr`. *Likely a review-pr profile + fix-it loop.*
13. **`respond-to-vuln`** — CVE disclosure → impact assessment via `decode` → emergency patch → `audit-compliance`. Different urgency profile from `fix-it`.
14. **`experiment`** — A/B hypothesis framing, exposure management, result analysis. Distinct from `measure` (passive observation).
15. **`triage-feedback`** — Ingest customer feedback (tickets, sentiment, analytics) → cluster into themes → auto-file via `capture` → link to existing capabilities.
16. **`audit-compliance`** — SOC2/HIPAA/GDPR evidence report generated from decision manifests + review-pr history + validate verdicts. *Likely a report generator over existing artifacts.*
17. **`version-api`** — API contract versioning, breaking-change detection, deprecation window.
18. **`audit-accessibility`** — Post-ship WCAG scan routing findings to `fix-it`. *Likely a validate profile.*
19. **`optimize-cost`** — FinOps scan: overprovisioning detection, rightsizing proposals, expensive-query flags.
20. **`onboard-dev`** — DX bundle: CLAUDE.md + ADR index + runbook links + test guide.

---

## 6. Playbook catalog — draft

19 playbooks, organized by scenario family. Notation:
- `[e]` = existing play
- `[m]` = missing play, with `(Tn)` indicating gap tier from §5
- `{ ... }*` = loop
- Plays in parentheses are sub-plays chained inside the named play (e.g., `ship` already chains `commit-code → create-pr → review-pr → merge-pr → distill`)

### Greenfield

**P1. new-product-full** — optimize against painting into a corner.
```
[m]discover(T2)
→ [e]specify
→ [e]design
→ [e]arch
→ { [e]scope → [e]start-feature → [e]prepare → [e]implement → [e]validate
    → [e]ship → [m]release(T1) → [m]measure(T1) → [e]distill }*
→ [e]reap
```

**P2. mvp-sprint** — optimize for days-to-first-real-user.
```
[m]discover(T2, lite)
→ [e]specify(MVP-capped)
→ [e]design(narrowed)
→ [e]arch(thin)
→ { [e]enhance → [e]ship → [m]release(T1, feature-flagged) → [m]measure(T1) }*
```

### Brownfield — understand, no code change

**P3. ltm-bootstrap** — reverse-engineer an unknown codebase.
```
[e]codify → { [e]decode }* → [m]enrich(T1) → [e]briefs
```

**P4. dev-onboarding** — bring new contributors or agents up on the repo.
```
[e]codify → [e]decode(top features) → [m]enrich(T1)
→ [m]document(T2) → [m]onboard-dev(T3) → [e]briefs
```

### Brownfield — change programs

**P5. migration-program** — optimize for safety at scale.
```
[e]codify
→ [e]decode(affected features)
→ [m]plan-migration(T2)
→ [e]arch(target stack only)
→ { [e]prepare → [e]implement → [e]validate → [e]check-drift
    → [e]ship → [m]release(T1, canary) → [m]measure(T1) }*
```

**P6. version-upgrade** — optimize for scope containment.
```
[e]codify(lite)
→ [m]upgrade-deps(T2)
→ [e]decode(breaking surface)
→ { [e]enhance → [e]review-pr(hard gate) → [e]ship }*
```

**P7. quality-uplift** — optimize for measurable delta.
```
[e]codify
→ derive new quality-vision (arch sub-skill)
→ [e]check-drift
→ { [e]fix-it | [e]enhance → [e]review-pr → [e]ship }*
→ [m]measure(T1)
```

**P8. productivity-boost** — optimize for cycle time on a known product.
```
[e]codify(once)
→ [m]enrich(T1)
→ { [e]start-feature → [e]scope → [e]prepare → [e]implement
    → [e]validate → [e]ship → [e]distill }*
```

**P9. ux-modernization** — optimize for frontend isolation.
```
[e]codify → [m]enrich(T1)
→ [e]design(fresh, ignore inferred design-system)
→ [e]arch(UI layer only)
→ { [e]scope → [e]prepare → [e]implement → [e]validate → [e]ship }*
```

**P10. defect-sprint** — optimize for throughput.
```
[e]codify(lite, if cold) → [m]enrich(T1)
→ { [e]start-feature(bug) → [e]fix-it → [e]ship → [e]distill }*
```

**P11. service-extraction / strangler** — optimize for boundary clarity.
```
[e]codify
→ [e]decode(slice being extracted)
→ [m]plan-migration(T2)
→ [e]arch(target boundary only)
→ { [e]prepare → [e]implement → [e]validate → [e]check-drift → [e]ship }*
```

**P12. refactor-no-behavior-change** — lock behavior, restructure, prove unchanged.
```
[e]decode(lock behavior) → [m]refactor(T2) → [e]validate(behavior unchanged) → [e]ship
```

### Specialized — goal-first, standalone or embedded

**P13. security-hardening**
```
[e]codify
→ [m]harden(T3)
→ { [e]fix-it → [e]review-pr(security lens) → [e]ship }*
→ [m]audit-compliance(T3, if regulated)
```

**P14. api-evolution**
```
[e]decode(current contracts)
→ [m]version-api(T3)
→ { [e]prepare → [e]implement → [e]validate → [e]ship }*
```

**P15. feature-deprecation**
```
[m]deprecate(T2)
→ { [e]implement(removal) → [e]validate → [e]ship → [m]release(T1, ramp-down) }*
```

**P16. hypothesis-driven** (embeddable inside greenfield or brownfield)
```
After any [e]ship for a feature tagged as a hypothesis:
→ [m]experiment(T3) → [m]measure(T1)
```

### Ops / response

**P17. incident-response**
```
[m]incident(T2)
→ [e]fix-it
→ [e]ship(emergency)
→ [m]release(T1, rollforward or rollback)
→ [m]measure(T1)
→ [e]reap(postmortem)
```

**P18. vuln-response**
```
[m]respond-to-vuln(T3)
→ { [e]fix-it → [e]ship(emergency) }*
→ [m]audit-compliance(T3)
```

### Feedback loop (standing, parallel to everything else)

**P19. customer-feedback**
```
[m]triage-feedback(T3) → [e]capture(per theme) → feeds into whichever playbook is active
```

---

## 7. Observations — what to challenge before building anything

Applying Occam's razor and "abstraction later, not sooner":

**Non-negotiable (literal pipeline break):**
- `enrich` must exist. Both brownfield plays reference it as a hard gate.

**Highest transformation leverage:**
- `release` + `measure` + `discover` close the two biggest lifecycle holes (decide-to-build on the left, did-it-work on the right). Without them, Garura is a build framework, not a product framework.

**Probably modes, not plays (premature abstraction risk):**
- `harden` → `review-pr` profile + `fix-it` loop
- `audit-accessibility` → `validate` profile with WCAG judge
- `audit-compliance` → report generator over existing decision manifests + review-pr history
- `refactor` → `enhance` with a no-spec-change invariant flag
- `version-api` → a tag on `scope` + a step in `ship`

**Genuinely new capabilities (not modes):**
- `enrich`, `release`, `measure`, `discover`, `incident`, `deprecate`, `plan-migration`, `migrate-data`, `document`, `refactor`, `experiment`, `triage-feedback`

**Cross-cutting concern not yet explored:**
- Data-plane operations (`migrate-data`) are substantially different from code operations. Worth a separate design pass before treating it as a normal play.

---

## 8. Open questions when this moves to scope

When `/scope` picks this up, the following decisions are pending:

1. **Which form do playbooks take?**
   - (a) Markdown under `docs/usage/playbooks/` — human-readable, not executable
   - (b) YAML catalog under `core/components/memory/knowledge/playbooks/` — structured, referenceable, feeds `/create-play`
   - (c) Compiled meta-plays via `/create-play` — executable orchestrators
2. **Selection mechanism:** how does a user pick a playbook at project start? Is there a `garura /playbook <name>` entry point, or is it a prose recommendation based on project state?
3. **Playbook composition:** can playbooks embed each other (e.g., `incident-response` embedded inside any steady-state playbook)? If yes, how is composition expressed?
4. **Optimization surface:** each playbook commits to an optimization (safety, cycle time, boundary clarity). Do we make that a first-class field (like `quality-profile`) that shapes downstream play behavior?
5. **Missing-play prioritization:** of the 20 gaps, the critical four are `enrich`, `release`, `measure`, `discover`. Do these become their own intent epics, or a single "lifecycle completeness" epic?
6. **Tier-3 mode-vs-play call:** for each Tier-3 gap, the decision is "new play" or "mode of an existing play." This deserves a design pass per candidate.
7. **Retirement of `report-issue`:** already marked deprecated; a playbook release is a natural point to remove it.
8. **Mapping to domain taxonomy:** this catalog is itself a feature candidate. When scoped, it maps to the `framework` domain (meta-framework extension), not a product domain.

---

## 9. What this document is not

- Not a specification. No intent.yaml, no decision manifests.
- Not a commitment to build anything. The 20 missing plays are candidates, not a backlog.
- Not complete. Ops concerns (incident, runbook), compliance, and data-plane operations need their own design passes before being treated as normal plays.
- Not a replacement for `/scope`. This is input material for a future scope session.

---

## 10. Next steps (when ready)

1. Review this draft and prune / add playbooks and gap candidates.
2. Resolve the form question (markdown / YAML / meta-plays).
3. Map the work to a domain and capability in the product LTM.
4. Run `/scope` with this document as the intake material.
5. If approved, split into intent epics (likely one for the playbook catalog itself, one per Tier-1 missing play).
