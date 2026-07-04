# Gate Configuration

Every human checkpoint in every play is a **config switch** (#466, epic #460 Stage 3).
The switches exist so gates can later be retired per risk class on recorded evidence
(Stage 4, #467) — without recompiling a single play. Until then, everything defaults ON
and behaviour is unchanged.

## The config block

`.garura/core/config.yaml`:

```yaml
gates:
  default: on          # the fallback for anything unmatched
  classes:             # per-risk-class switches — Stage 4's lever
    docs-only: on      #   prose/documentation-only changes
    standard: on       #   normal code/component changes
    one-way-door: on   #   irreversible or shared-state actions (merges, deletes, releases)
  plays: {}            # per-play override, e.g. "commit-change: off" — first precedence
```

## Resolution (first match wins)

1. `gates.plays.<play-name>` — explicit per-play override
2. `gates.classes.<declared class>` — the class the checkpoint DECLARES in its play
3. `gates.default`
4. Absent config block entirely ⇒ `on`

Every checkpoint in a compiled play declares its risk class inline (e.g.
`Checkpoint (class: one-way-door)`). A checkpoint with no declared class resolves as
`standard`.

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
