---
name: play-creator
description: >
  Compile a deterministic "play" (a multi-step, gated workflow recipe) from an
  intent. Interviews for the intent triple, generates the expectation, identifies
  the skills, scripts, and agents the play needs, selects a workflow structure, generates
  evals, and emits a compiled play (a SKILL.md plus bundled scripts for its mechanical
  work). Use this whenever the user wants to create, build, compile,
  or review a play — or says "create a play", "new play", "compile this into a play",
  "play-creator", "turn this intent into a play", or "review my play for gaps" —
  even if they don't say the word "play" explicitly but are describing a repeatable,
  multi-step, checkpoint-gated workflow they want captured as a runnable recipe.
user-invocable: true
model: best
---

# play-creator

The play compiler for garura. It takes an **intent** and produces a
compiled, deterministic **play** — a `SKILL.md` (plus a `scripts/` folder for its
mechanical work) whose pre-flight checks, task graph, step order, eval criteria, and
recovery are all baked in, so running the play later requires no re-planning.

This skill is deliberately self-contained: it runs the whole pipeline itself
rather than dispatching to separate builder agents. It is lean to *operate*; the
play it *produces* is full-featured. Keep that split in mind — simplifying the
generated play is under-delivering; adding runtime plumbing to this skill's own
operation is over-building.

Following the harness-led principle — the skill decides, scripts execute — the
**mechanical** checks (coverage counting, orphan detection, fingerprinting) are
offloaded to a bundled script, `scripts/lint_play.py`. Spend tokens on judgment, not
on counting the model can get wrong.

**Hold the play you build to that same standard.** When a step in the play you're
compiling does mechanical, deterministic work — parsing, counting, validating, formatting,
a fixed file transform, hashing — generate a small script for it and have the step *call*
the script, instead of spelling the work out as prose the play re-reasons every run. Keep
judgment (decisions, generation, anything needing context) in the step's prose. So a
compiled play is normally a **folder** — `SKILL.md` plus a `scripts/` folder for its
mechanical work (and `references/` for anything it reads) — not a lone file. Only a
pure-judgment play with no mechanical work stays a single `SKILL.md`. This is the same
move you just read about this skill, applied one level down: every play this compiler emits
should itself be harness-led.

## The mental model: ICE

A play is compiled from a clean **ICE** triple:

- **Intent** — the implementation-agnostic core: a one-line goal, a list of
  **constraints** (rules the play must respect), and **failure conditions** (what
  makes the play's outcome wrong). No tools, no file paths, no step-by-step how.
- **Context** — the surrounding grounding the play draws on (relevant memory,
  prior art, the shape of the codebase it acts on). Often light for simple plays.
- **Expectation** — generated from the Intent: **success scenarios** (per-persona,
  given/then/measure) and exactly one **recovery** entry per failure condition.
  Generated, never hand-authored — hand-authoring scenarios is the pattern ICE rejects.

The compiler's job is to turn that triple into a deterministic recipe and to prove,
via a coverage check, that every constraint, failure condition, and scenario is
enforced by some concrete mechanism in the output.

## Roles & handoffs — how every play you build is wired

A play this compiler builds always uses the same roles and one handoff mechanism. Bake
this in; it is not optional.

- **Play — the orchestrator.** It owns the workflow and the step order, and does no domain
  work itself. It hands work out and routes the results.
- **Subagent — context and assurance.** A subagent gathers the context a piece of work
  needs *before* it runs and checks that what came back is *right* after. It bookends the
  work; it does not do the building.
- **Skill — the worker.** Skills are where the actual work happens — build, generate,
  transform, produce the artifact.
- **Script — the mechanical hand.** Deterministic work (parse, count, hash, validate) a
  step calls directly, per the principle above.

**The handoff is always a JSON contract — never inline prose or pasted data.** Play →
subagent → skill and back, every hop passes a JSON contract. The real outputs are written
to **files on disk**; the contract carries the *paths*, not the contents. A hop says, in
effect, "your inputs are these files, write your output here," and returns "done — the
output is at this path." The bytes live on disk; the contract moves the references. (A
script a step calls directly follows the same disk discipline — paths in, files out.)

