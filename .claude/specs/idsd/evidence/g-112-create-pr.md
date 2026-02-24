# T-112: Verify create-pr (G-901, G-904)

**Date:** 2026-02-23
**Spec Reference:** idsd-tasks.md P12: create-pr
**Gate Reference:** G-901 (IDD intent propagation), G-904 (Tether/Vanish)

---

## Verification Results

### ✅ G-901: IDD Intent Propagation

**Checkpoint:** `create-pr` recipe passes intent string to repo-orchestrator invocation.

**Evidence:**
```markdown
File: core/components/recipes/create-pr/SKILL.md

Step 1 (Analyze):
Intent to propagate: Pass the following as the first line of the agent invocation context:
"Intent: analyze: PR readiness for branch {branch_name} — generate evidence-based quality checklist distinguishing blocking from optional items"

Step 3 (Execute):
Intent to propagate: Pass the following as the first line of the agent invocation context:
"Intent: submit: pull request for issue #{issue-number} on branch {branch_name} — include quality checklist and issue link in PR body"
```

✅ **Format compliance:** Both intent strings follow canonical format `"Intent: {verb}: {artifact} — {context_hint}"`
✅ **Intent propagation:** Explicit passing to repo-orchestrator calls documented

---

### ✅ G-904: Tether/Vanish Checkpoint Pattern

**Checkpoint:** `create-pr` recipe uses Tether/Vanish at approval point (no AskUserQuestion).

**Evidence:**
```markdown
File: core/components/recipes/create-pr/SKILL.md line 84, 203:

Type **Tether** to create the PR or **Vanish** to cancel.
```

✅ **Checkpoint present:** After checkpoint analysis, before PR creation
✅ **Pattern compliant:** Output-and-wait, no AskUserQuestion tool used
✅ **Parse rules:** Tether/Vanish responses documented

---

### ✅ IDD Intent Header

**Evidence:**
```markdown
File: core/components/recipes/create-pr/SKILL.md lines 8-27:

intent: >
  Submit work for peer review via a pull request with dynamically generated,
  evidence-based quality assurance.

constraints:
  - MUST be associated with a GitHub issue extracted from branch name (NWWI)
  - Always checkpoint before PR creation — PRs are externally visible
  - Quality checklist MUST distinguish must-have (blocking) from nice-to-have items
  - Orchestrator MUST delegate to agents — never execute gh commands directly
  - Maximum 1 distinct agent (repo-orchestrator); may be called multiple times
  - Recovery agent calls are exempt from the agent limit

failure_conditions:
  - No issue number extractable from the current branch name
  - No commits to push (branch has no unpushed commits vs target)
  - Branch conflicts with target branch (merge conflicts detected)
  - User rejects proposed PR at checkpoint (Vanish)
  - Blocking quality checklist items have FAIL status
  - PR creation fails on the remote
```

✅ **Intent header:** Present and complete (intent, constraints, failure_conditions)
✅ **Structured failures:** Added for no-commits and branch-conflicts cases

---

### ✅ Agent Routing

✅ **Single agent:** repo-orchestrator (invoked for analyze-pr and submit-pr skills)
✅ **Agent-first:** No direct Bash, Grep, Glob, or git/gh commands used
✅ **PR body:** Includes quality checklist and issue link (existing design)
✅ **No AskUserQuestion:** All checkpoints use Tether/Vanish pattern

---

### ✅ Verification Gates

| Gate | Criterion | Status |
|------|-----------|--------|
| G-901 | Intent propagated to repo-orchestrator | ✅ |
| G-904 | Tether/Vanish checkpoint, no AskUserQuestion | ✅ |
| IDD Header | intent/constraints/failure_conditions | ✅ |
| Structured Failure: No Commits | Documented in failure_conditions | ✅ |
| Structured Failure: Branch Conflicts | Documented in failure_conditions | ✅ |
| Intent Format | `"Intent: {verb}: {artifact} — {context_hint}"` | ✅ |
| Deployment | File synced to ~/.claude/skills/create-pr/ | ✅ |

---

---

## Template Externalization (Post-Verification Update)

**Change:** Moved inline templates to external files per Meridian pattern (like start-feature-planning).

**Templates Externalized:**
- `templates/checkpoint.md` — STM artifact for checkpoint step
- `templates/approval-prompt.md` — User approval prompt with Tether/Vanish
- `templates/final-report.md` — Post-PR creation summary report

**References Updated in SKILL.md:**

Step 2 (Checkpoint):
```
Write artifact to STM: `.meridian/{issue-number}/checkpoint/create-pr/{YYYYMMDD-HHMMSS}.md` using `templates/checkpoint.md` with Status: `PENDING_APPROVAL`.

Present the approval prompt using `templates/approval-prompt.md`. Wait for `Tether` or `Vanish`.
```

Step 4 (Report):
```
Present the final report using `templates/final-report.md`.
```

**References Section:**
Added `## References` table documenting all three templates and their usage.

**Status Emoji Mapping Table:** Added for clarity (PASS → ✅, FAIL → ❌, REVIEW → ⏳).

**Version:** 2.1.0 → 2.2.0

**Deployment:** Templates synced to `~/.claude/skills/create-pr/templates/`

---

## Summary

**Status:** ✅ PASS (with enhancements)

All verification criteria met. `create-pr` recipe v2.2.0:
- ✅ Has IDD intent header with intent/constraints/failure_conditions
- ✅ Propagates intent to repo-orchestrator calls in canonical format
- ✅ Uses Tether/Vanish checkpoint pattern (no AskUserQuestion)
- ✅ Documents structured failures for no-commits and branch-conflicts cases
- ✅ Delegates to single agent (repo-orchestrator)
- ✅ Includes PR body with quality checklist and issue link
- ✅ Templates externalized (checkpoint, approval-prompt, final-report)
- ✅ Deployed to ~/.claude/skills/create-pr/

**All Tasks Complete:**
- T-110: Review ✅
- T-111: IDD fixes + Structured failures ✅
- T-112: Verification ✅
- T-113: Deploy (sync-claude) ✅
