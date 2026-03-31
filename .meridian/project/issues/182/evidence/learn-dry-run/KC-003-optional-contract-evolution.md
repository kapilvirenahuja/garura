# Optional Contract Fields for Safe Protocol Adoption
<!-- knowledge-file: tier=2 scope=core -->

**When this applies:** Extending an existing agent or recipe contract with new fields that not all callers will provide immediately.
**When this does NOT apply:** Breaking changes where old behavior must be explicitly disabled; fields that must always be present for the agent to function correctly.
**Search patterns:** contract evolution, optional fields, backward compatibility, protocol adoption, incremental rollout, field presence check
**Provenance:** Issue #182 — learn recipe dry run
**Created:** 2026-03-31

## Content

When a new capability is added to an agent contract, the new input field must be optional. The agent checks for field presence before activating new behavior:

```yaml
# Agent logic (pseudocode)
if resolution_trace_enabled is present and resolution_trace_enabled == true:
    activate resolution trace behavior
else:
    proceed with existing behavior unchanged
```

**Contract update pattern:**
1. Add the new field to the agent's input contract definition, marked optional with a default.
2. Add a conditional branch in the agent's execution that gates new behavior on field presence.
3. Add the corresponding output field to the output contract, also optional.
4. Update only the recipes/callers that need the new behavior. Leave others unchanged.

**No flag-day requirement:** Because existing callers do not send the field, they receive existing behavior. New callers opt in by including the field. Both work simultaneously against the same agent version.

**Validation rule:** An agent must never fail or degrade when an optional field is absent. Absence equals "use prior behavior." This must be tested explicitly — call the agent without the field and verify output is identical to pre-change output.

**Deprecation path:** Once all callers have adopted the field, it can be promoted to required in a future contract version. Track adoption before promoting.

## Why It Matters

Mandatory new fields require coordinating updates across all callers simultaneously — a flag-day migration. In a system with many recipes and agents, this creates either a long freeze while all callers are updated, or broken callers during the transition. Optional fields decouple the rollout: the agent is updated once, callers adopt on their own schedule, and the system remains functional throughout.

## Applicability Boundaries

**In scope:** Any multi-caller agent system where contracts are versioned and callers are updated independently. Applies whether callers are recipes, other agents, or external tools.
**Out of scope:** Internal agent state or private implementation details that are never exposed in the contract. Single-caller agents where caller and agent are always updated together.

## Rationale

Optional-first contract evolution is a universal API design principle (Postel's Law, OpenAPI optional fields, gRPC field presence). Its application to agent contracts in Meridian is an instance of the general principle. Any framework with independently-versioned components benefits from this pattern.

## Decay Tracking

**Last validated:** 2026-03-31
**Confidence:** medium
**Staleness window:** 180 days
**Supersedes:** null
