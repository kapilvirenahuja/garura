---
name: enrich-capability-ice
description: Detail one capability that /vision seeded — promote its capability.md from the directional stage to the detailed stage (benefit hypothesis, boundary, guiding rules, functionalities), author a detailed functionality.md grounding doc for each functionality it identifies, set the capability's structured nfr_needs + compliance_needs for the profile roll-up, and emit the implied per-dimension levels. Grounded in the capability's KB shelf. Generative artifact production for the /understand play; writes a draft only, never the live model. Use when /understand needs a seeded capability detailed and its functionalities created.
version: 0.2.0
user-invocable: false
model: opus
allowed-tools: Read, Write, Bash, Glob
---

# enrich-capability-ice

Takes a capability that /vision seeded — named, directional, no functionalities — and
**details it**: it deepens the capability's grounding from the directional stage to the
detailed stage, **identifies and authors its functionalities**, and sets the capability's
own NFR needs. This is /understand's generative worker — the **product-manager** step,
where the product is understood in full down to the functionality. It writes a draft only;
/understand's checkpoint, roll-up, and apply persist it.

## Altitude — write at product-manager level

/vision was the CXO conversation (directional). /understand is the **product manager**
detailing the product. So the writing here is concrete and complete — the full capability
and its functionalities, the detail a build needs — but still product language, not code.
Sequencing the work into deliverable verticals is the **product owner's** job (/shape); do
none of that here.

## What it produces (against the locked contracts)

Everything conforms to its template under `standards/schemas/product-os/grounding/` and
must clear the content-quality eval (the play runs the linter + the judge over the draft):

- the **detailed** `capability.md` — the capability template's DETAILED stage: Benefit
  hypothesis, Boundary (In / Out / Never), Guiding rules, Functionalities (each a one-line
  index entry linked to a functionality id it creates).
- one **`functionality.md`** per functionality it identifies — the functionality template:
  What it does, Inputs / Outputs, Rules & behavior, Acceptance criteria, Out of scope.
- the **spine delta** (a draft `_spine.yaml`): the target capability entry updated to
  `detail: detailed` with its structured `nfr_needs` + `compliance_needs`, and a new
  `functionalities` entry per functionality (id, slug, `capability` ref, status proposed,
  one_line, doc pointer).
- the **enrich-manifest** — the roll-up input (the capability's per-dimension implied
  levels + compliance) and the KB shelf grounding used.

## Inputs

| Field | Required | Description |
|-------|----------|-------------|
| `capability` | yes | The target capability: its id, slug, and the path to its directional `capability.md` in the live model. |
| `kb_domain` | yes | The domain shelf to ground against. Read via the KB router. |
| `product_base` | yes | From config — read **only**, to learn the existing spine + the capability's current directional doc. |
| `draft_dir` | yes | Output folder under STM for the draft. |
| `stm_base` | yes | From config. |

## Procedure

Reasoning — detailing the capability, identifying its functionalities, writing each
function's behavior and acceptance criteria, judging the NFR levels — is yours. Template
conformance and the content bar are non-negotiable.

1. **Read the directional capability + the shelf.** Read the live directional
   `capability.md` (its directional intent is the anchor) and the capability's KB shelf
   via the router (`python3 $KB shelf <kb_domain>`) — pull its personas, systems, NFR
   hints, scope, and functionality baseline. Ground the detail in that material.

2. **Write the detailed capability doc.** Promote `capability.md` to the detailed stage:
   the benefit hypothesis (who it serves, the believed value, the proof), the boundary
   (In / Out / Never, each line explained), the guiding rules (each with its reason), and
   the Functionalities index — one explained line per functionality, linked to the id you
   assign it in step 3.

3. **Identify and author the functionalities.** Break the capability into its
   functionalities — the functions it must perform. For each, author a detailed
   `functionality.md` (what it does, inputs/outputs, rules & behavior with edge cases,
   acceptance criteria as Given/When/Then, out of scope) and a spine `functionalities`
   entry (id, slug, `capability` = the target id, status proposed, one_line, doc pointer).
   Detail increases here — a functionality reads richer than its capability, never leaner.

4. **Set the capability's NFR needs.** On the capability's spine delta, write `nfr_needs`:
   for each dimension this capability actually constrains, a `level` (none<low<medium<high<
   xhigh), a concrete measurable `target`, and a `gate` (how it is checked — e.g. "p99 <
   150ms, load test"). List `compliance_needs` (regimes this capability triggers). Per
   capability — one capability's uptime need can differ from another's. A vague adjective
   ("fast", "secure") is not acceptable.

5. **Emit the roll-up input.** In the enrich-manifest, record the capability's per-dimension
   implied levels + compliance (the input the roll-up script maxes against the box) and the
   KB shelf material used. The level call is this skill's judgment; the threshold math is
   the roll-up script's.

6. **Write the draft + manifest.** Write the detailed `capability.md`, the
   `functionality.md` docs, the spine delta, and `enrich-manifest.yaml` under `draft_dir`,
   mirroring the live model's relative paths. Never touch the live model.

## Output — the draft

```
{draft_dir}/
  product-os/
    _spine.yaml                                   # delta: updated capability entry (detail detailed, nfr_needs, compliance_needs) + new functionality entries
    {domain}/{capability}/
      capability.md                               # DETAILED (overwrites the directional one on apply)
      {functionality}/
        functionality.md                          # new, one per functionality
  enrich-manifest.yaml                            # roll-up input + KB grounding (stays in STM)
```

`enrich-manifest.yaml`:

```yaml
enrich:
  capability_ref: cap-checkout
  grounded_in: "ecommerce -> Checkout"            # the shelf material used
  functionalities: [func-guest-checkout, func-address-validation]   # the ids created
  implied_levels:                                 # the capability's nfr_needs, as the roll-up input
    performance: { level: high, gate: "p99 < 150ms, load test" }
    reliability: { level: high, gate: "99.9% uptime" }
  compliance: [PCI-DSS]
```

Return the enriched contract with the `draft_dir` and `enrich-manifest.yaml` path — paths,
never inline content.

## Rules

- **Product-manager altitude.** Detail the capability and its functionalities fully — no
  delivery sequencing, no slices, no epics (that is /shape).
- **Promote, don't reseed.** The capability doc moves directional → detailed; the spine
  entry flips to `detail: detailed`. Never leave it directional.
- **Functionalities created here.** Every functionality gets a spine entry AND a detailed
  `functionality.md`; the capability's Functionalities index links each by id.
- **NFR is per-capability.** Write this capability's own `nfr_needs` (level + target + gate
  per dimension) and `compliance_needs`; they roll up into the product profile downstream.
- **Concrete needs.** Every NFR need is a measurable value with a gate, never a vague
  adjective.
- **Grounded.** Detail draws on the capability's KB shelf; record which shelf material was
  used in the manifest.
- **Self-explaining.** Every grounding item names the thing and explains the why — it must
  clear the content standard, because the eval will judge it.
- **Drafts only, target only.** Write under `draft_dir`. Never touch the live model, never
  another capability's docs or entries — only the target capability and its functionalities.
- **Template-true.** Every doc conforms to its grounding template; the spine delta conforms
  to the spine schema (`standards/schemas/product-os/spine.yaml`).
```
