---
name: author-marketing-lens
description: Author a shaped slice's marketing lens as an MD grounding doc — discoverability (SEO + AEO + GEO), accessibility (moved here from the profile), and marketing analytics — from the slice's hub (its functionalities' grounding docs + the spine profile) and KB grounding. An internal tool behind auth says "SEO/AEO/GEO not applicable" plainly, with the reason. Writes a draft marketing.md (conforming to the Marketing lens template) plus a grounding manifest and any material decision; reads the functionality.md docs for the hub, never another lens. Generative artifact production for the /marketing play; writes a draft only, never the live model.
version: 0.1.0
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
hub only (never another realize lens) and writes a draft — /marketing's checkpoint and apply step
persist it.

## What it produces (against the locked template)

`marketing.md` conforms to `standards/schemas/product-os/grounding/lens/marketing.md` — H1
`# Marketing Lens`, sections **Intent** (who needs to find/reach this slice, and why), **Discoverability**
(SEO / AEO / GEO, or why not applicable), **Accessibility** (the bar — e.g. WCAG level — and how the
slice meets it; this MOVED here from the profile), **Marketing analytics** (reach/conversion or, for an
internal tool, usage signals). It must clear the linter (shape) and the content-quality eval (the play
runs both). Alongside it, a structured `marketing-manifest.yaml` carries the machine-checkable grounding
the prose can't — which functionalities the assessment is grounded in, and any material choice.

## Inputs

| Field | Required | Description |
|-------|----------|-------------|
| `slice_ref` | yes | `{domain}/{slice-id}` — display reference. |
| `slice_file` | yes | Path to the live slice record (read-only — for the functionalities it bundles and its surfaces). |
| `functionality_groundings` | yes | Paths to each functionality's `functionality.md` grounding doc (the hub, resolved by `check_ready_slice`). Read these for behavior/acceptance — NOT `ice.yaml` (retired). |
| `profile` | yes | The product profile (from the spine) — conditions + surfaces (stage / users / monetization). Read-only. |
| `kb_search` | yes | Path to the KB search script, for discoverability/accessibility-pattern grounding. |
| `kb_root` | yes | Path to `knowledge/`, to resolve learning ids. |
| `product_base` | yes | Product model root (to reuse an existing marketing decision). |
| `lens_rel` | yes | Relative path the lens mirrors: `product-os/{domain}/slices/{slice}/lens/marketing.md`. |
| `draft_dir` | yes | Output folder under STM for the draft + manifest + proposals. |
| `stm_base` | yes | From config. |

## Procedure

Reasoning (the reach verdict, the accessibility bar, the signals worth capturing) is yours.
Template conformance, grounding, and honesty are non-negotiable.

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
6. **Write the draft.** Write `marketing.md` to the lens path under `draft_dir` (per the template); write
   `marketing-manifest.yaml` (the functionalities the assessment grounds in; any material choice → a
   decision); write the decision and any KB proposals. Drafts only — never the live model, never another lens.

## Output — the draft

```
{draft_dir}/
  product-os/{domain}/slices/{slice}/
    lens/marketing.md                             # the Marketing lens grounding doc
    decisions/{decision-id}.yaml                  # a material marketing decision (if any)
  marketing-manifest.yaml                         # grounding map (functionalities considered)
  proposals/<gap>.yaml                            # KB-learning-gap proposals (only if gaps)
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
```

Return the enriched contract with the `draft_dir` and `marketing-manifest.yaml` path — paths, never
inline content.

## Rules

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
  proposal; any material choice is recorded as a decision.
- **Drafts only.** Write under `draft_dir`; never touch the live model.
```
