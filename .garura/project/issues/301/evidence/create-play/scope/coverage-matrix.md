# Coverage Matrix — scope play

Compiled: 2026-04-20T03:39:19Z
Intent hash: `sha256:3d4531c3c77eedd9db4c215d578501c41eac383797b8d2b2283767d8e11296bc`
Compiled SKILL.md: `core/components/plays/scope/SKILL.md`

## Constraints

| Intent Item | Type | Category | Covered By | Location |
|-------------|------|----------|-----------|----------|
| C1 | Constraint | pre-flight + artifact-verifiable | Pre-flight row "Invocation argument + FEAT-ID reuse" + SE-1 | SKILL.md Pre-flight table; SKILL.md Phase 0 (SE-1) |
| C2 | Constraint | structural | Agentic intake depth (no count gate) | SKILL.md Phase 1 narrative |
| C3 | Constraint | artifact-verifiable | SE-10 | SKILL.md Phase 1 (SE-10) |
| C4 | Constraint | artifact-verifiable | SE-3 | SKILL.md Phase 2 (SE-3) |
| C5 | Constraint | artifact-verifiable | SE-11 | SKILL.md Phase 3 (SE-11) |
| C6 | Constraint | structural | Conditional Phase 4 routing on catalog-match bucket | SKILL.md Phase 4 narrative |
| C7 | Constraint | structural | Placement checkpoint always presented; Vanish invokes `project-orchestrator` close | SKILL.md Phase 5 narrative + SE-8 artifact leg |
| C8 | Constraint | structural | Agentic Phase 6 — no mode flag on `manage-features` contract | SKILL.md Phase 6 narrative + JSON contract |
| C9 | Constraint | artifact-verifiable | SE-5 | SKILL.md Phase 6 (SE-5) |
| C10 | Constraint | artifact-verifiable | SE-6 | SKILL.md Phase 7 (SE-6) |
| C11 | Constraint | structural | Epic checkpoint always presented; Vanish leaves issue open | SKILL.md Phase 9 narrative |
| C12 | Constraint | structural (enforced by SE-7) | SE-7 | SKILL.md Phase 4 (SE-7), STM vs LTM path split across every phase |
| C13 | Constraint | pre-flight + structural | Pre-flight platform check + Role section agent delegation boundaries | SKILL.md Pre-flight table; SKILL.md Role section |
| C14 | Constraint | structural (partially verifiable via SE-9) | SE-9 on existing artifacts; C14 auto-create narrative in Phases 2, 6 | SKILL.md Phase 2 (SE-9); Phase 6 narrative |
| C15 | Constraint | pre-flight + structural | Pre-flight config resolution table + every path in every JSON contract uses tokens, no hardcoded strings | SKILL.md Pre-flight table + every Phase JSON contract |

## Failure Conditions

| Intent Item | Type | Category | Covered By | Location |
|-------------|------|----------|-----------|----------|
| F1 | Failure condition | artifact-verifiable | SE-1 | SKILL.md Phase 0 |
| F2 | Failure condition | artifact-verifiable | SE-2 | SKILL.md Phase 1 |
| F3 | Failure condition | artifact-verifiable | SE-3 | SKILL.md Phase 2 |
| F4 | Failure condition | artifact-verifiable + structural (Phase 5 Vanish closes issue per C7) | SE-4 (with structural Phase-5 leg) | SKILL.md Phase 3 (SE-4); Phase 5 Vanish branch |
| F5 | Failure condition | artifact-verifiable | SE-5 | SKILL.md Phase 6 |
| F6 | Failure condition | artifact-verifiable | SE-6 (with Phase 8 single-loop gap interview) | SKILL.md Phase 7 (SE-6); Phase 8 narrative |
| F7 | Failure condition | artifact-verifiable | SE-7 | SKILL.md Phase 4 |
| F8 | Failure condition | artifact-verifiable | SE-8 | SKILL.md Phase 5 |
| F9 | Failure condition | artifact-verifiable | SE-9 | SKILL.md Phase 2 |

## Scenarios

| Intent Item | Type | Category | Covered By | Location |
|-------------|------|----------|-----------|----------|
| S1 | Scenario | artifact-verifiable | SCE-1 | SKILL.md Scenario Validation |
| S2 | Scenario | artifact-verifiable | SCE-2 | SKILL.md Scenario Validation |
| S3 | Scenario | artifact-verifiable | SCE-3 | SKILL.md Scenario Validation |
| S4 | Scenario | artifact-verifiable | SCE-4 | SKILL.md Scenario Validation |
| S5 | Scenario | artifact-verifiable | SCE-5 | SKILL.md Scenario Validation |
| S6 | Scenario | artifact-verifiable | SCE-6 | SKILL.md Scenario Validation |

## Totals

- Pre-flight constraints: 3 (C1, C13, C15) — C1 and C13 also have structural/artifact legs
- Artifact-verifiable constraints: 5 (C3, C4, C5, C9, C10) — each covered by exactly one SE
- Structural constraints: 8 (C2, C6, C7, C8, C11, C12, C13, C14) — enforced by narrative + agent boundaries + JSON contract shape; C12 and C14 additionally observed via SE-7 / SE-9
- Step evals: 11 (SE-1 through SE-11)
- Scenario evals: 6 (SCE-1 through SCE-6)
- Failure conditions covered: 9/9 (each has ≥1 SE)
- Scenarios covered: 6/6 (each has exactly 1 SCE)
