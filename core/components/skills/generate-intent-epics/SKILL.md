---
name: generate-intent-epics
description: Instantiate the intent-epic template once per enriched capability and write one epic YAML file per capability to the product epics directory. Every mandatory field is populated from the enriched capability data plus the project profile plus the market brief — no empty sections reach the validator.
user-invocable: false
model: sonnet
allowed-tools: Read, Write, Glob
---

# generate-intent-epics

> **Defect 23 — Decision Surfacing Discipline (DSD):** This skill emits a `decision-manifest.yaml` alongside its primary artifact. Every inferred decision produced during execution is recorded in the manifest with tier, grounding source, recommendation, and alternatives. The orchestrator drives the tiered surfacing flow after this skill completes.

Model-invocable skill for producing one intent epic YAML file per enriched capability. Called by `product-keeper` during `specify` Stage 5.

## Purpose

Turn structured capability data into structured intent epics. The `intent-epic-schema.yaml` defines the contract: every epic carries identity, WHAT (problem/intent), boundaries (appetite/scope/anti-goals), outcomes (success/failure scenarios), quantified constraints, business rules, validation (hypothesis/assumptions/dependencies), and KB traceability.

This skill instantiates the template once per capability, filling every field. It does NOT validate — `validate-intent-epics` is the next skill in the chain. But it produces output that CAN pass validation, by being careful about quantification, scenario counts, and traceability.

## Input

Receive from product-keeper:
- `enriched_capabilities_path` (path, required) — output of enrich-capabilities
- `project_profile_path` (path, required) — for appetite, audience, constraints
- `market_brief_path` (path, required) — for problem_statement context
- `ltm_intent_epic_schema_path` (path, required) — `core/components/memory/standards/schemas/intent-epic.yaml`
- `ltm_rules_epics_path` (path, required) — `core/components/memory/standards/rules/epics.md`
- `ltm_rules_features_path` (path, required) — `core/components/memory/standards/rules/features.md`
- `ltm_rules_scenarios_path` (path, required) — `core/components/memory/standards/rules/scenarios.md`
- `epics_output_dir` (string, required) — typically `.garura/product/scope/epics/`
- `decision_manifest_path` (path, required) — path for the `decision-manifest.yaml` output, written alongside the primary artifacts (e.g., `.garura/product/scope/decision-manifest-generate-intent-epics.yaml`). Exact path is passed by the calling agent.

## Process

### 1. Load the schema and the rule files

Read `intent-epic-schema.yaml` to understand the required field structure.

Read `rules/epics.md`, `rules/features.md`, and `rules/scenarios.md`. These are the authoritative rules — every field populated below must respect them. Specifically:

- `epics.md` Rule 1 — every entry in `intents[]` must name a user and observable outcome, not a layer; each entry is independently validated
- `epics.md` Rule 2 — `domain` is exactly one value; if the epic crosses boundaries, populate `cross_cutting_justification`
- `epics.md` Rule 4 — populate `must_not_break` (never empty; use `"None — foundational epic"` when appropriate)
- `epics.md` Rule 6 — populate `depends_on` with other epic IDs only; never produce circular deps
- `epics.md` Rule 7 — set `foundation_investment: true` when this epic is shared infrastructure that ≥2 other epics need
- `features.md` Rule 2 — quantify every constraints sub-field
- `features.md` Rule 3 — hypothesis format with all three phrases
- `scenarios.md` Rule 2 — success scenarios use binary-testable language (no "should" / "smooth" / "intuitive")

Keep all four files in context for the whole run.

### 2. Load enriched capabilities

Parse `enriched-capabilities.yaml`. Iterate over each enriched record.

### 2b. Merge components into parent verticals (rules/epics.md Rule 1)

Before instantiating epic templates, pre-process the enriched capability list:

1. Walk every enriched record and check its `type` tag (from configure-capabilities Step 1c).
2. For each capability tagged `component`:
   - Read its `rolls_up_into` field to find the parent vertical's feature id.
   - Find the parent in the enriched list. If missing, return structured failure `orphan_component`.
   - Merge the component's content into the parent's buckets:
     - Component's `in_scope` items → appended to parent's `in_scope` with a prefix like `"[component: {component_id}] {original item}"` so the reviewer can still see provenance.
     - Component's `business_rules_applied` → appended to parent's rules (dedup on equal rule text).
     - Component's `failure_conditions` → appended to parent's failure_conditions list (dedup on equal string).
     - Component's `experiential_warnings` → appended to parent's warnings.
   - Mark the component as `merged_into: {parent_id}`. Do NOT write it as a standalone epic.
3. At the end of the merge pass, the list of epic-eligible records is ONLY the `vertical` capabilities. Each component has been absorbed into its parent vertical.

**Result of the merge:** a `vertical` epic may be large — its `in_scope` could have 15-25 items because it absorbed 3-5 components. That is correct. The epic is testable end-to-end; the components are implementation details the reviewer can walk through.

