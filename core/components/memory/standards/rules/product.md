# Product Rules

Canonical rules governing how product-planning artifacts (project profile, scope, enriched capabilities, quality profile) are derived. Every skill in the `/specify` pipeline loads this file and enforces these rules.

Consumers: `configure-capabilities`, `enrich-capabilities`, `derive-quality-profile-from-epics`, `product-keeper` agent.

## Rule 1: KB-Grounded Capability Selection

**Every capability in a scope document must trace to a real feature ID in a domain-taxonomy markdown file.**

Capability selection is constrained to what the KB actually contains. The catalog may be in LTM (`core/components/memory/knowledge/domain/`) or in STM research (`{product_base}/research/`). Invented capabilities — entries in `selected_capabilities` that resolve to no feature file — are a structural failure.

**Enforcement:** `configure-capabilities` halts with `dangling_feature_refs > 0`. `validate-intent-epics` confirms every epic's `kb_source.capability` resolves to a feature block in the referenced domain file.

## Rule 2: Every Cross-Tree Constraint Walked

**During capability configuration, every cross-tree constraint in `_cross-tree-constraints.yaml` must be evaluated explicitly.**

No constraint is silently skipped. The `constraint_trace` section of scope.yaml records one entry per constraint, with `fired: true | false`, the resolved condition, and the action taken. Missing entries are a compliance violation.

**Enforcement:** `configure-capabilities` returns `constraints_walked == total_constraints_in_file`. The specify play's step eval SE-6 enforces this at runtime.

## Rule 3: No Silent Inclusions or Exclusions

**Every capability inclusion has a rationale. Every exclusion has a reason.**

`selected_capabilities[].rationale` must name the mechanism that caused inclusion: "mandatory by default", "mandatory-when condition matched", "cross-tree CTC-NNN", or "user-selected at checkpoint". `rejected_capabilities[].reason` must name the exclusion mechanism: "excluded by CTC-NNN", "not applicable to profile", etc.

Silent inclusions erode trust; silent exclusions hide features the user might have wanted. Neither is acceptable.

## Rule 4: Security and Compliance Ratchet Up Only

**Profile-driven enrichment of business rules may ratchet security and compliance UP, never DOWN.**

When the enrichment step merges profile overrides onto KB business rules, any field tagged `security:` or `compliance:` in the KB cannot be weakened by the profile. A medium-security profile encountering a stricter KB rule must preserve the stricter rule. A high-security profile may ratchet it up further.

**Enforcement:** `enrich-capabilities` constraint: "NEVER ratchet security rules DOWN".

## Rule 5: Provisional Sourcing Is Explicit

**Capabilities sourced from STM research (pending LTM promotion) carry explicit provenance.**

When a capability's source markdown lives under `stm_research_dir` rather than `ltm_domain_taxonomy_path`, the scope.yaml entry carries `source: provisional_stm_research` and downstream intent epics carry `kb_source.provisional: true`. This makes the pipeline's reliance on un-promoted research visible, and gates the promotion decision at review time.

**Enforcement:** `configure-capabilities` tags every STM-sourced selection with the provisional flag. `validate-intent-epics` allows the flag and does NOT treat provisional epics as dangling references.

## Rule 6: Quality Profile Aggregates All Epic Constraints

**The quality profile aggregates constraints across every selected capability into ISO 25010 buckets.**

No capability contributes to the quality profile via free-text summary. Each `constraint` block from an enriched capability lands in exactly one ISO 25010 characteristic bucket (functional suitability, performance efficiency, compatibility, interaction capability, reliability, security, maintainability, flexibility, safety). Profile-driven ratchets apply at the bucket level.

The risk register aggregates `experiential_warnings` from every selected capability's KB source. Neither the quality profile nor the risk register is optional.

**Enforcement:** `derive-quality-profile-from-epics` produces a quality-profile.yaml with ≥1 populated ISO 25010 characteristic AND a risk_register section (may be empty list for low-risk projects).

## Rule 7: Three-Layer Hierarchy, No More

**The planning hierarchy is Domain → Capability → Intent Epic. No Theme, Feature, or Story layer.**

Stories are generated during the build phase by downstream plays. Intent epics are the most granular artifact the specify pipeline produces. Adding a Feature or Story layer at product planning time creates premature decomposition — the architecture phase will refactor it anyway.

## Rule 8: Stage-Centric Folder Layout

