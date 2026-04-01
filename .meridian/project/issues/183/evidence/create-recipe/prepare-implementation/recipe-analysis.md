# Semantic Map: prepare-implementation Recipe Rebake Analysis

**Issue:** #183 — Rebake prepare-implementation recipe  
**Date:** 2026-03-31  
**Scope:** Deep analysis of current SKILL.md, new intent.yaml, agent inventory, and skill mapping for rebake pipeline  

---

## Executive Summary

The prepare-implementation recipe is undergoing a major architectural shift from a single tech-designer-driven approach to a **dual-agent separation model** with **test-engineer as a first-class participant**. The new intent.yaml (32 constraints, 26 failure conditions, 13 scenarios) expands the scope significantly beyond the current SKILL.md.

**Key changes:**
- **Agent separation:** tech-architect (architecture + planning) vs test-engineer (testing + scenarios)
- **New agents:** tech-architect, test-engineer (both marked NEW)
- **Intent growth:** C1-C22 (old) → C1-C32 (new); F1-F18 (old) → F1-F26 (new)
- **Scope shift:** Epic-centric → issue-optional; roadmap/architecture optional with discovery-mode
- **STM integration:** All intermediate work stored on disk; zero conversation memory
- **Human checkpoints:** 5 explicit gates with Tether/Vanish/Orbit interaction

**Gap assessment:**
- Current SKILL.md lacks separate test-engineer phase (blast radius, baseline tests, three-tier scenarios)
- Current SKILL.md assumes locked roadmap + architecture as hard halts
- New intent allows optional product/roadmap/architecture with discovery-mode fallback
- New constraints C24-C32 govern testing + blast radius, missing from compiled recipe

---

## Current SKILL.md Structure (Brief Summary)

**Compiled Recipe:** 6 phases, 19 steps, 4 agents, 3 human checkpoints

**Phases:**
1. Pre-Flight checks (product, roadmap, epic validation)
2. Context Resolution: codebase scan, LTM read, dependency report (tech-designer)
3. DRAFT Stage 1: features (product-strategist)
4. DRAFT Stage 2: tech design (tech-designer)
5. DRAFT Stage 3: scenarios + plan (product-strategist + tech-designer)
6. VALIDATE: cross-validation (product-strategist)
7. Auto-Lock: lock artifacts
8. Evidence & Close: commit (repo-orchestrator)

**Agents:** tech-designer, product-strategist, doc-builder, repo-orchestrator

**Critical issues:**
- Zero test-engineer involvement
- No blast radius analysis
- No baseline test specification
- No three-tier scenario structure
- Requires locked product.yaml + roadmap.yaml (hard halt)
- No discovery-mode fallback for architecture/quality-standards

---

## New intent.yaml Structure (32 constraints, 26 failures, 13 scenarios)

### Key Intent Elements

```yaml
name: prepare-implementation
intent: >
  Produce implementation-ready design artifacts for single issue/epic.
  Auto-resolve work context from branch or STM; --epic flag optional.
  Deeply understand codebase BEFORE generating artifacts via:
    - Architecture inference
    - Test surface mapping
    - Dependency graph construction
    - Git history analysis
  Compute blast radius via test impact analysis.
  Identify coverage gaps and specify baseline tests.
  Only after blast radius fully characterized, generate design artifacts.
```

### Constraints Summary (C1-C32)

**New/Modified (impact on SKILL.md):**

- **C1:** Product/roadmap "nice-to-have" (not hard halt)
- **C2:** Single invocation per issue/epic (no --phase flag)
- **C14-C15:** Issue OR epic; epic dependency enforcement conditional
- **C16-C17:** Codebase scan always runs; LTM consulted with gaps documented
- **C18:** Context assembly approval required (new checkpoint)
- **C19:** Artifact isolation (read-only prior epics)
- **C20:** Pre-lock resolution interview for open questions/high-severity risks
- **C21-C22:** Architecture/quality discovery mode (not hard halt)
- **C24-C25:** Test-driven blast radius BEFORE design; baseline tests for gaps
- **C26-C27:** Plan task DAG + file-level change specs
- **C28:** Three-tier scenarios (baseline + new + regression)
- **C29:** Git history analysis parallel with architecture
- **C30:** All STM on disk, no conversation memory
- **C31:** Dual format (YAML + MD) for narrative artifacts
- **C32:** Agent separation: tech-architect vs test-engineer

### Failure Conditions (F1-F26)

Key new failures:
- **F2:** tech.yaml contradicts architecture
- **F13-F26:** Testing gaps, discovery-mode failures, pre-lock failures

