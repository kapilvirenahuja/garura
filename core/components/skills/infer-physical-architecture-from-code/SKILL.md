---
name: infer-physical-architecture-from-code
description: Infer the physical architecture proposal (runtime, deployment target, data stores, caches, queues, search, observability, auth infrastructure, scaling strategy) from scan-index.json during /codify, naming specific products (Postgres 15, Redis 7, Kafka, etc.) — never categories. Every slot is grounded in concrete manifest / Dockerfile / infra / CI evidence and tagged source_type=inferred_from_code. Used exclusively by tech-architect in the /codify play.
version: 0.1.0
user-invocable: false
model: sonnet
allowed-tools: Read, Write, Grep, Glob
deprecated: true
deprecated_note: '#434 ProductOS realignment — superseded by the command model; retained for Phase E reference, not installed'
---

# infer-physical-architecture-from-code

Called by `tech-architect` during /codify, immediately after `infer-logical-architecture-from-code`. Produces `architecture/physical-architecture.yaml` at `{stm_base}/{issue}/evidence/codify/proposals/architecture/physical-architecture.yaml`.

## Purpose

During /codify (brownfield bootstrap), the physical-architecture artifact that `/arch` normally derives from locked specs and grounded_tools pins must be reverse-engineered from the running codebase. This skill consumes `scan-index.json` (produced by `scan-codebase`) plus the sibling `logical-architecture.yaml` proposal and emits a physical-architecture proposal grounded entirely in what the code already reveals.

Unlike `logical-architecture.yaml`, this is THE artifact that names specific products. Every slot MUST resolve to a named product with a version when evidence allows (e.g. "PostgreSQL 15", "Redis 7", "Apache Kafka 3.6"). Slots where evidence is absent are marked `unknown_with_gap` and surfaced as a `knowledge_gaps` entry — never filled with category words like "a relational database" or "some cache".

Signals this skill extracts from scan-index:

- **runtime** — per manifest, framework dep + version source:
  - node + `express` | `fastify` | `koa` | `hapi` → Node.js (version from `engines.node`)
  - python + `fastapi` / `starlette` → Python + uvicorn; + `django` → Python + gunicorn; + `flask` → Python + gunicorn (version from `python_requires`)
  - go + `gin-gonic/gin` | `labstack/echo` | `gofiber/fiber` → Go (version from `go` directive in go.mod)
  - rust + `actix-web` | `axum` | `rocket` → Rust (edition from Cargo.toml)
  - ruby + `rails` | `sinatra` → Ruby + Puma (version from `.ruby-version`)
  - jvm + `spring-boot-starter*` → JVM + Spring Boot (version from parent pom / gradle plugin)
  - dotnet + `Microsoft.AspNetCore.App` → .NET (TargetFramework in csproj)
  - elixir + `phoenix` → Elixir + Phoenix (version from mix.exs)
- **container runtime** — `config_files.docker`: Dockerfile `FROM` base image (e.g. `node:20-alpine`, `python:3.12-slim`, `golang:1.22`) → container base + version; multi-stage `FROM ... AS builder` → build stage signal; `docker-compose.yml` services list → often the clearest signal for data/cache/queue product versions.
- **deployment provider** — `config_files.infra` + `config_files.deploy`:
  - `*.tf` with `provider "aws" | "google" | "azurerm" | "cloudflare"` → Terraform + cloud target
  - `Pulumi.yaml` / `*.pulumi.ts` → Pulumi; `cdk.json` → AWS CDK (AWS); `serverless.yml` → Serverless Framework (Lambda / Cloud Functions)
  - `helm/Chart.yaml` or `k8s/*.yaml` / `kustomization.yaml` → Kubernetes (Helm or raw)
  - `app.json` (heroku) → Heroku; `fly.toml` → Fly.io; `vercel.json` / `next.config.*` deploy → Vercel; `netlify.toml` → Netlify; `firebase.json` → Firebase; `render.yaml` → Render; `railway.json`/`railway.toml` → Railway; `apprunner.yaml` → AWS App Runner
