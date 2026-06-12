# measure — ICE source

The clean ICE triple this play is compiled from. Update this and recompile via
play-creator; never hand-edit the compiled SKILL.md.

## Intent

Given one shaped **slice** — a vertical product increment from /shape — whose **lens trinity
(quality, ux, agentic) and architecture lens are already written**, realize its **measure
lens**: the delivery-measurement claims for building it — the benefits the TEAM gets while
delivering this slice, which delivery metrics it improves or holds. A slice has no ICE of its
own — its hub is the union of its functionalities' ICE (which may span several capabilities)
plus the product profile. /measure is a **foundation** lens (arch → measure → run).

Every claimed metric is a provable **claim**: a baseline (where we stand today — a sourced
number, or explicitly "unmeasured", never invented), a target with a horizon (where delivering
this slice takes us, and when that is checkable), and a proof source — where the number will be
read. The proof sources are the seam to the alignment pipeline: /capture later harvests exactly
the signals the measure lens declared, and nothing else; an undeclared signal is unprovable.

The **triangle is the primary frame** — speed (pipes close fast), tokens (the fuel cost; less
is better), cognition (the human's time: directing is fine, adjusting is the leak) — the right
spend of tokens and cognition for maximum speed. Industry frames (DORA, Flow, SPACE, DX) are
**derived translations** of triangle data for the outside world, never parallel first-class
claims with their own bookkeeping. Delivery measurement only: product outcomes (usage, revenue,
adoption) belong to the strategy layer, never this lens.

Per the trinity read rule, /measure reads the slice's hub **plus the three lens-trinity files**
(quality — its deterministic gates are proof sources; ux — the surface weight; agentic — the
offload weights that price cognition) and **never** the architecture or run lens. Every claim
and every out-of-scope call is **grounded in the knowledge base, never invented**: the metric
set, the target heuristics, and the proof sources trace to the KB's delivery-measurement
learnings (matched via the kb-search interface) or to a recorded KB-learning-gap proposal.

It writes only this slice's measure lens and nothing else — never the slice record (the
`realized` stamp stays /run's duty), the functionalities' ICE, the profile, another lens, or
other slices. One slice per run; one human checkpoint before anything persists, and what
persists is exactly what was approved.

Pipeline position: **none**. /measure is a MIDDLE play of the foundation pipeline (arch →
measure → run): it expects to run on the branch the foundation pipeline already started,
injects no head and no close, stops after the verified persist, and leaves the branch as-is
for /run to close. It runs after /arch (foundation order) and before /run (whose lines-up gate
must see the measure lens). It writes the persistent product model directly, on the
already-started branch. (#437, decision 24)

### Constraints

- C1 — One slice per run; the play writes only that slice's measure lens, never the slice
  record, another lens, another slice, the functionalities' ICE, the profile, or the hub.
- C2 — Foundation read rule: the play reads the slice's hub and the three lens-trinity files
  (quality, ux, agentic); it never reads or derives content from the architecture or run lens.
- C3 — Every claimed metric is a complete claim: a baseline (a sourced number or explicitly
  "unmeasured" — never invented), a target with a horizon, and a proof source.
- C4 — The triangle (speed, tokens, cognition) is the primary frame; industry frames are
  derived translations, never parallel first-class claims.
- C5 — Every claim and every out-of-scope call grounds in a knowledge-base learning or a
  recorded gap proposal — never taste.
- C6 — Every declared proof source must be producible by the delivery pipes — it is the
  contract /capture later harvests; an unproducible proof is a gap, not a claim.
- C7 — Delivery measurement only; product outcomes are out of scope (they belong to strategy).
- C8 — The lens persists only after explicit human approval at a checkpoint; drafting never
  touches the live model, and what persists is exactly what was approved.
- C9 — Foundation order: the play runs only on a slice whose lens trinity AND architecture
  lens already exist (arch → measure → run), though it reads only the trinity.
- C10 — Pipeline position: a foundation middle — it expects an already-started branch, does
  its work, stops, and leaves the branch for the next play.

### Failure conditions

- F1 — The lens persists without human approval, or differs from the approved draft.
- F2 — A claim is incomplete or carries an invented/flattering baseline.
- F3 — A claim or out-of-scope call has no grounding (no learning, no proposal).
- F4 — An industry-framework metric lands as a parallel first-class claim.
- F5 — The play reads or grounds on the architecture or run lens, or touches another slice.
- F6 — A declared proof source the pipes cannot produce (unharvestable by /capture).
- F7 — Product-outcome measurement smuggled into the lens.
- F8 — The play runs on an ineligible slice (missing trinity or arch lens, unresolved hub
  refs).
- F9 — The play modifies anything beyond the one measure lens (slice record, hub, profile,
  other lenses).

## Expectation

### Success scenarios

- S1 — (product owner, clean realization) Given a slice whose lens trinity and architecture
  lens exist and whose hub resolves, when /measure runs and the human approves at the
  checkpoint, then the slice carries a measure lens where every metric is a complete claim
  (baseline, target, proof), triangle-primary, every claim grounded. Measure: the lens
  validates against the schema; the manifest grounds every claim; the persisted lens is
  byte-faithful to the approved draft.
- S2 — (product owner, KB gap) Given a measurement aspect no learning covers, then the run
  records a gap proposal, the claim references it, and the checkpoint surfaces it. Measure:
  the proposal file exists; the manifest references its path; zero ungrounded claims.
- S3 — (product owner, ineligible slice) Given a slice missing a trinity lens or the
  architecture lens, then the run halts at pre-flight with nothing drafted or written.
  Measure: the halt names the missing lens; no draft, no model write.
- S4 — (product owner, honest cold start) Given no prior captured delivery data exists, then
  baselines say "unmeasured" plainly rather than carrying a number without a source. Measure:
  every baseline has either a source or the literal value "unmeasured"; no sourceless number
  anywhere.
- S5 — (product owner, held axis) Given a slice where an axis is not worth improving, then the
  axis is either claimed with direction "hold" or sits in out-of-scope with its why — never
  silently absent. Measure: every triangle axis appears either as a claim or as an
  out-of-scope entry with a grounded reason.

### Recovery (one per failure condition)

- REC1 (F1) — trigger: the persisted lens differs from the approved draft, or no approval was
  recorded. direction: revert the write, re-present the checkpoint. handoff: human.
- REC2 (F2) — trigger: a claim missing baseline/target/proof, or a sourceless number.
  direction: complete the claim or set the baseline to "unmeasured" honestly. handoff:
  autonomous.
- REC3 (F3) — trigger: an ungrounded claim or out-of-scope call. direction: re-search the KB;
  ground in a matched learning or record a gap proposal. handoff: autonomous.
- REC4 (F4) — trigger: an industry metric claimed first-class. direction: convert it to a
  derived translation note or a grounded out-of-scope entry. handoff: autonomous.
- REC5 (F5) — trigger: the draft grounds on the architecture or run lens, or another slice.
  direction: re-draft from the hub + trinity only. handoff: autonomous.
- REC6 (F6) — trigger: a proof source the pipes cannot produce. direction: swap to a
  producible source or record the gap proposal. handoff: autonomous.
- REC7 (F7) — trigger: a product-outcome metric in the lens. direction: strip it; note it for
  the strategy layer. handoff: autonomous.
- REC8 (F8) — trigger: ineligible slice at pre-flight. direction: halt; the missing lens play
  must run first. handoff: human.
- REC9 (F9) — trigger: a write outside the one measure lens. direction: revert the stray
  write; re-apply the lens alone. handoff: autonomous.
