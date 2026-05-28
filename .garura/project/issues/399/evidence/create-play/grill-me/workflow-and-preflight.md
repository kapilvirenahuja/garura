# Workflow Structure and Pre-flight — grill-me

## Workflow: Structure A (Full checkpoint flow)

Selected because grill-me has all four phase markers:

- **Pre-flight** — environmental + anchor-resolution preconditions
- **Preparation** — anchor lock + downstream touchpoints inventory (one agent dispatch)
- **Execution** — multi-round Q&A loop, orchestrator-driven, with per-round `check-grill-tensions` calls
- **Checkpoint** — bundle preview + single human Tether/Vanish at close
- **Execution (close)** — atomic write of the approved bundle (one agent dispatch)
- **Evidence** — Standard Play Close (C1 evidence + C2 delivery report)

Structure B (fast) is wrong because the round loop and bundle-checkpoint together exceed "simpler single-agent work." Structure C (chained plays) is wrong because grill-me does not compose other plays. Readiness-only is wrong because grill-me produces a written close bundle.

## Pre-flight Checks

| Check | Constraint | Action on failure |
|-------|-----------|-------------------|
| PF1 — resolve `stm_base` and `product_base` from `.garura/core/config.yaml` | — | Hard halt — config required |
| PF2 — git repository present | — | Hard halt — not a git repo |
| PF3 — tracking issue resolved (branch carries `{type}/{issue}-{slug}` convention) and STM anchored at `{stm_base}/{issue}/` | — | Hard halt — no issue, no grill session traceability |
| PF4 — anchor kind supplied and is one of {`epic`, `feature`, `tech-decision`, `design-decision`} | C5 | Hard halt — surface plain-language explanation and the four valid kinds |
| PF5 — anchor target supplied and matches the kind's expected identifier shape (id or path) | C5 | Hard halt — explanation specific to the kind |
| PF6 — repo working tree is clean OR uncommitted changes do not touch `product_base/` | C12 | Hard block — would conflict with atomic write; ask human to stash or commit first |
| PF7 — read `grill-me.hitl` from `.garura/core/config.yaml` | C8 | Default `true` (human-in-the-loop ON) when absent/unreadable — fail safe toward human approval |

PF4/PF5 are the C5 / F11 enforcement before round one. PF6 is the C12 enforcement substrate (atomic write needs a clean canvas under product_base). PF7 mirrors the create-play pattern for HITL config.

The C6 / F5 "no grillable target" halt is NOT a pre-flight — it happens inside `resolve-grill-anchor` because it requires reading the anchor file. It surfaces as the agent's structured failure with `reason: no_grillable_target`, which the orchestrator translates into the plain-language halt before round one.

## Agent dispatch boundary

| Agent | Domain | Phase |
|-------|--------|-------|
| `grill-anchor-resolver` | anchor resolution + touchpoint inventory | Preparation |
| `shape-applier` | atomic close-bundle assembly + write | Checkpoint + Execution (close) |

Domain agents: 2 (well within ≤5). Utility agents: `repo-orchestrator` (close-bundle commit is inside `apply-shape-changes` directly; play-level evidence commit at C1 may go through repo-orchestrator). No `doc-builder` — checkpoint surface is the bundle preview markdown produced by the skill, not a brief.

## Round loop (Execution phase) — orchestrator-owned

The round loop runs at the orchestrator level — same pattern as craft-ice's interview. A sub-agent cannot conduct interactive Q&A. The orchestrator:

1. Restates grill-mode every turn (C10).
2. Drafts 3-4 questions in the locked register, asks the human.
3. Receives answers, writes a synthesis statement.
4. Invokes `check-grill-tensions` via the Skill tool with the synthesis + anchor lock path.
5. If tensions found → issues exactly one cited push-back per weak answer (C2), captures the re-answer.
6. Records resolutions or accepted gaps into `session-state.yaml`.
7. Loops until termination (defensibility or human good-enough — C9).

This is in-orchestrator execution, not a sub-agent. The skill calls per round preserve the discipline; the conversational layer cannot be delegated.
