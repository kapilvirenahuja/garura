# Context Understanding — Issue #393
## GitLab adapter layer + /review-pr GitLab support

---

## 1. Current state — gh usage map

Every file under `core/components/` that calls `gh` verbs, found via:
`grep -rn 'gh ' core/components/ | grep -E 'gh (pr|api|issue|run|workflow)'`

### Skills (direct gh callers)

| File | gh verbs used | Role |
|------|--------------|------|
| `core/components/skills/analyze-pr/SKILL.md` (lines 47–48) | `gh pr diff {pr_number}`, `gh pr view {pr_number} --json ...` | Fetches PR diff and metadata when pr_number supplied (PR-scoped mode) |
| `core/components/skills/manage-issue/SKILL.md` (lines 45, 57, 73, 84, 133, 144, 151, 161, 168, 174, 180, 191, 194) | `gh issue view`, `gh issue create`, `gh issue list`, `gh issue close`, `gh issue comment`, `gh api /repos/{owner}/{repo}/issues/{n}/sub_issues` | Full issue CRUD + sub-issue attachment |
| `core/components/skills/manage-issue/reference/github-issue.md` (lines 10, 18, 26, 39–48, 81, 113, 116) | same as above + `gh repo view`, `gh api /repos/...` | Platform reference doc that the SKILL.md instructions defer to |
| `core/components/skills/archive-issue-stm/SKILL.md` (line 42) | `gh issue view {issue_number} --json closedAt` | Derives close date to compute archive bucket |
| `core/components/skills/submit-pr/SKILL.md` | (reads via `reference/{platform}/pr.md` dispatch) | Dispatches through platform reference — GitHub path uses `gh pr create`, `gh pr view`, `gh pr list`, `gh pr status`, `gh pr checks` (see `reference/github/pr.md` lines 18, 32, 40, 48, 56) |
| `core/components/skills/submit-pr/reference/github/pr.md` (lines 18, 32, 40, 48, 56) | `gh pr create`, `gh pr view`, `gh pr list`, `gh pr status`, `gh pr checks` | GitHub-specific PR operations for submit-pr |
| `core/components/skills/merge-pr/SKILL.md` | (reads via `reference/{platform}/merge.md` dispatch) | Dispatches through platform reference — GitHub path uses `gh pr view`, `gh pr merge` |
| `core/components/skills/merge-pr/reference/github/merge.md` (lines 10, 18, 26) | `gh pr view --json ...`, `gh pr merge {pr_number}` | GitHub-specific merge operations for merge-pr |

### Plays (direct gh callers — the ones that bypass the adapter model)

| File | gh verbs used | Role |
|------|--------------|------|
| `core/components/plays/review-pr/SKILL.md` (lines 37, 107, 343, 346, 347, 358, 479) | `gh pr view {pr_number} --json ...`, `gh pr diff {pr_number}`, `gh api repos/{owner}/{repo}/issues/comments/{comment_id} -X PATCH`, `gh pr comment`, `gh pr review {pr_number} --request-changes`, `gh pr edit {pr_number} --add-reviewer {selected}` | Pre-flight context fetch (Step 0, delegated to repo-orchestrator) and Step 5 comment/routing actions — all expressed as direct gh invocations in the play text |
| `core/components/plays/merge-pr/SKILL.md` (line 72) | `gh pr view --json number,state,baseRefName,mergeable` | Auto-detect PR in pre-flight |
| `core/components/plays/enhance/SKILL.md` (line 733) | `gh pr diff`, `gh pr view` | analyze-pr invocation description notes these as the backing calls |

### Agents (references — not direct calls, policy/guidance only)

