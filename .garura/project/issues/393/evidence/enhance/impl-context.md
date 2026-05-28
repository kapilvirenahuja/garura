# Implementation Context — Issue #393

## Solution Summary

Introduce `platform-adapter` as a new skill. It exposes a stable verb set
(view-pr, diff-pr, comment-pr, request-changes, add-reviewer, view-issue,
create-issue, list-issues, close-issue, comment-issue, add-label, attach-sub-issue,
create-pr, merge-pr, view-user, update-comment). Each verb maps to the correct CLI
command for the active platform, resolved from `platform:` in
`.garura/core/config.yaml`. Agents call the skill; plays never call the adapter
directly. All current `gh`-calling files across `core/components/` are converted in
this PR — no follow-on chore PRs. The `reference/{platform}/` subdirs inside
submit-pr and merge-pr skills are retired into the adapter's own reference layer; a
single dispatch pattern replaces the two-pattern world.

## Files to Create

| Path | Purpose |
|------|---------|
| `core/components/skills/platform-adapter/SKILL.md` | The adapter skill. Defines the verb interface, platform resolution logic (reads `platform:` from `.garura/core/config.yaml`; defaults to `github`), pre-flight checks (`which glab` when platform=gitlab; halt with install hint on failure), and the dispatch table referencing `reference/{platform}/verbs.md`. Authoritative for what the adapter CAN do — callers pass `{verb, args}`. |
| `core/components/skills/platform-adapter/reference/github/verbs.md` | Executable command translations for every adapter verb on GitHub. Normative reference the adapter reads when platform=github. One section per verb; each section contains the exact `gh` command with parameter substitution tokens. |
| `core/components/skills/platform-adapter/reference/gitlab/verbs.md` | Executable command translations for every adapter verb on GitLab. Same structure as github/verbs.md. Covers three documented behavioural gaps: (1) request-changes = `glab mr update {mr_number} --draft` PLUS `glab mr note {mr_number} --message "{structured_comment}"`; (2) attach-sub-issue = fallback to `glab api projects/{encoded_project}/issues/{n}/links` (related-issues link); (3) update-comment = `glab api projects/{id}/notes/{note_id} -X PUT` with project ID resolved via `glab api projects/{encoded_owner%2Fname} | jq '.id'` and cached for the call duration. |
| `core/components/memory/tools/github/adapter.md` | KB narrative describing the adapter verb surface for GitHub — intended for agents and contributors reading the KB, not for execution. Explains each verb conceptually, the backing `gh` command, and caveats. Descriptive, not executable. |
| `core/components/memory/tools/gitlab/adapter.md` | Same KB narrative role for GitLab. Documents the three gap behaviours (request-changes draft + note; sub-issue related-link fallback; update-comment project-id resolution) so agents can set correct expectations. |

## Files to Modify

