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

## Harness-led scripting sweep (post-Phase-D audit)

Audited the five plays for "mechanical work → called script." Result, layer-correct:
- **Durable home:** play-creator step 3 now mandates the discipline with two hard rules —
  (1) a script computes/asserts over already-captured state, NEVER shells out to git/gh
  (live VCS/host work stays in skills via agents); (2) deterministic logic (thresholds,
  precedence, table classification, counts) is a script, never an LLM agent. So rebuilds
  reproduce it and Phase E inherits it.
- **New pure scripts:** `propose-change/scripts/resolve_standard.py` (standards-file
  precedence) and `review-change/scripts/compute_verdict.py` (verdict over the
  already-classified findings). Both smoke-tested. `start-change/scripts/init_stm.py`
  already covered its mechanical bit.
- **Reuse found:** `quality-check-scoped` already resolves standards and classifies by the
  no-LLM `pr.md` taxonomy — so review-change's redundant re-classify step and its
  `tech-designer` agent were dropped (domain agents 2 → 1; verdict now a script).
- **Left in the worker layer (correct, not a gap):** checks needing live git/gh state
  (HEAD==remote, open-PR count, worktree presence, branch base) stay with the skill/agent
  that captures the state — not bolted into a script.
- Fingerprints unchanged (no `ice.md` edits); all five still lint PASS. Direct-edit
  deviation notes added to propose-change and review-change.

## Config
- `start-change.worktree: false` (default) added to `.garura/core/config.yaml`.
- New standards: `self-review.md` (base, overrideable).

## Phase E started — first consumer play

- **create-pr** (old play) — **retired** (deleted source + both deployed copies). Superseded
  by propose-change. The `create-pr` *verb* in platform-adapter/submit-pr is unrelated and
  stays.
- **fix-it** (old play) — **rebuilt as `fix-bug`** (Phase E11, the `/fix` command; user chose
  the name `fix-bug`, a divergence from the plan's `/fix` label). First **consumer** play of
  the D2 pipeline (`position: both`): start-change injected at the head; commit-change →
  propose-change → review-change → merge-change as the closing chain. The play now owns only
  its defect-resolution core (validate-open → RCA & design + failing regression test →
  inline checkpoint → implement → independent verify, retry cap 2). Dropped from the old
  intent: branch creation, the `ship` sub-play, partial-ship failure — all now pipeline-owned.
  Source: `core/components/plays/fix-bug/` (ice.md + SKILL.md + scripts/check_scope.py).
  Lint PASS; check_scope.py smoke-tested. Old fix-it folder deleted.

## Build/meta plays brought into garura (self-hosting)

- **install-garura** + **uninstall-garura** — ported from the sudarshan harness
  (`Sudarshan/chakra/harness/src/skills/sud-{install,uninstall}`) into
  `core/components/plays/{install-garura,uninstall-garura}/` as bootstrap meta-plays (like
  play-creator/play-editor: hand-authored SKILL.md + bundled script, no ice.md). Sud framing
  stripped: dropped the `modules/` submodule indirection, `--modules`, the recipe registry;
  source is now the garura checkout itself. install copies garura's core/components into a
  target's `.claude/` (skills + plays + agents) + `.garura/` (config + STM scaffold), shared
  memory to `--memory-dest` (default `~/.garura/core/memory`). Two correctness adds over the
  sud original: (1) `--memory-dest` override so tests never touch the real machine KB; (2)
  frontmatter normalize on deploy — strips the `model:` sentinel (132 source files carry it;
  Claude Code can't read `model: best`). uninstall is manifest-driven, preserves STM + shared
  memory unless `--purge`. The sud-install SKILL.md prose describes an adapter the script does
  not use — ignored; the script is ground truth. Full round-trip tested 2026-06-09 (install →
  verify → default uninstall preserving STM → re-install → `--purge` against a temp memory
  dir; real `~/.garura/core/memory` untouched).
- This confirms the #434 direction: build/meta plays are garura-NATIVE, not `/sud:`-owned.

## Open / follow-ups
- **Local deployable surface (`.claude/`) trimmed 2026-06-09.** `.claude/skills/` now holds
  exactly the build/meta plays (play-creator, play-editor, install-garura, uninstall-garura)
  + the 5 orchestration plays (start-change, commit-change, propose-change, review-change,
  merge-change) + the 10 helper skills those orchestration plays call (analyze-changes,
  analyze-pr, create-commit, manage-issue, merge-pr, platform-adapter, quality-check-scoped,
  resolve-issues, setup-branch, submit-pr). `.claude/agents/` trimmed to the 3 those plays
  use (project-orchestrator, repo-orchestrator, quality-auditor). `model:` sentinel stripped
  on deploy. `.claude/` is gitignored (ephemeral, machine-local) — not committed.
- **fix-bug is intentionally NOT in the local deployable set** — the garura repo's runnable
  surface is the build + orchestration plays only; consumer plays like fix-bug deploy into a
  product via install-garura, not here.
- The reused worker skills (draft-rca, draft-fix-design, author-regression-test) still say
  "the fix-it play" in their description/prose — stale now that fix-it is fix-bug. Paths flow
  through the contract so function is unaffected; prose cleanup pending.
- **ship** deleted — its post-merge **distill** (learning) trigger is now orphaned; rewire
  into merge-change or the future /learn play.
- **ship** also referenced review-pr only in its bypass=false path (now gone); n/a while
  `review-pr.bypass: true`.
- Phase E (the remaining ProductOS commands: /vision, /understand, /shape, /roadmap,
  /learn, /realize, /grill, /implement, /validate, /fix, /refactor, /operate, /status,
  /next) not started.
