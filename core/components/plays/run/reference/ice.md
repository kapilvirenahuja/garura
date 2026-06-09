# run — ICE source

The clean ICE triple this play is compiled from. Update this and recompile via
play-creator; never hand-edit the compiled SKILL.md.

## Intent

Given one shaped **slice** — a vertical product increment from /shape, the thing you actually
deliver — whose **architecture lens is already written**, write its **run lens**: how the
slice is deployed and runs. The slice is the unit of realization: you pick a slice and run
quality → ux → agentic → arch → run on it, then ship it. A slice has no ICE of its own — its
hub is the union of its functionalities' ICE (which may span several capabilities) plus the
product profile. /run is the **fifth and last** realize lens.

The run lens is the operational picture and only that: the **environments** the slice moves
through (the path dev → staging → prod), the **rollout** (the feature flags it gates behind
and the strategy — blue/green, canary, rolling), the **migrations** (the data-change strategy,
gated and reversible), the **config/secrets** stance (per-environment config; secrets via a
secrets manager, never in the repo), the **CI/CD** pipeline (build → quality gates → deploy on
green), and the **targets** — for every architecture component, where and how it runs. /run
**deploys what /arch designed**: every run target binds to a real component in the slice's
architecture lens. It is the one realize lens that **reads another lens** (the architecture
lens), because you cannot say how something runs without knowing the parts that run.

Every operational choice is **grounded in the knowledge base, never invented**. Before it
drafts, /run searches the KB's architecture and technology shelves for the learnings whose
conditions match this product's situation (stage, scale, persistence, monetization) and bases
the rollout strategy, the migration stance, the environment topology, and the CI/CD shape on
**what has worked for us** — not on the model's taste. Any operational choice the KB does not
cover is recorded as a KB-learning-gap proposal (a candidate architecture/technology learning,
raised for review — never written to the KB here), never silently guessed. Material
choices (the rollout strategy, the migration strategy, the environment topology) are recorded
as slice-level decisions the product references.

Because it is the **last** lens, /run also carries the **lines-up duty**: once the run lens is
drafted, it verifies that all five lens files for the slice exist (quality, ux, agentic,
architecture, run) and that every cross-reference resolves — every architecture component has a
run target, and every run target binds to a real component. **Only when the slice lines up**
does /run **stamp the slice done**, flipping the slice record's `status` to `realized` — the
single marker `/grill` checks before it cuts delivery work. If a lens is missing or a
cross-reference dangles, /run still writes the run lens, reports what is missing, and does
**not** stamp.

It writes only the run lens (and a decision for any material choice), plus — on lines-up — the
slice record's `status` stamp and nothing else of the record. Never the functionalities' ICE,
the profile, another lens, structure, status of other nodes, personas, journeys, or other
slices. One slice per run; one human checkpoint before anything persists.

Pipeline position: **none**. /run is a realization, model-building play. It opens no delivery
issue and cuts no branch, so the D2 rule injects neither a `start-change` head nor a close
sequence. It writes the persistent product model directly. It runs after /arch (it reads the
architecture lens) and last in the realize sequence.

### Constraints

- C1 — One slice per run, and only a ready one: the slice exists (shaped by /shape), every
  functionality it bundles resolves to a rich ICE, the product profile is firmed (`set`), AND
  the slice's **architecture lens is present** (run deploys arch's parts, so it cannot run
  without them). If not, halt — /run realizes a shaped, architected slice; it does not shape or
  architect one.
- C2 — Writes only this slice's run lens (and any decision), plus — and only when the lines-up
  gate passes — the slice record's `status` stamp (→ `realized`) and its updated_by/version
  metadata. Never the functionalities' ICE, the profile, another lens (quality/ux/agentic/
  architecture), node structure, personas, journeys, other slices, or any slice-record field
  besides `status` and that metadata.
- C3 — run content only, and only the run-lens schema blocks: `content` carries
  `environments`, `rollout` (flags + strategy), `migrations`, `config_secrets`, `cicd`, and
  `targets` (component + where/how it runs) — and no other key. No architecture, ux, agentic,
  or quality content smeared in.
