# Commerce

Product catalog, shopping, order lifecycle, and retail operations.

**Search patterns:** ecommerce, catalog, cart, orders, inventory, product listing, reviews, promotions, shopping, checkout, retail, marketplace, wishlist, returns

## Features

### CM-F001: Product Catalog

Product listings — items, categories, variants, attributes, pricing, media.

**When It Matters:**
Any commerce application needs a product catalog. The depth depends on catalog complexity — a SaaS with three pricing tiers needs a simple plan page, not a product catalog. An e-commerce store with thousands of SKUs, variants (size, color), and categories needs a full catalog system. Marketplace platforms need multi-seller catalogs with different pricing and availability per seller. The catalog is the foundation — search, cart, and checkout all depend on it.

**Depth Spectrum:**
- **Basic:** Flat product list with name, description, price, image. No categories or variants. Sufficient for small catalogs (< 50 items).
- **Standard:** Hierarchical categories, product variants (size/color with SKU per variant), multiple images per product, price with currency, basic inventory count, SEO metadata.
- **Advanced:** Faceted attributes (filterable product properties), dynamic pricing (time-based, segment-based), bundling, product relationships (similar, complementary), rich media (video, 360-view), multi-channel catalog (web + mobile + API).
- **Enterprise:** Multi-seller catalog (marketplace), catalog versioning, bulk import/export (CSV, API), approval workflows for product listings, automated categorization (ML), PIM integration (product information management).

**Signals:**
Any e-commerce or marketplace product. PP-3 = 5 (multi-sided platform) needs multi-seller catalog. PP-4 >= 3 (multi-country) needs localized product information. PP-2 >= 3 needs rich product presentation. QP-3 (Documentation Level) >= 3 indicates API documentation for catalog endpoints including bulk import/export schemas and product attribute definitions. QP-1 (Testing Depth) >= 3 suggests integration tests for catalog data integrity, variant-price consistency, and category hierarchy operations. BRD keywords: "products", "catalog", "listings", "SKU", "inventory", "categories".

**Tradeoffs:**
Including at higher depth: richer shopping experience, better discoverability, marketplace readiness. Cost: catalog management complexity, media storage costs, search indexing overhead, variant explosion with multiple attributes, ongoing content management.

### Inclusion
- Default: **mandatory**
- Mandatory when: `project_profile.domain contains 'commerce' or project_profile.business_model in ['ecommerce', 'marketplace', 'retail']`
- Conditional when: `project_profile.persona_complexity == 5` (multi-sided marketplace requires multi-seller catalog at Enterprise depth)
- Exclude when: `project_profile.business_model == 'saas' and project_profile.catalog_size < 10` (simple plan page, not a product catalog)

### Success Criteria
- Product detail page p95 load latency < 800ms under 5K concurrent sessions
- Catalog search-to-result freshness < 60s after a product update is published
- Variant-to-price consistency verified at 100% across SKUs (zero mismatched variant pricing in integrity checks)

### Failure Scenarios
- Scenario: Variant explosion multiplies SKUs beyond what the catalog UI can render
  - Impact: Product pages time out on mobile, the admin catalog editor becomes unusable, and content managers cannot ship new products
  - Mitigation: Cap variant dimensions at Standard depth, paginate variant tables in admin, and require faceted-attribute modeling at Advanced depth before allowing > 3 variant axes
- Scenario: Media upload pipeline ingests unoptimized hi-res images into the product gallery
  - Impact: CDN egress costs balloon, product pages breach the 800ms budget, and mobile users abandon browsing sessions
  - Mitigation: Enforce server-side re-encoding to responsive variants (AVIF/WebP), reject uploads above a size threshold, and monitor per-product media footprint in the catalog dashboard

### Cross-Tree Refs
- (none)

### Experiential
- Usage count: 0
- Scenarios observed: (none — bootstrap)
- Common mistakes:
  - Modeling variants as ad-hoc attributes instead of first-class SKUs, causing inventory and pricing drift between the catalog and downstream systems
  - Skipping catalog versioning until the first bulk import corrupts live product data with no rollback path
- Last promoted: never

---

### CM-F002: Shopping Cart

Temporary collection of items a user intends to purchase — add, remove, quantity, persistence.

