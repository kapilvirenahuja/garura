# Tasks: Fix Product-Strategist Agent

---

## Dependency Graph

```
T1 (model) ──────────────────────────────────────┐
T2 (core principle) ─────────────────────────────┤
T3 (orphan skills) ──────────────────────────────┤
T4 (P-labels in agent) ─────────────────────────┤
T5 (merge intent sections) ──────────────────────┤
T6 (LTM redesign) ──────────┐                    ├─→ T12 (verify agent) ──┐
T7 (multi-intent) ──────────┤                    │                        │
T8 (remove bash) ───────────┤                    │                        │
T9 (tech awareness) ────────┘                    │                        │
                                                 │                        │
T10 (new skill: research-domain-context) ────────┘                        │
                                                                          │
T4 runs in parallel with:                                                 │
  T11a (P-labels in play final-report.md) ─────┐                        │
  T11b (P-labels in generate-business-review) ───┤                        │
                                                 │                        │
T12 (verify agent) ──────────────────────────────┤                        │
                                                 ├─→ T13 (play changes) ─┤
T10 (new skill) ─────────────────────────────────┘                        │
                                                                          │
T13 (play SKILL.md + intent.yaml changes) ──→ T14 (verify play) ─────┤
                                                                          │
T14 ──→ T15 (update evidence g-104) ──→ T16 (final verification)         │
                                                                          │
T16 (final full sweep) ←──────────────────────────────────────────────────┘
```

---

## Tasks

### T1: Change model to opus
**File:** `core/components/agents/product-strategist.md`
**Agent:** Direct edit (trivial)
**Blocked by:** None
**Action:** Change `model: sonnet` to `model: opus` in frontmatter (line 6).
**Verification:** G-001

### T2: Rewrite Core Principle with intent structure
**File:** `core/components/agents/product-strategist.md`
**Agent:** Direct edit
**Blocked by:** None
**Action:** Rewrite Core Principle section to explicitly reference two levels of intent:
- **Intent** (the goal — what to achieve)
- **Constraints** (boundaries — how execution is shaped)

State that constraints are not secondary metadata — they are first-class inputs that shape skill selection, execution parameters, and output format. Reference Intent Recognition section for parsing mechanics.

Keep the autonomy statement ("You do NOT follow step-by-step workflows") but ground it in intent structure.
**Verification:** G-002

### T3: Remove orphan skills
**File:** `core/components/agents/product-strategist.md`
**Agent:** Direct edit
**Blocked by:** None
**Action:**
1. Available Skills table: Remove rows for 8 non-existent skills. Keep only:
   - `discover-product-opportunity`
   - `draft-product-vision`
   - `validate-product-vision`
   - `generate-business-review`
2. "When to Use Each Skill" section: Remove entries for orphan skills.
3. "Intent → Skill Mapping" section: Remove orphan examples.
4. Output Contracts: Remove contracts for non-existent skills (if any referenced — check `prioritize-product-features`, `draft-product-roadmap`, etc.).

Note: Do NOT add placeholder entries for future skills. Skills get added when created.
**Verification:** G-003

### T4: Replace P-labels with play names (agent file)
**File:** `core/components/agents/product-strategist.md`
**Agent:** Direct edit
**Blocked by:** None
**Action:** Replace all P5/P6/P7/P8 references:
- P5 → `discover-product`
- P6 → `plan-roadmap`
- P7 → `manage-backlog`
- P8 → `refine-backlog`

In Available Skills "Used By" column, use full play names.
**Verification:** G-004 (partial — agent file only)

### T5: Merge redundant intent mapping sections
**File:** `core/components/agents/product-strategist.md`
**Agent:** Direct edit
**Blocked by:** T3 (orphan removal determines what remains)
**Action:**
1. Remove separate "Intent → Skill Mapping" subsection (lines 81-92).
2. Enhance "When to Use Each Skill" section to include example sentences alongside pattern keywords.
3. Keep "why" column for reasoning context.
4. Result: One unified intent-to-skill reference with patterns, examples, and rationale.
**Verification:** G-005

### T6: Redesign Context Loading (LTM/STM/Domain)
**File:** `core/components/agents/product-strategist.md`
**Agent:** Sub-agent (tech-designer for design, then direct edit)
**Blocked by:** None
**Action:** Replace the entire Context Loading section with domain-aware strategy:

1. **Understand Domain** — From incoming intent, classify the vertical domain and product category. Use keywords, industry markers, user personas mentioned in the problem statement.

2. **Assess Confidence** — If domain classification is high-confidence (clear industry markers, specific user types), proceed without confirmation. If ambiguous, return `domain_clarification_needed` structured response to play with top 2-3 candidate domains.