That is why a subagent never returns a wall of prose and a skill never takes a prose
prompt: the wiring is files + contracts, so any step can be resumed, re-run, or handed off
without re-deriving anything.

## Structural gate (do this first)

Before anything else, decide whether the requested play has enough structure to
compile. A play is compilable when its intent defines **at least one constraint and
at least one failure condition**, and it has (or can generate) **at least one success
scenario**. If the user only has a vague wish with no constraints and no failure
modes, it is structureless — do not invent a play. Say what's missing and help them
pin down: what must always hold (constraints) and what would count as the play
getting it wrong (failure conditions). Then proceed.

Ideas that describe runtime-assembling workflows, dynamic intent resolution, or
self-modifying DAGs are out of scope — this compiler produces *static, deterministic*
plays only. Acknowledge and redirect; don't reject outright.

## Identity & mode

Ask for (or infer) the **play name** and check whether `intent`/`SKILL.md` already
exist for it.

| State | Mode | What happens |
|-------|------|--------------|
| Nothing exists | **new** (default) | Build from scratch: gather intent → compile |
| Intent exists, no play | **new** | Skip the interview, compile from the existing intent |
| Both exist, user wants a check | **review** | Diagnose gaps only — **read-only, never modify** |

Review mode is the one exception to "this skill produces a play" — it produces a
gap report and stops. See [Review mode](#review-mode-read-only) below.

## Pipeline (new)

Run these in order. Each step's output feeds the next.

This pipeline is interactive by default — it interviews and asks for approval. If you're
running it without a reachable human (an automated or test run), don't block: state your
assumptions explicitly at each interview and approval point, record that approval was
assumed, and proceed.

### 1 — Intent (the clean triple)
Interview the user (or read an existing intent) and write the triple: a one-line
`intent`, a numbered list of `constraints` (each with an id like C1 and a rule),
and a numbered list of `failure_conditions` (each with an id like F1 and a condition).
Keep it implementation-agnostic — strip any mention of specific tools, technologies,
file paths, or ordered how-to steps; those belong in the compiled play, not the intent.
Present it back and get explicit approval before moving on.

### 2 — Expectation (generate, then confirm)
From the approved intent, generate the expectation:
- One or more **success scenarios**, each with an id (S1…), a persona, a `given`,
  a `then`, and a binary-testable `measure`.
- Exactly **one recovery entry per failure condition** (F1→REC1, …), each naming the
  trigger symptom, the corrective direction, and a `handoff` of `autonomous` (the fix
  can loop back without a human) or `human` (needs a person to decide).
Derive these from the intent — do not ask the user to write them. Present the generated
expectation for a quick approve/revise.

### 3 — Skills, scripts & agents the play needs
From the intent, work out what the play actually has to *do*, and split each piece of work
by its nature — this split is where the token savings live:
- **Scripts** — bundled programs for the **mechanical, deterministic** actions (parse,
  count, validate, transform, hash, format, threshold/precedence logic). The step calls
  the script; the script does the work. Prefer a script for anything a script can do
  reliably. **Two hard rules for scripts:**
  - **Layer boundary — a script computes/asserts over state already captured to disk; it
    NEVER shells out to git/gh/network or any external system.** Live VCS/host/issue/PR
    work belongs to a skill invoked through an agent (the worker layer). The pattern is:
    the skill/agent step captures the live state to a file, then a later script asserts
    over that file. If an assertion needs state no prior step captured, either have the
    capturing step record it, or leave that check as prose — do not bolt git/gh into a
    script.
  - **Don't put deterministic logic on an LLM.** If a step's work is a fixed rule — a
    threshold verdict, a precedence/most-specific-wins resolution, a table-driven
    classification, a count or a diff-scope check — it is a script, not an agent or
    re-reasoned prose. Assigning such work to a subagent is a harness-led failure; flag
    and convert it.
- **Skills** — where the actual work happens: build, generate, transform, produce the
  artifact.
- **Subagents** — gather the context a skill needs and verify that what the skill produced
  is right; they bookend the work, they don't do it. Add one only when the work genuinely
  needs gathered context or an independent correctness check.
For each, note whether it already exists or must be created. Remember the handoffs are JSON
contracts over files on disk (see **Roles & handoffs** above). **Short-circuit rule:**
if a piece's only output is something derivable deterministically from context (a
branch name, a path, a config value), don't spawn an agent for it — the play computes
it inline. Audit every agent the play will use against the 11 agent principles in
[`references/agent-audit.md`](references/agent-audit.md) (P1–P11); list any that fail
so the user can fix or drop them. A fully deterministic play — pure git, file, or
config operations the play can compute itself — may legitimately need **zero agents**.
That is correct, not a gap. The compiled-play example uses agents, but yours need not;
don't invent an agent just to match the template.

