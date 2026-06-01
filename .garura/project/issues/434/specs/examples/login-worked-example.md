# Worked example — Login: the box, the specifics, and a boundary push

A public SaaS that needs accounts. This walks the model end to end on one
capability — Login — showing what the **profile (the box)** holds, what **ICE
(the specifics)** holds, and what happens when a capability **pushes the box**.

---

## 1. The box — product profile (level + gate per dimension)

`/vision` set this directionally; `/understand` firmed the levels and gates. Each
NFR dimension carries a **level** (the bar) and a **gate** (how it's measured).

```yaml
profile:
  product_ref: acme-saas
  state: derived
  shape:
    stage: public
    users: public
    monetization: paywall
    surfaces: [web, api]
  nfr:                       # the box — level + gate, NOT concrete numbers
    performance:   { level: high,   gate: "p99 page load" }
    security:      { level: high,   gate: "OWASP ASVS L2; no P1/P2 findings" }
    accessibility: { level: high,   gate: "WCAG 2.1 AA" }
    reliability:   { level: high,   gate: "99.9% uptime (three-nines)" }
    privacy:       { level: high,   gate: "PII encrypted at rest + in transit" }
    scalability:   { level: medium, gate: "handles 10x current load" }
    observability: { level: medium, gate: "request tracing + error rates" }
    maintainability:{ level: medium, gate: "no module > 500 lines; lint clean" }
  compliance: [GDPR]
  quality_vision:
    statement: "Trustworthy, fast, accessible SaaS."
    gates: [ "p99 page load", "OWASP ASVS L2; no P1/P2", "WCAG 2.1 AA",
             "99.9% uptime", "PII encrypted at rest + in transit" ]
```

The box says, for example: performance is **high**, measured at **p99**;
reliability is **high**, gated at **three-nines**. It does not say "300ms" —
that's not the box's job.

---

## 2. The specifics — Login capability ICE (concrete, under the box)

`/understand` filled this. `nfr_needs` are **concrete targets for this
capability**, each meant to sit under the box's bar.

```yaml
# capability node (product-os)
node:
  id: c-7f3a
  path: user-management.authentication
  type: capability
  name: Login
  parent: d-um
  ice_ref: i-7f3a

# Login ICE
ice:
  node_ref: c-7f3a
  intent:
    goals: ["returning users sign in fast and safely"]
    constraints: ["no plaintext credentials ever"]
    failures: ["account takeover", "lockout of legitimate users"]
  context:
    persona: [password-user, enterprise-sso-user]
    systems: [auth-service, user-store, token-service, email-provider, secrets-manager]
    scope: ["password + Google + SAML SSO", "single tenant", "30-min sessions",
            "lock after 5 failed attempts", "no remember-me on shared devices"]
  expectations:
    outcomes: ["a signed-in session issued on valid credentials"]
  nfr_needs:                 # CONCRETE — the real numbers for Login
    performance: "login page p99 < 300ms; token issue p99 < 150ms"   # under box (high@p99) ✓
    accessibility: "WCAG 2.1 AA on every auth screen"                 # meets box ✓
    privacy: "credentials hashed (argon2id), never logged"           # under box ✓
    security: "xhigh — credential handling, MFA, breach detection"   # ⚠ box is HIGH
    reliability: "auth-service uptime >= 99.99% (four-nines)"         # ⚠ box is three-nines
  compliance_needs: [GDPR]                                           # within box ✓
```

Most lines fit under the box and pass with no friction. Two do not.

---

## 3. The push — two specifics fall outside the box

Login is special: it's the front door, so it demands more than the product's
general bar.

- **security**: Login needs `xhigh`. The box ceiling is `high`. **Outside the box.**
- **reliability**: Login needs four-nines. The box gate is three-nines. **Outside the box.**

Per the rule, an out-of-box specific does not silently win and does not silently
get clamped. It **halts for human approval.** A human decides whether the
product should raise its bar to admit Login's need.

---

## 4. The approval — the box evolves, recorded as decisions

The human approves both. Each boundary move is an ADR (decision schema). The box
ceiling rises to admit the capability.

```yaml
- decision:
    id: dec-101
    level: product
    node_ref: c-7f3a
    title: "Raise the security boundary to xHigh"
    reason: "Login handles credentials and is the takeover target; the general
             high bar is insufficient for the front door."
    alternatives:
      - { name: "keep security at high", why_not: "leaves credential handling under-protected" }
    status: accepted

- decision:
    id: dec-102
    level: product
    node_ref: c-7f3a
    title: "Raise the reliability boundary to four-nines"
    reason: "If auth is down, the whole product is down; three-nines is not enough
             for the entry point."
    alternatives:
      - { name: "keep three-nines", why_not: "auth outage = total outage" }
    status: accepted
```

After approval the box looks like this (only the two moved lines shown):

```yaml
profile:
  nfr:
    security:    { level: xhigh, gate: "OWASP ASVS L2; no P1/P2; MFA; breach detection" }
    reliability: { level: high,  gate: "99.99% uptime (four-nines)" }
```

Login's specifics now sit inside the box. A future capability needing only
three-nines is fine — the box is a ceiling, not a floor.

---

## 5. Who populated what

| Thing | Where | Who |
|-------|-------|-----|
| Directional box (dimensions + rough levels) | profile | /vision |
| Firm levels + gates (high @ p99; three-nines) | profile | /understand (product level) |
| Login's concrete targets (300ms; argon2id; four-nines) | Login ICE | /understand |
| Out-of-box detection (xhigh, four-nines) | — | the validator at the box boundary |
| Approve and move the box | profile + decisions | human, recorded as ADRs |
| Functionality-level refinement of the targets | functionality ICE | /shape |
| Enforce the concretes against the gates at build/ship | — | /validate |

---

## 6. Same ICE vs multiple ICE — how the goals lay out

Rule: **one ICE per node.** A node's goals are the cohesive facets of *that
node's* intent and share its one ICE. Behaviors become child functionalities,
each with its own ICE. Different concerns become sibling capabilities, each with
its own ICE. So "more goals" is sometimes the same ICE and sometimes a new node.

The tree for Login, laid out:

```
domain: User Management
├── capability: Authentication (Login)        ← ONE ICE, multiple cohesive goals
│   ├── functionality: Email & Password        ← own ICE (build unit)
│   ├── functionality: Social Login            ← own ICE
│   ├── functionality: Enterprise SSO          ← own ICE
│   └── functionality: MFA                     ← own ICE
├── capability: Account Recovery               ← sibling, own ICE
├── capability: Session Management             ← sibling, own ICE
└── capability: Registration                   ← sibling, own ICE
```

### The capability ICE — one ICE, two cohesive goals

Both goals are facets of the same intent (let the right people in / keep the
wrong people out), so they live in the **same** ICE.

```yaml
ice:                       # i-7f3a — Authentication (Login) CAPABILITY ice
  node_ref: c-7f3a
  intent:
    goals:                 # what we want — facets of one intent
      - G1: "returning users sign in fast and safely"        # keep bad actors out
      - G2: "legitimate users are never wrongly shut out"    # let good actors in
    constraints:           # hard rules on HOW we may meet the goals
      - C1: "credentials never stored or logged in plaintext; hashed with argon2id"
      - C2: "credential checks run in constant time; no response reveals whether an email exists"
      - C3: "lock an account after 5 failed attempts; auto-clear after 15 min; rate-limit per IP"
      - C4: "sessions expire after 30 min idle; tokens are signed and revocable"
      - C5: "only the methods in scope — password + Google + SAML; no passwordless here"
    failures:              # the end-states that must NOT happen
      - F1: "account takeover — an attacker signs in as a user (stuffing, brute force, stolen token)"
      - F2: "a legitimate user is permanently locked out with no path back in"
      - F3: "credentials or tokens leak into logs, error messages, URLs, or analytics"
      - F4: "user enumeration — an attacker learns which emails are registered"
      - F5: "session fixation or token replay grants access after logout or expiry"
  context:                 # ONE shared context (binds both goals to this node)
    persona: [password-user, enterprise-sso-user]
    systems: [auth-service, user-store, token-service, secrets-manager]
    scope: ["password + Google + SAML SSO", "single tenant", "lock after 5 fails", "no remember-me on shared devices"]
  expectations:
    outcomes:              # pair with the goals
      - "valid credential -> session issued; invalid -> never"               # answers G1
      - "a real user always has a path back in; no permanent false lockout"  # answers G2
  nfr_needs:               # concrete, under the box
    security: "xhigh"
    reliability: "auth-service >= 99.99%"
    performance: "auth API p99 < 150ms"

# Note: goals, constraints, and failures are each ONE node-level set — there is
# not a constraint list per goal. They collectively bound this node's intent.
# They cross-relate: C3 (auto-clearing lockout) is how G2 is met and how F2 is
# avoided; C1/C2 guard G1 against F3/F4. Failures (F1-F5) are also what the
# recovery side keys off when something trips at build or runtime.
```

### A functionality ICE — its own ICE, one focused goal

Each behavior under Login is its **own** node with its **own** ICE — the build
unit. Note the goal narrows to exactly this functionality.

```yaml
ice:                       # i-pw — Email & Password Login FUNCTIONALITY ice
  node_ref: f-pw
  intent:
    goals: ["a user with a valid email + password is issued a session"]
    constraints: ["argon2id hashing", "constant-time credential compare"]
    failures: ["timing attack reveals whether an email exists"]
  context:
    persona: [password-user]
    systems: [auth-service, user-store]
    scope: ["email + password only; 5-attempt lockout; no remember-me on shared devices"]
  expectations:
    outcomes: ["valid email+password -> session; 5 bad attempts -> 15-min lock"]
  nfr_needs:
    performance: "token issue p99 < 150ms"   # concrete, under the box
    security: "xhigh"
```

(`Enterprise SSO`, `Social Login`, `MFA` each get the same treatment — their own
node, their own ICE, their own one-line goal.)

### The siblings — where the would-be "extra goals" actually went

These were tempting to bolt onto Login as goals. They are different concerns, so
they are **sibling capabilities**, each with its own ICE — not Login's problem:

| Tempting "Login goal" | Correct home |
|-----------------------|--------------|
| "users can reset a forgotten password" | capability: **Account Recovery** (own ICE) |
| "users stay signed in across devices"  | capability: **Session Management** (own ICE) |
| "new users can create an account"      | capability: **Registration** (own ICE) |

### The wrong way (the blow-up you were worried about)

```yaml
# ANTI-PATTERN — one ICE trying to be everything
intent:
  goals:
    - "users sign in"
    - "users reset passwords"          # -> belongs to Account Recovery
    - "users stay logged in"           # -> belongs to Session Management
    - "users sign up"                  # -> belongs to Registration
    - "support SSO and social and MFA" # -> these are functionalities, not goals
```

This ICE has no real boundary — it's the whole domain pretending to be one node.
Decomposing it into the tree above is what keeps each ICE small and buildable.

---

## The one-line model

The **profile is the box** — levels and gates, the product's committed bar.
**ICE is the specifics** — the real numbers under the bar. A specific that won't
fit **stops for a human**, and approval **moves the box** as a decision.
Capabilities shape the box; they don't silently redraw it.
