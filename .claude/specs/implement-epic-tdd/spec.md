# Spec: Redesign implement-epic TDD Loop

**Issue:** #179
**Branch:** `feat/179-implement-epic-tdd-redesign`
**Status:** DRAFT

---

## 1. Problem Statement

Six structural gaps in the current `implement-epic` play undermine TDD integrity and quality enforcement. Three were identified through design analysis; three were discovered through live evidence from the felly-club E1 implementation.

### Gap 1: Same agent writes tests and code (context bias)

In Step 6 (SKILL.md lines 262-307), `code-builder` receives CONTEXT.md and performs the full red-green cycle:

```
"For each scope item in 'Files You Own':",
"  1. Write a test that verifies the scope item's expected behavior",
"  2. Run the test — verify it FAILS (red phase)",
"  3. Write the implementation code",
"  4. Run the test — verify it PASSES (green phase)",
```

Same agent, same context window, authors test and code. The agent already knows its planned implementation when writing the test. The red-green cycle is performative — tests shaped by what the agent intends to build, not by what the specification demands.

C16 (intent.yaml line 103-107) requires vertical-story TDD but does not require agent separation. The structural guarantee of independent test authorship does not exist.

### Gap 2: Quality Profile does not flow into quality gates

`prepare-architecture` produces `quality-standards.yaml` at `.garura/product/architecture/quality-standards.yaml` with 7 QP dimensions, specific levels, coverage targets, and thresholds.

`implement-epic` Step 3 (lines 176-197) creates quality gates by sniffing the project toolchain generically:

```yaml
quality_gates:
  build: { required: true, command: "{project build command}" }
  typecheck: { required: true, command: "{project typecheck command}" }
  lint: { required: true, command: "{project lint command}", max_warnings: 0 }
  unit_tests: { required: true, command: "{project test command}", min_coverage: null }
```

`min_coverage: null` is the evidence. `quality-standards.yaml` is never read. The architecture phase's quality decisions are completely disconnected from implementation enforcement.

### Gap 3: No engineering manager certification

Current quality checkpoints:
- `quality-auditor` (Step 7): runs build, lint, typecheck, unit tests — generic engineering hygiene
- `judge` (Step 8): runs encrypted behavioral evals — specification correctness

Nobody reads `quality-standards.yaml` and certifies implementation meets the project's declared quality bar. Coverage targets (QP-1), complexity limits (QP-2), documentation standards (QP-3), and security scanning (QP-7) are not enforced.

### Gap 4: Quality gate FAIL is ignored — pipeline continues to judge (CRITICAL)

**Evidence:** felly-club E1 implementation, `quality-report.yaml` overall status: **FAIL**.
- Build gate FAILED: ESLint parser error — `tsconfig.test.json` path unresolvable from frontend package directories during `next build`
- Lint gate FAILED: auto-generated `next-env.d.ts` files use triple-slash references not excluded from ESLint

Despite overall FAIL, the pipeline proceeded to judge (25 evals), ran a fix loop, reached 100% pass rate, and is now finalizing. Quality gates are treated as informational, not blocking. The orchestrator does not check `quality-report.yaml` overall status before proceeding to Step 8 (judge).

**Root cause:** The implement-epic play has no gate between Step 7 (quality-auditor) and Step 8 (judge) that halts on quality FAIL. The step dependency is `Step 8 depends on Step 6` — it bypasses Step 7's result entirely.

### Gap 5: Fix loop derives remediation from judge only, ignores quality gate failures (CRITICAL)

**Evidence:** felly-club E1, `remediation-1.md` contains 3 fixes — all from judge eval failures:
1. Email verification redirect (PH1-VER-003)
2. Social login redirect (PH1-SOC-004)
3. Email case normalization (PH1-VAL-009)

Zero mention of build/lint gate failures. The quality-auditor reported FAIL, the fix loop ran, and nobody addressed the tooling issues. After the fix loop completed, the build and lint gates still fail.

**Root cause:** Step 9 (Derive Remediation) reads only `judge-report.yaml` as input. It does not read `quality-report.yaml`. Gate failures have no path into the remediation pipeline.

### Gap 6: Eval count drops between judge iterations with no audit trail

