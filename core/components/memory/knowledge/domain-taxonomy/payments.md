# Payments

Payment processing, billing, fraud prevention, and financial operations.

**Search patterns:** payment, billing, checkout, fraud, refund, subscription, multi-currency, compliance, PCI, transaction, invoice, recurring, gateway

## Features

### PM-F001: Payment Processing (Cards, Bank Transfer)

Core payment acceptance — credit/debit cards, bank transfers, digital wallets.

**When It Matters:**
Any product that charges users needs payment processing. The question is scope: a simple SaaS needs card processing through Stripe. A marketplace needs split payments. A global product needs local payment methods (UPI in India, iDEAL in Netherlands, PIX in Brazil). The depth depends on transaction volume, geographic scope, and how central payments are to the business model. Products where payment is incidental (one-time purchase) need less depth than products where payment IS the product (fintech).

**Depth Spectrum:**
- **Basic:** Single payment gateway (Stripe/PayPal), card payments only, one currency. Sufficient for simple SaaS and MVPs.
- **Standard:** Multiple payment methods (cards + digital wallets), webhook handling for async payment events, idempotent payment requests, retry logic for failed charges.
- **Advanced:** Multiple gateways with failover, direct bank transfer (ACH/SEPA), payment orchestration layer, PCI-DSS compliance scope reduction (tokenization), 3D Secure for strong customer authentication.
- **Enterprise:** Payment gateway abstraction (swap providers without code changes), real-time payment status tracking, reconciliation automation, ledger-based accounting, support for complex payment structures (installments, escrow, split payments).

**Signals:**
Any product that charges money. PP-4 (Geographic Scope) >= 3 needs multi-currency and local payment methods. PP-5 (Integration Density) >= 3 suggests payment as a platform capability. PP-7 >= 4 (regulated) increases PCI-DSS compliance needs. NFR-4 (Availability) >= 3 needs gateway failover. QP-7 (Security Testing) >= 3 indicates SAST and dependency scanning should cover payment token handling, gateway integrations, and PCI-DSS scope boundaries. QP-1 (Testing Depth) >= 3 suggests integration tests for payment flows including gateway failover, webhook processing, and idempotency guarantees. QP-5 (Observability Maturity) >= 3 suggests metrics and alerting for payment success rates, gateway latency, and failed transaction patterns. BRD keywords: "payment", "checkout", "billing", "charge", "purchase", "transaction".

**Tradeoffs:**
Including at higher depth: revenue reliability, geographic expansion capability, compliance readiness, reduced payment failure rates. Cost: PCI-DSS compliance burden, gateway integration complexity, payment reconciliation overhead, financial regulation knowledge required on the team.

### Inclusion
- Default: **conditional**
- Mandatory when: `project_profile.business_model in ['ecommerce', 'marketplace', 'saas', 'subscription', 'fintech', 'retail']`
- Conditional when: `project_profile.monetization != 'free' and project_profile.audience != 'internal'`
- Exclude when: `project_profile.monetization == 'free' and project_profile.business_model == 'internal_tool'`

### Success Criteria
- Payment authorization success rate > 97% for valid cards on first attempt
- p95 gateway round-trip latency < 1500ms under normal load
- Webhook event processing lag < 30s from gateway emit to local state update
- Idempotency key collision rate = 0% across all retry attempts

### Failure Scenarios
- Scenario: Retry logic charges the customer twice because the initial request timed out but succeeded upstream
  - Impact: Duplicate charges trigger chargebacks, refund costs, and customer trust damage that cascades into support and social-channel complaints
  - Mitigation: Generate a client-side idempotency key per payment attempt, send it on every retry, and rely on the gateway to collapse duplicates server-side
- Scenario: Gateway webhook is missed or arrives out-of-order and the local payment state never transitions to `captured`
  - Impact: Order fulfillment stalls, the customer sees a pending charge on their statement, and the business ships nothing despite the money moving
  - Mitigation: Run a reconciliation job that replays gateway events from the source of truth every 15 minutes and surface drift to an operational dashboard

