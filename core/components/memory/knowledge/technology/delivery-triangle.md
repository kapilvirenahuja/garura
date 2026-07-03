---
id: technology/delivery-triangle
title: "The delivery triangle: minimum tokens and cognition for maximum speed"
conditions:
  concern: delivery-measurement
  delivery: agent-led
  stage: any
evolve_when: []
provenance: "documented (Kapil, #434 — measurement interview, 2026-06-11)"
---

# The delivery triangle: minimum tokens and cognition for maximum speed

## Topic
THE primary frame for measuring delivery on an agent-led pipeline — Kapil's frame, and
the moat. Three axes, one objective: the right spend of tokens and cognition to get the
maximum speed. This is what a slice's measure lens grounds its metric choices in;
industry frames (DORA/Flow/SPACE/DX) are derived translations, never the primary
(see `technology/delivery-industry-frames-derived`).

## Conditions
Any product delivered through agent-led pipelines (agents build, a human directs).
Measured per slice, on the delivery pipes — never on product outcomes (those belong to
the strategy layer).

## Recommendation
Measure every slice's delivery on three axes:

- **Speed** — elapsed time from a pipe opening to it closing. This is what everyone
  expects to be fast. Working heuristic: agent-led delivery should be at least **5x**
  faster than the human baseline for the same work (10 days → 2 days = an 80% cut;
  10x would be 90%). Proof source: pipeline timestamps (start-change open → merge).
- **Tokens** — the fuel cost; less is better. The whole bet behind plays lives here:
  the more accurate the work is upfront, the fewer adjustment rounds later, the lower
  the burn. Proof source: token burn per pipe (token-burn dashboard).
- **Cognition** — the human's time, and the KIND of it: directing is fine, adjusting
  is the leak. Measured WITHOUT a time tracker: the pipes are the instrument. Agents'
  active time and tokens are known; everything after agent-done until the pipe closes
  is the human share — how long the slice SITS, and how many changes/adjustments land
  in that sitting time before slice and Hub close out. Named cognition leaks: long
  spec-reading, long code reviews, adjusting instead of directing, defects caught in
  manual review at /launch. Proof source: pipe dwell time (agent-done → pipe-closed)
  + adjustment-round count in that window.

The objective function is joint: spend the right tokens and cognition to get max
speed — never optimize one axis by silently bleeding another (a fast pipe that burned
3x tokens, or a cheap pipe that sat two days collecting your corrections, both fail).

## Rationale
Speed is the visible promise of agent-led delivery; tokens are its real marginal cost;
cognition is the scarce human resource the whole setup exists to protect. The triangle
ties the three so improvements are honest. Reading cognition off pipe-close dwell and
adjustment rounds makes the human cost measurable from data that already exists —
no self-reporting, no surveillance.

## Evolve when
Real slice deliveries show an axis is mis-priced (e.g. token cost becomes negligible,
or a better cognition proxy emerges from /capture data) → reweight via /learn.

## Provenance
documented (Kapil, #434 — measurement interview).
