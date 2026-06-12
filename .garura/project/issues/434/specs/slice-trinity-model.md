# The Slice Trinity Model — the spine

Recorded 2026-06-11 from Kapil's framing (#434). This is the conceptual spine of the
whole command model — the model a CMO-facing visual will be built from. It refines
realignment-plan decision 19 (lens set is six) and becomes decisions 23 + 24 there.

## The full taxonomy (locked 2026-06-11, later session — Kapil's names)

| Group | Plays | Works on | Outputs / job |
|-------|-------|----------|---------------|
| **strategy** | vision → understand → shape → roadmap | the Hub | outputs slices |
| **lens** | quality → ux → agentic | a slice | what the slice should be |
| **foundation** | arch → measure → run | a slice | makes the lens real; the engine |
| **grill** | grill (alone) | a slice | ensures nothing is missed — relentlessly interviews until it has ALL the information about the slice |
| **execute** | implement → validate → launch | a slice, via EPICS as the working unit | builds and lands it |
| **alignment** | capture → learn → reconcile | slices (and the Hub) | updates slice + Hub so they align to what's implemented |
| **orchestration** | the *-change plays (start/commit/propose/review/merge) | git/host | applies AUTOMATICALLY to every group |

Each of strategy, lens, foundation, execute, alignment has a **start and an end**, and
orchestration wraps them automatically (the D2 position rule). Grill stands alone
between foundation and execute. This SPLITS the former single slice pipeline (quality →
… → grill as one branch) into two pipelines plus a standalone closer; pipelines still
hand off through main.

## The Hub — strategy is the everything

Strategy is the whole thing: what we build, why, which business KPIs we drive and why.
The vision → understand → shape → roadmap story IS the Hub. Everything else in the
model exists to serve it.

> Naming note: the lens plays today use "hub" for something smaller — the slice record
> plus the functionality ICE records it resolves (`check_ready_slice.py`). That is the
> **slice hub**: the slice's window onto the Hub. The Hub proper is the product-level
> strategy. Both terms stay; "Hub" unqualified means the strategy whole.

## Slices — frames cut from the Hub

We cut slices we want to focus on. Each slice is a unit that individually drives the
same business KPIs the Hub declares — each can move the needle on its own. A slice can
impact the Hub overall, but it sits in its own frame. Everything below runs **on a
slice, never on the whole product shape**.

## 3 — 3 — 1: the two trinities and the closer

The seven slice plays are not a flat sequence of seven. They are three primes:

**The lens trinity — quality, ux, agentic** (group name: **lens**; earlier alias:
"attribute trinity").
These are the lenses that modify how we look at the Hub — the attributes that enhance
the strategy on top of it, in terms of what we want to achieve. They answer: *what
should this slice be like?*

**The foundation trinity — architecture, measure, run** (group name: **foundation**;
earlier alias: "engine trinity").
This is what makes the attribute lenses possible. The engine takes the slice hub,
understands the three attribute lenses, and applies execution to make it work. It
answers: *what makes it real, how do we prove the team is benefiting, and how does it
ship and operate?* This is the trinity that actually holds everything together.

**Grill — the closer, a prime of one.**
Grill sits outside both trinities, between foundation and execute. When both are
defined, it makes sure nothing got missed — it relentlessly interviews until it has
all the information about the slice — fixes the slices into user-testable epics, and
feeds back up, eventually updating the shape of the product and the roadmap.

Play order through a slice is unchanged: quality → ux → agentic → arch → measure →
run → grill. What changed (taxonomy decision, 2026-06-11 later session): lens and
foundation are now SEPARATE pipelines, each with its own start and end (orchestration
wraps each automatically); grill stands alone. The former single seven-play slice
branch becomes lens-branch → main → foundation-branch → main → grill → main.
Grill's position is CONFIRMED (Kapil, 2026-06-11): self-contained — position both,
opening and closing its own branch like fix-bug — still working on the slice, and
still the slice's end conceptually: nothing about a slice is finished until grill is.

**Read rules across the pipeline split:** the foundation lenses still read the slice
hub + all three lens files — the split moves the handoff through main (the lens
trinity's files are merged and durable by the time foundation starts), it does not
re-isolate them. Same for grill: it reads everything, all of it now on main.

## The stability principle

You can change the attribute lenses freely; the engine may never change. And when the
engine DOES change, it impacts the lenses — never silently. When a slice starts
dipping, it is the attribute lenses that need to change — UX has to change something,
agentic has to be added, quality is tipping. The architecture, measure, and run
usually need no change: they are just running the engine.

This is why the engine trinity is the load-bearing one: lens churn is normal life;
engine churn is an event.

## Read rules (derived from the trinity principle)

- **Lens-trinity plays** read the slice hub only. They stay blind to each other
  (isolation as today).
- **Foundation lenses** read the slice hub **plus all three lens-trinity files** — that is
  their job: understand the attributes, then execute them. (This overturns the
  earlier hub-only call for measure, and it means arch and run's current isolation
  rules — arch reads no other lens; run reads arch only — must be widened ICE-first
  when measure is built.)
- Engine-internal reads stay as currently defined (run reads arch). Whether measure
  reads arch gets decided at schema design — nothing in the principle forces it.
- **Grill** reads everything; it is the completeness check.

## measure inside the engine

measure is the engine's proof duty: call out the benefits the team is getting while
delivering this slice — which delivery metrics (DORA, Flow, SPACE, DX) we are
improving or want to improve. That requires a **baseline**, a **target**, and then
**proving the improvement** — the proof lands in the feedback pipeline, where /capture
harvests exactly the KPIs measure declared.

## The signal loop (future — analytics, end of this phase)

Not built yet; goes at the END of this phase (standing reminder). There has to be a
business measurement to the Hub: the Hub sends a signal that a slice is dipping,
moving out, drifting. That signal triggers a slice revisit — and per the stability
principle, the revisit lands on the attribute lenses first; the engine usually stands.
Hub → slice → two trinities → grill, with analytics closing the loop from the top.

(Product-outcome measurement stays a STRATEGY concern — decision 19's boundary holds.
The measure lens remains delivery-pipe only; analytics is the Hub-level business
measurement, a separate future piece.)
