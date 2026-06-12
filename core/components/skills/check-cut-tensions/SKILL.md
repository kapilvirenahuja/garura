---
name: check-cut-tensions
description: Run the per-round tension check that makes /grill's steelman push-back discipline real. Reads the drafted epic cut and everything the slice declared — its functionalities' ICE (the hub), all six lenses, and the profile bars — and produces a structured tension report, one entry per real contradiction, each citing the specific declared item it defends (source file + verbatim quote). Detects untestable increments, acceptance thinner than a declared bar, cut/lens contradictions, and material omissions — and, separately, unresolved DELIVERY-METHOD choices: when an epic's user check depends on a method the lenses never decided, it emits a cited decision_questions entry for the play to put to the human. Emits live tensions and open questions only; the push-back/human-response evidence fields are the play's to fill from the actual conversation, never this skill's. Returns an empty report when the cut is consistent with the declared design. Used only by the /grill play, once per grilling round, between draft (or revision) and push-back.
version: 0.1.0
user-invocable: false
model: sonnet
allowed-tools: Read, Glob
---

# check-cut-tensions

Detects tensions between a drafted epic cut and what the slice **declared**: the
functionality ICEs (goals, constraints, failures), the six lens files (the solved
design), and the profile bars. The output is a structured report /grill uses to author
its cited push-backs — the play quotes the citations; this skill produces them.

This skill is the enforcement point for /grill's two hardest constraints:

- **C6** — every push-back cites a specific declared item. This skill produces the
  citations; an uncited entry must not be emitted.
- **C7** — the cut is reconciled against all six lenses before writing. This skill IS
  that reconciliation check; a grilling round that does not invoke it is malformed.

Structured analysis, not free reasoning. Each tension entry names a specific declared
item (source file + verbatim quote) AND describes the specific contradiction. Generic
critique without a cited anchor is not a tension and must not be emitted.

## Input

| Field | Required | Description |
|-------|----------|-------------|
| `cut_dir` | yes | The draft folder holding `epics/*.yaml` + `epics/deferrals.yaml`. |
| `slice_file` | yes | The slice record (read-only). |
| `functionality_ices` | yes | The resolved hub ICE paths, from the readiness gate. |
| `lens_dir` | yes | The slice's lens folder — all six lens files (read-only). |
| `profile_path` | yes | The product profile (read-only). |
| `round_id` | yes | Round identifier (e.g. `R3`) — written into the report. |
| `prior_rounds_dir` | no | Folder of previous round reports; entries already `resolved`/`accepted` are suppressed unless the current cut re-introduces the contradiction (then re-emitted with `reopened: true`). |
| `output_path` | yes | Where to write the report — `{working}/rounds/{round_id}-tensions.yaml`. |

## Process

1. **Build the defended set.** From the hub ICEs: every goal, constraint, and failure.
   From each of the six lenses: its declared content items and decisions. From the
   profile: each bar (level + gate). Each defended item carries its source file and the
   verbatim text.

2. **Interrogate the cut against it.** For each epic, and for the cut as a whole, ask of
   every defended item: does the cut **contradict** it, **render it incoherent**, or
   **materially omit** it?

   - **Contradicts** — an epic's scope or acceptance violates a declared item (a quality
     gate the acceptance undercuts, an architecture boundary an epic crosses, a profile
     bar the user_check ignores).
   - **Renders incoherent** — the cut makes a declared item unsatisfiable (a dependency
     order that defeats the run lens's rollout, two epics splitting what a lens treats as
     one).
   - **Material omission** — a declared item demands something the cut is silent on,
     where silence means it goes unmet (a failure condition no epic's acceptance guards,
     an untestable increment hiding behind a vague user_check).

3. **Emit one structured entry per real tension:**

   - `tension_id` — `{round_id}-T{n}`.
   - `epic_id` — the epic it concerns, or `cut` for whole-cut tensions.
   - `cites` — `kind` (ice_goal | ice_constraint | ice_failure | lens_quality | lens_ux |
     lens_agentic | lens_architecture | lens_run | profile_bar), `source` (the file path),
     `quote` (the verbatim declared text).
   - `contradiction_kind` — `contradicts` | `renders_incoherent` | `material_omission`.
   - `summary` — one or two plain-language sentences, specific to THIS cut — what the
     play will phrase the push-back from. Product language, no machine jargon.
   - `status` — always `live` on a fresh entry. The play (never this skill) later flips
     it to `resolved` (the cut changed) or `accepted` (with a `resolution_reason`).
   - `reopened` — true only when re-emitting a previously closed tension.