### Cross-Tree Refs
- CTC-005 (Tight timeline excludes advanced-depth custom integrations) — depth is CAPPED at Standard when timeline is tight
- CTC-010 (POC / MVP skips advanced depth) — depth is CAPPED at Standard for POC / MVP ambitions
- CTC-011 (PCI-DSS scope reduction requires tokenization) — this feature is IMPLIED at Advanced depth or higher (proposed)

### Experiential
- Usage count: 0
- Scenarios observed: (none — bootstrap)
- Common mistakes:
  - Treating PCI-DSS as a vendor checkbox instead of defining an explicit scope boundary, then discovering card data leaked into application logs during an audit
  - Building gateway integration logic directly into business services rather than behind an abstraction, making a multi-gateway failover story impossible without a rewrite
- Last promoted: never

---

### PM-F002: Checkout / Payment UX

The user-facing payment experience — cart summary, payment form, confirmation.

**When It Matters:**
Checkout UX directly impacts conversion rate. A one-step checkout with saved payment methods converts significantly better than a multi-page form. The depth depends on user sophistication and how much revenue depends on reducing cart abandonment. Consumer products (PP-1 >= 4) need polished, low-friction checkout. B2B products with procurement workflows need different flows entirely (invoicing, PO numbers, approval chains).

**Depth Spectrum:**
- **Basic:** Single page with order summary, payment form (card number, expiry, CVC), submit button. Redirect to confirmation.
- **Standard:** Inline payment form (Stripe Elements or similar), order summary with line items, promo code field, payment method selection (card vs digital wallet), loading states and error handling.
- **Advanced:** One-click checkout with saved payment methods, express checkout (Apple Pay, Google Pay), guest checkout without account, progress indicator for multi-step flows, real-time validation.
- **Enterprise:** Invoicing flow (generate invoice, net-30/60 terms), PO number capture, approval workflow for large purchases, multi-currency display with conversion, tax calculation integration.

**Signals:**
PP-1 (User Sophistication) drives UX complexity: level 4-5 (consumer) needs express checkout; level 3 (business) needs invoicing options. PP-2 (UX Maturity) >= 3 expects polished payment experience. PP-6 = 1-2 (POC/MVP) can use hosted checkout pages. QP-6 (Accessibility Standard) >= 3 requires WCAG AA compliance for checkout forms, payment method selection, and order confirmation — checkout abandonment from inaccessible forms directly impacts revenue. QP-1 (Testing Depth) >= 3 suggests e2e tests covering the full checkout funnel including error states, validation, and express checkout paths. BRD keywords: "checkout", "cart", "purchase flow", "payment page", "conversion".

**Tradeoffs:**
Including at higher depth: higher conversion rates, reduced cart abandonment, better user experience, competitive parity. Cost: front-end development complexity, PCI-DSS scope (if handling card data directly), A/B testing investment, mobile-specific checkout optimization.

### Inclusion
- Default: **mandatory**
- Mandatory when: `project_profile.business_model in ['ecommerce', 'marketplace', 'subscription', 'retail'] and project_profile.audience in ['B2C', 'B2B', 'B2B2C']`
- Conditional when: `project_profile.business_model == 'saas' and project_profile.monetization != 'free'`
- Exclude when: `project_profile.audience == 'internal' or project_profile.monetization == 'free'`

### Success Criteria
- Checkout completion rate > 75% from cart-view to payment-success
- Cart abandonment during checkout < 25% measured on consumer-facing flows
- p95 time from submit-click to confirmation-screen < 3s end-to-end
- Express-checkout path (Apple Pay / Google Pay) completion latency < 2s p95

