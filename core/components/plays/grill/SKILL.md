---
name: grill
position: both
description: 'Cut one REALIZED slice into user-testable delivery epics — the handoff from the product model to the delivery pipeline. /roadmap says which slice to build; the seven realize lenses have solved its design and /measure has stamped it realized — the marker /grill requires before it cuts. Each epic is a meaningful increment a user can open, exercise, and verify when delivered (the user-testability grain — never internal-only work), self-contained, referencing the slice''s intent and lenses, never copying them. The cut is GRILLED before it is written — grilling draws the box from realized slice to delivery epics so nothing drifts outside the declared intents: every challenge cites a specific declared item (never taste), questions are asked plainly ONE AT A TIME with no recommendations attached, a tension closes only on the typed human answer (the record carries the push-back shown, the human''s words, and the human-derived directive or reason — the agent never self-resolves), and an unresolved delivery-method choice becomes a cited decision question, never an assumption. Lens defects route back to their lens play. Ordered, every functionality covered or explicitly deferred, written atomically only after human approval. Writes only epics; opens no implementation issue — /start picks epics up one at a time. Position BOTH (#437, decision 24): /grill is self-contained — start-change opens its own branch at the head, and the standard end sequence (commit-change → propose-change → review-change → merge-change) closes it after the verified persist — no manual /commit-change.'
user-invocable: true
---

# grill

Take one **realized** slice — a vertical product increment whose design the seven realize
lenses (quality → ux → agentic → arch → measure → run) have already solved, stamped
`status: realized` by /run — and cut it into **epics**: the ordered, user-testable delivery
increments the delivery pipeline picks up. /grill sits below /roadmap (which says which
slice to build next) and above /start (which opens one issue per epic). Epics are
permanent: kept on the slice, stamped `delivered` on merge and kept in place as the
product model's as-delivered record (ADR 019).

The **grain of an epic is user-testability**, not the functionality: when an epic is
delivered, a user can open the product, do something, and see it work. An epic may thread
several of the slice's functionalities; a functionality may yield several epics; internal
machinery rides inside the epic that surfaces it, never alone. Every epic is
self-contained — context (persona, systems, scope), acceptance criteria naming observable
user behavior, and the one-line `user_check` — and **references** the slice's intent
records and lenses, never copies them.

The cut is **grilled, not relayed** — and grilling is **drawing the box**: going from A
(the realized slice — its declared intents, lenses, profile) to B (delivery epics) must
have no drift, and the declared intents are the box the cut cannot step outside. The play
pushes back steelman-hard — thin acceptance, untestable increments, tensions between the
cut and what the slice declared — and every push-back cites the specific declared item it
defends. A tension is resolved in the cut or explicitly accepted with a recorded reason; a
defect in a lens itself is recorded and routed back to that lens's play, never patched
here. The full cut persists atomically, only after the human approves it.

