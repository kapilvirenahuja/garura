# Realign Garura to the ProductOS Command Model — Plan (locked)

Issue: #434
Source doc: `context/ProductOS_Command_Model.md` (also posted on the issue)
Status: locked; IN BUILD — live progress in `phase-d-progress.md` (Phases A–D done; Phase E partway)

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
- **B5** — Lens schemas v1: the realize lenses (ux, architecture, run, quality,
  agentic; **+ measure, added 2026-06-11** — schema pending; agentic gains a
  data-substrate block, not a separate data lens). PERMANENT — stored per slice in
  lens/<type>.yaml.

Each schema carries its own rules: which plays may fill it, and which plays may
enhance the schema itself.

**Storage lifecycle (three tiers):**
- PERMANENT (product-os): structure, ICE, decisions, the 6 lenses (2026-06-11: measure
  added; data folds inside agentic).
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

Both rules are taught to the compiler (now **play-creator**; was /sud:create-play) so
every play below emits them automatically.

## Phase E — Build each command as a play via play-creator

One play per command. As each new play lands, delete the old play(s) it
supersedes (e.g. once /vision and /understand are built, the old `specify` goes
away). Each E task: build the play, declare its pipeline position so D2 injects
the right start/end pieces, then retire the superseded play(s).

### Strategic (the strategy pipeline: prototype → vision → understand → shape → roadmap)
- **E0** — /prototype (added 2026-06-11) — strategy opener: throwaway visual model
  (html/css sketch), one shot, for early alignment; output = the aligned story
- **E1** — /vision
- **E2** — /understand
- **E3** — /shape — reshapes/enhances an existing capability
- **E4** — /roadmap — strategy closer

### Realization (the slice pipeline: quality → ux → agentic → arch → measure → run → grill)
- **E6** — the realize lenses, one play per lens, run per SLICE (superseded the original
  "/realize capability writes 5 intents" framing): /quality (opener, selects the slice),
  /ux, /agentic (carries the data-substrate block), /arch, **/measure (E6b, added
  2026-06-11 — delivery-pipe measurement: DORA, Flow, SPACE, DX)**, /run (stamps
  realized)
- **E7** — /grill — slice closer; cuts the realized slice into user-testable epics as
  the delivery handoff
- ~~**E8** — /groom~~ — DROPPED. Issue grain is the epic; /implement absorbs the
  story/test/implementation-target breakdown (test-first).

### Engineering
- **E9** — /implement
- **E10** — /validate — the deep agent-side gate (absorbs the audit concerns:
  security, quality bars in anger, blast radius); position MIDDLE of the epic pipeline
- **E10b** — /launch — the epic closer (position end): UAT/preview deploy per the run
  lens, manual test list from user_check + acceptance, evidenced human sign-off, then
  the close chain

### Feedback (the feedback pipeline, runs on a delivered SLICE: capture → learn → reconcile)
- **E21** — /capture (added 2026-06-11; name suggested, alt: observe) — feedback
  opener: harvests the delivered slice's signals (the delivery KPIs its measure lens
  declared; what the implementation became). Folds in the retired capture/distill
  learning plays' jobs.
- **E5** — /learn (moved here from Strategic — it is the feedback middle): distills
  captured outcomes; also absorbs the orphaned post-merge distill trigger from the
  retired ship play.
- **E13b** — /reconcile (renamed from /find-drift, locked 2026-06-11) — feedback
  closer: brings the PRODUCT MODEL up to match the implementation (all schemas —
  strategy, shape, slices, lenses). The implementation is the ground truth; the model
  reconciles to it. Build on the existing check-drift skill.

### Maintenance
- **E11** — /fix
- **E12** — /refactor — improves an existing slice without changing its behavior
- **E13** — /enhance — extends or changes the behavior of an existing slice
  (slice grain; distinct from /shape, which reshapes/enhances at the capability grain)
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


## Pipeline position map (locked with Kapil, 2026-06-11, #437)

Plays form three-plus-one PIPELINES; the first play of each carries `position: start`,
the last carries `position: end`, and the middles are `none` with a recorded
`position_exception` (they expect an already-started branch, stop when done, and leave
the branch as-is for the next play). Enforced by lint D2b: a model-writing play may not
be position none without an explicit exception.

