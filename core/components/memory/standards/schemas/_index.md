# Schemas

Canonical YAML schemas that drive the shape of artifacts produced by plays and skills. Schemas are the holy grail — every skill that writes an artifact conforms to its schema, and every validator uses the schema as its source of truth.

Agents and skills query this category when they need to know: **"What does a valid {artifact type} look like?"**

## Contents

| Path | Description | Consumers |
|------|-------------|-----------|
| `intent.yaml` | Canonical intent.yaml contract — the 4 content fields (intent, constraints, failure_conditions, scenarios) plus the metadata zone (name, description, version, checksum). Produced by `intent-crafter`, consumed by `intent-resolver` and `/play-creator`. | `intent-crafter`, `intent-resolver`, `play-creator`, every play's `reference/intent.yaml` |
| `intent-epic.yaml` | Canonical intent-epic contract — identity, WHAT/WHY, boundaries (in_scope/anti_goals/must_not_break), outcomes, constraints, business rules, validation, KB traceability, dependency graph, foundation flag, mock tracking. | `generate-intent-epics`, `validate-intent-epics` |
| `screen-inventory.yaml` | Canonical screen-inventory contract — per-screen states, data fields, actions, accessibility posture, wireframe reference. | `generate-screen-inventory`, `validate-screen-coverage`, `compile-design-spec` |
| `pr-findings.yaml` | Canonical schema for the `findings.yaml` artifact produced by `quality-check-scoped`. Defines meta fields, findings array (standard_id, severity, file, line, evidence), counts, sort order, and rejection rules. | `quality-check-scoped`, `review-pr`, `quality-check` |

## ProductOS v1 schemas (`product-os/`)

The persistent data model for the ProductOS Command Model (#434) lives in the `product-os/` subfolder, separate from the play-compilation schemas above:

| Path | Defines | Lifecycle |
|------|---------|-----------|
| `product-os/product-os.yaml` | the Domain → Capability → Functionality tree, personas, journeys | permanent |
| `product-os/ice.yaml` | Intent / Context (persona, systems, scope) / Expectations on a node — the build unit | permanent |
| `product-os/decision.yaml` | decision records (ADRs) at any level | permanent |
| `product-os/capability-intent.yaml` | the 5 realize lenses (ux, architecture, delivery, quality, agentic) | permanent |
| `product-os/epic.yaml` | a vertical slice of a functionality, the delivery/issue grain | temporary (deleted on merge) |

See `product-os/_index.md` for the full set and storage lifecycle.

## When to Add Here

A file belongs in `schemas/` if:
- It defines the YAML structure of an artifact produced by a skill
- It is referenced by a validator as the source of truth for shape
- Every downstream consumer conforms to it without deviation

A file does NOT belong here if:
- It defines RULES about artifact content (those go in `rules/`)
- It is a template or output shape (those go in `templates/`)
- It is markdown prose documentation (those go in `rules/` or elsewhere)

## Schema discipline

- Every schema file is authoritative. Skills never invent fields not in the schema.
- Schema changes are validator-breaking. When a field is added or removed, the validator is updated in the same commit.
- Schemas carry their own validation-rules comment block at the end, documenting what validators must enforce.
