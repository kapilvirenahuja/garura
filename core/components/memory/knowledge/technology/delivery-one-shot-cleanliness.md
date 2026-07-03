---
id: technology/delivery-one-shot-cleanliness
title: "One-shot cleanliness: deployed and running first try, zero errors, deterministic gates green"
conditions:
  concern: delivery-measurement
  delivery: agent-led
  stage: any
evolve_when: []
provenance: "documented (Kapil, #434 — measurement interview, 2026-06-11)"
---

# One-shot cleanliness: deployed and running first try, zero errors, deterministic gates green

## Topic
What "the delivery went well" looks like at the moment a slice lands — the first-shot
correctness signals. Stricter than industry change-failure rate: not "low failure rate
over time" but "this slice landed clean on the FIRST attempt."

## Conditions
Every slice delivery on an agent-led pipeline. Read at /launch and in the alignment
pipe (/capture).

## Recommendation
A clean landing means ALL of:
- **Deployed and runs in one shot** — no redeploy, no rollback, no fix-up round.
- **No errors** — the running slice throws nothing post-deploy.
- **Deterministic gates all green without a fix-up round** — SonarQube (code quality),
  Snyk (dependencies/security), PageSpeed (performance), accessibility checks. These
  are tools, not judgment — they either pass or they don't.
- **UX looks good** — visual quality is a DELIVERY signal here, not only a product
  one; an agent-built UI that lands ugly is a failed one-shot even if it runs.

One-shot cleanliness and low cognition are the same fact seen from two sides: every
fix-up round after agent-done is both a failed one-shot AND a cognition leak (an
adjustment in the pipe's sitting time). Defects caught by the human at /launch manual
review count against one-shot — the agents should have caught them.

## Rationale
On an agent-led pipeline the human's scarce resource is attention; a delivery that
needs no second touch is the whole point. Deterministic tools make the bar objective —
green is green. This is also the honest base for the derived DORA change-failure-rate
translation (see `technology/delivery-industry-frames-derived`).

## Evolve when
The deterministic gate set changes (a tool added/retired in the quality lens) → update
the gate list here; /capture shows one-shot is consistently met → tighten what counts
as "clean" (e.g. include perceived-quality review).

## Provenance
documented (Kapil, #434 — measurement interview).
