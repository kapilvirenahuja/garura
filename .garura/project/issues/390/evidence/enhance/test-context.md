# Tester Context — #390

Derived from approach.yaml — orchestrator-direct, no agent dispatch.
Contains: evals list with pass/fail criteria; behavioral descriptions of each task (stripped of file paths).
Excludes: files_to_create paths, files_to_modify paths, connections, solution_summary.

Black-box verification: you see the evals + the code on disk. Verify against observed state. Do NOT infer from implementation intent.

---

## Behavioral expectations (per implementation phase)

These describe what should be observably true after the implementation completes — they are not file path lists.

- **B1 — Schema is in the new dual-block shape.** The intent-epic schema defines a single-file shape with two blocks: an intent block at the root (containing an `intents` list, `constraints`, and `failure_conditions`) and a nested `expectation` block (containing `success_scenarios`, `recovery`, and `vetted`). The singular `intent` field is gone. The top-level `failure_scenarios` field is gone.
- **B2 — Generator emits intent only.** The skill that generates intent epics writes only the intent block and a stub expectation (vetted status = `not_generated`, empty success scenarios and recovery lists). It does not write top-level `success_scenarios` or top-level `failure_scenarios`.
- **B3 — Expectation skill fills the stub.** A new skill exists that takes an epic file already carrying the intent block and produces a populated `expectation` block: at least two success_scenarios (each with id, persona, given, then, measure), one recovery entry per failure_condition (with id, for_failure_condition, trigger, direction, handoff in [autonomous, human], derivable_at_l4), and `vetted.status: pending`.
- **B4 — Single Tether at the agent layer.** A new agent exists that drives a single human checkpoint presenting both the intent block and the expectation block together. The agent never sets `vetted.status: approved` on its own — that is the human's act.
- **B5 — Validator enforces the new shape.** The validator passes a new-shape epic (with intents list and vetted: approved expectation) and rejects an old-shape epic (singular intent, top-level success_scenarios, top-level failure_scenarios) with violation categories that include the missing-field for intents and an `expectation_not_vetted` violation.
- **B6 — All 9 existing epics on disk are migrated.** Every pre-existing epic carries `intents` (not singular `intent`), carries `failure_conditions`, and carries `expectation.vetted.status: approved`. Validator passes green on the full set with zero violations.
- **B7 — /specify wires the new flow.** The `/specify` play invokes the new crafter agent after the generator skill, and surfaces the new skill's decision manifest. Scenario evals in /specify reference `expectation.recovery` instead of the old `failure_scenarios`.
- **B8 — No stale references to the old field names anywhere in component source.** Grep the component source tree (skills, agents, plays) for `failure_scenarios` and `^intent:` (singular field reference) — zero hits.
- **B9 — Downstream consumers read the new paths.** The skills that previously read `failure_scenarios[].mitigation`, top-level `success_scenarios`, etc. now read `expectation.recovery[].direction`, `expectation.success_scenarios`, etc.

---

## Evals — pass/fail criteria

### EVAL-01 — Schema file parses and contains dual-block structure
**Assertion:** The intent-epic schema parses as valid YAML. Top-level `intents` key is a list. Top-level `failure_conditions` key is a list. `expectation` key is a nested map with `success_scenarios`, `recovery`, and `vetted` sub-keys. Top-level singular `intent` key is ABSENT. Top-level `failure_scenarios` key is ABSENT.
**Pass when:** All assertions hold.
**Fail when:** Any singular `intent` key, any top-level `failure_scenarios`, or missing `expectation` block.

### EVAL-02 — Generator writes only intent block (no success_scenarios, no recovery at root)
**Assertion:** After running the generator skill, each output epic file contains: `intents:` key (list), `failure_conditions:` key (list of strings), `expectation.vetted.status: not_generated`. Files do NOT contain top-level `success_scenarios:` or `failure_scenarios:` keys.
**Pass when:** All conditions hold for all generated epics.
**Fail when:** Any epic has top-level `success_scenarios` or `failure_scenarios`, or missing `intents`.

