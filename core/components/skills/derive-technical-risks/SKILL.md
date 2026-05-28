---
name: derive-technical-risks
description: Stage 6 skill of /arch. Runs LAST, after every other arch artifact is locked. Reads refined quality profile, systems inventory, logical architecture, physical architecture, and tech-stack, then walks eight discovery scans to identify technical risks. Every risk carries risk_statement, trigger_conditions, business_cost, likelihood, mitigation with owner, residual_risk, and driver_refs naming the artifacts the risk surfaces from.
version: 0.1.0
user-invocable: false
---

# derive-technical-risks

> **Decision Surfacing Discipline:** This skill emits a `decision-manifest-derive-technical-risks.yaml` alongside its primary artifact. Every risk identified is a decision recorded with tier (high | mid | low) grounded in how the risk was surfaced. Low-tier risks surface one-by-one for explicit user confirmation; high-tier risks (deterministic triggers like published SLAs, EOL dates, regulatory floors) batch-confirm.

Called by `tech-designer` during `arch` Stage 6 — the LAST stage. Produces `technical-risks.yaml` at `{product_base}architecture/technical-risks.yaml` plus a decision manifest.

## Purpose

Once every other arch artifact is in place, identify what can go wrong and prepare the team to handle it. Each risk entry is a complete trio: what could break, what it would cost the business, what to do about it. No risk ships without all three.

Risks surface from the architecture itself — not from imagination. Eight discovery scans walk the locked artifacts to surface concrete risks grounded in the design. Skipping a scan thins the register and leaves blind spots.

This skill does not run unless Stages 1-5 have all produced their artifacts. Premature execution halts.

## Input

Receive from the `tech-designer` agent. All paths resolve against `{product_base}` and `{ltm_base}` supplied by the play via JSON contract.

- `refined_qp_path` (path, required) — `{product_base}architecture/quality-profile.yaml`. Stage 2 output.
- `inventory_dir` (path, required) — `{product_base}architecture/systems-inventory/`. Stage 1 output.
- `logical_path` (path, required) — `{product_base}architecture/logical-architecture.yaml`. Stage 3 output.
- `physical_path` (path, required) — `{product_base}architecture/physical-architecture.yaml`. Stage 4 output.
- `tech_stack_path` (path, required) — `{product_base}architecture/tech-stack.yaml`. Stage 5 output.
- `epics_dir` (path, required) — `{product_base}scope/epics/`. Epic failure_conditions are starting points for risk identification.
- `project_profile_path` (path, required) — `{product_base}user-provided/project-profile.yaml`. Compliance flags, SLA commitments, and team_skills calibrate business_cost.
- `kb_quality_dir` (path, required) — `{ltm_base}components/memory/knowledge/quality/`. Well-known failure modes per ISO 25010 dimension; agent pattern-matches against the product's design.
- `prior_decision_manifests_dir` (path, optional) — `{product_base}architecture/`. Glob for `decision-manifest-*.yaml`. Decisions tagged `tier: mid` or `tier: low` in earlier stages are risk candidates.
- `output_path` (string, required) — `{product_base}architecture/technical-risks.yaml`.
- `decision_manifest_path` (string, required) — `{product_base}architecture/decision-manifest-derive-technical-risks.yaml`.

## Output

### Technical risks

YAML at `{output_path}`.

```yaml
risks:
  - id: TR-001                                  # sequential, kebab-or-numeric, unique
    risk_statement: |
      {one paragraph in plain language — what can go wrong}
    trigger_conditions:                          # one bullet per circumstance that materializes the risk
      - {circumstance}
    business_cost:
      kind: revenue | reputation | compliance | sla_penalty | operational | safety | data_loss
      magnitude: low | medium | high | catastrophic
      cost_estimate: |
        {prose or quantified — e.g. "$10K-$50K per incident", "loss of one quarter of customer trust", "GDPR fine up to 4% of annual revenue"}
      rationale: |
        {2-3 lines tying the cost to a concrete business consequence — not abstract}
    likelihood:
      level: low | medium | high
      rationale: |
        {why this level — references QP target gap, inventory maturity, tech-stack age, vendor SLA, etc.}
    mitigation:
      action: |
        {concrete action — e.g. "Add read-replica failover for primary RDS, RPO target 60s"}
      owner_role: architecture | engineering | security | compliance | product | ops
      when: pre-launch | iter-1 | iter-2 | continuous
      delivery_cost: low | medium | high
    residual_risk: |
      {what remains after mitigation — NEVER zero, never "fully mitigated"}
    driver_refs:                                  # at least one
      - artifact: refined_qp | logical | physical | tech_stack | inventory | epic | project_profile
        reference: {artifact path or internal id (component id, characteristic, entry id, epic id)}
    discovered_by:
      scan: logical_cycles | physical_single_region | physical_saas_lockin | tech_eol | tech_bleeding_edge | inventory_stm_research | qp_unmet_target | epic_failure_scenario | compliance_pattern | agent_pattern_match
      detail: {how this risk was surfaced}
```

