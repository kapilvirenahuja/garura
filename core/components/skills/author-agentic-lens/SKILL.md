---
name: author-agentic-lens
description: Author a shaped slice's agentic lens as an MD grounding doc — the is-it-an-agent gate, the load weights (cognitive / creative / logistical on a low→ultra scale), and the controls (guardrails, handoff) — from the slice's hub (its functionalities' grounding docs + the spine profile) and KB grounding. A slice that should offload nothing comes out "not an agent", stated plainly. Writes a draft agentic.md (conforming to the Agentic lens template) plus a grounding manifest and any autonomy decision; reads the functionality.md docs for the hub, never another lens. Generative artifact production for the /agentic play; writes a draft only, never the live model.
version: 0.4.0
user-invocable: false
model: opus
allowed-tools: Read, Write, Bash, Glob
---

# author-agentic-lens

Turns a shaped slice's **hub** — the grounding docs of the functionalities it bundles, plus
the product profile — into the slice's **agentic lens**, written as the grounding doc
`agentic.md`: whether the slice is (or contains) an agent at all, and if so how much human
load it offloads on three axes and what controls bound it. A slice that should offload nothing
comes out "not an agent" — a valid, common answer, stated plainly. It reads the hub only
(never another realize lens) and writes a draft — /agentic's checkpoint and apply step persist it.

## What it produces (against the locked template)

`agentic.md` conforms to `standards/schemas/product-os/grounding/lens/agentic.md` — H1
`# Agentic Lens`, sections **Is it an agent?** (the gate + why), **Load weights** (a table:
cognitive / creative / logistical on a low→ultra scale, with rationale; "n/a — not an agent"
when the gate is no), **Controls** (guardrails, handoff; for a non-agent slice, the determinism
boundaries). It must clear the linter (shape) and the content-quality eval (the play runs both).
Alongside it, a structured `agentic-manifest.yaml` carries the machine-checkable grounding the
prose can't — which functionalities the assessment is grounded in, and any material autonomy choice.

## Inputs

| Field | Required | Description |
|-------|----------|-------------|
| `slice_ref` | yes | `{domain}/{slice-id}` — display reference. |
| `slice_file` | yes | Path to the live slice record (read-only — for the functionalities it bundles). |
| `functionality_groundings` | yes | Paths to each functionality's `functionality.md` grounding doc (the hub, resolved by `check_ready_slice`). Read these for behavior/acceptance — NOT `ice.yaml` (retired). |
| `profile` | yes | The product profile (from the spine) — conditions + surfaces. Read-only. |
| `kb_search` | yes | Path to the KB search script, for agentic-framing grounding. |
| `kb_root` | yes | Path to `knowledge/`, to resolve learning ids. |
| `product_base` | yes | Product model root (to reuse an existing autonomy decision). |
| `lens_rel` | yes | Relative path the lens mirrors: `product-os/{domain}/slices/{slice}/lens/agentic.md`. |
| `draft_dir` | yes | Output folder under STM for the draft + manifest + proposals. |
| `stm_base` | yes | From config. |

## Procedure

Reasoning (the agent verdict, the weight ratings, the controls) is yours. Template conformance,
grounding, and honesty are non-negotiable.

1. **Read the hub.** Load each functionality's `functionality.md` (its behavior, rules,
   acceptance) and the profile. Do NOT read any other lens.
2. **Decide the gate.** Does this slice do agentic work — decide and act on its own toward a
   goal — or is it deterministic? State the verdict AND why, grounded in what the functionalities
   actually do. A deterministic read/compute slice is "not an agent"; say so — never manufacture
   an agent that isn't there.
3. **Rate the weights (only if an agent).** Cognitive, creative, logistical load offloaded, each
   on the low→ultra scale, with the rationale tied to the functionalities. If not an agent, write
   "n/a — not an agent" and explain.
4. **Define the controls.** Guardrails on any agentic behavior and the human handoff points. For a
   non-agent slice, the controls are the determinism boundaries that keep it predictable.
5. **Write the draft.** Write `agentic.md` to the lens path under `draft_dir` (per the template);
   write `agentic-manifest.yaml` (the functionalities the assessment grounds in; any material
   autonomy choice → a decision); write the decision and any KB proposals. Drafts only — never the
   live model, never another lens.

## Output — the draft

```
{draft_dir}/
  product-os/{domain}/slices/{slice}/
    lens/agentic.md                               # the Agentic lens grounding doc
    decisions/{decision-id}.yaml                  # an autonomy decision (if material)
  agentic-manifest.yaml                           # grounding map (functionalities considered)
  proposals/<gap>.yaml                            # KB-learning-gap proposals (only if gaps)
```

`agentic-manifest.yaml`:

```yaml
agentic:
  slice_ref: token-dash/slice-trusted-coverage
  is_agent: false
  grounds:                                        # the functionalities the assessment considered
    - { source_type: functionality, source: "func-source-usage-ingest", functionality_ref: func-source-usage-ingest }
    - { source_type: functionality, source: "func-privacy-trust-labeling", functionality_ref: func-privacy-trust-labeling }
  choices: []                                     # KB-grounded agentic-framing choices (if any)
```

Return the enriched contract with the `draft_dir` and `agentic-manifest.yaml` path — paths, never
inline content.

## Rules

- **Hub only.** Derive from the functionalities' grounding docs + the profile; never read or
  ground on another realize lens.
- **Template-true.** `agentic.md` conforms to the Agentic lens template (Is it an agent? / Load
  weights / Controls) and must clear the linter + the content eval — every item self-explaining.
- **Honest gate.** A deterministic slice is "not an agent"; do not invent agentic behavior. The
  weights table is omitted (n/a) when the gate is no.
- **Cover the hub.** The assessment considers every functionality the slice bundles, recorded in
  the manifest grounds.
- **Grounded, not invented.** The verdict and weights ground in the functionalities' behavior;
  any material autonomy choice grounds in a KB learning or a proposal and is recorded as a decision.
- **Drafts only.** Write under `draft_dir`; never touch the live model.
```
