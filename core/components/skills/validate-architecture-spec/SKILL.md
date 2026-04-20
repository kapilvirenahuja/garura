---
name: validate-architecture-spec
description: Blocking validator for the five-artifact arch output contract (logical-architecture, physical-architecture, nfr-spec, quality-vision, design-patterns) plus their five decision manifests. Enforces all 20 checks derived from arch intent.yaml constraints C1-C19 and failure conditions F1-F19.
user-invocable: false
model: haiku
allowed-tools: Read, Write, Glob, Grep
---

# validate-architecture-spec

Called by `tech-architect` after all five arch derive skills complete. Blocking validator — any blocker violation causes `status: failed` and the calling play cycles back to the relevant stage.

## Purpose

Enforce the `arch` intent.yaml contract against the actual five-artifact output. Checks structural completeness, technology discipline, capability coverage, NFR delivery, quality vision, pattern coverage, decision-surfacing discipline, ADR completeness, and driver traceability across every artifact and every decision manifest.

## Input

Receive from the tech-architect agent via JSON contract. All paths resolve against `{product_base}` unless stated otherwise.

- `logical_architecture_path` (path, required) — `{product_base}architecture/logical-architecture.yaml`
- `physical_architecture_path` (path, required) — `{product_base}architecture/physical-architecture.yaml`
- `nfr_spec_path` (path, required) — `{product_base}architecture/nfr-spec.yaml`
- `quality_vision_path` (path, required) — `{product_base}architecture/quality-vision.yaml`
- `design_patterns_path` (path, required) — `{product_base}architecture/design-patterns.yaml`
- `manifest_logical_path` (path, required) — `{product_base}architecture/decision-manifest-derive-logical-architecture.yaml`
- `manifest_physical_path` (path, required) — `{product_base}architecture/decision-manifest-derive-physical-architecture.yaml`
- `manifest_nfr_path` (path, required) — `{product_base}architecture/decision-manifest-derive-nfr-spec.yaml`
- `manifest_quality_vision_path` (path, required) — `{product_base}architecture/decision-manifest-derive-quality-vision.yaml`
- `manifest_design_patterns_path` (path, required) — `{product_base}architecture/decision-manifest-derive-design-patterns.yaml`
- `scope_path` (path, required) — `{product_base}scope/scope.yaml`
- `quality_profile_path` (path, required) — `{product_base}specification/quality-profile.yaml`
- `epics_dir` (path, required) — `{product_base}scope/epics/`
- `project_profile_path` (path, required) — `{product_base}user-provided/project-profile.yaml`
- `ltm_architecture_path` (path, required) — `{ltm_base}knowledge/arch/` (for V8 KB spot-check)
- `output_path` (string, required) — `{product_base}architecture/validation-result.yaml`

## Process

### Step 1. Load all inputs

Parse each artifact and manifest. On any file missing or empty, record a V1 violation immediately but continue loading the remaining files. Collect violations rather than aborting on first failure so the full violation set is reported.

Load supporting context:
- `scope.selected_capabilities` — list of all capability IDs that must be mapped
- `quality_profile.characteristics` — all characteristics with `relevance != not_applicable`
- All epic YAML files under `{epics_dir}` — extract `constraints` blocks for performance requirements
- `project_profile.grounded_tools` — the authoritative pin map
- Load `physical_architecture.deployment_topology.runtime_tiers` — for V13 layer coverage
- Load `nfr_spec.nfrs` — for V9, V13 cross-cutting trigger detection, and V20

Collect all five manifests into a unified decision list (`all_decisions`) for checks that span across manifests (V15, V16).

### Step 2. V1 — Artifact existence and non-emptiness (cites F1)

For each of the five canonical artifact files:
1. Verify the file exists using Glob or Read.
2. Verify the file is non-empty (not zero bytes, not a YAML document with only metadata).
3. Verify the primary section has at least one entry:
   - `logical-architecture.yaml` → `components` list length ≥ 1
   - `physical-architecture.yaml` → at least one of `frontend_stack`, `backend_stack`, or `data_stores` is non-empty
   - `nfr-spec.yaml` → `nfrs` list length ≥ 1
   - `quality-vision.yaml` → `characteristics` list length ≥ 1
   - `design-patterns.yaml` → `system_level` list length ≥ 1

Any file missing, empty, or with zero entries in its primary section is a **blocker**.