**Schema rules:**
- Every risk has `id`, `risk_statement`, at least one `trigger_conditions[]` bullet, all `business_cost` subfields non-empty, all `likelihood` subfields non-empty, all `mitigation` subfields non-empty, `residual_risk` non-empty, at least one `driver_refs[]` entry with both `artifact` and `reference`, and `discovered_by.scan` matching one of the listed scans.
- `residual_risk` MUST NOT match the deny-list: empty, "none", "no residual", "fully mitigated", "eliminated", or similar.

### Decision manifest

One YAML file at `{decision_manifest_path}` with one entry per risk.

```yaml
manifest:
  skill: derive-technical-risks
  written_at: {ISO 8601 timestamp}
  decisions:
    - decision_id: TR-001
      decision_type: risk_identification
      tier: high | mid | low
      grounding_source:
        kind: deterministic_trigger | grounded_pattern_match | agent_hunch
        citation: {SLA URL | EOL announcement | regulation cite | KB quality file | prior decision_manifest entry}
      recommendation: {summarized risk + mitigation}
      alternatives_considered:                    # alternative mitigations
        - option: ...
          why_rejected: ...
      agent_reasoning_summary: |
        {2-4 lines of prose}
      non_obvious: true | false
      user_response: accept | override | orbit | pending
      user_response_detail: {free text — null when pending}
```

Tier resolution:
- `high` — risk has a deterministic trigger: a vendor SLA cap, an EOL date, a regulatory floor, a published CVE relevant to a chosen tech.
- `mid` — risk emerged from agent pattern-matching across artifacts with grounded reasoning (KB knowledge/quality match, prior-decision-manifest mid/low tier carried forward).
- `low` — risk is the agent's hunch with no grounding source; surfaces one-by-one for explicit user confirmation.

## Process

### 1. Read inputs

- Parse `refined_qp_path` → characteristics, targets, delta_log.
- Glob `inventory_dir/*.md` → frontmatter for each (id, origin, kb_version_sha when kb, capabilities_served, sub_systems).
- Parse `logical_path` → components, edges (with sync_mode).
- Parse `physical_path` → components (deployment_target, resources, comms, nfr_delivery).
- Parse `tech_stack_path` → entries (category, name, version, source_type).
- Glob `epics_dir/*.yaml` → each epic's `failure_conditions[]` and `constraints[]`.
- Parse `project_profile_path` → `compliance[]`, `sla_commitments[]`, `team_skills[]`, `incumbent_tech[]`.
- Glob `kb_quality_dir/**/*.md` → catalog of well-known failure modes per ISO 25010 dimension.
- Glob `prior_decision_manifests_dir/decision-manifest-*.yaml` if present → entries with `tier: mid` or `tier: low`.

### 2. Validate pre-conditions

This skill is STAGE-LAST. It MUST NOT run unless every prior stage's artifact is present:

- `refined_qp_path`, `logical_path`, `physical_path`, `tech_stack_path` all exist and parse cleanly.
- `inventory_dir` is non-empty.

Missing any → halt with `what_failed: stage_order_violation` and the missing artifact path.

### 3. Scan 1 — logical_cycles

Walk `logical-architecture.yaml.components` and inspect `outbound_edges[]`. For each edge with `sync_mode: async` that breaks a cycle (identified by re-running cycle detection without the async-break rule and finding a cycle that this async edge intercepts):

- Surface a risk: the async edge is a fragility hot spot. If the async semantics drift back to sync during implementation, the cycle re-introduces a deadlock or amplification loop.
- driver_refs: `{ artifact: logical, reference: {edge.from → edge.to} }`.
- discovered_by.scan: `logical_cycles`.
- Suggested mitigation: explicit acceptance criteria in `prepare` for the async semantics; runtime check.

### 4. Scan 2 — physical_single_region / physical_saas_lockin

Walk `physical-architecture.yaml.components`:

