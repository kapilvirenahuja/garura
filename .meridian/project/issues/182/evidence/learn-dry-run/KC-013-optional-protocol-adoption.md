# Agent Update Pattern for Optional Protocol
<!-- knowledge-file: tier=2 scope=core -->

**When this applies:** Updating multiple agents to adopt a new optional protocol, where each agent needs the same structural change but with its own domain-specific behavior.
**When this does NOT apply:** Mandatory protocol changes that all agents must adopt simultaneously; single-agent updates with no cross-agent consistency requirement.
**Search patterns:** optional protocol, agent update pattern, protocol adoption, normative document reference, conditional step, per-agent diff
**Provenance:** Issue #182 — learn play dry run
**Created:** 2026-03-31

## Content

To adopt an optional protocol across a set of agents, apply the same structural change to each agent:

**Step 1: Add a conditional step**
Insert a step at the appropriate point in the agent's execution flow:
```
If {new_field} is present in input:
    Execute {new_protocol} behavior
Else:
    Continue with existing behavior (no change)
```
The condition gates the new behavior. Agents that do not receive the field behave identically to before the update.

**Step 2: Reference the normative protocol document**
Do NOT embed the protocol logic in the agent. Instead, reference the authoritative protocol spec:
```
See: protocols/{protocol-name}.md for full specification
```
This ensures: (a) all agents implement the same behavior for the same field, (b) when the protocol evolves, only the protocol document changes, not every agent.

**Step 3: Add output field to the agent's output contract**
The new protocol typically produces an output (e.g., a trace, a report, a metadata field). Add this as an optional field in the output contract, present only when the input field was provided.

**Step 4: Verify no-op when field absent**
Test that the agent's output is byte-for-byte identical to pre-update output when the new field is not provided. This is the backward compatibility guarantee.

**Per-agent diff size:** Following this pattern, each agent update should be small — typically 5-15 lines added. Larger diffs indicate that protocol logic leaked into the agent rather than staying in the protocol document.

## Why It Matters

Without a consistent update pattern, each engineer updating an agent invents their own approach: some embed the logic, some reference the spec, some add it in different locations. The result is N different implementations of the "same" protocol with subtle behavioral differences. A defined update pattern ensures consistency while keeping individual agent diffs minimal and reviewable.

## Applicability Boundaries

**In scope:** Any system with multiple independent agents/services that need to adopt a shared protocol at their own pace, where the protocol is defined in a single authoritative document.
**Out of scope:** Protocol changes that require architectural refactoring per-agent; cases where each agent legitimately needs a different implementation of the protocol.

## Rationale

Reference-over-embed is a universal principle in modular systems. API gateways reference auth policies rather than embed them; services reference configuration rather than hardcode it. The specific application to optional protocol adoption in agent systems generalizes from this principle. The four-step pattern described here is a repeatable play for any multi-agent protocol rollout.

## Decay Tracking

**Last validated:** 2026-03-31
**Confidence:** medium
**Staleness window:** 180 days
**Supersedes:** null
