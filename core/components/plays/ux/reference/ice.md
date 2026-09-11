# ux — ICE source

The clean ICE triple this play is compiled from. Update this and recompile via
play-editor; never hand-edit the compiled SKILL.md.

## Intent

Given one shaped **slice** — a vertical product increment from /shape, the thing you actually
deliver — write its **UX lens** as a grounding doc (`ux.md`): just enough to anchor the
intended experience and let the build figure the rest. The slice is the unit of realization; a
slice has no ICE of its own — its **hub** is the union of its functionalities' grounding docs
(`functionality.md`, which may span several capabilities), the product profile (read from the
spine), and the slice's **persona and journey records** — the personas its surfaces name and
every journey that runs on one of those surfaces. Those records already hold who the user is and
the ordered steps they take; /ux reads them rather than inventing a path. The lens is four things and only four: the **screens** the slice needs, each naming the
one object the user works with there plus a low-fidelity layout; the **flows** — for each persona
and goal, the ordered path through those screens, its forks, its failure path, and its exit; the
**states** each screen can hold, each with the trigger that puts the screen in it; and the
product's **visual core** — the semantic meaning the visuals must carry, plus the design-system
reference the look itself comes from. /ux does not choose palette or typography. Alongside the
lens the run draws the slice as **wireframes** — a machine-readable `screens.yaml` the play
authors and a `wireframes.html` a script renders from it, ordered by journey step — because a
prose layout is not something a product owner can look at and approve, and the approval is the
whole point of the checkpoint. Together the screens and the flows answer the
two questions a UX researcher opens this doc to answer — what the user is dealing with, and how a
person actually moves through it; the wireframes answer the product owner's one question, which
is what it will look like to the person using it — and they make every functionality of the slice
visible, so a human can confirm the shape and the intent under it. Accessibility is NOT in this lens — it lives
in the marketing lens now. The flows here are the paths **inside this slice's screens**; the
person's wider journey across the product is not this lens's to write (that is /story's, #528).
Every screen is grounded in one of the slice's functionalities or a persona/journey; the visual core and any
design directive the design settles are deliberate choices recorded as decisions; the cross-cutting pattern
choices (navigation, responsive strategy) are grounded in the KB or recorded as a KB-learning-gap
proposal. It writes only this slice's `ux.md`, its wireframe artifacts, and its decisions — never
the spine, the slice record, the profile,
another lens, or another slice. One slice per run; one human checkpoint before anything persists.
The lens is gated by the structural linter (shape) and the content-quality eval (a judge).

Pipeline position: **start**. /ux is the START of the FUNCTIONAL realize pipe (ux → agentic →
marketing): the D2 rule prepends `start-change` — resolve or create the slice-realize issue, cut
the branch off fresh main, optional worktree, init STM — so /agentic and /marketing run on this
already-started branch. No pipeline close sequence (no end PR) is injected here; the functional
pipe closes at /marketing. It writes the persistent product model **directly, in place** (the
slice's ux lens, its wireframe artifacts, and its decisions) on the started branch — there is no draft copy and
no apply/promote step; review is the branch git diff and the pipeline's end PR. It reads the hub
only (the slice's functionalities' grounding + the profile); never another lens. (#437,
decision 24; 3-pipe realize 2026-06-25; #500, ADR 026)

Write discipline (ADR 026, `standards/rules/direct-model-write.md`): the LLM authoring skill
writes ONLY the per-node files — the grounding doc (`ux.md`) and the wireframe record
(`lens/screens.yaml`) — straight to the live model, and the bundled render script writes only
`lens/wireframes.html` from that record; the one shared-file
mutation — the `decisions/*.yaml` for the visual core and any design directive (slice-level,
`skip-if-exists`) — is done by the
deterministic keyed persist script, in place, keyed to the target slice so it cannot touch
another slice's decisions and never edits an accepted decision in place; it reads the skill's
manifest (an STM, non-model artifact) for the decision delta. Because the LLM only ever writes
per-node files in the slice's own folder, containment is a post-write scoped guard over the full delta
(`scoped_write_guard.py`), not a draft. Clean tree in, committed delta out: the product-os tree
is asserted clean once start-change has cut the fresh branch, and after the approved checkpoint
the play commits its own model delta on the branch, so the working-tree diff vs HEAD is exactly
this run's delta and the next pipeline play (/agentic) enters clean.

### Constraints

- C1 — One slice per run, and only a ready one: the slice exists (shaped by /shape), every
  functionality it bundles resolves through the spine to a `functionality.md` grounding doc, the
  product profile is firmed (`set`), and the slice's persona + journey records resolve — every
  `surface[].persona_ref` opens a real persona record, and every slice surface is reached by at
  least one journey record whose own `persona_ref` resolves. A reference that resolves to nothing
  is a BROKEN hub, not an empty one — halt. /ux realizes a shaped slice; it does not shape one,
  and it does not invent the person or the path.
- C2 — Writes only this slice's `ux.md` and `lens/screens.yaml` (by the LLM skill),
  `lens/wireframes.html` (by the bundled render script), and its decisions — the visual core and
  any design directive the design settles (by the keyed persist) — in place on the live model in
  the slice's folder. Never the spine, the slice
  record, the profile, another lens, the node tree, personas, journeys, or other slices. A
  product-wide surface map spans slices and is therefore never /ux's to write.
- C3 — Shape: `ux.md` conforms to the UX lens template — the sections Intent, Screens (name +
  who opens it + the one object the user works with there + low-fidelity layout), Flows (per
  persona and goal: entry point, ordered steps each naming a screen and the action, decision
  points naming where each branch goes, the failure path, and the exit), States (per screen, each
  state naming its trigger, what the user sees, and what they can do next), and Visual core
  (the semantic state vocabulary and its tone map, the rule that a state word always prints
  alongside its colour, and the design-system reference the look comes from — or an explicit
  "none yet"; never a chosen palette or type scale) — and the structural linter passes. The
  section headings are unchanged. No accessibility block, no
  gates/components/environments, no journey that leaves this slice's screens.
- C4 — Content quality: `ux.md` clears the content-quality eval, not just the linter — each
  section is self-explaining and the doc passes the stranger test — AND it is TRUE about the hub
  it describes, which is mechanical, not a judge's opinion: every role named anywhere in the doc
  resolves to a persona record the readiness check handed over (a role the model invented, like
  "a general viewer" or "the actor", is a failure), and every screen is named by at least one
  journey step's `covered_by`. A well-formed doc that describes people and screens the model does
  not have is a fail, not a pass with a caveat.
- C5 — Grounded, not invented: every screen traces to one of the slice's functionalities or to a
  persona/journey; every frame in the wireframe record traces to a journey step or carries a named
  gap; the visual core — the semantic vocabulary and the design-system reference — is a deliberate
  choice recorded as a decision. (Tracked in the grounding manifest.)
- C6 — Coverage: every functionality the slice bundles is visualized by at least one screen, so
  the human can validate the whole shaped increment. Nothing shaped is left unvisualized, and no
  screen is left unreachable — every screen appears as a step in at least one flow.
- C7 — Reads the hub only: /ux derives from the slice's functionalities' grounding docs, the
  profile, and the slice's persona + journey records — never from another realize lens
  (quality/agentic/architecture/run/measure/marketing).
- C8 — The visual core is a material choice recorded as a slice-level decision the whole product
  references; it is not re-invented per slice. Designing a slice also settles things that are not
  visual and that the technical design must inherit rather than rediscover — how a person's
  permission to act is modelled, what a value the screens depend on must have a schema for, what
  is deliberately left out. Each such settled thing is recorded as its own slice-level **design
  directive** decision naming what it binds downstream, so /arch and /implement read it instead of
  the design being retold by hand. A run may record none, one, or several; a directive is recorded
  only where the design actually settled something, never manufactured to fill the slot.
- C9 — Additive and non-destructive, enforced by the containment split and the post-write scoped
  guard: the LLM authoring skill writes only the per-node `ux.md` and `lens/screens.yaml`
  (re-derive overwrites the prior lens and screen record on a re-run), the bundled render script
  writes only `lens/wireframes.html` from that `screens.yaml`, and neither ever writes a shared
  file; the keyed persist script writes the visual-core and design-directive
  decisions `skip-if-exists`, keyed to the slice, and refuses to touch another slice's decisions
  or edit an accepted decision in place — the node-level containment the file-level guard cannot
  provide. After ALL writes and before the checkpoint, the bundled `scoped_write_guard.py` diffs
  the model tree against HEAD and FAILS the run (reverting the offending paths) if any model path
  changed outside the run's write scope — `ux.md`, `lens/screens.yaml` and `lens/wireframes.html`
  are `--allow` (the re-derive may overwrite them)
  and the slice's `decisions/*` are `--add-only` (a new decision may be added, an accepted one
  never modified). The spine, the slice record, the profile, the other lenses, and the other
  slices are byte-unchanged.
- C10 — UX pattern choices are grounded, never the model's taste. The navigation pattern and the
  responsive strategy trace to a best-fit learning on the KB's technology/architecture shelf
  (matched via kb-search) or to a recorded KB-learning-gap proposal. The **look** is not one of
  these: palette and typography are not chosen by /ux at all, so they are grounded by naming the
  project's design-system reference in the lens — or by stating plainly that none exists yet. A
  missing design system is a recorded fact, never a licence to invent one, and never a KB gap to
  fill: no KB shelf can tell a project what its brand is.
- C11 — Exactly one human checkpoint, presenting the proposed screens (with layouts and the object
  each is about), flows, states, and visual core, plus the decisions — and **handing over the
  artifacts themselves before it will take an answer**: the checkpoint prints the exact on-disk
  path of the lens and of the rendered `wireframes.html`, and states plainly that the wireframe
  page is the thing to open. A summary of the work is not the work; an approval given by someone
  who has not been offered the artifact is the play reviewing itself. The response is typed —
  never a picker, never a menu. On the auto-pass path nobody is waiting, so the same paths are
  written into the recorded diff summary instead, so the human who reads it later lands on the
  artifact rather than on a description of it. The checkpoint is a **conditional
  gate** (#467; `gate-config.md` three kinds — /ux is one of the eleven conditional document
  plays). Resolution order: pinned (n/a here) → `gates.plays` override → the learned policy
  (classify the working-tree change shape — the model tree's diff vs HEAD — with the bundled
  `classify_change.py` (`--product-base`/`--base-ref HEAD`); a shape in `gate-policy.yaml`'s
  `auto:` and not in `never_auto:`, with NO blocking finding — lint gap or content-eval fail —
  auto-passes with the skip and the diff summary recorded) → `gates.classes.standard` →
  `gates.default`. EVERY crossing appends one live-eval line via the bundled `gate_eval.py`
  (shape, predicted gate|auto, the human's real action approved_clean|approved_edited|rejected,
  or auto_pass). Write-then-review (ADR 026): the run writes the full delta to the live model
  FIRST (the `ux.md` by the authoring skill, the visual-core decision by the keyed persist), so
  the checkpoint presents the real model git diff and the change-shape is classified over the
  full delta; nothing is COMMITTED before the gate resolves — a typed approval, a recorded config
  skip, OR a recorded policy auto-pass. On cancel the whole model delta is reverted (`git restore`
  + `git clean` over the model paths via the guard `--restore` with an empty allow set) — the
  branch, issue, and STM that start-change created are its own committed side effects and are
  left as-is. At close the play refreshes the learned policy with the bundled
  `distill_gate_policy.py` (config `gates.conditional`: streak/ledger/policy paths).
- C12 — The play ends by proving its Done means at close (gated, #464): the keyed persist record
  exists (`persist-manifest.json` — the visual-core decision written in place and the live `ux.md`
  confirmed on the model tree), the persist record stamps the write applied, and the scoped-write
  guard report (`guard-report.json`) reads ok (the allowlist held) — never prose claims. The play
  then commits its own model delta on the branch. A close whose Done means does not hold reads
  HALTED, never COMPLETED. This per-play Standard Play Close (evidence + delivery report) is
  distinct from the pipeline end sequence (the end PR), which /ux does not run — that closes at
  /marketing.
- C13 — Clean tree in, committed delta out (ADR 026): once start-change has cut the fresh branch,
  the product-os tree is asserted clean (a dirty model tree halts), so HEAD is a correct base for
  the scoped guard and the change-shape; and after the approved checkpoint the play commits its
  model delta on the branch (`feat(model): … (#<issue>)`), so the next pipeline play (/agentic)
  enters a clean tree with a correct base. This model-delta commit is a lightweight persist step,
  distinct from the Standard Play Close; it is not the pipeline end sequence.

- C14 — Flows are complete and internally consistent, so the doc is readable by a UX researcher
  and parseable by an agent: every flow names its persona, its goal, its entry point, its ordered
  steps, its decision points, its failure path, and its exit; every step names a screen that
  exists in the Screens section; every decision point names where each branch goes; and every
  screen is reached by at least one flow step. Each flow EXPANDS one of the slice's journey
  records onto its screens — the journey supplies the persona and the ordered steps, /ux adds the
  screen each step happens on, the forks, the failure path and the exit — so a flow is never
  invented. Every flow names the journey id it expands and the persona id that journey serves,
  and both ids RESOLVE to real records handed over by the readiness check; a name that resolves
  to nothing is a failure, not a warning. The cross-check is mechanical (the bundled
  `validate_ux.py`), not a prose claim.

- C15 — The slice is DRAWN, not only described. Every run produces two wireframe artifacts beside
  the lens, and a run that produces neither has not finished: `lens/screens.yaml`, the machine-
  readable record of the slice's frames, and `lens/wireframes.html`, the page a product owner
  opens. A prose layout inside `ux.md` is the information architecture; it is not a wireframe, and
  the two are not substitutes.

  **What the record holds.** `screens.yaml` carries the slice's personas, its surfaces (each with
  the medium it runs on), its journeys, and its screens. Each screen names its surface, its one
  persona, when it is opened, and the functionalities or journey it is grounded in; holds an
  ordered list of **moments** — the screen walked through in sequence, each moment stating what
  the person sees, what they do, why each visible detail is there, and the literal frame body as
  it would read to that person; a **regions** list; a **states** closed set, each state carrying
  one of the tones in the visual core's map; and the invariants the screen must hold. Frames are
  tied to the journey **through the journey, not through the screen**: each journey step names the
  moments that cover it (`covered_by: [S1.m1, S1.m2]`), so ordering follows the journey and adding
  a moment renumbers nothing else. A journey step that no moment covers is recorded as a named gap
  on that step, not silently dropped and not a halt — an honest gap is a finding the human needs.

  **Who does which half.** Everything with words in it is judgment and belongs to the authoring
  skill: the record itself, what each frame shows, the literal frame body, the sample values, and
  the note explaining why each detail is there. Everything with no judgment in it is mechanical
  and belongs to the bundled render script: the page skeleton, one section per journey, one rail
  entry per journey step, the terminal or browser chrome chosen from the surface's medium, the
  numbered callouts, the state chip row from the tone map, the gap callouts, and the fixed
  per-frame line naming the artifact as structural and saying where the real look comes from. The
  page is never hand-written; a hand-written page and its record drift apart on the next re-run.

  **Structural, not styled.** A frame carries real labels and real content and no invented palette,
  type scale, or component library — the same rule C10 puts on the lens. Whatever legibility
  styling the page itself uses is the document's, never a claim about the product's look.

### Failure conditions

- F1 — /ux ran on an unready slice — the slice is absent, a functionality does not resolve to a
  grounding doc, the profile is not firmed, a surface's `persona_ref` resolves to no persona
  record, or a slice surface is reached by no journey record.
- F2 — A write touched something other than this slice's `ux.md` or a decision (the spine, the
  slice record, the profile, another lens, structure, a persona, a journey, or another slice).
- F3 — `ux.md` fails its template/shape (a missing or extra section, an empty or telegraphic
  section), or carries content outside screens/flows/states/visual core.
- F4 — `ux.md` fails the content-quality eval — it is not self-explaining, or it is not true about
  the hub: a role it names resolves to no persona record, or a screen it declares is named by no
  journey step.
- F5 — An element is invented — a screen with no functionality and no persona/journey behind it,
  or a visual core with no recorded decision.
- F6 — A functionality of the slice is left unvisualized — covered by no screen.
- F7 — /ux read or depended on another lens.
- F8 — The visual core was set with no decision recorded, or the design settled something the
  technical design must inherit and it was left in the prose instead of recorded as a design
  directive decision.
- F9 — Allowlist breach: a product-model path other than this slice's `ux.md` or its
  visual-core decision changed, or an accepted decision was edited in place rather than added —
  the scoped-write guard's report is not ok.
- F10 — The navigation pattern or the responsive strategy rests on neither a matched KB learning
  nor a recorded proposal; or /ux chose a palette or a type scale instead of naming the project's
  design-system reference (or recording that none exists yet).
- F11 — The model delta was COMMITTED before the checkpoint gate resolved (no typed approval, no
  recorded config skip, and no recorded policy auto-pass), or a cancelled checkpoint left model
  writes on the working tree instead of reverting them, or the checkpoint took an approval without
  first handing over the lens and wireframe paths (on the auto-pass path, without writing them
  into the recorded diff summary).
- F12 — The run closed COMPLETED without the Done means held — no persist record, the persist not
  stamped applied, the scoped-write guard report not captured or not ok, or the model delta not
  committed.
- F13 — A conditional-gate crossing left no live-eval ledger line, or an auto-pass fired for a
  shape the policy does not list as auto (or that carried a blocking finding).
- F14 — The play ran against a dirty product-os tree (uncommitted model edits present once
  start-change had cut the branch), so the change-shape and the scoped guard could not be trusted
  to reflect only this run's delta.

- F15 — A flow is unusable: it names no persona, goal, entry, failure path, or exit; a step names
  a screen that does not exist in Screens; a decision point does not say where a branch goes; a
  screen is reached by no flow; or a flow's persona traces to nothing in the hub.

- F16 — The slice was described but not drawn: `lens/screens.yaml` or `lens/wireframes.html` is
  missing; the page was hand-written rather than rendered from the record, so the two disagree; a
  screen in the record is named by no journey step's `covered_by` and carries no recorded gap; a
  moment holds no frame body, so there is nothing to draw; a state names a tone outside the visual
  core's map; or a frame carries an invented palette, type scale, or component library.

## Expectation

### Success scenarios

- S1 — (product designer, first run) Given a shaped slice whose functionalities resolve and a
  firmed profile, when /ux runs and the checkpoint is approved, then `ux.md` is written as screens
  (with layouts), flows, states, and a visual core — passing the linter and the content eval — and
  nothing else changes. Measure: `slices/{slice}/lens/ux.md` exists and is a valid UX Lens doc;
  the content-eval gate passes; the spine, slice record, profile, and other lenses are
  byte-identical.
- S2 — (product owner, validates the shape) Given the screens are drafted, when shown them, the
  human sees every functionality of the slice rendered as a low-fidelity screen. Measure: every
  functionality the slice bundles maps to at least one screen in the manifest; none unvisualized.
- S3 — (ux researcher, grounded) Given the lens is drafted, each screen traces to a functionality
  or a persona/journey, each flow to a journey record of the slice, and the visual core to a
  recorded decision. Measure: the manifest names a real source for every screen; every flow's
  journey id and persona id resolve to records the readiness check handed over; every role the doc
  names resolves to a persona record and every screen it declares is named by a journey step; the
  visual core names a decision that resolves, and names a design-system reference or records that
  none exists.
- S4 — (architect, hub-only) Given /ux runs, it read no other realize lens and wrote none.
  Measure: no other lens of the slice is touched; no screen grounds on a lens.
- S5 — (product owner, re-run) Given /ux already ran, when it runs again, it re-derives `ux.md`
  and changes nothing else; the visual-core decision is reused, any new decision supersedes.
  Measure: only the slice's `ux.md` (and possibly a new decision) differ; the spine, slice record,
  other lenses, and profile are byte-identical; no accepted decision edited in place.
- S6 — (reviewer, the checkpoint) Given the full delta is written in place, the checkpoint presents
  the screens (with layouts), flows, states, and visual core, plus the decisions, inline over the
  real model git diff, AND hands over the on-disk path of the lens and of the rendered wireframe
  page before it takes an answer, so the human approves the artifact rather than a description of
  it. Measure: the checkpoint shows the lens inline and prints both artifact paths (auto-pass path:
  both paths appear in the recorded diff summary); no product-model change is
  COMMITTED before approval, and on cancel the working tree returns byte-clean to HEAD (`git
  restore` + `git clean`) — or, on the auto-pass path, the change shape is policy-listed and a
  recorded auto-pass + live-eval ledger line + diff summary exist, with no wait.

- S7 — (ux researcher, reads the flows) Given the lens is drafted, a UX researcher can answer both
  of their questions from the doc alone: what the user is dealing with on each screen, and the
  exact path a given persona takes to reach their goal, including where it forks, what happens
  when it fails, and where it ends. Measure: every screen names the one object it is about; every
  flow names persona, goal, entry, ordered steps, decision points, failure path, and exit; every
  step resolves to a screen in Screens; every screen appears in at least one flow;
  `validate_ux.py` reports the flow cross-check ok.
- S8 — (product owner, looks at the product) Given the run has drawn the slice, the human opens one
  page and walks each journey as a person would live it — the frames in journey order, each showing
  real labels and real content, with the gaps the drawing exposed named on the step that has them.
  Measure: `lens/screens.yaml` and `lens/wireframes.html` both exist; the page regenerates from the
  record byte-for-byte (it was rendered, never hand-written); every journey step resolves to the
  moments that cover it or carries a named gap; every moment holds a frame body; no frame carries a
  palette, type scale, or component library.

### Done means

Paths are relative to the run's working root (`{stm_base}_realize/ux/<slice>/`).
`wireframe-report.json` is the captured output of the bundled render script — it names both
artifacts, re-renders the page from the record to prove the page was generated and not
hand-written, and reports the journey-step coverage and any recorded gaps; its `ok` field is the
mechanical proof that the slice was drawn (C15, F16).
`persist-manifest.json` is the record the keyed persist script writes after the approved
checkpoint — the visual-core decision written in place on the live model and the live `ux.md`
confirmed on the model tree (`applied: true` is its stamp); `guard-report.json` is the captured
`scoped_write_guard.py` output — the play always writes it, and its `ok` field is the mechanical
proof that no model path changed outside the slice's write scope (the allowlist held). A re-run
that reuses an existing visual-core decision still stamps `applied: true` — the clause asserts
the always-written record, not a newly-added decision.

- D1 — says: "the persist record exists — the visual-core decision was written in place and the
  live UX lens was confirmed on the model tree"
  check: { type: artifact_exists, path: "persist-manifest.json" }
- D2 — says: "the write was persisted — the persist record stamps it applied"
  check: { type: field_equals, file: "persist-manifest.json", field: "applied", equals: true }
- D3 — says: "the scoped-write guard held — no model path changed outside the slice's write scope"
  check: { type: field_equals, file: "guard-report.json", field: "ok", equals: true }
- D4 — says: "the slice was drawn — the wireframe record and the rendered page both exist, and the
  page was rendered from the record"
  check: { type: field_equals, file: "wireframe-report.json", field: "ok", equals: true }

### Recovery (one per failure condition)

- REC1 (F1) — trigger: the slice is absent, a functionality does not resolve, the profile is not
  firmed, a surface's persona does not resolve, or a surface is reached by no journey. direction:
  halt and route to /shape (shape the slice; /shape owns the persona and journey records and
  already guarantees a journey per surface) or /understand (detail + firm) before /ux runs; never
  invent the missing persona or journey. handoff: human.
- REC2 (F2) — trigger: a write touched something beyond this slice's `ux.md` or a decision.
  direction: revert the out-of-scope write; /ux writes only the slice's `ux.md` (and the
  visual-core decision). handoff: autonomous.
