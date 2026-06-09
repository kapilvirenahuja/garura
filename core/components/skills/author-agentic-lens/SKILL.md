---
name: author-agentic-lens
description: Draft /agentic's agentic lens for one SLICE — decide whether it's agentic at all (by how much load it's OK to lift off the user) and, if so, rate five axes on the low→ultra scale: the three weights (cognitive/creative/logistical = the degree of offload) and the two controls (guardrails, handoff). Grounds the weights in the slice's hub (its functionalities' ICE) and the controls in their constraints/failures. A slice that should offload nothing comes out is_agent=false. Records a decision for any material autonomy choice. Writes a draft only (the agentic lens + a grounding manifest in STM), never the live model. The generative work for the /agentic play; reads the slice's hub, never another lens.
version: 0.3.0
user-invocable: false
model: opus
allowed-tools: Read, Write, Bash, Glob
---

# author-agentic-lens

Decides one shaped **slice's** agentic lens — how much load it should lift off the user,
and the frame around it. A slice is a vertical product increment; its **hub** is the union
of its functionalities' ICE (which may span several capabilities) plus the product profile.
This is garura's two-fold agentic decision:

1. **Is it agentic, and how much** — judged by how much load it is OK to offload to this
   slice. The "how much" is the three **weights**, each rated on the low→ultra scale, where
   the level is the **degree of offload**:
   - **cognitive** — analysis + decision-making,
   - **creative** — visualization + media creation,
   - **logistical** — operational + workflow.
   A max/ultra weight means lift as much of that load off the user as possible — the slice
   fires as much agentic behaviour as it can on that dimension.
2. **The frame** — once agentic, the two **controls**, same scale:
   - **guardrails** — how tight the hard limits (low = loose … ultra = every action fenced),
   - **handoff** — how readily it returns to a human (low = rarely … ultra = human each step).

The scale is `low | medium | high | xhigh | ultra` on every axis — there is no "none".
"Not agentic" is the **is_agent** gate up front: a slice that should offload nothing comes
out `is_agent: false` with a note saying why. It draws the is_agent decision and the
weights from the slice's hub (the load its functionalities carry), and the controls from
their constraints/failures (the safety risks); it reads the hub (the functionalities' ICE +
the profile box) and never another lens.

It writes a draft only — /agentic's checkpoint and apply step persist it.

## Inputs

| Field | Required | Description |
|-------|----------|-------------|
| `slice_ref` | yes | The slice, `{domain}/{slice-id}`. |
| `slice_file` | yes | The slice record path (read-only) — its `functionalities` list. |
| `functionality_ices` | yes | The resolved ICE file paths for the slice's functionalities (the hub), from the readiness gate. |
| `profile_path` | yes | The product `profile.yaml`. Read-only — its conditions feed the KB query for the control approach. |
| `kb_search` | yes | Path to the `kb-search` skill's `scripts/kb_search.py` — the condition-search engine over the architecture/technology shelves. |
| `kb_root` | yes | The `knowledge/` dir, so the manifest can name resolvable learning ids. |
| `lens_rel` | yes | The slice's lens path to mirror in the draft, e.g. `product-os/{domain}/slices/{slice-id}/lens/agentic.yaml`. |
| `draft_dir` | yes | Output folder under STM for the draft lens + manifest + any proposals. |
| `stm_base` | yes | From config. |

## Procedure

The is_agent call, the levels, and the notes are your judgment; grounding, the five-axis
shape, and the low→ultra scale are non-negotiable.

1. **Read the slice's hub.** Load the slice record (its functionalities) and every
   functionality ICE in `functionality_ices` (intent constraints + failures, context,
   expectations) plus the profile box. Do NOT read another lens — /agentic reads the hub
   only.

2. **Decide is_agent — by load.** Judge how much load it is OK to lift off the user for this
   slice. If the answer is "none — it should stay fully with the user", set
   `is_agent: false` with a note saying why, and stop (no axes). Otherwise `is_agent: true`.

3. **Rate the three weights — the degree of offload.** On the low→ultra scale, rate how much
   of each load to lift off the user across the slice: cognitive, creative, logistical. A
   note on each justifies the level from the slice's hub (the load its functionalities
   carry). Ultra = offload as much as possible / maximally agentic on that dimension.

4. **Rate the two controls — the frame, grounded in the KB.** On the same scale: `guardrails`
   (how tight the hard limits) and `handoff` (how readily it returns to a human). The *levels*
   are grounded in the functionalities' constraints and failures (the hub). But the **control
   approach** — how an agent of this kind is fenced and when it defers — is a pattern: search
   the KB's architecture/technology shelves through kb-search for a fitting control/guardrail
   learning and base the approach on it.

   ```bash
   python3 {kb_search} index            # all learnings + their conditions facets
   python3 {kb_search} get <id>         # e.g. architecture/microservices (isolation/guardrails)
   ```

   Record the control approach (guardrail tightness + handoff cadence) in the manifest's
   `choices` block, grounded in the matched learning. Where the KB has no fitting control
   pattern yet (it is young on agentic patterns), write a **KB-learning-gap proposal** into
   `{draft_dir}/proposals/<gap>.yaml` (a candidate architecture/technology learning shaped to the
   KB's `_TEMPLATE.md`, for review — never written to the KB here) and reference it instead. On
   an `is_agent: false` slice there are no controls, so there is no `choices` block.

5. **Record a decision for a material autonomy choice.** When a weight is xhigh/ultra (you
   are lifting most/all of a load off the user) or you are making a sensitive slice agentic
   at all, draft a slice-level decision (ADR) naming the choice and why.

6. **Write the draft + manifest.** Write the agentic lens (the v1 lens envelope with
   `type: agentic`, `slice_ref`, and the content above) under `draft_dir`, mirroring
   `lens_rel`, plus any decisions, plus an `agentic-manifest.yaml` that grounds the
   **is_agent decision and every rated axis** to its hub source so the play's validate step
   is mechanical:

```yaml
agentic:
  slice: <domain>/<slice-id>
  is_agent: true
  axes:                         # one entry per rated axis (the 5 axes when is_agent)
    - axis: cognitive           # cognitive | creative | logistical | guardrails | handoff
      level: ultra
      grounds:
        - source_type: ice      # MUST be ice (the hub) — never another lens
          source: "func-...: intent.outcomes[0] — heavy decision load"
          material: true        # set for an xhigh/ultra weight or a sensitive agentic call
          decision: <decision-id>
    - axis: guardrails
      level: high
      grounds:
        - source_type: ice
          source: "func-...: intent.failures[2]"
  choices:                        # the KB-grounded control APPROACH (only when is_agent)
    - choice: "guardrails: every external action fenced + dry-run"
      grounds: [ { source_type: kb, source: "architecture/microservices" } ]
    - choice: "handoff: confirm before any irreversible step"
      grounds: [ { source_type: proposal, source: "proposals/agent-handoff-cadence.yaml" } ]
  decisions: ["<decision-id>", ...]
```

For `is_agent: false`, set `axes: []` and omit `choices` — no grounding needed; the lens note
carries the call. When `is_agent: true`, the `choices` block records the control approach,
grounded in a KB learning or a proposal — that is what `check_kb_grounding.py` checks.

## Output — the draft

```
{draft_dir}/
  product-os/<domain>/slices/<slice-id>/
    lens/agentic.yaml
    decisions/<decision-id>.yaml      # only if a material autonomy choice was made
  proposals/<gap>.yaml                 # any KB-learning-gap proposal (referenced by choices)
  agentic-manifest.yaml
```

## Boundaries

### NEVER
- Read or reference another realize lens (quality/ux/architecture/run) — /agentic reads the
  slice's hub only.
- Write the slice record, a functionality's ICE, the profile, another lens, or other slices
  — draft only this slice's agentic lens (+ decisions).
- Invent the is_agent call or an axis level with no hub source behind it.
- Use a level off the low/medium/high/xhigh/ultra scale, or rate an axis while is_agent is
  false.
- Put anything beyond is_agent + weights + controls in the lens.

### ALWAYS
- Ground the is_agent decision and every rated axis in the manifest to the slice's hub
  (weights to its functionalities' load, controls to their constraints/failures).
- On an agentic slice, search the KB and ground the control approach (guardrail tightness +
  handoff cadence) in a best-fit `architecture/*` or `technology/*` learning — or a recorded
  KB-learning-gap proposal — in the manifest's `choices` block. Never pick the control approach
  on taste alone. (No `choices` on an is_agent=false slice.)
- Rate all five axes when is_agent is true; rate none when it is false.
- Keep `content` to is_agent + note + weights (cognitive/creative/logistical) + controls
  (guardrails/handoff).
- Return the draft paths, not the contents.
