# ADR 019 — Epics Are Kept When Delivered, Not Deleted

**Status:** Accepted
**Date:** 2026-06-23
**Supersedes:** the implicit `persistence: temporary` rule locked under #434 (never given an ADR)
**Related:** ADR 008 (issue-centric STM), ADR 010 (STM archival), ADR 017 (folder whitelist)

## Context

In the ProductOS command model (#434), `/grill` cuts a permanent **slice** into one or
more **epics** — the unit of delivery, cut at the "a human can test this" grain. Each
epic becomes one tracked issue and runs through the execute pipeline
(`/start → /implement → /validate → /launch`).

The epic was treated as throwaway scaffolding. The epic schema carried
`persistence: temporary`, and when `/launch` landed the merge it ran a script
(`deliver_epic.py`) that recorded `delivered` into an evidence file and then **deleted the
epic file off disk** (`os.remove`). The launch play encoded this as constraint C7 and
failure condition F7 ("the epic was deleted before merge, or left undeleted after it").
The stated rationale, repeated in the schema header and in `/grill`, was: *"we keep the
intent and the structure, not the slicing."*

This decision was never written down as an ADR. It existed only as a one-word schema flag
plus scattered prose, locked under #434 as a schema reconcile. A destructive act on the
product model — removing a record from disk — was never weighed against alternatives.

When the deletion was examined, it turned out to be **lossy against the product model**.
Comparing the epic schema to the slice schema, the epic is the *only* place several
things live:

- `user_check` — the concrete "open X, do Y, verify Z" the human signed off on at
  `/launch`.
- `acceptance[]` — per-epic acceptance criteria. The slice carries only
  `acceptance_intent`, a single line at the *whole-increment* level. It does **not** hold
  per-epic acceptance.
- `order` and `depends_on` between epics — the delivery decomposition itself.
- `context` (persona / systems / scope) — the slice-of-the-slice the increment touched.

None of this is held by the slice or the functionality ICE. After deletion the only record
of *what shipped as a unit and what acceptance it passed* lived in the GitHub issue —
**outside the product model**. So the product model lost its as-delivered history: it could
no longer answer "what increments of this slice have shipped, in what order, against what
acceptance" from its own artifacts, and a later `/grill` re-cut of the same slice had no
product-native record of what was already delivered.

The one thing deletion bought was a tidy `product-os` folder — epics not accumulating as a
graveyard of spent delivery tokens. That is a real concern, but it argues for *archival*,
not *destruction*.

## Decision

**An epic is kept when it is delivered. It is never deleted.**

1. **Schema.** `epic.yaml` changes `persistence: temporary` → `persistence: permanent`.
   `delivered` becomes the **terminal kept state** of the epic's status chain. The epic
   file stays at its home (`{domain}/slices/{slice-id}/epics/{epic-id}.yaml`) as the
   as-delivered record.

2. **`/launch` close behavior.** After the merge lands, the `/merge` fill stamps the epic
   `status: delivered` **in place**. It does not remove the file.
   `deliver_epic.py` is changed from a delete to a stamp: it still refuses to stamp
   before merge evidence exists (merge always first), still refuses a non-`validated`
   epic, and is idempotent on resume — but it writes `delivered` back into the epic and
   keeps it.

3. **Launch intent (C7/F7/S1/REC7).** C7 becomes "after the merge lands, the epic is
   stamped `delivered`; the epic record is kept; never stamped delivered before the
   merge." F7 becomes "the epic was stamped delivered before the merge, or **deleted at
   all**, or not stamped delivered after the merge." The success scenario and recovery are
   regenerated to match (the epic reads `delivered` and is present after merge).

4. **Prose.** The "deleted on merge / not the slicing" lines in `/grill`
   (`SKILL.md` + `reference/ice.md`) and the product-os schema index (`_index.md`) are
   corrected: epics are permanent, stamped `delivered` and kept.

We keep the file in place rather than moving delivered epics into a separate `delivered/`
subfolder, because the `.garura/` folder whitelist (ADR 017) does not admit that subfolder
and adding one is a larger change than the problem warrants. A delivered epic is
distinguished by its `status` field, not its location.

## Consequences

### Positive

- **The product model holds its own as-delivered history.** What shipped, in what order,
  against what acceptance, with what user_check — all answerable from product-os artifacts,
  not just from GitHub.
- **A later `/grill` re-cut of a slice can see what already shipped** from the product
  model directly.
- **Reversible.** Keeping a record is non-destructive; the prior design threw data away
  with no recovery path.
- **Simpler close.** `deliver_epic.py` no longer carries delete-vs-resume-vs-snapshot
  logic; it stamps a status.

### Negative / Risks

- **Epics accumulate.** A slice re-grilled several times leaves several delivered epics
  beside it. Mitigation: they are clearly marked `delivered` and grouped under the slice;
  a future archival/compaction play can fold them if the volume ever bites. This is a
  two-way door — we can add archival later without losing data.
- **Migration prose is spread across schema, two plays, and the index.** A missed
  reference leaves a stale "deleted on merge" claim. Mitigation: grep sweep in the
  verification step.

## Alternatives Considered

| Alternative | Reason Rejected |
|-------------|-----------------|
| Keep deleting (status quo) | Lossy against the product model — destroys per-epic acceptance, user_check, order, and context with no recovery path. The only benefit (tidy folder) is achievable without data loss. |
| Move delivered epics to a `delivered/` subfolder | Violates the ADR 017 folder whitelist; adds a folder and a move step for no benefit over a status flag. Can revisit if accumulation ever hurts. |
| Keep the epic but strip it to a stub (id + status only) | Still throws away the acceptance/user_check/order the model needs. A stub is deletion wearing a hat. |
| Push the as-delivered record into the slice instead of keeping the epic | The slice deliberately holds increment-level intent, not per-epic delivery detail; copying epic fields up duplicates state and blurs the slice/epic boundary. |

## References

- Issue #439 — `[BUG] /launch deletes the epic file on merge — destroys the as-delivered record in the product model`
- `core/components/memory/standards/schemas/product-os/epic.yaml` — epic schema (persistence, status chain, fill rules)
- `core/components/plays/launch/reference/ice.md` — launch ICE (C7, F7, S1, REC7)
- `core/components/plays/launch/scripts/deliver_epic.py` — the `/merge` fill executor
- #434 — the ProductOS command-model realignment under which the temporary-epic rule was originally locked