- C4 — Every operational choice is grounded in the KB, never invented: the rollout strategy,
  the migration stance, the environment topology, the CI/CD shape, and any runtime/stack pick
  the run lens names each trace to a best-fit learning on the KB's architecture or technology
  shelf (matched by the product's conditions via the kb-search interface) — or, where the KB
  does not cover it, to a recorded KB-learning-gap proposal (a candidate architecture/technology
  learning raised for review). No operational choice rests on the model's taste alone.
- C5 — Reads the hub + the architecture lens + the KB, and binds to arch: /run derives from the
  slice's functionalities' ICE, the profile box, the slice's **architecture lens**, and the KB.
  It never reads or derives content from the quality, ux, or agentic lens. Every entry in
  `targets` binds to a real component named in the architecture lens — no target points at a
  component that does not exist (no dangling target).
- C6 — Just enough, and coherent: there is an environment path, a rollout strategy, a migration
  stance (or an explicit "none, additive only"), a config/secrets stance, a CI/CD pipeline that
  gates deploy on green, and a target for **every** architecture component. It anchors the
  operational shape — it does not over-specify (no literal pipeline YAML, no per-resource
  sizing, no environment-by-environment secret values; that is the build's job off this lens).
- C7 — Material run choices are decisions: the rollout strategy, the migration strategy, and
  the environment topology are deliberate choices recorded as slice-level decisions (ADRs) the
  product references — not re-invented per slice.
- C8 — Lines-up gate (the last-lens duty): before the slice is stamped, all five lens files
  (quality, ux, agentic, architecture, run) exist for the slice and every cross-reference
  resolves — every architecture component has a run target and every run target binds to a real
  component. If any lens is missing or a reference dangles, the run lens is still written, the
  gaps are reported, and the slice is **not** stamped.
- C9 — The stamp is additive and surgical: when (and only when) C8 passes, the slice record's
  `status` flips to `realized` and its updated_by/version metadata is bumped — and nothing else
  of the record changes. The slice's composition (functionalities, name, outcome,
  dependency_notes, acceptance_intent, order, effort, depends_on) is unchanged.
- C10 — Additive and non-destructive: a run changes only the run lens, any new decision, and
  (on lines-up) the slice `status` stamp. Every other product-model file — the other lenses,
  the ICE, the profile, the other slices, node structure — is byte-unchanged. Re-running
  re-derives the run lens; accepted decisions are superseded by new records, never edited in
  place; an idempotent re-run that still lines up leaves the stamp `realized`.
- C11 — Schema conformance: the run lens and any decision validate against their v1 schemas
  (lens v1, decision v1); after the stamp, the slice record still validates against slice v1.
- C12 — Exactly one human checkpoint, presenting the proposed run lens (the six blocks), the KB
  groundings, the lines-up result, and whether the run will stamp the slice `realized`, before
  anything is written. Nothing persists before approval.

### Failure conditions

- F1 — /run ran on an unready slice — the slice is absent, a functionality's ICE does not
  resolve or is not rich, the profile is not firmed, or the architecture lens is missing.
- F2 — A write touched something other than this slice's run lens, a decision, or the slice
  record's `status` stamp (the functionalities' ICE, the profile, another lens, structure, a
  persona, a journey, another slice, or a slice-record field beyond `status`/metadata).
- F3 — The run lens carries content outside the six blocks (architecture parts, screens, gates,
  agentic weights, per-resource sizing), or is not the
  environments/rollout/migrations/config_secrets/cicd/targets shape.
- F4 — An operational choice is invented — a rollout strategy, migration stance, environment
  topology, CI/CD shape, or runtime pick with neither a matched KB learning nor a recorded
  KB-learning-gap proposal behind it.
- F5 — /run read or derived content from the quality, ux, or agentic lens; OR a `targets` entry
  binds to a component that the architecture lens does not declare (a dangling target).
- F6 — The run lens over- or under-specifies — a missing environment path, rollout strategy,
  migration stance, config/secrets stance, or CI/CD pipeline; an architecture component with no
  target; or build-level detail (literal pipeline YAML, resource sizing) smeared in.
- F7 — A material run choice (the rollout strategy, the migration strategy, or the environment
  topology) was made with no decision recorded.
- F8 — The slice was stamped `realized` despite the lines-up gate failing — a lens was missing
  or a cross-reference dangled.
- F9 — The stamp changed more than `status` and its metadata, or the slice's composition
  changed.
- F10 — A product-model file other than the run lens, a new decision, or the slice `status`
  stamp changed; an accepted decision was edited in place rather than superseded; or something
  was removed.
- F11 — The run lens or a decision violates its v1 schema, or the slice record fails slice v1
  after the stamp.
- F12 — The run lens (or the stamp) was persisted before the human approved the checkpoint.

## Expectation

### Success scenarios

- S1 — (platform engineer, first run) Given a shaped slice whose functionalities have rich ICE,
  a firmed profile, and a written architecture lens, when /run runs and the checkpoint is
  approved, then the run lens is written as KB-grounded environments, rollout, migrations,
  config/secrets, CI/CD, and per-component targets — and nothing else changes except, if the
  slice lines up, the `status` stamp. Measure: `slices/{slice}/lens/run.yaml` exists with
  `type: run`, a `slice_ref`, and non-empty `content.environments`, `content.rollout`,
  `content.migrations`, `content.config_secrets`, `content.cicd`, and `content.targets`; every
  other product-model file is byte-identical before and after (except the slice `status` if
  stamped); the lens validates against lens v1.
