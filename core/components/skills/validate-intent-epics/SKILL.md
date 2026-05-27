---
name: validate-intent-epics
description: Blocking validator for the intent epics directory. Walks every epic YAML, asserts the four-section ICE schema is honored, rejects banned legacy top-level keys, checks the tenet (epics are written for humans to read) via opening-sentence and length heuristics, enforces binary-testable success scenarios, and verifies connections and provenance. Returns structured failure with per-epic error details on any violation.
user-invocable: false
model: haiku
allowed-tools: Read, Write, Glob, Grep, Bash
---

# validate-intent-epics

> **TENET (non-negotiable): Epics are written for humans to read.** This
> validator enforces the tenet mechanically where it can — opening-sentence
> lead, word-count caps, taste-word blacklist, jargon-density and
> acronym-expansion heuristics. The reviewer is the hard gate for everything
> a regex cannot reach. See `rules/epics.md` Tenet section.

Model-invocable BLOCKING validator for intent epic files. Called by `product-keeper` during `specify` Stage 5 after generate-intent-epics runs.

## Purpose

Enforce the `intent-epic-schema.yaml` contract — the four-section ICE shape
(identity, then `intent`, `expectations`, `connections`, `provenance`).
"Sounds good, means nothing" shallow outputs are structurally impossible
because this skill refuses to pass incomplete, jargon-heavy, or schema-violating
epics. On any blocking violation, returns a structured failure with field-level
error messages. The calling play halts and cycles back to generate-intent-epics
with the error context.

## Input

Receive from product-keeper:
- `epics_dir` (path, required) — typically `.garura/product/scope/epics/`
- `ltm_intent_epic_schema_path` (path, required) — `core/components/memory/standards/schemas/intent-epic.yaml`
- `ltm_rules_epics_path` (path, required) — `core/components/memory/standards/rules/epics.md`
- `ltm_rules_features_path` (path, required) — `core/components/memory/standards/rules/features.md`
- `ltm_rules_scenarios_path` (path, required) — `core/components/memory/standards/rules/scenarios.md`
- `ltm_domain_taxonomy_path` (path, required) — for `provenance.kb_source` traceability check (LTM)
- `stm_research_dir` (path, optional) — for `provenance.kb_source` traceability check (STM) when epics carry `provenance.kb_source.provisional: true`
- `output_path` (string, required) — validation result YAML, typically `.garura/product/scope/validation-intent-epics.yaml`

## Process

### 1. Load schema, rules, and catalog

- Read `intent-epic-schema.yaml` for the mandatory-field list across the four sections.
- Read `rules/epics.md` — including the TENET at the top — `rules/features.md`, and `rules/scenarios.md`. These are the authoritative rule source.
- Glob `{ltm_domain_taxonomy_path}/*.md` (excluding `_index.md` and underscore-prefixed files) and extract every feature ID present. Hold as an LTM feature set.
- If `stm_research_dir` is provided, glob `{stm_research_dir}/*.md` and extract every feature ID. Hold as an STM feature set. Epics with `provenance.kb_source.provisional: true` check against this set.

### 2. Enumerate epic files

Glob `{epics_dir}/*.yaml`. For each file, load as YAML. Hold the full set in memory — cross-epic checks (dependency cycle, foundation flag, bidirectional `before_chain`/`after` consistency) need the whole batch.

### 3. Per-epic structural validation

For every epic, run these checks in order and collect violations per field.

#### 3a. Section presence and order (Rule 4, blocking)

The file must contain identity at the top followed by exactly these four sections, in this order:

1. `intent`
2. `expectations`
3. `connections`
4. `provenance`

Any section missing, mis-named, out of order, or any extra top-level key not in `{id, domain, capability, intent, expectations, connections, provenance}` is a blocking violation `schema_section_violation` with a `detail` naming the offending key or order error.

#### 3b. Banned legacy top-level keys (Rule 4, blocking)

Reject the epic with `unknown_field` violation if ANY of these legacy top-level keys appears:

- `intents` (plural list — replaced by `intent.goal` singular string)
- `failure_conditions` (now `intent.failure_scenario`)
- `in_scope`
- `anti_goals`
- `must_not_break`
- `cross_cutting_justification`
- `problem_statement`
- `hypothesis`
- `assumptions_requiring_validation`
- top-level `appetite`
- top-level `business_rules`
- top-level `constraints` as an NFR struct
- top-level `depends_on`
- top-level `dependencies`
- top-level `foundation_investment`
- top-level `uses_mocks`
- top-level `demock_epic_ref`
- top-level `kb_source`
- top-level `expectation` (singular — now plural `expectations` as a section)

