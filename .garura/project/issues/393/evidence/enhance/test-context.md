# Test Context — Issue #393

The tester verifies the delivered work against the evals below. The tester does NOT
see implementation context, file paths, or how the work was constructed. For each
eval, execute the assertion and record PASS/FAIL with evidence (command output,
grep results, file existence) in `verification-report.yaml`.

## Behavioural intent of the work

The work delivers a centralised code-host adapter so that every play, agent, and
skill in the framework can request a platform-neutral operation (e.g., "view PR",
"comment on PR", "view issue", "close issue") and the adapter routes the call to
the correct CLI (`gh` for GitHub, `glab` for GitLab) based on the active platform
configured for the project.

The work also converts every existing direct `gh` caller across plays, agents, and
skills to route through the new adapter — no other source file should be calling
`gh` or `glab` directly after the work is done.

The active platform is read from a configuration file (the same configuration the
framework already uses for project metadata). The adapter exposes a fixed verb
inventory of 16 names. When the active platform is GitLab and the `glab` CLI is
absent, the adapter must halt with a human-readable install hint, not a raw shell
error.

Two cross-host behavioural gaps are documented and handled inside the adapter's
platform-specific reference docs:
- A "request changes" review on GitHub has no direct GitLab analog. The adapter's
  GitLab path for this verb must (a) set the merge request to draft state AND
  (b) post the structured comment — both actions, not one.
- A "sub-issue attachment" on GitHub has no direct GitLab analog. The adapter's
  GitLab path for this verb must fall back to GitLab's related-issues link
  mechanism rather than silently no-op or raise an error.

Agent forbidden tables across the three primary agents must be updated to forbid
direct CLI calls of either kind (`gh` or `glab`) and to point callers at the
adapter.

## Evals (execute each; record PASS/FAIL with evidence)

### E1 — Adapter skill defines all 16 verbs

The adapter's primary skill definition file exists and contains all 16 verb names:
`view-pr`, `diff-pr`, `comment-pr`, `request-changes`, `add-reviewer`, `view-issue`,
`create-issue`, `list-issues`, `close-issue`, `comment-issue`, `add-label`,
`attach-sub-issue`, `create-pr`, `merge-pr`, `view-user`, `update-comment`.

- **Pass:** All 16 verb names found in the adapter skill file (one grep per name; all return ≥1 match).
- **Fail:** Any verb name absent.

### E2 — Per-platform verb reference exists with all 16 sections

Two reference files exist under the adapter — one for GitHub, one for GitLab. Each
file has a heading-level section (## or ###) for every verb in the inventory above.

- **Pass:** Both reference files exist; all 16 verb headings present in each.
- **Fail:** Either file missing, or any verb section absent.

### E3 — No direct `gh` or `glab` invocation outside the adapter skill

Grep across all source markdown files in `core/components/` for direct CLI
invocations of `gh` or `glab` (matching common verbs: `pr`, `api`, `issue`, `run`,
`workflow`). Matches must occur ONLY inside the platform-adapter skill directory
and optionally as descriptive cross-references inside KB narrative under
`memory/tools/` (descriptive prose, not executable invocations). No matches in
other skills, plays, agents, or standards templates.

- **Pass:** grep returns matches only inside the adapter skill (and descriptive KB).
- **Fail:** Any match in another skill, play, agent, or standards template.

### E4 — Adapter halts with install hint when GitLab CLI is missing

When the active platform is GitLab and `glab` is not installed, the adapter halts
pre-flight with a human-readable install hint. The hint text (or equivalent — e.g.,
`glab CLI not found`, `install glab`, `brew install glab`) must be present in the
adapter's pre-flight section.

- **Pass:** Install-hint text present in the adapter skill's pre-flight section.
- **Fail:** No install-hint text found.

### E5 — request-changes on GitLab sets draft AND posts comment

The adapter's GitLab reference doc, in the request-changes verb section, contains
BOTH of:
- a command that sets the merge request to draft/WIP state, AND
- a command that posts a structured comment/note on the merge request.

Both must be present in the same verb section. One without the other fails the
behavioural-parity requirement.

- **Pass:** Both commands present in the request-changes section of the GitLab reference.
- **Fail:** Either command absent.

### E6 — attach-sub-issue on GitLab uses related-issues fallback

The adapter's GitLab reference doc, in the attach-sub-issue verb section, uses
GitLab's related-issues API path (the `links` endpoint on a project's issues) as
the fallback. The section must NOT no-op silently and must NOT raise an error —
it must invoke the related-issues link API.

- **Pass:** Related-issues API path referenced in the attach-sub-issue section.
- **Fail:** Section absent, no-ops without action, or uses a non-supported approach.

### E7 — Agent forbidden tables include both `gh` and `glab`

Across the three primary agent definition files (repo-orchestrator,
project-orchestrator, code-builder), each forbidden-command table includes BOTH
the existing `gh ...` entries AND new `glab ...` entries. A routing note pointing
to the platform-adapter is present in at least the repo-orchestrator and
project-orchestrator forbidden sections.

- **Pass:** `glab` entries present in all three agents' forbidden tables.
- **Fail:** Any agent missing `glab` in its forbidden table.

### E8 — review-pr play contains no backtick-quoted `gh pr` invocation

Grep the review-pr play definition file for backtick-quoted invocations matching
`` `gh pr ` ``. Result must be zero.

- **Pass:** Zero backtick-quoted `gh pr` invocations in the file.
- **Fail:** Any match.

### E9 — merge-pr play contains no backtick-quoted `gh pr` invocation

Grep the merge-pr play definition file for backtick-quoted invocations matching
`` `gh pr ` ``. Result must be zero.

- **Pass:** Zero matches.
- **Fail:** Any match.

### E10 — submit-pr and merge-pr skills no longer reference platform subdirs

Grep submit-pr and merge-pr skill definition files for any path reference
matching `reference/github`, `reference/gitlab`, or `reference/bitbucket`. Result
must be zero — the dispatch via reference subdirs has been retired in favour of
adapter calls, and those subdirs are deleted.

- **Pass:** Zero path references to `reference/{platform}/` in both skill files.
- **Fail:** Any `reference/{platform}/` path found in either skill file.

### E11 — /sync-claude has deployed the new skill

After the orchestrator runs `/sync-claude`, the deployed adapter skill exists at
`~/.claude/skills/platform-adapter/SKILL.md`. Verify file presence.

- **Pass:** File present at the deployed path.
- **Fail:** File absent.

## Notes for the tester

- All evals are file-existence or grep assertions. None require running an end-to-end command against a live GitHub or GitLab host.
- For grep-based assertions, run `grep` from the repository root unless the eval specifies otherwise.
- When recording evidence, capture the exact grep command and its output. For file-existence evals, capture the `ls -la` output.
- E11 depends on the orchestrator running `/sync-claude` after implementation completes. If the orchestrator has not yet done so, mark E11 as PENDING with a note — do NOT mark as FAIL until the deploy step has explicitly run.
