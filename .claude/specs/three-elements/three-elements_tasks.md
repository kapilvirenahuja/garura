# Three Elements of Intent: Task Breakdown

## Dependency Graph

```
Task 1 (commit-code)       ─┐
Task 2 (create-pr)         ─┼──► Task 6 (smoke test)     ──► Done
Task 3 (start-feature)     ─┤
Task 4 (start-planned)     ─┘         │
                                       │
Task 5 (docs update)       ───────────┤
                                       │
                            Task 7 (cross-reference) ──► Done
```

**Parallelism:** Tasks 1-5 are fully parallel. Tasks 6-7 blocked by 1-4.

---

## Task 1: Add Three Elements to commit-code

- **Agent:** code-builder
- **File:** `core/components/recipes/commit-code/SKILL.md`
- **Action:** Add `intent`, `constraints`, `failure_conditions` to YAML front-matter per spec Section 4.1
- **Rules:** Do NOT modify anything below the closing `---` of front-matter. Keep `description` unchanged.
- **Verification:** Gates 1, 2, 3, 4, 5
- **Parallel:** Yes (with Tasks 2, 3, 4, 5)
- **Blocked by:** None

## Task 2: Add Three Elements to create-pr

- **Agent:** code-builder
- **File:** `core/components/recipes/create-pr/SKILL.md`
- **Action:** Add `intent`, `constraints`, `failure_conditions` to YAML front-matter per spec Section 4.2
- **Rules:** Do NOT modify anything below the closing `---` of front-matter. Keep `description` unchanged.
- **Verification:** Gates 1, 2, 3, 4, 5
- **Parallel:** Yes (with Tasks 1, 3, 4, 5)
- **Blocked by:** None

## Task 3: Add Three Elements to start-feature

- **Agent:** code-builder
- **File:** `core/components/recipes/start-feature/SKILL.md`
- **Action:** Add `intent`, `constraints`, `failure_conditions` to YAML front-matter per spec Section 4.3
- **Rules:** Do NOT modify anything below the closing `---` of front-matter. Keep `description` unchanged.
- **Verification:** Gates 1, 2, 3, 4, 5
- **Parallel:** Yes (with Tasks 1, 2, 4, 5)
- **Blocked by:** None

## Task 4: Add Three Elements to start-planned-feature

- **Agent:** code-builder
- **File:** `core/components/recipes/start-planned-feature/SKILL.md`
- **Action:** Add `intent`, `constraints`, `failure_conditions` to YAML front-matter per spec Section 4.4
- **Rules:** Do NOT modify anything below the closing `---` of front-matter. Keep `description` unchanged.
- **Verification:** Gates 1, 2, 3, 4, 5
- **Parallel:** Yes (with Tasks 1, 2, 3, 5)
- **Blocked by:** None

## Task 5: Update recipe documentation

- **Agent:** code-builder
- **File:** `docs/components/phx-recipes.md`
- **Action:**
  1. Update L1 recipe structure template to include `intent`, `constraints`, `failure_conditions`
  2. Update L2 recipe structure template to include same
  3. Add brief section explaining Three Elements requirement, referencing `docs/philosophy/intent-driven-development.md`
- **Verification:** Gate 6
- **Parallel:** Yes (with Tasks 1-4)
- **Blocked by:** None

## Task 6: Deployment smoke test

- **Agent:** quality-validator (or manual)
- **Action:**
  1. Run `sync-claude --project` — verify all recipes deploy to `.claude/skills/`
  2. Confirm each recipe loads without error in Claude Code
- **Verification:** Gate 5
- **Parallel:** No
- **Blocked by:** Tasks 1, 2, 3, 4

## Task 7: Cross-reference verification

- **Agent:** quality-validator (or manual)
- **Action:**
  1. For each recipe, compare front-matter Three Elements against workflow body
  2. Grep for orphaned constraints (MUST/NEVER/forbidden not in front-matter)
  3. Grep for orphaned failure conditions (halt/stop/abort not in front-matter)
  4. Document findings as evidence in `.claude/specs/three-elements/evidence/`
- **Verification:** Gates 3, 4, 7, 8
- **Parallel:** Can run with Task 6
- **Blocked by:** Tasks 1, 2, 3, 4

## Optional Task 8: ADR for Three Elements Convention

- **Agent:** code-builder
- **File:** `docs/adr/009-recipe-three-elements.md` (new)
- **Action:** Create ADR documenting the decision to add Three Elements to front-matter, schema design rationale, and why `description` is kept alongside `intent`
- **Blocked by:** None (can be done anytime)