| Path | Lines | Change |
|------|-------|--------|
| `core/components/skills/analyze-pr/SKILL.md` | 47–48 | PR-scoped mode (Step 0a): replace `gh pr diff {pr_number}` and `gh pr view {pr_number} --json ...` with calls to `platform-adapter diff-pr {pr_number}` and `platform-adapter view-pr {pr_number}`. Branch-diff mode (uses `git`) unchanged. |
| `core/components/skills/manage-issue/SKILL.md` | 45, 57, 73, 84, 133, 144, 151, 161, 168, 174, 180, 191, 194 | Replace every `gh issue` and `gh api` invocation with the corresponding adapter verb: view-issue, create-issue, list-issues, close-issue, comment-issue, add-label, attach-sub-issue. Remove the `reference/github-issue.md` dispatch. Repurpose `reference/github-issue.md` as a one-line delegation pointer to platform-adapter (or delete and remove the reference). Do NOT add a `gitlab-issue.md` sibling. |
| `core/components/skills/archive-issue-stm/SKILL.md` | 42 | Replace `gh issue view {issue_number} --json closedAt` with `platform-adapter view-issue {issue_number}` extracting the `closedAt` (GitHub) or `closed_at` (GitLab) field. The skill must coerce the field name via `jq '.closedAt // .closed_at'` or read the correct field per platform. |
| `core/components/skills/submit-pr/SKILL.md` | 36–55 | Replace the `reference/{platform}/pr.md` dispatch block with calls to adapter verbs (create-pr, view-pr, list-issues). Then delete `reference/github/pr.md`, `reference/gitlab/pr.md`, and `reference/bitbucket/pr.md`. Bitbucket support is not added in this PR; its reference file is deleted and the platform remains unsupported. |
| `core/components/skills/merge-pr/SKILL.md` | 30–55 | Same pattern as submit-pr: replace `reference/{platform}/merge.md` dispatch with adapter verb calls (merge-pr, view-pr for pre-flight). Delete `reference/github/merge.md`, `reference/gitlab/merge.md`, and `reference/bitbucket/merge.md`. |
| `core/components/plays/review-pr/SKILL.md` | 37, 107, 343, 346, 347, 358, 479 | Replace all 7 direct `gh` invocations with adapter verb calls expressed as repo-orchestrator invoking the adapter: Line 37 (`gh pr view --json`) → `view-pr`; Line 107 (`gh pr diff`) → `diff-pr`; Line 343 (`gh api ... -X PATCH`) → `update-comment`; Line 346 (`gh pr comment`) → `comment-pr`; Line 347 (`gh pr comment`) → `comment-pr`; Line 358 (`gh pr review --request-changes`) → `request-changes`; Line 479 (`gh pr edit --add-reviewer`) → `add-reviewer`. |
| `core/components/plays/merge-pr/SKILL.md` | 72 | Replace `gh pr view --json number,state,baseRefName,mergeable` with `platform-adapter view-pr {pr_number}` extracting the same fields. GitLab field-name differences (`baseRefName` → `target_branch`) are encoded in `reference/gitlab/verbs.md`; the play accesses the platform-appropriate field name. |
| `core/components/plays/enhance/SKILL.md` | 733 | Narrative-only. Replace `(gh pr diff / gh pr view)` parenthetical with `(platform-adapter diff-pr / platform-adapter view-pr)` to stay accurate after analyze-pr conversion. |
| `core/components/agents/repo-orchestrator.md` | 399 (Forbidden table) | Expand the Bash Forbidden table to forbid both `gh` AND `glab` direct invocations. Add a note: "All code-host operations must route through the platform-adapter skill. Pass verb + args to the skill; never invoke gh or glab directly." |
| `core/components/agents/project-orchestrator.md` | 332–335 (Forbidden table) | Add `glab issue create`, `glab issue view`, `glab issue list`, `glab issue close`, `glab api` to the forbidden list alongside the existing `gh issue` entries. Add routing note pointing to platform-adapter. |
| `core/components/agents/code-builder.md` | 290 (Forbidden table) | Add `glab mr create` alongside the existing `gh pr create` in the forbidden table. Routing note: use repo-orchestrator → platform-adapter. |
| `core/components/agents/knowledge-extractor.md` | 314 | Update the `pr_diff` source note from `gh pr diff {pr_number}` to `platform-adapter diff-pr {pr_number}`. |
| `core/components/memory/standards/templates/pr-review-comment.md` | 50–51 | Update Behavior section: replace literal `gh api repos/.../issues/comments/{id} -X PATCH` and `gh pr comment` with adapter verb references (`platform-adapter update-comment` and `platform-adapter comment-pr`). Documentation-only update. |
| `core/components/memory/standards/templates/github-issue.md` | 3, 56 | Add a platform note at the top: "For GitLab, use platform-adapter create-issue verb — see memory/tools/gitlab/adapter.md." Update the `gh issue create` example at line 56 to note the adapter verb equivalent. Keep GitHub-specific content intact — this template remains the GitHub reference. |
| `core/components/memory/standards/templates/issue-comment-rca-approved.md` | 44, 81 | Replace `gh api user -q .login` with `platform-adapter view-user` and `gh issue comment {issue_number}` with `platform-adapter comment-issue {issue_number}`. |
| `.garura/core/config.yaml` | 7–12 | Add a commented-out `gitlab:` block as schema documentation, parallel to the existing `github:` block. Shows required fields (host, owner, name) so teams switching platforms know what to populate. The `platform:` key on line 7 remains `github` (this project) — no operational change. |