### Step 3. V2 — Logical architecture structural completeness (cites F1)

Read `logical-architecture.yaml` and verify:
1. `bounded_contexts` list is non-empty (≥ 1 entry).
2. `components` list is non-empty (≥ 1 entry).
3. `data_model.entities` list is non-empty (≥ 1 entry).

Any empty list is a **blocker**.

### Step 4. V3 — Logical purity scan (cites F3)

Scan every string value in `logical-architecture.yaml` — in `bounded_contexts`, `components`, `data_model`, `api_surface`, `integration_points`, and `component_capability_map` — against the deny list below. Match is case-insensitive.

**Product name deny list** (partial; expand on new signals):
`postgresql`, `mysql`, `mongodb`, `redis`, `elasticsearch`, `opensearch`, `kafka`, `rabbitmq`,
`react`, `next.js`, `nextjs`, `vue`, `angular`, `svelte`, `express`, `fastify`, `django`,
`rails`, `spring`, `aws`, `gcp`, `azure`, `vercel`, `railway`, `neon`, `prisma`, `typeorm`,
`sequelize`, `temporal`, `celery`, `bullmq`, `node.js`, `nodejs`, `deno`, `bun`, `python`,
`java`, `golang`, `go`, `rust`, `typescript`, `javascript`

**Protocol deny list**:
`http`, `https`, `grpc`, `rest`, `graphql`, `websocket`, `tcp`, `udp`, `mqtt`, `amqp`

**Wire format deny list**:
`json`, `protobuf`, `avro`, `xml`, `yaml` (when used as a data format token rather than file extension), `messagepack`, `thrift`, `parquet`

**Schema column type deny list**:
`varchar`, `char`, `text`, `integer`, `int`, `bigint`, `smallint`, `decimal`, `numeric`,
`float`, `double`, `boolean`, `bool`, `uuid`, `jsonb`, `bytea`, `timestamp`, `date`, `time`,
`serial`, `bigserial`

**Programming language identifier deny list** (common keywords/constructs):
`async`, `await`, `class`, `interface`, `struct`, `enum` (when used as code construct, not plain English),
`typedef`, `function`, `const`, `let`, `var`, `def`, `import`, `require`, `namespace`

**Exclusions:** Deny-list terms that appear only in `adr_log` entries (under `alternatives`) or in `source` / `citation` / `driver` fields are excluded — these fields document provenance, not structural content. The purity check applies to structural fields: `name`, `responsibilities`, `type`, `purpose`, `interaction_pattern`, `invariants`, `primary_identifier`, `owned_state`.

Any match in a structural field is a **blocker**. Record the field path and the matching token.

### Step 5. V4 — Capability coverage (cites F5)

1. Load `scope.selected_capabilities` — the full list of capability IDs.
2. Load `logical_architecture.component_capability_map` — the cross-reference list.
3. For every capability ID in `scope.selected_capabilities`, verify at least one entry in `component_capability_map` has a matching `capability_id` with a non-empty `serving_components` list.
4. Any capability with zero mappings is a **blocker**. Record the orphaned capability ID.

### Step 6. V5 — Physical technology specificity (cites F2)

Scan every technology choice value in `physical-architecture.yaml` — in `frontend_stack.choice`, `backend_stack.choice`, `data_stores[*].choice`, `cache.choice`, `queue.choice`, `auth_infra.choice`, `platform_hosts.*`, `observability.*.choice`, and `library_pins[*].name` — against the category-phrase deny list:

`a database`, `a relational database`, `a nosql database`, `a cache`, `a message queue`, `a queue`,
`a frontend framework`, `a backend framework`, `a framework`, `a runtime`, `an orm`,
`an auth provider`, `a monitoring tool`, `a logging tool`, `a tracing tool`, `a search engine`,
`a vector database`, `a cloud provider`, `a hosting platform`, `a cdn`, `a load balancer`

Match is case-insensitive. Also flag any `choice` field containing only generic nouns without a version pin or specific product name identifiable by the LTM knowledge base.

Additionally, for every slot marked `status: pending_user_approval`, verify it has a corresponding `question_id` field — orphaned pending slots without a question ID are a **warning** (not a blocker, as pending slots are a valid mid-run state).

Any category-phrase match in a `choice` field is a **blocker**.

### Step 7. V6 — Source-type discipline in physical and design-patterns (cites F15)

