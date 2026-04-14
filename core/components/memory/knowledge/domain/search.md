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

### Inclusion
- Default: **mandatory**
- Mandatory when: `project_profile.content_volume >= 100 or project_profile.business_model in ['ecommerce', 'marketplace', 'content_platform', 'saas']`
- Conditional when: `project_profile.ux_maturity >= 3 or project_profile.user_sophistication >= 4`
- Exclude when: `project_profile.content_volume < 50 and project_profile.audience == 'internal'`

### Success Criteria
- Search query latency < 300ms p95 end-to-end from submit to rendered result
- Zero-result rate < 5% of queries over any rolling 7-day window
- Top-10 click-through rate on queries > 30%
- Index refresh latency from document change to searchability < 60s

### Failure Scenarios
- Scenario: Search index falls out of sync with the source of truth and stale or missing results surface
  - Impact: Users search for items they just added and see no results, trust in the product collapses, and the merchandising team assumes search is "broken" without knowing the root cause
  - Mitigation: Run a reconciliation job comparing index state to source of truth every hour and alert on any drift exceeding 0.5% of total documents
- Scenario: A traffic spike overwhelms the search engine and query latency climbs past 2s
  - Impact: Users abandon the search flow, conversion drops, and the operational team discovers the issue only after customer complaints surface
  - Mitigation: Instrument p95 and p99 latency with hard alerts at 500ms p95 threshold, enforce query rate limiting per client, and provision read replicas for horizontal scale

### Cross-Tree Refs
- CTC-005 (Tight timeline excludes advanced-depth custom integrations) — advanced/agentic depth is EXCLUDED when timeline is tight
- CTC-010 (POC / MVP skips advanced depth) — advanced/agentic depth is EXCLUDED for POC / MVP ambitions
- CTC-015 (Search logs require GDPR-compliant retention) — this feature's query logging is IMPLIED by GDPR (proposed)

### Experiential
- Usage count: 0
- Scenarios observed: (none — bootstrap)
- Common mistakes:
  - Committing to a vector database and embedding pipeline for a catalog that would serve users equally well on BM25, burning ongoing embedding cost with no measurable relevance lift
  - Deferring relevance tuning as "something to iterate on" and shipping a search experience where the default ranking surfaces low-margin or out-of-stock items, directly undercutting the business model
- Last promoted: never

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

### Inclusion
- Default: **conditional**
- Mandatory when: `project_profile.catalog_size >= 50 and project_profile.business_model in ['ecommerce', 'marketplace', 'real_estate', 'jobs']`
- Conditional when: `project_profile.ux_maturity >= 2 and project_profile.user_sophistication >= 3`
- Exclude when: `project_profile.catalog_size < 20 or project_profile.content_structure == 'unstructured'`

### Success Criteria
- Facet application to result refresh latency < 300ms p95
- Facet count accuracy = 100% match between displayed count and actual result count
- Filter state URL-persistence round-trip success rate > 99% across shared links
- Facet adoption: > 40% of search sessions apply at least one filter

### Failure Scenarios
- Scenario: Facet counts are computed lazily and displayed counts lag behind applied filters, showing 0 for valid filters
  - Impact: Users think the product has no items in their preferred filter and abandon the search, even when matching items exist
  - Mitigation: Compute facet counts synchronously with the result query, enforce a contract that counts match the current result set, and add a visual loading state when counts are recomputing
- Scenario: A filter combination produces a result set with zero items and the UI shows an empty page with no suggestion
  - Impact: The user hits a dead end with no recovery path, doesn't know which filter caused the empty set, and leaves the session
  - Mitigation: When a filter combo returns zero results, show which filter most recently narrowed the set to zero and offer a one-click "remove this filter" action alongside a fallback suggestion

### Cross-Tree Refs
- CTC-005 (Tight timeline excludes advanced-depth custom integrations) — depth is CAPPED at Standard when timeline is tight
- CTC-010 (POC / MVP skips advanced depth) — depth is CAPPED at Standard for POC / MVP ambitions

### Experiential
- Usage count: 0
- Scenarios observed: (none — bootstrap)
- Common mistakes:
  - Exposing every product attribute as a facet without measuring which filters users actually apply, producing a cluttered UI where the useful facets are buried
  - Skipping attribute standardization across the catalog, so facets for "color" break because the source data has "Red", "red", "RED", and "crimson" as distinct values
- Last promoted: never

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

### Inclusion
- Default: **conditional**
- Mandatory when: `project_profile.user_sophistication >= 4 and project_profile.catalog_size >= 100`
- Conditional when: `project_profile.ux_maturity >= 3 or project_profile.business_model in ['ecommerce', 'marketplace', 'content_platform']`
- Exclude when: `project_profile.catalog_size < 50`

### Success Criteria
- Autocomplete response latency < 200ms p95 from keystroke to suggestions rendered
- Suggestion click-through rate > 25% of autocomplete interactions result in a selection
- Debounce interval holds < 100ms between keystroke and server call
- Mobile autocomplete usability: keyboard overlap < 10% of suggestion slots

### Failure Scenarios
- Scenario: Autocomplete suggests outdated results because the suggestion index lags the main search index
  - Impact: Users click a suggestion and land on a 404 or an out-of-stock page, producing a broken-flow experience that users attribute to the product, not the index lag
  - Mitigation: Update the autocomplete index within 60s of any source document change and reject suggestions whose target document cannot be resolved at click time
