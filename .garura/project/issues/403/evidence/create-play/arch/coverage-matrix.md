# Coverage Matrix — /arch rebuild (#403)

Verifies every constraint, failure condition, and scenario in the new intent.yaml + expectation.yaml is covered by the compiled SKILL.md.

## Constraints (26 total)

| ID | Category | Covered By | Location in SKILL.md |
|----|----------|------------|----------------------|
| C1 | structural | Pre-flight section (soft probe table + question fallback per stage) | Pre-flight |
| C2 | structural | Workflow output paths + scriber dispatch + Compilation Metadata listing 6 artifacts | Workflow + Metadata |
| C3 | structural | Task DAG dependencies (Stages 1+2 parallel, 3-6 sequential, 6 last) | Task DAG |
| C4 | structural | Stage 3 layer model establishment (pin / KB / user pick) | Step 6 (Stage 3) |
| C5 | artifact-verifiable | SE-19 (F22 — provenance + KB-byte-match) | Step 2 Evals |
| C6 | artifact-verifiable | SE-3 (F3 — component shape) | Step 6 Evals |
| C7 | artifact-verifiable | SE-2 (F2 — deny-list scan) | Step 6 Evals |
| C8 | artifact-verifiable | SE-5a + SE-5b (F5 — cycle detection in logical and physical) | Step 6 + Step 8 Evals |
| C9 | artifact-verifiable | SE-4 (F4 — E2E traceability) | Step 6 Evals |
| C10 | artifact-verifiable | SE-6 (F6 — physical fields + category-term ban) | Step 8 Evals |
| C11 | artifact-verifiable | SE-7 (F7 — cardinality rationale + layer match) | Step 8 Evals |
| C12 | artifact-verifiable | SE-6 (category-term deny-list) | Step 8 Evals |
| C13 | artifact-verifiable | SE-12 (F12 — delta_log shape, security ratchet) | Step 4 Evals |
| C14 | artifact-verifiable | SE-8 (F8 — NFR delivery coverage) | Step 8 Evals |
| C15 | artifact-verifiable | SE-10 (F10 — tech-stack entry shape) | Step 10 Evals |
| C16 | artifact-verifiable | SE-9 (F9 — pattern citation + system-level placement) | Step 10 Evals |
| C17 | artifact-verifiable | SE-11 (F11 — risk shape + stage-order mtime) | Step 12 Evals |
| C18 | artifact-verifiable | SE-13 (F13 — source-type discipline) | Step 14 Evals |
| C19 | structural | Per-checkpoint tiered surfacing flow (HIGH batch, MID batch+questions, LOW one-by-one) | Steps 3, 5, 7, 9, 11, 13 |
| C20 | structural | Skill-level multi-candidate halt + orchestrator grounding-question pass at checkpoints | Steps 2-12 contracts + Checkpoints |
| C21 | artifact-verifiable | SE-13 (pin override check) | Step 14 Evals |
| C22 | artifact-verifiable | SE-16 (F16 — manifest completeness) | Step 14 Evals |
| C23 | structural | Six checkpoint blocks in workflow + Task DAG checkpoint tasks | Workflow + Task DAG |
| C24 | structural | Agent boundary table (tech-architect / tech-designer / scriber) | Role section |
| C25 | structural | Orchestrator-reply discipline (lead in product/feature language) | Implicit across all checkpoint prose |
| C26 | structural | Role forbidden-list explicitly forbids code / tests | Role section |

**Coverage: 26 / 26 PASS.**

## Failure conditions (24 total)

| ID | Covered By | Severity | Location |
|----|------------|----------|----------|
| F1 | SE-1 (artifact existence) | blocker | Step 14 Evals |
| F2 | SE-2 (deny-list) | blocker | Step 6 Evals |
| F3 | SE-3 (component shape) | blocker | Step 6 Evals |
| F4 | SE-4 (E2E traceability) | blocker | Step 6 Evals |
| F5 | SE-5a + SE-5b (cycle detection) | blocker | Step 6 + Step 8 Evals |
| F6 | SE-6 (physical shape + category-term) | blocker | Step 8 Evals |
| F7 | SE-7 (cardinality + layer match) | blocker | Step 8 Evals |
| F8 | SE-8 (NFR delivery) | blocker | Step 8 Evals |
| F9 | SE-9 (pattern citation + placement) | blocker | Step 10 Evals |
| F10 | SE-10 (tech-stack shape) | blocker | Step 10 Evals |
| F11 | SE-11 (risk shape + stage order) | blocker | Step 12 Evals |
| F12 | SE-12 (delta_log + security ratchet) | blocker | Step 4 Evals |
| F13 | SE-13 (source-type discipline) | blocker | Step 14 Evals |
| F14 | SE-14 (multi-candidate discipline) | blocker (human-handoff) | Step 14 Evals |
| F15 | SE-15 (decision surfacing) | blocker (human-handoff) | Step 14 Evals |
| F16 | SE-16 (manifest completeness) | blocker | Step 14 Evals |
| F17 | Structural — Checkpoint block presence (C23) gates progression; missing checkpoint is detected by orchestrator | structural | Workflow Checkpoint blocks |
| F18 | Structural — scriber-only write path enforced in role section | structural | Role section |
| F19 | Structural — Role section explicitly forbids code emission | structural | Role section |
| F20 | SE-17 (stage-order mtime) | blocker | Step 14 Evals |
| F21 | SE-18 (layer model integrity) | blocker | Step 6 Evals |
| F22 | SE-19 (system provenance + KB byte-match) | blocker | Step 2 Evals |
| F23 | SE-20 (system_ref resolution) | blocker | Step 6 Evals (logical) + Step 8 (physical) |
| F24 | Structural — Pre-flight section explicitly mandates soft probe; hard-halt would violate the rule visible in the compiled SKILL.md | structural | Pre-flight section |

