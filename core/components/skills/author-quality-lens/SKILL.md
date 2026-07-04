---
name: author-quality-lens
description: Author a shaped slice's quality lens as an MD grounding doc — a short statement of what "good" means for the slice plus a table of checkable gates (dimension / bar / how checked) — from the slice's hub (its functionalities' grounding docs + the spine profile's NFR gates). Every gate is grounded (a profile gate that applies or a functionality's rule made checkable) and concrete, never a vague adjective. Writes a draft quality.md (conforming to the Quality lens template) plus a grounding manifest and any material decision; reads the functionality.md docs + the profile for the hub, never another lens. Generative artifact production for the /quality play; writes a draft only, never the live model.
version: 0.4.0
user-invocable: false
model: opus
allowed-tools: Read, Write, Bash, Glob
---

# author-quality-lens

Turns a shaped slice's **hub** — the grounding docs of the functionalities it bundles, plus the
product profile — into the slice's **quality lens**, written as the grounding doc `quality.md`:
what "good" means for this slice, and the checkable gates it must clear. The gates are drawn from
the profile's NFR gates that apply to the slice and from the slice's functionalities' own rules,
made checkable — never invented. It reads the hub only (never another realize lens) and writes a
draft — /quality's checkpoint and apply step persist it.

## What it produces (against the locked template)

`quality.md` conforms to `standards/schemas/product-os/grounding/lens/quality.md` — H1
`# Quality Lens`, sections **Intent** (what good means for this slice and why that bar) and
**Gates** (a table: dimension | bar | how checked). It must clear the linter (shape) and the
content-quality eval (the play runs both). Alongside it, a structured `quality-manifest.yaml`
carries the machine-checkable grounding the prose can't — which profile gate or functionality each
gate traces to, and any material choice.

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
| `product_base` | yes | Product model root (to reuse an existing material decision). |
| `lens_rel` | yes | Relative path the lens mirrors: `product-os/{domain}/slices/{slice}/lens/quality.md`. |
| `draft_dir` | yes | Output folder under STM for the draft + manifest. |
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
5. **Write the draft.** Write `quality.md` to the lens path under `draft_dir` (per the template);
   write `quality-gates.yaml` beside it (per its schema — every table row has exactly one card);
   write `quality-manifest.yaml` (the profile gate or functionality each gate grounds in; any
   material choice → a decision); write the decision if any. Drafts only — never the live model,
   never another lens.

## Output — the draft

```
{draft_dir}/
  product-os/{domain}/slices/{slice}/
    lens/quality.md                               # the Quality lens grounding doc
    lens/quality-gates.yaml                       # the machine sibling — one binding card per gate
    decisions/{decision-id}.yaml                  # a material decision (if any)
  quality-manifest.yaml                           # grounding map (gate -> profile gate / functionality)
```

`quality-manifest.yaml`:

```yaml
quality:
  slice_ref: token-dash/slice-trusted-coverage
  grounds:                                        # every gate traces to a profile gate or a functionality
    - { source_type: profile, source: "nfr.privacy" }
    - { source_type: functionality, source: "func-privacy-trust-labeling", functionality_ref: func-privacy-trust-labeling }
    - { source_type: functionality, source: "func-source-coverage-freshness", functionality_ref: func-source-coverage-freshness }
  choices: []                                     # material quality choices (each → a decision), if any
```

Return the enriched contract with the `draft_dir` and `quality-manifest.yaml` path — paths, never
inline content.

## Rules

- **Hub only.** Derive from the functionalities' grounding docs + the profile; never read or ground
  on another realize lens.
- **Template-true.** `quality.md` conforms to the Quality lens template (Intent / Gates) and must
  clear the linter + the content eval — every item self-explaining.
- **Grounded, not invented.** Every gate traces to a profile NFR gate that applies or to a
  functionality's rule; a material choice is recorded as a decision. No gate from taste.
- **Concrete.** Every gate is a checkable bar — a value or a named standard plus how it is checked —
  never a vague adjective. A gate that cannot be checked is not a gate.
- **Bound.** Every Gates-table row has exactly one card in `quality-gates.yaml` — machine-owned
  with tooling + command + pass rule, or human-owned with its review edge. No unbound rows, no
  cards without rows. The card demands the tooling the bar needs; it never assumes the project
  has it.
- **Cover the hub.** The gates consider every functionality the slice bundles, recorded in the
  manifest grounds.
- **Drafts only.** Write under `draft_dir`; never touch the live model.
```