### 3. For each vertical capability, instantiate the template

Compute the epic fields:

**Identity:**
- `id`: `EPIC-{domain}-{capability-short-slug}-001`
- `domain`: from enriched record
- `capability`: feature ID from enriched record

**WHAT:**
- `problem_statement`: pull market-brief competitive gap + profile-specific constraint. Must be SPECIFIC. If the KB Failure Scenarios have an impact line that's concrete, weave it in. Example: "B2B healthcare customers average 14 days to first value because onboarding requires 23 manual configuration steps (source: market brief, competitive landscape)."
- `intents`: a YAML list of one or more intent statements. Each entry is a one-sentence measurable end-state written from a named persona's perspective. Derive entries from the enriched Success Criteria — one entry per distinct user type or major goal if warranted. At minimum one entry. Every entry must name a human actor (persona or canonical role) and describe a user-observable outcome. Example:
  ```yaml
  intents:
    - "B2B admin reduces onboarding time from 14 days to 5 days by completing guided setup in a single session"
  ```

**BOUNDARIES (rules/epics.md Rule 4):**
- `appetite`: from project profile's appetite or derived from timeline + capability count. Typical values: "2 weeks", "6 weeks".
- `in_scope`: enumerate the capability at the selected depth level. List 2-5 items.
- `anti_goals`: enumerate what's explicitly NOT in scope — features that belong to higher depth levels than selected, or capabilities that overlap but are out of this epic. At least 1 entry.
- `must_not_break`: enumerate existing capabilities this epic cannot regress. Use `"None — foundational epic"` as the single entry for foundation epics with no predecessors. Never leave empty.
- `cross_cutting_justification`: leave empty UNLESS the epic legitimately spans domains AND the product scope explicitly names the cross-cutting capability. When populated, name the scope item, the reason single-module does not apply, and how ownership is delineated.

**OUTCOMES (rules/scenarios.md Rules 1-5):**
- `failure_conditions`: a plain list of strings — each string is a concise cause statement derived from an enriched Failure Scenario's `scenario` field. Do NOT carry `impact` or `mitigation` fields here; those belong in the expectation block's `recovery[]` entries, which `draft-epic-expectation` will generate. At least 2 entries. Example:
  ```yaml
  failure_conditions:
    - "User loses unsaved progress when session expires mid-onboarding"
    - "Integration fails silently when downstream API is unreachable"
  ```
- Do NOT write `success_scenarios` at the top level. Success scenarios are part of the expectation block and are generated by `draft-epic-expectation`.

**EXPECTATION STUB (written atomically with the intent block):**

After writing all intent-block fields, append a stub `expectation:` block at the bottom of the file:

```yaml
expectation:
  vetted:
    status: not_generated
    approved_by: null
    approved_at: null
  success_scenarios: []
  recovery: []
```

This stub signals to downstream readers that the expectation block exists but has not yet been generated by `draft-epic-expectation`. `draft-epic-expectation` will read this file, populate `success_scenarios` and `recovery`, and write back atomically (read-merge-write pattern). Do NOT populate `success_scenarios` or `recovery` here — leave them as empty lists.

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

**EPIC DEPENDENCIES (rules/epics.md Rules 6-7):**
- `depends_on`: list of other EPIC ids in the same scope that this epic requires. Use the short form `EPIC-{domain}-{capability-slug}-001`. Never reference external systems here — those go in `dependencies`. Never produce a cycle.
- `foundation_investment`: set `true` when this epic is shared infrastructure that ≥2 other epics depend on (e.g., auth, database, CI pipeline). Default `false`. When you set this, double-check that at least 2 other epics in the same scope carry this epic id in their `depends_on`.

**MOCK TRACKING (rules/epics.md Rule 3):**
- `uses_mocks`: set `true` when the implementation relies on mocks for phased delivery. Default `false`.
- `demock_epic_ref`: required when `uses_mocks == true`. Names the follow-up EPIC id that replaces the mocks with real integrations.

**KB TRACEABILITY:**
- `kb_source.capability`: feature ID (same as `capability` top-level)
- `kb_source.rules_applied`: list the specific business rule IDs or names that were applied
- `kb_source.experiential_warnings`: pass through from enriched record

### 3b. Emit decision manifest

Before writing any epic file, write `decision-manifest.yaml` to `{decision_manifest_path}`.

Record every inferred decision produced during Steps 2b and 3. Assign tier at runtime based on grounding source: **high** when the decision was a direct match against a KB rule, file, or catalog entry; **mid** when context was built via web research; **low** when neither KB nor research yielded a grounding source.

**Decisions to record** (decision_id prefix: `D-gie-`):

