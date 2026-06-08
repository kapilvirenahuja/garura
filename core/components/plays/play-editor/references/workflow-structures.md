# Workflow Structures

Every compiled play picks one of these shapes. The shape decides which phases the
play has and where the human checkpoint (if any) sits. Pick by the work's risk and
complexity, not by habit.

All four share the same **task-management rule**: right after the play resolves its
working base (before step 1), it creates one task per compiled step with correct
`blockedBy`. The play owns that task graph — agents may add discovered sub-work but
must not touch the play's top-level tasks. Each step flips its task to in-progress
before running and to completed once its eval passes. On resume: skip completed tasks,
reset any in-progress task back to pending.

---

## Structure A — full checkpoint flow
**Phases:** pre-flight → preparation → checkpoint (skippable) → execution → scenario
validation → evidence.
**Use when:** the work is non-trivial, crosses domains, or the user should approve a
plan before final deliverables are produced.
**Key rule:** execution reads the artifacts produced in preparation — never the
human-readable checkpoint brief. The brief is for the human; the data is for the work.
The checkpoint is skippable when confidence is high and nothing risky was flagged.

## Structure B — fast execution flow
**Phases:** pre-flight → execution → approval → evidence.
**Use when:** the work is simpler, single-agent, or low-risk — no separate preparation
or pre-execution checkpoint is warranted. Any human approval is a single gate near the
end.

## Structure C — chained plays (higher-order)
**Phases:** pre-flight → play-1 → handoff → play-2 → … → evidence.
**Use when:** the work is best expressed by composing existing plays in sequence, each
consuming the previous one's output. There is no bespoke phase list — it is derived
from the chained plays' own structures. Reach for this only when the sub-plays already
exist and genuinely compose.

## Readiness-only — analysis, no generation
**Phases:** pre-flight → preparation → scenario validation → evidence.
**Use when:** the play's whole job is to assess, validate, or audit and emit a
findings artifact — there is no separate "produce the deliverable" step. Feasibility
checks and audits fit here.

---

## Deriving pre-flight from constraints
While choosing the structure, walk the intent's constraints and pull out the ones that
are really *environmental preconditions* — things that must be true before any work
starts. Each becomes a pre-flight check with an explicit action-on-failure:

- **hard halt** — the play cannot run at all (e.g. required config missing).
- **graceful exit** — nothing to do (e.g. no changes present); stop cleanly.
- **hard block** — a safety stop that needs explicit human override (e.g. a sensitive
  file is in scope).

Pre-flight always also: resolves the play's working base once and holds it for every
later path, and checks for a resume/status marker so a re-run continues instead of
restarting.
