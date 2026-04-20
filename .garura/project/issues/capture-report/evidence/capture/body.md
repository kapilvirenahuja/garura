| Field | Value |
|-------|-------|
| **Type** | bug |
| **Reported From** | /fix-it execution-path audit vs. agent-compliance audit reconciliation |
| **Date** | 2026-04-19 |

### Problem

`tech-designer` violates the Meridian principle **"agents collect context, skills produce artifacts"** in the `/fix-it` play. In Step 3 (RCA & Design), tech-designer authors four domain artifacts inline via the `Write` tool and invokes no skill:

- `{stm_base}/{issue}/evidence/fix-it/rca.yaml`
- `{stm_base}/{issue}/evidence/fix-it/design.yaml`
- `{stm_base}/{issue}/evidence/fix-it/resolution-trace.yaml`
- `{stm_base}/{issue}/evidence/fix-it/regression-test.yaml`

The `/fix-it` hot path (RCA → Design → Implement → Verify) has **zero skill invocations** for domain artifact production — the clearest violation of the principle in the codebase, on a shipped, actively-used play.

### Root Cause

1. **Skill Pool is prepare/arch-only.** `core/components/agents/tech-designer.md:265-276` lists only `draft-technical-approach`, `draft-lld`, `draft-implementation-plan`, `derive-nfr-spec`, `derive-quality-vision`, `research-domain-context`. None cover fix-it outputs (RCA, fix design with alternatives, LTM resolution trace, failing regression-test).

2. **Escape-hatch language in agent definition.** Two carve-outs let tech-designer bypass the principle whenever a matching skill does not exist:
   - `tech-designer.md:280` — *"For direct invocations (no JSON contract), perform analysis directly — skills are only used in the contract workflow."*
   - `tech-designer.md:282` — *"Regression test authorship (fix-it TDD mode): … write a YAML eval-spec file to `{stm_base}/{issue}/evidence/fix-it/regression-test.yaml` containing grep/structural assertions."*

Because the escape hatch exists, the Skill Pool never grows to cover new plays — new domain artifacts inherit the exemption.

### Specific Issues

- `rca.yaml` has a well-defined shape (root_cause, blast radius, specific file/logic, why-wrong) but no `draft-rca` skill exists.
- `design.yaml` has a well-defined shape (`alternatives_considered` with `rejection_reason`, `affected_files` map, execution steps) but no `draft-fix-design` skill exists.
- `regression-test.yaml` has a well-defined shape (failing YAML eval-spec with grep/structural assertions, red-state verified) but no `author-regression-test` skill exists.
- `resolution-trace.yaml` has a well-defined shape (R1–R4 per-domain resolution source) but is authored inline as a side-effect of RCA rather than via a dedicated skill.

Related (lower severity) on the same play:
- `code-builder` authors `implementation-report.yaml` inline in Step 6 (no skill).
- `quality-auditor` authors `regression-test-verdict.yaml` inline in Step 6b (no skill; artifact is tiny but still an inline write).

### Expected Behavior

tech-designer should be a pure context-assembly shell that invokes specialized skills for every domain artifact. Proposed fix:

1. **Create three specialized skills** and wire them into tech-designer's Skill Pool:

   | New skill | Input | Output |
   |-----------|-------|--------|
   | `draft-rca` | `issue_read_path`, `ltm_context`, `output_base` | `rca.yaml` + `resolution-trace.yaml` |
   | `draft-fix-design` | `rca_path`, `output_base` | `design.yaml` with `alternatives_considered`, `affected_files`, execution steps |
   | `author-regression-test` | `rca_path`, `design_path`, `output_base` | `regression-test.yaml` (failing YAML eval-spec) + red-state verification |

2. **Delete the escape-hatch language.** Remove `tech-designer.md:280` ("perform analysis directly") and `tech-designer.md:282` (regression-test inline carve-out). Replace with: *"If no matching skill exists, return a structured failure requesting the skill be created — do not author artifacts inline."*

3. **Rebuild `/fix-it`** via `/create-play --rebuild fix-it` so SKILL.md Step 3 reflects skill delegation.

User directive: **individual specialised skills are required** — do not merge into a single combined skill.

### Impact

- Principle erosion: the escape hatch invites every new play to skip skill authoring, compounding drift.
- Testability: inline artifact authorship is harder to test in isolation than a skill with a fixed input/output contract.
- Consistency: /specify delegates every artifact through a product-keeper skill; /fix-it has zero — the framework is internally inconsistent.
- Reuse: other plays that need RCA, fix design, or failing-test authoring cannot reuse tech-designer's logic without copy-pasting the inline implementation.

Related audit context: of 19 agents reviewed, 4 VIOLATE (eval-generator, intent-crafter, knowledge-extractor, test-engineer) and 4 are PARTIAL (engineering-manager, intent-resolver, tech-architect, tech-designer). tech-designer is called out as most severe because of fix-it's active use.
