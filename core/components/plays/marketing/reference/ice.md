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
before anything persists. The lens is gated by the structural linter (shape) and the
content-quality eval (a judge).

Pipeline position: **end**. /marketing is the END of the FUNCTIONAL realize pipe (ux → agentic →
marketing): it expects to run on the branch /ux already started, injects no `start-change` head, and
injects the close sequence (commit-change → propose-change → review-change → merge-change) that
commits the functional pipe's lenses, opens the PR, takes the verdict, and merges to main. It writes
the persistent product model directly (the slice's marketing lens), on the already-started branch,
and reads the hub only — never another lens. (#437; 3-pipe realize 2026-06-25)

### Constraints

- C1 — One slice per run, and only a ready one: the slice exists (shaped by /shape), every
  functionality it bundles resolves through the spine to a `functionality.md` grounding doc, and the
  product profile is firmed (`set`). If not, halt — /marketing realizes a shaped slice; it does not
  shape one.
- C2 — Writes only this slice's `marketing.md` (and any decision), in the slice's lens folder. Never
  the spine, the slice record, the profile, another lens, the node tree, personas, journeys, or
  other slices.
- C3 — Shape: `marketing.md` conforms to the Marketing lens template — the sections Intent,
  Discoverability, Accessibility, and Marketing analytics — and the structural linter passes. No
  content outside those four.
- C4 — Content quality: `marketing.md` clears the content-quality eval, not just the linter — each
  section is self-explaining and the doc passes the stranger test.
- C5 — Grounded, not invented: the reach assessment traces to the behavior of the slice's
  functionalities and the profile; any material marketing choice is recorded as a decision. (Tracked
  in the manifest.)
- C6 — Coverage: the marketing assessment considers every functionality the slice bundles — the
  reach view cannot ignore part of the slice. Nothing shaped is left unconsidered.
- C7 — Reads the hub only: /marketing derives from the slice's functionalities' grounding docs and
  the profile — never from another realize lens (quality/ux/agentic/architecture/run/measure).
- C8 — Honest reach: a slice that has no public surface (an internal tool behind auth) answers
  discoverability "not applicable" with the reason; public-marketing reach is never manufactured
  where the profile and functionalities don't warrant it.
- C9 — Accessibility lives here: the lens sets a concrete accessibility bar (e.g. a WCAG level) and
  how the slice meets it — this moved out of the profile into the marketing lens.
- C10 — Additive and non-destructive: the run changes only this slice's `marketing.md` (and any new
  decision); the spine, the slice record, the profile, the other lenses, and the other slices are
  byte-unchanged. Re-running re-derives the lens; accepted decisions are superseded, never edited in
  place.
- C11 — Discoverability/accessibility patterns are KB-grounded: each material pattern traces to a
  best-fit learning on the KB (matched via kb-search) or to a recorded KB-learning-gap proposal —
  never the model's taste.
- C12 — Exactly one human checkpoint, presenting the intent, discoverability, accessibility, and
  analytics, plus any decision, before anything is written. Nothing persists before approval.

### Failure conditions

- F1 — /marketing ran on an unready slice — the slice is absent, a functionality does not resolve to
  a grounding doc, or the profile is not firmed.
- F2 — A write touched something other than this slice's `marketing.md` or a decision (the spine, the
  slice record, the profile, another lens, structure, a persona, a journey, or another slice).
- F3 — `marketing.md` fails its template/shape (a missing or extra section, an empty or telegraphic
  section), or carries content outside the four sections.
- F4 — `marketing.md` fails the content-quality eval.
- F5 — The reach assessment is invented — asserted with no behavior of the slice's functionalities or
  profile behind it, or a material choice with no recorded decision.
- F6 — A functionality of the slice is left unconsidered by the marketing assessment.
- F7 — /marketing read or depended on another lens.
- F8 — Public-marketing reach was manufactured for a slice with no public surface (an internal tool
  claimed SEO/AEO/GEO it does not have).
- F9 — Accessibility was left to the profile or omitted, rather than set concretely in the lens.
- F10 — A product-model file other than this slice's `marketing.md` or a new decision changed, or an
  accepted decision was edited in place rather than superseded.
- F11 — A discoverability/accessibility pattern rests on neither a matched KB learning nor a recorded
  proposal.
