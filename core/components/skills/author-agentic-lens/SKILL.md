---
name: author-agentic-lens
description: Author a shaped slice's agentic lens as an MD grounding doc — the is-it-an-agent gate, the load weights (cognitive / creative / logistical on a low→ultra scale), and the controls (guardrails, handoff) — from the slice's hub (its functionalities' grounding docs + the spine profile) and KB grounding. A slice that should offload nothing comes out "not an agent", stated plainly. Writes the per-node lens agentic.md (conforming to the Agentic lens template) STRAIGHT TO THE LIVE MODEL, plus a grounding manifest under STM that carries any autonomy decision as structured data; reads the functionality.md docs for the hub, never another lens. Generative artifact production for the /agentic play; direct-model-write per ADR 026 — writes only the per-node lens doc to the live model and NEVER a shared file (spine/profile/decisions).
version: 0.5.0
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
(never another realize lens).

**Write discipline (ADR 026, `standards/rules/direct-model-write.md`).** This is the LLM
authoring skill of a direct-model-write play: it writes ONLY the per-node lens doc
`agentic.md` **straight to the live model** (at `lens_rel` under `product_base`) — its own
file, no draft copy. It NEVER writes a shared model file: the spine `_spine.yaml`, the
profile, or a `decisions/` record. Any material autonomy choice is emitted as **structured
data in the manifest** (a non-model STM artifact); /agentic's deterministic keyed persist
(`persist_agentic.py`) reads the manifest and writes the decision in place, keyed to the slice.
Containment is /agentic's post-write scoped guard, not a draft.

## What it produces (against the locked template)

`agentic.md` conforms to `standards/schemas/product-os/grounding/lens/agentic.md` — H1
`# Agentic Lens`, sections **Is it an agent?** (the gate + why), **Load weights** (a table:
cognitive / creative / logistical on a low→ultra scale, with rationale; "n/a — not an agent"
when the gate is no), **Controls** (guardrails, handoff; for a non-agent slice, the determinism
boundaries). It must clear the linter (shape) and the content-quality eval (the play runs both) — run over
the LIVE doc, since it is written in place. Alongside it, a structured `agentic-manifest.yaml`
(written under STM) carries the machine-checkable grounding the prose can't — which
functionalities the assessment is grounded in, the lens's live relative path (`lens_rel`), and
any material autonomy **decision as a full record** (the keyed persist writes it in place).

## Inputs

| Field | Required | Description |
|-------|----------|-------------|
| `slice_ref` | yes | `{domain}/{slice-id}` — display reference. |
| `slice_file` | yes | Path to the live slice record (read-only — for the functionalities it bundles). |
| `functionality_groundings` | yes | Paths to each functionality's `functionality.md` grounding doc (the hub, resolved by `check_ready_slice`). Read these for behavior/acceptance — NOT `ice.yaml` (retired). |
| `profile` | yes | The product profile (from the spine) — conditions + surfaces. Read-only. |
| `kb_search` | yes | Path to the KB search script, for agentic-framing grounding. |
| `kb_root` | yes | Path to `knowledge/`, to resolve learning ids. |
| `product_base` | yes | Product model root — the lens is written IN PLACE under it; also read to reuse an existing autonomy decision. |
| `lens_rel` | yes | Relative live path of the lens: `product-os/{domain}/slices/{slice}/lens/agentic.md`. The doc is written to `{product_base}/{lens_rel}`. |
| `manifest_path` | yes | Output path under STM for `agentic-manifest.yaml` (the grounding map + `lens_rel` + any decision records). |
| `proposals_dir` | yes | Output folder under STM for any KB-learning-gap proposals. |
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
5. **Write the lens in place + the manifest.** Write `agentic.md` to the LIVE path
   `{product_base}/{lens_rel}` (per the template) — the per-node lens doc, straight to the live
   model, overwriting a prior lens on a re-run. Write `agentic-manifest.yaml` to `manifest_path`
   under STM: the functionalities the assessment grounds in, the `lens_rel`, and any material
   autonomy choice emitted as a **full decision record** under `decisions:` (structured data — NOT
   a file). Write any KB proposals under `proposals_dir`. NEVER write the spine, the profile, or a
   `decisions/` file, and never another lens.

## Output — the live lens + the STM manifest

```
{product_base}/product-os/{domain}/slices/{slice}/lens/agentic.md   # the Agentic lens grounding doc — WRITTEN IN PLACE (live)
{manifest_path}                                                     # agentic-manifest.yaml — grounding map + lens_rel + any decision (STM)
{proposals_dir}/<gap>.yaml                                          # KB-learning-gap proposals (only if gaps; STM)
```

`agentic-manifest.yaml`:

```yaml
agentic:
  slice_ref: token-dash/slice-trusted-coverage
  lens_rel: product-os/token-dash/slices/slice-trusted-coverage/lens/agentic.md
  is_agent: false
  grounds:                                        # the functionalities the assessment considered
    - { source_type: functionality, source: "func-source-usage-ingest", functionality_ref: func-source-usage-ingest }
    - { source_type: functionality, source: "func-privacy-trust-labeling", functionality_ref: func-privacy-trust-labeling }
  choices: []                                     # KB-grounded agentic-framing choices (if any)
  decisions: []                                   # full autonomy decision records (only if a material choice) — the keyed persist writes them in place
```

Return the enriched contract with the `lens_rel` (the live doc) and the `manifest_path` — paths,
never inline content.

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
  any material autonomy choice grounds in a KB learning or a proposal and is recorded as a
  decision record in the manifest.
- **Direct-model-write (ADR 026).** Write ONLY the per-node lens doc `agentic.md` to the live
  model; never write a shared file (spine/profile/decisions) — emit any decision as manifest
  data. Containment is /agentic's post-write scoped guard.
```
