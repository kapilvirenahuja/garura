# marketing — ICE source

The clean ICE triple this play is compiled from. Update this and recompile via
play-editor; never hand-edit the compiled SKILL.md.

## Intent

Given one shaped **slice** — a vertical product increment from /shape, the thing you actually
deliver — write its **marketing lens** as a grounding doc (`marketing.md`): how the slice is
found and reached, the accessibility bar it meets, and the reach signals worth capturing. The
slice is the unit of realization; a slice has no ICE of its own — its **hub** is the union of its
functionalities' grounding docs (`functionality.md`, which may span several capabilities) plus the
product profile (read from the spine). The lens is four things and only four: the **intent** (who
needs to find or reach this slice, and why), **discoverability** (SEO / AEO / GEO — search, answer
engines, generative engines — or why it is not applicable), **accessibility** (the bar — e.g. a
WCAG level — and how the slice meets it; this moved here from the profile), and **marketing
analytics** (the reach/conversion or internal-usage signals worth capturing). An internal tool
behind auth answers discoverability with "not applicable", plainly and with the reason — never an
invented public-marketing claim. The reach assessment is grounded in what the slice's
functionalities actually do; any material choice is recorded as a decision; the
discoverability/accessibility patterns are grounded in the KB or recorded as a KB-learning-gap
proposal. It writes only this slice's `marketing.md` (and any decision) — never the spine, the
slice record, the profile, another lens, or another slice. One slice per run; one human checkpoint
before anything is committed. The lens is gated by the structural linter (shape) and the
content-quality eval (a judge).

