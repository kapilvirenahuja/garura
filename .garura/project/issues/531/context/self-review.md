# PR Analysis Output — Self-Review (Issue #531)

**Rules source:** `/Users/kapilahuja/.garura/core/memory/standards/rules/self-review.md` (resolved at pre-flight, not re-resolved here)
**Mode:** Branch-diff (`git diff origin/main...HEAD`)

## Branch Info

- **Current Branch**: `feature/531-focus-play-and-no-unbacked-recommendation-guardrail`
- **Base Branch**: `main` (compared against `origin/main`)
- **Branch Pattern**: feature

## Change Summary

- **Commits**: 9
- **Files Changed**: 25
- **Additions**: +2234
- **Deletions**: -5

## Suggested PR Title

```
feat(focus): add focus play and no-unbacked-recommendation guardrail
```

## Context Detected

### File Patterns Matched

| Pattern | Files |
|---------|-------|
| Play definitions (`**/plays/**/SKILL.md`, `**/plays/**/*.md`) | `focus/SKILL.md`, `focus/reference/ice.md`, `play-creator/SKILL.md`, `play-editor/SKILL.md`, `no-unbacked-recommendation.md`, `pipeline-next.md`, `_index.md` |
| Scripts (mechanical, bundled with play) | `focus/scripts/*.py` (7 files) |
| Configuration (`*.yaml`) | `focus/reference/kind-map.yaml`, `focus/stop-condition.yaml`, `.garura/install-manifest.json` |
| Skill reference docs | `platform-adapter/reference/github/verbs.md` |
| STM run artifacts (excluded from review scope per instruction) | `.garura/project/issues/531/context/*` (7 files) |

### Commit Types Found

| Type | Count | Examples |
|------|-------|----------|
| feat | 3 | `feat(focus): add focus play surfacing tracked issues worth attention now (#531)` |
| chore | 6 | `chore(install-garura): add focus play to harness install scope (#531)` |

## Quality Checklist (from self-review.md)

### Scope checks

| Item | Status | Evidence |
|------|--------|----------|
| Matches the issue | PASS | Every changed file maps to one of the four described pieces of work: the `focus` play, the `no-unbacked-recommendation` rule, its enforcement in `play-creator`/`play-editor`, and the two small enabling changes (`platform-adapter` fields arg, install-garura scope + pipeline-next entry). No unrelated files touched. |
| No scope creep | PASS | Confirmed by file-by-file read of the diff; nothing rides along outside the four pieces above. |
| Reasonable size | PASS | 25 files / +2234 is large for a single sitting, but ~1700 lines are the new play itself (`SKILL.md` 411, `ice.md` 239, 6 scripts totaling ~1123) plus its own reference data — normal size for a net-new compiled play, not sprawl. |
| No stray artifacts | PASS | STM files under `.garura/project/issues/531/context/**` are the pipeline's own run records, not stray — confirmed by content read, not by path/status alone. No commented-out code, debug prints, or scratch files found in the diff. |

### Quality checks

| Item | Status | Evidence |
|------|--------|----------|
| Tests present | PASS | No unit-test framework exists in this repo (prompting/agentic project convention). Verification instead runs through `lint_play.py` (ran directly: `focus/SKILL.md` → `VERDICT: PASS (0 gap(s))`) and the play's own step evals (SE-1…SE-5, covering all 10 failure conditions) and scenario evals (SCE-1…SCE-8) declared in `SKILL.md`'s Compilation Metadata. All three new/changed scripts (`select_focus.py`, `check_output.py`, `resolve_mode.py`) parse cleanly (`ast.parse`, no syntax errors). |
| Commits are clean | PASS | All 9 commits use conventional format and reference `(#531)`. One `chore(stm)` commit (`008ba74f`) corrects a preceding `chore(stm)` commit's own record within the same branch — self-contained, does not touch product code, and is a materially minor 2-line diff. |
| No secrets | PASS | Ran a pattern scan (`api_key`, `secret`, `password`, `token`, PEM private-key headers) over the full diff. All matches are prose references to "path tokens" / "sessionId... token usage" in documentation — no actual credential, key, or secret value present. |
| Docs in step | REVIEW (non-blocking) | `focus` is a new user-invocable play, comparable in standing to `/next` (which the play itself is described as the "issue-side counterpart" to). `docs/components/plays.md` carries a canonical play table that lists `next`, `commit-change`, `propose-change`, `review-change`, `merge-change`, etc., but has **not** been updated to add a `focus` row. `README.md`'s directory-tree listing is already a non-exhaustive sample (it also omits `play-editor`, `manage-issue`, etc.) so its omission is not itself a gap. Recommend adding a row to `docs/components/plays.md` before or shortly after merge — not required to raise, since the rule that would require it (`docs-consistent`, triggered by changes to `docs/components/**`) never fired because that file wasn't touched, and self-review is informational, not the gate. |
| Nothing obviously broken | PASS | `git merge-tree --write-tree origin/main HEAD` returns a clean tree hash — no conflict markers. `lint_play.py` run directly against `core/components/plays/focus/SKILL.md` returns `VERDICT: PASS (0 gap(s))`, including the new `no-unbacked-recommendation` check. Verified the two "known-failing" plays cited in the task really do fail today and for the stated reason: `lint_play.py` on `next/SKILL.md` and `review-change/SKILL.md` both return `VERDICT: FAIL (1 gap(s))` with gap `no-unbacked-recommendation`, matching the state table in `no-unbacked-recommendation.md` ("caught, not yet wired (#530)") and issue #530 is named directly in the rule file. Verified the `platform-adapter` `fields` change is additive: the `gh issue list` template now takes `{fields}` with the doc stating existing callers are unchanged. Verified `focus/scripts/preflight.py`, `session_stamp.py`, `check_stop_condition.py` are stamped verbatim copies (per the task's own note); did not independently diff them against `play-creator/references/`, taking the stated design intent as given per the task's read-only scope. |

