---
id: technology/ux-state-and-feedback
title: "Every screen handles its states; every action gives feedback"
conditions:
  surface: web-app-or-site
  stage: any
evolve_when: []
provenance: "seeded (assistant, #434 — accepted by Kapil)"
---

# Every screen handles its states; every action gives feedback

## Topic
The states a screen must account for, and how the UI responds to user actions. A `/ux`
pattern that's about completeness — the states teams forget are exactly the ones users hit.

## Conditions
Any interactive web surface.

## Recommendation
- **Design the full state set for every screen, not just the happy path:**
  **loading** (skeletons over spinners where you can), **empty** (a helpful first-run/zero
  state, not a blank), **error** (plain-language, with a way out), **success**, and partial/
  **stale** where data can lag.
- **Feedback on every action.** No action leaves the user guessing — show progress, confirm
  completion, surface failure.
- **Optimistic updates** for cheap, reversible actions (reflect the change immediately, roll
  back on failure); **pessimistic** (wait + confirm) for consequential or irreversible ones.
- **Toasts vs inline:** transient confirmations as toasts; validation and contextual errors
  **inline** next to the thing they're about — never bury a field error in a toast.
- **Confirm before destructive or irreversible actions**, and make the confirm specific
  ("Delete 3 invoices?") — not a generic "Are you sure?".

## Rationale
The empty/loading/error states are where real products feel broken — a blank screen reads as
a bug, an unhandled error dead-ends the user, a missing loading state looks frozen. Teams
ship the happy path and discover the rest in support tickets. Making the state set explicit
per screen turns "handle errors" into a checklist the design and build both work against.
Optimistic-where-safe / pessimistic-where-not, and inline-vs-toast, are the two rules that
keep feedback fast without being misleading.

## Evolve when
A screen's data or actions get more complex (real-time updates, multi-step async, offline)
→ extend the state set (connecting/reconnecting, conflict, queued) rather than leaving the
new states unhandled.

## Provenance
seeded (assistant, #434 — accepted by Kapil).