| File | gh verbs referenced | Role |
|------|-------------------|------|
| `core/components/agents/repo-orchestrator.md` (line 399) | `gh pr merge`, `git checkout + git pull` | Forbidden list: "use merge-pr skill instead" |
| `core/components/agents/project-orchestrator.md` (lines 332–335) | `gh issue create`, `gh issue view`, `gh issue list`, `gh issue close`, `gh api` | Forbidden list: "use manage-issue skill instead" |
| `core/components/agents/code-builder.md` (line 290) | `gh pr create` | Forbidden list: "repo-orchestrator handles PRs" |
| `core/components/agents/knowledge-extractor.md` (line 314) | `gh pr diff {pr_number}` | Documents that `pr_diff` input is sourced from this command |

### KB / Standards (documentation references)

| File | gh verbs | Role |
|------|---------|------|
| `core/components/memory/standards/templates/github-issue.md` (lines 3, 56) | `gh issue create` | Template reference for issue creation |
| `core/components/memory/standards/templates/issue-comment-rca-approved.md` (lines 44, 81) | `gh api user -q .login`, `gh issue comment {issue_number}` | RCA-approved comment template |
| `core/components/memory/standards/templates/pr-review-comment.md` (lines 50, 51) | `gh api repos/{owner}/{repo}/issues/comments/{comment_id} -X PATCH`, `gh pr comment` | PR comment update/create procedure |

---

## 2. Verb inventory needed

Complete union of distinct `gh` verbs in use, with `glab` mapping:

| gh verb | Purpose | glab equivalent | Notes / gaps |
|---------|---------|----------------|-------------|
| `gh pr view` | Fetch PR metadata (json) | `glab mr view {mr_number} --output json` | Clean analog; field names differ (e.g., `headRefName` → `source_branch`) |
| `gh pr diff` | Fetch PR unified diff | `glab mr diff {mr_number}` | Clean analog |
| `gh pr comment` | Post comment on PR | `glab mr note {mr_number} --message "..."` | Clean analog; glab calls comments "notes" |
| `gh pr review --request-changes` | Request changes blocking merge | `glab mr approve --no-approve` / `glab mr update --draft` | **Partial gap**: glab has no direct "request changes" state. Closest: `glab mr update {mr_number}` sets WIP/draft, or a note is posted. Needs design decision — flag in approach.yaml |
| `gh pr edit --add-reviewer` | Add reviewer to PR | `glab mr update {mr_number} --reviewer {user}` | Clean analog via `glab mr update` |
| `gh pr create` | Create pull/merge request | `glab mr create --title ... --description ... --target-branch ...` | Clean analog; already covered in `reference/gitlab/pr.md` |
| `gh pr merge` | Merge PR | `glab mr merge {mr_number}` | Clean analog; already covered in `reference/gitlab/merge.md` |
| `gh pr list` | List open PRs | `glab mr list --output json` | Clean analog |
| `gh pr status` | PR status summary | `glab mr status` | Clean analog |
| `gh pr checks` | CI check status | `glab ci status` | Clean analog; already in `reference/gitlab/pr.md` |
| `gh api repos/{owner}/{repo}/issues/comments/{id} -X PATCH` | Update existing PR comment in place | `glab api projects/{id}/notes/{note_id} -X PUT` | **Design needed**: GitLab uses project numeric ID, not `owner/repo`. Adapter must resolve project ID from `git remote -v` or config |
| `gh issue view` | Read issue details | `glab issue view {number} --output json` | Clean analog |
| `gh issue create` | Create issue | `glab issue create --title ... --description ...` | Clean analog |
| `gh issue list` | Search/list issues | `glab issue list --search "..." --output json` | Clean analog |
| `gh issue close` | Close issue | `glab issue close {number}` | Clean analog; `--reason` flag has no glab equivalent — omit silently on GitLab |
| `gh issue comment` | Post comment on issue | `glab issue note {number} --message "..."` | Clean analog |
| `gh api /repos/{owner}/{repo}/issues/{n}/sub_issues` | Attach sub-issue | **No glab equivalent** | **Hard gap**: GitLab has "related issues" (not parent/child). Sub-issue attachment via adapter is undefined for GitLab. Must be documented as unsupported and skipped on GitLab platform |
| `gh repo view --json nameWithOwner` | Get `owner/repo` slug | `glab repo view` or parse from `git remote -v` | `glab repo view` output format differs; safer to parse from remote URL |
| `gh api user -q .login` | Get current user login | `glab api user \| jq '.username'` | Clean analog with jq |

