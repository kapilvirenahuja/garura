---
id: technology/frontend-react-nextjs
title: "React + Next.js: the default full-stack web stack"
conditions:
  surface: web-app
  stack: react-nextjs-app-router
  rendering: ssr-ssg-isr
  team-size: 1-30
  stage: greenfield-or-growth
evolve_when: []
provenance: "documented (recovered from the prior KB into the v1 KB under #434)"
---

# React + Next.js: the default full-stack web stack

## Topic
The web stack choice: a full-stack React framework with server-side rendering,
API routes, and edge deployment. This is the **stack** decision; the component
discipline that goes on top of it is a separate learning —
[Primitive → Block → Card](./frontend-component-orchestration.md).

## Conditions

### When to choose
The team knows React, and the product needs SEO / SSR and/or full-stack
TypeScript. It excels at content-heavy sites, e-commerce, SaaS dashboards, and
marketing. Consumer- and commerce-facing products benefit most from SSR. Pairs
naturally with a [modular-monolith](../architecture/modular-monolith.md) backend
and Vercel's zero-config edge model.

### When to avoid
Purely client-side SPAs (React + Vite is simpler); a team not fluent in React;
products that want a different rendering model (Svelte's compiler, Angular's
structure); or hard vendor-lock-in concerns where self-hosting is infeasible. The
App Router has a real learning curve.

### Scale profile
| Dimension | Sweet spot | Stretch | Break point |
|-----------|-----------|---------|-------------|
| Team size | 1–30 | 30–100 | > 100 (consider micro-frontends) |
| Pages/routes | 10–1000 | 1K–10K | > 10K (build time; ISR essential) |
| Traffic | any (SSR/SSG handle it) | — | — |

## Recommendation
| Concern | Options | Guidance |
|---------|---------|----------|
| Rendering | SSG / SSR / ISR | SSG for marketing, SSR for dynamic, ISR for hybrid |
| Styling | Tailwind; CSS Modules | speed vs isolation |
| State | Context; Zustand; Redux | reach for Redux only at real global complexity |
| Data | Server Components; React Query | server for first paint, RQ client-side |
| Auth | NextAuth; Clerk | self-hosted vs managed |
| Deploy | Vercel; Amplify/CF Pages; Docker | zero-config vs full control |

Reference shape: `(marketing)` and `(app)` route groups, `api/` routes,
`components/`, `lib/` (db, auth, utils), `middleware.ts` for guards/redirects.
RSC by default; push `'use client'` to the leaves.

## Rationale
The gains: SEO from server HTML + metadata, strong DX (file routing, hot reload,
end-to-end TypeScript), performance (streaming SSR, code splitting, image
optimization), and the largest React ecosystem. The costs: SSR compute and caching
complexity, the App Router learning curve, build times that grow with route count,
and Vercel lock-in risk (self-hosting has rough edges). For a small team shipping a
content- or commerce-facing product in TypeScript, the gains dominate.

## Evolve when
| From | To | Trigger |
|------|----|---------|
| CRA / Vite SPA | React + Next.js | SEO/SSR needed — migrate pages, add server components |
| Pages Router | App Router + RSC | want modern data fetching/streaming — incremental, both coexist |
| Next.js monolith | Micro-frontends | multiple teams need independent deploys (> ~100 engineers) — module federation or separate apps behind a proxy |

## Provenance
documented — recovered from the prior KB (`arch/stacks/frontend-react-nextjs.md`)
and reshaped into the v1 template under #434. Companion: the
[component architecture](./frontend-component-orchestration.md) that sits on this
stack.
