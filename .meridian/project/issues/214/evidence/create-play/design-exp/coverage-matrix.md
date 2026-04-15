# Coverage Matrix — design-exp (Visual-First Rebake — C16 + F15)

**Intent hash:** `sha256:1c49d46736c0f9c7d4320b11603a75fb1ee4e115d3ce6eb5d2de5111745bebe2`
**Compiled by:** `/create-play --rebake design-exp`
**Compiled at:** 2026-04-15
**Rebake trigger:** Visual-first screen file shape — C16 (required body section order with `## Wireframe` first and `## Layout Spec` last, including ASCII box-drawing per state) + F15 (any violation of that order is a structural failure). Supersedes the prior D15/D16 (Pull-to-Product / MVP Focus) rebake, preserving all prior work intact.

## Constraints (C1-C16)

| ID | Type | Category | Covered By | Location |
|---|---|---|---|---|
| C1 | constraint | pre-flight | Pre-flight table row + bash block (for-loop over scope/specification subfolders) | Pre-flight section |
| C2 | constraint | pre-flight | Pre-flight table row + bash invocation of `validate-kb-extension` skill | Pre-flight section |
| C3 | constraint | artifact-verifiable | SE-21 (synthesize-personas) | Step 1 Evals |
| C4 | constraint | artifact-verifiable | SE-22 (synthesize-personas) | Step 1 Evals |
| C5 | constraint | artifact-verifiable | SE-23 (generate-screen-inventory via validate-screen-coverage) | Steps 3 + 4 Evals |
| C6 | constraint | artifact-verifiable | SE-24 (generate-screen-inventory via validate-screen-coverage) | Steps 3 + 4 Evals |
| C7 | constraint | artifact-verifiable | SE-25 (map-user-flows via validate-screen-coverage post-flow) | Steps 6 + 7 Evals |
| C8 | constraint | artifact-verifiable | SE-26 (generate-wireframes) | Step 8 Evals |
| C9 | constraint | artifact-verifiable | SE-27 (generate-wireframes) | Step 8 Evals |
| C10 | constraint | pre-flight + structural | Pre-flight row (writability check) + agent boundary table (scriber owns writes) | Pre-flight section + Role section |
| C11 | constraint | pre-flight + structural | Pre-flight row (scriber reachability) + agent boundary table (designer owns domain work) | Pre-flight section + Role section |
| C12 | constraint | artifact-verifiable | SE-28 (compile-design-spec) + three Checkpoint phases in workflow | Step 9 Evals + Checkpoint 1/2/3 phases |
| C13 | constraint | structural | Play-level low-fidelity discipline — Role section Forbidden list (no visual design) + F12/SE-14 eval guard | Role section + Step 9 Evals |
| C14 | constraint | structural | Role section Forbidden list (Pull-to-Product rule) + every JSON contract uses `product_research_path` + path audit guarantees `ltm_domain_taxonomy_path` absent from contract blocks + SE-15 eval | Role section + Steps 1/3/4/7/8 JSON contracts + path audit report + Step 9 Evals |
| C15 | constraint | pre-flight | Pre-flight table row + bash `test -s mvp-recommendation.md` + Stage 1 narrative narrowing + Stage 3 narrative narrowing + Stage 6 narrative narrowing + SE-16 + SE-17 + SE-18 | Pre-flight section + Steps 1/3/6 text + Step 1 Evals + Steps 3+4 Evals + Steps 6+7 Evals |
| **C16** | **constraint** | **artifact-verifiable** | **SE-29 (generate-screen-inventory — placeholder skeleton shape) + SE-30 (generate-wireframes — complete visual-first shape with all 7 sections in order, ASCII rules, no visual-design tokens) + Role section Forbidden list (visual-first ordering mandate) + Stage 3 narrative (placeholder emission) + Stage 8 narrative (two-block rewrite)** | **Role section + Stage 3 text + Steps 3+4 Evals + Stage 8 text + Step 8 Evals** |

**Verdict: 16/16 covered. PASS.**

## Failure Conditions (F1-F15)

