# create-play Evidence — enhance play rebuild (#348)

**Play:** create-play (rebake mode)
**Issue:** #348
**Completed:** 2026-05-04T04:25:03Z
**Branch:** feature/348-add-issue-discovery-to-enhance-play

---

## Summary

Rebuilt the enhance play to add automatic issue discovery (C1 Path B / C23). When invoked without `--issue` and no issue is resolvable from the branch name, the play now queries open enhancement candidates and presents a numbered list for the user to select.

---

## Intent Changes

**File:** `core/components/plays/enhance/reference/intent.yaml`

Changes from prior compilation:
- **C1 updated** — two-path rule: Path A (from `--issue` or branch name), Path B (discovery trigger)
- **C23 added** — discovery query: state=open, no-assignee, label=enhancement OR no-label, sort=updated_desc, cap=5, numbered presentation, user selection 1-5 or 'none', re-validate open
- **F15 added** — zero candidates → hard halt, no enhance-stage artifacts produced
- **S9 added** — developer browses issues before enhancing, picks one, full flow proceeds

---

## Steps Executed

| Step | Output |
|------|--------|
| T4 Deep read | play-analysis.md |
| T5 Intent update | intent.yaml updated (C23, F15, S9, C1 split) |
| T6 Skill inventory | skill-manifest.yaml |
| T7 Evals + compile | evals.yaml, SKILL.md (edited), coverage-matrix.md |
| T8 Agent audit (P1-P11) | agent-audit-*.md for all 6 agents; code-builder upgraded |
| T9 Skill extension | manage-issue v1.2.0 — new `list` action |

---

## Files Modified

| File | Change |
|------|--------|
| `core/components/plays/enhance/reference/intent.yaml` | C1 updated, C23/F15/S9 added |
| `core/components/plays/enhance/SKILL.md` | Step 0a added, pre-flight updated, SE-1b/SE-19/SE-20/SCE-9 added, Step 0a config.instructions pinned to manage-issue list action |
| `core/components/skills/manage-issue/SKILL.md` | v1.1.0 → v1.2.0, `list` action added |
| `core/components/agents/code-builder.md` | P3 + P10 gaps fixed: intent_path in contract schema, Task Graph section added |

---

## Agent Audit Results

| Agent | Result |
|-------|--------|
| project-orchestrator | 11/11 PASS |
| tech-designer | 11/11 PASS |
| code-builder | 11/11 PASS (after upgrade: P3 intent_path + P10 Task Graph) |
| judge | 11/11 PASS |
| quality-auditor | 11/11 PASS |
| repo-orchestrator | 11/11 PASS |

---

## Eval Coverage

| Type | Count | IDs |
|------|-------|-----|
| Step evals | 23 | SE-1 through SE-20 (+ SE-9b, SE-10b) |
| Scenario evals | 9 | SCE-1 through SCE-9 |
| Constraints covered | 23 | C1-C23 |
| Failure conditions covered | 15 | F1-F15 |

---

## Compilation Metadata

| Field | Value |
|-------|-------|
| intent_hash | sha256:b914e806444c7dd3d0fac11e84207eb87e3bf880a8ae737ad000245c758f4841 |
| compiled_by | create-play (rebake) |
| compiled_at | 2026-05-04 |
| workflow_structure | A |
