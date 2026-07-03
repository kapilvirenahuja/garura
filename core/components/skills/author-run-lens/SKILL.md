---
name: author-run-lens
description: Author a shaped slice's run lens as a narrative grounding doc (run.md) PLUS a machine-readable per-environment definition (run.yaml) — how the slice ships and operates: the slice-level design (rollout, migrations, CI/CD) written once, and ONE environment defined per call (local for /launch, or a cloud environment for /deploy — provider, region, compute, services, networking/firewalls, security, deploy command). Re-run to add or edit an environment; existing environments are preserved. Reads the slice's hub (functionality grounding docs + the spine profile) and the slice's architecture lens (components + stack), never another lens. Every operational choice is grounded, never invented. Writes a draft only; does NOT stamp the slice realized. Generative artifact production for the /run play.
version: 0.4.0
user-invocable: false
model: opus
allowed-tools: Read, Write, Bash, Glob
---

# author-run-lens

Turns a shaped slice's **hub** — the grounding docs of the functionalities it bundles, plus the
product profile — together with the slice's **architecture lens** into the slice's **run lens**.
The run plan is grounded in what the slice does (the hub) and how it is built (the architecture's
components + stack) — never invented. It reads the hub and the architecture lens only (never
another realize lens) and writes a draft; /run's checkpoint and apply step persist it.

## Per-environment model (#434)

The run lens has two parts, produced together:

- **Slice-level operational design — written ONCE.** Rollout (how it goes live and rolls back),
  migrations, and CI/CD. On the first call these are authored; on a later call they are carried
  forward unchanged unless the target environment genuinely forces a change.
- **Environments — ONE defined per call, incremental.** Each call defines or edits exactly one
  environment and preserves every environment already defined. A **local** environment is the
  lightweight bring-up `/launch` uses for human testing. A **cloud** environment carries real
  infrastructure — provider, region, per-component compute, managed services, networking and
  firewalls, and security (identity, secrets, controls) — the definition `/deploy` executes
  against. Environments are ordered by `tier` (0 local, 1 dev, up to 4 prod).

Typical sequence: first call defines the slice-level design + the **local** environment (unblocks
`/launch`); the next call adds the **dev** cloud environment (unblocks `/deploy`); higher tiers are
added later by re-running.

## What it produces (against the locked contracts)

- **`run.yaml`** — the machine-readable per-environment definition, conforming to
  `standards/schemas/product-os/lens/run.yaml`. This is the artifact the delivery plays execute
  against. It carries the slice-level design plus every environment defined so far.
- **`run.md`** — the NARRATIVE grounding doc, conforming to
  `standards/schemas/product-os/grounding/lens/run.md` — H1 `# Run Lens`, sections
  **Environments**, **Rollout**, **Migrations**, **Config & secrets**, **CI/CD**. It explains the
  *why* behind the yaml. It must clear the linter (shape) and the content-quality eval (the play
  runs both). The Environments section grows an entry per environment.
- **`run-manifest.yaml`** — the machine-checkable grounding: which functionality / profile /
  architecture component each operational choice traces to, plus any material choice.

`run.md` and `run.yaml` MUST stay in step — the same environments, same providers, same postures.

## Inputs

| Field | Required | Description |
|-------|----------|-------------|
| `slice_ref` | yes | `{domain}/{slice-id}` — display reference. |
| `slice_file` | yes | Path to the live slice record (read-only — for the functionalities it bundles). |
| `target_env` | yes | The one environment to define or edit this call: `{ name, type: local\|cloud, tier }`. Resolved by /run (default: the lowest not-yet-defined tier). |
| `existing_run_yaml` | no | Path to the slice's current `lens/run.yaml`, if it exists. Read it to carry forward the slice-level design and every already-defined environment. Absent on the first call. |
| `functionality_groundings` | yes | Paths to each functionality's `functionality.md` grounding doc (the hub, resolved by `check_ready_slice`). Read these — NOT `ice.yaml` (retired). |
| `architecture_lens` | yes | Path to the slice's `lens/architecture.md` (its components + stack). Read-only — the run plan flows from the architecture; a cloud env's compute/services map to its components. |
| `profile` | yes | The product profile (from the spine) — its conditions (stage/users/persistence/surfaces). Read-only. |
| `product_base` | yes | Product model root (to reuse an existing material decision). |
| `lens_rel` | yes | Relative path the lens mirrors: `product-os/{domain}/slices/{slice}/lens/run.md`. |
| `draft_dir` | yes | Output folder under STM for the draft + manifest. |
| `stm_base` | yes | From config. |