**When It Matters:**
Any product with multi-item purchases needs a shopping cart. Single-item instant purchase (buy now) can skip the cart. The depth depends on the complexity of the purchase flow — simple products need add/remove; complex products need saved carts, shared carts, and cart rules (minimum order, quantity limits). Guest carts (without login) matter for conversion — forcing login before adding to cart loses customers.

**Depth Spectrum:**
- **Basic:** Session-based cart, add/remove items, quantity adjustment, cart total. Lost on session expiry.
- **Standard:** Persistent cart (survives logout/return), guest cart with merge on login, cart item validation (stock check), estimated shipping/tax, promo code application.
- **Advanced:** Saved carts (save for later), shared carts (send cart link), cart abandonment tracking, cross-device cart sync, real-time inventory validation, cart-level business rules (minimum order value, quantity limits).
- **Enterprise:** Multi-cart support (personal + organizational), requisition lists, quote requests from cart, approval workflows for large orders, cart-level discount negotiation.

**Signals:**
Any multi-item purchase flow. PP-1 >= 4 (consumer) needs guest cart and abandonment recovery. PP-6 >= 3 (market-ready) should have persistent carts. PP-3 >= 4 (enterprise customers) may need multi-cart and approval flows. QP-1 (Testing Depth) >= 3 suggests integration tests for cart persistence, guest-to-authenticated cart merge, concurrent stock validation, and promo code application edge cases. QP-6 (Accessibility Standard) >= 3 requires WCAG AA compliance for cart interactions including item quantity adjustments, removal, and save-for-later controls. BRD keywords: "cart", "basket", "add to cart", "checkout", "save for later".

**Tradeoffs:**
Including at higher depth: higher conversion (persistent carts recover returning users), better analytics (abandonment tracking), enterprise readiness. Cost: cart storage and sync complexity, real-time inventory validation overhead, edge cases (item goes out of stock while in cart).

### Inclusion
- Default: **mandatory**
- Mandatory when: `project_profile.business_model in ['ecommerce', 'marketplace', 'retail'] and project_profile.purchase_flow == 'multi_item'`
- Conditional when: `project_profile.user_sophistication >= 4` (consumer audiences expect guest cart and abandonment recovery)
- Exclude when: `project_profile.purchase_flow == 'single_item_instant'` (buy-now flows skip the cart)

### Success Criteria
- Cart add-to-cart operation p95 latency < 300ms including stock validation
- Persistent cart recovery rate > 70% for returning users within a 14-day window
- Guest-to-authenticated cart merge succeeds 100% of the time without item loss or duplication

### Failure Scenarios
- Scenario: Checkout forces login before allowing add-to-cart
  - Impact: Consumer conversion drops sharply — guest users who would have bought abandon before entering the funnel at all
  - Mitigation: Support guest cart at Standard depth with a login-optional merge flow on first authentication event
- Scenario: An item goes out of stock while sitting in a user's cart and the cart silently proceeds to checkout
  - Impact: User is charged or sees an error at payment, incurring a support ticket and eroding trust
  - Mitigation: Re-validate inventory on cart view and at checkout entry, flag out-of-stock items in the cart UI, and offer a "save for later" fallback

### Cross-Tree Refs
- (none)

### Experiential
- Usage count: 0
- Scenarios observed: (none — bootstrap)
- Common mistakes:
  - Gating add-to-cart behind authentication because "we need the user ID anyway," losing guest conversion
  - Building real-time inventory validation at checkout without corresponding cart-level feedback, so users discover stock problems only at payment
- Last promoted: never

---

### CM-F003: Order Management

Order lifecycle — creation, status tracking, fulfillment, history.

**When It Matters:**
Any product that takes orders needs order management. The depth depends on fulfillment complexity — digital products need minimal order management (payment confirmed → access granted). Physical goods need shipping integration, tracking, and multi-stage fulfillment. Marketplace platforms need per-seller order splitting and independent fulfillment tracking.

**Depth Spectrum:**
- **Basic:** Order creation on payment success, order confirmation email, order history page. Status: placed → completed.
- **Standard:** Order status tracking (placed → confirmed → shipped → delivered), shipping integration (tracking numbers, carrier links), order detail page with line items, order confirmation and status update emails.
- **Advanced:** Multi-stage fulfillment (partial shipment, backorder handling), order modification (cancel, change quantity before shipping), automated status transitions, order search and filtering, export for reporting.
- **Enterprise:** Order splitting across fulfillment centers/sellers, SLA-based routing, order orchestration (complex fulfillment workflows), ERP integration, multi-channel order aggregation, returns/exchange workflows linked to orders.