### Scenarios (S1-S13)

New scenarios S7-S13 cover:
- Blast radius report sufficiency
- Self-contained locked artifacts
- Pre-lock resolution interview
- Three-tier scenario gating
- Architecture LLD diagrams

---

## Agent Inventory & Skill Pools

### Required Agents

| Agent | Domain | New | Status | Skill Pool |
|-------|--------|-----|--------|-----------|
| **tech-architect** | Architecture | YES | Defined | research-domain-context (fallback) |
| **test-engineer** | Testing | YES | Defined | (no delegated skills) |
| **product-strategist** | Product | NO | Exists | draft-product-spec, draft-verification-scenarios, validate-implementation-design |
| **doc-builder** | Documentation | NO | Exists | (uses static templates) |
| **repo-orchestrator** | Repository | NO | Exists | analyze-changes, create-commit, analyze-pr, etc. |

### Agent Separation (C32)

**Current violation:** tech-designer owns both architecture and planning

**New requirement:** 
- **tech-architect** → architecture inference (1A), dependency graph (1C), git history (1D), change surface (2A), tech.yaml (3), plan.yaml (3)
- **test-engineer** → test surface mapping (1B), blast radius (2B), baseline tests (2C), scenarios.yaml (3)

---

## Key Gaps: Current vs New

### Gap 1: Missing Testing Phase (CRITICAL)

| Phase | Current | New |
|-------|---------|-----|
| 1B (Test Surface) | Absent | test-engineer required |
| 2B (Blast Radius) | Absent | test-engineer required BEFORE design |
| 2C (Baseline Tests) | Absent | test-engineer required for coverage gaps |
| 3 (Scenarios) | product-strategist | test-engineer (new separation) |

**Implementation:** Requires parallel workflow:
```
Phase 1 (parallel):
  1A: Architecture [tech-architect]
  1B: Test surface [test-engineer] ← NEW
  1C: Dependency graph [tech-architect]
  1D: Git history [tech-architect]
  1E: LTM consultation [tech-architect]

Phase 2 (parallel):
  2A: Change surface [tech-architect]
  2B: Blast radius [test-engineer] ← NEW
  2C: Baseline tests [test-engineer] ← NEW
```

### Gap 2: Pre-Flight Too Strict (CRITICAL)

| Artifact | Current | New |
|----------|---------|-----|
| product.yaml | Hard halt | Optional (C1) |
| roadmap.yaml | Hard halt | Optional (C1) |
| architecture.yaml | Hard halt | Optional, discovery-mode (C21) |
| quality-standards.yaml | Hard halt | Optional, discovery-mode (C22) |

**New requirement:** Fallback to codebase-derived context when locked artifacts missing.

### Gap 3: Missing Discovery Mode (CRITICAL)

**New (C21-C22):** When architecture.yaml or quality-standards.yaml missing:
1. Infer architecture from codebase (design patterns, frameworks, logical structure)
2. Detect quality standards from toolchain (test config, linting, CI, coverage)
3. User interview targets specific gaps (not full redesign)

### Gap 4: Agent Reassignment (CRITICAL)

**Step 13 (scenarios.yaml):**
- Current: tech-designer
- New: test-engineer

**Step 9 (tech.yaml) & Step 13 (plan.yaml):**
- Current: tech-designer (single agent)
- New: tech-architect (new agent name + separation)

### Gap 5: STM Artifact Paths (CRITICAL)

**New requirement:** All Phase 1-2 evidence goes under `{epic_base}/evidence/prepare-implementation/`:

```
test-surface.yaml
blast-radius.yaml
baseline-tests.yaml
dependency-graph.yaml
commit-history-analysis.yaml
architecture-inference.yaml
change-surface.yaml
```

### Gap 6: Pre-Lock Resolution Gate (HIGH)

**New (C20):** After validation, before lock:
1. Scan 4 artifacts for `open_questions[]` fields
2. Scan tech.yaml for high-severity risks
3. If found: structured user interview
4. Write resolutions to `pre-lock-resolutions.yaml`
5. Only then proceed to lock

### Gap 7: Five Checkpoints (HIGH)

| Checkpoint | Current | New | Timing |
|-----------|---------|-----|--------|
| 0 | — | Context assembly + architecture discovery | After Phase 1 |
| 1 | — | Blast radius + baseline tests | After Phase 2B-C |
| 2 | Checkpoint 1 | Features review | After Step 6 |
| 3 | Checkpoint 2 | Tech design review | After Step 9 |
| 4 | Checkpoint 3 | Scenarios + plan review | After Step 14 |

