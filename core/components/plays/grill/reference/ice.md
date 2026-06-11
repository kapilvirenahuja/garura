# grill — ICE source

The clean ICE triple this play is compiled from. Update this and recompile via
play-creator; never hand-edit the compiled SKILL.md.

## Intent

Turn one **realized slice** into an ordered set of **user-testable epics** — each a
meaningful increment a user can open, exercise, and verify — grilled steelman-hard against
the slice's intent and all five lenses before anything is written, as the handoff from the
product model to delivery.

/grill sits below /roadmap and above the delivery pipeline. /roadmap says "build this slice
next"; the five realize lenses (quality → ux → agentic → arch → run) have solved the slice's
design and /run has stamped its record `status: realized` — that stamp is the single marker
/grill checks before it cuts delivery work. /grill then cuts the slice into **epics**: the
temporary, slice-level delivery units `/start` picks up (opening an issue per epic) and
`/merge` deletes when delivered. We keep the intent and the structure, not the slicing.

The **grain of an epic is user-testability**, not the functionality: when an epic is
delivered, a user must be able to open the product, do something, and see it work. An epic
may thread one or several of the slice's functionalities, and a functionality may yield more
than one epic — but an epic that only completes internal machinery, with nothing a user can
observe, is not an epic. Every epic carries its own context (persona, systems, scope) and
acceptance criteria so the delivery pipeline is self-contained — and it **references** the
slice's intent records and lenses, never copies them.

The cut is **grilled, not relayed**. This is where the five lenses get reconciled into
delivery work, and getting it wrong poisons everything downstream — so the play pushes back
steelman-hard on thin acceptance, untestable increments, and tensions between the cut and
what the slice declared. Every push-back cites a specific declared item (an intent goal,
constraint, or failure; a lens decision; a profile bar) — the play never badgers on taste.
A tension is either resolved in the cut or explicitly accepted with a recorded reason; a
lens defect exposed by grilling is recorded and routed back to its lens play, never patched
here. The full cut is written only after explicit human approval, atomically — all epics or
none.

Pipeline position: **none**. /grill is a model-building play: it writes epics into the
product model and opens no delivery issue and cuts no branch itself (that is /start's job,
one epic at a time), so the D2 rule injects neither a `start-change` head nor a close
sequence.

### Constraints

- C1 — The play operates on exactly one slice per run, and only a slice stamped realized
  (all five lenses written and lined up).
- C2 — Every epic is a user-testable increment: its acceptance criteria describe what a
  user can open, do, and observe working — never internal-only completion.
- C3 — Every epic is self-contained for delivery: it carries its own context and
  acceptance, so the delivery pipeline never re-derives product thinking.
- C4 — Epics reference the slice's intent records and lenses; they never duplicate their
  content.
- C5 — Every functionality in the slice is covered by at least one epic or explicitly
  deferred with a recorded reason; a functionality may yield more than one epic.
- C6 — Every push-back during grilling cites a specific declared item — an intent goal,
  constraint, or failure; a lens decision; or a profile bar. Never uncited taste.
- C7 — The cut is reconciled against all five lenses; any tension between an epic and a
  lens is surfaced and either resolved in the cut or explicitly accepted with a recorded
  reason before writing.
- C8 — Epics are ordered: dependencies among them are explicit and acyclic, and the first
  epic is independently deliverable.
- C9 — The full cut is written only after explicit human approval, atomically — all epics
  or none.
- C10 — Epics are created at the start of their lifecycle; their later pickup, delivery,
  and deletion belong to the delivery plays, which this play never performs.
- C11 — The play writes only epics; it never modifies the slice record, the lenses, the
  intent records, or the profile. A lens defect found while grilling is recorded and routed
  back to its lens play, not patched here.

### Failure conditions

- F1 — An epic reaches delivery that no user can test — internal-only work with no
  observable behavior.
- F2 — Epics are cut from a slice that isn't realized, so delivery starts on an unsolved
  design.
- F3 — A functionality the slice promised is silently dropped from the cut — it never
  reaches delivery and nobody decided that.
