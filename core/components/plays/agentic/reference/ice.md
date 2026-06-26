# agentic — ICE source

The clean ICE triple this play is compiled from. Update this and recompile via
play-editor; never hand-edit the compiled SKILL.md.

## Intent

Given one shaped **slice** — a vertical product increment from /shape, the thing you actually
deliver — write its **agentic lens** as a grounding doc (`agentic.md`): whether the slice is (or
contains) an agent at all, and if so how much human load it offloads and what controls bound it.
The slice is the unit of realization; a slice has no ICE of its own — its **hub** is the union of
its functionalities' grounding docs (`functionality.md`, which may span several capabilities) plus
the product profile (read from the spine). The lens is three things and only three: the
**is-it-an-agent gate** (the verdict and why), the **load weights** (cognitive / creative /
logistical on a low→ultra scale — the degree of offload — `n/a` when not an agent), and the
**controls** (guardrails, handoff). A deterministic read/compute slice comes out "not an agent",
stated plainly — never an invented agent. The verdict and the weights are grounded in what the
slice's functionalities actually do; any material autonomy choice is recorded as a decision; the
agentic-framing choices are grounded in the KB (where garura's agentic thinking lives) or recorded
as a KB-learning-gap proposal. It writes only this slice's `agentic.md` (and any decision) — never
the spine, the slice record, the profile, another lens, or another slice. One slice per run; one
human checkpoint before anything persists. The lens is gated by the structural linter (shape) and
the content-quality eval (a judge).

Pipeline position: **none**. /agentic is the MIDDLE of the FUNCTIONAL realize pipe (ux → agentic →
marketing): it expects to run on the branch /ux already started, injects no `start-change` head and
no close sequence, stops when its work is done, and leaves the branch for /marketing. The close
belongs to /marketing (the functional pipe's end). It writes the persistent product model directly
(the slice's agentic lens), on the already-started branch, and reads the hub only — never another
lens. (#437; 3-pipe realize 2026-06-25)

### Constraints

- C1 — One slice per run, and only a ready one: the slice exists (shaped by /shape), every
  functionality it bundles resolves through the spine to a `functionality.md` grounding doc, and
  the product profile is firmed (`set`). If not, halt — /agentic realizes a shaped slice; it does
  not shape one.
- C2 — Writes only this slice's `agentic.md` (and any decision), in the slice's lens folder. Never
  the spine, the slice record, the profile, another lens, the node tree, personas, journeys, or
  other slices.
- C3 — Shape: `agentic.md` conforms to the Agentic lens template — the sections "Is it an agent?",
  "Load weights", and "Controls" — and the structural linter passes. No content outside those three.
- C4 — Content quality: `agentic.md` clears the content-quality eval, not just the linter — each
  section is self-explaining and the doc passes the stranger test.
- C5 — Grounded, not invented: the verdict and the weights trace to the behavior of the slice's
  functionalities; any material autonomy choice is recorded as a decision. (Tracked in the manifest.)
- C6 — Coverage: the agentic assessment considers every functionality the slice bundles — the gate
  cannot ignore part of the slice. Nothing shaped is left unconsidered.
- C7 — Reads the hub only: /agentic derives from the slice's functionalities' grounding docs and the
  profile — never from another realize lens (quality/ux/architecture/run/measure/marketing).
- C8 — Honest gate: a slice that should offload nothing comes out `is_agent: false`, and the weights
  table is `n/a — not an agent`; agentic behavior is never manufactured where the functionalities
  don't warrant it.
- C9 — Additive and non-destructive: the run changes only this slice's `agentic.md` (and any new
  decision); the spine, the slice record, the profile, the other lenses, and the other slices are
  byte-unchanged. Re-running re-derives the lens; accepted decisions are superseded, never edited
  in place.
- C10 — Agentic-framing choices are KB-grounded: the autonomy framing and any controls pattern
  trace to a best-fit learning on the KB (matched via kb-search) or to a recorded KB-learning-gap
  proposal — never the model's taste.
- C11 — Exactly one human checkpoint, presenting the gate verdict, the weights, and the controls,
  plus any decision, before anything is written. Nothing persists before approval.

### Failure conditions

- F1 — /agentic ran on an unready slice — the slice is absent, a functionality does not resolve to
  a grounding doc, or the profile is not firmed.
- F2 — A write touched something other than this slice's `agentic.md` or a decision (the spine, the
  slice record, the profile, another lens, structure, a persona, a journey, or another slice).
- F3 — `agentic.md` fails its template/shape (a missing or extra section, an empty or telegraphic
  section), or carries content outside the gate/weights/controls.
- F4 — `agentic.md` fails the content-quality eval.
- F5 — The verdict or a weight is invented — asserted with no behavior of the slice's
  functionalities behind it, or a material autonomy choice with no recorded decision.
- F6 — A functionality of the slice is left unconsidered by the agentic assessment.
- F7 — /agentic read or depended on another lens.
- F8 — Agentic behavior was manufactured where the functionalities don't warrant it — `is_agent`
  true with no agentic work, or a weights table on a non-agent slice.
- F9 — A product-model file other than this slice's `agentic.md` or a new decision changed, or an
  accepted decision was edited in place rather than superseded.
- F10 — An agentic-framing choice rests on neither a matched KB learning nor a recorded proposal.
- F11 — The lens was persisted before the human approved the checkpoint.

## Expectation

### Success scenarios

- S1 — (agent designer, first run) Given a shaped slice whose functionalities resolve and a firmed
  profile, when /agentic runs and the checkpoint is approved, then `agentic.md` is written as the
  gate, the weights, and the controls — passing the linter and the content eval — and nothing else
  changes. Measure: `slices/{slice}/lens/agentic.md` exists and is a valid Agentic Lens doc; the
  content-eval gate passes; the spine, slice record, profile, and other lenses are byte-identical.
- S2 — (product owner, the honest gate) Given a deterministic read/compute slice, when /agentic
  runs, the verdict is `is_agent: false` with the reason, and the weights table reads `n/a`.
  Measure: the manifest's `is_agent` is false; `agentic.md` states no agent and omits weights.
- S3 — (reviewer, grounded) Given the lens is drafted, the verdict and any weight trace to the
  slice's functionalities, and any material autonomy choice to a recorded decision. Measure: the
  manifest names a real functionality source for the assessment; material choices name a decision
  that resolves.
- S4 — (architect, hub-only) Given /agentic runs, it read no other realize lens and wrote none.
  Measure: no other lens of the slice is touched; the assessment grounds on no lens.
- S5 — (product owner, re-run) Given /agentic already ran, when it runs again, it re-derives
  `agentic.md` and changes nothing else; any new decision supersedes, none edited in place. Measure:
  only the slice's `agentic.md` (and possibly a new decision) differ; the spine, slice record, other
  lenses, and profile are byte-identical.
- S6 — (reviewer, the checkpoint) Given the lens is ready, the checkpoint presents the gate, the
  weights, and the controls, plus any decision, before any write. Measure: the checkpoint shows the
  lens inline; no product-model file is written before approval.

### Recovery (one per failure condition)

- REC1 (F1) — trigger: the slice is absent, a functionality does not resolve, or the profile is not
  firmed. direction: halt and route to /shape (shape the slice) or /understand (detail + firm)
  before /agentic runs. handoff: human.
- REC2 (F2) — trigger: a write touched something beyond this slice's `agentic.md` or a decision.
  direction: revert the out-of-scope write; /agentic writes only the slice's `agentic.md` (and any
  autonomy decision). handoff: autonomous.
- REC3 (F3) — trigger: `agentic.md` fails the template/shape or carries out-of-scope content.
  direction: re-emit the doc to the Agentic lens template — the gate, the weights, and the controls
  only. handoff: autonomous.
- REC4 (F4) — trigger: `agentic.md` fails the content-quality eval. direction: rewrite the failing
  section to the judge's cited fixes and re-judge until the gate passes. handoff: autonomous.
- REC5 (F5) — trigger: an invented verdict/weight, or a material choice with no decision. direction:
  re-tie the verdict and weights to the functionalities' behavior, and record the autonomy decision.
  handoff: autonomous.
- REC6 (F6) — trigger: a functionality was not considered. direction: extend the assessment to
  consider the missing functionality. handoff: autonomous.
- REC7 (F7) — trigger: /agentic read or depended on another lens. direction: remove the dependency;
  /agentic derives only from the slice's hub. handoff: autonomous.
- REC8 (F8) — trigger: agentic behavior was manufactured where the functionalities don't warrant it.
  direction: reset the gate to the honest verdict (`is_agent: false` + `n/a` weights for a
  deterministic slice). handoff: autonomous.
- REC9 (F9) — trigger: a non-lens/non-decision file changed, or an accepted decision was edited in
  place. direction: restore it and re-apply only the `agentic.md` (and the new decision), after a
  human confirms the restore. handoff: human.
- REC10 (F10) — trigger: an agentic-framing choice with no KB learning and no recorded proposal.
  direction: search the KB via kb-search for the best-fit learning and ground the choice, or raise a
  KB-learning-gap proposal; never keep a taste-only choice. handoff: autonomous.
- REC11 (F11) — trigger: the lens was persisted before the checkpoint was approved. direction:
  revert the premature write and re-present the checkpoint; persist only after approval. handoff:
  human.
