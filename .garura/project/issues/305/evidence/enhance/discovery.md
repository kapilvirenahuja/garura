# Discovery — Issue #305

**Title:** /design play — multi-scenario input (epic/feature), brownfield gap analysis, visual identity / design system in scope

## Issue body
Evolve /design to work on multiple scenarios. Four changes:
1. **Multi-scenario input boundary** — today /design runs product-wide on locked specify output. Add support for running on a single feature or single epic as the boundary.
2. **Brownfield + gap analysis** — on entry, check for existing design artifacts under `.garura/product/experience/`. If present → gap-only mode (deltas + proposed fills). If absent → greenfield. Do NOT grep the whole codebase — scope the check to `.garura/product/`.
3. **Clarify visual design scope** — original said "low-fidelity, no visual". Correction: **screens remain wireframe-level structural**, but the **Design System** (tokens, fonts, colors, palette, inspirations) is **first-class in scope**. User interview for inspirations.
4. **Lock design down** — terminal gate that marks artifacts LOCKED (keep existing mechanism).

No implementation — play only produces design artifacts (DS, wireframes, personas, flows, spec).

## Clarifications captured

- **Visual scope — exact meaning:** Design System is in scope (tokens, fonts, palette, inspirations). Screens stay structural wireframes — visual fidelity at the DS level, not the screen level.
- **Brownfield trigger:** check ONLY `.garura/product/` (the product tree). Do not scan source code or other trees. If `.garura/product/experience/` or related is populated → gap-only mode. Else greenfield.
- **Artifacts produced by this play:** design system, wireframes, personas, flows, consolidated design spec. No implementation.
- **Process rule — sub-agent handoff for /create-play --rebuild:** When the implementation step reaches `/create-play --rebuild design`, sub-agents cannot invoke the Skill tool for create-play. The sub-agent MUST signal back to the orchestrating play (the enhance play) so the play invokes `/create-play --rebuild design` via the Skill tool directly.

## What existing code is touched

- `core/components/plays/design/reference/intent.yaml` — primary edits (constraints + scenarios + process steps)
- `core/components/plays/design/SKILL.md` — regenerated via `/create-play --rebuild design`
- Possibly: skills list — existing `synthesize-personas`, `generate-screen-inventory`, `map-user-flows`, `generate-wireframes`, `compile-design-spec`. May need a new DS-authoring skill or capability extension to one of these.

## Constraints

- Must respect the updated rule: intent.yaml changes → `/create-play --rebuild design`. Play orchestrator runs it, not sub-agents.
- Must stay inside product tree for brownfield check.
- Must not collapse screens into visual design — DS is the visual surface, screens are structural.

## Success criteria

- /design can be invoked with `--epic` or `--feature` arg (single-unit scope), or without arg for product-wide (existing behaviour).
- On invocation, /design detects existing `.garura/product/experience/` artifacts and routes to gap mode OR greenfield mode.
- DS authoring phase exists with user interview for tokens/fonts/inspirations.
- Screens phase unchanged in fidelity (structural wireframes).
- Terminal LOCKED gate unchanged.
