# User-Facing Voice

Canonical rule every play follows when it addresses the user — in any
checkpoint, summary, status update, or close report. One block, play-agnostic.
It standardizes the register; it does not standardize the content.

This rule is the single source of truth for both the manual editor (direct
SKILL.md edit, allowed for this non-intent scaffolding) and the `/create-play`
compiler (which emits the same block so a rebuild converges, never clobbers).

## Scope (narrow, intentional)

This rule covers **orchestrator-to-user surfaces only** — the C2 delivery
report, checkpoint prompts, status updates, and any inline message the play
addresses to the human. It does **not** cover artifact templates the play
instructs its sub-agents to produce (e.g. the `spec.md` template inside
`start-feature-planning`, the brief produced by `analyze-pr`, or any
similar). Those templates are a separate concern tracked in a follow-on
issue — when picked up, that work will extend this rule's scope to cover
artifact-template instructions, and audit each play's templates to put the
product-language lead first and the file detail in an appendix.

The reason for the split: the orchestrator-surface fix is a paste-the-same-block
job across 27 plays — cheap, reversible, lint-enforceable. The
artifact-template fix is uneven per-play work that needs an audit and a
rewrite per template, not a paste. Shipping the cheap half first lets us see
how the voice rule lands before committing to the bigger rewrite.

## Why this is a non-intent change

This rule changes nothing a play *decides* or *guarantees* — no constraint,
failure condition, scenario, eval, agent, or skill. It only standardizes the
language register the play speaks in when talking to the human. Per the
play-pipeline boundary rule it is therefore a direct edit, not an
`intent.yaml` → rebuild cycle. `/create-play` is updated to emit it so
direct-edit and rebuild produce the identical block (convergence — see
`feedback_recipe_changes_via_rebake`).

## The rule

When a play addresses the user, it leads in the language the user operates in:
**product, feature, capability, technology, outcome.** File paths, component
names, class names, function names, and line numbers belong in an appendix or
a machine-readable artifact — never in the lead of a human-facing message.

Why: users working at L3 do not read individual files. They think and speak in
products being built, features being delivered, technologies being used. When
a play opens with file paths or component tables, the user is lost — they have
to translate the play's machine-language into the product-language they were
already operating in. Translation is the play's job, not the user's.

## Signals the play has drifted

- The opening sentence of a checkpoint, summary, or close report names a file
  path, a class, a function, or a line number.
- The user has to read a table of files to learn what the work is *about*.
- A status update enumerates components touched before stating the outcome.
- A checkpoint asks the user to approve "changes to X.yaml" instead of "the
  decision that Y".

When the play detects any of these signals in its own draft output, it
rewrites before showing the user.

## What stays in machine-language

Downstream agents (code-builder, test-engineer, judge, others) still need
file-level detail to do their work. So the artifacts produced by the play may
carry two registers:

- **User-facing lead** — product, feature, capability, technology, outcome.
  This is what the user reads.
- **Machine-facing appendix** — file paths, component names, line numbers.
  This is what downstream agents consume.

Both can live in the same artifact. The order matters: user-facing lead
first, machine-facing appendix second. A play that produces only an appendix
(no lead) is non-compliant; a play that produces only a lead (no appendix)
loses traceability for downstream agents. Both registers, in that order.

## The block

Paste verbatim into every play's SKILL.md, near the top, in a `## User-Facing
Voice` section placed immediately after the `## Role` section. The opening
and closing marker comment lines are the **exact lint anchors** (see
Enforced) — do not alter their text.

```markdown
## User-Facing Voice

<!-- --- User-Facing Voice (canonical; see standards/rules/user-facing-voice.md) --- -->

When this play addresses the user — in any checkpoint, summary, status
update, or close report — it leads in the language the user operates in:
product, feature, capability, technology, outcome. File paths, component
names, class names, function names, and line numbers belong in an appendix
or a machine-readable artifact, never in the lead of a human-facing message.

Signals the play has drifted:
- The opening sentence names a file path, class, function, or line number.
- The user has to read a table of files to learn what the work is about.
- A status update enumerates components touched before stating the outcome.
- A checkpoint asks the user to approve "changes to X.yaml" instead of "the
  decision that Y".

When the play detects any of these signals in its own draft output, it
rewrites before showing the user. Downstream-agent artifacts may still carry
file-level detail — in an appendix, after the user-facing lead.

See `standards/rules/user-facing-voice.md` for the full rule.

<!-- --- end User-Facing Voice --- -->
```

## Enforced

`lint-components` asserts every compiled play SKILL.md contains the
User-Facing Voice block. The **exact lint anchor strings** (match literally,
both must be present, opener before closer):

- opener: `<!-- --- User-Facing Voice (canonical; see standards/rules/user-facing-voice.md) --- -->`
- closer: `<!-- --- end User-Facing Voice --- -->`

A rebuild that drops them, or drift that alters them, fails lint. This
converts the convention from remembered to enforced.

## Related

- `standards/rules/play-close.md` — the converge-and-lint pattern this rule
  mirrors (different concern: close-report scaffolding vs. user-facing voice
  across the whole play).
- `feedback_human_speech_self_correction` — the user feedback that this rule
  codifies into play scaffolding.
- `feedback_issue_writing_plain_english` — adjacent rule for issue prose.
