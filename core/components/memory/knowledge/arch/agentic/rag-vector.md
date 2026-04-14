# Vector-Based RAG (Retrieval-Augmented Generation)

Embedding documents into vector space and retrieving semantically similar chunks to augment LLM context.

**Search patterns:** RAG, vector, embeddings, retrieval, semantic search, Pinecone, Weaviate, Chroma, pgvector, similarity, ANN, embedding model, chunk

## When to Choose

Vector RAG is the standard approach when the LLM needs to reason over a corpus of documents that doesn't fit in context. It works well for: knowledge bases, documentation search, customer support chatbots, content-rich products, and any application where users ask natural language questions against a body of text. The embedding model captures semantic meaning — "comfortable running shoes" matches documents about "supportive footwear" even without keyword overlap. Choose when: document corpus is text-heavy, queries are natural language, and the relationship between documents is primarily content similarity rather than structural/relational. PP-2 >= 4 (Omni-Channel+) with AI features, PP-1 = 3-5 (non-technical users asking questions), and products with > 1,000 documents benefit most.

## When to Avoid

Avoid when relationships between entities matter more than content similarity — "who reports to whom" or "which drug interacts with which" are graph problems, not vector problems. Avoid for structured data queries ("show me all orders above $500") — SQL is better. Avoid when the corpus is small enough to fit in context (< 50 pages) — just stuff it in the prompt. Avoid when exact keyword matching is essential (legal discovery, compliance search) — BM25 or hybrid is better. Vector search finds "similar" content but can miss exact matches that keyword search catches.

## Scale Profile

| Dimension | Sweet Spot | Stretch | Break Point |
|-----------|-----------|---------|-------------|
| Document count | 1K-1M documents | 1M-100M | > 100M (sharding, cost concerns) |
| Query latency | 50-200ms | 200-500ms | > 1s (index optimization needed) |
| Embedding dimensions | 768-1536 | 3072 | > 3072 (diminishing returns, high cost) |
| Update frequency | Daily batch | Hourly | Real-time (streaming pipeline needed) |

## Key Components

| Component | Options | Selection Guidance |
|-----------|---------|-------------------|
| Embedding model | OpenAI text-embedding-3, Cohere embed-v3, Voyage, local models (BAAI/bge) | OpenAI for quality + simplicity; local models for data privacy; Cohere for multilingual |
| Vector store | Pinecone, Weaviate, Chroma, Qdrant, pgvector, Milvus | Pinecone for managed simplicity; pgvector for Postgres-native; Weaviate for hybrid; Chroma for prototyping |
| Chunking strategy | Fixed-size, semantic (paragraph/section), recursive, document-aware | Semantic chunking for structured docs; recursive for general; document-aware for PDFs/HTML |
| Retrieval strategy | Top-K similarity, MMR (maximal marginal relevance), contextual compression | MMR for diversity; contextual compression to reduce noise |
| Reranking | Cohere Rerank, cross-encoder models, LLM-based rerank | Reranking significantly improves precision — use for production |

## Reference Architecture

```
Indexing Pipeline:
  Documents → Chunker → Embedding Model → Vector Store
                                        → Metadata Store (optional)

Query Pipeline:
  User Query → Embedding Model → Vector Search (top-K)
                                → Reranker (optional)
                                → Context Assembly
                                → LLM (query + retrieved context)
                                → Response

src/
├── ingestion/
│   ├── chunker.ts              # Document → chunks
│   ├── embedder.ts             # Chunks → vectors
│   ├── loader.ts               # Source → documents (PDF, HTML, MD)
│   └── pipeline.ts             # Orchestrate ingest
├── retrieval/
│   ├── search.ts               # Vector similarity search
│   ├── reranker.ts             # Cross-encoder reranking
│   ├── context-builder.ts      # Assemble retrieved chunks into prompt
│   └── filters.ts              # Metadata filtering (date, source, etc.)
├── generation/
│   ├── prompt-templates/       # System prompts, few-shot examples
│   ├── llm-client.ts           # LLM API client
│   └── response-parser.ts      # Parse structured output
└── evaluation/
    ├── retrieval-metrics.ts    # Recall@K, MRR, NDCG
    └── generation-metrics.ts   # Faithfulness, relevance, hallucination
```

**RAG design rules:**
- Chunk size matters more than embedding model — too small loses context, too large adds noise
- Always include metadata (source, date, section) for filtering and attribution
- Reranking after initial retrieval significantly improves precision
- Evaluate retrieval and generation separately — a good retriever with bad prompts produces bad results
- Monitor for hallucination — LLM may generate answers not grounded in retrieved context

## Evolution Paths

| From | To | Trigger | Approach |
|------|----|---------|----------|
| Prompt stuffing | Vector RAG | Corpus exceeds context window | Add embedding + vector store; keep same LLM |
| Vector RAG | Hybrid RAG | Keyword precision needed | Add BM25 alongside vector search; fuse results |
| Vector RAG | Graph RAG | Relationship queries emerge | Add knowledge graph for entity relationships; keep vector for content |
| Vector RAG | Agentic RAG | Multi-step reasoning needed | Add agent loop that decides what to retrieve and when |

## Tradeoffs

| Aspect | Gain | Cost |
|--------|------|------|
| Semantic understanding | Finds relevant content even without keyword match | May miss exact keyword matches (use hybrid) |
| Scalability | Handles millions of documents efficiently | Embedding and storage costs scale with corpus |
| Quality | Reranking + good chunking produces high-quality context | Garbage in, garbage out — poor chunking ruins everything |
| Latency | Vector search is fast (50-200ms) | Add LLM generation time (500ms-5s) |
| Maintenance | Update index when documents change | Stale index returns outdated information |

## Anti-Patterns

| Anti-Pattern | Description | Risk |
|-------------|-------------|------|
| Chunk and pray | Random chunk sizes with no attention to document structure | Lost context, irrelevant retrieval |
| No reranking | Trusting raw similarity scores for final ranking | Low precision, noisy context sent to LLM |
| Ignoring metadata | No source attribution, date, or section info | Can't filter, can't attribute, can't debug |
| Embed everything | Embedding tables, code, images as text | Embeddings are optimized for natural language prose |
| No evaluation | No metrics on retrieval quality or answer accuracy | Silent degradation as corpus grows |
| Stale index | Documents updated but embeddings not re-generated | Answers based on outdated information |
