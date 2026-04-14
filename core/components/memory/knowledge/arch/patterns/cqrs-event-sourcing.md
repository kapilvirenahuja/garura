# CQRS and Event Sourcing

Command Query Responsibility Segregation separates reads from writes. Event Sourcing stores state as a sequence of events rather than current state.

**Search patterns:** CQRS, event sourcing, command query, audit, temporal, event store, read model, write model, projection, replay

## When to Choose

CQRS alone is valuable when read and write workloads have fundamentally different performance characteristics or data shapes — a product catalog with complex writes but simple reads, or a dashboard aggregating data from multiple write models. Event Sourcing adds value when you need a complete audit trail (PP-7 >= 4 regulated industries), temporal queries ("what was the account balance on March 1?"), or the ability to replay history to rebuild state. Together, they're powerful for financial systems, healthcare records, compliance-heavy applications, and systems where "why did this happen" is as important as "what is the current state." NFR-7 (Data Sensitivity) >= 4 with audit requirements strongly favors event sourcing. NFR-5 (Compliance) >= 4 with regulatory audit trail needs.

## When to Avoid

CQRS adds complexity — separate read and write models means more code, more infrastructure, and eventual consistency between them. Don't use CQRS for simple CRUD applications where reads and writes use the same data shape. Event Sourcing is even more complex — it changes the fundamental data model from "current state" to "event log," requiring a mental model shift for the entire team. Avoid for PP-6 = 1-2 (POC/MVP) unless the domain is inherently event-sourced (ledgers, audit). Avoid when the team has no experience with eventual consistency. Most applications never need either pattern.

## Scale Profile

| Dimension | Sweet Spot | Stretch | Break Point |
|-----------|-----------|---------|-------------|
| Write throughput | 100-10K events/sec | 10K-100K | > 100K (partitioning essential) |
| Event history | Months to years | Decades | Unlimited (with snapshotting) |
| Read model count | 1-5 projections | 5-20 | > 20 (projection management overhead) |
| Team experience | Senior developers | Mixed | Junior-only team (too complex) |

## Key Components

| Component | Options | Selection Guidance |
|-----------|---------|-------------------|
| Event store | EventStoreDB, PostgreSQL (append-only table), Kafka (as log) | EventStoreDB for native ES; PostgreSQL for small scale; Kafka for high throughput |
| Read model database | PostgreSQL, Elasticsearch, Redis, DynamoDB | Match to query patterns: SQL for complex queries; ES for search; Redis for fast lookups |
| Projection engine | Custom projectors, Marten (.NET), Axon (Java), custom | Framework-supported for Java/.NET; custom for Node/Python |
| Snapshotting | Periodic snapshots, on-demand, threshold-based | Essential for long event streams — snapshot every N events |
| Saga/Process manager | Temporal, Axon, custom state machine | For workflows spanning multiple aggregates |

## Reference Architecture

```
Write Side:
  Command → Command Handler → Aggregate → Events → Event Store
                                                  → Event Bus

Read Side:
  Event Bus → Projector → Read Model (optimized for queries)

Query:
  API → Read Model → Response (no business logic, just data)

Event Store (PostgreSQL example):
  events table:
    id: UUID
    aggregate_id: UUID
    aggregate_type: VARCHAR
    event_type: VARCHAR
    event_data: JSONB
    metadata: JSONB
    sequence_number: BIGINT
    created_at: TIMESTAMP
    -- APPEND ONLY: no UPDATE or DELETE
```

**CQRS/ES rules:**
- Events are the source of truth — current state is derived, not stored
- Events are immutable — corrections are new events ("AmountCorrected"), not edits
- Read models are disposable — rebuild from events at any time
- Snapshotting prevents unbounded replay time
- Eventual consistency between write and read sides — design for it

## Evolution Paths

| From | To | Trigger | Approach |
|------|----|---------|----------|
| CRUD | CQRS (without ES) | Read/write performance divergence | Separate read models; keep traditional write model |
| CQRS | CQRS + Event Sourcing | Audit trail needed | Replace write model with event store; project read models from events |
| Event-Driven | Event Sourcing | Events already exist; need replay/audit | Persist events permanently; add projections for read models |
| Event Sourcing | Archived ES | Event volume too large | Archive old events; maintain snapshots; keep recent events live |

## Tradeoffs

| Aspect | Gain | Cost |
|--------|------|------|
| Audit trail | Complete, immutable history of every state change | Storage grows linearly with every operation |
| Temporal queries | "What was the state at time T?" is trivial | Query patterns are different from traditional SQL |
| Debugging | Replay events to reproduce any state | Mental model shift for entire team |
| Read performance | Read models optimized per query pattern | Multiple read models to maintain and keep consistent |
| Consistency | Strong consistency on write side | Eventual consistency between write and read sides |

## Anti-Patterns

| Anti-Pattern | Description | Risk |
|-------------|-------------|------|
| CRUD with events | Storing events but querying the write model directly | Complexity of ES without the benefits |
| Event schema neglect | No versioning or evolution strategy for event schemas | Breaking changes make historical events unreadable |
| Missing snapshots | Replaying thousands of events on every read | Unbounded latency as event stream grows |
| Deletion events | Trying to "delete" events from the store | Violates immutability; use compensating events instead |
| Projecting everything | Building read models for hypothetical future queries | Maintenance burden for unused projections |
