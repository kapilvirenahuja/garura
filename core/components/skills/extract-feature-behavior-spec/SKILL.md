---
name: extract-feature-behavior-spec
description: "Extract a structured behavior-spec.yaml for a single feature from its file_surface. Reads the feature's tests FIRST (tests encode intent more cleanly than source), then reads source to validate and extend. Dispatches tech-aware extraction via the synthesized temp skill matching each file's stack. Surfaces test-code drift as ambiguities. Every rule, scenario, data contract, and integration carries cited_locations at file:line precision. Called by tech-architect once per feature during /decode."
user-invocable: false
model: opus
allowed-tools: Read, Write, Grep, Glob, Skill
---

# extract-feature-behavior-spec

Owned by the `tech-architect` agent. Produces one `behaviors/{feature-id}.yaml` per feature in the /decode target set.

## Purpose

Per /decode C4a, every feature in scope receives a structured behavior-spec covering business rules, scenarios, data contracts, integration behaviors, edge cases, ambiguities, knowledge gaps, and test coverage. This skill is the extraction primitive. It reads the feature's file surface, delegates tech-specific reading to the runtime-synthesized temp skills (C29, C33), and produces a single YAML spec that meets C4a's shape requirements with C5/C6/C7/C8/C9 discipline intact.

## Input

Receive via JSON contract from tech-architect.

- `feature_id` (string, required) — e.g., `MEM-F001-signup`.
- `feature_ref` (object, required) — the entry from features.yaml (id, name, description, domain, capability, status).
- `file_surface` (list[path], required) — source + test files implementing this feature, as resolved by the feature-to-file mapping step. Paths absolute, rooted at codebase_root.
- `test_surface_path` (path, required) — feature-scoped test-surface.yaml (from map-test-surface, filtered to this feature).
- `stacks_detected_path` (path, required) — `{stm_base}/{issue}/evidence/decode/stacks-detected.yaml`.
- `temp_skills_dir` (path, required) — `{stm_base}/{issue}/evidence/decode/temp-skills/` (for dispatching tech-aware extraction).
- `codebase_root` (path, required).
- `output_path` (path, required) — `{stm_base}/{issue}/evidence/decode/proposals/scope/behaviors/{feature-id}.yaml`.
- `ltm_context` (object, required) — standard Meridian LTM resolution block (product_base, core_base, query_domains).

## Process

### 1. Validate inputs

- Confirm every file in `file_surface` exists under `codebase_root` and is readable.
- Confirm `test_surface_path` and `stacks_detected_path` parse.
- Confirm `output_path` parent directory exists.

### 2. Build stack-to-file map

For each file in `file_surface`, match its path against the stack-to-path patterns in `stacks-detected.yaml` (per C33). Produce a `dispatch_plan`:

```yaml
- file: "ghost/core/app.js"
  stack_id: "node-express"
  temp_skill: "temp-skills/extract-from-node-express/SKILL.md"
- file: "apps/admin/src/components/MembersList.tsx"
  stack_id: "react-18"
  temp_skill: "temp-skills/extract-from-react-18/SKILL.md"
```

Files with no matching stack become `unmapped_stack` entries in the final spec's `knowledge_gaps[]` — they are cited but not deeply extracted.

### 3. Tests-first reading (C7)

Read every test file in the file_surface BEFORE reading any source. Tests encode intent more cleanly than source, and source-first bias tends to promote implementation details into specs.

For every test file:
- Parse test blocks (describe/it, test/expect, class-level test methods per framework).
- Extract each test into a draft scenario with Given/When/Then structure derived from setup/action/assert.
- Record cited_locations pointing to the test file at the test block's line range.
- Mark `source: test_extracted`.

Drafts are held in memory (not yet written to the spec) pending source validation in step 4.

### 4. Source reading via tech-aware dispatch

For every non-test file in file_surface, dispatch the matching temp skill from `dispatch_plan`. The temp skill knows its stack's patterns — where business rules live, what controller/service/middleware looks like, how data models are declared, where external integrations are called.

Each temp skill dispatch returns:
- Rule candidates (conditionals, guards, invariants) with cited_locations.
- Data contract candidates (entities, fields, constraints).
- Integration behavior candidates (external boundaries, retry/idempotency/timeout patterns).
- Edge case candidates (error paths, fallbacks).

Gather all candidates.

### 5. Cross-check tests against source

