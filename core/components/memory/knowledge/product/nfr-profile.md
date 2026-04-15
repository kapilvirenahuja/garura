# NFR Profile

Characterizes how robust, secure, and scalable the product needs to be. Established after the Product Profile, informed by it.

**Search patterns:** NFR, non-functional, risk profile, security requirements, performance, availability, compliance, scalability, data sensitivity, SLA, uptime, encryption, regulatory

## How to Use

The agent sets initial NFR values based on the Product Profile (using the NFR Guidance in `product-profile.md`) and any explicit requirements in the BRD. The agent presents the profile to the user with reasoning. The user adjusts. This profile is **extensible** — new dimensions can be added by appending sections following the same format.

## Dimensions

### NFR-1: Risk

Business and operational risk tolerance — what happens when things go wrong.

| Level | Label | Description | Examples |
|-------|-------|-------------|----------|
| 1 | Low Risk | Internal tools, prototypes, experiments. Failure has no business impact beyond inconvenience. | Hackathon projects, internal dashboards, personal tools |
| 2 | Moderate Risk | Internal products used by teams. Failure causes productivity loss but no external impact. | Internal workflow tools, team utilities, staging environments |
| 3 | Balanced Risk | Customer-facing product. Failure impacts user experience and may cause support volume. Monitoring and alerting needed. | SaaS products, content platforms, e-commerce stores |
| 4 | High Risk | Financial or legal exposure from failure. Audit trails, compliance reporting, and incident response required. | Fintech, insurance platforms, legal tech, HR systems with payroll |
| 5 | Critical Risk | Life, safety, or regulatory consequences from failure. Formal verification, redundancy, and regulatory audit required. | Healthcare systems, banking core, government critical infrastructure, defense |

### NFR-2: Security

Authentication, authorization, encryption, and security posture depth.

| Level | Label | Description | Examples |
|-------|-------|-------------|----------|
| 1 | Consumer Basic | HTTPS, basic password auth, session cookies. Sufficient for low-risk, non-sensitive applications. | Personal blogs, hobby projects, public information sites |
| 2 | Standard Web | Password policies (strength, expiry), session management, CSRF protection, security headers, input validation. | Standard web applications, internal tools, small SaaS |
| 3 | Business Grade | MFA, RBAC, encryption in transit, API key management, security scanning, dependency auditing. SOC2 preparation. | B2B SaaS, enterprise tools, customer-facing platforms |
| 4 | Enterprise Grade | Encryption at rest, SOC2 certified, penetration testing, WAF, DDoS protection, security incident response plan, SSO/SAML. | Enterprise SaaS, regulated commerce, data-sensitive applications |
| 5 | BFSI / Gov Grade | HSM for key management, zero-trust architecture, FedRAMP/ISO 27001, continuous security monitoring, red team exercises, formal threat modeling. | Banking, government systems, defense, critical infrastructure |

### NFR-3: Performance

Latency, throughput, and response time requirements.

| Level | Label | Description | Examples |
|-------|-------|-------------|----------|
| 1 | Best Effort | Page loads under 5 seconds acceptable. No optimization. Suitable for low-traffic, non-critical apps. | Internal tools, admin panels, low-traffic sites |
| 2 | Optimized | Sub-2 second page loads. Basic caching (CDN for static assets, browser cache). Database query optimization. | Standard web apps, content sites, small e-commerce |
| 3 | Fast | Sub-500ms API responses. Application-level caching (Redis), query optimization, lazy loading, image optimization. | Production SaaS, e-commerce under load, content platforms |
| 4 | Real-Time | Sub-100ms responses for critical paths. WebSocket/SSE for live updates. Edge computing. Streaming data processing. | Trading platforms, collaborative editing, gaming, live dashboards |
| 5 | Ultra-Low Latency | Sub-10ms for critical operations. In-memory data stores, purpose-built infrastructure, pre-computed results, co-located services. | High-frequency trading, real-time bidding, IoT control systems |

### NFR-4: Availability

Uptime, redundancy, and disaster recovery requirements.

