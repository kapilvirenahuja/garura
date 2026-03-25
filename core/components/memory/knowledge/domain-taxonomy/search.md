# Search

Discovery, retrieval, and navigation through content and data.

**Search patterns:** search, discovery, full-text, facets, autocomplete, relevance, semantic search, vector search, typeahead, filtering, query, RAG, agentic search

## Features

### SR-F001: Full-Text Search

Core search capability — query input, text matching, result ranking.

**When It Matters:**
Search is table stakes for any content-rich application — the question is not IF but WHAT KIND. A product catalog with 50 items needs basic filtering. A knowledge base with 10,000 articles needs full-text with relevance tuning. A conversational product (support assistant, AI copilot) needs semantic search that understands intent, not just keywords. An agentic product needs search that can perform multi-step retrieval and synthesis. The depth decision is one of the most impactful architectural choices — it determines infrastructure requirements, cost, and user experience quality.

**Depth Spectrum:**
- **Basic:** Database LIKE queries or simple keyword matching. Works for small datasets (< 1,000 items). No ranking beyond recency. Sufficient for admin search and simple filtered lists.
- **Standard:** Full-text search engine (Elasticsearch, Algolia, Typesense, Meilisearch). TF-IDF or BM25 ranking. Stemming, tokenization, fuzzy matching. Handles thousands to millions of documents. The default for most production applications.
- **Advanced:** Semantic search with vector embeddings (OpenAI, Cohere, local models). Hybrid search (keyword + semantic). Vector database (Pinecone, Weaviate, pgvector). Understanding user intent beyond exact keyword match. "Show me comfortable running shoes" returns results even if "comfortable" isn't in the product title.
- **Agentic:** Intent-aware retrieval with RAG (retrieval-augmented generation). Multi-step search (decompose complex queries into sub-queries). Conversational search with context carryover. Search that synthesizes answers from multiple sources rather than returning a ranked list. AI-powered query understanding, reformulation, and result explanation.

**Signals:**
PP-2 (UX Maturity) is the primary depth driver: level 1-2 needs basic/standard; level 3-4 benefits from advanced; level 5 (agentic) needs agentic search. Content volume matters: < 100 items = basic; 100-10K = standard; 10K+ = advanced minimum. PP-1 >= 4 (consumer) expects Google-quality search experience. QP-1 (Testing Depth) >= 3 suggests integration tests for search relevance quality, index consistency, and query performance under load. QP-5 (Observability Maturity) >= 3 suggests metrics and alerting for search latency percentiles, zero-result rates, and index health. BRD keywords: "search", "find", "discover", "query", "look up", "intelligent search", "AI search".

**Tradeoffs:**
Including at higher depth: dramatically better user experience, discoverability, competitive differentiation. Cost: infrastructure (search engines, vector databases, embedding pipelines), latency management, index maintenance, relevance tuning expertise, embedding costs for semantic search, LLM costs for agentic search.

---

### SR-F002: Faceted Filtering

Narrowing results by attributes — category, price range, brand, rating, attributes.

**When It Matters:**
Faceted filtering is essential when the catalog has structured attributes that users want to filter by. E-commerce (filter by size, color, price, brand), job boards (filter by location, salary, experience), real estate (filter by bedrooms, price, area). Less relevant for unstructured content (articles, documents) where full-text search is primary. The depth depends on the number and complexity of filterable attributes.

**Depth Spectrum:**
- **Basic:** Static filters (predefined categories, price ranges). Checkbox/radio selection. Page reload on filter change.
- **Standard:** Dynamic facets (counts update as filters apply), multi-select within facets, range sliders (price, distance), facet ordering by relevance/count, URL-persisted filters (shareable filtered views).
- **Advanced:** Hierarchical facets (category trees), dependent facets (selecting "Electronics" shows sub-categories), custom attribute facets (user-defined product properties), facet analytics (which filters users apply most).
- **Enterprise:** Personalized facet ordering (show most relevant facets first based on user behavior), AI-suggested filters ("Users who searched this also filtered by..."), cross-index faceting (facets spanning multiple content types).

**Signals:**
Products with structured, attribute-rich catalogs. PP-2 >= 2 (beyond MVP) should have faceted filtering for catalogs > 50 items. PP-1 >= 3 (business professional and above) expects efficient filtering. NFR-3 (Performance) >= 3 needs fast facet computation. QP-1 (Testing Depth) >= 3 suggests integration tests for facet count accuracy, multi-select filter combinations, and URL-persisted filter state consistency. QP-6 (Accessibility Standard) >= 3 requires WCAG AA compliance for filter controls including checkboxes, range sliders, and dynamic facet count updates via ARIA live regions. BRD keywords: "filter", "narrow down", "browse by", "refine results", "facets".

**Tradeoffs:**
Including: faster product discovery, reduced search abandonment, better conversion. Cost: facet computation performance (can be expensive on large catalogs), attribute standardization requirement, facet UX design complexity, index configuration.

---

### SR-F003: Autocomplete / Typeahead

Real-time suggestions as the user types — query suggestions, product previews, quick results.

**When It Matters:**
Autocomplete reduces typing effort and guides users toward valid searches. It's expected in any consumer-facing search experience. For B2B products with complex taxonomies, autocomplete helps users discover the right terminology. The depth depends on how much value fast suggestions add — high for e-commerce (product previews in autocomplete), lower for simple content search.

