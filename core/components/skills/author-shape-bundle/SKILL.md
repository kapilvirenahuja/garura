---
name: author-shape-bundle
description: Draft /shape's selection-and-composition bundle for one domain — confirm or prune each capability against the firmed profile + KB, SELECT which of the functionalities /understand already created to build now, place every functionality into a slice or the _deferred bucket, create the persona and USER journey records, the decisions, AND compose the domain's vertical slices. Every slice is a user-facing vertical — it names at least one surface (a screen/view a named persona opens and checks) scaffolded incrementally, and journeys run on those surfaces; a backend-only slice is invalid. Surfaces are NAMED, not designed. Slices reference functionalities by spine id, carry no order/effort/dependencies (that is /roadmap). It does NOT create functionalities or author ICE — /understand did. Writes a draft only, with stable ids so re-runs don't duplicate. Generative artifact production for the /shape play.
version: 0.2.0
user-invocable: false
model: opus
allowed-tools: Read, Write, Bash, Glob
---

# author-shape-bundle

Turns a firmed domain — capabilities detailed by /understand (each with its functionalities
already created), profile `set` — into a **selection-and-composition bundle**: which
capabilities stay, which are pruned, which existing functionalities to build now, the
personas served, the journeys travelled, the decisions, and the domain's vertical slices.
It reads the profile to judge fit and the KB shelves to ground the selection. It writes a
draft only — /shape's checkpoint and apply step persist it.

## Altitude — the product owner

/vision was the CXO, /understand the product manager. /shape is the **product owner**: it
decides what gets built and in what shippable shape. It does not detail (that was
/understand) and does not plan order (that is /roadmap). Its output is **deliverable
verticals** — each a thin slice a user can open and check.

## What it does NOT do

