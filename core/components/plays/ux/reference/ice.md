# ux — ICE source

The clean ICE triple this play is compiled from. Update this and recompile via
play-creator; never hand-edit the compiled SKILL.md.

## Intent

Given one shaped **slice** — a vertical product increment from /shape, the thing you actually
deliver — write its **ux lens**: just enough to anchor the intended experience and let the
build figure the rest. The slice is the unit of realization: you pick a slice and run quality
→ ux → agentic → arch → run on it, then ship it. A slice has no ICE of its own — its hub is
the union of its functionalities' ICE (which may span several capabilities) plus the profile.
The lens is three things and only three: the **screens** the slice needs, each with a
low-fidelity layout; the **states** each screen can hold; and the product's **visual core** —
color and typography. It drives intent, it is not a full spec. The screens make every
functionality of the slice visible, so a human can look at them and confirm the shape and the
ICE under it are right. Accessibility is **not** restated in the lens — it lives in the
product profile, and the build connects it. Flows are not specified — the build derives them
from the screens and the journeys. Every screen is grounded in one of the slice's
functionalities' ICE or a persona/journey; the visual core is a deliberate choice recorded as
a decision the whole product references. Nothing is invented: the cross-cutting pattern
choices — the visual core, the navigation pattern, the responsive strategy — are grounded in
the KB's technology/architecture shelves (the patterns that have worked for products with these
conditions and surfaces, found via kb-search), or, where the KB does not cover one, recorded as
a KB-learning-gap proposal for review. It writes only the ux lens (and
the visual-core decision for any material choice) — never the slice record, the
functionalities' ICE, the profile, another lens, structure, status, personas, journeys, or
other slices. One slice per run; one human checkpoint before anything persists.

Pipeline position: **none**. /ux is a MIDDLE play of the slice pipeline (quality → ux → agentic → arch → run → grill): it expects to run on the branch /quality already started, injects no head and no close, stops when its lens is written, and leaves the branch as-is for the next play. The close belongs to /grill. It writes the persistent product model directly, on the already-started branch. By convention second in the realize sequence — but takes **no** dependency on the quality lens: it reads the hub (the slice's functionalities' ICE + the profile box) only; never another lens. (#437)

### Constraints

- C1 — One slice per run, and only a ready one: the slice exists (shaped by /shape), every
  functionality it bundles resolves to a rich ICE, and the product profile is firmed (`set`).
  If not, halt — /ux realizes a shaped slice; it does not shape one.
- C2 — Writes only this slice's ux lens (and any decision), in the slice's lens folder. Never
  the slice record, the functionalities' ICE, the profile, another lens, node structure or
  status, personas, journeys, or other slices.
- C3 — ux content only, and only the three blocks, per the ux lens schema: `content` carries
  `screens` (name, purpose, low-fidelity layout), `states` (per screen), and `design_system`
  (palette + typography) — and no other key. No flows, no accessibility block (a11y lives in
  the profile), no gates/components/environments.
- C4 — Every element is grounded — never invented. Each screen traces to one of the slice's
  functionalities' ICE or to a persona/journey; the visual core (color + typography) is a
  deliberate product choice recorded as a decision.
- C5 — Just enough, and coherent: every screen has a purpose and a low-fidelity layout; every
  screen's states are enumerated; the design_system carries both a palette and typography. It
  anchors intent — it does not over-specify (no exhaustive component specs, no pixel detail).
- C6 — Validation coverage: the screens cover the slice's functionalities — every
  functionality the slice bundles is visible in at least one screen, so the human can validate
  the whole shaped increment and the ICE under it. Nothing shaped is left unvisualized.
- C7 — Reads the hub only: /ux derives from the slice's functionalities' ICE and the profile
  box — never from another realize lens (quality/agentic/architecture/run).
- C8 — The visual core is a material choice: which palette and typography the product takes is
  recorded as a slice-level decision (ADR) the whole product references; it is not re-invented
  per slice.
- C9 — Additive and non-destructive: the run changes only the ux lens (and any new decision);
  every other product-model file — the slice record, the ICE, the profile, the other lenses,
  the other slices — is byte-unchanged. Re-running re-derives the ux lens against the current
  hub; accepted decisions are superseded by new records, never edited in place.
- C10 — Schema conformance: the ux lens and any decision validate against their v1 schemas
  (lens v1, decision v1).
- C11 — Exactly one human checkpoint, presenting the proposed screens (with layouts), states,
  and visual core, plus any decision, before anything is written. Nothing persists before
  approval.
- C12 — UX pattern choices are KB-grounded: the visual core (palette + typography), the
  navigation pattern, and the responsive strategy trace to a best-fit learning on the KB's
  technology or architecture shelf (matched to the product's conditions + surfaces via
  kb-search), or to a recorded KB-learning-gap proposal — never the model's taste alone. The
  screens themselves stay grounded in the slice's functionalities' ICE per C4; C12 governs the
  cross-cutting pattern choices (and pairs with C8: the visual core is also recorded as a
  decision).

### Failure conditions

- F1 — /ux ran on an unready slice — the slice is absent, a functionality's ICE does not
  resolve or is not rich, or the profile is not firmed.
- F2 — A write touched something other than this slice's ux lens or a decision (the slice
  record, a functionality's ICE, the profile, another lens, structure, status, a persona, a
  journey, or another slice).