**Signals:**
Any product that takes orders. PP-5 >= 3 (bidirectional integration) suggests ERP/shipping integration. PP-3 = 5 (marketplace) needs per-seller order management. PP-6 >= 3 needs proper order lifecycle beyond basic. QP-5 (Observability Maturity) >= 3 suggests metrics and alerting for order processing latency, fulfillment SLA adherence, and state transition failures. QP-1 (Testing Depth) >= 3 suggests integration tests for order state machine transitions, partial fulfillment scenarios, and multi-seller order splitting. BRD keywords: "order", "fulfillment", "shipping", "tracking", "order status", "delivery".

**Tradeoffs:**
Including at higher depth: better customer experience (visibility into order status), operational efficiency (automated fulfillment), marketplace readiness. Cost: fulfillment workflow complexity, shipping carrier integrations, order state machine edge cases, notification system for status updates.

### Inclusion
- Default: **mandatory**
- Mandatory when: `project_profile.business_model in ['ecommerce', 'marketplace', 'retail']`
- Conditional when: `project_profile.persona_complexity == 5` (marketplace requires per-seller order splitting at Enterprise depth) or `project_profile.integration_depth >= 3` (ERP/shipping integration)
- Exclude when: `project_profile.product_type == 'digital_only' and project_profile.delivery_ambition <= 2` (basic digital access grant may suffice)

### Success Criteria
- Order creation on payment success p95 latency < 2s from payment confirmation to order record persisted
- Order state machine transition success rate = 100% with zero stuck orders in intermediate states over a 7-day window
- Fulfillment SLA adherence > 95% for orders that complete the configured lifecycle path

### Failure Scenarios
- Scenario: Order state machine enters an unreachable intermediate state on partial fulfillment
  - Impact: Operations team cannot close orders, customer-facing "order status" pages show inconsistent information, and customer support cannot resolve inquiries
  - Mitigation: Model partial shipment and backorder as first-class states at Advanced depth, with explicit transitions and recovery actions defined in the order state machine
- Scenario: Shipping carrier integration fails silently and tracking numbers never reach the order record
  - Impact: Customers receive shipped notifications without tracking info, spike in "where is my order" tickets, and operational blind spot on in-transit inventory
  - Mitigation: Treat carrier integration failures as alertable events at Standard depth or higher, with retry + dead-letter handling and a visible degraded-mode banner in the admin

### Cross-Tree Refs
- (none)

### Experiential
- Usage count: 0
- Scenarios observed: (none — bootstrap)
- Common mistakes:
  - Implementing order status as a free-text field instead of a state machine, producing inconsistent transitions and broken customer communications
  - Deferring shipping-carrier integration to post-launch, then discovering that tracking-number ingestion design affects the entire order schema
- Last promoted: never

---

### CM-F004: Inventory Management

Stock tracking — quantity, availability, reservations, replenishment.

**When It Matters:**
Essential for any product selling physical goods or limited-quantity digital goods. Without inventory management, overselling is inevitable. The depth depends on catalog size, warehouse complexity, and how time-sensitive stock data is. A small store with 50 products can manage stock manually. A marketplace with thousands of sellers needs real-time inventory across multiple sources. Products selling unlimited digital goods (SaaS subscriptions, content) don't need inventory management.

**Depth Spectrum:**
- **Basic:** Simple stock count per product. Decrement on order. Manual replenishment. Out-of-stock flag.
- **Standard:** Stock per variant (size/color), inventory reservation on cart/checkout (prevent overselling), low-stock alerts, basic reporting (stock levels, turnover).
- **Advanced:** Multi-warehouse inventory, inventory allocation rules (nearest warehouse, lowest cost), real-time stock sync across channels, automated reorder points, batch/lot tracking.
- **Enterprise:** Distributed inventory management, demand forecasting, safety stock optimization, cross-channel inventory visibility, integration with WMS (warehouse management systems), serialized inventory tracking.

