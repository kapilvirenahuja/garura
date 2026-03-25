# Recipe Review: prepare-implementation

**Date:** 2026-03-25
**Mode:** `--review` (read-only diagnostic)
**Intent hash:** sha256:45f4aeea3a06e66e41abd983767e5ba9f3aa3b0cbdde3df691bcaee170fc27c2

## Gap Analysis Summary

| Check | Status | Details |
|-------|--------|---------|
| G1 Constraint Coverage | PASS | All 22 constraints (C1-C22) covered. C20 intent text says "five design artifacts" but recipe correctly scans 4 epic-scoped (architecture.yaml is locked upstream). Intent text stale — see Note 1. |
| G2 FC Coverage | PASS | All 16 failure conditions (F1-F8, F10, F12-F18) covered by step evals. F12/F17 reference "five artifacts" — intent text stale. |
| G3 Scenario Coverage | PASS | All 9 scenarios (S1-S9) covered by SCE-1 through SCE-9 in Scenario Validation section. |
| G4 Skill Existence | PASS | All referenced skills exist: draft-product-spec, draft-verification-scenarios, draft-lld, draft-implementation-plan, validate-implementation-design, generate-implementation-brief, research-domain-context. |
| G5 Agent Existence | PASS | All 4 agents exist: tech-designer, product-strategist, doc-builder, repo-orchestrator. |
| G6 Skill-Agent Alignment | **GAP** | `draft-implementation-plan` not in tech-designer's Skill Pool. Recipe Step 13 dispatches plan.yaml drafting to tech-designer, but tech-designer declares only: assess-feasibility, draft-technical-approach, draft-lld, research-domain-context. |
| G7 Contract Schema | PASS | All JSON contracts contain required fields: intent_path, stm_base, stm (input/output), task_id. |
| G8 Template References | PASS | No specific LTM template file paths referenced. LTM is read by directory — no broken references. |
| G9 Intent Hash Drift | PASS | Compiled hash `45f4aeea...70fc27c2` matches current intent.yaml SHA-256. No drift. |
| G10 Required Sections | PASS | All 9 required sections present: Frontmatter, Header, Compiled From, Role, Pre-flight, Workflow, Scenario Validation, Pause and Resume, Compilation Metadata. Metadata step_eval count inaccurate — see Note 2. |

**Summary:** 9/10 PASS, 1 GAP found

---

## Special Attention Items

### ✅ architecture.yaml as OUTPUT vs INPUT

**PASS** — architecture.yaml is correctly treated as a locked upstream INPUT, not an output:
- Pre-flight checks for locked architecture.yaml at `{product_base}/{slug}/architecture.yaml` (C21)
- Step 0 reads it but never writes to it
- Step 18 (Auto-Lock) locks only 4 epic-scoped artifacts (features.yaml, tech.yaml, scenarios.yaml, plan.yaml)
- SE-R1 explicitly verifies: "This recipe writes zero bytes to architecture.yaml"
- Compilation Metadata lists it under `context_artifacts` with `[locked upstream input]` annotation
- `output_artifacts` correctly shows 4 artifacts only

### ✅ C21 and C22 in pre-flight

**PASS** — Both constraints present in pre-flight table:
- C21: "Locked architecture.yaml exists at `{product_base}/{slug}/architecture.yaml`" → Hard halt — run /prepare-architecture first
- C22: "Locked quality-standards.yaml exists at `{product_base}/{slug}/quality-standards.yaml`" → Hard halt — run /prepare-architecture first

Bash pseudocode in pre-flight also verifies both with status: "LOCKED" check.

### ✅ F18 step eval

**PASS** — F18 is covered by two named evals in Step 0:
- **SE-R1 (C21, F18):** Verifies architecture.yaml exists at product path with LOCKED status
- **SE-R2 (C22, F18):** Verifies quality-standards.yaml exists at product path with LOCKED status

Both have explicit Pass/Fail criteria.

### ✅ Modified C4 and F2 evals

**PASS** — C4 (tech.yaml references locked architecture.yaml) and F2 (tech.yaml contradicts architecture.yaml) are covered by:
1. Step 9 inline eval bullet: "No architecture-level decisions contradicted — tech.yaml aligns with locked architecture.yaml technology selections (C4, F2, C11)"
2. **SE-R3 (C4, F2):** Dedicated named eval — "tech.yaml is verified to not contradict the locked upstream architecture.yaml technology selections. Pass: All technology choices in tech.yaml are consistent with or extensions of those in architecture.yaml. Fail: tech.yaml uses a different framework, database, language, or infrastructure component."

---

## Detailed Notes

### Note 1 — Intent text stale: "five artifacts" references

The intent.yaml still references "five artifacts" or "five design artifacts" in several places, despite architecture.yaml being an upstream locked input (not a recipe output):