4. **Detect unresolved delivery-method choices (#436).** For each epic, ask: does its
   `user_check` or acceptance depend on a delivery method the lenses never decided —
   an ingestion route (file/log import vs provider API vs manual upload vs hybrid), a
   surface, a data path? If the architecture/run lens decides it, cite that and move on.
   If no declared item decides it, emit a **`decision_questions` entry** — NOT a tension:

   - `question_id` — `{round_id}-Q{n}`.
   - `epic_id` — the epic whose shape depends on the answer.
   - `cites` — the declared item that makes the question necessary (the user_check or
     acceptance line, the lens gap), same kind/source/quote shape as tensions.
   - `question` — one plain question, simply stated. No recommendation, no option
     menu, no advocacy — the play asks it verbatim, one at a time.
   - `human_response` — ALWAYS absent from this skill's output; the play records the
     human's answer there. Never invent or pre-fill an answer.

5. **Suppress closed tensions and answered questions.** Any contradiction already
   `resolved`/`accepted`, or any decision question already answered, in
   `prior_rounds_dir` is skipped unless the current cut re-introduces it.

6. **Write the report** to `output_path` and return the path + counts.

## What counts as a tension — and what doesn't

A valid entry satisfies BOTH: it cites a specific declared item (source + verbatim
quote), and its summary describes a contradiction specific to the current cut — not
stylistic critique, not "this seems vague", not "have you considered X" where X is not
anchored in a declared item. If either fails, do not emit — an uncited tension becomes
an uncited push-back, which is /grill's F5.

## Output

```yaml
round_id: R1
cut_dir: <path>
tensions:
  - tension_id: R1-T1
    epic_id: e-2-team-rollups
    cites:
      kind: lens_quality
      source: product-os/ai-usage/slices/slice-team-usage/lens/quality.yaml
      quote: "attribution totals reconcile to source totals within 1%"
    contradiction_kind: material_omission
    summary: >
      The epic's acceptance checks that roll-ups render, but nothing verifies the
      declared reconciliation gate — delivered as cut, the dashboard could show
      numbers the source data contradicts.
    status: live
    reopened: false
decision_questions:
  - question_id: R1-Q1
    epic_id: e-1-token-spine
    cites:
      kind: lens_run
      source: product-os/.../lens/run.yaml
      quote: "targets: ingest-worker — container, prod"
    question: >
      Should v1 token ingestion be file/log import, provider API, manual upload,
      or a hybrid?
    # human_response is the PLAY's field — recorded from the human's typed answer;
    # this skill never fills it.
counts:
  total: 1
  by_kind: {contradicts: 0, renders_incoherent: 0, material_omission: 1}
  decision_questions: 1
```

The play later augments each entry from the actual conversation: `pushback`
(`shown_to_human`, `text`, `asked_at`), `human_response` (`text`, `answered_at`), the
disposition (`resolved` + `resolution_directive`, or `accepted` + `resolution_reason`),
and the answer on each decision question. Those fields are evidence of the human loop —
this skill emits entries WITHOUT them, always.

**Return value:** `{status: checked, report_path, tension_count, question_count, breakdown}`.

## Failure modes

| What failed | Return |
|-------------|--------|
| cut_dir empty / unreadable | `status: failed, reason: missing_cut` |
| a hub ICE or lens file unreadable | `status: failed, reason: missing_declared_source` |
| output path unwritable | `status: failed, reason: output_write_error` |

## Boundaries

- Reads only the cut, the slice record, the hub ICEs, the lenses, the profile, and prior
  round reports; writes only `output_path`.
- Does not issue push-backs, does not edit the cut, does not set `resolved`/`accepted`
  (the play does, after the human answers), does not interview the human, does not call
  other skills.
- NEVER fills `pushback`, `human_response`, `resolution_directive`, or
  `resolution_reason`, and never answers its own decision questions — those fields are
  the play's evidence that a real human answered; pre-filling any of them forges the
  grilling (#436).
- Empty report is a valid output — a cut consistent with everything declared returns
  `tension_count: 0`; the play uses that to advance to the checkpoint.
- One entry per defended item per epic per round; two breaks of the same item by the
  same epic combine into one entry.
