# build-arch Coverage Matrix

Generated: 2026-04-15
Source intent: `core/components/plays/build-arch/reference/intent.yaml` (sha256 `ba573a93183c7c4341814866042da0b4fe4848125990a1f4108058ee9ff8f169`)
Compiled play: `core/components/plays/build-arch/SKILL.md`
Validator: `core/components/skills/validate-architecture-spec/SKILL.md` v0.3.0 (V1-V20)
Evals: `evals.yaml` (SE-1..SE-19, SCE-1..SCE-7)

## Constraints (C1-C19)

| ID | Class | Enforcement Location |
|----|-------|----------------------|
| C1 | pre-flight | `Pre-flight` table — verifies specify-product scope + specification artifacts exist (LOCKED) |
| C2 | pre-flight | `Pre-flight` table — verifies design-exp artifacts exist (LOCKED) |
| C3 | artifact-verifiable | SE-2 (physical specificity → V5) + SE-3 (logical purity → V3); enforced in derive-logical and derive-physical skill contracts |
| C4 | artifact-verifiable | SE-4 → V19 (driver traceability across all five artifacts) |
| C5 | artifact-verifiable | SE-5 → V4 (capability coverage in component_capability_map); also self-validated by derive-logical Step 8 |
| C6 | artifact-verifiable | SE-6 → V9 + V20 (NFR delivery mechanism + epic perf constraints covered) |
| C7 | artifact-verifiable | SE-7 → V10 + V11 (ISO 25010 coverage + entry completeness in quality-vision) |
| C8 | artifact-verifiable | SE-8 → V12 (concrete tooling, no vague language) |
| C9 | artifact-verifiable | SE-9 → V13 (design-patterns layer coverage by runtime tier + cross-cutting triggers) |
| C10 | artifact-verifiable | SE-10 → V17 + V18 (ADR completeness + non-obvious-decision ADR linkage) |
| C11 | structural | Pre-flight write-access check + scriber-only writes throughout (every checkpoint/evidence write goes through scriber JSON contract); ADR 017 whitelist documented in compilation metadata |
| C12 | structural | Agent boundary table at top of play; every Step assigns owner agent (tech-architect / tech-designer / scriber / repo-orchestrator); orchestrator never executes domain work |
| C13 | structural | 5 checkpoint phases in dependency order (Stage 1 → Checkpoint 1 → Stage 2 → ... → Checkpoint 5 → Validation); Tether/Vanish/Orbit prompts at every checkpoint |
| C14 | structural | "No code, no test suites, no implementation work products" stated in header; play has zero code-builder/test-engineer agents; SE-13 verifies architecture/ output set |
| C15 | structural | Embedded in derive-physical-architecture (Step 2) and derive-design-patterns (Step 5) decision trees — both walk grounded_tools → KB candidate enumeration → grounding-questions append on multi-candidate; pre-flight verifies grounding-questions.md exists |
| C16 | artifact-verifiable | SE-15 → V6 + V14 (source_type field present and within enum, no agent_default_unilateral) across primary artifacts and design-patterns manifest |
| C17 | artifact-verifiable | SE-16 → V7 (grounded_tools pin honoured exactly + tagged grounded_tools_pin); pre-flight verifies project-profile.yaml exists |
| C18 | structural | 5 Decision Surfacing sub-steps (1b, 2b, 3b, 4b, 5b) — each walks the just-emitted manifest and drives HIGH batch-confirm / MID batch-with-questions / LOW one-by-one flows; verified at runtime by SE-18 → V15 + V16 |
| C19 | structural | Every derive Step JSON contract declares `decision_manifest_path` as a required output field; verified at runtime by SE-19 + V15 (schema completeness across all five manifests) |

**Constraints covered:** 19/19
**Pre-flight:** C1, C2 (2)
**Structural:** C11, C12, C13, C14, C15, C18, C19 (7)
**Artifact-verifiable:** C3, C4, C5, C6, C7, C8, C9, C10, C16, C17 (10)

## Failure Conditions (F1-F19)

