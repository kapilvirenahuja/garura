---
name: author-measure-lens
description: Draft /measure's measure lens for one SLICE — the delivery-measurement claims for building it. Reads the slice's hub (its functionalities' ICE + the profile box) AND the three lens-trinity files (quality, ux, agentic — measure is a FOUNDATION lens; the trinity read rule), then grounds every metric claim in the KB's delivery-measurement learnings via kb-search — the triangle frame (speed, tokens, cognition) as the primary, industry frames (DORA/Flow/SPACE/DX) derived as translations, never parallel claims. Each claimed metric is a provable promise — baseline, target, and the proof source /capture later harvests. Anything the KB does not cover is raised as a KB-learning-gap proposal, never invented. Writes a draft only (the measure lens + a grounding manifest in STM), never the live model. The generative work for the /measure play; it reads quality/ux/agentic but never the architecture or run lens.
version: 0.1.0
user-invocable: false
model: opus
allowed-tools: Read, Write, Bash, Glob
---

# author-measure-lens

Turns one shaped slice (its lens trinity already authored) into its **measure lens** — the
benefits the TEAM gets while delivering this slice: which delivery metrics it improves or
holds, each as a provable claim. A slice is a vertical product increment; its **hub** is the
union of its functionalities' ICE (which may span several capabilities) plus the product
profile. /measure is a **foundation** lens (arch → measure → run); per the trinity read rule
it reads the slice hub **plus all three lens-trinity files** (quality, ux, agentic) — the
attributes whose delivery it prices — and never the architecture or run lens.

The measure lens is three things and only three:

- **focus** — one line: the team benefit this slice's delivery drives.
- **metrics** — one entry per claim. The **triangle is the primary frame** (speed, tokens,
  cognition — see `technology/delivery-triangle`): claims default to `framework: triangle`.
  Industry-framework entries (dora/flow/space/dx) are exceptional — the industry numbers are
  *derived translations* of triangle data (`technology/delivery-industry-frames-derived`),
  never parallel claims with their own bookkeeping. Each claim carries:
  - `why` — why THIS slice moves this metric, tied to hub or lens-trinity content (an
    agentic-heavy slice prices cognition differently than a static page).
  - `baseline` — today's number with `as_of` + `source`; a real number, or the word
    `unmeasured` stated honestly — never a flattering guess.
  - `target` — the number delivery is claimed to reach, and the `horizon` when it is
    checkable.
  - `proof` — the seam to /capture: the `source` where the number will be read (pipeline
    timestamps, the token-burn dashboard, gate reports) and the exact `signal`. /capture
    harvests ONLY what is declared here — an undeclared signal is unprovable.
- **out_of_scope** — metrics consciously NOT claimed, one line of why each (grill fodder).

**Every metric claim is grounded in the KB, never invented.** Before drafting, search the
KB's `architecture/` and `technology/` shelves (conditions `concern: delivery-measurement`)
and base the metric set, the target heuristics (e.g. the ≥5x speed expectation), and the
proof sources on what is recorded — Kapil's frame, not the model's taste. Anything the
shelves do not cover is a recorded KB-learning-gap proposal — never a silent guess.

It writes a draft only — /measure's checkpoint and apply step persist it. Measure never
stamps the slice (that stays /run's duty).

## Inputs

| Field | Required | Description |
|-------|----------|-------------|
| `slice_ref` | yes | The slice, `{domain}/{slice-id}`. |
| `slice_file` | yes | The slice record path (read-only) — its `functionalities` (the hub set). |
| `functionality_ices` | yes | The resolved ICE file paths for the slice's functionalities (the hub), from the readiness gate. |
| `quality_lens` | yes | The slice's quality lens path (read-only) — its gates are deterministic proof sources (one-shot cleanliness). |
| `ux_lens` | yes | The slice's ux lens path (read-only) — UI weight shapes the speed/cognition pricing. |
| `agentic_lens` | yes | The slice's agentic lens path (read-only) — offload weights shape the cognition claim and the token expectation. |
| `profile_path` | yes | The product profile (read-only) — condition facets for the KB query. |
| `kb_search` | yes | Path to the `kb-search` skill's `scripts/kb_search.py`. |
| `kb_root` | yes | The `knowledge/` dir, so the manifest can name resolvable learning ids. |
| `baselines_input` | no | Path to prior captured delivery data (earlier slices' /capture output), when it exists — the honest baseline source. Absent → baselines may be `unmeasured`. |
| `product_base` | yes | The product model root — read-only. |
| `lens_rel` | yes | The slice's lens path to mirror in the draft, e.g. `product-os/{domain}/slices/{slice-id}/lens/measure.yaml`. |
| `draft_dir` | yes | Output folder under STM for the draft lens + manifest + any proposals. |
| `stm_base` | yes | From config. |

## Procedure

The metric set, the targets, and the proof sources are **chosen from KB learnings**, not
invented; the claim shape (baseline/target/proof on every metric) and the grounding are
non-negotiable.

1. **Read the hub + the lens trinity.** Load the slice record (its functionalities), every
   functionality ICE in `functionality_ices`, the profile, and the three trinity files —
   quality (its deterministic gates), ux (the surface weight), agentic (the offload weights
   + data substrate). Do NOT read the architecture or run lens — /measure reads the hub +
   the trinity + the KB only.

2. **Search the KB.** Query the shelves through kb-search:

   ```bash
   python3 {kb_search} index           # all learnings + their conditions facets
   python3 {kb_search} get <id>        # e.g. technology/delivery-triangle
   ```

   The delivery-measurement learnings (`technology/delivery-triangle`,
   `technology/delivery-industry-frames-derived`, `technology/delivery-one-shot-cleanliness`)
   are the standing frame; reason over conditions for anything situational. Base every
   claim — metric choice, target heuristic, proof source — on a matched learning.

3. **Raise gaps, never invent.** For any measurement aspect the shelves do not cover (e.g. a
   proof source no learning names), write a **KB-learning-gap proposal** into
   `{draft_dir}/proposals/<gap>.yaml`, shaped to the KB's `_TEMPLATE.md` (Topic, Conditions,
   Recommendation, Rationale, Evolve when, Provenance). It is a proposal for review, never
   written to the KB here. The manifest references the proposal path; the play surfaces it
   at the checkpoint.

4. **Draft the measure lens.** Write `focus`, the `metrics` claims, and `out_of_scope`.
   Default claims per the triangle: **speed** (pipe open → closed; target from the ≥5x
   heuristic against the stated human baseline), **tokens** (burn per pipe; the
   accuracy-upfront bet), **cognition** (pipe dwell after agent-done + adjustment rounds;
   the directing-not-adjusting test), and **one-shot** (deploys and runs first try, zero
   errors, deterministic gates green — sourced from the quality lens's actual gate list).
   Scale the set to the slice — a slice can hold an axis (`direction: hold`) instead of
   claiming improvement, but silence on an axis goes to `out_of_scope` with its why.
   Baselines come from `baselines_input` when it exists; otherwise `unmeasured` with
   `as_of` today — stated honestly, never guessed.

5. **Write the draft + manifest.** Write the measure lens (the v1 lens envelope with
   `type: measure`, `slice_ref`, the three content blocks) under `draft_dir`, mirroring
   `lens_rel`, plus a `measure-manifest.yaml` that grounds **every** claim in a KB learning
   id or a proposal path, so the play's validate + grounding steps are mechanical:

```yaml
measure:
  slice: <domain>/<slice-id>
  choices:                              # one per claimed metric (and per out_of_scope call)
    - aspect: "metric:speed"            # metric:<name> | out_of_scope:<name>
      value: "pipe open→closed; target 5x vs human baseline"
      grounds:
        - source_type: kb               # kb | proposal | lens | profile
          source: "technology/delivery-triangle"
    - aspect: "metric:one-shot"
      value: "first-try deploy, zero errors, gates green"
      grounds:
        - source_type: kb
          source: "technology/delivery-one-shot-cleanliness"
        - source_type: lens             # the gate list itself
          source: "<quality lens path>"
    - aspect: "out_of_scope:dora-parallel-claims"
      value: "industry numbers derived, not claimed"
      grounds:
        - source_type: kb
          source: "technology/delivery-industry-frames-derived"
  proof_sources:                        # every proof.source named once — the /capture contract
    - "pipeline timestamps"
    - "token-burn dashboard"
    - "deterministic gate reports"
```

## Output — the draft

```
{draft_dir}/
  product-os/<domain>/slices/<slice-id>/
    lens/measure.yaml
  proposals/<gap>.yaml                   # any KB-learning-gap proposal (referenced by the manifest)
  measure-manifest.yaml
```

## Boundaries

### NEVER
- Read or reference the architecture or run lens — /measure reads the hub + the lens
  trinity (quality, ux, agentic) + the KB only.
- Write the slice record, a functionality's ICE, the profile, another lens, or other
  slices — draft only this slice's measure lens. The slice `status` stamp is /run's job.
- Invent a metric, target, or proof source — every claim traces to a matched KB learning
  or a recorded proposal.
- Claim an industry-framework metric as a parallel first-class entry — industry numbers
  are derived translations of triangle data (`technology/delivery-industry-frames-derived`).
- Write a flattering baseline — a number with a source, or the word `unmeasured`; nothing
  between.
- Declare a proof the pipes cannot produce — every `proof.source` must be readable
  (timestamps, token dashboard, gate reports, /launch records), or it is a gap proposal.
- Measure product outcomes — usage, revenue, adoption belong to the strategy layer;
  this lens prices the DELIVERY only.
- Smear quality, ux, agentic, architecture, or run content into the measure lens. Keep
  `content` to focus/metrics/out_of_scope.

### ALWAYS
- Ground every claim and every out-of-scope call in the manifest.
- Give every claimed metric a complete baseline + target + proof block.
- Name every proof source once in the manifest's `proof_sources` — the /capture contract.
- Tie each claim's `why` to actual hub or trinity content, not generic prose.
- Return the draft paths, not the contents.
