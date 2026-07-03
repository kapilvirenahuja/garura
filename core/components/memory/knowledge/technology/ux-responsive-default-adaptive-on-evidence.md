---
id: technology/ux-responsive-default-adaptive-on-evidence
title: "Responsive by default, adaptive only on evidence"
conditions:
  surface: web-app-or-site
  multi-device: true
  stage: any
evolve_when: []
provenance: "documented (Kapil's stated POV, #434) + assistant"
---

# Responsive by default, adaptive only on evidence

## Topic
How a UI handles different screen sizes — the responsive-vs-adaptive choice. This is a
`/ux` pattern choice, not a per-screen detail.

## Conditions
Any web surface that must work across device sizes.

## Recommendation
- **Responsive is the default.** One mobile-first layout that fluidly reflows — flexible
  grids, relative units, breakpoints that rearrange the *same* content. One codebase, one
  content model, works everywhere.
- **Adaptive only on evidence.** Build distinct per-device layouts (genuinely different
  structure for phone vs desktop) **only** when there's evidence — analytics or usability —
  that the responsive version fails a key task on a key device. Adaptive is a deliberate,
  justified exception, not a starting posture.
- Design content-first and mobile-first so the small screen forces real prioritization; the
  larger screens get more room, not more stuff.

## Rationale
Responsive-by-default keeps one source of truth and one thing to maintain; adaptive-by-
default doubles (or triples) the design and build surface for layouts most users never hit
differently. Starting adaptive is premature optimization — you pay for device-specific
designs before you know any of them are needed. Reserving adaptive for evidenced failures
spends that cost only where it returns a real task improvement.

## Evolve when
Analytics or usability testing shows a specific device failing a specific key task on the
responsive layout → build an adaptive layout for that case (and only that case).

## Provenance
documented (Kapil's POV, #434) + assistant.
