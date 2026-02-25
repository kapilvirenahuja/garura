# G-008: Multi-Intent Support

**Gate:** Decision Framework must support compound intents with: multi-intent recognition, sequential execution, data flow, compound output contract, partial failure handling.
**Mandatory:** Yes
**Result:** PASS

## Test 1: Multi-Intent Recognition section exists

**Prompt:** `grep "Multi-Intent" core/components/agents/product-strategist.md`

**Output:**
```
76:### Multi-Intent Recognition
83:4. **Compose output** — Return a compound result (see Output Contracts → Compound Output)
264:### Compound Output (Multi-Intent)
```

## Test 2: Partial Failure handling exists

**Prompt:** `grep "Partial Failure" core/components/agents/product-strategist.md`

**Output:**
```
324:### Handling Partial Failure
```

## Element checklist

| Required Element | Location | Present |
|-----------------|----------|---------|
| Multi-intent recognition | Line 76: "A single prompt may contain multiple intents" | Yes |
| Sequential execution with dependency ordering | Line 82: "Process dependent intents in order" | Yes |
| Data flow between skills (output N → input N+1) | Line 82: "passing output of skill N as input to skill N+1" | Yes |
| Compound output contract | Line 264: `### Compound Output (Multi-Intent)` with `results` array | Yes |
| Partial failure handling | Line 324: `### Handling Partial Failure` with completed + failed return | Yes |
| "One skill per intent" language | Line 37: "one skill per identified intent" | Yes |

**Verdict:** All 6 elements present. Gate passes.
