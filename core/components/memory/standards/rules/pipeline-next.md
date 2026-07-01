# Pipeline-next — the successor map (single source of truth)

Every user-invocable compiled play, when it finishes, must tell the user what to run
next. This file is the one place that mapping lives. The **Standard Play Close**
(`play-close.md`, step C2) renders each play's **Next** line by resolving the play here;
`lint_play.py` fails any user-invocable compiled play that is neither listed here nor in
`meta_exempt`.

The rendered line reads:

> **Next:** `/<command>` — <why>. Or run `/next` to see all recommended actions.

When a play's `command` is `null`, the close renders only the `/next` pointer (or omits
the Next line where that reads better — e.g. `/next` itself).

## The flow

- **Strategy:** `/vision → /understand → /shape → /roadmap`, then pick a realize pipe.
- **Realize** is three pipes run against a shaped slice; you finish the pipe you start.
  - Functional: `/ux → /agentic → /marketing`
  - Non-functional: `/arch → /quality → /run`
  - Deliver: `/measure` (runs last — it stamps the slice *realized* only when all seven
    lens docs line up, the marker `/grill` requires).
  After the functional and non-functional pipes, `/measure` closes realize and hands to
  `/grill`.
- **Execute (per epic):** `/grill → /implement → /validate → /launch → /deploy`.
- **Change chain (git):** `/commit-change → /propose-change → /review-change → /merge-change`.
- Branch points (after `/roadmap`, and at the end of the functional/non-functional pipes)
  recommend `/next`, which reads the model and ranks the real options.

## The map

```yaml
next:
  # Strategy
  vision:         { command: understand,     why: "expand this capability's intent (ICE)" }
  understand:     { command: shape,          why: "cut the capability into slices" }
  shape:          { command: roadmap,        why: "prioritise the slices" }
  roadmap:        { command: next,           why: "pick a realize pipe for the top slice — functional (/ux) or non-functional (/arch)" }

  # Realize — functional pipe (ux → agentic → marketing)
  ux:             { command: agentic,        why: "next lens in the functional pipe" }
  agentic:        { command: marketing,      why: "next lens in the functional pipe" }
  marketing:      { command: next,           why: "functional pipe done — run the other pipe, or /measure once both are done" }

  # Realize — non-functional pipe (arch → quality → run)
  arch:           { command: quality,        why: "next lens in the non-functional pipe" }
  quality:        { command: run,            why: "next lens in the non-functional pipe" }
  run:            { command: next,           why: "non-functional pipe done — run the other pipe, or /measure once both are done" }

  # Realize — deliver pipe (measure runs last, stamps the slice realized)
  measure:        { command: grill,          why: "slice realized — cut it into user-testable delivery epics" }

  # Execute (per epic)
  grill:          { command: implement,      why: "build the first epic the slice was cut into" }
  implement:      { command: validate,       why: "independently verify the built epic" }
  validate:       { command: launch,         why: "land the validated epic on human acceptance" }
  launch:         { command: deploy,         why: "deploy the delivered epic to a cloud environment" }
  deploy:         { command: next,           why: "increment deployed — see what's next" }

  # Maintenance / feedback
  fix-bug:        { command: next,           why: "defect resolved — see what's next" }
  refactor:       { command: next,           why: "refactor landed — see what's next" }
  learn:          { command: next,           why: "model updated from outcomes — see what's next" }

  # Navigation
  next:           { command: null,           why: "next is the recommender — it has no successor" }

  # Change chain (git members)
  start-change:   { command: null,           why: "injected at a play's head; the opened play continues" }
  commit-change:  { command: propose-change, why: "raise the committed change" }
  propose-change: { command: review-change,  why: "review the raised PR" }
  review-change:  { command: merge-change,   why: "merge on approval" }
  merge-change:   { command: next,           why: "change landed — see what's next" }

# Meta / bootstrap plays — not part of the product pipeline; no Next required.
meta_exempt:
  - install-garura
  - uninstall-garura
  - play-creator
  - play-editor
```
