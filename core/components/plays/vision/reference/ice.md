# vision — ICE source

The clean ICE triple this play is compiled from. Update this and recompile via
play-editor; never hand-edit the compiled SKILL.md.

## Intent

Given a business goal, plant the seed of the product model as the **CXO conversation**:
what you take to a CXO and get back. Write a **detailed domain** grounding doc (the
problem the domain owns, the bet, its operating principles, the directional
capabilities, the scope), name the candidate **capabilities and give each only its
directionality** (what it is about, the rough direction of its scope, why it matters),
lay down the matching **spine** entries (a domain + its capabilities), and sketch a
**directional product profile**. Ground the domain and capabilities in the KB domain
shelves rather than inventing them. Present the proposed seed at a single human
checkpoint and commit it to the product model only on approval.

Everything here is strategic and directional — CXO altitude. Detailing a capability and
introducing its functionalities is the **product manager's** work (/understand, the last
detailing step); breaking the detailed model into deliverable end-to-end verticals and
epics is the **product owner's** work (/shape). The play writes nothing at those
altitudes.

The grounding docs are the unit of meaning: each conforms to its locked template and
must clear the **content-quality eval** (a judge), so a thin or label-only doc cannot
pass. Structure lives in the spine; meaning lives in the docs.

Pipeline position: **start**. /vision OPENS the strategy pipeline (vision → understand → shape → roadmap): the D2 rule prepends `start-change` — resolve or create the strategy issue, cut the branch off fresh main, optional worktree, init STM — so every later strategy play runs on this already-started branch. No pipeline close sequence (no end PR) is injected here; the strategy change closes at /roadmap. It writes the persistent product model **directly, in place** (additively) on the started branch — there is no draft copy and no apply/promote step; review is the branch git diff and the pipeline's end PR. (#437, #500, ADR 026)

Write discipline (ADR 026, `standards/rules/direct-model-write.md`): the LLM authoring skill writes ONLY the per-node grounding docs (`domain.md`, `capability.md`) straight to the live model, and only for a node that is absent (skip-if-exists — it never overwrites an existing doc); every shared-file mutation (the spine `_spine.yaml`, including its `profile` block) is done by the deterministic keyed persist script, in place, merging the manifest's spine-delta additively — it adds only entries whose id is absent and the profile only if none exists, and refuses to modify any existing entry (the node-level containment the file-level scoped guard cannot see inside the shared spine). Because the LLM only ever writes separate doc files, containment is a post-write scoped guard over the full delta (`scoped_write_guard.py`), not a draft. Clean tree in, committed delta out: the product-os tree is asserted clean once start-change has cut the fresh branch, and after the approved checkpoint the play commits its own model delta on the branch, so the working-tree diff vs HEAD is exactly this run's delta and the next pipeline play (/understand) enters clean.

### Constraints

