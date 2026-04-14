# Domain Taxonomy

Software module feature catalogs with semantic context for agent reasoning.

Agents and skills query this directory when they need to know: **"What features exist in this domain, when do they matter, and at what depth should they be built?"**

## Contents

| Module | File | Feature Count | Search Patterns |
|--------|------|---------------|-----------------|
| User Management | `user-management.md` | 8 | user authentication, login, password, MFA, user profile, registration, SSO, onboarding |
| Payments | `payments.md` | 7 | payment, billing, checkout, fraud, refund, subscription, multi-currency, compliance |
| Commerce | `commerce.md` | 8 | ecommerce, catalog, cart, orders, inventory, product listing, reviews, promotions |
| Search | `search.md` | 5 | search, discovery, full-text, facets, autocomplete, relevance, semantic search |
| Personalization | `personalization.md` | 6 | personalization, recommendations, A/B testing, user segments, behavioral triggers, preference |

## When to Load

Load when:
- Scoping epics from a product vision or BRD
- Identifying which features apply to a product based on its profile
- Determining feature depth based on project profiling dimensions
- Consulting domain feature catalogs during roadmap planning

## Feature Schema

Every feature in a module file carries NINE required sections — four prose sections for human context and five structured sections for programmatic consumption by the product-planning pipeline.

### Human prose sections (read by humans and agents)

**When It Matters** — Prose describing the conditions under which this feature becomes essential. References industry verticals, persona types, regulatory contexts, and business scenarios. This is NOT a conditional rule — it's context for agent judgment.

**Depth Spectrum** — What this feature looks like at different levels of investment. Typically four levels:
- **Basic** — minimum viable version, simplest implementation
- **Standard** — production-ready, covers common cases
- **Advanced** — sophisticated, handles edge cases, integrations
- **Enterprise/Agentic** — full-featured, enterprise-grade or AI-powered

**Signals** — What in a BRD or project profile would indicate this feature is needed. References Product Profile dimensions (PP-1 through PP-7) and NFR Profile dimensions (NFR-1 through NFR-7) by ID where relevant. Also includes BRD keywords that suggest this feature.

**Tradeoffs** — What you gain by including this feature and what it costs. Helps the agent reason about priority and phasing — a feature with high gains but high cost might be deferred to a later phase.

### Structured sections (read by the product-planning pipeline)

Added in 214.4 per ADR 017. The contract is defined in `core/components/memory/standards/kb-extension-conventions.md` and enforced by the `validate-kb-extension` skill.

**Inclusion** — Whether this feature is mandatory / optional / conditional, with `Mandatory when`, `Conditional when`, and `Exclude when` rules referencing `project_profile.*` fields. Drives automatic capability selection in `specify-product` stage 3.

**Success Criteria** — Measurable outcomes. Every entry must be quantified (number + unit, percentage, or specific threshold). Drives the intent-epic template's success_scenarios field.

**Failure Scenarios** — At least two failure modes, each with Scenario / Impact / Mitigation sub-fields. Drives the intent-epic template's failure_scenarios field. This is the section that prevents "sounds good, means nothing" shallow epics — the validator refuses to accept empty failure scenarios.

**Cross-Tree Refs** — References to constraint rules in `_cross-tree-constraints.yaml` that involve this feature, in the form `CTC-NNN`. The linter asserts every reference resolves to a real constraint.

**Experiential** — Bootstrap block for `/capture-learning` and future `/promote-to-kb` to write experiential learnings (usage count, scenario outcomes, common mistakes, last-promoted timestamp). Starts empty for new features.

### Cross-tree constraints file

`_cross-tree-constraints.yaml` sits alongside the domain-taxonomy files and holds constraint rules in the form `(condition) ⇒ (include/exclude capability X)`. The Product Keeper agent walks each constraint during `specify-product` stage 3, checks the LHS against the project profile and already-selected capabilities, and enforces the RHS. See the file header for the schema and the 10 bootstrap constraints (CTC-001 through CTC-010).

### Example Feature Entry

```markdown
### UM-F004: Multi-Factor Authentication (MFA)

Second-factor authentication beyond password — TOTP, SMS, hardware keys, biometric.

**When It Matters:**
MFA becomes essential when the application handles sensitive user data, operates
in regulated industries (BFSI, healthcare, government), or when organizational
security policies require multi-factor verification. For consumer apps with
low-risk data, MFA should be optional to avoid onboarding friction. B2B
applications serving enterprise customers will often require MFA for compliance
(SOC2, ISO 27001). The key question is not just "how sensitive is the data" but
"what are the consequences of account compromise."

**Depth Spectrum:**
- **Basic:** TOTP-based second factor (Google Authenticator, Authy). Single method.
- **Standard:** TOTP + SMS fallback. Per-user enrollment. Recovery codes.
- **Advanced:** Hardware key support (WebAuthn/FIDO2), risk-based adaptive MFA
  that challenges only on suspicious logins, biometric options.
- **Enterprise:** Conditional access policies, geo-fencing, device trust
  evaluation, integration with enterprise IdPs for MFA policy inheritance.

**Signals:**
PP-7 (Industry Vertical) >= 4 strongly suggests MFA. PP-3 (Persona Complexity)
>= 4 with role hierarchies needs MFA for admin access at minimum. NFR-2
(Security) >= 3 makes MFA essential. BRD mentions: "compliance", "SOC2",
"enterprise customers", "sensitive data", "admin access", "financial
transactions".

**Tradeoffs:**
Including: stronger security posture, compliance readiness (SOC2, HIPAA),
enterprise sales eligibility, reduced account compromise risk. Cost: user
friction during onboarding and login, SMS delivery costs, support burden for
lockouts and recovery, integration complexity with authenticator apps and
hardware keys.
```

## How Agents Use This

1. Agent identifies which modules are relevant to the product (from BRD content and PP-7 Industry Vertical)
2. Agent loads the relevant module files
3. For each feature, agent reads the semantic context (all 4 sections)
4. Agent combines feature context with the project's Product Profile and NFR Profile values
5. Agent **reasons** about whether the feature applies and at what depth — no rules evaluated, no tiers computed
6. Agent presents feature recommendations to the user with rationale derived from the semantic context

## Extending the Taxonomy

To add a new module:
1. Create a new `.md` file in this directory following the schema above
2. Give each feature a unique ID with a module prefix (e.g., `NT-F001` for "Notifications")
3. Ensure every feature has all 4 semantic sections with substantive prose
4. Update this `_index.md` with the new module entry in the Contents table
5. No other files need to change — the architecture is open for extension