- F12 — The lens was persisted before the human approved the checkpoint.

## Expectation

### Success scenarios

- S1 — (growth lead, first run) Given a shaped slice whose functionalities resolve and a firmed
  profile, when /marketing runs and the checkpoint is approved, then `marketing.md` is written as the
  intent, discoverability, accessibility, and analytics — passing the linter and the content eval —
  and nothing else changes. Measure: `slices/{slice}/lens/marketing.md` exists and is a valid
  Marketing Lens doc; the content-eval gate passes; the spine, slice record, profile, and other
  lenses are byte-identical.
- S2 — (product owner, the honest reach) Given an internal tool behind auth, when /marketing runs,
  discoverability reads "not applicable" with the reason rather than an invented SEO/AEO/GEO claim.
  Measure: the manifest's `discoverability` is `not-applicable`; `marketing.md` states why.
- S3 — (accessibility reviewer) Given the lens is drafted, accessibility names a concrete bar and how
  the slice meets it. Measure: the manifest's `accessibility` names a standard; `marketing.md`'s
  Accessibility section states the bar and the means.
- S4 — (architect, hub-only) Given /marketing runs, it read no other realize lens and wrote none.
  Measure: no other lens of the slice is touched; the assessment grounds on no lens.
- S5 — (product owner, re-run) Given /marketing already ran, when it runs again, it re-derives
  `marketing.md` and changes nothing else; any new decision supersedes, none edited in place.
  Measure: only the slice's `marketing.md` (and possibly a new decision) differ; the spine, slice
  record, other lenses, and profile are byte-identical.
- S6 — (reviewer, the checkpoint) Given the lens is ready, the checkpoint presents the intent,
  discoverability, accessibility, and analytics, plus any decision, before any write. Measure: the
  checkpoint shows the lens inline; no product-model file is written before approval.

### Recovery (one per failure condition)

- REC1 (F1) — trigger: the slice is absent, a functionality does not resolve, or the profile is not
  firmed. direction: halt and route to /shape (shape the slice) or /understand (detail + firm) before
  /marketing runs. handoff: human.
- REC2 (F2) — trigger: a write touched something beyond this slice's `marketing.md` or a decision.
  direction: revert the out-of-scope write; /marketing writes only the slice's `marketing.md` (and
  any decision). handoff: autonomous.
- REC3 (F3) — trigger: `marketing.md` fails the template/shape or carries out-of-scope content.
  direction: re-emit the doc to the Marketing lens template — the four sections only. handoff:
  autonomous.
- REC4 (F4) — trigger: `marketing.md` fails the content-quality eval. direction: rewrite the failing
  section to the judge's cited fixes and re-judge until the gate passes. handoff: autonomous.
- REC5 (F5) — trigger: an invented reach assessment, or a material choice with no decision. direction:
  re-tie the assessment to the functionalities and the profile, and record the marketing decision.
  handoff: autonomous.
- REC6 (F6) — trigger: a functionality was not considered. direction: extend the assessment to consider
  the missing functionality. handoff: autonomous.
- REC7 (F7) — trigger: /marketing read or depended on another lens. direction: remove the dependency;
  /marketing derives only from the slice's hub. handoff: autonomous.
- REC8 (F8) — trigger: public-marketing reach was manufactured for a slice with no public surface.
  direction: reset discoverability to the honest answer ("not applicable" with the reason for an
  internal tool). handoff: autonomous.
- REC9 (F9) — trigger: accessibility was deferred to the profile or omitted. direction: set the concrete
  accessibility bar and the means in the lens. handoff: autonomous.
- REC10 (F10) — trigger: a non-lens/non-decision file changed, or an accepted decision was edited in
  place. direction: restore it and re-apply only the `marketing.md` (and the new decision), after a
  human confirms the restore. handoff: human.
- REC11 (F11) — trigger: a discoverability/accessibility pattern with no KB learning and no recorded
  proposal. direction: search the KB via kb-search for the best-fit learning and ground the choice, or
  raise a KB-learning-gap proposal; never keep a taste-only choice. handoff: autonomous.
- REC12 (F12) — trigger: the lens was persisted before the checkpoint was approved. direction: revert
  the premature write and re-present the checkpoint; persist only after approval. handoff: human.
