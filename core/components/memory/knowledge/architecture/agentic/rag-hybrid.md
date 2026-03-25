# Hybrid RAG (Vector + Keyword + Graph Fusion)

Combining multiple retrieval strategies — vector similarity, keyword matching (BM25), and optionally graph traversal — for comprehensive, precise retrieval.

**Search patterns:** hybrid RAG, BM25, reranking, fusion, ensemble, reciprocal rank fusion, vectorless, keyword, combined retrieval, multi-strategy

## When to Choose

Hybrid RAG is the production-grade approach when neither pure vector nor pure keyword search is sufficient alone. Vector search captures semantic meaning but misses exact keyword matches. BM25 captures exact terms but misses semantic equivalents. Together, they cover both cases. Choose for production systems where retrieval quality directly impacts user trust — legal search (need exact statute references AND semantic understanding), e-commerce search (need exact product IDs AND "comfortable shoes"), technical documentation (need exact API names AND conceptual queries). Most production RAG systems should be hybrid — pure vector is a starting point, not an end state. Adding graph traversal creates a triple-strategy system for domains with both content and relationship needs.

## When to Avoid

Avoid the complexity if the corpus is small (< 1,000 documents) and a single strategy works well enough. If you haven't benchmarked pure vector RAG first, start there — hybrid adds infrastructure and tuning complexity. Don't add graph to the mix unless you have genuine relationship queries. PP-6 = 1 (POC) should start with pure vector and add strategies based on evaluation results.

## Scale Profile

| Dimension | Sweet Spot | Stretch | Break Point |
|-----------|-----------|---------|-------------|
| Document count | 10K-10M | 10M-100M | > 100M (per-strategy scaling needed) |
| Query types | Mixed semantic + keyword | Predominantly one type | Single type only (use that strategy alone) |
| Retrieval strategies | 2-3 (vector + BM25 + optional graph) | 4-5 | > 5 (diminishing returns, fusion complexity) |
| Tuning investment | Moderate (fusion weights, reranking) | High (per-query strategy selection) | Unbounded (adaptive per-query routing) |

## Key Components

| Component | Options | Selection Guidance |
|-----------|---------|-------------------|
| Vector search | Pinecone, Weaviate, pgvector, Qdrant | Same as vector RAG — choose based on infrastructure |
| Keyword search | Elasticsearch BM25, Typesense, Meilisearch, SQLite FTS | Elasticsearch for scale; Typesense for simplicity |
| Fusion strategy | Reciprocal Rank Fusion (RRF), weighted combination, learned fusion | RRF for simplicity; learned fusion for optimized quality |
| Reranker | Cohere Rerank, cross-encoder (ms-marco), LLM-based | Cohere for managed; cross-encoder for self-hosted; LLM for highest quality |
| Query router | LLM-based classification, rule-based, embedding similarity | LLM classifier for adaptive; rules for predictable domains |

## Reference Architecture

```
Parallel Retrieval:
  User Query ──┬──→ Vector Search (semantic, top-K)
               ├──→ BM25 Search (keyword, top-K)
               └──→ Graph Traversal (relationship, optional)
                        │
                        ▼
               Fusion (Reciprocal Rank Fusion)
                        │
                        ▼
               Reranker (cross-encoder)
                        │
                        ▼
               Context Assembly (deduplicated, ordered)
                        │
                        ▼
               LLM Generation (query + fused context)

Advanced — Query Routing:
  User Query → Query Classifier (LLM)
    ├── "factual/exact" → BM25 primary, vector secondary
    ├── "conceptual/semantic" → Vector primary, BM25 secondary
    └── "relationship" → Graph primary, vector secondary
```

**Hybrid design rules:**
- Run retrieval strategies in parallel — don't add sequential latency
- Reciprocal Rank Fusion (RRF) is the default fusion strategy — simple, effective, no tuning
- Always rerank after fusion — the fused list needs a final quality pass
- Deduplicate across strategies before sending to LLM
- Evaluate each strategy independently AND the fused result — know where quality comes from

## Evolution Paths

| From | To | Trigger | Approach |
|------|----|---------|----------|
| Vector RAG | Hybrid (vector + BM25) | Exact match failures in evaluation | Add BM25 index alongside vector; fuse with RRF |
| Hybrid (2-way) | Hybrid + Graph (3-way) | Relationship queries in user feedback | Add graph retrieval as third strategy; weight in fusion |
| Hybrid | Adaptive Hybrid | Different queries need different strategies | Add query router to weight strategies per query type |
| Hybrid | Agentic RAG | Multi-step reasoning needed | Agent decides which retrieval strategy to use per step |

## Tradeoffs

| Aspect | Gain | Cost |
|--------|------|------|
| Retrieval quality | Best of both worlds — semantic + exact | Multiple indexes to maintain |
| Precision | Catches what either strategy alone misses | Fusion tuning (weights, K values) |
| Robustness | Degrades gracefully if one strategy fails | More infrastructure (vector DB + search engine) |
| Latency | Parallel retrieval keeps latency manageable | Still slower than single strategy |
| Evaluation | Can measure contribution of each strategy | More metrics to track, more experiments to run |

## Anti-Patterns

| Anti-Pattern | Description | Risk |
|-------------|-------------|------|
| Sequential retrieval | Running strategies one after another instead of parallel | Unnecessary latency multiplication |
| No deduplication | Same document retrieved by both strategies, sent twice to LLM | Wasted context window, biased ranking |
| Equal weighting without evaluation | Assuming 50/50 vector/BM25 is optimal | One strategy may dominate; weights should be tuned |
| Adding strategies without evaluation | "More strategies must be better" | Diminishing returns after 2-3; noise increases |
| Skipping reranking | Trusting fusion output directly | Fusion produces good candidates; reranking produces good ordering |
