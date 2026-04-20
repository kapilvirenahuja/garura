# Enhancement Discovery — Issue #91

## Issue Body

### Problem
Documentation audit revealed 7 files are outdated, missing, or contradicting the current codebase after the Four Crafts architecture refactor (#85/#86).

### Files to Fix

**Critical (REWRITE)**
- `docs/components/agents.md` — Lists only 1 of 5 agents. No JSON contract, Skill Pool, or Response Format docs
- `docs/components/recipes.md` — Describes old intent pattern. Missing task-driven DAG, JSON contract, incomplete recipe roster

**Major (UPDATE)**
- `docs/components/skills.md` — Lists 10 of 18+ skills
- `docs/philosophy/architecture.md` — No JSON contract pattern, no Four Crafts, stale ADR 007 references
- `docs/framework/recipe-structure.md` — Prescribes linear phases only, missing task DAG variant
- `docs/components/memory.md` — Missing templates/ directory, source path undocumented
- `docs/philosophy/idsd.md` — Agent count wrong, YAML examples where JSON is used

### Root Causes
1. JSON contract pattern not documented anywhere
2. Task-driven DAGs not documented (only linear steps)
3. Four Crafts architecture not documented

---

## Q&A Session

**Q1: Terminology — keep filenames or rename?**
Answer: Rename recipes.md → plays.md and recipe-structure.md → play-structure.md, with redirect notes in the old filenames pointing to the new ones.

**Q2: Scope — fix out-of-scope docs found during rewrite?**
Answer: Yes — fix any other docs encountered that contradict current state (within this PR).

**Q3: JSON contract source of truth?**
Answer: Yes — synthesize from actual play files (e.g., core/components/plays/). Derive canonical example from real play contracts.

**Q4: Four Crafts — current term and composition?**
Answer: Yes, "Four Crafts" is current. The four crafts are: prompt crafting, spec, context, and intent.

**Q5: Success criteria?**
Answer: MD linting + syntax validation (markdownlint or equivalent), then PR review checkpoint.

---

## Resolved Understanding

- 7 target files rewritten/updated
- 2 files renamed (recipes.md → plays.md, recipe-structure.md → play-structure.md) with redirect stubs at old paths
- Any additional stale docs found during work are in-scope for this PR
- JSON contract canonical example derived from core/components/plays/ source files
- Four Crafts = prompt crafting, spec, context, intent
- MD lint + syntax check must pass before PR