- C1 — Conformance: every grounding doc the play writes conforms to its locked
  template (`domain.md` → the Theme template, in full; `capability.md` → the capability
  template's **directional** stage) and every spine entry the keyed persist adds conforms
  to the spine schema, with the spine and the docs consistent (each entry points at an
  existing doc of the matching kind and stage). The structural linter passes.
- C2 — Content quality: every grounding doc clears the content-quality eval, not just
  the linter — each section is self-explaining at CXO altitude per the content standard
  (it names the thing AND explains why it matters), and the whole doc passes the
  stranger test. A label-only or thin doc fails.
- C3 — Altitude and scope: the play writes the **domain in full** and the
  **capabilities directionally only**. It never writes a functionality, never details a
  capability, never writes acceptance criteria — those belong to /understand and /shape.
- C4 — Directional state: capability entries carry `status: proposed` and
  `detail: directional`; the profile carries `state: directional` (shape dimensions +
  rough NFR levels only). The play never writes `active`, `set`, `locked`, or
  `detail: detailed`.
- C5 — Grounded, not invented: domains and capabilities are grounded in the KB domain
  shelves. A capability matching a shelf cites it; a genuinely new domain or capability
  absent from the KB is recorded as a KB-node proposal — never silently invented.
- C6 — Additive and non-destructive, enforced by the containment split and the post-write
  scoped guard: the LLM authoring skill writes only per-node grounding docs, skip-if-exists,
  and never a shared file; the keyed persist script merges the spine additively (adds only
  entries whose id is absent, adds the profile only if none exists) and refuses to modify
  any existing entry — this is the node-level containment inside the shared spine that the
  file-level guard cannot provide. After ALL writes and before the checkpoint, the bundled
  `scoped_write_guard.py` diffs the model tree against HEAD and FAILS the run (reverting the
  offending paths) if any model path changed outside the run's write scope — the grounding
  docs are `--add-only` (a new doc may be added, an existing one never modified) and the
  spine `_spine.yaml` (with its profile block) is `--allow` (the keyed persist merges it in
  place). No existing spine entry or doc is ever overwritten or redrawn; an existing domain
  may be extended with new capabilities.
- C7 — Exactly one human checkpoint, presenting the domain, the directional
  capabilities, and the directional profile. The checkpoint is a **conditional gate**
  (#467; `gate-config.md` three gate kinds — /vision is one of the eleven conditional
  document plays). Resolution order: pinned (n/a here) → the `gates.plays` override →
  the learned policy (classify the working-tree change shape — the model tree's diff vs
  HEAD — with the bundled `classify_change.py` (`--product-base`/`--base-ref HEAD`); a
  shape in `gate-policy.yaml`'s `auto:` and not in `never_auto:`, with NO blocking finding
  — a lint gap or a content-eval fail — auto-passes with the skip and the diff summary
  recorded) → `gates.classes.standard` → `gates.default`. EVERY crossing appends one
  live-eval line via the bundled `gate_eval.py` (shape, predicted gate|auto, the human's
  real action `approved_clean|approved_edited|rejected`, or `auto_pass`). Write-then-review
  (ADR 026): the run writes the full delta to the live model FIRST (docs by the authoring
  skill, the spine + profile by the keyed persist), so the checkpoint presents the real
  model git diff and the change-shape is classified over the full delta; nothing is
  COMMITTED before the gate resolves — a typed approval, a recorded config skip, OR a
  recorded policy auto-pass. On cancel the whole model delta is reverted (`git restore` +
  `git clean` over the model paths via the guard `--restore` with an empty allow set) — the
  branch, issue, and STM that start-change created are its own committed side effects and
  are left as-is. At close the play refreshes the learned policy with the bundled
  `distill_gate_policy.py` (config `gates.conditional`: streak/ledger/policy paths).
- C8 — The play ends by proving its Done means at close (gated, #464): the seed was
  written in place on the live model (the keyed persist record exists and stamps the write
  applied) and the scoped-write guard report reads ok (the allowlist held). The play then
  commits its own model delta on the branch. The close never reads COMPLETED with the
  stop-condition verdict unmet. This per-play Standard Play Close (evidence + delivery
  report) is distinct from the pipeline end sequence (the end PR), which /vision does not
  run — that closes at /roadmap.
- C9 — Clean tree in, committed delta out (ADR 026): once start-change has cut the fresh
  branch, the product-os tree is asserted clean (a dirty model tree halts), so HEAD is a
  correct base for the scoped guard and the change-shape; and after the approved checkpoint
  the play commits its model delta on the branch (`feat(model): … (#<issue>)`), so the next
  pipeline play (/understand) enters a clean tree with a correct base. This model-delta
  commit is a lightweight persist step, distinct from the Standard Play Close; it is not the
  pipeline end sequence.

### Failure conditions

- F1 — A grounding doc fails its template/shape (missing, extra, or out-of-order
  heading; an empty or telegraphic section), or a spine entry fails the spine schema or
  the spine↔doc consistency check.
- F2 — A grounding doc fails the content-quality eval: a section is a label rather than
  an explanation, is written above or below CXO altitude, or the doc fails the stranger
  test.
- F3 — Scope over-reach: a functionality, a detailed (non-directional) capability,
  acceptance criteria, a profile in state `set`/`locked`, or a capability marked
  `detail: detailed` was written.
- F4 — A capability is neither grounded in a KB domain shelf nor recorded as a KB-node
  proposal.
- F5 — Allowlist breach: an existing spine entry, grounding doc, or the profile was
  overwritten or redrawn, or a model path outside the run's write scope (a domain/
  capability doc that already existed, or any non-seed file) was changed — the scoped-write
  guard's report is not ok.
- F6 — The model delta was COMMITTED before the checkpoint gate resolved (no typed
  approval, no recorded config skip, and no recorded policy auto-pass), or a cancelled
  checkpoint left model writes on the working tree instead of reverting them.
- F7 — The close proves nothing — the play closes COMPLETED without the Done means held
  (no persist record, the persist not stamped applied, the scoped-write guard report not
  captured or not ok, or the model delta not committed).
- F8 — A conditional-gate crossing left no live-eval ledger line, or an auto-pass
  fired for a shape the policy does not list as auto (or that carried a blocking
  finding).
- F9 — The play ran against a dirty product-os tree (uncommitted model edits present once
  start-change had cut the branch), so the change-shape and the scoped guard could not be
  trusted to reflect only this run's delta.

## Expectation

### Success scenarios

- S1 — (CXO / product strategist, end to end) Given a business goal with no existing
  domain for it, when /vision runs and the checkpoint is approved, then a detailed
  domain doc, a directional capability doc per capability, the matching spine entries, and
  a directional profile are written in place on the live model — all conforming to their
  templates and clearing the content-quality eval. Measure: the spine's `domains` holds one
  entry and its `capabilities` holds at least one with `status: proposed`,
  `detail: directional`, and `domain` set to the domain id; each entry's `doc` exists at its
  pointer and matches its kind and stage; the linter passes; the content eval gate passes
  for every grounding doc; the profile `state` is `directional`; the stop-condition verdict
  reads held.
- S2 — (architect, grounding audit) Given the seed is written, when capabilities are
  inspected, then each traces to a KB domain shelf or a recorded KB-node proposal.
  Measure: the seed manifest names, for every capability written, either a KB shelf it
  matched or a propose-kb-node proposal created for it; none is left without one.
- S3 — (product owner, non-destructive re-run) Given a domain already exists for the
  goal, when /vision runs again, then existing spine entries and docs are untouched and
  only absent capabilities are added. Measure: the persist manifest's `written` list holds
  only newly-added entries and every pre-existing spine entry and doc appears in `skipped`;
  the scoped-write guard report reads `ok` (no add-only doc was modified, no existing entry
  was redrawn), and every pre-existing doc is byte-identical before and after the run.
- S4 — (reviewer, the checkpoint) Given the proposed seed is written in place, when the
  checkpoint is presented, then it shows the domain, the directional capabilities, and the
  directional profile, rendered inline over the real model git diff. Measure: each of those
  sections is present in the checkpoint; no product-model change is COMMITTED before the
  approval, and on cancel the working tree returns byte-clean to HEAD (`git restore` +
  `git clean`) — or, on the auto-pass path (a policy-listed shape), the gate resolves with
  no wait and the recorded auto-pass, the appended ledger line, and the diff summary stand
  in the approval's place.

### Done means

Paths are relative to the run's working folder (`<working>`, under
`{stm_base}_shaping/vision/<product_slug>/`). `persist-manifest.json` is the record the
keyed persist script writes after the approved checkpoint (its contract: `applied`,
`written`, `skipped`, `changed`) — the seed's grounding docs written in place on the live
model and the spine/profile merged additively; `guard-report.json` is the captured
`scoped_write_guard.py` output — the play always writes it, and its `ok` field is the
mechanical proof that no model path changed outside the seed's write scope (the allowlist
held). A re-run over an existing domain writes only absent pieces, so `applied` is stamped
`true` even when the profile was skipped — the clauses assert the always-written records,
not per-node docs.

