# G-010: Tech Context Awareness

**Gate:** Context Loading includes step to check for technical design artifacts in STM. Flags absence as assumption.
**Mandatory:** No (advisory)
**Result:** PASS

## Test

**Prompt:** `grep "Check Tech Context|design/" core/components/agents/product-strategist.md`

**Output:**
```
163:### Step 7: Check Tech Context
165:Read `.garura/{issue}/design/` if exists for technical design artifacts. If found, extract relevant constraints (platform decisions, feasibility flags, known hard problems). If not found, flag "no technical feasibility context available" as an assumption in the output — do not silently ignore the gap.
```

**Verdict:** Step 7 checks for tech artifacts at `.garura/{issue}/design/`, flags absence as assumption. Gate passes.
