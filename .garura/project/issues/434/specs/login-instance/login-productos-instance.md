# ProductOS instance — "Acme Identity" (Authentication), full, backend included

**Purpose — stress test.** This is a complete, populated ProductOS instance for
an authentication product. Hand it to a fresh agent and say: *build this.*
Everything an implementer needs — UX, backend, data, APIs, NFR targets, quality
gates — should be derivable from what's below. If the agent has to ask for
something that isn't here, that's a schema gap, and that's what we're hunting
before we build the plays.

It conforms to the v1 ProductOS schemas at
`core/components/memory/standards/schemas/product-os/`.

---

## The graph

```
PRODUCT: acme-identity  ── profile (the box) ── governed by ── decisions
DOMAIN: Identity
└─ CAPABILITY: Authentication (Login)        ── ice + 5 intents + personas + journeys
   ├─ FUNCTIONALITY: Email & Password         ── ice  ── epic E1 [temporary]
   ├─ FUNCTIONALITY: Enterprise SSO           ── ice
   └─ FUNCTIONALITY: MFA                      ── ice
```

---

## 1. Profile — the box

```yaml
profile:
  product_ref: acme-identity
  state: set
  shape:
    stage: public
    users: public
    monetization: none          # auth itself isn't monetized
    surfaces: [web, api]
  nfr:
    performance:    { level: high,   gate: "auth API p99 latency (SLO tracked)" }
    security:       { level: xhigh,  gate: "OWASP ASVS L2; no P1/P2; MFA; breach detection" }
    accessibility:  { level: high,   gate: "WCAG 2.1 AA on all auth screens" }
    scalability:    { level: medium, gate: "10x current sign-ins without redesign" }
    reliability:    { level: high,   gate: "99.99% uptime (four-nines)" }
    privacy:        { level: high,   gate: "PII encrypted at rest + in transit; GDPR export/delete" }
    observability:  { level: medium, gate: "auth-event tracing + error/anomaly rates" }
    maintainability:{ level: medium, gate: "no module > 500 lines; lint clean" }
  compliance: [GDPR]
  quality_vision:
    statement: "The front door: nobody wrong gets in, nobody right gets shut out."
    gates:
      - "OWASP ASVS L2; no P1/P2 security findings"
      - "WCAG 2.1 AA on every auth screen"
      - "99.99% uptime for auth-api"
      - "credentials hashed argon2id; never logged"
      - "GDPR data export + delete supported"
```

## 2. Domain

```yaml
node: { id: d-id, type: domain, name: Identity, parent: null,
        summary: "Who the users are and how they prove it." }
```

## 3. Capability: Authentication (Login)

```yaml
node:
  id: c-auth
  type: capability
  name: Authentication
  parent: d-id
  summary: "Let returning users prove who they are and get a session."
  ice_ref: i-auth
  depends_on: []

ice:                       # i-auth
  node_ref: c-auth
  intent:
    goals:
      - G1: "returning users sign in fast and safely"        # keep bad actors out
      - G2: "legitimate users are never wrongly shut out"    # let good actors in
    constraints:
      - C1: "credentials never stored or logged in plaintext; hashed with argon2id"
      - C2: "credential checks constant-time; no response reveals whether an email exists"
      - C3: "lock account after 5 failed attempts; auto-clear after 15 min; rate-limit per IP"
      - C4: "sessions expire after 30 min idle; refresh tokens rotate and are revocable"
      - C5: "methods in scope: email+password, Google (OIDC), enterprise SAML SSO; no passwordless"
    failures:
      - F1: "account takeover (stuffing, brute force, stolen/replayed token)"
      - F2: "a legitimate user permanently locked out with no path back"
      - F3: "credentials or tokens leak into logs, errors, URLs, analytics"
      - F4: "user enumeration via differential responses or timing"
      - F5: "session fixation or token replay grants access after logout/expiry"
  context:
    persona: [password-user, enterprise-sso-user]
    systems: [auth-api, token-service, user-store, session-store, federation, email-provider, secrets-manager]
    scope: ["email+password + Google + SAML", "single tenant per org", "lock after 5 fails",
            "no remember-me on shared devices"]
  expectations:
    outcomes:
      - "valid credential -> session issued; invalid -> never"               # G1
      - "a real user always has a path back in; no permanent false lockout"  # G2
  nfr_needs:                # concrete, under the box
    security: "argon2id; per-account lockout; per-IP rate limit; RS256 rotating keys; refresh reuse detection"
    reliability: "auth-api >= 99.99% (multi-AZ, N replicas)"
    performance: "POST /auth/login p99 < 150ms; token verify < 5ms"
    privacy: "PII encrypted; passwords never logged; GDPR export/delete"
  compliance_needs: [GDPR]
```