### Failure Scenarios
- Scenario: Payment form validation happens only on server submit, and errors appear after a 4s network round-trip
  - Impact: Users abandon checkout after typing a wrong CVC because the form looks broken, producing a conversion drop that looks like a gateway problem but is actually a UX problem
  - Mitigation: Perform inline client-side validation on all card fields as the user types and surface errors within 200ms of the blur event
- Scenario: Mobile checkout renders the card form below the submit button because the viewport math is wrong
  - Impact: Mobile conversion collapses silently and the desktop funnel metrics mask the issue for weeks
  - Mitigation: Run device-lab tests on the five most-used mobile viewports per release and instrument mobile-vs-desktop conversion as a separate metric with an alert threshold

### Cross-Tree Refs
- CTC-005 (Tight timeline excludes advanced-depth custom integrations) — depth is CAPPED at Standard when timeline is tight
- CTC-010 (POC / MVP skips advanced depth) — depth is CAPPED at Standard for POC / MVP ambitions

### Experiential
- Usage count: 0
- Scenarios observed: (none — bootstrap)
- Common mistakes:
  - Handling card data directly in the checkout form instead of using an embedded provider element, inadvertently pulling the application into full PCI-DSS scope
  - Shipping a "polished" checkout without instrumenting mobile-specific abandonment, so the revenue impact of a broken mobile flow is invisible to the team
- Last promoted: never

---

### PM-F003: Fraud Detection

Identifying and preventing fraudulent transactions — rules, ML models, risk scoring.

**When It Matters:**
Fraud detection becomes essential when the application handles significant transaction volumes, operates in industries with high chargeback rates, or processes payments in geographies with elevated fraud risk. BFSI requires sophisticated fraud detection by regulation. E-commerce platforms face card-not-present fraud. Marketplace platforms face both buyer and seller fraud. Low-volume internal tools and B2B SaaS with known customers may defer fraud detection initially but will need it as they scale. The depth depends on transaction volume, average transaction value, and the consequences of fraud (chargebacks, regulatory penalties, reputational damage).

**Depth Spectrum:**
- **Basic:** Gateway-provided fraud tools (Stripe Radar basic), address verification (AVS), CVV verification. Sufficient for low-volume, low-risk transactions.
- **Standard:** Rule-based fraud rules (velocity checks, amount thresholds, geographic restrictions), manual review queue for flagged transactions, basic risk scoring, IP reputation checks.
- **Advanced:** ML-based fraud scoring (Stripe Radar for Fraud Teams, Sift, Forter), device fingerprinting, behavioral analytics (typing patterns, mouse movements), real-time risk assessment, automated blocking with manual review for edge cases.
- **Enterprise:** Custom ML models trained on proprietary data, consortium data sharing, network-level fraud detection (cross-merchant patterns), regulatory reporting (SAR filings), integration with identity verification (KYC/KYB), real-time transaction monitoring dashboards.

**Signals:**
PP-7 (Industry Vertical) >= 4 (regulated commerce, BFSI) makes fraud detection essential. NFR-1 (Risk) >= 4 with payment flows needs fraud detection. PP-4 (Geographic) >= 3 (multi-country) increases fraud risk surface. Transaction volume above a few hundred per month warrants at least standard depth. QP-1 (Testing Depth) >= 4 suggests comprehensive tests for fraud rule evaluation including edge cases, false positive scenarios, and ML model regression tests. QP-5 (Observability Maturity) >= 3 suggests real-time metrics and alerting for fraud scoring latency, rule trigger rates, and manual review queue depth. BRD keywords: "fraud", "chargebacks", "risk", "suspicious activity", "transaction monitoring", "KYC".

**Tradeoffs:**
Including: reduced chargeback rates, regulatory compliance, revenue protection, customer trust. Cost: false positive rate (legitimate transactions blocked), ML model training and maintenance, review team for manual queue, additional latency in payment flow, vendor costs for fraud scoring services.

