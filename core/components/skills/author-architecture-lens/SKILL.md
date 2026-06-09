---
name: author-architecture-lens
description: Draft /arch's architecture lens for one SLICE — turn the slice's functionalities' ICE (their context.systems) and the profile surfaces into the horizontal components the slice threads, the contracts (seams) crossed between them with the data that flows, and the stack (tech + versions) per component, plus a decision for any material choice. Every component, contract, and tech pick is grounded — never invented; the build is one vertical end-to-end slice through the components. Writes a draft only (the architecture lens + a grounding manifest in STM), never the live model. The generative work for the /arch play; reads the slice's hub + the profile box, never another lens.
version: 0.1.0
user-invocable: false
model: opus
allowed-tools: Read, Write, Bash, Glob
---

# author-architecture-lens

Turns one shaped **slice** into its **architecture lens** — the shape of the software that
delivers the slice. A slice is a vertical product increment; its **hub** is the union of its
functionalities' ICE (which may span several capabilities) plus the product profile. The lens
is three things and only three:

- **components** — the **horizontal** platforms/tiers the slice threads, each in a **layer**
  (experience / process / domain / cross-cutting), a **kind** (internal / external), and the
  **part** the slice occupies inside it. A component is SELECTED, not invented: it is a system
  the slice's functionalities talk to (their ICE `context.systems`) or a surface the product
  exposes (the profile's `shape.surfaces`).
- **contracts** — the **seams** crossed between components, each with an `interface` and the
  `data` (the data model) that flows across. A contract is the seam two components must cross
  to serve one of the slice's functionalities.
- **stack** — the technology picked per component, **with versions**. Each pick is a
  deliberate choice, sized by the profile box (its NFR levels + gates) and recorded as a
  decision the product references.

A component is a horizontal; the **slice is a vertical** that threads top-to-down through the
components — and the build is that vertical, end-to-end through them: end-to-end or the story
failed. So every functionality the slice bundles must thread through the components, the
seam-graph must be acyclic, and no component is left an orphan.

It draws everything from the slice's hub + the profile box; it never reads another realize
lens. The NFRs it sizes the stack against come from the **profile box** directly, not from the
quality lens.

It writes a draft only — /arch's checkpoint and apply step persist it.

## Inputs

| Field | Required | Description |
|-------|----------|-------------|
| `slice_ref` | yes | The slice, `{domain}/{slice-id}`. |
| `slice_file` | yes | The slice record path (read-only) — its `functionalities` list (the to-thread set). |
| `functionality_ices` | yes | The resolved ICE file paths for the slice's functionalities (the hub), from the readiness gate. Their `context.systems` are the candidate components. |
| `profile_path` | yes | The product profile (read-only) — its `shape.surfaces` (entry components) and `nfr` box (sizes the stack). |
| `product_base` | yes | The product model root — read-only, to reuse an existing architecture decision if one exists. |
| `lens_rel` | yes | The slice's lens path to mirror in the draft, e.g. `product-os/{domain}/slices/{slice-id}/lens/architecture.yaml`. |
| `draft_dir` | yes | Output folder under STM for the draft lens + manifest. |
| `stm_base` | yes | From config. |

## Procedure

The component naming, the layering, the seam shape, and the tech taste are your judgment;
grounding, end-to-end coverage, the acyclic seam-graph, and the three-block shape are
non-negotiable.

1. **Read the slice's hub + the profile box.** Load the slice record (its functionalities —
   the to-thread set) and every functionality ICE in `functionality_ices` (their
   `context.systems` and `context.scope`), plus the profile (`shape.surfaces` and the `nfr`
   box). Do NOT read another lens — /arch reads the hub only.

2. **Select the components.** For each system named in the functionalities' ICE
   `context.systems`, place a component in its layer (experience / process / domain /
   cross-cutting), with its kind (internal / external) and the part the slice occupies. Add an
   **entry** component for each profile surface the slice presents on (web / mobile / cli / api
   …) in the experience layer. Never invent a component with no system and no surface behind it.

