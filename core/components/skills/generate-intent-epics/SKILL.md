---
name: generate-intent-epics
description: Instantiate the intent-epic template once per enriched capability and write one epic YAML file per capability to the product epics directory. Every mandatory field is populated from the enriched capability data plus the project profile plus the market brief — no empty sections reach the validator.
user-invocable: false
model: sonnet
allowed-tools: Read, Write, Glob
---

# generate-intent-epics

> **TENET (non-negotiable): Epics are written for humans to read.** Every sentence
> this skill emits — `intent.goal`, every `intent.constraints` entry, every
> `intent.failure_scenario` entry, every `provenance.business_rules` entry — is
> read by a human first. Lead with the persona and the outcome. No file paths,
> no class or schema field names, no acronym walls, no jargon dumps in the lead
> of any sentence inside the epic. If the same idea can be said simply or
> technically, say it simply. See `rules/epics.md` Tenet section — it overrides
> every other rule below when they conflict.

> **Defect 23 — Decision Surfacing Discipline (DSD):** This skill emits a `decision-manifest.yaml` alongside its primary artifact. Every inferred decision produced during execution is recorded in the manifest with tier, grounding source, recommendation, and alternatives. The orchestrator drives the tiered surfacing flow after this skill completes.

Model-invocable skill for producing one intent epic YAML file per enriched capability. Called by `product-keeper` during `specify` Stage 5.

## Purpose

Turn structured capability data into structured intent epics shaped per the new
four-section ICE schema. The `intent-epic-schema.yaml` defines the contract:
every epic carries identity (`id`, `domain`, `capability`), then four sections
in this exact order:

1. `intent:` — `goal` (one sentence, persona subject, observable outcome),
   `constraints` (list of plain-language strings), `failure_scenario` (list of
   plain-language strings, ≥ 2 entries).
2. `expectations:` — `vetted`, `success_scenario`, `recovery`. Written as a
   stub here; populated later by `draft-epic-expectation`.
3. `connections:` — `before_chain.intents[]`, `after.intents[]`,
   `peers.intents[]`, `dependency_check` (non-empty string).
4. `provenance:` — `source.{kind,quote,confidence}`, `appetite`,
   `business_rules`, `kb_source.{capability,rules_applied,experiential_warnings}`,
   `uses_mocks`, `demock_epic_ref`, `foundation_investment`. Last section.

This skill instantiates the template once per vertical capability, filling
every field. It does NOT validate — `validate-intent-epics` is the next skill
in the chain. But it produces output that CAN pass validation, by being
careful about plain language, quantification, and structural order.

## Input

Receive from product-keeper:
- `enriched_capabilities_path` (path, required) — output of enrich-capabilities
- `project_profile_path` (path, required) — for appetite, audience, constraints
- `market_brief_path` (path, required) — for `provenance.source.quote` context
- `ltm_intent_epic_schema_path` (path, required) — `core/components/memory/standards/schemas/intent-epic.yaml`
- `ltm_rules_epics_path` (path, required) — `core/components/memory/standards/rules/epics.md`
- `ltm_rules_features_path` (path, required) — `core/components/memory/standards/rules/features.md`
- `ltm_rules_scenarios_path` (path, required) — `core/components/memory/standards/rules/scenarios.md`
- `epics_output_dir` (string, required) — typically `.garura/product/scope/epics/`
- `decision_manifest_path` (path, required) — path for the `decision-manifest.yaml` output, written alongside the primary artifacts (e.g., `.garura/product/scope/decision-manifest-generate-intent-epics.yaml`). Exact path is passed by the calling agent.
- `features_path` (path, required) — `.garura/product/scope/features.yaml` from `manage-features`. Used to cross-check epic KB IDs.

## Process

### 1. Load the schema and the rule files

Read `intent-epic-schema.yaml` to understand the required field structure for
the four sections. Read `rules/epics.md` — the seven rules plus the TENET at
the top of that file. Read `rules/features.md` and `rules/scenarios.md`.

Apply throughout:
- **Tenet (non-negotiable).** Every sentence is plain language. Lead with
  persona + outcome. No schema field names, file paths, or unexpanded
  acronyms in the lead of any sentence.
- `epics.md` Rule 1 — `intent.goal`'s subject is a named persona or a
  canonical role; every `expectations.success_scenario[].then` is observable.
- `epics.md` Rule 2 — `domain` is exactly one value; cross-cutting needs an
  explicit product-scope quote in `provenance.source.quote`.
- `epics.md` Rule 3 — every epic ships in two delivery parts (mocks first,
  then real integration). `provenance.uses_mocks` true ⇒ `provenance.demock_epic_ref`
  populated AND that integration epic appears in `connections.after.intents[]`.