### Inclusion
- Default: **conditional**
- Mandatory when: `project_profile.industry in ['BFSI', 'fintech'] or project_profile.business_model == 'marketplace'`
- Conditional when: `project_profile.security_level in ['high', 'critical'] or project_profile.geographic_scope >= 3 or project_profile.monthly_transaction_volume >= 1000`
- Exclude when: `project_profile.monthly_transaction_volume < 100 and project_profile.security_level == 'low'`

### Success Criteria
- Chargeback rate < 1% of total transactions over any rolling 30-day window
- Fraud model false-positive rate < 2% of legitimate transactions blocked
- Fraud scoring latency added to payment flow < 200ms p95
- Manual review queue resolution time < 4 hours median from flag to decision

### Failure Scenarios
- Scenario: Fraud rules block a legitimate high-value customer during a promotional event
  - Impact: The VIP customer abandons the purchase, complains publicly, and the team discovers the rule catches an edge case no one tested for
  - Mitigation: Maintain a tested allow-list of high-value customers, require two-rule agreement before auto-blocking, and route all first-time blocks of customers over a lifetime-value threshold to the manual review queue
- Scenario: ML fraud model drifts silently as fraud patterns evolve and chargebacks rise over months
  - Impact: Revenue protection degrades slowly, the finance team notices the rising chargeback ratio during quarterly review, and the network penalty bracket is breached
  - Mitigation: Track per-day chargeback rate as a guardrail metric with a hard alert at 0.8%, retrain the model on a quarterly cadence, and run shadow scoring against the current model before promotion

### Cross-Tree Refs
- CTC-005 (Tight timeline excludes advanced-depth custom integrations) — depth is CAPPED at Standard when timeline is tight
- CTC-012 (High-volume payment flows require fraud detection) — this feature is IMPLIED (proposed)

### Experiential
- Usage count: 0
- Scenarios observed: (none — bootstrap)
- Common mistakes:
  - Tuning fraud rules for the lowest chargeback rate without measuring the false-positive rate, discovering later that legitimate revenue was blocked at a higher dollar value than the fraud loss avoided
  - Adding a vendor fraud service into the synchronous payment path without a timeout + fallback strategy, so a vendor outage hard-fails all checkouts
- Last promoted: never

---

### PM-F004: Refunds and Disputes

Processing refunds, handling chargebacks, managing payment disputes.

**When It Matters:**
Any product that processes payments will eventually need to issue refunds. The depth depends on refund volume, refund policy complexity, and regulatory requirements. Simple products can handle refunds manually through the payment gateway dashboard. Products with significant transaction volume need automated refund workflows, partial refund support, and chargeback management. Marketplace platforms need to handle refunds across multiple parties (buyer refund, seller deduction, platform fee adjustment).

**Depth Spectrum:**
- **Basic:** Manual refunds via payment gateway dashboard. Full refund only. No in-app refund management.
- **Standard:** In-app refund initiation, full and partial refunds, refund reason tracking, automatic inventory/credit adjustment, refund confirmation emails.
- **Advanced:** Refund policy engine (time-based eligibility, condition-based rules), chargeback management (evidence submission, representment), automated dispute resolution for clear-cut cases, refund analytics dashboard.
- **Enterprise:** Multi-party refund orchestration (marketplace), credit-based refunds (store credit instead of money back), regulatory refund compliance (cooling-off periods), integration with accounting systems for refund reconciliation.

**Signals:**
Required whenever PM-F001 exists. PP-7 >= 3 (professional services and above) has regulatory refund obligations. PP-3 = 5 (multi-sided platform) needs multi-party refund logic. Volume above a few hundred transactions/month justifies in-app refund management. QP-1 (Testing Depth) >= 3 suggests integration tests for refund scenarios including partial refunds, cross-currency refunds, and chargeback evidence submission workflows. QP-5 (Observability Maturity) >= 3 suggests metrics and alerting for refund processing times, dispute resolution rates, and chargeback ratio thresholds. BRD keywords: "refund", "return", "chargeback", "dispute", "cancellation".

