---
name: validate-intent-epics
description: Blocking validator for the intent epics directory. Walks every epic YAML, asserts mandatory fields are populated, constraints are quantified, scenario counts meet thresholds, and KB traceability resolves to real feature IDs. Returns structured failure with per-epic error details on any violation.
user-invocable: false
model: haiku
allowed-tools: Read, Write, Glob, Grep, Bash
---

# validate-intent-epics

Model-invocable BLOCKING validator for intent epic files. Called by `product-keeper` during `specify-product` Stage 5 after generate-intent-epics runs.

## Purpose

Enforce the `intent-epic-schema.yaml` contract. "Sounds good, means nothing" shallow outputs are structurally impossible because this skill refuses to pass incomplete or unquantified epics. On any violation, returns a structured failure with field-level error messages. The calling play halts and cycles back to generate-intent-epics with the error context.

## Input

Receive from product-keeper:
- `epics_dir` (path, required) — typically `.meridian/product/product/epics/`
- `ltm_intent_epic_schema_path` (path, required) — `core/components/memory/standards/intent-epic-schema.yaml`
- `ltm_domain_taxonomy_path` (path, required) — for kb_source traceability check
- `output_path` (string, required) — validation result YAML, typically `.meridian/product/product/validation-intent-epics.yaml`

## Process

### 1. Load schema + catalog

- Read `intent-epic-schema.yaml` for the mandatory-field list and validation rules.
- Glob `{ltm_domain_taxonomy_path}/*.md` (excluding `_index.md` and underscore-prefixed files) and extract every feature ID present. Hold as a set for traceability checks.

### 2. Enumerate epic files

Glob `{epics_dir}/epic-*.yaml`. For each file, load as YAML.

### 3. Per-epic validation

For every epic, run these checks in order and collect violations per field:

**Mandatory fields present and non-empty:**
- `id`, `domain`, `capability`
- `problem_statement` (string, length >= 80 characters to catch one-liners)
- `intent` (string, length >= 20 characters, contains a measurable word or number)
- `appetite` (string matching `/\d+\s*(week|day|month)s?/i`)
- `in_scope` (list, length >= 1, every entry length >= 15 characters)
- `anti_goals` (list, length >= 1)
- `success_scenarios` (list, length >= 2, every entry has `scenario` and `evidence`)
- `failure_scenarios` (list, length >= 2, every entry has `scenario`, `impact`, `mitigation`)
- `business_rules` (list, length >= 1)
- `hypothesis` (string, contains all three phrases: "We believe that", "result in", "We will know this is true when")
- `assumptions_requiring_validation` (list, length >= 1)
- `dependencies` (list, may be empty but key must be present)
- `kb_source.capability` (string, present)
- `kb_source.rules_applied` (list, may be empty but key must be present)

**Constraint quantification:**
- `constraints.performance` must match regex `\d+\s*(ms|s|rps|%|qps|MB|GB|ops)` (case insensitive).
- `constraints.security` must contain at least one of: `OWASP`, `NIST`, `PCI-DSS`, `SOC2`, `ISO\s*27001`, `bcrypt`, `argon2`, `SAML`, `OAuth2`, `AES-\d+`, `TLS\s*1\.[23]`, `FIDO2`, `WebAuthn`.
- `constraints.accessibility` must match regex `WCAG\s*\d+(\.\d+)?\s*(A|AA|AAA)`.
- `constraints.compliance` is a list; each entry must name a specific regulation (GDPR, HIPAA, PCI-DSS, SOC2, CCPA, SOX, ISO 27001, FERPA, GLBA, etc.) OR the list may be empty.

**Placeholder detection:**
- Scan every string value in the epic. Any occurrence of `TBD`, `to be determined`, `unclear`, `???`, `to do`, or a lone `?` at end of a field is a placeholder violation.

**Traceability:**
- `kb_source.capability` must equal the top-level `capability` field.
- Both must resolve to a real feature ID in the domain-taxonomy set loaded in step 1. Dangling feature IDs are a violation.

### 4. Build validation result

```yaml
status: passed | failed
summary:
  total_epics: <int>
  passed_epics: <int>
  failed_epics: <int>
  total_violations: <int>
  by_category:
    missing_field: <int>
    unquantified_constraint: <int>
    placeholder_value: <int>
    dangling_kb_source: <int>
    scenario_count_below_min: <int>
    hypothesis_format: <int>
epics:
  - id: EPIC-user-login-001
    file: <path>
    status: passed | failed
    violations:
      - field: constraints.performance
        category: unquantified_constraint
        detail: "Value 'fast' does not match quantification regex"
      - field: failure_scenarios
        category: scenario_count_below_min
        detail: "Found 1 entry, minimum is 2"
```

### 5. Write the validation result

Write to `{output_path}`. Do NOT modify the epic files themselves.

### 6. Return output contract

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
- NEVER return `passed` with any violation in the report. `passed` means zero violations across every epic.
- ALWAYS use the schema file as the source of truth for mandatory fields — if the schema adds or removes fields, the validator respects them without code changes.
- ALWAYS run the traceability check against the current domain-taxonomy catalog — the KB can evolve and epic generation may lag; the validator catches the drift.

## Version

| Field | Value |
|-------|-------|
| Version | 0.1.0 |
| Category | product-planning |
| Created | 2026-04-14 |
| Related | `core/components/skills/generate-intent-epics`, `core/components/memory/standards/intent-epic-schema.yaml` |
