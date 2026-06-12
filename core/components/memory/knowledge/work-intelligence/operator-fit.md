# Operator fit — matching the person running to the work that fits them

## Topic

How /next's ranking layer turns an operator's computed work profile (from
`work-map.yaml` + `classify_work.py` — lexical, never inferred) into fit
boosts on the candidate list. This is the JUDGMENT half of the
work-intelligence shelf; the mechanical half is `work-map.yaml` beside it.

## Conditions

- The operator's profile says `thin_history: false` — there is enough history
  to trust (thresholds live in `work-map.yaml`). When thin, fit weighting is
  SKIPPED entirely and the output says so; never guess a profile from a
  handful of commits.
- Two or more candidates are runnable — fit only matters when there is a
  genuine choice.

## Recommendation

Fit adjusts ranking WITHIN a lane; it never overrides the structural order
(repair first, then the pipeline's own logic). Apply, in this order:

1. **Work-type affinity.** Boost candidates whose play matches a dominant
   work type:
   - `product` → vision, understand, shape, roadmap, grill
   - `design` → quality, ux, agentic, arch, measure, run
   - `implementation` → implement
   - `quality` → validate
   - `operations` → launch, run
   - `knowledge` → enrich
2. **Stack affinity (implement only).** When an epic's slice carries an
   architecture lens whose stack matches the operator's dominant stacks
   (e.g. a node-heavy operator and a node slice), boost that epic over
   stack-mismatched epics.
3. **State the reason.** A fit-boosted entry must say so in its explanation
   ("your recent work is mostly node implementation — this epic is a node
   build"), recorded as `fit_reason`. No silent reordering.

## Rationale

The backlog rarely has one runnable action; parallel lanes are normal
(several people, several agents). Structural priority decides what MUST
happen (a repair, a blocked chain); fit decides who should pick WHICH of the
equally-runnable lanes. Path-and-keyword classification over real commits is
evidence; a model's impression of someone is not — which is why the whole
signal chain (git log → glob match → BM25) is mechanical and reproducible.

## Evolve when

- A team's file layout breaks the glob patterns → extend `work-map.yaml`
  (patterns are the part that drifts; the principle doesn't).
- Operators start declaring preferences explicitly (a future profile
  artifact) → declared preference outranks computed history; keep history as
  the fallback signal.
- The stack-affinity rule needs the architecture lens parsed per slice →
  teach `rank-recommendations` to read `lens/architecture.yaml` stack blocks;
  keep the matching lexical.

## Provenance

Framed with the user while building /next (#434 follow-on): "you know the git
name and see what sort of work the person does... this is work intelligence."
Thin-history degradation and the no-inference rule are user-set hard
constraints (C7/F4 of the /next ICE).