**Tradeoffs:**
Including at higher depth: reduced support burden, faster dispute resolution, lower chargeback rates, regulatory compliance. Cost: refund flow development, accounting integration complexity, edge case handling (partial refunds, cross-currency refunds), potential for refund abuse.

### Inclusion
- Default: **conditional**
- Mandatory when: `project_profile.business_model in ['ecommerce', 'marketplace', 'subscription', 'retail'] and PM-F001 is included`
- Conditional when: `project_profile.compliance contains any of ['GDPR', 'consumer_protection'] or project_profile.monthly_transaction_volume >= 500`
- Exclude when: `PM-F001 is not included`

### Success Criteria
- Refund processing end-to-end time < 2 minutes median from initiation to gateway confirmation
- Partial refund accuracy = 100% match between requested and captured amount
- Chargeback representment win rate > 40% where evidence is submitted
- Refund-related support ticket volume < 3% of refund operations

### Failure Scenarios
- Scenario: A partial refund is issued but the inventory/credit adjustment does not fire, leaving the local ledger out of sync
  - Impact: The customer receives their money back but the internal accounting shows the transaction as fully settled, producing reconciliation pain at month-end and potential ASC 606 revenue misstatement
  - Mitigation: Wrap refund initiation and internal ledger update in a single saga with compensating transactions on failure, and alert on any gateway-refund-succeeded event without a matching ledger adjustment within 60s
- Scenario: Chargeback evidence is submitted past the network's representment window
  - Impact: The business loses the dispute by default, forfeits the transaction amount plus the chargeback fee, and absorbs a network penalty point
  - Mitigation: Enforce a ticker on every inbound chargeback with a hard alert 48 hours before the representment deadline and auto-escalate unclaimed disputes to an on-call reviewer

### Cross-Tree Refs
- CTC-005 (Tight timeline excludes advanced-depth custom integrations) — depth is CAPPED at Standard when timeline is tight
- CTC-010 (POC / MVP skips advanced depth) — depth is CAPPED at Standard for POC / MVP ambitions

### Experiential
- Usage count: 0
- Scenarios observed: (none — bootstrap)
- Common mistakes:
  - Treating refund logic as simple "call the gateway API" and discovering at scale that cross-currency refunds produce rounding deltas that break daily reconciliation
  - Building refund flows without a policy engine, so every new refund exception turns into a code change and a deployment rather than a config update
- Last promoted: never

---

### PM-F005: One-Click / Saved Payment Methods

Storing payment methods for repeat purchases — tokenized cards, saved wallets.

**When It Matters:**
Saved payment methods matter when repeat purchases are a core business model — subscriptions, e-commerce with returning customers, marketplaces with frequent buyers. One-click checkout is a competitive expectation in consumer e-commerce. Less relevant for one-time purchase products, B2B with invoicing, or products where payment is infrequent. The security implications are significant — stored payment credentials are a high-value target.

**Depth Spectrum:**
- **Basic:** Payment gateway-managed tokenization (Stripe Customer objects). Save card on first purchase. Select saved card on return.
- **Standard:** Multiple saved payment methods per user, default payment method, add/remove cards, card expiry notifications, PCI-compliant token storage.
- **Advanced:** One-click checkout (skip payment form entirely), payment method prioritization, automatic card updater (when cards are reissued), cross-device payment method sync.
- **Enterprise:** Organizational payment methods (company cards shared across team), payment method policies (approved card types, spending limits), audit trail for payment method changes.

**Signals:**
Products with repeat purchases. PP-1 >= 4 (consumer) expects one-click. PP-6 >= 3 (market-ready) should offer saved methods for returning customers. NFR-2 (Security) >= 3 requires proper tokenization and PCI scope management. QP-7 (Security Testing) >= 3 indicates SAST and dependency scanning should cover token storage, payment credential lifecycle, and PCI-DSS scope boundaries for saved methods. QP-1 (Testing Depth) >= 3 suggests integration tests for saved payment method CRUD, token expiry handling, and one-click purchase flows. BRD keywords: "one-click", "saved card", "repeat purchase", "returning customer", "express checkout".