**Coverage: 24 / 24 PASS.**

## Success scenarios (8 total)

| ID | Persona | Covered By |
|----|---------|------------|
| S1 | Technical Architect | SCE-1 (Scenario Validation section) |
| S2 | Integration Lead | SCE-2 |
| S3 | Implementation Lead | SCE-3 |
| S4 | Security Architect | SCE-4 |
| S5 | DevOps / Platform Engineer | SCE-5 |
| S6 | Product Manager | SCE-6 |
| S7 | Risk Owner / Engineering Director | SCE-7 |
| S8 | Senior Developer onboarding | SCE-8 |

**Coverage: 8 / 8 PASS.**

## Recovery entries (24 total)

| ID | For Failure | Handoff | In SKILL.md |
|----|-------------|---------|-------------|
| REC1 | F1 | autonomous | ✓ |
| REC2 | F2 | autonomous | ✓ |
| REC3 | F3 | autonomous | ✓ |
| REC4 | F4 | autonomous | ✓ |
| REC5 | F5 | human | ✓ |
| REC6 | F6 | autonomous | ✓ |
| REC7 | F7 | autonomous | ✓ |
| REC8 | F8 | autonomous | ✓ |
| REC9 | F9 | autonomous | ✓ |
| REC10 | F10 | autonomous | ✓ |
| REC11 | F11 | autonomous | ✓ |
| REC12 | F12 | autonomous | ✓ |
| REC13 | F13 | human | ✓ |
| REC14 | F14 | human | ✓ |
| REC15 | F15 | human | ✓ |
| REC16 | F16 | autonomous | ✓ |
| REC17 | F17 | human | ✓ |
| REC18 | F18 | autonomous | ✓ |
| REC19 | F19 | autonomous | ✓ |
| REC20 | F20 | autonomous | ✓ |
| REC21 | F21 | human | ✓ |
| REC22 | F22 | autonomous | ✓ |
| REC23 | F23 | autonomous | ✓ |
| REC24 | F24 | autonomous | ✓ |

**Coverage: 24 / 24 PASS. 19 autonomous / 5 human.**

## Gates G1-G12 from /create-play

| Gate | Result |
|------|--------|
| G1 Constraint Coverage | PASS — all 26 constraints classified and covered by their category-appropriate mechanism |
| G2 FC Coverage | PASS — all 24 failure conditions covered (20 by SE evals, 4 structurally) |
| G3 Scenario Coverage | PASS — all 8 success_scenarios have SCE evals |
| G3b Recovery Coverage | PASS — all 24 failure conditions have exactly one recovery entry |
| G4 Skill Existence | PASS — all 7 skills exist on disk |
| G5 Agent Existence | PASS — tech-architect, tech-designer, scriber all exist |
| G6 Skill-Agent Alignment | PASS — agent skill inventories updated in T19; agents declare every skill the play assigns them |
| G7 Contract Schema | PASS — every JSON contract has intent_path, stm_base, stm, task_id |
| G8 Template References | PASS — Standard Play Close block references evidence-file.md + delivery-report.md, both exist under standards/templates/ |
| G9 Intent Hash Drift | PASS — intent_hash and expectation_hash computed and embedded in Compilation Metadata |
| G10 Required Sections | PASS — Frontmatter, Header, Compiled From, Role, Pre-flight, Task DAG, Workflow, Scenario Validation, Recovery, Evidence & Close, Pause and Resume, Compilation Metadata all present |
| G11 Skill LTM Input Coverage | PASS — every skill's required LTM input (kb_systems_dir, kb_quality_dir, kb_layer_models_dir, kb_platforms_dir, kb_data_dir, kb_operations_dir, kb_stacks_dir, kb_patterns_dir, kb_agentic_dir, kb_tech_dir, kb_extension_rules_path) appears in the corresponding play step's JSON contract |
| G12 Standard Play Close | PASS — opener `# --- Standard Play Close (canonical; see standards/rules/play-close.md) ---` and closer `# --- end Standard Play Close ---` present verbatim in Step 15 |

**Summary: 12 / 12 gates PASS. Compilation complete.**
