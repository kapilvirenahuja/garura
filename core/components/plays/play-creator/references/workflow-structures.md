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

## Concurrent read-only fan-out (within a step)

Steps run top to bottom, one at a time — with ONE allowed exception. A single step may run
several **independent read-only** sub-tasks concurrently instead of in a serial loop, then
join before the next step reads their outputs. This is the read-only side of Stage 5
(#468); the canonical rule is `standards/rules/concurrent-fanout.md`.

Emit the fan-out form (not a serial loop) when a step does the same read-only work over N
independent items and all three safety conditions hold: each sub-task **reads only** shared
inputs (no tree writes), writes to its **own distinct** output path, and depends on **no**
sibling's output. Two shapes:

- **Sub-agent-dispatch** — the step dispatches N isolated sub-agents in one concurrent
  batch, joins, then proceeds (e.g. one content-quality judge per grounding doc).
- **Script-internal** — one orchestrating script runs its independent subprocesses in a
  bounded worker pool, collecting results in input order (e.g. `/validate`'s check runners).

However you word the step, it must state that it fans out AND name the join barrier and the
read-only condition — `lint_play.py`'s `check_fanout_declaration` fails a play that cites
`concurrent-fanout.md` without declaring both. A fan-out is always bounded (a fixed set) and
joined (a barrier before any downstream read), so the step stays a single deterministic node
(ADR 025). A step whose sub-tasks WRITE the tree is NOT this — that is #488 (worktree
isolation), out of scope here; keep it serial.

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
