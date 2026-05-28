# Architecture Rules

Canonical rules governing the six /arch artifacts (refined quality-profile, systems-inventory, logical-architecture, physical-architecture, tech-stack, technical-risks) and their decision manifests. Every skill in the `/arch` pipeline loads this file.

Consumers: `derive-systems-inventory`, `refine-quality-profile`, `derive-logical-architecture`, `derive-physical-architecture`, `derive-tech-stack`, `derive-technical-risks`, `validate-architecture-spec`, `tech-architect` agent, `tech-designer` agent.

**Model change in #403** — the prior shape produced `nfr-spec.yaml`, `quality-vision.yaml`, and `design-patterns.yaml` as separate artifacts. Those are gone:
- NFR targets live in the refined quality-profile; NFR delivery mechanisms live in `physical-architecture.yaml.components[].nfr_delivery[]`.
- Quality vision is folded into the refined quality-profile.
- Design patterns are produced as `category: pattern` entries in `tech-stack.yaml` (every pattern requires industry literature citation). System-level decisions (monolith / microservice / serverless) are patterns and live there too.

Two new artifacts are added: `systems-inventory/` (one file per system, sourced via KB pull-to-product or stm_research) and `technical-risks.yaml` (produced LAST, eight discovery scans, one entry per risk with business_cost / mitigation / residual_risk).

Components in logical and physical are SELECTED from the systems inventory — they are NOT invented at logical-time or physical-time. The layer model is a per-product input (project-profile pin OR user pick at Stage 3 from KB blueprints), not a global constant.

## Rule 1: Every Architectural Decision Has a Driver

**Every component, boundary, technology choice, and pattern in architecture.yaml cites the specific intent-epic, quality-profile characteristic, or cross-tree constraint that motivated it.**

Architecture is not a free-form diagram. Every decision traces back to a product need. If a decision has no driver, it's either dead code or a hidden assumption — both are failures.

Each component record carries:
- `driver_epics`: list of epic IDs that need this component
- `driver_quality_attributes`: list of ISO 25010 characteristics this component serves
- `driver_constraints`: list of constraints (performance, security, etc.) this component enforces

**Enforcement:** `validate-architecture-spec` rejects components without ≥1 driver in each category.

## Rule 2: Technology-Agnostic at the Spec Level

**architecture.yaml names components by their role, not their implementation technology.**

Correct: "authentication-service", "user-profile-store", "experiment-execution-queue"
Incorrect: "Node Auth Service", "PostgreSQL User DB", "SQS Job Queue"

Technology selection happens in a downstream implementation pass, informed by the quality standards. At the architecture-spec level, the structure is portable — swapping Postgres for Dynamo should not require a new architecture.yaml.

**Enforcement:** `validate-architecture-spec` blacklist check. Specific technology names in component IDs fail.

## Rule 3: Component Boundaries Align with Domains

**Components are organized by the domain-taxonomy modules they serve.**

A component cannot span domains without explicit cross-cutting justification (same rule as epic cross-cutting in `epics.md`). Authentication components live in the user-management cluster; plugin components live in the metrics-and-scoring cluster. Cross-cluster communication happens through named interfaces.

**Enforcement:** `validate-architecture-spec` cluster-boundary check.

## Rule 4: Refined Quality Profile Owns NFR Description; Physical Owns Delivery

**The refined `quality-profile.yaml` under architecture/ describes every NFR the product must hit (target, level, characteristic). The `physical-architecture.yaml` names the mechanism that delivers each one. No third artifact bridges the two — the bridge is gone in #403.**

For every characteristic in the refined QP with `relevance != not_applicable`, at least one `physical-architecture.yaml.components[].nfr_delivery[]` entry must name the mechanism (specific product / construct), cite the target reference, and explain how the mechanism delivers it.

**Enforcement:** `refine-quality-profile` writes the refined QP with delta_log. `derive-physical-architecture` writes `nfr_delivery[]` per component. `validate-architecture-spec` V8 fails when any QP characteristic with relevance != not_applicable has no matching nfr_delivery entry.

## Rule 5: Failure Scenarios Drive Reliability Architecture

**Every failure_scenario from every intent epic must be mapped to at least one architectural mitigation.**

The intent epic's failure_scenarios are the list of things the product has committed to handling. The architecture must name the component, pattern, or boundary that handles each one. An unmapped failure scenario is a hole in reliability.

**Enforcement:** `derive-logical-architecture` cross-references epics and requires coverage; `validate-architecture-spec` checks `failure_scenarios_mapped == failure_scenarios_total`.

