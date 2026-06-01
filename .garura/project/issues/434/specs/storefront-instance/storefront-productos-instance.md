# Storefront ProductOS instance — Login + Product Detail Page (B2C retail)

One storefront product, one profile box, two capabilities under it: Authentication
(login) and Product Detail Page (PDP). Login's full detail lives in
`../login-instance/` — here it's situated under the shared box; PDP is built in
full. Built to find where a complex capability stays readable or turns to mush.

---

## Product profile — the box (shared by the storefront)

```yaml
profile:
  product_ref: acme-storefront
  state: set
  shape:
    stage: monetized
    users: public
    monetization: transactional      # FINDING #1: enum has none|lead-capture|paywall —
                                      # a storefront is transactional commerce, not in the enum
    surfaces: [web, pwa]              # FINDING #2: surfaces enum lacks "pwa" (web covers it,
                                      # but PWA is a real, distinct surface flavour)
  nfr:
    performance:    { level: high,   gate: "PDP interactive p75 < 2.5s mid-mobile; Core Web Vitals green" }
    security:       { level: high,   gate: "OWASP ASVS L2; no P1/P2 (driven by Authentication)" }
    accessibility:  { level: high,   gate: "WCAG 2.1 AA" }
    scalability:    { level: medium, gate: "3x peak (sales/launch) without redesign" }
    reliability:    { level: high,   gate: "99.9% uptime; PDP renders core if a dependency is down" }
    privacy:        { level: high,   gate: "consent-gated tracking; PII encrypted; no PII to 3rd-party recs without consent" }
    observability:  { level: medium, gate: "page + dependency error/latency tracing" }
    maintainability:{ level: medium, gate: "no module > 500 lines; lint clean" }
  compliance: [GDPR]
  quality_vision:
    statement: "Fast, accurate, accessible storefront; never shows a wrong price or a page that won't load."
    gates: ["Core Web Vitals green", "WCAG 2.1 AA", "price + stock never stale on render",
            "consent-gated personalization", "graceful degradation of non-core sections"]
```

---

## Graph

```
PRODUCT: acme-storefront ── profile (box) ── governed by ── decisions
│
├─ DOMAIN: Identity
│   └─ CAPABILITY: Authentication (Login)     ── ice + 5 lenses   [full in ../login-instance/]
│
└─ DOMAIN: Shopping
    └─ CAPABILITY: Product Detail Page (PDP)   ── ice + 8 functionalities + 5 lenses + 2 agents
         depends_on ──► Catalog · Pricing · Inventory · Reviews · Recommendations · Cart
                        (sibling capabilities — PDP displays/threads them, doesn't own them)
```

---

## Capability A — Authentication (Login), situated

Full ICE and lenses are in `../login-instance/login-productos-instance.md`. Under
the storefront it changes in exactly one way: it no longer has its own box — it
lives under the shared storefront box above, and it's the reason `security` is
`high`. Everything else (its goals, constraints, functionalities, lenses) is
unchanged.

---

## Capability B — Product Detail Page (PDP)

```yaml
node:
  id: c-pdp
  type: capability
  name: Product Detail Page
  parent: d-shopping
  summary: "Show one product so a shopper can understand it and decide to buy."
  ice_ref: i-pdp
  depends_on: [c-catalog, c-pricing, c-inventory, c-reviews, c-recommendations, c-cart]

ice:                       # i-pdp
  node_ref: c-pdp
  intent:
    goals:
      - G1: "a shopper understands the product and can decide to buy, fast"
      - G2: "what the page says is true — price, availability, reviews are accurate"
    constraints:
      - C1: "price and availability are never stale on render (read fresh or labelled)"
      - C2: "content-led: the CMS composes the page; commerce data comes via API"
      - C3: "personalization only with consent (GDPR); none for a non-consented guest"
      - C4: "the page renders its core (media, price, buy) even if reviews/recs are down"
      - C5: "every interactive element is keyboard + screen-reader usable"
    failures:
      - F1: "shows a wrong price, or 'in stock' when it isn't"
      - F2: "the page is slow or blocks because one dependency (reviews/recs) is slow"
      - F3: "personalized or tracked without consent"
      - F4: "broken media, or the variant shown doesn't match the price/stock shown"
      - F5: "unusable by keyboard or screen reader"
  context:
    persona: [guest-shopper, returning-shopper]
    systems: [cms, commerce-engine, catalog-pim, pricing, inventory, reviews, recommendations, personalization, cdn]
    scope: ["variants (size/colour)", "promotions", "ratings + reviews (display)", "recommendations",
            "specs", "Q&A", "add-to-cart handoff to Cart", "B2C retail", "responsive web + PWA"]
  expectations:
    outcomes:
      - "shopper sees accurate media, price, availability, and can add a valid variant to cart"   # G1
      - "core page renders even with reviews/recs unavailable; stale data never shown as fresh"   # G2
  nfr_needs:
    performance: "interactive p75 < 2.5s mid-mobile; price/stock fetched fresh or cache-busted on add-to-cart"
    accessibility: "WCAG 2.1 AA on the full page incl. gallery + variant pickers"
    privacy: "personalization + recs only after consent; reviews summary uses no PII"
    reliability: "core (media/price/buy) renders with reviews + recs degraded"
  compliance_needs: [GDPR]
```

