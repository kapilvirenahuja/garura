# Semantic Map — `define` play (Deep Read / Step R1)

Issue: #370 — Decision Surfacing Discipline (C17 / F11) rebake of `define`.
Source-of-truth files read:

- `core/components/plays/define/SKILL.md` (compiled, 709 lines; intent_hash `sha256:2cf062a2…312`; compiled C1–C16 / F1–F10 / S1–S6 — pre-C17)
- `core/components/plays/define/reference/intent.yaml` (now C1–**C17**, F1–**F11**, S1–S6)
- `core/components/agents/{product-keeper,project-orchestrator,repo-orchestrator}.md`
- `core/components/skills/{manage-issue,manage-features,generate-intent-epics,validate-intent-epics,create-commit,research-domain-context}/SKILL.md`

The compiled SKILL.md is **one rebuild behind intent.yaml**: intent declares C17 + F11, SKILL.md still reads `Intent defines constraints (C1-C16), failure conditions (F1-F10)` and its Compilation Metadata says `constraints_covered: C1–C16`, `failure_conditions_covered: F1–F10`. The rebuild's job is to close that gap by emitting decision-surfacing steps at the two checkpoints.

---

## 1. Workflow Structure

**Structure A — full checkpoint flow.** 11 numbered phases (Phase 0 → Phase 10), two human Tether/Vanish/Orbit gates (Phase 5 placement, Phase 9 epic), plus a post-phase scenario eval sweep and an Evidence & Close block (Standard Play Close, anchors per #371). Not B (fast), not C (chained), not readiness-only. Confirmed by SKILL.md Compilation Metadata line 692 (`workflow_structure | A`).

Two conditional phases: Phase 4 (KB/LTM grounding — only for `new_capability_in_existing_domain` / `new_domain`) and Phase 8 (gap interview — only on `validate-intent-epics` FAIL). Resume is status-file driven (`{stm_base}{issue}/status/define.json`).

---

## 2. Phase / Step Table

Sub-steps are broken out explicitly because the new C17 surfacing steps land **before Step 5a** and **before Step 9a**.

| Phase / Step | Owner | Agent / Mechanism | Skill(s) invoked | STM / LTM outputs | Notes |
|---|---|---|---|---|---|
| Pre-flight | play | (inline bash, config read) | — | — | C15 path resolve; C13 platform=github gate; C1 arg/FEAT-ID guard; resume check |
| Phase 0 — Resolve/Create Issue | project-orchestrator | agent | `manage-issue` (read \| resolve_or_create) | `…/evidence/define/issue-resolution.yaml` | SE-1 (F1). Anchors all STM at `{stm_base}{issue}/` |
| Phase 1 — Intake Interview | play | play + repo-orchestrator (commit) | `create-commit` (via repo-orch) | `brief.md`, `grounding-questions.md` at `{product_base}{product.user-provided}{issue}/`; `intake-commit.yaml` | SE-2 (F2), SE-10 (C3). Agentic depth (C2) |
| Phase 2 — Catalog Match | product-keeper | agent | (agent reasoning; no listed skill) | `catalog-match.yaml`, **`decision-manifest-catalog-match.yaml`** | SE-3 (F3/C4), SE-9 (F9). **Manifest #1 produced here** |
| Phase 3 — Constraint Fit | product-keeper | agent | (agent reasoning) | `constraint-fit.yaml` | SE-4 (F4), SE-11 (C5). ISO 25010 regression surfaced here |
| Phase 4 — KB/LTM Grounding (cond.) | product-keeper | agent | `research-domain-context` (if thin) | `grounding.yaml`, `…/research/*` | SE-7 (F7). Runs only for new_capability/new_domain (C6) |
| **Phase 5 — Placement Checkpoint** | play | play (+ project-orchestrator on Vanish) | `manage-issue` (close, on Vanish) | — | **Two human gate #1.** See sub-steps below |
| → *(NEW C17 surfacing step)* | play | play | — | rewrites `user_response` into `decision-manifest-catalog-match.yaml` | **DOES NOT EXIST in compiled SKILL.md.** Must be emitted **before Step 5a** |
| → Step 5a — Write checkpoint file | play | play | — (template fill) | `{stm_base}{issue}/checkpoint/define/{ts}.md` | Loads `standards/templates/checkpoint.md` (C16) |
| → Step 5b — Render approval prompt | play | play | — (template fill) | prompt to user (Tether/Orbit/Vanish) | Loads `standards/templates/approval-prompt.md` (C16). SE-8 (F8), SE-12 (F10) |
| Phase 6 — Update Product Spec | product-keeper | agent | `manage-features` | `features.yaml`, `enriched-capabilities.yaml`, `domain-selection.yaml`, **`decision-manifest-manage-features.yaml`** | SE-5 (F5/C9). **Manifest #2 produced here.** No mode flag (C8) |
| Phase 7 — Epic Locate/Generate | product-keeper | agent | `generate-intent-epics` + `validate-intent-epics` | `epics/*.yaml`, `validation-intent-epics.yaml`, **`decision-manifest-generate-intent-epics.yaml`** | SE-6 (F6/C10). **Manifest #3 produced here.** target_capability_id filter |
| Phase 8 — Gap Interview (cond.) | play | play (+ product-keeper re-validate) | `generate-intent-epics` + `validate-intent-epics` (re-run) | additional context → re-validation | Single loop only; F6 halt on 2nd FAIL |
| **Phase 9 — Epic Checkpoint** | play | play | — | — | **Two human gate #2.** See sub-steps below |
| → *(NEW C17 surfacing step)* | play | play | — | rewrites `user_response` into all 3 manifests | **DOES NOT EXIST in compiled SKILL.md.** Must be emitted **before Step 9a** |
| → Step 9a — Write checkpoint file | play | play | — (template fill) | `{stm_base}{issue}/checkpoint/define/{ts}.md` | Loads `standards/templates/checkpoint.md` (C16) |
| → Step 9b — Render approval prompt | play | play | — (template fill) | prompt to user (Tether/Orbit/Vanish) | Loads `standards/templates/approval-prompt.md` (C16). Vanish leaves issue OPEN (C11) |
| Phase 10 — Evidence Commit | repo-orchestrator | agent | `create-commit` | `commit.yaml` | Non-blocking (ADR 012) |
| Scenario eval sweep (T12) | play | play | — | — | SCE-1..SCE-6 |
| Close — Step 13a evidence file | play | play | — (template fill) | `{stm_base}{issue}/evidence/define/{ts}.md` | C1 of Standard Play Close; loads `evidence-file.md` |
| Close — Step 13b delivery report | play | play | — (template fill) | delivery report to user | C2 of Standard Play Close; loads `delivery-report.md`; status→completed |

---

## 3. Agent Boundary Table

| Agent | Domain | Role | Phases in `define` | Skills it declares (full inventory) |
|---|---|---|---|---|
| `project-orchestrator` | Project management (issues/tracking) | orchestrator (domain agent) | Phase 0; Phase 5 on Vanish | `manage-issue`, `resolve-issues` |
| `product-keeper` | Product-capability config + intent-epic generation + quality-profile derivation | keeper (domain agent) | Phases 2, 3, 4, 6, 7; Phase 8 re-validate | `configure-capabilities`, `enrich-capabilities`, `manage-features`, `generate-intent-epics`, `validate-intent-epics`, `derive-quality-profile-from-epics`, plus 8 `infer-*-from-code` (/codify only). **Note:** `research-domain-context` is invoked by product-keeper in Phase 4 per SKILL.md but is NOT in product-keeper's declared skill table — minor declared/used drift, pre-existing, out of scope for #370. |
| `repo-orchestrator` | Repository (commits/branches/PRs) | orchestrator (utility — exempt from domain-agent budget) | Phase 1 (intake commit), Phase 10 (evidence commit) | `analyze-changes`, `create-commit`, `analyze-pr`, `submit-pr`, `setup-branch`, `merge-pr` |

Domain-agent count: 2 (`project-orchestrator`, `product-keeper`). Utility: 1 (`repo-orchestrator`). Matches SKILL.md metadata.

Play-owned phases (no agent — user-facing interview / checkpoint surface): Phase 1, Phase 5, Phase 8, Phase 9, plus the close. **The new C17 surfacing steps are play-owned** (the orchestrator loads manifests, batches by tier, captures the typed response, writes it back) — they sit inside the play-owned Phase 5 and Phase 9 surfaces, not delegated to an agent.

---

## 4. Skill Contract Summary Table

| Skill | Invoked in | Key inputs (incl. required LTM inputs) | Outputs | Decision manifest? |
|---|---|---|---|---|
| `manage-issue` | Phase 0; Phase 5 Vanish | `action`, `issue_number`/`description`, `platform`. **LTM:** loads `~/.garura/core/memory/standards/templates/github-issue.md` internally on `create` — no extra /define wiring (intent.yaml C16 template_map line 217) | issue object (number, state, url, labels) | No |
| `manage-features` | Phase 6 | `enriched_capabilities_path` (req), `project_profile_path` (req), `stm_output_base` (req), **`ltm_rules_feature_catalog_path` (req LTM — `standards/rules/feature-catalog.md`)** | `features.yaml`, `features_count`, `decision_manifest_path`, `decisions_recorded` | **Yes — `decision-manifest-manage-features.yaml`** (inferred status entries, tier high/mid, `user_response: null`) |
| `generate-intent-epics` | Phase 7 | `enriched_capabilities_path` (req), `project_profile_path` (req), `market_brief_path` (req), `epics_output_dir` (req), `decision_manifest_path` (req). **LTM:** `ltm_intent_epic_schema_path` (`standards/schemas/intent-epic.yaml`), `ltm_rules_epics_path`, `ltm_rules_features_path`, `ltm_rules_scenarios_path` — all required | `epics/*.yaml` (1 per capability), quantification coverage, `decision_manifest.path`, `decisions_recorded` | **Yes — `decision-manifest-generate-intent-epics.yaml`** (D-gie-001..006, tier per grounding, `user_response: null`, `user_response_detail: null`) |
| `validate-intent-epics` | Phase 7 (+ Phase 8 re-run) | `epics_dir` (req), `output_path` (req), `stm_research_dir` (opt). **LTM:** `ltm_intent_epic_schema_path`, `ltm_rules_epics_path`, `ltm_rules_features_path`, `ltm_rules_scenarios_path`, `ltm_domain_taxonomy_path` — all required | `validation-intent-epics.yaml` (status passed/failed, per-epic violations) | No |
| `create-commit` | Phase 1 (intake), Phase 10 (evidence) | `files` (list), `type`, `scope`, `subject`, `body`, `issue`. **No LTM input.** | commit hash + validation | No |
| `research-domain-context` | Phase 4 (if LTM thin) | `domain` (req), `knowledge_gaps` (req), `problem_statement` (req), `output_base` (req). **No LTM input** (it researches because LTM is thin) | `domain-context.md` + coverage/sources metadata | No |

Three skills emit decision manifests consumed by C17: `manage-features` (Phase 6), `generate-intent-epics` (Phase 7), and the Phase-2 catalog-match manifest (produced by product-keeper's agent reasoning, declared as a JSON-contract output of Phase 2 — `decision-manifest-catalog-match.yaml`). Each manifest entry already carries a `user_response` / `user_response_detail` slot (confirmed in `generate-intent-epics` SKILL.md lines 161–162 and `manage-features` decision schema) — C17 fills these slots; nothing new is needed in the skills, only the play.

---

## 5. Constraint Coverage Table (C1–C17)

| Constraint | Currently covered by |
|---|---|
| C1 | Pre-flight (arg/FEAT-ID/existing-issue guards) + SE-1 (full coverage). Structural in Phase 0. |
| C2 | Structural — Phase 1 agentic interview prose (no fixed Q count) |
| C3 | Artifact-verifiable — SE-10. Fixed file names at user-provided path + self-commit |
| C4 | Artifact-verifiable — SE-3. Five-bucket classification from 3 sources |
| C5 | Artifact-verifiable — SE-11. constraint-fit entries enumerated |
| C6 | Structural — Phase 4 conditional gate prose |
| C7 | Structural — Phase 5 one-way-door + SE-8 (Vanish→close) |
| C8 | Structural — Phase 6 "no mode flag" prose |
| C9 | Artifact-verifiable — SE-5. `issue` field on feature row |
| C10 | Artifact-verifiable — SE-6. target_capability_id scope + validation gate |
| C11 | Structural — Phase 9 always-present + Vanish-leaves-open prose |
| C12 | Structural — SE-7 (STM vs LTM separation) |
| C13 | Pre-flight (platform gate) + structural (agent-first prose, Role section) |
| C14 | Structural — auto-create missing LTM prose across Phases 2/6/7 + SCE-6 |
| C15 | Pre-flight (config path resolution) |
| C16 | Structural + SE-12 (partial, template-path grep) — all user-facing surfaces template-loaded |
| **C17** | **NOT YET COVERED.** No pre-checkpoint decision-surfacing step exists in the compiled SKILL.md. The rebuild must emit a new play-owned step at Phase 5 (**before Step 5a**, also therefore before Step 5b) and at Phase 9 (**before Step 9a**, therefore before 9b) that: (1) loads every decision manifest produced so far; (2) collects entries with `surfaced_for_review: true` and unpopulated `user_response`; (3) batches by confidence tier (HIGH = batch-confirm, MID = batch-with-questions, LOW = one-by-one); (4) writes `user_response`/`user_response_detail` back into the originating manifest before the gate proceeds. Needs a new step-eval (SE-13) asserting C17 mechanics. |

---

## 6. Failure-Condition Coverage (F1–F11)

| FC | Covered by step-eval |
|---|---|
| F1 | SE-1 (Phase 0) |
| F2 | SE-2 (Phase 1) |
| F3 | SE-3 (Phase 2) |
| F4 | SE-4 (Phase 3 / Phase 5 resolution) |
| F5 | SE-5 (Phase 6) |
| F6 | SE-6 (Phase 7 / Phase 8 loop) |
| F7 | SE-7 (Phase 4 / STM-LTM separation) |
| F8 | SE-8 (Phase 5 Vanish) |
| F9 | SE-9 (Phase 2 LTM schema read) |
| F10 | SE-12 (Phase 5 + re-eval Phase 9/10) — partial coverage eval |
| **F11** | **NOT YET COVERED.** No eval asserts that a `surfaced_for_review: true` entry cannot be carried past Phase 5 or Phase 9 with `user_response` unpopulated. The rebuild must add a step-eval (e.g. SE-13) bound to F11 that fails when any of the three manifests (`decision-manifest-catalog-match.yaml`, `decision-manifest-manage-features.yaml`, `decision-manifest-generate-intent-epics.yaml`) carries a surfaced entry past its applicable checkpoint with `user_response == null`. |

---

## 7. Scenario Coverage (S1–S6)

| Scenario | Covered by scenario-eval |
|---|---|
| S1 — raw idea, no FEAT-ID | SCE-1 |
| S2 — existing planned feature (WI-F001), no issue yet | SCE-2 |
| S3 — evolving feature with linked issue (AM-F014) | SCE-3 |
| S4 — needs a new capability | SCE-4 |
| S5 — regresses a quality target (Vanish path) | SCE-5 |
| S6 — greenfield, no features.yaml | SCE-6 |

All 6 scenarios covered 1:1. intent.yaml adds no new scenario for #370 (C17/F11 are constraint/failure additions only) — so the scenario eval set is unchanged by this rebuild unless a new S is later added. SCE coverage stays SCE-1..SCE-6.

---

## 8. Decision Surfacing Gap (the #370 deliverable)

**Empirical claim, grounded in the read.** The compiled `SKILL.md` (709 lines) contains **no step that loads a decision manifest, filters on `surfaced_for_review`, batches by confidence tier, or writes `user_response` back**. A scan of Phase 5 (lines ~292–367) and Phase 9 (lines ~472–523) shows: Phase 5 goes straight to **Step 5a** (write checkpoint file from `checkpoint.md`) then **Step 5b** (render approval prompt from `approval-prompt.md`) then parse Tether/Orbit/Vanish; Phase 9 goes straight to **Step 9a** then **Step 9b** then parse. The manifests are *produced* (Phase 2 emits `decision-manifest-catalog-match.yaml`; Phase 6 emits `decision-manifest-manage-features.yaml`; Phase 7 emits `decision-manifest-generate-intent-epics.yaml`) but they are written and then never read by the play — they are silently carried forward. That is exactly the F11 condition.

**What C17 requires at each gate (per intent.yaml lines 251–280).** Before the orchestrator writes the checkpoint file AND before it presents the Tether/Orbit/Vanish prompt — i.e. the new step precedes **both** Step 5a/9a and Step 5b/9b — the orchestrator must: load every manifest produced up to that gate; collect entries with `surfaced_for_review: true` and an unpopulated `user_response`; surface them batched by tier (HIGH = single batch-confirm with Orbit-any-one drilldown; MID = batch with explicit per-decision questions/recommendations; LOW = always one-by-one, never batched); then write the user's response (`user_response: accept | override | orbit` + `user_response_detail`) back into the originating manifest entry before the gate proceeds. Echo-of-user-input decisions are exempt. High confidence means batch, never skip.

**Exact placement and manifests available at each gate:**

- **Phase 5 — new surfacing step lands immediately before Step 5a** (and therefore before Step 5b and before the Tether/Orbit/Vanish parse). Manifest available at this point: **exactly one** —
  `{stm_base}{issue}/evidence/define/decision-manifest-catalog-match.yaml` (produced in Phase 2).
  Phases 3 and 4 produce no decision manifest, so Phase 5 has a single manifest to load. Per intent.yaml lines 269–270.

- **Phase 9 — new surfacing step lands immediately before Step 9a** (and therefore before Step 9b and before the Tether/Orbit/Vanish parse). Manifests available at this point: **all three** —
  `{stm_base}{issue}/evidence/define/decision-manifest-catalog-match.yaml` (Phase 2),
  `{stm_base}{issue}/evidence/define/decision-manifest-manage-features.yaml` (Phase 6),
  `{stm_base}{issue}/evidence/define/decision-manifest-generate-intent-epics.yaml` (Phase 7).
  Per intent.yaml lines 271–274. Phase 9's surfacing step re-surfaces only entries still unresolved (the Phase-2 manifest's entries may already carry `user_response` from the Phase-5 step; only newly-surfaced or still-null entries are presented again).

**Ordering invariant for the rebuild.** One new step at each gate. The sequence becomes: *(load manifests → collect surfaced+unanswered → batch by tier → capture typed response → write user_response back)* → **Step 5a/9a** (checkpoint file from `checkpoint.md`) → **Step 5b/9b** (approval prompt from `approval-prompt.md`) → parse Tether/Orbit/Vanish. The new step is play-owned (no agent delegation — it is orchestrator manifest I/O + user interaction inside the play-owned checkpoint surface). It must not use `AskUserQuestion` (house rule); typed response only, consistent with the existing approval-prompt pattern. The rebuild must also add SE-13 (bound to C17/F11) and update Compilation Metadata (`constraints_covered: C1–C17`, `failure_conditions_covered: F1–F11`, `step_evals: 13`, intent_hash recomputed), and the SKILL.md "Compiled From" line currently saying `C1-C16 … F1-F10 … S1-S6`.

**Manifest entry slots already exist.** No skill change is needed: `generate-intent-epics` writes `user_response: null` / `user_response_detail: null` per entry (SKILL.md lines 161–162); `manage-features` decision schema carries the same slots; the Phase-2 catalog-match manifest is produced by product-keeper and follows the same DSD manifest shape. C17 is purely a play-orchestration gap — the data plumbing is in place.