- `epics.md` Rule 4 — strict schema. Four sections in order. No banned
  legacy top-level keys (see NEVER list).
- `epics.md` Rule 5 — every `expectations.success_scenario[].then` and
  `.measure` is binary-testable. Banned words: `should`, `smooth`, `intuitive`,
  `seamless`, `better`, `user-friendly`, `feels`.
- `epics.md` Rule 6 — `connections.before_chain.intents[]` lists every
  required epic explicitly; `connections.dependency_check` is non-empty; no
  cycles.
- `epics.md` Rule 7 — `provenance.foundation_investment: true` when this
  epic has ≥ 2 incoming `before_chain` references from other epics.
- `features.md` Rule 2 — quantify numeric values in `intent.constraints[]`
  (number + unit inline in the string).

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
     - Component's `business_rules_applied` → appended to parent's rules (dedup on equal rule text). These flow into `provenance.business_rules` on the parent epic with a prefix like `"[component: {component_id}] {original rule}"` so the reviewer still sees provenance.
     - Component's `failure_scenario` → appended to parent's failure_scenario list (dedup on equal string). These flow into `intent.failure_scenario` on the parent.
     - Component's `experiential_warnings` → appended to parent's warnings (these flow into `provenance.kb_source.experiential_warnings`).
   - Mark the component as `merged_into: {parent_id}`. Do NOT write it as a standalone epic.
3. At the end of the merge pass, the list of epic-eligible records is ONLY the `vertical` capabilities.

### 3. For each vertical capability, instantiate the template

Compute the epic fields. Write them in the schema order — identity at the top,
then the four sections.

**Identity (top of file, above the four sections):**
- `id`: `EPIC-{domain}-{capability-short-slug}-001`
- `domain`: from enriched record (exactly one value)
- `capability`: feature ID from enriched record; must trace to a real feature
  ID in `features.yaml`

**Section 1 — `intent:` (clean triple):**

- `intent.goal` — REQUIRED. One sentence. The user-observable end-state this
  epic delivers, Commander's Intent style. Subject is a named persona or a
  canonical role (`user`, `admin`, `developer`, `operator`, `reviewer`). NOT a
  subsystem, service, pipeline, validator, store, agent, or component. ≤ 30
  words. Plain language; no file paths, schema field names, or unexpanded
  acronyms in the lead. Example:
  *"Engineering leader extracts a credible savings number within 2 minutes
  of opening the leader view at least 80% of the time."*

- `intent.constraints` — REQUIRED. A YAML list of plain-language strings.
  Each entry is a single sentence stating an NFR, policy, or hard limit the
  goal must respect. Numeric values carry their number + unit inline. No
  nested sub-fields. Examples:
  - `"p95 login latency under 500ms at 10K concurrent sessions."`
  - `"Conform to OWASP ASVS Level 3 and NIST 800-63B AAL3 for credential handling."`
  - `"Meet WCAG 2.1 AA for every screen the persona touches."`

- `intent.failure_scenario` — REQUIRED. A YAML list of plain-language
  strings, minimum 2 entries. Each entry names a way the goal could fail —
  the catch-net. One recovery entry below pairs with each entry here. Pass
  through the cause strings from the enriched record's `failure_scenario`
  (or legacy `failure_conditions`) list, plain strings only. Example:
  *"Leader view ships as the simulator only — the five-pillar shape goes
  missing."*

**Section 2 — `expectations:` (stub here; populated by `draft-epic-expectation`):**

Append the stub atomically with the rest of the file:

```yaml
expectations:
  vetted:
    status: not_generated
    approved_by: null
    approved_at: null
  success_scenario: []
  recovery: []
```

This stub signals to downstream readers that the expectations block exists
but has not yet been generated. `draft-epic-expectation` will populate
`success_scenario` and `recovery` and write back atomically. Do NOT populate
either list here.

**Section 3 — `connections:`**

- `connections.before_chain.intents[]` — list of EPIC ids that MUST be
  delivered before this epic. Short form `EPIC-{domain}-{capability-slug}-001`.
  No external systems (those go in `provenance.business_rules` or as
  separate dependencies tracked elsewhere). No cycles.
- `connections.after.intents[]` — list of EPIC ids that depend on this one.
  Mirror of `before_chain` on the consumer side. When `provenance.uses_mocks`
  is true, the integration epic MUST appear here.
- `connections.peers.intents[]` — list of EPIC ids that ship in the same
  envelope or share a slice but carry no ordering requirement.
- `connections.dependency_check` — REQUIRED non-empty string per Rule 6.
  States how a reviewer or the pipeline verifies the listed `before_chain`
  epics are satisfied before this epic begins. Example:
  *"All before_chain epics carry `expectations.vetted.status: approved` and
  have been delivered to main."*