Pipeline position: **end**. /marketing is the END of the FUNCTIONAL realize pipe (ux → agentic →
marketing): it expects to run on the branch /ux already started, injects no `start-change` head, and
injects the close sequence (commit-change → propose-change → review-change → merge-change) that
commits the functional pipe's lenses, opens the PR, takes the verdict, and merges to main. It writes
the persistent product model **directly, in place** (the slice's marketing lens) on the
already-started branch, and reads the hub only — never another lens. There is no draft copy and no
apply/promote step; review is the branch git diff and the injected end PR. (#437; 3-pipe realize
2026-06-25; #498, ADR 026)

Write discipline (ADR 026, `standards/rules/direct-model-write.md`): the LLM authoring skill writes
ONLY the per-node lens doc (`marketing.md`) straight to the live model (a re-derive — it overwrites a
prior marketing lens for this slice); every shared-file mutation — the slice's `decisions/` — is done
by the deterministic keyed persist script, in place, keyed to the target slice so it cannot touch
another slice's decisions and never edits an accepted decision in place (add-only). The authoring
skill emits any material marketing decision as **structured data in its manifest** (a non-model STM
artifact); the keyed persist reads the manifest and writes the decision file. Because the LLM only
ever writes the one lens doc, containment is a post-write scoped guard over the full delta
(`scoped_write_guard.py`), not a draft. Clean tree in, committed delta out: the product-os tree is
asserted clean at entry, and after the approved checkpoint the play commits its own model delta on
the branch (a `feat(model)` commit distinct from the injected `commit-change`), so the working-tree
diff vs HEAD is exactly this run's delta and the injected end sequence carries a committed model
change.

### Constraints

- C1 — One slice per run, and only a ready one: the slice exists (shaped by /shape), every
  functionality it bundles resolves through the spine to a `functionality.md` grounding doc, and the
  product profile is firmed (`set`). If not, halt — /marketing realizes a shaped slice; it does not
  shape one.
- C2 — Containment split (ADR 026): the LLM authoring skill writes ONLY this slice's `marketing.md`
  straight to the live model; the keyed persist script writes any material decision — reading the
  authoring skill's manifest, keyed to the slice, add-only (it never edits an accepted decision in
  place). Between them the run writes only this slice's `marketing.md` and its `decisions/`. Never
  the spine, the slice record, the profile, another lens, the node tree, personas, journeys, or
  other slices.
- C3 — Shape: `marketing.md` conforms to the Marketing lens template — the sections Intent,
  Discoverability, Accessibility, and Marketing analytics — and the structural linter passes. No
  content outside those four.
- C4 — Content quality: `marketing.md` clears the content-quality eval, not just the linter — each
  section is self-explaining and the doc passes the stranger test.
- C5 — Grounded, not invented: the reach assessment traces to the behavior of the slice's
  functionalities and the profile; any material marketing choice is emitted as a decision in the
  authoring skill's manifest (and written by the keyed persist).
- C6 — Coverage: the marketing assessment considers every functionality the slice bundles — the
  reach view cannot ignore part of the slice. Nothing shaped is left unconsidered.
- C7 — Reads the hub only: /marketing derives from the slice's functionalities' grounding docs and
  the profile — never from another realize lens (quality/ux/agentic/architecture/run/measure).
- C8 — Honest reach: a slice that has no public surface (an internal tool behind auth) answers
  discoverability "not applicable" with the reason; public-marketing reach is never manufactured
  where the profile and functionalities don't warrant it.
- C9 — Accessibility lives here: the lens sets a concrete accessibility bar (e.g. a WCAG level) and
  how the slice meets it — this moved out of the profile into the marketing lens.
- C10 — Additive and non-destructive, enforced by the containment split and the post-write scoped
  guard: the LLM authoring skill writes only this slice's `marketing.md` (a re-derive), and the keyed
  persist adds decisions add-only (an accepted decision is superseded, never edited in place). After
  ALL writes and before the checkpoint, the bundled `scoped_write_guard.py` diffs the model tree
  against HEAD and FAILS the run (reverting the offending paths) if any model path changed outside the
  run's write scope — the slice's `marketing.md` is `--allow` (re-derive) and its `decisions/*.yaml`
  are `--add-only` (added, never modified). The spine, the slice record, the profile, the other
  lenses, and the other slices are byte-unchanged.
- C11 — Discoverability/accessibility patterns are KB-grounded: each material pattern traces to a
  best-fit learning on the KB (matched via kb-search) or to a recorded KB-learning-gap proposal —
  never the model's taste.
- C12 — Exactly one human checkpoint, presenting the intent, discoverability, accessibility, and
  analytics, plus any decision. The checkpoint is a **conditional gate** (#467; `gate-config.md`
  three kinds — /marketing is one of the eleven conditional document plays). Resolution order:
  pinned (n/a here) → `gates.plays` override → the learned policy (classify the working-tree change
  shape — the model tree's diff vs HEAD — with the bundled `classify_change.py`
  (`--product-base`/`--base-ref HEAD`); a shape in `gate-policy.yaml`'s `auto:` and not in
  `never_auto:`, with NO blocking finding — lint gap or content-eval fail — auto-passes with the skip
  and the diff summary recorded) → `gates.classes.standard` → `gates.default`. EVERY crossing appends
  one live-eval line via the bundled `gate_eval.py` (shape, predicted gate|auto, the human's real
  action approved_clean|approved_edited|rejected, or auto_pass). Write-then-review (ADR 026): the run
  writes the full delta to the live model FIRST (the lens by the authoring skill, any decision by the
  keyed persist), so the checkpoint presents the real model git diff and the change-shape is
  classified over the full delta; nothing is COMMITTED before the gate resolves — a typed approval, a
  recorded config skip, OR a recorded policy auto-pass. On cancel the whole model delta is reverted
  (`git restore` + `git clean` over the model paths via the guard `--restore` with an empty allow
  set). At close the play refreshes the learned policy with the bundled `distill_gate_policy.py`
  (config `gates.conditional`: streak/ledger/policy paths).
- C13 — The play ends by proving its Done means at close (gated, #464): the keyed persist record
  exists (`persist-manifest.json`) and stamps the write applied, and the scoped-write guard report
  reads ok (`guard-report.json` — the allowlist held). The play then commits its own model delta on
  the branch, and the injected end sequence raises/reviews/lands it. A close whose Done means does
  not hold reads HALTED, never COMPLETED — never prose claims.
- C14 — Clean tree in, committed delta out (ADR 026): the product-os tree is asserted clean at entry
  (a dirty model tree halts at pre-flight), so HEAD is a correct base for the scoped guard and the
  change-shape; and after the approved checkpoint the play commits its model delta on the branch
  (`feat(model): … (#<issue>)`). This model-delta commit is a lightweight persist step distinct from
  the injected `commit-change` (which then commits only what remains — STM evidence) and from the
  per-play Standard Play Close (evidence + delivery report) that /marketing still runs.

### Failure conditions

- F1 — /marketing ran on an unready slice — the slice is absent, a functionality does not resolve to
  a grounding doc, or the profile is not firmed.
- F2 — A model path outside the run's write scope changed (the scoped-write guard's report is not
  ok): something other than this slice's `marketing.md` or its `decisions/` was touched — the spine,
  the slice record, the profile, another lens, structure, a persona, a journey, or another slice.
- F3 — `marketing.md` fails its template/shape (a missing or extra section, an empty or telegraphic
  section), or carries content outside the four sections.
- F4 — `marketing.md` fails the content-quality eval.
- F5 — The reach assessment is invented — asserted with no behavior of the slice's functionalities or
  profile behind it, or a material choice with no decision emitted in the manifest.
- F6 — A functionality of the slice is left unconsidered by the marketing assessment.
- F7 — /marketing read or depended on another lens.
- F8 — Public-marketing reach was manufactured for a slice with no public surface (an internal tool
  claimed SEO/AEO/GEO it does not have).
- F9 — Accessibility was left to the profile or omitted, rather than set concretely in the lens.
- F10 — An accepted decision was edited in place rather than superseded (an add-only breach on the
  slice's `decisions/`).
- F11 — A discoverability/accessibility pattern rests on neither a matched KB learning nor a recorded
  proposal.
- F12 — The model delta was COMMITTED before the checkpoint gate resolved (no typed approval, no
  recorded config skip, and no recorded policy auto-pass), or a cancelled checkpoint left model writes
  on the working tree instead of reverting them.
- F13 — The run closed COMPLETED without the Done means held — no persist record, the persist not
  stamped applied, the scoped-write guard report not captured or not ok, or the model delta not
  committed.
- F14 — A conditional-gate crossing left no live-eval ledger line, or an auto-pass fired for a
  shape the policy does not list as auto (or that carried a blocking finding).
- F15 — The play ran against a dirty product-os tree (uncommitted model edits present at entry), so
  the change-shape and the scoped guard could not be trusted to reflect only this run's delta.

## Expectation

### Success scenarios

- S1 — (growth lead, first run) Given a shaped slice whose functionalities resolve and a firmed
  profile, when /marketing runs and the checkpoint is approved, then `marketing.md` is written in
  place on the live model as the intent, discoverability, accessibility, and analytics — passing the
  linter and the content eval — and nothing else changes. Measure: the live
  `slices/{slice}/lens/marketing.md` exists and is a valid Marketing Lens doc; the content-eval gate
  passes; the scoped-write guard report reads `ok`, so the spine, slice record, profile, and other
  lenses are byte-identical; the stop-condition verdict reads held.
- S2 — (product owner, the honest reach) Given an internal tool behind auth, when /marketing runs,
  discoverability reads "not applicable" with the reason rather than an invented SEO/AEO/GEO claim.
  Measure: the manifest's `discoverability` is `not-applicable`; `marketing.md` states why.
- S3 — (accessibility reviewer) Given the lens is written, accessibility names a concrete bar and how
  the slice meets it. Measure: the manifest's `accessibility` names a standard; `marketing.md`'s
  Accessibility section states the bar and the means.
- S4 — (architect, hub-only) Given /marketing runs, it read no other realize lens and wrote none.
  Measure: no other lens of the slice is touched (the scoped-guard report confirms it); the
  assessment grounds on no lens.
- S5 — (product owner, re-run) Given /marketing already ran, when it runs again, it re-derives
  `marketing.md` and changes nothing else; any new decision supersedes, none edited in place.
  Measure: the scoped-guard report reads `ok` with only the slice's `marketing.md` re-derived and any
  new decision added; the spine, slice record, other lenses, and profile are byte-identical.
- S6 — (reviewer, the checkpoint) Given the lens is ready, the checkpoint presents the intent,
  discoverability, accessibility, and analytics, plus any decision, inline over the real model git
  diff, before any commit. Measure: the checkpoint shows the lens inline; no product-model change is
  COMMITTED before approval, and on cancel the working tree returns byte-clean to HEAD — or, on the
  auto-pass path, the change shape is policy-listed and a recorded auto-pass + live-eval ledger line
  + diff summary exist, with no wait.

### Done means

Paths are relative to the run's working root (`{stm_base}_realize/marketing/`).
`persist-manifest.json` is the record the keyed persist script writes after the approved checkpoint
(its contract: `applied`, `written`, `skipped`, `changed`) — the material decisions written in place
on the live model, keyed to the slice; `guard-report.json` is the captured `scoped_write_guard.py`
output — the play always writes it, and its `ok` field is the mechanical proof that no model path
changed outside the slice's write scope (the allowlist held, so the lens landed and nothing else
did). The lens doc itself is written straight to the live model by the authoring skill and cleared
by the content-quality eval before the gate.

- D1 — says: "the persist record exists — the material decisions were written in place on the live
  model (and the lens was re-derived within the guarded scope)"
  check: { type: artifact_exists, path: "persist-manifest.json" }
- D2 — says: "the persist was applied — the persist record stamps the write applied"
  check: { type: field_equals, file: "persist-manifest.json", field: "applied", equals: true }
- D3 — says: "the scoped-write guard held — no model path changed outside the slice's write scope
  (the allowlist held)"
  check: { type: field_equals, file: "guard-report.json", field: "ok", equals: true }

### Recovery (one per failure condition)

- REC1 (F1) — trigger: the slice is absent, a functionality does not resolve, or the profile is not
  firmed. direction: halt and route to /shape (shape the slice) or /understand (detail + firm) before
  /marketing runs. handoff: human.
- REC2 (F2) — trigger: a model path outside the run's write scope changed (the scoped-guard report is
  not ok). direction: the guard's `--restore` already reverted the offending paths; re-run writing
  only the slice's `marketing.md` and any decision, after a human confirms the restore. handoff:
  human.
