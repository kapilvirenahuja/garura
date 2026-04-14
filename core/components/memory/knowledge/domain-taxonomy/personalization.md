# Personalization

Tailoring user experience based on behavior, preferences, and context.

**Search patterns:** personalization, recommendations, A/B testing, user segments, behavioral triggers, preference, machine learning, targeting, engagement, retention, adaptive

## Features

### PS-F001: Basic Recommendations (Rule-Based)

Content and product suggestions based on explicit rules — popular items, related products, hand-curated lists.

**When It Matters:**
Rule-based recommendations are the starting point for personalization. They work when the catalog is small enough to curate manually or when business logic drives recommendations (e.g., "show accessories for the product being viewed," "recommend popular items in this category"). They don't require ML infrastructure and can ship quickly. Products with small catalogs, clear category structures, or strong editorial voice often get more value from curated recommendations than ML-based ones.

**Depth Spectrum:**
- **Basic:** "Popular items" list (sorted by sales/views). "You may also like" based on same category. Static, hand-curated featured sections.
- **Standard:** "Frequently bought together" (based on co-purchase data), "Related products" (attribute similarity — same brand, similar price), category-level trending, recently viewed items.
- **Advanced:** Contextual rules (time-of-day, seasonal, geographic), user segment-based recommendations (new users see different items than returning), cross-sell/upsell rules engine, editorial picks with scheduling.
- **Enterprise:** Multi-channel recommendation orchestration (web, email, push — consistent recommendations), business rules integration (margin-aware recommendations, inventory-aware), A/B testing of rule sets.

**Signals:**
Any product with a catalog of items users choose from. PP-6 = 1-2 (POC/MVP) can start with basic popular items. PP-2 >= 3 should have contextual recommendations. PP-1 >= 4 (consumer) expects relevant suggestions. QP-1 (Testing Depth) >= 3 suggests integration tests for recommendation rule evaluation including cross-sell logic, category-based filtering, and fallback behavior when data is sparse. BRD keywords: "recommendations", "suggested", "you may also like", "popular", "trending", "related".

**Tradeoffs:**
Including: increased engagement, higher average order value, better content discovery. Cost: rule maintenance (rules need updating as catalog evolves), editorial curation effort, limited personalization (same rules for everyone in a segment), diminishing returns without behavioral data.

### Inclusion
- Default: **optional**
- Mandatory when: `project_profile.business_model in ['ecommerce', 'marketplace', 'content_platform'] and project_profile.catalog_size >= 50`
- Conditional when: `project_profile.ux_maturity >= 3 or project_profile.user_sophistication >= 4`
- Exclude when: `project_profile.catalog_size < 20 or project_profile.business_model == 'internal_tool'`

### Success Criteria
- Recommendation click-through rate > 8% on displayed slots
- Recommendation slot fill rate > 95% (fewer than 5% empty slots from rule miss)
- Rule engine evaluation latency < 100ms p95 per page render
- Cross-sell / upsell contribution to average order value > 10% lift

### Failure Scenarios
- Scenario: A curated rule ("show trending items") becomes stale as the catalog evolves and the same product list surfaces for weeks
  - Impact: Returning users see an unchanging storefront, engagement drops, and the recommendation slots become visual clutter with no business value
  - Mitigation: Instrument per-rule recency as a health metric, enforce a freshness gate that rotates the list at least every 24 hours, and flag rules whose outputs have not changed in a week
- Scenario: A rule filters out all items in the user's context and the slot renders empty
  - Impact: The product looks broken to the user, the intended merchandising message is lost, and conversion on the affected page drops
  - Mitigation: Define a cascading fallback chain (primary rule → secondary rule → popular-in-category → global popular) and instrument fallback-hit rates per rule

### Cross-Tree Refs
- CTC-010 (POC / MVP skips advanced depth) — depth is CAPPED at Standard for POC / MVP ambitions

