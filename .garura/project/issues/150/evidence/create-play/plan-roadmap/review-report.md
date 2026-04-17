# plan-roadmap Play Review Report

**Play:** plan-roadmap
**Intent:** `core/components/plays/plan-roadmap/reference/intent.yaml`
**SKILL.md:** `core/components/plays/plan-roadmap/SKILL.md`
**Reviewed:** 2026-03-25
**Mode:** read-only diagnostic (`/create-play --review`)

---

## Intent Hash (G9)

| Field | Value |
|-------|-------|
| Computed | `8370cb2e0ca54852e1933e3ba6fdf5fa44059a8e723086d7d8375e0628cf553c` |
| Compiled | `sha256:8370cb2e0ca54852e1933e3ba6fdf5fa44059a8e723086d7d8375e0628cf553c` |
| **Result** | **PASS** |

---

## G1 — Constraint Coverage

Every constraint ID (C1–C12) must be covered by pre-flight, step eval, or structural enforcement.

| Constraint | Type | Covered By | Result |
|------------|------|------------|--------|
| C1 | Pre-flight | Pre-flight check: `Status: LOCKED` → hard halt | PASS |
| C2 | Artifact-verifiable | SE-11 (tab-based layout, HTML, template structure) | PASS |
| C3 | Artifact-verifiable | SE-11 (critical_blockers ≥ 1 in Feasibility tab) | PASS |
| C4 | Artifact-verifiable | SE-7 (C-BRIEF-2 violation check in notes) | PASS |
| C5 | Artifact-verifiable | SE-1 (epics 3–6), SE-2 (roadmap features 3–6) | PASS |
| C6 | Artifact-verifiable | SE-5 (IDD fields per epic), SE-6 (roadmap structure) | PASS |
| C7 | Artifact-verifiable | SE-3 (strategic_goal traces to product.yaml SG*) | PASS |
| C8 | Structural | Step 5 checkpoint + SE-8 (approved_brief_ref exists) | PASS |
| C9 | Artifact-verifiable | SE-10 (feature refs in brief align with roadmap) | PASS |
| C10 | Artifact-verifiable | SE-11 (inline comment system present) | PASS |
| C11 | Structural | Step 5b pre-lock resolution gate + SE-12 | PASS |
| C12 | Artifact-verifiable | SE-9 (profiles passed when product.yaml has profiles) | PASS |

**Result: PASS** — All 12 constraints covered.

---

## G2 — Failure Condition Coverage

Every failure condition ID (F1–F8) must be covered by ≥ 1 step eval.

| Failure | Description | Covered By | Result |
|---------|-------------|------------|--------|
| F1 | Fewer than 3 epics | SE-1 (epics), SE-2 (roadmap) | PASS |
| F2 | Epic doesn't trace to strategic goal | SE-3 (epics), SE-4 (roadmap feasibility) | PASS |
| F3 | Epic missing IDD fields | SE-5 (epics), SE-6 (roadmap structure) | PASS |
| F4 | Brief contains irrelevant technical detail | SE-7 (C4/C-BRIEF-2 check) | PASS |
| F5 | Roadmap produced without approved brief | SE-8 (approved_brief_ref check) | PASS |
| F6 | Engineering view missing/incomplete/has business context | **NONE** | **GAP** |
| F7 | Roadmap IDD differs from approved brief | SE-10 (feature ref alignment) | PASS |
| F8 | Roadmap produced with unresolved blockers/questions | SE-13 (pre-lock gate enforcement) | PASS |

**Result: GAP** — F6 is not covered by any step eval.

**F6 Detail:** The `generate-engineering-view` skill is **DEPRECATED** (replaced by `tech.yaml` in `/prepare-implementation`). The SKILL.md correctly omits engineering view production steps. However, `intent.yaml` still defines F6 referencing the engineering view. The intent is stale — F6 should either be removed from intent or redefined to match the current architecture.

---

## G3 — Scenario Coverage

Every scenario ID (S1–S7) must be covered by ≥ 1 scenario eval.

| Scenario | Persona | Covered By | Result |
|----------|---------|------------|--------|
| S1 | Product Manager | SCE-1 | PASS |
| S2 | Product Owner | SCE-2 | PASS |
| S3 | Engineering Lead | **NONE** | **GAP** |
| S4 | Stakeholder | SCE-4 | PASS |
| S5 | Technical Architect (engineering view + feasibility) | **NONE** | **GAP** |
| S6 | Product Manager (resolution interview) | SCE-6 | PASS |
| S7 | Technical Architect (profiles) | SCE-5 | PASS |