| decision_id | decision_type | What is being decided |
|-------------|---------------|-----------------------|
| `D-gie-001` | `problem-statement-synthesis` | Which competitive gap from the market brief + which profile-specific constraint are woven into the problem_statement; which KB Failure Scenario impact line is selected (Step 3) |
| `D-gie-002` | `intent-phrasing-metric-pick` | Which success metric is selected as the highest-impact one and how it is phrased as the measurable end-state for the `intent` field (Step 3) |
| `D-gie-003` | `appetite-computation` | Whether appetite is taken from `profile.appetite` directly or derived from timeline + capability count via the heuristic, and the computed value (Step 3) |
| `D-gie-005` | `hypothesis-template-fill` | Which persona and metric are chosen to fill the `{persona}` and `{outcome}` slots in the hypothesis template (Step 3) |
| `D-gie-006` | `component-to-parent-merge` | For each component capability, which parent vertical it merges into and which `in_scope` items, rules, and failure conditions are absorbed (Step 2b) |

Note: `D-gie-004` (success-scenario-phrasing) was removed in #390. That decision is now emitted by `draft-epic-expectation` under the `D-dee-` prefix — success scenarios are generated in the expectation block, not here.

```yaml
schema_version: "1.0"
skill: "generate-intent-epics"
generated_at: "{ISO8601}"
decisions:
  - decision_id: "D-gie-001"
    decision_type: "problem-statement-synthesis"
    tier: high | mid | low   # assign at runtime per grounding source
    grounding_source:
      kind: kb_path | web_citation | none
      ref: "{KB file path | URL | null}"
      excerpt: "{optional short quote when kind=kb_path}"
    recommendation: "{the synthesized problem statement}"
    alternatives_considered:
      - alt: "{alternative framing}"
        why_not: "{one-line dismissal reason}"
    agent_reasoning_summary: "{2-3 sentence explanation}"
    user_response: null
    user_response_detail: null
  # ... one entry per decision listed above (repeat per capability for D-gie-001 through D-gie-006, excluding D-gie-004 which moved to draft-epic-expectation)
```

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
      expectation_stub_written: true  # always true; stub block is always emitted
  quantification_coverage:
    performance_quantified: <int>  # count with a number+unit
    security_named_standard: <int>
    accessibility_wcag: <int>
    compliance_entries: <int>
decision_manifest:
  path: <written path>
  decisions_recorded: <int>
```

## Constraints

- NEVER leave a mandatory field empty, null, or `TBD` / `to be determined`. If the required data is not derivable, return structured failure for that capability and skip writing the epic.
- NEVER invent a capability. Every epic maps 1:1 to an enriched capability.
- NEVER write vague constraint values ("fast", "secure"). `performance` must have a number; `security` must name a standard; `accessibility` must reference WCAG.
- NEVER produce fewer than 2 entries in `failure_conditions`.
- NEVER write `success_scenarios` at the top level of an epic file — they belong in the expectation block, which `draft-epic-expectation` populates. Only write the empty stub (`success_scenarios: []`).
- NEVER write the removed top-level cause-list field (the old underscore-named field, discontinued in #390). Use `failure_conditions` (a list of plain cause strings).
- NEVER use a subsystem / component name as the grammatical actor of any entry in `intents[]`. Every intent entry subject must be a named persona or a canonical user role per `rules/epics.md` Rule 1. If the source capability reads as a component, it should have been merged in Step 2b, not generated as its own epic.
- NEVER write a numeric constraint without a `source_for_quantification` block per `rules/features.md` Rule 9. KB-default numbers are tagged and surfaced at the checkpoint before reaching this skill — if one arrives unsourced, halt with `unsourced_constraint`.
- NEVER write a capability whose provenance is `assumption` into the epic body. Assumptions live in `assumptions_requiring_validation` until user grounding per `rules/product.md` Rule 11.
- NEVER leave `must_not_break` empty. Use `"None — foundational epic"` when there are no predecessors.
- NEVER span domains in `in_scope` without `cross_cutting_justification` populated.
- NEVER produce circular `depends_on` relationships. If epic A depends on B and B depends on A, merge or re-scope.
- NEVER set `uses_mocks: true` without also populating `demock_epic_ref`.
- NEVER skip `kb_source`. Every epic carries its provenance.
- ALWAYS write one file per epic — the epics directory gets one file per capability.
- ALWAYS use the exact top-level keys from the schema — no extras, no renames.
- ALWAYS enforce the rules in `standards/rules/epics.md`, `rules/features.md`, and `rules/scenarios.md`. These files are the authoritative rule source; this skill's prose is derivative.
- NEVER commit an inferred decision to the primary artifact (epic YAML files) without recording it in `decision-manifest.yaml` first.
- NEVER tag a decision `tier: high` unless the `grounding_source.kind` is `kb_path` AND the referenced KB file exists.
- ALWAYS include `alternatives_considered` (≥1 entry) for every decision, even high-confidence ones.

## Version

| Field | Value |
|-------|-------|
| Version | 0.2.0 |
| Category | product-planning |
| Created | 2026-04-14 |
| Related | `core/components/skills/enrich-capabilities`, `core/components/skills/validate-intent-epics`, `core/components/memory/standards/schemas/intent-epic.yaml` |
