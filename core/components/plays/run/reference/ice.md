# run — ICE source

The clean ICE triple this play is compiled from. Update this and recompile via
play-editor; never hand-edit the compiled SKILL.md.

## Intent

Given one shaped **slice** — a vertical product increment from /shape, the thing you actually
deliver — write or extend its **run lens**: the narrative grounding doc `run.md` AND the
machine-readable per-environment definition `run.yaml`. The slice is the unit of realization; a
slice has no ICE of its own — its **hub** is the union of its functionalities' grounding docs
(`functionality.md`, which may span several capabilities) plus the product profile (read from the
spine).

The run lens has two parts. The **slice-level operational design** — rollout (how it goes live and
rolls back), migrations (data/schema moves, or "none" with the reason), and CI/CD (how it is built,
tested, shipped, and what the build gates on) — is written **once** and carried forward. The
**environments** are built **one per call, incrementally**: each call resolves a **target
environment** (the lowest not-yet-defined tier by default — 0 local, 1 dev, up to 4 prod — or a
named one) and defines or edits **exactly that one**, preserving every environment already defined.
A **local** environment is the lightweight bring-up /launch uses for human testing; a **cloud**
environment carries real infrastructure — provider, region, per-component compute, managed services,
networking and firewalls, and security (identity, secrets, controls) plus the deploy command — the
definition /deploy executes against. Config & secrets are per environment; secrets are bound via a
secrets manager, never written into the repo.

The run plan flows from what the slice does (the hub) and how it is built — so /run also reads the
slice's **architecture lens** (its components and stack), and only the architecture lens among the
realize lenses; a cloud environment's compute and services map to architecture-lens components. Every
operational choice is grounded, never invented; any material choice is recorded as a decision. `run.md`
(narrative) and `run.yaml` (facts) describe the same environments with the same facts — they stay in
step. /run writes only this slice's `run.md` and `run.yaml` (and any decision) — never the spine, the
slice record, the profile, another lens, or another slice. Critically, /run does NOT stamp the slice
`realized` — that belongs to /measure (the deliver pipe, which runs last). One slice per run; one human
checkpoint before anything persists. The lens is gated by the structural linter (the `run.md` template
AND the `run.yaml` schema) and the content-quality eval (a judge over `run.md`).

