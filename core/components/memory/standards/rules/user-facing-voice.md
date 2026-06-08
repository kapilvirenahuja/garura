# User-Facing Voice

Canonical rule for how the system addresses the user — in any checkpoint,
summary, status update, close report, or ad-hoc conversation. It standardizes
the register; it does not standardize the content.

This rule is guidance, not compiled scaffolding. It is loaded on every
session in this repo via project `CLAUDE.md` Section 5 — that is the active
enforcement surface. (Earlier the rule was also pasted into every compiled
play with lint anchors and a `/play-creator` compiler gate; that paste-block
mechanism was reverted under #386 — see History.)

## Scope

This rule covers **every reply the system makes to the user** — checkpoint
prompts, status updates, summaries, close reports, and ad-hoc conversation
between plays. It does **not** cover artifact templates the play instructs
its sub-agents to produce internally (e.g. a planning `spec.md` template, a
brief produced by `analyze-pr`, or similar). Those templates are downstream
machine-language artifacts; extending the voice rule to them was explored
under #386 and dropped.

## The rule

When addressing the user, lead in the language the user operates in:
**product, feature, capability, technology, outcome.** File paths, component
names, class names, function names, and line numbers belong in an appendix or
a machine-readable artifact — never in the lead of a human-facing message.

Why: users working at L3 do not read individual files. They think and speak
in products being built, features being delivered, technologies being used.
When a reply opens with file paths or component tables, the user is lost —
they have to translate the system's machine-language into the
product-language they were already operating in. Translation is the system's
job, not the user's.

## Signals you've drifted

- The opening sentence of a reply names a file path, a class, a function, or
  a line number.
- The user has to read a table of files to learn what the work is *about*.
- A status update enumerates components touched before stating the outcome.
- A checkpoint asks the user to approve "changes to X.yaml" instead of "the
  decision that Y".

When any of these signals appear in a draft reply, rewrite before showing the
user.

## What stays in machine-language

Downstream agents (code-builder, test-engineer, judge, others) still need
file-level detail to do their work. So a reply may carry two registers:

- **User-facing lead** — product, feature, capability, technology, outcome.
  This is what the user reads.
- **Machine-facing appendix** — file paths, component names, line numbers.
  This is what downstream agents (or the user, when they want detail)
  consume.

Both can live in the same reply. The order matters: user-facing lead first,
machine-facing appendix second. A reply with only an appendix (no lead) is
non-compliant; a reply with only a lead (no appendix) loses traceability
when traceability matters. Two registers, in that order.

## History

- **#385** shipped the rule as a paste-the-block mechanism: a
  `## User-Facing Voice` section between `## Role` and the next section in
  every compiled play, HTML-comment lint anchors enforced by
  `core/tools/lint-components/lib/rules/structural.js` (rule IDs
  `structural/missing-user-facing-voice` and
  `structural/user-facing-voice-order`), plus `/play-creator` gate
  `G13 — User-Facing Voice`. Scope was orchestrator-to-user surfaces only.
- **#386** was the open follow-on to extend the same paste-the-block
  mechanism to artifact templates inside each play. The user dropped the
  experiment — the block-paste wasn't materially changing how the system
  talks to the user.
- **Revert (#386, commits `70fa56a` + `a82aabd`).** Stripped the block from
  all 26 compiled plays, removed gate G13 and the required-section row from
  `/play-creator`, removed the lint anchor checks from `structural.js`.
- The rule file itself was kept. Project `CLAUDE.md` Section 5 inlines the
  short version and points here for the long form — that became the active
  enforcement surface in place of the play-block mechanism.

## Related

- `standards/rules/play-close.md` — Standard Play Close uses the same
  paste-the-block + lint-anchor pattern, still active (the part of the
  pattern that earned its keep).
- `feedback_human_speech_self_correction` — the user feedback this rule
  codifies.
- `feedback_issue_writing_plain_english` — adjacent rule for issue prose.
