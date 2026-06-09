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

- **B1** — Product-OS schema v1: Domain → Capability → Functionality (+ personas,
  journeys, node.depends_on).
- **B2** — ICE schema v1: intent; context (persona, systems, scope);
  expectations (outcomes). The build unit.
- **B3** — Decision schema v1 (= ADR, at any level): title, reason, alternatives,
  status.
- **B4** — Epic schema v1: a vertical slice of a functionality, the unit of
  delivery/issue. TEMPORARY — written by /grill, deleted on its issue merge.
- **B5** — Lens schemas v1: the 5 realize lenses (ux, architecture,
  run, quality, agentic). PERMANENT — stored at {capability}/lens/<type>.yaml.

Each schema carries its own rules: which plays may fill it, and which plays may
enhance the schema itself.

**Storage lifecycle (three tiers):**
- PERMANENT (product-os): structure, ICE, decisions, the 5 lenses.
- TEMPORARY (product-os): epics — survive the /grill → /implement pipeline
  boundary, deleted on merge.
- STM only: stories, tests, build detail produced by /implement.

## Phase C — Rebuild the KB as a 3-level search

- **C1** — Recreate the deleted domains in Domain → Capability → Functionality
  shape, using the Phase B schema.
- **C2** — Make the KB act as a search/router: for any piece of work it answers
  which domain, which capability, and which functionality it belongs to.
- **C3** — Build the **component + capability inventory** as selectable catalogs
  (like the domain inventory), profile-aware. NOT built now — this task HOLDS the
  locked definition below for when it is.

  **Locked architecture vocabulary (#434):**
  - **Component** (a.k.a. platform / tier) — a HORIZONTAL: a platform or tech
    tier such as CMS, DXP, a microservices tier, web/experience, channel/BFF,
    cache, security, the data tier. Shared across the product; it holds parts of
    many domains. Its internal apis/services/stores can change; the component
    SET and the CONTRACTS between components are the stable seams.
  - **Layer** — the horizontal organisation of components (experience → process
    → domain, plus cross-cutting like security/infra). Components sit in layers.
  - **Domain / Capability** — a VERTICAL. A domain and its capabilities/
    functionalities thread top-to-down THROUGH the components; data and logic
    flow through them. "Capability" is reserved for the domain-tree vertical
    (e.g. Authentication) — never for a horizontal.
  - **Contract** — the seam between two components; includes the data model the
    component owns.
  - **Build / epic** — a vertical end-to-end slice of a capability through its
    components. End-to-end or the story failed.

  The inventory is two orthogonal menus: horizontal components/platforms ×
  vertical domains/capabilities. /shape selects capabilities (verticals);
  /realize's architecture lens selects the components (horizontals) a capability
  threads. Assemble from a known menu, never invent each time.

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
- **E6** — /realize capability — writes the 5 permanent intents (UX,
  Architecture, Run, Quality, Agentic) into the capability lens/ folder
- **E7** — /grill — functionality level; cuts vertical-slice epics (with context
  + acceptance) into product-os as the delivery handoff
- ~~**E8** — /groom~~ — DROPPED. Issue grain is the epic; /implement absorbs the
  story/test/implementation-target breakdown (test-first).

### Engineering
- **E9** — /implement
- **E10** — /validate

### Maintenance
- **E11** — /fix
- **E12** — /refactor — improves an existing slice without changing its behavior
- **E13** — /enhance — extends or changes the behavior of an existing slice
  (slice grain; distinct from /shape, which reshapes/enhances at the capability grain)
- **E13b** — /find-drift — detects drift between the implementation and the slice/shape
  it was built from
- ~~/operate~~ — DROPPED (was E13). Day-to-day running is not a Garura command.

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

1 wipe, 3 schemas, 2 KB rebuild tasks, 2 auto-build rules, 21 plays
(was 20 before the 2026-06-09 maintenance reshape; /operate dropped, /enhance and
/find-drift added → net +1).

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
9. Realization detail is STM and regenerated on demand (Option A), with two
   exceptions kept in product-os: the 5 lenses (permanent) and epics
   (temporary, deleted on merge).
10. /groom dropped — the epic is the delivery grain and /implement absorbs the
   story/test/implementation-target breakdown, test-first.
11. The epic is the unit of delivery and the grain an issue is cut at (a vertical
   slice). Functionality is the unit of intent; epic is the unit of delivery.
12. Two pipelines: shaping (/vision → /grill, no delivery issues) defines the
   epic backlog; delivery opens one issue per epic via /start and closes it at
   /merge. /shape never cuts a delivery issue.
13. ICE context = persona, systems, scope (users→persona; dependencies dropped,
   now node.depends_on; assumptions→scope). Same shape at capability and
   functionality. Expectations trimmed to outcomes.
14. The profile is the BOX (per NFR dimension: level + gate), governed; ICE holds
   the concrete specifics under it; an out-of-box specific halts for human
   approval and moves the box as a decision. Capabilities shape the box, never
   silently redraw it.
15. The 5 realize lenses are PERMANENT in product-os, per capability — NOT
   throwaway. Considered generating them on demand pinned by decisions; chose to
   keep them as the canonical realization. The schema "capability-intent" is
   renamed **lens** and split into `lens/{type}.yaml` (ux, architecture, run,
   quality, agentic). The "delivery" lens is renamed **run**.
16. Lens framings locked: architecture = horizontal components a capability
   threads + contracts + versioned stack (vertical build); ux = screens/states/
   flows/a11y/design-system; run = environments/rollout/migrations/config/cicd;
   quality = gates only (the list the ICE must pass); agentic = the 3 weights
   (cognitive/creative/logistical) + bounds (the 7 principles are build mechanics,
   not the lens).
17. Maintenance group reshaped (2026-06-09): /operate dropped (day-to-day running
   is not a Garura command). /enhance added — extends/changes behavior of an
   existing slice (slice grain, vs /shape at capability grain, vs /refactor which
   holds behavior). /find-drift added — detects drift between implementation and
   the slice/shape it was built from; can be built on the existing `check-drift`
   skill (`core/components/skills/check-drift`).
