# G-007: Domain Context Mechanism Exists

**Gate:** research-domain-context skill exists with proper input/output contracts following skill conventions.
**Mandatory:** Yes
**Result:** PASS

## Test 1: File exists

**Prompt:** `glob "core/components/skills/research-domain-context/SKILL.md"`

**Output:**
```
core/components/skills/research-domain-context/SKILL.md
```

File exists.

## Test 2: Frontmatter structure

**Prompt:** `read core/components/skills/research-domain-context/SKILL.md` (lines 1-7)

**Output:**
```yaml
---
name: research-domain-context
description: Research vertical domain knowledge via web when LTM is insufficient
user-invocable: false
model: sonnet
allowed-tools: WebSearch, WebFetch, Read, Write
---
```

All required frontmatter fields present.

## Test 3: Structural elements

| Element | Present | Location |
|---------|---------|----------|
| Frontmatter | Yes | Lines 1-7 |
| Purpose (DOES/DOES NOT) | Yes | Lines 13-28 |
| Input (required/optional) | Yes | Lines 30-36 |
| Process (numbered steps) | Yes | Lines 38-83 |
| Output (YAML contract) | Yes | Lines 85-101 |
| Constraints (NEVER/ALWAYS) | Yes | Lines 103-111 |
| Version table | Yes | Lines 113-119 |

**Verdict:** File exists, frontmatter correct, all 7 structural elements present. Gate passes.
