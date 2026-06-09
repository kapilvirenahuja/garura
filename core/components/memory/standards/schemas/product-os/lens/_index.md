# Lens schemas — the five realize lenses

The five faces of a capability's **realization**, produced by `/realize`:
**ux · architecture · run · quality · agentic**. These are realization, NOT
intent — the capability's intent is its ICE. (Renamed from "capability-intent"
under #434 to remove the collision with ICE.)

One file per lens type in this folder. A capability's filled lenses are stored at
`{capability}/lens/{type}.yaml`. PERMANENT.

## Shared envelope (every lens record)

```yaml
lens:
  id: string
  capability_ref: string   # the capability this lens belongs to
  type: string             # ux | architecture | run | quality | agentic
  summary: string          # one line of what this lens establishes
  content: {}              # per-type — see the type's file in this folder
  status: string           # proposed | active | superseded
  metadata: { created_by: string, updated_by: string, version: integer }
```

## Fill rules

- `/realize` — creates/updates the five lenses for a capability
- `/learn` — may update a lens from real-world outcomes

## The lenses

| File | Holds |
|------|-------|
| `ux.yaml` | screens (with low-fidelity layout), states, visual core (color + typography). a11y lives in the profile; flows are derived by the build |
| `architecture.yaml` | components, contracts, stack (versions), vertical-build |
| `run.yaml` | environments, rollout, migrations, config/secrets, CI/CD |
| `quality.yaml` | the gates the ICE must pass |
| `agentic.yaml` | the three weights (cognitive/creative/logistical) + bounds |

Enhance: PARKED — see `product-os.yaml`.