3. **Selective LTM Search** — Search `~/.meridian/core/memory/` using Glob/Grep for domain-relevant content:
   - `memory/standards/rules/` — always load (rules for every domain surface)
   - `memory/standards/schemas/` — load when writing YAML artifacts
   - `memory/standards/templates/` — load relevant output templates
   - `memory/knowledge/{domain}/` — load if domain directory exists
   Do NOT bulk-load. Search, filter, load relevant files only.

4. **Evaluate LTM Sufficiency** — After loading, assess: Does loaded LTM provide enough domain context for the requested skill? If coverage is thin or absent:
   - Invoke `research-domain-context` skill with knowledge gaps
   - Skill performs web research and writes domain context to STM
   - Load resulting STM artifact as enrichment

5. **Load STM** — Read `.meridian/project/product/` for existing product artifacts (vision, roadmap, reviews).

6. **Check Tech Context** — Read `.meridian/{issue}/design/` if exists for technical constraints. Flag absence as assumption if no tech artifacts found.

7. **Inject Context** — Compose filtered context (relevant LTM + STM + domain research + tech constraints) and pass to skill invocations. Never pass raw bulk content.

**Verification:** G-006, G-010

### T7: Add multi-intent support to Decision Framework
**File:** `core/components/agents/product-strategist.md`
**Agent:** Direct edit
**Blocked by:** None
**Action:** Rewrite Decision Framework to handle compound intents:

1. **Replace "Don't chain"** with "One skill per identified intent. If the incoming prompt contains multiple intents, process each with its corresponding skill in dependency order."

2. **Add Intent Decomposition step** after "Parse the intent":
   - Identify all distinct intents in the prompt
   - Determine dependencies (e.g., draft depends on discover)
   - Order execution: independent intents can theoretically parallelize, dependent intents execute sequentially

3. **Add Data Flow rule:**
   - When skill B depends on output of skill A, pass A's output as input to B
   - The agent manages this data flow, not the play

4. **Add Compound Output Contract** to Output Contracts section:
   ```yaml
   results:
     - intent: "{identified intent 1}"
       skill: "{skill invoked}"
       status: "success|failure"
       output: {skill-specific contract}
     - intent: "{identified intent 2}"
       skill: "{skill invoked}"
       status: "success|failure"
       output: {skill-specific contract}
       failure: {structured failure if status=failure}
   ```

5. **Add Partial Failure rule:**
   - If skill N fails in a chain, return completed results + structured failure for failed skill
   - Do NOT roll back completed skills (their artifacts are already written)
   - Play decides how to handle partial results

6. **Update Handling Ambiguity:**
   - Replace "Don't chain" with "Don't assume intents not present in the prompt"
   - Keep "Don't improvise — Stick to available skills"

**Verification:** G-008, G-016

### T8: Remove Bash section
**File:** `core/components/agents/product-strategist.md`
**Agent:** Direct edit
**Blocked by:** None
**Action:**
1. Delete the entire `### BASH USAGE` section (lines 247-261).
2. Evaluate frontmatter tools list — if no legitimate Bash use case remains after D6/D7 changes (LTM search uses Glob/Grep, not Bash), remove Bash from tools.
3. If Bash is removed from tools, also remove any Bash references in Boundaries or Recovery sections.
**Verification:** G-009

### T9: Add tech context awareness
**File:** `core/components/agents/product-strategist.md`
**Agent:** Direct edit
**Blocked by:** T6 (part of Context Loading redesign)
**Action:** Included in T6 step 6. Verify it's present after T6 execution.
**Verification:** G-010

### T10: Create research-domain-context skill
**Files:** New — `core/components/skills/research-domain-context/SKILL.md`
**Agent:** Sub-agent (code-builder for skill creation)
**Blocked by:** T6 (design must be finalized first)
**Action:** Create new skill following established conventions:

```yaml
---
name: research-domain-context
description: Research vertical domain knowledge via web when LTM is insufficient
user-invocable: false
model: sonnet
allowed-tools: WebSearch, WebFetch, Read, Write
---
```

**Input:**
- `domain` (required): Identified vertical domain (e.g., "BFSI", "retail SaaS", "healthcare")
- `knowledge_gaps` (required): What LTM didn't cover (e.g., "competitive landscape", "market size", "regulatory requirements")
- `problem_statement` (required): Original problem for context
- `output_base` (required): STM path (e.g., `.meridian/project/product/{slug}/`)

**Process:**
1. Construct targeted search queries from domain + knowledge gaps
2. Execute WebSearch for each knowledge gap (max 3-5 searches)
3. Synthesize findings into structured domain context
4. Write domain context artifact to `{output_base}domain-context.md`
5. Return metadata

**Output:**
```yaml
domain_context:
  path: "{output_base}domain-context.md"
  domain: "{domain}"
  coverage:
    - gap: "{knowledge_gap}"
      status: "covered|partial|not_found"
      confidence: "high|medium|low"
  sources: ["{url1}", "{url2}"]
```

