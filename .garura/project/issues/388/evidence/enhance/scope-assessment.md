# Scope assessment — #388

Assessed against C6 thresholds, drawing on `context/context-bundle.md`.

## Already aligned (no changes — confirmed by tech-designer's bundle)

- `docs/philosophy/intent-driven-development.md` (ICE section + Eight Elements + Principles all teach three-element model)
- `docs/philosophy/idsd.md` (references main file, no independent definition)
- `core/grounding/glossary.md` (Intent, ICE, Expectation, intent.yaml all clean)
- `core/components/agents/intent-crafter.md` (deny-list + clean-triple authoring)
- `core/components/skills/author-intent-yaml/SKILL.md` (emits clean triple only)
- `core/components/skills/validate-intent-epics/SKILL.md` (out of scope — operates on product epics, not play intents)
- `core/components/skills/generate-intent-epics/SKILL.md` (out of scope — same)
- `core/components/skills/validate-abstraction-layer/SKILL.md` (out of scope — product-stage linter)
- `core/components/memory/standards/rules/expectation-generation.md` (handles migrated + legacy)
- `core/components/memory/standards/rules/feature-expectation-generation.md` (already aligned)
- All 26 plays' `reference/intent.yaml` (clean triple universal)

## Actual change surface

| File | Change |
|------|--------|
| `core/components/agents/intent-resolver.md` | Stop reading `scenarios:` from intent.yaml. Add `expectation_path` to input fields. Read `success_scenarios` from the Expectation artifact for Stage 6 task generation. Direct edit (per CLAUDE.md non-intent change rule — agent prompts are not compiled plays). |
| `core/components/memory/standards/rules/builder-isolation.md` (NEW) | Codify the rule: "the builder receives goal + constraints + Context only; success scenarios live in the Expectation and reach the validator only." Names the per-play HITL config as the Expectation-vetting governor. Carries the decision rule ("would knowing this change how the builder writes code?") with one worked example. Referenced from intent-crafter and intent-resolver agent prompts. |
| `core/components/agents/intent-crafter.md` | Add a short cross-reference to `standards/rules/builder-isolation.md` so the rule is discoverable from the agent that authors Intent. Minor edit. |
| `core/components/agents/intent-resolver.md` | (Same file as row 1) — also cross-reference `builder-isolation.md`. |

Likely files touched: 3 (one new rule file + two existing agent prompts).

## C6 signal table

| Signal | Value | Threshold |
|---|---|---|
| Files touched | 3 | ≤3 → fix-it / 4–15 → enhance / >15 → /prepare |
| Domains crossed | 1 (Garura framework doctrine) | 1 → fix-it eligible / 1–2 → enhance / 3+ → /prepare |
| New abstractions | 1 (the `builder-isolation.md` rule file) | 0 → fix-it eligible / 0–2 → enhance / new bounded context → /prepare |
| Tests impacted | 0 (no test suite for these surfaces) | ≤5 → fix-it eligible |
| Estimated effort | ~30 min direct edits + verification | <1hr → fix-it / 1hr–1day → enhance |

## Recommendation

The three signals all sit at the fix-it / enhance boundary. Two reasons to keep this in /enhance rather than redirect to /fix-it:

1. The rule file (`builder-isolation.md`) is a new doctrine surface, not a defect fix. /fix-it is RCA-driven and presumes a defect-shaped problem.
2. The work crosses agents + new KB rule + cross-references. /enhance's design + verify + judge loop fits this multi-surface coordination better than /fix-it's single-RCA-single-fix pattern.

**Verdict:** right-sized for /enhance. Proceed.
