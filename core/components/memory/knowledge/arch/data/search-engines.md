# Search Infrastructure (Elasticsearch, Algolia, Meilisearch)

Dedicated search engines — full-text indexing, relevance ranking, faceting, autocomplete.

**Search patterns:** Elasticsearch, Algolia, Meilisearch, Typesense, full-text, indexing, search engine, Lucene, Solr, OpenSearch

## When to Choose

Dedicated search engines matter when database LIKE queries aren't sufficient — when the product needs relevance ranking, typo tolerance, faceted filtering, or autocomplete. Choose when: the product has a search-heavy UX (e-commerce product search, knowledge base, documentation), content volume exceeds what database full-text search handles performantly (> 10K documents), or search quality directly impacts business metrics (conversion from search, content discovery). Elasticsearch is the enterprise standard. Algolia provides the best instant search UX out of the box. Meilisearch and Typesense are simpler, faster to set up, and often sufficient.

## When to Avoid

Avoid when PostgreSQL's built-in full-text search is sufficient — for small catalogs (< 10K items) with simple search needs, a dedicated search engine adds unnecessary infrastructure. Avoid when the search is purely structured (exact filters, sorting) — database queries are simpler. Avoid Elasticsearch for small teams without DevOps capacity — it's operationally complex to run and tune.

## Scale Profile

| Dimension | Sweet Spot | Stretch | Break Point |
|-----------|-----------|---------|-------------|
| Document count | 10K-100M | 100M-1B (Elasticsearch) | > 1B (cluster management critical) |
| Query latency | 10-100ms | 100-200ms | > 500ms (indexing/query optimization needed) |
| Index size | 1GB-1TB | 1TB-10TB | > 10TB (dedicated cluster, sharding strategy) |

## Key Components

| Engine | Strengths | Best For |
|--------|----------|---------|
| Elasticsearch / OpenSearch | Most feature-rich, aggregations, analytics, scalable | Enterprise search, log analytics, complex search requirements |
| Algolia | Best instant search UX, managed, typo tolerance | E-commerce product search, documentation search, SaaS search bars |
| Meilisearch | Simple, fast setup, good defaults, open-source | Small-to-medium search needs, developer-friendly |
| Typesense | Fast, typo tolerance, simple API, open-source | Alternative to Algolia with self-hosting option |

## Tradeoffs

| Aspect | Gain | Cost |
|--------|------|------|
| Relevance | Proper ranking, typo tolerance, synonyms | Index management, relevance tuning |
| Performance | Purpose-built for search, very fast | Additional infrastructure component |
| Features | Faceting, autocomplete, highlighting, aggregations | Data sync between primary DB and search index |
| Algolia managed | Best DX, zero ops | Per-search pricing, vendor lock-in |
| Elasticsearch self-hosted | Maximum control and features | Significant operational burden (JVM tuning, cluster management) |

## Anti-Patterns

| Anti-Pattern | Description | Risk |
|-------------|-------------|------|
| Elasticsearch as primary DB | Using Elasticsearch for CRUD, not just search | No ACID transactions, eventual consistency for writes |
| No index sync strategy | Search index diverges from primary database | Stale search results, missing content |
| Over-indexing | Indexing every field, including those never searched | Wasted storage, slower indexing, larger index |
| Ignoring PostgreSQL FTS | Adding Elasticsearch for 5K documents | Unnecessary infrastructure when pg_trgm and ts_vector suffice |