**Gaps requiring design decisions in approach.yaml:**
1. `gh pr review --request-changes` has no direct `glab` analog — the adapter's `request-changes` verb needs a defined GitLab implementation (post-a-WIP note? set MR to draft? document as advisory-only?).
2. `gh api repos/{owner}/{repo}/issues/{n}/sub_issues` — sub-issues are a GitHub-specific concept. On GitLab this adapter verb must either be a no-op with a logged warning, or raise a structured error.
3. Comment update in-place via REST: GitHub uses `issues/comments/{id}` path; GitLab uses `projects/{project_id}/notes/{note_id}`. The adapter must resolve the GitLab project numeric ID.

---

## 3. Existing KB landmarks

`core/components/memory/tools/` does **not exist** — confirmed via filesystem check. There is no `memory/tools/github/` directory today.

The closest equivalent docs live in the skills' own `reference/` subdirectories:
- `core/components/skills/manage-issue/reference/github-issue.md` — full GitHub issue CLI/API reference for the manage-issue skill
- `core/components/skills/submit-pr/reference/github/pr.md` — GitHub PR commands for submit-pr
- `core/components/skills/submit-pr/reference/gitlab/pr.md` — GitLab MR commands (already exists)
- `core/components/skills/submit-pr/reference/bitbucket/pr.md` — Bitbucket commands (already exists)
- `core/components/skills/merge-pr/reference/github/merge.md` — GitHub merge commands
- `core/components/skills/merge-pr/reference/gitlab/merge.md` — GitLab merge commands (already exists)
- `core/components/skills/merge-pr/reference/bitbucket/merge.md` — Bitbucket merge commands (already exists)

The `memory/standards/templates/` directory contains:
- `github-issue.md` — Issue creation template (GitHub-specific; will need a `gitlab-issue.md` sibling or the template must be made platform-aware)
- `pr-review-comment.md` — Review comment shape (platform-neutral shape but references `gh api` and `gh pr comment` in the Update Behavior section — lines 50–51)

**Implication for the new KB doc:** There is no `memory/tools/` directory to create a `github/` sibling under. The correct home for a new platform KB doc is either:
- `core/components/memory/tools/github/` and `core/components/memory/tools/gitlab/` (creating the tools/ namespace fresh), or
- Keep platform docs inside each skill's `reference/` subdirectory (existing pattern for submit-pr and merge-pr).

The issue calls for a `memory/tools/gitlab/` adapter doc. Since no `memory/tools/` exists today, this PR must also create `memory/tools/github/` as the baseline — both directories created in the same PR.

---

## 4. Config schema today

From `.garura/core/config.yaml`:

```yaml
platform: github        # line 7 — single active platform

github:                 # lines 9–12
  repo: https://github.com/kapilvirenahuja/garura.git
  owner: kapilvirenahuja
  name: garura
```

No `gitlab:` block exists today.

**What a parallel `gitlab:` block must carry:**

```yaml
gitlab:
  host: gitlab.com          # or git.nagarro.com for self-hosted
  owner: dx_innovations/phoenix   # group path (may be nested)
  name: phoenix-os          # project name
```

Note: GitLab's `owner` is a group path, not a simple username. Nested groups (e.g., `dx_innovations/phoenix`) are valid. The adapter must use the full group path when constructing API paths like `projects/{encoded_owner}%2F{name}`.

The platform detection logic (reading `platform:` key) already exists — `submit-pr/SKILL.md` lines 36–39 and `merge-pr/SKILL.md` lines 30–35 both do:
```bash
platform=$(grep '^platform:' .garura/core/config.yaml | awk '{print $2}')
platform=${platform:-github}
```

The new adapter skill must follow this same pattern as its authoritative platform resolution path.

---

## 5. repo-orchestrator agent today

