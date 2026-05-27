# Discovery — #390 Align product-layer epics with ICE

## Issue summary (from GitHub #390)

The framework's play layer migrated to ICE (Intent = clean triple, Expectation = success_scenarios + recovery, Context = surrounding). The product layer did not. `generate-intent-epics` and the `intent-epic.yaml` schema still bundle intent, scenarios, failure_scenarios, mitigations, NFRs, business rules — everything — into one shape. Two alignment gaps:

1. Epics do not follow the ICE split (intent vs expectation vs vetting).
2. `intent` is singular per epic — one end-state sentence — even when one vertical slice carries multiple closely-related observable outcomes.

The fix the issue body proposed: split schema into two files (`intent-epic.yaml` + `epic-expectation.yaml`), rewrite the skill, add a crafter agent + new skill mirroring play-layer pieces, update validator, allow `intents: [...]` list.

## Q&A decisions (override on file split)

### Q1 — Where do NFR-style "quality bars" live in the new shape?
**Answer:** They become `constraints` inside the intent block. The existing derivation from `quality-profile.yaml` (already implemented in /specify) stays — the skill continues to source constraints from the profile and tag them with `source_for_quantification`. Renaming/regrouping only — no new derivation mechanism.

### Q1a — One file or two?
**User override of issue body:** Keep ONE file per epic. The epic remains the unit. Inside the file, follow the ICE shape: an intent block (intents list + constraints + failure_conditions) and an expectation block (success_scenarios + recovery) sitting side by side.

### Q1b — Tethers
**Answer:** Single Tether covers the intent + expectation together. Do NOT introduce a second separate Tether for the expectation. The existing epic-approval flow gates both.

### Q2 — What about the 9 existing epics under `.garura/product/scope/epics/`?
**Answer:** Rewrite all 9 in this same change. After the work lands, every epic on disk is in the new shape.

### Q3 — Names for the new pieces
**Answer:**
- New agent: `epic-expectation-crafter` (mirrors `expectation-crafter`)
- New skill: `draft-epic-expectation` (mirrors `draft-play-expectation`)

### Q4 — Validator scope in this PR
**Answer:** Update `validate-intent-epics` in this same PR. Schema + skill rewrite + new agent + new skill + /specify wiring + validator update + 9 rewritten epics all ship together.

## Implied scope after Q&A

- Schema file: `core/components/memory/standards/schemas/intent-epic.yaml` — restructured to a single file carrying intent block + expectation block. `intents: [...]` list. Constraints stay derived from profile.
- Skill rewrite: `core/components/skills/generate-intent-epics/SKILL.md` — emits intent block only on first pass; hands off to expectation-crafter agent.
- New skill: `core/components/skills/draft-epic-expectation/` — generates success_scenarios + recovery from the intent block, mirror of `draft-play-expectation`.
- New agent: `core/components/agents/epic-expectation-crafter.md` — drives the Tether, mirror of `expectation-crafter`.
- /specify wiring: `core/components/plays/specify/SKILL.md` — invoke the new crafter after generate-intent-epics.
- Validator: `core/components/skills/validate-intent-epics/SKILL.md` — updated to read new shape, enforce per-intent rules across the list.
- Rules doc: `core/components/memory/standards/rules/epics.md` — actor + observable-outcome rules apply per-intent.
- 9 existing epics under `.garura/product/scope/epics/` — rewritten to new shape.

Open items to settle in approach design: exact field naming inside the file for the two blocks; how `epics.md` rules thread per-intent; concrete handoff contract between `generate-intent-epics` and `epic-expectation-crafter`; whether the new skill writes the expectation block back into the same file or stages it and the play merges (single-file constraint suggests in-place write with file-lock semantics).