**Depth Spectrum:**
- **Basic:** Prefix matching on product names/titles. Dropdown list of matching items. Client-side filtering for small datasets.
- **Standard:** Server-side autocomplete with debouncing, query suggestions (popular searches, recent searches), product/content previews in dropdown (thumbnail, price), highlight matching text.
- **Advanced:** Federated autocomplete (suggestions from multiple content types — products, categories, articles), typo tolerance, personalized suggestions (based on user history), trending searches.
- **Enterprise:** NLP-powered query understanding (mapping natural language to structured queries), visual autocomplete (image previews), contextual suggestions (different suggestions for different user roles), multilingual autocomplete.

**Signals:**
PP-1 >= 3 (business and above) expects autocomplete. PP-2 >= 3 (multi-channel responsive) should include autocomplete for any search-heavy experience. Catalogs with > 100 items benefit significantly. NFR-3 (Performance) >= 3 needs sub-200ms autocomplete responses. QP-6 (Accessibility Standard) >= 3 requires WCAG AA compliance for typeahead dropdowns including keyboard navigation, screen reader announcements, and ARIA combobox patterns. QP-5 (Observability Maturity) >= 3 suggests metrics for autocomplete response latency and suggestion click-through rates to monitor real-time performance. BRD keywords: "autocomplete", "typeahead", "suggestions", "instant search", "search as you type".

**Tradeoffs:**
Including: faster search completion, discovery of popular items, reduced zero-result searches. Cost: real-time query performance requirements, suggestion index maintenance, debouncing and caching strategy, mobile-specific UX considerations.

---

### SR-F004: Relevance Tuning

Customizing search result ranking — boosting, burying, synonyms, business rules.

**When It Matters:**
Out-of-the-box search ranking (BM25, TF-IDF) works for basic use cases but rarely matches business intent. E-commerce wants to boost high-margin products. Content platforms want to boost recent content. Marketplace platforms want to balance relevance with seller fairness. Relevance tuning becomes important when search is a primary navigation path and the business has opinions about what should appear first.

**Depth Spectrum:**
- **Basic:** Default search engine ranking. No customization. Results ordered by relevance score.
- **Standard:** Field boosting (title matches rank higher than description), synonym management, custom scoring factors (popularity, recency, rating), pinned/promoted results for specific queries.
- **Advanced:** Learning-to-rank (ML models trained on click data), A/B testing of ranking algorithms, query-specific boosting rules, personalized ranking (user history influences order), zero-result recovery (show related results).
- **Enterprise:** Business rules engine for ranking (promotional products, inventory-aware ranking), segment-specific ranking, real-time ranking adjustments, search revenue attribution, ranking fairness controls for marketplaces.

**Signals:**
Search-heavy products where result quality directly impacts business metrics. PP-6 >= 3 (market-ready) should invest in relevance tuning. PP-3 = 5 (marketplace) needs ranking fairness. PP-2 >= 4 (omni-channel) with search as primary navigation. QP-1 (Testing Depth) >= 3 suggests regression tests for ranking quality — saved query-result pairs that verify ranking changes don't degrade relevance for known queries. QP-5 (Observability Maturity) >= 3 suggests metrics for search result click-through rates, position-weighted CTR, and ranking model performance over time. BRD keywords: "relevance", "ranking", "search quality", "boost", "promoted results", "personalized search".

**Tradeoffs:**
Including: better search experience, higher conversion from search, business control over product visibility. Cost: ranking model development and maintenance, click data collection infrastructure, A/B testing framework, risk of over-optimization (relevance gaming).

---

### SR-F005: Search Analytics

Measuring search effectiveness — queries, clicks, conversions, zero-result rates.

**When It Matters:**
Search analytics tell you what users are looking for and whether they're finding it. High zero-result rates indicate content gaps or search quality issues. Popular queries reveal unmet demand. Click-through rates reveal result quality. This matters when search is a primary user flow and the business wants to optimize it. Less critical for products where search is a secondary feature.

**Depth Spectrum:**
- **Basic:** Log search queries and result counts. Identify zero-result queries manually. No dashboard.
- **Standard:** Search analytics dashboard showing top queries, zero-result queries, click-through rates, search conversion funnel (search → click → purchase/action). Trending queries.
- **Advanced:** Query clustering (grouping similar queries), search A/B testing metrics, user journey analysis (search to conversion path), query suggestion effectiveness, search revenue attribution.
- **Enterprise:** Real-time search performance monitoring, cross-channel search analytics, predictive analytics (demand forecasting from search trends), competitive intelligence from search patterns, compliance-aware analytics (GDPR for search data).

**Signals:**
Products where search is a primary navigation path. PP-6 >= 3 (market-ready) should have search analytics. NFR-1 (Risk) >= 3 with search-dependent revenue needs search monitoring. PP-2 >= 3 implies iterating on search quality, which requires analytics. QP-5 (Observability Maturity) >= 3 suggests the analytics pipeline itself needs monitoring — alerting on ingestion lag, dashboard data freshness, and anomalous query volume spikes. QP-3 (Documentation Level) >= 3 indicates documentation for analytics event schemas, query data retention policies, and GDPR-compliant data handling procedures. BRD keywords: "search analytics", "search performance", "zero results", "search optimization", "query analysis".

**Tradeoffs:**
Including: actionable insights for search improvement, content gap identification, revenue optimization from search. Cost: analytics pipeline development, query storage (privacy considerations under GDPR), dashboard development, data analysis expertise required to act on insights.
