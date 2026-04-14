# Coverage Matrix — design-exp (D10 Rebake)

**Compiled SKILL.md:** `core/components/plays/design-exp/SKILL.md`
**Intent:** `core/components/plays/design-exp/reference/intent.yaml`
**Intent hash:** `sha256:8698b426a2f61deea00670d9d2840ce5d0be3df1a189ea3d3d819c5d1a58a802`
**Evals source:** `.meridian/project/issues/214/evidence/create-play/design-exp/evals.yaml`

## Summary

| Category | Count | Status |
|---------|-------|--------|
| Constraints (pre-flight) | 4 | PASS — all appear in Pre-flight table |
| Constraints (structural) | 3 | PASS — all enforced by play structure |
| Constraints (artifact-verifiable) | 8 | PASS — each has >=1 SE |
| Failure conditions | 12 | PASS — each has >=1 SE |
| Scenarios | 7 | PASS — each has 1 SCE |
| Required SKILL.md sections | 11 | PASS — all present |

**Overall verdict: PASS**

## Constraint coverage

| ID | Category | Covered By | Location in SKILL.md |
|----|----------|------------|---------------------|
| C1 | pre-flight | Pre-flight check | Pre-flight table row 2 + bash block lines 1-5 (specify-product artifacts LOCKED) |
| C2 | pre-flight | Pre-flight check | Pre-flight table row 3 + bash block comment (invoke validate-kb-extension) |
| C3 | artifact-verifiable | SE-2 (F2), SE-13 (C3 direct) | Step 1 Evals |
| C4 | artifact-verifiable | SE-3 (F3), SE-14 (C4 direct) | Step 1 Evals |
| C5 | artifact-verifiable | SE-4 (F4), SE-15 (C5 direct) | Steps 3+4 Evals |
| C6 | artifact-verifiable | SE-5 (F5), SE-16 (C6 direct) | Steps 3+4 Evals |
| C7 | artifact-verifiable | SE-6 (F6), SE-7 (F7), SE-17 (C7 direct) | Steps 6+7 Evals |
| C8 | artifact-verifiable | SE-8 (F8), SE-18 (C8 direct) | Step 8 Evals |
| C9 | artifact-verifiable | SE-9 (F9), SE-19 (C9 direct) | Step 8 Evals |
| C10 | pre-flight + structural | Pre-flight (writability check); agent boundary table + every JSON contract that routes writes through scriber; Evidence & Close section lists only whitelist paths | Pre-flight table row 4; Agent boundary table; All JSON contracts; Evidence & Close |
| C11 | pre-flight + structural | Agent boundary table (designer/judge/scriber/repo-orchestrator with explicit domains); every JSON contract delegates owner=`designer`; scriber is the writer for evidence/checkpoint/status | Pre-flight table row 4; Agent boundary table; Workflow step owners |
| C12 | artifact-verifiable | SE-10 (F10), SE-20 (C12 direct) | Step 9 Evals |
| C13 | structural | Scenario Validation SCE-7 + Drift Notice + design-spec-compilation step restricts output to structural/layout; SE-12 (F12) forbids visual elements | Scenario Validation + Step 9 Evals + play-level compilation rule |

All 13 constraints covered. Each artifact-verifiable constraint has >=1 direct SE (the C-anchored SE-13..SE-20) plus at least one F-anchored SE where a matching failure condition exists.

## Failure condition coverage

| ID | Covered By | Skill | Location |
|----|------------|-------|----------|
| F1 | SE-1 | synthesize-personas | Step 1 Evals |
| F2 | SE-2 | synthesize-personas | Step 1 Evals |
| F3 | SE-3 | synthesize-personas | Step 1 Evals |
| F4 | SE-4 | validate-screen-coverage | Steps 3+4 Evals |
| F5 | SE-5 | validate-screen-coverage | Steps 3+4 Evals |
| F6 | SE-6 | validate-screen-coverage | Steps 6+7 Evals |
| F7 | SE-7 | validate-screen-coverage | Steps 6+7 Evals |
| F8 | SE-8 | generate-wireframes | Step 8 Evals |
| F9 | SE-9 | generate-wireframes | Step 8 Evals |
| F10 | SE-10 | compile-design-spec | Step 9 Evals |
| F11 | SE-11 | compile-design-spec | Step 9 Evals |
| F12 | SE-12 | compile-design-spec | Step 9 Evals |

