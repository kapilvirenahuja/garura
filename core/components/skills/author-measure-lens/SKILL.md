---
name: author-measure-lens
description: Author a shaped slice's measure lens as an MD grounding doc — the delivery-measurement focus, a table of metrics (metric / baseline / target / proof, triangle-primary speed/tokens/cognition), and what is out of scope — from the slice's hub (its functionalities' grounding docs + the spine profile). Every metric is concrete (a baseline, a target, a proof), never a vague claim. Writes measure.md STRAIGHT to the live model (per-node doc only, conforming to the Measure lens template) and emits the shared-file deltas — the grounding map, any material decision, and the doc record — as structured data in an STM measure-manifest.yaml; never writes _spine.yaml, the profile, or a decision record (the keyed persist writes the decisions and the lines-up-gated realized stamp). Generative artifact production for the /measure play.
version: 0.4.0
user-invocable: false
model: opus
allowed-tools: Read, Write, Bash, Glob
---

# author-measure-lens

Turns a shaped slice's **hub** — the grounding docs of the functionalities it bundles, plus the
product profile — into the slice's **measure lens**, written as the grounding doc `measure.md`: what
delivery the slice is proving, the metrics that prove it, and what is deliberately not measured. The
metrics are concrete (each a baseline, a target, and how it is proven), triangle-primary on
speed/tokens/cognition where it applies — never a vague claim. It reads the hub and writes the lens
doc in place on the live model; /measure's keyed persist then applies the shared-file deltas after the
checkpoint. This is the seam /learn later harvests.

## Write discipline (ADR 026, direct-model-write)

This skill writes ONLY the per-node grounding doc — the slice's `lens/measure.md` — **straight to the
live model** under `<product_base>/product-os/…`. It NEVER writes any shared model file: not
`_spine.yaml`, not the `profile` block, not a `decisions/` record. Every shared-file mutation is
emitted as **structured data in the STM `measure-manifest.yaml`** — the grounding map in
`measure.grounds`, any material choices in `measure.choices`, the material decision records in
`decisions:`, and the record of the doc it wrote in `docs:` — for /measure's deterministic keyed
persist (`persist_measure.py`) to apply in place after the human checkpoint. /measure runs the shape
linter and the content-quality eval over the live doc, then the scoped-write guard over the full
delta, before the checkpoint; nothing is committed until the gate resolves.

## What it produces (against the locked template)

`measure.md` (at its live path) conforms to `standards/schemas/product-os/grounding/lens/measure.md` —
H1 `# Measure Lens`, sections **Focus** (the one outcome whose movement tells you the slice worked),
**Metrics** (a table: metric | baseline | target | proof), and **Out of scope** (what is not measured
yet, with the reason). It must clear the linter (shape) and the content-quality eval (the play runs
both). Alongside it, the STM `measure-manifest.yaml` carries the machine-checkable grounding — which
functionality or profile outcome each metric traces to, any material choice, and the decision records
as structured data (the keyed persist writes the decision files).

## Inputs

| Field | Required | Description |
|-------|----------|-------------|
| `slice_ref` | yes | `{domain}/{slice-id}` — display reference. |
| `slice_file` | yes | Path to the live slice record (read-only — for the functionalities it bundles). |
| `functionality_groundings` | yes | Paths to each functionality's `functionality.md` grounding doc (the hub, resolved by `check_ready_slice`). Read these for the acceptance/outcomes — NOT `ice.yaml` (retired). |
| `profile` | yes | The product profile (from the spine) — its NFR gates and conditions. Read-only. |
| `product_base` | yes | Product model root — to READ the hub and reuse an existing material decision, and to WRITE the `measure.md` grounding doc in place under `product-os/…`. |
| `lens_rel` | yes | Relative path the lens mirrors (also its live path): `product-os/{domain}/slices/{slice}/lens/measure.md`. |
| `manifest_path` | yes | Output path under STM for the `measure-manifest.yaml` (grounds + choices + decision records + the doc record). |
| `proposals_dir` | no | STM folder for any `propose-kb-node` proposal a measurement frame needs when the KB does not cover it — each choice's `grounds` then references it. `/measure` runs `check_kb_grounding.py --proposals-dir` against this same folder. |
| `stm_base` | yes | From config. |

## Procedure

Reasoning (which metrics prove delivery, the baselines/targets, the proof) is yours. Template
conformance, grounding, and concreteness are non-negotiable.

1. **Read the hub.** Load each functionality's `functionality.md` (its acceptance criteria, behavior)
   and the profile (its NFR gates + conditions). The functional lenses may inform the metrics if
   present, but the hub is the anchor.
2. **State the focus.** What delivery this slice is proving in a short paragraph — the one outcome
   whose movement tells you it worked.
3. **Derive the metrics.** Build the metric table: for each thing worth measuring, a baseline, a
   target, and how it is proven. Triangle-primary (speed / tokens / cognition) where it applies. Each
   metric traces to a functionality's acceptance or a profile outcome. Concrete numbers, not adjectives.
   Ground every measurement-frame choice (the triangle, any industry translation) in the KB; for a
   frame the KB does not cover, write a `propose-kb-node` proposal to `proposals_dir` and reference it
   in that choice's `grounds` — never invent a frame.
4. **Name what's out of scope.** What this slice deliberately does not measure yet, each with its
   reason — so a missing metric reads as a choice.
5. **Write the doc in place; emit the deltas as manifest data.** Write `measure.md` to its LIVE path
   (`<product_base>/{lens_rel}`) per the template. Then write `measure-manifest.yaml` under STM: the
   `measure.grounds` (the functionality or profile each metric traces to), `measure.choices` (any
   material choice), the `decisions:` records (structured — the keyed persist writes the files), and
   the `docs:` record of the doc you wrote. Write NO `_spine.yaml`, NO profile, NO decision file.

## Output — the live doc + the STM manifest

The `measure.md` grounding doc is written IN PLACE on the live model:

```
<product_base>/product-os/{domain}/slices/{slice}/lens/measure.md    # the Measure lens grounding doc (live)
```

The `measure-manifest.yaml` is written under STM (a non-model artifact) — the shared-file deltas as
structured data:

```yaml
measure:
  slice_ref: token-dash/slice-trusted-coverage
  grounds:                                        # every metric traces to a functionality or profile outcome
    - { source_type: functionality, source: "func-source-coverage-freshness", functionality_ref: func-source-coverage-freshness }
    - { source_type: profile, source: "nfr.performance" }
  choices: []                                     # material measurement choices (each → a decision), if any
docs:                                             # the per-node docs written in place on the live model
  - { rel: "product-os/token-dash/slices/slice-trusted-coverage/lens/measure.md" }
decisions: []                                     # material decision records (structured); keyed persist writes each file
#  - { id: dec-measure-..., rel: "product-os/token-dash/slices/slice-trusted-coverage/decisions/dec-measure-....yaml",
#      level: product, title: "...", reason: "...", alternatives: [...] }
```

Return the enriched contract with the live `measure.md` path and the `measure-manifest.yaml` path —
paths, never inline content.

## Rules

- **Hub-anchored.** Derive from the functionalities' grounding docs + the profile; the metrics measure
  what the slice actually delivers.
- **Template-true.** `measure.md` conforms to the Measure lens template (Focus / Metrics / Out of
  scope) and must clear the linter + the content eval — every item self-explaining.
- **Concrete.** Every metric has a baseline, a target, and a proof — never a vague claim. A metric
  that cannot be proven is not a metric.
- **Cover the hub.** The metrics consider every functionality the slice bundles, recorded in the
  manifest grounds.
- **Per-node doc to live; shared files as manifest data.** Write ONLY `measure.md` in place on the
  live model; emit the grounds, choices, decision records, and the doc record into
  `measure-manifest.yaml`. Never write `_spine.yaml`, the profile, or a decision file — the keyed
  persist owns every shared file (ADR 026).
```
