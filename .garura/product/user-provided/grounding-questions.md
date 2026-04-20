# Garura — Grounding Questions

product_slug: garura-platform
note: >
  Questions are cumulative across pipeline runs. Answer inline (set user_decision and
  user_answer, then set resolved_at) or at the next checkpoint. New runs append,
  never overwrite. Periodic cleanup may archive resolved questions to
  grounding-questions.archive.md — this skill never deletes.

---

## Questions

- id: Q-scope-001
  asked_at: 2026-04-18T00:00:00Z
  topic: scope_creep
  question: >
    EO-F003 (Build Health) has Inclusion "optional at L2". Garura's profile is at
    L2-spec-driven. Should Build Health (CI/CD pipeline pass-rate tracking) be included in
    v1 quality-signals scope alongside EO-F001, EO-F002, and EO-F004, or deferred to v1.1
    alongside the rest of Engineering Observability?
  pipeline_source: "configure-capabilities Step 1b / Step 4 (conditional-features pass)"
  pipeline_guess: >
    Defer to v1.1 with the rest of engineering-observability.
    MVP rec is explicit that "the entire Engineering Observability domain is deferred
    to v1.1" — EO-F003's optional-at-L2 status does not override that strategic decision.
  impact_if_unknown: >
    EO-F003 lands in pending_user_selection in scope.yaml. If not confirmed before
    Stage 4, enrich-capabilities will not generate an epic for it. No downstream blocker.
  user_decision: null
  user_answer: null
  resolved_at: null
  resolved_by_run: null

- id: Q-scope-002
  asked_at: 2026-04-18T00:00:00Z
  topic: scope_creep
  question: >
    WI-F007 (Epic Decomposition) has Inclusion "mandatory" — no profile condition
    attached. It falls under the backlog-lifecycle capability which is post-v1 per MVP rec.
    Should WI-F007's mandatory default pull it forward into v1 scope despite the
    capability-level deferral, or does the capability-level deferral take precedence
    as the governing decision?
  pipeline_source: "configure-capabilities Step 2 (mandatory-features pass)"
  pipeline_guess: >
    Capability-level deferral takes precedence. MVP recommendation's "post-v1 /
    continuous / TBD — deferred for reconsideration" overrides a feature-level
    mandatory default within a deferred capability.
  impact_if_unknown: >
    WI-F007 recorded as deferred in scope.yaml. If user wants it in v1, it moves to
    selected_capabilities before Stage 4. Pipeline is not blocked either way.
  user_decision: null
  user_answer: null
  resolved_at: null
  resolved_by_run: null

- id: Q-scope-003
  asked_at: 2026-04-18T00:00:00Z
  topic: scope_creep
  question: >
    AG-F008 (LTM Curation) has Inclusion "mandatory for L3+". Garura's roadmap horizon
    is L3-intent-driven. Memory-governance capability is deferred to v1.1 per MVP rec.
    Does AG-F008's mandatory-for-L3+ condition pull it into v1, or does the
    capability-level deferral govern?
  pipeline_source: "configure-capabilities Step 2 (mandatory-features pass) vs MVP narrowing filter"
  pipeline_guess: >
    Capability-level deferral governs. The MVP rec explicitly lists memory-governance
    as v1.1 May 2026. AG-F008 stays deferred. The LTM promotion workflow currently
    in place (distill + capture-learning) covers the v1 gap adequately.
  impact_if_unknown: >
    AG-F008 recorded in deferred_capabilities under memory-governance. No v1 blocker.
  user_decision: null
  user_answer: null
  resolved_at: null
  resolved_by_run: null

- id: Q-scope-004
  asked_at: 2026-04-18T00:00:00Z
  topic: scope_creep
  question: >
    WI-F010 (Eval Generation), WI-F011 (Test Generation), WI-F012 (RCA) have Inclusion
    "mandatory for L3+" and WI-F013 (Fix-It Loop) has Inclusion "mandatory". All four
    fall under the intent-driven-verification capability, which was listed in the MVP rec
    primary 8 (PC-7) but was NOT included in the user's explicit Stage-3 capability list.
    Does the capability-level exclusion from Stage-3 input govern (keep deferred to v1.1),
    or should the mandatory-for-L3+ condition pull these forward into v1 scope?
  pipeline_source: "configure-capabilities Step 2 (mandatory-features pass) vs Stage-3 user explicit list"
  pipeline_guess: >
    Capability-level exclusion from Stage-3 input governs. The user's Stage-3 explicit
    list supersedes the MVP rec's PC-7 inclusion. Intent-driven-verification stays
    deferred to v1.1 per user instruction.
  impact_if_unknown: >
    WI-F010..F013 recorded in deferred_capabilities under intent-driven-verification.
    If user wants them in v1, the capability moves to selected_capabilities before Stage 4.
    Pipeline is not blocked.
  user_decision: null
  user_answer: null
  resolved_at: null
  resolved_by_run: null