Each occurrence is one `unknown_field` violation with the key name in `detail`.

#### 3c. Identity fields

- `id` — string, present, matches `EPIC-{domain}-{slug}-{seq}` shape.
- `domain` — string, exactly one value (Rule 2). Multi-value is `multi_module_scope`.
- `capability` — string, present.

#### 3d. Section 1 — `intent:`

- `intent.goal` — string, present, non-empty.
  - Word count ≤ 30. Over → `goal_too_long`. (Tenet, blocking.)
  - Opening sentence must NOT start with a file path (regex `^[\w./-]+\.(yaml|md|py|ts|tsx|js|jsx|go|rs|java|sh)`), a schema field name (`intent\.`, `expectations\.`, `connections\.`, `provenance\.`), or an unexpanded acronym (`^[A-Z]{3,}\b` with no expansion in parentheses). Match → `goal_lead_violation`. (Tenet, blocking.)
  - Subject must be a named persona or canonical role (`user`, `admin`, `developer`, `operator`, `reviewer`, or a named persona from KB). Subsystem disallow-list: {analyst, improver, judge, scorer, orchestrator, dispatcher, worker, pipeline, parser, validator, resolver, matcher, compiler, transformer, agent, skill, plugin, adapter, catalog, store, vault, ledger, index, registry, database, schema, system, service, module, handler, endpoint, queue, cache, worker pool, backend, frontend, infrastructure}. Subsystem subject → `subsystem_actor` (Rule 1, blocking).
- `intent.constraints` — list, length ≥ 1; every entry is a plain string (no nested dicts). Empty list when the goal has zero NFRs is allowed only when no quantification source exists in profile or KB.
  - Any numeric value without an inline unit (e.g., bare `500` instead of `500ms`) → `unsourced_constraint` on that entry. (features.md Rule 2.)
- `intent.failure_scenario` — list, length ≥ 2; every entry is a plain string. Fewer than 2 → `scenario_count_below_min` (Rule 4, blocking).

#### 3e. Section 2 — `expectations:`

- `expectations.vetted` present with `status` field.
- `expectations.vetted.status` ∈ {`not_generated`, `pending`, `approved`}. Must equal `approved` for the epic to pass validation. `pending` or `not_generated` → `expectation_not_vetted` (Rule 4, blocking).
- `expectations.success_scenario` — list, length ≥ 1 when `status != not_generated`. Every entry has `id`, `persona`, `given`, `then`, `measure`.
  - Every `then` and every `measure` is binary-testable. Banned words in EITHER field (case-insensitive whole-word): `should`, `smooth`, `intuitive`, `seamless`, `better`, `user-friendly`, `feels`. Match → `should_language` on that entry (Rule 5, blocking).
  - Word count of `then` ≤ 30. Over → `then_too_long` (tenet, blocking).
  - `then` must describe a user-observable outcome. Grep the terminal verb for the internal-system blacklist `{produce, return, emit, write, persist, compute, normalize, parse, validate}` when used as the TERMINAL verb without an accompanying user observation. Match → `non_observable_outcome` (Rule 1, blocking).
- `expectations.recovery` — list. EXACTLY one entry per `intent.failure_scenario` entry — no more, no fewer. Mismatch → `recovery_pairing_violation` (Rule 4, blocking).
  - Every recovery entry has `id`, `for_failure_scenario`, `trigger`, `direction`, `handoff`, `derivable_at_l4`.
  - `for_failure_scenario` must be a verbatim string match against an entry in `intent.failure_scenario`. Mismatch → `recovery_pairing_violation`.
  - `handoff` ∈ {`autonomous`, `human`}. `derivable_at_l4 == (handoff == "autonomous")`.

#### 3f. Section 3 — `connections:`

- `connections.before_chain.intents` — list (may be empty).
- `connections.after.intents` — list (may be empty).
- `connections.peers.intents` — list (may be empty).
- `connections.dependency_check` — string. Non-empty REQUIRED whenever `before_chain.intents[]` has at least one entry (Rule 6, blocking → `missing_dependency_check`). When `before_chain.intents[]` is empty, the check string may state "None — no dependencies" or equivalent but the key must be present.

#### 3g. Section 4 — `provenance:`

