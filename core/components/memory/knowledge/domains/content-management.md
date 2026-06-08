---
id: domains/content-management
title: "Content Management: how we build it — product-framed, MACH-first, drag-and-drop experience"
conditions:
  trigger: "the product authors, models, and publishes content — pages, articles, structured entries, assets"
  selection_keys: [experience-composability, content-modelling-depth, surfaces, responsive-vs-adaptive, dam-need]
provenance: interview (#434 — Kapil)
---

# Content Management: how we build it

## Stance (non-negotiable)
We work **headful, headless, and hybrid** — platform-agnostic. The **spine** is the
ability to **drag-and-drop the experience on a MACH-first architecture**. Many
platforms now support this, so we pick whatever can deliver that spine rather than
marrying one product. This is the content half of "**content leads the glass**" —
see `ecommerce` for the commerce half.

We are moving toward an **intelligent experience platform**, **intent-first**: the
domain is organised around what content producers (and the reader) are trying to
do, and capabilities serve those intents.

Outbound promotion of content — see `marketing`. Search/recommendations — see
`experience`. Personalization is increasingly **its own domain** (see note below).

## Frame it as a product, not as templates and components
The single biggest POV here. Don't break a site into "templates and components" —
that framing is where teams get the page breakdown wrong. Frame the deliverable as
a **product with features**.

Ask: *as the CMO of (say) a bank, what is the product you get?* The home page is a
**feature** of that product. So is news & articles. So are press-release pages.
Each feature then **maps to a content model**. Product → features → content models
is the chain — templates and components fall out of that, they don't lead it.

This reframing is also the fix for the most common failure: breaking pages into the
wrong level of templates/components. Start from the product and its features and
the right structure follows.

## Intents this domain captures
Intent-first. The producer side is our focus — **authors, editors, marketers, and
administrators** — plus the reader who consumes the result.

**Producer / operator intents**
- **Model** — "define what content exists" → content modelling (administrators / architects).
- **Author** — "create the content" → authoring (authors).
- **Edit & curate** — "refine, review, approve" → editorial workflow (editors).
- **Compose the experience** — "assemble pages/experiences by drag-and-drop" → experience composition (marketers, editors).
- **Publish & schedule** — "ship it, when I choose" → publishing (editors, marketers).
- **Reach & be found** — "rank and get surfaced" → SEO / GEO / AEO (marketers).
- **Govern & administer** — "roles, workflow, versions, environments" → administration (administrators).

**Consumer intent**
- **Consume** — "read / experience the content" → delivery to the glass (the reader).

## Capabilities
- **Content modelling** — the core discipline; model per product feature (above).
  Separate content from presentation, always.
- **Authoring & editing** — rich authoring; draft/preview; editorial workflow and
  roles (authors → editors → publish).
- **Experience composition** — the spine: drag-and-drop assembly of pages and
  experiences on MACH-first components.
- **Presentation & rendering** — **responsive is the default**. **Adaptive is
  nice-to-have** — only take on its complexity when the experience is *genuinely
  different per dimension* (device/context), not by reflex.
- **Publishing & delivery** — scheduled publish/expiry; headless/content API when
  more than one surface; CDN-backed delivery at scale.
- **Digital Asset Management** — assets live here as a capability (not a separate
  domain); upload + transform pipeline; asset library.
- **Localization** — translation workflow when content ships in more than one locale.
- **Administration & governance** — roles, environments, versioning, audit.

## Where it goes wrong
- **Migration** — underestimated; plan it as first-class work, not a cutover.
- **Design** — design that doesn't map to a content model breaks at authoring time.
- **Frontend** — and specifically the page breakdown: getting templates/components
  at the wrong level. Fix it by framing product → features → content models first.

## Intelligence features
Mapped to the intents they serve (intent-first). Two tiers, as on every shelf.

**Core — content-connected, ours to lead**
- **AI content generation** — draft and assist content production.
- **SEO / GEO / AEO** — optimise for search engines, generative engines, and
  answer engines. Key here.
- **Brand-tone generation & checking** — produce and verify on-brand copy. Core
  content work (shared with `ecommerce`).

**Adjacent — DAM / operator intelligence**
- **Asset tagging** — auto-tag and classify DAM assets.
- **Translation** — AI-assisted localisation of content and assets.

## Personalization — its own domain
Personalization is a key element and is a **domain in its own right** (decided,
#434) — not folded under content or experience. `experience` keeps search and
discovery; personalization has its own shelf. See `personalization`.

## Non-negotiables
- **Drag-and-drop experience on MACH-first** — the spine; pick the platform that
  serves it.
- **Content modelling matters** — and it follows product → features.
- **Separate content from presentation** — always.
- **Responsive by default; adaptive only when truly different per dimension.**
- **Product framing over template/component framing.**

## Rationale
The platform doesn't matter; the spine does — drag-and-drop experience composition
on MACH-first is what we insist on, and the market now offers several products that
deliver it. Product framing is the differentiator: it gives non-technical owners
(a CMO) a mental model they own, and it produces the right content models — and
therefore the right page structure — instead of a guessed template/component
breakdown. Responsive-by-default with adaptive-on-evidence keeps complexity honest.
The intelligence core leans into content production and discoverability (gen,
brand-tone, SEO/GEO/AEO); DAM intelligence (tagging, translation) is adjacent.

## Evolve when
- Content feeds more surfaces → push harder on headless delivery and the content API.
- A genuine per-dimension difference appears → take on adaptive (not before).
- Generative/answer engines drive more traffic → invest in GEO/AEO alongside SEO.
- Personalization need grows → spin it out as its own domain (pending decision).

## Provenance
interview (#434 — Kapil): headful/headless/hybrid + MACH-first drag-and-drop spine,
product-framing-over-templates POV (the bank-CMO example), responsive-default /
adaptive-on-evidence rule, the author/editor/marketer/administrator focus, the
migration/design/frontend failure modes, and the SEO/GEO/AEO + brand-tone + DAM
intelligence split. NOT a generic capability list.