**Section 4 — `provenance:` (last section in the file):**

- `provenance.source.kind` — REQUIRED. One of:
  `brief_explicit | brief_inferred | rule_derived | research_supplemental | profile_default | assumption`.
- `provenance.source.quote` — REQUIRED. Verbatim brief text, OR `CTC-NNN`
  for `rule_derived`, OR `profile.<field>` for `profile_default`, OR
  `needs_user_grounding` for `assumption`.
- `provenance.source.confidence` — REQUIRED. `high | medium | low`.

- `provenance.appetite` — REQUIRED. Time-box per Shape Up semantics: fixed
  time, variable scope. Pulled from `project_profile.appetite` or derived
  from timeline + capability count. Example: `"6 weeks"`.

- `provenance.business_rules` — REQUIRED. List of plain-language strings,
  minimum 1 entry. Rules lifted from the KB capability definition with
  profile-specific overrides applied. Pass through `business_rules_applied`
  from the enriched record (text only — drop nested `source_for_quantification`
  blocks; quantification is verified by the validator against the strings).

- `provenance.kb_source` — REQUIRED:
  - `capability` — must equal the top-level `capability` field.
  - `rules_applied` — list of the specific KB business rule IDs or names
    that shaped this epic.
  - `experiential_warnings` — list lifted from the KB feature's
    Experiential section. May be empty.

- `provenance.uses_mocks` — REQUIRED. Default `false`. Set `true` when this
  epic ships the mock-first part of the two-part delivery (Rule 3).

- `provenance.demock_epic_ref` — REQUIRED when `uses_mocks == true`. The
  EPIC id of the integration epic that retires the mocks. That integration
  epic MUST also appear in `connections.after.intents[]`.

- `provenance.foundation_investment` — REQUIRED. Default `false`. Set
  `true` when this epic is shared infrastructure that ≥ 2 other epics depend
  on (i.e., it has ≥ 2 incoming `connections.before_chain` references). Rule 7.

### 3b. Emit decision manifest

Before writing any epic file, write `decision-manifest.yaml` to `{decision_manifest_path}`.

Record every inferred decision produced during Steps 2b and 3. Assign tier at runtime based on grounding source: **high** when the decision was a direct match against a KB rule, file, or catalog entry; **mid** when context was built via web research; **low** when neither KB nor research yielded a grounding source.

**Decisions to record** (decision_id prefix: `D-gie-`; IDs are audit-stable across schema migrations — do NOT renumber):

| decision_id | decision_type | What is being decided |
|-------------|---------------|-----------------------|
| `D-gie-001` | `goal-source-synthesis` | Which brief excerpt + profile constraint + KB failure-scenario cause are woven into `intent.goal` and `provenance.source.quote` (Step 3) |
| `D-gie-002` | `goal-phrasing-metric-pick` | Which highest-impact success metric is selected and how it is phrased into `intent.goal` as the measurable end-state (Step 3) |
| `D-gie-003` | `appetite-computation` | Whether `provenance.appetite` is taken from `profile.appetite` directly or derived from timeline + capability count, and the computed value (Step 3) |
| `D-gie-005` | `connections-dependency-check-derivation` | Which verification rule fills `connections.dependency_check`, and which other epic ids are listed in `before_chain`, `after`, and `peers` (Step 3) |
| `D-gie-006` | `component-to-parent-merge` | For each component capability, which parent vertical it merges into and which rules, failure-scenario strings, and warnings are absorbed (Step 2b) |

Note: `D-gie-004` (success-scenario-phrasing) was removed in #390. That decision is now emitted by `draft-epic-expectation` under the `D-dee-` prefix — success scenarios are generated in the expectations block, not here.

```yaml
schema_version: "1.0"
skill: "generate-intent-epics"
generated_at: "{ISO8601}"
decisions:
  - decision_id: "D-gie-001"
    decision_type: "goal-source-synthesis"
    tier: high | mid | low   # assign at runtime per grounding source
    grounding_source:
      kind: kb_path | web_citation | none
      ref: "{KB file path | URL | null}"
      excerpt: "{optional short quote when kind=kb_path}"
    recommendation: "{the synthesized intent.goal + provenance.source.quote}"
    alternatives_considered:
      - alt: "{alternative framing}"
        why_not: "{one-line dismissal reason}"
    agent_reasoning_summary: "{2-3 sentence explanation}"
    user_response: null
    user_response_detail: null
  # ... one entry per decision listed above; D-gie-001/002/003/005 repeat per vertical capability; D-gie-006 repeats per merged component
```

### 4. Write one file per epic

Write each epic YAML to `{epics_output_dir}/epic-{domain}-{capability-slug}-001.yaml`. Ensure the parent directory exists.

Field order in the file must be exactly:

