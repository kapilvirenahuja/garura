# design-exp Rebuild Report — Defect 23 (Decision Surfacing Discipline)

**Play:** `design-exp`
**Mode:** rebuild
**Intent hash (new):** `sha256:2e087c9d153cd852f7667981281895f29592f9fa0b34e776181f24aeba143051`
**Intent hash (prior):** `sha256:1c49d46736c0f9c7d4320b11603a75fb1ee4e115d3ce6eb5d2de5111745bebe2`
**Compiled at:** 2026-04-15
**Compiled by:** `/create-play --rebuild design-exp`

## Drivers

- **C17** Decision Surfacing Discipline (NEW)
- **C18** decision-manifest.yaml emission (NEW)
- **F16** silent commit of inferred decision (NEW)
- **F17** missing / malformed / un-surfaced manifest (NEW)

## Changes applied to `core/components/plays/design-exp/SKILL.md`

### 1. Intent-hash and compile header
- intent_hash refreshed to match current SHA-256 of `reference/intent.yaml`.
- "Compiled From" block now reads `C1-C18`, `F1-F17`, and `/create-play --rebuild`.

### 2. Role section
- Forbidden list extended with two new items: silent commit (F16) and dispatch-without-manifest (F17).
- New **Decision Surfacing contract** paragraph spells out tier grouping, HIGH batch / MID batch-with-questions / LOW one-by-one presentation mechanics, and user_response write-back requirement before any downstream skill runs.

### 3. JSON contract updates — `decision_manifest_path` added to 5 skills

| # | Step | Skill | Manifest output path |
|---|------|-------|----------------------|
| 1 | Step 1 | `synthesize-personas` | `{product_base}experience/decision-manifest-synthesize-personas.yaml` |
| 2 | Step 3 | `generate-screen-inventory` | `{product_base}experience/decision-manifest-generate-screen-inventory.yaml` |
| 3 | Step 6 | `map-user-flows` | `{product_base}experience/decision-manifest-map-user-flows.yaml` |
| 4 | Step 8 | `generate-wireframes` | `{product_base}experience/decision-manifest-generate-wireframes.yaml` |
| 5 | Step 9 | `compile-design-spec` | `{product_base}experience/decision-manifest-compile-design-spec.yaml` |

**Agent contracts updated to pass `decision_manifest_path`: 5 / 5.**

Skills NOT updated (validate-screen-coverage, validate-kb-extension): these are pure validators / gate skills — they produce no inferred decisions, so by C17/C18 they are exempt.

### 4. New Decision Surfacing sub-gates

| Sub-gate | After step | Skill whose manifest it walks |
|----------|------------|-------------------------------|
| Step 1a | Step 1 | synthesize-personas |
| Step 3a | Step 3 | generate-screen-inventory |
| Step 6a | Step 6 | map-user-flows |
| Step 8a | Step 8 | generate-wireframes |
| Step 9a | Step 9 | compile-design-spec |

Each sub-gate: loads manifest → groups by tier → runs HIGH batch / MID batch-with-questions / LOW one-by-one flow → scriber writes user_response + user_response_detail back to every entry → HALT with F17 on any missing/malformed/un-surfaced condition.

### 5. New step evals

| Eval ID | Covers | Target |
|---------|--------|--------|
| SE-31 | C17 | Every inferred decision was tagged with tier and surfaced via tier-appropriate flow before downstream consumption |
| SE-32 | C18 | Every inferred-decision skill received `decision_manifest_path` and wrote a manifest with all required fields; user_response populated after surfacing |
| SE-33 | F16 | No silent commit; every decision manifest entry has non-null user_response before next step's skill fires |
| SE-34 | F17 | No missing/malformed manifest; no un-resolved entries after surfacing flow |

**Evals added for C17/C18/F16/F17: 4.**