**Constraints:**
- NEVER fabricate market data — if not found, report `not_found`
- ALWAYS include source URLs for traceability
- NEVER perform more than 5 web searches per invocation
- Output is STM (transient) — not LTM
**Verification:** G-007, G-014

### T11a: Replace P-labels in final-report.md
**File:** `core/components/plays/discover-product/templates/final-report.md`
**Agent:** Direct edit (trivial)
**Blocked by:** None (parallel with T1-T9)
**Action:** Replace P6 references with `plan-roadmap`.
**Verification:** G-013 (partial)

### T11b: Replace P-labels in generate-business-review
**File:** `core/components/skills/generate-business-review/SKILL.md`
**Agent:** Direct edit (trivial)
**Blocked by:** None (parallel with T1-T9)
**Action:** Replace "Shared across P5, P6, P7" with "Shared across discover-product, plan-roadmap, and manage-backlog".
**Verification:** G-013 (partial)

### T12: Verify agent changes (Phase 2 gates)
**Agent:** Sub-agent (Explore for verification)
**Blocked by:** T1, T2, T3, T4, T5, T6, T7, T8, T9, T10
**Action:** Run gates G-001 through G-010, G-016. Record evidence.
**Verification:** All Phase 1 + Phase 2 gates

### T13: Update play for domain clarification + compound output
**Files:**
- `core/components/plays/discover-product/SKILL.md`
- `core/components/plays/discover-product/reference/intent.yaml`
**Agent:** Direct edit
**Blocked by:** T12 (agent must be verified first)
**Action:**
1. **SKILL.md:** Add domain clarification sub-flow:
   - Between pre-flight and Step 1 (or as part of Step 1)
   - If agent returns `domain_clarification_needed`, present options to user
   - Re-invoke agent with confirmed domain
   - Handle as zero-cost re-invocation (doesn't count against agent call limit)

2. **SKILL.md:** Update agent invocation contexts to include domain context when available.

3. **intent.yaml:** Add behavioral constraint:
   - `C12: Domain context — agent must attempt domain classification before skill invocation. If classification is ambiguous, return domain_clarification_needed to play.`

4. **intent.yaml:** Add failure condition:
   - `Domain unresolvable — user rejects all proposed domains and provides no alternative`

**Verification:** G-011, G-012

### T14: Verify play changes (Phase 3 gates)
**Agent:** Sub-agent (Explore for verification)
**Blocked by:** T13, T11a, T11b
**Action:** Run gates G-007, G-011, G-012, G-013, G-014. Record evidence.
**Verification:** All Phase 3 gates

### T15: Update evidence file
**File:** `.claude/specs/idsd/evidence/g-104-discover-product.md`
**Agent:** Direct edit
**Blocked by:** T14
**Action:** Update evidence to reflect:
- New gates verified (domain context, multi-intent, model change)
- Updated file count (13 original + 1 new skill)
- Any gate criteria changes from the defect fix
**Verification:** G-015

### T16: Final full verification sweep
**Agent:** Sub-agent (Explore for comprehensive verification)
**Blocked by:** T15
**Action:** Run ALL gates (G-001 through G-016). Generate final evidence document at `.claude/specs/fix-strategist/evidence/final-verification.md`.
**Verification:** All gates pass

---

## Parallelization Plan

### Wave 1 (all independent — run in parallel)
- T1, T2, T3, T4, T5, T7, T8 — agent file edits (can be done sequentially on same file but logically independent)
- T11a, T11b — P-label fixes in other files

### Wave 2 (depends on Wave 1)
- T6 — LTM redesign (logically depends on understanding the agent, but file-independent)
- T9 — included in T6

### Wave 3 (depends on T6)
- T10 — new skill (needs T6 design finalized)

### Wave 4 (depends on all agent changes)
- T12 — verify agent

### Wave 5 (depends on T12)
- T13 — play changes

### Wave 6 (depends on T13)
- T14 — verify play

### Wave 7 (depends on T14)
- T15 — update evidence
- T16 — final sweep

**Realistic execution:** Waves 1-3 can be compressed since T1-T9 are all edits to the same file (product-strategist.md). Execute sequentially on the file but treat the changes as logically independent for reasoning purposes. T10 and T11a/T11b truly parallelize.

---

## Estimated Agent Assignments

| Task | Agent Type | Rationale |
|------|-----------|-----------|
| T1-T5, T7-T9 | Direct edit | Simple text changes to one file |
| T6 | Direct edit (design-informed) | Context Loading redesign — needs architectural thought |
| T10 | code-builder | New skill file creation following conventions |
| T11a, T11b | Direct edit | Trivial label replacements |
| T12, T14, T16 | Explore | Read-only verification sweeps |
| T13 | Direct edit | Play modification |
| T15 | Direct edit | Evidence update |
