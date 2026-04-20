# Product Status

Based on `.garura/product/scope/features.yaml`, here is the current product state.

## Summary
- **Domains:** 5
- **Capabilities:** 23
- **Total features:** 85
- **Released:** 22
- **Rollout:** 14
- **Planned:** 49

## Domain breakdown

### 1. Agentic Methodology (`applied-and-evolving`)
The core differentiator and substrate. Component Architecture is fully operational.

**Capabilities:**
- **component-architecture** (released) — 9 features, all released or in rollout. Plays (AM-F001, released), Agents (AM-F002, released), Skills (AM-F003, released), STM (AM-F004, released), Project LTM (AM-F005, rollout), Global KB (AM-F006, rollout), Three-Layer Hierarchy (AM-F007, released), Human-in-the-Loop (AM-F008, released), Evidence Substrate (AM-F009, released).
- **l2-spec-driven** (applied) — AM-F010 Maturity Ladder (rollout), AM-F011 Persistent Memory (released), AM-F012 Spec-to-Test (rollout).
- **l3-intent-driven** (rollout) — AM-F013 Intent Compilation (released), AM-F014 Intent Inference (rollout), AM-F015 Scope Auto-Narrowing (released), AM-F016 Epic Auto-Generation (released).
- **l4-signal-driven** (planned) — no features yet.
- **l5-goal-driven** (planned) — no features yet.

### 2. Engineering Observability (`partial`)
quality-check, check-drift, briefs ship locally. Cross-project aggregation is the gap.

**Capabilities:**
- **quality-signals** (rollout) — EO-F001 Test Coverage, EO-F002 Lint, EO-F004 Security Scans (all rollout).
- **debt-signals** (rollout) — EO-F005 Tech Debt (rollout), EO-F006 Domain Debt (planned), EO-F007 Spec Debt (rollout).
- **methodology-posture** (planned) — EO-F008, EO-F009, EO-F010, EO-F015 all planned.
- **delivery-signals** (rollout) — EO-F011 DORA, EO-F012 Cycle Time, EO-F013 Lead Time, EO-F014 Change-Fail Rate (all planned).

### 3. AI Governance (`partial`)
Evidence with agent attribution live. Full audit trail and consumption tracking planned.

**Capabilities:**
- **consumption-tracking** (planned)
- **audit-attribution** (rollout)
- **memory-governance** (planned)
- **governance-hierarchy** (planned)

### 4. Work Intelligence (`partial`)
manage-issue and scout-project live. Planning, routing, triage mostly planned.

**Capabilities:**
- **agentic-triage** (planned)
- **agentic-planning** (rollout)
- **backlog-lifecycle** (deferred-for-reconsideration)
- **intent-driven-verification** (rollout)

### 5. Engineering Experience (`partial`)
Claude Code LIVE. Other IDEs, portal, design-to-code partial.

**Capabilities:**
- **agent-integrations** (rollout)
- **engineering-portal** (rollout)
- **first-run-onboarding** (rollout)
- **cli-slash-commands** (released)
- **design-to-code** (rollout)
- **sdlc-phase-coverage** (rollout)

## Key findings
- Component Architecture is live end-to-end
- L2 Spec-Driven applied; L3 partial; L4/L5 directional
- Control Tower dashboards and AI consumption tracking are the largest gaps
