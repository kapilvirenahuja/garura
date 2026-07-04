# quality — ICE source

The clean ICE triple this play is compiled from. Update this and recompile via
play-editor; never hand-edit the compiled SKILL.md.

## Intent

Given one shaped **slice** — a vertical product increment from /shape, the thing you actually
deliver — write its **quality lens** as a grounding doc (`quality.md`): the bar the slice must
clear, expressed as checkable gates, plus a short statement of what "good" means for this slice.
The slice is the unit of realization; a slice has no ICE of its own — its **hub** is the union of
its functionalities' grounding docs (`functionality.md`, which may span several capabilities) plus
the product profile (read from the spine). The lens is two things and only two: the **intent**
(what good means for this slice and why that bar) and the **gates** (a table of checkable bars —
each a dimension, the bar, and how it is checked — drawn from the product profile's NFR gates that
apply to this slice and from the slice's functionalities' own rules made checkable). The gates are
grounded, never invented: each traces to a profile gate that applies or to a functionality's rule;
any material choice is recorded as a decision. It writes only this slice's `quality.md`, its machine
sibling `quality-gates.yaml` (#462 — the per-gate binding cards run-quality-gates executes), and any
decision — never the spine, the slice record, the profile, another lens, or another slice. One
slice per run; one human checkpoint before anything persists. The lens is gated by the structural
linter (shape) and the content-quality eval (a judge).

Pipeline position: **none**. /quality is the MIDDLE of the NON-FUNCTIONAL realize pipe (architecture
→ quality → run): it expects to run on the branch /arch already started, injects no `start-change`
head and no close sequence, stops when its work is done, and leaves the branch for /run. The close
belongs to /run (the non-functional pipe's end). It writes the persistent product model directly
(the slice's quality lens), on the already-started branch, and reads the hub only — never another
lens. (#437; 3-pipe realize 2026-06-25)

### Constraints

- C1 — One slice per run, and only a ready one: the slice exists (shaped by /shape), every
  functionality it bundles resolves through the spine to a `functionality.md` grounding doc, and the
  product profile is firmed (`set`). If not, halt — /quality realizes a shaped slice; it does not
  shape one.
- C2 — Writes only this slice's `quality.md`, its machine sibling `quality-gates.yaml` (#462 — one
  binding card per gate, part of the lens's contract), and any decision, in the slice's lens folder.
  Never the spine, the slice record, the profile, another lens, the node tree, personas, journeys,
  or other slices.
- C3 — Shape: `quality.md` conforms to the Quality lens template — the sections "Intent" and "Gates"
  (Gates a table: dimension, bar, how checked) — and the structural linter passes. No content
  outside those two sections.
- C4 — Content quality: `quality.md` clears the content-quality eval, not just the linter — each
  section is self-explaining and the doc passes the stranger test.
- C5 — Grounded, not invented: every gate traces to a product-profile NFR gate that applies to this
  slice or to a rule of one of the slice's functionalities, made checkable; any material choice is
  recorded as a decision. (Tracked in the manifest.)
- C6 — Coverage: every functionality the slice bundles is considered by the gates — a functionality's
  quality-relevant rules are made into gates; nothing shaped is left unconsidered.
- C7 — Reads the hub only: /quality derives from the slice's functionalities' grounding docs and the
  profile — never from another realize lens (ux/agentic/architecture/run/measure/marketing).
- C8 — Concrete gates: every gate is a checkable bar — a value or a named standard plus how it is
  checked — never a vague adjective ("fast", "secure"). A gate that cannot be checked is not a gate.
- C9 — Additive and non-destructive: the run changes only this slice's `quality.md` and its machine
  sibling `quality-gates.yaml` (and any new decision); the spine, the slice record, the profile, the
  other lenses, and the other slices are byte-unchanged. Re-running re-derives the lens; accepted
  decisions are superseded, never edited in place.
- C10 — Exactly one human checkpoint, presenting the intent and the gates, plus any decision, before
  anything is written. The checkpoint is a **conditional gate** (#467; `gate-config.md` three kinds —
  /quality is one of the eleven conditional document plays). Resolution order: pinned (n/a here) →
  `gates.plays.quality` override → the learned policy (classify the draft-vs-live change shape with
  the bundled `classify_change.py`; a shape in `gate-policy.yaml`'s `auto:` and not in `never_auto:`,
  with NO blocking finding — lint gap or content-eval fail — auto-passes with the skip and the diff
  summary recorded) → `gates.classes.standard` → `gates.default`. EVERY crossing appends one live-eval
  line via the bundled `gate_eval.py` (shape, predicted gate|auto, the human's real action
  approved_clean|approved_edited|rejected, or auto_pass). Nothing persists before the gate resolves: a
  typed approval, a recorded config skip, OR a recorded policy auto-pass. At close the play refreshes
  the learned policy with the bundled `distill_gate_policy.py` (config `gates.conditional`:
  streak/ledger/policy paths).
- C11 — The play ends by proving its Done means at close (gated, #464): the drafted lens and its
  grounding manifest exist in the run's workspace, and the apply manifest carries the MACHINE fields
  `lens_applied: true` and `gates_machine_applied: true` (the lens and its machine sibling landed in
  the model tree) — never prose claims. A close whose Done means does not hold reads HALTED, never
  COMPLETED.

### Failure conditions

- F1 — /quality ran on an unready slice — the slice is absent, a functionality does not resolve to a
  grounding doc, or the profile is not firmed.
- F2 — A write touched something other than this slice's `quality.md` or a decision (the spine, the
  slice record, the profile, another lens, structure, a persona, a journey, or another slice).
- F3 — `quality.md` fails its template/shape (a missing or extra section, an empty or telegraphic
  section), or carries content outside intent/gates.
- F4 — `quality.md` fails the content-quality eval.
- F5 — A gate is invented — asserted with no profile gate and no functionality rule behind it — or a
  material choice with no recorded decision.
- F6 — A functionality of the slice is left unconsidered by the gates.
- F7 — /quality read or depended on another lens.
- F8 — A gate is not checkable — a vague adjective with no value, standard, or check.
- F9 — A product-model file other than this slice's `quality.md`, its machine sibling
  `quality-gates.yaml`, or a new decision changed, or an accepted decision was edited in place rather
  than superseded.
- F10 — The lens was persisted before the checkpoint gate resolved — no typed approval, no recorded
  config skip, and no recorded policy auto-pass.
- F11 — The run closed COMPLETED without the Done means held — a missing draft lens or grounding
  manifest, or an apply manifest without the machine applied fields true.
- F12 — A conditional-gate crossing left no live-eval ledger line, or an auto-pass fired for a shape
  the policy does not list as auto (or that carried a blocking finding).

## Expectation

### Success scenarios

- S1 — (quality engineer, first run) Given a shaped slice whose functionalities resolve and a firmed
  profile, when /quality runs and the checkpoint is approved, then `quality.md` is written as the
  intent and the gates — passing the linter and the content eval — and nothing else changes.
  Measure: `slices/{slice}/lens/quality.md` exists and is a valid Quality Lens doc; the content-eval
  gate passes; the spine, slice record, profile, and other lenses are byte-identical.
- S2 — (product owner, grounded gates) Given the lens is drafted, every gate traces to a profile NFR
  gate that applies or to a functionality's rule, and any material choice to a recorded decision.
  Measure: the manifest names a real profile gate or functionality source for every gate; material
  choices name a decision that resolves.
- S3 — (reviewer, concrete) Given the gates, each is a checkable bar — a value or a named standard
  plus how it is checked — never a vague adjective. Measure: every gate row carries a bar and a
  check; none is a bare adjective.
- S4 — (architect, hub-only) Given /quality runs, it read no other realize lens and wrote none.
  Measure: no other lens of the slice is touched; the gates ground on no lens.
- S5 — (product owner, re-run) Given /quality already ran, when it runs again, it re-derives
  `quality.md` and changes nothing else; any new decision supersedes, none edited in place. Measure:
  only the slice's `quality.md` (and possibly a new decision) differ; the spine, slice record, other
  lenses, and profile are byte-identical.
- S6 — (reviewer, the checkpoint) Given the lens is ready, the checkpoint presents the intent and the
  gates, plus any decision, before any write. Measure: the checkpoint shows the lens inline; no
  product-model file is written before approval — or, on the auto-pass path, the change's shape is
  policy-listed and the recorded auto-pass, the ledger line, and the diff summary stand in for the
  wait (no product-model file written before the gate resolved).

### Done means

- D1 — says: "the drafted quality lens exists"
  check: { type: artifact_exists, path: "draft/product-os/*/slices/*/lens/quality.md" }
- D2 — says: "the grounding manifest exists"
  check: { type: artifact_exists, path: "draft/quality-manifest.yaml" }
- D3 — says: "the quality lens landed in the model tree — machine-recorded by the apply"
  check: { type: field_equals, file: "apply-manifest.json", field: "lens_applied", equals: true }
- D4 — says: "the machine sibling quality-gates.yaml landed beside it (#462)"
  check: { type: field_equals, file: "apply-manifest.json", field: "gates_machine_applied", equals: true }

### Recovery (one per failure condition)

- REC1 (F1) — trigger: the slice is absent, a functionality does not resolve, or the profile is not
  firmed. direction: halt and route to /shape (shape the slice) or /understand (detail + firm) before
  /quality runs. handoff: human.
- REC2 (F2) — trigger: a write touched something beyond this slice's `quality.md` or a decision.
  direction: revert the out-of-scope write; /quality writes only the slice's `quality.md` (and any
  decision). handoff: autonomous.
- REC3 (F3) — trigger: `quality.md` fails the template/shape or carries out-of-scope content.
  direction: re-emit the doc to the Quality lens template — intent and gates only. handoff: autonomous.
- REC4 (F4) — trigger: `quality.md` fails the content-quality eval. direction: rewrite the failing
  section to the judge's cited fixes and re-judge until the gate passes. handoff: autonomous.
- REC5 (F5) — trigger: an invented gate, or a material choice with no decision. direction: re-tie each
  gate to a profile gate or a functionality rule, and record the material decision. handoff: autonomous.
- REC6 (F6) — trigger: a functionality was not considered. direction: extend the gates to cover the
  missing functionality's quality-relevant rules. handoff: autonomous.
- REC7 (F7) — trigger: /quality read or depended on another lens. direction: remove the dependency;
  /quality derives only from the slice's hub. handoff: autonomous.
- REC8 (F8) — trigger: a gate is not checkable. direction: re-draft the gate as a value or named
  standard plus how it is checked; drop or fix any bare adjective. handoff: autonomous.
- REC9 (F9) — trigger: a non-lens/non-decision file changed, or an accepted decision was edited in
  place. direction: restore it and re-apply only the `quality.md` (and the new decision), after a
  human confirms the restore. handoff: human.
- REC10 (F10) — trigger: the lens was persisted before the checkpoint gate resolved. direction: revert
  the premature write and re-present the checkpoint; persist only after the gate resolves (a typed
  approval, a recorded config skip, or a recorded policy auto-pass). handoff: human.
- REC11 (F11) — trigger: the run is about to close COMPLETED with the Done means unmet (a missing
  draft or manifest artifact, or an apply manifest without the machine applied fields). direction:
  produce the missing artifact — re-run the failed step, or re-run `apply_quality.py` so the apply
  manifest carries the machine fields — then re-evaluate the stop condition; the close stays HALTED
  until the verdict reads held. handoff: autonomous.
- REC12 (F12) — trigger: a conditional-gate crossing left no live-eval ledger line, or an auto-pass
  fired for a shape the policy does not list as auto (or that carried a blocking finding). direction:
  re-append the missing ledger line from the recorded crossing; when the auto-pass was unearned,
  re-run the gate as a live wait (render the prompt, take the typed verdict) and append the corrected
  line. handoff: autonomous.
