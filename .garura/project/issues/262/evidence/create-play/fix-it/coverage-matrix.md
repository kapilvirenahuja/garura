# Coverage Matrix — fix-it (rebuild for #262)

Generated: 2026-04-19T12:30:00Z
Intent hash: sha256:2fe89d691d17664c3184fcf04d675dc80ce75a1148dbc7809b37cd41e024be15

## Constraints

| ID | Category | Covered By | Location |
|----|----------|------------|----------|
| C1 | pre-flight | Pre-flight check (Issue resolvable, Issue exists and is open) | Pre-flight table |
| C2 | pre-flight | Pre-flight check (Current branch guard) | Pre-flight table |
| C3 | artifact-verifiable | SE-2 | Step 3 eval |
| C4 | artifact-verifiable | SE-3 | Step 3 eval |
| C5 | artifact-verifiable | SE-4 | Step 3 eval |
| C6 | structural | Play structure (single non-skippable checkpoint at Step 5) | Step 5 header note |
| C7 | structural | Play structure (no approvals between Step 5 Tether and Step 7 ship) | Step 7 approval_override note |
| C8 | structural | Play structure (code-builder contract limits stm.input to rca.yaml/design.yaml) | Step 6 contract + SE-10 |
| C9 | structural | Play structure (ship sub-play dispatch with approval_override=auto-proceed) | Step 7 |
| C10 | structural | Agent boundary table (orchestrator forbidden direct git/gh) | Role section |
| C11 | artifact-verifiable | SE-5 | Step 3 eval |
| C12 | artifact-verifiable | SE-6 | Step 4 eval |
| C13 | artifact-verifiable | SE-8 | Step 5 eval |

## Failure Conditions

| ID | Covered By | Location |
|----|------------|----------|
| F1 | SE-7 | Step 5 eval |
| F2 | SE-2 | Step 3 eval |
| F3 | SE-3 | Step 3 eval |
| F4 | SE-11 | Step 7 eval |
| F5 | SE-1 | Step 1 eval |
| F6 | SE-9 | Step 6 eval |
| F7 | SE-10 | Step 6 eval |
| F8 | SE-5 | Step 3 eval |
| F9 | SE-6 | Step 4 eval |
| F10 | SE-8 | Step 5 eval |

## Scenarios

| ID | Persona | Covered By |
|----|---------|------------|
| S1 | Developer | SCE-1 |
| S2 | Tech Lead | SCE-2 |
| S3 | QA Engineer | SCE-3 |
| S4 | QA Engineer (audit trail) | SCE-4 |

## Verification

- [x] Every artifact-verifiable constraint (C3, C4, C5, C11, C12, C13) has >=1 SE
- [x] Every failure condition (F1-F10) has >=1 SE
- [x] Every scenario (S1-S4) has exactly 1 SCE
- [x] Every pre-flight constraint (C1, C2) appears in pre-flight table
- [x] Every structural constraint (C6, C7, C8, C9, C10) has a verifiable structural element
- [x] All required SKILL.md sections present
- [x] Agent JSON contracts conform to ADR 016 schema
- [x] intent_hash matches current SHA-256 of intent.yaml
- [x] evals sourced from evals-creator output (not hand-written)

**Result:** COMPLETE — no gaps.