- F3 — The ux lens carries content outside the three blocks (flows, an accessibility block,
  gates, components, environments) or is not the screens/states/design_system shape.
- F4 — An element is invented — a screen with no functionality ICE and no persona/journey
  behind it, or a visual core with no recorded decision.
- F5 — The lens over- or under-specifies — a screen with no purpose or no layout, states not
  enumerated, or a design_system missing its palette or typography.
- F6 — A functionality of the slice is left unvisualized — covered by no screen, so the human
  cannot validate the whole shape.
- F7 — /ux read or depended on another lens (quality/agentic/architecture/run).
- F8 — The visual core was set with no decision recorded.
- F9 — A product-model file other than the ux lens or a new decision changed, or an accepted
  decision was edited in place rather than superseded.
- F10 — The ux lens or a decision violates its v1 schema.
- F11 — The lens was persisted before the human approved the checkpoint.
- F12 — A UX pattern choice (the visual core, the navigation pattern, or the responsive
  strategy) rests on neither a matched KB learning nor a recorded KB-learning-gap proposal — it
  was invented from the model's taste.

## Expectation

### Success scenarios

- S1 — (product designer, first run) Given a shaped slice whose functionalities have rich ICE
  and a firmed profile, when /ux runs and the checkpoint is approved, then the ux lens is
  written as screens (with layouts), states, and a visual core — and nothing else changes.
  Measure: `slices/{slice}/lens/ux.yaml` exists with `type: ux`, a `slice_ref`, and a
  `content` carrying non-empty `screens`, `states`, and `design_system`; every other
  product-model file is byte-identical; the lens validates against lens v1.
- S2 — (product owner, validates the shape) Given the screens are drafted, when shown them,
  then the human can see every functionality of the slice rendered as low-fidelity screens and
  confirm the shape and ICE under it hold. Measure: every functionality the slice bundles maps
  to at least one screen in the grounding manifest; none left unvisualized.
- S3 — (ux researcher, grounded) Given the lens is drafted, when inspected, then each screen
  traces back to one of the slice's functionalities' ICE or a persona/journey, and the visual
  core to a recorded decision. Measure: the grounding map names a real source for every screen;
  the visual core names a decision that resolves; none ungrounded.
- S4 — (design lead, just enough) Given the lens, when read, then it anchors intent without
  over-specifying — every screen has a purpose and a low-fidelity layout, states are
  enumerated, and the visual core carries a palette and typography, with no pixel-level or
  exhaustive component detail. Measure: every screen has a purpose and a layout; every screen
  has enumerated states; design_system carries palette and typography.
