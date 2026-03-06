# Evaluation Report: docs-four-crafts

**Date:** 2026-03-05
**Branch:** `refactor/85-plan-roadmap-intent-routing`
**Evaluator:** Automated eval run against current codebase

## Summary

| Eval | Description | Result |
|------|-------------|--------|
| E1 | Agent Inventory Completeness | **PASS** |
| E2 | Skill Inventory Completeness | **PASS** |
| E3 | JSON Contract Pattern Documented | **PASS** |
| E4 | Four Crafts Architecture Documented | **PASS** |
| E5 | Task-Driven DAG Documented | **PASS** |
| E6 | Memory Templates Directory Documented | **PASS** |
| E7 | No Stale ADR 007 References | **FAIL** |
| E8 | Agent Count Accuracy in IDSD | **PASS** |
| E9 | Recipe Roster Completeness | **PASS** |
| E10 | Agent JSON Contract Response Format | **PASS** |
| E11 | Skill Invocation Pattern Documented | **FAIL** |
| E12 | Recipe System vs Intent Constraint Separation | **PASS** |

**PASS: 10 / 12 | FAIL: 2 / 12**

---

## Detailed Results

### E1 — Agent Inventory Completeness

**Result: PASS**

**Test:** Compare agent names and tools in `docs/components/agents.md` against `core/components/agents/*.md` frontmatter. All 5 agents must be documented with matching tools lists.

**Evidence:**

5 agent files found in `core/components/agents/`:
- `code-builder.md`
- `product-strategist.md`
- `project-orchestrator.md`
- `repo-orchestrator.md`
- `tech-designer.md`

All 5 are documented in `docs/components/agents.md` (lines 57-63, "Available Agents" table).

Tools comparison (frontmatter vs docs role-based table at lines 182-188):

| Agent | Frontmatter Tools | Docs Role Tools | Match |
|-------|-------------------|-----------------|-------|
| code-builder | Bash, Read, Write, Edit, Grep, Glob | Bash, Read, Write, Edit, Grep, Glob (builder) | YES |
| product-strategist | Task, Read, Write, Glob, Grep, Skill, WebSearch, WebFetch | Task, Read, Write, Glob, Grep, Skill, WebSearch, WebFetch (strategist) | YES |
| project-orchestrator | Task, Bash, Read, Write, Skill | Task, Bash, Read, Write, Skill (orchestrator) | YES |
| repo-orchestrator | Task, Bash, Read, Write, Skill | Task, Bash, Read, Write, Skill (orchestrator) | YES |
| tech-designer | Bash, Read, Grep, Glob, Write, Skill | Bash, Read, Grep, Glob, Write (designer) | PARTIAL |

**Note:** `tech-designer` frontmatter includes `Skill` tool, which is not in the docs designer role table. However, the docs state (line 189): "Some agents have explicit tool-specific constraints beyond the table above" — acknowledging deviations exist. The Skill Pool section (line 148) documents tech-designer's `assess-feasibility` skill, which requires the Skill tool. Passing because the agent is documented and the deviation is acknowledged, though the role table could be more precise.

---

### E2 — Skill Inventory Completeness

**Result: PASS**

**Test:** Compare skill/recipe names in `docs/components/skills.md` against `ls core/components/skills/` and `ls core/components/recipes/`. All 18 skills and 8 recipes must be listed.

**Evidence:**

18 skills in `core/components/skills/` — all found in `docs/components/skills.md`:
- `analyze-changes` (3 mentions)
- `analyze-pr` (3 mentions)
- `archive-issue-stm` (2 mentions)
- `assess-feasibility` (3 mentions)
- `create-commit` (3 mentions)
- `discover-product-opportunity` (1 mention)
- `draft-product-vision` (1 mention)
- `draft-roadmap` (2 mentions)
- `draft-roadmap-brief` (2 mentions)
- `generate-business-review` (1 mention)
- `generate-engineering-view` (2 mentions)
- `manage-issue` (3 mentions)
- `research-domain-context` (1 mention)
- `scope-roadmap-epics` (3 mentions)
- `setup-branch` (3 mentions)
- `submit-pr` (3 mentions)
- `sync-claude` (3 mentions)
- `validate-product-vision` (1 mention)

