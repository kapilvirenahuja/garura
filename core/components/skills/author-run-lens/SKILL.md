---
name: author-run-lens
description: Draft /run's run lens for one SLICE — how it is deployed and runs. Reads the slice's hub (its functionalities' ICE + the profile box) AND its architecture lens (the parts to deploy), optionally the three lens-trinity files (quality, ux, agentic — decision 23), then grounds every operational choice in the KB's architecture/technology shelves via kb-search — rollout strategy, migration stance, environment topology, CI/CD shape, and a run target for every architecture component — basing each on what has worked for us, never on the model's taste. Anything the KB does not cover is raised as a KB-learning-gap proposal (a candidate architecture/technology learning for review), never invented. Writes a draft only (the run lens + a grounding manifest in STM), never the live model. The generative work for the /run play; it reads the architecture lens (run deploys arch's parts) and may read the lens trinity, but never the measure lens's content (presence only, via /run's lines-up gate).
version: 0.1.0
user-invocable: false
model: opus
allowed-tools: Read, Write, Bash, Glob
---

# author-run-lens

Turns one shaped, **architected** slice into its **run lens** — how the slice is deployed and
runs. A slice is a vertical product increment; its **hub** is the union of its functionalities'
ICE (which may span several capabilities) plus the product profile. /run is the sixth and last
realize lens, and the run lens is seven things and only seven:

- **environments** — the path the slice moves through (dev → staging → prod).
- **rollout** — the feature `flags` it gates behind and the `strategy` (blue/green | canary |
  rolling).
- **migrations** — the data-change strategy (gated, reversible) — or an explicit "none,
  additive only".
- **config_secrets** — per-environment config; secrets via a secrets manager, never in the
  repo.
- **cicd** — the pipeline: build → quality gates → deploy on green.
- **targets** — for **every** architecture component, where (which environment) and how
  (container | service | function | static | managed) it runs. Each target binds to a real
  component in the slice's **architecture lens** — no dangling target.
