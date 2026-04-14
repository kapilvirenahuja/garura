# React + Next.js

Full-stack React framework with server-side rendering, API routes, and edge deployment.

**Search patterns:** React, Next.js, RSC, server components, Vercel, frontend, full-stack JavaScript, TypeScript, App Router, SSR, SSG

## When to Choose

Next.js is the default choice for React-based applications that need SEO, server-side rendering, or a full-stack TypeScript experience. It excels at content-heavy sites, e-commerce, SaaS dashboards, and marketing sites. The App Router with React Server Components provides a modern data-fetching model. Choose when the team knows React, the product needs SSR/SSG for SEO (PP-7 = 2-4 consumer/commerce), or when Vercel's deployment model (zero-config, preview deployments, edge functions) aligns with infrastructure preferences. PP-1 = 3-5 (business to consumer) benefits from SSR performance. NFR-3 >= 2 gets server-side rendering benefits.

## When to Avoid

Avoid for purely client-side SPAs where SEO doesn't matter (admin dashboards, internal tools) — React + Vite is simpler. Avoid when the team is not familiar with React or when the project needs a different rendering model (Svelte's compiler, Angular's opinionated structure). Avoid when vendor lock-in to Vercel is a concern and self-hosting Next.js is not feasible. The App Router's complexity (server components, client components, server actions) has a learning curve.

## Scale Profile

| Dimension | Sweet Spot | Stretch | Break Point |
|-----------|-----------|---------|-------------|
| Team size | 1-30 React developers | 30-100 | > 100 (micro-frontends consideration) |
| Pages/routes | 10-1000 | 1K-10K | > 10K (build times, ISR essential) |
| Traffic | Any (SSR/SSG handle high traffic well) | — | — |

## Key Components

| Component | Options | Selection Guidance |
|-----------|---------|-------------------|
| Rendering | SSR, SSG, ISR, client-side | SSG for marketing; SSR for dynamic; ISR for hybrid |
| Styling | Tailwind CSS, CSS Modules, styled-components, Panda CSS | Tailwind for speed; CSS Modules for isolation |
| State management | React Context, Zustand, Jotai, Redux Toolkit | Zustand for simplicity; Redux for complex global state |
| Data fetching | Server Components (fetch), SWR, React Query, Server Actions | Server Components for SSR data; React Query for client-side |
| Auth | NextAuth.js, Clerk, Auth0, Supabase Auth | NextAuth for self-hosted; Clerk for managed |
| Deployment | Vercel, AWS Amplify, Cloudflare Pages, Docker (self-hosted) | Vercel for zero-config; Docker for full control |

## Reference Architecture

```
app/
├── (marketing)/            # Route group: public pages
│   ├── page.tsx            # Homepage (SSG)
│   ├── pricing/page.tsx    # Pricing (SSG)
│   └── blog/[slug]/page.tsx # Blog posts (ISR)
├── (app)/                  # Route group: authenticated app
│   ├── layout.tsx          # App shell with sidebar
│   ├── dashboard/page.tsx  # Dashboard (SSR)
│   └── settings/page.tsx   # Settings (SSR)
├── api/                    # API routes
│   └── webhooks/route.ts
├── components/             # Shared React components
├── lib/                    # Utilities, database, auth config
└── middleware.ts           # Auth guards, redirects
```

## Evolution Paths

| From | To | Trigger | Approach |
|------|----|---------|----------|
| Create React App / Vite SPA | Next.js | SEO needed, SSR benefits | Migrate pages to Next.js App Router; add server components |
| Next.js Pages Router | Next.js App Router | Modern data fetching, RSC | Incremental migration — both routers coexist |
| Next.js monolith | Micro-frontends | Multiple teams, independent deploys | Module federation or separate Next.js apps behind reverse proxy |

## Tradeoffs

| Aspect | Gain | Cost |
|--------|------|------|
| SEO | Server-rendered HTML, metadata API, sitemap generation | SSR compute cost, caching complexity |
| DX | File-based routing, hot reload, TypeScript support | App Router learning curve (RSC, server actions) |
| Performance | Streaming SSR, automatic code splitting, image optimization | Build times grow with page count |
| Ecosystem | Largest React ecosystem, most third-party integrations | Framework-specific patterns may differ from vanilla React |
| Deployment | Vercel zero-config is unmatched | Self-hosting Next.js has rough edges |

## Anti-Patterns

| Anti-Pattern | Description | Risk |
|-------------|-------------|------|
| Client component everything | Marking everything "use client" defeats RSC benefits | Larger bundles, slower initial load |
| Over-fetching in server components | Fetching data in every component without deduplication | Waterfall requests, slow pages |
| Ignoring caching | No Cache-Control headers, no ISR, no CDN | Every request hits origin server |
| Vercel lock-in without awareness | Using Vercel-specific features without abstraction | Painful migration if self-hosting needed later |