For every decision-carrying entry in `physical-architecture.yaml` (all `*_stack`, `data_stores[*]`, `cache`, `queue`, `auth_infra`, `platform_hosts`, `observability.*`, `library_pins[*]`) and in `design-patterns.yaml` (all `system_level[*]`, `layer_level[*]`, `component_level[*]`, `cross_cutting[*]`):

1. Verify the entry has a `source_type` field. Missing `source_type` is a **blocker** (schema violation).
2. Verify `source_type` is one of the permitted enum values:
   - `grounded_tools_pin`
   - `kb_catalog_single_candidate`
   - `kb_catalog_multi_candidate_user_approved`
   - `agent_default_with_user_approval`
   - `agent_default_unilateral` — **BLOCKING** (F15). Any occurrence is an immediate blocker; do not continue validating that entry's other fields.

Any entry missing `source_type` or carrying `agent_default_unilateral` is a **blocker**.

### Step 8. V7 — Grounded-tools pin verification (cites F16)

1. Load `project_profile.grounded_tools` — the full pin map (key = slot name, value = pinned product/version).
2. For every pin entry, locate the corresponding slot in `physical-architecture.yaml` or `design-patterns.yaml` by matching the slot key to the artifact field name.
3. Verify the slot's `choice` (or equivalent value field) exactly matches the pinned value (string equality, case-sensitive).
4. Verify the slot's `source_type` is `grounded_tools_pin`.
5. Verify the slot's `source_citation` references `project-profile.grounded_tools.{slot_key}`.

Any mismatch between the pinned value and the slot's actual choice is a **blocker**. Any pin that is present but tagged with a different `source_type` is also a **blocker** (mis-tagged pin).

### Step 9. V8 — KB single-candidate verification spot-check (cites F17)

For every entry in any artifact that carries `source_type: kb_catalog_single_candidate`:

1. Read the `source_citation` field — it must reference a KB file under `{ltm_architecture_path}/`.
2. Verify the referenced KB file exists (Glob or Read). If the KB file does not exist, record a **warning** (non-blocking): the citation is unverifiable. Do not promote to blocker because the KB may be deployed separately.
3. If the KB file exists, read its content and look for any `When to Choose` / `When to Avoid` sections. Attempt to identify whether more than one product is listed as a valid candidate that passes the project-profile dimensions stated in the `source_citation` field.
4. If the KB file clearly lists multiple candidates and the `source_citation` does not name a dimension filter that would eliminate all but one → record a **blocker** (F17): the single-candidate tag is incorrect.
5. If the KB file exists but the multi-candidate analysis is ambiguous (the filter logic is complex), record a **warning** and note the field path for human review.

The goal is a best-effort spot-check, not a full re-execution of the KB filter math.

### Step 10. V9 — NFR delivery mechanism completeness and forward-ref resolution (cites F6)

For every entry in `nfr-spec.nfrs`:

**Check 9a. Non-empty delivery_mechanism:**
- Verify `delivery_mechanism` is present and non-null.
- A `delivery_mechanism` with `status: forward_ref_pending_design_patterns` is valid at NFR derivation time — it is NOT a failure here.
- A null or missing `delivery_mechanism` is a **blocker**.

**Check 9b. Forward reference resolution:**
After design-patterns is produced, every `forward_ref_pending_design_patterns` entry must be resolved. Scan `nfr-spec.forward_references` for any entry with `resolved: false`. For each:
1. Look up the `expected_pattern` value.
2. Search `design-patterns.yaml` for any entry (in `system_level`, `layer_level`, `component_level`, or `cross_cutting`) with a matching `pattern` field.
3. If a matching pattern is found and its `applicability_scope` is relevant to the NFR context → this forward reference is resolved. Record it as resolved.
4. If no matching pattern is found → **blocker** (F6 unresolved forward reference). Record the NFR ID and the expected pattern.

Any NFR with a null delivery_mechanism OR any unresolved forward reference is a **blocker**.

### Step 11. V10 — ISO 25010 characteristic coverage (cites F7)

1. Load `quality_profile.characteristics` — extract every entry with `relevance != not_applicable`. Call this set `required_characteristics`.
2. Load `quality_vision.characteristics` — extract the `characteristic` field from each entry. Call this set `covered_characteristics`.
3. For every characteristic in `required_characteristics`, verify it appears in `covered_characteristics`.
4. Any characteristic from the quality profile (with non-`not_applicable` relevance) that has no entry in quality-vision is a **blocker**.

