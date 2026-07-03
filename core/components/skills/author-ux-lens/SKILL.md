---
name: author-ux-lens
description: Author a shaped slice's UX lens as an MD grounding doc — the screens (with low-fidelity layouts), the states each holds, and the product's visual core (color + typography) — from the slice's hub (its functionalities' grounding docs + the spine profile) and KB pattern grounding. Writes a draft ux.md (conforming to the UX lens template) plus a grounding manifest and the visual-core decision; reads the functionality.md docs for the hub, never another lens. Generative artifact production for the /ux play; writes a draft only, never the live model.
version: 0.4.0
user-invocable: false
model: opus
allowed-tools: Read, Write, Bash, Glob
---

# author-ux-lens

Turns a shaped slice's **hub** — the grounding docs of the functionalities it bundles, plus
the product profile — into the slice's **UX lens**, written as the grounding doc `ux.md`:
the screens that make every functionality visible, the states each screen holds, and the
product's visual core. It anchors the intended experience; it is not a full spec. It reads
the hub only (never another realize lens) and writes a draft — /ux's checkpoint and apply
step persist it.

## What it produces (against the locked template)

`ux.md` conforms to `standards/schemas/product-os/grounding/lens/ux.md` — H1 `# UX Lens`,
sections **Intent**, **Screens** (each: name + low-fidelity layout in prose), **States**
(per screen), **Visual core** (color + typography direction). It must clear the linter
(shape) and the content-quality eval (the play runs both). Alongside the doc it writes a
structured `ux-manifest.yaml` carrying the machine-checkable grounding the prose can't —
which screen grounds to which functionality, and the visual-core grounding.

## Inputs

| Field | Required | Description |
|-------|----------|-------------|
| `slice_ref` | yes | `{domain}/{slice-id}` — display reference. |
| `slice_file` | yes | Path to the live slice record (read-only — for the functionalities list it bundles). |
| `functionality_groundings` | yes | Paths to each functionality's `functionality.md` grounding doc (the hub, resolved by `check_ready_slice`). Read these for intent/behavior — NOT `ice.yaml` (retired). |
| `profile` | yes | The product profile (from the spine) — conditions + surfaces. Read-only. |
| `kb_search` | yes | Path to the KB search script, for pattern grounding. |
| `kb_root` | yes | Path to `knowledge/`, to resolve learning ids. |
| `product_base` | yes | Product model root (to reuse an existing visual-core decision). |
| `lens_rel` | yes | Relative path the lens mirrors: `product-os/{domain}/slices/{slice}/lens/ux.md`. |
| `draft_dir` | yes | Output folder under STM for the draft + manifest + proposals. |
| `stm_base` | yes | From config. |

## Procedure

Reasoning (drawing screens, enumerating states, choosing the visual core) is yours. Template
conformance, grounding, and coverage are non-negotiable.

1. **Read the hub.** Load each functionality's `functionality.md` (its behavior, acceptance,
   boundary) and the profile box (stage / users / surfaces). Do NOT read any other lens.
2. **Draw the screens.** For each functionality of the slice, the screen(s) that make it
   visible — a name and a LOW-FIDELITY layout in prose (regions and what each holds). Every
   functionality the slice bundles must be visualized by at least one screen (coverage).
3. **Enumerate the states.** For each screen, the states it can hold (loading, empty, error,
   partial, populated) and what the user sees in each.
4. **Choose the visual core.** The color and typography direction — grounded in a KB
   technology/architecture learning (matched to the product's conditions + surfaces via
   `kb_search`), or a recorded KB-learning-gap proposal. Record it as a slice-level decision
   (reuse the product-level one if it exists).
5. **Write the draft.** Write `ux.md` to the lens path under `draft_dir` (per the template);
   write `ux-manifest.yaml` (every screen's `grounds` → a functionality_ref / persona / journey;
   the visual core's grounding → kb or decision); write the visual-core decision; write any KB
   proposals. Drafts only — never the live model, never another lens.

## Output — the draft

```
{draft_dir}/
  product-os/{domain}/slices/{slice}/
    lens/ux.md                                    # the UX lens grounding doc
    decisions/{decision-id}.yaml                  # the visual-core decision (if material)
  ux-manifest.yaml                                # grounding map (screens → functionalities; visual core)
  proposals/<gap>.yaml                            # KB-learning-gap proposals (only if gaps)
```

`ux-manifest.yaml`:

```yaml
ux:
  slice_ref: token-dash/slice-trusted-coverage
  screens:
    - name: "Source coverage view"
      grounds:
        - { source_type: functionality, source: "func-source-coverage-freshness", functionality_ref: func-source-coverage-freshness }
  design_system:                                  # the visual core grounding
    source_type: decision                         # kb | decision
    decision: dec-visual-core-token-dash
  choices: []                                     # KB-grounded pattern choices (visual core / nav / responsive)
```

Return the enriched contract with the `draft_dir` and `ux-manifest.yaml` path — paths, never
inline content.

## Rules

- **Hub only.** Derive from the functionalities' grounding docs + the profile; never read or
  ground on another realize lens.
- **Template-true.** `ux.md` conforms to the UX lens template (Intent/Screens/States/Visual
  core) and must clear the linter + the content eval — every item self-explaining.
- **Three things only.** Screens, states, visual core. No flows (the build derives them), no
  accessibility (that is the marketing lens now), no gates/components/environments.
- **Cover every functionality.** Every functionality the slice bundles is visualized by ≥1
  screen, recorded in the manifest.
- **Grounded, not invented.** Every screen grounds to a functionality or a persona/journey;
  the visual core grounds to a KB learning or a proposal and is recorded as a decision.
- **Drafts only.** Write under `draft_dir`; never touch the live model.
```
