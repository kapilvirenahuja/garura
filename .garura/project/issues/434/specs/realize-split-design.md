# Realize split into five lens plays — design (locked 2026-06-09)

Issue: #434. Supersedes the single `/realize` play in `realignment-plan.md` (E6).

## UPDATE 2026-06-09 — the SLICE is the unit of realization (supersedes "per capability")

The realize lenses run on **one slice per run**, NOT one capability. The slice (from
/shape) is the vertical product increment — the thing you actually deliver. You pick a
slice and run quality → ux → agentic → arch → run on it, then ship it; you don't realize
every slice first. A slice has no ICE of its own — its **hub** is the union of its
functionalities' ICE (each `functionalities[].ice_ref`, which may span several capabilities)
plus the profile. The lenses are stored ON the slice:
`{domain}/slices/{slice-id}/lens/{type}.yaml` (+ `decisions/`), beside the flat slice
record. The shared lens envelope key is `slice_ref`. Readiness = the slice exists (shaped)
and every functionality ICE resolves + is rich; an unresolved ice_ref fails loud.
Everywhere below that says "capability", read "slice".

## Why

`/realize` is jargon — nobody can guess what it does. Replace it with five named
plays people can find and understand, one per lens. The five lenses are unchanged
(UX, Architecture, Run, Quality, Agentic); only the surface changes.

## The five plays

- `/quality` — the gates the capability must pass.
- `/ux` — screens, states, flows, accessibility, design system.
- `/agentic` — the three weights (cognitive/creative/logistical) + bounds.
- `/arch` — the parts (components) the capability threads, the contracts, the stack.
- `/run` — environments, rollout, migrations, config, CI/CD. (Lens name stays
  `run`; command is `/run`, not `/deploy` — run is broader than deploy.)

## Hub, not pipe — but run in a fixed order

The capability's ICE (the what) + the profile box (the limits) is the hub; every
lens reads it. The lenses connect by pointing at the same parts: `/arch` defines
the components, and the lenses that need them reference those component ids.

Even though it's a hub, the plays run in a **fixed sequence**, because the order
rewards us:

    quality -> ux -> agentic -> arch -> run

- **quality first** — the quality bar tells us how deep to go in every other lens.
  Until we know the bar, we can't size the rest.
- **ux, agentic** next — describe what the user should feel and how it should
  behave; both come from the ICE, not from internal parts.
- **arch** — designs the actual parts to deliver the quality bar + ux + agentic
  already decided. Arch is the integrator, reading the three before it.
- **run** last — you ship what's been designed; run reads arch.

So the cross-references run: quality/ux/agentic describe needs against the ICE;
arch defines parts to meet those needs and ties back; run targets arch's parts.

## The "done" stamp — on the entity itself, no new state machine

- A **lens is done** when its file is written and valid. Its presence is the
  marker — no per-lens status field.
- The **capability is done** when all five lens files exist and line up (every
  cross-reference resolves; every profile target has a quality gate; every part has
  a run target). At that point the capability node carries one done stamp.
- That capability stamp is the only new marker. It is what `/grill` checks before
  it cuts delivery work — same way `/shape` needs the profile firmed first.
- The "everything lines up" check runs when the last lens (`run`) completes; it
  sets the capability stamp.

## Build order

Build the plays in sequence order, starting with `/quality`. Each is a play via
play-creator: position `none` (model-building), **one slice per run**, reads the slice's
hub (its functionalities' ICE + profile), writes its one lens to the slice, marks it done.
`/run` (last) also runs the lines-up check and stamps the slice done.

Build status (2026-06-09): /quality, /ux, /agentic built AND slice-scoped (lint + apply
round-trip green; slice record untouched). /arch, /run pending — they inherit the slice
model from the start.