- `provenance.source` is a nested object with:
  - `kind` ∈ {`brief_explicit`, `brief_inferred`, `rule_derived`, `research_supplemental`, `profile_default`, `assumption`}.
  - `quote` — non-empty string.
  - `confidence` ∈ {`high`, `medium`, `low`}.
  - Flat-shape relics (`provenance.source` as a string sibling of `provenance.source_quote` / `provenance.confidence`) → `provenance_shape_violation` (blocking).
- `provenance.source.kind == "assumption"` → `unconfirmed_inference` (Rule from `rules/features.md` Rule 8; blocking unless `quote == "needs_user_grounding"`).
- `provenance.appetite` — string matching `/\d+\s*(week|day|month)s?/i`.
- `provenance.business_rules` — list, length ≥ 1; every entry is a plain string.
- `provenance.kb_source.capability` — must equal the top-level `capability`. Mismatch → `kb_source_mismatch`.
- `provenance.kb_source.capability` must resolve to a real feature ID in either the LTM domain-taxonomy set OR the STM `kb-research/{domain}.md` set when `provenance.kb_source.provisional: true`. Dangling → `dangling_kb_source`.
- `provenance.kb_source.rules_applied` — list (may be empty).
- `provenance.kb_source.experiential_warnings` — list (may be empty).
- `provenance.uses_mocks` — boolean.
- `provenance.demock_epic_ref` — REQUIRED non-empty string when `uses_mocks == true`; that id MUST resolve to another epic in the batch AND MUST appear in this epic's `connections.after.intents[]`. Missing or unresolved → `unreplaced_mock` (Rule 3, blocking).
- `provenance.foundation_investment` — boolean. Cross-checked in Step 4.

### 3h. Placeholder detection

Scan every string value in the epic. Any occurrence of `TBD`, `to be determined`, `unclear`, `???`, `to do`, or a lone `?` at the end of a field is a `placeholder_value` violation (blocking).

### 3i. Tenet — jargon-density and acronym-expansion heuristics (best-effort, WARNINGS not blockers)

For every string in `intent.goal`, `intent.constraints[]`, `intent.failure_scenario[]`, every `expectations.success_scenario[].{then,measure}`, every `expectations.recovery[].direction`, and every `provenance.business_rules[]`:

- **Jargon-density heuristic.** Count tokens matching snake_case_ids, CamelCase identifiers, dotted-paths (`foo.bar.baz`), or backtick-quoted code spans. When the ratio of such tokens to total tokens exceeds 0.20 in any single string, emit warning `jargon_density_high` on that field. Warning, not blocker.
- **Acronym-expansion heuristic.** For every all-caps token of length ≥ 3 (e.g., `JWT`, `SLA`, `OAuth2`), check whether the same string contains a parenthesized expansion. If not, emit warning `acronym_unexpanded` on that field. Warning, not blocker. Allow-list of widely-known acronyms that do not require expansion: `URL`, `HTTP`, `HTTPS`, `API`, `JSON`, `YAML`, `XML`, `CSV`, `PDF`, `UI`, `UX`, `OS`, `CPU`, `GPU`, `RAM`, `SQL`, `WCAG`, `OWASP`, `NIST`, `GDPR`, `HIPAA`, `SOC2`, `TLS`, `SSL`, `AES`.

Warnings appear in the result's `warnings:` map and do not flip overall `status` to `failed` on their own.

### 4. Cross-epic checks

These checks need the full epic batch. Run them after per-epic validation.

#### 4a. Bidirectional `before_chain` / `after` consistency

For every epic A with `connections.before_chain.intents` containing epic B's id, epic B must list A in `connections.after.intents`. Missing → warning `bidirectional_drift` on B (non-blocking; surface for reviewer cleanup).

#### 4b. Dependency cycle (Rule 6)

- Build the directed graph of `connections.before_chain.intents[]` across all epics in the batch.
- Run a topological sort. If sort fails (cycle detected), emit `dependency_cycle` violation on every epic in the cycle with the cycle path in `detail`. Blocking.
- Every `before_chain.intents[]` id must resolve to another epic in the batch. Dangling → `dangling_dependency` (blocking).

#### 4c. Foundation investment (Rule 7)

- Count incoming `before_chain.intents[]` references per epic across the batch.
- For any epic with incoming count ≥ 2 AND `provenance.foundation_investment: false` (or missing), emit `missing_foundation_flag` violation (blocking).
- For any epic with `provenance.foundation_investment: true` AND incoming count < 2, emit `overstated_foundation` warning (non-blocking).

