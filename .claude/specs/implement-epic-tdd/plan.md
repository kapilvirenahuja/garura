# Implementation Plan: implement-epic TDD Redesign

**Spec:** `.claude/specs/implement-epic-tdd/spec.md`
**Issue:** #179
**Branch:** `feat/179-implement-epic-tdd-redesign`

---

## Execution Waves

### Wave 1 — File Changes (all parallel)

| Task | File | What | Agent |
|------|------|------|-------|
| T1 | `intent.yaml` | Add constraints C17-C23 | code-builder |
| T2 | `intent.yaml` | Modify constraints C5, C14, C15, C16 | code-builder |
| T3 | `intent.yaml` | Add failure conditions F15-F22 | code-builder |
| T4 | `intent.yaml` | Add scenarios S9-S12 | code-builder |
| T5 | `intent.yaml` | Update top-level intent statement | code-builder |
| T6 | `engineering-manager.md` | CREATE new agent definition | code-builder |
| T7 | `code-builder.md` | Add read_only_files, remove "test first" | code-builder |
| T8 | `quality-auditor.md` | Add QP thresholds to report schema | code-builder |

**Parallelism:** T1-T5 are same file (single session). T6, T7, T8 are independent files (parallel with each other and T1-T5).

### Wave 2 — Documentation (depends on T6)

| Task | File | What | Agent |
|------|------|------|-------|
| T9 | `docs/components/agents.md` | Add engineering-manager, note test-writer | code-builder |
| T10 | `docs/adr/004-agent-naming.md` | Add "manager" role, note test-writer exception | code-builder |

### Serial — Play Compilation

| Task | What | Depends On |
|------|------|------------|
| T11 | `/create-play --build implement-epic` | T1-T10 all complete |
| T12 | `/create-play --review` | T11 |
| T13 | `/skill-creator` review | T12 |

---

## Dependency Graph

```
T1-T5 (intent.yaml) ──────┐
T6 (engineering-manager) ──┤
T7 (code-builder) ─────────┤──> T11 (rebake) ──> T12 (review) ──> T13 (skill-creator)
T8 (quality-auditor) ──────┤
T9 (agents.md, needs T6) ──┤
T10 (ADR 004, needs T6) ───┘
```

## Risk Areas

1. **Rebake scope:** Major SKILL.md rewrite — new steps 3b/6a/6b/7b/10b/11b/12b, new sub-role concept (test-writer), hard quality gate, unified remediation. May need manual guidance during interactive rebake.
2. **test-writer as sub-role:** Not a standalone agent file. Play compiler may not have seen this pattern before.
3. **Docs staleness:** agents.md lists 5 agents but 11 exist. Minimal update (add EM only) vs full refresh is a scope decision.
