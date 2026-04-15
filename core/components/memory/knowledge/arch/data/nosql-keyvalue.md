# Key-Value and Caching (Redis, Memcached)

In-memory data stores — sub-millisecond reads, caching, session storage, pub/sub, rate limiting.

**Search patterns:** Redis, Memcached, cache, key-value, session store, pub/sub, rate limiting, Valkey, Upstash, in-memory, caching layer

## When to Choose

Key-value stores are essential as a caching layer in front of slower databases, for session storage, rate limiting, leaderboards, real-time counters, and pub/sub messaging. Redis is the Swiss Army knife — it handles caching, sessions, pub/sub, sorted sets (leaderboards), streams (event log), and even lightweight queuing. Choose when: application performance needs a caching layer (most production apps), real-time features need sub-millisecond data access, or the product needs rate limiting, session storage, or real-time counters. Nearly every production application with performance requirements uses Redis or equivalent.

## When to Avoid

Avoid as a primary database — data in Redis is in-memory and while persistence exists (RDB, AOF), it's not designed for durable primary storage. Avoid for large datasets (> 100GB) unless budget allows for high-memory instances. Avoid when the caching complexity isn't justified — if the database is fast enough without caching, don't add a layer.

## Scale Profile

| Dimension | Sweet Spot | Stretch | Break Point |
|-----------|-----------|---------|-------------|
| Data size | 1MB-50GB | 50GB-500GB | > 500GB (expensive, consider tiered caching) |
| Operations/sec | 10K-1M | 1M-10M (Redis Cluster) | > 10M (application-level sharding) |
| Latency | Sub-millisecond | 1-5ms (networked) | — |

## Key Components

| Store | Strengths | Best For |
|-------|----------|---------|
| Redis / Valkey | Data structures (strings, hashes, sets, sorted sets, streams), pub/sub, Lua scripting | Caching, sessions, rate limiting, leaderboards, queues |
| Memcached | Simple, multi-threaded, pure cache | Simple caching (no data structures needed) |
| Upstash | Serverless Redis, pay-per-request, global replication | Serverless apps, edge computing |
| DragonflyDB | Redis-compatible, multi-threaded, higher throughput | Drop-in Redis replacement for higher performance |

## Tradeoffs

| Aspect | Gain | Cost |
|--------|------|------|
| Speed | Sub-millisecond reads and writes | Data in memory — expensive for large datasets |
| Versatility | Caching, sessions, pub/sub, queues, counters — one tool | Complexity if using Redis for too many purposes |
| Simplicity | Simple key-value API, easy to get started | Cache invalidation is one of the hardest problems |
| Availability | Redis Sentinel/Cluster for high availability | Cluster mode adds operational complexity |

## Anti-Patterns

| Anti-Pattern | Description | Risk |
|-------------|-------------|------|
| Redis as primary DB | Storing primary data only in Redis without durable backing | Data loss on restart or failure |
| No eviction policy | Cache grows unbounded until OOM | Application crash |
| Cache stampede | All cache entries expire at once, thundering herd to database | Database overload |
| Ignoring serialization | Storing large objects without considering serialization cost | Latency from serialization, not Redis |
