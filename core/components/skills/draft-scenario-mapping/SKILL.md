---
name: draft-scenario-mapping
description: DEPRECATED — functionality dissolved into scenarios.yaml (feature_gates) and plan.yaml (scenario_gate per feature in execution_order)
user-invocable: false
model: sonnet
allowed-tools: Read, Write
---

# draft-scenario-mapping

**DEPRECATED**

This skill has been dissolved. Its functionality now lives in two places:

- **Feature gate mapping** (which scenarios must pass for a feature to be accepted) → `scenarios.yaml`, `feature_gates` section, produced by `draft-verification-scenarios`
- **Phase gate mapping** (which scenarios must pass before moving to the next implementation phase) → `plan.yaml`, `scenario_gate` per entry in `execution_order`, produced by `draft-implementation-plan`

Do NOT invoke this skill. It is retained here for historical reference only.

---

## Original Purpose (historical)

Took verification scenarios and LLD implementation phases and produced a `scenario-mapping.md` artifact. This mapping told validators which scenarios to run after each implementation phase completed.

## Why Dissolved

The mapping responsibility was split across two artifacts that are each better owners:

- `scenarios.yaml` already has full scenario knowledge and is the canonical validator artifact. The `feature_gates` section is a natural home for "which scenarios gate which feature."
- `plan.yaml` already has the implementation sequencing. The `scenario_gate` field per `execution_order` entry is a natural home for "which scenarios must pass before the next feature begins."

Maintaining a third artifact (`scenario-mapping.md`) to join information already present in two other artifacts created redundancy and a synchronization burden.

## Migration

If you previously invoked `draft-scenario-mapping`, replace with:

1. `draft-verification-scenarios` — produces `scenarios.yaml` including `feature_gates` section
2. `draft-implementation-plan` (or equivalent plan-producing skill) — produces `plan.yaml` including `scenario_gate` per feature in `execution_order`

## Version

| Field | Value |
|-------|-------|
| Version | 2.0.0 (DEPRECATED) |
| Category | analysis |
