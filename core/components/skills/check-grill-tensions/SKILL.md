---
name: check-grill-tensions
description: Run the per-round tension check that makes grill-me's push-back discipline real. Reads the round's synthesis (what the play believes the shape is, after this round's answers) and the anchor lock (what the target declared), and produces a structured tension report — one entry per contradiction, each citing a specific defended constraint by id or quoted phrase. Returns an empty report when the synthesis is consistent with the declared shape. Used only by the grill-me play, once per round, between synthesis and push-back.
user-invocable: false
model: sonnet
allowed-tools: Read, Write
---

# check-grill-tensions

Detects tensions between a grilling round's synthesis and the target's
declared constraints, rules, failure scenarios, and success scenarios. The
output is a structured report the play uses to decide whether to issue a
cited push-back or advance to the next batch of questions.

This skill is the enforcement point for grill-me's two most important
constraints:

- **C1** — every push-back the play makes cites a specific declared
  constraint/rule/failure scenario of the target. This skill produces the
  citations; the play simply quotes them.
- **C4** — every round runs a tension check against the declared shape. This
  skill IS the tension check; a round that does not invoke it is malformed.

The skill is structured analysis, not free reasoning. Each tension entry must
name a specific defended item (by id or quoted phrase) AND describe the
specific contradiction. Generic critique without a cited anchor is not a
tension and must not be emitted.

## Purpose

Given:

- the **anchor lock** (what is defended — produced by `resolve-grill-anchor`),
- the current **round synthesis** (the play's plain-language statement of
  what the shape looks like after this round's questions and answers),

produce a tension report. One entry per real contradiction. Empty list when
the synthesis is consistent with everything declared on the target.

## Input

| Field | Required | Description |
|-------|----------|-------------|
| `anchor_lock_path` | yes | Path to the `anchor-lock.yaml` produced by `resolve-grill-anchor`. |
| `round_synthesis_text` | yes | The plain-language synthesis statement for this round. Free text — the play passes it verbatim. |
| `round_id` | yes | Round identifier (e.g. `R3`) — written into the report for traceability. |
| `prior_tensions_resolved` | no | List of tension ids already marked resolved in previous rounds, used to suppress re-reporting them when the resolution stuck. Default: empty. |
| `output_path` | yes | Where to write the report — typically `{stm_base}/{issue}/evidence/grill-me/rounds/{round_id}-tensions.yaml`. |

## Process

1. **Read the anchor lock.** Load `defended_constraints`,
   `defended_business_rules`, `defended_failure_scenarios`,
   `defended_success_scenarios`. Build a unified list of defended items, each
   with `defended_id` (the source id, or a synthesised one like `BR-3` when
   the source had no id), `defended_kind` (constraint | business_rule |
   failure_scenario | success_scenario), and `text`.

2. **For each defended item, ask one question against the synthesis:** does
   the synthesis text contradict, omit, or render incoherent this defended
   item?

   - **Contradicts** — the synthesis asserts something that violates the
     defended item (e.g. defended rule says "every input must have a
     denominator"; synthesis says "we report % capacity reclaimed" without
     naming a denominator → contradiction).
   - **Renders incoherent** — the synthesis doesn't directly contradict, but
     makes the defended item unsatisfiable (e.g. the synthesis collapses two
     dimensions into one variable that the defended rule treats separately).
   - **Material omission** — the defended item demands something the
     synthesis is silent on, when silence implies the demand goes unmet
     (e.g. defended failure scenario "source of savings numbers undefined"
     remains live because synthesis never names the source).

3. **For each tension found, build a structured entry** with:

   - `tension_id` — auto-assigned: `{round_id}-T{n}`.
   - `defended_id` — the id from the anchor lock.
   - `defended_kind` — constraint | business_rule | failure_scenario |
     success_scenario.
   - `cited_text` — verbatim quote (or short paraphrase + the full quote) of
     the defended item.
   - `contradiction_kind` — `contradicts` | `renders_incoherent` |
     `material_omission`.
   - `contradiction_summary` — one or two plain-language sentences in the
     register named by the anchor lock (`product` or `technical`). This is
     what the play uses to phrase the push-back; it must be specific to
     this synthesis, not boilerplate.
   - `status` — always `live` on a fresh entry. Subsequent rounds update
     this to `resolved` or `accepted_gap` when applicable (the play sets
     those, not this skill).

4. **Suppress already-resolved tensions.** Any `defended_id` listed in
   `prior_tensions_resolved` is skipped, unless the current synthesis
   re-introduces the contradiction (in which case it gets a fresh
   `tension_id` and the report notes `reopened: true`).

5. **Write the report** to `output_path`.

6. **Return** the path, the tension count, and the breakdown by
   contradiction kind.

## What counts as a tension — and what doesn't

A tension entry is only valid when it satisfies BOTH:

1. It names a specific `defended_id` (or synthesises one tied to a quoted
   phrase from the anchor file).
2. The `contradiction_summary` describes a contradiction specific to the
   current synthesis text — not stylistic critique, not "this seems vague",
   not "have you considered X" where X is not anchored in a defended item.

If either condition fails, do not emit the entry. Emitting an uncited
tension causes the play to issue an uncited push-back, which is F1.

## Output

```yaml
round_id: <e.g. R3>
checked_at: <ISO 8601 timestamp>
anchor_lock_path: <path>
synthesis_excerpt: <first ~200 chars of round_synthesis_text, for traceability>
tensions:
  - tension_id: R3-T1
    defended_id: C7
    defended_kind: constraint
    cited_text: "Every input collected must have a named denominator before any percentage is reported."
    contradiction_kind: contradicts
    contradiction_summary: >
      The synthesis names the output unit "% of capacity reclaimed" but the
      questions asked this round collected only the numerator (hours
      reclaimed). The denominator (total capacity at baseline) is not in
      the input set, so the percentage cannot be computed coherently.
    status: live
    reopened: false
counts:
  total: <n>
  by_kind:
    contradicts: <n>
    renders_incoherent: <n>
    material_omission: <n>
```

**Return value:**

```yaml
status: checked
report_path: <path>
tension_count: <n>
breakdown:
  contradicts: <n>
  renders_incoherent: <n>
  material_omission: <n>
```

## Failure Modes

| What failed | Cause | Return |
|-------------|-------|--------|
| anchor lock missing/unreadable | I/O or bad path | `status: failed, reason: missing_anchor_lock` |
| anchor lock has no defended items at all | shouldn't happen if `resolve-grill-anchor` halted correctly | `status: failed, reason: empty_anchor_lock` — play should not have started rounds |
| `round_synthesis_text` empty | malformed round | `status: failed, reason: empty_synthesis` |
| output path unwritable | I/O | `status: failed, reason: output_write_error` |

## Notes on emission discipline

This skill is the one place where the play's push-back-with-citation
discipline is enforced. A few rules the implementation must respect:

- **Quote, don't paraphrase the defended item.** `cited_text` should be
  verbatim wherever possible. The defended id alone is not enough — the
  human reading the eventual push-back should see the exact rule that is
  about to break.
- **Make the contradiction specific to this synthesis.** A
  `contradiction_summary` that would apply to any synthesis touching this
  defended item is too generic. Tie it to specific phrases from the
  `round_synthesis_text`.
- **Register matches the anchor.** The summary uses product language for
  `product` register anchors (users, outcomes, capabilities) and technical
  language for `technical` register anchors (components, contracts, data
  flow). Machine/agent jargon never appears in any field.
- **One tension per defended item per round.** If the synthesis breaks the
  same defended item in two ways, combine them into one entry with both
  contradictions named — do not split.
- **Empty report is a valid output.** A round where the synthesis is
  consistent with every defended item writes an empty `tensions:` list and
  returns `tension_count: 0`. The play uses this to advance.

## Boundaries

- Reads only `anchor_lock_path`; writes only `output_path`.
- Does not read the original anchor target file again — the lock is the
  source of truth for what is defended (and `resolve-grill-anchor` already
  extracted it verbatim).
- Does not issue push-backs. Does not write to the shape document. Does not
  call other skills. Does not interview the human.
- Does not mutate prior round reports. Each round writes its own file.
