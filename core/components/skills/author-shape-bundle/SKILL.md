---
name: author-shape-bundle
description: Draft /shape's selection bundle for one domain — confirm or prune each capability against the firmed profile + KB, select the functionalities to build, and author each functionality's build-unit ICE, the persona records, and the journey records, plus the decisions for every prune and material selection. Writes a draft only, never the live model, with stable ids so re-runs don't duplicate. Generative artifact production for the /shape play.
version: 0.1.0
user-invocable: false
model: opus
allowed-tools: Read, Write, Bash, Glob
---

# author-shape-bundle

Turns a firmed domain — capabilities enriched by /understand, profile `set` — into a
**selection bundle**: which capabilities stay, which are pruned, which functionalities
to build under each, each functionality's build-unit ICE, the personas served, the
journeys travelled, and the decisions that record every prune and material choice. It
reads the profile to judge fit and the KB shelves to ground the selection. It writes a
draft only — /shape's checkpoint and apply step persist it.

It selects **against** the box; it never writes the profile. A selected functionality
whose need exceeds the box is not admitted here — it is flagged for the human to run
/understand (which owns the box), and left out of the bundle.

## Inputs

| Field | Required | Description |
|-------|----------|-------------|
| `domain_path` | yes | The domain folder in the live model, e.g. `{product_base}/product-os/order-management`. |
| `kb_shelf` | yes | The KB shelf this domain maps to (e.g. `ecommerce`), resolved by the play via `search-kb`. The product domain folder name is NOT the KB shelf name, so the shelf is passed in — never derived from `domain_path`. |
| `profile_path` | yes | The product `profile.yaml`. Read-only — used to judge fit, never written. |
| `draft_dir` | yes | Output folder under STM for the draft bundle. |
| `stm_base` | yes | From config. |

## Procedure

Reasoning (keep/prune judgment, naming functionalities and personas, writing
build-unit goals + scope, sketching journeys) is yours. Schema conformance and stable
ids are non-negotiable.

1. **Read the domain + the profile.** Load each capability's `node.yaml` + enriched
   `ice.yaml`, and the profile box. Read the KB shelf via the router using the
   `kb_shelf` the play resolved (`python3 $KB shelf <kb_shelf>`) — not the product
   domain name — for the functionality baseline.

2. **Confirm or prune each capability.** Against the profile fit and the capability's
   rich ICE, decide `active` (keep) or `deprecated` (prune). Record the reason — each
   prune becomes a decision.

3. **Select functionalities.** For each kept capability, choose the functionalities to
   build from the shelf's functionality baseline + the capability ICE. Every selected
   functionality must trace to a KB shelf entry or a recorded proposal — never invent.
   A functionality whose need exceeds the box is **not** selected here; flag it for
   /understand and leave it out.

4. **Author each functionality's build-unit ICE.** Light and functionality-specific:
   `intent.goals` (what this behaviour delivers) and `context.scope` (its own
   boundaries), with `context.persona` referencing the persona records below and
   `context.systems` inheriting the capability's. Do NOT re-do /understand's
   capability enrichment and do NOT pre-empt /grill's epic acceptance.

5. **Create personas + journeys.** Persona records (who the functionalities serve) and
   journey records (the ordered steps a persona takes). Both carry **stable ids
   derived from name/slug** so a re-run resolves to the same record, never a duplicate.

6. **Record decisions.** One decision (ADR) per prune and per material selection
   choice, at the right level (capability or functionality).

7. **Write the draft + manifest.** Write the bundle under `draft_dir` mirroring the
   live model's relative paths, plus a `shape-manifest.yaml` carrying the keep/prune
   list, the status flips, the grounding per kept capability + selected functionality,
   and the stable ids — so the play's validate, apply, and check steps are mechanical.

## Output — the draft bundle

```
{draft_dir}/
  product-os/{domain}/{capability}/
    functionalities/{functionality}/node.yaml   # type: functionality, parent: capability id
    functionalities/{functionality}/ice.yaml    # build-unit ICE (goals + scope + persona refs)
    personas/{persona-id}.yaml
    journeys/{journey-id}.yaml
    decisions/{decision-id}.yaml
  shape-manifest.yaml
```

`shape-manifest.yaml`:

```yaml
shape:
  domain: order-management
  capabilities:
    - id: cap-checkout                            # the capability NODE id
      path: order-management/checkout             # its folder, rel to product-os (slug != id)
      decision: active                            # active (keep) | deprecated (prune)
      grounding: { kb_shelf: "ecommerce -> Checkout" }
      status_flip: { from: proposed, to: active }
      functionalities:
        - id: fn-guest-checkout
          grounding: { kb_shelf: "ecommerce -> Checkout -> Guest checkout" }
          persona_refs: [persona-guest-shopper]
  personas: [persona-guest-shopper]
  journeys: [journey-first-guest-checkout]
  decisions: [dec-prune-cap-wishlist, dec-select-fn-guest-checkout]
  deferred_out_of_box: []                         # functionalities left for /understand (box move)
```

Return the enriched contract with the `draft_dir` and `shape-manifest.yaml` path —
paths, never inline content.

## Rules

- **Selector, never box-mover.** Read the profile; never write it. An out-of-box
  selection is deferred to /understand, not admitted (C6).
- **Grounded.** Every kept capability and selected functionality traces to a KB shelf
  or a proposal, recorded in the manifest (C3).
- **Stable ids.** Functionalities, personas, journeys use ids derived from name/slug so
  re-runs never duplicate (C8).
- **Soft prune.** A pruned capability is marked `deprecated`, never deleted (C8).
- **Status + create only.** Draft new functionality/persona/journey/decision records
  and capability status flips; never reparent, rename, or delete a node, and never edit
  a capability beyond its status (C7).
- **Light functionality ICE.** Functionality-specific goals + scope + persona refs;
  not a re-do of capability enrichment, not epic acceptance (C2).
- **Draft only.** Write under `draft_dir`; never touch the live model.
- **Schema-true.** Every artifact validates against its v1 schema.
