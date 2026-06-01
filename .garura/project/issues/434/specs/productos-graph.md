# ProductOS — the data graph

The spine is a 3-level tree (Domain → Capability → Functionality). Everything
else — ICE, decisions, the capability intents, personas, journeys, epics, and
the profile — attaches to nodes or links across them, which makes the whole
thing a graph.

## Node types (the spine)

| Node | Role | Has ICE? |
|------|------|----------|
| **Domain** | grouping only (name, summary) | no |
| **Capability** | the unit of INTENT | yes — capability ICE |
| **Functionality** | the BUILD unit | yes — functionality ICE |

## What hangs off a node

- **ICE** — 1 per capability and per functionality (via `ice_ref`). Not on domains.
- **Capability also carries:** the 5 capability-intents (ux / architecture /
  run / quality / agentic), persona records, journey records, decision (ADR)
  records.
- **Functionality also carries:** epics — the temporary vertical-slice delivery
  units (deleted on merge).
- **Product root carries:** the profile (the box — nfr levels+gates, shape,
  compliance, quality_vision).

## ICE in detail — one node, one ICE, one context

Every capability and functionality node has exactly one ICE. An ICE is one
Intent + one Context + one set of Expectations:

- **Intent** — `goals` (1+), `constraints`, `failures`. Each is a single
  node-level list; there is NOT a separate constraint list per goal.
  - `goals` — what we want (cohesive facets of this node's intent)
  - `constraints` — the hard rules on HOW the goals may be met
  - `failures` — the end-states that must not happen
- **Context** — `persona`, `systems`, `scope`. Exactly ONE, shared by every goal
  on the node. Context is the binder — it's what makes these goals *one* node.
- **Expectations** — `outcomes`, which pair with the goals (an outcome per goal).

So multiplicity lives in Intent and Expectations — many goals, many outcomes,
pairing up — but never in Context. One node, one ICE, one context.

Worked shape (Login capability):

```yaml
intent:
  goals:        [G1 "sign in fast and safely", G2 "real users never wrongly shut out"]
  constraints:  [C1 argon2id/no-plaintext, C2 constant-time/no-enumeration,
                 C3 5-attempt lockout auto-clears, C4 30-min revocable sessions,
                 C5 password+Google+SAML only]
  failures:     [F1 takeover, F2 permanent false lockout, F3 credential leak,
                 F4 user enumeration, F5 session replay]
context:        # ONE — binds both goals
  persona: [...]  systems: [...]  scope: [...]
expectations:
  outcomes:     [O1 "valid->session, invalid->never" (G1), O2 "always a path back in" (G2)]
```

**Decomposition test:** can the goals share one context (same persona, systems,
scope)? If yes → one ICE. If a goal needs its own context → it's a different node
with its own ICE. Behaviors become child functionalities; different concerns
become sibling capabilities.

## Governance — the box and the specifics

NFR lives in two places with different roles, joined by an approval gate:

- **Profile = the box.** Per dimension: a **level + a gate** (e.g. security:
  high @ OWASP L2; reliability: high @ three-nines). The product's committed bar.
  Product-level. Moves only by an approved decision.
- **ICE `nfr_needs` = the specifics.** Per node: the **concrete** target under
  the bar (e.g. auth API p99 < 150ms; argon2id).
- **The gate:** a specific that falls outside the box halts for human approval.
  Approval moves the boundary and writes a decision (ADR). Inside the box, no
  friction. Capabilities shape the box; they never silently redraw it.

Who populates: `/vision` draws a directional box + candidate capabilities;
`/understand` firms the box's levels and gates and fills each capability's ICE
specifics; the validator catches out-of-box specifics; a human approves and the
box moves (decision); `/shape` selects within the box and refines specifics down
to functionalities; `/validate` enforces the specifics against the gates.

## Edge types (the legend)

| Edge | From → To | Meaning |
|------|-----------|---------|
| parent / child | domain → capability → functionality | the tree spine |
| `ice_ref` | node → ICE | a node's intent record |
| `depends_on` | node → node | cross-tree dependency (structure, not ICE) |
| `context.persona` | ICE → persona | who this node serves |
| journey | journey → persona, journey → node | a persona's path through a node |
| `decision.node_ref` | decision → node | an ADR about that node |
| `capability_ref` | capability-intent → capability | one of the 5 lenses |
| `functionality_ref` | epic → functionality | a slice to deliver |
| governance | ICE.nfr_needs ↔ profile box | a need outside the box → decision → box moves |

## The login instance, as a graph

```
PRODUCT: acme-saas
  └─ profile (THE BOX)  ── governed by ──>  decisions (dec-101, dec-102)
        nfr: {security: xhigh@..., reliability: high@four-nines, performance: high@p99, ...}
        shape: {stage: public, surfaces: [web, api], ...}   compliance: [GDPR]

DOMAIN  d-um  "User Management"   (no ICE — grouping)
│
├─ CAPABILITY  c-7f3a  "Authentication (Login)"
│    ├─ ice  i-7f3a   goals[2] · context{persona,systems,scope} · nfr_needs
│    ├─ capability-intents → ux · architecture · run · quality · agentic
│    ├─ personas → password-user · enterprise-sso-user
│    ├─ journeys → "first-time SSO sign-in" (→ enterprise-sso-user)
│    ├─ decisions → dec-101 (security→xhigh) · dec-102 (reliability→four-nines)  ──> profile
│    └─ functionalities
│         ├─ f-pw   "Email & Password"  ── ice i-pw  ── epic e-12 [temporary]
│         ├─ f-soc  "Social Login"        ── ice
│         ├─ f-sso  "Enterprise SSO"      ── ice  ── depends_on ──> c-ses
│         └─ f-mfa  "MFA"                 ── ice
│
├─ CAPABILITY  c-rec  "Account Recovery"     ── ice  (sibling)
├─ CAPABILITY  c-ses  "Session Management"   ── ice  (sibling)
└─ CAPABILITY  c-reg  "Registration"         ── ice  (sibling)
```

Reading it: the tree gives you domain → capability → functionality; each
capability and functionality node points to one ICE; the capability also fans
out to its 5 intents, its personas/journeys, and its decisions; functionalities
point to temporary epics; `f-sso` depends_on the Session Management capability
(a cross-tree edge); and the profile sits at the product root, moved only by
decisions when an ICE need falls outside the box.

## Permanent vs temporary on the graph

- **Permanent (product-os):** the nodes, every ICE, decisions, the capability
  intents, personas, journeys, and the profile.
- **Temporary (product-os, deleted on merge):** epics.
- **Off the graph (STM, regenerated):** stories, tests, build detail, the 5
  realize lenses' rendered output.