### Gap 8: Three-Tier Scenarios (HIGH)

**Current:** Single scenario list

**New (C28):**
```yaml
baseline_scenarios:
  - id: BS-001
    source: BT-001 (from baseline-tests.yaml)
    # Verifies CURRENT behavior on unmodified codebase

new_scenarios:
  - id: NS-001
    feature_ref: F1
    # Verifies NEW behavior after changes

regression_scenarios:
  - id: RS-001
    source: blast-radius/regression_surface
    # Verifies nothing else breaks

feature_gates:
  F1:
    baseline: [BS-001, ...]
    new: [NS-001, ...]
    regression: [RS-001, ...]
    total: 5
```

### Gap 9: Dual-Format Artifacts (MEDIUM)

**New (C31):** Narrative artifacts require YAML + MD:

Dual-format (must have .md with diagrams):
- architecture-inference.yaml + .md
- dependency-graph.yaml + .md
- commit-history-analysis.yaml + .md
- tech.yaml + .md
- plan.yaml + .md

Single-format (YAML only):
- context-assembly.yaml
- test-surface.yaml
- change-surface.yaml
- blast-radius.yaml
- baseline-tests.yaml
- features.yaml
- scenarios.yaml

### Gap 10: Eval Coverage (MEDIUM)

**Current evals:** C1-C13, F1-F12 (24 step evals, 6 scenario evals)

**Missing evals for:**
- C14-C32 (constraints)
- F13-F26 (failure conditions)
- S7-S13 (scenarios)
- Testing artifact validation (blast-radius, baseline-tests, three-tier scenarios)

---

## Constraint Coverage Summary

| Constraint | Current Coverage | New Requirement | Gap |
|-----------|-----------------|-----------------|-----|
| C1 | ✓ (hard halt) | Optional, fallback to codebase | Add discovery-mode fallback |
| C2 | ✓ | Single invocation | Already satisfied |
| C3 | ✓ | features.yaml no tech | Already satisfied |
| C4 | ✓ | tech.yaml aligns with architecture | Strengthen validation |
| C5 | ✓ | File mappings | Already satisfied |
| C6 | ✓ | End-to-end slices | Already satisfied |
| C7-C9 | ✓ | Scenario structure + compartmentalization | Enhance for three-tier |
| C10 | ✗ | 5 checkpoints | Add Checkpoints 0 & 1 |
| C11 | ✓ | Audience separation | Validate rigorously |
| C12-C13 | ✓ | Summary + exit gates | Already satisfied |
| **C14-C20** | ✗ | Issue/epic resolution, pre-lock gate | **CRITICAL ADDITIONS** |
| **C21-C22** | ✗ | Discovery mode for architecture/quality | **CRITICAL ADDITIONS** |
| **C24-C25** | ✗ | Blast radius + baseline tests | **CRITICAL ADDITIONS** |
| **C26-C32** | ✗ | Plan DAG, dual format, agent separation | **CRITICAL ADDITIONS** |

---

## Data Model & STM Structure

### Artifact Dependency Flow

```
LOCKED INPUTS ← from upstream recipes
  ├─ product.yaml (optional, C1)
  ├─ roadmap.yaml (optional, C1)
  ├─ architecture.yaml (essential or discovery, C21)
  └─ quality-standards.yaml (essential or discovery, C22)

PHASE 1 EVIDENCE (all under {epic_base}/evidence/prepare-implementation/)
  ├─ codebase-scan.yaml [tech-architect]
  ├─ architecture-inference.yaml + .md [tech-architect]
  ├─ dependency-graph.yaml + .md [tech-architect]
  ├─ commit-history-analysis.yaml + .md [tech-architect]
  ├─ ltm-findings.yaml [tech-architect]
  ├─ test-surface.yaml [test-engineer]
  ├─ change-surface.yaml [tech-architect]
  └─ dependency-resolution-report.yaml [tech-architect]

CHECKPOINT 0: Context Assembly (Tether/Vanish) ← NEW

PHASE 2 EVIDENCE
  ├─ blast-radius.yaml [test-engineer]
  └─ baseline-tests.yaml [test-engineer]

CHECKPOINT 1: Blast Radius + Baseline Tests (Tether/Vanish) ← NEW

PHASE 3 DRAFTS (at {epic_base}/)
  ├─ features.yaml [product-strategist]
  ├─ tech.yaml + tech.md [tech-architect]
  ├─ scenarios.yaml (3-tier) [test-engineer] ← REASSIGNED
  └─ plan.yaml + plan.md [tech-architect]

CHECKPOINTS 2-4: Features, Tech, Scenarios+Plan (Tether/Vanish/Orbit)

PHASE 4 VALIDATE
  └─ validation-report.md [product-strategist]

PRE-LOCK RESOLUTION
  └─ pre-lock-resolutions.yaml [recipe] ← NEW

PHASE 5 LOCK
  └─ All 4 artifacts: status DRAFT → LOCKED

PHASE 6 EVIDENCE
  └─ {YYYYMMDD-HHMMSS}.md [repo-orchestrator]
```

