# Microservices

Independently deployable services, each owning its domain, data, and lifecycle.

**Search patterns:** microservices, distributed, independent deploy, service mesh, API gateway, domain-driven, bounded context, service discovery

## When to Choose

Microservices are warranted when organizational structure demands independent deployment — separate teams owning separate services with separate release cadences. This is primarily an organizational pattern, not a technical one. The technical benefits (independent scaling, polyglot stacks, fault isolation) are real but come at significant operational cost that only pays off at scale. Choose when: team > 15 with distinct domain ownership, features need independent scaling profiles (checkout at 50K rps while catalog handles 5K), regulatory requirements demand physical service isolation, or different features genuinely need different tech stacks. PP-6 >= 4 (Competitive Product), NFR-6 >= 4 (High Scale), and NFR-4 >= 3 (Standard+ Availability) favor microservices. PP-7 >= 4 (Regulated) may mandate physical isolation.

## When to Avoid

Avoid for teams < 10, products pre-PMF, or when a single deployment works fine. Microservices at small scale introduce 2-4x infrastructure overhead for zero benefit. The operational complexity (service discovery, distributed tracing, network partitions, eventual consistency) overwhelms small teams. If you're debating microservices because of code organization problems, the answer is a modular monolith — your problem is architecture, not deployment topology. 60% of teams regret premature microservices adoption. If you can't answer "which team owns which service," you don't need microservices.

## Scale Profile

| Dimension | Sweet Spot | Stretch | Break Point |
|-----------|-----------|---------|-------------|
| Team size | 15-200 developers | 200-1000 | > 1000 (federation/platform team needed) |
| MAU | 100K-10M | 10M-100M | > 100M (hyperscale patterns needed) |
| Services count | 5-20 | 20-100 | > 100 (service mesh essential, governance critical) |
| Deploy frequency | Per-service: multiple daily | Coordinated: weekly | Cross-service deploys needed: monolith in disguise |

## Key Components

| Component | Options | Selection Guidance |
|-----------|---------|-------------------|
| API Gateway | Kong, AWS API Gateway, Traefik, NGINX, Envoy | Kong/Traefik for self-hosted; AWS Gateway for AWS-native |
| Service mesh | Istio, Linkerd, Consul Connect | Istio for full feature set; Linkerd for simplicity |
| Service discovery | Kubernetes DNS, Consul, AWS Cloud Map | K8s DNS if on Kubernetes; Consul for multi-platform |
| Inter-service comms | gRPC, REST, async messaging | gRPC for internal; REST for external; async for eventual consistency |
| Distributed tracing | OpenTelemetry + Jaeger/Zipkin, Datadog, Honeycomb | OpenTelemetry as standard; vendor for managed |
| Circuit breaker | Resilience4j, Polly, custom middleware | Essential for preventing cascade failures |

## Reference Architecture

```
platform/
├── gateway/                    # API Gateway configuration
│   ├── routes.yaml
│   └── rate-limits.yaml
├── services/
│   ├── user-service/           # Each service is independently deployable
│   │   ├── src/
│   │   ├── Dockerfile
│   │   ├── k8s/               # Kubernetes manifests
│   │   └── README.md
│   ├── payment-service/
│   │   └── ...
│   └── catalog-service/
│       └── ...
├── shared/
│   ├── proto/                  # Shared protobuf definitions (gRPC)
│   ├── events/                 # Shared event schemas (Avro/Protobuf)
│   └── sdk/                    # Shared client libraries
├── infrastructure/
│   ├── terraform/
│   ├── helm/
│   └── docker-compose.dev.yaml # Local development
└── docs/
    ├── architecture/
    └── runbooks/
```

**Service rules:**
- Each service owns its database — no shared databases
- Services communicate via APIs (sync) or events (async) — never direct DB access
- Shared schemas (protobuf, Avro) define contracts between services
- Each service is independently buildable, testable, deployable
- No distributed transactions — use sagas or eventual consistency

## Evolution Paths

| From | To | Trigger | Approach |
|------|----|---------|----------|
| Modular Monolith | Microservices | Team split, scaling bottleneck | Strangler fig: extract one module at a time behind existing API |
| Monolith (unstructured) | Microservices | Organizational mandate | First modularize, then extract — don't go direct |
| Microservices | Consolidated services | Too many services, too few teams | Merge related services that share ownership |
| Microservices | Serverless | Reduce operational burden | Function-per-endpoint for low-traffic services |

## Tradeoffs

| Aspect | Gain | Cost |
|--------|------|------|
| Independent deployment | Teams ship without coordination | Deploy orchestration for cross-service features |
| Independent scaling | Scale hot services without scaling cold ones | More infrastructure to manage per service |
| Fault isolation | One service failure doesn't take down everything | Cascade failures if circuit breakers missing |
| Technology freedom | Use the best tool per problem | Polyglot operational burden, hiring complexity |
| Team autonomy | 2-pizza teams own their domain end-to-end | Coordination overhead for cross-cutting changes |

## Anti-Patterns

| Anti-Pattern | Description | Risk |
|-------------|-------------|------|
| Distributed monolith | Services deployed separately but coupled at data or deployment level | All the cost of microservices, none of the benefits |
| Nano-services | Services too small to justify independent deployment | Operational overhead per service exceeds value |
| Shared database | Multiple services reading/writing same tables | Coupling at data tier, impossible to evolve independently |
| Sync chain | Long chains of synchronous service calls | Latency multiplication, fragile availability |
| Conway's law violation | Service boundaries don't match team boundaries | Constant cross-team coordination, no autonomy |
| Missing observability | Distributed system without distributed tracing | Impossible to debug production issues |
