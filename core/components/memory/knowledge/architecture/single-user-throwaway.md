---
id: architecture/single-user-throwaway
title: "Single-user throwaway: static on GCP, no backend"
conditions:
  stage: prototype
  users: one
  persistence: none
  monetization: none
evolve_when:
  - architecture/internal-product-persistence
  - architecture/monetized-lead-capture
provenance: seeded
---

# Single-user throwaway: static on GCP, no backend

## Topic
Architecture for an early prototype / simulator.

## Conditions
A throwaway prototype for one internal teammate. Nothing to persist, no
monetization, the goal is a quick demo and fast iteration.

## Recommendation
- Capabilities: just the simulator UI — no user-management, no payments.
- Architecture: a design system matching the product; static HTML/JS hosted on
  GCP static hosting behind a CDN. No database, no backend, no auth.

## Rationale
Fastest path to a usable demo with nothing to operate. A backend or a database
here is pure cost with no payoff while there is one user and nothing to persist.
The only thing that matters is that it looks right, so spend the effort on the
design system.

## Evolve when
- The product must persist content for real users → climb to
  [Internal product: add backend + datastore](./internal-product-persistence.md).
- Monetization or lead capture appears (paywall, email-gated download) → climb to
  [Monetized: add user-management, email, payments](./monetized-lead-capture.md).

## Provenance
seeded (#434 worked example — the simulator ladder)
