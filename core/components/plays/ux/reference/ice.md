# ux — ICE source

The clean ICE triple this play is compiled from. Update this and recompile via
play-creator; never hand-edit the compiled SKILL.md.

## Intent

Given one shaped capability with rich ICE and a firmed product profile, write its **ux
lens** — just enough to anchor the intended experience and let the build figure the rest.
The lens is three things and only three: the **screens** the capability needs, each with a
low-fidelity layout; the **states** each screen can hold; and the product's **visual core**
— color and typography. It drives intent, it is not a full spec. The screens make every
shaped slice of the capability visible, so a human can look at them and confirm the shape
and the ICE under it are right. /shape composes the capability's functionalities into
vertical slices; /ux makes those slices visible as screens a person can validate.
Accessibility is **not** restated in the lens — it lives in the product profile, and the
build connects it. Flows are not specified — the build derives them from the screens and
the capability's journeys. Every screen is grounded in a shaped slice (and its
functionality ICE) or a persona/journey; the visual core is a deliberate choice recorded as
a decision the whole product references. Nothing is invented. It writes only the ux lens
(and the visual-core decision for any material choice) — never the ICE, the profile,
another lens, structure, status, personas, journeys, or slices. One capability per run; one
human checkpoint before anything persists.

Pipeline position: **none**. /ux is a realization, model-building play. It opens no
delivery issue and cuts no branch, so the D2 rule injects neither a `start-change` head nor
a close sequence. It writes the persistent product model directly. It runs after /shape (a
capability must be shaped before its experience can be drawn), and by convention after
/quality in the realize sequence (quality → ux → agentic → arch → run) — but takes **no**
dependency on the quality lens. It reads the hub (the capability's ICE + the profile box)
and the shape (its slices, personas, journeys), never another lens.

### Constraints

- C1 — One capability per run, and only a ready one: the capability is shaped (status
  `active`), its ICE is rich, and the product profile is firmed (`set`). If not, halt —
  /ux realizes a shaped capability; it does not shape one.
- C2 — Writes only this capability's ux lens (and the visual-core decision). Never the ICE,
  the profile, another lens (quality/architecture/run/agentic), the node's structure or
  status, personas, journeys, or slices.
- C3 — ux content only, and only the three blocks, per the trimmed ux lens schema:
  `content` carries `screens` (name, purpose, low-fidelity layout), `states` (per screen),
  and `design_system` (palette + typography) — and no other key. No flows, no accessibility
  block (a11y lives in the profile), no gates/components/environments.
- C4 — Every element is grounded — never invented. Each screen traces to a shaped slice of
  this capability (and the functionality ICE that slice references) or to a persona/journey;
  the visual core (color + typography) is a deliberate product choice recorded as a decision.
- C5 — Just enough, and coherent: every screen has a purpose and a low-fidelity layout;
  every screen's states are enumerated; the design_system carries both a palette and
  typography. It anchors intent — it does not over-specify (no exhaustive component specs,
  no pixel detail).
- C6 — Validation coverage: the screens cover the capability's shaped slices — every
  functionality this capability contributes to a slice is visible in at least one screen, so
  the human can validate the whole shaped increment and the ICE under it. Nothing shaped is
  left unvisualized.
- C7 — Reads the hub and the shape only: /ux derives from the capability's ICE, its shaped
  slices, its personas/journeys, and the profile box — never from another realize lens
  (quality/agentic/architecture/run).
- C8 — The visual core is a material choice: which palette and typography the product takes
  is recorded as a capability-level decision (ADR) the whole product references; it is not
  re-invented per capability.
- C9 — Additive and non-destructive: the run changes only the ux lens (and any new
  decision); every other product-model file — the ICE, the profile, the other lenses, the
  slices — is byte-unchanged. Re-running re-derives the ux lens against the current ICE +
  box + shape; accepted decisions are superseded by new records, never edited in place.
- C10 — Schema conformance: the ux lens and any decision validate against their v1 schemas
  (lens v1, decision v1).
- C11 — Exactly one human checkpoint, presenting the proposed screens (with layouts), states,
  and visual core, plus the visual-core decision, before anything is written. Nothing
  persists before approval.

### Failure conditions

- F1 — /ux ran on an unready capability — the capability is absent, not `active`, its ICE is
  not rich, or the profile is not firmed.
- F2 — A write touched something other than this capability's ux lens or the visual-core
  decision (the ICE, the profile, another lens, structure, status, a persona, a journey, or a
  slice).
- F3 — The ux lens carries content outside the three blocks (flows, an accessibility block,
  gates, components, environments) or is not the screens/states/design_system shape the
  schema requires.
- F4 — An element is invented — a screen with no shaped slice / functionality ICE and no
  persona/journey behind it, or a visual core with no recorded decision.
- F5 — The lens over- or under-specifies — a screen with no purpose or no layout, states not
  enumerated, or a design_system missing its palette or typography.
- F6 — A shaped slice is left unvisualized — a functionality this capability contributes to a
  slice is covered by no screen, so the human cannot validate the whole shape.
- F7 — /ux read or depended on another lens (quality/agentic/architecture/run).
- F8 — The visual core was set with no decision recorded.
- F9 — A product-model file other than the ux lens or a new decision changed, or an accepted
  decision was edited in place rather than superseded.
- F10 — The ux lens or a decision violates its v1 schema.
- F11 — The lens was persisted before the human approved the checkpoint.

## Expectation

### Success scenarios

- S1 — (product designer, first run) Given a shaped capability with rich ICE and a firmed
  profile, when /ux runs and the checkpoint is approved, then the ux lens is written as
  screens (with layouts), states, and a visual core — and nothing else changes. Measure:
  `lens/ux.yaml` exists with `type: ux` and a `content` carrying non-empty `screens`,
  `states`, and `design_system`; every other product-model file is byte-identical before and
  after; the lens validates against lens v1.
- S2 — (product owner, validates the shape) Given the screens are drafted, when shown them,
  then the human can see every shaped slice of the capability rendered as low-fidelity
  screens and confirm the shape and ICE under it hold. Measure: every functionality this
  capability contributes to a slice maps to at least one screen in the grounding manifest; no
  slice-bound functionality is left unvisualized.
- S3 — (ux researcher, grounded) Given the lens is drafted, when inspected, then each screen
  traces back to a slice/ICE or a persona/journey, and the visual core to a recorded
  decision. Measure: the grounding map names a real source for every screen; the visual core
  names a decision that resolves; no element is left ungrounded.
- S4 — (design lead, just enough) Given the lens, when read, then it anchors intent without
  over-specifying — every screen has a purpose and a low-fidelity layout, states are
  enumerated, and the visual core carries a palette and typography, with no pixel-level or
  exhaustive component detail. Measure: every screen has a purpose and a layout; every screen
  has enumerated states; design_system carries palette and typography.
- S5 — (architect, hub-only) Given /ux runs, when the model is checked, then it read no other
  realize lens and wrote none. Measure: no quality/agentic/architecture/run lens file is
  touched; only `ux.yaml` (and the decision) is in the written set; no screen's grounding
  source is another lens.
- S6 — (product owner, re-run) Given /ux already ran on the capability, when it runs again,
  then it re-derives the ux lens and changes nothing else; the visual-core decision is
  reused, and any new decision supersedes rather than edits. Measure: only `ux.yaml` (and
  possibly a new decision) differ; the other lenses, the ICE, the profile, and the slices are
  byte-identical; no accepted decision file is edited in place.
- S7 — (reviewer, the checkpoint) Given the screens are ready, when the checkpoint is shown,
  then it presents the screens (with layouts), states, and visual core as the validation
  surface for the shape, plus the decision, before any write. Measure: the checkpoint shows
  the lens inline; no product-model file is written before approval.

### Recovery (one per failure condition)

- REC1 (F1) — trigger: the capability is absent, not `active`, lacks rich ICE, or the profile
  is not firmed. direction: halt and route to /shape (to shape it) or /understand (to enrich
  + firm) before /ux runs. handoff: human.
- REC2 (F2) — trigger: a write touched something beyond this capability's ux lens or the
  decision. direction: revert the out-of-scope write; /ux writes only the ux lens (and the
  visual-core decision). handoff: autonomous.
- REC3 (F3) — trigger: the lens carries content beyond the three blocks or the wrong shape.
  direction: strip it back to the screens/states/design_system shape the schema requires
  (a11y belongs to the profile, flows to the build). handoff: autonomous.
- REC4 (F4) — trigger: an invented/ungrounded element. direction: drop it, or re-tie the
  screen to a shaped slice / functionality ICE or a persona/journey, and tie the visual core
  to a recorded decision; never keep an invented element. handoff: autonomous.
- REC5 (F5) — trigger: the lens over- or under-specifies (missing purpose/layout, unenumerated
  states, a design_system missing palette or typography). direction: add the missing piece —
  the purpose, the low-fidelity layout, the enumerated states, the palette/typography — and
  strip any over-specification. handoff: autonomous.
- REC6 (F6) — trigger: a shaped slice's functionality is covered by no screen. direction: add
  the screen(s) that visualize the missing functionality so the whole shape is validatable.
  handoff: autonomous.
- REC7 (F7) — trigger: /ux read or depended on another lens. direction: remove the dependency;
  /ux derives only from the ICE + profile + shape. handoff: autonomous.
- REC8 (F8) — trigger: the visual core was set with no decision recorded. direction: record
  the capability-level visual-core decision before persisting; reuse the existing product
  decision if one exists. handoff: autonomous.
- REC9 (F9) — trigger: a non-lens/non-decision file changed, or an accepted decision was
  edited in place. direction: restore it and re-apply only the ux lens (and the new decision),
  after a human confirms the restore. handoff: human.
- REC10 (F10) — trigger: the lens or a decision fails v1 schema validation. direction: re-emit
  the failing artifact to conform before the play completes. handoff: autonomous.
- REC11 (F11) — trigger: the lens was persisted before the checkpoint was approved. direction:
  revert the premature write and re-present the checkpoint; persist only after the human
  approves. handoff: human.
