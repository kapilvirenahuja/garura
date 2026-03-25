# Angular

Opinionated, enterprise-grade frontend framework with TypeScript-first design, dependency injection, and comprehensive tooling.

**Search patterns:** Angular, TypeScript, enterprise frontend, RxJS, dependency injection, NgModules, signals, Angular CLI, opinionated framework

## When to Choose

Angular excels in large enterprise applications where consistency, governance, and team onboarding matter more than flexibility. Its opinionated structure (modules, services, components, guards, interceptors) gives every team member the same mental model. Choose when: team > 15 on the frontend, the application is a complex internal tool or enterprise dashboard, TypeScript strictness is valued, or the organization has Angular expertise. PP-3 >= 4 (Role Hierarchy) with complex enterprise UX benefits from Angular's structured approach. PP-7 >= 4 (Regulated) industries often choose Angular for its governance-friendly architecture. NFR-2 >= 3 (Business Security) benefits from built-in XSS protection and strict CSP support.

## When to Avoid

Avoid for small teams (< 5) or MVPs — Angular's boilerplate slows down rapid prototyping. Avoid for content-heavy sites where SSR is primary (Next.js/Nuxt are better). Avoid if the team knows React or Vue — Angular's paradigm (DI, RxJS, decorators) is fundamentally different. The learning curve is the steepest of the major frameworks.

## Scale Profile

| Dimension | Sweet Spot | Stretch | Break Point |
|-----------|-----------|---------|-------------|
| Team size | 5-100 frontend developers | 100-500 | > 500 (micro-frontends needed) |
| Application complexity | High (enterprise dashboards, admin tools) | Very high | — |
| Codebase size | 50K-500K lines | 500K-2M | > 2M (module boundaries critical) |

## Key Components

| Component | Options | Selection Guidance |
|-----------|---------|-------------------|
| State | NgRx (Redux-like), Signals (new, built-in), NGXS, Akita | Signals for new projects; NgRx for complex state flows |
| SSR | Angular Universal, Analog.js | Analog.js for Nuxt-like experience; Universal for traditional |
| Styling | Angular Material, Tailwind, PrimeNG, custom | Material for Google aesthetic; PrimeNG for enterprise components |
| Testing | Karma/Jasmine (default), Jest, Cypress | Jest for unit; Cypress for E2E |

## Tradeoffs

| Aspect | Gain | Cost |
|--------|------|------|
| Consistency | Every Angular app looks the same structurally | Less flexibility for creative solutions |
| TypeScript | First-class TypeScript, strictest typing of major frameworks | Verbose compared to Vue/React |
| Enterprise readiness | DI, modules, interceptors, guards — enterprise patterns built in | Steep learning curve, verbose boilerplate |
| RxJS | Powerful reactive programming for complex async flows | RxJS has its own learning curve on top of Angular |
| Long-term maintenance | Structure prevents spaghetti at scale | Initial development is slower than React/Vue |

## Anti-Patterns

| Anti-Pattern | Description | Risk |
|-------------|-------------|------|
| Component god-class | Single component with 1000+ lines, doing everything | Unmaintainable, untestable |
| Subscribe without unsubscribe | Memory leaks from unmanaged RxJS subscriptions | Performance degradation over time |
| NgModules for everything (post-v14) | Not using standalone components when available | Unnecessary boilerplate in modern Angular |
| Ignoring lazy loading | Loading entire app upfront | Slow initial load, poor user experience |