| ID | Covered By | Location |
|---|---|---|
| F1 | SE-1 (synthesize-personas), SE-2 (generate-screen-inventory), SE-3 (map-user-flows) | Step 1 Evals, Steps 3+4 Evals, Steps 6+7 Evals |
| F2 | SE-4 (synthesize-personas) | Step 1 Evals |
| F3 | SE-5 (synthesize-personas) | Step 1 Evals |
| F4 | SE-6 (validate-screen-coverage pre-flow) | Steps 3 + 4 Evals |
| F5 | SE-7 (validate-screen-coverage pre-flow) | Steps 3 + 4 Evals |
| F6 | SE-8 (validate-screen-coverage post-flow) | Steps 6 + 7 Evals |
| F7 | SE-9 (validate-screen-coverage post-flow) | Steps 6 + 7 Evals |
| F8 | SE-10 (generate-wireframes) | Step 8 Evals |
| F9 | SE-11 (generate-wireframes) | Step 8 Evals |
| F10 | SE-12 (compile-design-spec) | Step 9 Evals |
| F11 | SE-13 (compile-design-spec) | Step 9 Evals |
| F12 | SE-14 (compile-design-spec) | Step 9 Evals |
| F13 | SE-15 (compile-design-spec + structural path audit) | Step 9 Evals + path audit report |
| F14 | SE-16 (synthesize-personas), SE-17 (generate-screen-inventory), SE-18 (map-user-flows) | Step 1 Evals, Steps 3+4 Evals, Steps 6+7 Evals |
| **F15** | **SE-19 (generate-screen-inventory — placeholder skeleton shape check) + SE-20 (generate-wireframes — complete visual-first shape check with ASCII rules + visual-design token guard)** | **Steps 3 + 4 Evals + Step 8 Evals** |

**Verdict: 15/15 covered. PASS.**

## Scenarios (S1-S7)

| ID | Persona | Covered By | Location |
|---|---|---|---|
| S1 | Developer | SCE-1 (updated — references both `## Wireframe` visual-first and `## Layout Spec` machine-spec) | Scenario Validation |
| S2 | Designer (external, receiving the spec) | SCE-2 | Scenario Validation |
| S3 | Product Manager | SCE-3 | Scenario Validation |
| S4 | Technical Architect | SCE-4 | Scenario Validation |
| S5 | Accessibility Lead | SCE-5 | Scenario Validation |
| S6 | Developer | SCE-6 | Scenario Validation |
| S7 | Product Manager (at final review) | SCE-7 | Scenario Validation |

**Verdict: 7/7 covered. PASS.**

## Pre-flight / Structural / Artifact-Verifiable split

| Category | IDs | Enforcement Mechanism |
|---|---|---|
| Pre-flight | C1, C2, C10, C11, C15 | Pre-flight table rows + bash block before any domain work |
| Structural | C10, C11, C13, C14 | Role section (agent boundary table, Forbidden list) + compilation rules (play never emits `ltm_domain_taxonomy_path`) + low-fidelity discipline |
| Artifact-verifiable | C3, C4, C5, C6, C7, C8, C9, C12, **C16** | SE-21 through SE-30 (one or more SE per constraint, generated by evals-creator) |

**Note on C16 classification:** C16 is artifact-verifiable (NOT pre-flight) because it is a property of the produced screen MD files. The shape is not complete until AFTER Stage 3 (placeholder emission) and Stage 8 (two-block rewrite) have run. Pre-flight checks environmental preconditions; C16 checks an OUTPUT shape. It is enforced (a) at write-time by the skills that produce the files and (b) at read-time by the embedded SE evals (SE-29, SE-30 for C16; SE-19, SE-20 for F15) that run post-hoc against the produced files. Adding C16 to the pre-flight table would be incorrect — at pre-flight time, the screen files do not yet exist.

## Pipeline outputs

| Step | Owner | Skill | Output artifact | Step evals |
|---|---|---|---|---|
| 1 | designer | synthesize-personas | `{product_base}experience/personas.md` | SE-1, SE-4, SE-5, SE-16, SE-21, SE-22 |
| 2 | play | (human gate) | `{product_base}_checkpoints/design-exp/stage-1-personas-*.md` | — |
| 3 | designer | generate-screen-inventory | `{product_base}experience/screens/*.md` (visual-first skeleton with `## Wireframe` placeholder) | (combined with Step 4) |
| 4 | designer | validate-screen-coverage (pre-flow, strict) | `{product_base}experience/validation-screens-pre-flow.yaml` | SE-2, SE-6, SE-7, SE-17, SE-19, SE-23, SE-24, SE-29 |
| 5 | play | (human gate) | `{product_base}_checkpoints/design-exp/stage-2-screens-*.md` | — |
| 6 | designer | map-user-flows | `{product_base}experience/flows/*.md` | (combined with Step 7) |
| 7 | designer | validate-screen-coverage (post-flow, strict) | `{product_base}experience/validation-screens-with-flows.yaml` | SE-3, SE-8, SE-9, SE-18, SE-25 |
| 8 | designer | generate-wireframes | (two-block rewrite of each screen MD — replace `## Wireframe` placeholder at top + append `## Layout Spec` at bottom) | SE-10, SE-11, SE-20, SE-26, SE-27, SE-30 |
| 9 | designer | compile-design-spec | `{product_base}experience/design-spec.md` | SE-12, SE-13, SE-14, SE-15, SE-28 |
| 10 | play | (human gate) | `{product_base}_checkpoints/design-exp/stage-6-final-spec-*.md` | — |
| 11 | play | (scriber + repo-orchestrator) | `{product_base}_evidence/design-exp/*.md` + self-commit | — |