- REC3 (F3) — trigger: `ux.md` fails the template/shape or carries out-of-scope content.
  direction: re-emit the doc to the UX lens template — Intent/Screens/Flows/States/Visual core
  only (accessibility belongs to marketing; the wider cross-product journey belongs to /story).
  handoff: autonomous.
- REC4 (F4) — trigger: `ux.md` fails the content-quality eval — not self-explaining, or naming a
  role that resolves to no persona record, or declaring a screen no journey step names. direction:
  rewrite the failing section to the judge's cited fixes; for a role that resolves to nothing,
  replace it with the persona record it was standing in for (never add the persona — /shape owns
  those); for a screen no journey step names, tie it to the step it serves or drop it. Re-judge
  and re-run the grounding cross-check until both pass. handoff: autonomous.
- REC5 (F5) — trigger: an invented/ungrounded element. direction: drop it, or re-tie the screen to
  a functionality or persona/journey, and tie the visual core to a decision. handoff: autonomous.
- REC6 (F6) — trigger: a functionality is covered by no screen. direction: add the screen(s) that
  visualize the missing functionality. handoff: autonomous.
- REC7 (F7) — trigger: /ux read or depended on another lens. direction: remove the dependency;
  /ux derives only from the slice's hub. handoff: autonomous.
- REC8 (F8) — trigger: the visual core was set with no decision, or a thing the design settled for
  the technical build sits in prose with no decision. direction: record the slice-level
  visual-core decision before persisting, reusing the product decision if one exists; and lift each
  settled thing out of the prose into its own design-directive decision naming what it binds
  downstream. Record only what the design actually settled — never manufacture a directive.
  handoff: autonomous.
