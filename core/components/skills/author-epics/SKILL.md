---
name: author-epics
description: Draft /grill's epic cut for one REALIZED slice — the user-testable delivery increments the delivery pipeline picks up. Reads the slice's hub from the spine (its functionalities' grounding docs `functionality.md` + the spine profile) AND all SEVEN lens grounding docs (quality, ux, agentic, marketing, architecture, run, measure — the solved design), then cuts epics by the user-testability grain — when an epic is delivered, a user can open the product, do something, and see it work. For EACH epic it drafts a spine `epics` index entry PLUS a rich `epic.md` grounding doc, referencing the slice's functionalities by spine id, never copying functionality or lens content. Orders the cut (explicit acyclic dependencies; the first epic stands alone) and records explicit deferrals for any slice functionality not cut this run. Also applies revision directives from /grill's grilling rounds to an existing draft. Writes a draft only (in STM), never the live model. The generative work for the /grill play.
version: 0.2.0
user-invocable: false
model: opus
allowed-tools: Read, Write, Bash, Glob
---

# author-epics

Turns one **realized** slice into its **epic cut** — the ordered set of user-testable
delivery increments that `/start` will pick up one at a time. A slice is a vertical product
increment whose design the seven realize lenses have already solved; its **hub** is the
union of its functionalities' grounding docs (`functionality.md`) plus the product profile
(read from the spine). The epic is the delivery grain below the slice, and its rule is
single: **when this epic is delivered, a user can open the product, do something, and see
it work.**

An epic may thread one or several of the slice's functionalities; a big functionality may
yield several epics. What an epic may NOT be is internal-only — plumbing, schema setup, an
API with no surface — unless that work rides inside an epic that ends at something a user
can exercise. Cut vertically, not horizontally.

Each epic is **two artifacts**: a structured **spine `epics` entry** (the machine index the
delivery pipeline reads) and a rich **`epic.md` grounding doc** (the human-readable cut a
builder picks up). This skill drafts both; it never persists. /grill grills the draft (cited
push-back, tension rounds), the human approves, and /grill's apply step writes the model.

## Inputs

| Field | Required | Description |
|-------|----------|-------------|
| `slice_ref` | yes | The slice, `{domain}/{slice-id}`. |
| `slice_file` | yes | The slice record path (read-only) — its `functionalities` are the set to cover. |
| `functionality_groundings` | yes | The resolved `functionality.md` grounding-doc paths for the slice's functionalities (the hub), from the readiness gate, each with its spine `functionality_ref`. Their intent/rules/acceptance shape each epic's context and acceptance. |
| `lens_dir` | yes | The slice's lens folder (read-only) — all SEVEN lens grounding docs (`quality.md`, `ux.md`, `agentic.md`, `marketing.md`, `architecture.md`, `run.md`, `measure.md`). The solved design the cut must honor. |
| `spine` | yes | The live `_spine.yaml` (read-only) — the profile (the bars acceptance must respect) and the functionality entries the `functionality_ref`s resolve against. |
| `product_base` | yes | The product model root — read-only. |
| `draft_dir` | yes | Output folder under STM for the draft cut. |
| `directives` | no | Path to a revision-directives file from a grilling round. When present, revise the existing draft in `draft_dir` per the directives instead of cutting fresh. |

## Procedure

1. **Read the hub + the seven lenses.** Load the slice record (its functionalities and
   outcome), every functionality's `functionality.md` (what it does, rules & behavior,
   acceptance criteria), the spine profile (its bars), and all seven lens `.md` docs. /grill
   is the reconciliation point — unlike a realize lens, this skill reads everything the slice
   declared.

2. **Cut by user-testability.** Walk the slice outcome and the functionalities and ask: what
   is the smallest increment that ends at something a user can open, do, and verify? Each
   such increment is an epic. Thread whatever functionalities it needs (by spine
   `functionality_ref`); pull the necessary internal work (migrations from `run.md`,
   components from `architecture.md`, gates from `quality.md`, the surface from `ux.md`) INTO
   the epic that surfaces it — never out as a standalone internal epic.

3. **Draft each epic's `epic.md` grounding doc.** Conform to the epic template
   (`standards/schemas/product-os/grounding/epic.md`) — H1 `# Epic: <title>` and the sections
   `Intent (goals)`, `Constraints`, `Failures`, `Expectations / success`, `Context (persona /
   systems / scope)`, `Outcome`, `User check` (the one-line open/do/verify, concrete and
   distinct per epic), `Surface`, `Delivers — functionalities (linked)` (the slice
   functionalities this epic delivers, by spine id), and `Acceptance criteria` (each a
   Given/When/Then observable behavior; quality-lens gates and profile bars surface here as
   the bar the behavior must meet). Self-explaining prose per the content standard — the play
   runs the linter and the judge over every `epic.md`.

4. **Draft each epic's spine entry.** In the draft spine delta's `epics` list: `id`
   (`e-<n>-<slug>` or a stable id), `slug`, `slice_ref`, `status: ready`, `order`,
   `functionality_refs` (the spine functionality ids it delivers), `surface_type` (from the
   slice/ux surface — web_dashboard | server_api | cli | library | service_read_model),
   `surface_verified: false`, `issue_ref: null`, and `doc` (the pointer to its `epic.md`).

5. **Reference, never copy.** `functionality_refs` and `Delivers` point at the slice's
   functionalities by spine id; the functionality and lens content stay where they live. No
   functionality body, ICE, or lens content is pasted into an epic.

6. **Order the cut.** Explicit `depends_on` between epics (within this slice only), acyclic,
   `order` 1..n unique, and the first epic stands alone — independently deliverable.

7. **Defer explicitly.** Any slice functionality not threaded by any epic this run goes into
   `epics/deferrals.yaml` with a recorded reason. Nothing is silently dropped.

8. **On revision rounds** (`directives` present): apply each directive to the existing draft
   — split, merge, re-scope, re-order, rewrite acceptance — keeping every rule above intact,
   and leave the rest of the draft untouched.

## Output — the draft

```
{draft_dir}/
  product-os/
    _spine.yaml                                   # draft epics DELTA (the `epics` index entries)
    {domain}/slices/{slice-id}/epics/
      {epic-slug}.md                              # rich epic grounding doc (epic template)
      deferrals.yaml                              # always written, even when empty (deferrals: [])
  epics-manifest.yaml                             # the epic ids + their functionality coverage + grounding
```

Return the draft paths, not the contents.

## Boundaries

### NEVER
- Write the slice record, a lens, a functionality's grounding, the profile, or anything in
  the live product model — draft only, under `draft_dir`.
- Cut an internal-only epic — every epic ends at a `User check` a user can actually perform.
- Copy functionality or lens content into an epic — reference functionalities by spine id.
- Leave a slice functionality unmapped — every one is delivered by an epic or deferred with a
  reason.
- Mint a dependency on an epic outside this slice, a cycle, or a first epic that depends on
  anything.
- Set any status but `ready`, or any `issue_ref` — delivery owns the lifecycle.

### ALWAYS
- Ground each epic's context and acceptance in the functionality groundings, the seven
  lenses, and the profile — the cut honors the solved design; it does not redesign.
- Give every epic a concrete, distinct `User check`.
- Make every `epic.md` clear the content standard (it is linted and judged).
- Write `deferrals.yaml`, even when empty.
- Return the draft paths, not the contents.
