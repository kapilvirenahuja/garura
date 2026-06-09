---
name: author-ux-lens
description: Draft /ux's ux lens for one SLICE — turn the slice's functionalities' ICE and personas/journeys into low-fidelity screens (each with a layout), the states each screen holds, and the product's visual core (color + typography) recorded as a decision; cover every functionality the slice bundles so a human can validate the shape. Just enough to anchor the experience and let the build figure the rest — no flows, no accessibility block (a11y lives in the profile). Writes a draft only (the ux lens + a grounding manifest in STM), never the live model. The generative work for the /ux play; reads the slice's hub, never another lens.
version: 0.3.0
user-invocable: false
model: opus
allowed-tools: Read, Write, Bash, Glob
---

# author-ux-lens

Turns one shaped **slice** into its **ux lens** — just enough to anchor the intended
experience and let the build figure the rest. A slice is a vertical product increment; its
**hub** is the union of its functionalities' ICE (which may span several capabilities) plus
the product profile. The lens is three things and only three:

- **screens** — the surfaces the slice needs, each with a one-line purpose and a
  **low-fidelity layout** (the blocks on the screen and what each holds). Not pixel design.
- **states** — per screen, the states it can hold (idle / submitting / error / locked /
  success / empty / loading, as applies).
- **design_system** — the product's **visual core**: a palette (color + mood) and
  typography. Set once and recorded as a decision the whole product references.

The screens make every functionality of the slice visible so a human can validate the shape.
It draws every screen from the slice's hub — one of its functionalities' ICE or a
persona/journey. **Accessibility is not in the lens** — it lives in the product profile, and
the build connects it. **Flows are not specified** — the build derives them from the screens
and the journeys.

