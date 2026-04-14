# Architecture Knowledge

Reference material for technology selection, architecture patterns, and infrastructure decisions.

Agents and skills query this directory when they need to know: **"How should we build this?"**

## Contents

### patterns/ — How to Organize the System

| File | Description | Search Patterns |
|------|-------------|-----------------|
| `modular-monolith.md` | Single deployment, module boundaries, vertical slices | monolith, modular, single deployment, small team, startup |
| `microservices.md` | Independent services, separate deployment, service mesh | microservices, distributed, independent deploy, service mesh, API gateway |
| `serverless.md` | Function-as-a-service, event-driven compute, managed infrastructure | serverless, lambda, cloud functions, FaaS, event-driven compute |
| `event-driven.md` | Async messaging, pub/sub, event sourcing, reactive systems | event-driven, pub/sub, messaging, async, reactive, decoupled |
| `cqrs-event-sourcing.md` | Command/query separation, event logs as source of truth | CQRS, event sourcing, command query, audit, temporal |
| `evolutionary-scaling.md` | Phase-based evolution from monolith to services (existing) | startup, evolutionary, scaling, phases, strangler fig |

### agentic/ — AI and Agentic Architectures

| File | Description | Search Patterns |
|------|-------------|-----------------|
| `rag-vector.md` | Embedding-based retrieval with vector stores | RAG, vector, embeddings, retrieval, semantic search, Pinecone, Weaviate |
| `rag-graph.md` | Knowledge graph-based retrieval and reasoning | GraphRAG, knowledge graph, Neo4j, relationships, entity extraction |
| `rag-hybrid.md` | Combining vector + keyword + graph for retrieval | hybrid RAG, BM25, reranking, vectorless, fusion, ensemble |
| `agent-orchestration.md` | Multi-agent systems, tool use, planning, reasoning loops | agents, multi-agent, tool use, LangChain, CrewAI, planning, orchestration |
| `llm-infrastructure.md` | Model serving, fine-tuning, evaluation, guardrails | LLM, model serving, fine-tuning, inference, guardrails, evaluation, gateway |

### stacks/ — What to Build With

| File | Description | Search Patterns |
|------|-------------|-----------------|
| `frontend-react-nextjs.md` | React + Next.js full-stack | React, Next.js, RSC, server components, Vercel |
| `frontend-vue-nuxt.md` | Vue + Nuxt.js | Vue, Nuxt, composition API, Nitro |
| `frontend-angular.md` | Angular enterprise frontend | Angular, TypeScript, enterprise frontend, RxJS |
| `frontend-svelte.md` | Svelte + SvelteKit | Svelte, SvelteKit, compiled, lightweight |
| `mobile-react-native.md` | React Native cross-platform mobile | React Native, Expo, mobile, cross-platform, iOS, Android |
| `mobile-flutter.md` | Flutter cross-platform mobile/desktop | Flutter, Dart, cross-platform, material, cupertino |
| `backend-nodejs.md` | Node.js backend (Express, Fastify, NestJS) | Node.js, Express, Fastify, NestJS, TypeScript backend, JavaScript |
| `backend-python-fastapi.md` | Python backend (FastAPI, Django) | Python, FastAPI, Django, async, ML integration |
| `backend-go.md` | Go backend services | Go, Golang, high-performance, concurrency, microservices |
| `backend-java-spring.md` | Java/Kotlin + Spring Boot | Java, Kotlin, Spring Boot, enterprise, JVM |
| `backend-dotnet.md` | .NET / C# backend | .NET, C#, ASP.NET, Azure native, enterprise |

### platforms/ — Where to Deploy

| File | Description | Search Patterns |
|------|-------------|-----------------|
| `aws.md` | Amazon Web Services ecosystem | AWS, Amazon, EC2, Lambda, S3, ECS, EKS, DynamoDB |
| `gcp.md` | Google Cloud Platform ecosystem | GCP, Google Cloud, Cloud Run, BigQuery, Firebase, GKE |
| `azure.md` | Microsoft Azure ecosystem | Azure, Microsoft, App Service, AKS, Cosmos DB, Azure Functions |
| `vercel.md` | Vercel + edge-first deployment | Vercel, edge, serverless, Next.js hosting, preview deployments |
| `railway-render.md` | Developer-friendly PaaS (Railway, Render, Fly.io) | Railway, Render, Fly.io, PaaS, simple deployment, hobby |
| `self-hosted.md` | Self-managed infrastructure (VPS, bare metal, on-prem) | self-hosted, VPS, bare metal, on-premises, Hetzner, DigitalOcean |

### data/ — How to Store and Move Data

