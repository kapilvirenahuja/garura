# Where we are on the product

Here's the current state based on `.garura/product/scope/features.yaml` — 5 domains, 23 capabilities, 85 features.

## Built vs planned

**What's built (released — 22 features):**
- All of Component Architecture: the 21 plays, 19 agents, 47 skills, the STM layer, three-layer hierarchy, human-in-the-loop approval, and the evidence substrate
- Core L3 intent compilation: `/create-play`, scope auto-narrowing, epic auto-generation
- Persistent memory substrate (L2)
- Eval generation, test generation, RCA, fix-it loop (Work Intelligence)
- Claude Code integration, CLI/slash commands (play invocation, status, sync, distill), epic decomposition, product-to-spec and spec-to-design SDLC phases

**What's in rollout / partial (14 features):**
- Project LTM and Global KB (substrate live, curation maturing)
- Maturity Ladder Engine, Spec-to-Test Continuity (L2 gaps)
- Intent Inference (cross-play matching still TBD — this is the L4 boundary)
- Quality signals: Test Coverage, Lint, Security Scans (local only, no aggregation)
- Debt signals: Tech Debt, Spec Debt
- Delivery signals substrate
- Audit attribution via evidence, decision provenance, evidence export
- LTM curation via distill
- Factory.ai and Codex harnesses (governance pending)
- Engineering portal via briefs
- Wizard / installer
- design-to-code, code-to-test, test-to-run SDLC phases

**What's planned (49 features):**
- Control Tower: DORA metrics, cycle time, lead time, change-fail rate, ladder posture, AI adoption maturity, play success rate, OpenTelemetry
- AI consumption tracking, budget enforcement, cost attribution, autonomy tracking
- Compliance reports, access control, memory promotion/demotion, governance hierarchy (4 tiers)
- Triage: profile-based auto-triage, vision-anchored priority, agent-time allocation
- Release planning, agentic iteration planning, people+agent capacity
- Engineering portal: role-aware dashboards, project browser, decision-trail briefs
- Bootcamp, demos, Figma integration, design tokens
- L4 and L5 — no feature lists yet (deliberately empty)

Largest gaps remain Control Tower dashboards, AI consumption governance, and IDE matrix beyond Claude Code.
