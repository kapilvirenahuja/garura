# Document Databases (NoSQL)

Schema-flexible storage — JSON/BSON documents with nested structures, ideal for variable-shape data.

**Search patterns:** MongoDB, DynamoDB, Firestore, document, schema-less, NoSQL, JSON, BSON, flexible schema, document store

## When to Choose

Document databases excel when data shape varies across records, when the access pattern is key-based (fetch document by ID), or when the data is naturally hierarchical (user profiles with nested preferences, product listings with variable attributes). Choose when: schema evolves rapidly (early-stage products, experimentation), the data model is document-centric (CMS, catalogs with variable attributes), or serverless operation is needed (DynamoDB, Firestore scale automatically). DynamoDB provides single-digit millisecond reads at any scale. Firestore integrates seamlessly with Firebase for mobile/web.

## When to Avoid

Avoid when data has strong relationships that need joins — document databases don't do joins well. Avoid for financial data requiring ACID transactions across documents (MongoDB has multi-document transactions but they're expensive). Avoid when complex analytical queries are needed (aggregation pipelines are less powerful than SQL). If you're storing documents but querying them relationally, use PostgreSQL with JSONB columns instead.

## Scale Profile

| Dimension | Sweet Spot | Stretch | Break Point |
|-----------|-----------|---------|-------------|
| Document count | 1K-100M | 100M-10B | > 10B (partitioning strategy critical) |
| Document size | 1KB-1MB | 1MB-16MB (MongoDB limit) | > 16MB (use object storage) |
| Access pattern | Key-based reads/writes | Range queries, secondary indexes | Complex joins (use SQL) |

## Key Components

| Database | Strengths | Best For |
|----------|----------|---------|
| MongoDB | Most popular, flexible queries, aggregation pipeline | General-purpose document store, content management |
| DynamoDB | Serverless, single-digit ms latency, infinite scale | Key-value/document at massive scale, AWS-native |
| Firestore | Real-time sync, Firebase integration, offline support | Mobile/web apps with Firebase, real-time data |
| Couchbase | Mobile sync, edge computing, SQL++ query language | Mobile-first with offline sync requirements |

## Tradeoffs

| Aspect | Gain | Cost |
|--------|------|------|
| Flexibility | No schema migrations, variable document shapes | No referential integrity — application must enforce |
| Scale | Horizontal scaling is built-in (sharding) | Query patterns must be designed upfront (especially DynamoDB) |
| Performance | Fast reads by document ID | Complex queries are slower than SQL |
| Development speed | Store objects directly, no ORM mapping | Data consistency is application-level responsibility |

## Anti-Patterns

| Anti-Pattern | Description | Risk |
|-------------|-------------|------|
| Relational in document | Normalizing data into many collections with references | Loses document DB benefits; use SQL instead |
| Unbounded document growth | Arrays in documents growing without limit | Performance degradation, document size limits |
| No indexes | Querying on unindexed fields | Collection scans, slow queries |
| Single collection | All data types in one collection | Impossible to query efficiently |
