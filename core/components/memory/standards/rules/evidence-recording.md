# Evidence Recording

Single source of truth for **who** records run evidence, **when**, and **how it
is switched on or off**. This is the D1 auto-build rule (#434): every play
`/play-creator` compiles emits evidence the same way, so the rule lives here
once instead of being re-decided per play.

It governs the machine-readable evidence file (the `C1` slot of the Standard
Play Close). It does not change the user-facing delivery report (`C2`), which is
a UX surface and is never gated — see `play-close.md`.

## The rule

**Evidence recording is a play-only responsibility.** A play is the only
component that may write a run-evidence file. Agents and skills never write
evidence — not their own, not the play's.

- **Plays** record evidence, as the final step of the run, via the Standard
  Play Close (`play-close.md`). Nothing else in the run does.
- **Agents** craft context and write their working artifacts to STM (analysis,
  manifests, audits). Those are inputs the play's evidence file *points at* —
  they are not evidence files and are not gated by this rule.
- **Skills** produce their named output artifact and return. A skill never
  opens an evidence file, never stamps a run summary, never decides whether
  evidence is on.

Why play-only: evidence is the record of one *run* of one *play*. Only the play
knows the run boundaries (start, halt, abort), the full artifact set, the
checkpoint decisions, and the eval results. An agent or skill sees one slice and
would record a partial, duplicated, or conflicting account. Centralizing it in
the play keeps exactly one evidence file per run, written by the one component
that sees the whole run.

## The switch — config-driven, tunable per play

Evidence recording fires on a config setting, with a global default and an
optional per-play override.

**Global default.** `.garura/core/config.yaml`:

```yaml
evidence:
  record: false        # global default for the C1 evidence-file write
```

When `record` is false, plays skip the C1 evidence-file write and record
`evidence skipped (record=false)` in the delivery report's pointer line. The C2
delivery report is still emitted — it is never gated.

**Per-play override.** A single global flag is too blunt: a pilot may want
evidence off everywhere but on for the one play under test, or on everywhere but
off for a noisy high-frequency play. An optional per-play map overrides the
global default for that play only:

```yaml
evidence:
  record: false        # global default
  plays:
    review-change: true   # this play records even though the global is off
    status: false         # this play never records even if the global is on
```

Resolution precedence the play applies at pre-flight (first match wins):

1. `evidence.plays.<this-play-name>` if the key is present — use it.
2. else `evidence.record` (the global default).
3. else treat as `true` (record) — absence of config is not a reason to lose
   evidence.

The resolved value is what the Standard Play Close C1 gate reads. Sub-plays
follow `play-close.md`: a sub-play (carries `parent_run_id`) emits only C1 under
this same resolved flag and skips C2; the parent's close absorbs the result.

## Relationship to the Standard Play Close

This rule sets the *policy* (who records, and the on/off switch). `play-close.md`
is the *mechanism* (the exact C1/C2 block a play emits). They converge:

- `play-close.md` C1 already honors `evidence.record`; this rule generalizes
  that single flag into the global-plus-per-play resolution above.
- The lint anchors and the always-on C2 report are unchanged — owned by
  `play-close.md`, not restated here.

## Enforced

- `lint-components` already asserts every compiled play carries the Standard
  Play Close block (the C1/C2 anchors). That is the structural guarantee a play
  *has* an evidence step.
- This rule adds the policy check: a compiled play must read the resolved
  evidence flag (global + per-play) at pre-flight and gate C1 on it — never
  hard-code the write, never gate C2. A play that writes evidence outside the
  close block, or that delegates evidence writing to an agent or skill, fails
  this rule.
- Agents and skills carry no evidence-file write at all; a skill or agent that
  writes a run-evidence file is a violation regardless of config.

## Related

- `play-close.md` — the C1/C2 close block this rule switches on/off
- `templates/evidence-file.md` — the C1 machine-readable shape
- `templates/delivery-report.md` — the C2 user-facing shape (never gated)
- `feedback_recipe_changes_via_rebake` — intent vs non-intent boundary
