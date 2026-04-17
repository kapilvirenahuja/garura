# Coverage Matrix — specify-product rebake (D6/D7/D8/D9)

**Intent hash:** `sha256:a2c724a1eff3c7d7b85328c41dd71d003dae954b667ebbcad2dd838818b632e5`
**SKILL.md path:** `core/components/plays/specify-product/SKILL.md`
**Evals source:** `.meridian/project/issues/214/evidence/create-play/specify-product/evals.yaml`
**Matrix verdict:** PASS — every C1-C17, F1-F13, and S1-S8 is covered by at least one mechanism.

## 1. Constraints (C1-C17)

| ID | Category | Covered by | Location in SKILL.md |
|----|----------|------------|----------------------|
| C1 | pre-flight | Pre-flight row + bash `word_count` | Pre-flight table row 2 |
| C2 | pre-flight | Pre-flight row + interactive collection loop | Pre-flight table row 3 |
| C3 | pre-flight | Pre-flight row — `validate-kb-extension` invocation | Pre-flight table row 4 |
| C4 | artifact-verifiable | **SE-14** | Step 6 Evals |
| C5 | artifact-verifiable | **SE-15** | Step 6 Evals |
| C6 | artifact-verifiable | **SE-16** | Step 10 Evals |
| C7 | artifact-verifiable | **SE-17** | Step 10 Evals |
| C8 | artifact-verifiable | **SE-18** | Step 10 Evals |
| C9 | artifact-verifiable | **SE-19** | Step 13 Evals |
| C10 | structural | Pre-flight row + Role section ("All writes scope to .meridian/product/ per ADR 017 whitelist") + **SE-11** | Pre-flight table row 5, Role section, Step 6 Evals |
| C11 | structural | Pre-flight row + Role + Agent Boundaries table + **SE-11** | Pre-flight table row 5, Agent Boundaries table, Step 6 Evals |
| C12 | artifact-verifiable (structural-ish) | **SE-9** — checkpoint-artifact existence check — plus 4 explicit checkpoint phases | Step 6 Evals + workflow phase headings |
| C13 | structural | 3-layer hierarchy — Domain → Capability → Intent Epic — enforced by `configure-capabilities` + `generate-intent-epics` rule sources (no Theme/Feature/Story layer anywhere in workflow) | Workflow phases (no intermediate layers), Compilation Metadata rule_sources |
| C14 | artifact-verifiable | **SE-20** | Step 10 Evals |
| **C15** | **pre-flight (NEW)** | **Pre-flight row 6 + Stage 2.75 play-owned verify step (Step 5)** | **Pre-flight table row 6, Phase "Preparation — MVP Recommendation"** |
| **C16** | **artifact-verifiable (NEW)** | **SE-21** | **Step 6 Evals** |
| **C17** | **structural (NEW)** | **Stage 2 Step 3 pull-to-product copy pass + Step 6 `product_domain_library_path` input + demoted `ltm_domain_taxonomy_path` comment** | **Step 3 step text (Pull-to-product copy), Step 6 JSON contract `stm.input`** |

**Constraint coverage verdict:** PASS. All 17 constraints mapped. No gaps.

## 2. Failure conditions (F1-F13)

| ID | Condition subject | Covered by | Location |
|----|-------------------|------------|----------|
| F1 | zero intent epics | **SE-1** | Step 9 Evals |
| F2 | empty/null mandatory fields | **SE-2**, **SE-16** | Step 10 Evals |
| F3 | unquantified constraint values | **SE-3**, **SE-17** | Step 10 Evals |
| F4 | <2 success/failure scenarios | **SE-4** | Step 10 Evals |
| F5 | dangling kb_source.capability | **SE-5**, **SE-18** | Step 10 Evals |
| F6 | scope has non-real capability | **SE-6** | Step 3 Evals — the target artifact is scope.yaml from Step 6; placement chosen because domain content becomes the authoritative read surface at Step 3 |
| F7 | missing constraint_trace entries | **SE-7**, **SE-15** | Step 6 Evals |
| F8 | missing/empty quality profile | **SE-8**, **SE-19** | Step 13 Evals |
| F9 | missing checkpoint artifact | **SE-9** | Step 6 Evals |
| F10 | epic locked despite unresolved blockers | **SE-10**, **SE-20** | Step 10 Evals |
| F11 | write outside ADR 017 whitelist | **SE-11** | Step 6 Evals |
| F12 | monolithic scope needing phasing | **SE-12** | Step 9 Evals |
| **F13** | **deny-list token in product artifact** | **SE-13**, **SE-21** | **Step 6 Evals** |