It does **not create functionalities** and does **not author ICE** — /understand already
created and detailed every functionality (a spine `functionalities` entry + a
`functionality.md`). /shape SELECTS among those and composes them; it never re-makes them.
It also never writes the profile (the box is /understand's; /shape selects against it) and
never cuts epics (/grill) or plans order (/roadmap).

## The always-scaffold-the-UI principle

A slice is a vertical only if a user can OPEN a surface and CHECK its outcome. So every
slice names at least one user-facing surface, and that surface is a **thin scaffold** — the
slice's own piece of the screen, not the whole dashboard. The UI is built up slice by
slice; the full product surface accretes as the slices land. Never cut a backend-only slice
(a pure ingestion or rollup layer with no surface), and never try to deliver "the whole
dashboard" in one slice.

## Inputs

| Field | Required | Description |
|-------|----------|-------------|
| `domain` | yes | The target domain: its id, slug, and the path to its folder under `{product_base}/product-os/`. |
| `kb_shelf` | yes | The KB shelf this domain maps to, resolved by the play via `search-kb` (the product domain name is NOT the shelf name). |
| `product_base` | yes | From config. Read **only** — to load the live spine (capabilities + their functionalities, all detailed) and the profile. |
| `draft_dir` | yes | Output folder under STM for the draft bundle. |
| `stm_base` | yes | From config. |

## Procedure

Reasoning (keep/prune judgment, which functionalities to build now, naming personas,
sketching journeys, cutting slices toward surfaces) is yours. Schema conformance and stable
ids are non-negotiable.

1. **Read the domain + the profile.** From the live `_spine.yaml`, load the domain's
   capabilities (all `detail: detailed`) and their functionalities, plus the profile box.
   Read the KB shelf via the router (`python3 $KB shelf <kb_shelf>`) for selection grounding.

2. **Confirm or prune each capability.** Against profile fit and the capability's grounding,
   decide `active` (keep) or `deprecated` (prune). Each prune becomes a decision. (Status
   flip only — never edit the capability otherwise.)

3. **Select the functionalities to build now.** From the functionalities /understand already
   created under each kept capability, choose which to build in this round. Selecting is a
   prioritization call, not creation — you never make a new functionality here. Every
   selected functionality must land in a slice or the `_deferred` bucket (step 7).

4. **Create personas + user journeys.** Persona records (who the functionalities serve) and
   journey records. A journey is a **user journey through a surface** — the ordered steps a
   persona takes ON a named surface to reach an outcome, never a backend pipeline. Each
   journey lists its `surface_refs` (the slice surface ids it runs on) and its steps. Stable
   ids from name/slug.

5. **Record decisions.** One decision (ADR) per prune and per material selection choice, at
   the right level (capability or functionality).

6. **Compose vertical slices — each with a scaffolded surface.** Bundle the selected
   functionalities into the domain's slices — **vertical** increments cut TOWARD a
   user-facing surface, that may cross capabilities of THIS domain. For each slice: a stable
   id, a name, an outcome (the usable thing it delivers), the **`surface`** list (≥1 surface,
   each with a stable `id`, a `name`, the `persona_ref` who opens it, and the `user_action`),
   an `acceptance_intent`, and a `functionalities` list where each entry carries the
   `functionality_ref` (the spine functionality id — the reference IS the id; the grounding
   is its `functionality.md`) and a `delivery` flag (`full` | `partial`). NAME the surface,
   never DESIGN it (no wireframes/components — that is /realize's UX lens). The surface is a
   thin scaffold (this slice's piece of screen), not the whole product UI. Wire each surface
   to a journey. Do NOT set `order`, `effort`, or resolved `depends_on` (that is /roadmap).
   Every selected functionality must land in at least one slice OR the `_deferred` bucket.

7. **Write the draft + manifest.** Write the bundle under `draft_dir` mirroring the live
   model's relative paths, plus a `shape-manifest.yaml` carrying the keep/prune list, the
   capability status flips, the grounding per kept capability + selected functionality, the
   slices + deferred bucket, the persona/journey/decision ids, and the spine delta — so the
   play's validate, apply, and check steps are mechanical.

## Output — the draft bundle

```
{draft_dir}/
  product-os/
    _spine.yaml                                   # DELTA: capability status flips (active/deprecated),
                                                  # persona/journey/decision refs on the capabilities,
                                                  # and the slices index entries (id, slug, domain_ref,
                                                  # status, functionality_refs, record pointer)
    {domain}/{capability}/
      personas/{persona-id}.yaml                  # persona record (referenced by spine)
      journeys/{journey-id}.yaml                  # journey record (surface_refs + steps)
      decisions/{decision-id}.yaml                # ADR per prune + material selection
    {domain}/slices/{slice-id}.yaml               # slice record (references functionalities by spine id)
    {domain}/slices/_deferred.yaml                # selected-but-not-placed functionalities (if any)
  shape-manifest.yaml
```

A slice references functionalities by their spine id; the surface is named, not designed:

```yaml
slice:
  id: slice-trusted-coverage
  domain_ref: dom-token-dash
  name: "Trusted source coverage"
  outcome: "A CTO opens the coverage view and sees every source's trust state from fixtures"
  surface:                                        # REQUIRED — ≥1; a thin scaffold, named not designed
    - id: surface-coverage-view
      name: "Source coverage view"
      persona_ref: persona-cto
      user_action: "open the coverage view and read each source's resolved trust state"
  functionalities:                                # references by SPINE ID — no ice_ref paths
    - { functionality_ref: func-source-usage-ingest,   delivery: full }
    - { functionality_ref: func-privacy-trust-labeling, delivery: full }
    - { functionality_ref: func-source-coverage-freshness, delivery: full }
    - { functionality_ref: func-dashboard-presentation, delivery: partial }   # this slice's screen scaffold
  acceptance_intent: "the CTO can open the coverage view and every source shows a resolved trust state"
  status: proposed
  # order / effort / depends_on intentionally absent — /roadmap fills these
```

`shape-manifest.yaml` carries the keep/prune list, status flips, grounding, the slices +
deferred bucket, the persona/journey/decision ids, and the spine delta.

Return the enriched contract with the `draft_dir` and `shape-manifest.yaml` path — paths,
never inline content.

## Rules

- **Select + compose, never create.** Choose among the functionalities /understand created;
  never make a functionality or author ICE here.
- **Selector, never box-mover.** Read the profile; never write it.
- **Grounded.** Every kept capability and selected functionality traces to a KB shelf or a
  proposal, recorded in the manifest.
- **Stable ids.** Personas, journeys, decisions, slices use ids from name/slug so re-runs
  never duplicate.
- **Soft prune.** A pruned capability is `deprecated`, never deleted; status flip only,
  never edit a capability otherwise.
- **Every slice is a user-facing vertical with a scaffolded surface.** Each slice names ≥1
  surface a persona opens and checks; a backend-only or one-per-capability horizontal slice
  is invalid. NAME the surface, never DESIGN it; the surface is a thin scaffold, not the
  whole UI.
- **Journeys are user journeys.** Each journey traverses a named surface via `surface_refs`;
  every surface a slice names is reached by at least one journey.
- **Slices reference by spine id.** A slice points at each functionality by its spine
  `functionality_ref` id; the functionality's grounding stays the single source of truth.
- **Cover every functionality.** Every selected functionality lands in a slice or the
  `_deferred` bucket — nothing unplaced. A functionality may appear in more than one slice.
- **Compose, don't plan.** Slices carry no `order`, `effort`, or resolved `depends_on` —
  that is /roadmap's. Free-text `dependency_notes` are fine.
- **Draft only.** Write under `draft_dir`; never touch the live model.
- **Schema-true.** Slice records conform to the slice schema; the spine delta conforms to
  the spine schema; persona/journey/decision records conform to their schemas.
```
