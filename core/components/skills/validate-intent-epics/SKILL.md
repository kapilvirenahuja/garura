---
name: validate-intent-epics
description: Blocking validator for the intent epics directory. Walks every epic YAML, asserts mandatory fields are populated, constraints are quantified, scenario counts meet thresholds, and KB traceability resolves to real feature IDs. Returns structured failure with per-epic error details on any violation.
user-invocable: false
model: haiku
allowed-tools: Read, Write, Glob, Grep, Bash
---

# validate-intent-epics

Model-invocable BLOCKING validator for intent epic files. Called by `product-keeper` during `specify` Stage 5 after generate-intent-epics runs.

## Purpose

Enforce the `intent-epic-schema.yaml` contract. "Sounds good, means nothing" shallow outputs are structurally impossible because this skill refuses to pass incomplete or unquantified epics. On any violation, returns a structured failure with field-level error messages. The calling play halts and cycles back to generate-intent-epics with the error context.

## Input

Receive from product-keeper:
- `epics_dir` (path, required) — typically `.meridian/product/scope/epics/`
- `ltm_intent_epic_schema_path` (path, required) — `core/components/memory/standards/schemas/intent-epic.yaml`
- `ltm_rules_epics_path` (path, required) — `core/components/memory/standards/rules/epics.md`
- `ltm_rules_features_path` (path, required) — `core/components/memory/standards/rules/features.md`
- `ltm_rules_scenarios_path` (path, required) — `core/components/memory/standards/rules/scenarios.md`
- `ltm_domain_taxonomy_path` (path, required) — for kb_source traceability check (LTM)
- `stm_research_dir` (path, optional) — for kb_source traceability check (STM) when epics carry `kb_source.provisional: true`
- `output_path` (string, required) — validation result YAML, typically `.meridian/product/scope/validation-intent-epics.yaml`

## Process

### 1. Load schema, rules, and catalog

- Read `intent-epic-schema.yaml` for the mandatory-field list and validation rules comment block.
- Read `rules/epics.md`, `rules/features.md`, and `rules/scenarios.md`. These are the authoritative rule source — this skill's check categories map 1:1 to rules in these files.
- Glob `{ltm_domain_taxonomy_path}/*.md` (excluding `_index.md` and underscore-prefixed files) and extract every feature ID present. Hold as an LTM feature set.
- If `stm_research_dir` is provided, glob `{stm_research_dir}/*.md` and extract every feature ID. Hold as an STM feature set. Epics with `kb_source.provisional: true` check against this set.

### 2. Enumerate epic files

Glob `{epics_dir}/*.yaml`. For each file, load as YAML. Hold the full set in memory — cross-epic checks (single-module-scope, dependency cycle, foundation investment) need the whole batch.

### 3. Per-epic validation

For every epic, run these checks in order and collect violations per field:

**Mandatory fields present and non-empty (rules/features.md Rule 1):**
- `id`, `domain`, `capability`
- `problem_statement` (string, length >= 80 characters to catch one-liners) (rules/features.md Rule 6)
- `intent` (string, length >= 20 characters, contains a measurable word or number) (rules/features.md Rule 7)
- `appetite` (string matching `/\d+\s*(week|day|month)s?/i`)
- `in_scope` (list, length >= 1, every entry length >= 15 characters)
- `anti_goals` (list, length >= 1)
- `must_not_break` (list, length >= 1) (rules/epics.md Rule 4)
- `success_scenarios` (list, length >= 2, every entry has `scenario` and `evidence`)
- `failure_scenarios` (list, length >= 2, every entry has `scenario`, `impact`, `mitigation`)
- `business_rules` (list, length >= 1)
- `hypothesis` (string, contains all three phrases: "We believe that", "result in", "We will know this is true when") (rules/features.md Rule 3)
- `assumptions_requiring_validation` (list, length >= 1)
- `dependencies` (list, may be empty but key must be present)
- `depends_on` (list, may be empty but key must be present) (rules/epics.md Rule 6)
- `foundation_investment` (boolean, present — true or false) (rules/epics.md Rule 7)
- `kb_source.capability` (string, present)
- `kb_source.rules_applied` (list, may be empty but key must be present)

