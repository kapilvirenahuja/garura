# Gate Configuration

Every human checkpoint in every play is a **config switch** (#466, epic #460 Stage 3).
Stage 4 (#467) gives the switch three kinds instead of two: a gate is **pinned** (always
human), **conditional** (learned per project from live evals), or **off** (the play's own
deterministic checks carry what the human was checking).

## The three gate kinds (#467)

| Kind | Meaning | Who decides |
|---|---|---|
| **pinned** | Always fires. No config value, policy, or ledger can turn it off. | The play's intent (unpinning = play-editor intent change) |
| **conditional** | Fires unless the learned per-project policy says this change SHAPE is auto. Every crossing appends a live-eval line; the human's real action is the verdict that teaches the policy. | The gate policy, learned from the ledger |
| **off** | Never waits. The checkpoint's judgment was replaced by named deterministic checks inside the play's loop; the skip is recorded. | Config (`gates.plays.<play>: off`), granted only in the same change that adds the replacement checks |

## The config block

`.garura/core/config.yaml`:

```yaml
gates:
  default: on          # the fallback for anything unmatched
  classes:             # per-risk-class switches
    docs-only: on      #   prose/documentation-only changes
    standard: on       #   normal code/component changes
    one-way-door: on   #   irreversible or shared-state actions (merges, deletes, releases)
  plays: {}            # per-play override, e.g. "commit-change: off" — first precedence
  conditional:         # the learned-gate mechanism (#467)
    streak: 3          #   consecutive clean approvals a shape needs to earn auto
    ledger: .garura/core/gate-evals.jsonl   # live-eval ledger (append-only, committed)
    policy: .garura/core/gate-policy.yaml   # learned policy (distilled, committed)
```

## Resolution (first match wins)

0. Pinned (declared in the play) ⇒ **on**, always — before any config read
1. `gates.plays.<play-name>` — explicit per-play override
2. **Conditional plays only:** the learned policy — `classify_change.py` emits the
   change's shape key; a shape in the policy's `auto:` block (and not in `never_auto:`)
   ⇒ auto-pass; anything else ⇒ on. A draft carrying ANY blocking finding (lint gap,
   grounding-eval fail) ⇒ on, regardless of policy.
3. `gates.classes.<declared class>` — the class the checkpoint DECLARES in its play
4. `gates.default`
5. Absent config block entirely ⇒ `on`

## The live-eval loop (conditional gates)

Scripts (canonical copies in `play-creator/references/`, stamped into conditional plays):

- `classify_change.py` — deterministic draft-vs-live shape classifier. Fixed axes
  (nodes added/removed, status changes, profile bars, decisions added, sections
  rewritten, prose edits); the shape key is `<play>:<non-zero axes>`.
- `gate_eval.py append` — one JSONL line per crossing: shape, predicted (gate|auto),
  human action (`approved_clean` | `approved_edited` | `rejected` | `auto_pass`).
  A later correction is a NEW line with `refutes: <line>` — the ledger is append-only.
- `distill_gate_policy.py` — the learner, run at the play's close. Pure rule: a shape's
  last `streak` consecutive entries all `approved_clean` (auto_pass extends a streak,
  never starts one) and no unrefuted correction ⇒ `auto:`. Any rejection, requested
  edit, or correction resets the shape to gated. `never_auto:` in the policy file is
  the human's permanent pin — preserved verbatim across distills, never earnable.

Learning happens BETWEEN runs (the distill at close); inside the loop the policy is a
file lookup. Run-time stays deterministic per ADR 025.

Every checkpoint in a compiled play declares its risk class inline (e.g.
`Checkpoint (class: one-way-door)`). A checkpoint with no declared class resolves as
`standard`.

**Pinned gates (#466 Batch B, re-ruled #467).** A checkpoint whose play's own intent
mandates it declares `(class: <class>, pinned)`. A pinned gate NEVER resolves off — no
config value can disable it; the switch machinery records `pinned — config bypass
refused` if an off value would otherwise match. Unpinning is an intent change to that
play (play-editor), never a config edit. Per the #467 ruling the pinned set is: **grill**
(a wrong epic cut poisons everything downstream), **launch** (the one HITL gate of the
implement trinity — the acceptance walk), **learn** (a wrong model learning bends the
product model), and **merge-change's land-on-main step** (the #467 re-pin correction —
merging to main is the one irreversible action in the chain, so the actual land always
keeps its human beat; the rest of merge-change is automatic), and **deploy** (standing up a live cloud
environment is outward-facing — always requires a human). The eleven document plays
(vision, understand, shape, roadmap, and the seven realize lenses) are **conditional**;
the other pipeline/execute mechanical gates are **off** with replacement checks.

## Behaviour of the switch

- **on** — the checkpoint fires exactly as today: render the approval prompt, wait for
  the typed response. Nothing changes.
- **off** — the checkpoint does NOT wait. It records `gate skipped by config
  (<resolution path>)` as a Checkpoint Decisions row in the evidence file and proceeds.
  Skips are always visible in evidence — a silent gate is not a gate.

## Hard boundaries

- The switch gates ONLY human checkpoints. Pre-flight halts, sensitive-file blocks,
  stop-condition gates, and eval failures are never gated by this block — they are the
  machine's walls, not human courtesies.
- Turning a class off is a Stage 4 decision made on recorded evidence (the runner
  catching what the human caught), never a convenience toggle mid-run.
- `one-way-door` should be the last class ever turned off, if ever.

## Related

- `templates/approval-prompt.md` — the checkpoint rendering this switch gates
- `rules/play-close.md` — Checkpoint Decisions rows record skips
- ADR 025 — the determinism rule; gates are skeleton, their firing is config