### 6. Compilation Metadata
- `step_evals`: 30 → 34
- `structural_constraints`: added C17, C18
- `artifact_verifiable_constraints`: added C17, C18 (dual-category — orchestration is structural, manifest shape is artifact-verifiable)
- `failure_conditions_covered`: F1..F17 (100%)
- `checkpoints` row documents 3 human + 5 decision-surfacing sub-gates
- `workflow_structure` annotated with sub-gate count

### 7. Drift Notice appended
Full "D23 Decision Surfacing Discipline Rebuild (2026-04-15)" block appended at end of file documenting intent changes, surface changes, what did NOT change, and the full coverage matrix.

## Coverage matrix (post-rebuild)

### Constraints
| ID | Category | Covered By | Status |
|----|----------|-----------|--------|
| C1 | pre-flight | Pre-flight table | PASS |
| C2 | pre-flight | Pre-flight table | PASS |
| C3 | artifact-verifiable | SE-21 | PASS |
| C4 | artifact-verifiable | SE-22 | PASS |
| C5 | artifact-verifiable | SE-23 | PASS |
| C6 | artifact-verifiable | SE-24 | PASS |
| C7 | artifact-verifiable | SE-25 | PASS |
| C8 | artifact-verifiable | SE-26 | PASS |
| C9 | artifact-verifiable | SE-27 | PASS |
| C10 | pre-flight + structural | Pre-flight + agent boundary | PASS |
| C11 | pre-flight + structural | Pre-flight + agent boundary | PASS |
| C12 | artifact-verifiable | SE-28 | PASS |
| C13 | structural | Role (forbidden list) | PASS |
| C14 | structural | Role (forbidden list) + SE-15 | PASS |
| C15 | pre-flight | Pre-flight table | PASS |
| C16 | artifact-verifiable | SE-29, SE-30 | PASS |
| **C17** | **structural + artifact-verifiable** | **Role (Decision Surfacing contract) + Steps 1a/3a/6a/8a/9a + SE-31** | **PASS** |
| **C18** | **structural + artifact-verifiable** | **5 JSON contract output blocks + SE-32** | **PASS** |

### Failure conditions
| ID | Covered By | Status |
|----|-----------|--------|
| F1 | SE-1, SE-2, SE-3 | PASS |
| F2 | SE-4 | PASS |
| F3 | SE-5 | PASS |
| F4 | SE-6 | PASS |
| F5 | SE-7 | PASS |
| F6 | SE-8 | PASS |
| F7 | SE-9 | PASS |
| F8 | SE-10 | PASS |
| F9 | SE-11 | PASS |
| F10 | SE-12 | PASS |
| F11 | SE-13 | PASS |
| F12 | SE-14 | PASS |
| F13 | SE-15 | PASS |
| F14 | SE-16, SE-17, SE-18 | PASS |
| F15 | SE-19, SE-20 | PASS |
| **F16** | **SE-33** | **PASS** |
| **F17** | **SE-34** | **PASS** |

### Scenarios
| ID | Covered By | Status |
|----|-----------|--------|
| S1..S7 | SCE-1..SCE-7 | PASS |

**Coverage gaps surfaced: NONE.** 18/18 constraints, 17/17 failure conditions, 7/7 scenarios fully covered.

## Verification checklist

- [x] intent_hash in Compilation Metadata matches current `shasum -a 256` of intent.yaml
- [x] Every JSON contract for synthesize-personas, generate-screen-inventory, map-user-flows, generate-wireframes, compile-design-spec passes `decision_manifest_path`
- [x] New step evals tied to F16 (SE-33) and F17 (SE-34)
- [x] Coverage matrix shows C17 + C18 + F16 + F17 fully covered
- [x] No pre-existing eval lost; SE-1..SE-30 preserved verbatim
- [x] No changes to `reference/intent.yaml`, no changes to any `core/components/skills/*/SKILL.md`
- [x] No changes to specify-product or build-arch plays

## Files touched

- `core/components/plays/design-exp/SKILL.md` — modified (single file)
- `.meridian/project/issues/214/evidence/create-play/design-exp/rebuild-report.md` — written (this file)