## Procedure

Reasoning (the environment shape, the rollout, what migrates, the secrets posture, the CI/CD) is
yours. Template/schema conformance, grounding, and concreteness are non-negotiable.

1. **Read the hub + the architecture + any existing run lens.** Load each functionality's
   `functionality.md` (what the slice does), the profile (its conditions), and `architecture.md`
   (the components + stack the run plan must operate). If `existing_run_yaml` is given, load it —
   its slice-level design and defined environments are the base you extend. Do NOT read any other
   lens (ux/agentic/quality/measure/marketing).

2. **Carry or author the slice-level design.** If an existing run lens is present, carry rollout,
   migrations, and CI/CD forward unchanged unless `target_env` genuinely forces a change (record a
   decision if it does). On the first call, author them from the architecture's stack/components and
   the slice's conditions — a local-fixture MVP says so plainly.

3. **Define the target environment.** Build the one `target_env` fully, grounded in the
   architecture and profile:
   - **local** — how to bring it up (a concrete command / compose file) and any test-data seed.
   - **cloud** — provider and region; the compute each architecture component runs on (service +
     deploy kind, MUST match architecture-lens component names); managed backing services;
     networking (ingress posture + explicit firewall rules); security (identity, secrets-manager
     binding, controls like TLS / least-privilege); the per-env config & secrets; and the deploy
     command `/deploy` will run. A material infrastructure choice → a decision.
   Preserve every other environment already in the existing run lens; do not drop or silently edit
   them.

4. **Write the draft — both artifacts, in step.** Write `run.yaml` (slice-level design + all
   environments, ordered by tier, conforming to the run lens schema) and `run.md` (the narrative,
   an Environments entry per environment, per the grounding template) to the lens paths under
   `draft_dir`. Write `run-manifest.yaml` (the grounding map) and any decision. Drafts only — never
   the live model, never another lens, and NEVER stamp the slice realized (that is /measure's job).

## Output — the draft

```
{draft_dir}/
  product-os/{domain}/slices/{slice}/
    lens/run.yaml                                 # the machine-readable per-env definition
    lens/run.md                                   # the Run lens narrative grounding doc
    decisions/{decision-id}.yaml                  # a material decision (if any)
  run-manifest.yaml                               # grounding map (choice -> functionality / profile / architecture)
```

`run-manifest.yaml`:

```yaml
run:
  slice_ref: token-dash/slice-trusted-coverage
  target_env: dev                                 # the environment defined/edited this call
  grounds:                                        # every choice traces to the hub, profile, or architecture
    - { source_type: profile, source: "shape.stage" }
    - { source_type: architecture, source: "architecture.md: Read API + Coverage view" }
    - { source_type: functionality, source: "func-source-usage-ingest", functionality_ref: func-source-usage-ingest }
  choices: []                                     # material run choices (each → a decision), if any
```

Return the enriched contract with the `draft_dir`, the `run.yaml` path, and the `run-manifest.yaml`
path — paths, never inline content.

## Rules

- **Hub + architecture only.** Derive from the functionalities' grounding docs, the profile, and the
  architecture lens; never read or ground on another realize lens (ux/agentic/quality/measure/marketing).
- **One environment per call; preserve the rest.** Define or edit exactly the `target_env`. Every
  environment already in `existing_run_yaml` is carried forward intact.
- **Two artifacts in step.** `run.yaml` (machine-readable) and `run.md` (narrative) must describe the
  same environments with the same facts. `run.yaml` conforms to the run lens schema; `run.md` conforms
  to the grounding template and clears the linter + content eval.
- **Never stamp realized.** /run authors its run lens and closes the non-functional pipe; the slice's
  `realized` stamp belongs to /measure (the deliver pipe, which runs last).
- **Grounded, not invented.** Every operational choice — including a cloud env's compute, services,
  firewalls, and security — traces to the hub, the profile, or the architecture; a material choice is
  recorded as a decision. A cloud env's compute/services MUST map to architecture-lens components.
- **Concrete.** Real environments, a real rollout/rollback, an explicit migrations answer, an explicit
  secrets posture (secrets via a secrets manager, NEVER in the repo), a real CI/CD with what it gates
  on, and — for a cloud env — a real deploy command. "None" is allowed only with its reason.
- **Cover the hub.** The run plan considers every functionality the slice bundles, recorded in the
  manifest grounds.
- **Drafts only.** Write under `draft_dir`; never touch the live model.
```