#### 4d. Mock pairing (Rule 3)

For every epic where `provenance.uses_mocks == true`, the `provenance.demock_epic_ref` id must (a) resolve to another epic in the batch AND (b) appear in this epic's `connections.after.intents[]`. Either missing → `unreplaced_mock` (blocking).

### 5. Build validation result

```yaml
status: passed | failed
summary:
  total_epics: <int>
  passed_epics: <int>
  failed_epics: <int>
  total_violations: <int>
  by_category:
    # Schema and structural (Rule 4)
    schema_section_violation: <int>
    unknown_field: <int>             # banned legacy top-level keys present
    missing_field: <int>
    placeholder_value: <int>
    provenance_shape_violation: <int>
    # Intent block (Rule 1, tenet)
    goal_too_long: <int>
    goal_lead_violation: <int>
    subsystem_actor: <int>
    scenario_count_below_min: <int>   # intent.failure_scenario < 2
    unsourced_constraint: <int>       # numeric without unit inline
    # Expectations block (Rules 4, 5, 1)
    expectation_not_vetted: <int>
    recovery_pairing_violation: <int>
    should_language: <int>
    non_observable_outcome: <int>
    then_too_long: <int>
    # Connections block (Rule 6)
    missing_dependency_check: <int>
    dependency_cycle: <int>
    dangling_dependency: <int>
    # Provenance block (features.md Rule 8, epics.md Rules 3, 7)
    unconfirmed_inference: <int>
    kb_source_mismatch: <int>
    dangling_kb_source: <int>
    unreplaced_mock: <int>
    missing_foundation_flag: <int>
    # Cross-epic
    multi_module_scope: <int>
  warnings:
    overstated_foundation: <int>
    bidirectional_drift: <int>
    jargon_density_high: <int>       # tenet best-effort, non-blocking
    acronym_unexpanded: <int>        # tenet best-effort, non-blocking
epics:
  - id: EPIC-user-login-001
    file: <path>
    status: passed | failed
    violations:
      - field: intent.goal
        category: goal_too_long
        detail: "intent.goal is 47 words; max is 30."
      - field: expectations.success_scenario[0].then
        category: should_language
        detail: "Contains blacklisted word 'smooth' — replace with observable outcome."
      - field: expectations.vetted.status
        category: expectation_not_vetted
        detail: "status is 'pending' — human must approve at the Tether checkpoint before this epic passes validation."
      - field: connections.before_chain
        category: dependency_cycle
        detail: "Cycle: EPIC-A -> EPIC-B -> EPIC-A."
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
  total_warnings: <int>
```

On `status: passed`, the calling agent proceeds to Stage 6 (derive-quality-profile-from-epics).
On `status: failed`, the calling agent returns a structured failure to the play, which cycles back to generate-intent-epics with the validation result as fix context.

## Constraints

- NEVER modify epic files. Read-only on epics.
- NEVER "fix" or "normalize" violations. Report them, let generate-intent-epics regenerate on cycle-back.
- NEVER skip a check. All checks run on every epic, even after the first failure — the full list is needed for fix context.
- NEVER return `passed` with any blocking violation in the report. `passed` means zero blocking violations across every epic; warnings (`overstated_foundation`, `bidirectional_drift`, `jargon_density_high`, `acronym_unexpanded`) do not block.
- NEVER accept any banned legacy top-level key. Every entry in the banned list (Step 3b) is a hard reject.
- NEVER skip the cross-epic checks (Step 4). Per-epic checks alone miss dependency cycles and foundation-flag errors.
- ALWAYS load the rules files (`rules/epics.md` including the TENET, `rules/features.md`, `rules/scenarios.md`) as the authoritative rule source. This skill's check list is derivative.
- ALWAYS use the schema file as the source of truth for mandatory fields. If the schema adds or removes fields, the validator respects them.
- ALWAYS run the traceability check against BOTH the LTM domain-taxonomy catalog AND the STM research dir (when provided).

## Version

| Field | Value |
|-------|-------|
| Version | 0.2.0 |
| Category | product-planning |
| Created | 2026-04-14 |
| Updated | 2026-05-28 — migrated to four-section ICE schema, banned-legacy-key rejection, tenet heuristics (#397) |
| Related | `core/components/skills/generate-intent-epics`, `core/components/memory/standards/schemas/intent-epic.yaml`, `core/components/memory/standards/rules/epics.md` |