**Product artifacts are organized by SDLC stage, not by play.**

The `.garura/product/` tree uses six stage folders: `user-provided/`, `specification/`, `scope/`, `architecture/`, `experience/`, `research/`. A single stage folder may hold output from multiple plays — e.g., `specification/` holds market-brief (from specify's market-analyst), project-profile (user-provided), and quality-profile (from specify's product-keeper). The folder name describes *what the artifact is*, not *which play produced it*.

Play-lifecycle folders (`_checkpoints/`, `_evidence/`, `_status/`) live at the product root alongside the stage folders — they are orthogonal to the SDLC stages, because a single play can write artifacts into multiple stage folders during one run.

**Enforcement:** ADR 017 whitelist. `write-evidence` skill validates every write path against the six stage folders + three lifecycle folders. Writes outside this whitelist are rejected.

## Rule 9: Audit Artifacts Are Structurally Separate from Scope Artifacts

**Within any scope-shaping file, audit content lives in a dedicated sub-section and never in the scope body.**

Scope artifacts answer: *what does the product deliver?* (selected capabilities, rejected capabilities, enriched rules, epics, quality gates). A PM, designer, or engineer reads these to understand the product.

Audit artifacts answer: *did the pipeline follow its own rules?* (every cross-tree constraint walked, every validator check run, every skip-event logged). A compliance officer or framework maintainer reads these to verify integrity.

When the two must share a file, audit content goes into a clearly-named sub-section (`audit:` / `audit_trail:` / `not_applicable:` / `walked_but_not_applied:` / etc.) and is NEVER interleaved with scope content in the same flat list. A scope reader can skip the audit section and still understand the product; an auditor can skim the audit section without parsing product decisions.

**Concrete applications:**
- `scope.yaml` `constraint_trace` has `applied:` (scope-shaping) and `not_applicable:` (audit) sub-sections. See D3.
- `validation-intent-epics.yaml` puts the `by_category` violation counters inside an `audit:` sub-section rather than at the file root.
- Any future per-stage artifact that carries walked-but-not-applied rule evaluations follows the same pattern.

**Anti-pattern:** a flat list where every row has a `fired: true | false` field forces the reader to scan for truthy rows to understand the scope. This conflates the two audiences and was the original shape of `scope.constraint_trace` before D3. Rule 9 exists to prevent that pattern from re-emerging elsewhere.

**Enforcement:** every skill that writes a scope-shaping artifact with audit data splits the output into scope-body and audit sub-sections at write time. Validators that read the artifact treat the two sub-sections independently — scope eval checks target `applied:` / `selected_capabilities:` / etc.; audit eval checks target `not_applicable:` / `audit:` / `by_category:` / etc.

## Rule 10: Within-Domain Coverage Analysis

**For every selected domain, the pipeline must check whether the domain's feature catalog covers the product's implied scope — not just whether the domain file exists.**

The existing gap check is binary: domain file present → use what's there; domain file missing → halt or trigger research. This misses a second-order question: *does the existing catalog have enough depth for this product's specific needs?*

Example: Graveyard Crew (a prosumer autonomous experimentation platform) selects `user-management` and the pipeline picks 4 features from the LTM file. But the brief implies a dedicated secrets vault (for API keys), per-user quotas (for cost caps), service-account identities (for agent calls), and third-party credential linking (distinct from social-login OAuth). None of these exist in the current LTM file. The pipeline shipped a 4-feature scope when the product probably needs 7-8.

**The check:** for each selected domain, compare the domain's feature list against the product brief's implied needs. Emit a `within_domain_coverage_gaps` section in `scope.yaml` listing, per gap: the implied-need description, the closest existing feature, a coverage verdict (`full` / `partial` / `missing`), and a recommended action (`extend-existing-feature` / `add-new-feature` / `research-domain-extension`).

**Surface the gaps at the capability-configuration checkpoint.** The user can: (a) accept as-is and proceed with the narrower scope, (b) trigger a research pass to extend the existing domain file, or (c) add the missing features inline as new capabilities (marking the domain file for follow-up promotion).

**Enforcement:** `configure-capabilities` runs the within-domain coverage pass as a new Process step after loading domain features and before walking cross-tree constraints. Requires the `project_brief_path` input. Emits `within_domain_coverage_gaps` per domain in `scope.yaml`. The capability-configuration checkpoint presents the gaps to the user.

