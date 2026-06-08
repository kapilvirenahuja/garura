# vision — ICE source

The clean ICE triple this play is compiled from. Update this and recompile via
play-creator; never hand-edit the compiled SKILL.md.

## Intent

Given a business goal, plant the seed of the product model: create one domain
node, its candidate capability nodes, a goals-only ICE record per capability, and
a directional draft product profile. Ground the domain and capabilities in the KB
domain shelves rather than inventing them. Present the proposed seed at a single
human checkpoint and write it to the product model only on approval. Everything is
deliberately shallow and directional — the deeper work (full intent, context,
expectations, concrete NFR targets, functionalities, firm profile) belongs to the
later strategic plays (/understand, /shape).

Pipeline position: **none**. /vision is a strategic, model-building play in the
shaping pipeline; it opens no delivery issue and cuts no branch, so the D2 rule
injects neither a `start-change` head nor a close sequence. It writes the
persistent product model directly.

### Constraints

- C1 — Every node, ICE record, and profile the play writes conforms to the
  product-os, ice, and product-profile v1 schemas.
- C2 — The play writes only domain and capability nodes — never a functionality.
  Functionalities are /shape's job.
- C3 — Everything written is directional: capability nodes carry status
  `proposed`; the profile carries state `directional` (shape dimensions + rough
  NFR levels only). The play never writes status `active`, profile state `set` or
  `locked`.
- C4 — The capability ICE is seed-only: it carries `intent.goals` only. No
  context, no expectations, no `nfr_needs`, no `compliance_needs` — those belong
  to /understand.
- C5 — Domains and capabilities are grounded in the KB domain shelves by searching
  them. A capability that matches a shelf cites that shelf; a genuinely new domain
  or capability absent from the KB is recorded as a KB-node proposal — never
  silently invented.
- C6 — The play is additive and non-destructive: it creates only nodes, ICE, and
  profile that are absent, and may extend an existing domain with new capabilities.
  It never overwrites or redraws an existing node, ICE record, or profile box.
- C7 — There is exactly one human checkpoint, presenting the proposed domain,
  capabilities, seed goals, and directional profile. Nothing is persisted to the
  product model before that checkpoint is approved.

### Failure conditions

- F1 — A node, ICE record, or profile the play wrote violates its v1 schema
  (missing required field, wrong type, out-of-range level/state value).
- F2 — Scope over-reach: a functionality node, a profile in state `set`/`locked`,
  expectations, context, `nfr_needs`, or `compliance_needs` was written.
- F3 — A capability is neither grounded in a KB domain shelf nor recorded as a
  KB-node proposal.
- F4 — An existing node, ICE record, or profile was overwritten or redrawn.
- F5 — The product model was written before the human approved the checkpoint.

## Expectation

### Success scenarios

- S1 — (product strategist, end to end) Given a business goal with no existing
  domain for it, when /vision runs and the checkpoint is approved, then a domain
  node, its candidate capability nodes, a goals-only ICE per capability, and a
  directional product profile are written, all schema-valid. Measure: a node with
  `type: domain` exists; at least one node with `type: capability`, `status:
  proposed`, and `parent` set to the domain id exists; each capability node has an
  `ice_ref` to an ICE whose `intent.goals` is non-empty and whose `context`,
  `expectations`, and `nfr_needs` are empty; a profile with `state: directional`
  exists; every written artifact validates against its v1 schema.
- S2 — (architect, grounding audit) Given the seed is written, when capabilities
  are inspected, then each capability traces either to a KB domain shelf or to a
  recorded KB-node proposal. Measure: the play's STM grounding map names, for every
  capability written, either a KB shelf path it matched or a propose-kb-node
  proposal file created for it; no capability is left without one of the two.
- S3 — (product owner, non-destructive re-run) Given a domain already exists for
  the goal, when /vision runs again, then existing nodes, ICE, and profile are
  untouched and only absent capabilities are added. Measure: the content of every
  pre-existing node, ICE, and profile file is byte-identical before and after the
  run; any capability added is one that did not previously exist.
- S4 — (reviewer, the checkpoint) Given the proposed seed is ready, when the
  checkpoint is presented, then it shows the domain, the candidate capabilities
  with one-line summaries and their goals, and the directional profile (shape +
  rough NFR levels), rendered inline, before any write. Measure: each of those
  sections is present in the checkpoint; no product-model file's modification time
  is later than the run start and earlier than the checkpoint approval.

### Recovery (one per failure condition)

- REC1 (F1) — trigger: a written node, ICE, or profile fails v1 schema
  validation. direction: re-emit the failing artifact to conform to its schema
  before the play completes. handoff: autonomous.
- REC2 (F2) — trigger: a functionality node, a `set`/`locked` profile, or
  context/expectations/nfr_needs/compliance_needs appears in the output. direction:
  strip the over-reach — drop the functionality, reset the profile to
  `directional`, and remove context/expectations/nfr_needs/compliance_needs —
  leaving only /vision's seed scope. handoff: autonomous.
- REC3 (F3) — trigger: a capability has neither a KB shelf match nor a KB-node
  proposal. direction: search the KB to ground it, or record a propose-kb-node
  proposal for it; never leave it ungrounded. handoff: autonomous.
- REC4 (F4) — trigger: the content of an existing node, ICE, or profile file
  changed during the run. direction: restore the prior content and re-apply only
  the additive seed for absent nodes, after a human confirms the restore. handoff:
  human.
- REC5 (F5) — trigger: a product-model file was written before the checkpoint was
  approved. direction: revert the premature write and re-present the checkpoint;
  persist only after the human approves. handoff: human.
