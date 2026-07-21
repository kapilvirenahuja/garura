# arch — ICE source

The clean ICE triple this play is compiled from. Update this and recompile via
play-editor; never hand-edit the compiled SKILL.md.

## Intent

Given one shaped **slice** — a vertical product increment from /shape, the thing you actually
deliver — write its **architecture lens** as a grounding doc (`architecture.md`): the shape of
the software that delivers it. The slice is the unit of realization; a slice has no ICE of its
own — its **hub** is the union of its functionalities' grounding docs (`functionality.md`, which
may span several capabilities) plus the product profile (read from the spine). The lens is the
components the slice threads (each in its layer, with its contract), the stack (tech + versions)
behind them, and the vertical build that runs the slice end-to-end through them. Every component
is SELECTED, not invented — a system one of the slice's functionalities talks to, or a surface
the profile exposes; every stack pick is sized by the profile box and grounded in a KB learning
or a recorded proposal; every functionality threads through at least one component, because the
build is one vertical, end-to-end. It writes only this slice's `architecture.md` (and any
material-choice decision) — never the spine, the slice record, the profile, another lens, or
another slice. One slice per run; one human checkpoint before the model delta is committed. The
lens is gated by the structural linter (shape) and the content-quality eval (a judge).

Pipeline position: **start**. /arch is the START of the NON-FUNCTIONAL realize pipe (arch →
quality → run): the D2 rule prepends `start-change` — resolve or create the slice-realize issue,
cut the branch off fresh main, optional worktree, init STM — so /quality and /run run on this
already-started branch. No close sequence is injected here; the non-functional pipe closes at
/run. It writes the persistent product model (the slice's architecture lens) **directly, in
place** on the started branch — there is no draft copy and no apply/promote step; review is the
branch git diff and the pipe's end PR. It reads the hub (the slice's functionalities' grounding +
the profile) and MAY read the already-merged functional lens docs (ux/agentic/marketing), never
the measure or run lens. (#437, decision 24; 3-pipe realize 2026-06-26; #500 direct-model-write, ADR 026)

Write discipline (ADR 026, `standards/rules/direct-model-write.md`): the LLM authoring skill
writes ONLY the per-node lens doc (`architecture.md`) straight to the live model, re-deriving
this slice's lens in place; every shared-file mutation (the material-choice `decisions/`) is done
by the deterministic keyed persist script, in place, reading the skill's manifest — it writes each
decision skip-if-exists (an accepted decision is never edited in place) and refuses any path that
is not a decision (the node-level containment the file-level scoped guard cannot see). The skill
writes NO shared model file — no `_spine.yaml`, no profile, no `decisions/`, no other lens, no
slice record. Because the LLM only ever writes the one lens doc, containment is a post-write scoped
guard over the full delta (`scoped_write_guard.py`), not a draft. Clean tree in, committed delta
out: the product-os tree is asserted clean once start-change has cut the fresh branch, and after
the approved checkpoint the play commits its own model delta on the branch, so the working-tree
diff vs HEAD is exactly this run's delta and the next pipe play (/quality) enters clean.

### Constraints

- C1 — One slice per run, and only a ready one: the slice exists (shaped by /shape), every
  functionality it bundles resolves through the spine to a `functionality.md` grounding doc, and
  the product profile is firmed (`set`). If not, halt — /arch realizes a shaped slice; it does
  not shape one.
- C2 — Writes only this slice's `architecture.md` (by the LLM authoring skill, in place) and any
  material-choice decision (by the keyed persist script, from the manifest). Never the spine, the
  slice record, the profile, another lens, the node tree, personas, journeys, or other slices. The
  authoring skill writes NO shared file — only the one lens doc; the keyed persist owns the
  `decisions/`.
- C3 — Shape: `architecture.md` conforms to the Architecture lens template — the sections Intent,
  Components (each in its layer, with its contract), Stack (component / technology / version), and
  Vertical build — and the structural linter passes. No screens, gates, metrics, or environments.
- C4 — Content quality: `architecture.md` clears the content-quality eval, not just the linter —
  each section is self-explaining and the doc passes the stranger test.
- C5 — Grounded, not invented: every component traces to a system one of the slice's
  functionalities talks to or a surface the profile exposes; the stack traces to a KB learning or
  a decision. (Tracked in the grounding manifest.)
- C6 — Coverage: every functionality the slice bundles threads through at least one component, so
  the build is one vertical end-to-end. Nothing shaped is left unbuilt.
- C7 — Reads the hub (+ optionally the functional lens trinity): /arch derives from the slice's
  functionalities' grounding docs and the profile box, and MAY read the ux/agentic/marketing
  lenses — never the measure or run lens.
- C8 — The stack is a material choice recorded as a slice-level decision the whole product
  references; it is sized by the profile box, not invented per slice.
- C9 — Additive and non-destructive, enforced by the containment split and the post-write scoped
  guard: the LLM authoring skill re-derives only this slice's `architecture.md` and writes no
  shared file; the keyed persist writes each decision skip-if-exists (an accepted decision is
  never edited in place) and refuses any non-decision path — this is the node-level containment
  the file-level guard cannot provide. After ALL writes and before the checkpoint, the bundled
  `scoped_write_guard.py` diffs the model tree against HEAD and FAILS the run (reverting the
  offending paths) if any model path changed outside the run's write scope — this slice's
  `architecture.md` is `--allow` (re-derived in place) and this slice's `decisions/*.yaml` is
  `--add-only` (a decision may be added, an existing one never modified). The spine, the slice
  record, the profile, the other lenses, and the other slices are byte-unchanged. Re-running
  re-derives the lens; accepted decisions are superseded, never edited in place.
- C10 — Architecture choices are KB-grounded: the stack and the system-level shape trace to a
  best-fit learning on the KB's architecture/technology shelf (matched via kb-search) or to a
  recorded KB-learning-gap proposal — never the model's taste.
- C11 — Exactly one human checkpoint, presenting the proposed components (with contracts), the
  stack, and the vertical build, plus any decision. The checkpoint is a **conditional gate**
  (#467; `gate-config.md` three kinds — /arch is one of the eleven conditional document plays).
  Resolution order: pinned (n/a here) → `gates.plays` override → the learned policy (classify the
  working-tree change shape — the model tree's diff vs HEAD — with the bundled `classify_change.py`
  (`--product-base`/`--base-ref HEAD`); a shape in `gate-policy.yaml`'s `auto:` and not in
  `never_auto:`, with NO blocking finding — a lint gap, a content-eval fail, or a guard violation —
  auto-passes with the skip and the diff summary recorded) → `gates.classes.standard` →
  `gates.default`. EVERY crossing appends one live-eval line via the bundled `gate_eval.py` (shape,
  predicted gate|auto, the human's real action approved_clean|approved_edited|rejected, or
  auto_pass). Write-then-review (ADR 026): the run writes the full delta to the live model FIRST
  (the lens by the authoring skill, the decisions by the keyed persist), so the checkpoint presents
  the real model git diff and the change-shape is classified over the full delta; nothing is
  COMMITTED before the gate resolves — a typed approval, a recorded config skip, OR a recorded
  policy auto-pass. On cancel the whole model delta is reverted (`git restore` + `git clean` over
  the model paths via the guard `--restore` with an empty allow set) — the branch, issue, and STM
  that start-change created are its own committed side effects and are left as-is. At close the play
  refreshes the learned policy with the bundled `distill_gate_policy.py` (config `gates.conditional`:
  streak/ledger/policy paths).
- C12 — The play ends by proving its Done means at close (gated, #464): the lens and any decision
  were written in place on the live model (the keyed persist record `persist-manifest.json` exists
  and stamps the write applied) and the scoped-write guard report (`guard-report.json`) reads ok
  (the allowlist held). The play then commits its own model delta on the branch. A run that never
  applied — checkpoint cancelled, validation failed — closes HALTED, never COMPLETED with the
  stop-condition verdict unmet.
- C13 — Clean tree in, committed delta out (ADR 026): once start-change has cut the fresh branch,
  the product-os tree is asserted clean (a dirty model tree halts), so HEAD is a correct base for
  the scoped guard and the change-shape; and after the approved checkpoint the play commits its
  model delta on the branch (`feat(model): … (#<issue>)`), so the next pipe play (/quality) enters
  a clean tree with a correct base. This model-delta commit is a lightweight persist step, distinct
  from the Standard Play Close; it is not the pipe end sequence (the end PR belongs to /run).

### Failure conditions

- F1 — /arch ran on an unready slice — the slice is absent, a functionality does not resolve to a
  grounding doc, or the profile is not firmed.
- F2 — `architecture.md` fails its template/shape (a missing or extra section, an empty or
  telegraphic section), or carries content outside components/stack/vertical build.
- F3 — `architecture.md` fails the content-quality eval.
- F4 — A component or stack pick is invented — a component that is no functionality's system and
  no profile surface, or a stack with no recorded decision.
- F5 — A functionality of the slice threads through no component — the vertical is not end-to-end.
- F6 — /arch read or depended on the measure or run lens.
- F7 — The stack was set with no decision recorded.
- F8 — An architecture choice rests on neither a matched KB learning nor a recorded proposal.
- F9 — Allowlist breach: a model path outside this slice's `architecture.md` and its `decisions/`
  was changed (the spine, the profile, the slice record, another lens, structure, a persona, a
  journey, or another slice), or an accepted decision was edited in place rather than superseded —
  the scoped-write guard's report is not ok.
- F10 — The model delta was COMMITTED before the checkpoint gate resolved (no typed approval, no
  recorded config skip, and no recorded policy auto-pass), or a cancelled checkpoint left model
  writes on the working tree instead of reverting them.
- F11 — The close proves nothing — the play closes COMPLETED without the Done means held (no
  persist record, the persist not stamped applied, the scoped-write guard report not captured or
  not ok, or the model delta not committed).
- F12 — A conditional-gate crossing left no live-eval ledger line, or an auto-pass fired for a
  shape the policy does not list as auto (or that carried a blocking finding).
- F13 — The play ran against a dirty product-os tree (uncommitted model edits present once
  start-change had cut the branch), so the change-shape and the scoped guard could not be trusted
  to reflect only this run's delta.

## Expectation

### Success scenarios

- S1 — (architect, first run) Given a shaped slice whose functionalities resolve and a firmed
  profile, when /arch runs and the checkpoint is approved, then `architecture.md` is written in
  place as components, stack, and the vertical build — passing the linter and the content eval —
  and nothing else changes. Measure: `product-os/<domain>/slices/<slice>/lens/architecture.md`
  exists on the live model and is a valid Architecture Lens doc; the content-eval gate passes; the
  spine, slice record, profile, and other lenses are byte-identical; the stop-condition verdict
  reads held.
- S2 — (build lead, end-to-end) Given the components are authored, every functionality of the slice
  threads through at least one component. Measure: every functionality the slice bundles maps to
  ≥1 component in the manifest; none unbuilt.
- S3 — (architect, grounded) Given the lens is authored, each component traces to a functionality's
  system or a profile surface, and the stack to a recorded decision. Measure: the manifest names a
  real source for every component; the stack names a decision that resolves.
- S4 — (reviewer, foundation discipline) Given /arch runs, it read no measure or run lens and
  wrote none. Measure: the measure and run lenses of the slice are untouched; no component grounds
  on them.
- S5 — (architect, re-run) Given /arch already ran, when it runs again, it re-derives
  `architecture.md` in place and changes nothing else; the stack decision is reused, any new
  decision supersedes. Measure: only the slice's `architecture.md` (and possibly a new decision)
  differ; the spine, slice record, other lenses, and profile are byte-identical; the scoped-guard
  report reads ok; no accepted decision edited in place.
- S6 — (reviewer, the checkpoint) Given the lens and any decision are written in place, the
  checkpoint presents the components (with contracts), the stack, and the vertical build, plus the
  decision, over the real model git diff, before any commit. Measure: the checkpoint shows the lens
  inline; no product-model change is COMMITTED before approval, and on cancel the working tree
  returns byte-clean to HEAD — or, on the auto-pass path, the change shape is policy-listed and a
  recorded auto-pass + live-eval ledger line + diff summary exist, with no wait.

### Done means

Paths are relative to the run's working root (`{stm_base}_realize/arch/`). These are STM,
non-model artifacts (ADR 008/017) — the model itself is written IN PLACE under
`<product_base>product-os/`, never into the working root. `persist-manifest.json` is the record
the keyed persist script writes after the approved checkpoint (its contract: `applied`, `written`,
`skipped`) — the material-choice decisions written in place on the live model (the lens doc the
authoring skill already wrote); a run with no material decision still stamps `applied: true` (an
empty `written`). `guard-report.json` is the captured `scoped_write_guard.py` output — the play
always writes it, and its `ok` field is the mechanical proof that no model path changed outside
the slice's write scope (the allowlist held).

- D1 — says: "the persist record exists — the lens and any decision were written in place on the live model"
  check: { type: artifact_exists, path: "persist-manifest.json" }
- D2 — says: "the lens was persisted — the persist record stamps the write applied"
  check: { type: field_equals, file: "persist-manifest.json", field: "applied", equals: true }
- D3 — says: "the scoped-write guard held — no model path changed outside the slice's write scope (the allowlist held)"
  check: { type: field_equals, file: "guard-report.json", field: "ok", equals: true }

### Recovery (one per failure condition)

- REC1 (F1) — trigger: the slice is absent, a functionality does not resolve, or the profile is
  not firmed. direction: halt and route to /shape (shape the slice) or /understand (detail + firm)
  before /arch runs. handoff: human.
- REC2 (F2) — trigger: `architecture.md` fails the template/shape or carries out-of-scope content.
  direction: re-emit the doc to the Architecture lens template — Intent/Components/Stack/Vertical
  build only. handoff: autonomous.
- REC3 (F3) — trigger: `architecture.md` fails the content-quality eval. direction: rewrite the
  failing section to the judge's cited fixes and re-judge until the gate passes. handoff:
  autonomous.
- REC4 (F4) — trigger: an invented/ungrounded component or stack pick. direction: drop it, or
  re-tie the component to a functionality's system or a profile surface, and tie the stack to a
  decision. handoff: autonomous.
- REC5 (F5) — trigger: a functionality threads through no component. direction: add the
  component(s) that build the missing functionality, so the vertical is end-to-end. handoff:
  autonomous.
- REC6 (F6) — trigger: /arch read or depended on the measure or run lens. direction: remove the
  dependency; /arch derives from the hub and may read only the functional lenses. handoff:
  autonomous.
- REC7 (F7) — trigger: the stack was set with no decision. direction: record the slice-level stack
  decision before persisting; reuse the product decision if one exists. handoff: autonomous.
- REC8 (F8) — trigger: an architecture choice with no KB learning and no recorded proposal.
  direction: search the KB via kb-search for the best-fit learning and ground the choice, or raise
  a KB-learning-gap proposal; never keep a taste-only choice. handoff: autonomous.
- REC9 (F9) — trigger: the scoped-write guard report is not ok — a model path outside this slice's
  `architecture.md` and its `decisions/` changed, or an accepted decision was edited in place.
  direction: the guard's `--restore` already reverted the offending paths; re-run the keyed persist
  writing only this slice's decisions (skip-if-exists) and re-derive only its `architecture.md`,
  after a human confirms the restore. handoff: human.
- REC10 (F10) — trigger: the model delta was committed before the checkpoint resolved, or a
  cancelled checkpoint left writes on the working tree. direction: revert the premature commit and
  the working-tree writes (guard `--restore`, empty allow set) and re-present the checkpoint;
  commit only after the gate resolves (approval, a recorded config skip, or a recorded policy
  auto-pass). handoff: human.
- REC11 (F11) — trigger: the run is about to close COMPLETED with the Done means unmet. direction:
  close HALTED with `exit_reason: stop_condition_unmet` and the unmet clauses named; fix the state
  — re-run the keyed persist, re-capture the scoped-write guard report, or make the model-delta
  commit — and re-evaluate; the close stays HALTED until the verdict reads held. handoff:
  autonomous.
- REC12 (F12) — trigger: a conditional-gate crossing left no live-eval ledger line, or an
  auto-pass fired for a shape the policy does not list as auto (or with a blocking finding).
  direction: re-append the missing ledger line via `gate_eval.py`; when the auto-pass was
  unearned, revert any premature commit and re-run the gate as a live wait. handoff: autonomous.
- REC13 (F13) — trigger: the product-os tree is dirty once start-change has cut the branch
  (uncommitted model edits present). direction: halt and ask for a clean model tree — commit or
  revert the pending model edits — before /arch writes the lens. handoff: human.
