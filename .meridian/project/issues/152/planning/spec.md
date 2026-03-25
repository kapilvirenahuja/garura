# SPEC: #152 — Context-isolated validation for product recipes

**Intent:** Replace self-validation with context-isolated judge evaluation
**Constraints:** Must not break existing checkpoint flows, must preserve pre-lock resolution gate
**Failure Conditions:** Judge receives builder context, validation is rubber-stamped, human checkpoints removed

---

### Summary

Three product recipes (discover-product, plan-roadmap, prepare-architecture) lack independent validation. The most critical problem is discover-product where `product-strategist` both drafts AND validates the artifact — the definition of self-validation. The other two recipes have no validation agent at all, relying only on inline orchestrator scenario evals after the fact.

The `implement-epic` recipe demonstrates the correct pattern: the judge agent receives only the artifact to evaluate (encrypted evals + key) and none of the builder's context. Applying this model to product recipes means routing the validation step through the judge instead of the drafter, passing only the artifact path with no drafting reasoning or intermediate outputs.

The judge agent has no Skill tool today. To invoke existing validation skills (`validate-product-vision`) and new ones (to be created), it needs the Skill tool added. Two new validation skills are required: `validate-roadmap` and `validate-architecture-design`. These follow the exact same pattern as the existing `validate-product-vision` and `validate-implementation-design` skills (model-invocable, Read-only, structured output).

---

### Self-Validation Audit

| Recipe | Drafter | Validator | Same Agent? | Validation Skill | Human Review Before? | Pre-Lock Gate After? |
|--------|---------|-----------|-------------|-----------------|---------------------|---------------------|
| discover-product | product-strategist (Step 3) | product-strategist (Step 6) | **YES — self-validation** | `validate-product-vision` | YES — Step 5 (brief review) | YES — Step 7 (resolution interview) |
| plan-roadmap | product-strategist (Steps 2, 4, 6) | None — orchestrator runs SCEs inline | N/A (no validation agent) | None — step evals in orchestrator | YES — Step 5 (brief review) | YES — Step 5b (feasibility gate) |
| prepare-architecture | tech-designer (Steps 2, 3, 4) | None — orchestrator runs SCEs inline | N/A (no validation agent) | None — step evals in orchestrator | YES — Step 6 (brief review) | YES — Step 6b (risk/gap gate) |

#### What validation currently checks

**discover-product (Step 6 — validate-product-vision):**
- `strategic_goals_defined`: ≥3 strategic goals with title + description
- `target_users_identified`: ≥2 target users with persona, goal, frustration (skipped for library type)
- `success_metrics_measurable`: quantifiable target values
- `competitive_landscape_covered`: ≥2 competitors with name, strength, weakness (skipped for library type)
- `assumptions_listed`: ≥3 non-empty assumptions (≥1 for library type)
- Content quality: problem field, value_proposition differentiation, out_of_scope entries
- Severity classification: blocker / warning / suggestion
- Gate: `ready_for_lock = true` only if completeness_score ≥ 70 AND zero blockers

**plan-roadmap (Step 7 — orchestrator scenario evals, no skill):**
- SCE-1: thesis present, narrative ≥3 paragraphs, all horizons have feature_refs
- SCE-2: feasibility entries have risk_level, technical_risks, sequencing_constraints
- SCE-4: inline comment system and critical_blockers in brief
- SCE-5: epic depth correlates with PP-6 profile level
- SCE-6: critical_blockers and open_questions resolved before roadmap production

**prepare-architecture (Step 8 — orchestrator scenario evals, no skill):**
- SCE-1: stack entries have named technologies and NFR-traceable rationale
- SCE-2: quality-standards has named tooling and debt_baseline for all QP dimensions
- SCE-3: architecture brief has all 5 required tabs
- SCE-4: all roadmap features have architecture coverage
- SCE-5: debt_baseline covers all 7 QP dimensions with target_level and current_level

---

### Judge Agent Analysis

#### Current capabilities

The judge agent (`core/components/agents/judge.md`) has:
- **Tools:** Bash, Read, Grep, Glob, WebFetch
- **Skills:** None — the judge has NO Skill tool
- **Identity:** Black-box tester for implementation evaluation
- **Input:** Encrypted eval file (AES-256-CBC) + decryption key + project root + credentials
- **Output:** Per-eval PASS/FAIL with evidence; `judge_report` YAML

The judge explicitly **MUST NOT** receive: builder prompts, builder reasoning, CONTEXT.md, eval-generator prompts, quality-auditor reports.