## Blocking Issues

None — ready to raise.

## Readiness Assessment

- **Ready**: yes
- **Blocking Count**: 0
- **Review Required (non-blocking)**: 1 — `docs/components/plays.md` play table doesn't yet list `focus`
- **Recommendation**: Create PR

---

## YAML Output

```yaml
analysis:
  branch: feature/531-focus-play-and-no-unbacked-recommendation-guardrail
  base: main
  branch_pattern: feature
  commits: 9
  changes:
    files: 25
    additions: 2234
    deletions: 5
  suggested_title: "feat(focus): add focus play and no-unbacked-recommendation guardrail"

  context:
    file_patterns_matched:
      - name: "play-definitions"
        files: 7
        trigger: "**/plays/**/*.md"
      - name: "scripts"
        files: 7
        trigger: "core/components/plays/focus/scripts/*.py"
      - name: "configuration"
        files: 3
        trigger: "*.yaml, install-manifest.json"
      - name: "skill-reference-docs"
        files: 1
        trigger: "core/components/skills/platform-adapter/reference/**"
      - name: "stm-run-artifacts"
        files: 7
        trigger: ".garura/project/issues/531/context/**"
    commit_types:
      - type: "feat"
        count: 3
      - type: "chore"
        count: 6
    branch_modifiers: []

  checklist:
    must_have: []
    nice_to_have:
      - id: "scope-matches-issue"
        item: "Matches the issue"
        trigger: "self-review.md Scope checks"
        status: "PASS"
        evidence: "All 25 files map to the four described pieces of work"
      - id: "scope-no-creep"
        item: "No scope creep"
        trigger: "self-review.md Scope checks"
        status: "PASS"
        evidence: "File-by-file diff read, no unrelated edits"
      - id: "scope-size"
        item: "Reasonable size"
        trigger: "self-review.md Scope checks"
        status: "PASS"
        evidence: "Size driven by net-new compiled play (SKILL.md, ice.md, 6 scripts, kind-map)"
      - id: "scope-no-stray-artifacts"
        item: "No stray artifacts"
        trigger: "self-review.md Scope checks"
        status: "PASS"
        evidence: "STM context files are the run's own records; no debug/scratch content found"
      - id: "quality-tests-present"
        item: "Tests present"
        trigger: "self-review.md Quality checks"
        status: "PASS"
        evidence: "lint_play.py PASS 0 gaps on focus/SKILL.md; SE-1..SE-5 and SCE-1..SCE-8 declared; scripts parse cleanly"
      - id: "quality-commits-clean"
        item: "Commits are clean"
        trigger: "self-review.md Quality checks"
        status: "PASS"
        evidence: "9/9 commits conventional-format, all reference (#531)"
      - id: "quality-no-secrets"
        item: "No secrets"
        trigger: "self-review.md Quality checks"
        status: "PASS"
        evidence: "Pattern scan over full diff — no credential/key values found"
      - id: "quality-docs-in-step"
        item: "Docs in step"
        trigger: "self-review.md Quality checks"
        status: "REVIEW"
        evidence: "docs/components/plays.md play table not updated to list focus; non-blocking, recommend follow-up"
      - id: "quality-nothing-broken"
        item: "Nothing obviously broken"
        trigger: "self-review.md Quality checks"
        status: "PASS"
        evidence: "No merge conflicts (git merge-tree clean); lint_play.py PASS on focus; next/review-change confirmed failing for the stated, tracked (#530) reason; platform-adapter fields arg confirmed additive"

  blocking_issues: []

  ready: true
  recommendation: "Create PR"
```
