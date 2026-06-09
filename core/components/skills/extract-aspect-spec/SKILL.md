---
name: extract-aspect-spec
description: "Extract a structured aspect-spec.yaml for a single cross-cutting concern (auth, authorization, rate_limit, validation, error_envelope, logging, observability, idempotency, i18n, feature_flag). Captures policy, decorator/middleware pattern, applies_to scope (routes, components, features), and bypass conditions. Every field cites source at file:line. Owned by tech-architect."
user-invocable: false
model: opus
allowed-tools: Read, Write, Grep, Glob, Skill
deprecated: true
deprecated_note: '#434 ProductOS realignment — superseded by the command model; retained for Phase E reference, not installed'
---

# extract-aspect-spec

Owned by the `tech-architect` agent. Produces one `aspects/{aspect-id}.yaml` per cross-cutting concern in the /decode target set.

## Purpose

Per /decode C4c, the aspect stream captures horizontal-ness — cross-cutting concerns that live between features rather than inside them. Feature-spec extraction can mention an aspect in passing but never captures the full policy (where it applies, how it is configured, how it is bypassed). Horizontal concerns like auth, rate-limiting, and error-envelope shape have their own specification because a migration must preserve their policy across the stack transform, not just the features they touch.

## Input

Receive via JSON contract from tech-architect.

- `aspect_id` (string, required) — e.g., `ASP-rate-limit-001`.
- `aspect_kind` (enum, required) — `auth | authorization | rate_limit | validation | error_envelope | logging | observability | idempotency | i18n | feature_flag | other`.
- `aspect_metadata` (object, required) — user-provided or discovery-inferred: a short description and any naming hints (e.g., for rate_limit: "express-brute", for auth: "JWT + passwordless").
- `registration_sites` (list[path], required) — files where the aspect is registered / mounted / applied (middleware registration, route decorators, HOC wrappers, annotation usages). Produced by a discovery pass upstream.
- `stacks_detected_path` (path, required).
- `temp_skills_dir` (path, required).
- `codebase_root` (path, required).
- `output_path` (path, required) — `{stm_base}/{issue}/evidence/decode/proposals/scope/aspects/{aspect-id}.yaml`.
- `ltm_context` (object, required).

## Process

### 1. Validate inputs

- Confirm every entry in `registration_sites` exists.
- Confirm `aspect_kind` is one of the canonical values (or `other` with aspect_metadata.kind_description populated).

### 2. Trace applies_to scope

Dispatch the matching temp tech skill for each registration_site to determine what the aspect is applied to:
- **Middleware-style application (Express, Koa, ASP.NET pipeline)**: walk the middleware chain; record route patterns the middleware intercepts.
- **Decorator / annotation (Spring, FastAPI, Ruby metaprogramming)**: find every method/class decorated; record full qualified names.
- **HOC / hook (React wrappers)**: find every component wrapped; record component names.
- **Config-declared (declarative auth in frameworks)**: parse the config; record the declared scope.

Produce:

```yaml
applies_to:
  routes: ["POST /api/signup", "POST /api/login", ...]
  components: ["SignupForm", ...]
  features: ["MEM-F001-signup", ...]   # cross-link to feature-specs
  cited_locations: [...]
```

The `features[]` list is populated by intersecting applies_to.routes/components with each feature-spec's file_surface and route/component lists. Unresolved intersections become knowledge_gaps.

### 3. Extract policy

Read the aspect's configuration / implementation to capture the policy. Policy shape depends on aspect_kind:

