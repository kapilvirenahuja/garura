# No unbacked recommendation — the cardinal rule

**Silence beats a wrong answer.** A play that recommends an action must be able to name
the source that backs it. Where it cannot, it says nothing — it never fills the gap with a
default, a generic pointer, or another play's name.

Kapil, 2026-09-08: *"there is a cardinal rule. its better to not recommend if you dont
know rather than recommending wrongly."*

## The failure this exists to stop

A play reaches an entry it cannot resolve. Rather than leave it blank — which looks
unfinished — it offers something harmless-looking: "run `/next`", "see the docs", the most
common play, the first row in the table. That default is not neutral. The reader cannot
tell it apart from the recommendations the play actually derived, so it inherits their
authority while carrying none of their backing.

The real-world case: `/focus` showed ten issues. Eight had no kind label, so the table had
no play for them, and each was rendered "run `/next`". Two of those eight were plainly
defects whose correct answer was `/fix-bug`. The play was not wrong about what it knew; it
was wrong to speak where it knew nothing. A blank would have been read as "label these",
which is the true state. `/next` was read as "this is the answer", which was false.

A default offered in place of an answer is worse than the gap it hides, because it hides
the gap.

## The rule

A play in scope (see below) must satisfy all four:

1. **Backed or blank.** Every recommendation the play emits traces to a named source it
   can cite — a table row, a resolved artifact, a declared rule. An entry the play cannot
   back carries **no** recommendation.
2. **No substitute.** The blank is never filled. Not with a default, not with a generic
   pointer, not with the most common answer, not with another play's name. Text shown in
   place of a recommendation must state what is *not* known and must name no action.
3. **The gap is reported.** The play counts the entries it could not recommend for and
   surfaces that count to the user. An invisible gap is the same failure one step later.
4. **It is enforced, not intended.** The rule appears as a **constraint** and a matching
   **failure condition** in the play's ICE, with a step eval that fails when an unbacked
   recommendation is present, and a recovery whose direction is to *strip* the
   recommendation — never to choose a different one. Absence is the correct answer, so
   recovery must not "repair" it into a guess.

## Scope

Any play whose frontmatter `description` says it recommends, suggests, advises, or ranks
actions for the user. Any future play is in scope the moment its description says so.

State today (2026-09-08, verified by the lint sweep):

| Play | State |
|------|-------|
| `focus` | **wired** — the reference implementation |
| `next` | **caught, not yet wired** (#530) — its thin-history notice already follows the rule for one field, but the rule is not stated as a guarantee |
| `review-change` | **caught, not yet wired** (#530) — needs a check on whether it can post a computed verdict with no completed review behind it |

A play listed as caught fails `lint_play.py` today. That is the guardrail working, not a
defect in the play; the fix is to wire it (or, if it only reports, to say so in its
description so the rule stops claiming it).

A play that only *reports* (a status, a diff, a list of facts) is out of scope — it makes
no recommendation to back.

## Worked example

`focus` is the reference implementation (`core/components/plays/focus/`):

- The table is `reference/kind-map.yaml`; a row's `command` is the backing. A row with no
  `command`, and the `fallback` row, produce `recommendation: null`.
- `no_command_note` is the text shown instead. It states the gap and names no play.
- `select_focus.py` has no code path that can substitute a default.
- `check_output.py`'s `C12/F10 no-unbacked-recommendation` check fails the run when any
  entry without a table command carries a recommendation, when such text names a play
  (`/[a-z][a-z0-9-]{2,}`), when the count is wrong, or when the count is missing from the
  report.
- ICE: constraint C12, failure condition F10, scenario S8, recovery REC10.

## Enforced

`lint_play.py` runs `no-unbacked-recommendation` on every compiled play whose frontmatter
description contains a recommending verb. It requires the play to cite this file and to
carry both a constraint and a failure condition for the rule. `play-creator` emits that
wiring for a recommending play (step 4c + a hard rule); `play-editor` preserves it (hard
rule). The trigger strips negated mentions first, so a play advertising "no
recommendations attached" (`grill`) is not dragged in scope by its own disclaimer.

The linter checks the play is *wired*; only the play's own eval can check a given run.
That split is deliberate and matches `play-close.md`: the lint proves the guard exists,
the guard proves the run.

## Related

- `pipeline-next.md` — the successor map. The Next line is backed *by that map*; a play
  with a `null` command renders no play name, which is this rule at the close.
- `play-close.md` — same convergence-and-lint pattern.
- `user-facing-voice.md` — how the gap is worded to the user.