### Experiential
- Usage count: 0
- Scenarios observed: (none — bootstrap)
- Common mistakes:
  - Treating rule maintenance as a one-time setup task and discovering six months later that half the rules reference deprecated categories or removed products
  - Adding so many editorial overrides that the recommendation surface becomes a hand-curated list disguised as an algorithm, eliminating measurable performance signals
- Last promoted: never

---

### PS-F002: ML-Based Recommendations

Personalized suggestions powered by machine learning — collaborative filtering, content-based, deep learning models.

**When It Matters:**
ML recommendations become valuable when the catalog is large enough that manual curation can't cover all user-item combinations, and when there's enough behavioral data (views, purchases, ratings) to train models. A product with 10,000+ items and 1,000+ active users benefits from collaborative filtering. Below that threshold, rule-based recommendations (PS-F001) often perform equally well with far less complexity. The depth depends on data volume, infrastructure maturity, and how central recommendations are to the user experience.

**Depth Spectrum:**
- **Basic:** Collaborative filtering (users who bought X also bought Y), item-based similarity. Pre-computed, batch-updated recommendations. Third-party service (Amazon Personalize, Recombee).
- **Standard:** Hybrid approach (collaborative + content-based), real-time feature injection (current session context), multiple recommendation slots (homepage, product page, cart), cold-start handling for new users/items.
- **Advanced:** Deep learning models (transformers, sequence models for session-based recommendations), real-time model inference, multi-objective optimization (relevance + diversity + novelty), embedding-based item similarity, contextual bandits for exploration/exploitation.
- **Enterprise:** Multi-modal recommendations (combining text, image, behavior signals), federated recommendations across product lines, real-time model retraining, recommendation explanations ("recommended because you..."), compliance-aware recommendations (fair representation, no discriminatory patterns).

**Signals:**
Products with large catalogs (10K+ items) and meaningful behavioral data. PP-2 >= 4 (omni-channel/agentic) benefits from sophisticated recommendations. NFR-6 (Scalability) >= 3 suggests the data volume that makes ML worthwhile. PP-6 >= 3 (market-ready) with recommendation-heavy UX. QP-1 (Testing Depth) >= 4 suggests model evaluation tests covering recommendation quality metrics (precision, recall, diversity), cold-start handling, and A/B test harness validation. QP-5 (Observability Maturity) >= 3 suggests metrics and alerting for model inference latency, recommendation coverage rates, and model drift detection. QP-3 (Documentation Level) >= 3 indicates documentation for model architecture, feature engineering pipelines, and recommendation API contracts. BRD keywords: "personalized", "machine learning", "collaborative filtering", "recommendation engine", "AI-powered suggestions".

**Tradeoffs:**
Including: significantly higher engagement and conversion, competitive differentiation, personalized experience. Cost: ML infrastructure (training pipelines, model serving, feature stores), cold-start problem for new users, data quality dependency, ongoing model monitoring (drift, bias), vendor costs for managed services, privacy implications (behavioral tracking).

### Inclusion
- Default: **conditional**
- Mandatory when: `project_profile.catalog_size >= 10000 and project_profile.active_users >= 1000 and project_profile.delivery_ambition >= 3`
- Conditional when: `project_profile.ux_maturity >= 4 or project_profile.business_model in ['content_platform', 'marketplace']`
- Exclude when: `project_profile.catalog_size < 1000 or project_profile.delivery_ambition <= 2`

### Success Criteria
- Model offline precision@10 > 0.25 on held-out evaluation set
- Online A/B lift of ML recommendations over rule-based baseline > 15% click-through rate
- Real-time inference latency < 150ms p95 per recommendation request
- Cold-start fallback coverage = 100% of users with fewer than 5 interactions

### Failure Scenarios
- Scenario: Model drift goes undetected and recommendation quality degrades over 6-8 weeks as user tastes evolve
  - Impact: Engagement and revenue attributable to recommendations decline slowly enough to escape weekly dashboards, and by the time someone notices, the model has been broken for a full quarter
  - Mitigation: Track offline evaluation metrics (precision@k, diversity, coverage) on a nightly cron against a rolling holdout and alert when any metric degrades more than 10% from the 30-day baseline
