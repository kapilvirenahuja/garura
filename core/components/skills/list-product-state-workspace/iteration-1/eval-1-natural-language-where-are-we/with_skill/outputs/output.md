agentic-methodology
  component-architecture
    AM-F001 21 plays ship today. [released]
    AM-F002 19 domain + utility agents ship today. [released]
    AM-F003 47 skills implementing domain capabilities. [released]
    AM-F004 Issue-centric STM under .garura/project/issues/{n}/. [released]
    AM-F005 Project-scoped long-term memory under .garura/product/. [rollout]
    AM-F006 Cross-project knowledge base at core/components/memory/knowledge/. [rollout]
    AM-F007 Plays → Agents → Skills hierarchy enforced by /create-play compilation and agent-first delegation rules. [released]
    AM-F008 Core principle is human-in-the-loop — every play embeds explicit approval gates at commits, PRs, destructive actions, and multi-phase plan approvals. [released]
    AM-F009 Every play writes evidence artifacts (write-evidence skill) and stage checkpoints to STM; self-commit of evidence per ADR 012. [released]
  l2-spec-driven
    AM-F010 Ladder L1-L5 defined in docs/philosophy/idsd.md; referenced in project_profile.delivery_ambition. [rollout]
    AM-F011 Structured artifact tree (STM + Project LTM + KB) with schema validation, provenance headers, and git-based multi-contributor continuity. [released]
    AM-F012 Artifact chain intent → scope → epic → plan → implementation → scenarios → tests is enforced by validators (validate-intent-epics, validate-architecture-spec, validate-screen-coverage, check-drift). [rollout]
  l3-intent-driven
    AM-F013 intent.yaml schema + /create-play compiles intent specifications into executable plays. [released]
    AM-F014 intent-crafter agent interviews users to produce intent.yaml; intent-resolver agent produces task DAGs from intents. [rollout]
    AM-F015 configure-capabilities skill walks KB cross-tree constraints and auto-selects capabilities based on project_profile; rejected set is recorded with rationale. [released]
    AM-F016 generate-intent-epics instantiates one intent epic per enriched capability with every mandatory field populated and KB-sourced. [released]
  l4-signal-driven
    (no features yet)
  l5-goal-driven
    (no features yet)
engineering-observability
  quality-signals
    EO-F001 Per-project coverage measurement via quality-check. [rollout]
    EO-F002 Per-Stage-1/2 user input reconciliation (2026-04-18): status restored to partial. [rollout]
    EO-F004 Per-Stage-1/2 user input reconciliation (2026-04-18): status restored to partial. [rollout]
  debt-signals
    EO-F005 check-drift emits tech-debt catalog per project. [rollout]
    EO-F006 No first-class domain-debt detection (capability-level drift, taxonomy debt) shipped beyond the general check-drift surface. [planned]
    EO-F007 Spec drift (locked spec vs implementation) detected by check-drift. [rollout]
  methodology-posture
    EO-F008 Declared level lives in project_profile; measured level (actual artifact completeness vs declared) is not computed. [planned]
    EO-F009 No measurement of how deeply AI agent workflow is adopted (agent-invocation rate, play-usage breadth) per project. [planned]
    EO-F010 Plays emit status.json files per invocation but success/failure is not aggregated into a success-rate metric. [planned]
    EO-F015 OTEL is the telemetry spine for methodology posture (and shared with AI Governance consumption/autonomy tracking — see AG-F011). [planned]
  delivery-signals
    EO-F011 DORA four are not computed or surfaced; raw ship/merge events exist in status files but aggregation layer is missing. [planned]
    EO-F012 Cycle time (first commit → merge) not computed from PR/issue events. [planned]
    EO-F013 Lead time (issue open → ship) not computed. [planned]
    EO-F014 Change-fail rate (rollback / hotfix ratio) not computed. [planned]
