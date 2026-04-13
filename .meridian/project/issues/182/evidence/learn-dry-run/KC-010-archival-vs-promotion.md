# Separate Archival from Knowledge Promotion
<!-- knowledge-file: tier=2 scope=core -->

**When this applies:** Designing the end-of-work workflows for any issue, feature, or project — specifically the plays that run when work closes.
**When this does NOT apply:** Mid-cycle workflows where work is still in progress; incremental knowledge updates triggered by specific events rather than work completion.
**Search patterns:** archival, knowledge promotion, capture-learning, learn play, STM archive, work history, separate plays
**Provenance:** Issue #182 — learn play dry run
**Created:** 2026-03-31

## Content

Archival and knowledge promotion are distinct operations. They must be separate plays because they differ on every axis:

| Dimension | Archival (capture-learning) | Knowledge Promotion (learn) |
|-----------|----------------------------|------------------------------|
| Trigger | Work closes (issue resolved) | Work completes (milestone done) |
| Input | All STM files for the issue | STM evidence + resolution traces |
| Output | Archive copy at a stable path | New or updated knowledge files in LTM |
| Approval | None required — it is a move | Human gate required — it is a write |
| Reversible | Archive can be restored | LTM write is semi-permanent |
| Frequency | Every closed issue | Selected closed issues (those with learnable patterns) |

**Archival purpose:** Preserve a complete, immutable snapshot of the work that produced an outcome. Useful for: debugging regressions, auditing past decisions, rerunning a workflow with the same context.

**Promotion purpose:** Elevate reusable patterns from the snapshot into living organizational knowledge. The archive is the source; LTM is the destination.

**Sequential dependency:** Archival should precede promotion. Promotion reads from the archive, not from active STM. This ensures the source evidence is stable and complete before extraction begins.

**Anti-pattern:** A single workflow that archives AND promotes atomically. This couples two decisions that should be made independently. Not all archived work deserves promotion. Not all promotable knowledge comes from recently closed issues.

## Why It Matters

Combining archival and promotion in one workflow creates an all-or-nothing choice: either lose the work history or accept whatever knowledge the promotion step produces. Keeping them separate means an issue can be closed and archived without triggering a knowledge review, and knowledge can be promoted from older archives when the pattern is recognized later. The separation also means archival never blocks on the human approval gate that promotion requires.

## Applicability Boundaries

**In scope:** Any workflow system that both preserves work history (for audit/replay) and extracts organizational learning from completed work.
**Out of scope:** Disposable workflows where history is not preserved; systems where all completed work is automatically treated as authoritative knowledge.

## Rationale

The separation of preservation from learning is a general knowledge management principle. In software, it appears as "commit history vs documentation" and "log retention vs analytics." The specific trigger and output differences described here are Meridian conventions, but the principle — archive everything, promote selectively — is universally applicable to any learning organization.

## Decay Tracking

**Last validated:** 2026-03-31
**Confidence:** medium
**Staleness window:** 180 days
**Supersedes:** null
