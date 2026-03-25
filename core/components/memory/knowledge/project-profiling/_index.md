# Project Profiling

Two-axis project profiling model that provides structured context for agent reasoning about feature applicability, depth, and phasing.

Agents and skills query this directory when they need to know: **"What kind of project is this, and what are its technical requirements?"**

## Contents

| File | Description | Search Patterns |
|------|-------------|-----------------|
| `product-profile.md` | 7 dimensions characterizing what the product is (users, UX, personas, geography, integrations, delivery, industry) | product profile, personas, UX maturity, delivery ambition, industry vertical, geographic scope, integration density |
| `nfr-profile.md` | 7+ dimensions characterizing how robust the product needs to be (risk, security, performance, availability, compliance, scalability, data sensitivity) | NFR, non-functional, risk profile, security requirements, performance, availability, compliance, scalability, data sensitivity |

## Two-Axis Model

Projects are characterized along two complementary axes:

**Product Profile** — answers "What are we building, for whom, and how ambitious is it?" Seven dimensions capture the product's character: who uses it (PP-1, PP-3), what the experience looks like (PP-2), where it operates (PP-4), what it connects to (PP-5), how far we're going (PP-6), and what industry it serves (PP-7).

**NFR Profile** — answers "How robust, secure, and scalable does it need to be?" Seven dimensions (extensible) capture the technical requirements: risk tolerance, security depth, performance targets, availability, compliance obligations, scalability needs, and data sensitivity.

The Product Profile is established first because it **informs** the NFR Profile. For example, a BFSI product (PP-7 = 5) naturally suggests high Security (NFR-2) and Compliance (NFR-5). The `product-profile.md` file includes an NFR Guidance section that maps product characteristics to suggested NFR defaults.

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
Product Profile informs NFR defaults (via NFR Guidance section)
    │
    ▼
Agent presents NFR Profile with pre-set defaults: "Here are the technical requirements I suggest. Adjust."
    │
    ▼
Both profiles used as context when agent reasons about features from domain taxonomy
    │
    ▼
Agent loads relevant module taxonomy files, reads each feature's semantic context,
reasons about applicability and depth using both profiles as input
```

## Profiles Are Knobs, Not Questions

The agent does NOT present a cold questionnaire asking "What is your risk level?" The agent:
1. Reads the BRD/PRD
2. **Derives** initial values from what it reads (e.g., "This BRD describes a healthcare platform → PP-7 = 5, PP-1 = 3, PP-3 = 3")
3. Presents the derived profile to the user
4. User adjusts any values that are wrong
5. The profile is confirmed

This applies to both Product Profile and NFR Profile. The agent does the work; the user validates.

## Extending Profiles

To add a new dimension to either profile:
1. Add a new section to the relevant `.md` file following the existing format
2. Define 5 levels with label, description, and examples
3. If adding to Product Profile, consider whether it should suggest NFR defaults (add to NFR Guidance)
4. No other files need to change — dimensions are additive

## Relationship to Domain Taxonomy

Profiles are inputs to agent reasoning; domain taxonomy features are the targets of that reasoning. The agent combines:
- **Profile values** (structured, numeric 1-5) — the project's character
- **Feature context** (semantic prose) — when each feature matters, at what depth, and what signals indicate need

The agent reasons: "Given this project profile, does this feature's 'When It Matters' description match? If so, what depth from the 'Depth Spectrum' is appropriate?"