### 4 — Workflow structure
Pick the shape that fits the work. The four structures (full-checkpoint A, fast B,
chained C, readiness-only) and when each applies are in
[`references/workflow-structures.md`](references/workflow-structures.md). Derive the
play's **pre-flight checks** here too: every constraint that is really an environmental
precondition ("must be on a feature branch", "config must exist") becomes a pre-flight
check with an action-on-failure (hard halt, graceful exit, or hard block).

**Pre-flight resolver (harness-led — emit it).** The deterministic part of pre-flight is
not orchestrator inference. Stamp the canonical resolver into the compiled play at
`scripts/preflight.py`, copied verbatim from
[`references/preflight.py`](references/preflight.py), and have the Pre-flight phase **call
it** instead of resolving facts in prose. It parses config for the path tokens + the
resolved `evidence_record` (per-play override → global → true), extracts the issue from the
branch, and reports `on_default_branch` and `changes_present` — returning one JSON object.
The orchestrator captures the only two live reads (`git branch --show-current` and `git
status --porcelain`) and passes them in (`--branch`, `--porcelain-file`); the script never
shells out to git/gh (layer rule). The Pre-flight **table keeps only the policy** — which
fact maps to a hard halt / graceful exit / hard block, which differs per play (e.g.
`changes_present == false` is a graceful exit for `commit-change` but a *clean-tree*
precondition for `propose-change`). Live host checks that need git/gh state (open-PR,
mergeability, worktree presence) stay in the skill/agent layer, never the resolver. A
purely interactive play with no environmental pre-flight may omit it; anything that resolves
config/branch/issue/changeset must use it.

### 4b — Pipeline position (D2)
Read the play's declared `position` (frontmatter: `start | end | both | none`, default
`none`) and fold in the standard delivery machinery per
[`standards/rules/pipeline-position.md`](../../memory/standards/rules/pipeline-position.md):

- **start** → prepend a first step that runs the `start-change` sub-play (resolve/create
  the issue, cut the branch off fresh main, optional worktree, init STM).
- **end** → append the end sequence as ordered closing steps, before Evidence & Close, in
  order: `commit-change` → `propose-change` → `review-change` → `merge-change`.
- **both** → both of the above, bracketing the play's own work (the self-contained
  "start, do everything, close the loop" shape).
- **none** → inject nothing (strategic/model-building and standalone plays).

Inject as **explicit, named sub-play steps** wired as JSON contracts over files on disk
and dispatched with `parent_run_id` (sub-play evidence convention, `play-close.md`), woven
into the Task DAG — `start-change` at the head, the four end plays as the closing chain
(each `blockedBy` the previous) right before the Evidence & Close step. Never collapse the
end sequence into one opaque step. The six **member** plays (`start-change`;
`commit-change` / `propose-change` / `review-change` / `merge-change`) are the building
blocks: never inject a sequence into one of its own members, and never let a consumer play
hand-roll issue/branch/PR/merge steps that duplicate a member — those come only via
injection.

