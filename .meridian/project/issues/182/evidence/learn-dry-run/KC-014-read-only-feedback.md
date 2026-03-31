# Read-Only Constraint for Learning Agents
<!-- knowledge-file: tier=2 scope=core -->

**When this applies:** Designing agents that read prior work evidence (STM, archives, logs) to extract knowledge, patterns, or feedback.
**When this does NOT apply:** Agents whose explicit purpose is to update the artifacts they read (e.g., an agent that refines a draft by overwriting it); agents with no feedback loop function.
**Search patterns:** read-only constraint, learning agent, evidence integrity, feedback loop, knowledge-extractor, staging area, artifact preservation
**Provenance:** Issue #182 — learn recipe dry run
**Created:** 2026-03-31

## Content

Agents operating in a feedback loop — reading completed work to learn from it — must be read-only against their input artifacts. The constraint has two parts:

**Part 1: Never write to input locations**
The knowledge-extractor reads STM evidence files at `{stm_base}/{issue}/evidence/`. It must not write, modify, or delete any file at those paths. Writes go only to a staging area: `{stm_base}/{issue}/evidence/learn-dry-run/`.

**Part 2: Staging area is not LTM**
The staging area contains candidates, not knowledge. Writing to `learn-dry-run/` is safe because it does not affect any LTM path. Actual LTM writes happen only through the promotion path, which requires human approval.

**Why this matters for audit and replay:** Evidence files in STM represent the record of what happened. If a learning agent modifies them — even to add annotations — it alters the historical record. A future audit or a recipe replay that reads the same evidence will get different results than the original run, making the system non-reproducible.

**Enforcement:** The agent's tool permissions should be scoped at invocation time. The recipe passes read permissions for STM evidence paths and write permissions only for the staging area. The agent should not self-grant broader permissions.

**Testing the constraint:** After the learning agent runs, compute a checksum of all files in the evidence directory (excluding the staging area). It must match the pre-run checksum. Any deviation is a constraint violation.

## Why It Matters

Feedback loop agents that mutate their inputs create a class of subtle bugs: the second run of the agent on the same evidence produces different output because the first run changed the evidence. This makes the system non-idempotent and non-auditable. Read-only input is what makes a feedback loop safe to run repeatedly and safe to replay for debugging.

## Applicability Boundaries

**In scope:** Any pipeline where an agent's purpose is to learn from or analyze prior work, and where that prior work must remain unchanged for audit or replay purposes.
**Out of scope:** Agents that are explicitly designed to refine or update their input artifacts as part of their function (e.g., an editor agent that improves a draft in place).

## Rationale

Read-only input for analysis agents is a standard immutability principle from functional programming and data pipeline design. In data engineering, raw data zones are read-only; processed data is written to separate output zones. The same principle applies to agent pipelines: evidence is the raw zone; staging/LTM is the output zone. This ensures the raw zone can be reanalyzed later without contamination.

## Decay Tracking

**Last validated:** 2026-03-31
**Confidence:** medium
**Staleness window:** 180 days
**Supersedes:** null
