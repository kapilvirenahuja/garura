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
  - Level 1 — fixed page model: a page maps to one feature, fields inline. The floor — every product that holds content.
  - Level 2 — structured content types: typed, reusable entries decoupled from any one page. Add when `shape.surfaces` spans more than one, or content is reused across features.
  - Level 3 — reusable components/blocks: composable blocks that feed drag-and-drop assembly. Add when `shape.stage: public`/`monetized` and the experience is composed, not page-built.
- **Authoring & editing** — rich authoring; draft/preview; editorial workflow and
  roles (authors → editors → publish).
  - Rich authoring + draft/preview — author content with preview before publish. The floor.
  - Editorial workflow (author → editor → publish) — review-and-approve gates. Add when `shape.users: small-team`/`public` (more than one author), or `compliance` needs review records.
  - Content versioning & rollback — history and revert on entries. Add when `nfr.reliability >= high`, or `compliance` needs an edit trail.
- **Experience composition** — the spine: drag-and-drop assembly of pages and
  experiences on MACH-first components.
  - Drag-and-drop page assembly — compose pages from reusable blocks. The spine itself — include when `shape.stage: public`/`monetized`.
  - Reusable experience templates — saved layouts marketers re-apply. Add when `shape.users: small-team`/`public` reuse layouts across features.
- **Presentation & rendering** — **responsive is the default**. **Adaptive is
  nice-to-have** — only take on its complexity when the experience is *genuinely
  different per dimension* (device/context), not by reflex.
  - Responsive rendering — one experience that reflows across viewports. The floor — always.
  - Adaptive rendering — a genuinely different experience per device/context. Add ONLY when the experience truly differs per dimension — never merely because `shape.surfaces` has more than one entry.
- **Publishing & delivery** — scheduled publish/expiry; headless/content API when
  more than one surface; CDN-backed delivery at scale.
  - Scheduled publish & expiry — ship and retire content on a chosen date. The floor.
  - Headless / content API — serve content to surfaces over an API. Add when `shape.surfaces` spans more than one (e.g. web + mobile/api).
  - CDN-backed delivery — edge-cached delivery at scale. Add when `nfr.performance >= high` or `nfr.scalability >= high`.
- **Digital Asset Management** — assets live here as a capability (not a separate
  domain); upload + transform pipeline; asset library.
  - Asset upload & library — store and browse media in one place. The floor whenever the product holds assets.
  - Transform pipeline (resize/format) — derive renditions on demand. Add when `nfr.performance >= high`, or assets serve more than one of `shape.surfaces`.
- **Localization** — translation workflow when content ships in more than one locale.
  - Translation workflow — manage locale variants of content. The floor once content ships in more than one locale.
  - AI-assisted translation — machine-draft locale variants for review. Add when locale count or `nfr.scalability >= high` makes manual translation a bottleneck.
- **Administration & governance** — roles, environments, versioning, audit.
  - Roles & environments — who can do what, across dev/stage/prod. The floor for any operated product.
  - Audit logging — record of who changed what, when. Add when `compliance` is in force, or `nfr.security >= high`.

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