- D1 — says: "the persist record exists — the seed's grounding docs and spine/profile were written in place on the live model"
  check: { type: artifact_exists, path: "persist-manifest.json" }
- D2 — says: "the seed was persisted — the persist record stamps the write applied"
  check: { type: field_equals, file: "persist-manifest.json", field: "applied", equals: true }
- D3 — says: "the scoped-write guard held — no model path changed outside the seed's write scope (the allowlist held)"
  check: { type: field_equals, file: "guard-report.json", field: "ok", equals: true }

### Recovery (one per failure condition)

- REC1 (F1) — trigger: a grounding doc fails the linter's shape check, or a spine entry
  fails the schema or spine↔doc consistency. direction: re-emit the failing doc or spine
  entry to conform to its template/schema and restore consistency before the checkpoint.
  handoff: autonomous.
- REC2 (F2) — trigger: a grounding doc fails the content-quality eval. direction:
  rewrite the failing doc to the judge's cited fixes — raise each flagged section to a
  self-explaining, CXO-altitude statement — and re-judge until it passes the gate.
  handoff: autonomous.
- REC3 (F3) — trigger: a functionality, a detailed capability, acceptance criteria, a
  `set`/`locked` profile, or a `detail: detailed` capability appears. direction: strip
  the over-reach — drop the functionality, demote the capability back to directional,
  remove the acceptance criteria, reset the profile to `directional` — leaving only
  /vision's seed scope. handoff: autonomous.
- REC4 (F4) — trigger: a capability has neither a KB shelf match nor a KB-node proposal.
  direction: search the KB to ground it, or record a propose-kb-node proposal; never
  leave it ungrounded. handoff: autonomous.
- REC5 (F5) — trigger: the scoped-write guard report is not ok — an existing spine entry,
  doc, or the profile was modified, or a path outside the seed's write scope changed.
  direction: the guard's `--restore` already reverted the offending paths; re-run the keyed
  persist writing only the additive seed (absent entries + absent docs), after a human
  confirms the restore. handoff: human.
- REC6 (F6) — trigger: the model delta was committed before the checkpoint resolved, or a
  cancelled checkpoint left writes on the working tree. direction: revert the premature
  commit and the working-tree writes (guard `--restore`, empty allow set) and re-present
  the checkpoint; commit only after the human approves. handoff: human.
- REC7 (F7) — trigger: the close would report COMPLETED without the Done means held.
  direction: close HALTED with `exit_reason: stop_condition_unmet` and the unmet clauses
  named; fix the state — re-run the keyed persist, re-capture the scoped-write guard
  report, or make the model-delta commit — and re-evaluate; the close stays HALTED until
  the verdict reads held. handoff: autonomous.
- REC8 (F8) — trigger: a crossing left no live-eval ledger line, or an auto-pass fired
  for a shape not listed `auto:` in the policy (or one carrying a blocking finding).
  direction: re-append the missing ledger line for the recorded crossing; when the
  auto-pass was unearned, re-run the gate as a live wait — render the approval prompt
  and wait for the typed response — before proceeding. handoff: autonomous.
- REC9 (F9) — trigger: the product-os tree is dirty once start-change has cut the branch
  (uncommitted model edits present). direction: halt and ask for a clean model tree —
  commit or revert the pending model edits — before /vision proceeds with the seed writes.
  handoff: human.