- **Single-region risk**: deployment_target with `availability: single-az` OR no multi-region equivalent component for a `one-to-one` cardinality component, AND the refined QP carries a reliability target ≥ 99.9% OR an availability characteristic with `relevance: high`.
- **SaaS lock-in risk**: deployment_target with `kind: saas` AND no alternative vendor component AND the vendor's published SLA ≤ the refined QP reliability target.
- driver_refs: `{ artifact: physical, reference: component_id }` plus `{ artifact: refined_qp, reference: characteristic }`.
- discovered_by.scan: `physical_single_region` or `physical_saas_lockin`.

### 5. Scan 3 — tech_eol / tech_bleeding_edge

Walk `tech-stack.yaml.entries`:

- **EOL risk**: an entry with `category: language | runtime | framework` whose `name + version` matches a known EOL date within 24 months of the play's run date. Source: KB `knowledge/tech/{stack}.md` where present, else agent web-research grounded.
- **Bleeding-edge risk**: an entry whose `version` is a major version released within the last 6 months AND the entry has `source_type: agent_default_with_user_approval` (no pin, no KB single-candidate).
- driver_refs: `{ artifact: tech_stack, reference: entry_id }`.
- discovered_by.scan: `tech_eol` or `tech_bleeding_edge`.

### 6. Scan 4 — inventory_stm_research

Glob inventory files with `origin: stm_research`. Each is a maturity risk: the system has no KB grounding yet for this product's role.

- Risk magnitude scales with the system's centrality (count of capabilities_served and component placements).
- Mitigation: schedule a /enrich promotion path for the stm_research entry once it's been exercised in implementation.
- driver_refs: `{ artifact: inventory, reference: system_id }`.
- discovered_by.scan: `inventory_stm_research`.

### 7. Scan 5 — qp_unmet_target

Walk `refined_qp_path` against `physical_path.nfr_delivery[]`:

- For each refined-QP characteristic, find the matching `nfr_delivery[]` entries.
- If the matching nfr_delivery entry's mechanism was decided at `tier: mid` or `tier: low` in `decision-manifest-derive-physical-architecture.yaml` (look up via prior_decision_manifests), surface a risk: the delivery mechanism is less grounded; the target may not actually be hit.
- If the mechanism has `source_type: agent_default_with_user_approval`, that's a stronger signal.
- driver_refs: `{ artifact: refined_qp, reference: characteristic }` plus `{ artifact: physical, reference: component_id }`.
- discovered_by.scan: `qp_unmet_target`.

### 8. Scan 6 — epic_failure_scenario

Walk every epic's `failure_conditions[]`. For each failure condition:

- Determine whether the condition has been addressed by the architecture: does a logical edge, a physical nfr_delivery entry, or a tech-stack pattern explicitly handle the failure mode?
- If NOT addressed, the failure condition becomes a risk: the architecture doesn't yet cover this failure mode.
- driver_refs: `{ artifact: epic, reference: epic_id + failure_condition_id }` plus whichever architecture artifact would be the place to address it.
- discovered_by.scan: `epic_failure_scenario`.

### 9. Scan 7 — compliance_pattern

Walk `project_profile.compliance[]`. For each named regulation (HIPAA, PCI-DSS, GDPR, SOC 2, SOX, etc.):

- Match the regulation against KB `knowledge/quality/security/` and `knowledge/quality/operations/` files for known compliance failure modes (e.g., HIPAA breach notification windows; PCI scope creep; GDPR data residency; SOC 2 evidence collection).
- For each known failure mode that the current architecture has not explicitly addressed, surface a risk.
- driver_refs: `{ artifact: project_profile, reference: compliance[] entry }`.
- discovered_by.scan: `compliance_pattern`.

### 10. Scan 8 — agent_pattern_match

Walk KB `knowledge/quality/**/*.md` (architecture, backend, frontend, data, performance, security, operations, tech-debt files). For each well-known failure mode catalogued there:

- Agent reasons whether the product's locked design exhibits the mode. Examples:
  - "N+1 query risk" → check tech-stack for ORM choice + physical for high-throughput components serving aggregated views.
  - "Cache stampede" → check for caches in physical + load profile.
  - "Hot key" → check for sharding decisions in physical.
  - "Cascading failure" → check for circuit breakers in tech-stack patterns.
- When a match is found AND the architecture has no explicit mitigation, surface a risk.
- driver_refs: `{ artifact: kb_quality, reference: kb file path }` plus whichever architecture artifact is the mitigation surface.
- discovered_by.scan: `agent_pattern_match`.

### 11. Deduplicate and consolidate

After Scans 1-8, merge overlapping risks:

