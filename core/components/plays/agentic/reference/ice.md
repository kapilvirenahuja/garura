# agentic — ICE source

The clean ICE triple this play is compiled from. Update this and recompile via
play-creator; never hand-edit the compiled SKILL.md.

## Intent

Given one shaped **slice** — a vertical product increment from /shape, the thing you
actually deliver — write its **agentic lens**: how much load the slice should lift off the
user, and the frame around it. The slice is the unit of realization: you pick a slice and
run quality → ux → agentic → arch → run on it, then ship it. A slice has no ICE of its own
— its hub is the union of its functionalities' ICE (which may span several capabilities)
plus the product profile.

This is how garura thinks about agentic, a two-fold decision. First: is this slice agentic
at all, and how much — judged by how much load it is OK to offload to it. That "how much"
is the three **weights** — cognitive (analysis + decisions), creative (visualization +
media), logistical (operations + workflow) — where each weight's level is the **degree of
offload**: max cognitive means lift as much thinking off the user as possible, so the slice
fires as much agentic behaviour as it can. Second, once it is agentic: the **controls** —
how tight the guardrails are and how readily it hands off to a human. All five axes ride one
five-level scale: low / medium / high / xhigh / ultra. There is no "none" — "not agentic" is
a gate up front. Every level traces to the slice's hub — the weights to the load its
functionalities carry, the controls to their constraints and failure modes; nothing is
invented. The **control approach** — how tightly an agent of this kind is fenced and when it
defers to a human — is grounded in the KB's architecture/technology shelves where a fitting
pattern exists (found via kb-search), or, where the KB has none yet, recorded as a
KB-learning-gap proposal — not the model's taste. A slice that should offload nothing comes out
is_agent=false with a note saying why. It writes only the slice's agentic lens (and a decision
for any material autonomy
choice) — never the slice record, the functionalities' ICE, the profile, another lens, or
any other model file. One slice per run; one human checkpoint before anything persists.

Pipeline position: **none**. /agentic is a realization, model-building play. It opens no
delivery issue and cuts no branch, so the D2 rule injects neither a `start-change` head nor
a close sequence. It writes the persistent product model directly. It runs after /shape (a
slice must be shaped before its agentic stance is set), and by convention third in the
realize sequence (quality → ux → agentic → arch → run) — but takes **no** dependency on the
quality or ux lens. It reads the hub (the slice's functionalities' ICE + the profile box)
only; never another lens.

### Constraints

- C1 — One slice per run, and only a ready one: the slice exists (shaped by /shape), every
  functionality it bundles resolves to a rich ICE, and the product profile is firmed
  (`set`). If not, halt — /agentic realizes a shaped slice; it does not shape one.
- C2 — Writes only this slice's agentic lens (and any decision), in the slice's lens folder.
  Never the slice record, the functionalities' ICE, the profile, another lens
  (quality/ux/architecture/run), node structure or status, personas, journeys, or other
  slices.
- C3 — agentic content only, per the agentic lens schema: an `is_agent` gate with a `note`,
  and — when agentic — the three `weights` (cognitive/creative/logistical) and the two
  `controls` (guardrails, handoff), each axis a `level` + `note`. No other key. The level on
  every axis is one of low / medium / high / xhigh / ultra; there is no "none".
- C4 — Every axis is grounded — never invented. The is_agent decision and each weight's
  level trace to the slice's hub — the load its functionalities carry and how much is OK to
  offload; the guardrails and handoff levels trace to those functionalities' ICE constraints
  and failures.
- C5 — Coherent: `is_agent` is a clear yes/no with a note giving the load judgment behind
  it. When agentic, all five axes carry a valid level (low/medium/high/xhigh/ultra) and a
  note. When not agentic, no axis is rated and the note says why the slice offloads nothing —
  a valid lens, not a failure.
- C6 — Reads the hub only: /agentic derives from the slice's functionalities' ICE and the
  profile box — never from another realize lens (quality/ux/architecture/run).
