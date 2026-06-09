---
name: extract-flow-spec
description: "Extract a structured flow-spec.yaml for a single user journey — a vertical thread that crosses multiple features and layers. Captures trigger, participating features in order, traversing aspects, stepwise {actor, action, system_effect}, success criteria, and failure paths. Every step cites source at file:line. Owned by tech-architect."
user-invocable: false
model: opus
allowed-tools: Read, Write, Grep, Glob, Skill
deprecated: true
deprecated_note: '#434 ProductOS realignment — superseded by the command model; retained for Phase E reference, not installed'
---

# extract-flow-spec

Owned by the `tech-architect` agent. Produces one `flows/{flow-id}.yaml` per user journey in the /decode target set.

## Purpose

Per /decode C4b, the flow stream captures verticality across features. A user journey like "visitor → signup → verify email → dashboard → first post publish" spans multiple features and multiple layers. Feature-spec extraction alone cannot see the thread — it sees each feature in isolation. This skill extracts the thread end-to-end, identifying the ordered features it traverses, the aspects that govern any step of it, and the concrete source locations that implement each step.

## Input

Receive via JSON contract from tech-architect.

- `flow_id` (string, required) — e.g., `FLOW-first-post-001`.
- `flow_metadata` (object, required) — trigger description, flow_kind (signup | checkout | publish | etc.), starting screen or endpoint.
- `participating_feature_ids` (list[string], required) — ordered list of features the flow is expected to traverse (sourced from experience/flows/* in LTM, or inferred at discovery time).
- `file_surface` (list[path], required) — union of participating features' file surfaces PLUS entry-point files (routes, controllers, top-level event handlers) that initiate the flow.
- `stacks_detected_path` (path, required).
- `temp_skills_dir` (path, required).
- `codebase_root` (path, required).
- `output_path` (path, required) — `{stm_base}/{issue}/evidence/decode/proposals/scope/flows/{flow-id}.yaml`.
- `ltm_context` (object, required).

## Process

### 1. Validate inputs

- Confirm file_surface entries exist and are readable.
- Confirm participating_feature_ids are non-empty and each has a feature-spec OR is in the currently-extracting batch (so its feature-spec will exist by aggregation time).

### 2. Trace the trigger

Locate the flow's starting point:
- For HTTP-initiated flows: the route handler matching the trigger endpoint.
- For UI-initiated flows: the component event handler matching the trigger action.
- For event-initiated flows: the event subscription or message consumer.

Dispatch the matching temp tech skill to read the trigger site. Record cited_locations at the trigger.

### 3. Walk the ordered steps

For each participating feature in order, dispatch the matching temp tech skill to read the handoff point — where control enters this feature from the previous step and where control exits to the next step. Produce a step entry:

```yaml
- step_id: "STEP-{flow_id}-{ordinal}"
  actor: "user | system | external_service"
  action: "<what happens, framework-agnostic prose>"
  system_effect: "<observable state change>"
  cited_locations:
    - { file, line_start, line_end, excerpt }
```

Handoffs between features are first-class: a step may be "system: record member creation and trigger welcome email dispatch" with cited_locations spanning the member-creation code AND the email-dispatch call.

### 4. Identify traversing aspects

For every step, inspect the surrounding context (decorators, middleware chain, route config) via the temp tech skill. Detect cross-cutting aspects applied to this step: auth, rate_limit, validation, error_envelope, logging, observability, idempotency, i18n, feature_flag. Collect into `traversing_aspects[]` at the flow level (deduplicated across steps).

The aspect_ids referenced here MUST match aspect_ids emitted by `extract-aspect-spec` for the same /decode run. At aggregation time, cross-links are validated; unresolved references surface as knowledge_gaps on the flow.

### 5. Capture success criteria

Identify the observable end state of the flow — what the user sees, what persistence occurs, what external side-effects fire. Express in framework-agnostic prose with cited_locations at the terminal step.

### 6. Capture failure paths

For the trigger and every step, enumerate alternative ends the source code allows:
- Validation rejection paths (input invalid → 4xx + error message).
- Authorization denial paths (403 + redirect).
- External-service failure paths (integration error → fallback behavior or user-facing error).
- Timeout paths (if time bounds are enforced).

Each failure path entry:

```yaml
- trigger: "<when this path fires>"
  outcome: "<observable result>"
  cited_locations: [...]
```

### 7. Detect ambiguities

Flow-level ambiguity forms: a step's asserted behavior (from an E2E test if one exists) disagrees with the source-traced behavior. Record in `ambiguities[]` with both citations. Do not silently resolve.

### 8. Assemble flow-spec.yaml

Emit at `output_path` conforming to C4b:

```yaml
meta:
  source_type: "extracted_from_code"
  confidence: "high | medium | low"
  evidence: [...]
  learning_category: "product"
  sub_category: null
  tier: 2 | 3   # set by aggregator
  flow_id: "{flow_id}"
  flow_kind: "{from metadata}"
trigger:
  description: "..."
  actor: "user | system | external_service"
  cited_locations: [...]
participating_features: ["{feature_id_1}", "{feature_id_2}", ...]   # in order
traversing_aspects: ["{aspect_id_1}", ...]
steps:
  - step_id: "STEP-{flow_id}-1"
    actor: "..."
    action: "..."
    system_effect: "..."
    cited_locations: [...]
  # ...
success_criteria:
  description: "..."
  cited_locations: [...]
failure_paths: [...]
ambiguities: [...]
knowledge_gaps: [...]
generated_tests_ref: []   # populated by generate-flow-tests later
```

### 9. Return contract

```yaml
flow_id: "{flow_id}"
spec_path: "{output_path}"
overall_confidence: "high | medium | low"
step_count: <int>
participating_feature_count: <int>
aspect_count: <int>
failure_path_count: <int>
ambiguity_count: <int>
status: "success"
```

## Output

Primary artifact: `flows/{flow-id}.yaml` at `output_path`.

## Failure Modes

```yaml
status: failure
what_failed: "trigger_not_locatable | orphan_feature_in_participating | step_handoff_unresolvable | extraction_budget_exhausted"
detail: "<specific>"
evidence: {...}
```

`trigger_not_locatable` means the flow's starting point could not be found in the file surface — a structural problem either in the flow definition or in the file surface scope. `orphan_feature_in_participating` means a feature in participating_feature_ids has no feature-spec and is not in the current extraction batch — the flow cannot cross-link to it.

## Notes

- Flow discovery (how does /decode know which flows to extract?) is out of scope for this skill. Source: user flows already documented in `{product_base}/experience/flows/*.md` (post-enrich) OR inferred from user-journey tests (E2E specs often encode a flow per test case) OR user-named via `--flow FLOW-ID`.
- Cross-stream linking is emitted empty here; the participating_features ordering is captured as given. Cross-link validation happens at aggregate-decode-proposals.
- Flow E2E test generation is a separate skill (generate-flow-tests). This skill records generated_tests_ref as an empty list for later population.
- When participating_feature_ids contains a feature NOT in the current /decode invocation (user ran /decode --flow X but omitted some of its features), the flow-spec records the orphan feature_id in knowledge_gaps and flow confidence drops to medium.
