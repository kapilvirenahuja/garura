# Recipe Analysis: discover-product

**Analyzed at:** 2026-03-06T20:45:00+0530
**Mode:** Rebake deep read

## Semantic Map

### Recipe → Phases → Steps → Agent Dispatches

| Phase | Step | Owner | Skill | Task ID |
|-------|------|-------|-------|---------|
| DRAFT/Preparation | Step 1 — Discover Opportunity | product-strategist | discover-product-opportunity | draft-discover-opportunity |
| DRAFT/Preparation | Step 2 — Draft Vision | product-strategist | draft-product-vision | draft-vision |
| DRAFT/Preparation | Step 3 — Generate HTML Brief | doc-builder | generate-product-brief | draft-generate-brief |
| DRAFT/Checkpoint | Step 4 — Write Checkpoint | recipe | — | draft-checkpoint |
| DRAFT/Evidence | Step 5 — Write Evidence | recipe | — | draft-evidence |
| VALIDATE/Execution | Step 1 — Validate Vision | product-strategist | validate-product-vision | validate-vision |
| VALIDATE/Checkpoint | Step 2 — Validation Review | recipe | — | validate-checkpoint |
| VALIDATE/Evidence | Step 3 — Write Evidence | recipe | — | validate-evidence |
| LOCK/Execution | Step 1 — Lock Vision | recipe (0 agent calls) | — | lock-vision |
| LOCK/Evidence | Step 2 — Write Evidence | recipe | — | lock-evidence |

### Agent Dispatches in DRAFT Phase

1. product-strategist (discover-product-opportunity) — Step 1
2. product-strategist (draft-product-vision) — Step 2
3. doc-builder (generate-product-brief) — Step 3

**Total: 3 dispatches, 2 distinct agents**

### Intent Constraint Coverage

| Constraint | Referenced In |
|-----------|--------------|
| C1 (intent >5 words) | Pre-flight |
| C2 (phase argument) | Pre-flight |
| C3 (artifact path for VALIDATE/LOCK) | Pre-flight |
| C4 (delegation to agents) | Role section (structural) |
| C5 (agent call limits) | LOCK Step 1 "C5: 0 agent calls in LOCK", domain clarification "C5 agent call limit" |
| C6 (product STM path) | Path resolution section |
| C7 (Strategic Goals not OKRs) | SE-1 |
| C8 (checkpoint before results) | Step 4 |
| C9 (max 2 cycle-back iterations) | VALIDATE Step 2 |
| C10 (human-reviewable brief) | SE-11 |
| C11 (domain clarification) | Step 1 domain clarification handling |

### Failure Condition → Eval Coverage

| FC | Evals |
|----|-------|
| F1 | SE-1, SE-2 |
| F2 | SE-3 |
| F3 | SE-4 |
| F5 | SE-6 |
| F6 | SE-7 |
| F7 | SE-8, SE-9, pre-flight |
| F9 | SE-11 |

### Scenario → Eval Coverage

| Scenario | Eval |
|----------|------|
| S1 | SCE-1 |
| S2 | SCE-2 |
| S3 | SCE-3 |

### Skills

| Skill | Path | Exists |
|-------|------|--------|
| discover-product-opportunity | core/components/skills/discover-product-opportunity/SKILL.md | YES |
| draft-product-vision | core/components/skills/draft-product-vision/SKILL.md | YES |
| validate-product-vision | core/components/skills/validate-product-vision/SKILL.md | YES |
| generate-product-brief | core/components/skills/generate-product-brief/SKILL.md | YES |

### Agents

| Agent | Path | Exists |
|-------|------|--------|
| product-strategist | core/components/agents/product-strategist.md | YES |
| doc-builder | core/components/agents/doc-builder.md | YES |
| repo-orchestrator | core/components/agents/repo-orchestrator.md | YES |

### Skill-Agent Alignment

| Recipe Assignment | Agent Declares Skill | Aligned |
|-------------------|---------------------|---------|
| product-strategist → discover-product-opportunity | YES | YES |
| product-strategist → draft-product-vision | YES | YES |
| product-strategist → validate-product-vision | YES | YES |
| doc-builder → generate-product-brief | YES | YES |

### Template References

| Template | Path | Exists |
|----------|------|--------|
| product-vision.md | core/components/memory/standards/templates/product-vision.md | YES |
| product-brief.html | core/components/memory/standards/templates/product-brief.html | YES |

### Workflow Structure

- DRAFT: Structure A (Pre-flight → Preparation → Checkpoint → Evidence)
- VALIDATE: Structure A (Pre-flight → Execution → Checkpoint → Evidence)
- LOCK: Structure B (Pre-flight → Execution → Evidence)

## Identified Issues

### Issue 1: Intent Hash Drift (G9)
- Compiled hash: `sha256:52bd10e76c70b68af3051b388829632bba6d9282ca8b9b295b791740019b5bf9`
- Current hash: `sha256:029c7e7f74d1765769179cf9fd6afc3293a280949df0754b33470e5f77f8299f`
- Cause: Intent was modified (removed old C10/F4/F8, renumbered constraints, updated C5) after business-review removal but recipe was not recompiled.

### Issue 2: Stale "business review" text in compiled recipe
- Line 10 (header): mentions "business review" in operational description
- Line 24 (Forbidden): includes "business review generation" in forbidden actions list
- These are remnants from before the business-review artifact was removed.

### Issue 3: C5 intent accuracy
- Current C5 text: "Maximum 2 distinct agent calls (1 product-strategist, 1 doc-builder)"
- Actual recipe behavior: 2 product-strategist calls + 1 doc-builder call = 3 dispatches, 2 distinct agents
- The parenthetical "(1 product-strategist, 1 doc-builder)" is wrong — should say "(2 product-strategist, 1 doc-builder)"
- The "Maximum 2 distinct agent calls" is ambiguous — does it mean 2 distinct agents or 2 total calls?

### Issue 4: doc-builder agent stale reference
- doc-builder.md line 158 still references `business_review_path` in its Inject Context section
- This is an agent-level issue, not a recipe gap, but should be cleaned up.