- S2 — (SRE, KB-grounded) Given the lens is drafted, when inspected, then every operational
  choice traces to a KB learning on the architecture or technology shelf, or to a recorded
  proposal. Measure: the run's grounding map names, for the rollout strategy, the migration
  stance, the environment topology, the CI/CD shape, and any runtime pick, the KB learning id
  (architecture/* or technology/*) it matched or the proposal file it raised; none ungrounded;
  `grounding_check.py` is clean.
- S3 — (architect, targets bind) Given the targets and the architecture lens, when traced, then
  every architecture component has a run target and every run target binds to a real component.
  Measure: every component in `architecture.yaml` appears as a `targets[].component`; every
  `targets[].component` resolves to a declared architecture component; no dangling target.
- S4 — (release manager, lines-up + stamp) Given all five lens files exist and every
  cross-reference resolves, when /run completes, then the slice is stamped `realized` and the
  stamp is the only change to the slice record. Measure: `check_lines_up.py` reports
  `lines_up: true`; the slice record's `status` is `realized`; every other slice-record field
  is semantically unchanged.
- S5 — (release manager, not yet lined up) Given a lens is missing or a cross-reference dangles,
  when /run completes, then the run lens is still written, the gaps are reported, and the slice
  is not stamped. Measure: `check_lines_up.py` reports `lines_up: false` with the missing lens
  or dangling reference named; `run.yaml` exists; the slice record's `status` is unchanged from
  before the run.
- S6 — (product owner, re-run) Given /run already ran on the slice, when it runs again, then it
  re-derives the run lens and changes nothing else; existing decisions are superseded, not
  edited; an idempotent re-run that still lines up leaves the stamp `realized`. Measure: only
  the slice's `run.yaml` (and possibly a new decision) differ; the other lenses, the ICE, the
  profile, and the slice's composition are byte-identical; no accepted decision file is edited
  in place.
- S7 — (reviewer, the checkpoint) Given the lens is ready, when the checkpoint is shown, then it
  presents the proposed run lens (the six blocks), the KB groundings, the lines-up result, and
  whether it will stamp, before any write. Measure: the checkpoint shows the run blocks, the
  groundings, and the lines-up verdict inline; no product-model file is written before approval.

### Recovery (one per failure condition)

- REC1 (F1) — trigger: the slice is absent, a functionality's ICE does not resolve or is not
  rich, the profile is not firmed, or the architecture lens is missing. direction: halt and
  route to /shape (to shape the slice), /understand (to enrich + firm), or /arch (to write the
  architecture lens) before /run runs. handoff: human.
- REC2 (F2) — trigger: a write touched something beyond this slice's run lens, a decision, or
  the slice `status` stamp. direction: revert the out-of-scope write; /run writes only the run
  lens, decisions, and (on lines-up) the slice `status`. handoff: autonomous.
- REC3 (F3) — trigger: the run lens carries content outside the six blocks or the wrong shape.
  direction: strip it back to the environments/rollout/migrations/config_secrets/cicd/targets
  shape; move any architecture/ux/quality content out of the run lens. handoff: autonomous.
- REC4 (F4) — trigger: an invented operational choice with no KB learning and no recorded
  proposal. direction: re-tie the choice to a best-fit KB learning on the architecture or
  technology shelf, or raise a KB-learning-gap proposal (a candidate architecture/technology
  learning) for the gap; never keep an ungrounded choice. handoff: autonomous.
- REC5 (F5) — trigger: /run read another lens (quality/ux/agentic), or a target binds to no
  declared architecture component. direction: remove the cross-lens dependency (run derives
  from the hub + the architecture lens + the KB only); re-tie the dangling target to a real
  architecture component or drop it. handoff: autonomous.
- REC6 (F6) — trigger: an over- or under-specified run lens — a missing block, a component with
  no target, or build-level detail smeared in. direction: complete the missing block or target,
  or trim the over-specification back to the operational shape. handoff: autonomous.
- REC7 (F7) — trigger: a material run choice with no decision recorded. direction: record the
  slice-level decision (rollout strategy, migration strategy, or environment topology) before
  persisting. handoff: autonomous.
- REC8 (F8) — trigger: the slice was stamped `realized` though a lens was missing or a
  cross-reference dangled. direction: revert the stamp; the slice is stamped only when
  `check_lines_up.py` reports lines_up; report the missing lens / dangling reference and route
  to the lens that closes it. handoff: autonomous.
- REC9 (F9) — trigger: the stamp changed more than `status`/metadata, or the slice's
  composition changed. direction: restore the slice record's composition, re-apply only the
  `status` stamp, after a human confirms the restore. handoff: human.
- REC10 (F10) — trigger: a non-allowed file changed, an accepted decision was edited in place,
  or something was removed. direction: restore it and re-apply only the run lens (and the new
  decision, and the stamp on lines-up), after a human confirms the restore. handoff: human.
- REC11 (F11) — trigger: the run lens or a decision fails v1 schema validation, or the slice
  record fails slice v1 after the stamp. direction: re-emit the failing artifact to conform
  before the play completes. handoff: autonomous.
- REC12 (F12) — trigger: the run lens or the stamp was persisted before the checkpoint was
  approved. direction: revert the premature write and re-present the checkpoint; persist only
  after the human approves. handoff: human.