1. `id`, `domain`, `capability` (identity, top of file)
2. `intent:` (section 1)
3. `expectations:` (section 2, as the stub above)
4. `connections:` (section 3)
5. `provenance:` (section 4, last)

### 5. Return the output contract

```yaml
epics:
  output_dir: <path>
  file_count: <int>  # equals vertical capability count after merge
  files:
    - path: <absolute path>
      capability: <feature ID>
      expectation_stub_written: true  # always true; stub block is always emitted
  quantification_coverage:
    constraints_with_number_unit: <int>  # count of epics whose intent.constraints carry at least one numeric+unit string
    constraints_naming_security_standard: <int>
    constraints_referencing_wcag: <int>
decision_manifest:
  path: <written path>
  decisions_recorded: <int>
```

## Constraints

### NEVER

- NEVER leave a mandatory field empty, null, or `TBD` / `to be determined`. If the required data is not derivable, return structured failure for that capability and skip writing the epic.
- NEVER invent a capability. Every epic maps 1:1 to a vertical enriched capability (after component merge).
- NEVER emit any of the **banned legacy top-level keys**: `intents` (plural list — replaced by `intent.goal` singular string), `failure_conditions` (now `intent.failure_scenario`), `in_scope`, `anti_goals`, `must_not_break`, `cross_cutting_justification`, `problem_statement`, `hypothesis`, `assumptions_requiring_validation`, top-level `appetite`, top-level `business_rules`, top-level `constraints` as an NFR struct, top-level `depends_on`, top-level `dependencies`, top-level `foundation_investment`, top-level `uses_mocks`, top-level `demock_epic_ref`, top-level `kb_source`, top-level `expectation` (now plural `expectations` as a section). If any of these would have been written under the old shape, rewrite them under the new four-section shape.
- NEVER write `success_scenario` or `recovery` entries inline — they belong inside `expectations:` and are populated by `draft-epic-expectation`. Only emit the stub.
- NEVER produce fewer than 2 entries in `intent.failure_scenario`.
- NEVER use a subsystem / component name as the grammatical actor of `intent.goal`. The subject must be a named persona or a canonical user role per `rules/epics.md` Rule 1.
- NEVER start the first sentence of `intent.goal` with a file path, a schema field name, or an unexpanded acronym. The tenet bars this.
- NEVER write a numeric value into `intent.constraints[]` without its unit and the source-of-quantification context (KB-default numbers must have been user-grounded at the capability-configuration checkpoint before reaching this skill; if one arrives unsourced, halt with `unsourced_constraint`).
- NEVER write a capability whose provenance is `assumption` into `intent` or `expectations`. Assumptions live in `provenance.source.kind: assumption` with `quote: needs_user_grounding` until user grounding.
- NEVER span domains in `intent` or `expectations` without `provenance.source.quote` explicitly naming the cross-cutting product-scope item (Rule 2).
- NEVER produce circular `connections.before_chain.intents[]` relationships.
- NEVER set `provenance.uses_mocks: true` without populating `provenance.demock_epic_ref` AND adding that integration epic id to `connections.after.intents[]`.
- NEVER leave `connections.dependency_check` empty when `before_chain.intents[]` has entries. The check string is mandatory whenever a dependency is declared (Rule 6).
- NEVER skip `provenance.kb_source`. Every epic carries its provenance.
- NEVER commit an inferred decision to the primary artifact (epic YAML files) without recording it in `decision-manifest.yaml` first.
- NEVER tag a decision `tier: high` unless the `grounding_source.kind` is `kb_path` AND the referenced KB file exists.

### ALWAYS

- ALWAYS write one file per vertical epic — one file per capability after component merge.
- ALWAYS use the exact top-level keys from the schema — no extras, no renames. Identity above; four sections in order: `intent`, `expectations`, `connections`, `provenance`.
- ALWAYS keep every sentence plain-language and reviewer-readable per the tenet. Rewrite any sentence that drifts into jargon, schema-field soup, or acronym walls.
- ALWAYS enforce the rules in `standards/rules/epics.md`, `rules/features.md`, and `rules/scenarios.md`. These files are the authoritative rule source.
- ALWAYS include `alternatives_considered` (≥ 1 entry) for every decision in the manifest, even high-confidence ones.

## Version

| Field | Value |
|-------|-------|
| Version | 0.3.0 |
| Category | product-planning |
| Created | 2026-04-14 |
| Updated | 2026-05-28 — migrated to four-section ICE schema (#397) |
| Related | `core/components/skills/enrich-capabilities`, `core/components/skills/validate-intent-epics`, `core/components/skills/draft-epic-expectation`, `core/components/memory/standards/schemas/intent-epic.yaml`, `core/components/memory/standards/rules/epics.md` |
