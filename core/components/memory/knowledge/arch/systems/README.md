# Systems Inventory KB

This directory is the canonical catalog of systems (real products and platforms a product's architecture depends on — ERP, CRM, CMS, DAM, identity providers, payment gateways, search engines, observability platforms, etc.). One file per system. Files here are READ-ONLY by the /arch pipeline — they are pulled into a product's space by `derive-systems-inventory` at Stage 1.

**Authoring path** — promotion to this directory happens through `/enrich` after a product run has authored an `origin: stm_research` system file in its own architecture/systems-inventory/ folder and the reviewer approves landing it as canonical. Never hand-edit at runtime; the per-product copy is the runtime source.

## Required shape

Every system file follows the KB-extension format defined in `core/components/memory/standards/rules/kb-extension.md`. The minimum shape:

```markdown
---
id: {kebab-case-system-id}
name: {Human-readable name}
category: erp | crm | cms | dam | identity | payment | search | observability | messaging | data-warehouse | analytics | content-delivery | edge | other
capabilities_served:
  - {capability_id from any domain's capability tree this system can serve}
sub_systems:                                    # optional; only when the system has capability-distinct surfaces
  - id: {sub-system-id}
    name: {Human-readable name}
    responsibilities:
      - {one bullet per primary responsibility}
    capabilities_served:
      - {capability_id}
---

# {Name}

## When to Use
{Prose. Conditions under which this system is the right choice for the kind of capability listed in capabilities_served. References product profile and NFR dimensions in context, not conditional rules.}

## When to Avoid
{Anti-conditions. Just as important as When to Use.}

## Scale Profile
{Sweet spot in team size, user count, data volume, throughput. Published SLA caps, where applicable. Where it shines, where it stretches, where it breaks.}

## Capabilities Served
{Prose list — same set as the frontmatter capabilities_served, with one line per capability explaining the fit.}

## Sub-Systems
{When the system has multiple capability-distinct surfaces, list each sub-system here with a one-paragraph description that mirrors the frontmatter sub_systems[] entry. When there are no sub-systems, write "None — this system is treated as a single surface."}

## Tradeoffs
{Cost, vendor lock-in, operational burden, integration cost, exit cost, ecosystem maturity. Helps later /arch stages reason about NFR delivery and risks.}

## Anti-Patterns
{Common mistakes when using this system. Misuses to call out for the implementing team.}
```

## Currently empty

This directory ships empty in the #403 redesign. As products run /arch and identify systems, they author them as `origin: stm_research` in product space. Approved entries promote here via /enrich.

When a product needs a system whose KB file exists here, `derive-systems-inventory` copies the file into the product's architecture/systems-inventory/ folder with a provenance header (origin: kb, kb_path, kb_version_sha, copied_at, editable: false). Downstream /arch stages read from product space — this KB is the authoring surface only.
