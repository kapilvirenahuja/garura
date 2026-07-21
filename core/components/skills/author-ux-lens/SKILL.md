---
name: author-ux-lens
description: Author a shaped slice's UX lens as an MD grounding doc — the screens (with low-fidelity layouts), the states each holds, and the product's visual core (color + typography) — from the slice's hub (its functionalities' grounding docs + the spine profile) and KB pattern grounding. Writes the per-node grounding doc ux.md STRAIGHT TO THE LIVE MODEL (conforming to the UX lens template) and emits the visual-core decision plus the grounding map as structured data in a manifest; it NEVER writes a shared model file (the spine _spine.yaml, the profile, or a decisions/*.yaml). Reads the functionality.md docs for the hub, never another lens. Generative artifact production for the /ux play under direct-model-write (ADR 026).
version: 0.5.0
user-invocable: false
model: opus
allowed-tools: Read, Write, Bash, Glob
---

# author-ux-lens

Turns a shaped slice's **hub** — the grounding docs of the functionalities it bundles, plus
the product profile — into the slice's **UX lens**, written as the grounding doc `ux.md`:
the screens that make every functionality visible, the states each screen holds, and the
product's visual core. It anchors the intended experience; it is not a full spec. It reads
the hub only (never another realize lens).

**Write discipline (ADR 026, `standards/rules/direct-model-write.md`).** This skill writes
ONLY the per-node doc `ux.md`, **straight to the live model** in place. It does NOT write any
shared model file — not the spine `_spine.yaml`, not the profile, and not a `decisions/*.yaml`.
The visual-core decision is emitted as **structured data in the manifest** (`decision_delta`);
the play's deterministic keyed persist script (`persist_ux.py`) writes that decision in place,
keyed to the slice and `skip-if-exists`. There is no draft tree.

## What it produces (against the locked template)

`ux.md` conforms to `standards/schemas/product-os/grounding/lens/ux.md` — H1 `# UX Lens`,
sections **Intent**, **Screens** (each: name + low-fidelity layout in prose), **States**
(per screen), **Visual core** (color + typography direction). It must clear the linter
(shape) and the content-quality eval (the play runs both). Alongside the doc it writes a
structured `ux-manifest.yaml` (an STM, non-model artifact) carrying the machine-checkable
grounding the prose can't — which screen grounds to which functionality, the visual-core
grounding, and the visual-core **decision delta** for the keyed persist to write.

## Input

| Field | Required | Description |
|-------|----------|-------------|
| `slice_ref` | yes | `{domain}/{slice-id}` — display reference and the persist key. |
| `slice_file` | yes | Path to the live slice record (read-only — for the functionalities list it bundles). |
| `functionality_groundings` | yes | Paths to each functionality's `functionality.md` grounding doc (the hub, resolved by `check_ready_slice`). Read these for intent/behavior — NOT `ice.yaml` (retired). |
| `profile` | yes | The product profile (from the spine) — conditions + surfaces. Read-only. |
| `kb_search` | yes | Path to the KB search script, for pattern grounding. |
| `kb_root` | yes | Path to `knowledge/`, to resolve learning ids. |
| `product_base` | yes | Product model root — the LIVE write target (and to reuse an existing visual-core decision). |
| `lens_rel` | yes | Relative path of the live lens: `product-os/{domain}/slices/{slice}/lens/ux.md`. Write `ux.md` here, in place. |
| `manifest_path` | yes | Output path under STM for `ux-manifest.yaml` (grounding map + decision delta + proposals). |
| `stm_base` | yes | From config. |

## Process

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
   `kb_search`), or a recorded KB-learning-gap proposal. If the product already carries a
   visual-core decision (check under `product_base`), REUSE it — name it in the manifest and
   emit NO new `decision_delta`. Otherwise emit the decision as manifest data for the keyed
   persist to write (do NOT write the decision file yourself).
5. **Write the lens in place + the manifest.** Write `ux.md` to the LIVE lens path
   (`product_base` + `lens_rel`), per the template. Write `ux-manifest.yaml` to `manifest_path`
   (STM) carrying: every screen's `grounds` → a functionality_ref / persona / journey; the
   visual core's grounding → kb or the reused decision; and, when a new decision is needed, the
   `decision_delta` (id, the slice-scoped `rel`, and the full `record` body). Write any KB
   proposals under an STM proposals folder. Write NO shared model file — never `_spine.yaml`,
   never the profile, never a `decisions/*.yaml`.

## Output

```
LIVE (in place, under product_base):
  product-os/{domain}/slices/{slice}/lens/ux.md            # the UX lens grounding doc (the only live write)

STM (non-model):
  {manifest_path}                                           # ux-manifest.yaml — grounding map + decision delta
  {stm}/proposals/<gap>.yaml                                # KB-learning-gap proposals (only if gaps)
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
  decision_delta:                                 # OMIT when reusing an existing product decision
    id: dec-visual-core-token-dash
    rel: product-os/token-dash/slices/slice-trusted-coverage/decisions/dec-visual-core-token-dash.yaml
    record:                                       # the full decision YAML body the keyed persist writes
      id: dec-visual-core-token-dash
      level: slice
      status: accepted
      # … dimension, choice, grounding …
  choices: []                                     # KB-grounded pattern choices (visual core / nav / responsive)
```

Return the enriched contract with the live `lens_rel` written and the `ux-manifest.yaml` path
— paths, never inline content.

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
- **One live doc; no shared file.** Write ONLY `ux.md` to the live model. The visual-core
  decision goes into the manifest as `decision_delta` — the play's keyed persist writes it. Never
  write `_spine.yaml`, the profile, or a `decisions/*.yaml`; never write to another slice.
```
