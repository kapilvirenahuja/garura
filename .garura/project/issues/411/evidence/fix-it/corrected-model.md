# Corrected execution model for /implement (issue #411) — authoritative

This note overrides the first-pass RCA/design framing. The user (intent owner) corrected the model twice. Treat this as the source of truth for the redo.

## The plan is a DAG

`plan.yaml` is a **directed acyclic graph of tasks**, not a flat ordered list and not a list of milestones. Tasks are nodes; `depends_on` edges connect them. The execution order is whatever the graph topology allows — the next runnable node is any node whose dependencies are all satisfied. It is NOT a guaranteed sequential T-000 → T-010 walk.

## /implement is agentic and self-locating

`/implement` must inspect:
- the **plan DAG** (the full task graph), and
- the **current branch state** (what has already been done / committed on this branch),

and figure out **for itself** where execution currently stands and which node(s) can run next. **No milestone is handed to it.** The current milestone-first invocation model (must pass `--milestone`, requires a `milestone_id`) is part of the defect — it should self-determine its path from the plan + branch.

## The run is continuous; it stops only at gates and milestones

The runner picks the next runnable node and **keeps running, node after node, following the DAG**. It never stops on its own. It halts ONLY when it reaches one of two boundary types:

- **Gate** — a readiness / tooling stop (e.g. prerequisites done, environment ready). Pause, wait for the gate's condition/signal to clear, then continue.
- **Milestone** — a human-acceptance stop, with evals / scenario gates. Pause for acceptance, then continue.

Both are stop points. Everything between two stop points just runs. A milestone does NOT drive execution — tasks drive execution; milestones and gates only bound it.

## What the real defect is (re-frame)

The shallow first-pass framing ("the depends_on resolver doesn't recognise a `.GATE` entry, patch the lookup") is wrong because it leaves `/implement` milestone-first. The true defect is that `/implement`:
1. requires being invoked with a milestone (no self-location from plan + branch),
2. resolves `depends_on` only as prior-milestone IDs (no general DAG-edge resolution),
3. has no DAG walker — it cannot pick the next runnable node and run continuously,
4. has no two-boundary halt model (gate = readiness stop, milestone = acceptance stop).

The gate-lookup miss reported in the issue is one symptom of (2)+(3).

## Fix vehicle

Primary fix is an INTENT change to `core/components/plays/implement/reference/intent.yaml` (the execution-model constraints — what is today C3 depends_on rule, F24, and the milestone-required invocation constraint, likely C28). After intent.yaml is updated, the compiled `core/components/plays/implement/SKILL.md` is regenerated via `/create-play --build implement` — never hand-edited for the intent portion.

The `/prepare` side (canonical plan.yaml example) may still need a documentation alignment, but that is secondary — the core fix is making `/implement` DAG-aware, self-locating, and continuous with two halt types.