**Signals:**
Any physical goods commerce. NFR-3 (Performance) >= 3 needs real-time stock validation to prevent overselling under load. PP-4 >= 3 with physical goods needs multi-warehouse consideration. PP-3 = 5 (marketplace) needs per-seller inventory. QP-5 (Observability Maturity) >= 3 suggests metrics and alerting for stock sync latency, reservation timeout rates, and oversell incidents. QP-1 (Testing Depth) >= 4 suggests concurrency tests for inventory reservation under high load to verify oversell prevention guarantees. BRD keywords: "inventory", "stock", "availability", "warehouse", "supply chain".

**Tradeoffs:**
Including at higher depth: prevents overselling (revenue protection), operational efficiency, multi-channel readiness. Cost: real-time sync complexity, warehouse integration, inventory reservation logic (timeout handling), forecasting model development.

### Inclusion
- Default: **conditional**
- Mandatory when: `project_profile.business_model in ['ecommerce', 'marketplace', 'retail'] and project_profile.product_type == 'physical_goods'`
- Conditional when: `project_profile.persona_complexity == 5` (marketplace requires per-seller inventory at Advanced depth or higher) or `project_profile.geographic_scope >= 3` (multi-warehouse inventory)
- Exclude when: `project_profile.product_type == 'unlimited_digital'` (SaaS subscriptions, unlimited-seat content)

### Success Criteria
- Inventory reservation-to-release cycle completes 100% of the time within the configured timeout (no orphaned reservations)
- Oversell rate = 0 for Standard depth or higher under the target concurrent checkout load
- Stock-level sync lag across warehouses p95 < 30s at Advanced depth or higher

### Failure Scenarios
- Scenario: Two concurrent checkouts succeed for the last unit in stock
  - Impact: Oversell event — one customer receives an out-of-stock notice after payment, the business eats refund and goodwill cost, and brand trust erodes
  - Mitigation: Apply inventory reservation on cart/checkout at Standard depth, use an atomic decrement protected by the stock row, and surface an alertable oversell counter
- Scenario: Reservation timeout leaks — items held by abandoned carts are never released
  - Impact: Phantom out-of-stock states block active buyers, suppressing conversion on healthy inventory
  - Mitigation: Set an explicit reservation TTL tied to cart session, run a sweeper that releases expired holds, and publish reservation-timeout-rate as a dashboard metric

### Cross-Tree Refs
- (none)

### Experiential
- Usage count: 0
- Scenarios observed: (none — bootstrap)
- Common mistakes:
  - Decrementing stock on page view or cart-add without a reservation lifecycle, producing phantom-out-of-stock states from abandoned sessions
  - Treating multi-warehouse inventory as a post-launch concern, then retrofitting allocation rules after sellers complain about fulfillment-center mismatches
- Last promoted: never

---

### CM-F005: Reviews and Ratings

User-generated product reviews — star ratings, text reviews, moderation.

**When It Matters:**
Reviews drive purchase decisions in consumer commerce — products with reviews convert significantly better. Less relevant for B2B products, subscription services, or products with small catalogs where the business relationship drives purchases rather than social proof. The depth depends on how important social proof is to the business model and how much moderation is needed.

**Depth Spectrum:**
- **Basic:** Star rating (1-5), text review, display average rating on product. No moderation.
- **Standard:** Review with title, verified purchase badge, helpful/not helpful voting, basic moderation (profanity filter, admin approval queue), review count and distribution.
- **Advanced:** Photo/video reviews, review summaries (AI-generated), review response by seller, review incentives (request review after delivery), spam detection, sentiment analysis, review SEO (structured data).
- **Enterprise:** Multi-dimensional ratings (quality, value, shipping), marketplace-level seller reviews, syndicated reviews (shared across channels), review import/export, compliance with review authenticity regulations.

**Signals:**
Consumer e-commerce where social proof matters. PP-1 >= 3 (not purely technical users). PP-3 = 5 (marketplace) needs seller reviews alongside product reviews. PP-2 >= 3 expects polished review presentation. PP-7 = 2 (consumer/lifestyle) heavily benefits from reviews. QP-7 (Security Testing) >= 3 indicates SAST should cover review submission for XSS, injection, and spam vector vulnerabilities in user-generated content. QP-6 (Accessibility Standard) >= 3 requires WCAG AA compliance for review display, star rating components, and review submission forms. BRD keywords: "reviews", "ratings", "social proof", "user feedback", "testimonials".

**Tradeoffs:**
Including: higher conversion rates, user trust, SEO benefits (user-generated content), product improvement insights. Cost: moderation burden (spam, fake reviews, abuse), legal compliance (FTC guidelines on fake reviews), review solicitation system, storage for media reviews.