**Constraint quantification:**
- `constraints.performance` must match regex `\d+\s*(ms|s|rps|%|qps|MB|GB|ops)` (case insensitive).
- `constraints.security` must contain at least one of: `OWASP`, `NIST`, `PCI-DSS`, `SOC2`, `ISO\s*27001`, `bcrypt`, `argon2`, `SAML`, `OAuth2`, `AES-\d+`, `TLS\s*1\.[23]`, `FIDO2`, `WebAuthn`.
- `constraints.accessibility` must match regex `WCAG\s*\d+(\.\d+)?\s*(A|AA|AAA)`.
- `constraints.compliance` is a list; each entry must name a specific regulation (GDPR, HIPAA, PCI-DSS, SOC2, CCPA, SOX, ISO 27001, FERPA, GLBA, etc.) OR the list may be empty.

**Placeholder detection:**
- Scan every string value in the epic. Any occurrence of `TBD`, `to be determined`, `unclear`, `???`, `to do`, or a lone `?` at end of a field is a placeholder violation.

**Traceability (rules/features.md Rule 5):**
- `kb_source.capability` must equal the top-level `capability` field.
- Both must resolve to a real feature ID in either (a) the LTM domain-taxonomy set loaded in step 1, OR (b) the STM `kb-research/{domain}.md` set if the epic carries `kb_source.provisional: true`. Dangling feature IDs are a violation.
- `kb_source.provisional: true` is a valid flag on epics whose capability source lives in STM research (not yet promoted to LTM). Provisional epics may be promoted to non-provisional later via a downstream promotion play; until then they carry the flag.

### 4. Cross-epic rule checks

These checks need the full epic batch. Run them after per-epic validation.

**Single-module scope (rules/epics.md Rule 2):**
- For each epic, assert `domain` holds exactly one value. Multi-value `domain` is a violation.
- If `cross_cutting_justification` is empty, assert every `in_scope` item's implicit domain matches the epic's top-level `domain`. Violation category: `multi_module_scope`.

**Vertical slice (rules/epics.md Rule 1):** three checks.

1. **Horizontal layer intent** — grep the `intent` field for the legacy pattern `(set up|build out|create)\s+(db|database|schema|api|backend|infrastructure|pipeline)` without an accompanying user outcome. Match = violation `horizontal_layer_intent`.

2. **Subsystem actor** — parse the `intent` field to find its grammatical subject. If the subject is in the subsystem disallow-list {analyst, improver, judge, scorer, orchestrator, dispatcher, worker, pipeline, parser, validator, resolver, matcher, compiler, transformer, agent (as "the {adjective} agent"), skill, plugin, adapter, catalog, store, vault, ledger, index, registry, database, schema, system, service, module, handler, endpoint, queue, cache, worker pool, backend, frontend, infrastructure}, the epic fails with violation `subsystem_actor`. The intent must be authored with a named persona or a canonical role (user, admin, developer, operator, reviewer) as the grammatical subject.

3. **Non-observable outcome** — grep the first success_scenarios[0].then string for terminal verbs indicating internal system behavior rather than user-observable state change: {produce, return, emit, write, persist, compute, normalize, parse, validate} when used as the TERMINAL verb without an accompanying user observation. Example violation: "then the analyst produces a structured problem list" (terminal "produces", no user observation). Example PASS: "then the user sees an analyst problem list in the review panel within 3 seconds of submitting" (user observes the output). Violation category: `non_observable_outcome`.

**Provenance tracking (rules/features.md Rule 8):**
- Every epic must carry a top-level `provenance` block with `source`, `source_quote`, `confidence`. Missing block = violation `missing_provenance`.
- Any epic whose `provenance.source == "assumption"` is a violation `unconfirmed_inference` — assumptions live in `assumptions_requiring_validation`, not in the epic body.

**Constraint justification (rules/features.md Rule 9):**
- Every constraint sub-field (`performance`, `security`, `accessibility`, and each `compliance` list entry) must carry a `source_for_quantification` block with `source` + `source_reference`. Missing = violation `unsourced_constraint`.
- Any constraint with `source_for_quantification.source in {kb_default, assumption}` fails `unconfirmed_inference` — these values must have been user-grounded at the capability-configuration checkpoint BEFORE reaching epic generation. If they arrive ungrounded, the pipeline skipped Rule 11.
- Profile mismatch: cross-check numeric values against the project profile. Examples:
  - `nfr_scale < 3` but constraint says `>= 1000 concurrent sessions` → `profile_scale_mismatch`
  - `team_size == 'solo'` but constraint says `99.99% uptime` → `profile_team_mismatch`
  - `compliance == []` but constraint names HIPAA / PCI-DSS / GDPR controls → `profile_compliance_mismatch`

**Should-language scan (rules/epics.md Rule 5, rules/scenarios.md Rule 2):**
- For every epic's `success_scenarios[]`, grep the `scenario` string (and any nested `then` text) for the blacklist: `\b(should|smooth|intuitive|seamless|better|user-friendly)\b`. Match = violation `should_language`.