### 5 — Evals
Generate the checks that prove the play works. Do not hand-wave these — each must be
objectively checkable:
- **Step evals (SE-n)** — one or more per **failure condition** and per
  *artifact-verifiable* constraint, placed right after the step they validate. Each
  cites its source: `SE-1 (F1/C3): <check>`.
- **Scenario evals (SCE-n)** — one per **success scenario**, sourced from that
  scenario's `measure`: `SCE-1 (S1 — <persona>): <check>`.
First **classify every constraint** into one of three buckets, because the bucket
decides how it's enforced:

| Bucket | Meaning | Enforced by |
|--------|---------|-------------|
| pre-flight | environmental precondition checkable before work | a pre-flight check |
| artifact-verifiable | observable property of an output | a step eval (SE-n) |
| structural | a rule about the play's own shape | the play structure itself |

### 6 — Compile the play
Emit the play. If it has mechanical steps, emit a **folder** — `<play-name>/SKILL.md` plus
`<play-name>/scripts/` for the scripts those steps call (and `references/` for anything it
reads); a pure-judgment play can be a single `SKILL.md`. Write each mechanical step's
script into `scripts/` and have that step invoke it by relative path — don't also inline
the logic the script now owns. **Unless the play has no environmental pre-flight, stamp the
canonical `scripts/preflight.py` (copy `references/preflight.py` verbatim) per step 4 and
wire the Pre-flight phase to call it.** Wire every step that dispatches to a subagent or skill as a
**JSON contract**: it names the input file paths and the output file path, the piece writes
to disk and returns the path, never inline data (see the worked example). The `SKILL.md` is
a **full compiled play** and must carry every required section — match the worked example in
[`references/compiled-play-example.md`](references/compiled-play-example.md):

Frontmatter (incl. the `position` field — D2) · Header · Compiled-From notice · Role +
agent boundaries · Pre-flight · Task DAG (a `TaskCreate` per step with `blockedBy`,
including any injected start/end sub-play steps per step 4b) · Workflow (steps grouped by
phase, each with owner, dependency, and its step evals; with the position-injected
`start-change` / end-sequence steps shown explicitly by name) · Scenario Validation ·
Recovery (one entry per failure condition) · Pause-and-Resume · Compilation Metadata.

Determinism rules for the output: steps are sequential with named phases (no runtime
reordering); the task DAG is baked in; nothing is resolved "at runtime". Record a
content fingerprint of the intent + expectation in the metadata so later drift is
detectable and forces a fresh compile. Compute it mechanically — run
`shasum -a 256` over the intent + expectation text and paste the digest. Don't invent a
hash; the model can't compute one in its head, so a made-up fingerprint is worse than none.

### 7 — Verify coverage (run the linter)
Don't hand-count this — it burns tokens and the model miscounts. Run the bundled script
on the play you just wrote:

```
python3 scripts/lint_play.py <path-to-the-compiled-play>
```

It mechanically checks the wiring: every constraint/failure/scenario is covered by its
eval, exactly one recovery per failure, no orphan references, all required sections
present, and a real (non-placeholder) fingerprint. It prints a PASS/GAP report and exits
non-zero on any gap. For each GAP, fix the wiring — add the missing eval, write the
missing recovery, reclassify the constraint — and re-run until it's clean. The script
counts; the fix is still yours.

The linter checks an eval *exists*, not that it is *meaningful* — that part stays with
you. In particular it can't see one thing: every eval must be **executable from what
earlier steps actually capture**. If a step eval inspects data — a commit tip, a file
list, a prior value — that no earlier step recorded, the eval can't run. The fix is to
make the earlier step capture that input, not to weaken the eval.

