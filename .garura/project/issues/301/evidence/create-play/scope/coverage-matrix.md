# Coverage Matrix — /scope play

Compiled: 2026-04-19
intent_hash: `sha256:f8afed4c0f90602ab0e455f0e9f2a59d7894916e1978539c83bc099144f2cc6c`

## Constraints

| ID | Category | Covered By | Location in SKILL.md |
|----|----------|------------|----------------------|
| C1 | pre-flight | Pre-flight check + SE-1 | Pre-flight table (FEAT-ID reuse row); Phase 0 step eval |
| C2 | structural | Agentic-intake rule (no hard min/max question count) | Phase 1 body ("no fixed question count (C2)") |
| C3 | artifact-verifiable | SE-10 | Phase 1 step evals |
| C4 | artifact-verifiable | SE-3 | Phase 2 step evals |
| C5 | artifact-verifiable | SE-11 | Phase 3 step evals |
| C6 | structural | Conditional-phase rule | Phase 4 header ("Runs ONLY when catalog-match.classification ∈ {...}") |
| C7 | structural | Vanish-closes-issue routing | Phase 5 Vanish branch + `action=close` contract |
| C8 | structural | No mode flag to manage-features | Phase 6 body ("NO mode flag is passed (C8)") |
| C9 | artifact-verifiable | SE-5 | Phase 6 step evals |
| C10 | artifact-verifiable | SE-6 | Phase 7 step evals |
| C11 | structural | Checkpoint-always + Vanish-keeps-issue-open | Phase 9 body |
| C12 | structural | Agent boundary + STM-vs-LTM routing | Agent boundary table; Phase 10 commit contract path split |
| C13 | structural | Agent boundary table + "Forbidden" rule | Role section + Pre-flight |
| C14 | structural | Missing-LTM auto-create rule | Phase 2 body ("auto-created per C14"), Phase 6 body |
| C15 | pre-flight | Pre-flight config-read block | Pre-flight bash block resolving stm_base / product_base / etc. |
| **C16** | **structural** | **Template-load blocks in Phases 5, 9, 10 + SE-12 structural grep** | **Phase 5 Steps 5a/5b, Phase 9 Steps 9a/9b, Evidence & Close Steps 13a/13b** |

## Failure Conditions

| ID | Covered By | Location |
|----|------------|----------|
| F1 | SE-1 | Phase 0 step evals |
| F2 | SE-2 | Phase 1 step evals |
| F3 | SE-3 | Phase 2 step evals |
| F4 | SE-4 | Phase 3 step evals |
| F5 | SE-5 | Phase 6 step evals |
| F6 | SE-6 | Phase 7 step evals |
| F7 | SE-7 | Phase 4 step evals |
| F8 | SE-8 | Phase 5 step evals |
| F9 | SE-9 | Phase 2 step evals |
| **F10** | **SE-12** | **Phase 5 step evals (structural — grep-verified, applies globally)** |

## Scenarios

| ID | Covered By | Location |
|----|------------|----------|
| S1 | SCE-1 | Scenario Validation |
| S2 | SCE-2 | Scenario Validation |
| S3 | SCE-3 | Scenario Validation |
| S4 | SCE-4 | Scenario Validation |
| S5 | SCE-5 | Scenario Validation |
| S6 | SCE-6 | Scenario Validation |

## C16 template_map → SKILL.md reference cross-check

| template_map key | Declared template | SKILL.md location |
|------------------|-------------------|-------------------|
| phase-0-gh-issue-body | handled inside `manage-issue` via `github-issue.md` | Phase 0 `manage-issue` delegation; `templates_loaded` metadata row |
| phase-5-vanish-gh-issue-close-comment | single-line close reason through `manage-issue` | Phase 5 Vanish JSON contract — `close_comment` field |
| phase-5-placement-checkpoint | `{ltm.project-target}standards/templates/checkpoint.md` | Phase 5 Step 5a bash block; destination `{stm_base}{issue}/checkpoint/scope/{ts}.md` |
| phase-5-approval-prompt | `{ltm.project-target}standards/templates/approval-prompt.md` | Phase 5 Step 5b bash block |
| phase-9-epic-checkpoint | `{ltm.project-target}standards/templates/checkpoint.md` | Phase 9 Step 9a bash block; destination `{stm_base}{issue}/checkpoint/scope/{ts}.md` |
| phase-9-approval-prompt | `{ltm.project-target}standards/templates/approval-prompt.md` | Phase 9 Step 9b bash block |
| phase-10-delivery-report | `{ltm.project-target}standards/templates/delivery-report.md` | Evidence & Close Step 13b bash block |
| phase-10-evidence-file | `{ltm.project-target}standards/templates/evidence-file.md` | Evidence & Close Step 13a bash block; destination `{stm_base}{issue}/evidence/scope/{ts}.md` |

All 8 template_map surfaces have a corresponding reference in SKILL.md. `grep -c 'standards/templates/' SKILL.md` = 7 literal bash references (checkpoint.md × 2, approval-prompt.md × 2, delivery-report.md × 1, evidence-file.md × 1, plus one in the `templates_loaded` metadata row). Phase-0 and phase-5-vanish surfaces are handled inside `manage-issue` per intent — no additional wiring in `/scope` required.

## Summary

- 16 / 16 constraints covered
- 10 / 10 failure conditions covered
- 6 / 6 scenarios covered
- 12 step evals, 6 scenario evals
- All required SKILL.md sections present (Frontmatter, Header, Compiled From, Role + Agent Boundaries, Pre-flight, Task DAG, Workflow, Scenario Validation, Evidence & Close, Pause and Resume, Compilation Metadata)
