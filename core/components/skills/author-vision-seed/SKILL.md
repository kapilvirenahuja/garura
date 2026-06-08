---
name: author-vision-seed
description: Draft the /vision seed of the product model — a domain node, its candidate capability nodes (status proposed), a goals-only ICE per capability, and a directional product profile — into a draft folder in STM, from a business goal plus the KB grounding result. Generative artifact production for the /vision play; writes drafts only, never the live product model. Use when /vision needs the directional seed authored from a routed business goal.
version: 0.1.0
user-invocable: false
model: opus
allowed-tools: Read, Write, Bash, Glob
---

# author-vision-seed

Turns a business goal plus its KB grounding into the **directional seed** of the
product model, written as draft artifacts under STM. This is /vision's generative
worker: it decides the capability set, names them, writes their seed goals, and
sketches the directional profile. It never touches the live product model — the
play's apply step (a skip-if-exists writer) persists the draft on approval.

Everything it writes is deliberately shallow and directional. The deeper work —
full intent, context, expectations, concrete NFR targets, functionalities, a firm
profile — belongs to /understand and /shape, not here.

## Inputs

| Field | Required | Description |
|-------|----------|-------------|
| `goal` | yes | The business goal, free text (e.g. "order management for a D2C store"). |
| `grounding_path` | yes | The `search-kb` routing-result (JSON/YAML) mapping the goal to a domain + candidate capabilities, each with its KB shelf and `why`. |
| `proposals_dir` | no | Folder of any `propose-kb-node` proposals created for parts of the goal the KB did not cover. |
| `product_base` | yes | From config (`product.base-path`). Used **read-only** here, to learn which nodes already exist so the seed only drafts what is absent. |
| `draft_dir` | yes | Output folder under STM where the draft tree is written. |
| `stm_base` | yes | From config. |
| `issue` | no | Issue/run id for provenance stamping (often null for /vision — position none). |

## Procedure

Reasoning (naming capabilities, writing goals, picking directional levels) is
yours. Schema conformance is non-negotiable — every artifact validates against its
v1 schema.

1. **Read the grounding.** From `grounding_path`, take the routed domain and the
   candidate capabilities. Each capability must trace to a KB shelf (cited in the
   routing result) or to a proposal in `proposals_dir`. If a candidate has neither,
   do not draft it — drop it and note the gap.

2. **Check what already exists.** Read `product_base` to see whether the domain and
   any capabilities are already in the model. Draft only the **absent** ones. An
   existing domain may be extended with new capabilities; never re-draft an existing
   node, ICE, or the profile if one already exists.

3. **Draft the domain node.** One `node.yaml` with `type: domain`, `parent: null`,
   `status: proposed`, a stable `id`, a derived `path`, `name`, and a one-line
   `summary`. (See the product-os v1 schema for fields.)

4. **Draft the capability nodes.** For each absent candidate capability, a
   `node.yaml` with `type: capability`, `status: proposed`, `parent` = the domain
   id, an `ice_ref` pointing at its ICE, plus `id`, `path`, `name`, `summary`.

5. **Draft the seed ICE per capability.** One `ice.yaml` per capability with
   `intent.goals` populated (one or more goals expressing what the capability is
   for) and **nothing else** — `intent.constraints`, `intent.failures`, `context`,
   `expectations`, `nfr_needs`, `compliance_needs` are all left empty. Those are
   /understand's job.

6. **Draft the directional profile.** One `profile.yaml` with `state: directional`,
   the `shape` block filled at a rough cut (stage / users / monetization /
   surfaces), and `nfr` levels at a coarse directional guess. Do **not** firm gates,
   do not set `state: set`/`locked`, do not assemble a quality vision — that is
   /understand. Skip this entirely if a profile already exists.

7. **Write the draft tree + manifest.** Write the artifacts under `draft_dir` in a
   layout that mirrors the live model's relative paths, and a `seed-manifest.yaml`
   recording provenance so the play's grounding check and apply step are mechanical.

## Output — the draft tree

```
{draft_dir}/
  product-os/
    profile.yaml                                  # directional profile (omit if one exists)
    {domain-slug}/
      node.yaml                                   # domain node
      {capability-slug}/
        node.yaml                                 # capability node (status: proposed)
        ice.yaml                                  # seed ICE (goals only)
  seed-manifest.yaml                              # provenance + targets (stays in STM)
```

`seed-manifest.yaml`:

```yaml
seed:
  goal: "order management for a D2C store"
  domain: { id: dom-order-mgmt, name: "Order Management", target: "product-os/order-management/node.yaml" }
  profile: { target: "product-os/profile.yaml", drafted: true }   # drafted:false when one already existed
  capabilities:
    - id: cap-checkout
      name: "Checkout"
      node_target: "product-os/order-management/checkout/node.yaml"
      ice_target:  "product-os/order-management/checkout/ice.yaml"
      grounding: { kb_shelf: "ecommerce → Checkout" }             # OR: proposal: "<proposals_dir>/checkout.md"
  dropped: []                                                     # candidates with no grounding, not drafted
```

Return the enriched contract with `draft_dir` and the `seed-manifest.yaml` path —
paths, never inline content.

## Rules

- **Directional only.** Capabilities are `status: proposed`; the profile is
  `state: directional`. Never emit `active`, `set`, or `locked` here.
- **Goals-only ICE.** Seed ICE carries `intent.goals` and nothing else.
- **Grounded, not invented.** Every drafted capability traces to a KB shelf or a
  proposal — recorded in the manifest. A candidate with neither is dropped, not
  guessed.
- **Depth stops at capability.** Never draft a functionality node.
- **Drafts only.** Write under `draft_dir`. Never write to `product_base` — the play
  persists on approval.
- **Additive.** Draft only nodes/ICE/profile that are absent from `product_base`.
- **Schema-true.** Every artifact validates against its v1 schema (product-os, ice,
  product-profile).
