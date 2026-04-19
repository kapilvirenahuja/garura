# Discovery — Issue #262

**Title:** [DEF][Medium] /fix-it generates heavy HTML brief instead of inline markdown RCA; missing parallel issue-update on approval
**State:** open
**Assignee:** @kapilvirenahuja
**Reporter:** user observation during /fix-it run on #261
**Branch:** enhance/262-fix-it-lean-rca
**Discovery completed:** 2026-04-19

## Issue body (verbatim)

### Problem

Two coupled issues in the /fix-it workflow around the approval checkpoint:

1. **Heavy HTML brief.** Step 4 dispatches `doc-builder` to produce an HTML brief (`briefs/rca-design-brief.html`) from RCA + design YAML. For fix-it's scope (single root cause, linear fix), an HTML artifact is over-engineered — it takes ~5 minutes to generate, produces a file the user mostly won't open, and the orchestrator still has to summarize it inline at the checkpoint anyway. The RCA YAML is already a clear structured artifact; what the user needs at the gate is a concise markdown summary, not a standalone HTML page.

2. **No issue-record write on approval.** When the user approves (Tether), the RCA and plan never get recorded on the GitHub issue itself. The evidence lives only in local STM (`.garura/project/issues/{n}/evidence/fix-it/`). This breaks audit trail for anyone reading the issue on GitHub — they see the original defect report but not the RCA conclusion or the fix plan until the PR lands.

### Expected Behavior

**Step 4 — replace with inline markdown summary (no doc-builder call):**
- The play renders the RCA + fix-design summary directly as markdown in the checkpoint message to the user.
- Sections: Root Cause, Blast Radius (table), Proposed Fix (execution steps), Alternatives with rejection reasons, Risks with severity, Confidence.
- No HTML generation, no doc-builder invocation, no `briefs/` subdirectory.
- Source of truth for the summary is the existing `rca.yaml` and `design.yaml` in STM.

**Step 5 — on Tether approval, fire parallel sub-agent to record on GitHub issue:**
- When the user types Tether, the play dispatches `project-orchestrator` (or `repo-orchestrator` with manage-issue context) via the Agent tool with `run_in_background: true`, so the issue-update runs in parallel with the transition to Step 6 (implementation).
- The parallel agent posts a comment on the originating issue containing: RCA root-cause summary, blast radius, fix strategy, approved-by-user timestamp, PR link (when available later — initial comment can be updated or followed up).
- Implementation (Step 6) does NOT wait on the issue-update comment.

### Impact

- **Speed:** fix-it loses ~5 minutes per run on HTML generation that adds little value for this play's scope.
- **Audit gap:** GitHub issues do not reflect RCA conclusions or approved fix plans — reviewers must open local STM to see what was decided.
- **Over-delegation:** doc-builder is an HTML-specialist agent; invoking it for fix-it's simple structured summary is the kind of over-engineering fix-it is explicitly designed to avoid.
- **Consistency:** /enhance (heavier play) presents its approach inline at its mid-checkpoint (Step 7) without an HTML brief. /fix-it should follow the same pattern for its lighter scope.

### Related

- #258 (/enhance per-task validation) — analogous simplification philosophy
- #259 (/fix-it leaner scope) — same play, same direction of travel
- #261 — the /fix-it run that surfaced this defect

## Q&A (resolved with user 2026-04-19)

### Q1 — Rebake discipline

**Question:** SKILL.md is compiled. Should changes go through `intent.yaml` + `/create-play --rebuild fix-it`, or edit SKILL.md directly?

**Answer (user, 2026-04-19):** intent.yaml + rebuild.

**Implication for approach:**
- Primary edit surface: `core/components/plays/fix-it/reference/intent.yaml`
- Regenerate: `core/components/plays/fix-it/SKILL.md` via `/create-play --rebuild fix-it`
- Do NOT hand-edit SKILL.md
- Do NOT edit the compiled artifact in `~/.claude/skills/fix-it/` directly — it is a deployment target. After rebuild, `/sync-claude` picks up the change.

### Q2 — Initial GitHub issue comment template

**Question:** Exact shape of the comment the background agent posts when the user Tethers?

**Answer (user, 2026-04-19):** Accept the recommended template; save as a canonical template under `core/components/memory/standards/templates/`.

**Outcome:** `core/components/memory/standards/templates/issue-comment-rca-approved.md` created and registered in `_index.md`. The fix-it play (and any future play producing `rca.yaml` + `design.yaml`) references this template instead of inlining the shape.

**Template sections:** Approved header (user + timestamp + play + STM path), Root Cause, Blast Radius (table), Fix Strategy (ordered), Alternatives Considered (with rejection), Risks (table), Confidence, PR pending marker.

### Q3 — PR link handling (initial comment + follow-up)

**Question:** When the PR opens later, edit the original comment in place or append a new comment?

**Answer (user, 2026-04-19):** Append-only.

**Implication for approach:**
- Initial approval comment contains `**PR:** _pending — will follow up when opened_`
- When the PR is subsequently opened by the fix-it play (Step 7 create-pr or equivalent), a second comment is appended with `## PR Opened` + PR URL + branch + timestamp
- Editing in place is forbidden — keeps the approval event as a distinct timeline entry for audit

### Q4 — Background agent lifecycle

**Question:** Does the play track the background agent and surface its status at close, or fire-and-forget?

**Answer (user, 2026-04-19):** Track + record, never block.

**Implication for approach:**
- At Step 5 dispatch time: record the background agent ID in `{stm_base}/{issue}/evidence/fix-it/issue-comment-agent.yaml` with fields `agent_id`, `dispatched_at`, `target_issue`, `status: pending`
- Implementation (Step 6) proceeds immediately — no wait
- At the evidence step (final step of fix-it): read the background agent's final status; update the STM record with `status: completed|failed`, `completed_at`, and `error` (if failed)
- If failed: evidence file records the failure; play does NOT retry and does NOT halt. The user sees the failure in the final report and can manually re-post if needed.

## Integration points identified

| File / surface | Role in this change |
|----------------|---------------------|
| `core/components/plays/fix-it/reference/intent.yaml` | Primary edit surface — add/modify constraints C-X (inline markdown), C-X+1 (parallel issue-update on Tether, background, tracked), failure condition F-X (heavy HTML brief forbidden) |
| `core/components/plays/fix-it/SKILL.md` | Regenerated via `/create-play --rebuild fix-it` |
| `core/components/memory/standards/templates/issue-comment-rca-approved.md` | Newly created canonical template — Step 5 references it |
| `core/components/memory/standards/templates/_index.md` | Updated to register the new template |
| `core/components/plays/fix-it/reference/` | Check for doc-builder invocation spec referenced by Step 4; remove or retarget |
| `core/components/agents/doc-builder/` | No change — just stop invoking it from fix-it |

## Success criteria (specific)

1. fix-it intent.yaml declares: approval checkpoint uses inline markdown summary; no HTML brief; no doc-builder invocation.
2. fix-it intent.yaml declares: on Tether approval, a background agent posts a single comment to the originating issue, using the `issue-comment-rca-approved.md` template.
3. fix-it intent.yaml declares: implementation step does NOT wait on the issue-update agent.
4. fix-it intent.yaml declares: play tracks the background agent ID and records its final status in STM at play close.
5. SKILL.md regenerated via `/create-play --rebuild fix-it` and reflects all four declarations in its compiled Steps 4, 5, and evidence step.
6. `briefs/rca-design-brief.html` is never produced by a fix-it run post-fix.
7. A follow-up PR-opened comment is appended (not edited) when the fix-it PR is later created.