- **CI deployment targets** — `config_files.ci`: GitHub Actions jobs using `aws-actions/*` | `google-github-actions/*` | `azure/login` → cloud target confirmation; Jenkins stages naming environments → environment topology hints.
- **data stores** — manifest deps + compose services:
  - `pg` | `postgres` | `psycopg2` | `asyncpg` | `lib/pq` | `gorm.io/driver/postgres` → PostgreSQL
  - `mysql` | `mysql2` | `pymysql` | `go-sql-driver/mysql` → MySQL; `mariadb` → MariaDB; `sqlite3` | `better-sqlite3` → SQLite
  - `mongodb` | `mongoose` | `pymongo` | `motor` | `go.mongodb.org/mongo-driver` → MongoDB
  - `@aws-sdk/client-dynamodb` | `boto3(dynamodb)` → DynamoDB; `cassandra-driver` | `gocql` → Cassandra; `neo4j-driver` → Neo4j
  - `@planetscale/database` → PlanetScale; `@supabase/supabase-js` (no local PG) → Supabase; `@neondatabase/serverless` → Neon
  - Prisma / TypeORM / Sequelize / Drizzle / Alembic / Flyway → ORM/migration layer (recorded under `library_pins`)
- **caches**: `redis` | `ioredis` | `redis-py` | `go-redis/redis` → Redis; `memcached` | `pymemcache` | `gomemcache` → Memcached; `@upstash/redis` → Upstash; `valkey` → Valkey.
- **queues / messaging**: `kafkajs` | `confluent-kafka` | `segmentio/kafka-go` | `spring-kafka` → Apache Kafka; `amqplib` | `pika` | `streadway/amqp` | `rabbitmq` compose service → RabbitMQ; `bullmq` | `bull` → BullMQ on Redis; `celery[redis]` → Celery on Redis; `celery` with `amqp://` broker → Celery on RabbitMQ; `@aws-sdk/client-sqs` → AWS SQS; `@google-cloud/pubsub` → Google Pub/Sub; `@azure/service-bus` → Azure Service Bus; `nats` | `nats.go` → NATS.
- **search**: `@elastic/elasticsearch` | `elasticsearch-py` | `elastic/go-elasticsearch` → Elasticsearch; `@opensearch-project/opensearch` | `opensearch-py` → OpenSearch; `meilisearch` → Meilisearch; `typesense` → Typesense; `algoliasearch` → Algolia.
- **observability**: `dd-trace` | `datadog` | `ddtrace` → Datadog; `newrelic` → New Relic; `prom-client` | `prometheus_client` | `prometheus/client_golang` → Prometheus (metrics); `@opentelemetry/*` | `go.opentelemetry.io/otel` → OpenTelemetry SDK (tracing); `@sentry/*` | `sentry-sdk` | `getsentry/sentry-go` → Sentry (errors); `@honeycombio/*` | `libhoney` → Honeycomb; `pino` | `winston` | `structlog` | `zap` → structured logging library (logs slot); `axiom-js` | `@axiomhq/*` → Axiom (log ingest).
- **auth infrastructure**: `auth0` | `@auth0/*` → Auth0; `@okta/okta-auth-js` | `okta-jwt-verifier` → Okta; `firebase/auth` → Firebase Auth; `@clerk/*` → Clerk; `@supabase/auth-js` → Supabase Auth; `next-auth` | `@auth/core` → NextAuth.js; `passport` + strategies (`passport-google-oauth20`, `passport-jwt`, `passport-saml`) → Passport with named strategies; `devise` → Devise; `spring-security` → Spring Security; `jsonwebtoken` | `pyjwt` | `golang-jwt/jwt` → JWT library (`auth_infrastructure.token_library`); `speakeasy` | `otplib` | `pyotp` → TOTP MFA library.
- **scaling strategy hints**: `HorizontalPodAutoscaler` in k8s manifests, `autoscale`/`minInstances`/`maxInstances` in `app.yaml`, `[services.concurrency]` in `fly.toml`, `provisionedConcurrency` in `serverless.yml` → autoscale policy per tier; `pm2` ecosystem, `gunicorn --workers`, `uvicorn --workers`, `puma` workers/threads → concurrency model; `bullmq` / `celery` worker definitions → queue-depth-driven scaling; Vercel / Netlify / Cloudflare Workers → "managed edge autoscaling".