From `core/components/agents/repo-orchestrator.md`:

**Where it calls gh today:**
- The agent itself does NOT call `gh` directly — line 399 explicitly forbids `gh pr merge` in the Bash "Forbidden" table.
- The agent delegates all `gh` operations to skills: `analyze-pr`, `submit-pr`, `merge-pr`, `setup-branch`, `create-commit`, `analyze-changes`.
- The `review-pr` play's Step 0 (fetch PR context) is described as delegated to `repo-orchestrator` (line 107 of review-pr/SKILL.md), but the play text describes `gh pr view` and `gh pr diff` as the implementation — meaning repo-orchestrator currently calls these gh commands **directly via Bash** for that step (it is listed as "utility, exempt" from domain agent budget limits).

**Where it would call the new adapter instead:**
- Step 0 of review-pr: replace `gh pr view` + `gh pr diff` with `platform-adapter view-pr` + `platform-adapter diff-pr`.
- Step 5 of review-pr: replace `gh api ... -X PATCH`, `gh pr comment`, `gh pr review --request-changes`, `gh pr edit --add-reviewer` with `platform-adapter comment-pr`, `platform-adapter request-changes`, `platform-adapter add-reviewer`.
- Any future operation involving PR or issue state changes must go through the adapter.

**Contract surface:**
The agent's input/output contract (lines 39–96) is JSON-based and already includes a `config.platform` override field. The adapter skill fits naturally — the agent reads `platform` from config and passes it to the adapter skill along with the verb and parameters.

---

## 6. Skills that shell out to gh — routing decisions

| Skill | Current gh usage | Routing decision |
|-------|-----------------|-----------------|
| `analyze-pr` | `gh pr diff`, `gh pr view` (PR-scoped mode only; branch-diff mode uses git) | **(a) Route through adapter.** The PR-scoped mode section (Step 0a) must call `platform-adapter diff-pr` and `platform-adapter view-pr` instead of raw gh. Branch-diff mode is platform-neutral (uses git) — no change needed there |
| `manage-issue` | `gh issue view/create/list/close/comment`, `gh api` for sub-issues | **(b) Split.** Keep `manage-issue` as the GitHub-only reference implementation. Add `manage-issue/reference/gitlab-issue.md` (mirroring the existing `github-issue.md`) for the GitLab verb translations. The SKILL.md process section must dispatch through the reference doc based on `platform` config — same pattern as submit-pr and merge-pr already do |
| `archive-issue-stm` | `gh issue view {n} --json closedAt` | **(a) Route through adapter.** Single call to `view-issue` verb. Can also fall back to requiring caller to supply `close_date` — simpler |
| `submit-pr` | Already dispatched through `reference/{platform}/pr.md` | **(c) Already platform-specific by design.** `reference/gitlab/pr.md` exists. No adapter routing needed — the dispatch model is correct. Only gap is the missing `reference/gitlab/` equivalent for issue operations |
| `merge-pr` | Already dispatched through `reference/{platform}/merge.md` | **(c) Already platform-specific by design.** `reference/gitlab/merge.md` exists. No adapter routing needed |

**Summary:**
- `submit-pr` and `merge-pr` already use platform dispatch via reference files. They require no adapter routing — they are the reference pattern.
- `analyze-pr` needs to call the new adapter for its PR-scoped mode.
- `manage-issue` needs a GitLab reference doc + platform dispatch, mirroring the submit-pr/merge-pr pattern.
- `archive-issue-stm` needs adapter routing for its single `gh issue view` call.
- The `review-pr` play's Step 0 and Step 5 (executed by `repo-orchestrator` as utility) need adapter routing — this is the primary driver of the issue.

---

## 7. Integration points / connections

**Call paths (adapter is invoked by agents, never by plays directly):**