### Inclusion
- Default: **optional**
- Mandatory when: `project_profile.business_model == 'ecommerce' and project_profile.user_sophistication >= 4 and project_profile.delivery_ambition >= 3` (consumer commerce where social proof drives conversion)
- Conditional when: `project_profile.persona_complexity == 5` (marketplace requires seller reviews alongside product reviews)
- Exclude when: `project_profile.audience == 'B2B' and project_profile.catalog_size < 20` (relationship-driven purchases, social proof not a lever)

### Success Criteria
- Review submission p95 latency < 1s from submit-click to visible confirmation
- Moderation queue processing time < 24h for 95% of flagged reviews at Standard depth or higher
- Verified-purchase badge accuracy = 100% (no badge shown for non-purchasers)

### Failure Scenarios
- Scenario: Review submission endpoint renders user-supplied HTML without sanitization
  - Impact: Stored XSS on product pages — attacker scripts run in every viewer's browser, exposing sessions and enabling account takeover
  - Mitigation: Sanitize review content server-side, escape on render, and include review submission in the SAST scope when QP-7 >= 3
- Scenario: Fake-review spam overwhelms a product page with no moderation path
  - Impact: Regulatory exposure under FTC guidelines on fake reviews, legitimate customer trust erodes, and SEO benefit inverts into a penalty
  - Mitigation: Enforce a moderation queue at Standard depth with profanity/spam filters, verified-purchase gating, and rate limiting per reviewer

### Cross-Tree Refs
- (none)

### Experiential
- Usage count: 0
- Scenarios observed: (none — bootstrap)
- Common mistakes:
  - Launching reviews without a moderation pipeline, then playing catch-up after the first spam/abuse incident
  - Ignoring FTC guidance on fake-review disclosure when running review-incentive programs, creating legal exposure
- Last promoted: never

---

### CM-F006: Promotions / Discount Engine

Promotional pricing — coupons, discount codes, sales, bundle deals, loyalty rewards.

**When It Matters:**
Any commerce product that uses pricing as a competitive lever needs promotions. The depth depends on how central promotions are to the business model — flash sale sites need a sophisticated engine; a premium brand with fixed pricing needs minimal support. Marketplace platforms need per-seller promotions. Subscription products use promotions differently (trial extensions, upgrade discounts).

**Depth Spectrum:**
- **Basic:** Fixed-value and percentage discount codes. Single-use and multi-use. Manual creation.
- **Standard:** Automatic promotions (cart-level rules: spend X get Y off), category/product-specific discounts, time-limited sales, promotion stacking rules, usage limits.
- **Advanced:** Tiered promotions (spend more save more), BOGO, bundle pricing, loyalty points/rewards, referral discounts, A/B testing of promotions, promotion analytics (uplift measurement).
- **Enterprise:** Multi-channel promotion orchestration, customer segment-specific promotions, negotiated pricing (B2B), promotion budget management, integration with marketing platforms, personalized dynamic pricing.

**Signals:**
Commerce products using pricing as acquisition/retention lever. PP-6 >= 3 (market-ready) should have at least standard promotions. PP-1 >= 4 (consumer) expects promotional pricing. PP-3 = 5 (marketplace) needs per-seller promotion capabilities. QP-1 (Testing Depth) >= 3 suggests integration tests for promotion rule evaluation including stacking logic, expiry enforcement, usage limits, and edge cases like negative totals from over-discounting. BRD keywords: "promotions", "discounts", "coupons", "sale", "deals", "loyalty", "rewards".

**Tradeoffs:**
Including: customer acquisition, revenue uplift during promotions, competitive positioning. Cost: promotion rule engine complexity, stacking logic edge cases, margin erosion if poorly managed, promotion abuse prevention, analytics infrastructure for measuring effectiveness.

### Inclusion
- Default: **optional**
- Mandatory when: `project_profile.business_model in ['ecommerce', 'marketplace'] and project_profile.delivery_ambition >= 3` (market-ready commerce needs at least standard promotions)
- Conditional when: `project_profile.user_sophistication >= 4` (consumer audiences expect promotional pricing) or `project_profile.persona_complexity == 5` (marketplace requires per-seller promotions)
- Exclude when: `project_profile.pricing_model == 'fixed_premium'` (premium brands with non-negotiable pricing)