#### How implement-epic uses the judge (context isolation pattern)

implement-epic enforces context isolation structurally:

```
eval-generator ──reads──► features.yaml, scenarios.yaml, plan.yaml exit gate
                ──writes─► encrypted evals (AES-256-CBC, outside repo /tmp)

code-builder ──reads──► CONTEXT.md only (distilled plan + tech, no specs)
             ──writes─► implementation code

judge ──receives──► encrypted evals + decryption key + project root
      ──does NOT receive──► builder prompts, CONTEXT.md, quality-auditor results
      ──writes──► judge_report YAML
```

The orchestrator is the **only entity** touching multiple agent outputs. It filters cross-agent information: judge failures → builder receives remediation instructions only, stripped of eval IDs, eval text, pass criteria.

#### Can the judge validate product vision, roadmap, and architecture artifacts?

**Not in its current form.** Three obstacles:

1. **No Skill tool** — judge cannot invoke `validate-product-vision` or any future validation skills. It would have to inline all validation logic using Read + manual field checking. This duplicates logic already in skills.

2. **No validation skills for roadmap or architecture** — `validate-roadmap` and `validate-architecture-design` do not exist. Only `validate-product-vision` (for product.yaml) and `validate-implementation-design` (for the 5 prepare-implementation artifacts) exist.

3. **Context isolation approach differs** — implement-epic uses encryption to enforce isolation. For product artifacts, encryption is not needed: isolation is achieved simply by passing only the artifact path to the judge, not the drafter's intermediate reasoning or market context.

#### Does the judge need new skills?

| Artifact | Validation Skill Needed | Exists? |
|----------|------------------------|---------|
| product.yaml (discover-product) | `validate-product-vision` | ✅ EXISTS |
| roadmap.yaml (plan-roadmap) | `validate-roadmap` | ❌ MISSING |
| architecture.yaml + quality-standards.yaml (prepare-architecture) | `validate-architecture-design` | ❌ MISSING |

The judge also needs the **Skill tool** added to its tools list to invoke these skills.

---

### Affected Files

| File | Role | Change Needed |
|------|------|---------------|
| `core/components/agents/judge.md` | Judge agent definition | Add `Skill` tool; extend identity to include artifact validation mode; add new input contract variants for product/roadmap/architecture; document context isolation rule (receive only artifact path, no drafting context) |
| `core/components/recipes/discover-product/SKILL.md` | Recipe orchestration | Step 6: change agent from `product-strategist` to `judge`; update agent_boundaries table; pass only `product_yaml_path` — no drafting context in contract |
| `core/components/recipes/plan-roadmap/SKILL.md` | Recipe orchestration | Add Step 6.5 (judge validation) between `produce-roadmap` (Step 6) and `scenario-evals` (Step 7); update status file schema; update agent_boundaries table |
| `core/components/recipes/prepare-architecture/SKILL.md` | Recipe orchestration | Add Step 6c (judge validation) between `pre-lock-resolution` (Step 6b) and `lock` (Step 7); update status file schema; update agent_boundaries table |
| `core/components/skills/validate-roadmap/SKILL.md` | NEW validation skill | Validate roadmap.yaml structural completeness: thesis, narrative, timeline horizons, feasibility entries, approved_brief_ref, critical_blockers/open_questions arrays; mirrors pattern of `validate-product-vision` |
| `core/components/skills/validate-architecture-design/SKILL.md` | NEW validation skill | Validate architecture.yaml + quality-standards.yaml: stack specificity, NFR traceability, QP dimension coverage, debt_baseline initialization, agentic PCAM if applicable; mirrors pattern of `validate-implementation-design` |

---

### Technical Approach

**Strategy:** Add Skill tool to judge, create two missing validation skills, route validation steps in all three recipes through the judge — passing only artifact paths, never drafting context.

The key design constraint is: **the judge's input contract for product validation must contain only the artifact path(s), not the agent's intermediate reasoning, market context, or drafting notes.** The orchestrator is responsible for this filtering.

#### Per-recipe changes

**discover-product — Step 6:**
```
Current:  product-strategist ──► validate-product-vision ──► validation_result
New:      judge ──► validate-product-vision ──► validation_result

Judge receives:
  artifact_path: "{product_base}/{slug}/product.yaml"
  validation_skill: "validate-product-vision"
  validation_result_path: "{product_base}/{slug}/validation-result.yaml"

Judge does NOT receive:
  - market context from Step 2
  - product-strategist drafting notes
  - iteration_count or previous cycle-back feedback
```