```
Play (review-pr) 
  → repo-orchestrator (utility agent)
      → platform-adapter skill
          → gh (when platform=github)
          → glab (when platform=gitlab)

Play (review-pr) 
  → repo-orchestrator (utility agent)
      → analyze-pr skill
          → platform-adapter skill (in PR-scoped mode)
              → gh / glab

Play (ship / enhance)
  → repo-orchestrator (utility agent)
      → manage-issue skill
          → platform reference doc (github-issue.md or gitlab-issue.md)
              → gh / glab

Play (ship / enhance)
  → repo-orchestrator (utility agent)
      → archive-issue-stm skill
          → platform-adapter skill (view-issue verb)
              → gh / glab
```

**Rule from Q&A (Q1):** Agents call the adapter skill. Plays do not call the adapter directly. The adapter exposes a verb interface — callers pass `verb` + `args`, the adapter resolves the CLI command from platform context and executes it.

**Pre-flight path (`which glab`):** The adapter skill checks `which glab` when platform is `gitlab`. If missing, halt with: `"glab CLI not found. Install via: brew install glab or https://gitlab.com/gitlab-org/cli"`. This check happens inside the adapter, not in the calling agent.

---

## 8. Existing patterns to follow

### Pattern: platform dispatch via reference files (submit-pr, merge-pr)
Both `submit-pr/SKILL.md` and `merge-pr/SKILL.md` read `platform:` from config, then load `reference/{platform}/{operation}.md`. This is the established pattern for platform-specific CLI operations. The new `manage-issue` GitLab support should follow this exactly.

**The adapter skill is a generalization of this pattern** — instead of each skill doing its own platform dispatch, the adapter centralizes the dispatch for verbs that are called from multiple places (PR view/diff/comment/review).

### Pattern: reference/ subdirectories in skills
- `core/components/skills/submit-pr/reference/github/pr.md` — platform reference doc
- `core/components/skills/submit-pr/reference/gitlab/pr.md` — already exists
- `core/components/skills/merge-pr/reference/github/merge.md` — platform reference doc
- `core/components/skills/merge-pr/reference/gitlab/merge.md` — already exists
- `core/components/skills/manage-issue/reference/github-issue.md` — needs a `gitlab-issue.md` sibling

For the new `platform-adapter` skill, the reference structure would be:
```
core/components/skills/platform-adapter/
  SKILL.md
  reference/
    github/verbs.md    (gh command translations for each adapter verb)
    gitlab/verbs.md    (glab command translations for each adapter verb)
```

### Pattern: skill naming conventions
Existing skill names use kebab-case noun-verb or noun-noun patterns: `analyze-pr`, `submit-pr`, `merge-pr`, `manage-issue`, `archive-issue-stm`, `setup-branch`. Following this convention, the new skill is named `platform-adapter` (noun-noun, consistent with the adapter pattern).

### Pattern: memory/tools KB docs (to be created)
No `memory/tools/` directory exists today. The shape of a KB adapter doc (per the issue requirement) should parallel the skill reference docs. Based on the `manage-issue/reference/github-issue.md` pattern:
- Title: "GitHub Platform Adapter Reference" / "GitLab Platform Adapter Reference"
- Sections: one per verb (`view-pr`, `diff-pr`, `comment-pr`, `request-changes`, `add-reviewer`, `create-issue`, `add-label`, `view-issue`, `close-issue`, `comment-issue`)
- Each section: the translated CLI command with parameters

---

## 9. Constraints

### Zero regression on GitHub
The GitHub path must be byte-for-byte equivalent to what exists today. The only change is that calls go through the adapter — the adapter's GitHub branch must produce identical output. Verification: run `review-pr` on a GitHub repo before and after; `comment-record.yaml` must be identical.

### `which glab` halt path
When `platform=gitlab` and `glab` is missing, the adapter halts immediately with a clear install hint. This check is the adapter's responsibility — callers do not pre-flight for `glab` existence. The halt must produce a structured failure, not a raw shell error.

### One verb interface across hosts
Verb names (`view-pr`, `diff-pr`, `comment-pr`, `request-changes`, `add-reviewer`, `create-issue`, `add-label`, `view-issue`, `close-issue`, `comment-issue`) are stable regardless of host. The caller never knows whether `gh` or `glab` was invoked.