- REC3 (F3) — trigger: `marketing.md` fails the template/shape or carries out-of-scope content.
  direction: re-emit the doc to the Marketing lens template — the four sections only. handoff:
  autonomous.
- REC4 (F4) — trigger: `marketing.md` fails the content-quality eval. direction: rewrite the failing
  section to the judge's cited fixes and re-judge until the gate passes. handoff: autonomous.
- REC5 (F5) — trigger: an invented reach assessment, or a material choice with no decision. direction:
  re-tie the assessment to the functionalities and the profile, and emit the marketing decision in the
  manifest. handoff: autonomous.
- REC6 (F6) — trigger: a functionality was not considered. direction: extend the assessment to consider
  the missing functionality. handoff: autonomous.
- REC7 (F7) — trigger: /marketing read or depended on another lens. direction: remove the dependency;
  /marketing derives only from the slice's hub. handoff: autonomous.
- REC8 (F8) — trigger: public-marketing reach was manufactured for a slice with no public surface.
  direction: reset discoverability to the honest answer ("not applicable" with the reason for an
  internal tool). handoff: autonomous.
- REC9 (F9) — trigger: accessibility was deferred to the profile or omitted. direction: set the concrete
  accessibility bar and the means in the lens. handoff: autonomous.
- REC10 (F10) — trigger: an accepted decision was edited in place rather than superseded. direction:
  restore the decision to its accepted content and record the change as a new superseding decision, after
  a human confirms the restore. handoff: human.
