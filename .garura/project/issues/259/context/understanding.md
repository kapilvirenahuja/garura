# Context — Issue #259: /fix-it TDD + Task-List Enhancement

## 1. Current fix-it play shape

**Source:** `core/components/plays/fix-it/reference/intent.yaml` (v1.1.0) + `core/components/plays/fix-it/SKILL.md`

**Constraints:** 13 (C1–C13)
- C3: RCA must trace to specific file/logic (not restatement)
- C4: Fix design must include ≥1 alternative considered with rejection reason
- C5: Fix design must include risk assessment with severity levels
- C6: Exactly one human checkpoint — never skippable
- C7: After Tether, all remaining steps are autonomous
- C8: code-builder reads STM design artifacts ONLY — never checkpoint brief content
- C11: RCA agent contract includes ltm_context with R1–R4 protocol
- C13: Background issue comment dispatched on Tether (non-blocking)

**Failure conditions:** 10 (F1–F10)
- F3: `design.yaml` has no `alternatives_considered` entries
- F4: `design.yaml` has no `risks` entries with severity (links to C5)
- F7: code-builder contract includes checkpoint brief path (Structure A isolation)

**Scenarios:** 4 (S1–S4)

**Agent delegation (SKILL.md compilation metadata):**
- Domain agents (3): `project-orchestrator`, `tech-designer`, `code-builder`
- Utility agents (2): `project-orchestrator` (background), `repo-orchestrator`

**Workflow:** Structure A — Pre-flight → Preparation → Checkpoint → Execution → Evidence

**Steps (compiled):**
1. Validate issue (project-orchestrator)
2. Create branch (repo-orchestrator)
3. RCA & Design (tech-designer) → writes `rca.yaml`, `design.yaml`, `resolution-trace.yaml`
4. Prepare checkpoint (play — reads STM, no agent)
5. Human approval gate (Tether/Vanish)
6. Implement fix (code-builder) — reads `design.yaml`, `rca.yaml` only
7. Ship (ship sub-play with approval_override=auto-proceed)
8. Scenario evals (play)
9. Evidence & close (play + repo-orchestrator for self-commit)

**Status file:** `{stm_base}/{issue}/status/fix-it.json`

**Design artifact schema (current):** `design.yaml` contains: `alternatives_considered` (C4/F3), `risks` with severity (C5/F4), `affected_files`, `execution_plan`, `confidence`.

**Key isolation rule (C8/F7, SE-10):** Step 6 JSON contract contains ONLY `design.yaml` and `rca.yaml` under `stm.input`. No brief path, no HTML, no inline checkpoint markdown may appear.

---

## 2. Build pipeline (create-play)

**Deployed skill:** `~/.claude/skills/create-play/SKILL.md`

**Flags:**
- `--build {play-name}` — rebuild an existing play from its intent.yaml (Rebake mode). Does a deep read of current SKILL.md → gap analysis → intent review → recompile.
- `--rebuild` — same as `--build` (terminology note: SKILL.md uses "Rebake mode" internally, user flag is `--build`)
- `--review` — read-only diagnostic, no file modifications

**Intent hash mechanism:**
- `intent_hash` is SHA-256 of `reference/intent.yaml` computed at compile time: `shasum -a 256 core/components/plays/{play-name}/reference/intent.yaml`
- Stored in `## Compilation Metadata` section of SKILL.md (NOT in frontmatter)
- G9 check detects hash drift — if intent.yaml changed since compile, review flags it

**SKILL.md is a compiled artifact — NEVER hand-edited.** Modification path: update `core/components/plays/fix-it/reference/intent.yaml` → run `/create-play --build fix-it`.

**Evals source for current fix-it:** `.garura/project/issues/262/evidence/create-play/fix-it/evals.yaml`

**Evals-creator invocation** is part of compile (Step 6b). Compiler classifies constraints as `pre-flight`, `artifact-verifiable`, or `structural` before invoking evals-creator. Evals are embedded verbatim — compiler never hand-authors evals.

**Coverage matrix** is written to STM at compile time; all constraints, FCs, and scenarios must have coverage or compilation fails.

---

## 3. Agents to be touched