All 12 failure conditions covered. Every failure condition has >=1 SE.

## Scenario coverage

| ID | Persona | Covered By | Location |
|----|---------|------------|----------|
| S1 | Developer | SCE-1 | Scenario Validation |
| S2 | Designer (external) | SCE-2 | Scenario Validation |
| S3 | Product Manager | SCE-3 | Scenario Validation |
| S4 | Technical Architect | SCE-4 | Scenario Validation |
| S5 | Accessibility Lead | SCE-5 | Scenario Validation |
| S6 | Developer (interaction patterns) | SCE-6 | Scenario Validation |
| S7 | Product Manager (final review) | SCE-7 | Scenario Validation |

All 7 scenarios covered. Every scenario has 1 SCE.

## Required SKILL.md sections

| Section | Present | Line reference |
|---------|---------|---------------|
| Frontmatter | Yes | Lines 1-5 (name, description, user-invokable) |
| Header | Yes | Line 7-9 |
| Compiled From | Yes | Line 11 onward |
| Role + Agent Boundaries | Yes | Role + agent boundaries table |
| Pre-flight | Yes | Pre-flight section with table + bash |
| Workflow | Yes | Phases: Preparation, Checkpoint 1, Execution (3 phases), Checkpoint 2, Execution, Checkpoint 3 |
| Scenario Validation | Yes | 7 SCE entries |
| Evidence & Close | Yes | Step 11 with scriber dispatch + repo-orchestrator self-commit |
| Pause and Resume | Yes | Status file format + resume logic |
| Compilation Metadata | Yes | Metadata table with new intent_hash |
| Drift Notice | Yes | Drift Notice — D10 path-correction rebake, at end of file |

All 11 required sections present.

## Pre-flight constraint → table row mapping

| Constraint | Pre-flight row |
|-----------|---------------|
| C1 | "specify-product artifacts exist and are LOCKED: scope/scope.yaml, scope/enriched-capabilities.yaml, scope/epics/*.yaml, specification/quality-profile.yaml under {product_base}" |
| C2 | "KB catalog consistency — invoke validate-kb-extension skill" |
| C10 | "{product_base}experience/ writable; scriber agent reachable" (writability portion) |
| C11 | "{product_base}experience/ writable; scriber agent reachable" (scriber reachability portion) |

## Structural constraint enforcement

| Constraint | Enforcement mechanism in SKILL.md |
|-----------|----------------------------------|
| C10 | Every write path in every JSON contract points under {product_base}experience/ (design artifacts) or {product_base}_checkpoints/_evidence/_status/ (lifecycle). Pre-flight row 4 validates writability. Evidence & Close self-commit file list is restricted to the whitelist. |
| C11 | Agent boundary table restricts domain work to designer + judge; scriber owns all evidence/checkpoint/status writes; repo-orchestrator owns self-commit only. No JSON contract assigns a write to a non-scriber agent for those artifact types. |
| C13 | Scenario SCE-7 asserts handoff notes mention visual design is out of scope. Step 9 eval SE-12 forbids any color/typography/spacing content in design-spec.md. Play role statement explicitly forbids visual-design decisions. |

## Verdict

**PASS** — every intent item (13 constraints, 12 failure conditions, 7 scenarios) has at least one covering element in the compiled SKILL.md. Step eval coverage is strictly stronger than the prior bake (20 SEs vs 16) because the new eval set anchors each artifact-verifiable constraint to its own SE in addition to the failure-condition-anchored SEs.