- F4 — An epic duplicates intent or lens content, which then drifts from its source of
  truth.
- F5 — A push-back is issued without a citation — the play badgers on taste.
- F6 — A tension between the cut and a lens is detected but swallowed — epics written
  anyway with no resolution or recorded acceptance.
- F7 — Epics are written without approval, or partially — some written, some not.
- F8 — The play mutates the product model beyond epics.
- F9 — The epic ordering is undeliverable — a dependency cycle, or a first epic that can't
  stand alone.
- F10 — An epic arrives at delivery without the context to build it, forcing the delivery
  pipeline to re-derive what the product model already knew.

## Expectation

### Success scenarios

- S1 — (product builder) Given a realized slice, when the play completes, then the slice
  carries an approved, ordered set of epics. Measure: every epic's acceptance criteria name
  observable user behavior (open, do, verify); the set was written in a single approved
  transaction; zero epics exist for the slice from any earlier partial run.
- S2 — (delivery engineer) Given the approved cut, when they pick up the first epic, then
  they can start without consulting anything beyond the epic and what it references.
  Measure: the epic carries persona, systems, and scope context plus acceptance; every
  reference in it resolves to an existing record; the first epic in the order has no
  dependencies.
- S3 — (product builder under grilling) Given a thin acceptance criterion or a cut that
  strains a lens, then the play pushes back hard — and every push-back names the specific
  declared item it defends. Measure: the session record shows zero push-backs without a
  citation to an intent item, lens decision, or profile bar.
- S4 — (product builder) Given a slice functionality that doesn't belong in this cut, then
  it is explicitly deferred, never dropped. Measure: the coverage check maps every slice
  functionality to at least one epic or a deferral with a recorded reason; zero unmapped.
- S5 — (product builder, too early) Given a slice not yet stamped realized, then the play
  halts before any grilling and says exactly what's missing. Measure: no epic is written;
  the halt names the missing lens files or the missing stamp.
- S6 — (lens owner) Given grilling exposes a defect in a lens itself, then the defect is
  recorded and routed to that lens's play. Measure: a defect record exists naming the lens
  and the tension; the lens files and slice record are byte-identical before and after the
  run.

### Recovery (one per failure condition)

- REC1 (F1) — trigger: an epic's acceptance reads as internal completion, no
  user-observable behavior. direction: regenerate its acceptance from what a user can open
  and do, merging it with adjacent work until it's testable. handoff: autonomous.
- REC2 (F2) — trigger: realized stamp or lens files missing. direction: halt; run the
  missing realize lens plays first. handoff: human.
- REC3 (F3) — trigger: coverage check finds a slice functionality mapped nowhere.
  direction: cut an epic for it or record an explicit deferral with reason, then re-present
  the cut. handoff: autonomous.
- REC4 (F4) — trigger: an epic embeds intent or lens content instead of referencing it.
  direction: replace the copy with a reference to the source record. handoff: autonomous.
- REC5 (F5) — trigger: a push-back in the session record carries no citation. direction:
  withdraw it; re-issue only if a declared item supports it, otherwise drop it. handoff:
  autonomous.
- REC6 (F6) — trigger: live unresolved tensions exist when the write is attempted.
  direction: block the write; resolve each tension in the cut or record an explicit
  acceptance, then re-present. handoff: autonomous.
- REC7 (F7) — trigger: epics on disk without a recorded approval, or only part of the set
  written. direction: remove the partial write, restore the pre-run state, return to the
  checkpoint for a fresh approval. handoff: human.
- REC8 (F8) — trigger: the write-guard finds changes outside the slice's epic home.
  direction: restore every touched file from its pre-run state; confine the write to epics.
  handoff: autonomous.
- REC9 (F9) — trigger: a dependency cycle, or a first epic that can't stand alone.
  direction: re-order or split epics until the order is acyclic and the first is
  independently deliverable. handoff: autonomous.
- REC10 (F10) — trigger: the self-containment check finds an epic with empty or
  unresolvable context or acceptance. direction: backfill from the slice's intent records
  and lenses, re-verify resolution. handoff: autonomous.