### Functionalities (thin nodes, each its own ICE)

```yaml
- { id: f-gallery,  name: "Product Gallery",        goal: "show product media; zoom; per-variant images" }
- { id: f-variant,  name: "Variant Selection",      goal: "pick size/colour; reflect price + stock per variant" }
- { id: f-price,    name: "Price & Promotions",     goal: "show current price, was-price, active promo — accurate" }
- { id: f-stock,    name: "Availability",           goal: "show in/out of stock + delivery estimate, fresh" }
- { id: f-reviews,  name: "Ratings & Reviews",      goal: "display rating + reviews (data from Reviews capability)" }
- { id: f-recs,     name: "Recommendations",        goal: "show related/you-may-like (from Recommendations); degrades silently" }
- { id: f-specs,    name: "Specs & Q&A",            goal: "structured specs + buyer Q&A" }
- { id: f-addcart,  name: "Add to Cart",            goal: "hand the chosen variant to Cart; not owned here" }
```

(Each is a functionality node with its own thin ICE — one focused goal, its
scope, its nfr_needs. Shown compact here; each would be its own `node.yaml` +
`ice.yaml` under `functionalities/`.)

### Lenses

```yaml
# ux
lens: { capability_ref: c-pdp, type: ux,
  summary: "One content-led page; core renders first, enrichments stream in.",
  content:
    screens: [ { name: "PDP", purpose: "the product detail page" } ]
    states:  [ { screen: "PDP", states: [loading-core, core-ready, enriching, variant-changing, out-of-stock, error] } ]
    flows:
      - { name: "view -> pick variant -> add to cart", persona_ref: p-returning, steps: ["land", "browse media", "pick variant (price/stock update)", "add to cart"] }
      - { name: "read reviews / recs (non-blocking)",   persona_ref: p-guest,     steps: ["scroll", "reviews stream in", "recs stream in"] }
    accessibility: { wcag: "2.1 AA", focus: "gallery + variant picker keyboard-operable", targets: "44px", announcements: "stock/price changes announced" }
    design_system: { system: "storefront DS", component_model: "Primitive -> Block -> Card", surface: "responsive web + PWA on CDN" } }

# architecture  (MACH, content-led)
lens: { capability_ref: c-pdp, type: architecture,
  summary: "MACH / composable. Content leads the glass; commerce data is API-composed; core renders independent of enrichments.",
  content:
    components:
      - { name: "CDN",            layer: experience,    kind: internal, part: "edge cache of the rendered/static shell" }
      - { name: "Frontend (glass)", layer: experience,  kind: internal, part: "PWA, responsive; composes the page" }
      - { name: "CMS / DXP",      layer: experience,    kind: external, part: "LEADS page composition — layout, copy, slots" }
      - { name: "Commerce engine", layer: process,      kind: external, part: "API-first product/cart (MACH)" }
      - { name: "Catalog / PIM",  layer: domain,        kind: external, part: "product master data" }
      - { name: "Pricing",        layer: domain,        kind: external, part: "current price + promotions" }
      - { name: "Inventory",      layer: domain,        kind: external, part: "stock + delivery estimate" }
      - { name: "Reviews",        layer: domain,        kind: external, part: "ratings + reviews (non-core)" }
      - { name: "Recommendations", layer: cross-cutting, kind: external, part: "related items (non-core)" }
      - { name: "Personalization", layer: cross-cutting, kind: external, part: "consented profile for copy/recs" }
    contracts:
      - { between: "Frontend <-> CMS",         interface: "content/composition API", data: "page layout, slots, copy" }
      - { between: "CMS <-> Commerce engine",  interface: "product API",             data: "product, variants, media refs" }
      - { between: "Frontend <-> Pricing",     interface: "price API",               data: "price, promo (cache-bust on add)" }
      - { between: "Frontend <-> Inventory",   interface: "availability API",        data: "stock, ETA" }
      - { between: "Frontend <-> Reviews",     interface: "reviews API (async)",     data: "rating, reviews — degrades" }
      - { between: "Frontend <-> Recs",        interface: "recs API (async)",        data: "item ids — degrades" }
    stack:
      - { component: "Frontend", tech: "Next.js (PWA)", version: "14" }
      - { component: "CMS",      tech: "(headless CMS)", version: "—" }
      - { component: "Commerce", tech: "(MACH commerce engine)", version: "—" }
    # principle: build is a vertical e2e slice through these — content-led, core-first. }

# run
lens: { capability_ref: c-pdp, type: run,
  summary: "CDN-cached shell + fresh commerce reads; non-core sections flagged + degrade.",
  content:
    environments: [dev, staging, prod]
    rollout: { flags: ["reviews", "recs", "personalized-copy"], strategy: "canary" }
    migrations: "content + catalog changes are additive; no destructive in place"
    config_secrets: "per-env API endpoints + keys via secrets-manager"
    cicd: "build -> Core Web Vitals + a11y + accuracy gates -> deploy on green" }

# quality  (gates only)
lens: { capability_ref: c-pdp, type: quality,
  content:
    gates: ["Core Web Vitals green (LCP/INP/CLS)", "WCAG 2.1 AA full page",
            "price + stock never shown stale-as-fresh", "core renders with reviews+recs down",
            "no personalization/tracking without consent", "variant shown matches price/stock shown"] }

# agentic  (two agents)
lens: { capability_ref: c-pdp, type: agentic,
  summary: "Two assistive agents on the page; both grounded, consented, labelled.",
  content:
    weights:
      cognitive:  { level: medium, note: "summarise reviews into pros/cons; tailor copy to profile" }
      creative:   { level: medium, note: "generate review summary + personalized product copy" }
      logistical: { level: low,    note: "no workflow actions; render-time only" }
    bounds: "review summary uses ONLY real submitted reviews (no fabrication), labelled AI;
             personalized copy only with consent, factual (no invented claims/specs/price),
             never changes price/stock/variant data; both are non-core (page renders without them)" }
```