## Step eval distribution per skill (as declared in evals.yaml)

| Skill | Step evals with skill attribution |
|---|---|
| synthesize-personas | SE-1, SE-4, SE-5, SE-16, SE-21, SE-22 (6 evals) |
| generate-screen-inventory | SE-17, SE-19, SE-23, SE-24, SE-29 (5 evals — added SE-19 for F15 placeholder shape, SE-29 for C16 placeholder section order) |
| validate-screen-coverage | SE-2, SE-6, SE-7, SE-8, SE-9 (5 evals — presence + coverage rules run through the validator) |
| map-user-flows | SE-3, SE-18, SE-25 (3 evals) |
| generate-wireframes | SE-10, SE-11, SE-20, SE-26, SE-27, SE-30 (6 evals — added SE-20 for F15 full visual-first shape, SE-30 for C16 complete shape + ASCII rules + visual-design token guard) |
| compile-design-spec | SE-12, SE-13, SE-14, SE-15, SE-28 (5 evals) |

**Total step evals:** 30. **Total scenario evals:** 7.

## Delta from the prior (D15/D16) bake

| Change | Prior bake | This bake |
|---|---|---|
| intent_hash | `sha256:dd91c5c3d44435c554947fc7956f5f68618827fb645c9a340145adf18c3228d7` | `sha256:1c49d46736c0f9c7d4320b11603a75fb1ee4e115d3ce6eb5d2de5111745bebe2` |
| Constraints | C1-C15 | C1-C16 (+C16 visual-first) |
| Failure conditions | F1-F14 | F1-F15 (+F15 visual-first violation) |
| artifact_verifiable_constraints | C3, C4, C5, C6, C7, C8, C9, C12 | C3, C4, C5, C6, C7, C8, C9, C12, **C16** |
| Step evals | 26 | 30 (+SE-19, +SE-20 for F15; +SE-29, +SE-30 for C16) |
| Scenario evals | 7 | 7 (SCE-1 language refined to reference both Wireframe + Layout Spec) |
| Stage 3 narrative | screen frontmatter list shape only | + visual-first skeleton with `## Wireframe` placeholder as FIRST body section |
| Stage 8 narrative | "appends a `## Wireframe` section" | TWO-BLOCK REWRITE — replace `## Wireframe` placeholder at top + append `## Layout Spec` at bottom |
| JSON contracts | D15/D16 (product_research_path, mvp_recommendation_path, mode strict) | unchanged — preserved verbatim |
| Pre-flight table | C1, C2, C10, C11, C15 | C1, C2, C10, C11, C15 (unchanged — C16 is OUTPUT-shape, not precondition) |
| Workflow structure | A (10 steps, 3 checkpoints) | A (10 steps, 3 checkpoints) — unchanged |
| Agent boundary table | designer + judge + scriber + repo-orchestrator | unchanged |

## Overall verdict

- Constraints: **16/16 PASS**
- Failure conditions: **15/15 PASS**
- Scenarios: **7/7 PASS**
- Pre-flight split: all 5 pre-flight constraints (C1, C2, C10, C11, C15) have a bash check + pre-flight table row
- Structural split: all 4 structural constraints (C10, C11, C13, C14) have a visible enforcement mechanism in the Role section or contract blocks
- Artifact-verifiable split: all 9 artifact-verifiable constraints (C3-C9, C12, C16) have at least one dedicated SE

**COVERAGE VERDICT: PASS. Every intent item has at least one covering mechanism.**

## Path audit report

| Rule | Expected | Actual | Status |
|---|---|---|---|
| `ltm_domain_taxonomy_path` in JSON contract blocks | 0 | 0 | PASS |
| `ltm_domain_taxonomy_path` in narrative text | allowed | 2 (Role Forbidden at L22 + SE-15 eval at L392) | PASS (all narrative) |
| `product_research_path` in JSON contracts | >= 5 | 5 (Stages 1, 3, 4, 7, 8 — lines 90, 163, 192, 291, 337) | PASS |
| `mvp_recommendation_path` in JSON contracts | >= 1 | 1 (Stage 1 — line 91) | PASS |
| `product/product/` anywhere | 0 | 0 | PASS |
| `/ux/` anywhere | 0 | 0 | PASS |
| `{product_base}experience/` anywhere | >= 10 | 32 | PASS |
| `output_path` in JSON contract blocks | 0 | 0 | PASS |
| `output_dir` in JSON contract blocks | 0 | 0 | PASS |

**PATH AUDIT VERDICT: PASS.**
