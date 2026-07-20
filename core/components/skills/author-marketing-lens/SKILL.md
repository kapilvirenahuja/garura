---
name: author-marketing-lens
description: Author a shaped slice's marketing lens as an MD grounding doc — discoverability (SEO + AEO + GEO), accessibility (moved here from the profile), and marketing analytics — from the slice's hub (its functionalities' grounding docs + the spine profile) and KB grounding. An internal tool behind auth says "SEO/AEO/GEO not applicable" plainly, with the reason. Under direct-model-write (ADR 026) it writes the slice's marketing.md STRAIGHT to the live model (a re-derive) and emits any material decision plus the grounding map as structured data in a manifest; it reads the functionality.md docs for the hub, never another lens, and never writes the spine, the profile, the slice record, or a decision file. Generative artifact production for the /marketing play.
version: 0.2.0
user-invocable: false
model: opus
allowed-tools: Read, Write, Bash, Glob
---

# author-marketing-lens

Turns a shaped slice's **hub** — the grounding docs of the functionalities it bundles, plus the
product profile — into the slice's **marketing lens**, written as the grounding doc
`marketing.md`: how the slice is found and reached (SEO / AEO / GEO), the accessibility bar it
meets, and the reach/usage signals worth capturing. An internal tool behind auth answers
discoverability with "not applicable — behind auth", plainly and with the reason. It reads the
hub only (never another realize lens).

**Direct-model-write (ADR 026, `standards/rules/direct-model-write.md`).** This skill writes ONLY
the per-node lens doc `marketing.md` — straight to the **live model** under
`<product_base>product-os/…/slices/<slice>/lens/marketing.md` (a re-derive: it overwrites a prior
marketing lens for this slice). It writes NO shared model file: it never writes the spine
(`_spine.yaml`), the profile, the slice record, another lens, or a `decisions/*.yaml` file. Any
material marketing decision is emitted as **structured data in the manifest** — the play's keyed
persist script (`persist_marketing.py`) reads the manifest and writes the decision file, add-only,
keyed to the slice. The play's post-write scoped guard and single human checkpoint gate and commit
the change; this skill neither commits nor persists a shared file.

## What it produces (against the locked template)

`marketing.md` conforms to `standards/schemas/product-os/grounding/lens/marketing.md` — H1
`# Marketing Lens`, sections **Intent** (who needs to find/reach this slice, and why), **Discoverability**
(SEO / AEO / GEO, or why not applicable), **Accessibility** (the bar — e.g. WCAG level — and how the
slice meets it; this MOVED here from the profile), **Marketing analytics** (reach/conversion or, for an
internal tool, usage signals). It must clear the linter (shape) and the content-quality eval (the play
runs both). Alongside it, a structured `marketing-manifest.yaml` (STM, non-model) carries the
machine-checkable grounding the prose can't — which functionalities the assessment is grounded in, any
material choice, and any material decision as a full record for the keyed persist to write.

## Inputs

| Field | Required | Description |
|-------|----------|-------------|
| `slice_ref` | yes | `{domain}/{slice-id}` — display reference and the containment key the keyed persist enforces. |
| `slice_file` | yes | Path to the live slice record (read-only — for the functionalities it bundles and its surfaces). |
| `functionality_groundings` | yes | Paths to each functionality's `functionality.md` grounding doc (the hub, resolved by `check_ready_slice`). Read these for behavior/acceptance — NOT `ice.yaml` (retired). |
| `profile` | yes | The product profile (from the spine) — conditions + surfaces (stage / users / monetization). Read-only. |
| `kb_search` | yes | Path to the KB search script, for discoverability/accessibility-pattern grounding. |
| `kb_root` | yes | Path to `knowledge/`, to resolve learning ids. |
| `product_base` | yes | Product model root — the skill writes `marketing.md` IN PLACE under `<product_base>product-os/`. |
| `lens_rel` | yes | Relative path the lens is written at: `product-os/{domain}/slices/{slice}/lens/marketing.md`. |
| `manifest_path` | yes | Output path for `marketing-manifest.yaml` under STM (grounding map + any decision). |
| `proposals_dir` | yes | STM dir for KB-learning-gap proposals (the play resolves `<working>/proposals/`; the skill never reconstructs it). |
| `stm_base` | yes | From config. |

## Procedure

Reasoning (the reach verdict, the accessibility bar, the signals worth capturing) is yours.
Template conformance, grounding, honesty, and the write discipline are non-negotiable.

1. **Read the hub.** Load each functionality's `functionality.md` (its behavior, who it serves) and
   the profile (stage / users / monetization / surfaces). Do NOT read any other lens.
2. **Frame the intent.** Who needs to find or reach this slice's surface, and why. An internal tool
   says so plainly — it scopes the rest.
3. **Assess discoverability.** SEO (search), AEO (answer engines), GEO (generative engines): how the
   slice's surface is made findable/answerable, OR why it's not applicable (behind auth, internal),
   grounded in the profile's stage/users/monetization. Never invent public-marketing where there's none.
4. **Set the accessibility bar.** The standard the slice meets (e.g. WCAG 2.1 AA) and HOW it meets it —
   concrete. This is now the lens's job, not the profile's.
5. **Name the analytics.** The reach/conversion signals (or internal usage signals) worth capturing, each
   with why it matters and what it feeds.
6. **Write the lens to the live model.** Write `marketing.md` to `<product_base>/<lens_rel>` (per the
   template) — straight to the live tree, a re-derive that overwrites any prior marketing lens for this
   slice. Write NOTHING else on the live tree — no spine, no profile, no slice record, no decision file.
7. **Emit the manifest.** Write `marketing-manifest.yaml` to `manifest_path` (STM): the functionalities
   the assessment grounds in; any material choice; and any material marketing decision as a full record
   under `decisions:` for the keyed persist to write. Write any KB proposals under `<working>/proposals/`.

## Output

Written IN PLACE on the live model:

```
<product_base>/product-os/{domain}/slices/{slice}/
  lens/marketing.md                               # the Marketing lens grounding doc (re-derive)
```

Written to STM (non-model), returned by path:

```
{manifest_path}                                   # marketing-manifest.yaml — grounding map + any decision
<working>/proposals/<gap>.yaml                    # KB-learning-gap proposals (only if gaps)
```

`marketing-manifest.yaml`:

```yaml
marketing:
  slice_ref: token-dash/slice-trusted-coverage
  discoverability: not-applicable                 # public | not-applicable (with the reason in the doc)
  accessibility: "WCAG 2.1 AA"
  grounds:                                        # the functionalities the assessment considered
    - { source_type: functionality, source: "func-source-usage-ingest", functionality_ref: func-source-usage-ingest }
    - { source_type: functionality, source: "func-dashboard-presentation", functionality_ref: func-dashboard-presentation }
  choices: []                                     # KB-grounded discoverability/accessibility choices (if any)
  decisions: []                                   # material marketing decisions as full records (the keyed persist writes them);
                                                  # each entry's node_ref MUST be this slice_ref
```

Each `decisions` entry is a full decision record (id, node_ref == this `slice_ref`, level, title,
reason, alternatives, status, superseded_by, metadata) — the keyed persist writes it to the slice's
`decisions/` add-only, and refuses any record naming another slice. Return the enriched contract with
the `lens_rel` (live path) and `manifest_path` — paths, never inline content.

## Rules

- **Direct-model-write.** Write ONLY `marketing.md` to the live tree; emit any decision as manifest data —
  never write `_spine.yaml`, the profile, the slice record, another lens, or a `decisions/*.yaml` file.
- **Hub only.** Derive from the functionalities' grounding docs + the profile; never read or ground on
  another realize lens.
- **Template-true.** `marketing.md` conforms to the Marketing lens template (Intent / Discoverability /
  Accessibility / Marketing analytics) and must clear the linter + the content eval — every item
  self-explaining.
- **Honest reach.** An internal tool behind auth says "SEO/AEO/GEO not applicable" with the reason; never
  invent public-marketing where there is none.
- **Accessibility lives here.** Set the concrete accessibility bar and how the slice meets it — it moved
  out of the profile into this lens.
- **Cover the hub.** The assessment considers every functionality the slice bundles, recorded in the
  manifest grounds.
- **Grounded, not invented.** Discoverability and accessibility choices ground in a KB learning or a
  proposal; any material choice is emitted as a decision record in the manifest, keyed to this slice.
