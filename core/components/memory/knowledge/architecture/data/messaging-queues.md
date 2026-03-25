# Message Brokers and Event Streaming

Asynchronous message delivery — queues, pub/sub, event streaming for decoupled systems.

**Search patterns:** Kafka, RabbitMQ, SQS, pub/sub, event streaming, message queue, broker, async, AMQP, event bus

## When to Choose

Message brokers decouple producers from consumers, enabling asynchronous processing, load leveling, and system resilience. Choose when: operations can be processed asynchronously (order processing, email sending, data pipelines), systems need to communicate without tight coupling, workloads need load leveling (absorb traffic spikes), or event sourcing / event-driven architecture is in use. Kafka is the standard for high-throughput event streaming with replay capability. RabbitMQ excels at complex routing and traditional queue patterns. SQS is the simplest option for AWS-native applications.

## When to Avoid

Avoid when all operations must be synchronous and immediate — don't add async complexity if the user needs an instant response. Avoid when the system has only one producer and one consumer with no decoupling benefit. Avoid when the team can't reason about eventual consistency — messaging introduces ordering, duplication, and delivery guarantees that require understanding.

## Scale Profile

| Dimension | Sweet Spot | Stretch | Break Point |
|-----------|-----------|---------|-------------|
| Messages/sec | 1K-1M | 1M-10M (Kafka) | > 10M (custom partitioning) |
| Consumer count | 2-50 | 50-500 | > 500 (fanout management) |
| Message retention | Hours-days (queues), days-weeks (Kafka) | Months (Kafka) | Permanent (event sourcing territory) |

## Key Components

| Broker | Strengths | Best For |
|--------|----------|---------|
| Apache Kafka | High throughput, replay, ordered partitions, log-based | Event streaming, data pipelines, event sourcing, high-volume |
| RabbitMQ | Flexible routing, multiple patterns (work queue, pub/sub, RPC), AMQP | Complex routing, traditional messaging, moderate throughput |
| AWS SQS/SNS | Fully managed, serverless, no operational burden | AWS-native apps, simple queuing, dead letter queues |
| Google Pub/Sub | Managed, global, auto-scaling | GCP-native apps, global messaging |
| Redis Streams | Lightweight, built into Redis | Simple streaming when Redis is already in stack |
| NATS | Lightweight, cloud-native, JetStream for persistence | Microservices communication, edge messaging |

## Tradeoffs

| Aspect | Gain | Cost |
|--------|------|------|
| Decoupling | Producers and consumers evolve independently | Debugging distributed async flows is harder |
| Resilience | Messages survive consumer downtime | At-least-once delivery means idempotency required |
| Scalability | Consumers scale independently of producers | Broker becomes critical infrastructure |
| Kafka replay | Re-process historical events, new consumers catch up | Storage costs for retained events, operational complexity |
| SQS simplicity | Zero ops, pay-per-message | Limited features vs Kafka/RabbitMQ |

## Anti-Patterns

| Anti-Pattern | Description | Risk |
|-------------|-------------|------|
| Async for sync needs | Using queues when user needs immediate response | Poor user experience, unnecessary complexity |
| No dead letter queue | Failed messages silently dropped | Data loss, silent failures |
| Non-idempotent consumers | Consumer can't safely process same message twice | Data corruption on redelivery |
| Kafka for simple queuing | Using Kafka when SQS or RabbitMQ would suffice | Operational overhead without benefit |
| Unbounded queues | No monitoring on queue depth | Memory exhaustion, cascade failures |