**Mock de-mocking (rules/epics.md Rule 3):**
- For every epic where `uses_mocks == true`, assert `demock_epic_ref` is non-empty AND resolves to another epic id in the current batch. Missing = violation `unreplaced_mock`.

**Dependency cycle (rules/epics.md Rule 6):**
- Build the directed graph of `depends_on` across all epics in the batch.
- Run a topological sort. If sort fails (cycle detected), emit `dependency_cycle` violation on every epic in the cycle with the cycle path in `detail`.
- Assert every `depends_on[]` id resolves to another epic in the batch. Dangling = violation `dangling_dependency`.

**Foundation investment (rules/epics.md Rule 7):**
- Count incoming `depends_on` references per epic.
- For any epic with incoming count ≥ 2 AND `foundation_investment: false` (or missing), emit `missing_foundation_flag` violation.
- For any epic with `foundation_investment: true` AND incoming count < 2, emit `overstated_foundation` warning (non-blocking).

### 5. Build validation result

```yaml
status: passed | failed
summary:
  total_epics: <int>
  passed_epics: <int>
  failed_epics: <int>
  total_violations: <int>
  by_category:
    # Field-level checks (features.md Rule 1)
    missing_field: <int>
    unquantified_constraint: <int>
    placeholder_value: <int>
    dangling_kb_source: <int>
    scenario_count_below_min: <int>
    hypothesis_format: <int>
    # Rule-level checks (epics.md + features.md + scenarios.md)
    multi_module_scope: <int>
    horizontal_layer_intent: <int>
    subsystem_actor: <int>           # NEW — Rule 1 (actor test)
    non_observable_outcome: <int>    # NEW — Rule 1 (outcome test)
    should_language: <int>
    unreplaced_mock: <int>
    dependency_cycle: <int>
    dangling_dependency: <int>
    missing_foundation_flag: <int>
    # Provenance + justification (features.md Rules 8 + 9; product.md Rule 11)
    missing_provenance: <int>        # NEW
    unsourced_constraint: <int>      # NEW
    unconfirmed_inference: <int>     # NEW
    profile_scale_mismatch: <int>    # NEW
    profile_team_mismatch: <int>     # NEW
    profile_compliance_mismatch: <int> # NEW
  warnings:
    overstated_foundation: <int>
epics:
  - id: EPIC-user-login-001
    file: <path>
    status: passed | failed
    violations:
      - field: constraints.performance
        category: unquantified_constraint
        detail: "Value 'fast' does not match quantification regex"
      - field: success_scenarios[0].scenario
        category: should_language
        detail: "Contains blacklisted word 'smooth' — replace with observable outcome"
      - field: depends_on
        category: dependency_cycle
        detail: "Cycle detected: EPIC-A → EPIC-B → EPIC-A"
```

### 6. Write the validation result

Write to `{output_path}`. Do NOT modify the epic files themselves.

### 7. Return output contract

```yaml
validation:
  path: <written path>
  status: passed | failed
  total_epics: <int>
  failed_epics: <int>
  total_violations: <int>
```

On `status: passed`, the calling agent proceeds to Stage 6 (derive-quality-profile-from-epics).
On `status: failed`, the calling agent returns a structured failure to the play, which cycles back to generate-intent-epics with the validation result as fix context.

## Constraints

- NEVER modify epic files. Read-only on epics.
- NEVER "fix" or "normalize" violations. Report them, let the generate-intent-epics skill regenerate on cycle-back.
- NEVER skip a check. All checks run on every epic, even after the first failure — the full list is needed for fix context.
- NEVER return `passed` with any violation in the report. `passed` means zero violations across every epic (warnings do not block).
- NEVER skip the cross-epic checks (Step 4). Per-epic checks alone miss dependency cycles, multi-module scope drift, and foundation-flag errors.
- ALWAYS load the rules files (`rules/epics.md`, `rules/features.md`, `rules/scenarios.md`) as the authoritative rule source. This skill's check list is derivative; the rule files are the source of truth.
- ALWAYS use the schema file as the source of truth for mandatory fields — if the schema adds or removes fields, the validator respects them without code changes.
- ALWAYS run the traceability check against BOTH the LTM domain-taxonomy catalog AND the STM research dir (when provided) — the KB-gap handling flow depends on this.

## Version

| Field | Value |
|-------|-------|
| Version | 0.1.0 |
| Category | product-planning |
| Created | 2026-04-14 |
| Related | `core/components/skills/generate-intent-epics`, `core/components/memory/standards/schemas/intent-epic.yaml` |
