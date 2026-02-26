# G-004: No Undefined Labels (P5/P6/P7/P8)

**Gate:** No P5/P6/P7/P8 labels in any file in the feature scope. All references must use full recipe names.
**Mandatory:** Yes
**Result:** PASS

## Test

**Prompt:** `grep "P[5-8]" core/components/` (recursive, all files)

**Output:**
```
No matches found
```

## Files scanned

- `core/components/agents/product-strategist.md`
- `core/components/skills/discover-product-opportunity/SKILL.md`
- `core/components/skills/draft-product-vision/SKILL.md`
- `core/components/skills/validate-product-vision/SKILL.md`
- `core/components/skills/generate-business-review/SKILL.md`
- `core/components/skills/research-domain-context/SKILL.md`
- `core/components/recipes/discover-product/SKILL.md`
- `core/components/recipes/discover-product/reference/intent.yaml`
- `core/components/recipes/discover-product/templates/final-report.md`
- `core/components/recipes/discover-product/templates/approval-prompt.md`
- `core/components/recipes/discover-product/templates/checkpoint.md`
- All other files in core/components/

**Verdict:** Zero P-label matches across entire core/components tree. Gate passes.
