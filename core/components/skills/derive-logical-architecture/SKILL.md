---
name: derive-logical-architecture
description: Stage 3 skill of /arch. Builds the layered logical architecture for a product by selecting components from the systems inventory, placing each in a layer of the product-locked layer model, wiring edges with sync/async intent, detecting cycles, and validating end-to-end traceability of every selected capability from the user-facing entry layer to a serving component. Logical names systems by their inventory ID and role — never by product, runtime, language, protocol, or schema.
version: 1.0.0
user-invocable: false
deprecated: true
deprecated_note: '#434 ProductOS realignment — superseded by the command model; retained for Phase E reference, not installed'
---

# derive-logical-architecture

> **Decision Surfacing Discipline:** This skill emits a `decision-manifest-derive-logical-architecture.yaml` alongside its primary artifact. Every inferred decision — layer model selection (when not pinned), component placement, edge sync-mode, capability-to-component assignment — is recorded with tier, grounding source, recommendation, and alternatives. The orchestrator drives the tiered surfacing flow after this skill completes.

Called by `tech-architect` during `arch` Stage 3. Produces `logical-architecture.yaml` at `{product_base}architecture/logical-architecture.yaml` plus a decision manifest.

## Purpose

Build the layered, tech-agnostic structural view of the product. Every component IS a system or sub-system from the systems inventory written by Stage 1 — components are SELECTED, not invented. Every component lives in exactly one layer of the layer model that the play locks at Stage 3 opening. Cycles between components are forbidden. Every capability in scope has at least one end-to-end path through layers from the user-facing entry layer to a component whose system_ref serves it.

This artifact is the anchor every later stage references. Physical components reference component IDs from here, tech-stack scopes pick to component IDs from here, and technical risks cite components and their edges. Logical is structure; tech and runtime detail belong elsewhere.

