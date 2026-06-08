---
id: domains/user-management
title: "User Management: capabilities and when to include each (profile-driven)"
conditions:
  trigger: "the product needs accounts, login, profiles, roles, or access control"
  selection_keys: [shape.users, shape.surfaces, nfr.security, nfr.accessibility, compliance]
provenance: seeded
---

# User Management: capabilities and when to include each

## Topic
The user-management domain — identity, access, and account lifecycle. WHICH
capabilities and functionalities to include is decided by the product profile
(see the product-profile schema), not by default.

## Conditions
The product has users who need accounts, sign-in, profiles, roles, or access
control. Which pieces you include is driven by the profile dimensions named in
each rule below — the user base, the surfaces, security, accessibility, and
compliance.

## Intents this domain captures
Intent-first (standard shelf section): lead with what the user and the operator are
trying to do; the capabilities below serve these.

**User intents**
- **Get in** — "sign in or sign up" → authentication, registration.
- **Prove it's me** — "verify my identity" → MFA, email/identity verification.
- **Recover access** — "I'm locked out" → account recovery (reset, unlock).
- **Manage myself** — "update my profile and preferences" → profile management.
- **Stay signed in safely** — "keep me in across requests, securely" → session management.
- **Control my access & data** — "manage consent and what's shared" → preferences, consent.

**Operator intents**
- **Control who can do what** — "roles and permissions" → authorization & roles (RBAC, fine-grained).
- **Keep accounts secure** — "MFA, revoke sessions, detect abuse" → security policy, logout-everywhere.
- **Stay compliant** — "audit and consent records" → auth-event audit logging.

## Capabilities
Read each line as "include X when {profile condition}". Start at the floor; add
only when a profile dimension calls for it.

- **Authentication** — include when users sign in.
  - Email & password — the default credential login (the floor).
  - Social login — when `shape.users: public` and signup friction matters.
  - MFA — when `nfr.security >= high`, or `compliance` includes SOC2 / HIPAA / PCI-DSS.
  - Passwordless — when `nfr.security >= high` and you want to remove password risk entirely.
  - Enterprise SSO — when the user base is organizations (B2B), or `compliance` requires federated identity.
- **Registration** — include when users create accounts.
  - Self sign-up — `shape.users: public`.
  - Invite-based — B2B / teams (`shape.users: small-team` or org).
  - Email verification — when `nfr.security >= medium`, or any `compliance` regime is in force.
- **Profile Management** — include when users manage their own data or preferences.
  - Level 1 — basic attributes: core identity + PII, a **structured** model. The floor — whenever the product holds user profiles.
  - Level 2 — extended attributes (address, etc.): **structured**, optional. Add when `shape.monetization: paywall` (shipping/billing) or `compliance` needs fuller identity.
  - Level 3 — enhanced attributes (preferences, etc.): **non-structured** (NoSQL-type), to extend into a graph. Add when `personalization` / `experience` needs preference signals.
- **Authorization & Roles** — include when different users get different access.
  - RBAC — the default once roles exist.
  - Fine-grained permissions — when `nfr.security >= high`, or access rules outgrow roles.
- **Account Recovery** — include with any credential-based auth.
  - Password reset — the floor; any credential login.
  - Unlock — when a lockout policy is in force (`nfr.security >= medium`).
  - Auto-unlock — when `nfr.security >= high`, or to cut support load (timed / self-service).
  - Multi-channel support — when `shape.surfaces` spans more than one, or `shape.users: public`.
- **Session Management** — include when users stay signed in across requests.
  - Logout everywhere — when `nfr.security >= high` (revoke all sessions on a security event).
  - Auth-event audit logging — when any `compliance` regime, or `nfr.security >= high`.
- **Accessible auth UI** — when `shape.surfaces` includes web/mobile and `nfr.accessibility >= high` (WCAG 2.1 AA on every auth screen).

## Rationale
Identity is the most over-built domain, and the profile is what keeps it honest.
The floor is email/password plus recovery plus sessions. MFA, SSO, passwordless,
fine-grained permissions, and audit logging each cost real effort and only earn
it when a profile dimension — security, compliance, or an enterprise user base —
calls for them. Tying every include-rule to a named profile dimension is what
turns this from a vague catalog into a defensible selection.

## Evolve when
- `nfr.security` rises, or a `compliance` regime is added → add MFA, audit
  logging, and tighten session policy.
- The user base shifts toward organizations → add Enterprise SSO.
- Access rules outgrow roles → add fine-grained permissions.

## Provenance
seeded (#434 — domain-shelf example, profile-driven selection)
