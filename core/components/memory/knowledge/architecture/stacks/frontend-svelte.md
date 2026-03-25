# Svelte + SvelteKit

Compiler-based framework — no virtual DOM, minimal runtime, with SvelteKit for full-stack capabilities.

**Search patterns:** Svelte, SvelteKit, compiled, lightweight, no virtual DOM, reactive, minimal runtime, Vite, small bundle

## When to Choose

Svelte produces the smallest bundles and fastest runtime of any major framework because it compiles components to vanilla JavaScript at build time — no framework runtime shipped to the browser. Choose when: performance is critical (NFR-3 >= 3), bundle size matters (mobile, emerging markets, slow connections), the team is small and values simplicity, or the project is a progressive web app. SvelteKit provides SSR, API routes, and deployment adapters similar to Next.js. PP-2 >= 3 with performance sensitivity benefits from Svelte's compiled output. PP-6 = 1-3 (POC to Market-Ready) benefits from Svelte's development speed.

## When to Avoid

Avoid when hiring is a concern — Svelte's developer pool is the smallest of major frameworks. Avoid for very large enterprise applications where Angular's governance or React's ecosystem breadth is needed. Avoid when extensive third-party component libraries are required — React and Vue have larger ecosystems. The community is growing but significantly smaller than React/Vue/Angular.

## Scale Profile

| Dimension | Sweet Spot | Stretch | Break Point |
|-----------|-----------|---------|-------------|
| Team size | 1-15 | 15-30 | > 30 (hiring difficulty) |
| Application complexity | Simple to moderate | Complex (but doable) | Very complex enterprise (consider Angular) |
| Bundle size sensitivity | High (mobile, PWA) | Moderate | Not a concern (React/Vue are fine) |

## Key Components

| Component | Options | Selection Guidance |
|-----------|---------|-------------------|
| State | Svelte stores (built-in), runes (Svelte 5) | Built-in stores for most cases; runes for Svelte 5 |
| Styling | Scoped styles (built-in), Tailwind | Built-in scoped styles are excellent; add Tailwind for utility |
| SSR/SSG | SvelteKit (built-in) | SvelteKit for full-stack; Svelte alone for client-only |
| Deployment | Vercel, Netlify, Cloudflare Pages, Node adapter, static adapter | Adapters for each platform; static for JAMstack |

## Tradeoffs

| Aspect | Gain | Cost |
|--------|------|------|
| Performance | No virtual DOM overhead, smallest bundles, fastest rendering | Compiler complexity (hidden from developer) |
| Simplicity | Less boilerplate than any other framework | Smaller ecosystem, fewer patterns to follow |
| DX | Reactive by default, scoped styles, transitions built in | Fewer IDE tools, smaller community for help |
| Bundle size | 5-10x smaller than React equivalents for small apps | Gap narrows for very large apps |

## Anti-Patterns

| Anti-Pattern | Description | Risk |
|-------------|-------------|------|
| React patterns in Svelte | Using React-like state management instead of Svelte stores | Fighting the framework, unnecessary complexity |
| Ignoring SvelteKit | Building custom SSR/routing instead of using SvelteKit | Reinventing solved problems |
| Over-engineering state | Complex store patterns for simple data flow | Svelte's reactivity handles most cases without stores |
