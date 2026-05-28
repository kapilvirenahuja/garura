# /arch play redesign — intent gathering

Captured at start-feature time so the conversation that led into this branch is not lost. Issue #403 was the trigger ("logical-architecture output is YAML schema dump"), but the scope has expanded into a full /arch play redesign at the play-intent level.

Updated after the second review pass — corrects the over-reaches the first pass had and folds in the user's final clarifications.

## What this work is

Fix the /arch play. The play exists, it runs, what it produces is the wrong shape for both humans and downstream LLMs. This is an **intent change** to the /arch play, so it goes through `reference/intent.yaml` → `/sud:create-play --build arch`.

The user is the source of truth. KB is memory the agent reads. Selection authority comes from quality profile, project profile, and user answers when KB offers multiple candidates. No tiebreaker rules invented by the play.

**Approach for the rewrite:** write the new intent.yaml from scratch given the new model. Do not audit which of the current constraints survive — start fresh.

## The five outputs

| # | Artifact | What it carries |
|---|----------|-----------------|
| 1 | logical-architecture | Components (= named systems) organized into layers, mapped to capabilities. No cycles. End-to-end user request traces through layers. |
| 2 | physical-architecture | Where each logical box runs (cloud/on-prem, resources, comms). Ensures the NFRs described in QP are delivered and achieved when the software runs. |
| 3 | tech-stack | Libraries, languages, and **design patterns** picked per box. Patterns must be industry-documented (see Patterns section below). |
| 4 | technical-risks | What can go wrong, business cost if it hits, mitigation. **Produced last**, after everything else is selected and in place. |
| 5 | quality-profile (refined) | /specify produced a draft QP. /arch refines it. The refined QP describes the NFRs that physical must deliver. |

## NFR ownership

QP describes the NFRs (targets, levels, characteristics). Physical ensures those NFRs are delivered and achieved when the software runs. No separate nfr-spec artifact — the bridge between QP and physical was the artifact, and the bridge is no longer needed because physical directly delivers what QP describes.

## Patterns — what counts and where they live

Design patterns live **inside tech-stack**. A "pattern" means an industry-documented pattern with a literature reference — Gang of Four (Singleton, Factory, Observer, etc.), architectural patterns (microservice, monolith, serverless, modular monolith), UI/composition patterns (MVC, MVVM, MVP), data patterns (CQRS, event-sourcing, outbox, saga), resilience patterns (circuit breaker, bulkhead, retry-with-backoff, idempotency key). If a pattern isn't documented in industry literature, it doesn't go in.

System-level decisions (monolith vs. microservice vs. serverless) are considered design patterns. There is no separate "system-level pattern" concept — it's all just patterns inside tech-stack.

## Layers in logical and physical

Both logical and physical are organized into layers. The layer set is a **product-level input**, not a play-level constant. The play asks the user (or reads from project profile if pinned) which layer model applies. Once set for a product, it's load-bearing — moving components across layers later is major work.

KB carries blueprint layer models as memory (systems / process / experience / AOP from the conversation; the 7-layer IDSD model from #403; others). The agent surfaces blueprints when the product has no layer pin. The play does **not** enforce a fixed taxonomy.

## Systems inventory — precondition for logical

Components in logical and physical are real systems: ERP, CRM, CMS, DAM, identity, payment gateway, Salesforce, SAP, Stripe, Auth0, Contentful, etc. Before /arch can draw logical, it must know which systems are in play.

Systems live in KB the same way domains and stacks do today: one file per system, structured the same way KB-extension authoring requires (When to Use / When to Avoid / Scale Profile / Capabilities Served / Tradeoffs / Anti-Patterns or similar — final section list to be decided).

Capability → system mapping drives logical-arch construction. /specify already produced domain → capability. /arch walks capabilities and picks candidate systems from KB inventory.

When a needed system isn't in KB yet, /arch follows the same **pull-to-product + research-then-promote** flow that /specify uses for unseen domains:

1. If the system exists in KB → copy into product space with a provenance header (origin: kb).
2. If not → author the system file in product space with `origin: stm_research`, full required sections.
3. Downstream stages read from product folder, not KB.
4. Promotion to KB happens through /enrich after vetting.

Proposed KB path: `core/components/memory/knowledge/arch/systems/` (to confirm during rewrite — path follows existing arch KB layout).

## Stage order

1. **Systems inventory** — walk capabilities, pull-or-research systems into product folder. Does NOT depend on QP.
2. **Refine quality profile** — consume /specify's QP, refine. Independent of systems inventory. Gates only logical + physical (not stack, not risks, not systems inventory).
3. **Logical architecture** — systems placed into layers, capabilities mapped, no cycles, end-to-end traceability. Requires systems inventory + refined QP.
4. **Physical architecture** — deployment topology. Ensures every NFR described in QP is delivered when the software runs.
5. **Tech stack per box** — libraries, languages, patterns (industry-documented only). Independent of QP gating, but obviously needs logical+physical boxes to exist.
6. **Technical risks** — produced LAST, once everything is selected and in place. Risk identification with business cost and mitigation.

Stages 1 and 2 can run in either order or in parallel — they don't depend on each other. Stages 3 and 4 are sequential (physical needs logical). Stage 5 needs 3+4. Stage 6 needs everything.

Checkpoint count not locked yet — likely one per stage but may collapse where stages run together.

## Locked positions from the user

- QP describes NFRs; physical delivers them. No nfr-spec artifact.
- Patterns must be industry-documented. System-level is a pattern.
- QP cannot gate tech-stack or systems inventory.
- Technical risks come last.
- Layer model is per-product.
- KB is memory; user has authority.
- No tiebreaker rules baked into the play.
- No diagrams in this pass — YAML only.
- User will review the schema files.
- Rewrite the intent from scratch; don't audit current rules for survival.

## Open calls to make at intent.yaml draft time

These are unconfirmed details I'll make defensible calls on in the draft, flagged at the bottom for explicit review:

- **Cycle-detection scope** — logical (definite), and probably physical too. Tech-stack patterns aren't a dependency graph in the same sense, so likely out of scope.
- **Logical → physical mapping cardinality** — likely N:1 default (multiple logical components can collapse into one deployed service) with 1:N possible (one logical fans out for HA / sharding). Worth nailing.
- **Sync vs. async** — user dropped the question earlier saying "we are not putting a diagram yet". For YAML, whether each component-to-component edge in logical carries a sync/async flag is still open. Probably yes — it's design intent, not runtime mechanism.
- **Exact KB section list for systems** — mirror the existing arch KB shape but the final list of required sections to be decided in the rewrite.

## What this branch will produce

- A rewritten `core/components/plays/arch/reference/intent.yaml` at play-intent altitude — fresh, not edited from current.
- A regenerated `reference/expectation.yaml` (success_scenarios + recovery for the new shape) — via `draft-play-expectation`.
- A rebuilt `SKILL.md` via `/sud:create-play --build arch`.
- New KB skeleton at `core/components/memory/knowledge/arch/systems/` with the kb-extension format documented.
- A fresh `core/components/memory/standards/rules/architecture.md` aligned with the new model.
- New skills or skill rewrites likely needed: `derive-systems-inventory`, `refine-quality-profile`, `derive-tech-stack`, `derive-technical-risks`. Existing `derive-logical-architecture` and `derive-physical-architecture` will need substantive updates (layers, systems-as-components, NFR delivery framing).
