---
id: technology/ux-navigation-by-shape
title: "Navigation follows product shape: sidebar for tools, top-nav for content, drawer for focus"
conditions:
  surface: web-app-or-site
  stage: any
evolve_when: []
provenance: "seeded (assistant, #434 — accepted by Kapil)"
---

# Navigation follows product shape: sidebar for tools, top-nav for content, drawer for focus

## Topic
The primary navigation pattern — how users move between the main areas of the product. A
`/ux` pattern choice driven by what kind of product it is.

## Conditions
Any web surface with more than a couple of destinations.

## Recommendation
Pick navigation by product shape:

- **Dense tools / dashboards / apps with many sections** → a **persistent sidebar** (often
  collapsible). Keeps many destinations one click away for power users.
- **Content / marketing / mostly-reading** → a **top nav** with a few clear sections; depth
  via in-page structure, not nav.
- **Focused, single-task flows** → a **drawer or modal** that isolates the task; don't make
  the user navigate away.
- **Breadcrumbs** whenever hierarchy goes past two levels deep, so users always know where
  they are and can climb back.
- Keep **primary nav short** (roughly ≤7 items); push the rest into sections, search, or a
  "more" affordance. On mobile, collapse primary nav predictably (a drawer), don't hide
  destinations users need often.

## Rationale
Navigation that fits the product's shape disappears; navigation borrowed from a different
shape fights the user (a content top-nav bolted onto a dense tool buries half the app; a
sidebar on a marketing site is noise). Matching the pattern to the task density and the
user's mental model is the cheapest usability win there is. Short primary nav and
breadcrumbs are the two rules that keep any of these from sprawling.

## Evolve when
The destination count outgrows the chosen pattern (a top-nav product grows into a dense
tool, or a sidebar passes ~7 top-level items) → re-shape the nav (introduce sections,
search, or grouping) rather than cramming more into the existing bar.

## Provenance
seeded (assistant, #434 — accepted by Kapil).
