# Play Analysis — design (rebuild for C19/C20/C21 + F18/F19 + S8/S9)

**Intent file:** `core/components/plays/design/reference/intent.yaml`
**Intent hash:** `sha256:7560d9b0efdc98b05c6d0e70036ccdf081ebb1ce0eeee879b9122c5ebae48876`
**Prior SKILL.md:** 632 lines, Workflow Structure A (3 human checkpoints + 5 decision-surfacing sub-gates)

## What changed

- **NEW C19:** Scope resolution pre-flight (no-args → product-wide; `--epic <id>`; `--feature <id>`).
- **NEW C20:** Brownfield detection — scan `{product_base}experience/` for existing artifacts; set `mode = greenfield | gap-only`.
- **NEW C21:** Step 5b Design System authoring — designer invokes `draft-design-system` between Checkpoint 2 and Step 6.
- **REVISED C13:** Design System IS in scope as a separate artifact at `{product_base}experience/design-system.md`. Wireframes remain structural.
- **REVISED F12:** Visual elements inside wireframe ASCII blocks remain forbidden; DS is the allowed home for visual tokens.
- **NEW F18:** Gap-only mode cannot overwrite LOCKED artifacts without an explicit delta checkpoint or `--force-stage`.
- **NEW F19:** Design System must not carry pixel-level / implementation-level specs (specific hex, rem/px, CSS variable names outside Inspirations).
- **NEW S8:** Product owner scopes design to a single epic via `--epic`.
- **NEW S9:** Designer re-enters a product with LOCKED personas/screens; resumes from DS + flows + wireframes + compile-spec.

## Impact on workflow

Workflow Structure A is preserved. Additions:

- Pre-flight gains **scope resolution** (C19) and **brownfield detection** (C20).
- New **Step 5b — Draft Design System** inserted between Checkpoint 2 (Step 5) and Step 6 (map user flows).
- New **Step 5b-a — Decision Surfacing (DS)** mirrors the existing sub-gate pattern.
- Step 9 (compile-design-spec) input contract gains `design_system_path`.

No contract removals. The 6 prior inferred-decision skills retain their decision-manifest output; the new 7th skill (`draft-design-system`) gains one.