### EVAL-03 — Expectation skill produces correct structure
**Assertion:** After the new expectation skill runs on an epic file: `expectation.success_scenarios` is a list with length >= 2, each entry has `id`, `persona`, `given`, `then`, `measure`. `expectation.recovery` is a list with one entry per `failure_conditions` entry. Each recovery entry has `id`, `for_failure_condition`, `trigger`, `direction`, `handoff` (value in [autonomous, human]), `derivable_at_l4`. `expectation.vetted.status` equals `pending`.
**Pass when:** All structure assertions hold.
**Fail when:** Missing sub-fields, recovery count != failure_conditions count, or status != pending.

### EVAL-04 — Crafter agent dispatches single Tether covering both blocks
**Assertion:** Agent invocation results in one Tether checkpoint presented to the user. The checkpoint display includes content from both the intents list and the expectation block. After approval, `vetted.status` in the epic file is `approved`. Agent does NOT present two separate checkpoints.
**Pass when:** One checkpoint, both blocks visible, status `approved` after.
**Fail when:** Two checkpoints, or `vetted.status` remains `pending` after user approval.

### EVAL-05 — Validator passes new shape and rejects old shape
**Assertion:** Running the validator against a new-shape epic (intents list, expectation block, vetted: approved) returns `status: passed` with zero violations. Running the validator against an old-shape epic (singular `intent`, top-level `success_scenarios`, `failure_scenarios`) returns `status: failed` with violations including `missing_field` for intents and `expectation_not_vetted`.
**Pass when:** New shape passes, old shape fails with correct violation categories.
**Fail when:** Old shape passes validation, or new shape fails for structural reasons.

### EVAL-06 — All 9 migrated epics validate green
**Assertion:** Running the validator with epics_dir pointing at the product scope epics directory returns `status: passed`, `total_epics: 9`, `failed_epics: 0`, `total_violations: 0`.
**Pass when:** `status: passed`, `failed_epics: 0`.
**Fail when:** Any violation in any of the 9 epics.

### EVAL-07 — /specify play wires new flow end-to-end
**Assertion:** /specify play's Stage 5 contains a step that references the new crafter agent. /specify scenario evals SCE-1 and SCE-4 reference `expectation.recovery` (not `failure_scenarios`). A step surfaces the new skill's decision manifest.
**Pass when:** All three conditions hold via grep.
**Fail when:** Crafter agent absent from Stage 5, or SCE evals still reference `failure_scenarios`.

### EVAL-08 — No failure_scenarios references remain in component source files
**Assertion:** `grep -r "failure_scenarios" core/components/skills/ core/components/agents/ core/components/plays/` returns zero matches (excluding STM evidence files, approach.yaml, discovery.md, understanding.md, this file).
**Pass when:** Zero grep hits in component source.
**Fail when:** Any hit found in a SKILL.md, agent .md, or play SKILL.md.

### EVAL-09 — No singular intent field references remain in component source files
**Assertion:** `grep -rn "^intent:" core/components/skills/ core/components/agents/ core/components/plays/` and `grep -rn "  intent:" ...` returns zero hits in component source files (excluding schema examples and prose strings like `problem_statement` or `intent-driven`).
**Pass when:** Zero hits for bare `intent:` as a schema field in skills/agents/plays.
**Fail when:** Any skill/agent/play still reads or writes `intent:` as singular field.

### EVAL-10 — derive-quality-profile-from-epics reads correct path after rename
**Assertion:** The `derive-quality-profile-from-epics` SKILL.md contains reference to `expectation.recovery[].direction` (or equivalent recovery path) and does NOT contain `failure_scenarios[].mitigation`.
**Pass when:** Correct path present, old path absent.
**Fail when:** Old path still referenced.

### EVAL-11 — map-user-flows and generate-screen-inventory read expectation.success_scenarios
**Assertion:** Both the `map-user-flows` SKILL.md and the `generate-screen-inventory` SKILL.md reference `expectation.success_scenarios` and do NOT reference top-level `success_scenarios` as an epic field.
**Pass when:** Both skills use correct path.
**Fail when:** Either skill still references top-level `success_scenarios`.

---

## Reporting format

For each eval, record one entry in verification-report.yaml:

```yaml
- eval_id: EVAL-NN
  status: PASS | FAIL
  evidence: |
    <grep command run, output observed, or file content excerpt>
  notes: <optional, only on FAIL — what was missing/wrong>
```

Sum to: `total_evals`, `passed`, `failed`, `iteration` (the fix-loop iteration number).
