---
id: technology/validation-floor-profile-benchmarks
title: "Green is the entry, the profile floor is the bar"
conditions:
  concern: code-validation
  delivery: agent-led
  stage: any
evolve_when: []
provenance: "documented (Kapil, #434 — validate interview, 2026-06-12)"
---

# Green is the entry, the profile floor is the bar

## Topic
What "passing" means when an agent-side gate verifies built code. Tools going
green is the entry condition, never the verdict: the verdict compares results
against the BENCHMARKS the product profile declares. Canonical example: every
unit test passes but coverage is 40% — below the profile's coverage benchmark —
that is a REJECT, with all tests green.

## Conditions
Any agent-side verification of built code (a /validate-style gate) on a product
whose profile declares quality benchmarks. Applies per check class: tests,
coverage, static analysis, dependency scans, performance and accessibility
audits.

## Recommendation
- Run the tools and capture normalized results; treat a red tool as an automatic
  finding (the entry condition failed).
- Then compare every captured result against the product profile's declared
  benchmark for that check class (coverage floor, quality bars, NFR-derived
  thresholds). Below the floor = finding = reject, regardless of green.
- A result with no applicable benchmark falls back to green/red.
- A benchmark with no captured result is itself a finding: an unmeasured bar is
  not a passed bar.
- The NUMBERS live in the product profile, per product — never in this KB. This
  learning carries the principle only.

## Rationale
Agents optimize for the visible signal. If the visible signal is "tools green",
an agent will produce green — minimal tests that pass, suppressed warnings,
shallow coverage. Anchoring the verdict to profile benchmarks makes the bar
explicit, per-product, and impossible to satisfy by gaming the tool's default
exit code.

## Evolve when
Real validate runs show a benchmark class the profile cannot express (a bar with
no schema home) → extend the profile schema, not the KB. Repeated cross-product
floors emerge (e.g. every product lands on the same coverage floor) → consider a
documented default here, still overrideable per profile.

## Provenance
documented (Kapil, #434 — validate interview, 2026-06-12).
