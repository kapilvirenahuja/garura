# Play Analysis: scope

**Intent source:** `core/components/plays/scope/reference/intent.yaml` (user-Tethered, v0.1.0)
**Workflow structure:** A (Full checkpoint flow — multi-agent, two human Tether gates)

## Phase map (10 phases)

| Phase | Name | Owner | Skill(s) invoked |
|-------|------|-------|------------------|
| 0 | Issue resolution / creation | project-orchestrator | manage-issue |
| 1 | Intake interview (brief.md + grounding-questions.md) | play + repo-orchestrator (commit) | (user-provided files) + create-commit via repo-orchestrator |
| 2 | Catalog match (3 sources → 5 buckets) | product-keeper | (agentic read — reads features.yaml, enriched-capabilities.yaml, domain-selection.yaml) |
| 3 | Constraint fit (project-profile + quality-profile) | product-keeper | (agentic read) |
| 4 | KB + LTM grounding (conditional on new-capability / new-domain) | product-keeper | research-domain-context |
| 5 | Placement checkpoint (Tether/Vanish/Orbit) — Vanish closes GH issue | play | — |
| 6 | Product-spec updates (features.yaml + enriched-capabilities.yaml + domain-selection.yaml) | product-keeper | manage-features |
| 7 | Epic generation / extension (capability-scoped) | product-keeper | generate-intent-epics, validate-intent-epics |
| 8 | Gap interview loop (on validate-intent-epics failure, single-loop) | play + product-keeper | validate-intent-epics (re-run) |
| 9 | Epic checkpoint (Tether/Vanish/Orbit) — Vanish leaves issue open | play | — |
| 10 | Evidence commit & close | repo-orchestrator | create-commit |

## Agents declared

- project-orchestrator — Phase 0 (issue work)
- product-keeper — Phases 2–7 (catalog match, constraint fit, grounding, updates, epics)
- repo-orchestrator — Phase 1 intake commit + Phase 10 evidence commit

## Skill inventory (all existing)

- manage-issue (project-orchestrator)
- manage-features (product-keeper; agentic upsert/extend/new — no mode flag per C8)
- research-domain-context (product-keeper; conditional per C6)
- generate-intent-epics (product-keeper; capability-scoped per C10)
- validate-intent-epics (product-keeper)
- create-commit (repo-orchestrator; Phase 1 + Phase 10)

## Constraint → mechanism map (high level)

- C1 pre-flight+structural — issue resolution is Phase 0
- C2 structural — agentic intake (no count)
- C3 artifact-verifiable — user-provided path + file names
- C4 artifact-verifiable — catalog-match.yaml bucket enum
- C5 artifact-verifiable — constraint-fit.yaml shape
- C6 structural — conditional routing on bucket
- C7 structural — placement checkpoint always shown; Vanish closes issue
- C8 structural — no mode flag; product-keeper decides
- C9 artifact-verifiable — features.yaml row carries issue field
- C10 artifact-verifiable — generate-intent-epics scoped; validate-intent-epics pass
- C11 structural — epic checkpoint always shown
- C12 structural — STM vs LTM path separation
- C13 structural — agent delegation
- C14 structural — missing artifacts auto-created
- C15 structural — config-token path resolution

## LTM input coverage (for skill dispatches)

- manage-features requires: enriched_capabilities_path, project_profile_path, stm_output_base, ltm_rules_feature_catalog_path → play must instruct product-keeper to glob/resolve each.
- generate-intent-epics requires: enriched_capabilities_path, project_profile_path, market_brief_path, ltm_intent_epic_schema_path, ltm_rules_epics_path, ltm_rules_features_path, ltm_rules_scenarios_path, epics_output_dir, decision_manifest_path.
- validate-intent-epics requires: epics_dir, ltm_intent_epic_schema_path, ltm_rules_epics_path, ltm_rules_features_path, ltm_rules_scenarios_path, ltm_domain_taxonomy_path, output_path.
- research-domain-context requires: domain, knowledge_gaps, problem_statement, output_base.
- manage-issue requires: action, issue_number or description, platform.