**Failure-condition coverage verdict:** PASS. All 13 failure conditions mapped to at least one step eval.

## 3. Scenarios (S1-S8)

| ID | Persona | Covered by | Location |
|----|---------|------------|----------|
| S1 | Product Manager (acceptance criteria from epics) | **SCE-1** | Scenario Validation section |
| S2 | Technical Architect (quality profile drivers) | **SCE-2** | Scenario Validation section |
| S3 | Product Owner (trace capability to KB feature) | **SCE-3** | Scenario Validation section |
| S4 | Product Manager (unhappy paths enumerated) | **SCE-4** | Scenario Validation section |
| S5 | Engineering Lead (feasibility within appetite) | **SCE-5** | Scenario Validation section |
| S6 | Compliance Officer (regulated-industry constraint trace) | **SCE-6** | Scenario Validation section |
| S7 | Non-technical Stakeholder (human-readable checkpoint) | **SCE-7** | Scenario Validation section |
| S8 | Product Manager (mid-run Orbit cycles back to Step 6, not Step 1) | **SCE-8** | Scenario Validation section |

**Scenario coverage verdict:** PASS. All 8 scenarios mapped to exactly one scenario eval.

## 4. Structural checks

- **Workflow Structure A preserved:** full checkpoint flow with 4 human review gates (market, domain, capability, epic). MVP recommendation is a play-owned verify step, NOT a new human checkpoint — checkpoint count remains 4 per C12.
- **Agent budget:** 3 domain agents (market-analyst, product-keeper, judge), within ≤5 limit. 2 utility agents (scriber, repo-orchestrator), exempt from the budget per the utility-agents rule.
- **Required sections present in SKILL.md:**
  - Frontmatter: yes
  - Header: yes
  - Compiled From: yes (rebake notice)
  - Role + Agent Boundaries: yes
  - Pre-flight: yes (6 rows incl C15)
  - Workflow: yes (14 steps, 13 phases)
  - Scenario Validation: yes (SCE-1..SCE-8)
  - Evidence & Close: yes
  - Pause and Resume: yes (includes stage-2-75-mvp-recommendation)
  - Compilation Metadata: yes (new intent_hash, new constraint lists, new eval counts)
- **JSON contract schema (ADR 016):** every dispatch carries `intent_path`, `stm_base`, `product_base`, `stm.input`, `stm.output`, `task_id`.
- **Three-layer hierarchy (C13):** no Theme/Feature/Story layer anywhere. Workflow goes Domain → Capability → Intent Epic.

## 5. New-coverage delta (this rebake)

The rebake adds coverage for 4 intent items:

| Intent item | New coverage mechanism | Rule reference |
|-------------|------------------------|----------------|
| C15 (MVP recommendation) | Pre-flight row + new Stage 2.75 verify step (Step 5) | rules/product.md Rule 13 / Defect 6 |
| C16 (abstraction-layer boundary) | SE-21 (constraint eval) | rules/product.md Rule 14 / Defect 7 |
| C17 (pull-to-product) | Stage 2 Step 3 copy pass + Step 6 `product_domain_library_path` JSON input + demoted `ltm_domain_taxonomy_path` comment | rules/product.md Rule 15 / Defect 8 |
| F13 (deny-list token) | SE-13 (failure-condition eval) + SE-21 (constraint eval, overlap via source_type: both) | rules/product.md Rule 14 / Defect 7 |

## 6. Gaps

**None.** All intent items covered.

## 7. Final verdict

**PASS — no compilation gaps.** Every constraint is in its category-appropriate mechanism, every failure condition has at least one step eval, every scenario has exactly one scenario eval, every required section of the compiled-example structure is present in the rebaked SKILL.md, and the new intent_hash matches the current `intent.yaml` byte-for-byte.
