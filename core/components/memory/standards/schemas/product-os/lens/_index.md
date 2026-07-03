# Lens schemas — the seven realize lenses (six schema'd here)

The seven faces of a **slice's** realization — one per realize lens:
**quality · ux · agentic · marketing · architecture · measure · run**. These are
realization, NOT intent — the intent is the ICE of the functionalities the slice
bundles. Six lenses carry a YAML schema in this directory; **marketing** is a
grounding-doc-only lens (`lens/marketing.md`, written by the /marketing play from
its grounding template — no YAML record). The /measure gate counts all seven lens
docs before stamping a slice realized.
Two trinities (decision 23): the **lens trinity** (quality, ux, agentic — what the
slice should be) and the **foundation trinity** (architecture, measure, run — what
makes it real); foundation lenses read the trinity, the trinity reads only the hub;
marketing closes the functional pipe after agentic.

**The slice is the unit of realization (#434).** A slice (from `/shape`) is a
vertical product increment — the thing you actually deliver. You pick a slice and
run ux → agentic → marketing (functional) and arch → quality → run (non-functional),
then measure stamps it realized. The lenses are therefore stored ON the slice, not
on a capability:

    {domain}/slices/{slice-id}.yaml          # the slice record (shape/roadmap own it)
    {domain}/slices/{slice-id}/lens/{type}.yaml   # the slice's lenses (realize owns these)
    {domain}/slices/{slice-id}/decisions/*.yaml   # decisions a lens records

A slice has no ICE of its own — its hub is the union of its functionalities' ICE
(each `functionalities[].ice_ref`, which may span several capabilities) plus the
product profile. PERMANENT.

## Shared envelope (every lens record)

```yaml
lens:
  id: string
  slice_ref: string        # the slice this lens belongs to ({domain}/{slice-id})
  type: string             # quality | ux | agentic | architecture | measure | run
  summary: string          # one line of what this lens establishes
  content: {}              # per-type — see the type's file in this folder
  status: string           # proposed | active | superseded
  metadata: { created_by: string, updated_by: string, version: integer }
```

## Fill rules

- the realize lenses (`/quality`, `/ux`, `/agentic`, `/arch`, `/measure`, `/run`) —
  each creates/updates its one lens for a slice
- `/learn` — may update a lens from real-world outcomes

## The lenses

| File | Holds |
|------|-------|
| `ux.yaml` | screens (with low-fidelity layout), states, visual core (color + typography). a11y lives in the profile; flows are derived by the build |
| `architecture.yaml` | components, contracts, stack (versions), vertical-build |
| `run.yaml` | environments, rollout, migrations, config/secrets, CI/CD |
| `quality.yaml` | the gates the ICE must pass |
| `measure.yaml` | the delivery-measurement claims: focus + per-metric baseline/target/proof (triangle-primary: speed/tokens/cognition; industry frames derived) + out_of_scope. The seam /capture harvests |
| `agentic.yaml` | is-it-an-agent gate + five axes on one low→ultra scale: the three weights (cognitive/creative/logistical = how much load to offload) + controls (guardrails, handoff). How garura thinks about agentic lives here |

Enhance: PARKED — see `product-os.yaml`.
