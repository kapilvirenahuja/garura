# Gap Analysis Report — /enhance Play

**Generated:** 2026-04-16
**Play:** `core/components/plays/enhance/SKILL.md`
**Intent:** `core/components/plays/enhance/reference/intent.yaml`
**Evals:** `.meridian/project/issues/245/evidence/create-recipe/enhance/evals.yaml`

---

## Summary

| Check | ID | Result | Details |
|-------|----|--------|---------|
| Constraint Coverage | G1 | **PASS** | All 18 constraints (C1-C18) covered by ≥1 SE-n eval |
| Failure Condition Coverage | G2 | **PASS** | All 10 failure conditions (F1-F10) covered by ≥1 SE-n eval |
| Scenario Coverage | G3 | **PASS** | All 7 scenarios (S1-S7) covered by ≥1 SCE-n eval |
| Skill Existence | G4 | **PASS** | All 3 referenced skills exist on disk |
| Agent Existence | G5 | **PASS** | All 6 agents exist at `core/components/agents/{name}.md` |
| Skill-Agent Alignment | G6 | **PASS** | All skill-to-agent assignments match agent skill inventories |
| Contract Schema | G7 | **PASS** | All 10 JSON contracts contain required fields |
| Template References | G8 | **PASS** | No template paths referenced (vacuously true) |
| Intent Hash Drift | G9 | **PASS** | Compiled hash matches actual intent.yaml hash |
| Required Sections | G10 | **PASS** | All 9 required sections present in SKILL.md |
| Skill LTM Input Coverage | G11 | **PASS** | Skills self-discover LTM; play provides `ltm_context` where needed |

---

## Detailed Findings

### G1 — Constraint Coverage

All 18 constraints mapped to step evals:

| Constraint | Eval(s) | Location |
|------------|---------|----------|
| C1 | SE-1 | Pre-flight table + Step 1 |
| C2 | SE-2 | Pre-flight table + Step 2 |
| C3 | SE-4 | Step 3 (Q&A Discovery) |
| C4 | SE-5 | Step 4 (Context Assembly) |
| C5 | SE-3 | Pre-flight table + Step 4 |
| C6 | SE-6 | Step 5 (Scope Gate) |
| C7 | SE-7 | Step 6 (Approach Design) |
| C8 | SE-7 | Step 6 (Approach Design) |
| C9 | SE-8 | Step 7 (Mid-Checkpoint) |
| C10 | SE-8 | Step 7 (Mid-Checkpoint) |
| C11 | SE-9 | Step 8 (Implement) |
| C12 | SE-11 | Step 9a (Fix Loop) |
| C13 | SE-10 | Step 9 (Self-Evaluation) |
| C14 | SE-12 | Step 10 (Judge Rating) |
| C15 | SE-13 | Step 10a (Judge Gate) |
| C16 | SE-14 | Step 11 (Quality Check) |
| C17 | SE-15 | Step 14 (PR Checkpoint) |
| C18 | SE-16 | Step 15 (Ship) |

Pre-flight constraints in pre-flight table: C1 (issue resolvable), C2 (branch guard), C5 (product_base resolution). ✓

**Result: PASS — 18/18 constraints covered.**

### G2 — Failure Condition Coverage

| Failure Condition | Eval(s) | Description |
|-------------------|---------|-------------|
| F1 | SE-15 | Implementation proceeds without PR checkpoint approval |
| F2 | SE-13 | Judge confidence < 0.6, play proceeds without human approval |
| F3 | SE-11 | Fix loop exhausted (3 iterations) |
| F4 | SE-6 | Scope gate out-of-range but play continues |
| F5 | SE-5 | Context assembly skipped |
| F6 | SE-4 | Q&A discovery skipped |
| F7 | SE-14 | PR created without quality checks passing |
| F8 | SE-8 | Mid-checkpoint configured ON but skipped |
| F9 | SE-7 | Approach missing alternatives_considered or evals |
| F10 | SE-12 | Judge receives builder prompts or self-eval results |

