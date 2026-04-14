---
name: generate-intent-epics
description: Instantiate the intent-epic template once per enriched capability and write one epic YAML file per capability to the product epics directory. Every mandatory field is populated from the enriched capability data plus the project profile plus the market brief — no empty sections reach the validator.
user-invocable: false
model: sonnet
allowed-tools: Read, Write, Glob
---

# generate-intent-epics

Model-invocable skill for producing one intent epic YAML file per enriched capability. Called by `product-keeper` during `specify-product` Stage 5.

## Purpose

Turn structured capability data into structured intent epics. The `intent-epic-schema.yaml` defines the contract: every epic carries identity, WHAT (problem/intent), boundaries (appetite/scope/anti-goals), outcomes (success/failure scenarios), quantified constraints, business rules, validation (hypothesis/assumptions/dependencies), and KB traceability.

This skill instantiates the template once per capability, filling every field. It does NOT validate — `validate-intent-epics` is the next skill in the chain. But it produces output that CAN pass validation, by being careful about quantification, scenario counts, and traceability.

## Input

Receive from product-keeper:
- `enriched_capabilities_path` (path, required) — output of enrich-capabilities
- `project_profile_path` (path, required) — for appetite, audience, constraints
- `market_brief_path` (path, required) — for problem_statement context
- `ltm_intent_epic_schema_path` (path, required) — `core/components/memory/standards/intent-epic-schema.yaml`
- `epics_output_dir` (string, required) — typically `.meridian/product/product/epics/`

## Process

### 1. Load the schema

Read `intent-epic-schema.yaml` to understand the required field structure. Keep it in context for the whole run.

### 2. Load enriched capabilities

Parse `enriched-capabilities.yaml`. Iterate over each enriched record.

### 3. For each enriched capability, instantiate the template

Compute the epic fields:

**Identity:**
- `id`: `EPIC-{domain}-{capability-short-slug}-001`
- `domain`: from enriched record
- `capability`: feature ID from enriched record

**WHAT:**
- `problem_statement`: pull market-brief competitive gap + profile-specific constraint. Must be SPECIFIC. If the KB Failure Scenarios have an impact line that's concrete, weave it in. Example: "B2B healthcare customers average 14 days to first value because onboarding requires 23 manual configuration steps (source: market brief, competitive landscape)."
- `intent`: one-sentence measurable end-state. Derived from Success Criteria — pick the highest-impact success metric and phrase it as a target. Example: "Reduce B2B onboarding time from 14 days to 5 days."

**BOUNDARIES:**
- `appetite`: from project profile's appetite or derived from timeline + capability count. Typical values: "2 weeks", "6 weeks".
- `in_scope`: enumerate the capability at the selected depth level. List 2-5 items.
- `anti_goals`: enumerate what's explicitly NOT in scope — features that belong to higher depth levels than selected, or capabilities that overlap but are out of this epic.

**OUTCOMES:**
- `success_scenarios`: map the enriched Success Criteria to scenario entries. Each must have a `scenario` and `evidence` sub-field. At least 2 entries.
- `failure_scenarios`: pass through from enriched Failure Scenarios. Each must have `scenario`, `impact`, `mitigation`. At least 2 entries.

**CONSTRAINTS:**
- `performance`: pull from Success Criteria if a performance target exists, OR from the profile's NFR-2 level. MUST contain a number + unit.
- `security`: pull from Business Rules if they name a standard, OR from profile's security_level mapping (e.g., critical → "OWASP ASVS Level 3, NIST 800-63B AAL3, argon2id"). MUST reference a named standard.
- `accessibility`: from profile's QP-6 mapping (`WCAG 2.1 AA` for level 3, `WCAG 2.1 AAA` for level 4+). MUST reference a WCAG level.
- `compliance`: list from profile.compliance. MAY be empty if the profile has no compliance entries.

**BUSINESS RULES:**
- Pass through `business_rules_applied` from the enriched record.

**VALIDATION:**
- `hypothesis`: formatted as "We believe that {action} for {persona} will result in {outcome}. We will know this is true when {measurable signal}." Derive {action} from `intent`, {persona} from primary success scenario, {outcome} from highest-impact success metric, {signal} from the same metric's threshold.
- `assumptions_requiring_validation`: enumerate at least 1. Usually pulled from `Signals` section of the KB or inferred from the profile.
- `dependencies`: cross-team, external vendor, or data dependencies. Can be empty list.

**KB TRACEABILITY:**
- `kb_source.capability`: feature ID (same as `capability` top-level)
- `kb_source.rules_applied`: list the specific business rule IDs or names that were applied
- `kb_source.experiential_warnings`: pass through from enriched record

### 4. Write one file per epic

Write each epic YAML to `{epics_output_dir}/epic-{domain}-{capability-slug}-001.yaml`. Ensure the parent directory exists.

### 5. Return the output contract

```yaml
epics:
  output_dir: <path>
  file_count: <int>  # equals enriched_count
  files:
    - path: <absolute path>
      capability: <feature ID>
  quantification_coverage:
    performance_quantified: <int>  # count with a number+unit
    security_named_standard: <int>
    accessibility_wcag: <int>
    compliance_entries: <int>
```

## Constraints

- NEVER leave a mandatory field empty, null, or `TBD` / `to be determined`. If the required data is not derivable, return structured failure for that capability and skip writing the epic.
- NEVER invent a capability. Every epic maps 1:1 to an enriched capability.
- NEVER write vague constraint values ("fast", "secure"). `performance` must have a number; `security` must name a standard; `accessibility` must reference WCAG.
- NEVER produce fewer than 2 entries in either success_scenarios or failure_scenarios.
- NEVER skip `kb_source`. Every epic carries its provenance.
- ALWAYS write one file per epic — the epics directory gets one file per capability.
- ALWAYS use the exact top-level keys from the schema — no extras, no renames.

## Version

| Field | Value |
|-------|-------|
| Version | 0.1.0 |
| Category | product-planning |
| Created | 2026-04-14 |
| Related | `core/components/skills/enrich-capabilities`, `core/components/skills/validate-intent-epics`, `core/components/memory/standards/intent-epic-schema.yaml` |
