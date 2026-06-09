---
id: technology/ux-accessibility-floor
title: "Accessibility is a gate, not a feature: WCAG AA, keyboard-first, semantic HTML"
conditions:
  surface: any-public-ui
  stage: any
evolve_when: []
provenance: "seeded (assistant, #434 — accepted by Kapil)"
---

# Accessibility is a gate, not a feature: WCAG AA, keyboard-first, semantic HTML

## Topic
The accessibility floor every user-facing surface clears. Accessibility is a quality gate
the build must pass, not a feature to schedule — which is why on the ProductOS model the a11y
bar lives in the **product profile** (a governed NFR), and this learning is what grounds that
bar.

## Conditions
Any public or user-facing UI. The floor doesn't depend on stage or audience — it's the
minimum.

## Recommendation
- **WCAG 2.x AA** as the target: AA color contrast, text resize, no information by color
  alone.
- **Keyboard-first.** Everything operable without a mouse; visible focus states; logical tab
  order; no keyboard traps.
- **Semantic HTML first, ARIA only to fill gaps.** Real buttons, headings, landmarks, labels;
  reach for ARIA only where native semantics don't exist. Most a11y bugs are un-semantic
  markup, not missing ARIA.
- **Focus management** on route changes, modals, and dynamic content (move focus to the new
  thing; return it on close).
- **Respect user settings** — `prefers-reduced-motion`, color scheme — and don't override
  them.
- **Test it**, don't assume it: automated checks (axe) in CI plus a manual keyboard +
  screen-reader pass on key flows.

## Rationale
Accessibility retrofitted after launch costs far more than building it in, and "we'll do
a11y later" reliably means never. Treating it as a gate — the build doesn't ship if it
fails the floor — is the only thing that holds. Semantic-HTML-first is the highest-leverage
rule: it makes most of AA fall out for free and keeps ARIA (which is easy to get wrong) to a
minimum. Keeping the bar in the profile as a governed NFR means every slice inherits it
instead of re-deciding it.

## Evolve when
A surface has legal or contractual obligations beyond AA (e.g. AAA on specific criteria, or
a regulated-sector requirement) → raise the profile's a11y bar for that product; the floor
here still holds as the minimum.

## Provenance
seeded (assistant, #434 — accepted by Kapil).
