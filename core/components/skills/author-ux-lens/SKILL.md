---
name: author-ux-lens
description: Draft /ux's ux lens for one capability — turn the capability's shaped slices (and the functionality ICE they reference) and its personas/journeys into low-fidelity screens (each with a layout), the states each screen holds, and the product's visual core (color + typography), recorded as a decision. Just enough to anchor the experience for human validation and let the build figure the rest — no flows, no accessibility block (a11y lives in the profile). Writes a draft only (the ux lens + a grounding manifest in STM), never the live model. The generative work for the /ux play; reads the hub + the shape, never another lens.
version: 0.1.0
user-invocable: false
model: opus
allowed-tools: Read, Write, Bash, Glob
---

# author-ux-lens

Turns one shaped capability into its **ux lens** — just enough to anchor the intended
experience and let the build figure the rest. The lens is three things and only three:

- **screens** — the surfaces the capability needs, each with a one-line purpose and a
  **low-fidelity layout** (the blocks on the screen and what each holds, where the slice's
  functionality sits). Not pixel design.
- **states** — per screen, the states it can hold (idle / submitting / error / locked /
  success / empty / loading, as applies).
- **design_system** — the product's **visual core**: a palette (color + mood) and
  typography. Set once and recorded as a decision the whole product references.

The screens make every shaped slice visible so a human can validate the shape. It draws
every screen from the hub + the shape and nowhere else — a shaped slice (and its
functionality ICE) or a persona/journey. **Accessibility is not in the lens** — it lives in
the product profile, and the build connects it. **Flows are not specified** — the build
derives them from the screens and the journeys.

It writes a draft only — /ux's checkpoint and apply step persist it. It reads the hub (the
capability's ICE + the profile box) and the shape (its slices, personas, journeys); it
never reads another realize lens.

## Inputs

| Field | Required | Description |
|-------|----------|-------------|
| `capability_path` | yes | The capability folder in the live model, e.g. `{product_base}/product-os/order-management/checkout`. |
| `slices_dir` | yes | The domain's slices folder, e.g. `{product_base}/product-os/order-management/slices`. Read-only — the shaped increments to visualize. |
| `product_base` | yes | The product model root — read-only, to reuse an existing visual-core decision if one exists. |
| `draft_dir` | yes | Output folder under STM for the draft lens + manifest. |
| `stm_base` | yes | From config. |

## Procedure

The screen wording, the layout, and the visual taste are your judgment; grounding,
coverage, and the three-block shape are non-negotiable.

1. **Read the capability and its shape.** Load the capability `node.yaml` + rich
   `ice.yaml`, its functionality nodes, its personas/journeys, and the domain's slices. Do
   NOT read another lens — /ux reads the hub + the shape only.

2. **Build the to-cover set.** From the domain's slices, collect the `functionality_ref`s
   that belong to this capability (the capability's functionalities that appear in a slice).
   This is the set the screens must cover so the human can validate the whole shaped
   increment. Nothing in this set may be left unvisualized.

3. **Draw the screens + their layouts.** For each functionality in the to-cover set, draw
   the screen(s) it needs: a one-line purpose and a low-fidelity layout — the blocks/regions
   on the screen and what each holds, where the slice's functionality sits. Low-fidelity:
   enough to see the shape, not pixel design, not exhaustive component specs.

4. **Enumerate the states.** For each screen, list the states it can hold (idle / submitting
   / error / locked / success / empty / loading, as applies).

5. **Set the visual core + record its decision.** Choose the product's palette (color + mood)
   and typography. If the product already has a visual-core decision (look under
   `product_base` for an existing one), **reuse it** — do not re-invent. Otherwise draft a
   capability-level decision (ADR) naming the palette + typography and why. The lens embeds
   the resolved palette + typography; the decision is the single source the whole product
   references.

6. **Write the draft + manifest.** Write `lens/ux.yaml` (the v1 lens envelope with
   `type: ux` and the three content blocks) under `draft_dir`, mirroring the live relative
   path, plus the visual-core decision, plus a `ux-manifest.yaml` that grounds **every
   screen** to its source and declares the to-cover set, so the play's validate step is
   mechanical:

```yaml
ux:
  capability: <capability id>
  screens:
    - name: "Checkout — payment"
      grounds:
        - source_type: slice            # slice | ice | persona | journey
          source: "<slice-id>"
          functionality_ref: "<functionality node id>"   # required when source_type=slice
  design_system:
    source_type: decision               # MUST be decision (the visual-core ADR)
    decision: "<decision-id>"
  covers: ["<functionality node id>", ...]   # the to-cover set from step 2
  decisions: ["<decision-id>", ...]          # ids of any decisions drafted (incl. the visual core)
```

## Output — the draft

```
{draft_dir}/
  product-os/<capability-path>/
    lens/ux.yaml
    decisions/<decision-id>.yaml      # the visual-core decision (or reused id, not re-written)
  ux-manifest.yaml
```

## Boundaries

### NEVER
- Read or reference another realize lens (quality/architecture/run/agentic) — /ux reads the
  hub + the shape only.
- Write the ICE, the profile, another lens, the slices, or node structure/status — draft
  only the ux lens (+ the visual-core decision).
- Invent an element — a screen with no slice/ICE/persona/journey, or a visual core with no
  recorded decision.
- Leave a slice-bound functionality of this capability unvisualized.
- Put flows, an accessibility block, gates, components, or environments in the lens — three
  blocks only. A11y lives in the profile; flows are the build's to derive.
- Over-specify — no pixel design, no exhaustive component breakdown. Low-fidelity, intent
  level.

### ALWAYS
- Ground every screen in the manifest to a slice/ICE or a persona/journey; ground the visual
  core on a decision that resolves.
- Cover every functionality in the to-cover set with at least one screen.
- Keep `content` to the three keys screens/states/design_system.
- Return the draft paths, not the contents.
