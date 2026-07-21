---
name: author-run-lens
description: Author a shaped slice's run lens — write the narrative grounding doc (run.md) straight to the LIVE model, and emit the machine-readable per-environment definition (run.yaml) plus any decision as STRUCTURED MANIFEST DATA for the play's keyed persist to write. How the slice ships and operates: the slice-level design (rollout, migrations, CI/CD, TCO) written once, and ONE environment defined per call (local for /launch, or a cloud environment for /deploy — provider, region, compute, services, networking/firewalls, security, deploy command). Re-run to add or edit an environment; existing environments are preserved by the keyed persist. Reads the slice's hub (functionality grounding docs + the spine profile) and the slice's architecture lens (components + stack), never another lens. Every operational choice is grounded, never invented. Never writes run.yaml, a decision file, the spine, or the profile; NEVER stamps the slice realized. Generative artifact production for the /run play (direct-model-write, ADR 026).
version: 0.5.0
user-invocable: false
model: opus
allowed-tools: Read, Write, Bash, Glob
---

# author-run-lens

Turns a shaped slice's **hub** — the grounding docs of the functionalities it bundles, plus the
product profile — together with the slice's **architecture lens** into the slice's **run lens**.
The run plan is grounded in what the slice does (the hub) and how it is built (the architecture's
components + stack) — never invented. It reads the hub and the architecture lens only (never
another realize lens).

**Direct-model-write (ADR 026, `standards/rules/direct-model-write.md`).** There is no draft tree.
This skill's containment split is mandatory:

- It writes ONLY the per-node **narrative** doc `run.md` — straight to the LIVE model at its lens
  path. That is the one file this skill writes.
