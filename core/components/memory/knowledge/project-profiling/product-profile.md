# Product Profile

Characterizes what the product is — its users, experience, scope, and ambition. Derived from BRD analysis, tuned by user.

**Search patterns:** product profile, personas, UX maturity, user sophistication, delivery ambition, industry vertical, geographic scope, integration density, persona complexity

## How to Use

The agent reads the BRD/PRD and **derives** initial values for each dimension. The agent then presents the profile to the user with its reasoning. The user adjusts any values. This is not a cold questionnaire — the agent does the work, the user validates.

## Dimensions

### PP-1: User Sophistication

Who is using this product — their technical ability and expectations.

| Level | Label | Description | Examples |
|-------|-------|-------------|----------|
| 1 | Technical / Developer | CLI-friendly, API-first, minimal UI. Users are builders who prefer programmatic access and dense information. | Developer tools, CI/CD platforms, infrastructure dashboards, SDKs |
| 2 | Power User | Feature-rich, keyboard shortcuts, bulk operations, dense layouts. Users know the domain and want efficiency over hand-holding. | Analytics platforms, trading terminals, design tools (Figma), IDEs |
| 3 | Business Professional | Clean dashboards, guided workflows, contextual help. Users are domain experts but not technical. | CRM (Salesforce), project management (Jira), HR tools, B2B SaaS |
| 4 | General Consumer | Intuitive, mobile-first, onboarding flows, progressive disclosure. Users expect zero learning curve. | Social media, food delivery, ride-sharing, consumer fintech, e-commerce |
| 5 | Assisted / Accessibility-First | Simplified UX, large targets, screen reader support, voice navigation, elderly/low-literacy optimized. | Government services, healthcare patient portals, accessibility-mandated applications, senior care |

### PP-2: User Experience Maturity

What level of UX sophistication does the product deliver.

| Level | Label | Description | Examples |
|-------|-------|-------------|----------|
| 1 | Functional MVP | Usable but plain. Single channel (web or mobile). No design system. Focus on function over form. | Internal tools, prototypes, hackathon projects, admin panels |
| 2 | Polished Single-Channel | Consistent UI, responsive, basic design system. One primary channel with decent aesthetics. | Early-stage SaaS, simple e-commerce, landing page + app |
| 3 | Multi-Channel Responsive | Desktop + mobile responsive. Design system with component library. Smooth interactions. Accessibility AA compliant. | Production SaaS, e-commerce platforms, content platforms |
| 4 | Omni-Channel Seamless | Web + mobile + tablet with shared state. Push notifications. Offline-capable. Micro-interactions. Cross-device continuity. | Major consumer apps, banking apps, media platforms |
| 5 | Agentic / Adaptive | AI-driven UX, conversational interfaces, adaptive layouts, predictive navigation, novel interaction paradigms. | AI assistants, smart home interfaces, next-gen productivity tools |

### PP-3: Persona Complexity

How many distinct user types with different experiences.

| Level | Label | Description | Examples |
|-------|-------|-------------|----------|
| 1 | Single Persona | One user type. One role. One experience. Everyone sees the same thing. | Single-purpose tools, personal utilities, calculators |
| 2 | Primary + Admin | End user + admin/back-office. Two distinct experiences — user-facing and management. | Simple SaaS (users + admin dashboard), content sites (readers + editors) |
| 3 | Multi-Persona | 3-4 distinct personas with different feature access, dashboards, and workflows. | CRM (sales rep, manager, admin), LMS (student, instructor, admin) |
| 4 | Role Hierarchy | Complex role structures, delegated permissions, team/org hierarchies, approval chains. | Enterprise SaaS (user, team lead, manager, org admin, super admin) |
| 5 | Multi-Sided Platform | Marketplace/platform with buyers, sellers, admins, partners, each with distinct journeys and incentives. | Amazon (buyer, seller, admin), Uber (rider, driver, ops), Airbnb (guest, host, admin) |

### PP-4: Geographic Scope

Where does this product operate.

| Level | Label | Description | Examples |
|-------|-------|-------------|----------|
| 1 | Single Region / Local | One language, one currency, one regulatory framework. Local users only. | Local business tools, regional services, city-specific apps |
| 2 | National | Single country but multiple regions/states with minor variations. One language, one currency. | National e-commerce, country-specific fintech, domestic logistics |
| 3 | Multi-Country | 2-5 countries. i18n required, multi-currency, basic regional compliance (GDPR if EU). | Regional SaaS expanding internationally, cross-border e-commerce |
| 4 | Continental / Trade Bloc | EU/APAC/Americas scope. GDPR-class regulations. RTL support possible. Multiple languages and currencies. | Pan-European platforms, APAC marketplace, Americas-wide services |
| 5 | Global | Worldwide operation. Full l10n, all major currencies, multi-regulatory (GDPR + CCPA + LGPD + PIPA), CDN, data residency per region. | Global SaaS (Slack, Shopify), worldwide marketplaces, international fintech |

