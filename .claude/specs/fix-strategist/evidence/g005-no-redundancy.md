# G-005: No Redundant Sections

**Gate:** Agent file must have exactly ONE intent-to-skill mapping section. No duplicate mapping tables.
**Mandatory:** Yes
**Result:** PASS

## Test 1: Count "Intent → Skill Mapping" headings

**Prompt:** `grep "### Intent → Skill Mapping" core/components/agents/product-strategist.md`

**Output:**
```
55:### Intent → Skill Mapping
```

Exactly 1 occurrence.

## Test 2: Verify "When to Use Each Skill" is gone

**Prompt:** `grep "When to Use Each Skill" core/components/agents/product-strategist.md`

**Output:**
```
No matches found
```

Old redundant section removed.

**Verdict:** Single unified intent-to-skill mapping section. No redundancy. Gate passes.
