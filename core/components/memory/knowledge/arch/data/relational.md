# Relational Databases (SQL)

Structured data storage with ACID transactions, SQL queries, and referential integrity.

**Search patterns:** SQL, PostgreSQL, MySQL, relational, ACID, transactions, database, schema, joins, migrations, RDS, Aurora

## When to Choose

Relational databases are the default choice for most applications. Choose when: data has clear relationships (users, orders, products), transactions need ACID guarantees (financial operations, inventory), complex queries are needed (joins, aggregations, window functions), or the data model is well-defined upfront. PostgreSQL is the most capable open-source database — it handles JSON, full-text search, geospatial, and even vector embeddings (pgvector), reducing the need for specialized databases. Nearly every application starts with a relational database, and many never need anything else.

## When to Avoid

Avoid as the sole database when the workload is write-heavy at extreme scale (> 100K writes/sec sustained) without sharding infrastructure. Avoid for unstructured data that changes schema frequently — document databases are more flexible. Avoid for graph-heavy queries (social networks, recommendation engines) where traversing relationships is the primary operation — graph databases are 100x faster for multi-hop queries.

## Scale Profile

| Dimension | Sweet Spot | Stretch | Break Point |
|-----------|-----------|---------|-------------|
| Data size | 1GB-1TB | 1TB-10TB | > 10TB (sharding or specialized stores) |
| Queries/sec | 1K-50K | 50K-500K (with read replicas) | > 500K writes/sec (sharding essential) |
| Schema stability | Stable, well-defined | Evolving (migrations) | Highly fluid (consider document DB) |

## Key Components

| Database | Strengths | Best For |
|----------|----------|---------|
| PostgreSQL | Most capable, JSON, full-text, pgvector, extensions | Default choice for almost everything |
| MySQL/MariaDB | Widespread, simple, fast reads | WordPress, legacy apps, read-heavy workloads |
| SQLite | Embedded, zero-config, serverless-friendly | Mobile apps, edge computing, small apps, testing |
| CockroachDB | Distributed SQL, global consistency | Multi-region with SQL semantics |
| PlanetScale | Serverless MySQL, branching, zero-downtime schema changes | Serverless-friendly MySQL |
| Neon | Serverless PostgreSQL, branching, auto-suspend | Serverless-friendly PostgreSQL |
| Supabase | PostgreSQL + auth + realtime + storage (Firebase alternative) | Full-stack platform on PostgreSQL |

## Tradeoffs

| Aspect | Gain | Cost |
|--------|------|------|
| ACID | Data integrity guaranteed | Performance overhead vs eventual consistency |
| SQL | Powerful, standardized query language | Schema migrations need planning |
| Joins | Efficient complex queries across related data | Joins become expensive at very large scale |
| Ecosystem | Most tooling, ORMs, migration tools, expertise | — (no significant cost) |
| Flexibility | PostgreSQL handles JSON, search, vectors | Jack of all trades may underperform specialized stores |

## Anti-Patterns

| Anti-Pattern | Description | Risk |
|-------------|-------------|------|
| No indexes | Relying on sequential scans for everything | Query performance degrades with data growth |
| ORM-only queries | Never writing raw SQL, even for complex queries | N+1 queries, inefficient joins, poor performance |
| Schema-less in SQL | Using JSON columns for everything, avoiding schema | Loses the benefits of relational — use a document DB instead |
| Single database for all services | Shared database across microservices | Tight coupling at the data tier |
| No connection pooling | Opening new connections per request | Connection exhaustion, especially in serverless |
