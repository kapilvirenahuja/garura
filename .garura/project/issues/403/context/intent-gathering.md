# /arch play redesign — intent gathering

Captured at start-feature time so the conversation that led into this branch is not lost. Issue #403 was the trigger ("logical-architecture output is YAML schema dump"), but the scope has expanded into a full /arch play redesign at the play-intent level.

## What this work is

Fix the /arch play. The play exists, it runs, what it produces is the wrong shape for both humans and downstream LLMs. This is an **intent change** to the /arch play (its output contract, stage order, and constraints are all moving), so it goes through `reference/intent.yaml` → `/sud:create-play --build arch`, not direct edits to SKILL.md.

The user is the source of truth. KB is memory the agent reads. No new tiebreaker rules — selection authority comes from quality profile, project profile, and user answers when KB offers multiple candidates.

## The new output contract — five artifacts

| # | Artifact | What it carries | Replaces today's |
|---|----------|-----------------|------------------|
| 1 | logical-architecture | Components (= named systems), organized into layers, mapped to capabilities. No cycles. End-to-end user request traces through layers. | logical-architecture (today) |
| 2 | physical-architecture | Where each logical box runs (cloud/on-prem, resources, comms). Every mechanism cites the QP target it satisfies. Owns NFR delivery mechanisms. | physical-architecture + nfr-spec, merged |
| 3 | tech-stack | Libraries/languages per box. Grounded in QP + project profile + user answers. KB is reference. | (new — implicit in physical today) |
| 4 | technical-risks | What can go wrong, business cost if it hits, mitigation. | (new — does not exist today) |
| 5 | quality-profile (refined) | /specify produced a draft QP. /arch consumes, refines targets given architectural reality, records every delta with rationale. QP refinement gates everything else. | quality-vision (renamed and rescoped) |

Today's /arch produces five artifacts too — logical, physical, nfr-spec, quality-vision, design-patterns. The renaming is structural, not cosmetic:

- **nfr-spec disappears.** Its work splits: QP defines targets (artifact 5); physical names mechanisms and cites the QP target each one delivers (artifact 2).
- **design-patterns disappears.** System-level pattern decisions (monolith vs. microservice) land in tech-stack (artifact 3). Component-level patterns drift into the layer definitions of logical-architecture (artifact 1).
- **tech-stack and technical-risks are net-new** first-class artifacts.

## NFR ownership — locked

Quality profile defines the targets (p95 < 200ms, 99.9% uptime, etc.). Physical names the mechanisms that deliver them (CDN here, autoscaler there, queue with retry). No duplication — physical references the QP target it satisfies. Same NFR, two views.

## Layers in logical and physical

Both logical and physical are organized **into layers**. The layer set is a **product-level input**, not a play-level constant. The play asks the user (or reads from project profile if pinned) which layer model applies; once set for a product, it's load-bearing — moving components across layers later is major work.

