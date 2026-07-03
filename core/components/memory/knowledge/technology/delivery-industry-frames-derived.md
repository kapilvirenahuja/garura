---
id: technology/delivery-industry-frames-derived
title: "Industry delivery frames (DORA/Flow/SPACE/DX) are derived translations of the triangle, never the primary"
conditions:
  concern: delivery-measurement
  delivery: agent-led
  stage: any
evolve_when: []
provenance: "documented (Kapil, #434 — measurement interview, 2026-06-11)"
---

# Industry delivery frames (DORA/Flow/SPACE/DX) are derived translations of the triangle, never the primary

## Topic
How the standard delivery-measurement frameworks relate to the delivery triangle
(`technology/delivery-triangle`): they are TRANSLATIONS, derived from triangle data for
the outside world — not separate claims a slice carries.

## Conditions
Any slice whose measure lens needs industry-legible numbers (stakeholders, benchmarks,
reporting) alongside the triangle.

## Recommendation
- A slice's measure lens claims **triangle metrics only** as first-class entries with
  baseline/target/proof. Industry numbers are **derived automatically** from the same
  data — zero extra bookkeeping per slice, no second set of baselines.
- The standing translations:
  - DORA **lead time** ← the speed axis (pipe open → closed).
  - DORA **deployment frequency** ← slices/epics landed per period (close-chain merges).
  - DORA **change-failure rate** ← the one-shot record (see
    `technology/delivery-one-shot-cleanliness`): adjustment rounds + post-deploy errors.
  - DORA **time to restore** ← reopen-to-reclose time when a delivered slice regresses.
  - **Flow** (WIP, flow time, flow efficiency) ← pipe dwell vs active time — the same
    sit-time data that prices cognition.
  - **SPACE / DX** ← the cognition axis: the human share of each pipe (dwell +
    adjustment rounds, review time, /launch defect count) IS the experience measure —
    with agents building, "team experience" means how much directing the human gets to
    do versus correcting.
- Position (Kapil): this is the **moat** — a new way of tracking product delivery. The
  industry frames are what people get today, and the bet is they go obsolete as
  agent-led adoption matures: when product is delivered every day, deployment
  frequency and lead time stop discriminating. Until then, the translations keep us
  legible.

## Rationale
Two parallel metric sets would mean double baselines, double targets, and drift between
them. Deriving keeps one source of truth (triangle data on the pipes) while staying
conversant with the industry. The translations are honest because every industry number
maps to triangle data actually collected — nothing is hand-reported.

## Evolve when
An industry frame stops being asked for (the obsolescence bet landing) → drop its
translation; a stakeholder needs a frame not listed → add a translation, never a
parallel claim.

## Provenance
documented (Kapil, #434 — measurement interview).