Any signal unavailable in scan-index for a given slot is surfaced in `knowledge_gaps[]` (slot name + what evidence would be needed) and the slot is written as `unknown_with_gap` — never guessed, never filled with a category word.

## Input

Receive from tech-architect via JSON contract.

- `scan_index_path` (path, required) — `scan-index.json` produced by scan-codebase.
- `stm_base` (path, required) — STM root resolved from `.garura/core/config.yaml` `stm.base-path`.
- `issue` (str, required) — issue number driving /codify.
- `output_path` (path, required) — `{stm_base}/{issue}/evidence/codify/proposals/architecture/physical-architecture.yaml`.
- `decision_manifest_path` (path, required) — `decision-manifest-infer-physical-architecture-from-code.yaml` alongside the artifact.
- `related_proposal_paths` (map, required) — MUST contain `logical_architecture` pointing to the sibling `architecture/logical-architecture.yaml` proposal. bounded_contexts and components come from there; this skill maps them onto physical runtimes and tiers.
- `ltm_context` (block, required) — `{product_base, core_base, query_domains, locked_artifacts}`. Presence triggers the Resolution Protocol.
- `resolution_trace_path` (path, required) — where `resolution-trace.yaml` is written.

## Process

1. **Validate inputs.** Confirm `scan_index_path` exists and parses as JSON. Confirm `logical-architecture.yaml` at `related_proposal_paths.logical_architecture` exists and parses. If either is missing or malformed → structured failure `scan_index_missing` or `missing_related_proposal`.

2. **Check scan status.** Read `scan_status`. If `budget_exhausted`, proceed but mark every inferred slot `confidence: low` in the manifest and record a top-level warning in the artifact meta (`scan_status_warning: "scan truncated — signals may be partial"`).

3. **Execute LTM Resolution Protocol R3** per `core/components/memory/standards/rules/resolution.md`. Query the core KB `arch/platforms/`, `arch/data/`, `arch/operations/` domains for candidate catalogues. Write the trace to `resolution_trace_path`. The KB is a reference for known-product families; it does NOT override scan-index evidence — when the codebase plainly uses PostgreSQL, that is the answer regardless of what the KB recommends.

4. **Map bounded contexts to deployment targets.** For each `bounded_context` in logical-architecture, determine its deployment target from `config_files.ci`, `config_files.infra`, `config_files.deploy`, and the `Dockerfile` / `docker-compose.yml` structure. Record the mapping in `deployment.topology[].logical_components`.

5. **Detect data stores.** Walk manifest deps against the data-store dep→product table above. De-duplicate by product family. For each detected product, capture version from (a) compose-service image tag, (b) `Dockerfile FROM` base image, (c) manifest dep pin (e.g. `"pg": "^8.11.0"` fixes Postgres driver, not server version — in that case, mark server version as `unknown_with_gap`).

6. **Detect caches, queues, search.** Same pattern as data stores, against their respective dep→product tables.

7. **Detect observability stack.** Walk manifest deps against the observability table. Split findings into the four sub-slots: `logging`, `metrics`, `tracing`, `errors`. Absence of any sub-slot signal → `unknown_with_gap` for that sub-slot.

8. **Detect auth infrastructure.** Walk manifest deps against the auth table. Record the primary auth product in `auth_infrastructure.choice`; record JWT / MFA libraries under `auth_infrastructure.token_library` and `auth_infrastructure.mfa_library` when present.

9. **Detect scaling strategy.** Inspect infra/deploy configs for autoscale blocks, worker pool configs, and edge-platform signals per the scaling-strategy table. For each runtime tier in `deployment.topology`, record `scaling_strategy.{tier_id}`. Tiers with no scaling signal → `unknown_with_gap`.