### PP-5: Integration Density

How connected is this product to external systems.

| Level | Label | Description | Examples |
|-------|-------|-------------|----------|
| 1 | Standalone | Self-contained product. No external dependencies beyond hosting. | Note-taking apps, calculators, offline-first tools |
| 2 | Consumer | Consumes 1-2 external APIs (payment gateway, email service, auth provider). One-way data flow. | Simple SaaS using Stripe + SendGrid, apps using Firebase |
| 3 | Bidirectional | Consumes and exposes APIs. Webhooks for event notification. 3-5 integration points. | SaaS with public API, e-commerce with shipping + payment + analytics |
| 4 | Ecosystem Participant | Lives in a platform ecosystem (Shopify, Salesforce, Slack). Plugin/app model. OAuth provider capability. | Shopify apps, Salesforce integrations, Slack bots, Zapier connectors |
| 5 | Platform / Hub | IS the ecosystem. Marketplace APIs, partner SDKs, developer portal, event streaming, federation protocol. | Stripe, Twilio, AWS services, platform marketplaces |

### PP-6: Delivery Ambition

How far does the initial delivery go.

| Level | Label | Description | Examples |
|-------|-------|-------------|----------|
| 1 | Proof of Concept | Validate idea. Single happy path. No production hardening. Days to weeks. | Hackathon projects, investor demos, concept validation |
| 2 | MVP | Core value prop working. Primary persona served. Mocks for non-critical paths. 1-2 months. | Startup MVPs, internal tool v1, beta products |
| 3 | Market-Ready v1 | Full primary flows, error handling, basic analytics, production-grade. Ready for paying customers. 3-6 months. | SaaS launch, e-commerce launch, app store release |
| 4 | Competitive Product | Feature parity with market. Multi-persona support. Polished UX. 6-12 months. | Growth-stage products, enterprise-ready SaaS |
| 5 | Enterprise / Platform | Full platform capabilities. Multi-tenant, white-label, partner ecosystem, advanced operations. 12+ months. | Enterprise SaaS, marketplace platforms, infrastructure products |

### PP-7: Industry Vertical

What industry does this product serve.

| Level | Label | Description | Examples |
|-------|-------|-------------|----------|
| 1 | General / Horizontal | No industry-specific requirements. Generic SaaS, tools, utilities. | Project management, note-taking, communication tools |
| 2 | Consumer / Lifestyle | Food, sports, entertainment, social, travel. Light regulation. Experience-driven. | Food delivery, fitness apps, travel booking, social media |
| 3 | Professional Services | Legal, consulting, real estate, education. Moderate domain rules and professional standards. | Legal tech, EdTech, real estate platforms, consulting tools |
| 4 | Regulated Commerce | E-commerce, fintech-lite, insurance-lite. PCI-DSS, consumer protection laws, financial conduct rules. | Payment platforms, lending, insurance comparison, regulated e-commerce |
| 5 | Heavily Regulated | BFSI, healthcare, government, defense. HIPAA/SOX/FedRAMP-class compliance. Domain-specific features mandatory. | Banking, healthcare platforms, government services, defense systems |

## NFR Guidance

How product profile values suggest NFR profile defaults. These are soft suggestions — the agent presents them as recommended starting points, not enforced values.

| Product Profile Condition | Suggested NFR Default | Rationale |
|--------------------------|----------------------|-----------|
| PP-7 >= 4 (Regulated Commerce+) | NFR-5 (Compliance) >= 3 | Regulated industries need compliance frameworks |
| PP-7 = 5 (Heavily Regulated) | NFR-2 (Security) >= 4 | BFSI/healthcare needs high security |
| PP-7 = 5 (Heavily Regulated) | NFR-7 (Data Sensitivity) >= 4 | Heavily regulated industries handle sensitive data |
| PP-4 >= 4 (Continental+) | NFR-4 (Availability) >= 3 | Global scope needs reliable uptime and redundancy |
| PP-4 >= 3 (Multi-Country) | NFR-5 (Compliance) >= 2 | Cross-border operations trigger regulatory requirements |
| PP-6 = 1 (POC) | All NFR dimensions default to 1 | POC doesn't need production hardening |
| PP-6 >= 4 (Competitive+) | NFR-3 (Performance) >= 3 | Competitive products need performance optimization |
| PP-3 = 5 (Multi-Sided Platform) | NFR-6 (Scalability) >= 3 | Platforms need to scale for multiple user types |
| PP-5 >= 4 (Ecosystem+) | NFR-4 (Availability) >= 3 | Ecosystem participants can't be down when partners depend on them |
| PP-1 = 5 (Assisted/Accessibility) | NFR-3 (Performance) >= 3 | Accessibility-first needs fast, responsive interfaces |
