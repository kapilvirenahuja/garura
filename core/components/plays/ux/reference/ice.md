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
already-started branch. No pipeline close sequence (no end PR) is injected here; the functional
pipe closes at /marketing. It writes the persistent product model **directly, in place** (the
slice's ux lens and the visual-core decision) on the started branch — there is no draft copy and
no apply/promote step; review is the branch git diff and the pipeline's end PR. It reads the hub
only (the slice's functionalities' grounding + the profile); never another lens. (#437,
decision 24; 3-pipe realize 2026-06-25; #500, ADR 026)

Write discipline (ADR 026, `standards/rules/direct-model-write.md`): the LLM authoring skill
writes ONLY the per-node grounding doc (`ux.md`) straight to the live model; the one shared-file
mutation — the visual-core `decisions/*.yaml` (slice-level, `skip-if-exists`) — is done by the
deterministic keyed persist script, in place, keyed to the target slice so it cannot touch
another slice's decisions and never edits an accepted decision in place; it reads the skill's
manifest (an STM, non-model artifact) for the decision delta. Because the LLM only ever writes
the one doc file, containment is a post-write scoped guard over the full delta
(`scoped_write_guard.py`), not a draft. Clean tree in, committed delta out: the product-os tree
is asserted clean once start-change has cut the fresh branch, and after the approved checkpoint
the play commits its own model delta on the branch, so the working-tree diff vs HEAD is exactly
this run's delta and the next pipeline play (/agentic) enters clean.

### Constraints

- C1 — One slice per run, and only a ready one: the slice exists (shaped by /shape), every
  functionality it bundles resolves through the spine to a `functionality.md` grounding doc, and
  the product profile is firmed (`set`). If not, halt — /ux realizes a shaped slice; it does not
  shape one.
- C2 — Writes only this slice's `ux.md` (by the LLM skill) and its visual-core decision (by the
  keyed persist), in place on the live model in the slice's folder. Never the spine, the slice
  record, the profile, another lens, the node tree, personas, journeys, or other slices.
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
- C9 — Additive and non-destructive, enforced by the containment split and the post-write scoped
  guard: the LLM authoring skill writes only the per-node `ux.md` (re-derive overwrites the prior
  lens on a re-run), and never a shared file; the keyed persist script writes the visual-core
  decision `skip-if-exists`, keyed to the slice, and refuses to touch another slice's decisions
  or edit an accepted decision in place — the node-level containment the file-level guard cannot
  provide. After ALL writes and before the checkpoint, the bundled `scoped_write_guard.py` diffs
  the model tree against HEAD and FAILS the run (reverting the offending paths) if any model path
  changed outside the run's write scope — `ux.md` is `--allow` (the re-derive may overwrite it)
  and the slice's `decisions/*` are `--add-only` (a new decision may be added, an accepted one
  never modified). The spine, the slice record, the profile, the other lenses, and the other
  slices are byte-unchanged.
- C10 — UX pattern choices are KB-grounded: the visual core, the navigation pattern, and the
  responsive strategy trace to a best-fit learning on the KB's technology/architecture shelf
  (matched via kb-search) or to a recorded KB-learning-gap proposal — never the model's taste.
- C11 — Exactly one human checkpoint, presenting the proposed screens (with layouts), states, and
  visual core, plus the decision. The checkpoint is a **conditional
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
- F9 — Allowlist breach: a product-model path other than this slice's `ux.md` or its
  visual-core decision changed, or an accepted decision was edited in place rather than added —
  the scoped-write guard's report is not ok.
- F10 — A UX pattern choice rests on neither a matched KB learning nor a recorded proposal.
- F11 — The model delta was COMMITTED before the checkpoint gate resolved (no typed approval, no
  recorded config skip, and no recorded policy auto-pass), or a cancelled checkpoint left model
  writes on the working tree instead of reverting them.
- F12 — The run closed COMPLETED without the Done means held — no persist record, the persist not
  stamped applied, the scoped-write guard report not captured or not ok, or the model delta not
  committed.
- F13 — A conditional-gate crossing left no live-eval ledger line, or an auto-pass fired for a
  shape the policy does not list as auto (or that carried a blocking finding).
- F14 — The play ran against a dirty product-os tree (uncommitted model edits present once
  start-change had cut the branch), so the change-shape and the scoped guard could not be trusted
  to reflect only this run's delta.

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
- S6 — (reviewer, the checkpoint) Given the full delta is written in place, the checkpoint presents
  the screens (with layouts), states, and visual core, plus the decision, inline over the real
  model git diff. Measure: the checkpoint shows the lens inline; no product-model change is
  COMMITTED before approval, and on cancel the working tree returns byte-clean to HEAD (`git
  restore` + `git clean`) — or, on the auto-pass path, the change shape is policy-listed and a
  recorded auto-pass + live-eval ledger line + diff summary exist, with no wait.

### Done means

Paths are relative to the run's working root (`{stm_base}_realize/ux/<slice>/`).
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
- REC9 (F9) — trigger: the scoped-write guard report is not ok — a non-lens/non-decision path
  changed, or an accepted decision was edited in place. direction: the guard's `--restore` already
  reverted the offending paths; re-run writing only the slice's `ux.md` and its visual-core
  decision, after a human confirms the restore. handoff: human.
- REC10 (F10) — trigger: a UX pattern choice with no KB learning and no recorded proposal.
  direction: search the KB via kb-search for the best-fit learning and ground the choice, or raise
  a KB-learning-gap proposal; never keep a taste-only choice. handoff: autonomous.
- REC11 (F11) — trigger: the model delta was committed before the checkpoint resolved, or a
  cancelled checkpoint left writes on the working tree. direction: revert the premature commit and
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
