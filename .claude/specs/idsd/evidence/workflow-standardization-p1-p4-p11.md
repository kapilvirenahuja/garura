# Workflow Standardization — P1, P4, P11

**Date:** 2026-02-23
**Tasks:** Fix P1 start-feature workflow gaps, Fix P4 start-feature-planning workflow gaps
**Status:** ✅ COMPLETED
**Deployment:** Synced to `~/.claude/skills/` (global mode)

---

## Intent

Ensure P1 (start-feature), P4 (start-feature-planning), and P11 (commit-code) recipes all have consistent, mandatory workflow phases with explicit pre-flight, checkpoint, execution, and report steps — matching the commit-code reference pattern (G-300).

---

## P11 commit-code — Reference Pattern

✅ **No changes needed.** Reference implementation with all four phases complete:

| Phase | Step | Key Elements |
|-------|------|--------------|
| **Pre-flight** | Step 0 | Delegate to repo-orchestrator with recipe context code block + expected output YAML; forward PASS/FAIL results to all subsequent steps |
| **Checkpoint** | Step 3 | Write artifact BEFORE approval (Status: PENDING_APPROVAL) → Tether/Vanish → update Status |
| **Execution** | Step 4 | Per-action invocations with recipe context + expected output YAML; failure path with recovery |
| **Report** | Step 5 | Update checkpoint artifact + write evidence + final report template |

---

## P1 start-feature — GAPS FIXED

### Gaps Identified

1. ❌ Pre-flight results NOT propagated to Step 1 (Resolve Issue)
2. ❌ Step 3 (Branch + STM) execution lacks expected output YAML block
3. ❌ No failure/recovery handling in Step 3
4. ❌ Checkpoint artifact never updated after Step 4 Report completion
5. ⚠️ Templates not explicitly referenced in Step 2 workflow text

### Fixes Applied

#### Gap 1: Pre-flight Result Propagation
**Before:**
```
### Step 0 — Pre-flight
Evaluate pre-flight constraints before invoking any agent:
- **C1 (RESUME only):** ...
- **C2:** ...
```

**After:**
```
### Step 0 — Pre-flight
**C2** (orchestrator evaluates directly): ...
**C1** (requires git state — invoke `repo-orchestrator`): ...

Provide recipe context:
[code block with task]

Expected output:
[YAML with C1: PASS|FAIL, C2: PASS]

Pass pre-flight results to all subsequent agent invocations:
[code block with C1 and C2 results]
```

✅ **Result:** Pre-flight results now explicitly forwarded to Step 1.

#### Gap 2 & 3: Expected Output YAML + Failure Path

**Before:**
```
**NEW mode:** Invoke `repo-orchestrator` with task: "Create and push branch... Return branch name and push status."
**RESUME mode:** Invoke `repo-orchestrator` with task: "Checkout existing branch... Return branch name and current status."
```

**After:**
```
[Recipe context code block with pre_flight results included]

Expected output (both modes):
[YAML with success, branch, status, error fields]

If `success: false` → invoke recovery (see Recovery section). Max 2 retries.
```

✅ **Result:** Expected output now structured in YAML. Failure path with recovery protocol documented.

#### Gap 4: Checkpoint Artifact Update in Report

**Before:**
```
### Step 4 — Report
Write evidence to `.meridian/{issue}/evidence/start-feature/{ts}.md`:
- Mode (NEW / RESUME)
- Issue number and title
- Branch created or checked out
- STM initialized or verified

Present final report to user using `templates/feature-started.md`.
```

**After:**
```
### Step 4 — Report
Write evidence to `.meridian/{issue}/evidence/start-feature/{ts}.md`:
- Mode (NEW / RESUME)
- Issue number and title
- Branch created or checked out
- STM initialized or verified

Update checkpoint artifact `.meridian/{issue}/checkpoint/start-feature/{same-timestamp}.md` (NEW mode only):
- Append branch created and STM initialized with confirmation status

Present final report to user using `templates/feature-started.md`.
```

✅ **Result:** Checkpoint artifact now updated after Step 4 completion (NEW mode only).

