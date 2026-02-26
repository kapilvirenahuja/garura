# Spec: Fix Product-Strategist Agent

**Issue:** Product-strategist agent has 10 design defects affecting correctness, autonomy, and architectural consistency.
**Scope:** All 13 files on `feature/62-discover-product-recipe` branch.
**Type:** Defect (holistic — not myopic single-section fixes)

---

## Context

The product-strategist agent was authored as part of the discover-product recipe feature (Issue #62). Review identified 10 interconnected defects ranging from wrong model selection to missing architectural mechanisms. Fixes must cascade across the agent, recipe, skills, templates, and evidence — not just the agent file.

## Defects

### D1: Wrong Model

**File:** `core/components/agents/product-strategist.md` (line 6)
**Issue:** `model: sonnet` — product strategy is a thinking-heavy domain requiring nuanced market analysis, intent disambiguation, and autonomous decision-making.
**Fix:** Change to `model: opus`.

### D2: Core Principle Missing Intent Structure

**File:** `core/components/agents/product-strategist.md` (lines 27-32)
**Issue:** Core Principle treats intent as a monolith ("Given an intent, YOU decide..."). Doesn't reference the two levels: **intent** (what to achieve) and **constraints** (boundaries on how). The Intent Recognition section (lines 70-79) covers this but Core Principle doesn't — so a reader of just the principle gets an incomplete mental model.
**Fix:** Core Principle must state that intent has structure: the goal and the constraints. Constraints shape execution, not just permission. Reference the Intent Recognition section for mechanics.

### D3: Orphan Skills (8 of 12 don't exist)

**File:** `core/components/agents/product-strategist.md` (lines 38-51, 53-68, 83-92)
**Issue:** Available Skills table, "When to Use Each Skill" section, and "Intent → Skill Mapping" section reference 8 skills that were never created on this branch:
- `prioritize-product-features`
- `draft-product-roadmap`
- `validate-product-roadmap`
- `decompose-product-epic`
- `draft-product-stories`
- `validate-product-backlog`
- `analyze-backlog`
- `refine-product-stories`

An agent referencing non-existent skills creates false capability awareness. The agent may attempt to invoke them and fail.
**Fix:** Remove all orphan skill references. Keep only the 4 skills that exist: `discover-product-opportunity`, `draft-product-vision`, `validate-product-vision`, `generate-business-review`. Future skills get added when they're created.

### D4: Undefined P5/P6/P7/P8 Labels

**Files:**
- `core/components/agents/product-strategist.md` (lines 40-43)
- `core/components/skills/generate-business-review/SKILL.md` (references "Shared across P5, P6, P7")
- `core/components/recipes/discover-product/templates/final-report.md` (references P6)

**Issue:** P5/P6/P7/P8 are used as recipe phase identifiers but never defined anywhere. A reader has no context for what these mean.
**Fix:** Replace cryptic labels with readable recipe names. P5 → `discover-product`, P6 → `plan-roadmap`, P7 → `manage-backlog`, P8 → `refine-backlog`. Use full names in all references.

### D5: Redundant Intent Mapping Sections

**File:** `core/components/agents/product-strategist.md` (lines 53-68 vs 83-92)
**Issue:** "When to Use Each Skill" and "Intent → Skill Mapping" convey the same information in different formats. Redundancy creates maintenance burden and potential for drift.
**Fix:** Merge into a single section. Keep the example-sentence format (more useful for LLM intent matching) combined with the "why" column (adds reasoning context). Remove the separate "Intent → Skill Mapping" subsection.

### D6: LTM Loading Underspecified

**File:** `core/components/agents/product-strategist.md` (lines 100-120)
**Issue:** "Load from `~/.meridian/core/memory/` when available" is unbounded. No selection criteria, no relevance filtering, no awareness of project lifecycle (early project = thin LTM, mature project = heavy LTM). Loading entire LTM is wasteful and may pollute context.
**Fix:** Redesign Context Loading with a domain-aware loading strategy:

1. **Understand domain** — From the incoming intent and any provided context, identify the vertical domain (BFSI, retail, SaaS, etc.) and product category.
2. **Selective LTM search** — Search LTM for domain-relevant standards, formats, and knowledge. Use Glob/Grep to find relevant files, not bulk-load everything. Prioritize: `memory/standards/` (always relevant), `memory/knowledge/{domain}/` (if exists), `memory/formats/` (for output shaping).
3. **Domain confirmation** — If domain is ambiguous (agent cannot confidently classify), return a structured `domain_clarification_needed` response to the recipe caller. The recipe handles user interaction. If domain is obvious from context, proceed without confirmation.
4. **Fallback: Web research** — If LTM has insufficient domain knowledge (no relevant entries or coverage too thin), invoke the `research-domain-context` skill for web-based research. Capture results as STM artifacts for this project.
5. **Load STM** — Read `.meridian/project/product/` for existing product artifacts that provide enrichment context.
6. **Inject context** — Pass relevant LTM + STM + recipe context to skill invocations. Never pass raw bulk LTM.

### D7: No Domain Context Injection Mechanism

**File:** `core/components/agents/product-strategist.md` (entire document)
**Issue:** The agent has no way to understand, confirm, or inject vertical domain knowledge (BFSI, retail, healthcare, etc.). Skills like `discover-product-opportunity` accept `market_hints` but the agent has no guidance on where these come from or how to enrich them.
**Fix:** Addressed as part of D6 redesign. Additionally:
- The agent's tool list needs `WebSearch` and `WebFetch` added (for the research-domain-context skill pattern — or if implemented as agent-level research, the agent itself needs these tools).
- Design decision: Web research is implemented as a **new skill** (`research-domain-context`) to maintain single-responsibility. The agent invokes the skill; the skill performs the research. This keeps the agent as orchestrator, not researcher.

**New skill required:** `research-domain-context`
- Input: `domain`, `knowledge_gaps` (what LTM didn't cover), `problem_statement`
- Process: WebSearch for market data, competitive landscape, industry trends
- Output: Structured domain knowledge artifact written to STM at `.meridian/project/product/{slug}/domain-context.md`
- Constraint: Read-only from agent perspective (skill writes to STM)

### D8: Multi-Intent Handling Not Supported

**File:** `core/components/agents/product-strategist.md` (lines 224-228)
**Issue:** "Don't chain — One skill per invocation unless explicitly asked" prevents autonomous multi-intent handling. If a recipe sends "discover and draft for X", the agent can't handle it. The current design requires the recipe to make separate calls for each skill, which limits agent autonomy.
**Fix:** Replace "one skill per invocation" with "one skill per intent." The agent identifies all intents in the incoming prompt and processes each with its corresponding skill. Changes needed:

1. **Intent Recognition** — Add multi-intent parsing. Identify each distinct intent in the prompt.
2. **Sequential execution** — For compound intents, execute skills in dependency order (e.g., discover before draft, because draft needs market_context from discover).
3. **Data flow** — Output of skill N feeds as input to skill N+1 where there's a dependency.
4. **Compound output contract** — Return results keyed by intent:
   ```yaml
   results:
     - intent: "discover opportunity"
       skill: "discover-product-opportunity"
       status: "success"
       output: {market_context}
     - intent: "draft vision"
       skill: "draft-product-vision"
       status: "success"
       output: {vision metadata}
   ```
5. **Partial failure** — If skill N fails in a chain, return results for completed skills plus structured failure for the failed one. Do not roll back completed skills.
6. **Recipe control** — Recipes can still send single intents for granular control. Multi-intent is opt-in by the caller, not assumed by the agent.

### D9: Bash Section (Defensive Anti-Pattern)

**File:** `core/components/agents/product-strategist.md` (lines 247-261)
**Issue:** Explicit Bash usage section with allow/deny tables makes the agent aware of capabilities it shouldn't use. Defensive documentation paradoxically increases usage probability in LLM agents. If domain boundaries are well-defined, this section is unnecessary.
**Fix:** Remove the entire `### BASH USAGE` section. Remove `Bash` from the boundaries section if referenced. The agent's tool list in frontmatter already controls what's available — trust the tool list, not defensive prose.

Note: If Bash is not needed at all, also remove it from the frontmatter `tools` list. The agent's skills handle all writes, and Read/Glob/Grep handle all reads. Evaluate whether any legitimate Bash use case remains.

### D10: Lightweight Tech Feasibility Awareness Missing

**File:** `core/components/agents/product-strategist.md` (Boundaries section)
**Issue:** The agent correctly escalates deep engineering analysis to `tech-designer`. But product strategy decisions (build vs buy, known hard problems, platform risk) need lightweight tech awareness. Currently the agent has zero tech context unless STM happens to contain prior tech-designer output.
**Fix:** In Context Loading, add a step to check for existing technical design artifacts in STM (`.meridian/{issue}/design/`). If they exist, load relevant constraints. If they don't exist, note the gap — the agent should flag "no technical feasibility context available" as an assumption in its output, not silently ignore it.

This is NOT about making the strategist do tech analysis. It's about making it aware of tech constraints that already exist in the project's STM.

---

## Cascading Changes

Fixes to the agent require corresponding updates across the feature branch:

### Recipe: `discover-product/SKILL.md`
- Handle new `domain_clarification_needed` structured return from agent (new sub-flow between pre-flight and Step 1)
- Handle compound output contract if recipe sends multi-intent
- Update agent invocation contexts to include domain context when available
- Remove or replace P5/P6 references

### Recipe: `discover-product/reference/intent.yaml`
- Add behavioral constraint for domain context handling (new C-number)
- Add failure condition for "domain unresolvable" scenario

### Recipe: `discover-product/templates/final-report.md`
- Replace P6 references with `plan-roadmap`

### Skill: `generate-business-review/SKILL.md`
- Replace "Shared across P5, P6, P7" with readable recipe names

### Skill: `discover-product-opportunity/SKILL.md`
- Consider accepting enriched domain context (from LTM or research) as additional input alongside market_hints
- No structural change needed if market_hints already covers this

### Evidence: `g-104-discover-product.md`
- Update after all fixes are applied — gates may need re-verification

### New Skill: `research-domain-context/SKILL.md`
- New skill to be created for domain knowledge web research
- Follows existing skill conventions (SKILL.md + templates/)

---

## Out of Scope

- LTM promotion mechanism (STM → LTM) — future recipe, not this defect fix
- Creating the 8 missing skills (P6/P7/P8 recipes) — separate feature work
- Changes to other agents (repo-orchestrator, tech-designer, etc.)
- Changes to framework protocols (structured-failure-protocol.md, etc.)
