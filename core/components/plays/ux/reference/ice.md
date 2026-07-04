# ux — ICE source

The clean ICE triple this play is compiled from. Update this and recompile via
play-editor; never hand-edit the compiled SKILL.md.

## Intent

Given one shaped **slice** — a vertical product increment from /shape, the thing you actually
deliver — write its **UX lens** as a grounding doc (`ux.md`): just enough to anchor the
intended experience and let the build figure the rest. The slice is the unit of realization; a
slice has no ICE of its own — its **hub** is the union of its functionalities' grounding docs
(`functionality.md`, which may span several capabilities) plus the product profile (read from
the spine). The lens is three things and only three: the **screens** the slice needs, each with
a low-fidelity layout; the **states** each screen can hold; and the product's **visual core** —
color and typography. The screens make every functionality of the slice visible, so a human can
confirm the shape and the intent under it. Accessibility is NOT in this lens — it lives in the
marketing lens now. Flows are not specified — the build derives them. Every screen is grounded in
one of the slice's functionalities or a persona/journey; the visual core is a deliberate choice
recorded as a decision; the cross-cutting pattern choices (visual core, navigation, responsive
strategy) are grounded in the KB or recorded as a KB-learning-gap proposal. It writes only this
slice's `ux.md` (and the visual-core decision) — never the spine, the slice record, the profile,
another lens, or another slice. One slice per run; one human checkpoint before anything persists.
The lens is gated by the structural linter (shape) and the content-quality eval (a judge).

