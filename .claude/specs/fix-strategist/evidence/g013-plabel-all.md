# G-013: P-Label Replacement in All Files

**Gate:** All files use full play names instead of P-labels. generate-business-review and final-report.md specifically checked.
**Mandatory:** Yes
**Result:** PASS

## Test 1: generate-business-review/SKILL.md

**Prompt:** `grep "P[5-8]" core/components/skills/generate-business-review/SKILL.md`

**Output:**
```
No matches found
```

**Current content (line 19):**
```
Shared across discover-product, plan-roadmap, and manage-backlog plays.
```

Uses full play names.

## Test 2: final-report.md

**Prompt:** `grep "P[5-8]" core/components/plays/discover-product/templates/final-report.md`

**Output:**
```
No matches found
```

No P-labels present.

## Test 3: Full sweep

**Prompt:** `grep "P[5-8]" core/components/` (recursive)

**Output:**
```
No matches found
```

Zero P-labels in any file.

**Verdict:** All P-labels replaced with play names. Gate passes.
