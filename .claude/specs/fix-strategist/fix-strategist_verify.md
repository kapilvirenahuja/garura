# Verification: Fix Product-Strategist Agent

---

## Gates

### G-001: Model Correctness
**Mandatory:** Yes
**Check:** `product-strategist.md` frontmatter contains `model: opus`
**Evidence:** Read line 6, confirm `model: opus`

### G-002: Intent Structure in Core Principle
**Mandatory:** Yes
**Check:** Core Principle section explicitly references two levels of intent: goal (what to achieve) and constraints (boundaries on how). Must not treat intent as monolith.
**Evidence:** Read Core Principle section, confirm it references intent structure and constraints as shaping execution.

### G-003: No Orphan Skills
**Mandatory:** Yes
**Check:** Available Skills table, intent mapping sections — every skill referenced MUST have a corresponding `core/components/skills/{skill-name}/SKILL.md` file.
**Evidence:** For each skill in the table, verify file exists via Glob. Zero orphans allowed.

### G-004: No Undefined Labels
**Mandatory:** Yes
**Check:** No P5/P6/P7/P8 labels appear anywhere in the feature branch files. All references use full recipe names (`discover-product`, `plan-roadmap`, `manage-backlog`, `refine-backlog`).
**Evidence:** Grep all 13+ files for `/P[5-8]/` pattern. Zero matches.

### G-005: No Redundant Sections
**Mandatory:** Yes
**Check:** Agent has exactly ONE intent-to-skill mapping mechanism (merged section). No separate "When to Use Each Skill" AND "Intent → Skill Mapping" sections.
**Evidence:** Read agent file, confirm single unified section for intent-skill mapping.

### G-006: Domain-Aware LTM Loading
**Mandatory:** Yes
**Check:** Context Loading section includes:
1. Domain identification step
2. Selective LTM search (not bulk load)
3. Domain clarification return path (structured return to recipe)
4. Fallback to research skill
5. STM loading for existing artifacts
6. Filtered context injection (not raw LTM dump)
**Evidence:** Read Context Loading section, confirm all 6 elements present.

### G-007: Domain Context Mechanism Exists
**Mandatory:** Yes
**Check:** Either (a) a `research-domain-context` skill exists at `core/components/skills/research-domain-context/SKILL.md` with proper input/output contracts, OR (b) the agent has WebSearch/WebFetch in its tool list with clear guidance on when/how to use them for domain research.
**Evidence:** Verify skill file exists OR verify tool list and usage guidance.

### G-008: Multi-Intent Support
**Mandatory:** Yes
**Check:** Decision Framework supports compound intents:
1. Multi-intent recognition described
2. Sequential execution with dependency ordering
3. Data flow between skills (output N → input N+1)
4. Compound output contract format defined
5. Partial failure handling defined
6. "One skill per intent" language (not "one skill per invocation")
**Evidence:** Read Decision Framework section, confirm all 6 elements.

### G-009: No Bash Section
**Mandatory:** Yes
**Check:** No `### BASH USAGE` section exists in agent file. No allow/deny tables for Bash. If Bash is in frontmatter tools, there must be a clear non-defensive justification elsewhere.
**Evidence:** Grep agent file for "BASH", "Bash is available", "Allowed.*Forbidden" patterns. Zero matches.

### G-010: Tech Context Awareness
**Mandatory:** No (advisory)
**Check:** Context Loading includes a step to check for existing technical design artifacts in STM. Agent flags absence of tech context as an assumption in output.
**Evidence:** Read Context Loading, confirm tech artifact check step exists.

### G-011: Recipe Handles Domain Clarification
**Mandatory:** Yes
**Check:** `discover-product/SKILL.md` has a sub-flow for handling `domain_clarification_needed` structured return from agent. Recipe presents domain options to user and re-invokes agent with confirmed domain.
**Evidence:** Read recipe SKILL.md, confirm domain clarification sub-flow exists between pre-flight and main execution.

### G-012: Recipe Constraint Updated
**Mandatory:** Yes
**Check:** `discover-product/reference/intent.yaml` includes:
1. A behavioral constraint for domain context handling
2. A failure condition for "domain unresolvable"
**Evidence:** Read intent.yaml, confirm new constraint and failure condition present.

### G-013: P-Label Replacement in All Files
**Mandatory:** Yes
**Check:** All files in feature scope use full recipe names instead of P-labels:
- `generate-business-review/SKILL.md`: "Shared across discover-product, plan-roadmap, and manage-backlog"
- `final-report.md`: References `plan-roadmap` not P6
- Agent file: Uses recipe names not P-labels
**Evidence:** Read each file, confirm P-labels replaced.

### G-014: New Skill Follows Conventions
**Mandatory:** Yes (if research-domain-context skill created)
**Check:** `research-domain-context/SKILL.md` follows established skill conventions:
1. Proper frontmatter (name, description, user-invocable: false, model, allowed-tools)
2. Purpose section with DOES/DOES NOT
3. Input section with required/optional fields
4. Process section with numbered steps
5. Output section with structured YAML contract
6. Constraints section with NEVER/ALWAYS
7. Version table
**Evidence:** Read skill file, confirm all 7 structural elements.

### G-015: Evidence Re-verified
**Mandatory:** No (advisory)
**Check:** `g-104-discover-product.md` evidence still passes after all changes. If gate criteria changed, evidence updated.
**Evidence:** Re-run verification against updated files.

### G-016: Agent Output Contracts Updated
**Mandatory:** Yes
**Check:** Output Contracts section includes compound output format for multi-intent responses. Single-intent contracts unchanged.
**Evidence:** Read Output Contracts, confirm compound format documented alongside existing single-intent contracts.

---

## Verification Execution Order

```
Phase 1 (independent — can run in parallel):
  G-001, G-004, G-005, G-009

Phase 2 (after agent file changes):
  G-002, G-003, G-006, G-008, G-010, G-016

Phase 3 (after recipe/skill changes):
  G-007, G-011, G-012, G-013, G-014

Phase 4 (final):
  G-015
```
