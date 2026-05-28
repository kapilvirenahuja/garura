# Discovery — Issue #393

## Issue Body (verbatim from GitHub)

**Title:** [ENH] Add GitLab support to /review-pr and the platform adapter layer
**Labels:** enhancement
**State:** OPEN
**URL:** https://github.com/kapilvirenahuja/garura/issues/393

`/review-pr` is hard-wired to GitHub. Every PR operation in the play and in `repo-orchestrator` runs through `gh` — `gh pr view`, `gh pr diff`, `gh pr comment`, `gh pr edit --add-reviewer`, `gh api repos/...`. None of that works on GitLab. A real-world ask — "review this GitLab MR" — halts at the very first step.

The issue calls for three layers of work:

1. **Platform detection** — a memory module that resolves `github | gitlab | azure-devops` from the working repo's `git remote -v`. Every skill that calls a code-host tool reads from this resolver, not from a hard-coded `gh`.
2. **Config schema** — `.garura/core/config.yaml` accepts a `gitlab:` block parallel to `github:` carrying `host`, `owner`, `name`. Pre-flight in every issue-filing or PR skill resolves the right block based on the detected platform.
3. **Adapter** — a thin shim exposing verbs (`view-pr`, `diff-pr`, `comment-pr`, `request-changes`, `add-reviewer`, `create-issue`, `add-label`) and routing each verb to `gh` or `glab` based on platform. Every code-host-touching play stops calling `gh`/`glab` directly.

Evidence cited in issue:
- `gh pr view 445 -R nagarro-digital/phoenix-os` halts with GraphQL error.
- `glab mr view 445 -R dx_innovations/phoenix/phoenix-os` resolves cleanly.
- `find .claude/skills/review-pr -type f | xargs grep -l -i gitlab` returns zero hits.
- `which glab` returns nothing on the workstation (out of scope per Q3).

## Q&A

### Q1 — Adapter shape: skill or agent?

**Answer:** New skill. Agents call this skill; the skill owns gh/glab routing.

Implication: a new skill (working name `platform-adapter` or `repo-cli`) exposes the verb interface. `repo-orchestrator` and other agents call it. Plays do not call the skill directly — they call the agent.

### Q2 — Scope of this PR

**Answer:** All. Else we leave a gap.

Every play and every agent that currently calls `gh` must be converted in this PR. From the grep earlier: 22 files across `core/components/`. No follow-on chore PRs left behind.

### Q3 — `glab` installation handling

**Answer:** Assume present. Out of scope. Pre-flight check is OK but no installation handling.

Implication: when platform-detection resolves `gitlab` and `glab` is missing, the adapter raises a clear pre-flight halt with an install hint. Bootstrap/install is not this PR.

### Q4 — Auth model

**Answer:** Not in scope. Assume `glab` already has a working token on the workstation.

Implication: no `glab auth login` flow in this PR. If auth fails the adapter surfaces the underlying error verbatim.

### Q5 — GitLab vocabulary (`pr` vs `mr`)

**Answer:** One command name. The underlying tool integration does not change the shape of our tool.

Implication: `/review-pr` stays the single command. Internal verbs stay `view-pr` / `diff-pr` / `comment-pr` / etc. regardless of host. On GitLab the adapter translates internally to `glab mr view` etc., but the user-facing surface and the verb names do not change.

## Decisions captured

| Decision | Choice |
|----------|--------|
| Adapter location | New skill (called by agents) |
| Conversion scope | All `gh`-calling files in this PR (~12–14 after de-dup) |
| `glab` installation | Out of scope; pre-flight halts if missing |
| Auth setup | Out of scope; assume working token |
| Command/verb naming | One name across hosts |
| `request-changes` on GitLab | Option A1 — set MR to draft via `glab mr update --draft` AND post the structured comment (behavioral parity with GitHub's blocking review) |
| Sub-issue attach on GitLab | Option B2 — fallback to GitLab "related issues" link (preserves connection; loses parent/child hierarchy) |
| Platform resolution | Read `platform:` from `.garura/core/config.yaml` (NOT `git remote -v`). Config is authoritative. |
| submit-pr & merge-pr | CONVERT to the new verb-adapter. Retire their `reference/{platform}/` subdirs into the adapter's reference. One dispatch pattern across the codebase. |
| Agent forbidden tables | Expand to forbid direct `gh` AND `glab` CLI usage in every agent — require the adapter. |

## Success criteria (derived)

1. A repo whose `git remote -v` points at `gitlab.com` or `git.nagarro.com` can run `/review-pr <MR-number>` and complete the full play end-to-end with a posted comment.
2. The same `/review-pr <PR-number>` flow on a GitHub repo still works identically (regression-free).
3. No source file under `core/components/` invokes `gh` or `glab` directly — every call goes through the new adapter skill.
4. Pre-flight halts with a clear install hint when platform is `gitlab` and `which glab` returns nothing.
5. Config schema accepts a parallel `gitlab:` block.
6. KB carries a `memory/tools/gitlab/` adapter doc paralleling the existing `memory/tools/github/`.
