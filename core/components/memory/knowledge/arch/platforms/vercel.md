# Vercel

Frontend cloud platform — zero-config deployment for Next.js, edge functions, and preview deployments.

**Search patterns:** Vercel, edge, serverless, Next.js hosting, preview deployments, frontend cloud, edge functions, CDN, JAMstack

## When to Choose

Vercel is the best deployment experience for Next.js applications — zero configuration, instant preview deployments on every PR, edge functions for low-latency global delivery, and automatic HTTPS. Choose when: the product uses Next.js, the team wants to focus on product rather than infrastructure, preview deployments are valuable for the workflow (designers reviewing PRs), and the workload fits Vercel's model (request-response, not long-running processes). Ideal for startups and small-to-medium teams building consumer or SaaS products where developer experience and deployment speed matter. The free tier is generous for prototypes and small projects.

## When to Avoid

Avoid for backend-heavy products — Vercel is frontend-first. Avoid when you need long-running processes, WebSocket servers, background workers, or cron jobs beyond simple scheduled functions. Avoid when cost predictability at scale is critical — Vercel's per-request pricing can surprise at high traffic. Avoid when vendor lock-in is a concern — Next.js on Vercel uses Vercel-specific features that don't work on other platforms. Avoid for non-Next.js backends — use Railway, Render, or AWS directly.

## Scale Profile

| Dimension | Sweet Spot | Stretch | Break Point |
|-----------|-----------|---------|-------------|
| Team size | 1-30 | 30-100 | > 100 (enterprise plan, governance needed) |
| Monthly requests | Up to 100M | 100M-1B | > 1B (cost vs self-hosted calculus) |
| Use case | Frontend, SSR, API routes, edge functions | Simple backends | Long-running processes, WebSocket, heavy compute |

## Key Components

| Component | Options | Notes |
|-----------|---------|-------|
| Framework | Next.js (primary), Nuxt, SvelteKit, Astro, Remix | Next.js gets the best Vercel integration |
| Edge | Edge Functions, Edge Middleware, Edge Config | Sub-50ms response globally |
| Storage | Vercel KV (Redis), Vercel Postgres, Vercel Blob | Managed storage — simple but limited |
| Analytics | Vercel Analytics, Vercel Speed Insights | Built-in, no setup |
| CI/CD | Git-based (GitHub, GitLab, Bitbucket) | Push to deploy — automatic |

## Tradeoffs

| Aspect | Gain | Cost |
|--------|------|------|
| DX | Best-in-class: push to deploy, preview URLs, instant rollback | Vercel-specific features create lock-in |
| Edge | Global edge network, sub-50ms responses | Edge functions have limitations (runtime, memory) |
| Cost | Free tier is generous; small teams pay little | Expensive at high scale vs self-hosted |
| Simplicity | Zero infrastructure management | Less control over compute, networking, scaling |

## Anti-Patterns

| Anti-Pattern | Description | Risk |
|-------------|-------------|------|
| Backend on Vercel | Running heavy backend logic on Vercel serverless | Timeout limits, cost at scale, not designed for it |
| Ignoring edge limitations | Assuming edge functions can do everything Lambda can | Runtime limitations, no database connections at edge |
| No cost monitoring | High-traffic app without spend tracking | Surprise bills from per-request pricing |