## Connections

### Call chain (adapter is invoked by agents, never by plays directly)

```
Play (review-pr / enhance / ship)
  → repo-orchestrator (utility agent, exempt from domain budget)
      → platform-adapter skill
          → gh (when platform=github)
          → glab (when platform=gitlab)

Play (review-pr)
  → repo-orchestrator
      → analyze-pr skill (PR-scoped mode)
          → platform-adapter skill (diff-pr, view-pr)
              → gh / glab

Play (ship / enhance / fix-it)
  → repo-orchestrator
      → manage-issue skill
          → platform-adapter skill (all issue verbs)
              → gh / glab

Play (ship / enhance)
  → repo-orchestrator
      → archive-issue-stm skill
          → platform-adapter skill (view-issue)
              → gh / glab

Play (ship / enhance)
  → repo-orchestrator
      → submit-pr skill
          → platform-adapter skill (create-pr, view-pr)
              → gh / glab

Play (ship / enhance / merge-pr)
  → repo-orchestrator
      → merge-pr skill
          → platform-adapter skill (merge-pr verb, view-pr)
              → gh / glab
```

### Platform resolution

The adapter reads `platform:` from `.garura/core/config.yaml` using the same bash snippet already established in submit-pr/SKILL.md lines 36–39 and merge-pr/SKILL.md lines 30–35:

```bash
platform=$(grep '^platform:' .garura/core/config.yaml | awk '{print $2}')
platform=${platform:-github}
```

Config is authoritative. `git remote -v` is NOT used.

### Verb interface

Callers pass a verb name and a map of named arguments. The adapter resolves the platform, looks up the command translation in `reference/{platform}/verbs.md`, substitutes arguments, and executes. Return value is the raw CLI output (stdout) plus an exit code. The caller is responsible for parsing the output — the adapter does not transform field names across platforms (field-name mapping notes live in the reference docs for callers to consult).

### Reference vs KB split

Two file types, two roles:
- `platform-adapter/reference/{platform}/verbs.md` — normative execution reference that the skill reads to produce CLI commands. One section per verb; authoritative command with parameter tokens.
- `memory/tools/{platform}/adapter.md` — KB narrative for agents and contributors. Explains verb semantics, caveats, and gap behaviours. Descriptive, not executed.

## Tasks (in order)

