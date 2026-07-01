# Run Lens Grounding Doc — TEMPLATE & CONTRACT

> Locked contract for a slice's `lens/run.md` — the **non-functional** run lens. It states how
> the slice ships and operates: environments, rollout, migrations, config/secrets, and CI/CD.
> The linter enforces the heading set; the content-quality eval scores it against
> `_content-standard.md`.
>
> **Two artifacts, one lens (#434).** This `run.md` is the NARRATIVE — the *why* behind the
> operational choices, for a human to read. Beside it, `/run` also writes the structured
> `lens/run.yaml` (per `standards/schemas/product-os/lens/run.yaml`) — the MACHINE-READABLE
> facts the delivery plays execute against (`/launch` reads the local environment; `/deploy`
> reads a cloud environment). The narrative explains the choices; the yaml carries the exact
> providers, regions, firewalls, secrets bindings, and deploy commands. Keep the two in step.
>
> **Environments are built one at a time (#434).** The slice-level design (rollout, migrations,
> CI/CD) is written once; each environment is added or edited by re-running `/run` for that one
> environment. The narrative below grows an entry per environment as they are built.

## Heading contract (required, in order)

```
# Run Lens
## Environments
## Rollout
## Migrations
## Config & secrets
## CI/CD
```

## Per-section guidance

- **Environments** — one entry per environment defined so far, in tier order (local, then dev,
  then higher). For each: what it is for and why it is shaped this way. A **local** environment
  is the lightweight bring-up `/launch` uses for human testing. A **cloud** environment carries
  real infrastructure — provider and region, the compute each component runs on, managed
  services, networking and firewalls, and security (identity, secrets, controls); the exact
  values live in `run.yaml`, the narrative explains the choices. Higher cloud tiers (qa, stage,
  prod) are added later by re-running `/run`.
- **Rollout** — how it goes live, and how it's rolled back if needed.
- **Migrations** — any data or schema moves the slice requires, or "none" with the reason.
- **Config & secrets** — the config it needs and how secrets are handled, or "none — no
  credentials" with the reason.
- **CI/CD** — how it's built, tested, and shipped automatically; what the build gates on.

## Gold example

```markdown
# Run Lens

## Environments
Two environments defined so far, in tier order.

**local (tier 0).** A developer laptop — the bring-up `/launch` uses for human testing. It runs
the read API and the browser view against fixture files, started with one compose command. No
cloud, no secrets; fixtures stand in for real sources.

**dev (tier 1, cloud).** The first cloud environment, and `/deploy`'s default target. It runs on
Google Cloud (region `europe-west1`): the read API on Cloud Run, the browser view served as a
static bundle, both behind an internal load balancer. No public ingress yet — a firewall rule
allows the team VPN only. Identity is a least-privilege service account; the one config value
(the source bucket) is bound from Secret Manager, never in the repo. The exact values are in
`run.yaml`; this narrative says why: dev is deliberately locked down and cheap because it exists
to prove the cloud path, not to serve users.

## Rollout
"Rollout" is running the local demo: start the API, open the view, load fixtures. Rollback is
trivial — stop the process; nothing is deployed or persisted beyond the local fixture files.

## Migrations
None. The slice reads fixtures and computes in memory; there is no database and no stored
historical state to migrate at this stage.

## Config & secrets
No secrets — the slice uses no live provider credentials by design (fixtures stand in for real
sources). Config is a single fixture-directory path.

## CI/CD
CI runs the privacy, coverage, and timing fixtures on every change and fails the build on any
leak, any blank coverage cell, or a p95 over budget. There is no deploy step — the shipped
artifact is the local app a developer runs.
```