#### Gap 5: Template Explicit Reference

**Before:**
```
Write checkpoint artifact to `.meridian/{issue}/checkpoint/start-feature/{ts}.md` with Status: `PENDING_APPROVAL`.
```

**After:**
```
Write checkpoint artifact to `.meridian/{issue}/checkpoint/start-feature/{ts}.md` using `templates/checkpoint.md` with Status: `PENDING_APPROVAL`.
```

✅ **Result:** Template usage now explicit in Step 2.

---

## P4 start-feature-planning — GAPS FIXED

### Gaps Identified

1. ❌ Pre-flight results hardcoded in Step 1/2 (not dynamically forwarded)
2. ❌ Checkpoint artifact write deferred to Step 5 (should be Step 4, BEFORE approval)
3. ❌ Checkpoint Status field management not explicit (no PENDING_APPROVAL state transition)
4. ❌ Step 5 (Create Branch) execution lacks expected output YAML block
5. ❌ No failure/recovery handling in Step 5
6. ❌ Checkpoint artifact never updated after Step 6 Report completion
7. ❌ No failure path if Step 2 (Plan sub-agent) returns incomplete output

### Fixes Applied

#### Gap 7: Failure Path for Step 2 Plan Output

**Added at start of Step 2:**
```
If Plan sub-agent returns output missing any of the three sections (SPEC, VERIFY, TASKS) → halt with: "Plan sub-agent produced incomplete output — missing required section(s). Cannot proceed without complete planning artifacts."
```

✅ **Result:** Plan sub-agent failure condition now documented.

#### Gap 1: Pre-flight Results Forwarded Consistently

**Changed in Step 2 Plan sub-agent prompt:**
```
Before: (no pre-flight context in prompt)

After:
Pre-flight:
  C1: {PASS|FAIL}
  C2: {PASS|FAIL}
```

✅ **Result:** Plan sub-agent now receives pre-flight results dynamically.

#### Gap 2 & 3: Checkpoint Artifact Timing and Status Management

**Before:**
```
### Step 4 — Checkpoint
Present plan summary using `templates/approval-prompt.md`. Do NOT use EnterPlanMode or AskUserQuestion.
Parse: `Tether`/`tether` → proceed to Step 5. `Vanish`/`vanish` → halt, checkpoint REJECTED. Else → clarify.

### Step 5 — Create Branch
Write checkpoint artifact to `.meridian/{issue}/checkpoint/start-feature-planning/{ts}.md` using `templates/checkpoint.md` with Status: APPROVED. Do not delegate this write.
```

**After:**
```
### Step 4 — Checkpoint
Write checkpoint artifact to `.meridian/{issue}/checkpoint/start-feature-planning/{ts}.md` using `templates/checkpoint.md` with Status: `PENDING_APPROVAL`.

Present plan summary using `templates/approval-prompt.md`. Do NOT use EnterPlanMode or AskUserQuestion.

Parse: `Tether`/`tether` → update artifact Status to `APPROVED`, proceed to Step 5. `Vanish`/`vanish` → update artifact Status to `REJECTED`, halt. Else → clarify.

### Step 5 — Create Branch
[Invoke repo-orchestrator]
```

✅ **Result:** Checkpoint artifact now written BEFORE approval (Step 4) with Status management explicit.

#### Gap 4 & 5: Expected Output YAML + Failure Path for Step 5

**Before:**
```
Invoke `repo-orchestrator` with task: "Create and push branch `{type}/{issue_number}-{slug}` from main. Return branch name and push status."
```

**After:**
```
Invoke `repo-orchestrator`:

[Recipe context code block with pre_flight results included]

Expected output:
[YAML with success, branch, status, error fields]

If `success: false` → invoke recovery (see Recovery section). Max 2 retries.
```

✅ **Result:** Expected output now structured in YAML. Failure path with recovery documented.

#### Gap 6: Checkpoint Artifact Update in Report

**Before:**
```
### Step 6 — Report
Write evidence to `.meridian/{issue}/evidence/start-feature-planning/{ts}.md`:
- Issue number and title
- Branch created
- Planning artifacts written (spec, verify, tasks)

Present final report to user using `templates/feature-started.md`.
```