- REC11 (F11) — trigger: a discoverability/accessibility pattern with no KB learning and no recorded
  proposal. direction: search the KB via kb-search for the best-fit learning and ground the choice, or
  raise a KB-learning-gap proposal; never keep a taste-only choice. handoff: autonomous.
- REC12 (F12) — trigger: the model delta was committed before the checkpoint resolved, or a cancelled
  checkpoint left writes on the working tree. direction: revert the premature commit and the
  working-tree writes (guard `--restore`, empty allow set) and re-present the checkpoint; commit only
  after the gate resolves (approval, a recorded config skip, or a recorded policy auto-pass). handoff:
  human.
- REC13 (F13) — trigger: the run is about to close COMPLETED with the Done means unmet (no persist
  record, the persist not stamped applied, the scoped-guard report not captured or not ok, or the model
  delta not committed). direction: close HALTED with `exit_reason: stop_condition_unmet` and the unmet
  clauses named; fix the state — re-run the keyed persist, re-capture the scoped-guard report, or make
  the model-delta commit — and re-evaluate; the close stays HALTED until the verdict reads held.
  handoff: autonomous.
- REC14 (F14) — trigger: a conditional-gate crossing left no live-eval ledger line, or an
  auto-pass fired for a shape the policy does not list as auto (or with a blocking finding).
  direction: re-append the missing ledger line via `gate_eval.py`; when the auto-pass was
  unearned, revert any premature commit and re-run the gate as a live wait. handoff: autonomous.
- REC15 (F15) — trigger: the product-os tree is dirty at entry (uncommitted model edits present).
  direction: halt at pre-flight and ask for a clean model tree — commit or revert the pending model
  edits (or run the prior functional-pipe play to its persist) — before /marketing proceeds. handoff:
  human.
