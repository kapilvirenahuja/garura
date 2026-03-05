# Tasks: /ship L2 Recipe

---

## Dependency Graph

```
T1 (intent.yaml) ─────────────────────────────────┐
T3 (checkpoint.md template) ──────────────────────┤ Wave 1 (parallel)
T4 (guardian-decision.md template) ───────────────┤
T5 (final-report.md template) ───────────────────┘
                                                   │
T1 ──→ T2 (SKILL.md) ─────────────────────────────┤ Wave 2 (depends on T1)
                                                   │
T1-T5 ──→ T6 (structural verification) ──────────┤ Wave 3
                                                   │
T6 ──→ T7 (behavioral verification) ─────────────┤ Wave 4
                                                   │
T7 ──→ T8 (template verification) ───────────────┤
                                                   │
T8 ──→ T9 (sync-claude) ─────────────────────────┤ Wave 5
                                                   │
T9 ──→ T10 (integration walkthrough) ────────────┤ Wave 6
                                                   │
T10 ──→ T11 (docs update) ───────────────────────┤ Wave 7
                                                   │
T11 ──→ T12 (final verification sweep) ──────────┘
```

---

## Tasks

### T1: Create intent.yaml
**File:** `core/components/recipes/ship/reference/intent.yaml`
**Agent:** Direct edit (structured YAML, follows existing pattern)
**Blocked by:** None
**Parallelizable:** Yes — Wave 1
**Verification:** G-004

### T2: Create SKILL.md
**File:** `core/components/recipes/ship/SKILL.md`
**Agent:** code-builder sub-agent (largest artifact, L2 recipe pattern)
**Blocked by:** T1 (references intent.yaml constraint IDs)
**Parallelizable:** No — Wave 2
**Description:** Create the L2 recipe SKILL.md with:
- Frontmatter: `name: ship`, `user-invocable: true`, `model: sonnet`
- Intent section with load directive
- Role section — orchestrator pattern, forbidden tools
- Phase table — 7 steps (0-6) with agents and L1 references
- Full workflow for each step with recipe context, expected output, guardian evaluation
- Skip-logic for conditional steps
- Guardian decision matrix (inline)
- Halt presentation format
- Self-resolution strategies with CAN/CANNOT boundaries
- Recovery section
- Version table: Level L2, Distinct Agents 2
**Verification:** G-002, G-003, G-005, G-006, G-007, G-008, G-009, G-010, G-015, G-016, G-017, G-018, G-019

### T3: Create checkpoint.md template
**File:** `core/components/recipes/ship/templates/checkpoint.md`
**Agent:** Direct edit (template following checkpoint schema)
**Blocked by:** None
**Parallelizable:** Yes — Wave 1
**Verification:** G-012

### T4: Create guardian-decision.md template
**File:** `core/components/recipes/ship/templates/guardian-decision.md`
**Agent:** Direct edit (small template)
**Blocked by:** None
**Parallelizable:** Yes — Wave 1
**Verification:** G-013

### T5: Create final-report.md template
**File:** `core/components/recipes/ship/templates/final-report.md`
**Agent:** Direct edit (template following existing patterns)
**Blocked by:** None
**Parallelizable:** Yes — Wave 1
**Verification:** G-014

### T6: Structural verification (Phase 1 gates)
**Agent:** Explore sub-agent (read-only)
**Blocked by:** T1, T2, T3, T4, T5
**Parallelizable:** No — Wave 3
**Action:** Run gates G-001 through G-005. Record evidence.
**Verification:** Phase 1 gates

### T7: Behavioral verification (Phase 2 gates)
**Agent:** Explore sub-agent (read-only)
**Blocked by:** T6
**Parallelizable:** No — Wave 4
**Action:** Run gates G-006 through G-011, G-017, G-018, G-019. Record evidence.
**Verification:** Phase 2 gates

### T8: Template verification (Phase 3 gates)
**Agent:** Explore sub-agent (read-only)
**Blocked by:** T7
**Parallelizable:** No — Wave 4
**Action:** Run gates G-012 through G-015. Record evidence.
**Verification:** Phase 3 gates

### T9: Sync recipe to deployment
**Agent:** Direct — invoke `/sync-claude`
**Blocked by:** T8
**Parallelizable:** No — Wave 5
**Action:** Run `/sync-claude` to deploy recipe.
**Verification:** G-020

### T10: Integration walkthrough
**Agent:** Explore sub-agent (read-only dry run)
**Blocked by:** T9
**Parallelizable:** No — Wave 6
**Action:** Trace through full ship workflow on deployed recipe:
1. Verify pre-flight checks reference correct constraint IDs
2. Verify L1 invocation patterns match commit-code/create-pr expectations
3. Verify repo-orchestrator output contracts match agent definition
4. Verify evidence path matches config.yaml STM pattern
5. Verify skip-logic handles all edge cases
**Verification:** G-016

### T11: Update component documentation
**Agent:** Direct edit
**Blocked by:** T10
**Parallelizable:** No — Wave 7
**Action:** Update `docs/components/recipes.md` to include `ship` recipe.
**Verification:** G-021

### T12: Final verification sweep
**Agent:** Explore sub-agent (comprehensive)
**Blocked by:** T11
**Parallelizable:** No — Wave 7
**Action:** Run ALL gates G-001 through G-021. Generate final evidence at `.claude/specs/ship-recipe/evidence/final-verification.md`.
**Verification:** All gates pass

---

## Parallelization Plan

| Wave | Tasks | Can Parallel | Notes |
|------|-------|--------------|-------|
| 1 | T1, T3, T4, T5 | Yes — all 4 | Independent file creation |
| 2 | T2 | No — single task | Depends on T1 (intent.yaml IDs) |
| 3 | T6 | No — single task | Needs all files from Wave 1+2 |
| 4 | T7, T8 | Yes — 2 | Behavioral + template verification can parallel |
| 5 | T9 | No — single task | Deployment |
| 6 | T10 | No — single task | Integration check |
| 7 | T11, T12 | Sequential | T12 depends on T11 |

---

## Agent Assignment Summary

| Task | Agent Type | Rationale |
|------|-----------|-----------|
| T1 | Direct edit | Small structured YAML |
| T2 | code-builder | Largest artifact, complex L2 pattern |
| T3 | Direct edit | Template following schema |
| T4 | Direct edit | Small template |
| T5 | Direct edit | Template following patterns |
| T6 | Explore | Read-only verification |
| T7 | Explore | Read-only verification |
| T8 | Explore | Read-only verification |
| T9 | Direct (sync) | Invoke existing skill |
| T10 | Explore | Read-only walkthrough |
| T11 | Direct edit | Documentation update |
| T12 | Explore | Comprehensive sweep |

---

## Risk Register

| Risk | Impact | Mitigation |
|------|--------|------------|
| L1 recipes may not support auto_approve context from L2 | High | T2 defines how ship_context is passed; L1 checkpoint logic may need minor update (track as discovered task) |
| repo-orchestrator has no merge skill | Medium | Agent uses `gh pr merge` via Bash — verify during T10 that this is within agent's allowed Bash scope |
| First L2 recipe — no precedent | Medium | Spec based on ADR 001/003; T10 walkthrough catches misalignment |
| Auto-approve may bypass genuine issues | Low | Evidence trail enables post-hoc audit; guardian halts on known blocker categories |
