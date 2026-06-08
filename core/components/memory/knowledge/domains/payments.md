---
id: domains/payments
title: "Payments: taking money safely — PSP-first, PCI-scope-minimised"
conditions:
  trigger: "the product takes money — card charges, wallets, refunds, fraud control"
  selection_keys: [shape.monetization, nfr.security, compliance, fraud-risk, regions]
provenance: Claude-drafted on delegation, reviewed and accepted by Kapil (#434) + distilled from the wiped payments shelf
---

# Payments: taking money safely

> **Claude-drafted on delegation; reviewed and accepted by Kapil (#434).** Kapil
> asked me to take the first pass here rather than be interviewed, and signed off on
> this version. Payments is infrastructure, not the content-led strength of this
> practice, so it's treated as a likely **hand-off / partner domain** — same logic
> as the commerce-heavy quadrants in `ecommerce`.

## Stance (proposed)
The one organising rule: **never hold card data you don't have to.** Charge through
a **PSP** (Stripe/Adyen/etc.) with **hosted fields / tokenisation**, so you stay
out of the worst of PCI scope. Payments is **trust infrastructure** — almost every
choice here is pulled by `nfr.security` or a `compliance` regime (PCI-DSS is
usually one).

Taking money is separate from *what to charge / on what plan* — that was `billing`,
now dropped from the set (#434); fold any recurring-charge needs into `ecommerce`
or the product as required. The buy-flow UX lives with `ecommerce`; this domain is
the money movement behind it.

## Intents this domain captures (proposed — sanity-check)
**Payer intents**
- **Pay quickly** — "let me complete payment with minimum friction" → checkout, saved methods.
- **Pay safely** — "my money and card data are protected" → PSP/tokenisation, fraud control.
- **Be made whole** — "refund or dispute when something's wrong" → refunds & disputes.

**Operator intents**
- **Capture reliably** — "money moves and reconciles, every time" → payment processing.
- **Lose less to fraud** — "stop fraud and chargebacks" → fraud detection.
- **Stay compliant** — "provably within PCI/regime" → scope minimisation, audit trail.

## Capabilities (selected by risk, scale, regime)
- **Payment Processing** — the floor: card via PSP; bank transfer/ACH/wallets when
  the region or user base expects non-card rails. Tokenise; never store raw PANs.
- **Checkout / Payment UX** — accessible payment screens (`nfr.accessibility`);
  localised currency and methods across regions. (Pairs with `ecommerce`.)
- **Fraud Detection** — provider risk rules at the floor; custom rules + manual
  review when `nfr.security >= high` or fraud loss outgrows defaults.
- **Refunds & Disputes** — full/partial refunds; chargeback handling; dispute
  evidence workflow when a regime or volume requires the audit trail.
- **Saved Methods / One-Click** — when repeat purchase or conversion speed matters;
  tokenised vaulting only (mandatory under PCI-DSS).

## Where it goes wrong (proposed)
- **Touching card data you didn't need to** — blowing PCI scope by not using hosted
  fields/tokenisation.
- **Fraud as an afterthought** — bolted on after losses, not designed for the risk.
- **Reconciliation gaps** — money moves but doesn't tie out; disputes have no trail.
- **Region blindness** — card-only when the market expects local rails/wallets.

## Intelligence features (proposed)
**Core / adjacent here is genuinely fuzzy — confirm.**
- **Fraud & anomaly detection** — ML risk scoring, velocity checks (likely the main
  intelligence play).
- **Smart retries / decline recovery** — recover soft declines.
- **Payment routing optimisation** — route for cost/approval rate across PSPs.
These are operator-side, infrastructure intelligence — probably **adjacent / handed
off** for this practice, not content-led core. Confirm.

## Non-negotiables (proposed)
- **Never hold card data you don't have to** — PSP + hosted fields + tokenisation.
- **PCI scope minimisation** whenever PCI-DSS is in force.
- **Fraud designed in** when security level or fraud risk calls for it.
- **A dispute/audit trail** when a regime or chargeback volume requires it.

## Rationale
Payments rewards conservatism: the cheapest, safest build delegates card handling
to a PSP and tokenises everything, which keeps PCI scope (and audit cost) small.
Fraud, custom rules, vaulting, and dispute workflows each carry real money and
audit burden, so they earn inclusion only when the security level, compliance
regime, or actual loss calls for them. Because this is infrastructure rather than
the practice's content-led strength, the honest position may be to partner/hand off
heavy payments work — same logic as commerce-heavy `ecommerce`.

## Evolve when
- `compliance` adds/raises PCI-DSS → tighten to hosted fields, tokenised vaulting,
  dispute evidence trail.
- Fraud loss climbs, or `nfr.security` rises → add custom fraud rules + manual review.
- New regions → add local methods, currencies, rails.
- Repeat purchase becomes the norm → add saved methods / one-click.

## Provenance
Claude-drafted on delegation, reviewed and accepted by Kapil (#434). Distilled from
the wiped `payments.md` and re-expressed against the v1 product profile and the
locked shelf template. Treated as a likely hand-off / partner domain.
