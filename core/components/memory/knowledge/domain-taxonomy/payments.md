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
Any product that charges money. PP-4 (Geographic Scope) >= 3 needs multi-currency and local payment methods. PP-5 (Integration Density) >= 3 suggests payment as a platform capability. PP-7 >= 4 (regulated) increases PCI-DSS compliance needs. NFR-4 (Availability) >= 3 needs gateway failover. BRD keywords: "payment", "checkout", "billing", "charge", "purchase", "transaction".

**Tradeoffs:**
Including at higher depth: revenue reliability, geographic expansion capability, compliance readiness, reduced payment failure rates. Cost: PCI-DSS compliance burden, gateway integration complexity, payment reconciliation overhead, financial regulation knowledge required on the team.

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
PP-1 (User Sophistication) drives UX complexity: level 4-5 (consumer) needs express checkout; level 3 (business) needs invoicing options. PP-2 (UX Maturity) >= 3 expects polished payment experience. PP-6 = 1-2 (POC/MVP) can use hosted checkout pages. BRD keywords: "checkout", "cart", "purchase flow", "payment page", "conversion".

**Tradeoffs:**
Including at higher depth: higher conversion rates, reduced cart abandonment, better user experience, competitive parity. Cost: front-end development complexity, PCI-DSS scope (if handling card data directly), A/B testing investment, mobile-specific checkout optimization.

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
PP-7 (Industry Vertical) >= 4 (regulated commerce, BFSI) makes fraud detection essential. NFR-1 (Risk) >= 4 with payment flows needs fraud detection. PP-4 (Geographic) >= 3 (multi-country) increases fraud risk surface. Transaction volume above a few hundred per month warrants at least standard depth. BRD keywords: "fraud", "chargebacks", "risk", "suspicious activity", "transaction monitoring", "KYC".

**Tradeoffs:**
Including: reduced chargeback rates, regulatory compliance, revenue protection, customer trust. Cost: false positive rate (legitimate transactions blocked), ML model training and maintenance, review team for manual queue, additional latency in payment flow, vendor costs for fraud scoring services.

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
Required whenever PM-F001 exists. PP-7 >= 3 (professional services and above) has regulatory refund obligations. PP-3 = 5 (multi-sided platform) needs multi-party refund logic. Volume above a few hundred transactions/month justifies in-app refund management. BRD keywords: "refund", "return", "chargeback", "dispute", "cancellation".

**Tradeoffs:**
Including at higher depth: reduced support burden, faster dispute resolution, lower chargeback rates, regulatory compliance. Cost: refund flow development, accounting integration complexity, edge case handling (partial refunds, cross-currency refunds), potential for refund abuse.

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
Products with repeat purchases. PP-1 >= 4 (consumer) expects one-click. PP-6 >= 3 (market-ready) should offer saved methods for returning customers. NFR-2 (Security) >= 3 requires proper tokenization and PCI scope management. BRD keywords: "one-click", "saved card", "repeat purchase", "returning customer", "express checkout".

**Tradeoffs:**
Including: higher conversion for returning customers, reduced checkout friction, subscription enablement. Cost: PCI-DSS scope expansion (even with tokenization), token lifecycle management, card expiry handling, security liability for stored credentials.

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
Any subscription business model. PP-6 >= 3 (market-ready) with subscription model needs at least standard depth. PP-3 >= 3 (multi-persona) may need different plans per persona. PP-7 >= 4 (regulated) needs invoice generation and tax compliance. BRD keywords: "subscription", "recurring", "billing", "plan", "tier", "trial", "SaaS pricing".

**Tradeoffs:**
Including: recurring revenue automation, self-service plan management, reduced billing support. Cost: proration logic complexity, dunning flow development, tax calculation integration, revenue recognition compliance (ASC 606), plan migration logic when plans change.

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
PP-4 (Geographic Scope) is the primary driver: level 1-2 doesn't need this; level 3 needs basic; level 4-5 needs advanced/enterprise. PP-7 >= 4 (regulated) adds compliance requirements per region. NFR-5 (Compliance) >= 3 with multi-country operations triggers financial regulation compliance. BRD keywords: "international", "global", "multi-currency", "regional", "local payment methods", "cross-border".

**Tradeoffs:**
Including: global market access, localized user experience, regulatory compliance. Cost: exchange rate management complexity, per-region payment gateway integrations, regional tax compliance (VAT/GST filing), legal entity structure, significantly increased testing surface (every payment flow x every region).