### tech-designer (`core/components/agents/tech-designer.md`)

**Current Step 3 output contract:** `rca.yaml`, `design.yaml`, `resolution-trace.yaml`

**Current scope:** RCA → blast radius → fix design (with alternatives + risks) → execution plan for code-builder.

**New responsibility for #259:** Also write a failing regression test to the repo's real test path, as part of RCA output. The test file path is returned in the output contract (e.g., `stm.output.regression_test_path`). The test must be authored before code-builder is invoked (red-before-green invariant).

**Contract shape change needed:** Add `regression_test_path` to `stm.output` in the Step 3 JSON contract. The tech-designer produces the test; the play captures the path and passes only the path (not the test content) to quality-auditor.

**Agent definition gap:** `tech-designer.md` does not currently mention test authorship in its skill pool or output contract. Its "What You Produce" table lists "Execution Plan" but not "Failing regression test." No skill is mapped for test writing — tech-designer currently performs RCA directly (no skill delegation for it).

### code-builder (`core/components/agents/code-builder.md`)

**Current input contract (Step 6):** `design.yaml` + `rca.yaml` via `stm.input`.

**TDD mode already exists in code-builder.md (lines 119–128):** The agent already defines `read_only_files` and TDD mode. When `read_only_files` is present, builder operates in TDD mode — implements code to make tests pass, does NOT modify test files.

**Contract shape change needed:** Step 6 JSON contract gains a `read_only_files` field listing the regression test file path authored by tech-designer. The test file content is NOT included — only the path. This preserves the existing TDD mode mechanism.

**Checksum enforcement:** code-builder.md mentions checksum enforcement (line 126: "orchestrator verifies test file checksums before and after the builder runs"). This is already in the agent spec — the play must implement the checksum recording/comparison logic.

**No change to agent definition required** — code-builder already supports TDD mode. Change is to the play's Step 6 contract shape only.

### quality-auditor (`core/components/agents/quality-auditor.md`)

**Current role in fix-it:** Not present — current fix-it has no quality-auditor. Verification is self-reported by code-builder (self-certification problem).

**New role for #259:** Runs the regression test authored by tech-designer and returns exit-code verdict. Preserves validator≠implementer boundary.

**Input contract shape:** Receives `quality_gates_path` (or a targeted gate spec) and `project_root`. For fix-it's lean scope, a minimal gate spec covering the single regression test is sufficient — no full QP certification needed (that's the heavier `implement` play pattern).

**What quality-auditor does NOT receive:** eval content, builder prompts, builder reasoning, judge reports. Context isolation is maintained.

**Agent is new to fix-it** — requires adding a new step (Step 6b: Verify Fix) between code-builder and ship, with the quality-auditor in the agent boundary table. This increases domain agent count from 3 to 4.

---

## 4. Test conventions in this repo

**Finding: This repo is markdown/YAML-only.** No test files found:
- `find ... -name "*.test.*" -o -name "*.spec.*"` → zero results
- No `package.json`, `jest.config.*`, `vitest.config.*`, `pytest.ini` → zero results
- All "plays", "agents", "skills" are text artifacts (`.md`, `.yaml`)

**Implication for "failing regression test" concept:** There is no source code to write unit tests against. The regression test for a fix-it change (e.g., a constraint added to intent.yaml, a new step in SKILL.md) cannot be a unit test in the traditional sense.

**Practical interpretation:** The "regression test" must be implemented as an artifact-level eval:
- A grep/assertion on the compiled SKILL.md for a required string or pattern
- A schema validation check on the updated intent.yaml
- A coverage-matrix check that new constraints are covered

The `evals-creator` skill (invoked by `create-play --build`) already produces these artifact-level checks (SE-* evals). The "regression test authored by tech-designer" for a meta-change to fix-it would be an eval specification — a YAML eval entry describing what to check — rather than a runnable code test.

**Alternative interpretation from Q2 in discovery.md:** "tech-designer writes the failing regression test to the repo's real test path." For a markdown/YAML-only repo, the "real test path" would be a YAML eval file at a known location (e.g., `core/components/plays/fix-it/reference/regression-tests/` or `{stm_base}/{issue}/evidence/fix-it/regression-test.yaml`). The `quality-auditor` would then "run" it by executing the grep/assertion mechanically.