| Level | Label | Description | Examples |
|-------|-------|-------------|----------|
| 1 | Best Effort | Downtime acceptable. Single instance. Manual recovery. No SLA. | Personal projects, internal experiments, dev environments |
| 2 | Business Hours | ~99% uptime. Planned maintenance windows. Manual failover. Recovery within hours. | Internal business tools, regional services, small SaaS |
| 3 | Standard | 99.9% uptime (8.7h downtime/year). Automated failover within AZ. Health checks and monitoring. Blue-green deployments. | Production SaaS, e-commerce, customer-facing platforms |
| 4 | High Availability | 99.99% uptime (52min downtime/year). Multi-AZ deployment. Automated scaling. Zero-downtime deployments. Hot standby databases. | Enterprise SaaS, financial services, healthcare platforms |
| 5 | Mission Critical | 99.999% uptime (5min downtime/year). Multi-region active-active. Chaos engineering. Automated disaster recovery. Geographic redundancy. | Banking core systems, emergency services, critical infrastructure |

### NFR-5: Compliance

Regulatory and standards compliance requirements.

| Level | Label | Description | Examples |
|-------|-------|-------------|----------|
| 1 | None | No specific regulatory requirements. Standard terms of service sufficient. | Internal tools, personal projects, general utilities |
| 2 | Basic | Cookie consent, terms of service, basic privacy policy, email opt-out (CAN-SPAM). | Simple web apps, content sites, newsletters |
| 3 | Standard | GDPR compliance (data subject rights, consent management, DPA), CCPA, basic data governance. Privacy by design. | SaaS with EU users, consumer apps with PII, marketing platforms |
| 4 | Regulated | PCI-DSS (if handling payments), SOC2 Type II, data residency requirements, audit trails, regular compliance assessments. | Fintech, payment platforms, enterprise SaaS, insurance |
| 5 | Heavily Regulated | HIPAA (healthcare), SOX (financial reporting), FedRAMP (government), industry-specific frameworks, mandatory third-party audits. | Healthcare, banking, government, defense, pharmaceutical |

### NFR-6: Scalability

Growth trajectory — users, data volume, and geographic expansion readiness.

| Level | Label | Description | Examples |
|-------|-------|-------------|----------|
| 1 | Fixed | Known small user base (< 100). Single server. No growth expected. Vertical scaling if needed. | Internal department tools, personal projects, fixed-scope contracts |
| 2 | Moderate Growth | Hundreds of users. Vertical scaling sufficient. Basic load balancing. Manageable data volumes. | Small SaaS, regional services, team tools |
| 3 | Growth-Oriented | Thousands of users. Horizontal scaling, load balancing, database read replicas. Designed for 10x growth. | Production SaaS, growing e-commerce, content platforms |
| 4 | High Scale | Hundreds of thousands of users. Auto-scaling, database sharding, message queues, microservices consideration. | Popular SaaS, large e-commerce, media platforms |
| 5 | Global Scale | Millions of users. Multi-region deployment, edge distribution, eventual consistency, CQRS, purpose-built data stores. | Global platforms (Netflix, Uber scale), worldwide marketplaces |

### NFR-7: Data Sensitivity

Classification level of data the system handles.

| Level | Label | Description | Examples |
|-------|-------|-------------|----------|
| 1 | Public | No sensitive data. Public content, open APIs. No access control needed on data. | Public websites, open-source tools, public API documentation |
| 2 | Internal | Business data, internal communications. Basic access control. Not publicly exposed. | Internal dashboards, team tools, company intranets |
| 3 | Confidential | PII (names, emails, addresses), user-generated content. Encryption at rest recommended. Access logging. | Standard SaaS with user accounts, CRM, e-commerce |
| 4 | Sensitive | Financial data (transactions, balances), health records, legal documents. Encryption at rest required. Field-level access control. Audit trails. | Fintech, health tech, legal tech, insurance, HR with payroll |
| 5 | Classified | Government secrets, PHI under HIPAA, payment card data under PCI, defense information. Air-gapped systems possible. Formal access control with clearance levels. | Government classified systems, healthcare core records, payment processing |

## Extending This Profile

To add a new NFR dimension:
1. Add a new section following the format above: `### NFR-N: Dimension Name` with a 5-level table
2. Each level needs: label, description, and examples
3. Consider whether any Product Profile values should suggest defaults for this dimension (update `product-profile.md` NFR Guidance)
4. No other files need to change — dimensions are additive