## Rule 6: Security Posture Matches Highest Epic

**architecture.yaml's security posture equals the strictest security requirement across all intent epics.**

If one epic requires OWASP ASVS Level 3 and another requires Level 2, the architecture applies Level 3 globally. Security ratchets up to the maximum, never averages. This is the same ratchet rule as product.md Rule 4 at a different layer.

**Enforcement:** `refine-quality-profile` ratchets the security characteristic up only — a delta with `characteristic: security` AND `direction: loosened` is a structural violation. `validate-architecture-spec` V12 fails on any security loosening.

## Rule 7: Observability Is First-Class

**Observability is an NFR characteristic, not an afterthought. The refined quality-profile names what level of observability the product needs (maintainability / operability characteristic), and `physical-architecture.yaml` names the specific stack delivering it for each component via `nfr_delivery[]`.**

An unobservable component is a production liability. The refined QP must carry observability as a characteristic with target; physical must name the metrics/logs/traces sink (e.g., Datadog, Grafana + Prometheus, OpenTelemetry → CloudWatch) and the sampling rate for each component.

**Enforcement:** `validate-architecture-spec` V8 fails when the observability characteristic in the refined QP has no `nfr_delivery[]` entry naming the mechanism.

## Rule 8: No Premature Distribution

**Components are only split across processes or services when a quality-profile characteristic demands it.**

A microservice split is a decision, not a default. If the epics and quality profile can be served by a monolith, the architecture uses a monolith. Splits come from: independent scaling (performance efficiency), independent deployment (maintainability / flexibility), independent failure domains (reliability), or regulatory separation (security / compliance).

Every split in architecture.yaml must cite one of these drivers. Splits without a driver are over-engineering.

**Enforcement:** `derive-physical-architecture` records `logical_ref_cardinality` per component. When the cardinality is `one-to-many` (split) or `many-to-one` (collapse), `cardinality_rationale` MUST cite the driver. `validate-architecture-spec` V7 fails on missing rationale.

## Rule 9: Source-Type Discipline

**Every decision in architecture.yaml carries a `source_type` field declaring how the decision was reached, plus a `source_citation` field pointing at the evidence.**

Architecture is not an opinion. Every stack pick, every pattern, every component choice, every library pin, every version pin must be traceable to one of four legitimate sources:

| source_type | Meaning | source_citation form |
|-------------|---------|----------------------|
| `grounded_tools_pin` | `project-profile.grounded_tools` pinned this slot | `project-profile.grounded_tools.{slot_key}` |
| `kb_catalog_single_candidate` | KB catalog yielded exactly one legitimate candidate given the project-profile dimensions | `{kb_file_path} — {narrowing dimensions}` |
| `kb_catalog_multi_candidate_user_approved` | KB offered multiple candidates; user answered via `grounding-questions.md` | `Q-arch-NNN — {answer summary}` |
| `agent_default_with_user_approval` | Slot outside KB catalog; agent proposed a default and user approved at a checkpoint | `checkpoint:N — {approval summary}` |

A fifth value — `agent_default_unilateral` — is defined only as the validator's blocking target. Writing it to `architecture.yaml` is a schema violation.

**Grounded-tools pins are authoritative.** When `project-profile.grounded_tools` carries an entry for a slot, architecture.yaml MUST use that exact value. Overriding a pin is a blocking validation failure.

**Multi-candidate resolution requires a user answer.** When the KB catalog offers more than one legitimate candidate for a slot AND `grounded_tools` does not pin it, the derivation skill MUST append a Q-arch-NNN question to `.garura/product/user-provided/grounding-questions.md` and halt the slot. Silent multi-candidate resolution is a blocking failure.

**Enforcement:** `derive-systems-inventory`, `refine-quality-profile`, `derive-logical-architecture`, `derive-physical-architecture`, `derive-tech-stack`, and `derive-technical-risks` all walk the decision tree per slot and tag every output; `validate-architecture-spec` V13 / V14 reject any decision with `agent_default_unilateral`, missing `source_type`, a `grounded_tools` override, a mis-tagged `kb_catalog_single_candidate`, or an unapproved `kb_catalog_multi_candidate_user_approved`.

**Intent mapping:** arch intent.yaml constraints C18-C22 and failure conditions F13-F16.

## Related Rules

- `product.md` — quality profile aggregation (the source of architecture drivers)
- `features.md` — intent epic content (architecture reads epic constraints)
- `epics.md` — epic structure (architecture respects module boundaries)