**Result: PASS — 10/10 failure conditions covered.**

### G3 — Scenario Coverage

| Scenario | Eval | Persona |
|----------|------|---------|
| S1 | SCE-1 | Developer enhancing a Meridian play (happy path) |
| S2 | SCE-2 | Developer with a large enhancement (redirect to /prepare) |
| S3 | SCE-3 | Developer with a trivial fix (redirect to fix-it) |
| S4 | SCE-4 | Developer with a risky enhancement (low judge confidence) |
| S5 | SCE-5 | Developer using --approve-plan (mid-checkpoint ON) |
| S6 | SCE-6 | Developer reviewing PR (PR checkpoint) |
| S7 | SCE-7 | Developer with eval failures (fix loop) |

**Result: PASS — 7/7 scenarios covered.**

### G4 — Skill Existence

| Skill | Referenced In | Path | Exists |
|-------|---------------|------|--------|
| `manage-issue` | Step 1 (validate-issue) | `core/components/skills/manage-issue/SKILL.md` | ✓ |
| `setup-branch` | Step 2 (create-branch) | `core/components/skills/setup-branch/SKILL.md` | ✓ |
| `analyze-pr` | Step 13 (PR review) | `core/components/skills/analyze-pr/SKILL.md` | ✓ |

**Result: PASS — 3/3 skills found.**

### G5 — Agent Existence

| Agent | Type | Path | Exists |
|-------|------|------|--------|
| `project-orchestrator` | domain | `core/components/agents/project-orchestrator.md` | ✓ |
| `tech-designer` | domain | `core/components/agents/tech-designer.md` | ✓ |
| `code-builder` | domain | `core/components/agents/code-builder.md` | ✓ |
| `judge` | domain | `core/components/agents/judge.md` | ✓ |
| `quality-auditor` | domain | `core/components/agents/quality-auditor.md` | ✓ |
| `repo-orchestrator` | utility | `core/components/agents/repo-orchestrator.md` | ✓ |

**Result: PASS — 6/6 agents found.**

### G6 — Skill-Agent Alignment

| Skill | Assigned To | In Agent's Skill Inventory? |
|-------|-------------|----------------------------|
| `manage-issue` | `project-orchestrator` (Step 1) | ✓ Listed in Available Skills table (line 142) |
| `setup-branch` | `repo-orchestrator` (Step 2) | ✓ Listed in Available Skills table (line 149) |
| `analyze-pr` | play (Step 13 — directly invoked) | N/A — play-owned, not agent-delegated |

Note: Step 13 invokes `analyze-pr` directly from the play rather than delegating to `repo-orchestrator`, which owns `analyze-pr` in its skill inventory. This is a **design observation** (not a gap per G6 rules) — the play explicitly declares Step 13 as "Owner: play (invokes review/analyze-pr skill)". Since G6 checks only agent-assigned skills, this passes.

Commit/PR/merge operations in Steps 12, 15, 17 are delegated to `repo-orchestrator` which owns `create-commit`, `submit-pr`, `merge-pr` in its skill table. ✓

**Result: PASS — all agent-assigned skills are in their respective inventories.**

### G7 — Contract Schema

All 10 JSON contracts checked for required fields (`intent_path`, `stm_base`, `stm`, `task_id`):

| Step | task_id | intent_path | stm_base | stm | task_id |
|------|---------|-------------|----------|-----|---------|
| Step 1 | validate-issue | ✓ | ✓ | ✓ | ✓ |
| Step 2 | create-branch | ✓ | ✓ | ✓ | ✓ |
| Step 4 | context-assembly | ✓ | ✓ | ✓ | ✓ |
| Step 6 | approach-design | ✓ | ✓ | ✓ | ✓ |
| Step 8 | implement | ✓ | ✓ | ✓ | ✓ |
| Step 10 | judge-rating | ✓ | ✓ | ✓ | ✓ |
| Step 11 | quality-check | ✓ | ✓ | ✓ | ✓ |
| Step 12 | commit-pr | ✓ | ✓ | ✓ | ✓ |
| Step 15 | ship | ✓ | ✓ | ✓ | ✓ |
| Step 17 | evidence-commit | ✓ | ✓ | ✓ | ✓ |