## 4. Functionalities (each its own node + ICE)

```yaml
# F: Email & Password
node: { id: f-pw, type: functionality, name: "Email & Password", parent: c-auth, ice_ref: i-pw }
ice:
  node_ref: i-pw
  intent:
    goals: ["a user with a valid email+password is issued a session"]
    constraints: ["argon2id", "constant-time compare", "lockout after 5 fails"]
    failures: ["timing attack reveals email existence", "brute force succeeds"]
  context:
    persona: [password-user]
    systems: [auth-api, user-store, session-store, token-service]
    scope: ["email+password only; 5-attempt lockout; no remember-me on shared devices"]
  expectations:
    outcomes: ["valid email+password -> session", "5 bad attempts -> 15-min lock"]
  nfr_needs: { performance: "p99 < 150ms", security: "argon2id; lockout; rate-limit" }

# F: Enterprise SSO
node: { id: f-sso, type: functionality, name: "Enterprise SSO", parent: c-auth, ice_ref: i-sso, depends_on: [] }
ice:
  node_ref: i-sso
  intent:
    goals: ["a user from a configured org signs in via their IdP (OIDC/SAML)"]
    constraints: ["validate IdP signature + audience", "JIT-provision on first login"]
    failures: ["assertion replay", "wrong-org user admitted"]
  context:
    persona: [enterprise-sso-user]
    systems: [auth-api, federation, user-store]
    scope: ["OIDC (Google) + SAML 2.0", "per-org IdP config"]
  expectations:
    outcomes: ["valid signed assertion -> session", "user mapped/provisioned to the right org"]
  nfr_needs: { security: "signature + audience validation; assertion replay protection" }

# F: MFA
node: { id: f-mfa, type: functionality, name: "MFA", parent: c-auth, ice_ref: i-mfa }
ice:
  node_ref: i-mfa
  intent:
    goals: ["a second factor is required when the profile/risk calls for it"]
    constraints: ["TOTP + SMS OTP", "OTP single-use, 30s window, rate-limited"]
    failures: ["OTP brute force", "factor bypass"]
  context:
    persona: [password-user, enterprise-sso-user]
    systems: [auth-api, email-provider, user-store]
    scope: ["TOTP (authenticator) + SMS OTP; enrollment + recovery codes"]
  expectations:
    outcomes: ["correct second factor -> session", "wrong OTP x5 -> challenge lockout"]
  nfr_needs: { security: "xhigh — OTP single-use + rate-limited" }
```

## 5. Capability intents (the 5 realize lenses)

```yaml
# ux
intent: { capability_ref: c-auth, type: ux,
  summary: "Calm, fast, accessible auth screens.",
  body: "Screens: sign-in (email+password + SSO buttons), MFA challenge, locked, error.
         States per screen: idle / submitting / error / locked. Inline validation, no
         dead-ends (always a recovery path). WCAG 2.1 AA, 44px targets, visible focus.
         Built with the Primitive->Block->Card frontend pattern (see KB
         technology/frontend-component-orchestration); static web tier on CDN." }

# architecture  (THE BACKEND)
intent: { capability_ref: c-auth, type: architecture,
  summary: "Stateless auth API; Postgres identity, Redis sessions; federated SSO; defence-in-depth.",
  body: |
    Components
    - web (static, CDN) — login UI
    - auth-api — stateless service (TypeScript + Fastify) behind a load balancer, N replicas, multi-AZ
    - token-service — JWT issue/verify (RS256), refresh rotation + reuse detection; signing keys in secrets-manager
    - user-store — Postgres (managed, multi-AZ): identity + credentials + federation + MFA
    - session-store — Redis (HA): refresh tokens, lockout counters, rate-limit buckets
    - federation — OIDC (Google) + SAML 2.0 (per-org enterprise IdP)
    - email/SMS provider — verification + MFA OTP
    - audit-log — append-only store for auth events (compliance + breach detection)

    Data model (Postgres)
    - users(id, email citext unique, status, org_id, created_at)
    - credentials(user_id FK, password_hash argon2id, updated_at)
    - oauth_identities(user_id FK, provider, subject, unique(provider,subject))
    - saml_orgs(org_id, idp_metadata, cert)
    - mfa_factors(user_id FK, type, secret_ref, verified_at)
    - recovery_codes(user_id FK, code_hash, used_at)
    - audit_log(id, user_id, event, ip, user_agent, ts)   # append-only
    (refresh tokens, lockout counters, rate-limit buckets live in Redis, TTL'd)

    API (auth-api)
    - POST /auth/login                email+password -> {session} | {mfa_challenge}
    - POST /auth/mfa/verify           otp -> {session}
    - GET  /auth/sso/{provider}       start OIDC/SAML
    - GET  /auth/sso/{provider}/cb    assertion/callback -> {session}
    - POST /auth/refresh              rotate refresh token -> {session}
    - POST /auth/logout               revoke current | all sessions
    - POST /auth/recovery             start account recovery (-> Account Recovery capability)

    NFR realization (how the box is met)
    - security xhigh: argon2id; constant-time compare; per-account lockout (Redis 5/15min) +
      per-IP rate limit; RS256 rotating keys; refresh rotation + reuse detection; PII encrypted;
      audit-log + anomaly hooks; SSO signature/audience validation + replay protection
    - reliability four-nines: stateless api x N, multi-AZ Postgres failover, Redis HA, health checks
    - performance p99<150ms: Redis session lookups; indexed citext email; public key cached for verify
    - privacy/GDPR: data export + delete endpoints; minimal PII in logs

    Build order: data model -> auth-api password core -> token-service -> lockout/rate-limit ->
    SSO -> MFA -> audit/anomaly -> GDPR export/delete." }

# delivery
intent: { capability_ref: c-auth, type: delivery,
  summary: "Trunk-based, env-gated rollout.",
  body: "Envs: dev -> staging -> prod. Feature-flag SSO and MFA. Blue/green for auth-api.
         Secrets via secrets-manager, never in repo. DB migrations gated and reversible." }

# quality
intent: { capability_ref: c-auth, type: quality,
  summary: "Security + reliability are the bar.",
  body: "Unit + integration tests on every flow; auth fuzzing; OWASP ASVS L2 review; load test
         to 10x; chaos test AZ failover; a11y audit (axe) on screens. Gates = profile.quality_vision." }

# agentic
intent: { capability_ref: c-auth, type: agentic,
  summary: "Anomaly + breach detection.",
  body: "An agent watches the audit-log for credential-stuffing / impossible-travel / spray
         patterns and raises step-up MFA or temporary blocks. Read-only on identity; acts via
         the lockout + MFA mechanisms, never bypasses them." }
```