**This is a key design decision that must be resolved before implementation.**

---

## 5. Standards relevant to this change

**From `core/components/memory/standards/rules/_index.md`:**

| File | Relevance to #259 |
|------|-------------------|
| `rules/commits.md` | Governs the chore(stm) evidence commit (unchanged) |
| `rules/pr.md` | PR severity taxonomy for review-pr gate (unchanged) |
| `rules/architecture.md` | Not directly relevant (no arch artifact changes) |
| `rules/scenarios.md` | Scenarios must have binary testable outcomes — new scenarios for TDD/task-list behavior must follow given/when/then with binary verifiable results |

**From `core/components/memory/standards/templates/`:**

| File | Relevance to #259 |
|------|-------------------|
| `templates/issue-comment-rca-approved.md` | Used by background comment dispatch (C13 — unchanged) |
| `templates/checkpoint.md` | Checkpoint format (unchanged — C12 says inline from STM) |
| `templates/delivery-report.md` | Evidence report format — will need new fields for task-list state and regression test result |
| `templates/evidence-file.md` | Evidence schema — may need `task_list` and `regression_test_verdict` fields |

**From `core/components/skills/evals-creator/SKILL.md`:** Called by `create-play` compiler. Receives constraint classifications (`pre-flight`, `artifact-verifiable`, `structural`). New constraints from #259 (e.g., TDD-before-implement, validator≠implementer) will be classified and evals generated for them.

**From `docs/adr/016-agent-json-contract.md`:** Required fields for all Step JSON contracts: `intent_path`, `stm_base`, `stm`, `task_id`. Adding `read_only_files` to Step 6 contract must conform to this schema.

---

## 6. Integration points

### Where new constraints land in intent.yaml

New constraints to add (from discovery.md success criteria):
1. Play is sole writer of task list — sub-agents may propose but not mutate
2. Task list initialized from play template and RCA output before implementation
3. Every implementation task MUST have a failing regression test authored by tech-designer before code-builder is invoked
4. Validation MUST NOT be performed by same agent that implemented
5. Pass/fail verdict MUST come from independent signal — never builder self-report
6. code-builder MUST NOT receive test assertions — only task spec and test file path
7. Only tech-designer (via play re-plan) may modify task validations after initial RCA
8. Per-task retry cap = 2
9. Re-planning triggered only on verification failure after retry exhaustion, or explicit scope-change from tech-designer
10. If re-plan inserts >3 tasks OR total task list >6 → halt and recommend /enhance

Existing constraints to modify:
- **C5 (risk assessment) → REMOVE:** discovery.md Q6: "REMOVE risks entirely from fix-it's design artifact." C5 and its eval SE-4 are deleted. F3 (no alternatives_considered) stays. F4 (no risks) is removed.
- **C4 (alternatives considered) → KEEP**
- **C6 (single checkpoint) → KEEP** — but checkpoint content changes (no risk table)

### SKILL.md regen — what changes on `/create-play --build fix-it`

1. **Step 3 contract** (`rca-and-design`): gains `stm.output.regression_test_path`
2. **Step 3 agent instruction**: tech-designer also authors failing regression test
3. **Step 3 Evals**: SE-4 (risk assessment) is REMOVED; new eval for regression test existence added
4. **New Step 6b** (Verify Fix): quality-auditor contract with `read_only_files` pattern → returns exit-code verdict
5. **Step 6 contract** (implement-fix): gains `read_only_files: [regression_test_path]`; code-builder operates in TDD mode
6. **Step 6 Evals**: new eval — test file checksum unchanged after code-builder
7. **Checkpoint (Step 5)**: risk table section removed from inline markdown (C5 gone)
8. **S2 scenario** (Tech Lead checkpoint): risk table section removed from checkpoint format
9. **Status file** (`fix-it.json`): `task_list` array added
10. **Agent boundary table**: quality-auditor added as domain agent (count: 3→4)
11. **Evidence/close step**: `regression_test_verdict` field added to delivery record
12. **Compilation metadata**: updated intent_hash, new constraint count, new eval counts
