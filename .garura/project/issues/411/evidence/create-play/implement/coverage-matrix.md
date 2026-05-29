# Coverage Matrix — /implement recompile (#411 DAG-runner redesign)

Maps every constraint (C1-C34), failure condition (F1-F26), success scenario
(S1-S19), and recovery entry (REC1-REC26) to its covering mechanism in the
recompiled SKILL.md and the regenerated evals.yaml.

Sources:
- intent.yaml — C1-C34, F1-F26
- expectation.yaml — S1-S19, REC1-REC26
- evals.yaml — SE-1..SE-30, SCE-1..SCE-19
- constraint-classifications.yaml — pre-flight / artifact-verifiable / structural

No zero-coverage items.

## Constraints (C1-C34)

| ID | Category | Covering mechanism |
|----|----------|--------------------|
| C1 | pre-flight | Pre-flight "candidate is milestone node: status LOCKED" check; SE-8 |
| C2 | pre-flight | Pre-flight "milestone backing feature has scenarios+failures+exit gate"; SE-9 |
| C3 | pre-flight | Pre-flight DAG-edge-resolution by type; node loop "resolve edges"; SE-24; SCE-5 |
| C4 | structural | evals-engineer agent-boundary isolation (Step M1 contract) |
| C5 | structural | code-builder isolation invariant + pre-invocation check (Steps N4b/N4d/F2); SE-5 |
| C6 | structural | judge isolation invariants (EVAL-REVIEW Step M3, ARBITER Step N4e) |
| C7 | artifact-verifiable | Step M1 encryption directives; SE-27 |
| C8 | artifact-verifiable | eval_dir outside repo; Step M1; SE-4 |
| C9 | structural | Step F4 "old evals discarded, fresh agent regenerates" |
| C10 | structural | Builder receives only remediation/status reports (Step F2 isolation) |
| C11 | structural | Outer fix loop "max 3 iterations" (Step F5) |
| C12 | artifact-verifiable | Step N4b build-must-pass + Step M2; SE-28 |
| C13 | artifact-verifiable | Step N1 CONTEXT.md contents; SE-29 |
| C14 | artifact-verifiable | Step M2 quality-auditor scope + isolation; SE-30 |
| C15 | pre-flight | Pre-flight "quality-gates.yaml captured before quality agent"; Step N3 |
| C16 | structural | "For each scope item, sequential" Task-Node procedure; Steps N4a-N4c |
| C17 | structural | test-writer isolation invariant (Step N4a) |
| C18 | artifact-verifiable | Step N4c status-report format + MUST NOT clause; SE-15 |
| C19 | artifact-verifiable | Step N3 QP translation table; SE-16 |
| C20 | structural | Gate logic note + Step M2 gate (FAIL/BLOCKED -> no judge) |
| C21 | structural | Step F1 "read two sources, categorize, no source omitted"; SE-18 |
| C22 | artifact-verifiable | Step F4b eval-count audit; SE-19 |
| C23 | pre-flight | Pre-flight artifact-path resolution (artifact_base from STM) |
| C24 | pre-flight | Pre-flight + Step N3c mock infrastructure; SE-20 |
| C25 | structural | Step N5 integration pass (unit+integration+regression) |
| C26 | artifact-verifiable | Step M2 qp_certification section; SE-22 |
| C27 | structural | FORBIDDEN DATA SOURCES block; Role forbidden list; SE-23 |
| C28 | pre-flight | Pre-flight SELF-LOCATE block; node loop; Arguments (no milestone_id); SCE-1 |
| C29 | structural | Pre-invocation check (Steps N4b/N4d/F2); SE-5 |
| C30 | structural | Step N4e arbiter trigger (two consecutive failures); SE-25 |
| C31 | structural | Isolation invariant "both derive from same SPEC" (Role) |
| C32 | structural | Isolation invariant "communication only via spec refs/status reports" |
| C33 | structural | Dispatch prompt contract (4 sections) + pre-dispatch gates; SE-26; SCE-19 |
| C34 | structural | Two halt-boundary types block; node loop; Gate/Milestone procedures; SCE-2/3/4 |

All 34 constraints covered. Artifact-verifiable constraints each carry a dedicated SE
(C7=SE-27, C8=SE-4, C12=SE-28, C13=SE-29, C14=SE-30, C18=SE-15, C19=SE-16, C22=SE-19,
C26=SE-22). Pre-flight and structural constraints are enforced by the play's structure
(pre-flight checks, agent boundaries, node loop, dispatch gates), per the evals-creator
rule that only artifact-verifiable constraints get constraint-driven evals.

## Failure conditions (F1-F26) -> covering SE

| Failure | Covering SE |
|---------|-------------|
| F1  | SE-1, SE-28 |
| F2  | SE-2 |
| F3  | SE-3 |
| F4  | SE-4 |
| F5  | SE-5 |
| F6  | SE-6 |
| F7  | SE-7 |
| F8  | SE-8 |
| F9  | SE-9 |
| F10 | SE-10 |
| F11 | SE-11 |
| F12 | SE-12 |
| F13 | SE-13 |
| F14 | SE-14 |
| F15 | SE-15 |
| F16 | SE-16 |
| F17 | SE-17 |
| F18 | SE-18 |
| F19 | SE-19 |
| F20 | SE-20 |
| F21 | SE-21 |
| F22 | SE-22 |
| F23 | SE-23 |
| F24 | SE-24 |
| F25 | SE-25 |
| F26 | SE-26 |

All 26 failure conditions covered. No zero-coverage failure.

## Success scenarios (S1-S19) -> covering SCE

| Scenario | Persona | Covering SCE |
|----------|---------|--------------|
| S1  | Engineer | SCE-1 |
| S2  | Engineer | SCE-2 |
| S3  | Engineer | SCE-3 |
| S4  | Engineer | SCE-4 |
| S5  | Engineer | SCE-5 |
| S6  | Engineer | SCE-6 |
| S7  | Engineer | SCE-7 |
| S8  | QA Engineer | SCE-8 |
| S9  | Security Auditor | SCE-9 |
| S10 | Engineering Lead | SCE-10 |
| S11 | Performance Auditor | SCE-11 |
| S12 | Evals Engineer | SCE-12 |
| S13 | Quality Lead | SCE-13 |
| S14 | Build Engineer | SCE-14 |
| S15 | Testing Architect | SCE-15 |
| S16 | Engineering Lead | SCE-16 |
| S17 | Eval Auditor | SCE-17 |
| S18 | Developer | SCE-18 |
| S19 | Developer | SCE-19 |

All 19 scenarios covered. No zero-coverage scenario.

## Recovery (REC1-REC26)

All 26 recovery entries (one per failure condition F1-F26) are present in the
SKILL.md `## Recovery` table with trigger, direction, and handoff
(autonomous|human). Routing: 20 autonomous, 6 human (REC2, REC3, REC8, REC9,
REC20, REC24). No missing recovery entry.

## Summary

- Constraints: 34/34 covered (0 gaps)
- Failure conditions: 26/26 covered by SE (0 gaps)
- Scenarios: 19/19 covered by SCE (0 gaps)
- Recovery: 26/26 present (0 gaps)
- Step evals: 30 (SE-1..SE-30)
- Scenario evals: 19 (SCE-1..SCE-19)
