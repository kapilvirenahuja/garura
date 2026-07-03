---
id: domains/analytics
title: "Analytics: measure goals and funnels, on web AND product — not just page-load and clicks"
conditions:
  trigger: "the product needs to measure behaviour and outcomes — events, goals, funnels, product usage"
  selection_keys: [goal-funnel-need, web-vs-product, decision-coupling, attribution-need, privacy-regime]
provenance: interview (#434 — Kapil)
---

# Analytics: how we build it

## Stance (non-negotiable)
Today we typically cover only **page load and CTA clicks, on web** — and that's the
problem. Without **goals and funnels**, no value is derived; you measure activity,
not outcomes. And measuring **web only** misses **product analytics** — how people
actually use the product. Both gaps are the whole point of this shelf:

- **Pick up goals and funnels.** Define what success is and measure the drop-off to
  it. This is where analytics earns its keep.
- **Measure product analytics, not just web.** Feature usage, adoption, retention,
  cohorts — the product, not only the marketing site.

Intent-first: measurement exists to answer "did the intended outcome happen, and
where did people fall out." Couple it to decisions or don't bother.

## Two kinds of funnel — don't conflate them
This matters because `experience` says funnels are the *wrong* lens — that's a
**different funnel**:
- **Discovery funnel** — *dead as a lens.* LLMs own the top of funnel; you don't
  control that journey. See `experience`. Don't try to measure your way back into
  owning it.
- **Product / conversion funnel** — *alive and essential, and currently missing.*
  The in-product path to a goal (signup → activate → convert → retain). THIS is what
  we under-measure and must pick up.

So: stop modelling marketing-discovery funnels; start modelling product-conversion
funnels.

## Intents this domain captures (proposed — sanity-check)
Mostly operator intents; the consumer's stake is privacy.

**Operator intents**
- **Define success** — "set the goal" → goal definition.
- **See the drop-off** — "where do people fall out on the way to the goal?" → funnels.
- **Understand product usage** — "what gets used, by whom, and do they come back?" →
  product analytics (adoption, retention, cohorts).
- **Tie behaviour to outcome** — "did the change move the metric?" → event → goal →
  outcome (with `experience`, `personalization`, `marketing`).
- **Attribute on the web** — "credit the right source" → web attribution (the
  `marketing` burn — close this loop).

**Consumer intent**
- **Be respected** — "measure me without abusing my data" → privacy-aware analytics.

## Capabilities
- **Event tracking** — beyond page-load + CTA: meaningful product events.
  - Level 1 — page-load + CTA clicks: the activity floor we already have, kept but never the whole story.
  - Level 2 — meaningful product events: the few actions that mean something (signup, activate, convert). Add when the product has a goal to measure against.
  - Level 3 — full event taxonomy: named events with consistent properties, versioned. Add when `nfr.maintainability >= high` or multiple teams emit events.
- **Goals** — explicit success definitions, the spine of value.
  - Goal definition — name the success outcome and its event. The floor — without it you measure motion, not value.
  - Goal hierarchy — primary vs assist goals, weighted. Add when one surface drives several outcomes worth ranking.
- **Funnels** — product/conversion funnels with drop-off, not discovery funnels.
  - Product-conversion funnel — the in-product path to a goal (signup → activate → convert → retain) with drop-off at each step. The floor for this shelf.
  - Segmented funnel — same funnel split by cohort or property to locate where which users fall out. Add when one funnel hides divergent behaviour.
- **Product analytics** — feature usage, adoption, retention, cohorts, paths.
  - Feature usage & adoption — who uses which feature and how often. The floor for measuring the product, not just the site.
  - Retention — do people come back; D1/D7/D30 or rolling. Add once adoption is tracked and durability matters.
  - Cohort analysis — behaviour grouped by signup window or trait, compared over time. Add when retention differs across groups.
  - Path analysis — the real routes users take to (or away from) a goal. Add when `nfr.observability >= high` or funnels need explaining.
- **Web analytics** — the existing page-load/CTA layer, kept but no longer the whole story.
  - Pageviews & sessions — traffic, sessions, basic engagement. The floor — the layer we already run.
  - On-page engagement — scroll, dwell, click maps feeding `marketing` signals. Add when `marketing` needs engagement input.
- **Web attribution** — source-to-outcome on the web (supports `marketing`).
  - Source/medium attribution — credit the channel that brought a session. The floor for closing the `marketing` loop.
  - Multi-touch attribution — credit across several touches on the path to a goal. Add when `marketing` spend spans channels worth comparing.
- **Dashboards & exploration** — make goals/funnels/usage legible and decidable.
  - Fixed dashboards — the standing view of goals, funnels, usage. The floor — make the numbers legible.
  - Self-serve exploration — ad-hoc query and breakdown without an engineer. Add when `shape.users: small-team` or more and decision cadence grows.
- **Privacy-aware collection** — consent and minimisation where a regime applies.
  - Consent gating — collect only after consent. The floor when `compliance` includes GDPR or `nfr.privacy >= medium`.
  - Data minimisation & anonymisation — drop or hash PII, IP truncation. Add when `nfr.privacy >= high` or `compliance` includes GDPR / HIPAA.
  - Retention & deletion controls — TTLs and subject-deletion paths. Add when `compliance` includes GDPR / HIPAA / SOC2.

## Where it goes wrong (our gaps)
- **Page-load + CTA only** — activity metrics with no goals or funnels → no value derived.
- **Web only** — no product analytics, so product decisions fly blind.
- **Vanity metrics** — numbers that move but don't inform a decision.
- **Discovery-funnel nostalgia** — measuring a top-of-funnel LLMs now own.
- **No attribution path on the web** — can't credit what worked.

## Intelligence features
**Core — outcome & product insight (ours)**
- **Goal & funnel analysis** — where and why people drop off.
- **Product-usage insight** — adoption, retention, cohort behaviour.
- **Campaign intelligence** — feeds `marketing` (dwell-time and engagement signals).

**Adjacent — advanced/operator**
- Predictive analytics, anomaly detection, automated insight surfacing — useful,
  but later than goals/funnels/product analytics, which come first.

## Non-negotiables
- **Measure goals and funnels** — or you derive no value.
- **Product analytics, not just web** — measure the product, not only the site.
- **Couple measurement to decisions** — no vanity metrics.
- **Model product-conversion funnels, not discovery funnels.**
- **Close the web-attribution loop** — the `marketing` gap.
- **Privacy-aware collection** where a regime applies.

## Rationale
The honest starting point is that our current analytics measures motion (page loads,
clicks) but not outcome (goals, funnels) and not the product (only the web) — so it
doesn't drive value. Fixing that is the whole stance: define goals, measure the
funnel to them, and extend into product analytics. The funnel distinction keeps this
from contradicting `experience`: the discovery funnel is genuinely dead as a lens,
but the in-product conversion funnel is exactly what we must measure. Everything
advanced (prediction, anomaly detection) waits until the basics — goals, funnels,
product usage — are in place.

## Evolve when
- Goals and funnels are in place → layer in retention/cohort product analytics.
- Web attribution matures → tie campaign credit to real behaviour (helps `marketing`).
- Decision cadence grows → add anomaly detection and automated insight surfacing.
- A privacy regime applies → tighten consent and data minimisation.

## Provenance
interview (#434 — Kapil): today only page-load + CTA on web; the value gap is missing
goals and funnels; and product analytics (beyond web) is missing and needed.
Reconciled with the `experience` funnel POV (discovery funnel dead, product funnel
alive). Intents proposed by Claude per delegation — pending confirmation. NOT a
generic analytics shelf.
