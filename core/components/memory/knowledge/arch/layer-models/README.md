# Layer Models KB

Blueprint layer models surfaced by `derive-logical-architecture` at Stage 3 when the product's `project-profile.layer_model` is not pinned. The agent presents these blueprints as candidates; the user picks one OR authors a product-specific model. Once chosen for a product, the layer model is load-bearing — every logical component and every physical component lives in exactly one layer of the chosen model. Adding or removing a layer after lock requires explicit user approval at a checkpoint.

The layer model is per-product, NOT a global constant. This KB is a menu of blueprints, not an enforcement.

## Currently in the catalog

| File | Shape | When it fits |
|------|-------|--------------|
| `systems-process-experience-aop.md` | 4 layers: experience, process, systems, AOP | Products organized around a core system-of-record stack (ERP / CRM / commerce platform) with a process layer composing them and an experience layer presenting them. AOP (aspect-oriented) layer for cross-cutting concerns. |
| `idsd-seven-layer.md` | 7 layers: infra, foundation, domain/data, runtime, intelligence, experience, playbooks | Products with a richer composition story — multi-system, multi-channel, agentic. Layers separate infra primitives from core services from domain systems from runtime engines from intelligence services from channels from composition. |

More blueprints land here over time as products run and propose new shapes via /enrich.

## Required shape

Every blueprint file has frontmatter:

```yaml
---
id: {kebab-case-blueprint-id}
name: {Human-readable name}
description: {one-sentence description}
layer_count: <int>
layers:
  - id: {kebab-case-layer-id}
    name: {Human-readable layer name}
    role: |
      {one or two lines describing what kind of components live here}
    order: <positive int, ascending from entry layer>
    is_entry: true | false              # exactly ONE layer has is_entry: true
---
```

And a body discussing:
- **When this blueprint fits** — qualitative criteria; references typical product shapes (consumer commerce, B2B SaaS, agentic platform, etc.).
- **When it does not fit** — anti-conditions.
- **Per-layer guidance** — what kinds of systems and components belong in each layer, with examples.
- **Common adaptations** — how products typically tweak the blueprint without inventing a wholly new model.
