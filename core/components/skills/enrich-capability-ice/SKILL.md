---
name: enrich-capability-ice
description: Detail one capability that /vision seeded — promote its capability.md from the directional stage to the detailed stage (benefit hypothesis, boundary, guiding rules, functionalities), author a detailed functionality.md grounding doc for each functionality it identifies, set the capability's structured nfr_needs + compliance_needs, and emit the implied per-dimension levels. Grounded in the capability's KB shelf. Generative artifact production for the /understand play. Under direct-model-write (ADR 026) it writes ONLY the per-node docs (capability.md, functionality.md) straight to the live model, and emits every shared-file delta (the spine entry fields, the new functionality entries) as structured data in the enrich-manifest — it NEVER writes _spine.yaml, profile.yaml, or decisions. Use when /understand needs a seeded capability detailed and its functionalities created.
version: 0.3.0
user-invocable: false
model: opus
allowed-tools: Read, Write, Bash, Glob
---

# enrich-capability-ice

Takes a capability that /vision seeded — named, directional, no functionalities — and
**details it**: it deepens the capability's grounding from the directional stage to the
detailed stage, **identifies and authors its functionalities**, and sets the capability's
own NFR needs. This is /understand's generative worker — the **product-manager** step,
where the product is understood in full down to the functionality. Under direct-model-write
(ADR 026) it writes the per-node docs straight to the live model and emits the shared-file
delta as structured manifest data; /understand's checkpoint, roll-up, and keyed persist
script turn that manifest into the spine/profile/decision writes.

## Altitude — write at product-manager level

/vision was the CXO conversation (directional). /understand is the **product manager**
detailing the product. So the writing here is concrete and complete — the full capability
and its functionalities, the detail a build needs — but still product language, not code.
Sequencing the work into deliverable verticals is the **product owner's** job (/shape); do
none of that here.

## Write discipline — direct-model-write containment split (ADR 026)

This skill is the LLM worker in a direct-model-write play. Per
`standards/rules/direct-model-write.md` it obeys the **containment split**, and this is
mandatory:

- It writes ONLY the per-node grounding docs — the target's `capability.md` and one
  `functionality.md` per functionality — **straight to the live model** under
  `{product_base}product-os/`, each its own file. There is no `draft/` tree.
- It **NEVER** writes any shared model file: not `_spine.yaml`, not `profile.yaml`, not
  `decisions/`. The spine/profile/decision mutations are the job of /understand's
  deterministic keyed persist script, which reads this skill's manifest.
- The spine-delta it used to write into a draft `_spine.yaml` — the target capability's
  `detail`/`nfr_needs`/`compliance_needs` and the new `functionalities` entries — is now
  emitted as **structured data in `enrich-manifest.yaml`** (a non-model STM artifact). The
  keyed persist script applies those fields to the live spine in place, node-keyed.

Because the LLM only ever writes separate doc files, /understand's file-level scoped guard
is sufficient for this skill's blast radius, and node-level containment inside the shared
spine/profile is preserved by the keyed script.

## What it produces (against the locked contracts)

Everything conforms to its template under `standards/schemas/product-os/grounding/` and
must clear the content-quality eval (the play runs the linter + the judge over the docs):

- the **detailed** `capability.md` — the capability template's DETAILED stage: Benefit
  hypothesis, Boundary (In / Out / Never), Guiding rules, Functionalities (each a one-line
  index entry linked to a functionality id it creates). Written in place over the live
  directional `capability.md`.
- one **`functionality.md`** per functionality it identifies — the functionality template:
  What it does, Inputs / Outputs, Rules & behavior, Acceptance criteria, Out of scope.
  Written as a new file in the live model.
- the **enrich-manifest** (STM, non-model) carrying the **spine-delta as structured data**:
  the target capability entry fields (`detail: detailed`, structured `nfr_needs` +
  `compliance_needs`, its `doc` pointer), the new `functionalities` entries (id, slug,
  `capability` ref, status proposed, one_line, doc pointer), the roll-up input (per-dimension
  implied levels + compliance), and the KB shelf grounding used. NO `_spine.yaml` is written.

## Inputs

| Field | Required | Description |
|-------|----------|-------------|
| `capability` | yes | The target capability: its id, slug, and the path to its directional `capability.md` in the live model. |
| `kb_domain` | yes | The domain shelf to ground against. Read via the KB router. |
| `product_base` | yes | From config. The live model root: read the existing spine + the capability's current directional doc, and WRITE the detailed `capability.md` and the new `functionality.md` docs in place under `{product_base}product-os/`. Only the target node's docs — never a shared file, never a sibling node's doc. |
| `manifest_path` | yes | Where to write `enrich-manifest.yaml` (STM, non-model) — carries the spine-delta as structured data for the keyed persist script. |
| `stm_base` | yes | From config. |

## Procedure

Reasoning — detailing the capability, identifying its functionalities, writing each
function's behavior and acceptance criteria, judging the NFR levels — is yours. Template
conformance and the content bar are non-negotiable.

1. **Read the directional capability + the shelf.** Read the live directional
   `capability.md` (its directional intent is the anchor) and the capability's KB shelf
   via the router (`python3 $KB shelf <kb_domain>`) — pull its personas, systems, NFR
   hints, scope, and functionality baseline. Ground the detail in that material.