- REC9 (F9) — trigger: the scoped-write guard report is not ok — a non-lens/non-decision path
  changed, or an accepted decision was edited in place. direction: the guard's `--restore` already
  reverted the offending paths; re-run writing only the slice's `ux.md` and its visual-core
  decision, after a human confirms the restore. handoff: human.
- REC10 (F10) — trigger: the navigation pattern or responsive strategy has no KB learning and no
  recorded proposal; or /ux chose a palette or type scale. direction: for navigation and responsive
  strategy, search the KB via kb-search for the best-fit learning and ground the choice, or raise
  a KB-learning-gap proposal; never keep a taste-only choice. For the look, strip the chosen palette
  and type scale and name the project's design-system reference instead — or record plainly that
  none exists yet. Do not raise a KB gap for the look; no shelf can tell a project what its brand
  is. handoff: autonomous.
- REC11 (F11) — trigger: the model delta was committed before the checkpoint resolved, a
  cancelled checkpoint left writes on the working tree, or the checkpoint took an answer without
  handing over the artifact paths. direction: for the un-offered artifact, re-present the
  checkpoint with both paths printed and take the answer again — an approval given without the
  artifact on offer does not count and is not recorded as one. Otherwise revert the premature commit and
  the working-tree writes (guard `--restore`, empty allow set) and re-present the checkpoint;
  commit only after the gate resolves (approval, a recorded config skip, or a recorded policy
  auto-pass). handoff: human.