### Success Criteria
- Promotion rule evaluation p95 latency < 150ms at cart recalculation time
- Promotion stacking correctness = 100% (no negative totals, no unintended double-discounts in integrity checks)
- Promotion uplift measurable within 7 days of launch via A/B holdout at Advanced depth or higher

### Failure Scenarios
- Scenario: Overlapping promotion rules stack unintentionally and produce a negative cart total
  - Impact: Orders clear at zero or negative value, direct revenue loss, and accounting reconciliation nightmares
  - Mitigation: Define explicit stacking rules at Standard depth, floor the computed total at zero, and reject stacked promotions that cross a discount ceiling with an alert
- Scenario: Promotion code is shared publicly and consumed beyond its intended audience
  - Impact: Margin erosion on orders the business did not plan to discount, and the promotion fails its acquisition intent
  - Mitigation: Enforce per-user and global usage limits at Standard depth, bind promotions to customer segments at Advanced depth, and monitor redemption velocity for anomaly alerts

### Cross-Tree Refs
- (none)

### Experiential
- Usage count: 0
- Scenarios observed: (none — bootstrap)
- Common mistakes:
  - Layering promotion rules without explicit stacking semantics, producing unintended cart-total calculations at scale
  - Launching promotions without uplift measurement infrastructure, so nobody can tell whether the discount paid for itself
- Last promoted: never

---

### CM-F007: Wishlist / Saved Items

User-created collections of desired products — save for later, share, notify on sale.

**When It Matters:**
Wishlists drive return visits and purchase intent in consumer e-commerce. Users bookmark items they're considering but not ready to buy. Less relevant for B2B, subscription products, or products with small catalogs. The depth depends on how much the business wants to leverage wishlists as a re-engagement and conversion tool.

**Depth Spectrum:**
- **Basic:** Save/unsave products. View saved list. Remove items.
- **Standard:** Named lists (multiple wishlists), move to cart, share wishlist via link, wishlist count on product pages.
- **Advanced:** Price drop notifications, back-in-stock alerts for wishlisted items, wishlist analytics (popular items, conversion to purchase), gift registry functionality.
- **Enterprise:** Organizational wishlists (team procurement lists), wishlist-to-quote conversion, wishlist API for partner integrations.

**Signals:**
Consumer e-commerce with browsing-heavy behavior. PP-1 >= 4 (consumer) expects wishlist functionality. PP-2 >= 3 (polished UX) should include save-for-later. PP-6 = 1-2 (POC/MVP) can defer wishlists. QP-6 (Accessibility Standard) >= 3 requires WCAG AA compliance for wishlist interactions including add/remove controls and list management across devices. BRD keywords: "wishlist", "save for later", "favorites", "bookmarks", "gift registry".

**Tradeoffs:**
Including: increased return visits, purchase intent data, re-engagement opportunities (price drop emails), gift registry revenue. Cost: notification infrastructure, real-time price/stock monitoring for alerts, storage for per-user lists, analytics pipeline.

### Inclusion
- Default: **optional**
- Mandatory when: `project_profile.business_model == 'ecommerce' and project_profile.user_sophistication >= 4 and project_profile.delivery_ambition >= 3`
- Conditional when: `project_profile.ux_maturity >= 3` (polished UX expects save-for-later affordance)
- Exclude when: `project_profile.delivery_ambition <= 2` (POC/MVP can defer wishlists) or `project_profile.audience == 'B2B' and project_profile.catalog_size < 20`

### Success Criteria
- Wishlist add/remove action p95 latency < 400ms
- Price-drop notification delivery within 10 minutes of the price change for 95% of alerted items at Advanced depth or higher
- Wishlist-to-cart conversion rate measurable and > 15% within a 30-day window

### Failure Scenarios
- Scenario: Price-drop notification fires repeatedly for the same item because no deduplication exists
  - Impact: Users unsubscribe from the notification channel, the business loses the re-engagement hook, and email deliverability suffers
  - Mitigation: Track notification state per (user, item, price-threshold), debounce within a 24h window, and honor user-level frequency preferences
- Scenario: Wishlist state diverges between devices
  - Impact: Users stop trusting the feature to remember them, wishlist becomes a dead surface, and the re-engagement channel collapses
  - Mitigation: Persist wishlists server-side at Basic depth already, sync on every device transition, and surface a subtle "synced" indicator

