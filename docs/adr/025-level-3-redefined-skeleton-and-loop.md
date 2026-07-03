# ADR 025: Level 3 Redefined — Deterministic Skeleton, Goal-Loop Interior

**Status:** Accepted
**Date:** 2026-07-04
**Amends:** ADR 013 (Play Maturity Model — the Level 3 definition)
**Related:** ADR 013 (maturity framework), ADR 017 (no per-play level assignment), ADR 023 (three execution trinities), epic #460, issue #461

## Context

### Where we are

Garura operates at Level 2 of the ADR 013 maturity ladder: every play is compiled
from its ICE source into a fixed internal step sequence, and the same input always
produces the same execution path. That determinism was the right response to the
failed Level 4 jump ADR 013 records — runtime DAG resolution created three competing
sources of truth and drowned the value in overhead.

But Level 2 has a cost we now measure. The compiled play prescribes not only *what
must be true* at close (the evidence contract, the evals) but *how the interior of
every step must run* (the baked choreography). The choreography half buys us little:
the guarantees live in the constraints, failure conditions, scenarios, and evidence
schema — not in the prescribed internal step order. Meanwhile the industry converged
on a different execution shape for the interior: an agent looping freely against a
verifiable goal — do, check, decide to stop or continue — with the loop closed by a
machine-checkable finish line rather than by a step list running out. Anthropic's
formulation: give the model something that produces a pass or fail, and the loop
closes on its own; without it, "looks done" is the only signal available.

### Why ADR 013's Level 3 is the wrong next rung

ADR 013 defines Level 3 as "the workflow structure itself moves into intent" — the
user authors both domain knowledge and workflow shape in the intent, but the compiled
play still runs the same fixed steps. That definition relocates the recipe text; it
does not change how a step executes. The leverage is not in where the recipe is
written. It is in what the interior of each step is allowed to do, and what proves
the step done.

### What was verified before this decision

Three premises were checked against the codebase, not assumed:

1. **The oracle exists but nothing executes it.** The quality lens writes what
   "good" means as a prose gates table (`| Dimension | Bar | How checked |`); no
   skill runs the "How checked" column. Verification today is either LLM inference,
   file-shape linting, or a human walk.
2. **No token budget exists anywhere.** Every "budget" in the framework is an
   agent-count cap (≤5 domain agents). No turn cap, no token cap, no spend recorded
   in evidence.
3. **Execution is strictly sequential.** One sub-agent per step, questions one at a
   time; the parent/child evidence model (`parent_run_id`) supports concurrent child
   runs structurally, but no play fans out.

And one precedent inside our own walls: the /implement ICE already states "no fixed
loop" within a build piece — when to test and when to judge stays the agent's call.
The interior loop exists at the smallest grain. This ADR generalizes it.

## Decision

**Level 3 is redefined: a play is a deterministic skeleton whose boxes each run a
free, goal-driven loop.** The old Level 3 wording ("workflow structure moves into
intent") is retired.

### The determinism rule

> **Determinism lives at the skeleton, never inside the boxes.**

The skeleton — the sequence of commands, the gates between them, the evidence that
must exist at close — is the compiled, guaranteed, hash-locked part. A ship is
always commit-change → propose-change → review-change → merge-change: all four, in
order, every time. That guarantee is non-negotiable and survives this change intact.

The interior of each box is the loop's business. The compiler stops baking internal
step choreography and instead hands each box four things:

| Wall | What it is | What it replaces |
|------|-----------|------------------|
| **Stop condition** | A "done means" statement the loop can evaluate itself — machine-checkable, not prose | Ending because the step list ran out |
| **Checker** | The deterministic gates the quality lens defines (linters, tests, types, architecture rules, coverage), executed by a runner that emits pass/fail | The prose "How checked" column nobody executes |
| **Budget** | A turn cap and a token/cost cap the loop cannot cross — enforcement that halts, not a dashboard that reports | Nothing (no budget exists today) |
| **Evidence schema** | What the loop must write as it works, so the close contract and crash recovery hold | Evidence assembled only at close |

Inside those walls the agent decides its own steps: what to read, when to test,
when to retry, when it is finished. The loop exits when the stop condition holds or
a wall is hit — never silently.

### The boundary of self-checking

The loop self-verifies only the deterministic slice. Visual design, UX judgment,
and security assessment are explicitly outside the runner: they stay with a human
gate or a fresh-context reviewer at the edges. This is not a temporary compromise —
rules-based checks are strong feedback and model-self-judgment is weak feedback, so
the architecture assigns each kind of verification to the party that can actually
perform it.

### What does not change

- **The evidence contract.** Standard Play Close, evidence files, checkpoint audit
  records, STM/LTM, `parent_run_id` — the proof shell is untouched. The DAG survives
  as the contract of what evidence must exist at close; it stops being interior
  choreography.
- **The ICE pipeline.** Plays are still compiled from `reference/ice.md` by
  play-creator; intent changes still recompile. What the compiler *emits* per box
  changes (goal + walls instead of steps); how plays are authored does not.
- **Level 4's status.** Runtime intent resolution remains a north star, not a
  target. It was attempted once and rolled back (ADR 013); nothing here re-opens it.
  Level 3 deliberately keeps compilation — it reaches for Level 4's interior freedom
  without Level 4's runtime resolution.
- **ADR 017's ruling.** Plays are still not individually assigned numeric levels.
  Level 3 names the framework's operating model, not a per-play badge.

## Consequences

- **play-creator changes shape.** The compiler's per-box output becomes goal +
  four walls + evidence schema. Compilation gates that assert baked interior steps
  are replaced by gates that assert the walls are present and machine-checkable.
- **The quality lens becomes executable.** The deterministic slice of the gates
  table gains a runnable form; a runner executes it and writes verdicts into
  evidence (epic #460, Stage 1a).
- **Evidence gains spend and identity.** Every run stamps token spend, caps, and
  run identity at close, making cost attribution exact and the budget wall
  enforceable (Stage 1b).
- **Human gates become configuration.** Checkpoints stay defaulted on; each becomes
  a per-risk-class switch, retired one class at a time only on recorded evidence
  that the runner catches what the human was catching (Stages 3–4).
- **Parallelism becomes possible last.** Independent boxes and checks may run
  concurrently under one parent only after the budget wall is proven — parallel
  execution multiplies whatever one loop does, including a runaway (Stage 5).
- **The word "deterministic" narrows honestly.** Garura stops promising "step 4
  ran the same way" and starts promising "the same four commands ran, the same
  gates held, the same evidence exists, and the loop's verdict is recorded." Path
  determinism is traded for outcome determinism; the proof shell is what makes
  that trade safe.

## Migration

Staged under epic #460: the ADR amendment (this record, #461), the three walls that
do not exist yet (#462 checker, #463 budget, #464 stop condition), a pilot recompile
of commit-change (#465 — most-used play, so a bad recompile surfaces immediately),
rollout with gates-as-config (#466), evidence-based gate reduction (#467), and
parallelism (#468). Each stage merges to main through the full change pipeline
before dependent stages begin.
