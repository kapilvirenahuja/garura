---
id: idsd-seven-layer
name: IDSD Seven-Layer
description: Seven-layer blueprint separating infra primitives, foundation/core services, domain systems-of-record, runtime engines, intelligence services, channels/experience, and the composition playbook layer.
layer_count: 7
layers:
  - id: playbooks
    name: Playbooks
    role: |
      Composition layer. Recipes, journeys, and orchestrated experiences that compose intelligence + experience + runtime + domain into end-user-facing flows. The top of the stack.
    order: 1
    is_entry: true
  - id: experience
    name: Experience
    role: |
      Channels and surfaces the user touches — web, mobile, in-store, voice, partner portals, embedded widgets. Includes channel adapters.
    order: 2
    is_entry: false
  - id: intelligence
    name: Intelligence
    role: |
      Engagement, personalization, recommendation, search, gamification, orchestration. The smart services that make the product feel adaptive.
    order: 3
    is_entry: false
  - id: runtime
    name: Runtime
    role: |
      CMS, DAM, agentic engines, workflow engines — the platform engines that power the product's content and process surfaces.
    order: 4
    is_entry: false
  - id: domain
    name: Domain / Data
    role: |
      ERP, CRM, systems of record. The authoritative business systems. Customer records, order records, inventory, finance.
    order: 5
    is_entry: false
  - id: foundation
    name: Foundation / Core
    role: |
      LLMs, identity, shared platform services, message brokers, observability backbone. Building blocks that span the product.
    order: 6
    is_entry: false
  - id: infra
    name: Infrastructure
    role: |
      Networking, compute, storage primitives. The bottom of the stack.
    order: 7
    is_entry: false
---

# IDSD Seven-Layer

A richer blueprint for products with a meaningful composition story — multi-system, multi-channel, agentic, intelligence-heavy. Originated from the IDSD (Intelligent Digital System Design) school of thought captured in issue #403.

## When this blueprint fits

- The product has a non-trivial intelligence layer — recommendation engines, search relevance services, agentic orchestrators, personalization engines.
- The product runs on top of distinct **platform runtime engines** (CMS, DAM, workflow engine) AS WELL AS systems-of-record (ERP, CRM, commerce).
- The product's value proposition is a **composition / playbook** layer that ties everything together — not just "use the CRM" but "this customer journey orchestrates intelligence + content + commerce."
- The architecture team explicitly wants to distinguish "engines that power the product" from "systems of record" from "intelligence on top."

## When it does not fit

- Products where the architecture is genuinely simple — channels + systems + glue. The 7 layers will feel inflated and components will cluster in 3-4 layers, leaving the others empty.
- Products without a meaningful playbook / composition story. If there's no orchestration above experience, the playbooks layer is a misnomer.
- Cost-sensitive / time-pressed greenfield products that need a leaner mental model.

## Per-layer guidance

**Infrastructure.** AWS VPC, VPN, transit gateway; on-prem network fabric; storage tiers (S3 / EBS / EFS / FSx, on-prem SAN / NAS); compute pools (EC2, on-prem hypervisor clusters). Pure primitives.

**Foundation / Core.** Identity (Auth0, Okta, Azure AD, Cognito), shared message brokers (Kafka, RabbitMQ, EventBridge), LLM gateways (Azure OpenAI, AWS Bedrock, OpenAI direct), observability backbone (Datadog, Grafana + Loki + Tempo, NewRelic), shared secret stores (Vault). Things many other layers consume.

**Domain / Data.** ERP (SAP, NetSuite, Dynamics 365 F&O), CRM (Salesforce, Dynamics 365 Sales/Service, HubSpot), commerce engines that act as records (Shopify, commercetools when acting as the source-of-truth for orders), data warehouses (Snowflake, BigQuery, Databricks SQL).

**Runtime.** CMS (Contentful, Sanity, Adobe Experience Manager, Strapi), DAM (Bynder, Cloudinary, Brandfolder), workflow engines (Temporal, Camunda, Airflow), agentic runtimes (CrewAI, LangGraph, custom orchestrators), search runtimes (Algolia, Elasticsearch, Meilisearch). The engines that power non-record functionality.

**Intelligence.** Recommendation engines (custom ML + feature stores, vendor like Algolia Recommend), personalization engines (Dynamic Yield, Optimizely, Adobe Target), gamification platforms, in-flight orchestration services that adapt journeys based on signal. The "smart" layer.

**Experience.** Web (Next.js, SvelteKit, Astro), mobile (native, RN, Flutter), in-store (POS adapters), voice (Alexa, voice agents), partner portals, embedded widgets. Channel adapters live here.

**Playbooks.** The composition layer. Customer-journey orchestrators that compose intelligence + runtime + domain into a coherent flow. Often agentic. This is where "what the user actually experiences end-to-end" lives in design intent.

## Common adaptations

- **Collapse intelligence and runtime** when the product's intelligence is thin (a single recommendation service rather than a full intelligence platform).
- **Split domain into domain-record and domain-master-data** when MDM is a real concern.
- **Add a security layer** between foundation and infra when zero-trust architecture is explicit and warrants its own named layer.
- **Drop the playbooks layer** when the experience layer carries the composition naturally (no separate orchestration above the channels). The 6-layer variant is common.
