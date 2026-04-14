# Event-Driven Architecture

Asynchronous communication via events — producers emit, consumers react, systems are decoupled.

**Search patterns:** event-driven, pub/sub, messaging, async, reactive, decoupled, event bus, CQRS, saga, choreography, orchestration

## When to Choose

Event-driven architecture is the right choice when components need to communicate without tight coupling, when work can be processed asynchronously, or when multiple consumers need to react to the same business event. It shines for: order processing pipelines, notification systems, data synchronization across services, audit logging, and any workflow where "fire and forget" is acceptable. NFR-6 (Scalability) >= 3 benefits from event-driven decoupling — producers and consumers scale independently. PP-5 (Integration Density) >= 3 often needs events for webhook delivery and partner notifications. Event-driven is a pattern that layers on top of other architectures — you can have an event-driven monolith or event-driven microservices.

## When to Avoid

Avoid as the primary architecture when the product is simple request-response with no async workflows. If every interaction needs a synchronous response and there's no fan-out, events add complexity without benefit. Avoid when the team has no experience with eventual consistency — the debugging and reasoning model is fundamentally different from synchronous systems. PP-6 = 1 (POC) should use simple request-response. NFR-3 >= 4 (Real-Time) for user-facing latency requires synchronous paths — events handle background work.

## Scale Profile

| Dimension | Sweet Spot | Stretch | Break Point |
|-----------|-----------|---------|-------------|
| Events/sec | 100-100K | 100K-1M | > 1M (Kafka-grade infra needed) |
| Consumer count | 2-20 per event | 20-100 | > 100 (fanout management needed) |
| Processing latency | Seconds to minutes acceptable | Sub-second needed | Real-time required (not event-driven) |
| Event retention | Hours to days | Weeks (replay capability) | Permanent (event sourcing territory) |

## Key Components

| Component | Options | Selection Guidance |
|-----------|---------|-------------------|
| Message broker | Kafka, RabbitMQ, AWS SQS/SNS, Google Pub/Sub, Redis Streams | Kafka for high throughput + replay; RabbitMQ for routing; SQS for AWS-native simplicity |
| Event schema | Avro, Protobuf, JSON Schema, CloudEvents | Avro/Protobuf for type safety; JSON Schema for simplicity; CloudEvents for interop |
| Schema registry | Confluent Schema Registry, AWS Glue, custom | Essential for schema evolution at scale |
| Event store | EventStoreDB, PostgreSQL (append-only), Kafka (log) | EventStoreDB for pure event sourcing; PostgreSQL for small scale |
| Saga orchestration | Temporal, AWS Step Functions, custom | Temporal for complex long-running workflows; Step Functions for AWS |

## Reference Architecture

```
Event flow:
  Producer → Event Bus/Broker → Consumer(s)

Choreography (decentralized):
  OrderService --publishes--> "order.placed"
  PaymentService --subscribes--> "order.placed" --publishes--> "payment.processed"
  NotificationService --subscribes--> "payment.processed" --sends--> email

Orchestration (centralized):
  OrderSaga:
    1. Create order
    2. Call PaymentService → await result
    3. Call InventoryService → await result
    4. If all succeed → emit "order.confirmed"
    5. If any fail → compensate (reverse previous steps)
```

**Event design rules:**
- Events are facts (past tense): `OrderPlaced`, `PaymentProcessed`, `UserRegistered`
- Events carry enough data for consumers to act without callbacks
- Events are immutable — never modify a published event
- Consumers must be idempotent — events may be delivered more than once
- Dead letter queues for failed processing — never silently drop events

## Evolution Paths

| From | To | Trigger | Approach |
|------|----|---------|----------|
| Synchronous request-response | Event-driven | Async workflows emerge | Add event bus for specific flows; keep sync for user-facing |
| In-process event bus | Distributed broker | Multi-service event sharing needed | Replace in-process bus with Kafka/RabbitMQ; same event contracts |
| Choreography | Orchestration (Saga) | Complex multi-step workflows | Introduce saga orchestrator for workflows with compensation |
| Event-driven | Event sourcing | Need full audit trail / temporal queries | Store events as source of truth; derive state from event log |

## Tradeoffs

| Aspect | Gain | Cost |
|--------|------|------|
| Decoupling | Producers don't know about consumers | Harder to trace full request flow |
| Scalability | Producers and consumers scale independently | Message broker becomes critical infrastructure |
| Resilience | Async processing survives transient failures | Eventual consistency requires different reasoning |
| Extensibility | Add new consumers without changing producers | Event schema evolution needs governance |
| Debugging | Event log provides audit trail | Debugging distributed async flows is harder |

## Anti-Patterns

| Anti-Pattern | Description | Risk |
|-------------|-------------|------|
| Event soup | Too many fine-grained events without clear domain meaning | Impossible to understand system behavior |
| Event-driven everything | Using events for synchronous request-response flows | Unnecessary complexity, harder debugging |
| Missing dead letter queue | Failed events silently dropped | Data loss, silent failures |
| Mutable events | Modifying events after publication | Consumers process different versions of same event |
| Implicit ordering | Assuming events arrive in order without guaranteeing it | Race conditions, inconsistent state |
| God consumer | One consumer subscribing to dozens of event types | Tight coupling disguised as loose coupling |