KB carries blueprint layer models as memory (systems / process / experience / AOP from the conversation; the 7-layer IDSD model from #403; others). The agent surfaces these blueprints when the product has no layer pin. The play does **not** enforce a fixed taxonomy.

## Systems inventory — precondition for logical

Components in logical and physical are real systems: ERP, CRM, CMS, DAM, identity, payment gateway, Salesforce, SAP, Stripe, Auth0, Contentful, etc. Before /arch can draw logical, it must know which systems are in play.

Systems live in KB the same way domains and stacks do today: one file per system at `core/components/memory/knowledge/arch/systems/{system}.md`, each with When to Use / When to Avoid / Scale Profile / Capabilities Served / Tradeoffs / Anti-Patterns.

Capability → system mapping drives logical-arch construction. /specify already produced domain → capability. /arch walks capabilities, picks candidate systems from KB inventory.

When a needed system isn't in KB yet, /arch follows the same **pull-to-product + research-then-promote** flow that /specify uses for unseen domains:

1. If the system exists in KB → copy to `{product_base}/architecture/systems/{system}.md` with a provenance header (origin: kb).
2. If not → author the system file in product space with `origin: stm_research`, full required sections per kb-extension conventions.
3. Downstream stages read from product folder, not KB.
4. Promotion to KB happens through /enrich after vetting.

## Stage order

1. **Refine quality profile** — consume /specify's QP, adjust, lock. Gates everything else.
2. **Build systems inventory for this product** — walk capabilities, pull-or-research systems into product folder.
3. **Build logical architecture** — systems placed into layers, capabilities mapped, no cycles, end-to-end traceability.
4. **Build physical architecture** — deployment topology, every mechanism cites a QP target.
5. **Pick tech stack per box** — grounded in QP, project profile, user answers.
6. **Name technical risks** — what can go wrong, business cost, mitigation.

Each stage ends with a human checkpoint. Each emits its artifact plus a decision-manifest (the existing C18 / C19 tier discipline survives).

## Rules — staying the same

The selection-discipline machinery already in /arch survives:

- Logical stays tech-agnostic (current C3, F3).
- Every decision cites an upstream driver (current C4, F4).
- Every selected capability maps to a component (current C5, F5).
- Source-type discipline on every pick — grounded_tools pin, KB single, KB multi + user, agent default + user approval; silent picks blocked (current C15, C16, C17, F14, F15, F16, F17).
- Decision-surfacing tier discipline — high (batch confirm), mid (batch with questions), low (one-by-one), surfaced before commit (current C18, C19, F18, F19).
- Artifacts under .garura/product/architecture/ via scriber (current C11, F12).
- ADRs for non-obvious decisions (current C10, F10).
- Five human checkpoints, dependency-ordered (current C13, F11).

## Rules — changing

- C9 (design-patterns layer coverage) drops with the artifact.
- C6 (NFR → mechanism in physical or design-patterns) collapses to NFR → mechanism in physical only.
- C3 (logical = tech-agnostic, physical = specific products) extends: both logical and physical are organized by layers; logical components are NAMED SYSTEMS, not anonymous boxes.

## Rules — net-new

- Cyclic dependencies between components are not allowed. Scope: logical (definitely), physical (probably — to confirm).
- End-to-end traceability of a user request through layers is a validation gate on logical-architecture.
- Layer model is a product-level input the play asks for at QP-refine time (or reads from project profile).
- Systems inventory is a stage gate — logical cannot be drawn until it's populated.
- Quality profile is refined (not just consumed) and the refined QP gates physical/logical.
- Technical risks artifact is produced with at-least: risk, business cost, mitigation.

## User-confirmed positions

- "we are not putting a diagram yet" — diagram emission (mermaid blocks, sibling .md) is out of scope for this pass. YAML-only output. Visualization can come later.
- "we dont need any more rules" — no new tiebreaker rules baked into the play. User decides, QP/PP carry the decision.
- "the system is being built by the user" — KB is memory the agent reads; the user has authority.
- "we are not locking [the layer taxonomy]" — per-product, not global.
- "THIS IS NOT TO BUILD ARCHITECTURE DOCUMENTS. THIS IS THE PLAY THAT WILL EVENTUALLY MAKE IT" — every constraint is at the play-intent altitude, not at one specific product's arch altitude.
- User will review the schema files when written.

## Open / pending

- Cardinality of logical→physical mapping (1:1, N:1, 1:N) — flagged once, never landed. Worth nailing in the rebuild.
- Cycle-detection scope: logical only, or also physical/tech-stack? User said "cyclic dependencies are bad and are not allowed" without scoping.
- Sync/async at the logical layer — user dropped the question ("we are not putting a diagram yet"); revisit if it surfaces during the rebuild.

## What this branch will produce

- A rewritten `core/components/plays/arch/reference/intent.yaml` at play-intent altitude — five new outputs, new stage order, surviving + changing + new constraints, surviving + changing + new failure conditions.
- A rewritten `reference/expectation.yaml` (success_scenarios + recovery for the new shape).
- A rebuilt `SKILL.md` via `/sud:create-play --build arch`.
- New KB skeleton at `core/components/memory/knowledge/arch/systems/` with the kb-extension format documented.
- Updated `core/components/memory/standards/rules/architecture.md` — drop the design-patterns and nfr-spec rules; add the cycle rule, layer rule, systems-inventory rule.
- Likely new skills or skill rewrites: `derive-systems-inventory`, `refine-quality-profile`, `derive-tech-stack`, `derive-technical-risks`. The existing `derive-logical-architecture` and `derive-physical-architecture` will need updates for layers and the systems-as-components shift.