- C7 — A material autonomy choice — a weight at xhigh or ultra (lifting most/all of a load
  off the user), or making a sensitive slice agentic at all — is recorded as a slice-level
  decision (ADR).
- C8 — Additive and non-destructive: the run changes only the slice's agentic lens (and any
  new decision); every other product-model file — the slice record, the ICE, the profile,
  the other lenses, the other slices — is byte-unchanged. Re-running re-derives the agentic
  lens against the current hub; accepted decisions are superseded by new records, never
  edited in place.
- C9 — Schema conformance: the agentic lens and any decision validate against their v1
  schemas (lens v1, decision v1).
- C10 — Exactly one human checkpoint, presenting the is_agent decision, the five axes, and
  any decision, before anything is written. Nothing persists before approval.
- C11 — The control approach is KB-grounded: on an agentic slice, the guardrail-tightness
  pattern and the handoff-cadence pattern (how an agent of this kind is fenced and when it
  defers to a human) trace to a best-fit learning on the KB's architecture or technology shelf
  (matched via kb-search), or — where the KB has no fitting pattern yet — to a recorded
  KB-learning-gap proposal. The weights and every axis level still trace to the slice's hub per
  C4; C11 grounds the cross-cutting control pattern in what has worked, not the model's taste.
  On an is_agent=false slice there are no controls, so there is nothing to KB-ground.

### Failure conditions

- F1 — /agentic ran on an unready slice — the slice is absent, a functionality's ICE does
  not resolve or is not rich, or the profile is not firmed.
- F2 — A write touched something other than this slice's agentic lens or a decision (the
  slice record, a functionality's ICE, the profile, another lens, structure, status, a
  persona, a journey, or another slice).
- F3 — The agentic lens carries content outside the schema (extra keys, an axis level that
  is not one of low/medium/high/xhigh/ultra) or is not the is_agent + weights + controls
  shape.
- F4 — An axis is invented — the is_agent decision or a level with no hub source behind it.
- F5 — The lens is incoherent — `is_agent` missing or its note absent; or, when agentic, an
  axis missing its level or note; or an axis rated while `is_agent` is false.
- F6 — /agentic read or depended on another lens (quality/ux/architecture/run).
- F7 — A material autonomy choice (a weight at xhigh/ultra, or making a sensitive slice
  agentic) was made with no decision recorded.
- F8 — A product-model file other than the slice's agentic lens or a new decision changed,
  or an accepted decision was edited in place rather than superseded.
- F9 — The agentic lens or a decision violates its v1 schema.
- F10 — The lens was persisted before the human approved the checkpoint.
- F11 — On an agentic slice, the control approach (the guardrail-tightness or handoff-cadence
  pattern) rests on neither a matched KB learning nor a recorded KB-learning-gap proposal — it
  was invented from the model's taste.

## Expectation

### Success scenarios

- S1 — (product owner, first run) Given a shaped slice whose functionalities have rich ICE
  and a firmed profile, when /agentic runs and the checkpoint is approved, then the slice's
  agentic lens is written as the is_agent decision plus, when agentic, the three weights and
  two controls — and nothing else changes. Measure: `slices/{slice}/lens/agentic.yaml` exists
  with `type: agentic`, a `slice_ref`, an `is_agent` field, and (when agentic) weights +
  controls each with a level; every other product-model file is byte-identical; the lens
  validates against lens v1.
- S2 — (AI engineer, grounded) Given the lens is drafted, when inspected, then the is_agent
  decision and every axis level trace back to the slice's hub — the weights to the load its
  functionalities carry, the controls to their constraints/failures. Measure: the grounding
  map names a real ICE source for the is_agent decision and every rated axis; none
  ungrounded.
- S3 — (product owner, offload reads right) Given the weights, when read, then the level on
  each is the degree of offload — a max/ultra weight means lift as much of that load off the
  user as possible. Measure: every rated axis has a valid level on the low→ultra scale and a
  note; no axis uses a value off the scale.