## Review mode (read-only)

When asked to review an existing play, report gaps — **change nothing**.

Start with the linter; it does the mechanical half for free:

```
python3 scripts/lint_play.py <path-to-the-play>
```

That covers coverage, one-recovery-per-failure, orphan references, required sections, and
whether the fingerprint is real. Then add the judgment-only checks the script can't make:

- Every agent the play references actually exists, and every skill it names exists.
- Every agent passes the 11 principles in [`references/agent-audit.md`](references/agent-audit.md) (P1–P11).
- The fingerprint still *matches* the current intent + expectation — recompute it with
  `shasum -a 256` and compare. The linter only confirms the fingerprint is real, not that
  it's current.
- The evals are meaningful and executable, not merely present.

Present a short PASS/GAP table combining the linter's findings and yours, then stop. If
the user wants the gaps fixed, they correct the intent and re-run the skill (or use
`play-editor`).

## Hard rules

- Never build a structureless play — name what's missing and stop.
- Never produce a play that resolves its DAG or intent at runtime — compiled plays
  are static and deterministic.
- Never hand-author scenarios or evals to "fill in" — generate scenarios from the
  intent and evals from constraints/failures/scenarios, so they actually trace back.
- Never simplify the *generated* play below the required sections — full output is the
  whole point.
- Build plays the harness-led way — a step's mechanical work goes into a bundled script
  the step calls, not into prose the play re-reasons each run; judgment stays in prose.
- Always emit the pre-flight resolver (unless the play has no environmental pre-flight) —
  stamp `scripts/preflight.py` from `references/preflight.py` and have the Pre-flight phase
  call it; never leave deterministic config/branch/issue/changeset resolution as
  orchestrator prose or inference. The Pre-flight table keeps only the halt policy.
- Wire every play you build as JSON-contract handoffs over files on disk — play
  orchestrates, subagents gather context and verify, skills do the work. No piece does
  another's job, and no piece passes inline data where a file path belongs.
- Never modify any file in review mode.
- Always honor the declared `position` (D2): inject `start-change` for `start`, the
  `commit-change → propose-change → review-change → merge-change` end sequence for `end`,
  both for `both`, nothing for `none` — as explicit named sub-play steps, never an opaque
  one-liner, and never injected into a member play itself
  (`standards/rules/pipeline-position.md`).
- Always classify constraints before generating evals; always run the linter
  (`scripts/lint_play.py`) and clear every gap before declaring the play done.

## Direct-edit deviation note (#434)

play-creator (formerly create-play) is the compiler bootstrap — it has no `intent.yaml`,
so all changes to it are direct edits by definition. Brought over from the sudarshan
harness and renamed to play-creator (companion: play-editor). Taught the D2 pipeline-position
rule: step **4b** and a hard rule inject `start-change` (position `start`) and the
`commit-change → propose-change → review-change → merge-change` end sequence (position `end`)
per `standards/rules/pipeline-position.md`. D1 (evidence) needs no compiler change — plays
emit it via the referenced Standard Play Close. `scripts/lint_play.py` gained the D1 (close
anchors) and D2 (valid `position` frontmatter) checks. Non-intent change.

**Pre-flight resolver (#434).** Added the harness-led pre-flight rule: step **4**, a hard
rule, and the step-6 output note now require stamping the canonical
[`references/preflight.py`](references/preflight.py) into each compiled play at
`scripts/preflight.py` and wiring the Pre-flight phase to call it (config/branch/issue/
changeset resolution is a script returning JSON facts; the play keeps only the halt policy;
the script never shells to git/gh — the orchestrator passes the two live reads in).
`scripts/lint_play.py` gained a non-breaking check: if a SKILL's pre-flight references
`scripts/preflight.py`, the file must exist. The five member plays were back-filled by
direct edit (each carries its own deviation note). Non-intent change.
