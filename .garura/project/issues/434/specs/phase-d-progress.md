# #434 — Phase D + delivery-pipeline plays — progress

Status as of this session. Source of plan: `specs/realignment-plan.md`.

## Done

### Compiler consolidation (prereq)
- Deleted garura's old `create-play` play.
- Brought the sudarshan harness `create-play`/`edit-play` into garura as
  **play-creator** / **play-editor** (garura-native; sud framing stripped).
- Swept live references (CLAUDE.md, standards, glossary) create-play → play-creator.
- Deployed play-creator to `.claude/skills/` (frontmatter normalized: flat description,
  no `model:` line).

### D1 — Evidence rule
- `standards/rules/evidence-recording.md` — evidence is play-only (never agents/skills);
  fires on `evidence.record`; tunable per play via `evidence.plays.<name>`.
- `play-close.md` updated to resolve the per-play + global flag (mechanism).
- No compiler change needed — plays emit evidence via the referenced Standard Play Close.

### D2 — Pipeline-position rule
- `standards/rules/pipeline-position.md` — a play declares `position: start | end | both |
  none`. start → inject `start-change`; end → inject the sequence
  `commit-change → propose-change → review-change → merge-change`; both → bracket; none →
  nothing. Members are exempt from self-injection. Explicit named sub-play steps.
- play-creator taught it (step **4b** + hard rule + required-section note).

### Delivery-pipeline plays (built via play-creator, all lint-clean)
- **start-change** (position start) — issue + branch + optional worktree + STM.
- **commit-change** (position end, 1st) — commit grouped by concern, no push.
- **propose-change** (position end, 2nd) — self-review (from `standards/rules/self-review.md`,
  overrideable per project) + push + open PR.
- **review-change** (position end, 3rd) — diff-scoped review, severity taxonomy,
  approve/reject verdict posted to PR. Supersedes review-pr.
- **merge-change** (position end, 4th) — merge + sync main + delete branch.
- Each reuses existing skills; each carries the Standard Play Close (D1) and a `position`
  frontmatter field (D2).

### Lint enforcement
- `lint_play.py` gained D1 (Standard Play Close anchors) and D2 (valid `position`
  frontmatter) checks. Synced to play-creator (source + deployed) and play-editor.

### Retired
- Deleted plays: start-feature, review-pr, merge-pr (play), ship, commit-code (source +
  deployed).
- Kept worker skills: submit-pr, merge-pr (skill), create-commit, analyze-changes,
  resolve-issues, manage-issue — reused by the new plays.

## Config
- `start-change.worktree: false` (default) added to `.garura/core/config.yaml`.
- New standards: `self-review.md` (base, overrideable).

## Open / follow-ups
- The 5 new plays + play-editor are **not yet deployed** to `.claude/skills/` (only
  play-creator is). Deploy before they're invocable.
- **create-pr** and **fix-it** (old plays) still reference the deleted commit-code/ship in
  prose/short-circuits — stale; clean up or retire in Phase E.
- **ship** deleted — its post-merge **distill** (learning) trigger is now orphaned; rewire
  into merge-change or the future /learn play.
- **ship** also referenced review-pr only in its bypass=false path (now gone); n/a while
  `review-pr.bypass: true`.
- Phase E (the remaining ProductOS commands: /vision, /understand, /shape, /roadmap,
  /learn, /realize, /grill, /implement, /validate, /fix, /refactor, /operate, /status,
  /next) not started.