## 6. Decisions (the box moves + a stack call)

```yaml
- decision: { id: dec-101, level: product, node_ref: c-auth, status: accepted,
    title: "Raise security boundary to xHigh",
    reason: "Login is the takeover target; the general high bar under-protects credentials.",
    alternatives: [{ name: "keep high", why_not: "leaves credential handling weak" }] }

- decision: { id: dec-102, level: product, node_ref: c-auth, status: accepted,
    title: "Raise reliability boundary to four-nines",
    reason: "Auth down = whole product down; three-nines is not enough for the entry point.",
    alternatives: [{ name: "three-nines", why_not: "auth outage = total outage" }] }

- decision: { id: dec-103, level: capability, node_ref: c-auth, status: accepted,
    title: "TypeScript + Fastify + Postgres + Redis for the auth stack",
    reason: "Team is TS-fluent; managed Postgres/Redis meet four-nines without ops burden.",
    alternatives: [{ name: "Python/FastAPI", why_not: "team less fluent; no decisive edge here" }] }
```

## 7. Epic (one vertical slice to build first)

```yaml
epic:
  id: E1
  functionality_ref: f-pw
  title: "Email & password login, end to end"
  slice: "A user with a valid email+password gets a session; 5 bad tries locks for 15 min."
  context:
    persona: [password-user]
    systems: [web, auth-api, user-store, session-store, token-service]
    scope: ["email+password only; lockout; no SSO/MFA in this slice"]
  acceptance:
    - "valid credentials return a signed session token (RS256), p99 < 150ms"
    - "invalid credentials return a generic error in constant time (no enumeration)"
    - "5 failed attempts lock the account for 15 minutes; a real user can still recover"
    - "credentials are argon2id-hashed; never appear in logs"
  depends_on: []
  status: ready
```

## 8. Personas & journeys (brief)

```yaml
persona: { id: p-pw,  name: "Password user",       node_ref: c-auth, description: "Has an email+password account." }
persona: { id: p-sso, name: "Enterprise SSO user", node_ref: c-auth, description: "Signs in through their employer's IdP." }
journey: { id: j-1, name: "First-time SSO sign-in", persona_ref: p-sso, node_ref: c-auth,
           steps: ["click 'Sign in with SSO'", "redirect to org IdP", "authenticate", "return + JIT-provision", "land signed-in"] }
```

---

## What this stress-tests

Hand the above to a fresh agent. It should be able to stand up the auth-api,
the Postgres schema, the Redis usage, the token-service, the password-login
endpoint, and the login screen — and know the bar (xHigh security, four-nines,
p99 < 150ms, WCAG AA, GDPR) without asking. Where it stalls or guesses is
exactly the schema gap to fix before the plays exist.