**Tradeoffs:**
Including: higher conversion for returning customers, reduced checkout friction, subscription enablement. Cost: PCI-DSS scope expansion (even with tokenization), token lifecycle management, card expiry handling, security liability for stored credentials.

### Inclusion
- Default: **conditional**
- Mandatory when: `project_profile.business_model == 'subscription' or project_profile.repeat_purchase_expected == true`
- Conditional when: `project_profile.user_sophistication >= 4 and project_profile.delivery_ambition >= 3`
- Exclude when: `project_profile.business_model == 'one_time_purchase' or project_profile.audience == 'internal'`

### Success Criteria
- Returning-customer one-click checkout completion rate > 90%
- Token refresh success rate via automatic card updater > 85% of expired cards
- p95 latency from click to confirmation on one-click path < 1500ms
- Stored-token tamper-detection validation passes 100% of daily integrity checks

### Failure Scenarios
- Scenario: Stored payment tokens survive a user's account deletion request
  - Impact: The deleted user retains latent payment credentials on the platform, violating GDPR Article 17 and CCPA deletion rights, and creating a regulator-visible data-handling failure
  - Mitigation: Cascade deletion from user-profile removal into the token vault within the same transactional boundary and verify via a nightly orphan-token sweep that alerts on any token whose user_id no longer resolves
- Scenario: A card is reissued by the bank and the stored token silently starts failing, breaking the subscription
  - Impact: Recurring charges fail for weeks before involuntary churn flags fire, revenue is lost, and the customer blames the product for cancelling their subscription
  - Mitigation: Enable the gateway's automatic card updater service and proactively notify users via email 7 days before the stored card's known expiry date

### Cross-Tree Refs
- CTC-005 (Tight timeline excludes advanced-depth custom integrations) — depth is CAPPED at Standard when timeline is tight
- CTC-006 (GDPR compliance requires profile data export and deletion) — this feature's token-vault deletion path is IMPLIED by GDPR erasure requirements
- CTC-011 (PCI-DSS scope reduction requires tokenization) — this feature is IMPLIED (proposed)

### Experiential
- Usage count: 0
- Scenarios observed: (none — bootstrap)
- Common mistakes:
  - Storing a "convenience copy" of the last four digits and expiry date in the application database without treating it as in-scope for PCI-DSS, then discovering during audit that the application crossed the scope boundary
  - Not implementing card-expiry notifications, letting saved cards silently fail on renewal day and hemorrhaging subscribers through involuntary churn
- Last promoted: never

---

### PM-F006: Subscription / Recurring Billing

Automated recurring charges — plans, trials, upgrades, dunning.

**When It Matters:**
Essential for any subscription-based business model — SaaS, content platforms, membership services. The depth depends on plan complexity and billing flexibility requirements. A simple SaaS with one plan needs basic recurring. A platform with tiered plans, usage-based billing, and enterprise contracts needs sophisticated billing logic. Even non-subscription products may need recurring billing for installment payments or maintenance fees.

**Depth Spectrum:**
- **Basic:** Single plan, monthly billing, cancel anytime. Stripe Billing or equivalent handles everything. Minimal custom code.
- **Standard:** Multiple plans (tiers), monthly/annual billing cycles, free trials, plan upgrades/downgrades with proration, dunning (retry failed charges, payment reminder emails).
- **Advanced:** Usage-based billing (metered), hybrid billing (base + usage), custom enterprise plans, billing period alignment, invoice generation, tax calculation, coupon/discount management.
- **Enterprise:** Multi-entity billing (different legal entities), revenue recognition automation, complex contract terms (ramp deals, committed use discounts), billing API for partner integrations, CPQ integration.