---

## Compilation Readiness Checklist

### Pre-Compilation (Must Complete)

- [x] intent.yaml with 32 constraints (C1-C32)
- [x] intent.yaml with 26 failure conditions (F1-F26)
- [x] intent.yaml with 13 scenarios (S1-S13)
- [x] tech-architect agent definition complete
- [x] test-engineer agent definition complete
- [x] Agent contract schema (agent-contract.md) in place
- [x] Skills validated (all referenced skills exist)

### Compilation Tasks (Task #24)

- [ ] Generate workflow DAG (19 steps → 21+ with new phases)
- [ ] Generate JSON contracts for all 21+ steps
- [ ] Generate SE-* evals (one per constraint + failure condition)
- [ ] Generate SCE-* evals (one per scenario)
- [ ] Compile SKILL.md with:
  - Updated Pre-Flight (issue OR epic, discovery-mode gates)
  - Phase 1 with parallel 1A-1E + NEW 1B (test surface)
  - Phase 2 with parallel 2A + NEW 2B-C (blast radius + baseline tests)
  - Checkpoint 0: Context assembly
  - Checkpoint 1: Blast radius + baseline tests
  - Updated Phase 3 with test-engineer on scenarios.yaml
  - Phase 4 VALIDATE unchanged
  - NEW Phase 4b: Pre-lock resolution gate
  - Phase 5: Lock updated for pre-lock-resolutions.yaml
  - Phase 6: Evidence with updated paths
- [ ] Set intent_hash in frontmatter
- [ ] Validate all step dependencies wire correctly
- [ ] Validate all evals reference constraints by ID

### Post-Compilation (Validation)

- [ ] Test-compile with sample issue #183 data
- [ ] Verify STM path wiring (outputs → inputs)
- [ ] Verify agent contract schema compliance
- [ ] Dry-run 5-checkpoint workflow
- [ ] Verify three-tier scenario structure in outputs
- [ ] Verify dual-format artifact production (YAML + MD)
- [ ] Verify discovery-mode fallback paths

---

## Standards & References

### Agent Contract (agent-contract.md)

**Input contract schema:**
```json
{
  "intent_path": "<path/to/intent.yaml>",
  "stm_base": "<from core/config.yaml>",
  "stm": { "input": {...}, "output": {...} },
  "task_id": "<unique step ID>",
  "ltm_context": { "query_domains": [...], ... }  (optional)
}
```

**Output contract schema:**
```json
{
  "status": "completed|failed|blocked",
  "stm": { "input": {...}, "output": {...updated...} },
  "task_id": "<echoed>",
  "error": null,
  "resolution_trace_path": "..."  (if ltm_context present)
}
```

### Recipe Maturity (ADR 013)

Prepare-implementation is **Level 2** (compiled, intent-driven):
- Intent compiled to SKILL.md at build-time
- intent_hash guards against stale recipes
- All constraints baked into workflow
- All evals generated from intent
- Deterministic: same intent → same workflow

---

## Critical Success Criteria

1. **Agent separation enforced:** tech-architect ≠ test-engineer (C32)
2. **Testing before design:** Blast radius computed before tech.yaml generated (C24)
3. **Three tiers in scenarios:** baseline + new + regression with feature_gates (C28)
4. **Five checkpoints:** Context assembly (0), blast radius (1), features (2), tech (3), scenarios+plan (4)
5. **Discovery mode:** Optional architecture/quality-standards (C21-C22)
6. **Pre-lock resolution:** Unresolved open_questions/high-risks halt lock (C20)
7. **STM persistence:** All intermediate work on disk, zero conversation memory (C30)
8. **Dual format:** Narrative artifacts have YAML + MD (C31)
9. **Eval coverage:** All 32 constraints + 26 failures + 13 scenarios covered
10. **Issue-OR-epic:** No --epic required; issue-only also valid (C14)

---

**Compilation ready. Next: `/create-recipe --rebake prepare-implementation`**