| ID | Title | Description | Blocked By |
|----|-------|-------------|------------|
| T1 | Create platform-adapter SKILL.md | Write `core/components/skills/platform-adapter/SKILL.md` with full verb interface, platform-resolution logic (config grep pattern), pre-flight `which glab` check with install hint, and the dispatch table referencing `reference/{platform}/verbs.md`. Include all 16 verbs from the inventory. | — |
| T2 | Create reference/github/verbs.md and reference/gitlab/verbs.md | Both verb translation files under `platform-adapter/reference/`. GitHub file: one section per verb with exact `gh` command + parameter tokens. GitLab file: same structure with `glab` equivalents, plus the three documented gap behaviours (request-changes = draft + note; attach-sub-issue = related-issues API; update-comment = project-id resolution via `glab api projects/{encoded}` then `notes/{note_id}`). | T1 |
| T3 | Create memory/tools/github/adapter.md and memory/tools/gitlab/adapter.md | Create the `memory/tools/` namespace and write both KB narrative docs. GitHub doc covers all verbs and their `gh` mappings. GitLab doc covers all verbs and explicitly documents the three gap behaviours. | T2 |
| T4 | Convert analyze-pr to call adapter | In `core/components/skills/analyze-pr/SKILL.md` lines 47–48, replace `gh pr diff` and `gh pr view --json` with `platform-adapter diff-pr` and `platform-adapter view-pr`. Branch-diff mode unchanged. | T2 |
| T5 | Convert manage-issue to call adapter | In `core/components/skills/manage-issue/SKILL.md`, replace all `gh issue` and `gh api` invocations (lines 45, 57, 73, 84, 133, 144, 151, 161, 168, 174, 180, 191, 194) with adapter verbs. Repurpose `reference/github-issue.md` as a one-line delegation pointer. Do NOT add a `gitlab-issue.md` sibling. | T2 |
| T6 | Convert archive-issue-stm to call adapter | In `core/components/skills/archive-issue-stm/SKILL.md` line 42, replace `gh issue view {issue_number} --json closedAt` with `platform-adapter view-issue {issue_number}`. Use `jq '.closedAt // .closed_at'` coercion or read platform-appropriate field name. | T2 |
| T7 | Convert submit-pr skill; delete reference/{platform}/ subdirs | In `core/components/skills/submit-pr/SKILL.md`, replace the `reference/{platform}/pr.md` dispatch block (lines 36–55) with adapter verb calls (create-pr, view-pr, list-issues). Delete `reference/github/pr.md`, `reference/gitlab/pr.md`, and `reference/bitbucket/pr.md`. Bitbucket remains unsupported. | T2 |
| T8 | Convert merge-pr skill; delete reference/{platform}/ subdirs | In `core/components/skills/merge-pr/SKILL.md`, replace `reference/{platform}/merge.md` dispatch (lines 30–55) with adapter verb calls (merge-pr verb, view-pr for pre-flight). Delete `reference/github/merge.md`, `reference/gitlab/merge.md`, and `reference/bitbucket/merge.md`. | T2 |
| T9 | Update review-pr play (7 gh invocations) | In `core/components/plays/review-pr/SKILL.md`, replace all 7 direct `gh` invocations (lines 37, 107, 343, 346, 347, 358, 479) with adapter verb calls expressed as repo-orchestrator invoking the adapter. See files_to_modify entry for per-line mapping. | T1 |
| T10 | Update merge-pr play (1 gh invocation) | In `core/components/plays/merge-pr/SKILL.md` line 72, replace `gh pr view --json number,state,baseRefName,mergeable` with `platform-adapter view-pr {pr_number}`. Field-name access uses platform-appropriate name (`baseRefName` on GitHub, `target_branch` on GitLab) — encoded in `reference/gitlab/verbs.md`. Recommend NO normalisation in adapter; callers access platform-specific field. | T1 |
| T11 | Update enhance play narrative (line 733) | In `core/components/plays/enhance/SKILL.md` line 733, replace `(gh pr diff / gh pr view)` parenthetical with `(platform-adapter diff-pr / platform-adapter view-pr)`. Narrative-only; no structural change. | T4 |
| T12 | Expand agent forbidden tables | Update three agent files: `repo-orchestrator.md` line 399 (add `glab` to forbidden Bash table + routing note); `project-orchestrator.md` lines 332–335 (add `glab issue` verbs + routing note); `code-builder.md` line 290 (add `glab mr create` alongside `gh pr create`). Also update `knowledge-extractor.md` line 314: change `gh pr diff` source note to `platform-adapter diff-pr`. | T1 |
| T13 | Update standards templates | Three template files: `pr-review-comment.md` lines 50–51 (replace `gh api` and `gh pr comment` with adapter verbs); `github-issue.md` lines 3, 56 (add platform note and adapter verb equivalent); `issue-comment-rca-approved.md` lines 44, 81 (replace `gh api user` and `gh issue comment` with adapter verbs). Also add commented-out `gitlab:` block to `.garura/core/config.yaml` as schema documentation. | T1 |
| T14 | Run /sync-claude to deploy | After all file changes are saved, run `/sync-claude` to deploy the new platform-adapter skill and all modified components to `~/.claude/`. Verify `~/.claude/skills/platform-adapter/SKILL.md` exists. **owner_role: orchestrator** — this task is NOT executed by the implementer agent. The implementer stops after T13. | T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13 |