- **tco** — the ownership-cost picture the operating owner approves on (#435): the
  **hyperscaler** decision (selected provider, default region, alternatives rejected and why);
  a **concrete service map** — for every architecture component, the managed service that runs
  it and its cost driver; a **user/load simulation** with at least seed, pilot, and expanded
  scenarios (users, sources, frequencies, retention); a **cost estimate** — a monthly range
  per scenario in a named currency with primary drivers, exclusions, a confidence level, and
  the variables that would change it; and **cost guardrails** (budget alert, retention limits,
  scale-up and HA triggers, review cadence). When exact pricing is unknown, produce a
  directional range with stated assumptions and confidence — never generic prose, never skip.

/run **deploys what /arch designed**, so it reads the architecture lens (the components to run).
It MAY also ground on the three lens-trinity files — quality, ux, agentic — when the play passes
them (decision 23). The one lens whose content it never reads is the **measure** lens; its
presence is /run's lines-up gate's business, not this skill's.

**Every operational choice is grounded in the KB, never invented.** Before drafting, search the
KB's `architecture/` and `technology/` shelves for the learnings whose conditions match this
product's situation, and base the rollout strategy, the migration stance, the environment
topology, and the CI/CD shape on what has worked for us. Anything the shelves do not cover is a
recorded KB-learning-gap proposal — never a silent guess.

It writes a draft only — /run's checkpoint and apply step persist it; /run alone stamps the
slice done.

## Inputs

| Field | Required | Description |
|-------|----------|-------------|
| `slice_ref` | yes | The slice, `{domain}/{slice-id}`. |
| `slice_file` | yes | The slice record path (read-only) — its `functionalities` (the hub set). |
| `functionality_ices` | yes | The resolved ICE file paths for the slice's functionalities (the hub), from the readiness gate. Their `context.scope`/`context.systems` shape the operational picture. |
| `arch_lens` | yes | The slice's **architecture lens** path (read-only) — its `content.components` are the parts to give run targets. |
| `quality_lens` | no | The slice's quality lens path (read-only) — optional trinity grounding (decision 23). |
| `ux_lens` | no | The slice's ux lens path (read-only) — optional trinity grounding (decision 23). |
| `agentic_lens` | no | The slice's agentic lens path (read-only) — optional trinity grounding (decision 23). |
| `profile_path` | yes | The product profile (read-only) — its condition facets (stage, scale, persistence, monetization) feed the KB query, and the `nfr` box sizes the rollout/migration risk. |
| `kb_search` | yes | Path to the `kb-search` skill's `scripts/kb_search.py` (the condition-search engine over the architecture/technology shelves). |
| `kb_root` | yes | The `knowledge/` dir, so the manifest can name resolvable learning ids. |
| `product_base` | yes | The product model root — read-only, to reuse an existing run decision if one exists. |
| `lens_rel` | yes | The slice's lens path to mirror in the draft, e.g. `product-os/{domain}/slices/{slice-id}/lens/run.yaml`. |
| `draft_dir` | yes | Output folder under STM for the draft lens + manifest + any proposals. |
| `stm_base` | yes | From config. |

## Procedure

The environment path, the rollout/migration taste, and the per-component deploy shape are
**chosen from KB learnings**, not invented; the grounding, the targets-bind-to-arch coverage,
and the seven-block shape are non-negotiable.

1. **Read the hub + the architecture lens (+ the optional trinity).** Load the slice record
   (its functionalities) and
   every functionality ICE in `functionality_ices` (their `context.scope`/`context.systems`),
   the profile (its condition facets + `nfr` box), and the **architecture lens** (its
   `content.components` — the parts that must run). When `quality_lens`/`ux_lens`/`agentic_lens`
   are provided, you MAY read them for grounding (decision 23). Do NOT read the **measure**
   lens's content — its presence is checked by /run's lines-up gate, never here.

2. **Read the product's conditions + search the KB.** Build the condition profile from the
   product profile (`stage`, `users`, `persistence`, `monetization`). Then query the KB's
   architecture/technology shelves through kb-search:

   ```bash
   python3 {kb_search} index           # all learnings + their conditions facets
   python3 {kb_search} get <id>        # e.g. architecture/microservices, technology/backend-nodejs
   ```

   Reason over each candidate's **Conditions** (this is judgment, not keyword match) and pick
   the architecture/technology learnings that fit this product. Their Recommendation tells you
   the rollout, migration, and operational shape that has worked for a product in this
   situation. Base every operational choice on a matched learning.

3. **Raise gaps, never invent.** For any operational aspect the shelves do not cover (e.g. a
   migration pattern no learning addresses), write a **KB-learning-gap proposal** into
   `{draft_dir}/proposals/<gap>.yaml` — a *candidate architecture/technology learning* shaped to
   the KB's `_TEMPLATE.md` (Topic, Conditions, Recommendation, Rationale, Evolve when,
   Provenance), with the conditions facets that shelf uses (stage/scale/persistence). It is a
   proposal for review, **never** written to the KB here. (Do NOT use propose-kb-node — that
   proposes domain/capability/functionality nodes for the domains shelf, the wrong shape for an
   operational learning.) The manifest references the proposal path; the play surfaces it at the
   checkpoint. Never ground an operational choice on the model's taste alone.

4. **Draft the run lens.** Write the seven blocks: the `environments` path; `rollout` (the
   `flags` the slice gates behind + the `strategy` from the matched learning); `migrations`
   (the gated/reversible stance, or an explicit none); `config_secrets`; `cicd` (build → quality
   gates → deploy on green); `targets` — one entry per architecture component, with the
   `environment` it deploys to and how it `deploy`s; and `tco`. Every component in the
   architecture lens gets a target; every target's `component` is a real architecture-lens
   component.

   **Build the `tco` block from what you already hold:** the hyperscaler from the matched
   platform learning (e.g. the product's preferred cloud — record the rejected alternative and
   why); the service map by giving every architecture component its concrete managed service
   (the run target says *how* it runs; the service map says *on what*, with the cost driver);
   the simulation scenarios (at least seed, pilot, expanded) from the hub's scope/personas and
   the profile's scale facets — state users/team size, source counts, frequencies, retention;
   the estimate as a monthly range per scenario in a named currency, with primary drivers,
   exclusions, confidence, and sensitivity variables — directional with stated assumptions
   when exact pricing is unknown, never generic; and the guardrails (budget alert, retention
   limits, scale-up and HA triggers, review cadence). Ground the platform pick and the cost
   model in KB learnings; a cost model the KB does not cover is a KB-learning-gap proposal
   (step 3), never a guess.