- Scenario: New users get a cold-start experience that returns generic popular items, producing no differentiation from rule-based baselines
  - Impact: The ML investment shows no lift for new-user cohorts and the team cannot justify the infrastructure cost
  - Mitigation: Implement a contextual cold-start strategy using available signals (referrer, landing page, initial click) and compare new-user engagement against rule-based control at Advanced depth or higher

### Cross-Tree Refs
- CTC-005 (Tight timeline excludes advanced-depth custom integrations) — this feature is EXCLUDED when timeline is tight
- CTC-010 (POC / MVP skips advanced depth) — this feature is EXCLUDED for POC / MVP ambitions
- CTC-014 (Behavioral personalization requires consent capture) — this feature is IMPLIED (proposed)

### Experiential
- Usage count: 0
- Scenarios observed: (none — bootstrap)
- Common mistakes:
  - Committing to a deep-learning recommendation approach on a catalog too small to train meaningful embeddings, burning infrastructure cost with no offline lift over collaborative filtering
  - Deferring the cold-start problem as "we'll solve it after launch" and then shipping a product where 70% of users see generic popular items because most sessions are new-user sessions
- Last promoted: never

---

### PS-F003: User Segments

Grouping users by behavior, attributes, or lifecycle stage for targeted experiences.

**When It Matters:**
Segmentation is the foundation for targeted personalization — before you can personalize, you need to define who gets what. Segments drive targeted promotions (PS-F001 → segment-specific rules), A/B testing (PS-F004 → segment-based experiments), behavioral triggers (PS-F005 → segment-specific automations), and email campaigns. Products with diverse user bases benefit most. A product where all users behave identically needs less segmentation.

**Depth Spectrum:**
- **Basic:** Static segments (new vs returning, paid vs free, geographic). Manual segment creation by admin.
- **Standard:** Behavioral segments (high-value, at-risk, dormant), lifecycle stages (onboarding, activated, power user, churning), segment-based content/feature visibility, segment overlap analysis.
- **Advanced:** Dynamic segments (real-time membership based on behavior), predictive segments (likely to churn, likely to upgrade), RFM analysis (recency, frequency, monetary), cohort tracking over time.
- **Enterprise:** Cross-channel segment sync (web, email, push, ads — same segments), segment-based personalization rules engine, privacy-compliant segmentation (anonymized, consent-aware), segment performance dashboards, integration with CDP (customer data platform).

**Signals:**
Products with diverse user bases where one-size-fits-all doesn't work. PP-3 >= 3 (multi-persona) naturally benefits from segmentation. PP-6 >= 3 (market-ready) should segment for targeted experiences. PP-1 >= 3 (business professional and above) expects relevant content. QP-1 (Testing Depth) >= 3 suggests integration tests for segment membership evaluation, dynamic segment transitions, and segment-based content targeting correctness. QP-3 (Documentation Level) >= 3 indicates documentation for segment definitions, membership criteria, and targeting rule configurations used by downstream marketing and product teams. BRD keywords: "segments", "targeting", "cohorts", "user groups", "lifecycle", "personalized".

**Tradeoffs:**
Including: targeted experiences, better marketing ROI, churn reduction through early identification. Cost: data infrastructure for behavioral tracking, segment logic maintenance, privacy compliance (consent for tracking), risk of over-segmentation (too many segments to maintain meaningfully).

### Inclusion
- Default: **conditional**
- Mandatory when: `project_profile.persona_complexity >= 3 and project_profile.delivery_ambition >= 3`
- Conditional when: `project_profile.business_model in ['ecommerce', 'saas', 'marketplace', 'content_platform'] or project_profile.has_personalization_module == true`
- Exclude when: `project_profile.delivery_ambition <= 2 and project_profile.persona_complexity <= 2`