Pipeline position: **start**. /ux is the START of the FUNCTIONAL realize pipe (ux → agentic →
marketing): the D2 rule prepends `start-change` — resolve or create the slice-realize issue, cut
the branch off fresh main, optional worktree, init STM — so /agentic and /marketing run on this
already-started branch. No close sequence is injected here; the functional pipe closes at
/marketing. It writes the persistent product model directly (the slice's ux lens), on the
started branch. It reads the hub only (the slice's functionalities' grounding + the profile);
never another lens. (#437, decision 24; 3-pipe realize 2026-06-25)

### Constraints

- C1 — One slice per run, and only a ready one: the slice exists (shaped by /shape), every
  functionality it bundles resolves through the spine to a `functionality.md` grounding doc, and
  the product profile is firmed (`set`). If not, halt — /ux realizes a shaped slice; it does not
  shape one.
- C2 — Writes only this slice's `ux.md` (and any decision), in the slice's lens folder. Never the
  spine, the slice record, the profile, another lens, the node tree, personas, journeys, or
  other slices.
- C3 — Shape: `ux.md` conforms to the UX lens template — the sections Intent, Screens (name +
  low-fidelity layout), States (per screen), and Visual core (palette + typography) — and the
  structural linter passes. No flows, no accessibility block, no gates/components/environments.
- C4 — Content quality: `ux.md` clears the content-quality eval, not just the linter — each
  section is self-explaining and the doc passes the stranger test.
- C5 — Grounded, not invented: every screen traces to one of the slice's functionalities or to a
  persona/journey; the visual core (color + typography) is a deliberate choice recorded as a
  decision. (Tracked in the grounding manifest.)
- C6 — Coverage: every functionality the slice bundles is visualized by at least one screen, so
  the human can validate the whole shaped increment. Nothing shaped is left unvisualized.
- C7 — Reads the hub only: /ux derives from the slice's functionalities' grounding docs and the
  profile — never from another realize lens (quality/agentic/architecture/run/measure/marketing).
- C8 — The visual core is a material choice recorded as a slice-level decision the whole product
  references; it is not re-invented per slice.
- C9 — Additive and non-destructive: the run changes only this slice's `ux.md` (and any new
  decision); the spine, the slice record, the profile, the other lenses, and the other slices are
  byte-unchanged. Re-running re-derives the lens; accepted decisions are superseded, never edited
  in place.
- C10 — UX pattern choices are KB-grounded: the visual core, the navigation pattern, and the
  responsive strategy trace to a best-fit learning on the KB's technology/architecture shelf
  (matched via kb-search) or to a recorded KB-learning-gap proposal — never the model's taste.
- C11 — Exactly one human checkpoint, presenting the proposed screens (with layouts), states, and
  visual core, plus any decision, before anything is written. The checkpoint is a **conditional
  gate** (#467; `gate-config.md` three kinds — /ux is one of the eleven conditional document
  plays). Resolution order: pinned (n/a here) → `gates.plays` override → the learned policy
  (classify the draft-vs-live change shape with the bundled `classify_change.py`; a shape in
  `gate-policy.yaml`'s `auto:` and not in `never_auto:`, with NO blocking finding — lint gap or
  content-eval fail — auto-passes with the skip and the diff summary recorded) →
  `gates.classes.standard` → `gates.default`. EVERY crossing appends one live-eval line via the
  bundled `gate_eval.py` (shape, predicted gate|auto, the human's real action
  approved_clean|approved_edited|rejected, or auto_pass). Nothing persists before the gate
  resolves: a typed approval, a recorded config skip, OR a recorded policy auto-pass. At close the
  play refreshes the learned policy with the bundled `distill_gate_policy.py` (config
  `gates.conditional`: streak/ledger/policy paths).
- C12 — The play ends by proving its Done means at close (gated, #464): the drafted lens and its
  grounding manifest exist in the run's workspace, and the apply manifest carries the MACHINE field
  `lens_applied: true` (the lens landed in the model tree) — never prose claims. A close whose Done
  means does not hold reads HALTED, never COMPLETED.

### Failure conditions

- F1 — /ux ran on an unready slice — the slice is absent, a functionality does not resolve to a
  grounding doc, or the profile is not firmed.
- F2 — A write touched something other than this slice's `ux.md` or a decision (the spine, the
  slice record, the profile, another lens, structure, a persona, a journey, or another slice).
- F3 — `ux.md` fails its template/shape (a missing or extra section, an empty or telegraphic
  section), or carries content outside screens/states/visual core.
- F4 — `ux.md` fails the content-quality eval.
- F5 — An element is invented — a screen with no functionality and no persona/journey behind it,
  or a visual core with no recorded decision.
- F6 — A functionality of the slice is left unvisualized — covered by no screen.
- F7 — /ux read or depended on another lens.
- F8 — The visual core was set with no decision recorded.
- F9 — A product-model file other than this slice's `ux.md` or a new decision changed, or an
  accepted decision was edited in place rather than superseded.
- F10 — A UX pattern choice rests on neither a matched KB learning nor a recorded proposal.
- F11 — The lens was persisted before the checkpoint gate resolved — no typed approval, no
  recorded config skip, and no recorded policy auto-pass.
- F12 — The run closed COMPLETED without the Done means held — a missing draft lens or grounding
  manifest, or an apply manifest without the machine applied field true.
- F13 — A conditional-gate crossing left no live-eval ledger line, or an auto-pass fired for a
  shape the policy does not list as auto (or that carried a blocking finding).

## Expectation

### Success scenarios

- S1 — (product designer, first run) Given a shaped slice whose functionalities resolve and a
  firmed profile, when /ux runs and the checkpoint is approved, then `ux.md` is written as screens
  (with layouts), states, and a visual core — passing the linter and the content eval — and
  nothing else changes. Measure: `slices/{slice}/lens/ux.md` exists and is a valid UX Lens doc;
  the content-eval gate passes; the spine, slice record, profile, and other lenses are
  byte-identical.
- S2 — (product owner, validates the shape) Given the screens are drafted, when shown them, the
  human sees every functionality of the slice rendered as a low-fidelity screen. Measure: every
  functionality the slice bundles maps to at least one screen in the manifest; none unvisualized.
- S3 — (ux researcher, grounded) Given the lens is drafted, each screen traces to a functionality
  or a persona/journey, and the visual core to a recorded decision. Measure: the manifest names a
  real source for every screen; the visual core names a decision that resolves.
- S4 — (architect, hub-only) Given /ux runs, it read no other realize lens and wrote none.
  Measure: no other lens of the slice is touched; no screen grounds on a lens.
- S5 — (product owner, re-run) Given /ux already ran, when it runs again, it re-derives `ux.md`
  and changes nothing else; the visual-core decision is reused, any new decision supersedes.
  Measure: only the slice's `ux.md` (and possibly a new decision) differ; the spine, slice record,
  other lenses, and profile are byte-identical; no accepted decision edited in place.
- S6 — (reviewer, the checkpoint) Given the screens are ready, the checkpoint presents the screens
  (with layouts), states, and visual core, plus the decision, before any write. Measure: the
  checkpoint shows the lens inline; no product-model file is written before approval — or, on the
  auto-pass path, the change shape is policy-listed and a recorded auto-pass + live-eval ledger
  line + diff summary exist, with no wait.

### Done means

- D1 — says: "the drafted UX lens exists"
  check: { type: artifact_exists, path: "draft/product-os/*/slices/*/lens/ux.md" }
- D2 — says: "the grounding manifest exists"
  check: { type: artifact_exists, path: "draft/ux-manifest.yaml" }
- D3 — says: "the UX lens landed in the model tree — machine-recorded by the apply"
  check: { type: field_equals, file: "apply-manifest.json", field: "lens_applied", equals: true }

### Recovery (one per failure condition)

- REC1 (F1) — trigger: the slice is absent, a functionality does not resolve, or the profile is
  not firmed. direction: halt and route to /shape (shape the slice) or /understand (detail + firm)
  before /ux runs. handoff: human.
- REC2 (F2) — trigger: a write touched something beyond this slice's `ux.md` or a decision.
  direction: revert the out-of-scope write; /ux writes only the slice's `ux.md` (and the
  visual-core decision). handoff: autonomous.
