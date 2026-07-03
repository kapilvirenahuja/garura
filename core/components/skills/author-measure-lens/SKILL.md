---
name: author-measure-lens
description: Author a shaped slice's measure lens as an MD grounding doc — the delivery-measurement focus, a table of metrics (metric / baseline / target / proof, triangle-primary speed/tokens/cognition), and what is out of scope — from the slice's hub (its functionalities' grounding docs + the spine profile). Every metric is concrete (a baseline, a target, a proof), never a vague claim. Writes a draft measure.md (conforming to the Measure lens template) plus a grounding manifest and any material decision; reads the functionality.md docs + the profile for the hub. Generative artifact production for the /measure play; writes a draft only, never the live model.
version: 0.3.0
user-invocable: false
model: opus
allowed-tools: Read, Write, Bash, Glob
---

# author-measure-lens

Turns a shaped slice's **hub** — the grounding docs of the functionalities it bundles, plus the
product profile — into the slice's **measure lens**, written as the grounding doc `measure.md`: what
delivery the slice is proving, the metrics that prove it, and what is deliberately not measured. The
metrics are concrete (each a baseline, a target, and how it is proven), triangle-primary on
speed/tokens/cognition where it applies — never a vague claim. It reads the hub and writes a draft —
/measure's checkpoint and apply step persist it. This is the seam /capture later harvests.

## What it produces (against the locked template)

`measure.md` conforms to `standards/schemas/product-os/grounding/lens/measure.md` — H1
`# Measure Lens`, sections **Focus** (the one outcome whose movement tells you the slice worked),
**Metrics** (a table: metric | baseline | target | proof), and **Out of scope** (what is not measured
yet, with the reason). It must clear the linter (shape) and the content-quality eval (the play runs
both). Alongside it, a structured `measure-manifest.yaml` carries the machine-checkable grounding —
which functionality or profile outcome each metric traces to, and any material choice.

## Inputs

| Field | Required | Description |
|-------|----------|-------------|
| `slice_ref` | yes | `{domain}/{slice-id}` — display reference. |
| `slice_file` | yes | Path to the live slice record (read-only — for the functionalities it bundles). |
| `functionality_groundings` | yes | Paths to each functionality's `functionality.md` grounding doc (the hub, resolved by `check_ready_slice`). Read these for the acceptance/outcomes — NOT `ice.yaml` (retired). |
| `profile` | yes | The product profile (from the spine) — its NFR gates and conditions. Read-only. |
| `product_base` | yes | Product model root (to reuse an existing material decision). |
| `lens_rel` | yes | Relative path the lens mirrors: `product-os/{domain}/slices/{slice}/lens/measure.md`. |
| `draft_dir` | yes | Output folder under STM for the draft + manifest. |
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
4. **Name what's out of scope.** What this slice deliberately does not measure yet, each with its
   reason — so a missing metric reads as a choice.
5. **Write the draft.** Write `measure.md` to the lens path under `draft_dir` (per the template);
   write `measure-manifest.yaml` (the functionality or profile each metric grounds in; any material
   choice → a decision); write the decision if any. Drafts only — never the live model.

## Output — the draft

```
{draft_dir}/
  product-os/{domain}/slices/{slice}/
    lens/measure.md                               # the Measure lens grounding doc
    decisions/{decision-id}.yaml                  # a material decision (if any)
  measure-manifest.yaml                           # grounding map (metric -> functionality / profile)
```

`measure-manifest.yaml`:

```yaml
measure:
  slice_ref: token-dash/slice-trusted-coverage
  grounds:                                        # every metric traces to a functionality or profile outcome
    - { source_type: functionality, source: "func-source-coverage-freshness", functionality_ref: func-source-coverage-freshness }
    - { source_type: profile, source: "nfr.performance" }
  choices: []                                     # material measurement choices (each → a decision), if any
```

Return the enriched contract with the `draft_dir` and `measure-manifest.yaml` path — paths, never
inline content.

## Rules

- **Hub-anchored.** Derive from the functionalities' grounding docs + the profile; the metrics measure
  what the slice actually delivers.
- **Template-true.** `measure.md` conforms to the Measure lens template (Focus / Metrics / Out of
  scope) and must clear the linter + the content eval — every item self-explaining.
- **Concrete.** Every metric has a baseline, a target, and a proof — never a vague claim. A metric
  that cannot be proven is not a metric.
- **Cover the hub.** The metrics consider every functionality the slice bundles, recorded in the
  manifest grounds.
- **Drafts only.** Write under `draft_dir`; never touch the live model.
```
