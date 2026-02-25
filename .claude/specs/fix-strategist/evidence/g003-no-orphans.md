# G-003: No Orphan Skills

**Gate:** Every skill in Available Skills table must have a corresponding SKILL.md file. No orphan references.
**Mandatory:** Yes
**Result:** PASS

## Test 1: Extract skills from agent table

**Prompt:** `grep "| \x60\w" core/components/agents/product-strategist.md` (lines 49-53 in Available Skills)

**Output:**
```
49:| `discover-product-opportunity` | Parse problem/idea, extract market context | discover-product (DRAFT) |
50:| `draft-product-vision` | Create vision.md with Strategic Goals | discover-product (DRAFT) |
51:| `validate-product-vision` | Check vision completeness before lock | discover-product (VALIDATE) |
52:| `generate-business-review` | PM-facing business review from any product artifact | discover-product, plan-roadmap, manage-backlog |
53:| `research-domain-context` | Research vertical domain knowledge via web when LTM is insufficient | discover-product (DRAFT, conditional) |
```

Skills referenced: 5

## Test 2: Verify each skill file exists

**Prompt:** `glob "core/components/skills/*/SKILL.md"`

**Output:**
```
core/components/skills/create-commit/SKILL.md
core/components/skills/analyze-changes/SKILL.md
core/components/skills/analyze-pr/SKILL.md
core/components/skills/manage-issue/SKILL.md
core/components/skills/setup-branch/SKILL.md
core/components/skills/submit-pr/SKILL.md
core/components/skills/sync-claude/SKILL.md
core/components/skills/discover-product-opportunity/SKILL.md    ← match
core/components/skills/draft-product-vision/SKILL.md            ← match
core/components/skills/validate-product-vision/SKILL.md         ← match
core/components/skills/generate-business-review/SKILL.md        ← match
core/components/skills/research-domain-context/SKILL.md         ← match
```

All 5 referenced skills have SKILL.md files on disk.

## Test 3: Verify old orphan skills are gone

**Prompt:** `grep "prioritize-product-features|draft-product-roadmap|validate-product-roadmap|decompose-product-epic|draft-product-stories|validate-product-backlog|analyze-backlog|refine-product-stories" core/components/agents/product-strategist.md`

**Output:**
```
No matches found
```

Zero orphan skill references remain.

**Verdict:** 5 skills referenced, 5 files exist, 0 orphans. Gate passes.
