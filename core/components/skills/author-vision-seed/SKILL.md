---
name: author-vision-seed
description: Draft the /vision seed of the product model — a detailed domain grounding doc, directional capability grounding docs, the matching spine entries (domain + capability nodes, status proposed), and a directional product profile — into a draft folder in STM, from a business goal plus the KB grounding result. Generative artifact production for the /vision play; writes drafts only, never the live product model. Use when /vision needs the directional seed authored from a routed business goal.
version: 0.2.0
user-invocable: false
model: opus
allowed-tools: Read, Write, Bash, Glob
---

# author-vision-seed

Turns a business goal plus its KB grounding into the **seed** of the product model,
written as draft artifacts under STM. This is /vision's generative worker: it details
the domain, names the capabilities and gives them directionality, sketches the
directional profile, and lays down the spine entries that wire it together. It never
touches the live product model — the play's apply step (an additive merge) persists
the draft on approval.

## Altitude — write at CXO level

/vision is the **CXO conversation**: what you take to a CXO and what they give back.
So the grounding here is strategic and outcome-led — the domain and the bet, the big
directional capability areas, what "good" looks like at a strategic level. Detailing a
capability into functionalities is the **product manager's** job (/understand); breaking
it into deliverable verticals is the **product owner's** job (/shape). Write nothing at
those altitudes here.

What that means concretely:
- The **domain** is named AND detailed — a full domain grounding doc a CXO would
  recognize as their product's strategy.
- Each **capability** is named and given **directionality only** — what it is about, the
  rough direction of its scope, and why it matters. No benefit-proof, no boundary
  detail, no functionalities. That is /understand.

## The grounding contracts (non-negotiable)

Every grounding doc you write conforms to its locked template under
`standards/schemas/product-os/grounding/` and clears the content standard
(`_content-standard.md`) — because the play runs the linter (shape) and the
content-quality eval (a judge) over your drafts, and a thin doc is rejected:

- `domain.md` → the **Theme** template (full): Intent, Business goal, Guiding rules,
  Capabilities, Scope (In / Out).
- `capability.md` → the capability template, **DIRECTIONAL** stage: a single
  `## Directional intent` section. Substantive and self-explaining (the *why*), at CXO
  altitude — not the detailed shape, which /understand writes.

Every item explains itself: name the thing AND say why it matters or what it implies.
Telegraphic labels ("Local fixtures only") fail the eval.

## Inputs

| Field | Required | Description |
|-------|----------|-------------|
| `goal` | yes | The business goal, free text (e.g. "order management for a D2C store"). |
| `grounding_path` | yes | The `search-kb` routing result mapping the goal to a domain + candidate capabilities, each with its KB shelf and `why`. |
| `proposals_dir` | no | Folder of any `propose-kb-node` proposals for parts the KB did not cover. |
| `product_base` | yes | From config (`product.base-path`). Read **only** here — to learn which nodes already exist so the seed drafts only what is absent. |
| `draft_dir` | yes | Output folder under STM where the draft tree is written. |
| `stm_base` | yes | From config. |
| `issue` | no | Issue/run id for provenance (often null for /vision). |

## Procedure

Reasoning — detailing the domain, naming capabilities, writing their directional
intent, picking directional profile levels — is yours. Template conformance and the
content bar are non-negotiable.

1. **Read the grounding.** Take the routed domain and candidate capabilities. Each
   capability must trace to a KB shelf (cited in the routing result) or a proposal in
   `proposals_dir`. A candidate with neither is dropped, not invented — note the gap.

2. **Check what already exists.** Read `product_base`'s `_spine.yaml` (if present) to
   see whether the domain and any capabilities are already in the model. Draft only the
   **absent** ones. An existing domain may gain new capabilities; never re-draft an
   existing node, doc, or the profile.

3. **Draft the domain grounding doc.** `{domain-slug}/domain.md` to the Theme template,
   in full, at CXO altitude — the problem the domain owns and the bet behind it, the
   operating principles/hard rules that define it, the directional capabilities, and the
   in/out scope. This is the detailed artifact a CXO validates.

4. **Draft each capability grounding doc.** `{domain-slug}/{capability-slug}/capability.md`
   to the capability template's **directional** stage — one `## Directional intent`:
   what the capability is about, the rough direction of its scope, and why it matters to
   the domain. Directional, self-explaining, CXO altitude. No functionalities.

5. **Draft the spine entries.** Write a draft `_spine.yaml` carrying (first-class
   collections — the kind is the collection, there is no `type` field):
   - one **`domains`** entry — `id`, `slug`, `status: proposed`, a one-sentence
     `one_line`, and `doc` pointing at its `domain.md`.
   - a **`capabilities`** entry per capability — `id`, `slug`, `domain` = the domain id
     (the named parent relation), `status: proposed`, `detail: directional`, `one_line`,
     and `doc` pointing at its `capability.md`.
   - the **directional profile** block — `state: directional`, the `shape` at a rough
     cut (stage / users / monetization / surfaces) and `nfr` levels at a coarse
     directional guess. No firm gates, no `set`/`locked`, no quality vision — that is
     /understand. Omit the profile block if one already exists in the live spine.

6. **Write the draft tree + manifest.** Write the artifacts under `draft_dir` mirroring
   the live model's relative paths, plus a `seed-manifest.yaml` recording provenance and
   KB grounding so the play's grounding check and apply step are mechanical.

## Output — the draft tree

```
{draft_dir}/
  product-os/
    _spine.yaml                                   # draft spine: domains + capabilities entries + directional profile
    {domain-slug}/
      domain.md                                   # full domain grounding (Theme template)
      {capability-slug}/
        capability.md                             # directional capability grounding
  seed-manifest.yaml                              # provenance + KB grounding (stays in STM)
```

`seed-manifest.yaml`:

```yaml
seed:
  goal: "order management for a D2C store"
  domain: { id: dom-order-mgmt, name: "Order Management", doc: "product-os/order-management/domain.md" }
  profile: { drafted: true }                       # drafted:false when one already existed
  capabilities:
    - id: cap-checkout
      name: "Checkout"
      doc: "product-os/order-management/checkout/capability.md"
      detail: directional
      grounding: { kb_shelf: "ecommerce → Checkout" }   # OR: proposal: "<proposals_dir>/checkout.md"
  dropped: []                                      # candidates with no grounding, not drafted
```

Return the enriched contract with `draft_dir` and the `seed-manifest.yaml` path —
paths, never inline content.

## Rules

- **CXO altitude.** Strategic and directional. No functionalities, no acceptance
  criteria, no delivery sequencing — those belong to /understand and /shape.
- **Domain detailed, capabilities directional.** The domain doc is full; each
  capability doc is the directional stage (one `## Directional intent`).
- **Grounded, not invented.** Every drafted capability traces to a KB shelf or a
  proposal, recorded in the manifest. A candidate with neither is dropped.
- **Directional only.** Capability entries are `status: proposed`, `detail: directional`;
  the profile is `state: directional`. Never emit `active`, `set`, `locked`, or
  `detail: detailed` here.
- **Self-explaining.** Every grounding item names the thing and explains the why — it
  must clear the content standard, because the eval will judge it.
- **Drafts only.** Write under `draft_dir`. Never write to `product_base`.
- **Additive.** Draft only entries/docs/profile absent from the live spine.
- **Template-true.** Every doc conforms to its grounding template; the spine entries
  conform to the spine schema (`standards/schemas/product-os/spine.yaml`).
```