### Success Criteria
- Segment membership evaluation latency < 50ms p95 per user lookup
- Dynamic segment refresh propagation < 5 minutes from behavior event to segment update
- Segment-targeted campaign lift > 20% over untargeted control on a matched conversion metric
- Segment coverage: every active user belongs to at least one segment (100% assignment)

### Failure Scenarios
- Scenario: Segments proliferate past 50 without governance and the marketing team loses track of which segments overlap
  - Impact: Conflicting campaigns target the same users with contradictory messages, users unsubscribe at a higher rate, and segment-based analysis becomes unreliable because overlap is unmeasured
  - Mitigation: Enforce a segment lifecycle (named owner, documented purpose, usage metrics) and auto-archive segments with zero campaign usage in 90 days
- Scenario: A behavioral segment is computed from data captured without consent under GDPR
  - Impact: The segment becomes unusable in the EU, compliance flags the segment as a data-protection breach, and the marketing team has to rebuild targeting from consented signals
  - Mitigation: Gate all behavioral segmentation inputs on a consent check at capture time, store consent state alongside the event, and partition segments by consent-available-region to prevent cross-contamination

### Cross-Tree Refs
- CTC-006 (GDPR compliance requires profile data export and deletion) — segment data is IMPLIED as part of GDPR data export scope
- CTC-010 (POC / MVP skips advanced depth) — depth is CAPPED at Standard for POC / MVP ambitions
- CTC-014 (Behavioral personalization requires consent capture) — this feature is IMPLIED (proposed)

### Experiential
- Usage count: 0
- Scenarios observed: (none — bootstrap)
- Common mistakes:
  - Creating segments without ownership metadata, accumulating 100+ segments over a year where no one knows which are still wired into campaigns and which are orphaned
  - Treating segment definitions as marketing config separate from privacy infrastructure, then discovering under audit that segment inputs were captured before the consent flow was enforced
- Last promoted: never

---

### PS-F004: A/B Testing

Controlled experiments comparing variants — feature flags, split testing, multivariate testing.

**When It Matters:**
A/B testing matters when the product team needs data-driven decisions about UX, features, or business logic changes. It's most valuable for consumer-facing products with enough traffic to reach statistical significance. B2B products with small user bases may not generate enough data for meaningful A/B tests. The depth depends on how data-driven the organization is and how frequently they iterate on the user experience.

**Depth Spectrum:**
- **Basic:** Feature flags (on/off per user segment). Manual traffic splitting. Results measured by comparing metrics before/after.
- **Standard:** Proper A/B testing with random assignment, statistical significance calculation, multiple metrics tracking (primary + guardrail metrics), experiment dashboard, percentage-based rollout.
- **Advanced:** Multivariate testing (multiple variables simultaneously), sequential testing (early stopping when significance reached), segmented experiment analysis (does the variant work differently for different segments), mutual exclusion between experiments.
- **Enterprise:** Experimentation platform (Optimizely, LaunchDarkly, internal), feature management beyond testing (gradual rollout, kill switches), ML-powered experiment analysis, automated experiment recommendations, cross-platform experiments (web + mobile).

**Signals:**
Products with enough traffic for statistical significance (typically 1,000+ daily active users). PP-6 >= 3 (market-ready) should have experimentation capability. PP-2 >= 3 (polished experience) implies iterating on UX, which benefits from A/B testing. QP-1 (Testing Depth) >= 3 suggests integration tests for experiment assignment consistency, variant isolation, and metric collection accuracy. QP-4 (CI/CD Maturity) >= 3 suggests feature flag integration with deployment pipelines for progressive rollout and automated experiment lifecycle management. BRD keywords: "A/B testing", "experimentation", "feature flags", "split test", "data-driven".

**Tradeoffs:**
Including: data-driven decisions, reduced risk of bad UX changes, continuous optimization. Cost: experimentation infrastructure, statistical expertise to interpret results, experiment management overhead, potential user experience inconsistency during experiments, slower deployment if everything needs testing.