- **Strategy (5 steps):** prototype (start, NEW) → vision → understand → shape →
  roadmap (end)
- **Slice (7 plays, 6 lenses — corrected and locked 2026-06-11):** quality (start —
  selects the slice) → ux → agentic → arch → measure → run → grill (end). The lens set
  grew 5 → 6: **measure** added; **data folds INSIDE the agentic lens** ("data fits
  into ai" — Kapil; NOT a lens of its own). measure sits before run because /run stays
  the last lens — it stamps `realized` and its lines-up gate must see every lens file,
  measure's included. (extract was proposed 2026-06-11 and DROPPED same day — see
  below.)
- **Epic (3 plays — LOCKED 2026-06-11):** implement (start) → validate (middle — the
  deep agent-side gate) → **launch** (end — the HITL gate; critical step)
- **Feedback (3 plays, runs ON A SLICE — grain locked 2026-06-11):** capture (start,
  SUGGESTED name — alt: observe) → learn → **reconcile** (end). The slice is the unit:
  one feedback run takes one delivered slice — capture harvests its signals (the
  delivery KPIs its measure lens declared, what the implementation actually became),
  learn distills them, reconcile updates that slice's model records to match the
  implementation. reconcile name locked 2026-06-11.
  Direction (Kapil): reconcile brings the PRODUCT MODEL to match the implementation —
  product means all the schemas (strategy, shape, slices, lenses). The implementation
  is ground truth; the model reconciles to it.
- fix-bug stays `both` (its own self-contained pipeline)
- **Handoff rule (made explicit 2026-06-11):** pipelines hand off THROUGH MAIN, never
  through a shared branch. Each pipeline's end merges its branch and deletes it; the
  next pipeline's start cuts a fresh branch off fresh main. So grill's slice branch
  (model artifacts only — lenses, stamp, epics; small PR by construction) is merged and
  gone before implement cuts an epic branch. One PR per slice realization, one PR per
  epic; the epic's user-testability grain is the PR-size governor — an oversized epic
  PR means the cut was wrong, fix it in /grill, not in the pipeline.

### Pipeline extensions (Kapil, 2026-06-11)

- **prototype (strategy opener) — REFRAMED 2026-06-11 (Kapil).** NOT about code: a
  throwaway VISUAL MODEL (html/js/css sketch) built in one shot against the goal so
  alignment happens early and cheaply — lean build-to-learn. Its OUTPUT is the aligned
  story (the whole story vision/understand/shape then formalize), never the artifact.
  WALLS for the build: (1) disposable — never ground truth; reconcile's
  implementation-is-truth rule applies to the real product only; (2) anchoring — vision
  interviews against the GOAL with the prototype as exhibit, never as subject. OPEN:
  what step one prototypes on a brownfield product where the product already exists —
  decide before compiling the play.
- **extract (slice opener) — DROPPED 2026-06-11 (Kapil agreed with the contrarian
  case).** The verification half duplicated gates that exist (readiness gate, grill's
  steelman); the interview half would have created an ungoverned context channel — real
  product knowledge parked in throwaway STM, outside every schema, invisible to
  learn/reconcile. The standing rule instead: interview knowledge that matters flows
  into the ICE/profile through /understand and /shape; lenses keep reading the hub only.
- **launch (epic closer) — LOCKED 2026-06-11; "this HITL is critical" (Kapil).**
  After agent-side validation passes, launch brings the increment up LIVE in a
  UAT/preview environment (per the run lens's dev → uat → prod path), generates the
  MANUAL test list from the epic's `user_check` + acceptance criteria, and the human
  walks it and SIGNS OFF — only then does the close chain merge; production rollout
  follows from main via the run lens's CD. Sign-off must be EVIDENCED (the tests
  shown, the human's typed acceptance recorded — the #436 no-forged-evidence
  discipline applies; an agent never signs for the human). Positions: launch = end;
  /validate flips to MIDDLE (none + exception) and ABSORBS the audit concerns —
  security probing, the non-runnable quality-lens bars exercised in anger, cross-epic
  blast radius — making it the deep agent-side gate. The standalone audit play idea is
  retired; agents build, agents verify hard, the human accepts the running product,
  then it lands.