10. **Populate knowledge_gaps.** For every slot marked `unknown_with_gap`, emit an entry `{slot, evidence_needed, suggested_question}` so the orchestrator's checkpoint can ask the user.

11. **Compose the artifact YAML.** Write `meta` block first, then `physical_architecture` body. Meta lists every scan-index evidence path consulted across all slots (deduplicated).

12. **Write decision manifest.** One entry per inferred slot with tier, grounding_source (`scan-index:<path>` or `ltm:<file>`), recommendation (the specific product + version or `unknown_with_gap`), alternatives_considered (other products the scan could have indicated), and confidence. For `unknown_with_gap` entries, alternatives_considered MUST list the plausible products that would have been picked had evidence been present.

## Output

Primary artifact at `output_path`:

```yaml
meta:
  source_type: "inferred_from_code"
  evidence:
    - "scan-index.json#/manifests/0/dependencies"
    - "scan-index.json#/config_files/docker"
    - "scan-index.json#/config_files/infra"
    - "scan-index.json#/config_files/deploy"
    - "scan-index.json#/config_files/ci"
  confidence: "high" | "medium" | "low"
  learning_category: "arch"
  sub_category: "platforms"
  tier: 1
  scan_status_warning: null  # or message string when scan_status == budget_exhausted
physical_architecture:
  runtime:
    choice: "Node.js 20"          # specific product + version
    evidence: ["scan-index.json#/manifests/0/engines/node", "scan-index.json#/config_files/docker/Dockerfile"]
    confidence: "high"
  deployment:
    provider: "AWS"               # AWS | GCP | Azure | Vercel | Fly.io | Heroku | Render | Railway | Netlify | Cloudflare | self-hosted-k8s | unknown_with_gap
    topology:
      - tier_id: "tier-api"
        host: "AWS ECS Fargate"
        logical_components: ["comp-api-gateway", "comp-auth-service"]
        evidence: ["scan-index.json#/config_files/infra/terraform/ecs.tf"]
      - tier_id: "tier-web"
        host: "Vercel"
        logical_components: ["comp-web-frontend"]
        evidence: ["scan-index.json#/config_files/deploy/vercel.json"]
  data_stores:
    - type: "relational"
      product: "PostgreSQL"
      version: "15"                # from compose image tag or Dockerfile
      evidence: ["scan-index.json#/manifests/0/dependencies/pg", "scan-index.json#/config_files/docker/docker-compose.yml"]
      confidence: "high"
    # one entry per detected data product; unknown_with_gap allowed
  caches:
    - product: "Redis"
      version: "7"
      evidence: ["scan-index.json#/manifests/0/dependencies/ioredis"]
      confidence: "high"
  queues:
    - product: "Apache Kafka"
      version: "3.6"
      evidence: ["scan-index.json#/manifests/0/dependencies/kafkajs", "scan-index.json#/config_files/docker/docker-compose.yml"]
      confidence: "high"
  search:
    - product: "OpenSearch"
      version: "2.x"
      evidence: ["scan-index.json#/manifests/0/dependencies/@opensearch-project/opensearch"]
      confidence: "medium"
  observability:
    logging:
      choice: "Pino → Axiom"
      evidence: ["scan-index.json#/manifests/0/dependencies/pino", "scan-index.json#/manifests/0/dependencies/@axiomhq/js"]
      confidence: "high"
    metrics:
      choice: "Prometheus client (prom-client)"
      evidence: ["scan-index.json#/manifests/0/dependencies/prom-client"]
      confidence: "high"
    tracing:
      choice: "OpenTelemetry SDK"
      evidence: ["scan-index.json#/manifests/0/dependencies/@opentelemetry/sdk-node"]
      confidence: "high"
    errors:
      choice: "Sentry"
      evidence: ["scan-index.json#/manifests/0/dependencies/@sentry/node"]
      confidence: "high"
  auth_infrastructure:
    choice: "Auth0"
    token_library: "jsonwebtoken"
    mfa_library: "speakeasy"
    evidence: ["scan-index.json#/manifests/0/dependencies/@auth0/nextjs-auth0"]
    confidence: "high"
  scaling_strategy:
    tier-api:
      approach: "Kubernetes HorizontalPodAutoscaler (CPU > 70% → 2..10 replicas)"
      evidence: ["scan-index.json#/config_files/infra/k8s/hpa.yaml"]
      confidence: "high"
    tier-web:
      approach: "Vercel managed edge autoscaling"
      evidence: ["scan-index.json#/config_files/deploy/vercel.json"]
      confidence: "high"
    tier-worker:
      approach: "unknown_with_gap"
      confidence: "low"
  knowledge_gaps:
    - slot: "scaling_strategy.tier-worker"
      evidence_needed: "worker concurrency config (pm2 ecosystem, gunicorn workers, or HPA for worker deployment)"
      suggested_question: "How are background workers scaled today — fixed replicas, queue-depth autoscale, or manual?"
```