**The grilling is a conversation with the human, and the record proves it (#436).** The
play builds its question list for the round — push-backs and open delivery-method
questions — and asks **one question at a time, simply stated**: the citation and the
question, nothing else. No recommendations, no option menus. A tension leaves `live` only
on the typed answer; the round record carries the push-back actually shown, the human's
own words, and the directive or reason derived from them. The agent revising the draft on
its own never closes a tension. And where the box has no wall — an epic's user check
depending on a delivery method the lenses never decided — the play asks a cited decision
question; only the human draws that wall.

**Pipeline position: both (#437, decision 24; confirmed by Kapil).** /grill is
SELF-CONTAINED: it opens and closes its own branch, like fix-bug. The realize work lands
through its own three pipes — the FUNCTIONAL pipe (ux start → agentic → marketing end), the
NON-FUNCTIONAL pipe (architecture start → quality → run end), and the DELIVER pipe (measure),
each merging to main — so /grill no longer rides a branch another play opened. The D2 pipeline-position rule injects
`start-change` at the head (resolve or create the grill issue, cut the branch off fresh
main, optional worktree, init STM) and keeps the close sequence `commit-change →
propose-change → review-change → merge-change` at the tail: after the epics are persisted
and verified, the locked cut is committed, raised, reviewed, and merged without the human
having to remember `/commit-change`. The bracketed change is the MODEL change only; /grill
still opens no implementation issue and cuts no branch for an epic's delivery work —
picking up an epic remains /start's job, one epic at a time. /grill works on one slice and
remains the slice's end conceptually: nothing about a slice is finished until grill is.

## Compiled From

This play was compiled from the grill ICE (`reference/ice.md`) by play-creator and
recompiled via play-editor (#436, #437; closed-schema round-report fix). Intent defines
constraints (C1–C16) and failure conditions (F1–F17); the expectation defines success
scenarios (S1–S8) and one recovery entry per failure condition.
To modify this play, update `reference/ice.md` and recompile with play-creator.
Do NOT edit this file manually — it is a compiled artifact.

## Role

You are the orchestrator. You own the workflow, the step order, the grilling rounds (the
push-back authoring from the cited tensions the tension-check skill returns, and every
exchange with the human), and the checkpoint. You delegate the two pieces of judgment —
drafting/revising the cut and detecting tensions against the declared design — to the
`product-os-keeper` agent via JSON contracts over files on disk, and you run every
mechanical part (config + readiness + realized-stamp resolution, draft validation, the
write-gate, the snapshot, the atomic allowlisted persist, the post-apply guard) through
bundled scripts. You never write epic YAML yourself, and you persist nothing before the
human approves the single checkpoint (C9).

**Forbidden:** hand-writing epic YAML; cutting from a slice not stamped `realized`;
issuing a push-back without a citation to a declared item; **closing a tension without a
typed human response** — marking `resolved`/`accepted` because the agent revised the draft
itself, or filling `pushback`/`human_response`/directive/reason with anything but the
actual conversation (#436); attaching a recommendation, option menu, or advocacy to a
grilling question, or asking questions in a batch instead of one at a time; cutting an
epic whose user check depends on a delivery method no declared item decides and no human
chose; persisting by any route other than `scripts/apply_epics.py`; persisting before
Step 5 approval; editing a lens, the slice record, an ICE, or the profile (a lens defect
is recorded and routed, never patched); hand-rolling git/issue/PR/merge work — the model
change opens ONLY via the injected `start-change` head and closes ONLY via the injected
end-sequence members, and no implementation issue or branch for an epic's delivery work
is ever opened (delivery's job); performing any epic lifecycle step beyond
creation at `ready`.

**Agent boundaries:**

| Agent | Domain | Skills it invokes | Phases |
|-------|--------|-------------------|--------|
| `product-os-keeper` | Read the slice's hub (functionality ICEs + profile) and all seven lenses; draft the epic cut by the user-testability grain (self-contained, referenced, ordered, deferrals recorded); revise it per grilling-round directives; detect tensions between the cut and the declared design, each with a verbatim citation | `author-epics`, `check-cut-tensions` | Draft, Grill |

`product-os-keeper` is the single **domain agent** this play uses (1 of the ≤5 budget).
No utility agents are needed in the play's own core — git/issue machinery arrives only via
the injected members (`start-change` at the head; `commit-change`, `propose-change`,
`review-change`, `merge-change` at the tail), which carry their own agents; those are not
counted here.

## Pre-flight

| Check | Constraint | Action on Failure |
|-------|-----------|-------------------|
| Resolve config + `product_base` (`.garura/core/config.yaml`) | — | Hard halt |
| Slice argument supplied (`/grill <slice-id>` or `/grill <domain>/<slice-id>`) | C1 | Hard halt — name the slice to cut |
| Profile firmed (`set`) AND the slice exists with every functionality ICE resolved + rich | C1 | Hard halt (REC2) |
| Slice stamped `realized` AND all seven lens files present | C1 | Hard halt (REC2) |

Resolve config mechanically, then resolve the slice + hub, then assert the realized stamp.
/grill's issue and branch arrive via the injected `start-change` head (Step 0); pre-flight
itself runs no git — it resolves config and gates only:

```
python3 scripts/preflight.py --play grill --config .garura/core/config.yaml
python3 scripts/check_ready_slice.py --product-base <product_base> --slice <slice>
```

`preflight.py` returns config facts (`product_base`, `stm_base`, `evidence_record`).
`check_ready_slice.py` is the single gate this play exists behind (C1): it resolves the
slice and its hub and halts unless the profile (in the spine) is `set`, the slice's spine
`status` is `realized`, and all SEVEN lens grounding docs exist for it
(`quality.md`, `ux.md`, `agentic.md`, `marketing.md`, `architecture.md`, `run.md`,
`measure.md`) — /grill cuts solved designs only. The hub resolves each of the slice's
`functionality_ref`s to its `functionality.md` grounding doc; an unresolved ref fails loud.
On success it emits `slice_file`, `domain`, `lens_dir`, and the resolved
`functionality_groundings`. On any halt, route to the missing step (REC2): /shape to shape
the slice, /understand to detail it, or the realize pipes (functional: /ux /agentic
/marketing; non-functional: /arch /quality /run; deliver: /measure, which stamps it
realized) to solve and stamp it. No epic is written on a halt.

The working base is `<working>` = `{stm_base}_grill/<slice-id>/` (the draft, the rounds,
the snapshots); `<slice_dir>` = `<product_base>/product-os/<domain>/slices/<slice-id>`
(the folder beside the record, holding `lens/`, `decisions/`, and the `epics/` home this
play writes).

**Resume check:** if `{stm_base}_grill/status/<slice-id>.json` exists, resume — skip
completed steps, reset any in-progress step to pending, continue from the first
incomplete.

## Task DAG

Create ALL tasks immediately after resolving config — before any domain work.
The play owns this DAG; the agent must not edit its top-level tasks.

```
[T0]  start-change   (injected — start, head) blockedBy: []
[T1]  Draft the cut                          blockedBy: [T0]
[T2]  Validate the draft                     blockedBy: [T1]
[T3]  Grill rounds (until clean)             blockedBy: [T2]
[T4]  Checkpoint (approval)                  blockedBy: [T3]
[T5]  Persist atomically                     blockedBy: [T4]
[T6]  Verify persisted                       blockedBy: [T5]
[T7]  commit-change   (injected — end #1)    blockedBy: [T6]
[T8]  propose-change  (injected — end #2)    blockedBy: [T7]
[T9]  review-change   (injected — end #3)    blockedBy: [T8]
[T10] merge-change    (injected — end #4)    blockedBy: [T9]
[T11] Scenario Validation                    blockedBy: [T10]
[T12] Close                                  blockedBy: [T11]
```

Mark each task in-progress before its step and completed right after its eval passes.
No runtime reordering. On resume, skip completed and reset in-progress to pending.

## Workflow

### Phase: Start (injected — D2 position: both, head)

**Step 0 — start-change** · Owner: `start-change` (sub-play) · Depends on: pre-flight
Run the start-of-pipeline member as a sub-play, dispatched with `parent_run_id` so it
emits only its own C1 evidence and this play's close absorbs it. It resolves or creates
the grill issue, cuts the branch off fresh main, sets up a worktree iff config calls for
it, and initializes the STM workspace. /grill is self-contained: everything after this —
the draft, the grilling, the persist — runs on this branch, and the injected end sequence
(Steps 7–10) closes it. No implementation issue or branch for an epic's delivery work is
opened here — that remains /start's job.

    {
      "play":          "start-change",
      "parent_run_id": "<this run id>",
      "inputs":  { "title": "grill slice <slice-id>" },
      "outputs": { "result": "<working>/start/start-change.json" }
    }

start-change owns its own evals (issue anchored, branch off latest main, worktree per
config, STM initialized); they are not re-checked here.

### Phase: Draft

**Step 1 — Draft the cut** · Owner: `product-os-keeper` · Depends on: Step 0
The agent reads the slice's hub (its functionalities' ICE — resolved by the readiness
gate — plus the profile) and **all seven lenses** (the solved design — /grill is the
reconciliation point, so unlike a realize lens it reads everything), then invokes
`author-epics` to draft the cut to STM: epics by the user-testability grain, each
self-contained with a concrete `user_check`, referencing the slice's functionalities,
ordered with explicit acyclic dependencies, and a `deferrals.yaml` recording any slice
functionality deliberately not cut this run:

    {
      "task":    "cut this realized slice into user-testable epics — each a meaningful increment a user can open, exercise, and verify when delivered, self-contained (context + acceptance + a concrete one-line user_check), threading the slice functionalities it needs, referencing ICE/lenses never copying them, ordered (acyclic depends_on, first epic stands alone, order 1..n), with every slice functionality covered or explicitly deferred with a reason. Declare each epic's surface per surface-contract.md — a surface block {type: web_dashboard|server_api|cli|library|service_read_model, human_run_target, must_open[]} sourced from the slice's own named surface (slice.surface — the authoritative user-facing surface /shape wrote) and refined by the epic's user_check; the epic surface must trace to a surface the slice names, never invented and never silently defaulted to a non-user-facing type. When the slice surface is user-facing (web_dashboard/server_api), the first epic (order 1) must scaffold a minimal openable app/server shell in its acceptance/scope so later epics extend a surface that already opens.",
      "inputs":  { "slice_ref": "<domain>/<slice-id>",
                   "slice_file": "<product_base>/<slice_file>",
                   "functionality_groundings": [ "<product_base>/<functionality.md>", "..." ],
                   "lens_dir": "<product_base>/<lens_dir>",
                   "spine_path": "<product_base>/product-os/_spine.yaml",
                   "product_base": "<product_base>" },
      "outputs": { "draft_dir": "<working>/draft/",
                   "epics": "<working>/draft/epics/" }
    }

`slice_file`, `lens_dir`, and `functionality_groundings` come from `check_ready_slice.py`. The
skill reads the hub + the seven lenses **read-only** and writes the draft only — never the
live model. It returns the contract with the output paths on disk — never inline content.
**SE-1 (F2/C1):** the readiness + realized gates passed at pre-flight — the profile is
`set`, the slice exists with every functionality ICE resolved + rich, the slice record is
stamped `realized`, and all seven lens files exist; otherwise the run halted (REC2) and no
epic was written.

### Phase: Validate

**Step 2 — Validate the draft** · Owner: play · Depends on: Step 1
Run the cut validator over the draft before any grilling:

```
python3 scripts/validate_epics.py --draft <working>/draft \
        --product-base <product_base> --slice-file <slice_file>
```

**SE-2 (F1/C2):** every epic carries a non-empty, distinct `user_check` and at least one
acceptance criterion — and, by judgment over the validator-clean draft, each acceptance
criterion names observable user behavior (an actor opens/does/verifies something), never
internal-only completion; any epic failing this is regenerated (REC1) before grilling.
**SE-3 (F10/C3):** every epic is self-contained — `context.persona`/`systems`/`scope` and
`acceptance` non-empty, and every `functionality_refs` entry resolves to a functionality
the slice declares; gaps are backfilled from the hub and lenses (REC10).
**SE-16 (F15/C14):** every epic in the draft carries a `surface` block with a `type` from
the surface-contract taxonomy, a `human_run_target`, and — for a user-facing type
(web_dashboard/server_api/cli) — a non-empty `must_open`; no surface is absent or silently
defaulted to a non-user-facing type. A missing or defaulted surface is declared with the
human at the checkpoint (REC15) before the cut is written.
**SE-17 (F16/C15):** when the slice surface is user-facing (web_dashboard/server_api), the
first epic (order 1) scaffolds an openable app/server shell — its acceptance/scope name a
minimal app a user can open — so later epics extend an existing surface; otherwise the cut
is reordered or recut (REC16).
**SE-4 (F4/C4):** no epic embeds source content — the forbidden keys (`ice`, `intent`,
`goals`, `expectations`, `lens`, `content`) appear in no epic; a copy found is replaced
with a reference (REC4).
**SE-5 (F3/C5):** the coverage check maps every slice functionality to ≥1 epic's
`functionality_refs` or a deferral with a recorded reason — never both, never neither; an
unmapped functionality gets an epic or an explicit deferral (REC3).
**SE-8 (F9/C8):** `order` values are unique positive integers, every `depends_on` resolves
to an epic in this cut, the graph is acyclic, and the lowest-order epic has no
dependencies; violations are re-ordered or split (REC9).
**SE-11 (C10):** every epic's `status` is `ready` and `issue_ref` is unset — creation
only; pickup, delivery, and deletion belong to /start and /merge.
On any GAP, apply the named recovery and re-run before grilling starts.
**SE-18 (F17/C16):** every drafted `epic.md` passes `lint_grounding.py` (kind `epic`: the template's section set, no drift) AND the content-quality eval gate (`grounding_gate.py` over the judge verdict); and each epic's spine entry conforms to the spine schema with `functionality_refs` that resolve. A thin or off-template epic doc, or a dangling ref, fails the gate and is not written.

### Phase: Grill (rounds — the play's reason to exist)

**Step 3 — Grill rounds, until clean** · Owner: play + `product-os-keeper` · Depends on: Step 2
A bounded loop; round `R<n>` runs five moves and the loop exits **only** when a round's
report has zero `live` tensions, zero unanswered decision questions, and the validator is
clean against the rounds:

1. **Tension check.** Dispatch `product-os-keeper` → `check-cut-tensions` over the current
   cut and everything the slice declared:

       {
         "task":    "detect tensions between this epic cut and the declared design — the functionality grounding docs, all seven lenses, profile bars — one entry per real contradiction, each citing source file + verbatim quote; emit unresolved delivery-method choices that shape an epic as cited decision_questions entries (plain questions, no recommendations, human_response always absent); suppress tensions and questions already closed in prior rounds",
         "inputs":  { "cut_dir": "<working>/draft/",
                      "slice_file": "<product_base>/<slice_file>",
                      "functionality_groundings": [ "<product_base>/<functionality.md>", "..." ],
                      "lens_dir": "<product_base>/<lens_dir>",
                      "spine_path": "<product_base>/product-os/_spine.yaml",
                      "round_id": "R<n>",
                      "prior_rounds_dir": "<working>/rounds/" },
         "outputs": { "report": "<working>/rounds/R<n>-tensions.yaml" }
       }

2. **Build the round's question list.** One question per live tension (the push-back —
   steelman the analysis of *what* to challenge, but state the question plainly) and one
   per open decision question. Each list entry is the citation plus one simply-stated
   question. Nothing else: **no recommendation, no option menu, no advocacy** wrapped
   around it (C12).
3. **Ask one at a time.** Present the first question — the verbatim citation and the
   question — and **wait for the typed answer** before asking the next. As each is asked,
   record on its entry `pushback.shown_to_human: true`, `pushback.text` (what was shown),
   and `pushback.asked_at`; when the human answers, record `human_response.text` (their
   words) and `human_response.answered_at`. A question with no citation is never asked
   (C6) — withdraw it (REC5).
4. **Disposition from the answers only (C12).** For each answered tension: `resolved` —
   with a `resolution_directive` derived from the human's words — or `accepted` — with
   the human's own `resolution_reason`. For each answered decision question: record the
   chosen delivery strategy on the entry; it becomes a revision directive where it
   reshapes an epic (C13). The agent revising the draft by itself NEVER closes a tension
   — no answer, no disposition (F11). A tension that exposes a defect in a lens itself is
   dispositioned by recording the defect to `<working>/lens-defects.yaml` and routing the
   human to that lens's play — the lens is never edited here (C11). Revisions go back
   through the agent: dispatch `product-os-keeper` → `author-epics` with `directives` =
   the dispositions + chosen strategies, revising the draft in place.
5. **Re-validate.** After any revision, re-run Step 2's validator, then enter round
   `R<n+1>`.

The write-gate closes the loop — the validator in rounds form must be clean:

```
python3 scripts/validate_epics.py --draft <working>/draft \
        --product-base <product_base> --slice-file <slice_file> \
        --rounds-dir <working>/rounds
```

**SE-6 (F5/C6):** every tension entry across every round report carries a citation
(`cites.source` + verbatim `cites.quote`) — the validator fails on any uncited entry, and
the session shows no push-back that lacks one; an uncited push-back is withdrawn (REC5).
**SE-7 (F6/C7):** at the write-gate, zero tensions are `live` — every one is `resolved`
in the cut or `accepted` with a recorded reason; live tensions block the gate (REC6).
**SE-12 (F11/C12):** every non-live tension carries the human loop's evidence —
`pushback.shown_to_human: true` with the text shown, `human_response.text` in the human's
words, and a `resolution_directive` (resolved) or human-given `resolution_reason`
(accepted); the validator fails any closed tension missing them, and the session shows
each was asked one at a time with no recommendation attached (REC11).
**SE-13 (F12/C13):** every `decision_questions` entry carries its citation, its question,
and the human's answer — the validator fails an unanswered one, and a `resolved` entry
also carries the `resolution_directive` derived from that answer; no epic's `user_check`
rests on a delivery method that neither a lens nor a recorded human answer decides
(REC12).
**SE-15 (F14/C13):** round reports are a CLOSED SCHEMA — the write-gate validates evidence
only under `tensions:` and `decision_questions:`, reads the legacy `questions:` key as an
alias for `decision_questions:` and holds it to the identical rules (counting it), and
fails any other top-level evidence key rather than passing it unchecked. The
decision-question count therefore reflects every round question; an off-schema key — under
which the gate would otherwise validate nothing and report a clean pass — is a forged-clean
gate and blocks the write until the round is rewritten under the canonical schema (REC14).

### Phase: Checkpoint (mandatory — never skipped, C9)

**Step 4 — Human review** · Owner: play · Depends on: Step 3
Present the full cut **inline**, in product language: each epic — its title, outcome, the
`user_check` (what a user opens, does, and sees), its declared **surface** (the type, what
a human runs/opens, and the artifacts that must open), the acceptance criteria, the
functionalities it threads, its dependencies and order — plus the deferrals and their
reasons, **the grilling record** — every resolved tension (the question asked, the human's
answer, the change made), every accepted tension and the human's reason, every
delivery-method decision the human made and which epics it shaped (C12/C13) — and any lens
defects recorded for routing. This checkpoint is always presented and never skippable.
Output the summary and wait for a typed response — approve → persist; anything else →
revise (back to Step 3) or halt with nothing written.

### Phase: Apply

**Step 5 — Persist atomically** · Owner: play · Depends on: Step 4
First **snapshot** the slice folder, the slice record, and the profile (so Step 6 can
prove only `epics/` changed). The snapshot is taken here, at the gated apply step — never
at pre-flight — so a resume can never compare post-apply against post-apply:

```
cp <product_base>/product-os/_spine.yaml <working>/spine-before.yaml
```

Then persist the approved cut additively. `apply_epics.py` writes each `epic.md` into the
slice's `epics/` home and merges the epic entries into the spine `epics` index (additive by
id, replacing only a `ready` epic the cut re-states, never an `in_delivery` one), and writes
NOTHING else — no slice record, lens, functionality, profile, or any spine field outside
`epics`. It is all-or-none: if anything is refused, nothing is written:

```
python3 scripts/apply_epics.py --draft <working>/draft \
        --product-base <product_base> --out-manifest <working>/apply-manifest.json
```

**SE-9 (F7/C9):** this step depends on Step 4's typed approval, and the apply manifest
shows `ok: true` with every approved epic in `written` and `refused` empty — all epics or
none; a refused plan writes nothing and a partial write is rolled back to the snapshot and
re-presented (REC7).

**Step 6 — Verify persisted** · Owner: play · Depends on: Step 5
Prove the persist wrote exactly the approved cut and nothing else:

```
python3 scripts/check_epics.py --manifest <working>/apply-manifest.json \
        --spine-before <working>/spine-before.yaml \
        --spine-after <product_base>/product-os/_spine.yaml \
        --slice-ref <domain>/<slice-id>
```

**SE-10 (F8/C11):** the live spine is byte-identical to its snapshot except the added
`epics` entries — the slice record, the lenses, the profile, and every other spine field
are unchanged, nothing else added or removed; every persisted `epic.md` equals its approved
draft byte-for-byte; any out-of-scope
change is restored from the snapshot and the write re-confined to epics (REC8).

### Phase: End sequence (injected — D2 position: both, tail)

The persisted cut is a durable model change; the standard end sequence closes it — the
same branch the injected `start-change` head opened (#437, decision 24).
Each member runs as a sub-play dispatched with `parent_run_id` (emits only its own C1
evidence; this play's close absorbs it). Each member is independent and resolves its own
context from the branch and config; this play passes no hand-rolled git/PR/merge logic.

**Step 7 — commit-change** · Owner: `commit-change` (sub-play) · Depends on: Step 6 —
commit the persisted epics (and deferrals) grouped by concern with conventional messages;
no push.

**Step 8 — propose-change** · Owner: `propose-change` (sub-play) · Depends on: Step 7 —
run the scope-and-quality self-review, push the branch, open the PR carrying the review.

**Step 9 — review-change** · Owner: `review-change` (sub-play) · Depends on: Step 8 — run
the diff-scoped quality check, post an approve/reject verdict. A reject stops the
sequence before merge.

**Step 10 — merge-change** · Owner: `merge-change` (sub-play) · Depends on: Step 9
(approve verdict) — merge the PR, switch to main and pull, delete the feature branch.

    {
      "play":          "<commit-change | propose-change | review-change | merge-change>",
      "parent_run_id": "<this run id>",
      "inputs":  {},
      "outputs": { "result": "<working>/end/<member>.json" }
    }

**SE-14 (F13):** after the persist is verified, the end sequence ran — `<working>/end/`
holds each member's result in order, starting with `commit-change.json` (the durable model
change did not sit uncommitted waiting on a manual `/commit-change`); a member's own halt
(e.g. a review reject) stops the chain by that member's rules and is visible in its
result, never silent (REC13).

### Phase: Scenario Validation

**Step 11 — Scenario evals** · Owner: play · Depends on: Step 10
- **SCE-1 (S1 — product builder):** the slice's `epics/` holds the approved cut — every
  epic's acceptance names observable user behavior, the apply manifest shows one
  all-or-none transaction, and no stale `ready` epic from an earlier run survives
  (`deleted` in the manifest covers them).
- **SCE-2 (S2 — delivery engineer):** the first epic in the order has no `depends_on`;
  every epic carries persona/systems/scope context plus acceptance; every
  `functionality_refs` entry and the `slice_ref` resolve to existing records.
- **SCE-3 (S3 — product builder under grilling):** the round reports show every tension
  cited (source + verbatim quote) and the session issued no push-back without one.
- **SCE-4 (S4 — product builder):** the coverage check maps every slice functionality to
  ≥1 epic or a deferral with a recorded reason — zero unmapped, zero silent drops.
- **SCE-5 (S5 — product builder, too early):** on an unrealized slice the play halted at
  pre-flight naming the missing stamp or lens files, and wrote no epic.
- **SCE-6 (S6 — lens owner):** any lens defect found while grilling is recorded in
  `<working>/lens-defects.yaml` naming the lens and the tension, the human was routed to
  that lens's play, and the lens files + slice record are byte-identical before and after
  the run.
- **SCE-7 (S7 — product builder, grilled for real):** every non-live tension in the round
  reports carries `pushback.shown_to_human: true` with the push-back text, a
  `human_response` with the human's own words, and a `resolution_directive` (resolved) or
  human-given `resolution_reason` (accepted); the write-gate fails when any is missing;
  the session asked its questions one at a time, plainly, with no recommendation attached.
- **SCE-8 (S8 — product builder, open delivery choice):** every `decision_questions`
  entry carries a citation, the question, and the human's answer; the write-gate fails an
  unanswered one; the checkpoint showed the chosen delivery strategy and the epics it
  shaped. The round reports carry question evidence only under the canonical keys (a legacy
  `questions:` list is aliased to `decision_questions:`, counted, and held to the same
  rules); the decision-question count equals the real number of round questions, and no
  off-schema key let the gate report a clean pass over unchecked evidence (F14).

### Phase: Evidence & Close

**Step 12 — Close** · Owner: play · Depends on: Step 11
Run the Standard Play Close. /grill is a **product-scoped** play (no issue) — use the
product-scoped evidence base and slug. Evidence recording is play-only and config-gated
per the D1 evidence rule (`standards/rules/evidence-recording.md`).

```bash
# --- Standard Play Close (canonical; see standards/rules/play-close.md) ---
# Path tokens resolved at pre-flight (resolve here if not already):
#   ltm_project_target  = yq '.ltm.project-target' .garura/core/config.yaml
#   evidence_base, slug:
#     project-scoped play : evidence_base="${stm_base}${issue}/evidence/grill/" ; slug="#${issue}"
#     product-scoped play : evidence_base="${product_base}_evidence/grill/"     ; slug="${product_slug}"
evidence_template=$(cat "${ltm_project_target}standards/templates/evidence-file.md")
delivery_template=$(cat "${ltm_project_target}standards/templates/delivery-report.md")
ts=$(date -u +%Y%m%d-%H%M%S)
evidence_dest="${evidence_base}${ts}.md"
mkdir -p "$(dirname "$evidence_dest")"
```

`/grill` is product-scoped: `evidence_base="${product_base}_evidence/grill/"` and
`slug="${product_slug}"` (the slice, e.g. `ai-usage-intelligence/slice-token-data-spine`).

**Step C1 — Write evidence file.** Gated by the resolved `evidence.record` flag (global +
per-play `evidence.plays.grill`; first match wins, absent ⇒ record). When false, skip the
write and record `evidence skipped (record=false)` in the report's pointer line. Otherwise
fill the `evidence-file.md` slots (play `grill`, run_id `grill-${ts}`, product_slug = the
slice, started_at/completed_at, status; artifacts produced: the epics, the deferrals, the
round reports with dispositions, any lens-defect records, the apply manifest, the member results (start-change + the end sequence); step and
scenario eval results SE-1…SE-14 / SCE-1…SCE-8; checkpoint decision from Step 4) and write
to `$evidence_dest`. Do NOT hand-author the body.

**Step C2 — Render delivery report.** Fill the `delivery-report.md` slots and output the
report: `## grill Delivered — ${product_slug}`, the Run Summary table, the Pipeline Steps
table from the task DAG, the Artifacts Produced table (the epics with their user_checks
and order, the deferrals, the accepted tensions, any lens defects routed), Next Steps (the cut is merged by the end sequence — run /start on the first epic in the
order to begin delivery; if a lens defect was recorded, run that lens play first), and a pointer to `$evidence_dest`. Always emitted; never gated.

```bash
# --- end Standard Play Close ---
```

## Scenario Validation

| Scenario | Persona | Eval |
|----------|---------|------|
| S1 — the approved cut | product builder | SCE-1 |
| S2 — self-contained pickup | delivery engineer | SCE-2 |
| S3 — cited grilling | product builder under grilling | SCE-3 |
| S4 — explicit deferral | product builder | SCE-4 |
| S5 — too early | product builder | SCE-5 |
| S6 — lens defect routed | lens owner | SCE-6 |
| S7 — grilled for real | product builder | SCE-7 |
| S8 — open delivery choice | product builder | SCE-8 |

## Recovery

| For | Trigger | Direction | Handoff |
|-----|---------|-----------|---------|
| F1 | an epic's acceptance reads as internal completion — no user-observable behavior | regenerate its acceptance from what a user can open and do, merging it with adjacent work until it's testable | autonomous |
| F2 | the realized stamp or lens files are missing | halt; run the missing realize lens plays (quality → ux → agentic → arch → measure → run) first | human |
| F3 | the coverage check finds a slice functionality mapped nowhere | cut an epic for it or record an explicit deferral with reason, then re-present the cut | autonomous |
| F4 | an epic embeds intent or lens content instead of referencing it | replace the copy with a reference to the source record | autonomous |
| F5 | a push-back in the session record carries no citation | withdraw it; re-issue only if a declared item supports it, otherwise drop it | autonomous |
| F6 | live unresolved tensions exist when the write is attempted | block the write; resolve each tension in the cut or record an explicit acceptance, then re-present | autonomous |
| F7 | epics on disk without a recorded approval, or only part of the set written | remove the partial write, restore the pre-run state from the snapshot, return to the checkpoint for a fresh approval | human |
| F8 | the write-guard finds changes outside the slice's epic home | restore every touched file from its pre-run snapshot; confine the write to epics | autonomous |
| F9 | a dependency cycle, or a first epic that can't stand alone | re-order or split epics until the order is acyclic and the first is independently deliverable | autonomous |
| F10 | the self-containment check finds an epic with empty or unresolvable context or acceptance | backfill from the slice's intent records and lenses, re-verify resolution | autonomous |
| F11 | a non-live tension lacks human-response evidence — no push-back shown, no typed answer, or no human-derived directive/reason | reopen the tension to `live`, ask the question plainly (one at a time, no recommendation), capture the typed answer, and disposition from that answer only | human |
| F12 | an epic is shaped by a delivery method the human never chose — a missing or unanswered decision question at the write-gate | ask the cited decision question, capture the choice, revise the cut to match it, and record the decision in the round | human |
| F13 | the persist is verified but no end-sequence member has run — the model change is uncommitted with the play heading to close | enter the injected end sequence (commit → propose → review → merge) before the close; a member's own halt (e.g. a review reject) stops the chain by its own rules, never silently | autonomous |
| F14 | a round report carries question evidence under an unrecognized top-level key (a legacy `questions:` list, or any other off-schema key) | read a legacy `questions:` key as `decision_questions:` and validate it identically; for any other off-schema key, block the write-gate until the round is rewritten under the canonical `tensions:`/`decision_questions:` schema, then re-run the gate | autonomous |
| F15 | an epic at the write-gate has no `surface` block, or a surface defaulted to a non-user-facing type with no human confirmation | source the surface from the slice's own named surface (slice.surface) refined by the epic's user_check per surface-contract.md, put it to the human at the checkpoint, and write it; block the cut until every epic carries a confirmed surface that traces to a slice surface | human |
| F16 | a user-facing slice's first epic scaffolds no app/server shell | rework the order so the first epic seeds a minimal openable shell, or recut so one does, then re-present | autonomous |
| F17 | an epic doc fails the linter or the content eval, or its spine entry fails the schema or names an unknown functionality | re-emit the `epic.md` to its template, rewrite to the judge's cited fixes and re-judge until the gate passes, and fix the spine entry to resolve; never write a degraded epic | autonomous |

## Pause and Resume

Steps run top to bottom. On entry, resolve config, run the readiness + realized gates,
resolve the target slice from the play argument or the in-progress draft, check the status
marker at `{stm_base}_grill/status/<slice-id>.json`, skip completed steps, reset any
in-progress step to pending, and continue. The grilling rounds resume from the round
reports on disk — closed dispositions (`resolved`/`accepted`) are preserved; a round left
mid-flight re-runs its tension check. The pre-apply snapshot is captured at Step 5 (the
gated apply step) and preserved on resume, so the non-destructive comparison always diffs
against true pre-apply state. A fresh start with no marker runs everything and creates the
marker at Step 1.

## Compilation Metadata

| Field | Value |
|-------|-------|
| fingerprint | sha256:d5a82963b7d2082c1792bada65642dcf321bb4252db4cda1fc63b546ca51c98e (of `reference/ice.md`) |
| compiled_by | play-creator (#434; edited via play-editor, #436, #437), edited via play-editor (#434, decision 24; closed-schema round-report fix — F14); epic-lifecycle prose corrected #439 (see deviation note) |

**Direct-edit deviation note (#439, ADR 019):** the epic-lifecycle sentence ("epics are temporary… deleted on merge") was corrected to "epics are permanent… stamped `delivered` on merge and kept" in both `reference/ice.md` and this compiled body, and the fingerprint recomputed to match. This is descriptive context about the epic's downstream life, not grill's own guarantee — no constraint, failure condition, scenario, step, or eval changed; grill still cuts epics and deletes nothing. No re-interview/rebuild required.
| pipeline_position | both (start-change head; commit-change → propose-change → review-change → merge-change tail — self-contained) |
| workflow_structure | A (mandatory, non-skippable checkpoint; grilling rounds as a bounded loop in preparation) |
| domain_agents | 1 (product-os-keeper) |
| utility_agents | 0 |
| skills_used | author-epics, check-cut-tensions |
| scripts | 7 (preflight.py, check_ready_slice.py, lint_grounding.py, grounding_gate.py, validate_epics.py, apply_epics.py, check_epics.py) |
| member_subplays | start-change (injected head); commit-change, propose-change, review-change, merge-change (injected end sequence) |
| step_evals | 18 (SE-1…SE-18; one per failure condition F1–F17, plus SE-11 for C10) |
| scenario_evals | 8 (SCE-1…SCE-8) |
| recovery_entries | 17 (one per failure condition; 12 autonomous / 5 human) |

**Direct-edit deviation note (grill-spine-reconcile):** the recompile left the pre-flight,
apply, and verify prose on the OLD model — it called `check_realized.py` (redundant; the gate
is in `check_ready_slice.py`) and the `functionality_ices`/`ice_ref`/`profile.yaml` field
shapes, and the apply/verify commands used the old `--slice-dir`/`--profile-*` CLIs. These were
aligned to the actual reworked scripts (the spine hub-resolution emitting
`functionality_groundings`; `apply_epics.py --draft --product-base` merging the spine `epics`
index; `check_epics.py --manifest --spine-before/after --slice-ref` doing the before/after spine
diff) and `check_realized.py` was deleted. Execution-mechanism only — no constraint, failure,
scenario, or eval changed; the ICE (`reference/ice.md`) and the fingerprint are unchanged.
