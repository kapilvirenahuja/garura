# Discovery — Issue #265

**Title:** /specify must emit scope/features.yaml just before epic generation
**Captured:** 2026-04-19

## Issue summary

`/specify` today does not declare `.meridian/product/scope/features.yaml` as an output. Dogfooding on Garura (Apr 2026) produced `specification/implementation-inventory.yaml` which had to be hand-moved into `scope/features.yaml`. Fix: insert a new step in `/specify` after `enrich-capabilities` and before `generate-intent-epics` that emits `features.yaml`, using `.garura/product/scope/features.yaml` as the canonical schema. Retire `implementation-inventory.yaml`. Update `generate-intent-epics` to declare `features.yaml` as an input.

## Q&A

**Q1 — Authoring owner: agent or user?**
A: Agent authors, user reviews and approves. Introduce a new skill with explicit rules on how features are written.

**Q2 — New skill vs. extend existing?**
A: New skill — **`manage-features`**. Not extending `enrich-capabilities`. (Note: existing `draft-product-spec` skill has a `features.yaml` schema in a different context — potential naming overlap to disambiguate during approach design.)

**Q3 — `status` field scale?**
A: Adopt feature-flag-world 5-point vocabulary:
`planned → development → rollout → released → cleanup`.
Initial status per-feature is what the user tells; the skill runs on both greenfield (GF) and brownfield (BF), so status can vary. The existing Garura file uses 3 values (`live`, `partial`, `planned`) — must be migrated.

**Q4 — Retire `implementation-inventory.yaml`?**
A: Yes, retire entirely. No back-compat shim. Verify via codebase scan during context assembly that no code currently emits or reads this path.

## Additional scope item surfaced

Migrate `.garura/product/scope/features.yaml` to the 5-point vocabulary in the same change set. Proposed mapping (confirm in approach):
- `planned` → `planned`
- `partial` → `rollout`
- `live` → `released`
No existing feature uses `development` or `cleanup` yet; leave those unassigned.

## Open items for context assembly

- Locate where `implementation-inventory.yaml` is referenced (if at all).
- Read `specify/reference/intent.yaml` to identify the correct insertion point between `enrich-capabilities` and `generate-intent-epics`.
- Identify all consumers of the current 3-value status (briefs, validators, dashboards) so migration does not break rendering.
- Check `draft-product-spec/schemas/features.yaml` for semantic overlap with the new `manage-features` skill output.