| File | Description | Search Patterns |
|------|-------------|-----------------|
| `relational.md` | SQL databases (PostgreSQL, MySQL, SQLite) | SQL, PostgreSQL, MySQL, relational, ACID, transactions |
| `nosql-document.md` | Document databases (MongoDB, DynamoDB, Firestore) | MongoDB, DynamoDB, Firestore, document, schema-less, NoSQL |
| `nosql-keyvalue.md` | Key-value and caching (Redis, Memcached, Valkey) | Redis, Memcached, cache, key-value, session store, pub/sub |
| `vector-databases.md` | Vector stores for embeddings (Pinecone, Weaviate, pgvector) | vector, embeddings, similarity, ANN, Pinecone, Weaviate, pgvector |
| `messaging-queues.md` | Message brokers and event streaming (Kafka, RabbitMQ, SQS) | Kafka, RabbitMQ, SQS, pub/sub, event streaming, message queue |
| `search-engines.md` | Search infrastructure (Elasticsearch, Algolia, Meilisearch) | Elasticsearch, Algolia, Meilisearch, Typesense, full-text, indexing |

### operations/ — How to Ship and Run

| File | Description | Search Patterns |
|------|-------------|-----------------|
| `ci-cd.md` | Continuous integration and deployment pipelines | CI/CD, GitHub Actions, GitLab CI, deployment, pipeline, automation |
| `containerization.md` | Containers and orchestration (Docker, Kubernetes) | Docker, Kubernetes, K8s, containers, orchestration, Helm |
| `observability.md` | Logging, monitoring, tracing, alerting | observability, logging, monitoring, tracing, Datadog, Grafana, OpenTelemetry |
| `security-infrastructure.md` | WAF, secrets management, certificates, network security | WAF, secrets, Vault, certificates, TLS, network security, zero-trust |
| `iac.md` | Infrastructure as Code (Terraform, Pulumi, CDK) | Terraform, Pulumi, CDK, infrastructure as code, IaC, provisioning |

## Architecture File Template

Every architecture file follows this structure. All sections required — they provide the semantic context an agent needs to reason about technology selection.

### Required Sections

**When to Choose** — Prose describing conditions under which this technology/pattern is the right choice. Naturally references Product Profile and NFR Profile dimensions in context (e.g., "consumer-facing products with high performance needs" rather than "PP-1 >= 4 AND NFR-3 >= 3"). The agent reasons over this prose — no conditional rules.

**When to Avoid** — Explicit anti-conditions in prose. Prevents agents from recommending inappropriate technology. Just as important as "when to choose."

**Scale Profile** — Team size, user count, data volume sweet spot. Where this technology shines, where it stretches, where it breaks.

**Key Components** — Concrete technologies, services, and tools within this category. With selection guidance for choosing between alternatives.

**Reference Architecture** — Directory structure, configuration patterns, concrete setup. Opinionated "if you choose this, here's how."

**Evolution Paths** — How to migrate from/to this approach. Connects architecture files to each other.

**Tradeoffs** — Cost, velocity, complexity, operational burden. Helps agents reason about priority.

**Anti-Patterns** — Common mistakes when using this approach.

### Example Structure

```markdown
# {Technology/Pattern Name}

{One-line description}

**Search patterns:** {comma-separated keywords for agent discovery}

## When to Choose
{Prose describing conditions, referencing PP/NFR dimensions}

## When to Avoid
{Explicit anti-conditions}

## Scale Profile
| Dimension | Sweet Spot | Stretch | Break Point |
|-----------|-----------|---------|-------------|

## Key Components
{Technologies, services, tools with selection guidance}

## Reference Architecture
{Directory structures, config patterns, concrete setup}

## Evolution Paths
| From | To | Trigger | Approach |
|------|----|---------|----------|

## Tradeoffs
| Aspect | Gain | Cost |
|--------|------|------|

## Anti-Patterns
| Anti-Pattern | Description | Risk |
|-------------|-------------|------|
```

## How Agents Use This

1. Agent reads the project's Product Profile and NFR Profile
2. Agent identifies relevant architecture categories from BRD/product context
3. Agent loads files whose search patterns match
4. Agent reads "When to Choose" and "When to Avoid" prose and reasons about fit
5. Agent reasons about pattern choice, then stack, then platform, then data, then operations — no rules, just rich context
6. Agent references Evolution Paths to consider migration from existing architecture

## Extending Architecture Knowledge

To add a new architecture reference:
1. Identify the right category (patterns, stacks, platforms, data, operations, agentic)
2. Create a new `.md` file following the template above
3. Update this `_index.md` with the new entry
4. Ensure "When to Choose" and "Profile Alignment" reference PP/NFR dimensions
