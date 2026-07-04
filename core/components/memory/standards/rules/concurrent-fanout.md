# Concurrent Read-Only Fan-Out

Plays run their steps top to bottom, one at a time (ADR 025 — the skeleton is
deterministic). This rule names the **one** exception: a single step may run several
independent read-only sub-tasks **at once** instead of in a serial loop, then join before
the next step reads their outputs. Same work, same guarantees, less wall-clock. It is the
read-only side of epic #460 Stage 5 (#468); the writing side (parallel code-building with
worktree isolation) is #488 and is NOT covered here.

## When a fan-out is allowed — the three safety conditions

A batch of sub-tasks (sub-agent dispatches OR runner subprocesses inside one script) may
run concurrently **only when all three hold**:

1. **Read-only over shared inputs.** Each sub-task only *reads* the shared context (the
   model, the draft, the code) — it makes no mutation and no write to the shared working
   tree. (A run whose sub-tasks WRITE the tree needs isolation — that is #488, not this.)
2. **Distinct output paths.** Each sub-task writes only to its *own* output path — no two
   write the same file. Collisions are impossible, so no lock and no isolation are needed.
3. **No sibling dependency.** No sub-task consumes another's output. They are siblings of
   one parent step, not a chain. If one needs another's result, they are sequential — not
   a fan-out.

If any condition fails, the step stays serial. The conditions are a checklist the step
declares, not a judgment call.

## The bounded join

A fan-out is always **bounded and joined**, never open-ended:

- **Bounded** — the batch is a fixed set known when the step starts (every doc in the
  draft, every check in the manifest). No sub-task spawns more sub-tasks.
- **Joined** — the step waits for **every** sub-task to finish before anything downstream
  reads their outputs. No later step ever sees a partial set.
- **Order-stable result** — outputs are collected in a deterministic order (the batch's
  input order), so the step's result is identical whether the sub-tasks ran concurrently
  or in series. Concurrency changes only timing, never the outcome.

This is what keeps the skeleton deterministic: the fan-out is a closed set with a barrier
at its end, so the step is a single deterministic node from the outside.

## The two forms

- **Sub-agent-dispatch form** — the play's orchestrator dispatches N independent
  read-only sub-agents in one concurrent batch (one message, N dispatches), waits for all,
  then proceeds. Example: the content-quality judge loop in `/vision` and `/understand` —
  one isolated judge per grounding doc, each reading only its own doc and writing only its
  own verdict.
- **Script-internal form** — one orchestrating script runs its independent subprocesses
  concurrently (a bounded worker pool), then collects results in input order. Example:
  `/validate`'s `run_checks.py` — each check runs its own runner, writes its own result
  record, reads only the code.

Both forms obey the same three conditions and the same bounded join.

## Declaring it in a play

A step that fans out states, in one line, that it does and that the conditions hold — e.g.
"dispatch one judge per doc as a concurrent batch (concurrent read-only fan-out: each
reads only its doc, writes only its verdict, no judge depends on another — join before
gating; see `standards/rules/concurrent-fanout.md`)." The lint check
(`lint-components`) requires a fan-out step to carry that declaration so the safety
conditions are always visible, never implicit.

## Related

- ADR 025 — the determinism rule; a bounded, joined fan-out is a single deterministic step
- `play-creator/references/workflow-structures.md` — step execution model
- #488 — the writing-fan-out follow-on (parallel build pieces, worktree isolation)
