# start-change — ICE source

The clean ICE triple this play is compiled from. Update this and recompile via
play-creator; never hand-edit the compiled SKILL.md.

## Intent

Open a unit of work cleanly: ensure a tracked issue, a feature branch cut from an
up-to-date main, a git worktree when config calls for it, and an initialized STM
workspace — so every play that runs after start-change begins from a known,
identified context.

Pipeline position: **start**. start-change is the start-of-pipeline primitive that
the D2 pipeline-position rule injects into any other play declared `position: start`.

### Constraints

- C1 — Every change is anchored to a tracked issue: resolve an existing one or create
  one; never start work with no issue. Creating a new issue is checkpointed
  (confirm-new-issue), and the gate resolves per gate-config — the per-play override
  (`gates.plays.start-change`) is off for this project, so a skip is recorded in
  evidence, never silent. AND, gate on or off, the play MUST run the bundled
  validate_issue.py (title present and tagged, description complete) on the proposed
  issue BEFORE any create — a failed validation HALTS to a human regardless of the
  gate state (the machine wall that replaced the human eye).
- C2 — Work goes on a dedicated feature branch cut from an up-to-date main, never on
  main itself.
- C3 — A git worktree is set up only when config calls for it (config-driven, not
  automatic).
- C4 — The STM workspace for the issue is initialized before the play reports done.
- C5 — Reuse garura's existing manage-issue skill for issue work (resolve/create); do not
  reimplement issue or git logic inline in play prose. Issue work keeps an agent
  (project-orchestrator) because the fresh-issue match from a description is genuine
  judgment; the branch work does not (see C8).
- C8 — The mechanical branch work — cut the feature branch off latest main, set up the
  worktree per config, push — runs in the bundled `setup_branch.py` calling git directly,
  not an agent dispatch (#484, tool-first + ADR 025). The `repo-orchestrator` → `setup-branch`
  dispatch is removed; running the fixed branch sequence through an agent is the bug #484
  fixes. (Issue work stays with `project-orchestrator` for the fresh-path judgment.)
- C6 — Running it again for the same issue resumes the existing context; it does not
  create a second issue or branch.
- C7 — The play ends by proving its Done means at close (gated, #464), and commits its
  own run artifacts (issue.json, branch.json, work-description) on the fresh feature
  branch at close — the workspace opens with a clean tree and its own record aboard.

### Failure conditions

- F1 — Work starts with no associated issue.
- F2 — The branch is cut from a stale or wrong base, or work lands on main.
- F3 — A worktree is created when config says not to, or skipped when config says to.
- F4 — The play reports success but the STM workspace was never initialized.
- F5 — A second run for the same issue duplicates the issue or branch instead of
  resuming.
- F6 — The close proves nothing — the play closes COMPLETED without the Done means
  held.
- F7 — An issue was created whose record fails validate_issue.py (missing/short/untagged
  title, or an empty work description).
- F8 — The mechanical branch work (cut/worktree/push) was run through an agent dispatch
  instead of the bundled setup_branch.py.

## Expectation

### Success scenarios

- S1 — (developer, fresh start) Given a description of new work and no issue, when
  start-change runs, then a new tracked issue, a feature branch off latest main, and
  the STM workspace all exist. Measure: issue number exists; current branch matches
  `feature/<issue>-*`; the branch base is the current origin/main tip; the issue STM
  folder exists; the run artifacts are committed on the branch; the stop-condition
  verdict reads held.
- S2 — (developer, existing issue) Given an issue number, when it runs, then it
  resolves that issue, lands on its feature branch, and initializes STM — without
  creating a new issue. Measure: no new issue created; the issue's branch exists; STM
  folder exists; the run artifacts are committed on the branch; the stop-condition
  verdict reads held.
- S3 — (developer, resume) Given start-change already ran for an issue (branch and STM
  exist), when it runs again, then it switches to the existing branch and reuses STM.
  Measure: issue count and branch count unchanged; session ends on the existing branch.
- S4 — (developer, worktree by config) Given config asks for a worktree, when it runs,
  then a worktree for the branch is set up; given config does not, none is made.
  Measure: `git worktree list` shows the worktree when the flag is on, and does not
  when it is off.

### Done means

- D1 — says: "the issue is anchored"
  check: { type: artifact_exists, path: "context/issue.json" }
- D2 — says: "the branch record exists"
  check: { type: artifact_exists, path: "context/branch.json" }
- D3 — says: "we are not on main"
  check: { type: field_equals, file: "context/branch.json", field: "on_default_branch", equals: false }
- D4 — says: "the STM workspace exists"
  check: { type: artifact_exists, path: "specs" }

### Recovery (one per failure condition)

- REC1 (F1) — trigger: no issue resolved or created. direction: create the issue from
  the work description via manage-issue, then continue. handoff: autonomous.
- REC2 (F2) — trigger: branch base is not the latest main, or current branch is main.
  direction: pull main to latest and re-cut the branch from it, or move off main.
  handoff: autonomous.
- REC3 (F3) — trigger: worktree state does not match config. direction: reconcile to
  config — remove the stray worktree, or create the missing one. handoff: autonomous.
- REC4 (F4) — trigger: close check finds the STM workspace missing. direction:
  initialize the STM workspace before reporting done. handoff: autonomous.
- REC5 (F5) — trigger: a second run would create a duplicate issue or branch.
  direction: detect the existing issue and branch and resume them instead of creating
  new ones. handoff: autonomous.
- REC6 (F6) — trigger: the close would report COMPLETED without the Done means held.
  direction: evaluate the stop condition and surface the unmet clauses; the run closes
  HALTED until state is fixed. handoff: autonomous.
- REC7 (F7) — trigger: validate_issue.py exits non-zero on the proposed or created
  issue record. direction: a human fixes the title (present, ≥15 chars, tagged) and/or
  completes the work description, then re-runs; the play never creates over a failed
  validation. handoff: human.
- REC8 (F8) — trigger: the branch work was run through an agent instead of the script.
  direction: route the cut/worktree/push through setup_branch.py and remove the agent
  dispatch. handoff: autonomous.
