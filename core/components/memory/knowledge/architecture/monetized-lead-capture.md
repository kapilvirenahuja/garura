---
id: architecture/monetized-lead-capture
title: "Monetized: add user-management, email, payments"
conditions:
  stage: monetized
  users: public
  persistence: full
  monetization: lead-capture
evolve_when: []
provenance: seeded
---

# Monetized: add user-management, email, payments

## Topic
Architecture once the product captures leads or charges money.

## Conditions
Public users, content fully persisted, and monetization has arrived — a paywall,
an email-gated download, or paid plans.

## Recommendation
- Capabilities: bring in user-management (authentication, email capture), email
  sending, and payments. These are the capabilities monetization forces.
- Architecture: front end + CDN, a backend and database, plus identity/auth, an
  email/SMS provider, and a payment integration. Secrets management becomes
  real now.

## Rationale
Monetization and lead capture require identity (who is paying / who gave their
email), a channel to reach them, and a way to take money. Each maps to a
capability that wasn't worth its operational cost at earlier rungs but is now
load-bearing.

## Evolve when
End of the seeded ladder. Further evolution (scale, multi-tenant, compliance)
becomes its own learnings as we build them.

## Provenance
seeded (#434 worked example — the simulator ladder)
