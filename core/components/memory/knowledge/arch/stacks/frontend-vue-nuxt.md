# Vue + Nuxt.js

Progressive JavaScript framework with server-side rendering, auto-imports, and a gentle learning curve.

**Search patterns:** Vue, Nuxt, composition API, Nitro, frontend, SSR, SSG, Vue 3, Pinia, progressive framework

## When to Choose

Vue + Nuxt is ideal when the team values simplicity, gentle learning curves, and convention-over-configuration. Vue's template syntax is more approachable than JSX for teams with HTML/CSS backgrounds. Nuxt provides SSR, SSG, and API routes similar to Next.js but with Vue's reactivity system. Choose when: team prefers Vue's template model, the project needs SSR/SSG, or the team includes designers who contribute to frontend code. PP-1 = 3-4 (Business/Consumer) benefits from Vue's approachable component model. Strong in the European and Asian developer communities.

## When to Avoid

Avoid when the team knows React — switching frameworks for a project is rarely justified. Avoid for complex enterprise frontends where Angular's opinionated structure provides better governance. The Vue ecosystem is smaller than React's — some third-party integrations may not have Vue adapters. Avoid if hiring for Vue is difficult in your market.

## Scale Profile

| Dimension | Sweet Spot | Stretch | Break Point |
|-----------|-----------|---------|-------------|
| Team size | 1-20 | 20-50 | > 50 (component library governance needed) |
| Complexity | Simple to moderate SPAs/SSR apps | Complex dashboards | Very complex state (consider Angular) |

## Key Components

| Component | Options | Selection Guidance |
|-----------|---------|-------------------|
| State | Pinia (official), Vuex (legacy) | Pinia for all new projects |
| Styling | Tailwind, UnoCSS, Vue scoped styles | Tailwind for utility-first; scoped styles for component isolation |
| Server | Nitro (built-in), custom API | Nitro handles SSR + API routes |
| Deployment | Vercel, Netlify, Cloudflare Pages, Docker | Vercel/Netlify for managed; Docker for control |

## Tradeoffs

| Aspect | Gain | Cost |
|--------|------|------|
| Learning curve | Gentlest of the major frameworks | Fewer senior Vue developers available |
| Template syntax | Familiar to HTML/CSS developers | Less flexibility than JSX for complex rendering |
| Ecosystem | Growing, high-quality core libraries | Smaller third-party ecosystem than React |
| Performance | Nuxt 3 + Nitro is very fast | Fewer performance optimization guides/tools than Next.js |

## Anti-Patterns

| Anti-Pattern | Description | Risk |
|-------------|-------------|------|
| Options API in new code | Using Vue 2 Options API when Composition API is available | Harder to reuse logic, less TypeScript support |
| Vuex in new projects | Using Vuex instead of Pinia | Unnecessary boilerplate, Vuex is legacy |
| Over-relying on mixins | Using mixins for code reuse instead of composables | Naming conflicts, implicit dependencies |
