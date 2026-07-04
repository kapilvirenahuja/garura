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
checkpoint and write it to the product model only on approval.

Everything here is strategic and directional — CXO altitude. Detailing a capability and
introducing its functionalities is the **product manager's** work (/understand, the last
detailing step); breaking the detailed model into deliverable end-to-end verticals and
epics is the **product owner's** work (/shape). The play writes nothing at those
altitudes.

The grounding docs are the unit of meaning: each conforms to its locked template and
must clear the **content-quality eval** (a judge), so a thin or label-only doc cannot
pass. Structure lives in the spine; meaning lives in the docs.

Pipeline position: **start**. /vision OPENS the strategy pipeline (vision → understand → shape → roadmap): the D2 rule prepends `start-change` — resolve or create the strategy issue, cut the branch off fresh main, optional worktree, init STM — so every later strategy play runs on this already-started branch. No close sequence is injected here; the strategy change closes at /roadmap. It writes the persistent product model directly (additively), on the started branch. (#437)

### Constraints

- C1 — Conformance: every grounding doc the play writes conforms to its locked
  template (`domain.md` → the Theme template, in full; `capability.md` → the capability
  template's **directional** stage) and every spine entry conforms to the spine schema,
  with the spine and the docs consistent (each entry points at an existing doc of the
  matching kind and stage). The structural linter passes.
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
- C6 — Additive and non-destructive: the spine is **merged** (only entries whose id is
  absent, and the profile if none exists, are added) and grounding docs are written
  skip-if-exists. No existing spine entry or doc is ever overwritten or redrawn. An
  existing domain may be extended with new capabilities.
- C7 — Exactly one human checkpoint, presenting the domain, the directional
  capabilities, and the directional profile. Nothing is persisted to the product model
  before that checkpoint is approved.
- C8 — The play ends by proving its Done means at close (gated, #464): the goal was
  grounded, the seed drafted, and the approved seed applied to the product model —
  never by its step list running out.

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
- F5 — An existing spine entry or grounding doc was overwritten or redrawn.
- F6 — The product model was written before the human approved the checkpoint.
- F7 — The close proves nothing — the play closes COMPLETED without the Done means
  held.

## Expectation

### Success scenarios

- S1 — (CXO / product strategist, end to end) Given a business goal with no existing
  domain for it, when /vision runs and the checkpoint is approved, then a detailed
  domain doc, a directional capability doc per capability, the matching spine entries, and
  a directional profile are written — all conforming to their templates and clearing the
  content-quality eval. Measure: the spine's `domains` holds one entry and its
  `capabilities` holds at least one with `status: proposed`, `detail: directional`, and
  `domain` set to the domain id; each entry's `doc` exists at its pointer and matches its
  kind and stage; the linter passes; the content eval gate passes for every grounding
  doc; the profile `state` is `directional`.
- S2 — (architect, grounding audit) Given the seed is written, when capabilities are
  inspected, then each traces to a KB domain shelf or a recorded KB-node proposal.
  Measure: the seed manifest names, for every capability written, either a KB shelf it
  matched or a propose-kb-node proposal created for it; none is left without one.
- S3 — (product owner, non-destructive re-run) Given a domain already exists for the
  goal, when /vision runs again, then existing spine entries and docs are untouched and
  only absent capabilities are added. Measure: the apply manifest's `written` list holds
  only newly-added entries; every pre-existing spine entry and doc appears in `skipped`
  and is byte-identical before and after the run.
- S4 — (reviewer, the checkpoint) Given the proposed seed is ready, when the checkpoint
  is presented, then it shows the domain, the directional capabilities, and the
  directional profile, rendered inline, before any write. Measure: each of those
  sections is present in the checkpoint; no product-model file's modification time falls
  between the run start and the checkpoint approval.

### Done means

Paths are relative to the run's working folder (`<working>`, under
`{stm_base}_shaping/vision/`). Derived from the artifacts every completed run writes —
a re-run over an existing domain drafts only absent pieces, so the clauses assert the
always-written records, not per-node docs.

- D1 — says: "the KB grounding for the goal is recorded"
  check: { type: artifact_exists, path: "grounding.yaml" }
- D2 — says: "the drafted spine entries record exists"
  check: { type: artifact_exists, path: "draft/product-os/_spine.yaml" }
- D3 — says: "the seed manifest exists and records the profile decision"
  check: { type: artifact_exists, path: "draft/seed-manifest.yaml" }
- D4 — says: "the approved seed was applied to the product model"
  check: { type: field_equals, file: "apply-manifest.json", field: "applied", equals: true }

### Recovery (one per failure condition)

- REC1 (F1) — trigger: a grounding doc fails the linter's shape check, or a spine entry
  fails the schema or spine↔doc consistency. direction: re-emit the failing doc or spine
  entry to conform to its template/schema and restore consistency before the play
  completes. handoff: autonomous.
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
- REC5 (F5) — trigger: the content of an existing spine entry or grounding doc changed
  during the run. direction: restore the prior content and re-apply only the additive
  seed for absent entries, after a human confirms the restore. handoff: human.
- REC6 (F6) — trigger: a product-model file was written before the checkpoint was
  approved. direction: revert the premature write and re-present the checkpoint; persist
  only after the human approves. handoff: human.
- REC7 (F7) — trigger: the close would report COMPLETED without the Done means held.
  direction: evaluate the stop condition and surface the unmet clauses; the run closes
  HALTED until state is fixed. handoff: autonomous.