2. **Write the detailed capability doc, in place.** Promote the live `capability.md` to the
   detailed stage — overwrite it under `{product_base}product-os/`: the benefit hypothesis
   (who it serves, the believed value, the proof), the boundary (In / Out / Never, each line
   explained), the guiding rules (each with its reason), and the Functionalities index — one
   explained line per functionality, linked to the id you assign it in step 3.

3. **Identify and author the functionalities, in place.** Break the capability into its
   functionalities — the functions it must perform. For each, author a detailed
   `functionality.md` (what it does, inputs/outputs, rules & behavior with edge cases,
   acceptance criteria as Given/When/Then, out of scope) as a NEW file in the live model,
   and record a spine `functionalities` entry in the manifest (id, slug, `capability` = the
   target id, status proposed, one_line, doc pointer) — you write the entry to the MANIFEST,
   never to `_spine.yaml`. Detail increases here — a functionality reads richer than its
   capability, never leaner.

4. **Set the capability's NFR needs (into the manifest).** In the manifest's `capability`
   block, record `nfr_needs`: for each dimension this capability actually constrains, a
   `level` (none<low<medium<high<xhigh), a concrete measurable `target`, and a `gate` (how it
   is checked — e.g. "p99 < 150ms, load test"). List `compliance_needs` (regimes this
   capability triggers). Per capability — one capability's uptime need can differ from
   another's. A vague adjective ("fast", "secure") is not acceptable. These are manifest
   fields the keyed persist script writes to the live spine entry; you never write them to
   `_spine.yaml` yourself.

5. **Emit the roll-up input.** In the manifest, record the capability's per-dimension
   implied levels + compliance (the input the roll-up script maxes against the box) and the
   KB shelf material used. The level call is this skill's judgment; the threshold math is
   the roll-up script's.

6. **Write the docs + manifest.** Write the detailed `capability.md` and the new
   `functionality.md` docs in place under `{product_base}product-os/`, and write
   `enrich-manifest.yaml` to `manifest_path`. Never write `_spine.yaml`, `profile.yaml`, or
   any decision — those are the keyed persist script's, applied from the manifest.

## Output — live docs + the manifest

Written straight to the live model (no draft tree):

```
{product_base}product-os/
  {domain}/{capability}/
    capability.md                                 # DETAILED — overwrites the directional one, in place
    {functionality}/
      functionality.md                            # new, one per functionality
```

Plus the manifest (STM, non-model) at `manifest_path`:

```yaml
enrich:
  capability_ref: cap-checkout
  grounded_in: "ecommerce -> Checkout"            # the shelf material used
  capability:                                     # spine-delta for the target entry — persist applies it to _spine.yaml
    detail: detailed
    doc: ecommerce/checkout/capability.md         # relative to product-os/
    nfr_needs:
      performance: { level: high, target: "p99 < 150ms", gate: "load test" }
      reliability:  { level: high, target: "99.9% uptime", gate: "uptime SLO monitor" }
    compliance_needs: [PCI-DSS]
  functionalities:                                # NEW spine entries — persist adds them to _spine.yaml
    - { id: func-guest-checkout, slug: guest-checkout, capability: cap-checkout, status: proposed, one_line: "Buy without an account", doc: ecommerce/checkout/func-guest-checkout/functionality.md }
    - { id: func-address-validation, slug: address-validation, capability: cap-checkout, status: proposed, one_line: "Validate shipping addresses", doc: ecommerce/checkout/func-address-validation/functionality.md }
  implied_levels:                                 # roll-up input (== the nfr_needs levels)
    performance: { level: high, gate: "load test" }
    reliability: { level: high, gate: "uptime SLO monitor" }
  compliance: [PCI-DSS]
```

Return the enriched contract with the live doc paths written and the `enrich-manifest.yaml`
path — paths, never inline content.

## Rules

- **Product-manager altitude.** Detail the capability and its functionalities fully — no
  delivery sequencing, no slices, no epics (that is /shape).
- **Promote, don't reseed.** The capability doc moves directional → detailed; the manifest's
  `capability.detail` is `detailed`. Never leave it directional.
- **Functionalities created here.** Every functionality gets a manifest spine entry AND a
  detailed `functionality.md`; the capability's Functionalities index links each by id.
- **NFR is per-capability.** Record this capability's own `nfr_needs` (level + target + gate
  per dimension) and `compliance_needs` in the manifest; they roll up into the product
  profile downstream.
- **Concrete needs.** Every NFR need is a measurable value with a gate, never a vague
  adjective.
- **Grounded.** Detail draws on the capability's KB shelf; record which shelf material was
  used in the manifest.
- **Self-explaining.** Every grounding item names the thing and explains the why — it must
  clear the content standard, because the eval will judge it.
- **Docs live, shared files never (containment split, ADR 026).** Write the target's
  `capability.md` and its new `functionality.md` docs straight to the live model. NEVER
  write `_spine.yaml`, `profile.yaml`, or a decision — emit their delta as manifest data.
  Never touch another capability's docs or entries — only the target and its functionalities.
- **Template-true.** Every doc conforms to its grounding template; the manifest spine entries
  conform to the spine schema (`standards/schemas/product-os/spine.yaml`).
```