**Status:** Documented as a rule in this pass; skill-level enforcement is a follow-up (requires project_brief_path to be wired through configure-capabilities' Input and specify's Step 5 JSON contract). See Defect 2.

## Rule 11: Aggressive Questioning on Inference (anti-hallucination)

**Any capability, constraint, or field value that is not directly traceable to the project brief or project profile is an INFERENCE. Inferences must be surfaced at the next checkpoint for user confirmation — they cannot be written as silent facts in scope.yaml or intent epics.**

This rule exists because the pipeline, when unchecked, will fabricate concrete values (rate limits, scale targets, cost budgets, feature counts, API scopes, token lifetimes) that look authoritative but have no grounding. The pipeline's job is to ask, not to guess.

**The test:** for every concrete value the pipeline is about to write into scope.yaml or an intent epic, ask:
1. Did the brief explicitly name this value?
2. Does the project profile imply this value via a named field?
3. Did a cross-tree constraint (CTC) force this value?
4. Did a within-domain research pass (Rule 10) author this value with explicit user approval?

If the answer to all four is NO, the value is an inference. The pipeline MUST NOT write it as a silent fact. Instead:

**Routing table:**

| Situation | Action |
|-----------|--------|
| Pipeline has a numeric value and a reasonable derivation (e.g., `nfr_scale=2 → ~100 concurrent sessions`) | Tag as `brief_inferred` or `profile_default` with `source_reference`. Surface at the capability-configuration checkpoint for user confirmation. |
| Pipeline has no derivation and is about to pull a KB default (e.g., "login p95 < 500ms") | Tag as `kb_default` with `source_reference: kb.user-management.UM-F001.success_criteria[0]`. Surface at the checkpoint. Do NOT write to constraints until confirmed. |
| Pipeline has no source at all and the value is a guess (e.g., "max 10 stored API keys per user") | Tag as `assumption`. Do NOT write to the scope body. Move to `assumptions_requiring_validation` with `needs_user_grounding: true`. Surface as a risk in the risk register. |
| Pipeline detects a feature that the brief didn't ask for (e.g., "OAuth linking for third-party services") | Mark as `brief_inferred` with low confidence. Surface at the capability-configuration checkpoint with a clear "did you intend this?" prompt. If the user declines, the feature drops entirely and becomes a `dependencies` entry for a future epic. |

**Never allowed:**
- Writing a rate limit number without a source
- Pulling a concurrent-sessions target from KB boilerplate on a profile where `nfr_scale < 3`
- Inventing feature counts ("max 10 keys", "max 5 vitals", "min 3 plugins within 6 months") without user approval
- Authoring a research-supplemental feature and immediately treating it as in-scope without surfacing at the checkpoint
- Fabricating token lifetimes, session timeouts, rate limits, quota defaults, or cost budgets from "best practice"

**Checkpoint protocol:**

At the capability-configuration checkpoint, the approval prompt MUST list every inferred capability and every `kb_default` / `assumption` constraint with:
```
INFERRED CAPABILITIES (not in brief — confirm or reject):
  [ ] UM-F013 Third-Party Credential Linking
      Source: "users store API keys for external scoring services" (brief_inferred)
      Confidence: medium
      If you reject: moves to dependencies as "future: consider OAuth linking if user-supplied keys prove insufficient"

INFERRED CONSTRAINTS (no source in brief or profile — confirm, replace, or drop):
  [ ] UM-F001 Login: "p95 login < 500ms at 10K concurrent sessions"
      Source: kb.user-management.UM-F001 boilerplate
      Profile mismatch: your profile says nfr_scale=2 (low-to-mid), 10K is aggressive
      If you replace: type a grounded value. If you drop: constraint becomes "(no target — define before build)"

  [ ] UM-F010 Secrets Vault: "max 10 stored API keys per user"
      Source: assumption (no brief or profile grounding)
      If you confirm: becomes a business rule. If you drop: becomes "(no limit in v1)" and is added to assumptions_requiring_validation for v1.1 re-evaluation.
```

**Enforcement:** `configure-capabilities` runs Rule 11 as a final pass before writing `scope.yaml`. Every field with a non-explicit provenance source is collected into a `inferences_pending_review` section surfaced at the capability-configuration checkpoint. `validate-intent-epics` enforces that no `assumption`-tagged values appear in epic constraint / business_rule fields — they must be in `assumptions_requiring_validation`.