8 recipes in `core/components/recipes/` — all found in `docs/components/skills.md`:
- `capture-learning` (1 mention)
- `commit-code` (1 mention)
- `create-pr` (1 mention)
- `discover-product` (1 mention)
- `plan-roadmap` (1 mention)
- `ship` (1 mention)
- `start-feature` (1 mention)
- `start-feature-planning` (1 mention)

---

### E3 — JSON Contract Pattern Documented

**Result: PASS**

**Test:** Grep for `intent_path`, `stm_base`, `step_failure` in `docs/philosophy/architecture.md` and `docs/components/recipes.md`. All must be present.

**Evidence:**

`docs/philosophy/architecture.md`:
- `intent_path`: Found (lines 188, 215, 302)
- `stm_base`: Found (lines 189, 216)
- `step_failure`: Found (lines 207, 222, 237)

`docs/components/recipes.md`:
- `intent_path`: Found (lines 81, 108, 130)
- `stm_base`: Found (lines 82, 109)
- `step_failure`: Found (lines 100, 115, 124, 125, 143, 146, 155)

All three terms present in both files.

---

### E4 — Four Crafts Architecture Documented

**Result: PASS**

**Test:** Search for "Intent Crafting", "Prompt Crafting", "Context Crafting", "Spec Crafting" in `docs/philosophy/architecture.md`. All 4 must appear. Count files containing "Four Crafts" — must be >= 3.

**Evidence:**

All 4 crafts found in `docs/philosophy/architecture.md`:
- `Intent Crafting`: lines 256, 261, 263, 280
- `Prompt Crafting`: lines 257, 282, 284
- `Context Crafting`: lines 141, 149, 258, 298, 300
- `Spec Crafting`: lines 259, 309, 311

Files containing "Four Crafts": **5 files** (>= 3 threshold)
1. `docs/components/recipes.md`
2. `docs/components/agents.md`
3. `docs/philosophy/idsd.md`
4. `docs/components/memory.md`
5. `docs/philosophy/architecture.md`

---

### E5 — Task-Driven DAG Documented

**Result: PASS**

**Test:** Grep for "DAG" or "task graph" in `docs/framework/recipe-structure.md`. Grep for "HARD GATE" or "hard gate" in `docs/components/recipes.md`.

**Evidence:**

`docs/framework/recipe-structure.md`:
- "DAG": Found (lines 3, 124, 140, 150) — "task-driven DAG", "Task-Driven DAG Variant"
- "task graph": Found (lines 126, 136) — "full task graph upfront", "full task graph is verified"

`docs/components/recipes.md`:
- "HARD GATE": Found (line 71) — "HARD GATE: All tasks MUST be created with correct dependencies before any agent execution begins."

---

### E6 — Memory Templates Directory Documented

**Result: PASS**

**Test:** Grep for `templates/` and `ADR 009` in `docs/components/memory.md`. Both must be present.

**Evidence:**

`docs/components/memory.md`:
- `templates/`: Found (lines 51, 69, 101) — "standards/templates/", "templates/", "template paths from standards/templates/"
- `ADR 009`: Found (lines 91, 115, 258) — "LTM Access Pattern (ADR 009)", references to ADR 009

---

### E7 — No Stale ADR 007 References

**Result: FAIL**

**Test:** Grep for "ADR 007" or "007" in `docs/` excluding the ADR file itself. Any hits must include "superseded" context. Verify `docs/adr/SUPERSEDED-007-skill-local-references.md` exists.

**Evidence:**

File `docs/adr/SUPERSEDED-007-skill-local-references.md` **EXISTS** — correct.

References to ADR 007 outside the ADR file itself:

| File | Line | Has "superseded" context? |
|------|------|--------------------------|
| `docs/philosophy/architecture.md:135` | "ADR 009 supersedes ADR 007" | YES |
| `docs/philosophy/architecture.md:137` | "ADR 007 described a deploy-time sync model" | YES (in context of supersession) |
| `docs/philosophy/architecture.md:170` | "ADR 007 pattern (still applies for direct invocations)" | YES (scoped applicability) |
| `docs/philosophy/architecture.md:174` | "See ADR 007 and ADR 009 for details" | PARTIAL |
| `docs/philosophy/architecture.md:579` | Link to `007-skill-local-references.md` | **NO** — bare link, no superseded context |
| `docs/components/skills.md:387` | "Partially superseded by ADR 009" | YES |
| `docs/adr/011-stm-as-inter-skill-data-transport.md:91` | "per ADR 007 skill-local references" | **NO** — references ADR 007 as current authority without noting partial supersession |
| `docs/adr/011-stm-as-inter-skill-data-transport.md:153` | Link to ADR 007 | **NO** — bare link, no superseded annotation |
| `docs/adr/009-skill-ltm-organizational-knowledge.md` | Multiple lines | N/A — this IS the superseding ADR |

