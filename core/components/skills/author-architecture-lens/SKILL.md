---
name: author-architecture-lens
description: Author a shaped slice's architecture lens as an MD grounding doc — the components the slice threads (each in its layer, with its contract), the stack (tech + versions) per component, and the vertical build (how the slice runs end-to-end through them) — from the slice's hub (its functionalities' grounding docs + the spine profile) and KB architecture/technology grounding. Writes a draft architecture.md (conforming to the Architecture lens template) plus a grounding manifest and any material-choice decisions; reads the functionality.md docs for the hub, MAY read the functional lens docs (ux/agentic/marketing) optionally, never the measure or run lens. Generative artifact production for the /arch play; writes a draft only, never the live model.
version: 0.2.0
user-invocable: false
model: opus
allowed-tools: Read, Write, Bash, Glob
---

# author-architecture-lens

Turns a shaped slice's **hub** — the grounding docs of the functionalities it bundles, plus
the product profile — into the slice's **architecture lens**, written as the grounding doc
`architecture.md`: the components the slice threads, the stack behind them, and the vertical
build that ties them end-to-end. A slice is a vertical increment; its hub is the union of its
functionalities' grounding (which may span several capabilities) plus the profile box. It
reads the hub (and MAY read the already-merged functional lens docs — ux/agentic/marketing —
optionally), never the measure or run lens, and writes a draft — /arch's checkpoint and apply
step persist it.

## What it produces (against the locked template)

`architecture.md` conforms to `standards/schemas/product-os/grounding/lens/architecture.md` —
H1 `# Architecture Lens`, sections **Intent**, **Components** (each in its layer, with its
contract), **Stack** (a table: component | technology | version), **Vertical build** (how the
slice runs top-to-bottom through the components). It must clear the linter (shape) and the
content-quality eval (the play runs both). Alongside the doc it writes a structured
`arch-manifest.yaml` carrying the machine-checkable grounding the prose can't — which
component grounds to which functionality (its systems) or surface, and the stack's grounding.

## Inputs

| Field | Required | Description |
|-------|----------|-------------|
| `slice_ref` | yes | `{domain}/{slice-id}` — display reference. |
| `slice_file` | yes | Path to the live slice record (read-only — for the functionalities it bundles). |
| `functionality_groundings` | yes | Paths to each functionality's `functionality.md` grounding doc (the hub, resolved by `check_ready_slice`). Read these for systems/behavior — NOT `ice.yaml` (retired). |
| `profile` | yes | The product profile (from the spine) — the box (NFR levels + gates) + surfaces. Read-only. |
| `kb_search` | yes | Path to the KB search script, for architecture/technology grounding. |
| `kb_root` | yes | Path to `knowledge/`, to resolve learning ids. |
| `product_base` | yes | Product model root (to reuse an existing stack decision). |
| `lens_rel` | yes | Relative path the lens mirrors: `product-os/{domain}/slices/{slice}/lens/architecture.md`. |
| `draft_dir` | yes | Output folder under STM for the draft + manifest + proposals. |
| `stm_base` | yes | From config. |

## Procedure

Reasoning (selecting components, drawing contracts, picking the stack, writing the vertical
build) is yours. Template conformance, grounding, and coverage are non-negotiable.

1. **Read the hub.** Load each functionality's `functionality.md` (its behavior, its systems
   in the boundary/rules, its acceptance) and the profile box (NFR levels + gates + surfaces).
   You MAY read the functional lens docs if present; never read the measure or run lens.
2. **Select the components.** The horizontal components the slice threads — each in a layer,
   with the contract (what it takes and gives). A component is SELECTED, not invented: it is a
   system the slice's functionalities talk to, or a surface the profile exposes. Every
   functionality must thread through at least one component (coverage).
3. **Pick the stack.** The technology per component WITH versions, sized by the profile box —
   grounded in a KB architecture/technology learning (via `kb_search`) or a recorded
   KB-learning-gap proposal. Record material picks as decisions.
4. **Write the vertical build.** How this one slice runs end-to-end through the components,
   top to bottom — the path a builder follows for this increment.
5. **Write the draft.** Write `architecture.md` to the lens path under `draft_dir` (per the
   template); write `arch-manifest.yaml` (every component's `grounds` → a functionality_ref or
   surface; the stack's grounding → kb or decision); write the stack decision; write any KB
   proposals. Drafts only — never the live model, never another lens.

## Output — the draft

```
{draft_dir}/
  product-os/{domain}/slices/{slice}/
    lens/architecture.md                          # the architecture lens grounding doc
    decisions/{decision-id}.yaml                  # the stack / material-choice decision (if material)
  arch-manifest.yaml                              # grounding map (components → functionalities/surfaces; stack)
  proposals/<gap>.yaml                            # KB-learning-gap proposals (only if gaps)
```

`arch-manifest.yaml`:

```yaml
arch:
  slice_ref: token-dash/slice-trusted-coverage
  components:
    - name: "Trust labeler"
      grounds:
        - { source_type: functionality, source: "func-privacy-trust-labeling", functionality_ref: func-privacy-trust-labeling }
  stack:                                           # the stack grounding
    source_type: decision                          # kb | decision
    decision: dec-stack-token-dash
```

Return the enriched contract with the `draft_dir` and `arch-manifest.yaml` path — paths,
never inline content.

## Rules

- **Hub (+ optional functional trinity).** Derive from the functionalities' grounding docs +
  the profile box; you may read the functional lens docs, never the measure or run lens.
- **Template-true.** `architecture.md` conforms to the Architecture lens template
  (Intent/Components/Stack/Vertical build) and must clear the linter + the content eval —
  every item self-explaining; the stack as a table.
- **Selected, not invented.** Every component is a system a functionality talks to or a
  profile surface; every stack pick is grounded in a KB learning or a proposal and recorded
  as a decision.
- **Cover every functionality.** Every functionality the slice bundles threads through ≥1
  component, recorded in the manifest. The build is one vertical, end-to-end.
- **Drafts only.** Write under `draft_dir`; never touch the live model.
```
