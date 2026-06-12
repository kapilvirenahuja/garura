---
id: architecture/regression-by-blast-radius
title: "Regression scoped to the blast radius, narrowing every fix round"
conditions:
  concern: code-validation
  delivery: agent-led
  stage: any
evolve_when: []
provenance: "documented (Kapil, #434 — validate interview, 2026-06-12)"
---

# Regression scoped to the blast radius, narrowing every fix round

## Topic
How much existing behavior to re-verify when an agent-side gate checks built
code: the checks IMPACTED BY THE BLAST RADIUS of what changed — never the full
suite by default. And the scope is round-aware: it narrows as the find-fix loop
converges.

## Conditions
Agent-led delivery where a builder play and a validator gate run in an expected
loop (find → fix → re-verify), and the builder records its change claims
(which files/pieces it touched) as part of its run.

## Recommendation
- Round 1: regression scope = the blast radius of the build itself — derived
  from the builder's RECORDED change claims, never re-derived by inference.
- Round N+1: regression scope = the blast radius of the FIX the agent made in
  response to the validator's last report. Each fix round re-verifies only what
  that fix could have touched.
- Scope is always drawn from recorded claims (the builder's, or the fix's);
  an invented or inferred scope is a named failure of the gate.
- The loop therefore gets CHEAPER per round as it converges — the opposite of
  re-running everything every time.

## Rationale
The find-fix loop is the normal mode of agent delivery, not an exception — so
its per-round cost decides whether validation is affordable. Full-suite-every-
round prices the loop out; unscoped "judgment" regression invites the agent to
skip what it shouldn't. Recorded-claim blast radius is both cheap and honest:
the scope is mechanical, auditable, and exactly as wide as the change.

## Evolve when
A delivered defect escapes through a scoped regression (the blast radius missed
a real dependency) → widen the scope derivation (e.g. add dependency-graph
expansion) via /learn, don't fall back to full-suite.

## Provenance
documented (Kapil, #434 — validate interview, 2026-06-12).