Step 7 (Pre-Lock Resolution Gate) and all cycle-back logic remain entirely unchanged. The orchestrator reads the validation_result produced by the judge and applies the same branch A/B/C logic.

**plan-roadmap — New Step 6.5:**
```
Insert between Step 6 (produce-roadmap) and Step 7 (scenario-evals):

Judge receives:
  artifact_path: "{slug}/roadmap.yaml"
  validation_skill: "validate-roadmap"
  validation_result_path: "{slug}/validation-result-roadmap.yaml"

Judge does NOT receive:
  - epics_path, feasibility_path
  - product-strategist brief production notes
  - pre-lock resolution answers

If validation fails: orchestrator presents blockers to user (same resolution interview pattern as Step 5b).
If validation passes: proceed to Step 7 (scenario-evals) unchanged.
```

**prepare-architecture — New Step 6c:**
```
Insert between Step 6b (pre-lock-resolution) and Step 7 (lock):

Judge receives:
  artifact_paths: [".meridian/product/{slug}/architecture.yaml",
                   ".meridian/product/{slug}/quality-standards.yaml"]
  validation_skill: "validate-architecture-design"
  validation_result_path: ".meridian/product/{slug}/validation-result-architecture.yaml"

Judge does NOT receive:
  - context_report_path
  - tech-designer drafting notes
  - pre-lock resolution answers

If validation fails: orchestrator presents blockers to user (same resolution interview pattern as Step 6b).
If validation passes: proceed to Step 7 (lock) unchanged.
```

#### New skill contracts

**validate-roadmap** (mirrors validate-product-vision):
- Input: `roadmap_yaml_path`
- Checks: thesis non-empty, narrative has ≥3 paragraphs, ≥1 horizon in timeline with non-empty feature_refs, ≥1 feasibility entry with risk_level + technical_risks + sequencing_constraints, approved_brief_ref points to existing file, critical_blockers and open_questions are non-null arrays
- Output: same schema as validate-product-vision (ready_for_lock, completeness_score, issues with severity, checklist)

**validate-architecture-design** (mirrors validate-implementation-design):
- Input: `architecture_yaml_path`, `quality_standards_yaml_path`, `product_yaml_path` (for QP dimension cross-check)
- Checks: stack entries have concrete named technologies (no vague refs), NFR rationale traces to NFR Profile dimensions, all QP dimensions covered in quality-standards, debt_baseline initialized for all 7 QP dims, agentic PCAM present if agentic signals detected
- Output: same schema as validate-implementation-design (ready_for_lock, per-check results, issues with severity)

#### Alternatives considered

**Alternative A — Keep product-strategist as validator, just strip context:**
The product-strategist already invokes validate-product-vision as a pure skill call. The skill itself is read-only and structural. Adding a "no context" call mode to product-strategist doesn't fully solve the problem — the agent itself can still rationalize issues it was aware of during drafting.

**Alternative B — New dedicated product-validator agent:**
Create a new agent specifically for product artifact validation. This avoids extending the judge's scope. Rejected because: judge is already the established pattern for context-isolated evaluation, and adding another agent adds maintenance surface without architectural benefit.

**Alternative C — Validate before brief generation (earlier placement):**
Place judge validation after drafting but before brief generation, so judge findings appear in the human review brief. This would mean earlier feedback. Rejected because: it changes the position of human checkpoints in discover-product and could make the brief dependent on judge output, complicating the brief generation step. Safer to keep the judge validation post-draft and pre-lock, consistent with current discover-product flow.

#### Risks

| Risk | Severity | Mitigation |
|------|----------|-----------|
| Judge scope creep — adding Skill tool may blur its identity as a pure implementation evaluator | Medium | Scope judge's validation mode strictly: in product artifact validation, it receives only artifact paths + validation skill name. Document this as a distinct operating mode in judge.md. |
| New validation skills require new skill definitions (validate-roadmap, validate-architecture-design) | Low | Both follow the exact pattern of existing skills. Scope is bounded and well-precedented. |
| Step numbering changes in plan-roadmap and prepare-architecture SKILL.md break resume logic | Medium | Status file schemas in both recipes must add new task entries. All sub-steps must be named and tracked. |
| Judge validation adds latency between produce-roadmap / draft-quality-standards and lock | Low | Validation is a Read-only operation. Impact is minimal. |
| If judge blocks, a new human interaction is introduced post-brief-review | Low | Same pattern as Step 7 in discover-product. Resolution interview + RESOLVED path is established. |