- It writes NOTHING else to disk in the model. The machine-readable `run.yaml` and any decision are
  emitted as **structured data in the manifest** (`run-manifest.yaml`, an STM/non-model artifact) —
  the play's deterministic keyed persist (`persist_run.py`) reads that manifest and writes `run.yaml`
  (merging exactly the target environment, preserving the rest) and the decisions in place. This
  skill NEVER writes `run.yaml`, a decision file, the spine `_spine.yaml`, the profile, the slice
  record, or another lens, and NEVER stamps the slice `realized` (that is /measure's job).

Because `run.md` (which this skill writes) and `run.yaml` (which the keyed persist writes from this
manifest) both derive from ONE reasoning pass here, they describe the same environments with the
same facts and cannot drift; the play's validate step checks their agreement over the live files.

## Per-environment model (#434)

The run lens has two parts, produced together:

- **Slice-level operational design — written ONCE.** Rollout (how it goes live and rolls back),
  migrations, CI/CD, and the TCO picture. On the first call these are authored; on a later call they
  are carried forward unchanged unless the target environment genuinely forces a change (a decision).
- **Environments — ONE defined per call, incremental.** Each call defines or edits exactly one
  environment; the keyed persist preserves every environment already defined. A **local** environment
  is the lightweight bring-up `/launch` uses for human testing. A **cloud** environment carries real
  infrastructure — provider, region, per-component compute, managed services, networking and
  firewalls, and security (identity, secrets, controls) — the definition `/deploy` executes against.
  Environments are ordered by `tier` (0 local, 1 dev, up to 4 prod).

Typical sequence: first call authors the slice-level design + the **local** environment (unblocks
`/launch`); the next call adds the **dev** cloud environment (unblocks `/deploy`); higher tiers are
added later by re-running.

## What it produces (against the locked contracts)

- **`run.md`** (WRITTEN to the live model) — the NARRATIVE grounding doc, conforming to
  `standards/schemas/product-os/grounding/lens/run.md` — H1 `# Run Lens`, sections **Environments**,
  **Rollout**, **Migrations**, **Config & secrets**, **CI/CD**. It explains the *why* behind the yaml
  and must clear the linter (shape) and the content-quality eval (the play runs both). The
  Environments section narrates every environment the run.yaml will hold.
- **`run-manifest.yaml`** (EMITTED, STM) — carries the `run.yaml` delta as structured data plus the
  grounding map: the slice-level design, the ONE target environment definition (conforming to the run
  lens schema `content.environments` entry), which functionality / profile / architecture component
  each operational choice traces to, and any material decision record. The keyed persist consumes it.

`run.md` and the `run.yaml` the persist will write MUST stay in step — the same environments, same
providers, same postures.

## Inputs

| Field | Required | Description |
|-------|----------|-------------|
| `slice_ref` | yes | `{domain}/{slice-id}` — display reference. |
| `slice_file` | yes | Path to the live slice record (read-only — for the functionalities it bundles). |
| `target_env` | yes | The one environment to define or edit this call: `{ name, type: local\|cloud, tier }`. Resolved by /run (default: the lowest not-yet-defined tier). |
| `existing_run_yaml` | no | Path to the slice's current LIVE `lens/run.yaml`, if it exists. Read it (read-only) to carry forward the slice-level design and every already-defined environment when narrating `run.md`. Absent on the first call. |
| `functionality_groundings` | yes | Paths to each functionality's `functionality.md` grounding doc (the hub, resolved by `check_ready_slice`). Read these — NOT `ice.yaml` (retired). |
| `architecture_lens` | yes | Path to the slice's `lens/architecture.md` (its components + stack). Read-only — the run plan flows from the architecture; a cloud env's compute/services map to its components. |
| `profile` | yes | The product profile (from the spine) — its conditions (stage/users/persistence/surfaces). Read-only. |
| `product_base` | yes | Product model root (to resolve the live lens path + reuse an existing material decision). |
| `lens_rel` | yes | Relative path (under `product_base`) the lens mirrors: `product-os/{domain}/slices/{slice}/lens/run.md` (and `…/run.yaml`). |
| `run_md_live` | yes | The LIVE path to write `run.md` to: `{product_base}product-os/{domain}/slices/{slice}/lens/run.md`. |
| `manifest_path` | yes | STM path to write `run-manifest.yaml` (the run.yaml delta + grounding map). |
| `stm_base` | yes | From config. |

## Procedure

Reasoning (the environment shape, the rollout, what migrates, the secrets posture, the CI/CD) is
yours. Template/schema conformance, grounding, and concreteness are non-negotiable.

1. **Read the hub + the architecture + any existing live run lens.** Load each functionality's
   `functionality.md` (what the slice does), the profile (its conditions), and `architecture.md`
   (the components + stack the run plan must operate). If `existing_run_yaml` is given, load it
   read-only — its slice-level design and defined environments are the base you extend when
   narrating `run.md`. Do NOT read any other lens (ux/agentic/quality/measure/marketing).

2. **Carry or author the slice-level design.** If an existing run lens is present, carry rollout,
   migrations, CI/CD, and TCO forward unchanged unless `target_env` genuinely forces a change (record
   a decision if it does). On the first call, author them from the architecture's stack/components and
   the slice's conditions — a local-fixture MVP says so plainly.

3. **Define the target environment.** Build the one `target_env` fully, grounded in the
   architecture and profile:
   - **local** — how to bring it up (a concrete command / compose file) and any test-data seed.
   - **cloud** — provider and region; the compute each architecture component runs on (service +
     deploy kind, MUST match architecture-lens component names); managed backing services;
     networking (ingress posture + explicit firewall rules); security (identity, secrets-manager
     binding, controls like TLS / least-privilege); the per-env config & secrets; and the deploy
     command `/deploy` will run. A material infrastructure choice → a decision (emitted in the
     manifest, not written to disk here).

4. **Write `run.md` to the LIVE model; emit everything else to the manifest.** Write `run.md` (the
   narrative — an Environments entry per environment the run.yaml will hold, per the grounding
   template) to `run_md_live` on the live model. Then write `run-manifest.yaml` to `manifest_path`
   carrying: the slice-level design, the ONE target environment definition (a full run-lens-schema
   `environments` entry), the grounding map, and any decision record — as structured data. Do NOT
   write `run.yaml`, a decision file, the spine, the profile, or any other lens, and NEVER stamp the
   slice realized.

## Output

`run.md` is written to the live model at `run_md_live`. The manifest is written to `manifest_path`:

```yaml
run:
  slice_ref: token-dash/slice-trusted-coverage
  lens_rel: product-os/token-dash/slices/slice-trusted-coverage/lens/run.yaml
  target_env: dev                                 # the environment defined/edited this call
  slice_level:                                    # written once; carried forward on later calls
    rollout: { strategy: canary, flags: [] }
    migrations: "none — read-only slice (reason)"
    cicd: "build -> quality gates -> deploy on green"
    tco: { hyperscaler: { ... }, simulation: { ... }, estimate: { ... } }
  environment:                                    # the ONE target env — a run.yaml environments entry
    name: dev
    tier: 1
    type: cloud
    status: defined
    config_secrets: "per-env config; secrets via manager"
    cloud: { provider: ..., region: ..., compute: [ ... ], services: [ ... ],
             networking: { ... }, security: { secrets: "sm://…binding" }, deploy_cmd: ... }
  grounds:                                        # every choice traces to the hub, profile, or architecture
    - { source_type: profile, source: "shape.stage" }
    - { source_type: architecture, source: "architecture.md: Read API + Coverage view" }
    - { source_type: functionality, source: "func-source-usage-ingest", functionality_ref: func-source-usage-ingest }
  choices: []                                     # material run choices (each → a decision), if any
  decisions: []                                   # decision records to write (keyed persist, skip-if-exists)
```

Return the enriched contract with the live `run.md` path and the `run-manifest.yaml` path — paths,
never inline content.

## Rules

- **Containment split (ADR 026).** Write ONLY `run.md`, to the LIVE model. Emit `run.yaml` (as the
  structured `slice_level` + `environment`) and any decision as manifest DATA — never write `run.yaml`,
  a decision file, the spine, or the profile. The keyed persist writes those.
- **Hub + architecture only.** Derive from the functionalities' grounding docs, the profile, and the
  architecture lens; never read or ground on another realize lens (ux/agentic/quality/measure/marketing).
- **One environment per call.** Emit exactly the `target_env` in the manifest `environment` block; the
  keyed persist preserves every environment already in the live run.yaml.
- **Two artifacts in step.** The `run.md` you write and the `run.yaml` the persist writes from your
  manifest must describe the same environments with the same facts. `run.md` conforms to the grounding
  template and clears the linter + content eval; the manifest `environment` conforms to the run lens
  schema.
- **Never stamp realized.** /run authors its run lens and closes the non-functional pipe; the slice's
  `realized` stamp belongs to /measure (the deliver pipe, which runs last).
- **Grounded, not invented.** Every operational choice — including a cloud env's compute, services,
  firewalls, and security — traces to the hub, the profile, or the architecture; a material choice is
  recorded as a decision (in the manifest). A cloud env's compute/services MUST map to architecture-lens
  components.
- **Concrete.** Real environments, a real rollout/rollback, an explicit migrations answer, an explicit
  secrets posture (secrets via a secrets manager, NEVER in the repo), a real CI/CD with what it gates
  on, and — for a cloud env — a real deploy command. "None" is allowed only with its reason.
- **Cover the hub.** The run plan considers every functionality the slice bundles, recorded in the
  manifest grounds.
