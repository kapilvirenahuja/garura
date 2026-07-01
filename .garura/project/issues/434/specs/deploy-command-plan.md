# /deploy command — plan (BUILT)

Issue: #434 (Realign Garura to the ProductOS Command Model)
Status: **BUILT 2026-07-01 (uncommitted on branch refactor/434-realign-to-productos-command-model).**
Both pieces landed and lint clean. Originally captured as a deferred plan (2026-06-30); the
user reversed the deferral and it was built. See "Build outcome" at the foot of this doc.

---

## TL;DR

The issue's `/operate` command is **renamed to `/deploy`** and rescoped to a
lightweight, on-demand cloud deploy. It is **not** ongoing operations and **not**
production (yet). It depends on an upgrade to `/run` that does not exist yet, so the
work is **two pieces, in order**: (1) upgrade the run lens, then (2) build `/deploy`.

---

## How we got here (decision trail)

1. **`/operate` was the wrong command.** The issue sketched `/operate` = "handle
   runtime and production concerns." But `/operate` was already *dropped* on
   2026-06-09 with the reason: "Day-to-day running of a live product is not something
   Garura should own as a command." It then reappeared in the 2026-06-30 status as
   "not yet built." That objection only kills the *ongoing-operations* reading
   (monitoring, on-call, incidents). It never applied to a single discrete deploy act.

2. **Renamed `/operate` → `/deploy`** (naming clarity). "Operate" means running the
   live product forever — the thing we said we don't own. "Deploy" names the one
   discrete act we want. No existing `/deploy` collides in the tree.

3. **Scope = Path B, lightweight on-demand deploy.** NOT production for now. Cloud
   target. Defaults to the **lowest defined cloud environment (dev)**; the user may
   name a higher tier. It changes **nothing** in the product model (Maintenance-group
   rule, like `/fix` and `/refactor`).

4. **The analytics→model half stays with `/learn`.** An earlier idea was that
   `/operate` could "read analytics and update ProductOS." That is already `/learn`'s
   job (updates the living model from real delivery outcomes). Don't build a second
   model-writing command (Occam).

5. **Production stays with CD-from-main, for now.** The model deliberately delegates
   staging/prod rollout to CD from main (`/launch`, `/run`, and `env-operator` all say
   "prod is CD's, never ours"). `/deploy` does **not** reverse that yet — it tops out
   below production.

---

## The dependency I found (why this is two pieces)

`/deploy` can only deploy against environments that are already *defined in
machine-readable form*. They are not. Verified findings:

