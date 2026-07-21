---
name: author-vision-seed
description: Author the /vision seed of the product model — a detailed domain grounding doc and directional capability grounding docs — straight to the live model, and emit the matching spine-delta (domain + capability entries, status proposed, detail directional, and the directional profile block) as structured data in the seed manifest. Generative artifact production for the /vision play. Under direct-model-write (ADR 026) it writes ONLY the per-node docs (domain.md, capability.md) in place, skip-if-exists, and NEVER writes _spine.yaml or the profile — the play's keyed persist script merges the manifest's spine-delta into the live spine additively. Use when /vision needs the directional seed authored from a routed business goal.
version: 0.3.0
user-invocable: false
model: opus
allowed-tools: Read, Write, Bash, Glob
---

# author-vision-seed

Turns a business goal plus its KB grounding into the **seed** of the product model. This
is /vision's generative worker: it details the domain, names the capabilities and gives
them directionality, sketches the directional profile, and lays down the spine entries
that wire it together. Under direct-model-write (ADR 026) it writes the per-node grounding
docs straight to the live model and emits the spine-delta as structured manifest data;
/vision's checkpoint and keyed persist script turn that manifest into the spine/profile
writes.

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

## Write discipline — direct-model-write containment split (ADR 026)

This skill is the LLM worker in a direct-model-write play. Per
`standards/rules/direct-model-write.md` it obeys the **containment split**, and this is
mandatory:

- It writes ONLY the per-node grounding docs — the `domain.md` and one `capability.md`
  per capability — **straight to the live model** under `{product_base}product-os/`, each
  its own file. There is no `draft/` tree.
- It writes a doc **skip-if-exists**: it reads the live model first and writes only a
  doc that is ABSENT. It never overwrites or redraws an existing domain or capability doc
  (/vision is additive; the play's scoped guard marks the docs `--add-only`, so an
  overwrite would fail the run).
- It **NEVER** writes any shared model file: not `_spine.yaml`, not the profile block.
  The spine/profile mutations are the job of /vision's deterministic keyed persist script,
  which reads this skill's manifest.
- The spine-delta it used to write into a draft `_spine.yaml` — the domain entry, the
  capability entries, and the directional profile block — is now emitted as **structured
  data in `seed-manifest.yaml`** (a non-model STM artifact). The keyed persist script
  merges those entries into the live spine additively (add-only by id; profile only if
  absent).

Because the LLM only ever writes separate doc files, /vision's file-level scoped guard is
sufficient for this skill's blast radius, and node-level containment inside the shared
spine is preserved by the keyed script.

## The grounding contracts (non-negotiable)

Every grounding doc you write conforms to its locked template under
`standards/schemas/product-os/grounding/` and clears the content standard
(`_content-standard.md`) — because the play runs the linter (shape) and the
content-quality eval (a judge) over your docs, and a thin doc is rejected:

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
| `product_base` | yes | From config (`product.base-path`). The live model root: read the existing spine + docs (to write only what is ABSENT), and WRITE the `domain.md` + `capability.md` docs in place under `{product_base}product-os/`. Only per-node docs — never a shared file. |
| `manifest_path` | yes | Where to write `seed-manifest.yaml` (STM, non-model) — carries the spine-delta as structured data for the keyed persist script. |
| `stm_base` | yes | From config. |
| `issue` | no | Issue/run id for provenance (often null for /vision). |

## Procedure

Reasoning — detailing the domain, naming capabilities, writing their directional
intent, picking directional profile levels — is yours. Template conformance and the
content bar are non-negotiable.

1. **Read the grounding.** Take the routed domain and candidate capabilities. Each
   capability must trace to a KB shelf (cited in the routing result) or a proposal in
   `proposals_dir`. A candidate with neither is dropped, not invented — note the gap.

2. **Check what already exists.** Read `product_base`'s `_spine.yaml` (if present) and
   the live doc tree to see whether the domain and any capabilities are already in the
   model. Write only the **absent** ones. An existing domain may gain new capabilities;
   never re-write an existing doc, and never emit a spine-delta entry for an id already
   in the live spine.

3. **Write the domain grounding doc, in place.** `{domain-slug}/domain.md` to the Theme
   template, in full, at CXO altitude — the problem the domain owns and the bet behind
   it, the operating principles/hard rules that define it, the directional capabilities,
   and the in/out scope. Write it under `{product_base}product-os/` only if it does not
   already exist. This is the detailed artifact a CXO validates.