### Step 12. V11 — Quality-vision entry completeness (cites F7 / F8)

For every entry in `quality_vision.characteristics`:

Verify ALL of the following fields are present and non-empty:
- `vision` — non-empty string (not whitespace only)
- `target_level` — non-empty string
- `design_linkage` — object with at least one of `components`, `nfrs`, or `patterns` being a non-empty list
- `tooling` — list with ≥ 1 entry; each entry must have a non-empty `name` field
- `thresholds` — list with ≥ 1 entry; each entry must be a non-empty string
- `lifecycle_gates` — list with ≥ 1 entry; each entry must have non-empty `gate` and `tool` fields

Any missing or empty required field is a **blocker**.

### Step 13. V12 — Quality-vision vague-language scan (cites F8)

Scan every string value in `quality_vision.characteristics` entries — specifically in `vision`, `thresholds`, and `lifecycle_gates[*].threshold` — for vague phrases that lack a quantified qualifier:

**Vague-language deny list:**
- `fast` (unless adjacent to a numeric threshold such as "fast (p95 ≤ 500ms)")
- `reliable` (unless qualified by a percentage or SLA target)
- `thoroughly` / `thorough`
- `robust` (unless qualified by a specific metric)
- `adequate`, `sufficient`, `appropriate`, `good`, `better`, `improved`
- `use a linter`, `a linter`, `a coverage tool`, `a test framework`, `some monitoring`, `any tool`
- `comprehensive coverage`, `high coverage`, `good practices`, `industry standards`, `best practices`

A match is a **blocker** when the phrase appears in a `threshold` or `lifecycle_gates.threshold` field without an adjacent quantified metric. A match in a `vision` narrative is a **warning** (vision text is intentionally narrative; warnings flag for human review).

### Step 14. V13 — Design-patterns layer coverage (cites F9)

1. Load `physical_architecture.deployment_topology.runtime_tiers` — the authoritative tier list.
2. Determine `has_backend`: true if any tier has `type: api` or `type: worker`.
3. Load cross-cutting triggers: scan `nfr_spec.nfrs` for any NFR where `characteristic` is `reliability`, `security`, or `integrity` AND (`delivery_mechanism.description` OR `verification_method.scenario`) mentions any of: `resilience`, `idempotency`, `retry`, `consistency`, `circuit breaker`, `outbox`. Record the triggering NFR IDs.

Verify:
- **system_level check:** `design_patterns.system_level` has ≥ 1 entry. Missing → **blocker**.
- **layer_level check:** if `has_backend = true`, `design_patterns.layer_level` has ≥ 1 entry. Missing when backend exists → **blocker**.
- **component_level check:** for each `runtime_tier` entry in `physical_architecture.deployment_topology.runtime_tiers`, verify at least one entry in `design_patterns.component_level` has a matching `runtime_tier` field. Any uncovered tier → **blocker**. Record the uncovered tier name.
- **cross_cutting check:** if any cross-cutting trigger fired (above), verify `design_patterns.cross_cutting` is non-empty. Missing when triggers exist → **blocker**.

### Step 15. V14 — Source-type discipline in design-patterns manifests (cites F15)

This check mirrors V6 for the design-patterns decision manifest specifically. For every entry in `manifest_design_patterns_path`:

1. Verify `source_type` is present (when the decision entry carries a technology choice — not all manifest entries describe technology choices; narrative decisions do not require source_type).
2. Verify `source_type` ∉ `agent_default_unilateral`. Any occurrence → **blocker**.

Note: V6 covers the primary artifact. V14 covers the manifest file for design-patterns. The same source_type rules apply.

### Step 16. V15 — Decision manifest completeness across all five manifests (cites F19)

Load all five decision manifests from `all_decisions` collected in Step 1. For every decision entry across all five manifests:

1. Verify `tier` is present and ∈ {`high`, `mid`, `low`}. Missing or invalid → **blocker**.
2. Verify `grounding_source` is present and has a non-empty `kind` field ∈ {`kb_path`, `web_citation`, `none`}. Missing → **blocker**.
3. Verify `recommendation` is present and non-empty. Missing → **blocker**.
4. Verify `alternatives_considered` is present as a list. It may be a list with a single entry `"none — only candidate"` — that is valid. An absent or null list is a **blocker**.
5. Verify `user_response` — if `user_response` is null, that is a **blocker**. After the orchestrator runs the surfacing flow, every decision must have an explicit response: `accept`, `override`, or `orbit`. A null response means the decision was never surfaced to the user.

