---
id: architecture/microservices
title: "Microservices: independently deployable services — earned, not started with"
conditions:
  stage: scale            # prototype | early | growth | scale
  team-size: over-15      # under-15 | 15-200 | over-200
  scale: over-500k-mau    # under-500k | 500k-10M | over-10M MAU
  deploy-cadence: independent-per-team
  scalability: high
evolve_when: []
provenance: "documented (recovered from the prior KB into the v1 KB under #434)"
---

# Microservices: independently deployable services — earned, not started with

## Topic
The architecture you climb to from a [modular monolith](./modular-monolith.md)
when scale and organization demand it: independently deployable services, each
owning its domain, data, and lifecycle. A microservice is an **organizational**
pattern first; the technical benefits are secondary.

## Conditions

### When to choose
The org is large enough that domains have distinct ownership (> 15 engineers,
moving toward two-pizza teams per service); features have genuinely different
scaling profiles and must scale independently; regulation mandates physical
service isolation; or features need fundamentally different tech stacks. The
trigger is real pressure — a hot path that must scale alone, a separate team that
must deploy on its own cadence — not a whiteboard preference.

### When to avoid
Teams under ~10, or any product still searching for product-market fit. At small
scale microservices add 2–4× infrastructure overhead for zero benefit, and ~60%
of teams regret premature adoption. If a single deployment still works, it is
still the right answer. Do not go straight from an unstructured monolith to
services — modularize first (see modular monolith), then extract.

### Scale profile
| Dimension | Sweet spot | Stretch | Break point |
|-----------|-----------|---------|-------------|
| Team size | 15–200 | 200–1000 | > 1000 (platform/federation) |
| MAU | 100K–10M | 10M–100M | > 100M (hyperscale) |
| Service count | 5–20 | 20–100 | > 100 (mesh essential) |
| Deploy frequency | Per-service daily | Weekly | Cross-service flows need rethink |

## Recommendation

### Hard rules
- **Each service owns its database.** No shared databases — that re-welds the
  services you just split.
- **Communicate via APIs (sync) or events (async), never direct DB access.**
- **Contracts are explicit and versioned** — protobuf / Avro schemas define them.
- **Each service builds, tests, and deploys independently.**
- **No distributed transactions** — use sagas or accept eventual consistency.

### Component choices
| Concern | Options | Guidance |
|---------|---------|----------|
| API gateway | Kong / Traefik; AWS API Gateway | self-hosted vs AWS-native |
| Service mesh | Istio (full); Linkerd (simple) | add only when service count justifies it |
| Discovery | K8s DNS; Consul | K8s-native vs multi-platform |
| Inter-service | gRPC (internal); REST (external); events (async) | sync for queries, events for flows |

### Reference structure
```
gateway/            # routing, auth, rate-limiting
services/
  <service>/        src/ Dockerfile k8s/ README   # self-contained, independently deployable
shared/             proto/ events/ sdk/            # versioned contracts only — NOT shared logic
infrastructure/     terraform/ helm/
docs/               architecture/ runbooks/
```

## Rationale
The gains are real once you have the scale to use them: teams ship without
coordinating, hot services scale alone, a failure stays isolated **if** circuit
breakers and observability are in place, and each team picks the best tool for its
problem. The costs are paid from day one and are why this is wrong early: deploy
orchestration for any cross-service feature, per-service infrastructure to operate,
cascade failures when observability is missing, a polyglot operational burden, and
harder hiring. Treat the decision as organizational — if the team shape doesn't
demand service boundaries, the architecture shouldn't impose them.

## Evolve when
| From | To | Trigger |
|------|----|---------|
| [Modular monolith](./modular-monolith.md) | Microservices | A module needs independent scaling/stack/ownership (~100K+ MAU) — strangler-fig one module at a time |
| Too many services, too few teams | Consolidated services | Operational overhead exceeds benefit — merge related services under shared ownership |
| Low-traffic services | Serverless functions | Reduce ops burden — function-per-endpoint where traffic is sparse |

## Anti-patterns
- **Microservices from scratch** — distributed complexity before you have the
  scale problem; the single most common regret.
- **Shared database across services** — coupling at the data tier; not really
  microservices.
- **Distributed monolith** — services that must deploy together; all the cost,
  none of the independence.
- **Mesh/gateway before you need it** — operating infrastructure for a handful of
  services.
- **Architecture cosplay** — copying Netflix's topology without Netflix's load.

## Provenance
documented — the user's microservices learning, recovered from the prior KB
(`arch/patterns/microservices.md`) and reshaped into the v1 template under #434.
Old profile codes (PP-6/7, NFR-4/6) translated to plain conditions.
