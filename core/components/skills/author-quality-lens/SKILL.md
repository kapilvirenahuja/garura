---
name: author-quality-lens
description: Author a shaped slice's quality lens as an MD grounding doc — a short statement of what "good" means for the slice plus a table of checkable gates (dimension / bar / how checked) — from the slice's hub (its functionalities' grounding docs + the spine profile's NFR gates). Every gate is grounded (a profile gate that applies or a functionality's rule made checkable) and concrete, never a vague adjective. Under direct-model-write (ADR 026) it writes ONLY the per-node lens docs (`quality.md` conforming to the Quality lens template, plus its machine sibling `quality-gates.yaml`) straight to the live model, and emits the grounding map + any material choice as structured data in the quality-manifest — it NEVER writes `_spine.yaml`, `profile.yaml`, or `decisions`. Reads the functionality.md docs + the profile for the hub, never another lens. Generative artifact production for the /quality play.
version: 0.5.0
user-invocable: false
model: opus
allowed-tools: Read, Write, Bash, Glob
---

# author-quality-lens

Turns a shaped slice's **hub** — the grounding docs of the functionalities it bundles, plus the
product profile — into the slice's **quality lens**, written as the grounding doc `quality.md`:
what "good" means for this slice, and the checkable gates it must clear. The gates are drawn from
the profile's NFR gates that apply to the slice and from the slice's functionalities' own rules,
made checkable — never invented. It reads the hub only (never another realize lens) and writes the
lens docs straight to the live model; /quality's checkpoint approves and its keyed persist writes
any decision.

## Write discipline — direct-model-write containment split (ADR 026)

This skill is the LLM worker in a direct-model-write play. Per
`standards/rules/direct-model-write.md` it obeys the **containment split**, and this is
mandatory:

- It writes ONLY the per-node grounding docs — the slice's `lens/quality.md` and its machine
  sibling `lens/quality-gates.yaml` — **straight to the live model** under the slice's `lens/`
  home. There is no `draft/` tree.
- It **NEVER** writes any shared model file: not `_spine.yaml`, not `profile.yaml`, not
  `decisions/`. Every decision record is the job of /quality's deterministic keyed persist
  script (`persist_quality.py`), which reads this skill's manifest.
- The grounding map and any material choice it used to draft into a decision file are now emitted
  as **structured data in `quality-manifest.yaml`** (a non-model STM artifact). The keyed persist
  script turns each material choice into a decision record in place under the slice, skip-if-exists,
  keyed to the slice.

Because the LLM only ever writes separate doc files, /quality's file-level scoped guard is
sufficient for this skill's blast radius, and node-level containment (only this slice's decisions
change, never another slice's) is preserved by the keyed script.

## What it produces (against the locked template)

`quality.md` conforms to `standards/schemas/product-os/grounding/lens/quality.md` — H1
`# Quality Lens`, sections **Intent** (what good means for this slice and why that bar) and
**Gates** (a table: dimension | bar | how checked). It must clear the linter (shape) and the
content-quality eval (the play runs both). Alongside it, a structured `quality-manifest.yaml`
carries the machine-checkable grounding the prose can't — which profile gate or functionality each
gate traces to, and any material choice as a full decision entry.

The lens is one lens, two artifacts (#462, run-lens precedent): with the table comes its machine
sibling `quality-gates.yaml` (schema: `standards/schemas/product-os/lens/quality-gates.yaml`) —
one binding card per Gates-table row. Deterministic gates (linters, tests, types, architecture
rules, coverage) get `owner: machine` with the tooling the gate demands (`requires`), the exact
command, and the pass rule (`measure`/`threshold` when the check reads a number). Judgment gates
(design, UX, security assessment) get `owner: human` and a `review` line naming the edge that
judges them — they are never runner-owned. The card is a demand, not an assumption: name the
tooling the bar needs even when the project does not have it yet (greenfield has nothing;
brownfield lenses legitimately demand more than what is installed). The run-quality-gates skill
executes these cards; absent tooling surfaces as a missing-tool finding the build loop consumes.

## Inputs

| Field | Required | Description |
|-------|----------|-------------|
| `slice_ref` | yes | `{domain}/{slice-id}` — display reference. |
| `slice_file` | yes | Path to the live slice record (read-only — for the functionalities it bundles). |
| `functionality_groundings` | yes | Paths to each functionality's `functionality.md` grounding doc (the hub, resolved by `check_ready_slice`). Read these for rules/acceptance — NOT `ice.yaml` (retired). |
| `profile` | yes | The product profile (from the spine) — its NFR gates and conditions. Read-only; the gates draw from the profile gates that apply. |
| `product_base` | yes | Product model root. Read the hub, and WRITE the slice's `lens/quality.md` and `lens/quality-gates.yaml` in place under `{product_base}product-os/{domain}/slices/{slice-id}/lens/`. Only the two lens docs — never a shared file, never another slice's docs. |
| `lens_rel` | yes | Relative path the lens mirrors: `product-os/{domain}/slices/{slice}/lens/quality.md`. |
| `manifest_path` | yes | Where to write `quality-manifest.yaml` (STM, non-model) — the grounding map + any material choice as structured data for the keyed persist. |
| `stm_base` | yes | From config. |

## Procedure

Reasoning (which gates matter, the bar, how each is checked) is yours. Template conformance,
grounding, and concreteness are non-negotiable.

1. **Read the hub.** Load each functionality's `functionality.md` (its rules, behavior, acceptance)
   and the profile (its NFR gates + conditions). Do NOT read any other lens.
2. **State the intent.** What "good" means for THIS slice in a short paragraph — the bar it has to
   hit to be trustworthy, and why that bar and not a looser one. Not a restating of the gates.
3. **Derive the gates.** Build the gate table: for each dimension that matters to this slice, the
   bar and how it is checked. Each gate is grounded — it traces to a profile NFR gate that applies
   to the slice, or to a rule of one of the slice's functionalities made checkable. Every gate is
   concrete (a value or a named standard plus a check), never a vague adjective.
4. **Bind the gates.** For every row of the gate table, author its binding card (the machine
   sibling): decide `owner` — machine for the deterministic slice, human for judgment — and for
   machine gates the demanded tooling (`requires.tool`, `requires.tool_bins`, an `install` hint
   when a standard one exists), the exact `command`, and `measure`/`threshold` when the check
   reads a number. Prefer the project's established tools when they exist; name the standard tool
   for the job when they don't — the card demands, the build loop provisions. A bar too
   product-specific for any off-the-shelf tool binds to a thin repo-owned check script
   (`requires.tool: custom-check`) that the build loop writes. This mapping is the design-time
   judgment — made once here, executed mechanically ever after.
5. **Write the lens docs in place.** Write `quality.md` to the live lens path
   (`{product_base}{lens_rel}`, per the template); write `quality-gates.yaml` beside it (per its
   schema — every table row has exactly one card). Straight to the live model — there is no draft
   tree. Do NOT write the spine, the profile, another lens, another slice, or any decision file.
6. **Emit the manifest.** Write `quality-manifest.yaml` (STM) with the grounding map (the profile
   gate or functionality each gate grounds in) and any material choice as a full structured
   decision entry (the keyed persist writes the file). Never write the decision file here.

## Output — live lens docs + the manifest

```
{product_base}product-os/{domain}/slices/{slice}/
  lens/quality.md                                 # the Quality lens grounding doc (LIVE)
  lens/quality-gates.yaml                         # the machine sibling — one binding card per gate (LIVE)
{manifest_path}                                   # quality-manifest.yaml (STM, non-model)
```

`quality-manifest.yaml`:

```yaml
quality:
  slice_ref: token-dash/slice-trusted-coverage
  grounds:                                        # every gate traces to a profile gate or a functionality
    - { source_type: profile, source: "nfr.privacy" }
    - { source_type: functionality, source: "func-privacy-trust-labeling", functionality_ref: func-privacy-trust-labeling, material: true, decision: "dec-quality-privacy-trust-bar" }
    - { source_type: functionality, source: "func-source-coverage-freshness", functionality_ref: func-source-coverage-freshness }
  choices:                                        # material quality choices (each → a decision the keyed persist writes), if any
    - { id: "dec-quality-privacy-trust-bar", slice_ref: token-dash/slice-trusted-coverage, level: product,
        title: "Trust-labeling bar set at the privacy NFR gate", reason: "...", alternatives: [] }
```

Return the enriched contract with the live `lens_rel` and the `quality-manifest.yaml` path — paths,
never inline content.

## Rules

- **Live, not draft.** Write the two lens docs straight to the live model under the slice's `lens/`
  home; never a `draft/` tree.
- **Containment split (ADR 026).** Write ONLY the per-node lens docs; NEVER a shared file
  (`_spine.yaml`, `profile.yaml`, `decisions/`). Emit the grounding map + material choices as
  manifest data — the keyed persist writes any decision.
- **Hub only.** Derive from the functionalities' grounding docs + the profile; never read or ground
  on another realize lens.
- **Template-true.** `quality.md` conforms to the Quality lens template (Intent / Gates) and must
  clear the linter + the content eval — every item self-explaining.
- **Grounded, not invented.** Every gate traces to a profile NFR gate that applies or to a
  functionality's rule; a material choice is recorded (as a manifest choice → a decision). No gate
  from taste.
- **Concrete.** Every gate is a checkable bar — a value or a named standard plus how it is checked —
  never a vague adjective. A gate that cannot be checked is not a gate.
- **Bound.** Every Gates-table row has exactly one card in `quality-gates.yaml` — machine-owned
  with tooling + command + pass rule, or human-owned with its review edge. No unbound rows, no
  cards without rows. The card demands the tooling the bar needs; it never assumes the project
  has it.
- **Cover the hub.** The gates consider every functionality the slice bundles, recorded in the
  manifest grounds.
