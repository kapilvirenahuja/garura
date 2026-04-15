# Project Profiling

Three-axis project profiling model that provides structured context for agent reasoning about feature applicability, depth, phasing, and engineering quality standards.

Agents and skills query this directory when they need to know: **"What kind of project is this, what are its technical requirements, and what engineering quality does it demand?"**

## Contents

| File | Description | Search Patterns |
|------|-------------|-----------------|
| `product-profile.md` | 7 dimensions characterizing what the product is (users, UX, personas, geography, integrations, delivery, industry) | product profile, personas, UX maturity, delivery ambition, industry vertical, geographic scope, integration density |
| `nfr-profile.md` | 7+ dimensions characterizing how robust the product needs to be (risk, security, performance, availability, compliance, scalability, data sensitivity) | NFR, non-functional, risk profile, security requirements, performance, availability, compliance, scalability, data sensitivity |
| `quality-profile.md` | 7 dimensions characterizing engineering quality practices (testing, code quality, documentation, CI/CD, observability, accessibility, security testing) | quality profile, reliability, performance standards, security practices, usability standards, maintainability, observability, compliance practices, testing depth, code quality, documentation, linting, design patterns, technical debt |

## Three-Axis Model

Projects are characterized along three complementary axes:

**Product Profile** — answers "What are we building, for whom, and how ambitious is it?" Seven dimensions capture the product's character: who uses it (PP-1, PP-3), what the experience looks like (PP-2), where it operates (PP-4), what it connects to (PP-5), how far we're going (PP-6), and what industry it serves (PP-7).

**NFR Profile** — answers "How robust, secure, and scalable does it need to be?" Seven dimensions (extensible) capture the technical requirements: risk tolerance, security depth, performance targets, availability, compliance obligations, scalability needs, and data sensitivity.

**Quality Profile** — answers "What engineering quality practices does this product require?" Seven dimensions capture quality expectations: testing depth (QP-1), code quality standards (QP-2), documentation level (QP-3), CI/CD maturity (QP-4), observability maturity (QP-5), accessibility standard (QP-6), and security testing (QP-7). The Quality Profile is the reference point for calculating technical debt — any gap between the QP target and the actual implementation state is measurable debt.

The Product Profile is established first because it **informs** the NFR Profile. The NFR Profile then **informs** the Quality Profile. For example, a BFSI product (PP-7 = 5) naturally suggests high Security (NFR-2) and Compliance (NFR-5), which in turn suggests DAST + pen testing (QP-7 >= 4) and comprehensive documentation (QP-3 >= 3). The `product-profile.md` file includes an NFR Guidance section, and the `quality-profile.md` file includes a PP+NFR Guidance section that maps profile conditions to suggested QP defaults.

## Flow

```
BRD / PRD arrives
    │
    ▼
Agent reads BRD, auto-derives Product Profile values (PP-1 through PP-7)
    │
    ▼
Agent presents Product Profile to user: "Here's what I derived. Adjust the knobs."
    │
    ▼
Product Profile informs NFR defaults (via NFR Guidance section in product-profile.md)
    │
    ▼
Agent presents NFR Profile with pre-set defaults: "Here are the technical requirements I suggest. Adjust."
    │
    ▼
PP + NFR inform Quality Profile defaults (via PP+NFR Guidance section in quality-profile.md)
    │
    ▼
Agent presents Quality Profile with pre-set defaults: "Here are the quality standards I suggest. Adjust."
    │
    ▼
All three profiles used as context when agent reasons about features from domain taxonomy
    │
    ▼
Agent loads relevant module taxonomy files, reads each feature's semantic context,
reasons about applicability and depth using all three profiles as input
```

## Profiles Are Knobs, Not Questions

The agent does NOT present a cold questionnaire asking "What is your risk level?" The agent:
1. Reads the BRD/PRD
2. **Derives** initial values from what it reads (e.g., "This BRD describes a healthcare platform → PP-7 = 5, PP-1 = 3, PP-3 = 3")
3. Presents the derived profile to the user
4. User adjusts any values that are wrong
5. The profile is confirmed

This applies to all three profiles (Product, NFR, Quality). The agent does the work; the user validates. The sequential cascade (PP → NFR → QP) means each subsequent profile starts with informed defaults, not blank slates.

## Extending Profiles

To add a new dimension to either profile:
1. Add a new section to the relevant `.md` file following the existing format
2. Define 5 levels with label, description, and examples
3. If adding to Product Profile, consider whether it should suggest NFR defaults (add to NFR Guidance)
4. No other files need to change — dimensions are additive

## Relationship to Domain Taxonomy

Profiles are inputs to agent reasoning; domain taxonomy features are the targets of that reasoning. The agent combines:
- **Profile values** (structured, numeric 1-5) — the project's character across all three axes
- **Feature context** (semantic prose) — when each feature matters, at what depth, and what signals indicate need

The agent reasons: "Given this project's three-axis profile, does this feature's 'When It Matters' description match? If so, what depth from the 'Depth Spectrum' is appropriate?"

## Relationship to Technical Debt

The Quality Profile establishes the **target quality baseline** for the project. Technical debt is the measurable gap between this baseline and the actual implementation state. For example, if QP-1 (Testing Depth) is set to Level 3 (layered testing with 60-80% coverage) but the codebase has only unit tests at 40% coverage, that gap is quantifiable debt. This makes the Quality Profile the reference point for debt calculation, prioritization, and remediation planning.