Any missing field or null `user_response` is a **blocker**.

### Step 17. V16 — No tier=high decision with grounding_source.kind=none (cites F19)

Scan all decisions in `all_decisions`. For every entry with `tier: high`, verify `grounding_source.kind` is `kb_path` (not `web_citation`, not `none`). A `tier: high` decision requires a concrete KB or file reference — neither `web_citation` nor `none` is a valid grounding source for high-tier decisions.

Any `tier: high` + `grounding_source.kind != kb_path` combination is a **blocker**.

### Step 18. V17 — ADR log completeness (cites F10)

Load `logical_architecture.adr_log`. For every ADR entry:

Verify ALL of the following fields are present and non-empty:
- `decision` — the decision made (non-empty string)
- `alternatives` — list with ≥ 1 entry (non-empty list; entries must be non-empty strings)
- `chosen_option` — the selected option (non-empty string). Note: this field may be named `decision` in some schemas — accept either `chosen_option` or `decision` provided `decision` is not the same as the `context` description.
- `drivers` — list with ≥ 1 entry of upstream artifact references

Also accept the extended ADR schema with `title`, `status`, `date`, `context`, `rationale`, `consequences` — when present, verify `alternatives` is a list with ≥ 1 non-trivial entry (not just a whitespace string).

Any ADR missing `decision`, `alternatives`, or `drivers` is a **blocker**.

### Step 19. V18 — Non-obvious decisions have ADRs (cites F10)

Scan all decisions in `all_decisions`. For every decision entry where `alternatives_considered` has ≥ 2 distinct entries (excluding the `"none — only candidate"` value):

1. This is a "non-obvious decision" — at least two viable alternatives existed.
2. Verify a corresponding ADR exists in `logical_architecture.adr_log`. Match by: the ADR's `context` or `title` should reference the same decision subject (key term matching is acceptable — exact string match is not required).
3. If no corresponding ADR is found → record a **warning** (non-blocking). Multiple non-ADR'd decisions of this type → escalate to **blocker** if count ≥ 3 (three or more non-obvious decisions without ADRs indicates systematic gap, not an isolated miss).

### Step 20. V19 — Driver traceability (cites F4)

For every `driver` / `drivers` field value across all five artifacts and all five manifests:

1. Collect all driver citation strings (e.g., `"EPIC-user-login-001 CTC-001"`, `"quality-profile.security"`, `"project-profile.budget_sensitivity=medium"`, `"design flows/authentication-flow.md"`).
2. For each citation that references a file path (any citation containing `/` or ending with `.yaml` or `.md`), verify the referenced file exists using Glob. If the file does not exist → **blocker**. Record the missing path and the field that cited it.
3. For each citation that references a YAML key path (e.g., `quality-profile.security`, `project-profile.team_size`), verify the top-level key exists in the referenced file by reading it. If the top-level key is absent → **blocker**. Record the missing key and the field that cited it.
4. For citations referencing epic IDs (e.g., `EPIC-user-login-001`), verify a corresponding file exists under `{epics_dir}` that matches the epic ID pattern. If no file matches → **blocker**.
5. Citations that are free-form rationale strings without a path, key, or ID (e.g., `"standard resilience practice"`) are flagged as **warnings** — drivers must cite specific upstream artifacts per C4/F4.

### Step 21. V20 — Epic performance constraints covered by NFRs (cites F6)

1. Glob all files under `{epics_dir}/*.yaml`. For each epic file, parse the `constraints` block.
2. Extract every performance constraint — any field or value that specifies a latency budget, throughput target, response time requirement, rate limit, error budget, or uptime target. Indicators: numeric values adjacent to `ms`, `%`, `rps`, `tps`, `req/s`, `uptime`, `availability`, `latency`, `p95`, `p99`, `p50`, `SLA`.
3. For each extracted performance constraint, verify at least one entry in `nfr_spec.nfrs` has a `source` field that cites the epic ID AND a `target` that captures the constraint value.
4. Any epic performance constraint with no matching NFR entry is a **blocker**.

