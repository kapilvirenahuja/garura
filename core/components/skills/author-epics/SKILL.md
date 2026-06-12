---
name: author-epics
description: Draft /grill's epic cut for one REALIZED slice — the user-testable delivery increments the delivery pipeline picks up. Reads the slice's hub (its functionalities' ICE + the profile) AND all six lenses (quality, ux, agentic, architecture, measure, run — the solved design), then cuts epics by the user-testability grain — when an epic is delivered, a user can open the product, do something, and see it work — each self-contained (context + acceptance + the one-line user_check), referencing the slice's functionalities, never copying ICE or lens content. Orders the cut (explicit acyclic dependencies; the first epic stands alone) and records explicit deferrals for any slice functionality not cut this run. Also applies revision directives from /grill's grilling rounds to an existing draft. Writes a draft only (epics + deferrals in STM), never the live model. The generative work for the /grill play.
version: 0.1.0
user-invocable: false
model: opus
allowed-tools: Read, Write, Bash, Glob
---

# author-epics

Turns one **realized** slice into its **epic cut** — the ordered set of user-testable
delivery increments that `/start` will pick up one at a time. A slice is a vertical product
increment whose design the six realize lenses have already solved; its **hub** is the union
of its functionalities' ICE plus the product profile. The epic is the delivery grain below
the slice, and its rule is single: **when this epic is delivered, a user can open the
product, do something, and see it work.**

An epic may thread one or several of the slice's functionalities; a big functionality may
yield several epics. What an epic may NOT be is internal-only — plumbing, schema setup, an
API with no surface — unless that work rides inside an epic that ends at something a user
can exercise. Cut vertically, not horizontally.

This skill drafts; it never persists. /grill grills the draft (cited push-back, tension
rounds), the human approves, and /grill's apply step writes the model.

## Inputs

| Field | Required | Description |
|-------|----------|-------------|
| `slice_ref` | yes | The slice, `{domain}/{slice-id}`. |
| `slice_file` | yes | The slice record path (read-only) — its `functionalities` are the set to cover. |
| `functionality_ices` | yes | The resolved ICE file paths for the slice's functionalities (the hub), from the readiness gate. Their goals/constraints/context shape each epic's context and acceptance. |
| `lens_dir` | yes | The slice's lens folder (read-only) — all six lens files (quality, ux, agentic, architecture, measure, run). The solved design the cut must honor. |
| `profile_path` | yes | The product profile (read-only) — the bars the acceptance must respect. |
| `product_base` | yes | The product model root — read-only. |
| `draft_dir` | yes | Output folder under STM for the cut (`epics/` is created inside it). |
| `directives` | no | Path to a revision-directives file from a grilling round. When present, revise the existing draft in `draft_dir` per the directives instead of cutting fresh. |

## Procedure

1. **Read the hub + the six lenses.** Load the slice record (its functionalities and
   outcome), every functionality ICE (goals, constraints, failures, context, outcomes), the
   profile (its bars), and all six lens files. /grill is the reconciliation point — unlike a
   realize lens, this skill reads everything the slice declared.

2. **Cut by user-testability.** Walk the slice outcome and the functionality goals and ask:
   what is the smallest increment that ends at something a user can open, do, and verify?
   Each such increment is an epic. Thread whatever functionalities it needs
   (`functionality_refs`); pull the necessary internal work (migrations from the run lens,
   components from the architecture lens, gates from the quality lens) INTO the epic that
   surfaces it — never out as a standalone internal epic.

3. **Make each epic self-contained.** Fill the v2 epic schema: `id` (`e-<n>-<slug>`),
   `slice_ref`, `title`, `outcome` (one line, end-to-end), **`user_check`** (the one-line
   open/do/verify a user performs — concrete and distinct per epic, never boilerplate),
   `context.persona`/`systems`/`scope` (drawn from the hub ICEs' context — listed, not
   copied wholesale: only what bounds THIS increment), `acceptance` (each criterion an
   observable user behavior; quality-lens gates and profile bars surface here as the bar the
   behavior must meet), `depends_on`, `order`, `status: ready`, `issue_ref` unset,
   `metadata.created_by: /grill`.

4. **Reference, never copy.** `functionality_refs` point at the slice's functionalities; the
   ICE and lens content stay where they live. No `ice`, `intent`, `goals`, `expectations`,
   `lens`, or `content` keys in an epic.

5. **Order the cut.** Explicit `depends_on` between epics (within this slice only), acyclic,
   `order` 1..n unique, and the first epic stands alone — independently deliverable on a
   fresh slice.

6. **Defer explicitly.** Any slice functionality not threaded by any epic this run goes into
   `epics/deferrals.yaml` with a recorded reason. Nothing is silently dropped.

7. **On revision rounds** (`directives` present): apply each directive to the existing draft
   — split, merge, re-scope, re-order, rewrite acceptance — keeping every rule above intact,
   and leave the rest of the draft untouched.

## Output — the draft

```
{draft_dir}/
  epics/
    e-1-<slug>.yaml
    e-2-<slug>.yaml
    deferrals.yaml          # always written, even when empty (deferrals: [])
```

## Boundaries

### NEVER
- Write the slice record, a lens, a functionality's ICE, the profile, or anything in the
  live product model — draft only, under `draft_dir`.
- Cut an internal-only epic — every epic ends at a `user_check` a user can actually perform.
- Copy ICE or lens content into an epic — reference it.
- Leave a slice functionality unmapped — every one is threaded by an epic or deferred with a
  reason.
- Mint a dependency on an epic outside this slice, a cycle, or a first epic that depends on
  anything.
- Set any status but `ready`, or any `issue_ref` — delivery owns the lifecycle.

### ALWAYS
- Ground each epic's context and acceptance in the hub ICEs, the lenses, and the profile —
  the cut honors the solved design; it does not redesign.
- Give every epic a concrete, distinct `user_check`.
- Write `deferrals.yaml`, even when empty.
- Return the draft paths, not the contents.
