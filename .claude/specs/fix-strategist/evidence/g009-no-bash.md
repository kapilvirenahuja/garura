# G-009: No Bash Section

**Gate:** No BASH USAGE section, no allow/deny tables, no Bash in frontmatter tools.
**Mandatory:** Yes
**Result:** PASS

## Test 1: No BASH references

**Prompt:** `grep "BASH|Bash is available" core/components/agents/product-strategist.md`

**Output:**
```
No matches found
```

## Test 2: Bash not in frontmatter tools

**Prompt:** `read core/components/agents/product-strategist.md` (lines 7-15)

**Output:**
```yaml
tools:
  - Task
  - Read
  - Write
  - Glob
  - Grep
  - Skill
  - WebSearch
  - WebFetch
```

No Bash in tools list.

**Verdict:** Zero Bash references, not in tools list. Gate passes.