### Step 22. Assemble validation result

After all 20 checks complete, build the output document:

```yaml
schema_version: 2
validated_at: <ISO-8601 timestamp>
status: passed | failed
artifacts_checked:
  - logical-architecture.yaml
  - physical-architecture.yaml
  - nfr-spec.yaml
  - quality-vision.yaml
  - design-patterns.yaml
checks:
  - id: V1
    cites: F1
    status: pass | fail
    details: <string or empty string>
  - id: V2
    cites: F1
    status: pass | fail
    details: <string or empty string>
  - id: V3
    cites: F3
    status: pass | fail
    details: <string or empty string>
  - id: V4
    cites: F5
    status: pass | fail
    details: <string or empty string>
  - id: V5
    cites: F2
    status: pass | fail
    details: <string or empty string>
  - id: V6
    cites: F15
    status: pass | fail
    details: <string or empty string>
  - id: V7
    cites: F16
    status: pass | fail
    details: <string or empty string>
  - id: V8
    cites: F17
    status: pass | fail
    details: <string or empty string>
  - id: V9
    cites: F6
    status: pass | fail
    details: <string or empty string>
  - id: V10
    cites: F7
    status: pass | fail
    details: <string or empty string>
  - id: V11
    cites: "F7/F8"
    status: pass | fail
    details: <string or empty string>
  - id: V12
    cites: F8
    status: pass | fail
    details: <string or empty string>
  - id: V13
    cites: F9
    status: pass | fail
    details: <string or empty string>
  - id: V14
    cites: F15
    status: pass | fail
    details: <string or empty string>
  - id: V15
    cites: F19
    status: pass | fail
    details: <string or empty string>
  - id: V16
    cites: F19
    status: pass | fail
    details: <string or empty string>
  - id: V17
    cites: F10
    status: pass | fail
    details: <string or empty string>
  - id: V18
    cites: F10
    status: pass | fail
    details: <string or empty string>
  - id: V19
    cites: F4
    status: pass | fail
    details: <string or empty string>
  - id: V20
    cites: F6
    status: pass | fail
    details: <string or empty string>
violations:
  - check_id: V{n}
    severity: blocker | warning
    message: <human-readable description of the violation>
    location: <file path + YAML field path or line reference>
summary:
  total_checks: 20
  passed: <n>
  failed: <n>
  blockers: <n>
  warnings: <n>
```

**Status rule:** If `summary.blockers > 0` → `status: failed`. If `summary.blockers = 0` → `status: passed` (warnings do not block).

### Step 23. Write output and return

Write the assembled validation result to `{output_path}`. Do NOT modify any of the five artifact files or any manifest file. Read-only access to all inputs.

Return output contract:

```yaml
validation:
  path: <written path>
  status: passed | failed
  total_checks: 20
  passed: <n>
  failed: <n>
  blockers: <n>
  warnings: <n>
```

## Constraints

- NEVER modify any artifact file or decision manifest. This skill is read-only on all inputs.
- NEVER auto-fix violations. Report them precisely; the calling play cycles back to the appropriate derive skill.
- NEVER return `status: passed` when any blocker violation exists. Zero blockers required for pass.
- NEVER return `status: passed` when any `forward_ref_pending_design_patterns` entry in nfr-spec.yaml remains with `resolved: false`.
- NEVER return `status: passed` when any decision in any manifest has `user_response: null`.
- NEVER return `status: passed` when `agent_default_unilateral` appears anywhere in any artifact or any manifest.
- ALWAYS run all 20 checks. Do not short-circuit on first failure — collect the full violation set so the calling play can address all issues in one cycle-back.
- ALWAYS cite the specific field path in `violations[*].location` — "logical-architecture.yaml:components[2].name" not "logical-architecture.yaml".
- ALWAYS load upstream scope, epics, quality profile, and project profile before running any check that depends on them (V4, V7, V10, V20).

## Version

| Field | Value |
|-------|-------|
| Version | 0.3.0 |
| Category | architecture |
| Created | 2026-04-14 |
| Updated | 2026-04-15 |
| Related | `core/components/skills/derive-logical-architecture`, `core/components/skills/derive-physical-architecture`, `core/components/skills/derive-nfr-spec`, `core/components/skills/derive-quality-vision`, `core/components/skills/derive-design-patterns` |