| ID | Eval | Validator Check(s) | Phase / Location |
|----|------|--------------------|------------------|
| F1 | SE-1 | V1, V2 | Validation (Step 6) |
| F2 | SE-2 | V5 | Validation (Step 6) — physical specificity |
| F3 | SE-3 | V3 | Validation (Step 6) — logical purity scan |
| F4 | SE-4 | V19 | Validation (Step 6) — driver traceability |
| F5 | SE-5 | V4 | Validation (Step 6) — capability coverage |
| F6 | SE-6 | V9, V20 | Validation (Step 6) — NFR delivery + epic perf coverage |
| F7 | SE-7 | V10, V11 | Validation (Step 6) — ISO 25010 + quality-vision entry completeness |
| F8 | SE-8 | V12 | Validation (Step 6) — vague-language scan |
| F9 | SE-9 | V13 | Validation (Step 6) — layer coverage |
| F10 | SE-10 | V17, V18 | Validation (Step 6) — ADR completeness + non-obvious linkage |
| F11 | SE-11 | (filesystem) | Five checkpoint files under `_checkpoints/build-arch/` |
| F12 | SE-12 | (whitelist + scriber discipline) | Pre-flight + every write routed via scriber JSON contract |
| F13 | SE-13 | (no code) | architecture/ output set check; agent boundary table excludes implementation agents |
| F14 | SE-14 | (manifest grounding-questions citation) | Step 2 Q-arch append + Step 2b surfacing flow |
| F15 | SE-15 | V6, V14 | Validation (Step 6) — source_type discipline in artifacts + design-patterns manifest |
| F16 | SE-16 | V7 | Validation (Step 6) — grounded_tools pin honour |
| F17 | SE-17 | V8 | Validation (Step 6) — kb_catalog_single_candidate spot-check |
| F18 | SE-18 | V15, V16 | Validation (Step 6) — every manifest entry has non-null user_response; tier=high requires kb_path |
| F19 | SE-19 | V15 + manifest existence | Validation (Step 6) — manifest schema completeness |

**Failure conditions covered:** 19/19

## Scenarios (S1-S7)

| ID | Eval | Persona | Artifacts Validated |
|----|------|---------|---------------------|
| S1 | SCE-1 | Technical Architect | All five artifacts — driver traceability across the package |
| S2 | SCE-2 | Engineering Manager | quality-vision.yaml — vision + tooling + thresholds + lifecycle gates |
| S3 | SCE-3 | Implementation Lead | logical + physical + design-patterns — component-to-stack-to-pattern path |
| S4 | SCE-4 | Security Architect | nfr-spec + physical (auth_infra) + logical — security NFR delivery |
| S5 | SCE-5 | Product Manager | All five checkpoint artifacts — appetite review + plain-English summaries |
| S6 | SCE-6 | DevOps / Platform Engineer | physical + quality-vision + design-patterns — deployment + observability + resilience |
| S7 | SCE-7 | Senior Developer (onboarding) | design-patterns.yaml — system / layer / component patterns with rationale |

**Scenarios covered:** 7/7

## Coverage Summary

- Constraints: **19 / 19** (2 pre-flight, 7 structural, 10 artifact-verifiable)
- Failure conditions: **19 / 19**
- Scenarios: **7 / 7**
- Step evals: **19** (SE-1..SE-19)
- Scenario evals: **7** (SCE-1..SCE-7)
- Validator checks: **20** (V1..V20) — referenced by 11 step evals
- Gaps: **none**

## Notes

- F11 (five checkpoints), F12 (whitelist + scriber), and F13 (no code) are validated by filesystem inspection at evidence-write time rather than by the validator skill — the validator is artifact-content-focused, not orchestration-shape-focused. SE-11/12/13 close that gap.
- F14 (silent multi-candidate) is validated by inspecting the physical decision manifest for Q-arch citations on `kb_catalog_multi_candidate_user_approved` entries — V6 catches `agent_default_unilateral` but not silent multi-candidate without grounding-question trail. SE-14 closes that gap.
- C15 is classified structural rather than artifact-verifiable because the play enforces it through the Step 2 / Step 5 decision-tree workflow (grounding-questions append + checkpoint surfacing), not through a single field in the artifact. The validator catches the symptoms (V6 source_type, V8 single-candidate spot-check) but the discipline itself is structural.
- C18 (DSD) is classified structural because the surfacing flow lives in the play workflow (Steps 1b/2b/3b/4b/5b), not in the artifacts. The artifacts only carry the side effect (manifest entries with populated user_response), which V15 and V16 verify at runtime.
- C19 (manifest emission) is classified structural because every derive Step contract declares `decision_manifest_path` as a required output — the play structurally guarantees emission. V15 verifies the schema content at runtime; SE-19 verifies file existence + schema.
