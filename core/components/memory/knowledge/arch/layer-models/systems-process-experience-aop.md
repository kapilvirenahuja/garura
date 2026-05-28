---
id: systems-process-experience-aop
name: Systems / Process / Experience / AOP
description: Four-layer blueprint organizing a product around its systems-of-record (bottom), a process/composition layer above them, an experience layer at the top, and an AOP layer holding cross-cutting concerns.
layer_count: 4
layers:
  - id: experience
    name: Experience
    role: |
      User-facing channels and surfaces — web app, mobile app, customer portal, partner UI, channel adapters. Anything the human (or another system) touches first.
    order: 1
    is_entry: true
  - id: process
    name: Process
    role: |
      Composition, orchestration, and workflow above the systems layer. APIs, BFFs, agentic orchestrators, business process engines, queues mediating between channels and systems-of-record.
    order: 2
    is_entry: false
  - id: systems
    name: Systems
    role: |
      Core business systems — ERP, CRM, commerce platform, CMS, DAM, payment gateway, identity provider, search engine. The systems-of-record the product depends on.
    order: 3
    is_entry: false
  - id: aop
    name: AOP (Aspect-Oriented)
    role: |
      Cross-cutting concerns that touch every other layer — config management, experiment management, observability, security tooling, developer tooling, devops / infra primitives. Not a layer in the sequential request path; a layer that wraps the others.
    order: 4
    is_entry: false
---

# Systems / Process / Experience / AOP

A four-layer blueprint that maps cleanly to products built on top of one or more systems-of-record. The classic shape for commerce, B2B SaaS sitting on top of Salesforce / SAP / Oracle, content platforms composing CMS + DAM + delivery, and many enterprise integration products.

## When this blueprint fits

- The product's value proposition rests on composing or extending real systems-of-record (ERP, CRM, commerce, CMS).
- The team thinks of the architecture as "channels above, systems below, glue in between."
- Cross-cutting concerns (auth, observability, feature flags, experiment routing) are real enough to deserve their own named layer rather than being scattered.
- The product has 2-5 channels and 3-8 systems-of-record. (At 1 channel and 1 system this blueprint is overkill; pick a simpler model.)

## When it does not fit

- Pure greenfield products with no existing systems-of-record in play. (The systems layer would be near-empty; reach for a different blueprint.)
- Heavy agentic products with non-trivial intelligence services that don't naturally fit "process" or "systems." (Consider the 7-layer IDSD blueprint instead.)
- Products where compliance / regulatory boundaries force per-region partitioning so strict that horizontal layers misrepresent the architecture.

## Per-layer guidance

**Experience.** Web (Next.js, SvelteKit, etc.), mobile (native, RN, Flutter), partner portals, channel surfaces (Slack apps, MS Teams apps, voice agents), BFF endpoints whose sole role is shaping data for a specific channel.

**Process.** Public-facing APIs, internal APIs, agentic orchestrators (workflow engines, LangChain / Temporal style orchestrators), event routers, queues mediating sync-to-async transitions. Anything that composes systems behind it to serve a channel in front.

**Systems.** ERP (SAP, Oracle, NetSuite, Dynamics), CRM (Salesforce, HubSpot, Microsoft Dynamics CRM), commerce (Shopify, BigCommerce, commercetools), CMS (Contentful, Sanity, Strapi), DAM (Bynder, Cloudinary, Brandfolder), payment (Stripe, Adyen, Braintree), identity (Auth0, Okta, Azure AD), search (Algolia, Elasticsearch, Meilisearch). Each appears as one (or more) component in logical-architecture grounded in an inventory entry.

**AOP.** Observability stacks (Datadog, Grafana + Prometheus, OpenTelemetry collectors), feature flag platforms (LaunchDarkly, GrowthBook), experiment platforms (Optimizely, Split.io), secrets management (Vault, AWS Secrets Manager), CI/CD tooling, IaC tooling, internal developer platforms. These layers are referenced BY components in other layers but do not sit on the request path.

## Common adaptations

- **Split the process layer** into a thin API layer + a thick orchestration layer when the product has heavy agentic or workflow needs.
- **Add a data layer** between process and systems when the product owns its own data store (warehouse, lake, cache) in addition to systems-of-record.
- **Collapse AOP into the other layers** for very small products where the cross-cutting concerns are minimal. Treat AOP as optional, not mandatory.