- **The run lens writes prose, not data.** `/run` produces `run.md` (a grounding doc)
  whose "Environments" section is a paragraph (e.g. "one environment: a developer
  laptop…"). Not parseable into a deploy target.
  (`core/components/skills/author-run-lens/SKILL.md` — produces `run.md` + a grounding
  manifest only.)
- **A rich structured schema exists but is DEAD.**
  `core/components/memory/standards/schemas/product-os/lens/run.yaml` defines named
  environments, per-component deploy targets (container/service/function/static/
  managed), cloud provider + region, and the managed service per component. But
  **nothing generates it and nothing persists it** — `apply_run.py` writes only
  `lens/run.md` and `decisions/*.yaml`. The structured artifact is a design document
  that never becomes real.
- **The security/firewall layer was never even designed.** Even the rich `run.yaml`
  schema's `environments` field is just a list of names. No per-environment firewall,
  networking, or security-group definition exists anywhere. The arch lens explicitly
  **excludes** environments ("no screens, gates, metrics, or environments").

Conclusion: the cloud-environment context `/deploy` needs is partly designed, never
generated, and missing the security/networking layer entirely. So the run lens must be
upgraded **before** `/deploy` is built.

---

## Piece 1 — Upgrade `/run` to define environments one at a time

**What changes.** Today `/run` writes the whole run lens for a slice in a single pass,
as prose. After the upgrade:

- `/run` is **per-environment and incremental**. You point it at **one environment per
  call**, and re-run it to add or edit the next.
- The **slice-level operational design is written once** — rollout strategy
  (canary/blue-green), migration approach, CI/CD shape. The **concrete per-environment
  block is built up one environment per call** on top of it. (Chosen over
  "rewrite-everything-per-env" on Occam: one copy of the rollout/migration/CI-CD
  design, not N copies that can drift.)
- Output becomes **machine-readable** per environment: cloud target (provider +
  region), compute/servers, services, networking + **firewalls**, **security**, and
  config/secrets binding. This is the thing `/launch` and `/deploy` read to act.
- **Environment shapes to support now:** a **local** environment (lightweight — what
  `/launch` brings up for human testing) and a **cloud dev** environment (full infra +
  security). Higher cloud tiers (qa/stage/prod) use the **same mechanism** later — not
  built now.

**Dependency chain this creates:**
- `/run` (local) must run before `/launch` works.
- `/run` (cloud dev) must run before `/deploy` works.
- In a typical project you run `/run` twice: local first, then dev.

**Mechanics (this is an intent change to an existing play → `play-editor`, plus
schema/skill/script changes):**
1. `core/components/plays/run/reference/ice.md` — reshape the run ICE (per-env,
   incremental, machine-readable output, slice-design-once). Recompile via
   `play-editor` (never hand-edit the compiled `SKILL.md`).
2. `core/components/memory/standards/schemas/product-os/lens/run.yaml` — extend so it
   carries the per-environment infra + **security/firewall/networking** layer and a
   tier ordering (so "lowest" is well-defined); make it the artifact actually produced.
3. `core/components/memory/standards/schemas/product-os/grounding/lens/run.md` —
   align the grounding template with the structured form.
4. `core/components/skills/author-run-lens/SKILL.md` — emit the structured
   per-environment definition (not just prose `run.md`).
5. `core/components/plays/run/scripts/apply_run.py` — add the structured env
   definition to the persist allowlist (today it only persists `run.md` + decisions).
6. `/launch` + `env-operator` — read the new structured **local** definition (today
   `env-operator` references a `run.yaml` that is never generated, and is scoped to
   "dev/QA tiers" wording — align it to the new local/cloud env model).

**Watch-items / pre-existing inconsistencies to reconcile when reshaping `/run`:**
- Who stamps the slice `realized`? The compiled `/run` SKILL.md says it does NOT —
  "/measure's job." The `run.yaml` schema header comment says `/run` "stamps the slice
  `realized`." These disagree today; settle it during the reshape.
- `env-operator.md` is stale (references an ungenerated `run.yaml`; "dev/QA tiers"
  wording). Refresh it to the new env model.

---

## Piece 2 — Build `/deploy` (new play via `play-creator`)

Build **only after** Piece 1, because `/deploy` reads what Piece 1 produces.

**Shape (for the eventual ICE — not yet drafted):**
- Reads the structured per-environment definitions the upgraded `/run` produced.
- **Defaults to the lowest defined cloud environment (dev).** User may name a higher
  tier. Production is out of scope for now (tops out below prod).
- Deploys the **delivered increment** to that cloud environment per its definition.
- Verifies the increment actually came up (independent health/reachable check — a real
  green, not "the deploy command exited 0").
- Records deploy **evidence** (play-only, config-driven — D1).
- Writes **nothing** to the product model.
- Local is **not** a `/deploy` target — local belongs to `/launch`.

**Likely pipeline position:** `none` (standalone execution). No feature branch, no PR,
no merge — it executes against an already-delivered increment and records evidence.
Confirm during the `play-creator` interview.

**Likely owner agent:** `env-operator` is the natural fit (it owns live environments),
but today it's scoped to dev/QA and is stale — Piece 1 refreshes it. Confirm whether
`/deploy` extends `env-operator`'s reach to the cloud dev tier, or whether a deploy
skill is added.

**Open questions to resolve at build time:**
- Exact default-resolution rule for "lowest cloud env" once more tiers exist.
- Rollback behavior on a failed deploy (does `/deploy` own rollback, or report and
  stop?) — likely driven by the run lens's rollout/rollback definition.
- Secrets handling (never logged/printed/committed) — a hard constraint.

---

## Build order (when resumed)

1. Piece 1 — `/run` upgrade (play-editor + schema + skill + persist + launch/env-operator).
2. Piece 2 — `/deploy` (play-creator), reading Piece 1's output.

Sign-off captured 2026-06-30: structure approved, build deferred.

---

## Build outcome (2026-07-01)

Both pieces built and lint clean (all three plays PASS 0 gaps; fingerprints match their ICE;
all scripts compile). Nothing committed.

**Piece 1 — /run upgraded to per-environment.**
- `lens/run.yaml` schema reshaped: slice-level design once + ordered `environments[]`, each a
  local or cloud definition (cloud carries provider/region/compute/services/networking+firewalls/
  security/deploy_cmd). Fixed the stale header claim that /run stamps `realized` (it is /measure's).
- `grounding/lens/run.md` template: two-artifact split documented + a cloud gold example.
- `author-run-lens` skill: now emits `run.yaml` + `run.md`, one environment per call, preserves
  already-defined environments, writes slice-level design once.
- `apply_run.py`: persists `lens/run.yaml` alongside `run.md`.
- `/run` play recompiled via play-editor from a reshaped ICE (C1–C12, F1–F13, S1–S8, REC1–REC13).
  New scripts: `resolve_target_env.py` (lowest not-yet-defined tier, or named); `validate_run.py`
  extended (run.yaml schema, run.md↔run.yaml consistency, cloud→arch-component mapping, no-secret
  scan); `check_run.py` allowlist now accepts `run.yaml`.

**Piece 2 — /deploy built + env-operator/launch aligned.**
- `plays/deploy/` — new standalone play (position none). Reads the slice's `run.yaml` cloud env,
  defaults to lowest cloud tier (dev), refuses production, deploys per the env definition via
  `env-operator`, proves it healthy independently, records evidence, writes no product model.
  Scripts: `resolve_deploy_target.py` (default dev; prod→refuse; no cloud env→halt),
  `check_deploy.py` (declared-only, no false green, no secret literal, model byte-identical,
  failed⇒prior-state), `preflight.py`.
- `skills/deploy-to-cloud-env/` — new worker: runs the env's `deploy_cmd`, reads secrets from the
  declared manager binding (never prints), independent health probe, writes the deploy record; on
  failure leaves prior state, no auto-rollback.
- `env-operator` agent: now serves both /launch (local, via `stand-up-launch-env`) and /deploy
  (cloud, via `deploy-to-cloud-env`); reads structured `run.yaml`; input contract takes an
  `environment` name; dropped the blanket dev/QA-only rule (production still refused — CD from main).
- `/launch` migrated via play-editor: brings the increment up on the **local** environment from
  `run.yaml` (was "the dev/QA tier" from run.md prose); C2/F5/S1/S5/REC5 restated; `check_ready_launch.py`,
  `check_launch.py`, and the `stand-up-launch-env` skill retargeted to the local environment. HITL
  sign-off, defect/fix loop, and close chain untouched.

**Not done (no live fixture in-repo):** end-to-end run against a real slice. The scripts were
behavior-smoke-tested (resolver defaults, validate flags dangling components / secret literals /
silent env edits, deploy check catches false green + model change).

