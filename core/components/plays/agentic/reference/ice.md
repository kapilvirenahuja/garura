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
human checkpoint before anything is committed. The lens is gated by the structural linter (shape)
and the content-quality eval (a judge).

Pipeline position: **none**. /agentic is the MIDDLE of the FUNCTIONAL realize pipe (ux → agentic →
marketing): it expects to run on the branch /ux already started, injects no `start-change` head and
no close sequence, stops when its work is done, and leaves the branch for /marketing. The close
belongs to /marketing (the functional pipe's end). It writes the persistent product model
**directly, in place** (the slice's agentic lens), on the already-started branch, and reads the hub
only — never another lens. There is no draft copy and no apply/promote step; review is the branch
git diff and the pipeline's end PR. (#437; 3-pipe realize 2026-06-25; #500, ADR 026)

Write discipline (ADR 026, `standards/rules/direct-model-write.md`): the LLM authoring skill
(author-agentic-lens) writes ONLY the per-node lens doc `agentic.md` straight to the live model
(overwriting a prior lens on a re-run); every shared-file mutation — the slice's `decisions/` — is
done by the deterministic keyed persist script, in place, keyed to the target slice so it cannot
write outside the slice's decisions folder, reading the manifest (an STM, non-model artifact) for
what to apply. Because the LLM only ever writes the one per-node doc file, containment is a
post-write scoped guard over the full delta (`scoped_write_guard.py`), not a draft. Clean tree in,
committed delta out: the product-os tree is asserted clean at entry, and after the approved
checkpoint the play commits its own model delta on the branch, so the working-tree diff vs HEAD is
exactly this run's delta.

### Constraints

- C1 — One slice per run, and only a ready one: the slice exists (shaped by /shape), every
  functionality it bundles resolves through the spine to a `functionality.md` grounding doc, and
  the product profile is firmed (`set`). If not, halt — /agentic realizes a shaped slice; it does
  not shape one.
- C2 — Writes only this slice's `agentic.md` (the per-node lens doc, straight to the live model by
  the authoring skill) and any decision (written in place by the keyed persist, from the manifest).
  Never the spine, the slice record, the profile, another lens, the node tree, personas, journeys,
  or other slices.
- C3 — Shape: `agentic.md` conforms to the Agentic lens template — the sections "Is it an agent?",
  "Load weights", and "Controls" — and the structural linter passes. No content outside those three.
- C4 — Content quality: `agentic.md` clears the content-quality eval, not just the linter — each
  section is self-explaining and the doc passes the stranger test.
- C5 — Grounded, not invented: the verdict and the weights trace to the behavior of the slice's
  functionalities; any material autonomy choice is recorded as a decision. (Carried in the manifest.)
- C6 — Coverage: the agentic assessment considers every functionality the slice bundles — the gate
  cannot ignore part of the slice. Nothing shaped is left unconsidered.
- C7 — Reads the hub only: /agentic derives from the slice's functionalities' grounding docs and the
  profile — never from another realize lens (quality/ux/architecture/run/measure/marketing).
- C8 — Honest gate: a slice that should offload nothing comes out `is_agent: false`, and the weights
  table is `n/a — not an agent`; agentic behavior is never manufactured where the functionalities
  don't warrant it.
- C9 — Additive and non-destructive, enforced by the containment split and the post-write scoped
  guard: the LLM authoring skill writes only the per-node lens doc and never a shared file; the
  keyed persist writes the slice's decisions skip-if-exists and refuses to write outside the target
  slice's decisions folder — this is the node-level containment inside the shared `decisions/`
  concern that the file-level guard cannot provide. After ALL writes and before the checkpoint, the
  bundled `scoped_write_guard.py` diffs the model tree against HEAD and FAILS the run (reverting the
  offending paths) if any model path changed outside the run's write scope. Re-running re-derives
  the lens (an overwrite of the slice's own `agentic.md`, in scope); accepted decisions are
  superseded, never edited in place; the spine, the slice record, the profile, the other lenses,
  and the other slices are byte-unchanged.
- C10 — Agentic-framing choices are KB-grounded: the autonomy framing and any controls pattern
  trace to a best-fit learning on the KB (matched via kb-search) or to a recorded KB-learning-gap
  proposal — never the model's taste.
- C11 — Exactly one human checkpoint, presenting the gate verdict, the weights, and the controls,
  plus any decision. The checkpoint is a **conditional gate** (#467; `gate-config.md` three kinds —
  /agentic is one of the eleven conditional document plays). Resolution order: pinned (n/a here) →
  `gates.plays` override → the learned policy (classify the working-tree change shape — the model
  tree's diff vs HEAD — with the bundled `classify_change.py` (`--product-base`/`--base-ref HEAD`);
  a shape in `gate-policy.yaml`'s `auto:` and not in `never_auto:`, with NO blocking finding — a
  lint gap or a content-eval fail — auto-passes with the skip and the diff summary recorded) →
  `gates.classes.standard` → `gates.default`. EVERY crossing appends one live-eval line via the
  bundled `gate_eval.py` (shape, predicted gate|auto, the human's real action
  approved_clean|approved_edited|rejected, or auto_pass). Write-then-review (ADR 026): the run
  writes the full delta to the live model FIRST (the lens by the authoring skill, any decision by
  the keyed persist), so the checkpoint presents the real model git diff and the change-shape is
  classified over the full delta; nothing is COMMITTED before the gate resolves — a typed approval,
  a recorded config skip, OR a recorded policy auto-pass. On cancel the whole model delta is
  reverted (`git restore` + `git clean` over the model paths via the guard `--restore` with an empty
  allow set). At close the play refreshes the learned policy with the bundled
  `distill_gate_policy.py` (config `gates.conditional`: streak/ledger/policy paths).
- C12 — The play ends by proving its Done means at close (gated, #464): the keyed persist record
  exists (`persist-manifest.json`), it stamps the lens landed in the live model
  (`lens_applied: true`), and the scoped-write guard report reads ok (`guard-report.json` `ok`) —
  never prose claims. The play then commits its own model delta on the branch. A close whose Done
  means does not hold reads HALTED, never COMPLETED.
- C13 — Clean tree in, committed delta out (ADR 026): the product-os tree is asserted clean at entry
  (pre-flight halts on a dirty model tree), so HEAD is a correct base for the scoped guard and the
  change-shape; and after the approved checkpoint the play commits its model delta on the branch
  (`feat(model): … (#<issue>)`), so the next pipeline play (/marketing) enters a clean tree with a
  correct base. This model-delta commit is a lightweight persist step, distinct from the per-play
  Standard Play Close (evidence + delivery report) that /agentic still runs; it is not the pipeline
  end sequence (that belongs to /marketing).

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
  accepted decision was edited in place rather than superseded — the scoped-write guard's report is
  not ok.
- F10 — An agentic-framing choice rests on neither a matched KB learning nor a recorded proposal.
- F11 — The model delta was COMMITTED before the checkpoint gate resolved — no typed approval, no
  recorded config skip, and no recorded policy auto-pass — or a cancelled checkpoint left model
  writes on the working tree instead of reverting them.
- F12 — The run closed COMPLETED without the Done means held — no persist record, the persist not
  stamping the lens landed, the scoped-write guard report not captured or not ok, or the model
  delta not committed.
- F13 — A conditional-gate crossing left no live-eval ledger line, or an auto-pass fired for a
  shape the policy does not list as auto (or that carried a blocking finding).
- F14 — The play ran against a dirty product-os tree (uncommitted model edits present at entry), so
  the change-shape and the scoped guard could not be trusted to reflect only this run's delta.

## Expectation

### Success scenarios

- S1 — (agent designer, first run) Given a shaped slice whose functionalities resolve and a firmed
  profile, when /agentic runs and the checkpoint is approved, then `agentic.md` is written in place
  on the live model as the gate, the weights, and the controls — passing the linter and the content
  eval — and nothing else changes. Measure: `slices/{slice}/lens/agentic.md` exists at its live path
  and is a valid Agentic Lens doc; the content-eval gate passes; the scoped-write guard report reads
  `ok`, so the spine, slice record, profile, and other lenses are byte-identical; the stop-condition
  verdict reads held.
- S2 — (product owner, the honest gate) Given a deterministic read/compute slice, when /agentic
  runs, the verdict is `is_agent: false` with the reason, and the weights table reads `n/a`.
  Measure: the manifest's `is_agent` is false; `agentic.md` states no agent and omits weights.
- S3 — (reviewer, grounded) Given the lens is written, the verdict and any weight trace to the
  slice's functionalities, and any material autonomy choice to a recorded decision. Measure: the
  manifest names a real functionality source for the assessment; material choices name a decision
  that resolves.
- S4 — (architect, hub-only) Given /agentic runs, it read no other realize lens and wrote none.
  Measure: no other lens of the slice is touched (the guard report is `ok`); the assessment grounds
  on no lens.
- S5 — (product owner, re-run) Given /agentic already ran, when it runs again, it re-derives
  `agentic.md` in place and changes nothing else; any new decision supersedes, none edited in place.
  Measure: the scoped-write guard report reads `ok` — only the slice's `agentic.md` (and possibly a
  new decision) differ; the spine, slice record, other lenses, and profile are byte-identical.
- S6 — (reviewer, the checkpoint) Given the lens is written in place, the checkpoint presents the
  gate, the weights, and the controls, plus any decision, rendered inline over the real model git
  diff, before any commit. Measure: the checkpoint shows the lens inline; no product-model change is
  COMMITTED before approval, and on cancel the working tree returns byte-clean to HEAD (`git restore`
  + `git clean`) — or, on the auto-pass path, the change shape is policy-listed and a recorded
  auto-pass + live-eval ledger line + diff summary exist, with no wait.

### Done means

Paths are relative to the run's working root (`{stm_base}_realize/agentic/`).
`persist-manifest.json` is the record the keyed persist script writes after the approved checkpoint
(its contract: `applied`, `written`, `skipped`, `refused`, `lens_applied`) — the slice's agentic
lens landed in place on the live model and any decision was written; `guard-report.json` is the
captured `scoped_write_guard.py` output — the play always writes it, and its `ok` field is the
mechanical proof that no model path changed outside the slice's write scope (the allowlist held).

- D1 — says: "the persist record exists — the slice's agentic lens was written in place on the
  live model and any decision persisted"
  check: { type: artifact_exists, path: "persist-manifest.json" }
- D2 — says: "the agentic lens landed in the model tree — machine-recorded by the keyed persist"
  check: { type: field_equals, file: "persist-manifest.json", field: "lens_applied", equals: true }
- D3 — says: "the scoped-write guard held — no model path changed outside the slice's write scope"
  check: { type: field_equals, file: "guard-report.json", field: "ok", equals: true }

### Recovery (one per failure condition)

- REC1 (F1) — trigger: the slice is absent, a functionality does not resolve, or the profile is not
  firmed. direction: halt and route to /shape (shape the slice) or /understand (detail + firm)
  before /agentic runs. handoff: human.
- REC2 (F2) — trigger: a write touched something beyond this slice's `agentic.md` or a decision.
  direction: the guard's `--restore` already reverted the out-of-scope write; re-run writing only
  the slice's `agentic.md` (and any autonomy decision). handoff: autonomous.
- REC3 (F3) — trigger: `agentic.md` fails the template/shape or carries out-of-scope content.
  direction: re-emit the doc to the Agentic lens template — the gate, the weights, and the controls
  only. handoff: autonomous.
- REC4 (F4) — trigger: `agentic.md` fails the content-quality eval. direction: rewrite the failing
  section to the judge's cited fixes and re-judge until the gate passes. handoff: autonomous.
- REC5 (F5) — trigger: an invented verdict/weight, or a material choice with no decision. direction:
  re-tie the verdict and weights to the functionalities' behavior, and record the autonomy decision
  in the manifest. handoff: autonomous.
- REC6 (F6) — trigger: a functionality was not considered. direction: extend the assessment to
  consider the missing functionality. handoff: autonomous.
- REC7 (F7) — trigger: /agentic read or depended on another lens. direction: remove the dependency;
  /agentic derives only from the slice's hub. handoff: autonomous.
- REC8 (F8) — trigger: agentic behavior was manufactured where the functionalities don't warrant it.
  direction: reset the gate to the honest verdict (`is_agent: false` + `n/a` weights for a
  deterministic slice). handoff: autonomous.
- REC9 (F9) — trigger: a non-lens/non-decision file changed, or an accepted decision was edited in
  place (the scoped-write guard report is not ok). direction: the guard's `--restore` already
  reverted the offending paths; re-run writing only the `agentic.md` (and the new decision), after a
  human confirms the restore. handoff: human.
- REC10 (F10) — trigger: an agentic-framing choice with no KB learning and no recorded proposal.
  direction: search the KB via kb-search for the best-fit learning and ground the choice, or raise a
  KB-learning-gap proposal; never keep a taste-only choice. handoff: autonomous.
- REC11 (F11) — trigger: the model delta was committed before the checkpoint resolved, or a
  cancelled checkpoint left writes on the working tree. direction: revert the premature commit and
  the working-tree writes (guard `--restore`, empty allow set) and re-present the checkpoint; commit
  only after the gate resolves (approval, a recorded config skip, or a recorded policy auto-pass).
  handoff: human.
- REC12 (F12) — trigger: the run is about to close COMPLETED with the Done means unmet (no persist
  record, the lens not stamped landed, or the guard report not captured or not ok). direction:
  close HALTED with `exit_reason: stop_condition_unmet` and the unmet clauses named; fix the state —
  re-run the keyed persist so the apply manifest stamps `lens_applied`, re-capture the scoped-write
  guard report, or make the model-delta commit — and re-evaluate; the close stays HALTED until the
  verdict reads held. handoff: autonomous.
- REC13 (F13) — trigger: a conditional-gate crossing left no live-eval ledger line, or an
  auto-pass fired for a shape the policy does not list as auto (or with a blocking finding).
  direction: re-append the missing ledger line via `gate_eval.py`; when the auto-pass was
  unearned, revert any premature commit and re-run the gate as a live wait. handoff: autonomous.
- REC14 (F14) — trigger: the product-os tree is dirty at entry (uncommitted model edits present).
  direction: halt at pre-flight and ask for a clean model tree — commit or revert the pending model
  edits (or run the prior pipeline play to its close) — before /agentic proceeds. handoff: human.