- S4 — (architect, hub-only) Given /agentic runs, when the model is checked, then it read no
  other realize lens and wrote none. Measure: no quality/ux/architecture/run lens of the
  slice is touched; only this slice's `agentic.yaml` (and any decision) is in the written
  set; no axis grounding source is another lens.
- S5 — (product owner, re-run) Given /agentic already ran on the slice, when it runs again,
  then it re-derives the agentic lens and changes nothing else; existing decisions are
  superseded, not edited. Measure: only the slice's `agentic.yaml` (and possibly a new
  decision) differ; the slice record, the other lenses, the ICE, and the profile are
  byte-identical; no accepted decision file is edited in place.
- S6 — (reviewer, the checkpoint) Given the lens is ready, when the checkpoint is shown, then
  it presents the is_agent decision, the five axes, and any decision before any write.
  Measure: the checkpoint shows the lens inline; no product-model file is written before
  approval.
- S7 — (product owner, not-agentic slice) Given a slice that should offload nothing, when
  /agentic runs, then the lens comes out is_agent=false with a note saying why and no axis
  rated — a valid lens, not a forced one. Measure: `is_agent` is false, no weight or control
  carries a level, the note explains the call, and the lens still validates v1.
- S8 — (AI engineer, KB-grounded controls) Given an agentic slice's lens is drafted, when
  inspected, then the guardrail and handoff approach trace to a KB learning or a recorded
  proposal. Measure: the manifest's `choices` block lists the control approach, each grounded in
  an `architecture/*` or `technology/*` learning that resolves on a shelf, or a proposal file
  that exists; `check_kb_grounding.py` is clean. An is_agent=false slice has no controls, so the
  grounding check is not run.

### Recovery (one per failure condition)

- REC1 (F1) — trigger: the slice is absent, a functionality's ICE does not resolve or is not
  rich, or the profile is not firmed. direction: halt and route to /shape (to shape the
  slice) or /understand (to enrich + firm) before /agentic runs. handoff: human.
- REC2 (F2) — trigger: a write touched something beyond this slice's agentic lens or a
  decision. direction: revert the out-of-scope write; /agentic writes only the slice's
  agentic lens (and decisions). handoff: autonomous.
- REC3 (F3) — trigger: the lens carries content outside the schema or an off-scale level.
  direction: strip it back to the is_agent + weights + controls shape and the
  low/medium/high/xhigh/ultra scale the schema requires. handoff: autonomous.
- REC4 (F4) — trigger: an invented/ungrounded axis or is_agent decision. direction: drop it,
  or re-tie the weight to the load in the slice's hub and the controls to its
  functionalities' constraints/failures; never keep an invented axis. handoff: autonomous.
- REC5 (F5) — trigger: an incoherent lens (missing is_agent or note; a rated axis missing its
  level/note; an axis rated while is_agent is false). direction: add the is_agent call + note,
  complete the axis level/note, or clear the axes when not agentic. handoff: autonomous.
- REC6 (F6) — trigger: /agentic read or depended on another lens. direction: remove the
  dependency; /agentic derives only from the slice's hub. handoff: autonomous.
- REC7 (F7) — trigger: a material autonomy choice with no decision recorded. direction: record
  the slice-level decision for the choice before persisting. handoff: autonomous.
- REC8 (F8) — trigger: a non-lens/non-decision file changed, or an accepted decision was edited
  in place. direction: restore it and re-apply only the slice's agentic lens (and the new
  decision), after a human confirms the restore. handoff: human.
- REC9 (F9) — trigger: the lens or a decision fails v1 schema validation. direction: re-emit
  the failing artifact to conform before the play completes. handoff: autonomous.
- REC10 (F10) — trigger: the lens was persisted before the checkpoint was approved. direction:
  revert the premature write and re-present the checkpoint; persist only after the human
  approves. handoff: human.
- REC11 (F11) — trigger: on an agentic slice, the control approach with no KB learning and no
  recorded proposal. direction: search the KB's architecture/technology shelves via kb-search
  for the best-fit control/guardrail pattern and ground it, or raise a KB-learning-gap proposal
  (a candidate learning); never keep a taste-only control approach. handoff: autonomous.
