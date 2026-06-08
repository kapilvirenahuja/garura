---
id: domains/ecommerce
title: "Ecommerce: how we build it — content-first MACH, selected on the commerce↔content spectrum"
conditions:
  trigger: "the product sells physical or digital goods — catalog, cart, orders, storefront"
  selection_keys: [commerce-vs-content-weight, sku-count, traffic-volume, merchandising-depth, nfr.performance]
provenance: interview (#434 — Kapil) + Nagarro eCommerce selection-criterion reference
---

# Ecommerce: how we build it

## Stance (non-negotiable)
We build commerce as **MACH / headless** — always. And **content leads the
glass**: the experience is content-first, with commerce served into it, not the
other way round. This is the strong opinion that shapes every other choice on this
shelf. Even a commerce-heavy build keeps content able to lead the key surfaces.

We are moving toward an **intelligent experience platform** built **intent-first**:
the domain is organised around the intents people bring to it, and capabilities are
how we satisfy them. Agentic features route and act on these intents directly.

Taking money is a separate concern — see `payments`. What to charge and on what
plan — see `billing`. The CMS/DAM that backs "content leads the glass" — see
`content-management`. Search and recommendations — see `experience`.

## Intents this domain captures
Intent-first: lead with what the shopper or operator is trying to do; the
capabilities below exist to serve these, and the intelligent/agentic layer acts on
them.

**Shopper intents**
- **Discover** — "help me find what I want" → browse, category, PLP, search.
- **Evaluate** — "help me decide" → PDP, reviews & ratings, recommendations, compare.
- **Acquire** — "let me buy it" → cart, checkout handoff.
- **Track & manage** — "where is it / change or return it" → order status, returns, reorder.
- **Be assisted** — "shop with help" → agentic / conversational commerce.

**Operator (business) intents**
- **Merchandise** — "present and prioritise the catalog" → merchandising, PLP curation.
- **Enrich** — "make products rich and on-brand" → product content, brand-tone.
- **Understand** — "learn from behaviour and reviews" → analytics, review analysis.
- **Operate** — "keep stock and orders flowing" → inventory, fulfilment.

## Pick the shape first (the commerce↔content spectrum — our POV)
This four-point spectrum is **our point of view** on how to read a commerce
engagement. Never treat all commerce projects as the same build. Place the client
on it FIRST — it decides where product content lives, how rich authoring/experience
must be, and how hard performance and integration push. The axis runs from
content-rich / few SKUs (left) to commerce- & SOA-rich / many SKUs / high
performance (right).

1. **Content-heavy, light commerce, heavy experience** — marketer-driven store,
   low SKU count, lower traffic, authoring must be rich. SKU content + assets in
   the **CMS**; may not even need a full commerce package; experience managed by
   marketers. (User's shorthand: "content-first.")
2. **Medium commerce, content & experience heavy** — brand stores, moderate SKUs,
   marketer-driven with more products, client wants a full experience manager,
   product enrichment by the marketer. SKU content + assets in the **CMS**; a
   commerce package manages *some* SKU content; content by merchandisers +
   marketers.
3. **Commerce-heavy, light content** — large SKU count, heavy merchandising,
   experience management barely cared about. Products edited in **PIM or the
   commerce platform**; CMS/DAM only for assets; content by merchandisers,
   augmented by marketers.
4. **SOA-heavy, both commerce and content** — heavy transactional traffic, many
   back-end integrations, light experience management, elastic deployment.
   SKU content in **PIM** (augmented by commerce); **DAM** for assets;
   experience manager ships with the CMS or commerce platform. (User's shorthand:
   "commerce-first — Amazon/Flipkart style.")

The through-line: as you move right, the system of record for product content
shifts **CMS → commerce/PIM → PIM**, experience-management richness drops, and
performance + integration demands climb. Map roughly to the profile box:
quadrants 3–4 imply `nfr.performance: high` and `nfr.scalability: high`.

**Where we play.** The content side (quadrants 1–2) is our home turf — we lead
those with architecture, because content-first experience is our strength. When a
build is commerce-heavy (quadrants 3–4), we typically hand off to a different team.
Those right-side shapes are entirely **viable, valid designs** — they are simply
not where we lead. Keep them on the spectrum so the choice is honest; just know
which engagements are ours to drive and which we route elsewhere.

## The core journey — always there, or it breaks
Start with the basics and make sure the core is always present. Without it the
journey breaks, no matter the quadrant:

**home → category pages → PLP (product listing) → PDP (product detail) → cart →
checkout handoff.**

Build this spine first, end to end, before any enrichment. Everything else hangs
off it.

## Capabilities (after the spine, selected by quadrant)
- **Product content & SKU management** — the big variable. WHERE it lives is set
  by the quadrant above (CMS / commerce / PIM; assets in CMS or DAM). Decide the
  system of record before modelling anything.
- **Catalog & variants** — model variants (size/colour/bundle) as **first-class,
  separately** — never as ad-hoc attributes, and never copy-pasted from the last
  project. Variant handling is the thing teams get wrong by treating every
  commerce build as identical.
- **Experience management & authoring** — rich for quadrants 1–2 (marketer-driven,
  full experience manager, enrichment by marketers); light for 3–4.
- **Merchandising** — heavy for quadrant 3; products edited in PIM/commerce.
- **Search & discovery** — grows with SKU count; see `experience`.
- **Reviews & ratings** — plus analysis of them (see intelligence below).
- **Inventory & order management** — core commerce; real-time stock when traffic
  and reliability push (quadrants 3–4).
- **Integration / SOA layer** — heavy for quadrant 4: many back-end systems,
  elastic deployment, contract-governed seams.

## Intelligence features (increasingly the differentiator)
These are becoming key and should be on the table early, not bolted on. Mapped to
the intents they serve (intent-first). Two tiers, mirroring "where we play":
**core** is the content-connected, shopper-side intelligence we lead with;
**adjacent** is operator-side — valid and real, but usually handed off, like the
commerce-heavy quadrants.

**Core — content-connected, ours to lead**
- *Discover* — semantic / natural-language search; visual search (search by image);
  guided selling / AI product finders.
- *Evaluate* — AI review summaries on the PDP; **consumer review interaction — let
  shoppers query and question the reviews, and surface what other buyers actually
  care about (review Q&A)**; size & fit recommendation; virtual try-on / AR;
  auto-generated product comparisons.
- *Acquire* — cart-abandonment prediction with nudges; next-best-offer and
  personalised promotions.
- *Be assisted* — **agentic / conversational commerce**; post-purchase support agent.
- *Content production* — **brand-tone generation & checking** — produce and verify
  on-brand copy that leads the glass. Core content work.

**Adjacent — serving operator intents (valid, usually handed off)**
- *Enrich* — AI product-content generation & auto-enrichment (descriptions and
  attributes from images/specs); auto-categorisation / attribute extraction;
  auto alt-text & accessibility copy; AI translation & localisation.
- *Merchandise* — learning-to-rank / automated relevance tuning; automated &
  personalised merchandising; dynamic pricing / price optimisation.
- *Understand* — reviews & ratings analysis (operator / back-office signal — the
  consumer-facing half is core, above); demand forecasting; shopper-intent
  prediction & journey orchestration; returns analysis & reduction.
- *Operate* — inventory / demand prediction; UGC & review moderation.

## Non-negotiables
- **Content leads the glass** — content-first, every quadrant.
- **MACH / headless** — the default architecture.
- **Performance is first-class** — not an afterthought; hard constraint in
  quadrants 3–4.
- **API contracts are owned and stable** — the seams between MACH components are
  the thing that doesn't change; define and govern them.
- **Don't rebuild what we've built** — start from the reference architecture and
  reusable building blocks, not a blank page.
- **Don't treat all commerce the same** — pick the quadrant first; model variants
  and similar SKU concerns separately per project.

## Rationale
The spectrum is the heart of this shelf: it converts "we do commerce" into a
defensible build shape by reading SKU count, traffic, and the content-vs-
merchandising balance, then placing the system of record accordingly. Content-
first plus MACH is the house style — it keeps the experience leading and the
components swappable behind owned contracts. The core journey is sacred because a
broken spine fails every quadrant. The recurring, expensive mistakes are all
"sameness" mistakes: rebuilding instead of reusing the reference arch, and
flattening variants because the last project did. Intelligence features are the
current edge.

## Evolve when
- A client's SKU count, traffic, or merchandising weight shifts → re-place them on
  the spectrum; the system of record for product content moves with them.
- Back-end integration and transactional volume rise → move toward quadrant 4
  (PIM + DAM, elastic deployment, SOA seams).
- Intelligence features mature → fold agentic commerce, brand-tone, and review
  analysis into the default offer.

## Provenance
interview (#434 — Kapil): MACH/headless + content-first stance, the four-point
commerce↔content selection spectrum (Nagarro reference, ASSA ABLOY / Amarr deck),
the core-journey-first rule, and the named non-negotiables and intelligence
features. NOT a generic capability list.
