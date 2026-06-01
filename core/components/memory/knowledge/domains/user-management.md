---
id: domains/user-management
title: "User Management: capabilities and when to include each"
conditions:
  trigger: "the product needs accounts, login, profiles, roles, or access control"
  stage: any
provenance: seeded
---

# User Management: capabilities and when to include each

## Topic
The user-management domain — identity, access, and account lifecycle.

## Conditions
The product has users who need accounts, sign-in, profiles, roles, or access
control. Applies at any stage; which capabilities you include depends on the
product's conditions (see Recommendation).

## Recommendation
Include capabilities as the conditions demand them — not all at once:

- **Authentication** — when users must sign in.
  - Email & password — own credential login (the default for most products).
  - Social login — when users should reuse a Google/Apple/etc. identity.
  - MFA — when security needs a second factor.
  - Passwordless — when you want to avoid passwords entirely.
  - Enterprise SSO — only when serving organizations with their own IdP.
- **Registration** — when users create their own accounts.
  - Self sign-up; invite-based (B2B/teams); email verification.
- **Profile Management** — when users have data or preferences they manage.
- **Authorization & Roles** — when different users get different access.
  - RBAC first; fine-grained permissions only when roles aren't enough.
- **Account Recovery** — with any credential-based auth.
  - Password reset; account unlock.
- **Session Management** — when users stay signed in across requests.
  - Session/token lifecycle; logout-everywhere for security events.

## Rationale
Identity is the most over-built domain. Start with the minimum — usually
email/password plus recovery plus sessions — and add MFA, SSO, and fine-grained
permissions only when a real condition (security posture, enterprise customers,
complex access) forces them. Adding them early is cost without payoff.

## Evolve when
- Enterprise customers appear → add Enterprise SSO.
- A security or compliance bar rises → add MFA, tighten session policy.
- Access rules outgrow roles → add fine-grained permissions.

## Provenance
seeded (#434 — first domain-shelf example)