- Two scans surfacing the same root cause → one consolidated risk with both `driver_refs[]` entries and a combined `discovered_by.scan` recorded as the strongest scan kind (deterministic > grounded > hunch).
- Two risks with the same mitigation → merge into one risk with combined trigger_conditions.

### 12. Calibrate business_cost and likelihood

For each risk, the agent calibrates:

- **business_cost.magnitude** scaled by:
  - regulatory exposure (compliance risks lean catastrophic).
  - revenue dependency (a risk affecting the primary monetization flow leans high).
  - reputation surface (consumer-facing failure modes lean medium-high).
  - operational vs. external (internal-only operational risks lean low-medium).
- **business_cost.cost_estimate**: prose with concrete figures when possible. "GDPR Article 83 — up to 4% annual revenue" beats "high fine risk".
- **likelihood.level** scaled by:
  - deterministic trigger present (SLA cap, EOL date, regulatory deadline) → high.
  - grounded pattern match (KB quality file applies) → medium.
  - agent hunch (no source) → low.

### 13. Write outputs

Write `{output_path}` with `risks[]`. Write `{decision_manifest_path}` with one entry per risk. All `user_response` start as `pending`.

### 14. Validate output

- Schema rules from the Output section all hold.
- Every risk has all required subfields populated and non-empty.
- No risk's `residual_risk` matches the zero-residual deny-list.
- Every `driver_refs[]` entry resolves to a real artifact path or internal id.
- Decision manifest complete with one entry per risk.

## Output Contract

On success:

```json
{
  "status": "success",
  "skill": "derive-technical-risks",
  "outputs": {
    "risks_path": "{product_base}architecture/technical-risks.yaml",
    "decision_manifest_path": "{product_base}architecture/decision-manifest-derive-technical-risks.yaml",
    "risk_count": <int>,
    "by_tier": { "high": <int>, "mid": <int>, "low": <int> },
    "by_scan": { "logical_cycles": <int>, "physical_single_region": <int>, "...": <int> },
    "by_magnitude": { "catastrophic": <int>, "high": <int>, "medium": <int>, "low": <int> }
  }
}
```

On failure:

```json
{
  "status": "failure",
  "skill": "derive-technical-risks",
  "what_failed": "stage_order_violation | missing_input | risk_missing_fields | residual_zero_claim | driver_ref_unresolved | manifest_incomplete",
  "details": "..."
}
```

## Evals

| Eval | Failure Bound | Check |
|------|---------------|-------|
| TR-1 | F11 (risk missing fields) | Every risk has id, risk_statement, ≥1 trigger_conditions, all business_cost subfields, all likelihood subfields, all mitigation subfields, residual_risk, ≥1 driver_refs, discovered_by.scan — all non-empty. |
| TR-2 | F11 (stage order) | All five prior arch artifacts (refined_qp, inventory, logical, physical, tech_stack) exist; the skill did NOT run when any was missing. |
| TR-3 | F11 (residual zero) | No `residual_risk` matches the deny-list (empty, "none", "no residual", "fully mitigated", "eliminated", "n/a"). |
| TR-4 | F11 (driver_ref resolution) | Every `driver_refs[].reference` resolves to a real path under product or repo, or a real id in the referenced artifact. |
| TR-5 | Discovery breadth | At least 6 of the 8 discovery scans contributed at least one candidate risk (before deduplication). When fewer, the agent must justify in the decision manifest why a scan produced nothing. |
| TR-6 | F16 (manifest missing/malformed) | Decision manifest exists with one entry per risk; every entry has decision_id, decision_type, tier, grounding_source, recommendation, alternatives_considered. |
| TR-7 | F13 (source_type discipline) | No decision has `grounding_source.kind: agent_default_unilateral`. |

## Constraints

- Writes ONLY to `{output_path}` and `{decision_manifest_path}`. Read-only on every input.
- MUST run LAST — halts if any of Stages 1-5 is missing its artifact.
- NEVER claims a risk is fully mitigated. Residual is always non-empty.
- NEVER invents driver_refs — every reference resolves to a real artifact or id.
- Respects C18/C19 surfacing tiers — low-tier risks surface one-by-one.

## Failure modes

- `stage_order_violation` — one or more of refined_qp_path, inventory_dir, logical_path, physical_path, tech_stack_path is missing.
- `missing_input` — required input path absent.
- `risk_missing_fields` — a risk entry lacks one or more required subfields.
- `residual_zero_claim` — a risk entry's `residual_risk` matches the zero-residual deny-list.
- `driver_ref_unresolved` — a driver_refs entry references a path or id that does not exist.
- `manifest_incomplete` — decision manifest missing or any entry lacks required fields.