3. **Draw the contracts.** For each pair of components that must talk to serve one of the
   slice's functionalities, draw a contract: the `interface` and the `data` (the data model)
   that crosses. Record, in the manifest, the directed `depends_on` for each component (which
   components it calls) so the seam-graph is checkable — keep it **acyclic** (break a cycle by
   removing a seam, splitting a component, or making a boundary async).

4. **Pick the stack + record its decisions.** For each component, pick the tech and a
   **version**, sized by the profile `nfr` box. Each significant pick — and the system-level
   shape (monolith / modular-monolith / microservices / serverless), and the component set
   itself — is a material choice: record it as a slice-level decision (ADR). If the product
   already has an architecture decision that fits (look under `product_base`), **reuse it** —
   do not re-invent.

5. **Write the draft + manifest.** Write the architecture lens (the v1 lens envelope with
   `type: architecture`, `slice_ref`, and the three content blocks) under `draft_dir`,
   mirroring `lens_rel`, plus the decisions, plus an `architecture-manifest.yaml` that grounds
   **every** component, contract, and stack pick and carries the seam-graph so the play's
   validate step is mechanical and end-to-end coverage is checkable:

```yaml
architecture:
  slice: <domain>/<slice-id>
  entry_layers: ["experience"]          # layers that count as the slice's surface/entry
  components:
    - name: "channel-bff"
      layer: experience                 # experience | process | domain | cross-cutting
      depends_on: ["order-orchestrator"]   # directed seams — for the acyclic + reachability check
      grounds:
        - source_type: surface          # ice | surface
          source: "profile.shape.surfaces: web"
        # or, when the component is a system the slice talks to:
        # - source_type: ice
        #   source: "func-...: context.systems[0] (order service)"
        #   functionality_ref: "<functionality node id>"
  contracts:
    - between: "channel-bff <-> order-orchestrator"
      serves: ["<functionality node id>"]    # the functionalities this seam carries
      grounds:
        - source_type: ice
          source: "func-...: context.scope"
          functionality_ref: "<functionality node id>"
  stack:
    - component: "order-orchestrator"
      grounds:
        - source_type: decision         # decision (the stack/shape ADR) | profile | kb
          source: "sized by profile.nfr.performance"
          material: true
          decision: "<decision-id>"
  decisions: ["<decision-id>", ...]
```

Every functionality the slice bundles must appear as a `functionality_ref` on at least one
component or contract — that is the end-to-end coverage the validate step checks against the
slice record.

## Output — the draft

```
{draft_dir}/
  product-os/<domain>/slices/<slice-id>/
    lens/architecture.yaml
    decisions/<decision-id>.yaml      # the stack/shape decision(s) (or reused id, not re-written)
  architecture-manifest.yaml
```

## Boundaries

### NEVER
- Read or reference another realize lens (quality/ux/agentic/run) — /arch reads the slice's
  hub + the profile box only.
- Write the slice record, a functionality's ICE, the profile, another lens, or other slices —
  draft only this slice's architecture lens (+ the decisions).
- Invent an element — a component that is neither a system in the slice's functionalities' ICE
  nor a profile surface, a contract no functionality requires, or a stack pick with no
  recorded decision.
- Leave a functionality of the slice un-threaded, a component an orphan, or a cycle in the
  seam-graph.
- Smear concrete tech or versions into `components` — that lives in `stack`. Keep `content` to
  the three keys components/contracts/stack.
- Over-specify — no resource sizing, no wire-level detail. Intent-level shape only.

### ALWAYS
- Ground every component (on an ICE system or a profile surface), every contract (on a
  functionality), and every stack pick (on a decision / profile pin / KB) in the manifest.
- Thread every functionality the slice bundles through at least one component/contract,
  keep the seam-graph acyclic, and leave no orphan component.
- Size the stack against the profile `nfr` box; record material choices (the component set,
  the system-level shape, significant tech picks) as decisions that resolve.
- Return the draft paths, not the contents.
