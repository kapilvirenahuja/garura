# Coverage Matrix: algorithm play
**Compiled:** 2026-05-03

| Intent Item | Type | Category | Covered By | Location |
|-------------|------|----------|------------|----------|
| C1 | constraint | structural | Play directory + Compiled From section | SKILL.md Compiled From |
| C2 | constraint | pre-flight | Pre-flight graceful exit check | SKILL.md Pre-flight table |
| C3 | constraint | pre-flight | Complexity scan bash block (11 indicators) | SKILL.md Pre-flight bash |
| C4 | constraint | pre-flight | Complexity scan — `algorithm_spec_required: true` check | SKILL.md Pre-flight bash |
| C5 | constraint | artifact-verifiable | SE-8 | Step 1 Eval |
| C6 | constraint | artifact-verifiable | SE-9 | Step 1 Eval |
| C7 | constraint | structural | Agent boundary table | SKILL.md Role section |
| C8 | constraint | structural | Step 1 JSON contract — stm.input contains only tech_yaml_path + interface_ids | SKILL.md Step 1 |
| C9 | constraint | artifact-verifiable | SE-10 | Step 1 Eval |
| C10 | constraint | structural | Play phases: Pre-flight → Execution → Approval → Evidence | SKILL.md Workflow |
| C11 | constraint | structural | No KB/LTM read instructions in any step; agent receives only STM paths | SKILL.md Step 1 |
| C12 | constraint | structural | Step 1 JSON contract: intent_path, stm_base, stm.input, stm.output, task_id | SKILL.md Step 1 |
| C13 | constraint | pre-flight | All three pre-flight rows: stm_base, tech.yaml exists, tech.yaml non-empty | SKILL.md Pre-flight table |
| C14 | constraint | artifact-verifiable | SE-11; evidence.record gate in Step 3 bash block | SKILL.md Step 3 |
| C15 | constraint | structural | ## Task DAG section present in compiled SKILL.md | SKILL.md Task DAG |
| C16 | constraint | artifact-verifiable | SE-12; approval step sets LOCKED on Tether | SKILL.md Step 2 |
| C17 | constraint | artifact-verifiable | SE-13 | SKILL.md Step 3 Eval |
| F1 | failure_condition | — | SE-1; pre-flight bash block halts on unresolvable stm_base | SKILL.md Pre-flight + Step 3 Eval |
| F2 | failure_condition | — | SE-2; pre-flight row: hard halt if tech.yaml absent | SKILL.md Pre-flight table + Step 1 Eval |
| F3 | failure_condition | — | SE-3; pre-flight row: hard halt if tech.yaml empty/unparseable | SKILL.md Pre-flight table + Step 1 Eval |
| F4 | failure_condition | — | SE-4; pre-flight graceful exit when qualifying_interfaces is empty | SKILL.md Pre-flight table + Step 3 Eval |
| F5 | failure_condition | — | SE-5; Step 1 recovery: max 2 retries, halt with failing interface_ids | SKILL.md Step 1 + Step 3 Eval |
| F6 | failure_condition | — | SE-6; Step 1 eval: verify reference-algorithms.md exists after skill | SKILL.md Step 1 Eval |
| F7 | failure_condition | — | SE-7; pre-flight row: warn and continue if plan.yaml/scenarios.yaml missing | SKILL.md Pre-flight table + Step 3 Eval |
| S1 | scenario | — | SCE-1 | SKILL.md Scenario Validation |
| S2 | scenario | — | SCE-2 | SKILL.md Scenario Validation |
| S3 | scenario | — | SCE-3 | SKILL.md Scenario Validation |
| S4 | scenario | — | SCE-4 | SKILL.md Scenario Validation |

## G1-G11 Gate Summary

| Gate | Status | Notes |
|------|--------|-------|
| G1 Constraint Coverage | PASS | All 17 constraints classified and covered by category-appropriate mechanism |
| G2 FC Coverage | PASS | All 7 failure conditions covered by step evals |
| G3 Scenario Coverage | PASS | All 4 scenarios covered by scenario evals |
| G4 Skill Existence | PASS | `draft-reference-algorithms` at `core/components/skills/draft-reference-algorithms/SKILL.md` — created |
| G5 Agent Existence | PASS | `tech-architect` at `core/components/agents/tech-architect.md` — exists |
| G6 Skill-Agent Alignment | PASS | `draft-reference-algorithms` added to `tech-architect` Skill Pool table during compilation |
| G7 Contract Schema | PASS | Step 1 contract has: intent_path, stm_base, stm (input + output), task_id |
| G8 Template References | PASS | No template files referenced |
| G9 Intent Hash Drift | PASS | intent_hash matches current SHA-256 of intent.yaml |
| G10 Required Sections | PASS | Frontmatter, Header, Compiled From, Role, Pre-flight, Task DAG, Workflow, Scenario Validation, Pause and Resume, Compilation Metadata — all present |
| G11 Skill LTM Input Coverage | PASS | `draft-reference-algorithms` requires no LTM inputs — context comes entirely from tech_yaml_path (STM-only per C11). No LTM discovery instructions needed. |