### Inclusion
- Default: **conditional**
- Mandatory when: `project_profile.active_users >= 1000 and project_profile.delivery_ambition >= 3`
- Conditional when: `project_profile.ux_maturity >= 3 and project_profile.cicd_maturity >= 3`
- Exclude when: `project_profile.active_users < 500 or project_profile.delivery_ambition <= 2`

### Success Criteria
- Experiment assignment consistency = 100% (a user always sees the same variant within an experiment)
- Sample ratio mismatch (SRM) detection alert fires within 24 hours of any > 1% imbalance
- Experiment readout latency from completion to significance call < 1 hour
- Feature flag kill-switch propagation < 60s from toggle to global effect

### Failure Scenarios
- Scenario: Two concurrent experiments interact on the same page and neither can be cleanly measured
  - Impact: Both experiments produce noisy results, the team either makes a wrong call or cannot make any call, and weeks of traffic are wasted on inconclusive readouts
  - Mitigation: Enforce mutual exclusion between experiments touching overlapping surface area via a shared layer registry and reject new experiment setups that collide with an active one
- Scenario: A feature flag checks happen inside a hot code path and the experiment infrastructure adds significant latency
  - Impact: The control group experiences slower page loads than the treatment, confounding the lift metric and producing a false positive
  - Mitigation: Cache flag evaluations at request-start, assert flag-check latency < 5ms p99, and include a latency-parity guard in the experiment analysis pipeline

### Cross-Tree Refs
- CTC-005 (Tight timeline excludes advanced-depth custom integrations) — depth is CAPPED at Standard when timeline is tight
- CTC-010 (POC / MVP skips advanced depth) — depth is CAPPED at Standard for POC / MVP ambitions

### Experiential
- Usage count: 0
- Scenarios observed: (none — bootstrap)
- Common mistakes:
  - Running experiments without a statistical-significance threshold defined up front, then retroactively picking the metric that "won" and declaring victory
  - Shipping feature flags into production without deletion discipline, accumulating hundreds of dead flags that multiply the code-path combinatorial surface and slow every deploy
- Last promoted: never

---

### PS-F005: Behavioral Triggers (Email, Push, In-App)

Automated actions triggered by user behavior — welcome series, abandonment recovery, re-engagement, milestone notifications.

**When It Matters:**
Behavioral triggers turn user actions into engagement opportunities. Cart abandonment emails recover revenue. Onboarding drip campaigns improve activation. Re-engagement messages reduce churn. They matter when the product has identifiable behavioral patterns that correlate with business outcomes and when there's a communication channel to reach users (email, push, in-app). Products without recurring engagement (one-time tools) benefit less.