- REC3 (F3) — trigger: `ux.md` fails the template/shape or carries out-of-scope content.
  direction: re-emit the doc to the UX lens template — Intent/Screens/States/Visual core only
  (accessibility belongs to marketing, flows to the build). handoff: autonomous.
- REC4 (F4) — trigger: `ux.md` fails the content-quality eval. direction: rewrite the failing
  section to the judge's cited fixes and re-judge until the gate passes. handoff: autonomous.
- REC5 (F5) — trigger: an invented/ungrounded element. direction: drop it, or re-tie the screen to
  a functionality or persona/journey, and tie the visual core to a decision. handoff: autonomous.
- REC6 (F6) — trigger: a functionality is covered by no screen. direction: add the screen(s) that
  visualize the missing functionality. handoff: autonomous.
- REC7 (F7) — trigger: /ux read or depended on another lens. direction: remove the dependency;
  /ux derives only from the slice's hub. handoff: autonomous.
- REC8 (F8) — trigger: the visual core was set with no decision. direction: record the slice-level
  visual-core decision before persisting; reuse the product decision if one exists. handoff:
  autonomous.
- REC9 (F9) — trigger: a non-lens/non-decision file changed, or an accepted decision was edited in
  place. direction: restore it and re-apply only the `ux.md` (and the new decision), after a human
  confirms the restore. handoff: human.
- REC10 (F10) — trigger: a UX pattern choice with no KB learning and no recorded proposal.
  direction: search the KB via kb-search for the best-fit learning and ground the choice, or raise
  a KB-learning-gap proposal; never keep a taste-only choice. handoff: autonomous.
- REC11 (F11) — trigger: the lens was persisted before the checkpoint gate resolved. direction:
  revert the premature write and re-present the checkpoint; persist only after the gate resolves
  (approval, a recorded config skip, or a recorded policy auto-pass). handoff: human.
- REC12 (F12) — trigger: the run is about to close COMPLETED with the Done means unmet (a missing
  draft or manifest artifact, or an apply manifest without the machine applied field). direction:
  produce the missing artifact — re-run the failed step, or re-run `apply_ux.py` so the apply
  manifest carries the machine field — then re-evaluate the stop condition; the close stays HALTED
  until the verdict reads held. handoff: autonomous.
- REC13 (F13) — trigger: a conditional-gate crossing left no live-eval ledger line, or an
  auto-pass fired for a shape the policy does not list as auto (or with a blocking finding).
  direction: re-append the missing ledger line via `gate_eval.py`; when the auto-pass was
  unearned, revert any premature persist and re-run the gate as a live wait. handoff: autonomous.