For every draft scenario from step 3:
- Locate the cited production code the scenario exercises (walk through assertions → find the subject under test).
- Compare what the test asserts vs what the source does at the cited path.
- **Agree** → promote the scenario to `scenarios[]` with `source: test_extracted` and `cited_locations` spanning both test and source.
- **Disagree** → record an `ambiguities[]` entry with both citations and both excerpts. Per C9, NEVER silently pick one side. Lower overall_confidence.

For every rule candidate from step 4 that has no matching test scenario, emit a `scenarios[]` entry with `source: code_extracted` and mark the rule as test-gap in `test_coverage.unverified_behaviors[]`.

### 6. Populate cross-stream placeholders

- `participates_in_flows[]` — initially empty. Resolved at the proposals-aggregation step by joining flow-specs' `participating_features[]`.
- `governed_by_aspects[]` — initially empty. Resolved at the proposals-aggregation step by joining aspect-specs' `applies_to.features[]`.

These fields are populated at aggregation, not here; this skill emits them as empty lists with a note in `knowledge_gaps[]` if the aggregator finds zero cross-links later.

### 7. Compute overall_confidence

Heuristic:
- `high` — tests present, all scenarios agree with source, citation_integrity will pass (sanity-check against current source via spot reads), no ambiguities.
- `medium` — tests present, zero or one minor ambiguity, some code-only scenarios.
- `low` — no tests OR ≥ 2 ambiguities OR significant unmapped_stack files in file_surface.

### 8. Assemble behavior-spec.yaml

Emit at `output_path` conforming to C4a:

```yaml
meta:
  source_type: "extracted_from_code"
  confidence: "high | medium | low"
  evidence:
    - "file_surface: {count} files, {loc} LOC"
    - "test_surface: {count} tests from {test_surface_path}"
    - "stacks: {stack_ids from stacks-detected}"
  learning_category: "product"
  sub_category: null
  tier: 2 | 3   # set by aggregator
  feature_ref: "{feature_id}"
  file_surface: ["..."]
  participates_in_flows: []
  governed_by_aspects: []
business_rules:
  - id: "BR-{feature_id}-001"
    statement: "..."
    cited_locations: [...]
scenarios:
  - id: "SC-{feature_id}-001"
    given: "..."
    when: "..."
    then: "..."
    source: "test_extracted | code_extracted | both"
    cited_locations: [...]
    generated_tests_ref: []   # filled by test-generation skills later
data_contracts:
  - entity: "..."
    fields: [...]
    constraints: [...]
    cited_locations: [...]
integration_behaviors:
  - boundary: "..."
    direction: "inbound | outbound"
    contract: {...}
    cited_locations: [...]
edge_cases:
  - trigger: "..."
    behavior: "..."
    cited_locations: [...]
ambiguities: [...]
knowledge_gaps: [...]
test_coverage:
  verified_behaviors: ["..."]
  unverified_behaviors: ["..."]
  coverage_ratio: 0.0..1.0
```

### 9. Return contract

```yaml
feature_id: "{feature_id}"
spec_path: "{output_path}"
overall_confidence: "high | medium | low"
rules_count: <int>
scenarios_count: <int>
ambiguity_count: <int>
knowledge_gap_count: <int>
file_surface_loc: <int>
status: "success"
```

## Output

Primary artifact: `behaviors/{feature-id}.yaml` at `output_path`.

## Failure Modes

```yaml
status: failure
what_failed: "file_surface_missing | temp_skill_missing | stack_not_mapped_for_all_files | citation_integrity_warning | extraction_budget_exhausted"
detail: "<specific>"
evidence: { offending_path: "<path>", missing_dispatch_for: [...] }
```

`extraction_budget_exhausted` is the token/time overrun per /decode C12. The skill returns this failure rather than emit a truncated spec; /decode marks the feature deferred.

## Notes

- The framework-agnostic prose discipline (C6) is enforced during assembly: SDK, framework, and library names appear ONLY inside `cited_locations.excerpt`. Rule statements, scenario narratives, and contract descriptions use neutral prose. A prose field failing validate-abstraction-layer is a spec-level failure — /decode calls that validator before the spec is finalized.
- Tests-first reading is the order, not the weight. Source remains the ground truth for behavior; tests are a window into intent. When they disagree, C9 requires surfacing both.
- The temp skill dispatch per file keeps this skill stack-agnostic in its structure and stack-specific in its semantics.
- The skill produces NO generated test files. Test generation is a separate skill (generate-contract-tests, generate-flow-tests, generate-unit-pure-tests) that reads this spec's scenarios as input.