## Rule 12: User Questions Are First-Class Artifacts

**Every question the pipeline asks the user is captured in `.garura/product/user-provided/grounding-questions.md` with a unique ID, a slot for the user's answer, and durable retention across pipeline runs.**

The pipeline runs are interactive but ephemeral. Questions that the pipeline surfaces at a checkpoint — "what's the real concurrent-session target?", "is OAuth linking in scope?", "what cost budget defaults apply?" — currently live only in the prompt text and disappear when the user responds. If the user answers "unknown" or if the checkpoint session ends before answering, the question is lost. The next run re-asks it from scratch, and nothing learns.

**The rule:** every time the pipeline produces an inference (Rule 11), it also appends an entry to `.garura/product/user-provided/grounding-questions.md`. The entry carries:

```yaml
- id: Q-<topic>-<sequence>              # unique, stable across runs
  asked_at: <ISO-8601 timestamp>
  topic: scale | rate_limits | feature_count | cost_quota | scope_creep |
         time_windows | agent_budgets | experiment_config | oauth_providers |
         vocabulary | bounded_contexts
  question: "<plain-English question the user should answer>"
  pipeline_source: "<which skill + which field>"
  pipeline_guess: "<what the pipeline inferred, if anything>"
  impact_if_unknown: "<what happens if user doesn't answer — which field in which epic, which risk>"
  user_decision: null | in_scope | out_of_scope | deferred | replaced_with
  user_answer: null | "<free text>"
  resolved_at: null | <ISO-8601>
  resolved_by_run: null | <play run id>
```

**Durable across runs:** the file is cumulative — new runs APPEND new questions, do NOT overwrite old ones. Questions answered in prior runs carry `user_decision` and `user_answer` from that prior run and are NOT re-asked; the pipeline reads their answers as facts. Questions marked `deferred` or left `null` are re-surfaced at the next checkpoint until the user resolves them.

**User-provided is write-twice:** the user directly edits this file to answer questions (the `user_decision` and `user_answer` fields). The pipeline reads those answers on the next run. This is the only artifact where user and pipeline share write access — the pipeline appends questions, the user fills in answers. All other `.garura/product/` files are pipeline-produced.

**Checkpoint integration:** at the capability-configuration checkpoint (and at any future stage-end checkpoint that encounters inferences), the prompt must list every unresolved question from `grounding-questions.md` with the question text and the user's decision options. The user either:
- Tethers with answers (fills in user_answer inline or edits the file) → pipeline proceeds with the answers as facts
- Orbits with "defer X and Y" → those questions stay null / deferred, the answered ones are used, pipeline proceeds
- Vanishes → pipeline halts, questions stay pending for the next run

**What goes in this file:**
- Numeric values the pipeline guessed (rate limits, quotas, scale targets, token lifetimes)
- Feature-level decisions (is X in scope? is Y a v1.1 concern?)
- Vocabulary confirmations (is "Crypt" the canonical term? "Grounds"?)
- Bounded-context decisions (where does identity end and experiment begin?)
- Integration choices (Google + GitHub for social login? other providers?)

**What does NOT go here:**
- User identity, credentials, or PII (there is none — questions are about product decisions)
- Pipeline-internal state (status, evidence, commit hashes — those live in `_status/`, `_evidence/`)
- Artifacts the pipeline owns fully (market-brief, scope, epics — those live in their stage folders)

**Why this rule exists:** the user directly requested it after the 50-question grounding surface I showed them became too large to manage inline. The insight: questions are knowledge, and knowledge needs a home. Dropping them into prompt text loses them; writing them to the user-provided folder turns them into a first-class artifact the user can edit, search, and track.

**Enforcement:** `configure-capabilities`, `enrich-capabilities`, `generate-intent-epics`, and any future skill that produces an inference must write its inference-question to this file before surfacing it at a checkpoint. The skill cannot surface an un-captured inference. `validate-intent-epics` cross-checks: every inference referenced in an epic's `assumptions_requiring_validation` must have a corresponding question in grounding-questions.md with a matching ID. Missing question = violation `uncaptured_inference`.

## Rule 13: MVP Focus (Primary Use Cases, Deferred Use Cases)

**Every v1 product run picks a bounded set of primary use cases and records the deferred ones with v1.1+ triggers. The bridge artifact is `scope/mvp-recommendation.md`, authored between domain-selection and configure-capabilities.**

