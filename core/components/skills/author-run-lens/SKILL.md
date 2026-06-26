---
name: author-run-lens
description: Author a shaped slice's run lens as an MD grounding doc — how the slice ships and operates: environments, rollout, migrations, config/secrets, and CI/CD — from the slice's hub (its functionalities' grounding docs + the spine profile) and the slice's architecture lens (its components and stack). Every operational choice is grounded in what the slice actually is and how it is built, never invented. Writes a draft run.md (conforming to the Run lens template) plus a grounding manifest and any material decision; reads the functionality.md docs + the profile + architecture.md, never another lens. It does NOT stamp the slice realized. Generative artifact production for the /run play; writes a draft only, never the live model.
version: 0.3.0
user-invocable: false
model: opus
allowed-tools: Read, Write, Bash, Glob
---

# author-run-lens

Turns a shaped slice's **hub** — the grounding docs of the functionalities it bundles, plus the
product profile — together with the slice's **architecture lens** into the slice's **run lens**,
written as the grounding doc `run.md`: where it runs, how it rolls out, what it migrates, its
config and secrets, and its CI/CD. The run plan is grounded in what the slice does (the hub) and
how it is built (the architecture's components + stack) — never invented. It reads the hub and the
architecture lens only (never another realize lens) and writes a draft — /run's checkpoint and apply
step persist it.

## What it produces (against the locked template)

`run.md` conforms to `standards/schemas/product-os/grounding/lens/run.md` — H1 `# Run Lens`,
sections **Environments**, **Rollout**, **Migrations**, **Config & secrets**, **CI/CD**. It must
clear the linter (shape) and the content-quality eval (the play runs both). Alongside it, a
structured `run-manifest.yaml` carries the machine-checkable grounding the prose can't — which
functionality / profile / architecture component each operational choice traces to, and any
material choice.

## Inputs

| Field | Required | Description |
|-------|----------|-------------|
| `slice_ref` | yes | `{domain}/{slice-id}` — display reference. |
| `slice_file` | yes | Path to the live slice record (read-only — for the functionalities it bundles). |
| `functionality_groundings` | yes | Paths to each functionality's `functionality.md` grounding doc (the hub, resolved by `check_ready_slice`). Read these — NOT `ice.yaml` (retired). |
| `architecture_lens` | yes | Path to the slice's `lens/architecture.md` (its components + stack). Read-only — the run plan flows from the architecture. |
| `profile` | yes | The product profile (from the spine) — its conditions (stage/users/persistence/surfaces). Read-only. |
| `product_base` | yes | Product model root (to reuse an existing material decision). |
| `lens_rel` | yes | Relative path the lens mirrors: `product-os/{domain}/slices/{slice}/lens/run.md`. |
| `draft_dir` | yes | Output folder under STM for the draft + manifest. |
| `stm_base` | yes | From config. |

## Procedure

Reasoning (the environments, the rollout, what migrates, the secrets posture, the CI/CD) is yours.
Template conformance, grounding, and concreteness are non-negotiable.

1. **Read the hub + the architecture.** Load each functionality's `functionality.md` (what the slice
   does), the profile (its conditions), and `architecture.md` (the components + stack the run plan
   must operate). Do NOT read any other lens (ux/agentic/quality/measure/marketing).
2. **Write the five sections.** Environments (where it runs and what each needs), Rollout (how it
   goes live and rolls back), Migrations (data/schema moves, or "none" with the reason), Config &
   secrets (what it needs, how secrets are handled, or "none — no credentials" with the reason),
   CI/CD (how it is built, tested, shipped, and what the build gates on). Each flows from the
   architecture's stack/components and the slice's conditions — a local-fixture MVP says so plainly.
3. **Write the draft.** Write `run.md` to the lens path under `draft_dir` (per the template); write
   `run-manifest.yaml` (the functionality / profile / architecture each operational choice grounds
   in; any material choice → a decision); write the decision if any. Drafts only — never the live
   model, never another lens, and NEVER stamp the slice realized (that is /measure's job).

## Output — the draft

```
{draft_dir}/
  product-os/{domain}/slices/{slice}/
    lens/run.md                                   # the Run lens grounding doc
    decisions/{decision-id}.yaml                  # a material decision (if any)
  run-manifest.yaml                               # grounding map (choice -> functionality / profile / architecture)
```

`run-manifest.yaml`:

```yaml
run:
  slice_ref: token-dash/slice-trusted-coverage
  grounds:                                        # every choice traces to the hub, profile, or architecture
    - { source_type: profile, source: "shape.stage" }
    - { source_type: architecture, source: "architecture.md: Read API + Coverage view" }
    - { source_type: functionality, source: "func-source-usage-ingest", functionality_ref: func-source-usage-ingest }
  choices: []                                     # material run choices (each → a decision), if any
```

Return the enriched contract with the `draft_dir` and `run-manifest.yaml` path — paths, never inline
content.

## Rules

- **Hub + architecture only.** Derive from the functionalities' grounding docs, the profile, and the
  architecture lens; never read or ground on another realize lens (ux/agentic/quality/measure/marketing).
- **Never stamp realized.** /run authors its run lens and closes the non-functional pipe; the slice's
  `realized` stamp belongs to /measure (the deliver pipe, which runs last).
- **Template-true.** `run.md` conforms to the Run lens template (Environments / Rollout / Migrations /
  Config & secrets / CI/CD) and must clear the linter + the content eval — every item self-explaining.
- **Grounded, not invented.** Every operational choice traces to the hub, the profile, or the
  architecture; a material choice is recorded as a decision.
- **Concrete.** Real environments, a real rollout/rollback, an explicit migrations answer, an explicit
  secrets posture, a real CI/CD with what it gates on. "None" is allowed only with its reason.
- **Cover the hub.** The run plan considers every functionality the slice bundles, recorded in the
  manifest grounds.
- **Drafts only.** Write under `draft_dir`; never touch the live model.
```