**Evidence:** felly-club E1 judge reports:
- Initial: 25 evals (PH1-* IDs), 21 pass (84%)
- Fresh: 22 evals (F11-E1-* IDs), 22 pass (100%)
- 3 evals disappeared between iterations

The eval-generator is supposed to produce fresh evals independently (C9). The fresh set has fewer evals and completely different IDs. No artifact explains why 3 evals were removed. This could be legitimate consolidation or the eval-generator producing easier evals after observing the failure pattern (which would violate C9's freshness guarantee).

**Root cause:** No eval count audit. The orchestrator does not compare eval counts between iterations or require the eval-generator to justify delta. C9 says "fresh evals" but doesn't enforce count stability or require a delta explanation.

---

## 2. Proposed Changes

### 2A. Test-Writer / Implementer Separation

**New sub-agent role: test-writer**

Implemented as a scoped role definition within the `implement-epic` play, not a standalone agent file. Per ADR 004, `test-writer` is "too granular" for a standalone agent, but within implement-epic it's a context-isolated sub-role with asymmetric information constraints.

**Step restructuring — Step 6 splits into 6a and 6b:**

**Step 6a — Write Tests (test-writer):**
- Receives ONLY `TEST-CONTEXT.md` containing: scope item descriptions (from CONTEXT.md "Scope" section, NOT "Files You Own"), acceptance scenarios (from features.yaml `success_scenarios` and scenarios.yaml `pass_criteria`), test framework name (from quality-standards.yaml)
- Does NOT receive: file paths, architecture decisions, tech stack details, implementation context
- Writes test files with behavioral assertions

**Step 6b — Implement Code (code-builder):**
- Receives CONTEXT.md (full, including "Files You Own") PLUS test file paths as `read_only: true`
- Implements code to make tests pass
- CANNOT modify test files
- Orchestrator verifies test file checksums unchanged after builder returns

**New artifact — TEST-CONTEXT.md:**

Produced by orchestrator (Step 3b) by extracting:
1. CONTEXT.md "Scope" section (item descriptions only, no file paths)
2. features.yaml `success_scenarios` and `failure_conditions` for the target feature
3. scenarios.yaml `pass_criteria` for scenarios in the feature's `scenario_gate`
4. quality-standards.yaml `standards.testing.frameworks` and `standards.testing.test_types`

**Isolation invariants:**
- test-writer sees specifications, not structure — forces behavioral assertions
- code-builder sees tests but cannot modify them — enforced by checksum verification
- test-writer and code-builder never share a context window

### 2B. QP-to-Quality-Gates Translation

**Step 3 redesigned to read quality-standards.yaml:**

1. Check if `.garura/product/architecture/quality-standards.yaml` exists
2. If yes: translate QP dimension levels into concrete thresholds (see Section 5)
3. If no: fall back to current generic toolchain detection (backward compatibility)

**Enriched quality gates schema:**

```yaml
quality_gates:
  build: { required: true, command: "{detected}" }
  typecheck: { required: true, command: "{detected}" }
  lint:
    required: true
    command: "{detected}"
    max_warnings: 0
    static_analysis_tool: "{from QS}"        # QP-2 level >= 3
    static_analysis_command: "{from QS}"      # QP-2 level >= 3
  unit_tests:
    required: true
    command: "{detected}"
    min_coverage: "{from QP-1 translation}"   # no longer null
  complexity:
    required: "{true if QP-2 >= 3}"
    max_cyclomatic: "{from QP-2 translation}"
  security:
    required: "{true if QP-7 >= 2}"
    dependency_scan_command: "{from QS}"
    sast_command: "{from QS}"                 # QP-7 level >= 3
  documentation:
    required: "{true if QP-3 >= 2}"
    api_doc_check: "{from QS}"
source:
  quality_standards_path: ".garura/product/architecture/quality-standards.yaml"
  generated_at: "{timestamp}"
```

### 2C. Engineering Manager (EM) Agent

**New agent: `core/components/agents/engineering-manager.md`**

Follows ADR 004 `{domain}-{role}` convention: domain = engineering, role = manager.

**Pipeline position:**

```
Step 6a: test-writer writes tests
Step 6b: code-builder implements (makes tests pass)
Step 7:  quality-auditor runs gates (build, lint, typecheck, tests)
Step 7b: engineering-manager certifies QP compliance  ← NEW
Step 8:  judge runs behavioral evals
```

EM runs AFTER quality-auditor (needs its report) and BEFORE judge (can block before behavioral eval). Prevents wasting judge budget on code that doesn't meet quality standards.

**EM receives:**
- `quality-standards.yaml` (declared quality bar)
- `quality-report.yaml` (from quality-auditor — actual measurements)
- Test coverage report
- Build report

**EM does NOT receive:**
- Eval files (encrypted or plaintext)
- Judge reports
- Builder prompts or reasoning
- Feature specs, scenarios, or behavioral definitions

**EM certifies:**
- Coverage target met (QP-1): actual >= threshold from quality-standards.yaml
- Complexity within limits (QP-2): zero critical violations
- Documentation standards met (QP-3): required docs exist
- Security scans passed (QP-7): zero critical findings

**EM output — em-certification.yaml:**

```yaml
em_certification:
  timestamp: "{ISO-8601}"
  overall: "CERTIFIED | BLOCKED"
  qp_checks:
    - dimension: "QP-1"
      target_level: 3
      target_threshold: "coverage >= 70%"
      actual: "coverage = 82%"
      status: "PASS"
    - dimension: "QP-2"
      target_level: 3
      target_threshold: "zero static analysis critical findings"
      actual: "0 critical, 2 info"
      status: "PASS"
  blockers: []
```

**Blocking behavior:** If `overall: BLOCKED`, judge does NOT execute. Enters fix loop — remediation extracts QP violations, sends to code-builder. After fix, quality-auditor re-runs, EM re-certifies. Judge only runs once EM certifies.

### 2D. Quality Gate as Hard Gate (fixes Gap 4)

**Problem:** The orchestrator proceeds from Step 7 (quality-auditor) to Step 8 (judge) without checking the quality report status. Quality gate FAIL is informational, not blocking.

**Fix:** Add an explicit gate check between Step 7 and Step 8:

```
after Step 7 (quality-auditor):
  read quality-report.yaml
  if overall == "FAIL":
    do NOT proceed to Step 8 (judge)
    enter fix loop with quality gate failures as remediation source
  if overall == "PASS":
    proceed to Step 7b (EM certification)
```

**Step 8 dependency change:** Currently `Step 8 depends on Step 6`. Must become `Step 8 depends on Step 7b (EM CERTIFIED)`. This creates a hard chain: builder → quality-auditor → EM → judge. No skipping.

### 2E. Unified Remediation from Both Judge and Quality Gates (fixes Gap 5)

**Problem:** Step 9 (Derive Remediation) reads only `judge-report.yaml`. Quality gate failures have no path into the fix loop.

**Fix:** Step 9 reads BOTH sources:

```
remediation_sources:
  - judge-report.yaml      → behavioral failures (redirect missing, validation wrong)
  - quality-report.yaml    → gate failures (build broken, lint violations)
  - em-certification.yaml  → QP threshold failures (coverage below target)
```

Remediation instructions are categorized:
- **behavioral:** from judge failures → code-builder fixes implementation
- **tooling:** from quality gate failures → code-builder fixes config/build issues
- **quality:** from EM blockers → code-builder improves coverage/docs/security

The fix loop re-runs ALL three checks (quality-auditor → EM → judge) after each iteration, not just the judge.

### 2F. Eval Count Audit Trail (fixes Gap 6)

**Problem:** Eval count drops between iterations with no explanation. Fresh eval-generator produces fewer evals than the original, potentially making the bar easier to pass.

**Fix:** Add eval count audit to the orchestrator:

```yaml
# After Step 12 (fresh eval generation):
eval_audit:
  original_count: 25          # from initial manifest
  fresh_count: 22             # from fresh manifest
  delta: -3
  delta_explanation_required: true  # if |delta| > 0
```

**New constraint C21 (eval count stability):** "When fresh evals are generated (Step 12), the orchestrator compares eval count against the original manifest. If the count decreased, the eval-generator must provide a `consolidation_rationale` for each removed eval. If no rationale is provided, the fresh eval set is rejected and the eval-generator is re-invoked. Eval count may increase (new behaviors discovered) but may not decrease without explanation."

**Audit artifact:** `eval-audit-{iteration}.yaml` written to STM evidence alongside the fresh evals.

---

## 3. Agent Isolation Model

| Agent | Sees | Does NOT See | Produces |
|-------|------|--------------|----------|
| **tech-designer** | plan.yaml, architecture.yaml, tech.yaml | Evals, scenarios, features spec | CONTEXT.md |
| **orchestrator** | CONTEXT.md, features.yaml, scenarios.yaml, quality-standards.yaml | Evals | TEST-CONTEXT.md, quality-vision-gates.yaml |
| **test-writer** (NEW) | TEST-CONTEXT.md only (scope descriptions + acceptance criteria + test framework) | CONTEXT.md "Files You Own", file paths, architecture, tech decisions, evals, builder output | Test files |
| **code-builder** | CONTEXT.md + test file paths (read-only) | Evals, judge reports, scenarios, features spec, TEST-CONTEXT.md | Implementation code |
| **quality-auditor** | Implemented code, quality-vision-gates.yaml | Evals, builder prompts, judge reports, EM report | quality-report.yaml |
| **engineering-manager** (NEW) | quality-standards.yaml, quality-report.yaml, coverage report | Evals, judge reports, builder prompts, feature specs | em-certification.yaml |
| **eval-generator** | features.yaml behaviors, scenarios.yaml, exit gate text | Implementation code, builder prompts, prior evals | Encrypted eval file |
| **judge** | Encrypted evals, project codebase | Builder prompts, quality results, EM report | judge-report.yaml |

---

## 4. Updated Pipeline Flow

```
Phase: Preparation
  Step 1  — Build Context (tech-designer)               → CONTEXT.md
  Step 2  — Update CLAUDE.md (orchestrator)
  Step 3  — Capture Quality Vision Gates (orchestrator)  → quality-vision-gates.yaml [MODIFIED]
  Step 3b — Build Test Context (orchestrator)            → TEST-CONTEXT.md [NEW]
  Step 4  — Generate Encrypted Evals (eval-generator)    → Encrypted eval file
  Step 5  — Record Preparation State (orchestrator)

Phase: Execution
  Step 6a — Write Tests (test-writer)                    → Test files [NEW]
  Step 6b — Implement Code (code-builder)                → Implementation [MODIFIED]
  Step 7  — Quality Gate (quality-auditor)               → quality-report.yaml
            HARD GATE: FAIL → fix loop; PASS → proceed   [FIX for Gap 4]
  Step 7b — EM Certification (engineering-manager)       → em-certification.yaml [NEW]
            Gate: BLOCKED → fix loop; CERTIFIED → proceed
  Step 8  — Judge Evals (judge)                          → judge-report.yaml

Phase: Fix Loop (max 3 iterations, C11)
  Step 9  — Derive Unified Remediation (orchestrator)    [FIX for Gap 5]
            Sources: judge-report + quality-report + em-certification
            Categories: behavioral | tooling | quality
  Step 10 — Builder Fix (code-builder)
  Step 10b— Test Update (test-writer, conditional)       [NEW, only if spec misunderstanding]
  Step 11 — Quality Gate re-run (quality-auditor)
            HARD GATE: must PASS before proceeding
  Step 11b— EM re-certification (engineering-manager)
  Step 12 — Fresh Evals (eval-generator, new instance)
  Step 12b— Eval Count Audit (orchestrator)              [FIX for Gap 6]
            Compare count vs original manifest; reject if decreased without rationale
  Step 13 — Fresh Judge (judge, new instance)

Phase: Finalize
  Step 15 — Generate Test Scenarios (product-strategist)
  Step 16 — Commit and Push (repo-orchestrator)
  Step 17 — Clean Up CLAUDE.md (orchestrator)

Phase: Scenario Validation + Evidence
  Step 18 — Scenario Evals
  Step 19 — Write Evidence
```

**Domain call budget (clean run):** 8 (context + test-writer + builder + quality-auditor + EM + judge + scenarios + repo). Up from 6.

**Domain call budget (max 3 fix iterations):** 8 + 3×6 = 26 max.

---

## 5. QP Translation Table

### QP-1: Testing Depth → min_coverage

| Level | Coverage Target | Rationale |
|-------|----------------|-----------|
| 1 (Manual/Ad Hoc) | null (no gate) | No automated tests expected |
| 2 (Unit Basics) | >= 40% | Core business logic has unit tests |
| 3 (Layered Testing) | >= 70% | Unit + integration, tracked coverage |
| 4 (Comprehensive) | >= 80% | Full test pyramid enforced |
| 5 (Exhaustive) | >= 90% | Near-complete coverage with property-based tests |

`quality-standards.yaml` `standards.testing.coverage_target` numeric value takes precedence over table default.

### QP-2: Code Quality → complexity limits

| Level | Max Lint Warnings | Static Analysis | Max Cyclomatic Complexity |
|-------|-------------------|-----------------|--------------------------|
| 1 (No Standards) | no gate | none | no gate |
| 2 (Basic Hygiene) | 0 (errors only) | none | no gate |
| 3 (Enforced) | 0 | required (tool from QS) | 15 |
| 4 (Architecture Governance) | 0 | required + arch rules | 10 |
| 5 (Formal Governance) | 0 | required + conformance | 8 |

### QP-3: Documentation → doc coverage

| Level | Gate |
|-------|------|
| 1 | no gate |
| 2 | README exists, public API functions have JSDoc/docstrings |
| 3 | API docs auto-generated, architecture overview exists |
| 4 | All of 3 + documentation freshness check |
| 5 | All of 4 + documentation coverage metric |

### QP-7: Security Testing → security scan requirements

| Level | Gate |
|-------|------|
| 1 | no gate |
| 2 | `dependency_scan_command` runs, zero critical vulnerabilities |
| 3 | Level 2 + `sast_command` runs, zero critical findings |
| 4 | Level 3 + DAST if URL available |
| 5 | Level 4 + all security checks mandatory |

**QP-4 (CI/CD), QP-5 (Observability), QP-6 (Accessibility)** do not produce implement-time gates — they are infrastructure/process concerns validated at deployment, not during TDD. Recorded in EM certification for traceability.

---

## 6. Constraint Changes

### Modified Constraints

**C5 (code-builder isolation):** Remove "test first" from builder's responsibility. New: "The code-builder receives CONTEXT.md and test file paths (read-only). It implements each scope item to make existing tests pass, then verifies. It does not author test files."

**C14 (quality agent scope):** New: "The quality agent receives quality vision gates (which include QP-derived thresholds when quality-standards.yaml is present)."

**C15 (quality gates in STM):** New: "When `.garura/product/architecture/quality-standards.yaml` exists, gates MUST derive thresholds from it. When absent, gates are detected from toolchain defaults."

**C16 (vertical story TDD):** Split responsibilities. New: "Each scope item's tests are authored by the test-writer from specifications before the code-builder sees them. The code-builder implements each scope item to make its tests pass. Scope items are not batched."

### New Constraints

**C17 (test-writer isolation):** "The test-writer receives only TEST-CONTEXT.md — scope item descriptions and acceptance criteria. It does not receive CONTEXT.md 'Files You Own', file paths, architecture decisions, or implementation context. Test assertions must be behavioral, not structural."

**C18 (test file immutability):** "Test files authored by test-writer are read-only for code-builder. Orchestrator records checksums before passing to builder and verifies unchanged after builder returns. Checksum mismatch is a failure condition."

**C19 (EM certification gate):** "The engineering-manager certifies QP compliance after quality-auditor and before judge. If EM reports BLOCKED, judge does not execute. Blocked dimensions enter fix loop."

**C20 (QP derivation):** "When quality-standards.yaml exists, quality vision gate thresholds MUST be derived from it. Manual override of QP-derived thresholds is not permitted."

**C21 (quality gate hard stop):** "If quality-auditor reports overall FAIL, the orchestrator MUST NOT proceed to EM certification or judge. Quality gate failures enter the fix loop as 'tooling' category remediation. The judge only executes after quality gates PASS AND EM certifies."

**C22 (unified remediation):** "Step 9 (Derive Remediation) reads three sources: judge-report.yaml (behavioral failures), quality-report.yaml (gate failures), and em-certification.yaml (QP threshold failures). Remediation instructions are categorized as behavioral, tooling, or quality. All three sources are re-checked after each fix iteration."

**C23 (eval count stability):** "When fresh evals are generated (Step 12), the orchestrator compares eval count against the original manifest. If count decreased, the eval-generator must provide a consolidation_rationale for each removed eval. If no rationale is provided, the fresh eval set is rejected and the eval-generator is re-invoked. Count may increase but not decrease without explanation."

---

## 7. Impact on Existing Evals

### Modified Step Evals

- **SE-5 (C12, F1):** Extend to verify QP-derived thresholds met, not just exit code 0
- **SE-6 (C16, F12):** Verify test files authored by test-writer (checksum match), builder did not modify
- **SE-11 (F5):** Allow `test_file_paths` (read-only) and `remediation_path` in builder contract

### New Step Evals

- **SE-14 (C17):** Test-writer contract contains only `test_context_path`. No file paths, architecture, or tech details.
- **SE-15 (C18):** All test file checksums match between post-test-writer and post-code-builder.
- **SE-16 (C19):** EM certification exists. If CERTIFIED → judge ran. If BLOCKED → judge did NOT run.
- **SE-17 (C20):** When quality-standards.yaml exists, `min_coverage` is non-null and matches QP-1 translation.
- **SE-18 (C21):** If quality-report.yaml overall == FAIL, judge-report.yaml does NOT exist for this iteration. Quality gate failure blocked judge execution.
- **SE-19 (C22):** Remediation file contains entries from ALL failing sources (judge + quality-auditor + EM). No source with failures was omitted from remediation.
- **SE-20 (C23):** After fresh eval generation, eval-audit artifact exists. If eval count decreased, consolidation_rationale is present for each removed eval.

### New Scenario Evals

- **SCE-9 (Quality Lead):** EM certification traces to quality-standards.yaml levels. No QP dimension >= 2 has null threshold.
- **SCE-10 (Testing Architect):** Test files authored by test-writer (checksums match). Tests assert behavioral outcomes. Builder did not modify test files.
- **SCE-11 (Build Engineer):** Quality gate FAIL prevents judge execution. Fix loop addresses tooling failures (build, lint) alongside behavioral failures. After fix, all gates pass before judge runs.
- **SCE-12 (Eval Auditor):** Eval count between iterations is audited. Any decrease has documented rationale. No evals silently disappear.

---

## 8. Failure Conditions

### New

- **F15 (test-writer isolation breach):** TEST-CONTEXT.md contains file paths or technology decisions
- **F16 (test file modification by builder):** Checksum mismatch between post-test-writer and post-code-builder
- **F17 (QP threshold violation):** EM reports BLOCKED — enters fix loop (hard halt after 3 iterations per F3)
- **F18 (EM certification skipped):** Judge executed without prior EM CERTIFIED
- **F19 (QP derivation absent):** quality-standards.yaml exists but quality gates have null thresholds
- **F20 (quality gate bypass):** Judge executed while quality-report.yaml shows overall FAIL — quality gates were not blocking
- **F21 (remediation source omission):** Quality-report.yaml or em-certification.yaml contains failures but remediation-{n}.md has zero entries from that source
- **F22 (eval count decrease without rationale):** Fresh eval count < original eval count and no consolidation_rationale artifact exists

---

## 9. Files Affected

### Modify

| File | Changes |
|------|---------|
| `core/components/plays/implement-epic/reference/intent.yaml` | Add C17-C23, F15-F22, update C5/C14/C15/C16, add scenarios S9-S12 |
| `core/components/plays/implement-epic/SKILL.md` | Step 3 enrichment, new 3b, split 6→6a/6b, new 7b, quality gate hard stop, unified remediation in Step 9, eval count audit in Step 12b, fix loop 10b/11b/11b, updated evals SE-14 through SE-20 |
| `core/components/agents/code-builder.md` | Add `read_only_files` contract support, checksum verification |
| `core/components/agents/quality-auditor.md` | Update report schema for QP thresholds |
| `docs/components/agents.md` | Add engineering-manager, document test-writer role |
| `docs/adr/004-agent-naming.md` | Note on engineering-manager naming, test-writer as play-scoped role |

### Create

| File | Purpose |
|------|---------|
| `core/components/agents/engineering-manager.md` | New agent — QP compliance certifier |