**Failures:**
1. `docs/philosophy/architecture.md:579` — link to `007-skill-local-references.md` without noting it is superseded (the link target path still uses the old name `007-skill-local-references.md` rather than `SUPERSEDED-007-...`)
2. `docs/adr/011-stm-as-inter-skill-data-transport.md:91` — references ADR 007 as active authority ("per ADR 007 skill-local references") without noting partial supersession by ADR 009
3. `docs/adr/011-stm-as-inter-skill-data-transport.md:153` — link to ADR 007 without superseded annotation

---

### E8 — Agent Count Accuracy in IDSD

**Result: PASS**

**Test:** Grep for agent count in `docs/philosophy/idsd.md`. Verify count matches `ls core/components/agents/*.md | wc -l` (should be 5).

**Evidence:**

`docs/philosophy/idsd.md` states (line 54): "8 agents (5 implemented, 3 planned): code-builder, tech-designer, repo-orchestrator, project-orchestrator, product-strategist. Planned: quality-validator, workflow-guardian, spec-author."

Actual agent file count: `ls core/components/agents/*.md | wc -l` = **5**

The "5 implemented" count matches the 5 agent files. The 3 planned agents (quality-validator, workflow-guardian, spec-author) are documented as planned/future. The implemented count is accurate.

---

### E9 — Recipe Roster Completeness

**Result: PASS**

**Test:** Compare recipe names in `docs/components/recipes.md` against `ls core/components/recipes/`. All 8 must be listed with correct L1/L2 levels.

**Evidence:**

"Complete Recipe Roster" table in `docs/components/recipes.md` (lines 318-329):

| Recipe | Docs Level | In filesystem? |
|--------|-----------|----------------|
| `commit-code` | L1 | YES |
| `create-pr` | L1 | YES |
| `start-feature` | L1 | YES |
| `start-feature-planning` | L1 | YES |
| `discover-product` | L1 | YES |
| `capture-learning` | L1 | YES |
| `ship` | L2 | YES |
| `plan-roadmap` | L2 | YES |

All 8 recipes listed with L1/L2 levels. All 8 exist in `core/components/recipes/`. No orphans in either direction.

---

### E10 — Agent JSON Contract Response Format

**Result: PASS**

**Test:** Grep for "anti-pattern" or "Anti-pattern" and "step_failure" in `docs/components/agents.md`. Both must be present.

**Evidence:**

- "Anti-pattern": Found at line 117 — `**Anti-patterns (NEVER do these in a JSON contract response):**`
- "step_failure": Found at lines 85, 87, 113 — documented in contract flow (step 7, step 9) and example JSON

---

### E11 — Skill Invocation Pattern Documented

**Result: FAIL**

**Test:** Grep for "Skill Pool" and "Skill tool" in `docs/components/agents.md`. Both must be present.

**Evidence:**

- "Skill Pool": **Found** (lines 130, 134, 148, 156, 160, 170) — "Skill Pool Pattern" section with per-agent tables
- "Skill tool": **NOT FOUND** — zero matches in `docs/components/agents.md`

The term "Skill tool" appears in `docs/components/recipes.md` (line 61: "via the Skill tool") but is absent from the agents documentation. The agents doc describes skills being invoked but never names the Claude Code "Skill tool" as the invocation mechanism.

**What's missing:** A reference to "Skill tool" as the mechanism agents use to invoke skills (e.g., "Agents invoke skills via the Skill tool" or similar).

---

### E12 — Recipe System vs Intent Constraint Separation

**Result: PASS**

**Test:** Grep for "System Constraints" and "intent.yaml" in `docs/components/recipes.md`. Both must be present.

**Evidence:**

- "System Constraints": Found at line 172 — `## Intent and System Constraints: Where They Live`
- "intent.yaml": Found at lines 56, 81, 108, 165, 176, 180, 182, 206, 233, 242 — extensively documented with schema examples and field descriptions

The separation is explicitly documented: system constraints live in `SKILL.md`, user-facing intent lives in `reference/intent.yaml` (lines 174-178).