- S5 — (architect, hub-only) Given /ux runs, when the model is checked, then it read no other
  realize lens and wrote none. Measure: no quality/agentic/architecture/run lens of the slice
  is touched; only this slice's `ux.yaml` (and any decision) is in the written set; no screen's
  grounding source is another lens.
- S6 — (product owner, re-run) Given /ux already ran on the slice, when it runs again, then it
  re-derives the ux lens and changes nothing else; the visual-core decision is reused, and any
  new decision supersedes rather than edits. Measure: only the slice's `ux.yaml` (and possibly
  a new decision) differ; the slice record, the other lenses, the ICE, and the profile are
  byte-identical; no accepted decision file is edited in place.
- S7 — (reviewer, the checkpoint) Given the screens are ready, when the checkpoint is shown,
  then it presents the screens (with layouts), states, and visual core as the validation
  surface for the shape, plus the decision, before any write. Measure: the checkpoint shows the
  lens inline; no product-model file is written before approval.
- S8 — (ux researcher, KB-grounded) Given the lens is drafted, when inspected, then the visual
  core, the navigation pattern, and the responsive strategy trace to a KB learning or a recorded
  proposal. Measure: the manifest's `choices` block lists each, grounded in a `technology/*` or
  `architecture/*` learning that resolves on a shelf, or a proposal file that exists;
  `check_kb_grounding.py` is clean.

### Recovery (one per failure condition)

- REC1 (F1) — trigger: the slice is absent, a functionality's ICE does not resolve or is not
  rich, or the profile is not firmed. direction: halt and route to /shape (to shape the slice)
  or /understand (to enrich + firm) before /ux runs. handoff: human.
- REC2 (F2) — trigger: a write touched something beyond this slice's ux lens or a decision.
  direction: revert the out-of-scope write; /ux writes only the slice's ux lens (and the
  visual-core decision). handoff: autonomous.
- REC3 (F3) — trigger: the lens carries content beyond the three blocks or the wrong shape.
  direction: strip it back to the screens/states/design_system shape the schema requires (a11y
  belongs to the profile, flows to the build). handoff: autonomous.
- REC4 (F4) — trigger: an invented/ungrounded element. direction: drop it, or re-tie the screen
  to one of the slice's functionalities' ICE or a persona/journey, and tie the visual core to a
  recorded decision; never keep an invented element. handoff: autonomous.
- REC5 (F5) — trigger: the lens over- or under-specifies (missing purpose/layout, unenumerated
  states, a design_system missing palette or typography). direction: add the missing piece and
  strip any over-specification. handoff: autonomous.
- REC6 (F6) — trigger: a functionality of the slice is covered by no screen. direction: add the
  screen(s) that visualize the missing functionality so the whole shape is validatable. handoff:
  autonomous.
- REC7 (F7) — trigger: /ux read or depended on another lens. direction: remove the dependency;
  /ux derives only from the slice's hub. handoff: autonomous.
- REC8 (F8) — trigger: the visual core was set with no decision recorded. direction: record the
  slice-level visual-core decision before persisting; reuse the existing product decision if one
  exists. handoff: autonomous.
- REC9 (F9) — trigger: a non-lens/non-decision file changed, or an accepted decision was edited
  in place. direction: restore it and re-apply only the ux lens (and the new decision), after a
  human confirms the restore. handoff: human.
- REC10 (F10) — trigger: the lens or a decision fails v1 schema validation. direction: re-emit
  the failing artifact to conform before the play completes. handoff: autonomous.
- REC11 (F11) — trigger: the lens was persisted before the checkpoint was approved. direction:
  revert the premature write and re-present the checkpoint; persist only after the human
  approves. handoff: human.
- REC12 (F12) — trigger: a UX pattern choice with no KB learning and no recorded proposal.
  direction: search the KB's technology/architecture shelves via kb-search for the best-fit
  learning and ground the choice in it, or raise a KB-learning-gap proposal (a candidate
  technology/architecture learning); never keep a taste-only choice. handoff: autonomous.