5. **Record material decisions.** The rollout strategy, the migration strategy, the
   environment topology, and the **hyperscaler/service-platform pick (the TCO posture)** are
   material choices — record each as a slice-level decision (ADR). If the product already has
   a run decision that fits (look under `product_base`), **reuse it** — do not re-invent.

6. **Write the draft + manifest.** Write the run lens (the v1 lens envelope with `type: run`,
   `slice_ref`, and the seven content blocks) under `draft_dir`, mirroring `lens_rel`, plus the
   decisions, plus a `run-manifest.yaml` that grounds **every** operational choice and **every**
   target in a KB learning id or a proposal path, so the play's validate + grounding steps are
   mechanical:

```yaml
run:
  slice: <domain>/<slice-id>
  choices:                              # the material operational choices, each grounded
    - aspect: rollout                   # rollout | migrations | environments | cicd | runtime
      value: "canary"
      grounds:
        - source_type: kb               # kb | proposal | profile
          source: "architecture/microservices"   # a learning id under kb_root, or a proposal path
          material: true
          decision: "<decision-id>"     # required when material (the slice-level ADR)
    - aspect: migrations
      value: "expand-contract, reversible"
      grounds:
        - source_type: kb
          source: "architecture/modular-monolith"
          material: true
          decision: "<decision-id>"
    - aspect: platform                    # REQUIRED (#435): the hyperscaler/service pick
      value: "GCP — Cloud Run + Cloud SQL"
      grounds:
        - source_type: kb
          source: "technology/gcp-modular-monolith-runtime"
          material: true
          decision: "<decision-id>"
    - aspect: cost_model                  # REQUIRED (#435): what drives the spend
      value: "always-on DB + per-request compute; flat at team scale"
      grounds:
        - source_type: kb                 # or proposal — raise a cost-pattern gap if uncovered
          source: "technology/gcp-modular-monolith-runtime"
    - aspect: simulation                  # REQUIRED (#435): the load assumptions
      value: "seed/pilot/expanded from hub scope + profile scale"
      grounds:
        - source_type: profile
          source: "product-os/profile.yaml"
  targets:                              # one per architecture component (binds to arch)
    - component: "channel-bff"          # MUST be a real architecture-lens component
      grounds:
        - source_type: kb
          source: "technology/frontend-react-nextjs"
  decisions: ["<decision-id>", ...]
```

## Output — the draft

```
{draft_dir}/
  product-os/<domain>/slices/<slice-id>/
    lens/run.yaml
    decisions/<decision-id>.yaml        # the rollout/migration/environment decision(s)
  proposals/<gap>.yaml                   # any KB-learning-gap proposal (referenced by the manifest)
  run-manifest.yaml
```

## Boundaries

### NEVER
- Read or reference the **measure** lens's content — /run reads the hub + the architecture
  lens + the optional lens trinity (quality, ux, agentic — decision 23) + the KB. (Reading the
  architecture lens is required, not forbidden — run deploys
  its parts; the measure lens is presence-only, via /run's lines-up gate.)
- Write the slice record, a functionality's ICE, the profile, another lens, or other slices —
  draft only this slice's run lens (+ the decisions). The slice `status` stamp is /run's job,
  after lines-up — never the skill's.
- Invent an operational choice — every rollout/migration/environment/cicd/runtime choice traces
  to a matched KB learning or a recorded proposal.
- Leave an architecture component with no run target, or point a target at a component the
  architecture lens does not declare.
- Smear architecture, ux, quality, agentic, or measure content into the run lens. Keep `content`
  to the seven keys environments/rollout/migrations/config_secrets/cicd/targets/tco.
- Ship a `tco` that is generic prose — no hyperscaler selected, a component without a concrete
  service, fewer than three simulation scenarios, or a monthly range with no numbers. A
  directional range with stated assumptions and a confidence level is the floor.
- Over-specify — no literal pipeline YAML, no per-resource sizing, no environment-by-environment
  secret values. Operational shape only.

### ALWAYS
- Ground every operational choice (in a KB learning on the architecture/technology shelf or a
  recorded proposal) and every target in the manifest.
- Give every architecture component a target; bind every target to a real architecture
  component.
- Record material choices (rollout strategy, migration strategy, environment topology, and the
  hyperscaler/service-platform pick) as decisions that resolve.
- Ground the `platform`, `cost_model`, and `simulation` choices in the manifest — a cost model
  the KB does not cover becomes a KB-learning-gap proposal for the cost pattern.
- Return the draft paths, not the contents.
