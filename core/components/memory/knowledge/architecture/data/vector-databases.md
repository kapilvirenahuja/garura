# Vector Databases

Stores for embedding vectors — similarity search, ANN (approximate nearest neighbors), semantic retrieval.

**Search patterns:** vector, embeddings, similarity, ANN, Pinecone, Weaviate, pgvector, Qdrant, Chroma, Milvus, semantic search, RAG

## When to Choose

Vector databases are essential for any application using embeddings — RAG systems, semantic search, recommendation engines, image similarity, anomaly detection. Choose when: the product uses LLMs with retrieval (RAG), search needs to understand meaning rather than just keywords, or recommendations need to find "similar" items based on embedding similarity. The choice between managed (Pinecone) and self-hosted (Qdrant, Weaviate) or embedded (pgvector, Chroma) depends on scale and operational preferences. pgvector deserves special attention — if you're already using PostgreSQL, adding vector search to your existing database avoids an entirely new infrastructure component.

## When to Avoid

Avoid when keyword search (BM25) is sufficient — don't add embedding infrastructure if the queries are simple keyword matching. Avoid when the dataset is small enough (< 1,000 items) that brute-force similarity works. Avoid as a general-purpose database — vector stores are specialized for similarity search, not CRUD operations.

## Scale Profile

| Dimension | Sweet Spot | Stretch | Break Point |
|-----------|-----------|---------|-------------|
| Vector count | 10K-10M | 10M-1B | > 1B (sharding, cost critical) |
| Dimensions | 768-1536 | 2048-3072 | > 3072 (storage and compute costs) |
| Query latency | 10-100ms | 100-500ms | > 1s (index optimization needed) |

## Key Components

| Database | Strengths | Best For |
|----------|----------|---------|
| pgvector | PostgreSQL extension — no new infrastructure, ACID, hybrid queries | Teams already on PostgreSQL, < 5M vectors, hybrid SQL + vector |
| Pinecone | Fully managed, serverless, simple API | Managed simplicity, production RAG without ops burden |
| Weaviate | Hybrid search (vector + BM25), built-in vectorizers, GraphQL | Hybrid RAG, objects with properties + vectors |
| Qdrant | High performance, Rust-based, filtering + vector | Performance-critical, filtered vector search |
| Chroma | Embedded, Python-native, simple API | Prototyping, small-scale, local development |
| Milvus | Distributed, GPU-accelerated, billion-scale | Very large scale, on-premises deployment |

## Tradeoffs

| Aspect | Gain | Cost |
|--------|------|------|
| Semantic search | Finds meaning, not just keywords | Embedding generation cost per document |
| Scale | Purpose-built for high-dimensional similarity | Additional infrastructure to manage |
| pgvector simplicity | No new database, SQL + vectors together | Performance ceiling lower than purpose-built |
| Managed (Pinecone) | Zero ops, auto-scaling | Vendor lock-in, per-query pricing |

## Anti-Patterns

| Anti-Pattern | Description | Risk |
|-------------|-------------|------|
| Vector DB for everything | Using vector search where keyword/SQL would be better | Over-engineering, worse precision for exact queries |
| Ignoring pgvector | Adding Pinecone when PostgreSQL is already in the stack and scale is moderate | Unnecessary infrastructure, cost, complexity |
| No metadata filtering | Searching all vectors without pre-filtering by metadata | Poor relevance, wasted compute |
| Skipping evaluation | No metrics on retrieval quality (recall@K, precision) | Silent quality degradation |