- Scenario: Debounce is set too aggressive and the autocomplete feels laggy on fast typists
  - Impact: Power users perceive the search experience as slow and disable autocomplete in favor of full submit-search, losing the discoverability benefit
  - Mitigation: Tune debounce to 80-100ms, instrument autocomplete-abort rate (user kept typing past the suggestion window) as a quality metric, and A/B test debounce values against consumer-grade baselines

### Cross-Tree Refs
- CTC-005 (Tight timeline excludes advanced-depth custom integrations) — depth is CAPPED at Standard when timeline is tight
- CTC-010 (POC / MVP skips advanced depth) — depth is CAPPED at Standard for POC / MVP ambitions

### Experiential
- Usage count: 0
- Scenarios observed: (none — bootstrap)
- Common mistakes:
  - Running autocomplete over a separate index from the main search without a sync contract, producing inconsistent results where typing the full query returns different items than picking the suggestion
  - Ignoring mobile-specific autocomplete UX (keyboard occlusion, tap targets, typing speed variance), shipping a desktop-designed experience that degrades the 60%+ mobile traffic
- Last promoted: never

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

### Inclusion
- Default: **conditional**
- Mandatory when: `project_profile.business_model in ['ecommerce', 'marketplace'] and project_profile.delivery_ambition >= 3`
- Conditional when: `project_profile.search_is_primary_navigation == true or project_profile.persona_complexity == 5`
- Exclude when: `project_profile.delivery_ambition <= 2 or project_profile.content_volume < 100`

### Success Criteria
- Ranking quality: saved query-result regression suite passes > 95% of test cases per release
- Search conversion rate lift from tuned ranking vs default > 20% on primary queries
- Synonym coverage: top 100 queries resolve against a tuned synonym list 100% of the time
- Click-position-weighted CTR improvement > 10% over baseline per release cycle

### Failure Scenarios
- Scenario: A ranking tweak optimized for top-level CTR surfaces low-margin products and depresses revenue
  - Impact: The search team reports a relevance improvement that the finance team reports as a revenue decline, and no one trusts the search metrics until the discrepancy is reconciled
  - Mitigation: Measure both CTR and margin-weighted revenue per query as dual guardrail metrics, reject ranking changes that improve one metric while degrading the other beyond a defined threshold
- Scenario: Learning-to-rank model trained on click data amplifies a position bias — popular items rank higher only because they were shown more
  - Impact: The long tail of the catalog becomes invisible, new items never surface, and the recommendation slot collapses into a perpetual "rich get richer" loop
  - Mitigation: Apply click-bias correction (inverse propensity weighting) in the training pipeline and periodically inject exploration traffic with uniform item sampling to gather unbiased signal

### Cross-Tree Refs
- CTC-005 (Tight timeline excludes advanced-depth custom integrations) — this feature is EXCLUDED when timeline is tight
- CTC-010 (POC / MVP skips advanced depth) — this feature is EXCLUDED for POC / MVP ambitions

### Experiential
- Usage count: 0
- Scenarios observed: (none — bootstrap)
- Common mistakes:
  - Tuning ranking without a regression test suite, shipping an improvement for one query class while silently degrading another, and only discovering the regression when a customer complains
  - Over-optimizing for a single business metric (margin, velocity, promotion) and producing a search experience where the results feel like a sales pitch rather than a discovery surface
- Last promoted: never

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

### Inclusion
- Default: **conditional**
- Mandatory when: `project_profile.search_is_primary_navigation == true and project_profile.delivery_ambition >= 3`
- Conditional when: `project_profile.business_model in ['ecommerce', 'marketplace', 'content_platform'] or project_profile.observability_maturity >= 3`
- Exclude when: `project_profile.delivery_ambition <= 2 or project_profile.content_volume < 100`

### Success Criteria
- Search analytics ingestion lag < 5 minutes from query event to dashboard visibility
- Dashboard query response latency < 2s p95 for 90-day rolling window analysis
- Zero-result query detection and reporting cadence = daily (100% coverage of queries)
- Query data retention policy compliance: 100% of queries older than retention window are purged within 24 hours of expiry

### Failure Scenarios
- Scenario: Raw query strings are logged with PII (user names, email addresses typed into the search box) and retained indefinitely
  - Impact: The query log becomes a GDPR liability — a data-minimization failure that surfaces during audit and forces emergency purging of historical analytics data
  - Mitigation: Apply PII-scrubbing in the ingestion pipeline (regex + ML PII detection), enforce a hard retention limit matched to the strictest applicable regulation, and document the query-data handling procedure for auditors
- Scenario: Zero-result query rate spikes after a product launch and goes unnoticed for days
  - Impact: A content gap becomes a silent conversion leak, users searching for the new product category find nothing, and the launch underperforms
  - Mitigation: Alert on zero-result rate crossing 7% day-over-day, produce a weekly "top zero-result queries" report, and auto-surface gaps to the merchandising team

### Cross-Tree Refs
- CTC-006 (GDPR compliance requires profile data export and deletion) — search query data is IMPLIED in GDPR data export and deletion scope
- CTC-010 (POC / MVP skips advanced depth) — depth is CAPPED at Standard for POC / MVP ambitions
- CTC-015 (Search logs require GDPR-compliant retention) — this feature is IMPLIED (proposed)

### Experiential
- Usage count: 0
- Scenarios observed: (none — bootstrap)
- Common mistakes:
  - Logging every query as an unstructured blob in application logs and discovering at compliance review that the "analytics pipeline" is a grep over 90 days of log files
  - Treating search analytics as a batch reporting feature instead of a feedback loop, producing dashboards no one reads and missing the actionable zero-result signal entirely
- Last promoted: never