### Decisions

```yaml
- { id: d-201, level: capability, node_ref: c-pdp, status: accepted,
    title: "MACH / composable, content-led", reason: "content team leads the experience; commerce via API",
    alternatives: [{ name: "monolith commerce templates", why_not: "couples content to commerce; slower" }] }
- { id: d-202, level: capability, node_ref: c-pdp, status: accepted,
    title: "Core-first render; reviews + recs are non-core and degrade",
    reason: "F2/C4 — a slow dependency must never block the buy path",
    alternatives: [{ name: "block on all sections", why_not: "one slow service kills the page" }] }
- { id: d-203, level: capability, node_ref: c-pdp, status: accepted,
    title: "Review-summary + personalized-copy agents, grounded + consented + labelled",
    reason: "assistive value without trust/GDPR risk",
    alternatives: [{ name: "free-form generated copy", why_not: "hallucination + consent risk" }] }
```

---

## Readability assessment — did it stay clean or turn to mush?

Honest read, since that was the point.

**It stayed readable, with two strain points.**

What held up well. The capability node plus ICE is still one screen and reads like
intent, not a spec — eight constraints/failures, no more. The eight
functionalities are thin one-liners; piling them on did not bloat the capability,
because each is its own node. The dependency web — PDP depends on six other
capabilities — looked scary but is just a `depends_on` list; it reads fine and is
honest about where the boundaries are (PDP displays reviews, it doesn't own them).

Where it strained. The architecture lens is the dense one — ten components and
six contracts. It's still skimmable as a table, but it's the part that would tip
into mush if a capability touched fifteen-plus components. That's a real signal:
the architecture lens is where complexity concentrates, so the component
inventory (C3) earning its keep matters most there. Second, the lenses-as-inline-
YAML is getting long in one file; in the real tree these are six separate files
(`lens/*.yaml`), which is exactly why we split them — read individually they're
each short.

Schema gaps this surfaced (the actual value of the run):
1. `monetization` enum has no transactional/commerce value — a storefront doesn't fit none/lead-capture/paywall.
2. `surfaces` enum has no `pwa` — web covers it loosely, but PWA is a distinct surface.
3. No first-class way to say a functionality/section is "non-core / degradable" — we expressed it in constraints + the run flags, but a complex page (PDP) wants core-vs-enrichment as a real attribute. Worth considering.
4. Cross-capability `depends_on` at the capability level is fine, but a PDP functionality (recs) really depends on the Recommendations *capability* — functionality-to-capability dependency isn't modelled; only node.depends_on. Minor, but a complex page wants it.

Verdict: the model carries a genuinely complex, dependency-heavy capability
without collapsing — the tree + thin ICE + per-lens files keep it legible. The
architecture lens is the place to watch, and the four gaps above are the concrete
fixes a second schema pass should weigh.
