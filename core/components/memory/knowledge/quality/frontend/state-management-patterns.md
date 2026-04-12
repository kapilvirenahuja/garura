# Frontend State Management Patterns
<!-- knowledge-file: tier=2 scope=core -->

**When this applies:** Reviewing state architecture decisions in frontend applications
**When this does NOT apply:** Applications with no client-side state (static sites, pure SSR)
**Search patterns:** state management, global state, local state, React Query, SWR, Apollo, Redux, Zustand, Jotai, form state, URL state, optimistic updates, state normalization, server state
**Provenance:** Issue #200 — quality-check skill
**Created:** 2026-04-12

## Content

Covers the classification and placement of state — distinguishing server state from UI state, local from global, and evaluating how well the chosen patterns fit the application's needs. Universal check — not QP-indexed.

### Assessment Checklist

| ID | Check Item | QP Level | Measurement | Tool Reference |
|----|-----------|----------|-------------|----------------|
| FE-19 | Server state managed via a dedicated caching library (React Query, SWR, Apollo Client) — not stored manually in Redux/Zustand | L3 | Search for `useEffect` + `useState` for data fetching without a caching layer | Manual review, grep |
| FE-20 | Global state contains only truly shared state — no per-component ephemeral state promoted to global | L3 | Audit global store shape; flag state consumed by only one component | Redux DevTools, Zustand devtools |
| FE-21 | Form state managed by a form library (React Hook Form, Formik, VeeValidate) — not manual `useState` per field | L3 | grep `useState` near `<form` or `<input` in non-trivial forms | Manual review |
| FE-22 | Shareable/bookmarkable UI state (filters, search, pagination) reflected in URL | L3 | Check list/search pages for query param synchronization | Manual review |
| FE-23 | Normalized state shape for relational data — no duplicate object graphs in store | L4 | Review store for arrays of nested objects that are referenced in multiple places | Redux DevTools, manual review |
| FE-24 | Optimistic updates implemented for user-visible mutations (create, delete, toggle) | L4 | Check mutation handlers for optimistic rollback on error | Manual review |
| FE-25 | No stale closure bugs — event handlers and effects reference current state via refs or dependency arrays | L3 | Review `useEffect` and `useCallback` dependency arrays | eslint-plugin-react-hooks |
| FE-26 | Cache invalidation strategy defined — stale data doesn't persist after mutations | L3 | Review query invalidation calls after mutations; check TTL/stale-time config | React Query DevTools |

### Anti-Patterns

| Anti-Pattern | Description | Risk |
|-------------|-------------|------|
| Fetching in Redux thunks and caching manually | Reimplementing React Query / SWR with custom loading/error/data state in Redux | Maintenance burden, stale data, missing deduplication |
| Empty dependency array on non-static effects | `useEffect(() => fn(), [])` when `fn` uses state that changes | Stale closure, silent bugs |
| All state global by default | Every piece of state lifted to the global store without evaluating if it's truly shared | Unnecessary complexity, re-renders across unrelated components |
| No loading/error states on async operations | Mutations fire and UX assumes success without handling failure | Silent failures, confused users |
| Polling as a substitute for invalidation | Using `refetchInterval` to cover missing cache invalidation logic | Unnecessary network traffic, stale windows |

## Why It Matters

State bugs are among the hardest to reproduce and debug. Misusing global state causes cascading re-renders and makes components impossible to test in isolation. Server state that bypasses a caching layer is always inconsistent.

## Applicability Boundaries

**In scope:** SPAs, SSR apps with client-side interactivity, React/Vue/Angular/Svelte
**Out of scope:** Pure static sites with no client-side data fetching; server-rendered apps with minimal JS

## Rationale

State management debt compounds fast. The patterns here reflect industry convergence on what works — server state libraries for remote data, minimal global state for shared UI, URL for navigational state.

## Decay Tracking

**Last validated:** 2026-04-12
**Confidence:** high
**Staleness window:** 180 days
**Supersedes:** null
