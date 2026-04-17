# Human Approval Gate for Knowledge Writes
<!-- knowledge-file: tier=2 scope=core -->

**When this applies:** Any play that writes new content to LTM (organizational knowledge), regardless of how confident the producing agent is in the content.
**When this does NOT apply:** STM writes (temporary work state); archival writes (moving existing files, not creating new knowledge); config updates that are deterministic and reversible.
**Search patterns:** approval gate, human gate, knowledge write, LTM write, candidate review, reject candidate, knowledge checkpoint
**Provenance:** Issue #182 — learn play dry run
**Created:** 2026-03-31

## Content

No agent writes directly to LTM. Every LTM write goes through a human approval gate. The gate operates as follows:

**Gate presentation:** The play collects all knowledge candidates and presents them at a single checkpoint. For each candidate, the human sees:
- Proposed file path (where it will be written)
- Scope classification (project or core) and one-sentence reasoning
- Dedup status: NEW (no existing file at that path) or REFINEMENT (updates existing file, with diff shown)
- Full candidate content

**Gate outcomes per candidate:**
- **Approve** — write the candidate to the proposed path immediately
- **Reject** — discard the candidate entirely. No trace is left in LTM.
- **Defer** — leave the candidate in staging for a future review cycle. It remains in `learn-dry-run/`.

**Atomicity:** Each candidate decision is independent. Approving candidate A does not require approving candidate B. A mixed result (some approved, some rejected, some deferred) is a valid gate outcome.

**Why rejection leaves no trace:** A rejected candidate that persists anywhere in LTM — even as a "rejected" annotation — has the potential to be loaded by a future agent. Rejected knowledge must be fully absent from LTM to prevent contamination by stale or incorrect content.

**Gate is not optional:** A play that bypasses the gate for speed or convenience is not implementing the learn play — it is implementing a different, unauthorized workflow. The gate is the mechanism that preserves human authority over what the organization believes.

**Checkpoint format:** The gate is presented using the standard Tether/Vanish/Orbit checkpoint format. The human types approval decisions per candidate as part of the Tether response.

## Why It Matters

Automated agents make classification errors. They over-generalize project-specific patterns into core knowledge. They promote in-progress decisions as settled conventions. They extract noise as signal. The human gate is the last line of defense before incorrect knowledge becomes authoritative and starts influencing future agent decisions. Once in LTM, knowledge is trusted — the cost of incorrect knowledge in LTM is much higher than the cost of one human review cycle.

## Applicability Boundaries

**In scope:** Any system where automated agents produce content that will be used as authoritative input to future automated agents, and where the cost of incorrect authoritative content is high.
**Out of scope:** Personal notes or ephemeral context that is not shared with other agents; content that is clearly deterministic and correct by construction (e.g., copying a hash, recording a timestamp).

## Rationale

Human approval gates for consequential automated writes are a standard governance pattern in automated systems. It appears in infrastructure-as-code ("plan before apply"), database migrations ("review before execute"), and content moderation. The specific application to knowledge promotion is an instance of the general principle: automate generation, gate publication. This principle applies to any system where automated content becomes authoritative for future automation.

## Decay Tracking

**Last validated:** 2026-03-31
**Confidence:** medium
**Staleness window:** 180 days
**Supersedes:** null