**Signals:**
Any subscription business model. PP-6 >= 3 (market-ready) with subscription model needs at least standard depth. PP-3 >= 3 (multi-persona) may need different plans per persona. PP-7 >= 4 (regulated) needs invoice generation and tax compliance. QP-1 (Testing Depth) >= 3 suggests integration tests for subscription lifecycle including trial-to-paid conversion, proration on plan changes, and dunning retry sequences. QP-5 (Observability Maturity) >= 3 suggests metrics and alerting for billing cycle failures, dunning effectiveness, and MRR reconciliation. QP-3 (Documentation Level) >= 3 indicates API documentation for billing endpoints, webhook event schemas, and plan configuration. BRD keywords: "subscription", "recurring", "billing", "plan", "tier", "trial", "SaaS pricing".

**Tradeoffs:**
Including: recurring revenue automation, self-service plan management, reduced billing support. Cost: proration logic complexity, dunning flow development, tax calculation integration, revenue recognition compliance (ASC 606), plan migration logic when plans change.

### Inclusion
- Default: **conditional**
- Mandatory when: `project_profile.business_model in ['subscription', 'saas']`
- Conditional when: `project_profile.monetization == 'recurring' or project_profile.pricing_model contains 'installment'`
- Exclude when: `project_profile.business_model == 'one_time_purchase' and project_profile.pricing_model == 'single_charge'`

### Success Criteria
- Dunning recovery rate > 50% of failed first-attempt charges recovered within 14 days
- Proration calculation accuracy = 100% match against finance reconciliation over any 30-day window
- Billing cycle execution completion rate > 99.5% of scheduled renewals fire within the cycle window
- Trial-to-paid conversion funnel latency < 1s from trial-end to first successful charge

### Failure Scenarios
- Scenario: Plan upgrade proration miscalculates credit for unused time and the customer is over- or under-charged
  - Impact: Trust is lost on the first plan change, support tickets cluster around billing events, and finance discovers the error during revenue recognition work
  - Mitigation: Test proration logic against a fixture matrix of (old plan, new plan, days-into-cycle) combinations before every release and run a daily reconciliation job comparing expected vs actual invoice amounts
- Scenario: Dunning retries fail to respect the customer's time zone and send payment-failure emails at 3 AM local time
  - Impact: Customers experience the product as noisy and unprofessional, and failed-charge recovery is lower because users miss the message
  - Mitigation: Schedule dunning retries in user-local business hours, cap the retry cadence at 3 attempts over 14 days, and halt dunning on any active support conversation to avoid piling on

### Cross-Tree Refs
- CTC-005 (Tight timeline excludes advanced-depth custom integrations) — depth is CAPPED at Standard when timeline is tight
- CTC-010 (POC / MVP skips advanced depth) — depth is CAPPED at Standard for POC / MVP ambitions

### Experiential
- Usage count: 0
- Scenarios observed: (none — bootstrap)
- Common mistakes:
  - Implementing proration as a linear "days remaining / total days" formula without accounting for leap years, month-length variance, and trial overlaps — then discovering small drift that compounds across thousands of subscribers
  - Deferring ASC 606 revenue-recognition compliance as "something the finance team will bolt on later," then rewriting the billing schema when the auditor asks for contract-level revenue schedules
- Last promoted: never

---

### PM-F007: Multi-Currency / Regional Compliance

Supporting multiple currencies, regional payment methods, and local financial regulations.

**When It Matters:**
Any product selling to customers in multiple countries needs multi-currency support. Users expect to see prices and pay in their local currency. Beyond display, this involves exchange rate management, settlement in multiple currencies, and compliance with regional financial regulations. The depth depends entirely on geographic scope — a single-country product doesn't need this; a global product cannot survive without it.

