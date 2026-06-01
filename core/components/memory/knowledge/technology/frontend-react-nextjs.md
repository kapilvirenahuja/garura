---
id: technology/frontend-react-nextjs
title: "Frontend stack: React + Next.js — when it fits"
conditions:
  surface: web-app
  interactivity: medium-to-high
  team-familiarity: react
provenance: seeded
---

# Frontend stack: React + Next.js — when it fits

## Topic
Choosing React + Next.js for the product's web front end.

## Conditions
A web product with meaningful interactivity, a team comfortable with React, and
a need for both server-rendered pages (SEO, fast first load) and rich
client-side behavior.

## Recommendation
- Use Next.js (React) when you need a mix of static/SSR pages and interactive
  client components in a single framework with good hosting options.
- Pair it with the product's design system as the component layer.
- For a throwaway one-user prototype this is usually overkill — plain static
  HTML/JS is enough (see `architecture/single-user-throwaway`). Reach for Next.js
  when the UI is genuinely app-like or SEO/SSR matters.

## Rationale
Next.js covers the common web cases (routing, SSR/SSG, API routes) without
gluing several tools together, and React skills are widely available. The cost
is a build and runtime heavier than static files — not worth it until
interactivity or SSR is real.

## Evolve when
- The product is a throwaway prototype → drop to plain static, no framework.
- The UI needs heavy real-time/collaborative behavior → reassess against a more
  specialized client stack.

## Provenance
seeded (#434 — first technology-shelf example)
