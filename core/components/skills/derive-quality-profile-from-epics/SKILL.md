---
name: derive-quality-profile-from-epics
description: Aggregate constraints and experiential warnings across all intent epics into an ISO 25010 characteristic-based quality profile with a risk register. Produces the quality-profile.yaml handoff artifact consumed by arch (214.7).
user-invocable: false
model: sonnet
allowed-tools: Read, Write, Glob
---

# derive-quality-profile-from-epics

> **Defect 23 — Decision Surfacing Discipline (DSD):** This skill emits a `decision-manifest.yaml` alongside its primary artifact. Every inferred decision produced during execution is recorded in the manifest with tier, grounding source, recommendation, and alternatives. The orchestrator drives the tiered surfacing flow after this skill completes.

Model-invocable skill for deriving the product's quality profile from a validated intent-epic set. Called by `product-keeper` during `specify` Stage 6.

## Purpose

Intent epics carry per-capability constraints. The quality profile is the PRODUCT-level aggregation: what quality attributes does the system as a whole need to honor, and what are the measurable targets? ISO 25010 provides the standard characteristic taxonomy. This skill walks every epic, collects constraints into the matching characteristic bucket, computes product-level targets, and builds the risk register.

## Input

Receive from product-keeper:
- `epics_dir` (path, required) — validated intent epics directory
- `project_profile_path` (path, required) — for profile-level NFR levels
- `validation_path` (path, required) — the validation result from validate-intent-epics (used to confirm all epics are passed before aggregation)
- `output_path` (string, required) — typically `.garura/product/specification/quality-profile.yaml`
- `decision_manifest_path` (path, required) — path for the `decision-manifest.yaml` output, written alongside the primary artifact (e.g., `.garura/product/specification/decision-manifest-derive-quality-profile.yaml`). Exact path is passed by the calling agent.

## Process

### 1. Pre-flight

- Read `validation_path`. If `status: failed`, abort with structured failure ("cannot derive quality profile from invalid epics").
- Load the project profile.

### 2. Initialize characteristic buckets

ISO 25010 defines 9 top-level characteristics. Initialize each as an empty aggregate:

- `functional_suitability` (completeness, correctness, appropriateness)
- `performance_efficiency` (time behavior, resource utilization, capacity)
- `compatibility` (co-existence, interoperability)
- `interaction_capability` (appropriateness recognizability, learnability, operability, user error protection, UI aesthetics, accessibility)
- `reliability` (maturity, availability, fault tolerance, recoverability)
- `security` (confidentiality, integrity, non-repudiation, accountability, authenticity)
- `maintainability` (modularity, reusability, analyzability, modifiability, testability)
- `flexibility` (adaptability, scalability, installability, replaceability)
- `safety` (operational constraint, risk identification, fail-safe, hazard warning, safe integration)

### 3. Walk every epic

Glob `{epics_dir}/epic-*.yaml`. For each:

- **Performance constraints** (`constraints.performance` → `performance_efficiency`). Parse the number + unit; if multiple epics have comparable targets, keep the strictest. Record the epic ID that sourced the target.
- **Security constraints** (`constraints.security` → `security`). Collect the named standards into a set; if any epic names `NIST 800-63B AAL3`, the product profile's security characteristic inherits that as the floor.
- **Accessibility constraints** (`constraints.accessibility` → `interaction_capability`). Take the strictest WCAG level across all epics (AAA > AA > A).
- **Compliance constraints** (`constraints.compliance` → routed by type: HIPAA/PCI-DSS/SOX → `security` + `safety`; GDPR → `security` + `interaction_capability`). Record each regulation.
- **Business rules** containing reliability language ("lockout", "retry", "failover") → `reliability`.
- **Hypothesis + success criteria** → `functional_suitability` (measurable outcomes prove functional correctness).

### 4. Build the risk register

Walk every epic's `kb_source.experiential_warnings` list. Dedupe. For each unique warning, create a risk entry:

```yaml
- id: RISK-<seq>
  description: "<the experiential warning>"
  source_epics: [<list of epic IDs that carry this warning>]
  severity: high | medium | low  # inferred from how many epics cite it (3+ = high)
  mitigation: "<extract from the epic's failure_scenarios if the warning matches one; else 'requires design review'>"
```

### 5. Derive the security profile

Separate from the `security` characteristic bucket, build a security profile table:

```yaml
security_profile:
  authentication:
    method: <derived from business_rules — password/MFA/SSO>
    strength: <standard-referenced level>
  authorization:
    model: <derived — RBAC/ABAC/flat>
  data_at_rest:
    encryption: <derived from compliance + business_rules>
  data_in_transit:
    encryption: <TLS version derived from security constraints>
  secrets_management:
    approach: <derived from business_rules if mentioned>
  audit_trail:
    coverage: <derived from UM-F008 presence or explicit audit business_rules>
  compliance_mandates: <list from compliance constraints across epics>
```

