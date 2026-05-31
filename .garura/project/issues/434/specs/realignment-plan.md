# Realign Garura to the ProductOS Command Model — Plan (locked)

Issue: #434
Source doc: `context/ProductOS_Command_Model.md` (also posted on the issue)
Status: locked, not started

## Goal

Build the ProductOS Command Model fresh and make it how Garura works. Only three
things are kept and maintained: product structure (Domain → Capability →
Functionality), intent (ICE), and decisions. Everything else — specs,
architecture, code scaffolding — is generated on demand and not hoarded.

## Dependency spine (build order)

A (wipe) → B (schemas) → C (KB rebuild) → D (auto-build rules) → E (plays).

- B gates C: the schema defines what a domain/capability/functionality is, so it
  is built before the KB is repopulated.
- D gates E: the evidence rule and the pipeline-position rule must be locked and
  taught to `/sud:create-play` before any play is built, so every play emits them.
- Within E, build order follows the natural flow: strategic fills the model,
  realization turns it into plans, engineering builds, maintenance operates,
  navigation reads state. /learn closes the loop.

## Phase A — Wipe the KB

- **A1** — Delete the entire current KB. Recoverable from git history if needed.

## Phase B — Build the schemas (v1)

- **B1** — ProductOS schema v1: Domain → Capability → Functionality.
- **B2** — ICE schema v1: intent, context, expectations.
- **B3** — Decision schema v1: title, reason, alternatives, status.

Each schema carries its own rules: which plays may fill it, and which plays may
enhance the schema itself.

## Phase C — Rebuild the KB as a 3-level search

- **C1** — Recreate the deleted domains in Domain → Capability → Functionality
  shape, using the Phase B schema.
- **C2** — Make the KB act as a search/router: for any piece of work it answers
  which domain, which capability, and which functionality it belongs to.

## Phase D — Lock the auto-build rules before any play

- **D1 — Evidence rule.** Evidence recording lives only in plays — never agents,
  never skills. It fires on a config setting, tunable per play.
- **D2 — Pipeline-position rule.** Each play declares whether it is the start,
  middle, or end of a pipeline. Start composes in **/start** (resolve issue +
  set up branch + set up worktree if config calls for it). End composes in
  **/raise + /review + /merge**.

Both rules are taught to `/sud:create-play` so every play below emits them
automatically.

## Phase E — Build each command as a play via /sud:create-play

One play per command. As each new play lands, delete the old play(s) it
supersedes (e.g. once /vision and /understand are built, the old `specify` goes
away). Each E task: build the play, declare its pipeline position so D2 injects
the right start/end pieces, then retire the superseded play(s).

### Strategic
- **E1** — /vision
- **E2** — /understand
- **E3** — /shape — reshapes/enhances an existing capability
- **E4** — /roadmap
- **E5** — /learn

### Realization
- **E6** — /realize capability — produces 5 intents: UX, Architecture, Delivery,
  Quality, Agentic
- **E7** — /grill — functionality level (epics, dependencies, acceptance criteria)
- **E8** — /groom — epic level (stories, tests, implementation targets)

### Engineering
- **E9** — /implement
- **E10** — /validate

### Maintenance
- **E11** — /fix
- **E12** — /refactor
- **E13** — /operate

### Navigation
- **E14** — /status
- **E15** — /next

### Git management
- **E16** — /start — resolve issue, set up branch, set up worktree if config calls for it
- **E17** — commit-code
- **E18** — /raise — includes a self-review on scope and quality
- **E19** — /review — checks the invoker's standards, ends in approve or reject
- **E20** — /merge

## Count

1 wipe, 3 schemas, 2 KB rebuild tasks, 2 auto-build rules, 20 plays.

## Decisions log (forks resolved during planning)

1. Break the work down fresh, on the ProductOS doc's own terms — not mapped onto
   the current Garura plays.
2. Schemas are built before the KB rebuild (schema defines the shape).
3. /realize capability stays; functionality-level renamed **/grill**, epic-level
   renamed **/groom**.
4. /realize capability gains a 5th intent: **Agentic intent** (how the capability
   works as and with agents).
5. Review happens twice, two different jobs: **/raise** runs a self-review on the
   change's scope and quality; **/review** checks against the invoker's standards
   and ends in approve or reject.
6. Start-of-pipeline is a real play, **/start** (issue + branch + optional
   worktree), mirroring /raise, /review, /merge on the end side.
7. Evidence recording is play-only and config-driven (D1).
8. Pipeline position is declared per play and auto-built (D2).
