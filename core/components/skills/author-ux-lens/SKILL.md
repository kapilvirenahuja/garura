---
name: author-ux-lens
description: Author a shaped slice's UX lens as an MD grounding doc — the screens (with low-fidelity layouts), the flows that EXPAND the slice's journey records onto those screens (one flow per journey, never an invented one), the states each holds, and the product's visual core (the semantic state vocabulary, its tone map, and the design-system reference the look comes from — never a chosen palette or typography) — from the slice's hub (its functionalities' grounding docs + the spine profile + the slice's persona and journey records) and KB pattern grounding. Also draws the slice as a wireframe record, `lens/screens.yaml` (personas, surfaces, journeys, screens with moments/regions/states/invariants, vocabulary, color rule, open questions), written straight to the live model beside ux.md; a bundled script renders `lens/wireframes.html` from it afterwards — this skill never writes the HTML. Writes both per-node artifacts STRAIGHT TO THE LIVE MODEL and emits the visual-core decision, any design-directive decisions, plus the grounding map as structured data in a manifest; it NEVER writes a shared model file (the spine _spine.yaml, the profile, or a decisions/*.yaml). Reads the functionality.md docs for the hub, never another lens. Generative artifact production for the /ux play under direct-model-write (ADR 026).
version: 0.5.0
user-invocable: false
model: opus
allowed-tools: Read, Write, Bash, Glob
---

# author-ux-lens

Turns a shaped slice's **hub** — the grounding docs of the functionalities it bundles, the
product profile, plus the slice's **persona and journey records** — into the slice's **UX lens**,
written as the grounding doc `ux.md`: the screens that make every functionality visible, the
flows that expand the slice's journey records onto those screens, the states each screen holds,
and the product's visual core — the semantic state vocabulary, its tone map, and the
design-system reference the real look comes from (or an explicit "none yet"). It also draws the
slice as the wireframe record `lens/screens.yaml`, the machine-readable half of the wireframes a
bundled script renders into `lens/wireframes.html` afterwards. It anchors the intended experience;
it is not a full spec. It reads the hub only (never another realize lens).

**Write discipline (ADR 026, `standards/rules/direct-model-write.md`).** This skill writes
ONLY the per-node artifacts `ux.md` and `lens/screens.yaml`, **straight to the live model** in
place. It does NOT write any shared model file — not the spine `_spine.yaml`, not the profile,
and not a `decisions/*.yaml`. It also never writes `lens/wireframes.html` — that is the bundled
render script's job, run after this skill. The visual-core decision, and any design-directive
decisions, are emitted as **structured data in the manifest** (`decision_delta` entries); the
play's deterministic keyed persist script (`persist_ux.py`) writes those decisions in place,
keyed to the slice and `skip-if-exists`. There is no draft tree.

## What it produces (against the locked template)

`ux.md` conforms to `standards/schemas/product-os/grounding/lens/ux.md` — H1 `# UX Lens`,
sections **Intent**, **Screens** (each: name + who opens it + the one object the user works
with there + low-fidelity layout in prose), **Flows** (one block per journey record of the slice — its persona + goal), **States**
(per screen, each state named with its trigger), **Visual core** (the semantic state vocabulary
and its tone map, the rule that a state word always prints alongside its colour, and the
design-system reference the look comes from — or an explicit "none yet"; never a chosen palette
or type scale), in that order. It must clear the linter (shape) and the content-quality eval (the
play runs both).

Alongside the doc it writes `lens/screens.yaml` — the wireframe record: the slice's personas,
surfaces, journeys, and screens (each with its moments, regions, states, and invariants), the
shared vocabulary and colour-role map, and any open questions. A bundled render script (not this
skill) turns that record into `lens/wireframes.html` afterwards.

It also writes a structured `ux-manifest.yaml` (an STM, non-model artifact) carrying the
machine-checkable grounding the prose can't — which screen grounds to which functionality, the
visual-core grounding, any design-directive grounding, and the decision deltas (visual core plus
any design directives) for the keyed persist to write.

## Input

| Field | Required | Description |
|-------|----------|-------------|
| `slice_ref` | yes | `{domain}/{slice-id}` — display reference and the persist key. |
| `slice_file` | yes | Path to the live slice record (read-only — for the functionalities list it bundles). |
| `functionality_groundings` | yes | Paths to each functionality's `functionality.md` grounding doc (the hub, resolved by `check_ready_slice`). Read these for intent/behavior — NOT `ice.yaml` (retired). |
| `profile` | yes | The product profile (from the spine) — conditions + surfaces. Read-only. |
| `readiness` | yes | Path to `readiness.json` — the resolved hub the play's readiness gate handed over (functionality groundings + `personas[]` + `journeys[]`). Read-only. |
| `personas` | yes | The slice's persona records as `{id, path, name}` entries. Open the record file at each `path` — it says who the person is and what they need. |
| `journeys` | yes | The slice's journey records as `{id, path, persona_ref, surface_refs, step_count}` entries. Open the record file at each `path` — it carries the persona and the ordered steps each flow expands. |
| `kb_search` | yes | Path to the KB search script, for pattern grounding. |
| `kb_root` | yes | Path to `knowledge/`, to resolve learning ids. |
| `product_base` | yes | Product model root — the LIVE write target (and to reuse an existing visual-core decision). |
| `lens_rel` | yes | Relative path of the live lens: `product-os/{domain}/slices/{slice}/lens/ux.md`. Write `ux.md` here, in place. |
| `screens_rel` | yes | Relative path of the live wireframe record: `product-os/{domain}/slices/{slice}/lens/screens.yaml`. Write it here, in place, beside `ux.md`. This skill writes only the record — the bundled render script writes `lens/wireframes.html` from it afterwards. |
| `manifest_path` | yes | Output path under STM for `ux-manifest.yaml` (grounding map + decision deltas + proposals). |
| `stm_base` | yes | From config. |

## Process

Reasoning (drawing screens, drawing flows, enumerating states, choosing the visual core) is
yours. Template conformance, grounding, and coverage are non-negotiable.

1. **Read the hub.** Load each functionality's `functionality.md` (its behavior, acceptance,
   boundary) and the profile box (stage / users / surfaces). Also load every persona and journey
   record at the handed-over `personas[].path` / `journeys[].path` — they are part of the hub.
   Do NOT read any other lens.
2. **Draw the screens.** For each functionality of the slice, the screen(s) that make it
   visible — a name, WHO opens it, THE ONE OBJECT the user works with there, and a LOW-FIDELITY
   layout in prose (regions and what each holds). The one object carries the information
   architecture; there is no separate IA section. Never pixel design. Every functionality the
   slice bundles must be visualized by at least one screen (coverage).
3. **Draw the flows — EXPAND the journeys, never invent one.** One flow per journey record of
   the slice, and NEVER a flow without a journey behind it. Every journey handed over must be
   drawn; an undrawn journey fails `validate_ux.py`.

   The journey record already is the flow — /shape wrote it. Take from it:
   - **Persona** — resolve the journey's `persona_ref` against the handed-over persona records
     and read that record for who they are and what they need. The persona is the one the
     JOURNEY names; never pick a different one, and never invent one. The validator checks the
     flow's persona id against the journey's own `persona_ref` — a mismatch is an error.
   - **Goal** — the journey's `name`, stated as what the person is trying to achieve, plus what
     the persona record says they need.
   - **Entry** — where the journey starts: the surface the journey's `surface_refs` name, and
     the screen on it the person opens first.
   - **Steps** — the journey's ordered steps, each mapped onto the screen it happens on plus the
     action taken there. You may split one journey step into several screen moves, but every
     journey step must appear, in the journey's order — count your steps against the journey's
     `step_count` before you finish. If a journey step has no screen it happens on, the
     **Screens section is incomplete** — go back and add the screen. Do NOT drop the step.

   What the journey does NOT carry, and you add: **Decisions** (each fork named, AND where EACH
   branch goes), **Failure** (what happens when a step fails), **Exit** (where the person lands).

   Keep the field order FIXED so a UX researcher can read it and an agent can parse it:
   **Persona**, **Goal**, **Entry**, **Steps**, **Decisions**, **Failure**, **Exit**. Do NOT add
   a `Journey:` field to `ux.md` — the journey id travels in the manifest (see step 8).

   Cover only the path INSIDE this slice's screens — the wider cross-product journey is not this
   lens's job. Then check: every step names a screen that exists in Screens, and every screen is
   named by at least one step. If a screen is reached by no flow, add the flow that reaches it or
   drop the screen.
4. **Enumerate the states.** For each screen, the states it can hold (loading, empty, error,
   partial, populated). Name each state with its TRIGGER (what puts the screen in it), what the
   user sees in it, and what they can do next. Not a flat list of labels.
5. **Fix the visual core — meaning, not a look.** You never pick a palette or a type scale. You
   fix three things instead:
   - The **semantic state vocabulary** — the closed set of state words the slice's screens use,
     each carrying one of four tones (ok / warn / bad / neutral) and a plain statement of what it
     means. Ground it the same way as any UX pattern choice — a KB technology/architecture
     learning matched via `kb_search`, or a recorded KB-learning-gap proposal.
   - The **word-alongside-colour rule** — restate it: a state word always prints next to its
     colour, never replaced by it.
   - The **design-system reference** — the name of the design system the real look comes from and
     where it lives, read from the product profile or an existing product decision. If none
     exists yet, say so plainly and say why — never invent one to fill the gap.

   If the product already carries a visual-core decision (check under `product_base`), REUSE it —
   name it in the manifest and emit NO new `decision_delta` for it. Otherwise emit the decision as
   manifest data (`kind: visual-core`) for the keyed persist to write (do NOT write the decision
   file yourself).
6. **Record any design directives.** Designing this slice may also have settled things that are
   not visual but that the technical design must inherit rather than rediscover — how a person's
   permission to act is modelled, what a value the screens depend on needs a schema for, what is
   deliberately out of scope. Each one you actually settled becomes its own slice-level decision
   (`kind: design-directive`) naming the play(s) downstream that read it (`binds`, e.g. `arch`,
   `implement`). Record only what the design genuinely settled — a run may settle none, one, or
   several; never manufacture one to fill a slot, and never leave a settled thing sitting only in
   `ux.md` prose.
7. **Draw the wireframe record.** Author `lens/screens.yaml` — the judgment half of the
   wireframes. It carries: `spec` (slice_ref, issue, authored_by, date, and the design-system
   reference or "none yet" from step 5); `personas` and `surfaces` (medium each surface runs on,
   and why); `journeys`, each with its ordered `steps`, and each step's `covered_by` list naming
   the exact `<screen>.m<moment>` ids that satisfy it — **the binding to a journey lives here,
   through the journey, never as a field on the screen**. A step no moment covers still gets a
   non-empty `gap` string — write the honest gap, never drop the step and never leave it silent.
   For every screen already drawn in step 2, add its `moments` (a sequential, numbered walkthrough
   — what the person sees, does, and why each visible detail is there, plus the literal frame
   body: a terminal screen's printed lines, or a web screen's blocks of labelled content), its
   `regions`, its `states` (each state's tone drawn from the visual core's map — never a tone
   outside it), and its `invariants`. Close with the shared `vocabulary` (word/tone/means),
   `color_rule` (the tone-to-role map from step 5), and any `open_questions`. Frames carry real
   labels and real sample content — never an invented palette, type scale, or component library;
   the render script (not this skill) turns this record into `lens/wireframes.html` afterwards.
   Moments are numbered per screen so adding one renumbers nothing else.
8. **Write the lens, the wireframe record, and the manifest.** Write `ux.md` to the LIVE lens path
   (`product_base` + `lens_rel`), per the template. Write `lens/screens.yaml` to the LIVE path
   (`product_base` + `screens_rel`), per step 7's schema. Write `ux-manifest.yaml` to
   `manifest_path` (STM) carrying: every screen's `grounds` → a functionality_ref / persona /
   journey; every flow's `journey_ref` (the journey it expands) and `persona_ref` (the persona id
   that journey serves), its `grounds` → the persona/journey of the hub it traces to, plus its
   ordered `steps`; the visual core's grounding → kb or the reused decision; every design directive
   recorded in step 6, with its `binds`; and, for each new decision needed (visual core and/or
   design directives), a `decision_delta` entry (id, `kind`, `binds` where applicable, the
   slice-scoped `rel`, and the full `record` body). Write any KB proposals under an STM proposals
   folder. Write NO shared model file — never `_spine.yaml`, never the profile, never a
   `decisions/*.yaml`, and never `lens/wireframes.html`.

## Output

```
LIVE (in place, under product_base):
  product-os/{domain}/slices/{slice}/lens/ux.md            # the UX lens grounding doc
  product-os/{domain}/slices/{slice}/lens/screens.yaml      # the wireframe record (this skill's other live write)

STM (non-model):
  {manifest_path}                                           # ux-manifest.yaml — grounding map + decision deltas
  {stm}/proposals/<gap>.yaml                                # KB-learning-gap proposals (only if gaps)
```

`lens/wireframes.html` is written later by the bundled render script from `screens.yaml` — this
skill never produces it.

`ux-manifest.yaml`:

```yaml
ux:
  slice_ref: token-dash/slice-trusted-coverage
  screens:
    - name: "Source coverage view"
      grounds:
        - { source_type: functionality, source: "func-source-coverage-freshness", functionality_ref: func-source-coverage-freshness }
  flows:                                          # one entry per journey record of the slice
    - id: flow-analyst-confirm-coverage
      journey_ref: journey-analyst-confirm-coverage   # the journey record this flow EXPANDS
      persona_ref: persona-analyst                # the persona ID that journey serves
      persona: "Analyst"                          # display NAME, not an id — the id is persona_ref
      goal: "Confirm every source is fresh before trusting the dashboard"
      grounds:                                    # the hub persona/journey the flow traces to
        - { source_type: journey, source: "journey-analyst-confirm-coverage", journey_ref: journey-analyst-confirm-coverage }
        - { source_type: persona, source: "persona-analyst", persona_ref: persona-analyst }
      steps: ["Source coverage view", "Source detail"]   # ordered; exact screens[].name values
  design_system:                                  # the visual core grounding — vocabulary + tone map + reference
    source_type: decision                         # kb | decision
    decision: dec-visual-core-token-dash
  design_directives:                              # settled non-visual things the technical design must inherit
    - id: dec-permission-model-token-dash
      binds: [arch, implement]                    # downstream play(s) that read this directive
      summary: "Access is modelled per-source, not per-dashboard"
  decision_delta:                                 # one entry per NEW decision; OMIT entirely when none is new
    - id: dec-visual-core-token-dash
      kind: visual-core                           # visual-core | design-directive
      rel: product-os/token-dash/slices/slice-trusted-coverage/decisions/dec-visual-core-token-dash.yaml
      record:                                     # the full decision YAML body the keyed persist writes
        id: dec-visual-core-token-dash
        kind: visual-core
        level: slice
        status: accepted
        # … vocabulary, tone map, design-system reference, grounding …
    - id: dec-permission-model-token-dash
      kind: design-directive
      binds: [arch, implement]
      rel: product-os/token-dash/slices/slice-trusted-coverage/decisions/dec-permission-model-token-dash.yaml
      record:
        id: dec-permission-model-token-dash
        kind: design-directive
        binds: [arch, implement]
        level: slice
        status: accepted
        # … the settled thing, and why …
  choices:                                        # KB-grounded pattern choices — NEVER EMPTY
    - id: navigation
      grounds:
        - { source_type: kb, source: technology/single-column-task-surface }
    - id: responsive
      grounds:
        - { source_type: proposal, source: <working>/proposals/responsive-terminal-gap.md }
```

Return the enriched contract with the live `lens_rel`, the live `screens_rel`, and the
`ux-manifest.yaml` path — paths, never inline content.

## Rules

- **Hub only.** Derive from the functionalities' grounding docs + the profile + the slice's
  persona and journey records; never read or ground on another realize lens.
- **Template-true.** `ux.md` conforms to the UX lens template (Intent/Screens/Flows/States/
  Visual core, in that order) and must clear the linter + the content eval — every item
  self-explaining. The written Flows block stays the SEVEN fields — Persona, Goal, Entry, Steps,
  Decisions, Failure, Exit. Do NOT add a `Journey:` line to `ux.md`: the journey id travels in
  the manifest (`journey_ref`), so the template and the structural linter never change.
- **Every flow expands a journey.** A flow with no journey record behind it is INVALID, and
  every journey of the slice must be expanded by a flow — a journey the lens left undrawn fails
  `validate_ux.py`. One flow per journey, persona taken from the journey's `persona_ref`.
- **Four things only, in `ux.md`.** Screens, flows, states, visual core. No accessibility (that is
  the marketing lens now), no gates/components/environments, no journey that leaves this slice's
  screens.
- **Flows resolve both ways.** No flow step may name a screen that is not in Screens, and no
  screen may be unreachable — every screen is named by at least one flow step. Fix the flow or
  drop the screen; never ship a dangling name either way.
- **Cover every functionality.** Every functionality the slice bundles is visualized by ≥1
  screen, recorded in the manifest.
- **`choices:` is never empty, and never carries the visual core.** The manifest's `choices:`
  block is the KB-grounded pattern choices — the navigation pattern and the responsive strategy.
  Each one grounds on a matched KB learning or a recorded gap proposal; an empty block fails
  `check_kb_grounding.py` and halts the run. The visual core is NOT a choice in this block: this
  skill no longer picks a look, so there is nothing here to ground. It names the project's
  design-system reference in the lens instead, or records that none exists yet — and that is never
  a KB gap, because no shelf can tell a project what its brand is.
- **Grounded, not invented.** Every screen grounds to a functionality or a persona/journey;
  every flow names the `journey_ref` it expands and the `persona_ref` that journey serves, both
  resolving to records the readiness check handed over, never an invented one; the visual core's
  vocabulary grounds to a KB learning or a proposal, and both it and any design directive are
  recorded as decisions.
- **Visual core is meaning, never a look.** It never picks a palette, a type scale, spacing, or a
  component library. It fixes the semantic state vocabulary and tone map, restates the
  word-alongside-colour rule, and names the design-system reference the real look comes from — or
  says plainly that none exists yet.
- **Design directives are recorded, not left in prose.** Anything the design settled that the
  technical build must inherit — permission modelling, a value needing a schema, a deliberate
  out-of-scope — becomes its own `kind: design-directive` decision naming what it `binds`. Record
  only what was actually settled; never manufacture one, and never leave it sitting only in
  `ux.md` prose.
- **The wireframe record binds through the journey.** In `screens.yaml`, a frame is never tied to
  a journey step by a field on the screen — only `journeys[].steps[].covered_by` does that. A step
  no moment covers carries a non-empty `gap` string; it is never silently dropped. Frames carry
  real labels and real content — no invented palette, type scale, or component library, same as
  the lens.
- **Two live artifacts; no shared file; no HTML.** Write `ux.md` and `lens/screens.yaml` to the
  live model, and nothing else on the model tree. The visual-core and design-directive decisions
  go into the manifest as `decision_delta` entries — the play's keyed persist writes them. Never
  write `_spine.yaml`, the profile, a `decisions/*.yaml`, `lens/wireframes.html` (the bundled
  render script's job), or anything in another slice.