- **measure lens (LOCKED 2026-06-11; REFRAMED same day — Kapil).** The DELIVERY
  measurement lens: how building this slice is measured — DORA (deployment frequency,
  lead time, change-failure rate, time to restore), Flow metrics, SPACE, and DX — the
  team experience. Realized per slice; sits after arch, before run (confirmed). Feeds
  the feedback pipeline: capture harvests the delivery KPIs measure declared.
  CLOSED (Kapil, 2026-06-11): product-outcome measurement does NOT live at slice
  level — it belongs to the STRATEGY pipeline (the ICE expectations / metrics at the
  model grain strategy owns). The measure lens is delivery-pipe measurement ONLY.
  INTENT SHARPENED (Kapil, 2026-06-11 later session): measure calls out the benefits
  the TEAM gets while delivering this slice — which delivery metrics we are improving
  or want to improve. Schema shape: per metric a BASELINE, a TARGET, and the proof
  source — /capture later proves the improvement. READ RULE (decision 23, trinity
  model): measure is an ENGINE lens — reads the slice hub + all three attribute
  lenses (quality/ux/agentic); the earlier hub-only lean is overturned.
- **data — folds INSIDE the agentic lens (corrected 2026-06-11, Kapil's count: 7
  slice plays = 6 lenses + grill).** The agentic lens schema gains a data-substrate
  block when next touched: the entities the slice owns, source of truth, what
  agents/models may ground on, privacy and retention obligations. No /data play, no
  data.yaml lens file.
- **Lens-count ripple (do when /measure is built):** three gates hard-assert five
  lenses today and must learn SIX — /run's lines-up gate (check_lines_up.py), /grill's
  realized gate (check_realized.py + check_ready_slice), /implement's
  check_ready_epic.py (LENS_TYPES) — plus author-epics (reads every lens), the B5 lens
  schemas (add measure.yaml; extend agentic.yaml with the data-substrate block), and
  product-os-keeper's registrations. New play to build: /measure (position none +
  middle exception, like the other lens middles). WIDENED by decision 23 (trinity
  read rules): the ripple also covers the per-lens isolation constants in all five
  existing lens plays (validate_{quality,ux,agentic,arch,run}.py OTHER_LENSES /
  FORBIDDEN_LENS_SOURCES lists) AND an ICE-first widening of arch + run (engine
  lenses read the slice hub + the three attribute lenses, not hub-only /
  arch-only); the schema index `lens/_index.md` ("the five realize lenses") and
  the pipeline strings in the five lens SKILLs + three ICEs also update.
- **capture (feedback opener) — suggested.** Gathers the raw outcomes (usage, incidents,
  feedback, what the repo actually became) before learn distills and reconcile rewrites
  the model. Folds the retired capture/distill learning plays' jobs into the pipeline.
- **Sequencing rule:** vision KEEPS its start head until /prototype actually lands;
  prototype's build includes flipping vision to middle (none + position_exception).
  quality keeps the slice start head permanently (extract was dropped). Pipelines stay
  runnable throughout.

## Count (updated 2026-06-11)

1 wipe, 3 schemas, 2 KB rebuild tasks, 2 auto-build rules, **28 plays**:
strategy 5 (prototype, vision, understand, shape, roadmap) + slice 7 (quality, ux,
agentic, arch, measure, run, grill) + epic 3 (implement, validate, launch) + feedback 3
(capture, learn, reconcile) + maintenance 3 (fix, refactor, enhance) + navigation 2
(status, next) + git 5 (start, commit-code, raise, review, merge).
History: 21 after the 2026-06-09 reshape; 2026-06-11 added prototype, measure, launch,
capture (+4 → 25... plus the original 21 included find-drift which became reconcile);
extract was proposed and dropped the same day. Built so far: the git 5, strategy 4
(vision…roadmap), slice 6 of 7 (measure pending), epic 1 of 3 (implement), fix.

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
   holds behavior). /find-drift added — RENAMED /reconcile (2026-06-11): brings the product model
   to match the implementation (implementation = ground truth); can be built on the
   existing `check-drift` skill (`core/components/skills/check-drift`).
