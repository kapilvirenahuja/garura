# G-016: Agent Output Contracts Updated

**Gate:** Output Contracts section includes compound output format for multi-intent responses. Single-intent contracts unchanged.
**Mandatory:** Yes
**Result:** PASS

## Test

**Prompt:** `grep "Compound Output" core/components/agents/product-strategist.md`

**Output:**
```
264:### Compound Output (Multi-Intent)
```

## Content verification (lines 264-283)

```yaml
### Compound Output (Multi-Intent)

When processing multiple intents in a single invocation, return results keyed by intent:

results:
  - intent: "{identified intent 1}"
    skill: "{skill invoked}"
    status: "success|failure"
    output: {skill-specific contract from above}
  - intent: "{identified intent 2}"
    skill: "{skill invoked}"
    status: "success|failure"
    output: {skill-specific contract from above}
    failure: {structured failure if status=failure}

Single-intent invocations return the skill-specific contract directly (not wrapped in `results`).
```

Compound format present. Single-intent distinction stated. Partial failure support via per-intent `failure` field.

**Verdict:** Compound output contract documented alongside single-intent contracts. Gate passes.
