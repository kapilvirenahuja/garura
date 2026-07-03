---
id: technology/ux-design-system-tokens
title: "Design tokens + component reuse: the visual core sits on a small token set"
conditions:
  surface: web-app-or-site
  stage: any
evolve_when: []
provenance: "seeded (assistant, #434 — accepted by Kapil)"
---

# Design tokens + component reuse: the visual core sits on a small token set

## Topic
How the product's visual consistency is held — design tokens and a reused component set.
This is what `/ux`'s **visual core** (color + typography) is built from, and what keeps every
screen looking like one product.

## Conditions
Any web surface, especially once there's more than a handful of screens.

## Recommendation
- **Define a small set of design tokens** as the single source of visual truth: a color
  palette (with semantic roles — surface, text, primary, danger — not raw hexes scattered in
  code), a **type scale** (a few sizes/weights on a consistent ratio), spacing scale, radius,
  and elevation. Everything references tokens; nothing hard-codes a value.
- **Build from a reused component library**, not bespoke per screen. A screen is assembled
  from shared components (the Primitive → Block → Card composition in
  `technology/frontend-component-orchestration`), so the visual core is enforced by reuse,
  not by discipline.
- **Theme through tokens.** Light/dark and any brand variation is a token swap, not a
  re-style.
- Keep the token set **small and opinionated** — a few good choices beat a sprawling system
  no one follows.

## Rationale
Tokens-as-source-of-truth is what makes the visual core actually hold across a growing
product: when color and type are referenced (not copied), one change propagates everywhere
and drift can't creep in. Hard-coded values are how a product slowly ends up with eleven
shades of "primary blue." A small token set plus component reuse means consistency is the
default outcome of building normally, not a thing someone has to police. It also makes the
visual-core decision the `/ux` lens records concrete and enforceable.

## Evolve when
The product needs multiple brands/themes, or the token set has grown unwieldy and
inconsistent → formalize into a fuller design system (documented components, usage rules)
rather than letting tokens proliferate ad hoc.

## Provenance
seeded (assistant, #434 — accepted by Kapil).