**Differences from the prior version of this skill (model change in #403):**
- Components are now SELECTED from inventory, not invented at logical-time. Every component has `system_ref` (and optional `sub_system_ref`) resolving to an inventory entry.
- Every component now carries a `layer` field from the locked layer model.
- The bounded-contexts primitive is removed — layers + system grounding cover the same need.
- Edges carry sync_mode (sync | async | hybrid) as design intent.
- Cycle detection is a hard validation gate.
- End-to-end traceability is a hard validation gate.
- ADRs are no longer embedded in an `adr_log` block — decision-manifest entries flagged non-obvious are the trail.

## Input

Receive from the `tech-architect` agent. All paths resolve against `{product_base}` and `{ltm_base}` supplied by the play via JSON contract.

- `inventory_dir` (path, required) — `{product_base}architecture/systems-inventory/`. The set of systems and sub-systems components MUST be selected from.
- `refined_qp_path` (path, required) — `{product_base}architecture/quality-profile.yaml`. Stage 2 output. May influence component splits when a QP target demands independent failure domains or scaling units.
- `scope_path` (path, required) — `{product_base}scope/scope.yaml`. When missing under C1 soft pre-flight, read `{product_base}specification/capabilities-stand-in.yaml` instead.
- `enriched_capabilities_path` (path, optional) — `{product_base}scope/garura:enriched-capabilities.yaml`.
- `epics_dir` (path, required) — `{product_base}scope/epics/`.
- `design_spec_path` (path, optional) — `{product_base}experience/design-spec.md`. Flow context for edge wiring.
- `flows_dir` (path, optional) — `{product_base}experience/flows/`. User flows describe cross-component journeys.
- `personas_path` (path, optional) — `{product_base}experience/personas.md`.
- `project_profile_path` (path, required) — `{product_base}user-provided/project-profile.yaml`. `layer_model` pin authoritative; `grounded_tools.components[]` pins authoritative.
- `kb_layer_models_dir` (path, required) — `{ltm_base}components/memory/knowledge/arch/layer-models/`. Blueprint layer models surfaced when no pin.
- `output_path` (string, required) — `{product_base}architecture/logical-architecture.yaml`.
- `decision_manifest_path` (string, required) — `{product_base}architecture/decision-manifest-derive-logical-architecture.yaml`.
- `grounding_questions_path` (string, required) — `{product_base}user-provided/grounding-questions.md`. Append-only for multi-candidate halts.

## Output

### Logical architecture

YAML at `{output_path}`.

```yaml
layer_model:
  source: project_profile_pin | kb_blueprint | user_authored
  source_citation: {profile slot | kb file path | checkpoint id}
  layers:
    - id: experience           # kebab-case
      name: {Human-readable name}
      role: |
        {one or two lines describing what kind of components live in this layer}
      order: 1                 # ascending from entry layer; integer
      is_entry: true           # exactly ONE layer in the model has is_entry: true
    - id: process
      name: ...
      role: ...
      order: 2
      is_entry: false
    - id: systems
      ...

components:
  - id: order-orchestrator     # kebab-case, unique within components[]
    name: Order Orchestrator
    layer: process              # MUST be one of layer_model.layers[].id
    system_ref: shopify-functions  # MUST resolve to an inventory file id at {inventory_dir}{system_ref}.md
    sub_system_ref: null        # when set, MUST resolve to a sub_systems[].id inside that inventory file
    responsibilities:
      - {one bullet per primary responsibility}
    capability_ids:
      - {capability_id from scope.selected_capabilities — at least one}
    inbound_edges:
      - from: web-experience    # another component id; the playload-bearing trace
    outbound_edges:
      - to: inventory-api
        sync_mode: sync | async | hybrid
        rationale: {one line — why this mode}
    driver_epics:
      - {epic id citing this component}
    driver_capabilities:
      - {capability id citing this component}
```

**Validation rules baked into the schema:**
- Exactly one layer in `layer_model.layers[]` has `is_entry: true`.
- `layer_model.layers[].order` values are unique positive integers.
- Every component's `layer` matches a layer id in `layer_model.layers[]`.
- Every component's `system_ref` matches a file id under `inventory_dir`. When `sub_system_ref` is non-null, it matches a `sub_systems[].id` inside that inventory file's frontmatter.
- Every component has at least one `capability_id`.
- Every inbound_edges.from references a real component id in this file.
- Every outbound_edges.to references a real component id in this file. Self-edges are forbidden.

### Decision manifest

One YAML file at `{decision_manifest_path}` with entries for:
- Layer model selection (when not pinned) — one entry, decision_type: `layer_model_selection`.
- Each component placement — one entry per component, decision_type: `component_placement`.
- Each outbound edge with sync_mode — one entry per edge, decision_type: `edge_sync_mode`.

```yaml
manifest:
  skill: derive-logical-architecture
  written_at: {ISO 8601 timestamp}
  decisions:
    - decision_id: LA-001
      decision_type: layer_model_selection | component_placement | edge_sync_mode
      tier: high | mid | low
      grounding_source:
        kind: project_profile_pin | kb_blueprint | upstream_artifact | user_direct_answer | agent_default_with_user_approval
        citation: {profile slot | kb file path | upstream path | checkpoint id | grounding-question id}
      recommendation: {summarized decision}
      alternatives_considered:
        - option: {alt}
          why_rejected: {one line}
      agent_reasoning_summary: |
        {2-4 line prose}
      non_obvious: true | false           # true when alternatives existed AND the choice narrows future paths (treats this entry as an ADR)
      user_response: accept | override | orbit | pending
      user_response_detail: {free text — null when pending}
```

Entries with `non_obvious: true` are the architectural decision record for downstream consumers. No separate `adr_log` block is emitted.

## Process

### 1. Read inputs

- Glob `inventory_dir/*.md` → parse each frontmatter into a system catalog with id, capabilities_served, sub_systems[]. Reject if `inventory_dir` is empty (Stage 1 must run first).
- Parse `refined_qp_path` → characteristic targets that may force component splits.
- Parse `scope_path` (or stand-in) → selected_capabilities[].
- Parse `enriched_capabilities_path` if present, every file under `epics_dir`, `design_spec_path` if present, every file under `flows_dir` if present, and `personas_path` if present.
- Parse `project_profile_path` → check `layer_model` pin and `grounded_tools.components[]` pins.
- Glob `kb_layer_models_dir/*.md` → blueprint layer models for surfacing if no pin.

### 2. Validate pre-conditions

- `inventory_dir` is non-empty and at least one inventory file claims a capability in `selected_capabilities`. Otherwise → `what_failed: empty_inventory_for_scope`.
- Required inputs exist OR documented stand-in exists.

### 3. Establish the layer model

In order, take the first path that resolves:

1. **Pin path.** If `project_profile.layer_model` carries an inline layers definition or a `kb_blueprint_ref`, use it. When a blueprint ref, copy the blueprint into `layer_model.layers[]` and tag `source: project_profile_pin`.
2. **Single blueprint path.** When no pin but only one blueprint exists in `kb_layer_models_dir`, use it. Tag `source: kb_blueprint`, citation = blueprint file path.
3. **Multi blueprint path.** When multiple blueprints exist and no pin, halt this slot. Append `Q-arch-NNN` to `grounding_questions_path` listing each blueprint's name and one-line summary. Tag a decision manifest entry `tier: mid`, `grounding_source.kind: kb_catalog_multi_candidate_user_approved`, `user_response: pending`. The orchestrator surfaces at Stage 3 checkpoint.
4. **No blueprint path.** When no pin and no blueprints, halt with `what_failed: no_layer_model_source`. The user must author one or add a blueprint to KB — the skill does NOT fabricate a layer model.

Once the model is in hand, validate: exactly one `is_entry: true`, unique `order` integers, all `id` values kebab-case.

### 4. Walk capabilities and select components

For each capability in `selected_capabilities`, in order:

1. **Pin check.** If `project_profile.grounded_tools.components[]` carries an entry for this capability with a component id and system_ref, use it. Skip the search.
2. **Inventory match.** Find every inventory entry (system or sub-system) whose `capabilities_served` includes this capability id. For each match:
   - Decide whether the match represents one component or several. A single system serving multiple capabilities through one cohesive surface = one component. A system whose sub_systems[] declare capability-distinct surfaces = one component per sub_system_ref (when those sub-systems serve different capabilities or carry materially different responsibilities).
   - Assign each chosen component to a layer per role:
     - Components whose system serves user-facing surfaces (web, mobile, channel) → entry layer.
     - Components whose system is a system-of-record (ERP, CRM, identity, payment gateway) → systems-of-record layer (whichever is the bottom-most layer in the model).
     - Components whose system orchestrates or composes other components → process / orchestration layer (middle of the model).
     - Components whose system delivers cross-cutting concerns (auth, observability, search) → AOP or cross-cutting layer per the model.
3. Record each placement as a decision-manifest entry. Tier resolution:
   - `tier: high` when grounding is a pin or a single inventory match AND the role-to-layer mapping is unambiguous per the blueprint.
   - `tier: mid` when role-to-layer mapping required agent reasoning (e.g., a system could plausibly sit in two layers).
   - `tier: low` when multiple inventory entries serve the same capability and the agent had to pick AND the user hasn't been asked.

### 5. Wire edges with sync_mode

For each pair (caller-component, callee-component) implied by the design flows OR by the responsibility graph (caller depends on callee to fulfill its capability):

- Add the caller's id to callee's `inbound_edges[]`.
- Add the callee's id to caller's `outbound_edges[]` with `sync_mode` and `rationale`.
- Sync_mode resolution:
  - `sync` is the default for request-response within a single user-perceived transaction.
  - `async` when the design flow shows fire-and-forget intent, when the callee is a write-side projection / event-sourced store, or when a QP target (independent failure domain, latency budget) demands decoupling.
  - `hybrid` when the design flow has both a sync acknowledgement and an async follow-on (e.g., accept-then-process).
- Record one decision-manifest entry per edge with sync_mode. Tier resolution:
  - `tier: high` when the design flow explicitly indicates the mode.
  - `tier: mid` when QP-derived (e.g., reliability target forces async).
  - `tier: low` when neither — agent default; user must approve.

### 6. Cycle detection

Build a directed graph from outbound_edges[]. Run DFS from each component, tracking the recursion stack. Any back-edge is a cycle.

When a cycle is detected:
- Identify the cycle's component set and the offending edges.
- Halt with `what_failed: cycle_detected` and structured details (cycle path, candidate breaks: remove edge A→B, split component X, convert edge A→B to async to break the synchronous-cycle restriction).
- Per F5 (recovery REC5 is human-handoff), the orchestrator surfaces to the user with the candidate breaks — the skill does NOT pick the break unilaterally.

Note: an async edge in a cycle is NOT a cycle for runtime purposes — physical can deliver an async edge such that the cycle is broken at runtime. The skill encodes this by treating any cycle that has at least one `sync_mode: async` edge in the path as acceptable at the logical level (it still counts as a logical edge, but the cycle alert is suppressed). Synchronous-only cycles halt.

### 7. End-to-end traceability

For each capability in `selected_capabilities`, run a graph traversal from every entry-layer component (components whose `layer.is_entry == true` and which lists the capability in `capability_ids[]`) along outbound_edges[] toward components that serve the capability. If no path reaches a component whose `system_ref` (or `sub_system_ref`) serves the capability, the capability is orphaned.

A capability with no entry-layer component listing it is ALSO orphaned (no entry into the system for that capability).

Orphans halt with `what_failed: capability_orphan` and a structured list per orphaned capability id.

### 8. Write outputs

Write `{output_path}` with `layer_model`, `components[]`, and the embedded edges. Write `{decision_manifest_path}` with one entry per decision recorded in Steps 3-5. All `user_response` start as `pending`.

### 9. Validate output

Before returning:
- Schema rules from the Output section all hold (layer model, component fields, edge references).
- No component name, responsibility, or rationale contains tech tokens. Run a deny-list check against: programming language names (JavaScript, Python, Go, etc.), product names (PostgreSQL, Redis, Kafka, etc.), protocol identifiers (REST, gRPC, MQTT, etc.), wire format identifiers (JSON, Protobuf, XML, etc.), and SDK / library names. Any hit → `what_failed: tech_token_in_logical`.
- Decision manifest is complete (one entry per layer-model selection / component placement / edge sync_mode), every entry has all required fields.

## Output Contract

On success:

```json
{
  "status": "success",
  "skill": "derive-logical-architecture",
  "outputs": {
    "logical_path": "{product_base}architecture/logical-architecture.yaml",
    "decision_manifest_path": "{product_base}architecture/decision-manifest-derive-logical-architecture.yaml",
    "layer_model": { "source": "...", "layer_count": <int> },
    "component_count": <int>,
    "edge_count": <int>,
    "decisions_count": <int>,
    "halted_slots": [
      { "kind": "layer_model | capability_component | edge_sync_mode", "reference": "...", "grounding_question_id": "Q-arch-NNN" }
    ]
  }
}
```

On failure:

```json
{
  "status": "failure",
  "skill": "derive-logical-architecture",
  "what_failed": "missing_input | empty_inventory_for_scope | no_layer_model_source | cycle_detected | capability_orphan | tech_token_in_logical | unresolved_system_ref | manifest_incomplete",
  "details": "..."
}
```

## Evals

| Eval | Failure Bound | Check |
|------|---------------|-------|
| LA-1 | F3 (component missing system_ref/layer/capability_ids) | Every component has non-null `system_ref`, `layer` matching a layer in `layer_model.layers[]`, and at least one `capability_id`. |
| LA-2 | F23 (system_ref not in inventory) | Every component's `system_ref` resolves to an inventory file id; non-null `sub_system_ref` resolves to a `sub_systems[].id` inside that file. |
| LA-3 | F2 (logical contains tech tokens) | No component name, responsibility, edge rationale, or layer role text matches the tech-token deny-list. |
| LA-4 | F5 (cycle in logical) | The graph of components and `outbound_edges[]` (counting any edge with `sync_mode: sync` and `sync_mode: hybrid` for graph purposes; ignoring `sync_mode: async` edges) is acyclic. |
| LA-5 | F4 (capability without component or no E2E path) | Every selected capability has at least one entry-layer component listing it AND at least one graph path from that entry-layer component to a serving component. |
| LA-6 | F21 (layer model issues) | `layer_model.layers[]` has exactly one `is_entry: true`, unique `order` values, kebab-case ids; every component's `layer` field matches a layer id. |
| LA-7 | F16 (manifest missing/malformed) | Decision manifest exists with one entry per inferred decision (layer model selection when not pinned, component placement, edge sync_mode); every entry has decision_id, decision_type, tier, grounding_source, recommendation, alternatives_considered, non_obvious. |
| LA-8 | F13 (source_type discipline) | No decision has `grounding_source.kind: agent_default_unilateral`. |

## Constraints

- Writes ONLY to `{output_path}`, `{decision_manifest_path}`, and (for multi-candidate halts) appends to `{grounding_questions_path}`.
- Read-only on `inventory_dir`, `refined_qp_path`, every scope/epics/design input, `project_profile_path`, and `kb_layer_models_dir`.
- NEVER names a product, runtime, protocol, wire format, programming language, library, or schema column. Tech-token deny-list is enforced at Step 9.
- NEVER invents a component. Every component MUST resolve to an inventory entry. If no inventory entry serves a needed capability, halt — return to Stage 1.
- NEVER picks a cycle break unilaterally. Cycle detection halts with candidate breaks for user decision (F5 / REC5 human handoff).
- NEVER picks a layer model unilaterally. No pin + no single blueprint = halt with candidate set for user pick (F21 / REC21 human handoff).
- Respects C18/C19 surfacing tiers and C20 multi-candidate halt.

## Failure modes

- `missing_input` — required input path absent and no stand-in.
- `empty_inventory_for_scope` — `inventory_dir` is empty or no inventory entry serves any selected capability.
- `no_layer_model_source` — no pin and no blueprints in `kb_layer_models_dir`.
- `cycle_detected` — synchronous-only cycle in the component graph.
- `capability_orphan` — a selected capability has no entry-layer component OR no graph path from entry to a serving component.
- `tech_token_in_logical` — component name, responsibility, edge rationale, or layer role text leaked a tech identifier.
- `unresolved_system_ref` — a component's system_ref or sub_system_ref does not resolve to an inventory entry.
- `manifest_incomplete` — decision manifest missing or any entry lacks required fields.
