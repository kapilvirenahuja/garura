---
id: domains/personalization
title: "Personalization: how we build it — content + experience, graded across three maturity levels"
conditions:
  trigger: "the product tailors content or experience to the individual or segment"
  selection_keys: [personalization-maturity-level, content-vs-experience, real-time-need, cdp-need, nfr.privacy]
provenance: interview (#434 — Kapil)
---

# Personalization: how we build it

## Stance (non-negotiable)
We personalize **content and experience — both, and separately**. Content
personalization is the right message to the right person; **experience
personalization** is the whole experience adapting to the person — and it is the
**new, shiny MOAT**. It is the heart of the **intelligent experience platform**.

All of this is **intelligence**, intent-first: the domain is organised around what
the visitor and the operator are trying to do, and the capabilities are how we
satisfy them.

Its own domain (decided #434), split from `experience` (which keeps search and
discovery). Leans on: `content-management` (the content it tailors),
`user-management` (identity), `marketing` (segments/campaigns), `analytics`
(behaviour + proof). Don't re-own those — tailor on top of them.

## Pick the maturity level first (our three-level model)
Grade how far a client needs to go before building. The level decides whether you
need rules engines, a CDP, and real-time infrastructure at all.

1. **Level 1 — simple tagging, rules-light.** Tag content and audiences; basic
   "if this then show that." **No rules engine, no CDP needed.** Lightweight,
   rules-based intelligence. This is the honest floor — most clients start here.
2. **Level 2 — CDP + personalization tools.** Unified customer profiles,
   segmentation, and tool-driven targeting — usually **external tools**. This is
   where it **gets tricky**: integrating the CDP and third-party personalization
   stack, keeping profiles clean, stitching identity.
3. **Level 3 — real-time hyper-personalization.** Build it: live decisioning, the
   experience reshaping per person in the moment. This is where experience
   personalization — the moat — reaches full strength.

The climb: L1 needs no platform, L2 buys/integrates one, L3 builds real-time on
top. Don't sell L3 to an L1 client.

## What we personalize
- **Content** — message, copy, offers, recommended reading (tailors `content-management`).
- **Experience** — layout, journey, sequence, the shape of the glass itself.
  Personalized **separately** from content — and this is the differentiator.

## Intents this domain captures (proposed — sanity-check)
Intent-first. (Kapil delegated the intent list — confirm or correct.)

**Visitor intents**
- **Be recognised** — "know me across visits and devices" → identity resolution, profile.
- **Get relevance** — "show me what fits me" → tailored content, offers, experience.
- **Be met in context** — "adapt to where I am and what I'm doing right now" →
  real-time / contextual experience personalization (L3).
- **Stay in control** — "manage what you know and use about me" → consent,
  preferences, transparency.

**Operator intents**
- **Know the audience** — "build one clean view of each person" → CDP, unified profiles.
- **Target & tailor** — "deliver the right experience/content per segment or
  individual" → rules (L1) → models/tools (L2) → real-time decisioning (L3).
- **Adapt live** — "respond to behaviour as it happens" → real-time decisioning (L3).
- **Prove it worked** — "show it moved the metric" → experimentation + measurement
  (with `analytics`).

## Capabilities (by level)
- **Tagging & rules** (L1) — content/audience tags; simple targeting rules.
  Pinned at L1 — flat list of the rules-light primitives.
  - Content tagging — label content with attributes for targeting. The floor.
  - Audience tags — group visitors by simple attributes/behaviour. The floor.
  - If-then targeting rules — "if tag X, show Y"; no engine needed. The floor.
- **Customer data platform / profiles** (L2) — unified profile, identity stitching,
  segmentation; typically external tooling.
  Pinned at L2 — flat list of the data-platform primitives.
  - Unified profile — one clean view per person across sources. Include when L2 is reached.
  - Identity stitching — resolve one person across visits/devices. Include when `shape.users: public` and cross-device recognition matters.
  - Segmentation — build audiences from profile + behaviour. Include when `marketing` needs segments (overlaps `marketing`).
- **Decisioning engine** (L2→L3) — choose what to show; batch → real-time.
  Progressive — ladder aligned to the domain maturity levels.
  - Level 1 — rules-based selection: "if-then" picks what to show; no models. The floor for decisioning.
  - Level 2 — batch/model-driven: propensity, next-best-action computed offline. Add at L2 when `personalization` need outgrows static rules.
  - Level 3 — real-time decisioning: choose-in-the-moment per request. Add at L3 when `nfr.performance >= high` and live adaptation is required.
- **Experience personalization** (L3, the moat) — adapt layout/journey live.
  Pinned at L3 — flat list of the moat's primitives.
  - Layout adaptation — reshape page structure per person. Include at L3, `shape.surfaces` includes web/mobile.
  - Journey/sequence adaptation — reorder the path through the experience. Include at L3 when the journey varies by person.
  - Contextual adaptation — respond to where the visitor is and what they're doing now. Include at L3 when `nfr.performance >= high`.
- **Content personalization** — tailor message and offers (on `content-management`).
  Progressive — ladder aligned to the domain maturity levels.
  - Level 1 — rules-based content swaps: show tagged content by simple rule. The floor.
  - Level 2 — segment/model recommendations: offers and copy by segment or propensity. Add at L2 when a CDP/segments exist.
  - Level 3 — real-time recommendations: message/offer chosen live per person. Add at L3 when `nfr.performance >= high`.
- **Consent & preference management** — mandatory whenever `nfr.privacy >= high`
  or a regime governs profiling.
  Independent — flat list; gated by privacy, not by maturity level.
  - Consent capture — record permission to profile/personalize. Mandatory when `nfr.privacy >= high` or `compliance` includes GDPR.
  - Preference centre — let people control what's known and used. Add when `nfr.privacy >= high`.
  - Transparency/disclosure — show what data drives personalization. Add when `compliance` includes GDPR.
- **Experimentation & measurement** — prove lift (shared with `analytics`/`experience`).
  Independent — flat list; shared with `analytics`.
  - A/B testing — compare personalized vs. control variant. The floor for proving lift.
  - Lift measurement — attribute metric movement to personalization. Add when `nfr.observability >= medium` (shared with `analytics`).

## Where it goes wrong
- **Privacy & consent** — profiling without consent or transparency; design it in,
  not on.
- **Cold-start** — no data on a new visitor; have a sensible default before
  personalization kicks in.
- **Over-personalization / creepiness** — filter bubbles and uncanny targeting
  that erode trust.
- **External-tool complexity** (L2) — CDP/tool integration and identity stitching
  is the real cost; underestimating it sinks projects.
- **No proof** — shipping personalization that never demonstrates it moved a metric.

## Intelligence features (this domain is intelligence)
**Core — content + experience, where we lead (the moat)**
- **Experience personalization** — real-time adaptation of layout/journey. The moat.
- **Content personalization** — tailored message, offers, recommendations.
- **L1 rules-based tagging** — lightweight intelligence; the floor.
- **Real-time decisioning** (L3) — choose-in-the-moment.

**Adjacent — data platform / operator plumbing**
- **CDP / unified profile & identity stitching** — usually external tooling.
- **Predictive models / next-best-action** — propensity, churn, NBA.
- **Segmentation** — audience building (overlaps `marketing`).

## Non-negotiables
- **Personalize content AND experience — separately.** Experience personalization
  is the moat; lead with it.
- **Grade by maturity level** — don't build L3 for an L1 need.
- **Consent and transparency by design** — never bolt privacy on after.
- **Always have a cold-start default.**
- **Prove the lift** — personalization without measurement is theatre.

## Rationale
The maturity model is what keeps personalization honest: most value is unlocked at
L1 with tagging and simple rules — no CDP, no platform — and only real need should
pull a client up to L2 (external tools, where complexity bites) or L3 (build
real-time). Separating content from experience personalization is the strategic
call: experience personalization is the new moat, so it gets first-class treatment
rather than being collapsed into "recommendations." The failure modes are all trust
and proof: consent, cold-start, creepiness, and showing the metric moved.

## Evolve when
- Tagging + rules stop serving the relevance need → climb to L2 (CDP + tools).
- The business needs in-the-moment adaptation → climb to L3 (real-time decisioning).
- `nfr.privacy` rises or a profiling regime applies → harden consent, preference,
  and transparency.
- Experience personalization proves out → invest in it as the differentiating moat.

## Provenance
interview (#434 — Kapil): the three maturity levels (tagging/rules-light → CDP +
tools → real-time hyper-personalization), content-and-experience-separately with
experience personalization as the "shiny MOAT", and "all of it is intelligence,
L1 = lightweight rules". Intents proposed by Claude per Kapil's delegation —
pending his confirmation. NOT a generic capability list.