**Result: GAP** — S3 and S5 are not covered.

**S3/S5 Detail:** Both scenarios depend on the "engineering view" artifact, which is no longer produced by this play (skill is deprecated). S3 (Engineering Lead: identify dependencies from engineering view + feasibility) and S5 (Technical Architect: identify architecture-impacting epics from engineering view + feasibility) reference an artifact that doesn't exist in the current workflow. The intent.yaml should be updated to remove S3/S5 or redefine them against `roadmap.yaml` feasibility data, which now carries the information the engineering view used to provide.

---

## G4 — Skill Existence

Every skill referenced in the workflow must exist.

| Skill | Referenced In | Exists | Result |
|-------|---------------|--------|--------|
| `scope-roadmap-epics` | Step 2 (via product-strategist) | `core/components/skills/scope-roadmap-epics/SKILL.md` | PASS |
| `assess-feasibility` | Step 3 (via tech-designer) | `core/components/skills/assess-feasibility/SKILL.md` | PASS |
| `draft-roadmap-brief` | Step 4 (via product-strategist) | `core/components/skills/draft-roadmap-brief/SKILL.md` | PASS |
| `draft-roadmap` | Step 6 (via product-strategist) | `core/components/skills/draft-roadmap/SKILL.md` | PASS |

**Result: PASS** — All 4 referenced skills exist.

---

## G5 — Agent Existence

Every agent referenced in the workflow must exist.

| Agent | Role in Play | Exists | Result |
|-------|----------------|--------|--------|
| `product-strategist` | Steps 2, 4, 6 (scoping, brief, roadmap) | `core/components/agents/product-strategist.md` | PASS |
| `tech-designer` | Step 3 (feasibility) | `core/components/agents/tech-designer.md` | PASS |
| `repo-orchestrator` | Step 8 (evidence commit) | `core/components/agents/repo-orchestrator.md` | PASS |

**Result: PASS** — All 3 agents exist.

---

## G6 — Skill-Agent Inventory Alignment

Skills assigned to agents must appear in each agent's skill inventory.

| Agent | Skill Used | In Agent Inventory | Result |
|-------|------------|-------------------|--------|
| product-strategist | scope-roadmap-epics | ✓ (Available Skills table) | PASS |
| product-strategist | draft-roadmap-brief | ✓ (Available Skills table) | PASS |
| product-strategist | draft-roadmap | ✓ (Available Skills table) | PASS |
| tech-designer | assess-feasibility | ✓ (Skill Pool table) | PASS |
| repo-orchestrator | create-commit | ✓ (Available Skills table) | PASS |

**Result: PASS** — All skill-agent assignments match.

---

## G7 — JSON Contract Required Fields

Every JSON contract must have: `intent_path`, `stm_base`, `stm`, `task_id`.

| Contract | intent_path | stm_base | stm | task_id | Result |
|----------|-------------|----------|-----|---------|--------|
| Step 1 (initial) | ✓ | ✓ | ✓ | ✓ | PASS |
| Step 2 (scope-epics) | ✓ (carried) | ✓ (carried) | ✓ | ✓ | PASS |
| Step 3 (assess-feasibility) | ✓ (carried) | ✓ (carried) | ✓ | ✓ | PASS |
| Step 4 (produce-brief) | ✓ (carried) | ✓ (carried) | ✓ | ✓ | PASS |
| Step 6 (produce-roadmap) | ✓ (carried) | ✓ (carried) | ✓ | ✓ | PASS |
| Step 8 (repo-orchestrator) | ✓ | ✓ | ✓ | ✓ | PASS |

**Result: PASS** — All contracts have required fields.

**Observation:** The product-strategist and tech-designer contracts use a flat `stm` structure (named paths like `stm.epics_path`, `stm.feasibility_path`) rather than the `stm.input`/`stm.output` pattern defined in `agent-contract.md`. The repo-orchestrator contract (Step 8) does follow the standard pattern. Both agents are designed for the custom format, so this works in practice but deviates from the universal schema standard. This is an accepted architectural divergence — the plan-roadmap play predates the current agent-contract standard and both agents document support for the custom contract shape.

---

## G8 — Template References

Every template reference must point to an existing file.