### Cross-Tree Refs
- (none)

### Experiential
- Usage count: 0
- Scenarios observed: (none — bootstrap)
- Common mistakes:
  - Storing wishlists only in local storage, losing state when users switch devices and killing the re-engagement value
  - Firing price-drop alerts without deduplication or frequency caps, training users to mute the notification channel entirely
- Last promoted: never

---

### CM-F008: Returns / Reverse Logistics

Product return processing — return requests, labels, refunds, restocking.

**When It Matters:**
Any product selling physical goods faces returns. Consumer protection regulations in many jurisdictions mandate return policies (14-day cooling-off in EU). The depth depends on return volume, product type (apparel has high return rates), and regulatory requirements. Digital-only products rarely need returns beyond subscription cancellation. Marketplace platforms face additional complexity — who handles the return, the platform or the seller?

**Depth Spectrum:**
- **Basic:** Manual return requests (email/support ticket), admin processes refund, no return tracking.
- **Standard:** Self-service return initiation, return reason collection, prepaid return labels (carrier integration), automated refund on return receipt, return status tracking.
- **Advanced:** Return policy engine (time-based eligibility, condition-based rules, exchange option), automated return label generation, return analytics (reason trends, cost analysis), restocking workflow integration.
- **Enterprise:** Marketplace return routing (to seller or platform warehouse), cross-border returns, return-to-store for omnichannel, environmental impact tracking (carbon cost of returns), AI-powered return fraud detection.

**Signals:**
Physical goods commerce. PP-7 >= 3 has regulatory return obligations (EU consumer protection). PP-4 >= 3 (multi-country) adds cross-border return complexity. PP-3 = 5 (marketplace) needs seller-level return handling. QP-1 (Testing Depth) >= 3 suggests integration tests for return policy engine rules including eligibility windows, condition-based logic, and multi-party return routing in marketplace scenarios. QP-3 (Documentation Level) >= 3 indicates documentation for return policy configurations and regulatory compliance procedures per jurisdiction. BRD keywords: "returns", "refund", "exchange", "return policy", "reverse logistics", "RMA".

**Tradeoffs:**
Including: regulatory compliance, customer trust (easy returns increase purchase confidence), operational visibility into return patterns. Cost: reverse logistics infrastructure, return shipping costs, restocking workflow, fraud detection for return abuse, carrier integrations.

### Inclusion
- Default: **conditional**
- Mandatory when: `project_profile.business_model in ['ecommerce', 'marketplace', 'retail'] and project_profile.product_type == 'physical_goods'`
- Conditional when: `project_profile.geographic_scope >= 3` (multi-country returns add cross-border complexity) or `project_profile.industry_vertical >= 3` (EU consumer protection mandates)
- Exclude when: `project_profile.product_type == 'digital_only'` (subscription cancellation covers the use case)

### Success Criteria
- Self-service return initiation completion rate > 90% without support contact at Standard depth or higher
- Refund posted to customer payment method within 5 business days of return receipt for 95% of cases
- Return-policy eligibility evaluation deterministic = 100% (zero contradictory outcomes across identical inputs at Advanced depth)

### Failure Scenarios
- Scenario: Return policy engine produces inconsistent eligibility decisions for comparable orders
  - Impact: Customer service overrides policy ad-hoc, regulatory auditors flag the inconsistency, and the business loses predictability on reverse-logistics costs
  - Mitigation: Codify eligibility rules in a rule engine at Advanced depth, add integration tests covering time-based windows and condition-based rules, and log every decision with its rule trace
- Scenario: Marketplace return routed to the wrong party — platform warehouse receives a seller-fulfilled return
  - Impact: The return sits unprocessed, the customer refund is delayed past the SLA, and the seller-platform trust relationship frays
  - Mitigation: Model return routing as a first-class decision at Enterprise depth, with per-seller routing policies and automated label generation bound to the routing outcome

### Cross-Tree Refs
- (none)

### Experiential
- Usage count: 0
- Scenarios observed: (none — bootstrap)
- Common mistakes:
  - Treating returns as manual support tickets instead of a first-class reverse-logistics workflow, producing SLA breaches under any volume
  - Shipping into the EU without a 14-day cooling-off path wired into the return policy engine, creating a regulatory exposure
- Last promoted: never