**Result: PASS — all 10 contracts have required schema fields.**

### G8 — Template References

No template file paths (e.g., `templates/*.md`, `reference/*.yaml`) are referenced from the play SKILL.md that would need to exist at specific paths. The play references `intent.yaml` via `intent_path` (covered by G9) and STM paths (dynamic). The `analyze-pr` skill has its own `reference/` directory with `quality-rules.md` and `branch-patterns.md` (both verified to exist).

**Result: PASS — no unresolved template references.**

### G9 — Intent Hash Drift

| Field | Value |
|-------|-------|
| Compiled hash in SKILL.md | `sha256:a105a58a8a42d3413f80ba204f2c8c4a8ec1e5de67b033ca6e4e743fb2a7dc6a` |
| Actual SHA-256 of intent.yaml | `a105a58a8a42d3413f80ba204f2c8c4a8ec1e5de67b033ca6e4e743fb2a7dc6a` |
| Match | ✓ |

**Result: PASS — no drift detected.**

### G10 — Required Sections

| Section | Present | Location |
|---------|---------|----------|
| Frontmatter (YAML `---` block) | ✓ | Lines 1-6 |
| Header (`# enhance`) | ✓ | Line 8 |
| Compiled From | ✓ | `## Compiled From` |
| Role | ✓ | `## Role` |
| Pre-flight | ✓ | `## Pre-flight` |
| Workflow | ✓ | `## Workflow` |
| Scenario Validation | ✓ | `### Phase: Scenario Validation` |
| Pause and Resume | ✓ | `## Pause and Resume` |
| Compilation Metadata | ✓ | `## Compilation Metadata` |

**Result: PASS — 9/9 required sections present.**

### G11 — Skill LTM Input Coverage

| Skill | LTM Required | Play Provides LTM Discovery? | Notes |
|-------|-------------|------------------------------|-------|
| `manage-issue` | `~/.meridian/core/memory/standards/templates/github-issue.md` (create action only) | N/A — play uses `read` action only | No LTM needed for `read` action |
| `setup-branch` | None | N/A | No LTM inputs |
| `analyze-pr` | `~/.meridian/core/memory/standards/rules/commits.md` | Self-discovered by skill | Skill hardcodes LTM path; play doesn't need to provide it |

Additionally, Step 4 (context-assembly via `tech-designer`) provides `ltm_context` with `product_base` and `core_base` paths, enabling the agent to discover and load relevant LTM for context assembly. ✓

**Result: PASS — all skill LTM inputs are either self-discovered or provided by the play.**

---

## Design Observations (not gaps)

1. **Step 13 — Play-owned skill invocation:** The play directly invokes `analyze-pr` rather than delegating to `repo-orchestrator` (which owns `analyze-pr`). This is explicitly declared as "Owner: play" and does not violate G6, but it does diverge from the "Agent-First" principle stated in AGENTS.md/CLAUDE.md. If this is intentional (e.g., to avoid an extra agent hop for a read-only analysis), it's fine. If not, consider delegating Step 13 to `repo-orchestrator`.

2. **Step 13 — No JSON contract:** Step 13 is the only agent/skill invocation step without a JSON contract. All other steps (1, 2, 4, 6, 8, 10, 11, 12, 15, 17) have explicit JSON contracts. Step 13 says "invokes review/analyze-pr skill" but doesn't show the contract format.

---

## Final Result

**11/11 PASS, 0 GAPs found.**

The /enhance play is fully aligned with its intent.yaml. All constraints, failure conditions, and scenarios have eval coverage. All referenced skills and agents exist. All JSON contracts follow the required schema. The intent hash is current. All required sections are present.