| Reference | Source | Resolved Path | Exists | Result |
|-----------|--------|---------------|--------|--------|
| `templates/checkpoint.md` | SKILL.md Step 5 | `core/components/plays/plan-roadmap/templates/checkpoint.md` | ✓ | PASS |
| `templates/approval-prompt.md` | SKILL.md Step 5 | `core/components/plays/plan-roadmap/templates/approval-prompt.md` | ✓ | PASS |
| `templates/final-report.md` | SKILL.md Step 8 | `core/components/plays/plan-roadmap/templates/final-report.md` | ✓ | PASS |
| `standards/templates/roadmap-brief.html` | intent.yaml C2 template_ref | `core/components/memory/standards/templates/roadmap-brief.html` | ✓ | PASS |

**Result: PASS** — All 4 template references resolve.

---

## G9 — Intent Hash Match

| Field | Value |
|-------|-------|
| Computed (shasum -a 256) | `8370cb2e0ca54852e1933e3ba6fdf5fa44059a8e723086d7d8375e0628cf553c` |
| Compiled (SKILL.md Compilation Metadata) | `sha256:8370cb2e0ca54852e1933e3ba6fdf5fa44059a8e723086d7d8375e0628cf553c` |
| **Result** | **PASS** |

---

## G10 — Required Sections Present

| Section | Present | Result |
|---------|---------|--------|
| Frontmatter (YAML) | ✓ (`name`, `description`, `user-invocable`, `model`, `allowed-tools`) | PASS |
| Header (`# plan-roadmap`) | ✓ | PASS |
| Compiled From | ✓ (`## Compiled From`) | PASS |
| Role | ✓ (`## Role`) | PASS |
| Pre-flight | ✓ (`## Pre-flight`) | PASS |
| Workflow | ✓ (`## Workflow` with Steps 1–8) | PASS |
| Scenario Validation | ✓ (`### Phase: Scenario Validation` — Step 7) | PASS |
| Pause and Resume | ✓ (`## Pause and Resume`) | PASS |
| Compilation Metadata | ✓ (`## Compilation Metadata`) | PASS |

**Result: PASS** — All 9 required sections present.

---

## Summary

| Check | Result | Details |
|-------|--------|---------|
| G1 — Constraint Coverage | **PASS** | All 12 constraints (C1–C12) covered |
| G2 — Failure Condition Coverage | **GAP** | F6 (engineering view) not covered — skill is DEPRECATED |
| G3 — Scenario Coverage | **GAP** | S3, S5 not covered — both depend on deprecated engineering view |
| G4 — Skill Existence | **PASS** | All 4 skills exist |
| G5 — Agent Existence | **PASS** | All 3 agents exist |
| G6 — Skill-Agent Alignment | **PASS** | All 5 assignments match |
| G7 — Contract Fields | **PASS** | All contracts have required fields (note: flat stm deviation from standard) |
| G8 — Template References | **PASS** | All 4 templates resolve |
| G9 — Intent Hash | **PASS** | Hashes match |
| G10 — Required Sections | **PASS** | All 9 sections present |

**Overall: 8 PASS, 2 GAP**

---

## Recommended Actions

### 1. Update intent.yaml — Remove Stale Engineering View References

The `generate-engineering-view` skill is deprecated. The intent.yaml should be updated:

- **Remove F6** (or mark it as N/A): The engineering view is no longer an output of this play. Engineering detail now lives in `tech.yaml` produced by `/prepare-implementation`.
- **Remove or redefine S3**: The Engineering Lead scenario references "Engineering view and feasibility assessment". Feasibility data is now in `roadmap.yaml`. S3 could be redefined as: "Given: roadmap.yaml with inline feasibility data → Can identify technical dependencies and sequence engineering work."
- **Remove or redefine S5**: The Technical Architect scenario also references the engineering view. S5 could be redefined as: "Given: roadmap.yaml feasibility section → Can identify architecture-impacting features and cross-cutting risks."
- **Update intent description**: Remove "engineering-facing view" from the output set description.

After updating intent.yaml, re-run `/create-play --rebake plan-roadmap` to recompile.

### 2. Contract Schema Observation (Non-Blocking)

The plan-roadmap contract uses flat `stm` paths (`stm.epics_path`, `stm.feasibility_path`) rather than the `stm.input`/`stm.output` pattern from `agent-contract.md`. Both product-strategist and tech-designer agents support this format. This is functional but should be documented as an accepted variant or migrated to the standard pattern in a future update.
