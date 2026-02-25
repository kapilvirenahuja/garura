# G-001: Model Correctness

**Gate:** product-strategist.md frontmatter must contain `model: opus`
**Mandatory:** Yes
**Result:** PASS

## Test

**Prompt:** `grep "^model:" core/components/agents/product-strategist.md`

**Output:**
```
6:model: opus
```

**Verdict:** Line 6 contains `model: opus`. Gate passes.
