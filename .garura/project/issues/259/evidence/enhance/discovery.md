# Discovery — Issue #259

## Issue Summary

**Title:** [ENH] /fix-it — leaner per-task validation with task-list anchor and failure-triggered re-planning
**State:** open
**Labels:** enhancement
**URL:** https://github.com/kapilvirenahuja/garura/issues/259

Enhancement to the `/fix-it` play itself. Adds anti-reward-hacking mechanisms (TDD, validator≠implementer, independent-signal verdicts) and a leaner task-list discipline, scoped smaller than the parallel #258 work on `/enhance`.

## User Args (from /enhance invocation)

1. Remove risk taxonomy from fix-it
2. Keep the single RCA checkpoint — that stays the only stop
3. Introduce TDD for implementation if applicable
4. Keep raise-pr + review-pr as quality gates
5. (Revised after clarification) KEEP the background issue comment (RCA upload on Tether)
6. Issue closure happens via `/ship` — no additional closure logic
7. No end gate — ship autonomously after the single checkpoint

## Q&A

### Q1. Task list implementation
**Answer:** File-based, extend existing `status/fix-it.json` with a `task_list` array. No Claude Code TaskCreate dependency. Play writes; agents read-only.

### Q2. Immutable test spec for the implementer
**Answer:** Option (a). tech-designer writes the failing regression test to the repo's real test path. code-builder's contract includes source file paths to fix but **excludes** the test file path — contract-level isolation.

### Q3. Retry cap and verification executor
**Answer:** Retry cap = 2 per task (confirmed). Verification runs via `quality-auditor` agent which returns exit-code verdict. Preserves validator≠implementer boundary.

### Q4. Scope guard escalation to /enhance
**Answer:** REMOVE. User expects the invoker to know which play to use. Replace with a simple sanity check in the play (not escalation logic).

### Q5. Background issue comment (C13)
**Answer:** KEEP. RCA-approved comment posted to the issue on Tether is the design intent — retain as-is.

### Q6. Risk taxonomy / risks in design artifact
**Answer:** REMOVE risks entirely from fix-it's design artifact. No severity, no typed risks.

## Success Criteria for the Enhancement

- `/fix-it` intent.yaml updated with new constraints covering: TDD-before-implement, validator≠implementer, retry cap=2 with re-plan on verification fail, play-owned task list, contract-level test-file isolation for code-builder, risks removed from design artifact.
- SKILL.md rebuilt via `/create-play --rebuild fix-it` (never hand-edited).
- New regression test exists exercising the TDD flow or task-list mutation guard.
- PR merges via `/ship`; issue #259 closes on merge.

## Out of Scope (explicit)

- Changes to `/enhance` play (no changes as part of #259)
- DAG / per-step re-planning checkpoint
- Scope-guard escalation logic
- Any multi-task orchestration machinery in fix-it
