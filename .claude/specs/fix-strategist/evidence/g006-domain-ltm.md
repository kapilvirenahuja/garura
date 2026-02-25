# G-006: Domain-Aware LTM Loading

**Gate:** Context Loading section must include: domain identification, selective LTM search, domain clarification return path, research fallback, STM loading, filtered context injection.
**Mandatory:** Yes
**Result:** PASS

## Test

**Prompt:** `grep "Step [1-8]:" core/components/agents/product-strategist.md`

**Output:**
```
95:### Step 1: Load Config
99:### Step 2: Identify Domain
123:### Step 3: Selective LTM Search
135:### Step 4: Evaluate LTM Sufficiency
142:### Step 5: Domain Research Fallback
156:### Step 6: Load STM
163:### Step 7: Check Tech Context
167:### Step 8: Inject Context
```

## Element checklist

| Required Element | Step | Present |
|-----------------|------|---------|
| Domain identification | Step 2 (line 99) | Yes |
| Selective LTM search (not bulk load) | Step 3 (line 123) | Yes |
| Domain clarification return path | Step 2 (lines 106-121, `domain_clarification_needed` YAML) | Yes |
| Research fallback | Step 5 (line 142, invokes `research-domain-context`) | Yes |
| STM loading | Step 6 (line 156) | Yes |
| Filtered context injection (not raw dump) | Step 8 (line 167) | Yes |

**Verdict:** All 6 required elements present across 8 steps. Gate passes.
