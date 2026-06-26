# Run Lens Grounding Doc — TEMPLATE & CONTRACT

> Locked contract for a slice's `lens/run.md` — the **non-functional** run lens. It states how
> the slice ships and operates: environments, rollout, migrations, config/secrets, and CI/CD.
> The linter enforces the heading set; the content-quality eval scores it against
> `_content-standard.md`. Written by `/run` — the play that also stamps the slice `realized` once
> all the lenses line up.

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

- **Environments** — where the slice runs (local / dev / stage / prod) and what each needs.
- **Rollout** — how it goes live, and how it's rolled back if needed.
- **Migrations** — any data or schema moves the slice requires, or "none" with the reason.
- **Config & secrets** — the config it needs and how secrets are handled, or "none — no
  credentials" with the reason.
- **CI/CD** — how it's built, tested, and shipped automatically; what the build gates on.

## Gold example

```markdown
# Run Lens

## Environments
One environment for this slice: a developer laptop. It runs the local read API and the browser
view against fixture files — no cloud, no staging, no production yet — because the MVP bet is to
prove the model locally before taking on real infrastructure.

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
