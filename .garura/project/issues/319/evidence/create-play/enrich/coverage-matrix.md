# Coverage Matrix — enrich

## Constraints

| ID | Type | Category | Covered By | Location |
|----|------|----------|------------|----------|
| C1 | constraint | artifact-verifiable | SE-10 | Step 4 Eval |
| C2 | constraint | artifact-verifiable | SE-11 | Step 2 Eval |
| C3 | constraint | artifact-verifiable | SE-12 | Step 2 Eval |
| C4 | constraint | structural | Play structure | Step 3 (Checkpoint) — T1 per-proposal vs T2/T3 batch behavior baked into the step |
| C5 | constraint | artifact-verifiable | SE-13 | Step 4 Eval |
| C6 | constraint | artifact-verifiable | SE-14 | Step 5 Eval |
| C7 | constraint | structural | Play structure | Pre-flight (single vs sweep mode), executor loop |
| C8 | constraint | artifact-verifiable | SE-15 | Step 4 Eval |
| C9 | constraint | structural | Play structure | Out-of-scope by omission — no step promotes proposed taxonomy values |
| C10 | constraint | structural | Play structure | Step 6 (Evidence & Close) — non-blocking self-commit |

## Failure Conditions

| ID | Covered By | Location |
|----|------------|----------|
| F1 | SE-1, SE-11 | Step 2 Eval |
| F2 | SE-2, SE-10 | Step 4 Eval |
| F3 | SE-3, SE-14 | Step 5 Eval |
| F4 | SE-4 | Step 4 Eval |
| F5 | SE-5, SE-13 | Step 4 Eval |
| F6 | SE-6 | Step 5 Eval |
| F7 | SE-7 | Step 3 Eval |
| F8 | SE-8, SE-15 | Step 4 Eval |
| F9 | SE-9 | Step 5 Eval (also asserted at pre-flight enumeration) |

## Scenarios

| ID | Covered By | Location |
|----|------------|----------|
| S1 | SCE-1 | Scenario Validation |
| S2 | SCE-2 | Scenario Validation |
| S3 | SCE-3 | Scenario Validation |
| S4 | SCE-4 | Scenario Validation |
| S5 | SCE-5 | Scenario Validation |
| S6 | SCE-6 | Scenario Validation |

## Verification

- Every artifact-verifiable constraint (C1, C2, C3, C5, C6, C8) has ≥1 SE — PASS.
- Every structural constraint (C4, C7, C9, C10) is enforced by play structure — PASS.
- Every failure condition (F1–F9) has ≥1 SE — PASS.
- Every scenario (S1–S6) has exactly 1 SCE — PASS.
- All required SKILL.md sections present (Frontmatter, Header, Compiled From, Role + Agent Boundaries, Pre-flight, Task DAG, Workflow, Scenario Validation, Pause and Resume, Compilation Metadata) — PASS.
- Agent contracts include `intent_path`, `stm_base`, `stm`, `task_id` (ADR 016) — PASS.
- Skill LTM input coverage (G11): all skills enrich uses (`normalize-proposals-for-enrichment`, `apply-ltm-enrichment`, `promote-adr-draft`, `archive-issue-stm`) take only contract-supplied paths; no LTM discovery instructions needed — PASS.

**Compilation gate: cleared.**
