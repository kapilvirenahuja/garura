# Frontend Accessibility and Performance
<!-- knowledge-file: tier=2 scope=core -->

**When this applies:** Reviewing or auditing frontend code for WCAG 2.1 AA compliance and Core Web Vitals
**When this does NOT apply:** Backend-only codebases or CLI tools with no UI layer
**Search patterns:** accessibility, a11y, WCAG, ARIA, keyboard navigation, Core Web Vitals, LCP, CLS, FID, INP, bundle size, lazy loading, image optimization, performance budget
**Provenance:** Issue #200 — quality-check skill
**Created:** 2026-04-12

## Content

Covers the intersection of accessibility compliance and runtime performance — two dimensions that are frequently checked together during frontend quality reviews. QP-6 applies to this file (accessibility mandate). Performance checks apply universally.

### Assessment Checklist

| ID | Check Item | QP Level | Measurement | Tool Reference |
|----|-----------|----------|-------------|----------------|
| FE-01 | All `<img>` elements have meaningful `alt` text (empty `alt=""` for decorative) | L2 | grep `<img` without `alt=` | axe-core, Lighthouse |
| FE-02 | Interactive elements are keyboard-reachable and have visible focus indicators | L3 | Tab through UI manually; check `:focus-visible` styles | axe-core, keyboard test |
| FE-03 | Color contrast ratio meets AA (4.5:1 for normal text, 3:1 for large text) | L3 | DevTools contrast checker or Lighthouse | Lighthouse, axe-core |
| FE-04 | ARIA roles, states, and properties are used correctly and not overriding native semantics | L4 | grep `aria-` and audit against WAI-ARIA spec | axe-core |
| FE-05 | Semantic HTML elements used (`<nav>`, `<main>`, `<header>`, `<button>` vs `<div>`) | L2 | Review component output markup | Manual review |
| FE-06 | Largest Contentful Paint (LCP) < 2.5s on median device | L3 | Lighthouse performance audit in CI | Lighthouse CI |
| FE-07 | Cumulative Layout Shift (CLS) < 0.1 — no layout shifts without user interaction | L3 | Lighthouse, WebPageTest | Lighthouse CI |
| FE-08 | JavaScript bundle size per route < 200KB (compressed) | L4 | `next build` output, `bundlephobia`, `source-map-explorer` | webpack-bundle-analyzer |
| FE-09 | Images served in modern formats (WebP/AVIF), with `width` and `height` set | L3 | Inspect network tab, grep `<img` without dimensions | Lighthouse |
| FE-10 | Automated accessibility tests run in CI (at minimum axe-core smoke tests) | L5 | CI pipeline config; jest-axe or Playwright axe integration | jest-axe, @axe-core/playwright |

### Anti-Patterns

| Anti-Pattern | Description | Risk |
|-------------|-------------|------|
| `aria-label` on every element | Adding ARIA labels to elements that already have visible text doubles announcements for screen readers | Confusing screen reader experience |
| `onClick` on non-interactive elements | Using `div` or `span` with click handlers instead of `button` or `a` | Keyboard-inaccessible, no role announced |
| Unoptimized third-party scripts loaded synchronously | Analytics, chat widgets, or ads blocking the main thread at startup | LCP and INP degradation |
| No font-display strategy | Web fonts block rendering without `font-display: swap` or preloading | Flash of invisible text (FOIT) |
| Importing entire icon libraries | `import * from 'react-icons'` when only 3 icons are needed | Massive bundle size increase |

## Why It Matters

Accessibility failures exclude users and create legal exposure (ADA, EAA). Performance failures abandon users — 53% of mobile users leave pages that take more than 3 seconds to load. Both dimensions share a common root: thoughtful markup and minimal payload.

## Applicability Boundaries

**In scope:** Web frontends (React, Vue, Angular, Svelte, plain HTML), mobile web
**Out of scope:** Native mobile apps (iOS/Android accessibility is a separate checklist), email templates

## Rationale

These checks represent the minimum bar for a production-ready web frontend. Accessibility and performance are cross-cutting concerns that cannot be retrofitted cheaply — they must be assessed continuously.

## Decay Tracking

**Last validated:** 2026-04-12
**Confidence:** high
**Staleness window:** 180 days
**Supersedes:** null
