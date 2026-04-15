---
name: derive-architecture-spec
description: Read locked specify-product + design-exp artifacts and derive architecture.yaml with named technology choices, component boundaries, data model, API surface, deployment shape, and ADR log. Every decision carries a cited driver from the upstream artifacts.
user-invocable: false
model: opus
allowed-tools: Read, Write, Glob, Grep, WebSearch, WebFetch
---

# derive-architecture-spec

Called by `tech-architect` during `build-arch` Stage 1. Produces `architecture.yaml` at `.meridian/product/architecture/architecture.yaml`.

## Purpose

Turn the locked product + UX output into a concrete architecture: which stack, which components, which data model, which deployment shape, which integrations, which ADRs. Every choice names a specific product (not a category), and every decision cites a driver from the upstream artifacts — epic constraints, quality-profile targets, screen complexity, or compliance mandates.

## Input

Receive from the tech-architect agent:
- `scope_path` (path, required) — `.meridian/product/scope/scope.yaml`
- `enriched_capabilities_path` (path, required)
- `epics_dir` (path, required) — `.meridian/product/scope/epics/`
- `quality_profile_path` (path, required) — `.meridian/product/specification/quality-profile.yaml`
- `design_spec_path` (path, required) — `.meridian/product/experience/design-spec.md`
- `screens_dir` (path, required) — `.meridian/product/experience/screens/` (for state-count complexity hints)
- `ltm_architecture_path` (path, required) — `core/components/memory/knowledge/arch/`
- `output_path` (string, required) — `.meridian/product/architecture/architecture.yaml`

## Process

### 1. Load upstream artifacts

- Parse `scope.yaml` → selected capability list.
- Parse `enriched-capabilities.yaml` → per-capability business rules and profile context.
- Glob `{epics_dir}/*.yaml` → every intent epic with its `constraints` section.
- Parse `quality-profile.yaml` → ISO 25010 characteristics with targets, security profile, risk register.
- Read `design-spec.md` → screen inventory summary, interaction patterns, accessibility targets.
- Glob `{screens_dir}/*.md` and sum state counts per capability for frontend complexity estimation.

### 2. Load LTM architecture knowledge

Read `{ltm_architecture_path}/_index.md` and the relevant architecture reference files. LTM carries `When to Choose` and `When to Avoid` prose for patterns, stacks, platforms, and data stores. Match these against the product profile and quality targets. LTM is the primary source for technology recommendations; web research is a fallback.

### 3. Derive architecture sections

Compose `architecture.yaml` with these sections, each section carrying its cited drivers:

**Stack**
- `frontend`: specific framework and version (e.g., `Next.js 14 App Router`)
- `backend`: specific language/framework and runtime (e.g., `Node.js 22 + Fastify`)
- `data_primary`: specific database + version (e.g., `PostgreSQL 16 on Neon`)
- `data_cache`: specific cache + version (e.g., `Redis 7 via Upstash`) — only if cache is justified
- `message_queue`: specific product — only if async coupling is justified
- `auth`: specific auth mechanism (e.g., `NextAuth.js with OAuth2 via Google/Apple` or `Auth0 with SAML for SSO`)

Every selection carries `rationale` citing the driver. Example:

```yaml
stack:
  frontend:
    choice: "Next.js 14 App Router"
    rationale: "p95 page load < 800ms target from EPIC-commerce-catalog (success_criteria); SSR + incremental static regeneration covers it. Design-spec screens/state-counts show 45 distinct screens with 3-5 states each — Next.js App Router's co-located routing matches this complexity."
    drivers:
      - "EPIC-commerce-catalog constraint: performance"
      - "design-spec screen count"
```

**Components** — per selected capability, list the architectural components that implement it:

```yaml
components:
  - capability: UM-F001
    name: auth-service
    type: service
    owns: ["user-credentials", "session-tokens"]
    depends_on: ["user-profile-store", "mfa-service"]
    performance_budget:
      p95: "500ms"
      source: "EPIC-user-login-001 constraints.performance"
    rationale: "Centralizes credential verification and session management so CTC-001 (high-security requires MFA) can gate at a single boundary."
```

**Data model** — entities, relationships, invariants:

```yaml
data_model:
  entities:
    - name: User
      primary_key: id
      pii_fields: ["email", "phone"]
      pii_handling:
        encryption_at_rest: true
        encryption_source: "GDPR constraint from EPIC-user-profile-001"
    - name: Session
      primary_key: id
      owner: User
      ttl: "15 minutes idle, 8 hours absolute"
      ttl_source: "EPIC-user-login-001 business_rules"
  relationships:
    - User one-to-many Session
```

**API surface** — high-level endpoint groups mapped to capabilities:

```yaml
api_surface:
  style: "REST over HTTPS (GraphQL rejected — see ADR-003)"
  authentication: "Bearer token per session"
  endpoint_groups:
    - group: auth
      capability: UM-F001
      endpoints: ["POST /auth/login", "POST /auth/logout", "POST /auth/refresh"]
    - group: profile
      capability: UM-F005
      endpoints: ["GET /me", "PATCH /me", "DELETE /me (GDPR)"]
```

**Deployment shape**:

```yaml
deployment:
  model: "monolith → extract-to-service when NFR demands"
  model_rationale: "Team size from project profile is 4 engineers; monolith fits appetite and cognitive load for v1"
  hosting: "Vercel (frontend) + Railway (backend + Postgres)"
  hosting_rationale: "team_size small, delivery_ambition MVP — managed platforms minimize ops"
  environments: ["dev", "preview (per PR)", "production"]
  observability:
    logs: "structured JSON to stdout, ingested by hosting platform log aggregation"
    metrics: "Prometheus via /metrics endpoint exposed to hosting platform"
    traces: "OpenTelemetry OTLP export; collector TBD at build time"
```

**Integration points**:

```yaml
integrations:
  - name: "Stripe"
    purpose: "payment processing"
    capability: CM-F003
    risk: "vendor lock-in for tokenized card storage"
    mitigation: "isolate Stripe behind a PaymentGateway interface; alternative providers noted in ADR-007"
```

**ADR log** — every non-obvious decision with alternatives and rationale:

```yaml
adrs:
  - id: ADR-001
    title: "Next.js App Router over Remix"
    status: accepted
    date: "2026-04-14"
    context: "Need SSR + RSC for p95 budget; two viable React frameworks"
    alternatives: ["Remix", "SvelteKit"]
    decision: "Next.js App Router"
    rationale: "Larger ecosystem, better managed hosting integration with Vercel, team familiarity"
    drivers: ["performance budget EPIC-commerce-catalog", "team_size = 4 (prefer mainstream)"]
    consequences:
      positive: ["easier hiring", "managed hosting path clear"]
      negative: ["some flakiness on RSC hydration still being resolved"]
  - id: ADR-002
    title: "..."
```

### 4. Write architecture.yaml

Write the composed YAML to `{output_path}`. Include top-level metadata:

```yaml
slug: "<from project_profile.name>"
status: DRAFT
created_at: "<ISO-8601>"
upstream_artifacts:
  scope_path: <echoed>
  quality_profile_path: <echoed>
  design_spec_path: <echoed>
stack: ...
components: ...
data_model: ...
api_surface: ...
deployment: ...
integrations: ...
adrs: ...
```

### 5. Return output contract

```yaml
architecture:
  path: <written path>
  stack_fields_populated: <int>
  components_count: <int>
  capabilities_covered: <int>  # must equal scope.selected_capabilities count
  adrs_count: <int>
  rationale_coverage: <percent>  # percent of decisions with cited drivers
```

## Constraints

- NEVER use category terms. Every technology is a named product with a version.
- NEVER propose architecture without citing upstream drivers. Every decision has at least one cited driver.
- NEVER skip a capability. Every scope entry has at least one component.
- NEVER produce ADRs without listing at least one alternative that was considered and rejected.
- NEVER write outside `{output_path}`. One file, no scattered artifacts.
- ALWAYS ground technology choices in LTM architecture knowledge first. Use WebSearch only when LTM is silent.
- ALWAYS surface risks and mitigations inline (in the relevant section), not in a separate risks-only block.
- ALWAYS include PII handling notes for any entity with PII fields.

## Version

| Field | Value |
|-------|-------|
| Version | 0.1.0 |
| Category | architecture |
| Created | 2026-04-14 |
| Related | `core/components/agents/tech-architect.md`, `core/components/skills/derive-quality-standards`, `core/components/skills/validate-architecture-spec` |