4. **Write each capability grounding doc, in place.**
   `{domain-slug}/{capability-slug}/capability.md` to the capability template's
   **directional** stage — one `## Directional intent`: what the capability is about, the
   rough direction of its scope, and why it matters to the domain. Directional,
   self-explaining, CXO altitude. No functionalities. Write it under
   `{product_base}product-os/` only if it does not already exist.

5. **Emit the spine-delta into the manifest (never `_spine.yaml`).** In the manifest's
   `spine_delta` block record — as structured data the keyed persist script applies —
   (first-class collections; the kind is the collection, there is no `type` field):
   - one **`domains`** entry — `id`, `slug`, `status: proposed`, a one-sentence
     `one_line`, and `doc` pointing at its `domain.md`.
   - a **`capabilities`** entry per capability — `id`, `slug`, `domain` = the domain id
     (the named parent relation), `status: proposed`, `detail: directional`, `one_line`,
     and `doc` pointing at its `capability.md`.
   - the **directional `profile`** block — `state: directional`, the `shape` at a rough
     cut (stage / users / monetization / surfaces) and `nfr` levels at a coarse
     directional guess. No firm gates, no `set`/`locked`, no quality vision — that is
     /understand. Omit the profile block if one already exists in the live spine.

   Emit into the delta ONLY entries whose id is absent from the live spine (step 2) — the
   persist script also merges additively, but the manifest should already reflect the
   additive intent.

6. **Write the manifest.** Write `seed-manifest.yaml` to `manifest_path` — the
   `spine_delta` (step 5) plus the provenance + KB grounding so the play's grounding check
   and keyed persist are mechanical. Never write `_spine.yaml` or the profile yourself.

## Output — live docs + the manifest

Written straight to the live model (no draft tree), skip-if-exists:

```
{product_base}product-os/
  {domain-slug}/
    domain.md                                     # full domain grounding (Theme template), in place
    {capability-slug}/
      capability.md                               # directional capability grounding, in place
```

Plus the manifest (STM, non-model) at `manifest_path`, carrying the spine-delta:

```yaml
seed:
  goal: "order management for a D2C store"
  domain: { id: dom-order-mgmt, name: "Order Management", doc: "product-os/order-management/domain.md" }
  spine_delta:                                     # persist merges this into the live _spine.yaml additively
    domains:
      - { id: dom-order-mgmt, slug: order-management, status: proposed, one_line: "Own the order lifecycle end to end", doc: order-management/domain.md }
    capabilities:
      - { id: cap-checkout, slug: checkout, domain: dom-order-mgmt, status: proposed, detail: directional, one_line: "Turn a cart into a paid order", doc: order-management/checkout/capability.md }
    profile:                                       # omitted entirely when a live profile already exists
      state: directional
      shape: { stage: mvp, users: consumers, monetization: transactional, surfaces: [web] }
      nfr: { performance: medium, reliability: high, security: high }
  capabilities:                                    # provenance / KB grounding (stays in STM)
    - id: cap-checkout
      name: "Checkout"
      doc: "product-os/order-management/checkout/capability.md"
      detail: directional
      grounding: { kb_shelf: "ecommerce → Checkout" }   # OR: proposal: "<proposals_dir>/checkout.md"
  dropped: []                                      # candidates with no grounding, not written
```

Return the enriched contract with the live doc paths written and the `seed-manifest.yaml`
path — paths, never inline content.

## Rules

- **CXO altitude.** Strategic and directional. No functionalities, no acceptance
  criteria, no delivery sequencing — those belong to /understand and /shape.
- **Domain detailed, capabilities directional.** The domain doc is full; each
  capability doc is the directional stage (one `## Directional intent`).
- **Grounded, not invented.** Every capability written traces to a KB shelf or a
  proposal, recorded in the manifest. A candidate with neither is dropped.
- **Directional only.** Capability entries are `status: proposed`, `detail: directional`;
  the profile is `state: directional`. Never emit `active`, `set`, `locked`, or
  `detail: detailed` here.
- **Self-explaining.** Every grounding item names the thing and explains the why — it
  must clear the content standard, because the eval will judge it.
- **Docs live, shared files never (containment split, ADR 026).** Write the `domain.md`
  and `capability.md` docs straight to the live model, skip-if-exists. NEVER write
  `_spine.yaml` or the profile block — emit their delta as manifest data. Never touch a
  node that already exists.
- **Additive.** Write only docs absent from the live model, and emit spine-delta entries
  only for ids absent from the live spine.
- **Template-true.** Every doc conforms to its grounding template; the manifest spine
  entries conform to the spine schema (`standards/schemas/product-os/spine.yaml`).
```