| Location | Text | Issue |
|----------|------|-------|
| C20 | "scan all five design artifacts (features.yaml, architecture.yaml, tech.yaml, scenarios.yaml, plan.yaml)" | Recipe Step 17b correctly scans only 4 epic-scoped artifacts. architecture.yaml is excluded because it's locked upstream and cannot have unresolved items. |
| F12 | "The five artifacts were produced or locked without passing through all required human review checkpoints" | Recipe produces and locks only 4 artifacts. |
| F17 | "any of the five design artifacts (features.yaml, architecture.yaml, tech.yaml, scenarios.yaml, plan.yaml)" | Step 17b scans 4, not 5. |
| S9 | "all five design artifacts" | Scenario describes 5-artifact resolution interview. |

**Impact:** The recipe's behavior is pragmatically correct — scanning a locked upstream artifact for open questions would be pointless. But the intent.yaml letter and the recipe implementation diverge. A rebake should update C20, F12, F17, and S9 to say "four epic-scoped design artifacts" (or explicitly note that architecture.yaml is excluded as a locked upstream input).

### Note 2 — Compilation Metadata step_eval count mismatch

The Compilation Metadata states:
```
step_evals | 29 (SE-CR1 through SE-CR5, SE-F1 through SE-F3, SE-R1, SE-R2, SE-R3, SE-T1 through SE-T2, SE-S1 through SE-S4, SE-P1 through SE-P7, SE-CK1 through SE-CK4, SE-V1, SE-L1, SE-15, SE-16)
```

Two issues:

**a) Count arithmetic error:** Enumerating the named ranges: 5+3+3+2+4+7+4+1+1+1+1 = **32**, not 29. The stated count of 29 is incorrect.

**b) Missing formal labels in body:** Only 5 evals carry formal SE-XXX labels in the recipe body:
- SE-R1 (Step 0, C21/F18)
- SE-R2 (Step 0, C22/F18)
- SE-R3 (Step 9, C4/F2)
- SE-15 (Step 17b, C20)
- SE-16 (Step 17b, F17)

The remaining 27 named evals (SE-CR1-5, SE-F1-3, SE-T1-2, SE-S1-4, SE-P1-7, SE-CK1-4, SE-V1, SE-L1) appear **only** in the Compilation Metadata listing. The corresponding eval content exists in the body as inline "Step N Eval:" bullet points, but without the formal SE-XXX designators. This makes traceability from metadata to body difficult.

### Note 3 — G6 GAP: tech-designer missing draft-implementation-plan

The recipe dispatches Step 13 (Draft Execution Plan) to `tech-designer` with task_id `draft-plan`. The tech-designer agent would need to invoke the `draft-implementation-plan` skill to produce plan.yaml.

**tech-designer's declared Skill Pool:**
| Skill | Purpose |
|-------|---------|
| `assess-feasibility` | Feasibility assessment |
| `draft-technical-approach` | architecture.yaml |
| `draft-lld` | tech.yaml |
| `research-domain-context` | Domain research |

**Missing:** `draft-implementation-plan` — needed for plan.yaml production.

**Fix:** Add `draft-implementation-plan` to tech-designer's Skill Pool table:
```
| `draft-implementation-plan` | `stm.plan_path` is null and features, architecture, tech, scenarios are non-null | features_yaml_path, architecture_yaml_path, tech_yaml_path, scenarios_yaml_path, output_base | plan.yaml at {output_base}/plan.yaml |
```

### Note 4 — Missing failure condition IDs (F9, F11)

The intent.yaml failure conditions skip F9 and F11 (going F1-F8, F10, F12-F18). These IDs may have been intentionally removed during prior iterations. Not a gap per se, but worth noting for ID continuity tracking.

### Note 5 — Step 13 receives scenarios.yaml with compartmentalization guard

Step 13's contract correctly includes `scenarios_yaml_path` as input, with an explicit `compartmentalization` field in the context:
```json
"compartmentalization": "scenarios_yaml_path provides scenario IDs and counts ONLY for scenario_gate fields. Do NOT read or reproduce scenario descriptions..."
```

This is well-designed — the contract enforces compartmentalization at the dispatch level.

---

## Recommended Actions

| Priority | Action | Scope |
|----------|--------|-------|
| **P1** | Add `draft-implementation-plan` to tech-designer's Skill Pool | `core/components/agents/tech-designer.md` |
| **P2** | Update intent.yaml C20, F12, F17, S9 — replace "five design artifacts" with "four epic-scoped design artifacts" (or clarify architecture.yaml exclusion) | `reference/intent.yaml` |
| **P3** | Fix Compilation Metadata step_eval count from 29 to 32 | `SKILL.md` Compilation Metadata |
| **P3** | Add formal SE-XXX labels to inline step evals in recipe body for traceability | `SKILL.md` all "Step N Eval:" sections |

Run `/create-recipe --rebake prepare-implementation` to fix identified gaps.