ai-governance
  consumption-tracking
    AG-F001 Per-agent, per-skill token consumption tracking is not shipped. [planned]
    AG-F002 Soft and hard budget limits per project / team not shipped. [planned]
    AG-F003 Cost rollup by feature, user, team, cost-center not shipped. [planned]
    AG-F011 KEY DIFFERENTIATOR METRIC. [planned]
  audit-attribution
    AG-F004 Evidence files record agent vs user authorship at step granularity. [rollout]
    AG-F005 Decision Surfacing Discipline (tier-batched manifests) records choices in-play. [rollout]
    AG-F006 briefs skill renders product YAML to JSON + HTML hub. [rollout]
    AG-F007 SOC2 / ISO27001 / GDPR report templates not shipped. [planned]
  memory-governance
    AG-F008 distill and capture-learning plays extract learnings but explicit curation (approve/reject/promote) surface is not shipped; promotion from Project LTM to Global KB is manual. [rollout]
    AG-F009 File-system permissions only; no role-scoped or purpose-scoped access. [planned]
    AG-F010 STM→LTM and LTM→KB promotion is manual; no demotion (archive/retire) workflow beyond archive-issue-stm. [planned]
  governance-hierarchy
    AG-F012 Four-tier hierarchy schema: Project → Account → Portfolio → Org. [planned]
    AG-F013 Project is the base tier — a single codebase / single product instance. [planned]
    AG-F014 Account groups related projects under a shared theme or engineering initiative. [planned]
    AG-F015 Portfolio groups accounts — for a company adopter this becomes products or product lines. [planned]
    AG-F016 Org is the top tier — company-wide rollup. [planned]
work-intelligence
  agentic-triage
    WI-F001 Profiles of people AND agents — skills, historical fit, current load — used to automatically route defects, enhancements, and epics to the best-suited worker. [planned]
    WI-F002 Priority is computed from traceability to product vision + roadmap. [planned]
    WI-F003 Where agents spend time follows product progress. [planned]
  agentic-planning
    WI-F004 The planning unit is a RELEASE — what ships. [planned]
    WI-F005 Whether "sprints" and "burndowns" survive is open — the user's position is that they likely do not in an agentic world. [planned]
    WI-F006 Capacity is computed across PEOPLE + AGENTS combined. [planned]
  backlog-lifecycle
    WI-F007 generate-intent-epics instantiates one epic per enriched capability with full intent schema; every epic is traceable to a KB feature. [released]
  intent-driven-verification
    WI-F010 evals-creator generates step evals and scenario evals from intent.yaml and scenarios files. [released]
    WI-F011 Delivered via prepare-epic + implement-epic + validate-epic plays; test case generation from intent.yaml (not from code) is executed as part of the play pipeline rather than as a standalone skill. [released]
    WI-F012 Delivered via fix-it + enhance plays; RCA is a first-class phase in both plays, not a standalone skill. [released]
    WI-F013 fix-it play closes the loop from defect → RCA → fix → validate. [released]
engineering-experience
  agent-integrations
    EE-F001 Every play and agent runs inside Claude Code today; sync-claude skill deploys components to ~/.claude/. [released]
    EE-F004 Factory Droid harness is integrated — sync-droids skill deploys Garura components into the Factory harness. [rollout]
    EE-F005 Codex harness integrated. [rollout]
  engineering-portal
    EE-F006 No role selector, no role-scoped dashboards. [planned]
    EE-F007 Multi-project navigation surface not shipped. [planned]
    EE-F009 briefs skill produces hub.html aggregating product YAML. [rollout]
  first-run-onboarding
    EE-F010 Three-question greenfield wizard not shipped; brownfield scanner planned later. [planned]
    EE-F011 Unified installer — npm distribution + Claude Code end-user bootstrap are the SAME feature. [rollout]
    EE-F013 Guided bootcamp tutorial walking a new user through methodology ladder not shipped. [planned]
    EE-F014 Three demo projects (solo SaaS, small-squad, enterprise pilot) not shipped. [planned]
  cli-slash-commands
    EE-F015 21 plays exposed as slash commands (/specify-product, /start-feature, /ship, /create-play, /fix-it, /enhance, /create-pr, /review-pr, /merge-pr, /distill, /capture-learning, /capture, etc.). [released]
    EE-F016 Per-play status.json files at .garura/product/_status/ and per-issue status within STM. [released]
    EE-F017 sync-claude and sync-droids skills deploy components to target harnesses (Claude Code, Factory Droids). [released]
    EE-F018 distill play extracts post-merge learnings into Project LTM proposals. [released]
  design-to-code
    EE-F019 Figma plugin and bidirectional sync not shipped. [planned]
    EE-F020 Design-token extraction and governance not shipped. [planned]
  sdlc-phase-coverage
    EE-F022 Phase: product idea + market + profile → product specification (features, scope, intent epics). [released]
    EE-F023 Phase: product spec → experience design (personas, screen inventory, user flows, wireframes, design spec). [released]
    EE-F024 Phase: design spec + architecture → implementation. [rollout]
    EE-F025 Phase: implementation → verification (evals, scenarios, judge). [rollout]
    EE-F026 Phase: verified build → shipped / running. [rollout]