### 5b. Emit decision manifest

Before composing the quality profile artifact, write `decision-manifest.yaml` to `{decision_manifest_path}`.

Record every inferred decision produced during Steps 3–5. Assign tier at runtime based on grounding source: **high** when the decision was a direct match against a KB rule, file, or catalog entry; **mid** when context was built via web research; **low** when neither KB nor research yielded a grounding source.

**Decisions to record** (decision_id prefix: `D-dqp-`):

| decision_id | decision_type | What is being decided |
|-------------|---------------|-----------------------|
| `D-dqp-001` | `constraint-aggregation-pick` | When multiple epics cite different targets for the same performance dimension, which is selected as the product-level target and why the "strictest wins" aggregation logic is applied (Step 3) |
| `D-dqp-002` | `security-characteristic-ratchet` | Which epic's security constraint drives the product-level security characteristic floor (e.g., which epic named `NIST 800-63B AAL3`) and which did not, producing the ratchet (Step 3) |
| `D-dqp-003` | `risk-severity-inference` | For each risk entry, whether severity is classified `high`/`medium`/`low` based on how many epics cite the same experiential warning (threshold: 3+ = high) (Step 4) |
| `D-dqp-004` | `security-profile-derivation` | Which authentication method, authorization model, encryption level, and audit trail coverage are inferred from business_rules and compliance constraints across epics (Step 5) |

```yaml
schema_version: "1.0"
skill: "derive-quality-profile-from-epics"
generated_at: "{ISO8601}"
decisions:
  - decision_id: "D-dqp-001"
    decision_type: "constraint-aggregation-pick"
    tier: high | mid | low   # assign at runtime per grounding source
    grounding_source:
      kind: kb_path | web_citation | none
      ref: "{KB file path | URL | null}"
      excerpt: "{optional short quote when kind=kb_path}"
    recommendation: "{the selected strictest target and source epic}"
    alternatives_considered:
      - alt: "{relaxed target from another epic}"
        why_not: "{one-line dismissal reason}"
    agent_reasoning_summary: "{2-3 sentence explanation}"
    user_response: null
    user_response_detail: null
  # ... one entry per decision listed above
```

### 6. Compose the quality profile

```yaml
slug: <from project_profile.name>
status: DRAFT
created_at: <ISO-8601>
source_epics_count: <int>
source_epics:
  - <epic ID 1>
  - <epic ID 2>
  - ...
iso_25010_profile:
  functional_suitability:
    relevance: high | medium | low | not_applicable
    targets:
      - "<measurable outcome 1, sourced from epic X>"
    rationale: "<one sentence>"
  performance_efficiency:
    relevance: ...
    targets:
      - "p95 login latency < 500ms (source: EPIC-user-login-001)"
      - "..."
    rationale: ...
  compatibility: ...
  interaction_capability: ...
  reliability: ...
  security: ...
  maintainability: ...
  flexibility: ...
  safety: ...
security_profile:
  <as above>
risk_register:
  - id: RISK-001
    description: "..."
    source_epics: [...]
    severity: ...
    mitigation: ...
  - ...
handoff_notes:
  - "Consumers: arch (214.7) reads this file for architecture decision drivers"
  - "Every architectural decision should trace to at least one characteristic or risk"
```

### 7. Return output contract

```yaml
quality_profile:
  path: <written path>
  source_epics_count: <int>
  iso_25010_characteristics_populated: <int>  # out of 9
  characteristics_not_applicable: <int>
  risk_register_count: <int>
  security_profile_complete: true | false
decision_manifest:
  path: <written path>
  decisions_recorded: <int>
```

## Constraints

- NEVER derive quality profile from unvalidated epics. If the validation result is `failed`, abort.
- NEVER invent targets. Every target in the quality profile cites the source epic.
- NEVER leave the security profile blank for a characteristic — if no data exists, mark it `not_applicable` with explicit rationale.
- NEVER merge conflicting targets silently. If epic A says `p95 < 500ms` and epic B says `p95 < 200ms`, record both with the strictest as the product target and the source of the relaxation.
- ALWAYS classify every risk by severity based on how many epics cite it.
- ALWAYS produce a handoff_notes section pointing at the downstream consumer (arch).
- ALWAYS scope output to `{output_path}` — one file, no scattered artifacts.
- NEVER commit an inferred decision to the primary artifact (quality-profile.yaml) without recording it in `decision-manifest.yaml` first.
- NEVER tag a decision `tier: high` unless the `grounding_source.kind` is `kb_path` AND the referenced KB file exists.
- ALWAYS include `alternatives_considered` (≥1 entry) for every decision, even high-confidence ones.

## Version

| Field | Value |
|-------|-------|
| Version | 0.2.0 |
| Category | product-planning |
| Created | 2026-04-14 |
| Related | `core/components/skills/validate-intent-epics`, `core/components/plays/arch/` (consumer in 214.7), ISO/IEC 25010:2023 |
