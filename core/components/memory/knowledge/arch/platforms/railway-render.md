# Developer-Friendly PaaS (Railway, Render, Fly.io)

Simple deployment platforms — push code, get a running service. No infrastructure configuration.

**Search patterns:** Railway, Render, Fly.io, PaaS, simple deployment, hobby, developer platform, push to deploy, managed hosting

## When to Choose

These platforms are the right choice when the team wants to ship without thinking about infrastructure. Push code, get a URL. Choose for: MVPs, prototypes, side projects, small-to-medium SaaS products, and any situation where developer velocity matters more than infrastructure control. Railway and Render auto-detect language and framework, provision databases with one click, and handle SSL, scaling, and deploys. Fly.io adds edge deployment (containers at edge locations globally). Perfect for products in the POC-to-market-ready range where the team is 1-10 developers and infrastructure expertise is limited or better spent on product.

## When to Avoid

Avoid for enterprise products requiring specific compliance certifications (SOC2 audit of your infrastructure, not the platform's). Avoid when fine-grained infrastructure control is needed (custom networking, VPN, specific instance types). Avoid at very high scale where AWS/GCP cost optimization via reserved instances matters. Avoid when the organization has DevOps/Platform teams — these platforms replace that team's value.

## Scale Profile

| Dimension | Sweet Spot | Stretch | Break Point |
|-----------|-----------|---------|-------------|
| Team size | 1-15 | 15-50 | > 50 (need more governance, consider AWS/GCP) |
| Monthly spend | $0-$1K | $1K-$10K | > $10K (cost vs AWS/GCP calculus) |
| Services | 1-10 | 10-20 | > 20 (management overhead grows) |

## Key Components

| Platform | Strengths | Best For |
|----------|----------|---------|
| Railway | Simplest UX, one-click databases, monorepo support, usage-based pricing | General-purpose PaaS, full-stack apps |
| Render | Free tier, auto-scaling, managed PostgreSQL, static sites | Static sites + API, simple web apps |
| Fly.io | Edge deployment (containers near users), global distribution, WireGuard networking | Low-latency global apps, edge computing |

## Tradeoffs

| Aspect | Gain | Cost |
|--------|------|------|
| Simplicity | Push to deploy, managed databases, zero infrastructure | Less control, limited customization |
| Speed | From code to URL in minutes | Platform-specific limitations |
| Cost | Free tiers, pay-per-use | More expensive per compute-unit than AWS at scale |
| DX | Excellent developer experience | Limited enterprise features (SSO, audit, compliance) |

## Anti-Patterns

| Anti-Pattern | Description | Risk |
|-------------|-------------|------|
| PaaS for enterprise compliance | Assuming the platform's SOC2 covers your audit | Compliance gaps — your infrastructure must be auditable |
| Ignoring egress costs | Not accounting for data transfer pricing | Surprise bills for API-heavy apps |
| No migration plan | Deep platform-specific integrations without abstraction | Stuck when you need to move to AWS/GCP |