Without an MVP recommendation, the capability walk in `configure-capabilities` walks all features for all selected domains indiscriminately and produces a bloated v1 scope that tries to serve every use case the brief names. The result is an epic inventory that exceeds the appetite and a scope contract the team cannot ship.

The MVP recommendation artifact lives at `.garura/product/scope/mvp-recommendation.md` (per Rule 8 stage-centric layout — mvp-recommendation is a scope-narrowing decision, not an opportunity description). It carries: primary use cases with rationale; launch-scope capabilities narrowed to those use cases; deferred use cases with v1.1+ triggers; an architecture direction (only when committed at spec time, e.g., "self-hosted sandbox for web-perf loops"); directional pricing; success criteria for "v1 is successful"; risks that could kill the MVP. Deferred use cases and capabilities are explicit, not implicit — `configure-capabilities` reads the recommendation and pushes non-primary capabilities into `deferred_capabilities` in scope.yaml with rationale.

**Enforcement:** `configure-capabilities` halts pre-flight if `scope/mvp-recommendation.md` is missing or empty. The specify play runs Stage 2.75 (mvp-recommendation authoring / review) between Stage 2 (domain-selection) and Stage 3 (configure-capabilities). See Defect 6 and Defect 9.

## Rule 14: Abstraction-Layer Boundary

**Artifacts produced by `specify` stay implementation-agnostic. Naming a specific database engine, SDK method, framework, programming language, table schema, wire protocol, cryptographic construction, or model version in any file under `product/research/`, `product/specification/`, or `product/scope/` is a structural failure.**

Research files describe a domain — what the problem space looks like, which industry patterns apply, when they matter. Specification files describe the opportunity shape. Scope files describe what v1 builds. None of these layers should commit to how the work is built. Implementation choices (runtime, framework, storage engine, library, schema design, API wire format) need cross-domain tradeoff analysis and user approval at Stage 6 architecture — leaking them into earlier artifacts prejudges architecture and breaks the contract between stages.

Allowed vocabulary is domain-level: "append-only ledger", "pluggable measurement adapter", "structured-output enforcement", "role-isolated execution", "controlled-determinism contract". Forbidden is tool-level: specific database engines, specific SDK/framework methods and parameters, specific programming languages, specific build tools, specific column lists and types, specific endpoint paths, specific hash constructions, specific model identifiers. The rule pairs with Rule 15 — Rule 14 is what stays OUT of product artifacts, Rule 15 is what must come INTO them.

**Enforcement:** `configure-capabilities`, `enrich-capabilities`, and any skill authoring research / specification / scope files reject outputs containing the deny-list tokens (the skill carries the current deny-list in its Constraints section). See Defect 7.

## Rule 15: Pull-to-Product Principle

**Any KB-sourced domain the product uses is copied into `.garura/product/research/` at selection time, with a provenance header recording its origin, KB path, copy timestamp, and KB content hash. Stage 3 and every later stage read from `.garura/product/research/` only — never directly from `core/components/memory/knowledge/`.**

A reference-only pointer from `domain-selection.yaml` to a KB file path is non-reproducible: a KB edit retroactively changes old product runs, and downstream stages must merge two read paths (KB + STM research) for domains that arrive from different sources. The fix is symmetric — every domain the product uses, whether KB-sourced or freshly researched, lands as a real file in `.garura/product/research/`. The folder becomes the product's frozen domain library for this run.

The provenance header distinguishes origins: `origin: kb` + `kb_sha_at_copy` for copies (editable: false by default), or `origin: stm_research` for freshly-authored research (editable: true, pending promotion by a future capture-learning pass). A future promotion flow (NOT this rule's concern) skips kb-origin files whose sha matches current KB and promotes the rest.

**Enforcement:** the Stage 2 domain-selection step performs the copy with provenance. `configure-capabilities` reads from `.garura/product/research/` only; missing domain files at that path are a structured failure (the upstream Stage 2 step should have pulled them). See Defect 8.

## Related Rules

- `features.md` — per-epic content rules (mandatory fields, quantification, hypothesis format, provenance tracking Rule 8, constraint justification Rule 9)
- `epics.md` — epic structure rules (vertical slice with actor + outcome tests, single module, dependencies, foundation investments)
- `scenarios.md` — success / failure scenario format and verifiability
- `kb-extension.md` — domain file shape (what a feature block must contain)
