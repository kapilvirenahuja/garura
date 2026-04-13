# Agent Audit: judge

**Role in recipe:** Context-isolated validator. Steps 3a (input-output coverage) and 5 (validate vision).
**Source:** `core/components/agents/judge.md`

## P1-P11 Results

| # | Principle | Result | Evidence |
|---|-----------|--------|----------|
| P1 | JSON contract mode | PASS | Contract mode declared; accepts mode, artifact_paths, stm, task_id |
| P2 | STM path discipline | PASS | Writes validation-result and coverage-check only to declared stm.output paths |
| P3 | Intent reading | PASS | Reads intent.yaml for constraints/failures |
| P4 | Structured failure on error | PASS | Returns structured failure per protocol |
| P5 | No AskUserQuestion | PASS | Never prompts user |
| P6 | JSON-only response | PASS | Returns enriched contract only |
| P7 | Skill delegation | PASS | Invokes validate-product-vision (Mode 2); input-output coverage is native validator logic (Mode 4), no skill required |
| P8 | Self-recovery bounded | PASS | Validator is deterministic; no retry needed |
| P9 | Domain boundaries | PASS | Validator domain only — never drafts/edits artifacts |
| P10 | Task graph participation | PASS | TaskUpdate on entry/completion |
| P11 | Context loading | EXEMPT | Judge is intentionally context-isolated — operates only on contract-provided paths; R1-R4 does not apply |

**Context-isolation verified:** Judge receives only artifact_paths + problem_statement;
no market context, no drafting notes, no iteration history. This is required for
reverse-coverage and validation modes in this recipe.

**Overall:** PASS. No upgrades required.