It writes a draft only — /ux's checkpoint and apply step persist it. It reads the slice's hub
(its functionalities' ICE + the profile box); it never reads another realize lens.

## Inputs

| Field | Required | Description |
|-------|----------|-------------|
| `slice_ref` | yes | The slice, `{domain}/{slice-id}`. |
| `slice_file` | yes | The slice record path (read-only) — its `functionalities` list (the to-cover set). |
| `functionality_ices` | yes | The resolved ICE file paths for the slice's functionalities (the hub), from the readiness gate. |
| `profile_path` | yes | The product profile (read-only) — its condition facets (stage/users/persistence/monetization) + surfaces feed the KB query. |
| `kb_search` | yes | Path to the `kb-search` skill's `scripts/kb_search.py` — the condition-search engine over the technology/architecture shelves. |
| `kb_root` | yes | The `knowledge/` dir, so the manifest can name resolvable learning ids. |
| `product_base` | yes | The product model root — read-only, to reuse an existing visual-core decision if one exists. |
| `lens_rel` | yes | The slice's lens path to mirror in the draft, e.g. `product-os/{domain}/slices/{slice-id}/lens/ux.yaml`. |
| `draft_dir` | yes | Output folder under STM for the draft lens + manifest + any proposals. |
| `stm_base` | yes | From config. |

## Procedure

The screen wording, the layout, and the visual taste are your judgment; grounding, coverage,
and the three-block shape are non-negotiable.

1. **Read the slice's hub.** Load the slice record (its functionalities — the to-cover set)
   and every functionality ICE in `functionality_ices`, plus its personas/journeys. Do NOT
   read another lens — /ux reads the hub only.

2. **Draw the screens + their layouts.** For each functionality the slice bundles, draw the
   screen(s) it needs: a one-line purpose and a low-fidelity layout — the blocks/regions on
   the screen and what each holds, where the functionality shows up. Low-fidelity: enough to
   see the shape, not pixel design.

3. **Enumerate the states.** For each screen, list the states it can hold (idle / submitting /
   error / locked / success / empty / loading, as applies).

4. **Search the KB, then set the pattern choices + the visual core.** Build the product's
   condition profile (stage / users / persistence / monetization + surfaces, from the profile)
   and query the KB's technology/architecture shelves through kb-search:

   ```bash
   python3 {kb_search} index            # all learnings + their conditions facets
   python3 {kb_search} get <id>         # e.g. technology/frontend-react-nextjs
   ```

   Reason over each candidate's **Conditions** (judgment, not keyword match) to pick the
   best-fit learnings, and base the **visual core** (palette + typography), the **navigation
   pattern**, and the **responsive strategy** on them — what has worked for products with these
   conditions and surfaces, not your taste. Record the visual core as a slice-level decision
   (reuse the product's existing visual-core decision if one exists under `product_base`).
   For any pattern choice the shelves do not cover, write a **KB-learning-gap proposal** into
   `{draft_dir}/proposals/<gap>.yaml` (a candidate technology/architecture learning shaped to
   the KB's `_TEMPLATE.md`, for review — never written to the KB here), and reference it instead
   of a learning id.

5. **Write the draft + manifest.** Write the ux lens (the v1 lens envelope with `type: ux`,
   `slice_ref`, and the three content blocks) under `draft_dir`, mirroring `lens_rel`, plus the
   visual-core decision, plus a `ux-manifest.yaml` that grounds **every screen** to its source
   and records the KB-grounded pattern **choices**, so the play's validate + grounding steps are
   mechanical and coverage is checkable:

```yaml
ux:
  slice: <domain>/<slice-id>
  screens:
    - name: "Checkout — payment"
      grounds:
        - source_type: ice              # ice | persona | journey
          source: "func-...: intent.outcomes[0]"
          functionality_ref: "<functionality node id>"   # required when source_type=ice
  design_system:
    source_type: decision               # decision (the visual-core ADR) or kb
    decision: "<decision-id>"
  choices:                              # the KB-grounded PATTERN choices
    - choice: "visual core: clean sans, high-contrast palette"
      grounds: [ { source_type: kb, source: "technology/frontend-react-nextjs", decision: "<decision-id>" } ]
    - choice: "navigation: sidebar + breadcrumb"
      grounds: [ { source_type: kb, source: "technology/frontend-component-orchestration" } ]
    - choice: "responsive: mobile-first, reflow"
      grounds: [ { source_type: kb, source: "technology/frontend-react-nextjs" } ]
    # for a gap: { source_type: proposal, source: "proposals/<gap>.yaml" }
  decisions: ["<decision-id>", ...]
```

Every functionality the slice bundles must appear as a `functionality_ref` on at least one
screen — that is the coverage the validate step checks against the slice record. The visual
core, the navigation pattern, and the responsive strategy must appear in `choices` with a KB
learning or a proposal — that is the KB grounding `check_kb_grounding.py` checks.

## Output — the draft

```
{draft_dir}/
  product-os/<domain>/slices/<slice-id>/
    lens/ux.yaml
    decisions/<decision-id>.yaml      # the visual-core decision (or reused id, not re-written)
  proposals/<gap>.yaml                 # any KB-learning-gap proposal (referenced by choices)
  ux-manifest.yaml
```

## Boundaries

### NEVER
- Read or reference another realize lens (quality/agentic/architecture/run) — /ux reads the
  slice's hub only.
- Write the slice record, a functionality's ICE, the profile, another lens, or other slices —
  draft only this slice's ux lens (+ the visual-core decision).
- Invent an element — a screen with no functionality ICE/persona/journey, or a visual core
  with no recorded decision.
- Leave a functionality of the slice unvisualized.
- Put flows, an accessibility block, gates, components, or environments in the lens — three
  blocks only. A11y lives in the profile; flows are the build's to derive.
- Over-specify — no pixel design, no exhaustive component breakdown. Low-fidelity, intent
  level.

### ALWAYS
- Ground every screen in the manifest to one of the slice's functionalities' ICE or a
  persona/journey; ground the visual core on a decision that resolves.
- Search the KB first and ground every pattern choice (the visual core, the navigation pattern,
  the responsive strategy) in a best-fit `technology/*` or `architecture/*` learning — or a
  recorded KB-learning-gap proposal — in the manifest's `choices` block. Never pick them on
  taste alone.
- Cover every functionality the slice bundles with at least one screen.
- Keep `content` to the three keys screens/states/design_system.
- Return the draft paths, not the contents.