Decision manifest at `decision_manifest_path`:

```yaml
decisions:
  - slot: "runtime"
    tier: 1
    grounding_source: "scan-index:manifests[0].engines.node"
    recommendation: "Node.js 20"
    alternatives_considered:
      - alt: "Node.js 18"
        why_not: "engines.node pins '>=20'"
    confidence: "high"
  - slot: "data_stores[0]"
    tier: 1
    grounding_source: "scan-index:manifests[0].dependencies.pg + docker-compose.yml service 'db' image postgres:15"
    recommendation: "PostgreSQL 15"
    alternatives_considered:
      - alt: "PostgreSQL 16"
        why_not: "compose pins image tag 15, not 16"
    confidence: "high"
  # one entry per inferred slot (runtime, deployment.provider, each topology tier,
  # each data_store, each cache, each queue, each search entry, each observability sub-slot,
  # auth_infrastructure, each scaling_strategy tier). unknown_with_gap slots MUST also appear
  # here with alternatives_considered listing plausible products that would have been picked
  # had evidence been present.
```

Resolution trace at `resolution_trace_path` per `resolution.md` schema.

No product LTM writes. All output is under STM.

## Failure Modes

- `missing_related_proposal` — `related_proposal_paths.logical_architecture` does not exist or is not valid YAML; this skill cannot map contexts to runtimes without it.
- `scan_index_missing` — `scan_index_path` does not exist or is not valid JSON.
- `scan_status_exhausted` — scan-index has `scan_status: budget_exhausted`; skill proceeds but lowers confidence across all slots and records a meta-level warning.
- `insufficient_signal` — very thin config surface (no Dockerfile, no infra configs, no deploy configs, minimal manifest deps). Emit the artifact with slots populated only where manifest-dep evidence exists; all other slots become `unknown_with_gap` with `knowledge_gaps[]` populated. Do NOT fabricate picks to avoid gaps — gaps are the correct output when evidence is absent.
- `ltm_resolution_failed` — Resolution Protocol raised an error; skill halts and returns the trace path for triage.
- `output_parent_missing` — `output_path` parent cannot be created; return structured failure.

## Boundaries

- Read-only against the codebase. The scan-index plus the sibling logical-architecture proposal are the sole inputs — this skill does NOT open source files directly.
- NEVER use category terms. Every slot names a specific product (with a version when evidence allows) OR is `unknown_with_gap`. "A relational database", "some queue", "a cache layer" are validator-rejected strings.
- NEVER invent a product name not indicated by scan-index evidence. If `kafkajs` is absent and no compose service names Kafka, the queues slot is `unknown_with_gap` — not "probably Kafka".
- NEVER override a product the code plainly uses in favour of a KB recommendation. When Postgres is in the manifest and compose, the answer is Postgres regardless of what `arch/data/relational.md` recommends for greenfield.
- Signals not listed in the Purpose section MUST NOT be used as evidence; add them to this skill's contract before relying on them.
- No writes outside `{stm_base}/{issue}/evidence/codify/proposals/architecture/` and the two companion files (decision manifest, resolution trace).