18. Pipeline position map locked (2026-06-11, #437): four pipelines — strategy,
   slice, epic, feedback — each opened by a `position: start` play and closed by a
   `position: end` play; middles are none + recorded exception (they expect an
   already-started branch, stop, and leave it for the next play). Pipelines hand off
   THROUGH MAIN, never a shared branch. Enforced by lint D2b (a model-writing play
   may not be position none without an explicit exception).
19. Lens set is SIX (2026-06-11): measure added (delivery-pipe measurement only —
   DORA/Flow/SPACE/DX; product outcomes are strategy's to measure); data is NOT a
   lens — the agentic lens gains a data-substrate block. Slice pipeline = 7 plays
   (6 lenses + grill); run stays last lens and keeps the realized stamp.
20. Epic pipeline = implement → validate → launch (2026-06-11). /launch is the HITL
   closer: UAT/preview deploy, manual tests from user_check + acceptance, EVIDENCED
   human sign-off, then the close chain. /validate is the deep agent-side middle
   gate, absorbing the audit concerns (security, quality bars in anger, blast
   radius); the standalone audit idea retired.
21. Feedback pipeline runs on a delivered SLICE (2026-06-11): capture → learn →
   reconcile; reconcile direction = the model reconciles TO the implementation.
22. /prototype reframed (2026-06-11): a throwaway VISUAL model for early alignment
   (lean build-to-learn) — never ground truth; vision interviews against the goal
   with the prototype as exhibit. /extract proposed and DROPPED the same day (would
   duplicate existing gates and park ungoverned knowledge in STM).
23. Slice Trinity Model — the spine (2026-06-11, Kapil; full doc:
   `specs/slice-trinity-model.md`). The Hub = strategy (vision→roadmap — what we
   build, why, which business KPIs; "the everything"); slices are frames cut from
   it that individually move the same KPIs. The 7 slice plays are 3-3-1 primes:
   ATTRIBUTE trinity (quality/ux/agentic — modify how we look at the Hub, what we
   want to achieve) + ENGINE trinity (arch/measure/run — takes the slice hub,
   understands the three attribute lenses, applies execution; the load-bearing
   one) + grill (the closer, outside both). Stability principle: attribute churn
   is normal, engine churn is an event that ripples to the lenses. READ RULES:
   attributes read the slice hub only (isolated as today); ENGINE lenses read the
   slice hub + ALL THREE attribute lenses (overturns hub-only for measure; arch
   and run isolation rules widen ICE-first at the measure build); grill reads
   everything. Pipeline ORDER unchanged. Future: an analytics/business-measurement
   piece at the Hub signals slice drift → attribute-lens revisit (END of this
   phase — standing reminder); measure stays delivery-pipe only.
24. Command taxonomy + pipeline split (2026-06-11, Kapil; same doc
   `specs/slice-trinity-model.md`). Six groups + orchestration: STRATEGY
   (vision→understand→shape→roadmap, works on the Hub, outputs slices); LENS
   (quality→ux→agentic, on a slice; was "attribute trinity"); FOUNDATION
   (arch→measure→run, on a slice; was "engine trinity"); GRILL (standalone between
   foundation and execute — relentlessly interviews until it has ALL the
   information about the slice); EXECUTE (implement→validate→launch, on a slice,
   EPICS as the working unit; was "epic pipeline"); ALIGNMENT
   (capture→learn→reconcile, updates slice + Hub to align with what's implemented;
   was "feedback pipeline"); ORCHESTRATION = the *-change plays, applied
   AUTOMATICALLY to every group. Each of the five groups has a start and an end
   (D2). SUPERSEDES decision 18's pipeline map in part: the single slice pipeline
   SPLITS — lens = quality (start) → ux → agentic (END, gains the close chain);
   foundation = arch (START, gains the head) → measure → run (END, gains the close
   chain); grill = position BOTH (CONFIRMED by Kapil 2026-06-11: self-contained
   like fix-bug, still works on the slice, still the slice's END conceptually;
   supersedes #437's end-of-slice-pipe framing — there is no single slice pipe
   anymore). Position ripple to recompile when applied: agentic none→end, arch
   none→start, run none→end, grill end→both; quality stays start, ux + measure
   stay middle exceptions. Handoff still through main. NAMING
   WATCH (Razor 5): group "lens" vs the six lens/*.yaml schema files (foundation's
   arch/measure/run are also "lenses" in the schema sense) — schema language keeps
   "the six realize lenses"; the GROUP lens means only quality/ux/agentic.