- **auth**: authentication scheme (bearer, cookie, session), identity provider, token validation rules, session lifetime.
- **authorization**: role/permission model, how roles are checked, default-deny or default-allow.
- **rate_limit**: limit (requests per window), window duration, storage backend, per-key strategy (IP, user, API key), response shape on limit exceeded.
- **validation**: validator library/pattern, where schemas live, how errors are reported.
- **error_envelope**: error response shape (code, message, details), HTTP status mapping, whether stack traces leak in dev vs prod.
- **logging**: logger library, log level defaults, structured fields, PII redaction rules.
- **observability**: tracing/metrics library, span/metric naming conventions, sampling.
- **idempotency**: idempotency-key header/pattern, storage of seen keys, replay behavior.
- **i18n**: locale resolution, translation file location, fallback chain.
- **feature_flag**: flag source (provider, config, env), evaluation point, default on/off.

Every policy field carries cited_locations.

### 4. Capture decorator_pattern

Describe HOW the aspect is applied in this codebase:

```yaml
decorator_pattern:
  style: "express_middleware | spring_annotation | react_hoc | config_declarative | custom"
  description: "Middleware registered globally at router-mount time with bypass by sub-path"
  cited_locations: [...]
```

Descriptive — captures the mechanism so migration can choose the new-stack equivalent.

### 5. Capture bypass_conditions

Enumerate every case where the aspect does NOT apply:
- Route whitelists (unprotected endpoints).
- Role-based exemptions (admins bypass rate limits).
- Environment-based differences (dev-only bypass).
- Explicit feature-flag-gated bypass.

Every bypass entry carries cited_locations.

### 6. Detect ambiguities

Aspect-level ambiguities typically surface when the declared policy (config file) disagrees with the observed policy (code path that enforces it). Example: config says `rate_limit: 100/min` but the enforcement code uses `100/hour`. Record with both citations; do not silently resolve.

### 7. Assemble aspect-spec.yaml

Emit at `output_path` conforming to C4c:

```yaml
meta:
  source_type: "extracted_from_code"
  confidence: "high | medium | low"
  evidence: [...]
  learning_category: "product"
  sub_category: null
  tier: 2 | 3   # set by aggregator
  aspect_id: "{aspect_id}"
  aspect_kind: "{aspect_kind}"
applies_to:
  routes: [...]
  components: [...]
  features: [...]
  cited_locations: [...]
policy:
  # aspect_kind-specific structure per step 3
  cited_locations: [...]
decorator_pattern:
  style: "..."
  description: "..."
  cited_locations: [...]
bypass_conditions:
  - trigger: "..."
    cited_locations: [...]
ambiguities: [...]
knowledge_gaps: [...]
generated_tests_ref: []   # populated by test generation later (aspect-level tests where applicable)
```

### 8. Return contract

```yaml
aspect_id: "{aspect_id}"
aspect_kind: "{aspect_kind}"
spec_path: "{output_path}"
overall_confidence: "high | medium | low"
applies_to_count:
  routes: <int>
  components: <int>
  features: <int>
bypass_count: <int>
ambiguity_count: <int>
status: "success"
```

## Output

Primary artifact: `aspects/{aspect-id}.yaml` at `output_path`.

## Failure Modes

```yaml
status: failure
what_failed: "registration_sites_empty | policy_unparseable | aspect_kind_unknown | extraction_budget_exhausted"
detail: "<specific>"
evidence: {...}
```

## Notes

- Aspect discovery (what aspects exist in the codebase?) is upstream of this skill. Discovery emits a list of candidate aspects and their registration sites; this skill produces the structured spec for each candidate.
- The enumerated aspect_kinds (auth, rate_limit, etc.) are the canonical taxonomy. `other` is permitted when an aspect does not fit — its kind_description is captured in meta for reviewer judgment.
- Aspect-level tests (Tier A in generate-contract-tests, but aspect-scoped) verify the aspect's presence and behavior on a representative subset of applies_to targets — not every target. Aspect-test generation skills consume aspect-spec as input and produce one verification test per aspect_kind (e.g., one rate-limit test asserting the limit on one representative endpoint, not every endpoint).
- The applies_to.features cross-link is populated by intersecting routes/components with feature-specs. Cross-link validation happens at aggregate-decode-proposals; unresolved intersections are not this skill's problem.
