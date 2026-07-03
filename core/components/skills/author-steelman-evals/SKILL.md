---
name: author-steelman-evals
description: Author /implement's steelman evals for ONE epic — adversarial refutation checks the independent verifier runs against a build that claims "done". Reads the epic's acceptance criteria, user_check, the functionality ICE (failures especially), the quality lens gates, and the build plan's test pieces; writes refutation-style evals — each one a concrete attempt to PROVE THE CLAIM FALSE (probe an edge, violate a constraint, exercise a failure condition, game-check a test) with a binary pass rule. Compartmentalized by design: runs in a sub-agent the implementer never talks to, its output path is never placed in any builder or test-author contract, and it never reads implementer output. The anti-reward-hacking work for the /implement play.
version: 0.1.0
user-invocable: false
model: opus
allowed-tools: Read, Write, Glob
---

# author-steelman-evals

Writes the eval set the steelman verifier (quality-auditor) uses to try to refute a build
that claims done. The posture is adversarial: every eval is an attempt to prove "it works"
FALSE — not a restatement of the acceptance criteria, and never a check the implementer
could see and optimize against.

Compartmentalization is the point (C7): this skill runs under `evals-engineer`, an agent
the implementer never exchanges context with. Its inputs are spec-side only — it never
reads implementation code, builder output, or piece reports. Its output path lives under
the play's eval area and is never placed in a builder or test-author contract.

## Inputs

| Field | Required | Description |
|-------|----------|-------------|
| `epic_file` | yes | The epic record (read-only) — acceptance criteria, user_check, outcome, context.scope. |
| `functionality_ices` | yes | Resolved ICE paths — the failure conditions and constraints are the richest refutation material. |
| `quality_lens` | yes | The slice's lens/quality.yaml — every gate becomes at least one refutation probe. |
| `plan_path` | yes | The build plan (read-only) — its TEST pieces only: each gets a game-check eval (does the test genuinely exercise behavior, or can it pass vacuously?). Implementation pieces are not its concern. |
| `evals_path` | yes | Output path under the play's eval area (never inside any builder-visible folder). |

## Procedure

1. **Mine the refutation material.** Epic acceptance + user_check (what must observably
   work), ICE failure conditions (what going wrong looks like), ICE constraints (what must
   never be violated), quality gates (the bars), the plan's test pieces (what the build
   will claim as proof).

2. **Author refutations, not confirmations.** For each material item write one or more
   evals in the shape: *claim* (what the build will assert), *probe* (the concrete attempt
   to falsify it — the edge input, the violated precondition, the failure path, the
   vacuous-test check), *pass_rule* (binary: the probe FAILS to refute). Cover at minimum:
   every acceptance criterion, every ICE failure condition in the epic's scope, every
   quality gate, and one game-check per plan test piece.

3. **Write the set** to `evals_path`:

   ```yaml
   evals:
     epic_ref: <epic id>
     authored_by: author-steelman-evals
     checks:
       - id: ev-1-<slug>
         claim: <what the build asserts works>
         source: {kind: acceptance|ice-failure|ice-constraint|gate|test-game-check, ref: <citation>}
         probe: <the concrete refutation attempt the verifier performs>
         pass_rule: <binary condition meaning the refutation FAILED>
   ```

## Output contract

Return JSON only: `{"evals": "<evals_path>", "checks": <n>}`. The artifact lives on
disk; the contract carries paths, never content — and the path goes only to the play
and the verifier, never to the implementer.
