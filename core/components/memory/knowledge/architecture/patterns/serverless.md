# Serverless

Function-as-a-service and managed services — no server management, pay-per-invocation, event-driven compute.

**Search patterns:** serverless, lambda, cloud functions, FaaS, event-driven compute, managed, pay-per-use, auto-scaling, edge functions

## When to Choose

Serverless excels when workloads are spiky, unpredictable, or low-traffic with bursts. You pay only for execution time — idle costs are zero. It eliminates server management, patching, and capacity planning. Choose for: event-driven processing (file uploads, webhooks, scheduled tasks), APIs with variable traffic, startups wanting zero ops overhead, and products where PP-6 = 1-2 (POC/MVP) and speed-to-market matters more than architectural control. NFR-6 (Scalability) benefits from built-in auto-scaling. PP-6 = 1-2 gets massive leverage — ship a production API without touching infrastructure.

## When to Avoid

Avoid for long-running processes (> 15 min), latency-sensitive applications where cold starts are unacceptable (NFR-3 >= 4), applications with consistent high throughput (cheaper to run dedicated instances), and applications requiring persistent connections (WebSocket-heavy, real-time collaboration). Vendor lock-in is significant — migrating from Lambda to Cloud Functions is a rewrite. If NFR-3 >= 4 (Real-Time), cold starts at 100-500ms are often unacceptable. Also avoid when the team needs fine-grained control over infrastructure (custom networking, GPU workloads).

## Scale Profile

| Dimension | Sweet Spot | Stretch | Break Point |
|-----------|-----------|---------|-------------|
| Team size | 1-15 developers | 15-50 | > 50 (platform team needed for standards) |
| Requests/sec | 0-1000 (bursty) | 1K-10K sustained | > 10K sustained (cost exceeds dedicated) |
| Execution duration | < 30 seconds | 30s-15min | > 15 min (use containers/ECS) |
| Cold start tolerance | > 500ms acceptable | 100-500ms with provisioned | < 100ms required (use dedicated) |

## Key Components

| Component | Options | Selection Guidance |
|-----------|---------|-------------------|
| Compute | AWS Lambda, Google Cloud Functions, Azure Functions, Cloudflare Workers, Vercel Functions | Lambda for AWS ecosystem; Cloudflare Workers for edge; Vercel for Next.js |
| API Gateway | AWS API Gateway, GCP API Gateway, Cloudflare Workers routing | Match to compute provider |
| Event sources | S3 events, SQS/SNS, EventBridge, Pub/Sub, Cron | Platform-native event sources reduce glue code |
| State management | DynamoDB, Firestore, Upstash Redis, Neon (serverless Postgres) | Serverless-native databases avoid connection issues |
| Orchestration | AWS Step Functions, Google Workflows, Temporal (self-hosted) | Step Functions for AWS; Temporal for complex workflows |

## Reference Architecture

```
functions/
├── api/
│   ├── users/
│   │   ├── create.ts          # POST /api/users
│   │   ├── get.ts             # GET /api/users/:id
│   │   └── list.ts            # GET /api/users
│   └── orders/
│       └── ...
├── events/
│   ├── order-placed.ts        # Triggered by order event
│   ├── payment-processed.ts   # Triggered by payment event
│   └── file-uploaded.ts       # Triggered by S3/GCS event
├── scheduled/
│   ├── daily-report.ts        # Cron: daily at 6am
│   └── cleanup.ts             # Cron: weekly
├── shared/
│   ├── middleware/             # Auth, validation, error handling
│   ├── database/              # Database client (connection pooling!)
│   └── types/
└── serverless.yaml             # or template.yaml (SAM) or vercel.json
```

**Serverless rules:**
- Functions are stateless — no in-memory state between invocations
- Database connections use connection pooling or serverless adapters (Neon, PlanetScale)
- Cold start optimization: minimize bundle size, lazy-load dependencies
- Idempotency is essential — events may be delivered more than once

## Evolution Paths

| From | To | Trigger | Approach |
|------|----|---------|----------|
| — | Serverless | Greenfield with variable traffic | Start here for event-driven workloads |
| Serverless | Containers | Sustained load makes serverless expensive | Move hot functions to ECS/Cloud Run; keep event handlers serverless |
| Monolith | Serverless | Extract event processing | Keep core as monolith; move async workloads to functions |
| Serverless | Hybrid | Some functions need long execution or WebSockets | Split: functions for events, containers for persistent workloads |

## Tradeoffs

| Aspect | Gain | Cost |
|--------|------|------|
| Operations | Zero server management, patching, capacity planning | Vendor lock-in, less control |
| Cost | Pay per invocation — zero cost at zero traffic | Expensive at sustained high throughput |
| Scaling | Automatic, near-instant scaling to thousands of concurrent | Cold starts add 100-500ms latency |
| Development | Fast to deploy individual functions | Local development harder, testing requires emulation |
| Debugging | Cloud-native logging (CloudWatch, Cloud Logging) | Distributed debugging is harder than single-process |

## Anti-Patterns

| Anti-Pattern | Description | Risk |
|-------------|-------------|------|
| Lambda monolith | Single function handling all routes | Defeats the purpose; large bundle, slow cold starts |
| Connection flooding | New database connection per invocation | Database connection exhaustion under load |
| Synchronous chains | Lambda calling Lambda calling Lambda | Latency multiplication, cost multiplication, timeout chains |
| Vendor all-in without abstraction | Business logic tightly coupled to AWS SDK | Impossible to migrate, test locally, or run elsewhere |
| Ignoring cold starts | Assuming instant response for all endpoints | Unpredictable latency for user-facing APIs |