**Depth Spectrum:**
- **Basic:** Transactional emails (order confirmation, password reset). No behavioral triggers. Manual campaign sends.
- **Standard:** Welcome email series, cart abandonment recovery, milestone notifications (first purchase, 10th login), basic drip campaigns, email template system.
- **Advanced:** Multi-channel triggers (email + push + in-app, with channel preference), behavioral event tracking, trigger chaining (if user doesn't open email in 24h, send push), personalized trigger content, trigger analytics (effectiveness per trigger type).
- **Enterprise:** Orchestration engine (complex trigger flows with branching logic), predictive triggers (reach out before churn happens), AI-generated message content, cross-channel journey orchestration, trigger compliance (consent management, opt-out, frequency capping), integration with marketing automation platforms.

**Signals:**
Products with recurring user engagement. PP-1 >= 4 (consumer) benefits heavily from behavioral triggers. PP-6 >= 3 (market-ready) should have abandonment and re-engagement triggers. NFR-5 (Compliance) >= 3 requires consent management for marketing communications. QP-1 (Testing Depth) >= 3 suggests integration tests for trigger chain evaluation, timing accuracy, and multi-channel delivery fallback scenarios. QP-5 (Observability Maturity) >= 3 suggests metrics and alerting for trigger delivery rates, channel-specific bounce rates, and trigger chain completion rates. BRD keywords: "email marketing", "push notifications", "abandonment", "re-engagement", "drip campaign", "automation".

**Tradeoffs:**
Including: revenue recovery (cart abandonment), improved activation and retention, automated engagement at scale. Cost: email/push infrastructure, behavioral event tracking pipeline, trigger logic maintenance, compliance (CAN-SPAM, GDPR consent), risk of notification fatigue (over-messaging).

### Inclusion
- Default: **conditional**
- Mandatory when: `project_profile.business_model in ['ecommerce', 'marketplace', 'saas', 'subscription'] and project_profile.delivery_ambition >= 3`
- Conditional when: `project_profile.user_sophistication >= 4 or project_profile.has_personalization_module == true`
- Exclude when: `project_profile.audience == 'internal' or project_profile.delivery_ambition <= 2`

### Success Criteria
- Cart-abandonment email recovery rate > 10% of abandoned carts recovered within 24 hours
- Welcome-series open rate > 40% on email 1, > 25% on email 2
- Trigger delivery latency < 2 minutes from event emission to outbound message
- Opt-out honoring latency < 1 notification cycle (100% compliance)

### Failure Scenarios
- Scenario: Trigger chains fire concurrently and a single user receives 5 messages in 10 minutes after a qualifying event
  - Impact: The user marks the product as spam, reputation damage spreads to other users on the same sending domain, and the legitimate welcome series stops reaching inboxes
  - Mitigation: Enforce a per-user frequency cap across all channels (maximum 3 messages per 24 hours), track deliverability metrics per sending domain, and kill trigger chains that push a user over the cap
- Scenario: GDPR consent withdrawal is not propagated to the trigger system, and opt-out users continue receiving automated messages
  - Impact: Consent withdrawal is a formal GDPR right, and ignoring it is a reportable breach with regulator exposure and reputational damage
  - Mitigation: Wire consent events as a first-class trigger signal that fires within 1 notification cycle, verify via a scheduled audit query that no messages were sent to opted-out users, and treat any violation as a P1 incident

### Cross-Tree Refs
- CTC-006 (GDPR compliance requires profile data export and deletion) — trigger system is IMPLIED in GDPR data export and deletion scope
- CTC-010 (POC / MVP skips advanced depth) — depth is CAPPED at Standard for POC / MVP ambitions
- CTC-014 (Behavioral personalization requires consent capture) — this feature is IMPLIED (proposed)

### Experiential
- Usage count: 0
- Scenarios observed: (none — bootstrap)
- Common mistakes:
  - Building trigger chains that "make sense" without measuring effectiveness per trigger, accumulating a campaign graveyard where 80% of sends are from triggers with no measured lift
  - Ignoring notification fatigue until unsubscribe rates spike, then scrambling to introduce frequency caps after the sending-domain reputation has already been damaged
- Last promoted: never

---

### PS-F006: Preference Learning

Implicit and explicit learning of user preferences over time — adapting the experience based on accumulated behavior.

**When It Matters:**
Preference learning is the most advanced form of personalization — the product gets better the more you use it. It matters for products where long-term user relationships exist and where the experience can meaningfully adapt. Content platforms learn what you like to read. Music services learn your taste. E-commerce learns your style preferences. It's less relevant for products with transactional, one-time interactions or where all users need the same experience (utility tools, compliance software).

**Depth Spectrum:**
- **Basic:** Explicit preference capture (user selects interests during onboarding, chooses notification frequency). Stored preferences drive simple customization.
- **Standard:** Implicit learning from behavior (clicks, views, purchases, dwell time) combined with explicit preferences. Preference-based content ranking. Preference decay (recent behavior weighted more than old).
- **Advanced:** Multi-dimensional preference models (style + price range + brand affinity), preference transfer across contexts (product recommendations informed by content preferences), collaborative preference discovery (users similar to you prefer...), preference explanation ("we're showing you this because...").
- **Enterprise:** Privacy-preserving preference learning (federated learning, on-device models), cross-product preference sharing (within consent), preference portability (export/import), enterprise preference policies (organization-level preference constraints), preference auditing (why the system made a particular personalization decision).

**Signals:**
Products with long-term user relationships and diverse content/product catalogs. PP-2 >= 4 (omni-channel/agentic) benefits from adaptive experiences. PP-1 >= 4 (consumer) expects the product to learn their preferences over time. NFR-7 (Data Sensitivity) >= 3 raises privacy considerations for behavioral tracking. QP-7 (Security Testing) >= 3 indicates SAST should cover behavioral data collection endpoints and preference storage for data leakage and unauthorized access vectors. QP-5 (Observability Maturity) >= 3 suggests metrics for preference model inference latency, data freshness, and drift detection in learned preferences. QP-3 (Documentation Level) >= 3 indicates documentation for preference data schemas, learning algorithms, and GDPR-compliant data retention and deletion procedures. BRD keywords: "personalization", "adaptive", "learning", "preferences", "taste profile", "smart recommendations".

**Tradeoffs:**
Including: progressively better user experience, higher engagement over time, competitive moat (user's preference data makes switching costly). Cost: behavioral data collection and storage, preference model development, privacy compliance (GDPR right to explanation, data minimization), cold-start problem for new users, computational cost of real-time preference inference, user trust management (transparency about what's being tracked).

### Inclusion
- Default: **conditional**
- Mandatory when: `project_profile.has_personalization_module == true and project_profile.delivery_ambition >= 4`
- Conditional when: `project_profile.ux_maturity >= 4 and project_profile.data_sensitivity <= 3`
- Exclude when: `project_profile.delivery_ambition <= 2 or project_profile.business_model == 'internal_tool'`

### Success Criteria
- Preference model inference latency < 100ms p95 per request
- Preference freshness: behavioral signals propagate to learned model within 1 hour for > 95% of events
- Personalization lift (engagement metric vs non-personalized control) > 15% on active users
- GDPR data export for learned preferences fulfilled within 30 days 100% of the time

### Failure Scenarios
- Scenario: A user's learned preferences are built from behavioral data captured before the consent flow was active
  - Impact: Under GDPR Article 7, the processing is unlawful, the user's preference profile must be deleted, and any downstream recommendation model that absorbed their data must be retrained
  - Mitigation: Record consent state at the moment of every behavioral event, discard events lacking explicit consent from the preference-learning pipeline, and maintain a consent-gated partition in the feature store
- Scenario: The preference model over-weights recent behavior and loses the user's long-term taste signal within days
  - Impact: A user who explores a one-off category sees their entire experience rewritten around that exploration, and the "we're learning you" promise feels broken
  - Mitigation: Apply time-decay weighting with a documented half-life (30 days for most signals, 7 days for explicit session signals) and cap any single signal's contribution to the preference vector

### Cross-Tree Refs
- CTC-005 (Tight timeline excludes advanced-depth custom integrations) — this feature is EXCLUDED when timeline is tight
- CTC-006 (GDPR compliance requires profile data export and deletion) — learned preferences are IMPLIED in GDPR data export scope
- CTC-010 (POC / MVP skips advanced depth) — this feature is EXCLUDED for POC / MVP ambitions
- CTC-014 (Behavioral personalization requires consent capture) — this feature is IMPLIED (proposed)

### Experiential
- Usage count: 0
- Scenarios observed: (none — bootstrap)
- Common mistakes:
  - Instrumenting behavioral tracking before consent infrastructure exists, then having to discard the entire initial dataset and retrain models from a clean start after the privacy review
  - Building preference models without an explanation layer, discovering that users distrust "why am I seeing this" surfaces and mandate a last-minute interpretability layer that the architecture cannot support
- Last promoted: never
