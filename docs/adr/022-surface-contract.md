# ADR 022 — Surface Contract: Declared at Cut, Enforced Downstream

**Status:** Accepted
**Date:** 2026-06-24
**Related:** ADR 019 (epics kept as as-delivered record), #434 (ProductOS command
model), `schemas/product-os/epic.yaml`, the execute pipeline
(`/grill` → `/implement` → `/validate` → `/launch`) and `/next`

## Context

A slice that promises an openable product — a web dashboard, a server API, a
reference page — was able to pass through `/implement`, `/validate`, and `/launch`
and be stamped `delivered` without the user ever being able to open it. The
pipeline accepted a lower-level local Python service and unit tests in place of the
promised user-facing surface, and every later epic in the slice inherited the
downgrade and kept building service contracts instead of restoring the vertical.

Verified at the framework level: the epic schema records the promised surface only
as **prose** — inside `user_check` ("open X, do Y, verify Z"), `acceptance`, and a
loose `context.systems` list. There is no machine-checkable fact that says "this
epic delivers a web dashboard."

That single gap explains all three failures, and they are the same failure:

- `/implement` reads the prose and generates a build spec. Nothing stops it
  interpreting "dashboard" down to "a local service is fine for now" when no app
  exists yet.
- `/validate` has no declared surface to measure against, so it scopes its checks
  to whatever files `/implement` produced — and "no browser probes" silently
  overrides a browser promise.
- `/launch` has no declared target shape, so any address marked reachable passes —
  a local command satisfies "open dashboard," and a unit-test scenario satisfies
  "open the Formula reference."

The plays did not fail independently. They all failed because there is nothing
**declared** to enforce.

## Decision

**The surface an epic promises is a declared, structured contract on the epic. It
is set once, when the epic is cut, and every downstream gate checks against it. It
is never re-derived from prose.**

### 1. The surface lives on the epic, as structure

The epic schema gains a `surface` block:

- `type` — one of a fixed taxonomy:
  - `web_dashboard` — openable in a browser (user-facing)
  - `server_api` — an HTTP/API endpoint (user/integration-facing)
  - `cli` — a command-line entry point (user-facing)
  - `library` — importable code, no run surface (non-user-facing)
  - `service_read_model` — an internal service / read model, no user surface
    (non-user-facing — the exact thing the bug silently substituted)
- `human_run_target` — how a human reaches it: the URL/endpoint shape for
  dashboard/api, the command for cli, n/a for library/service_read_model.
- `must_open` — the concrete user-reachable artifacts the epic promises (e.g.
  "Team data coverage dashboard", "Formula reference page", "Trust label guide").
  This is the list `/validate` and `/launch` check coverage against.

`surface` is **required** on every epic. An epic that genuinely ships no user
surface declares `library` or `service_read_model` explicitly — the contract is
never absent.

### 2. Declared at cut, never derived

`/grill` declares the surface when it cuts the epic, from the slice's intent and
`user_check`, as an explicit decision. Downstream plays **read** the declared
field; they never re-interpret the prose. Re-deriving the surface downstream is
exactly the inference that caused the bug — `/implement` already "derived" the
surface and got it wrong; letting `/validate` or `/launch` re-derive it just lets
them get it wrong the same way and disagree about what the epic even promised. A
declared structured field is deterministically checkable; a derived one re-opens
the hole.

### 3. One shared standard, referenced by every gate

The mapping from a surface `type` to the runnable evidence it requires (a browser
check for `web_dashboard`, an HTTP check for `server_api`, a command run for `cli`,
nothing for `library`) and to the deploy-target shapes that satisfy it lives in one
**surface-contract standard**. Every gate references it rather than hand-rolling
its own notion of "what counts as the surface running." This is the converge-and-
lint pattern: one source of truth, lint keeps the plays aligned.

### 4. The gates

Each gate is the same question — "does the real surface match the declared
`type`?" — asked at a different stage:

- **`/grill`** declares the surface; and the **first** epic of a slice whose surface
  is `web_dashboard`/`server_api` must scaffold the app/server shell, or the epic is
  recut. A vertical with no shell for later epics to attach to is the seed of the
  downgrade.
- **`/implement`** gates the generated build spec: if the spec's surface is lower
  than the epic's declared `type` (e.g. `service_read_model` for a `web_dashboard`
  epic), it halts for explicit human approval of a recut — it cannot silently
  downgrade.
- **`/validate`** requires the runnable check the standard maps to `type`. A
  required surface that was not measured is `fix_required`, not `validated`.
  "No browser probes" cannot override a browser promise.
- **`/launch`** validates the deploy record semantically: a local command satisfies
  only `cli`; `web_dashboard`/`server_api` need a real URL/preview/endpoint. Scenario
  coverage must preserve the user verb — "open" cannot be covered by "run unit
  test." It rejects before asking for human acceptance.
- **`/next`** treats a delivered epic that missed its required surface as **surface
  debt** and refuses to recommend the next execute epic in that slice — the surface
  repair takes priority.

### Scope

This is the framework fix: the epic schema, the surface-contract standard, and the
five plays. The **product remediation** — inserting a corrective dashboard/server
epic into the token-data-spine chain so the first honest end-to-end experience is
restored — is separate work in the token-burn-dash Codex project, out of scope here.

## Consequences

### Positive

- A web/API promise can no longer be silently delivered as a local service — the
  downgrade is blocked at `/implement`, unmeasured surface fails `/validate`, a
  non-matching deploy fails `/launch`, and surface debt blocks `/next`.
- The surface is one declared fact, checked deterministically — no play re-infers
  it, so no two plays can disagree about what was promised.
- One standard, not five hand-rolled checks; lint keeps them aligned.

### Negative / Risks

- **Existing epics predate the field.** Epics already cut have no `surface`.
  Mitigation: treat a missing `surface` as an explicit "unknown" that `/implement`
  must resolve (declare it) before building, rather than defaulting it — a silent
  default would re-create the bug.
- **`/grill` must judge the surface at cut.** A wrong declaration propagates.
  Mitigation: it is an explicit, surfaced decision the human sees at the cut, not a
  buried inference, and `/implement`'s gate is the backstop.
- **Five plays change.** Large, staged: schema and standard first, then the gates
  one play at a time, each verified.

## Alternatives Considered

| Alternative | Reason Rejected |
|-------------|-----------------|
| Derive the surface downstream from `user_check`/`acceptance` prose | That re-interpretation is the bug. Two plays deriving independently can disagree; one of them already derived it wrong. The surface must be declared once, not inferred repeatedly. |
| A single gate (only at `/launch`) | Too late — by `/launch` the wrong thing is already built and validated. The downgrade has to be blocked where it happens (`/implement`) and the surface measured where it is testable (`/validate`). |
| Per-play definitions of "the surface is running" | Drifts, exactly like the status handling did before its standard. One shared standard + lint. |
| Leave it as prose and rely on reviewer judgment | This bug is the evidence that prose-plus-judgment fails silently across three plays. |

## References

- Issue #442 — pipeline downgrades a vertical slice's user surface to a local
  service without catching it
- `core/components/memory/standards/schemas/product-os/epic.yaml` — gains the
  `surface` block
- `core/components/memory/standards/rules/` — the new surface-contract standard
- `core/components/plays/{grill,implement,validate,launch,next}/` — the gates
- ADR 019 — epics are kept as the as-delivered record (the surface is part of that
  record)