### Scope: all gh-calling files converted in one PR
From Q&A Q2: every file identified in section 1 above that calls `gh` directly must be converted in this PR. No follow-on chore PRs. The count is:
- Skills with direct gh calls that need conversion: `analyze-pr`, `manage-issue`, `archive-issue-stm` (3 SKILL.md files + 1 reference doc)
- Plays with direct gh calls: `review-pr`, `merge-pr` play (2 SKILL.md files — note: merge-pr play line 72 calls `gh pr view` directly in its pre-flight)
- KB/template docs referencing gh commands: `pr-review-comment.md`, `github-issue.md`, `issue-comment-rca-approved.md` (these are reference docs, not executable — document the adapter verb mapping in them rather than replacing the literal `gh` references wholesale)
- New files to create: `platform-adapter/SKILL.md`, `platform-adapter/reference/github/verbs.md`, `platform-adapter/reference/gitlab/verbs.md`, `manage-issue/reference/gitlab-issue.md`, `memory/tools/github/adapter.md`, `memory/tools/gitlab/adapter.md`

Total files touched: approximately 12–14. Within the `enhance` scope gate (4–15 files, C6).

---

## Appendix: File paths referenced

- `/Users/kapilahuja/cto/builder/garura/.garura/core/config.yaml` — config schema (lines 7–12 for platform/github block)
- `/Users/kapilahuja/cto/builder/garura/core/components/agents/repo-orchestrator.md` — agent contract + forbidden table (line 399)
- `/Users/kapilahuja/cto/builder/garura/core/components/plays/review-pr/SKILL.md` — direct gh calls at lines 37, 107, 343, 346, 347, 358, 479
- `/Users/kapilahuja/cto/builder/garura/core/components/plays/merge-pr/SKILL.md` — direct gh call at line 72
- `/Users/kapilahuja/cto/builder/garura/core/components/plays/enhance/SKILL.md` — gh reference at line 733
- `/Users/kapilahuja/cto/builder/garura/core/components/skills/analyze-pr/SKILL.md` — gh calls at lines 47–48
- `/Users/kapilahuja/cto/builder/garura/core/components/skills/manage-issue/SKILL.md` — gh calls at lines 45, 57, 73, 84, 133, 144, 151, 161, 168, 174, 180, 191, 194
- `/Users/kapilahuja/cto/builder/garura/core/components/skills/manage-issue/reference/github-issue.md` — GitHub reference doc (lines 10, 18, 26, 39–48, 81, 113, 116)
- `/Users/kapilahuja/cto/builder/garura/core/components/skills/archive-issue-stm/SKILL.md` — gh call at line 42
- `/Users/kapilahuja/cto/builder/garura/core/components/skills/submit-pr/SKILL.md` — platform dispatch (lines 36–55)
- `/Users/kapilahuja/cto/builder/garura/core/components/skills/submit-pr/reference/github/pr.md` — GitHub commands (lines 18, 32, 40, 48, 56)
- `/Users/kapilahuja/cto/builder/garura/core/components/skills/submit-pr/reference/gitlab/pr.md` — GitLab commands (already exists)
- `/Users/kapilahuja/cto/builder/garura/core/components/skills/merge-pr/SKILL.md` — platform dispatch (lines 30–55)
- `/Users/kapilahuja/cto/builder/garura/core/components/skills/merge-pr/reference/github/merge.md` — GitHub commands (lines 10, 18, 26)
- `/Users/kapilahuja/cto/builder/garura/core/components/skills/merge-pr/reference/gitlab/merge.md` — GitLab commands (already exists)
- `/Users/kapilahuja/cto/builder/garura/core/components/memory/standards/templates/pr-review-comment.md` — Update Behavior section (lines 50–51)
- `/Users/kapilahuja/cto/builder/garura/core/components/memory/standards/templates/github-issue.md` — Issue creation template (line 56)
