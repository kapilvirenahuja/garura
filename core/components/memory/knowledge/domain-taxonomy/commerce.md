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