**Depth Spectrum:**
- **Basic:** Display prices in multiple currencies (static conversion), settle in single base currency. Exchange rate applied at checkout.
- **Standard:** Dynamic exchange rates (via API), settlement in 2-3 major currencies, regional tax calculation (VAT, GST), currency-specific formatting.
- **Advanced:** Settlement in local currencies per region, local payment method support (UPI, iDEAL, PIX, Boleto), regional payment gateway routing, cross-border fee optimization.
- **Enterprise:** Multi-entity financial structure (different legal entities per region), regulatory compliance per jurisdiction (PSD2 in EU, RBI in India), transfer pricing, intercompany settlement, multi-currency accounting integration.

**Signals:**
PP-4 (Geographic Scope) is the primary driver: level 1-2 doesn't need this; level 3 needs basic; level 4-5 needs advanced/enterprise. PP-7 >= 4 (regulated) adds compliance requirements per region. NFR-5 (Compliance) >= 3 with multi-country operations triggers financial regulation compliance. QP-1 (Testing Depth) >= 4 suggests comprehensive tests covering each payment flow across every supported currency and regional payment method — the combinatorial surface demands automated coverage. QP-3 (Documentation Level) >= 3 indicates documentation for supported currencies, regional payment methods, and compliance procedures per jurisdiction. BRD keywords: "international", "global", "multi-currency", "regional", "local payment methods", "cross-border".

**Tradeoffs:**
Including: global market access, localized user experience, regulatory compliance. Cost: exchange rate management complexity, per-region payment gateway integrations, regional tax compliance (VAT/GST filing), legal entity structure, significantly increased testing surface (every payment flow x every region).

### Inclusion
- Default: **conditional**
- Mandatory when: `project_profile.geographic_scope >= 4`
- Conditional when: `project_profile.geographic_scope == 3 or project_profile.compliance contains any of ['VAT', 'GST', 'PSD2']`
- Exclude when: `project_profile.geographic_scope <= 2`

### Success Criteria
- Exchange rate refresh cadence < 15 minutes from upstream source to pricing surfaces
- Cross-currency settlement variance < 0.5% of transaction value absorbed as FX cost
- Regional payment method success rate > 95% per supported method (UPI, iDEAL, PIX, SEPA, etc.)
- Tax calculation accuracy = 100% match against jurisdiction-specific filing requirements over any quarter

### Failure Scenarios
- Scenario: Exchange rate is cached for too long and the customer pays a displayed price that no longer matches settlement reality
  - Impact: The business absorbs an FX hit on every transaction during the stale-rate window, producing margin erosion that is invisible until monthly P&L
  - Mitigation: Refresh rates at least every 15 minutes from a primary source, cache with a hard TTL, and fall back to a secondary source when the primary lags
- Scenario: A local payment method integration breaks after a regional gateway pushes an undocumented API change
  - Impact: Checkout fails silently in one geography while funnel metrics for other regions look healthy, hiding the outage for hours
  - Mitigation: Instrument per-region per-method success rates as independent metrics, run synthetic checkout tests hourly for each region, and alert on any single-region drop exceeding 5 percentage points

### Cross-Tree Refs
- CTC-005 (Tight timeline excludes advanced-depth custom integrations) — depth is CAPPED at Standard when timeline is tight
- CTC-010 (POC / MVP skips advanced depth) — depth is CAPPED at Standard for POC / MVP ambitions
- CTC-013 (Multi-region commerce requires regional tax compliance) — this feature is IMPLIED (proposed)

### Experiential
- Usage count: 0
- Scenarios observed: (none — bootstrap)
- Common mistakes:
  - Building a "multi-currency display" layer without a matching multi-currency settlement layer, so the customer sees prices in local currency but finance reconciles in the base currency and absorbs all FX variance
  - Assuming VAT / GST can be calculated with a flat rate-per-country table, then discovering that VAT rates depend on product category and customer type and producing months of filing errors
- Last promoted: never