Pipeline position: **end**. /run is the END of the NON-FUNCTIONAL realize pipe (architecture →
quality → run): it expects to run on the branch /arch already started, injects no `start-change`
head, and injects the close sequence (commit-change → propose-change → review-change → merge-change)
that commits the non-functional pipe's lenses, opens the PR, takes the verdict, and merges to main.
It writes the persistent product model directly (the slice's run lens), on the already-started
branch, and reads the hub + the architecture lens — never another lens, and it never stamps the slice
realized. Because environments are incremental, /run is expected to run more than once per slice — once
per environment — each a small model-only change riding the same end sequence. (#437; 3-pipe realize
2026-06-25; per-environment reshape #434)

### Constraints

- C1 — One slice per run, and only a ready one: the slice exists (shaped by /shape), every
  functionality it bundles resolves through the spine to a `functionality.md` grounding doc, the
  product profile is firmed (`set`), and the slice's `architecture.md` lens exists. If not, halt —
  /run realizes a shaped, architected slice; it does not shape or architect one.
- C2 — Writes only this slice's `run.md` and `run.yaml` (and any decision), in the slice's lens
  folder. Never the spine, the slice record, the profile, another lens, the node tree, personas,
  journeys, or other slices.
- C3 — Shape & schema: `run.md` conforms to the Run lens template — the sections Environments /
  Rollout / Migrations / Config & secrets / CI/CD — and `run.yaml` conforms to the run lens schema
  (slice-level design + an ordered `environments` list, each a full local or cloud definition). Both
  validators pass.
- C4 — Content quality: `run.md` clears the content-quality eval, not just the linter — each section
  is self-explaining and the doc passes the stranger test.
- C5 — Grounded, not invented: every operational choice traces to the hub (a functionality), the
  profile, or the architecture lens; a cloud environment's compute and services map to real
  architecture-lens components (no dangling target); any material choice is recorded as a decision.
- C6 — Coverage: every functionality the slice bundles is considered by the run plan — nothing shaped
  is left unaccounted for in how the slice ships.
- C7 — Reads the hub + the architecture lens only: /run derives from the slice's functionalities'
  grounding docs, the profile, and `architecture.md` — never from another realize lens
  (ux/agentic/quality/measure/marketing).
- C8 — Never stamps realized: /run authors its run lens and closes the non-functional pipe; it never
  writes the slice's `status: realized` — that is /measure's job (the deliver pipe, last).
- C9 — One environment per call, additive and non-destructive: /run defines or edits exactly the one
  resolved target environment and preserves every environment already defined; it never defines more
  than one environment in a call, nor drops or silently edits a previously-defined one. The
  slice-level design is written once and carried forward unchanged unless the target environment
  forces a change (recorded as a decision). Re-running re-derives the lens; accepted decisions are
  superseded, never edited in place. The spine, the slice record, the profile, the other lenses, and
  the other slices stay byte-unchanged.
- C10 — Exactly one human checkpoint, presenting the target environment's definition plus the
  slice-level design and any decision, before anything is written. Nothing persists before approval.
  The checkpoint is a config switch per `standards/rules/gate-config.md` (class: standard, unpinned):
  the agent never skips it on its own judgment; a config-resolved skip is recorded in the evidence,
  never silent (#466 Batch C).
- C11 — Two artifacts in step: `run.yaml` (the machine-readable facts) and `run.md` (the narrative)
  describe the same environments with the same facts — same names, tiers, providers, and postures.
- C12 — Secrets never in the repo: every environment's secrets are bound via a secrets manager; no
  secret value is written into `run.yaml`, `run.md`, or the repo.
- C13 — The play ends by proving its Done means at close (gated, #464): the drafted `run.md` AND the
  machine-readable environment definition `run.yaml` exist, and the verify step's captured record
  confirms the approved lens was applied surgically (status untouched — no realized stamp). A run
  that never applied — checkpoint cancelled, validation failed — closes HALTED, never COMPLETED
  with the stop-condition verdict unmet.

### Failure conditions

- F1 — /run ran on an unready slice — the slice is absent, a functionality does not resolve to a
  grounding doc, the profile is not firmed, or the architecture lens is missing.
- F2 — A write touched something other than this slice's `run.md`, `run.yaml`, or a decision (the
  spine, the slice record, the profile, another lens, structure, a persona, a journey, or another
  slice).
- F3 — `run.md` fails its template/shape (a missing or extra section, an empty or telegraphic
  section) or carries content outside the five run sections, OR `run.yaml` fails the run lens schema.
- F4 — `run.md` fails the content-quality eval.
- F5 — An operational choice is invented — with no hub, profile, or architecture source behind it — a
  cloud environment's compute or service references a component not in the architecture lens, or a
  material choice has no recorded decision.
- F6 — A functionality of the slice is left unaccounted for in the run plan.
- F7 — /run read or depended on a realize lens other than architecture.
- F8 — /run stamped the slice `realized` (or otherwise wrote the slice's status) — that belongs to
  /measure.
- F9 — A previously-defined environment was dropped or silently edited, or more than one environment
  was defined in a single call.
- F10 — `run.yaml` and `run.md` disagree — a different set of environments, or different facts for the
  same environment.
- F11 — A product-model file other than this slice's `run.md` / `run.yaml` or a new decision changed,
  or an accepted decision was edited in place rather than superseded.
- F12 — The lens was persisted before the human approved the checkpoint.
- F13 — A secret value was written into `run.yaml`, `run.md`, or the repo instead of bound via a
  secrets manager.
- F14 — The run closed COMPLETED without the Done means held — a missing `run.md` or `run.yaml`
  draft, or no captured verify record proving the approved lens was applied.

## Expectation

### Success scenarios

- S1 — (devops engineer, first environment) Given a shaped, architected slice whose functionalities
  resolve and a firmed profile, when /run runs for the first time — no environment yet defined — the
  target resolves to the lowest tier (local), and on approval `run.yaml` is written with the
  slice-level design plus the local environment, and `run.md` narrates it; both clear their
  validators; nothing else changes. Measure: `slices/{slice}/lens/run.yaml` and `run.md` exist and are
  valid; the local environment is present at tier 0; the content-eval gate passes; the spine, slice
  record, profile, and other lenses are byte-identical.
- S2 — (devops engineer, next environment) Given the local environment is already defined, when /run
  runs again with target `dev`, then the dev cloud environment is added to `run.yaml` — provider,
  region, per-component compute, managed services, firewalls, security, and deploy command — the local
  environment is preserved unchanged, and `run.md` grows a dev entry. Measure: `run.yaml` now holds both
  environments in tier order; the local entry is byte-identical to before; the dev entry is a complete
  cloud definition; `run.md` and `run.yaml` agree.
- S3 — (architect, grounded run) Given the lens is drafted, every operational choice traces to the
  hub, the profile, or the architecture lens, and every cloud compute/service maps to an
  architecture-lens component; any material choice traces to a recorded decision. Measure: the manifest
  names a real source for every choice; every cloud compute/service names a real architecture component;
  material choices name a decision that resolves.
- S4 — (reviewer, architecture-driven) Given /run runs, it read the architecture lens and no other
  realize lens, and the run plan flows from the architecture's stack and components. Measure: the run
  grounds include the architecture lens; no other lens is read or grounded on.
- S5 — (release manager, no premature realize) Given /run completes, the slice's `status` is unchanged
  — /run never stamps `realized`. Measure: the slice record's `status` (and the spine slice entry's
  status) is byte-identical before and after /run.
- S6 — (product owner, re-run same environment) Given /run already defined an environment, when it runs
  again for that same environment, it re-derives that environment and changes nothing else; any new
  decision supersedes, none edited in place; other environments are untouched. Measure: only the
  target environment's facts (and possibly a new decision) differ; every other environment, the spine,
  slice record, other lenses, and profile are byte-identical.
- S7 — (security reviewer, no secrets in repo) Given a cloud environment is defined, its secrets are
  bound via a secrets manager and no secret value appears in `run.yaml`, `run.md`, or the repo.
  Measure: the security block names a secrets-manager binding; no secret literal is present.
- S8 — (reviewer, the checkpoint) Given the lens is ready, the checkpoint presents the target
  environment's definition plus the slice-level design and any decision, before any write. Measure: the
  checkpoint shows the lens inline; no product-model file is written before approval.

### Done means

Paths are relative to the run's working root (`{stm_base}_realize/run/`). The draft dir holds the
authored lens bundle — the slice's `run.md` (the narrative) AND `run.yaml` (the machine-readable
per-environment definition) under its lens path; `run-checks.json` is the verify step's captured
`check_run.py` output — the play always captures it, and its `ok` field is the mechanical proof
that the approved lens was applied surgically (only this slice's `run.md` and `run.yaml` and new
decisions changed; the spine — and with it the slice's status — byte-identical, no realized stamp).

- D1 — says: "the run narrative draft exists (run.md)"
  check: { type: artifact_exists, path: "draft/product-os/*/slices/*/lens/run.md" }
- D2 — says: "the machine-readable environment definition exists (run.yaml)"
  check: { type: artifact_exists, path: "draft/product-os/*/slices/*/lens/run.yaml" }
- D3 — says: "the approved lens was applied and verified surgical (status untouched)"
  check: { type: field_equals, file: "run-checks.json", field: "ok", equals: true }

### Recovery (one per failure condition)

- REC1 (F1) — trigger: the slice is absent, a functionality does not resolve, the profile is not
  firmed, or the architecture lens is missing. direction: halt and route to /shape, /understand, or
  /arch before /run runs. handoff: human.
- REC2 (F2) — trigger: a write touched something beyond this slice's `run.md`, `run.yaml`, or a
  decision. direction: revert the out-of-scope write; /run writes only the slice's `run.md`, `run.yaml`,
  and any decision. handoff: autonomous.
- REC3 (F3) — trigger: `run.md` fails the template/shape or carries out-of-scope content, or `run.yaml`
  fails the schema. direction: re-emit the failing artifact to its contract — the five run sections for
  `run.md`, the run lens schema for `run.yaml`. handoff: autonomous.
- REC4 (F4) — trigger: `run.md` fails the content-quality eval. direction: rewrite the failing section
  to the judge's cited fixes and re-judge until the gate passes. handoff: autonomous.
- REC5 (F5) — trigger: an invented operational choice, a cloud compute/service referencing a non-arch
  component, or a material choice with no decision. direction: re-tie each choice to the hub, the
  profile, or the architecture (a cloud compute/service to a real component), and record the material
  decision. handoff: autonomous.
- REC6 (F6) — trigger: a functionality was left unaccounted for. direction: extend the run plan to
  account for the missing functionality. handoff: autonomous.
- REC7 (F7) — trigger: /run read or depended on a lens other than architecture. direction: remove the
  dependency; /run reads only the hub + the architecture lens. handoff: autonomous.
- REC8 (F8) — trigger: /run stamped the slice realized or wrote its status. direction: revert the
  status write; the `realized` stamp belongs to /measure. handoff: autonomous.
- REC9 (F9) — trigger: a previously-defined environment was dropped or silently edited, or more than
  one environment was defined in a call. direction: restore the untouched environments from the prior
  `run.yaml` and re-derive only the single target environment. handoff: autonomous.
- REC10 (F10) — trigger: `run.yaml` and `run.md` disagree. direction: re-emit both from one source of
  truth so the environments and facts match. handoff: autonomous.
- REC11 (F11) — trigger: a non-lens/non-decision file changed, or an accepted decision was edited in
  place. direction: restore it and re-apply only the `run.md` / `run.yaml` (and the new decision),
  after a human confirms the restore. handoff: human.
- REC12 (F12) — trigger: the lens was persisted before the checkpoint was approved. direction: revert
  the premature write and re-present the checkpoint; persist only after approval. handoff: human.
- REC13 (F13) — trigger: a secret value was written into the lens or the repo. direction: strip the
  secret, replace it with a secrets-manager binding, and re-verify no secret literal remains. handoff:
  autonomous.
- REC14 (F14) — trigger: the run is about to close COMPLETED with the Done means unmet. direction:
  close HALTED with `exit_reason: stop_condition_unmet` and the unmet clauses named; fix the state —
  re-run the verify capture, or complete the missing draft/apply step — and re-evaluate; the close
  stays HALTED until the verdict reads held. handoff: autonomous.
