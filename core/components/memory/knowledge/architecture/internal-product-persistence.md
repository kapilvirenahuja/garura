---
id: architecture/internal-product-persistence
title: "Internal product: add a backend and a datastore"
conditions:
  stage: internal
  users: small-team
  persistence: some
  monetization: none
evolve_when:
  - architecture/monetized-lead-capture
provenance: seeded
---

# Internal product: add a backend and a datastore

## Topic
Architecture once a prototype becomes a real internal product.

## Conditions
A small team relies on it, and it now has content that must survive between
sessions. Still not monetized and not open to the public.

## Recommendation
- Capabilities: the product features plus basic persistence; still no payments,
  light or no user-management (internal SSO at most).
- Architecture: keep the static front end + CDN, but add a small backend and a
  managed datastore. Prefer a managed database over self-hosting. No heavy
  infrastructure yet.

## Rationale
The trigger was persistence, so add exactly that — a backend and a store — and
nothing more. The earlier static-only setup can't keep state; jumping straight
to a full platform would over-build for a small internal team.

## Evolve when
- Monetization or public lead capture appears → climb to
  [Monetized: add user-management, email, payments](./monetized-lead-capture.md).

## Provenance
seeded (#434 worked example — the simulator ladder)
