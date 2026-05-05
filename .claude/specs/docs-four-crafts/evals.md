# Verification Scenarios — Issue #91

Documentation update to reflect Four Crafts architecture and current component state.

---

## E1 — Agent Inventory Completeness

**What:** `docs/components/agents.md` lists all implemented agents with accurate metadata.

**Pass criteria:**
- All 5 agents documented: code-builder, product-strategist, project-orchestrator, repo-orchestrator, tech-designer
- Each agent entry includes: name, domain, role, tools list
- Tools list per agent matches the `tools:` frontmatter in `core/components/agents/{name}.md`
- No phantom agents (documented but don't exist in code)

**Test:** Compare agent names and tools in docs against `core/components/agents/*.md` frontmatter.

---

## E2 — Skill Inventory Completeness

**What:** `docs/components/skills.md` lists all implemented skills and plays.

**Pass criteria:**
- All 18 skills documented (one entry per directory in `core/components/skills/`)
- All 8 plays documented (one entry per directory in `core/components/plays/`)
- Each entry includes: name, description, category, invocability (user/model)
- No phantom skills (documented but directory doesn't exist)

**Test:** Compare skill/play names in docs against `ls core/components/skills/` and `ls core/components/plays/`.

---

## E3 — JSON Contract Pattern Documented

**What:** The single JSON contract structure is documented in architecture docs.

**Pass criteria:**
- `docs/philosophy/architecture.md` has a section explaining the JSON contract pattern
- The documented contract structure includes fields: `intent_path`, `stm_base`, `slug`, `stm` (with sub-paths), `checkpoints`, `evidence`, `notes`, `step_failure`
- `docs/components/plays.md` explains how the contract flows play → agent → skill → agent → play
- `docs/components/agents.md` explains agent behavior when receiving a JSON contract

**Test:** Grep for "intent_path", "stm_base", "step_failure" in docs/philosophy/architecture.md and docs/components/plays.md. All must be present.

---

## E4 — Four Crafts Architecture Documented

**What:** The Four Crafts model is explained and referenced consistently.

**Pass criteria:**
- `docs/philosophy/architecture.md` has a dedicated "Four Crafts" section
- All four crafts named and defined: Intent Crafting, Prompt Crafting, Context Crafting, Spec Crafting
- Each craft maps to a layer: intent.yaml, play, agent, skill (respectively)
- At least 2 other doc files reference Four Crafts (cross-referencing)

**Test:** Search for "Intent Crafting", "Prompt Crafting", "Context Crafting", "Spec Crafting" in `docs/philosophy/architecture.md`. All 4 must appear. Count files containing "Four Crafts" — must be >= 3.

---

## E5 — Task-Driven DAG Documented

**What:** Task-driven DAG variant for plays is documented.

**Pass criteria:**
- `docs/framework/play-structure.md` has a section for the DAG variant (not just linear phases)
- The DAG variant describes: TaskCreate with dependencies, task graph as HARD GATE before execution, agents update task status
- `docs/components/plays.md` references task graph creation in capability graph section
- "HARD GATE" or equivalent language appears — task graph must be fully created before any agent execution

**Test:** Grep for "DAG" or "task graph" in `docs/framework/play-structure.md`. Grep for "HARD GATE" or "hard gate" in `docs/components/plays.md`.

---

## E6 — Memory Templates Directory Documented

**What:** `docs/components/memory.md` documents the `standards/templates/` directory and LTM access pattern.

**Pass criteria:**
- `standards/templates/` listed as a directory under LTM structure
- At least `roadmap-brief.html` and `epic-schema.md` mentioned as templates
- ADR 009 referenced as the governing decision for template location
- Deployment paths documented: `~/.Garura/core/memory/` (global) and `.Garura/core/memory/` (project)

**Test:** Grep for "templates/" and "ADR 009" in `docs/components/memory.md`. Both must be present.

---

## E7 — No Stale ADR 007 References

**What:** No documentation references ADR 007 as active/current.

**Pass criteria:**
- Zero references to "ADR 007" in docs/ that treat it as active
- Any mention of ADR 007 is accompanied by "superseded" or points to ADR 009
- `docs/adr/SUPERSEDED-007-skill-local-references.md` exists with Status: Superseded

**Test:** Grep for "ADR 007" or "007" in `docs/` excluding the ADR file itself. Any hits must include "superseded" context. Verify SUPERSEDED-007 file exists.

---

## E8 — Agent Count Accuracy in IDSD

**What:** `docs/philosophy/idsd.md` reflects the correct number of implemented agents.

**Pass criteria:**
- Agent count stated as 5 (not 1, not "single agent")
- JSON contract mentioned alongside or instead of YAML-only references
- Agent names match the 5 in `core/components/agents/`

**Test:** Grep for agent count or "agents" in `docs/philosophy/idsd.md`. Verify count matches `ls core/components/agents/*.md | wc -l`.

---

## E9 — Play Roster Completeness

**What:** `docs/components/plays.md` lists all 8 implemented plays with correct levels.

**Pass criteria:**
- All 8 plays listed: capture-learning, commit-code, create-pr, discover-product, plan-roadmap, ship, start-feature, start-feature-planning
- Each play has: name, level (atomic/high-order), description
- Atomic plays: commit-code, create-pr, start-feature
- High-order plays: capture-learning, discover-product, plan-roadmap, ship, start-feature-planning

**Test:** Compare play names in docs against `ls core/components/plays/`.

---

## E10 — Agent JSON Contract Response Format

**What:** `docs/components/agents.md` documents the JSON contract response format agents must follow.

**Pass criteria:**
- Response format section describes: agents return enriched JSON contract (not prose, not YAML)
- Anti-patterns listed (e.g., returning skill YAML, adding prose analysis)
- The `notes` field described as 1-sentence findings (max 3)
- `step_failure` field described for error cases

**Test:** Grep for "anti-pattern" or "Anti-pattern" and "step_failure" in `docs/components/agents.md`. Both must be present.

---

## E11 — Skill Invocation Pattern Documented

**What:** `docs/components/agents.md` documents how agents invoke skills via the Skill tool.

**Pass criteria:**
- Skill Pool pattern described (agents list available skills with triggers and inputs)
- Clear statement that agents invoke skills via the Skill tool (not direct execution)
- Output handling described: agents extract artifact paths from skill output, do NOT forward raw skill YAML

**Test:** Grep for "Skill Pool" and "Skill tool" in `docs/components/agents.md`. Both must be present.

---

## E12 — Play System vs Intent Constraint Separation

**What:** `docs/components/plays.md` distinguishes user-facing intent constraints from system constraints.

**Pass criteria:**
- Intent constraints described as user-facing (goal, failure conditions, scenarios)
- System constraints described as framework-level (agent limits, checkpoint rules, artifact paths)
- `intent.yaml` described as user contract; play SKILL.md described as system contract
- Both exist as separate sections or clearly delineated concepts

**Test:** Grep for "System Constraints" and "intent.yaml" in `docs/components/plays.md`. Both must be present.

---

## Execution Plan

| Eval | Method | Automated? |
|------|--------|-----------|
| E1 | Diff agent list in docs vs `core/components/agents/` | Yes — grep + compare |
| E2 | Diff skill/play list in docs vs `core/components/skills/` + `plays/` | Yes — grep + compare |
| E3 | Grep for contract fields in architecture + plays docs | Yes — grep |
| E4 | Grep for Four Crafts terms in architecture doc | Yes — grep |
| E5 | Grep for DAG/task graph in play-structure + plays docs | Yes — grep |
| E6 | Grep for templates/ and ADR 009 in memory doc | Yes — grep |
| E7 | Grep for ADR 007 in docs/, verify SUPERSEDED file | Yes — grep + file check |
| E8 | Grep for agent count in IDSD doc, compare with code | Yes — grep + count |
| E9 | Diff play list in docs vs `core/components/plays/` | Yes — grep + compare |
| E10 | Grep for anti-pattern + step_failure in agents doc | Yes — grep |
| E11 | Grep for Skill Pool + Skill tool in agents doc | Yes — grep |
| E12 | Grep for System Constraints + intent.yaml in plays doc | Yes — grep |

All 12 evals are automatable via grep/compare against codebase.