**After:**
```
### Step 6 — Report
Write evidence to `.meridian/{issue}/evidence/start-feature-planning/{ts}.md`:
- Issue number and title
- Branch created
- Planning artifacts written (spec, verify, tasks — with file paths)

Update checkpoint artifact `.meridian/{issue}/checkpoint/start-feature-planning/{same-timestamp}.md`:
- Append branch created and planning artifacts written with confirmation status

Present final report to user using `templates/feature-started.md`.
```

✅ **Result:** Checkpoint artifact now updated after Step 6 completion.

---

## P1, P4, P11 — Workflow Phases Comparison

All three recipes now follow the same four-phase pattern:

| Recipe | Phase | Step | Checkpoint | Recipe Context | Expected Output | Failure Path | Evidence |
|--------|-------|------|------------|-----------------|-----------------|--------------|----------|
| **P1** | Pre-flight | 0 | — | ✅ Code block | ✅ YAML | ✅ (Step 0) | — |
| **P1** | Checkpoint | 2 | ✅ Tether/Vanish | — | — | — | ✅ Artifact updated in Step 4 |
| **P1** | Execution | 3 | — | ✅ Code block | ✅ YAML | ✅ Recovery | — |
| **P1** | Report | 4 | — | — | — | — | ✅ Evidence + checkpoint update |
| **P4** | Pre-flight | 0 | — | ✅ Code block | ✅ YAML | ✅ (Step 0) | — |
| **P4** | Checkpoint | 4 | ✅ Tether/Vanish | — | — | — | ✅ Artifact written BEFORE approval |
| **P4** | Execution | 5 | — | ✅ Code block | ✅ YAML | ✅ Recovery | — |
| **P4** | Report | 6 | — | — | — | — | ✅ Evidence + checkpoint update |
| **P11** | Pre-flight | 0 | — | ✅ Code block | ✅ YAML | ✅ (Step 0) | — |
| **P11** | Checkpoint | 3 | ✅ Tether/Vanish | — | — | — | ✅ Artifact with status management |
| **P11** | Execution | 4 | — | ✅ Code block | ✅ YAML | ✅ Recovery | — |
| **P11** | Report | 5 | — | — | — | — | ✅ Evidence + checkpoint update |

---

## Verification Checklist

- [x] P1 (start-feature): Pre-flight results forwarded to subsequent steps
- [x] P1: Step 3 execution has expected output YAML block
- [x] P1: Step 3 failure path with recovery documented
- [x] P1: Checkpoint artifact updated in Report step
- [x] P1: Templates explicitly referenced in workflow
- [x] P4 (start-feature-planning): Pre-flight results forwarded to Plan sub-agent
- [x] P4: Checkpoint artifact written BEFORE approval (Step 4, not Step 5)
- [x] P4: Checkpoint Status field management explicit (PENDING_APPROVAL → APPROVED/REJECTED)
- [x] P4: Step 5 execution has expected output YAML block
- [x] P4: Step 5 failure path with recovery documented
- [x] P4: Checkpoint artifact updated in Report step
- [x] P4: Failure path for incomplete Plan sub-agent output documented
- [x] P11 (commit-code): Reference pattern — no changes needed
- [x] All three recipes now follow consistent four-phase workflow: pre-flight → checkpoint → execution → report
- [x] All three recipes deployed to `~/.claude/skills/` (global mode)

---

## Files Updated

- `/Users/kapilahuja/cto/builder/phoenix-os/core/components/recipes/start-feature/SKILL.md`
- `/Users/kapilahuja/cto/builder/phoenix-os/core/components/recipes/start-feature-planning/SKILL.md`

## Files Deployed

- `~/.claude/skills/start-feature` (P1)
- `~/.claude/skills/start-feature-planning` (P4)
- `~/.claude/skills/commit-code` (P11 — reference)

---

## Status

✅ **COMPLETE.** P1, P4, and P11 now have consistent, standardized workflows with mandatory pre-flight, checkpoint, execution, and report phases. All structural gaps closed. Deployed globally.
