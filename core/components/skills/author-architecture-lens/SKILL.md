---
name: author-architecture-lens
description: Author a shaped slice's architecture lens as an MD grounding doc — the components the slice threads (each in its layer, with its contract), the stack (tech + versions) per component, and the vertical build (how the slice runs end-to-end through them) — from the slice's hub (its functionalities' grounding docs + the spine profile) and KB architecture/technology grounding. Writes architecture.md straight to the live model (re-deriving this slice's lens in place) plus a grounding manifest that carries the components/stack grounding and any material-choice decisions as structured data; reads the functionality.md docs for the hub, MAY read the functional lens docs (ux/agentic/marketing) optionally, never the measure or run lens. Generative artifact production for the /arch play; writes only the one lens doc — never the spine, the profile, or the decisions/ (the play's keyed persist owns those).
version: 0.3.0
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
optionally), never the measure or run lens.

**Write discipline (ADR 026, `standards/rules/direct-model-write.md`).** This skill writes
ONLY the one per-node lens doc — `architecture.md` — **straight to the live model**, in place
at the slice's lens path, re-deriving this slice's lens. It writes NO shared model file: no
`_spine.yaml`, no profile, no `decisions/`, no other lens, no slice record. Every material-choice
decision is emitted as **structured data in the manifest** (`arch-manifest.yaml`), which the
/arch play's keyed persist script (`persist_arch.py`) writes to disk skip-if-exists only after
the human checkpoint approves. Containment is the play's post-write scoped guard, not a draft.

## What it produces (against the locked template)

`architecture.md` conforms to `standards/schemas/product-os/grounding/lens/architecture.md` —
H1 `# Architecture Lens`, sections **Intent**, **Components** (each in its layer, with its
contract), **Stack** (a table: component | technology | version), **Vertical build** (how the
slice runs top-to-bottom through the components). It must clear the linter (shape) and the
content-quality eval (the play runs both). Alongside the doc it writes a structured
`arch-manifest.yaml` (an STM, non-model artifact) carrying the machine-checkable grounding the
prose can't — which component grounds to which functionality (its systems) or surface, the
stack's grounding, and any material-choice decisions as data (not files).

## Inputs

| Field | Required | Description |
|-------|----------|-------------|
| `slice_ref` | yes | `{domain}/{slice-id}` — display reference. |
| `slice_file` | yes | Path to the live slice record (read-only — for the functionalities it bundles). |
| `functionality_groundings` | yes | Paths to each functionality's `functionality.md` grounding doc (the hub, resolved by `check_ready_slice`). Read these for systems/behavior — NOT `ice.yaml` (retired). |
| `profile` | yes | The product profile (from the spine) — the box (NFR levels + gates) + surfaces. Read-only. |
| `kb_search` | yes | Path to the KB search script, for architecture/technology grounding. |
| `kb_root` | yes | Path to `knowledge/`, to resolve learning ids. |
| `product_base` | yes | Product model root — the live model this skill writes `architecture.md` into. |
| `lens_rel` | yes | Relative path the lens is written to: `product-os/{domain}/slices/{slice}/lens/architecture.md`. |
| `manifest_path` | yes | Path under STM to write `arch-manifest.yaml` (the grounding + decisions data). |
| `proposals_dir` | yes | Folder under STM for KB-learning-gap proposals. |
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
   KB-learning-gap proposal. Record material picks as decisions in the manifest.
4. **Write the vertical build.** How this one slice runs end-to-end through the components,
   top to bottom — the path a builder follows for this increment.
5. **Write the lens to the live model.** Write `architecture.md` to `product_base`/`lens_rel`
   (per the template), IN PLACE — re-deriving this slice's lens. Then write `arch-manifest.yaml`
   to `manifest_path`: every component's `grounds` → a functionality_ref or surface; the stack's
   grounding → kb or decision; and any material-choice decision as a manifest entry (its target
   `rel` under the slice's `decisions/` + the full decision record). Write any KB proposals to
   `proposals_dir`. Write ONLY the lens doc on the live model — never a decision file, never a
   shared model file.

## Output — the live lens + the manifest

```
<product_base>/product-os/{domain}/slices/{slice}/lens/architecture.md   # written IN PLACE (the only live write)
<manifest_path>                                                          # arch-manifest.yaml (STM: grounding + decisions data)
<proposals_dir>/<gap>.yaml                                               # KB-learning-gap proposals (only if gaps)
```

`arch-manifest.yaml`:

```yaml
arch:
  slice_ref: token-dash/slice-trusted-coverage
  lens_rel: product-os/token-dash/slices/slice-trusted-coverage/lens/architecture.md
  components:
    - name: "Trust labeler"
      grounds:
        - { source_type: functionality, source: "func-privacy-trust-labeling", functionality_ref: func-privacy-trust-labeling }
  stack:                                           # the stack grounding
    source_type: decision                          # kb | decision
    decision: dec-stack-token-dash
  decisions:                                       # material-choice decisions as DATA (persist_arch.py writes them skip-if-exists)
    - rel: product-os/token-dash/slices/slice-trusted-coverage/decisions/dec-stack-token-dash.yaml
      id: dec-stack-token-dash
      decision:
        id: dec-stack-token-dash
        title: "Stack for the token-dash slice"
        reason: "…"
        status: accepted
        level: slice
```

Return the enriched contract with the `lens_rel` path (on the live model) and the
`arch-manifest.yaml` path — paths, never inline content.

## Rules

- **Hub (+ optional functional trinity).** Derive from the functionalities' grounding docs +
  the profile box; you may read the functional lens docs, never the measure or run lens.
- **Template-true.** `architecture.md` conforms to the Architecture lens template
  (Intent/Components/Stack/Vertical build) and must clear the linter + the content eval —
  every item self-explaining; the stack as a table.
- **Selected, not invented.** Every component is a system a functionality talks to or a
  profile surface; every stack pick is grounded in a KB learning or a proposal and recorded
  as a decision in the manifest.
- **Cover every functionality.** Every functionality the slice bundles threads through ≥1
  component, recorded in the manifest. The build is one vertical, end-to-end.
- **Live lens only; decisions are data.** Write ONLY `architecture.md` to the live model (in
  place). Emit decisions as manifest data — the play's keyed persist writes them. Never write a
  decision file, the spine, the profile, or another lens.
```
