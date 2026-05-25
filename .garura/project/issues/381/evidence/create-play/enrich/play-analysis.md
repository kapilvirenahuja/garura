# enrich play analysis — rebuild for #381

## Current state
- intent.yaml and expectation.yaml unchanged since ICE migration (#376). Compiled SKILL.md hashes match source — a plain rebuild is a no-op.
- This rebuild exists to add the **archive-gate guard** required by issue #381.

## The gap (#381)
Issue #381: "Add enrich archive-gate guard — don't close out on a silent half-write."
Follow-up to #379 / PR #380 (cold-start write fix, shipped).

`enrich` currently archives an issue even when an approved promotion write FAILED to land — a silent half-write reported as done. Per the cold-start RCA: the archive gate blocks only on `verification_failed`/`malformed` proposal states, NOT on a plain `failed` write. So an approved proposal whose LTM write failed still allows the issue to archive.

## Existing coverage that is close but insufficient
- C6: idempotency via archival (move issue STM to archived subtree after processing).
- C8: a malformed/unparseable source halts that proposal without partial writes and without archiving.
- F7: "archived while one or more proposals were neither applied nor explicitly rejected." The word **"applied" is ambiguous** — it can mean "a disposition was reached" OR "the write actually landed." The implementation read it loosely (disposition reached = ok to archive), which is the bug.
- REC7 (recovery for F7): autonomous — restore the prematurely-archived issue, resolve outstanding proposals, re-archive.

## Decided intent delta (direction chosen: minimal/Occam)
1. **Add a new constraint** (archive-gate guard): an issue's STM directory is archived ONLY when every approved proposal has a confirmed successful write to product LTM (and any approved Tier-1 ADR promotion completed). If any approved proposal's write reaches a terminal non-success state (failed, verification_failed, malformed), the issue is NOT archived and the failure is surfaced to the reviewer.
2. **Sharpen failure condition F7** so "applied" unambiguously means "the write was confirmed to have landed in product LTM" (not merely "a disposition was reached"). This closes the ambiguity that allowed the silent half-write. Keep ONE failure condition for this concern — do not add a separate, overlapping failure condition.
3. REC7's recovery (restore → resolve outstanding → re-archive) already fits the sharpened F7; verify wording still matches after the sharpen.

## Out of scope
- No change to the write mechanism itself (that was the #379 cold-start fix). #381 is purely the archive-gate guarantee.