- REC12 (F12) — trigger: the run is about to close COMPLETED with the Done means unmet (no persist
  record, the persist not stamped applied, the scoped-write guard report not captured or not ok,
  or the model delta not committed). direction: close HALTED with `exit_reason:
  stop_condition_unmet` and the unmet clauses named; fix the state — re-run the keyed persist,
  re-capture the scoped-write guard report, or make the model-delta commit — then re-evaluate; the
  close stays HALTED until the verdict reads held. handoff: autonomous.
- REC13 (F13) — trigger: a conditional-gate crossing left no live-eval ledger line, or an
  auto-pass fired for a shape the policy does not list as auto (or with a blocking finding).
  direction: re-append the missing ledger line via `gate_eval.py`; when the auto-pass was
  unearned, revert any premature persist and re-run the gate as a live wait. handoff: autonomous.
- REC14 (F14) — trigger: the product-os tree is dirty once start-change has cut the branch
  (uncommitted model edits present). direction: halt and ask for a clean model tree — commit or
  revert the pending model edits — before /ux writes the lens. handoff: human.
- REC15 (F15) — trigger: a flow names no persona/goal/entry/failure/exit, a step names a screen
  that is not in Screens, a decision point does not say where a branch goes, a screen is reached
  by no flow, or a flow's journey or persona id resolves to no record the readiness check handed
  over. direction: re-emit the Flows section to the fixed shape, one flow per journey record — add the missing field, rename the step to the real screen, name
  both branches of the fork, add the flow that reaches the orphan screen (or drop the screen if
  nothing reaches it), and re-tie the persona to a persona/journey of the hub — then re-run
  `validate_ux.py` until the flow cross-check reads ok. handoff: autonomous.
- REC16 (F16) — trigger: a wireframe artifact is missing, the page disagrees with its record, a
  screen is covered by no journey step and carries no gap, a moment has no frame body, a state uses
  a tone outside the visual core's map, or a frame carries invented styling. direction: author the
  missing part of the record — the frame body, the `covered_by` list, or the named gap where the
  step genuinely has no screen yet — correct any tone to one in the map, strip invented styling back
  to labels and content, then re-run the render script so the page comes from the record. Never
  hand-edit the page to agree with the record; re-render it. Re-run until the wireframe report
  reads ok. handoff: autonomous.
