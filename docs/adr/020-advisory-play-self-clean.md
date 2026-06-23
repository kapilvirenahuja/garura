# ADR 020 — Advisory, Position-None Plays Self-Clean Their Working Files

**Status:** Accepted
**Date:** 2026-06-23
**Related:** ADR 017 (folder whitelist), #434 (project-side `status/` declared machine-local and gitignored)

## Context

`/next` recommends what to do next on the product. It is advisory only — it reads
the product model, prints one next-best-action plus a ranked list, and is
forbidden (C2) from modifying the model, creating work items, or launching another
play. It also sits at **pipeline position none**: it is neither the start of a
change nor the end, so it never participates in the commit pipeline
(`start-change → … → commit-change → merge-change`).

While it runs it writes nine working files into `.garura/product/_status/next/` —
the before/after model snapshots, the before/after candidate sets, the operator
profile, the two captured git reads, and the two recommendation artifacts. Because
`/next` never commits and is not in any pipeline that commits, those files have no
owner. They land in a git-tracked area (only the *project-side* `status/` folder
was gitignored under #434; the *product-side* `_status/` never got the matching
rule) and sit there as uncommitted changes.

Two problems follow:

- **Orphaned.** Nothing commits them and nothing is supposed to. They accumulate
  as perpetual working-tree noise.
- **Stale, which is worse.** `/next` never resumes — every run is a fresh
  derivation that overwrites the folder. The instant anyone runs another play
  (e.g. `/implement`), the leftover `recommendations.md` describes a world that no
  longer exists. A stale recommendation file on disk reads like a current answer
  when it is wrong.

The working files have **no reader after the run**. `/next`'s verify step re-reads
them mid-run, and its present step prints the recommendation to the user — that
printed recommendation is the deliverable. Once presented, the files are spent.
`/next` is verified read-only against the product model (its scanner opens model
files read-only and a before/after tree hash guards against any mutation), so the
working files are pure derivation scratch with zero durable value.

## Decision

**An advisory, position-none play leaves no working files behind. After it has
verified and presented its recommendation, it deletes its working folder.**

Scoped to `/next` in this ADR:

1. **Intent (ICE).** A new constraint and failure condition are added to
   `core/components/plays/next/reference/ice.md`:
   - **C10** — the play leaves no working artifacts behind; its only durable
     product is the recommendation presented to the user (plus, when evidence
     recording is on, the evidence record). All transient working files written
     during the run are deleted once the recommendation has been verified and
     presented.
   - **F7** — working files survive the run, lingering on disk as a stale
     recommendation after the model moves on.
   - **REC7 (F7)** — trigger: working files remain after the run completes.
     direction: delete the working folder; the already-presented recommendation is
     the only product. handoff: autonomous.

2. **Compiled play.** The play is recompiled from its ICE via play-editor. The
   cleanup is the **final action at close** — strictly after the verify step (which
   re-reads the snapshots to prove nothing moved) and after the present step. It
   deletes only the working folder `{product_base}_status/next/`. It never touches
   the evidence folder `{product_base}_evidence/next/`, which is a separate,
   durable record governed by the evidence-recording flag.

The deliverable is unchanged: the recommendation is still printed to the user
inline. Only the spent scratch is removed.

## Scope and deferral

This ADR covers **`/next` only**. The broader question — whether the shared
product-side `_status/` folder should be gitignored for the *resumable* plays
(`design`, `codify`, `enhance`, …) whose status files legitimately persist between
runs to support resume-after-interruption — is **deferred**. Those plays must keep
their status files on disk, so the answer there is gitignore (machine-local), not
deletion. Self-cleanup is correct only for a play that never resumes, which is why
it applies to `/next` and not to the resumable plays. That policy decision is left
open and is not settled here.

## Consequences

### Positive

- **No orphaned files.** `/next` produces nothing the working tree has to carry or
  anyone has to commit — consistent with it being advisory and position-none.
- **No stale recommendations.** A leftover `recommendations.md` can never be
  mistaken for a current answer, because it is gone the moment the run ends.
- **Problem fixed at the source.** Self-cleanup removes the files rather than
  hiding them behind a gitignore rule; there is nothing left to ignore.
- **Reversible.** A self-cleanup step is a two-way door — it can be removed if a
  reason to keep the scratch ever emerges. The files are regenerable on the next
  run regardless.

### Negative / Risks

- **Loss of post-run debuggability.** If a recommendation looks wrong, the
  intermediate snapshots and candidate sets are no longer on disk to inspect.
  Mitigation: the run is fully deterministic over model state and cheap to re-run,
  and the verify step already proves the derivation internally consistent before
  the scratch is deleted.
- **Ordering is load-bearing.** Cleanup must run after verify and present; placed
  earlier it would delete files those steps still read. Mitigation: the ICE pins it
  as the final close action and the compiled play encodes that order.

## Alternatives Considered

| Alternative | Reason Rejected |
|-------------|-----------------|
| Gitignore `_status/next/`, keep the files | Stops the files being committed but leaves them on disk, where a stale `recommendations.md` still reads like a live answer. Treats the symptom (tracked), not the cause (orphaned, stale scratch from an advisory play). |
| Make `/next` a pipeline play so something commits its output | The output is advice, not a durable artifact; forcing an advisory play into the commit pipeline contradicts its position-none, recommend-only design (C2) and would make it "force commits", which is exactly what it must not do. |
| Default `/next` evidence off and rely on overwrite-next-run | Overwrite leaves the previous run's files present until the *next* `/next` run, not until the current run ends — the stale window stays open across every other play in between. |
| Do nothing (status quo) | Leaves orphaned, stale files in a tracked area on every run. |

## References

- Issue #440 — `/next leaves stale, uncommittable scratch files behind (advisory play should self-clean)`
- `core/components/plays/next/reference/ice.md` — next ICE (new C10, F7, REC7)
- `core/components/plays/next/SKILL.md` — compiled play (close-time cleanup step)
- #434 — project-side `status/` declared machine-local and gitignored; the product-side `_status/` policy for resumable plays remains deferred
