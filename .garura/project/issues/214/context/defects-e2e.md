# E2E Defects — 214 Pipeline

Defects surfaced during end-to-end validation of the specify-product → design-exp → build-arch pipeline against the Graveyard Crew project brief. Recorded by user; fixes deferred until the e2e validation pass completes.

## Defect 1 — Folder restructure: flatten doubled `product/product` + adopt stage-centric layout

**Status:** IN PROGRESS (fixing in this pass, 2026-04-14)
**Severity:** Medium
**Reported:** 2026-04-14 (user, during e2e test against Graveyard Crew brief)
**Surfaced by:** Manual inspection of the temp-folder structure at `/tmp/graveyard-crew-e2e/.meridian/product/`

### Observation

The `specify-product` play writes all its outputs (project-brief.md, project-profile.yaml, market-brief.md, domain-selection.yaml, scope.yaml, enriched-capabilities.yaml, epics/*.yaml, quality-profile.yaml) to `.meridian/product/`. The doubled `product/product` path is redundant.

### Confirmation

Yes, `.meridian/product/` is the folder where `specify-product` reads the project brief + profile and writes all Stage 1-6 outputs. The doubled name is a direct consequence of ADR 017's whitelist shape:

```
.meridian/product/
  ├── product/    # specify-product outputs — this is the doubled one
  ├── ux/         # design-exp outputs
  └── arch/       # build-arch outputs
```

The outer `product` is the container for product-scoped plays; the inner `product` is the specific bucket for product-planning-stage outputs. The user's original directive (2026-04-13) read: *"broadly - product, ux and arch"* — which did describe a product bucket alongside ux and arch. But seeing it in practice, the doubled name is awkward.

### Expected

Either:
- **Flatten option A:** `.meridian/product/*` for specify-product outputs, `.meridian/ux/*` and `.meridian/arch/*` as top-level siblings (breaking the single-container rule)
- **Rename option B:** `.meridian/product/specs/` (or `plan/`, `epics/`, etc.) + `.meridian/product/ux/` + `.meridian/product/arch/` — keep the container but rename the inner bucket to avoid the doubled noun
- **Flatten option C:** `.meridian/product/*` holds everything product-planning-stage (specify outputs at top level) and `ux/` + `arch/` become first-class subfolders of `.meridian/product/` — effectively promoting specify-product's outputs to the container level

### Affected surfaces

- `.meridian/core/config.yaml` — `product.directories` block (currently `product: product/`, `ux: ux/`, `arch: arch/`)
- `docs/adr/017-folder-whitelist.md` — folder tree diagram + amendment-rejected rationale
- `core/components/memory/standards/rules/kb-extension.md` — path references
- All 3 compiled plays (specify-product, design-exp, build-arch) — every JSON contract that uses `{product_base}/` or references `.meridian/product/`
- All 6 specify-product skills — paths in Process sections
- `core/components/skills/validate-screen-coverage/SKILL.md` — cross-refs to product/product/
- `docs/components/memory.md` — ADR 017 whitelist diagram
- `docs/components/plays.md` — Artifact Locations table
- `.meridian/project/issues/214/specs/{spec,verify,tasks}.md` — references throughout

### Fix approach (resolved 2026-04-14)

User directive delivered the final layout: flatten the doubled name AND adopt a stage-centric sub-structure. `.meridian/product/` becomes the product root (no inner `product/`). The 6 stage folders are direct children:

```
.meridian/product/
├── user-provided/     user inputs (project brief + future notes / questions)
├── specification/     market-brief, project-profile, quality-profile, domain-selection
├── scope/             scope.yaml, enriched-capabilities.yaml, validation-intent-epics.yaml, epics/
├── architecture/      build-architecture output (populated later by the architecture play)
├── experience/        design-experience output (populated later by the experience play)
├── research/          STM catalog research pending LTM promotion (was kb-research/)
├── _checkpoints/      play-lifecycle (unchanged)
├── _evidence/         play-lifecycle (unchanged)
└── _status/           play-lifecycle (unchanged)
```

Name corrections per user: `arch → architecture`, `exp → experience`, `kb-research → research`.

Fix pass:
1. Update `.meridian/core/config.yaml` `product.directories` to reflect the new 6-folder structure
2. Rewrite `docs/adr/017-folder-whitelist.md` folder tree diagram and rationale
3. Bulk rename across the repo — all `{product_base}/{old_subpath}` references get routed to their new stage folder
4. Relocate MV Demo test folder files to new layout
5. Update the 3 compiled plays' JSON contracts directly (path changes only — no intent changes, hash stable)
6. Re-verify specify-product G1-G11 gate checks

---

## Defect 2 — Within-domain coverage gap analysis missing

**Status:** IN PROGRESS (fixing in this pass, 2026-04-14)
**Severity:** High (structural — pipeline produces shallow scope without noticing)
**Reported:** 2026-04-14 (user, during MV Demo review of scope.yaml)
**Surfaced by:** User question: "I see KB research for new domains. There was no need or gaps in existing domains that needed research? Or did the play just look at the existing KB and say 'this is pretty much my area'?"

### Observation

`configure-capabilities` has a **binary** gap check: domain file exists in LTM → use what's there; domain file missing → halt or trigger research. There is no second-order check asking: *"does the existing domain's feature catalog cover THIS product's implied scope, or is the catalog shallow for this use case?"*

For Graveyard Crew, the pipeline picked UM-F001/F002/F005/F007 from the existing `user-management.md` file without asking whether those 4 features cover the product's actual needs around:

| Product need (from brief) | LTM coverage | Missing? |
|---------------------------|--------------|----------|
| Store API keys for Lighthouse / content scorer / campaign API with rotation, revocation, per-scope access, audit log | UM-F005 Profile mentions "API key storage" as one bullet | ⚠️ Needs its own feature: **Secrets Vault** |
| Usage quotas / cost caps per user | None | ❌ Missing: **Per-user quota & cost ledger** |
| Service-account identities for Analyst / Improver / Judge agents | None | ❌ Missing: **Machine identity / service account** |
| Per-scoring-source OAuth scopes distinct from sign-in OAuth | UM-F007 covers Google/GitHub sign-in only | ❌ Missing: **Third-party credential linking** |
| Live spend telemetry per session | None | ❌ Missing: **Spend telemetry** (could live in a future billing domain) |

Graveyard Crew probably needs 6-8 user-management epics, not the 4 the MV Demo produced. Same risk applies to the 3 STM research files — they list 3 features each, but a proper research pass might find 6-10 per domain.

### Expected

Two-level gap detection in `configure-capabilities`:
- **Level 1 (existing):** does the domain file exist?
- **Level 2 (new):** do the features in the domain file cover the product's implied needs in that domain?

Level 2 output: a `within_domain_coverage_gaps` section per domain in scope.yaml listing gaps with (a) the implied-need description, (b) the closest existing feature, (c) coverage verdict (`full | partial | missing`), (d) recommended action (`extend-existing-feature | add-new-feature | research-domain-extension`).

### Affected surfaces

- `core/components/skills/configure-capabilities/SKILL.md` — new Process step for coverage analysis + new input (`project_brief_path`)
- `core/components/memory/standards/rules/product.md` — new Rule 10 (Within-Domain Coverage Analysis)
- `core/components/plays/specify-product/SKILL.md` — Step 5 JSON contract needs to pass `project_brief_path`
- `core/components/plays/specify-product/reference/intent.yaml` — optional new constraint C15 (triggers rebake if added — DEFERRED)

### Fix approach (this pass)

Two-layer fix:
- **Rule layer:** add Rule 10 to `rules/product.md` documenting the discipline
- **Skill layer:** add the Process step to `configure-capabilities/SKILL.md` with the new input
- Leave the intent.yaml untouched (no rebake) — Rule 10 governs the behavior via skill updates

Full code-level enforcement (actually running the coverage analysis during a real run) is deferred to when a real research agent is wired. For the MV Demo, the rule documents what should have happened.

---

## Defect 3 — `constraint_trace` conflates `applied` vs `walked-but-not-applicable`

**Status:** IN PROGRESS (fixing in this pass, 2026-04-14)
**Severity:** Medium (readability + semantic clarity)
**Reported:** 2026-04-14 (user, during scope.yaml review)
**Surfaced by:** User question: "I see constraints. I see HIPAA compliance, high security. Are these constraints picked up? Why was HIPAA picked? This is a generic marketing use case."

### Observation

`configure-capabilities` walks every cross-tree constraint per the "walk-all-constraints" discipline (C5 in specify-product intent.yaml). The resulting `constraint_trace` is a flat list where every constraint has a `fired: true | false` field. For Graveyard Crew, 10 of 19 CTCs walked have `fired: false` — including HIPAA and high-security rules.

A reader skimming scope.yaml sees HIPAA and MFA in the trace and reasonably asks *"why is this product pretending to be regulated?"* The trace is doing compliance discipline but presenting as product scope. It conflates two semantics:
- **Applied constraints** — rules that fired and actually shaped the scope
- **Walked but not applicable** — rules evaluated for audit discipline that did not fire

### Expected

Split `constraint_trace` into two sub-sections:

```yaml
constraint_trace:
  applied:                      # rules that fired — shaped the scope
    - id: CTC-004
      description: "Consumer products imply social login for conversion"
      condition_evaluated: "audience='B2C' AND delivery_ambition=3"
      action_taken: ["UM-F007"]
      rationale: "Market-ready B2C products see 30-50% signup uplift from social login."
      source: ltm
    ...
  not_applicable:               # rules walked for audit, did not fire
    - id: CTC-001
      description: "High-security profiles require MFA"
      why_not_applicable: "security_level='medium' (need high/critical)"
      source: ltm
    - id: CTC-002
      description: "Healthcare compliance (HIPAA) requires audit logging"
      why_not_applicable: "compliance=[] (need HIPAA entry)"
      source: ltm
    ...
```

The walk-all-constraints discipline stays in place (C5 still forces every rule to be evaluated and recorded). Only the output shape changes.

### Affected surfaces

- `core/components/skills/configure-capabilities/SKILL.md` — Process Step 3 (walk constraints) and Step 7 (Write scope.yaml) — split the output
- `core/components/plays/specify-product/SKILL.md` — Step 5 evals SE-6 / SE-7 that reference `scope.constraint_trace` — update to check both sub-sections
- `core/components/memory/standards/rules/product.md` — Rule 2 (Every Cross-Tree Constraint Walked) — reference the new split
- `/tmp/graveyard-crew-e2e/.meridian/product/.../scope.yaml` — MV Demo output updated to new shape

### Fix approach (this pass)

Update the skill's output section in one pass. Update the compiled play's evals to match. Apply to the MV Demo scope.yaml. No intent.yaml change, no rebake.

---

## Defect 4 — Audit-vs-scope structural separation is implicit

**Status:** IN PROGRESS (fixing in this pass, 2026-04-14)
**Severity:** Medium (discipline / architectural rule)
**Reported:** 2026-04-14 (user, during scope.yaml review — same conversation as D3)
**Surfaced by:** User noted the pattern: "this is one example. i am looking for patterns that led to this section"

### Observation

D3 is one instance of a larger pattern: audit data (walked-but-not-applicable constraints, zero-violation category counts, check coverage matrices) is mixed into scope-shaping files without structural separation. Examples across the pipeline:

| File | Scope content | Audit content mixed in |
|------|---------------|------------------------|
| `scope.yaml` | selected_capabilities, rejected_capabilities, pending_user_selection | constraint_trace (D3) |
| `validation-intent-epics.yaml` | per-epic pass/fail status, violations | `by_category` counters with all-zero rows |
| `quality-profile.yaml` | ISO 25010 characteristics, risk register | (mostly scope, but handoff_notes could be audit-ish) |

A PM reviewing `scope.yaml` skims rows they think describe the product; a compliance auditor reading the same file skims rows that prove the pipeline did its job. The two readers have different needs and the current layout serves neither well.

### Expected

A single rule — Rule 9 in `rules/product.md` — that says: **audit artifacts are structurally separate from scope artifacts**. When they share a file, audit content lives in a dedicated sub-section (`audit:` / `audit_trail:` / `not_applicable:`) and never in the scope body.

The rule is a discipline for future changes. The immediate concrete application is D3 (constraint_trace split). Future applications include a `validation-intent-epics.yaml` refactor to put `by_category` under `audit:` and any downstream quality-profile work that adds audit data.

### Affected surfaces

- `core/components/memory/standards/rules/product.md` — new Rule 9

### Fix approach (this pass)

Rule-only fix. Document the discipline, apply it concretely via D3, let future refactors apply it elsewhere.

---

## Defect 5 — Domain grounding (vocabulary + bounded contexts) is missing from specify-product

**Status:** OPEN — recorded 2026-04-14, updated 2026-04-14 after user correction on spec/arch split. Preview hand-authored for Graveyard Crew regen; canonical pipeline landing deferred to follow-up.
**Severity:** Critical — structural pipeline gap
**Reported:** 2026-04-14 (user, during epic quality review of the MV Demo rerun)
**Surfaced by:** User critique — "we have domain in KB and capability. but I don't see any grounding in terms of key semantics of the domain. we have users and experiments — but we haven't grounded any core entities. we also gave you some theme around Grounds / Tombs / Crypt — I don't see either. did we miss the whole domain element when designing this pipeline?"
**User correction (same day):** "this is too early to define all entities. domain modelling should happen in architecture. but ubiquitous language, theme vocab, and bounded context are important — they belong at spec time."

### Observation

The pipeline's `domain` concept is a **namespace for capabilities**, not a **grounded language for the product**. We have `user-management` as a domain folder containing UM-F001, UM-F002, etc. We do NOT have the lightweight spec-time concepts that downstream stages need to stay coherent.

**Spec-time domain elements (MUST be in specify-product) — currently missing:**

| Element | Present? | What it is |
|---------|----------|------------|
| Ubiquitous language | ❌ | The canonical verbs and nouns the team, code, and UI must all share. "launch an experiment" not "start a job"; "accepted cycle" not "successful iteration" |
| Theme vocabulary | ❌ | Product-specific named things. For Graveyard Crew: Grounds (dashboard), Tomb (completed experiment), Crypt (execution log), Reaper (cancel), Headstone (artifact card) |
| Bounded contexts | ❌ implicit in folder structure only | Where identity ends and experimentation begins. What state flows across the boundary. Which team/module owns which concept. |

**Arch-time domain elements (MUST be in build-architecture, NOT specify-product) — correctly NOT in specify-product today, but we should document that they belong to architecture:**

| Element | Where it belongs |
|---------|------------------|
| Core entities (User, Experiment, Hypothesis, Cycle, Artifact, Vital, Score, Verdict, TraceRow, ScoringSource) | `architecture/domain-model.yaml` (produced by build-architecture play) |
| Value objects (Score, Revision, ScoreDelta, prev_hash) | same |
| Aggregates + roots (Experiment is root; owns Cycles; Cycles own Verdicts and TraceRows) | same |
| Invariants and lifecycle states per entity | same |

**User's rationale for the split:** entities are an implementation-layer concern. At specify-product time we don't know yet whether Cycle is an aggregate root or a value object, whether Vital is shared across contexts or owned by the catalog, whether Verdict is immutable or replaceable. Those are architecture decisions. What we DO need at spec time is the vocabulary — the words — so that everyone (PM, designer, architect, engineer) uses them consistently from day one. The architecture pass then maps the vocabulary to concrete entities.

**Concrete evidence in the MV Demo:** 17 intent epics reference nouns like "hypothesis", "experiment", "artifact", "cycle", "verdict", "vital", "scorer" — but there's no glossary. Readers have to infer what each word means from context. The brief says "Crypt" once in a feature name and the word vanishes. The theme vocabulary never propagates to screens, epics, or constraints.

### Impact

- **Capabilities float.** Every capability references nouns without definitions. "Hypothesis Creation" never says what a Hypothesis IS.
- **Epics are not testable end-to-end.** Reviewers can't verify "the Cycle writes a TraceRow" because neither Cycle nor TraceRow has a schema to check against.
- **design-exp has no vocabulary.** Screen names get invented generically (`ExperimentDashboard` instead of `Grounds`, `AuditLog` instead of `Crypt`).
- **build-arch has no schema skeleton.** Database tables, API endpoints, and service boundaries get invented generically rather than mapping to aggregates.
- **Theme grounding becomes decoration.** The brief says "Grounds / Tombs / Crypt" as the product's core vocabulary — without a domain model, those words appear once in a feature description and disappear. The UI ends up saying "Dashboard" because nothing propagated the theme.
- **Hallucination compounds.** With no entity grounding, every downstream stage re-invents the nouns from scratch. D2 (within-domain coverage) surfaces feature gaps but cannot surface entity gaps, because there's no entity list to check against.

### Expected

A new Stage 2.5 in `specify-product`: **Domain Grounding**. Between domain selection and capability configuration, the pipeline produces `specification/domain-grounding.yaml` with:

```yaml
product_slug: <slug>

ubiquitous_language:
  theme: <optional theme name, e.g. "graveyard">
  theme_vocabulary:
    - word: "Crypt"
      meaning: "the immutable execution log of an experiment"
      never_use_instead: ["audit log", "trace log", "history"]
    - word: "Grounds"
      meaning: "the main dashboard where experiments live"
      never_use_instead: ["dashboard", "home page"]
    - ...
  canonical_nouns:                        # the product's shared vocabulary — nouns only
    - word: "experiment"
      short_description: "an overnight loop of improvement cycles against a single artifact"
      deferred_to_architecture: true      # architecture will define the entity schema
    - word: "cycle"
      short_description: "one iteration of analyst → improver → judge against an artifact revision"
      deferred_to_architecture: true
    - word: "vital"
      short_description: "a quality dimension the user measures improvement against"
      deferred_to_architecture: true
    - ...
  canonical_verbs:                        # the product's shared action vocabulary
    - verb: "launch an experiment"
      never_use_instead: ["start", "run", "kick off"]
    - verb: "accept a cycle"
      never_use_instead: ["approve", "promote"]
    - verb: "reject a cycle"
      never_use_instead: ["decline", "fail"]
    - verb: "bury an experiment"  # theme-mapped for Reaper action
      never_use_instead: ["cancel", "stop", "abort"]

bounded_contexts:                         # lightweight — names + boundary notes only
  - name: identity
    description: "user sign-up, sign-in, profile, stored secrets"
    boundary_with:
      experiment: "User identity flows into Experiment.owner as a reference only — no shared state"
  - name: experiment
    description: "hypothesis creation, experiment execution, verdict chain"
    boundary_with:
      scoring: "Experiment references a ScoringSource by id; the ScoringSource lives in the scoring context"
      trace: "Experiment cycles emit trace rows into the Crypt (trace context) through the scriber contract"
  - name: scoring
    description: "vitals catalog, plugin registry, score normalization"
  - name: trace
    description: "immutable execution log (Crypt), append-only, queryable per experiment"

# NOTE: entities, value objects, aggregates, invariants, lifecycle states — ALL deferred
# to architecture/domain-model.yaml produced by the build-architecture play. See the
# user directive: "this is too early to define all entities. domain modelling should
# happen in architecture."
```

The domain grounding artifact is the **vocabulary backbone** for downstream stages:
- `configure-capabilities` reads it — every capability must use canonical_nouns from it (Rule 13 — Vocabulary Discipline). A capability named "Login / Authentication" that references "user" passes; one that references "account holder" when the vocab says "user" fails.
- `enrich-capabilities` uses theme_vocabulary and canonical_verbs in business rules and success criteria
- `generate-intent-epics` requires every epic's success_scenarios to use canonical_verbs — "user launches an experiment" passes, "user starts an experiment" fails `ubiquitous_language_drift`
- `validate-intent-epics` flags `ungrounded_capability` (capability uses a noun not in canonical_nouns) and `ubiquitous_language_drift` (epic uses a forbidden synonym like "audit log" when domain-grounding says "Crypt")
- `design-experience` inherits screen names from theme_vocabulary — `Grounds` not `Dashboard`, `CryptViewer` not `AuditLog`, `HeadstoneCard` not `ExperimentCard`
- `build-architecture` ALSO reads this file — and produces `architecture/domain-model.yaml` with the full entity model, value objects, aggregates. The vocabulary is the contract between the two artifacts: the entity model's entity names must appear in canonical_nouns; the entity model cannot introduce new vocabulary.

### Affected surfaces

**specify-product (spec-time vocabulary):**
- `core/components/plays/specify-product/reference/intent.yaml` — new constraint C15 (Domain Grounding), new Stage 2.5 in the workflow (triggers rebake)
- `core/components/plays/specify-product/SKILL.md` — new step between Step 4 (domain-selection checkpoint) and Step 5 (configure-capabilities) dispatching a new `ground-domain-vocabulary` skill; new Checkpoint 2.5 for vocabulary review
- `core/components/skills/ground-domain-vocabulary/SKILL.md` — NEW skill. Reads brief + project-profile + domain-selection. Produces `specification/domain-grounding.yaml` (ubiquitous language + theme vocabulary + bounded contexts, NO entities). Surfaces at a checkpoint for user confirmation.
- `core/components/memory/standards/schemas/domain-grounding.yaml` — NEW schema (ubiquitous language, theme vocabulary, bounded contexts — spec-time shape)
- `core/components/memory/standards/rules/domain.md` — NEW rule file. Rule 12 (Ubiquitous Language Grounding — every product has a domain-grounding.yaml before capability configuration), Rule 13 (Vocabulary Discipline — canonical_nouns and canonical_verbs are mandatory across all downstream artifacts)
- `core/components/memory/standards/rules/features.md` — new Rule 10 (Canonical Vocabulary Citation — every epic field that names a noun or verb must use the vocabulary from domain-grounding.yaml)
- `core/components/memory/standards/rules/product.md` — new Rule 12 (Domain Grounding Precedes Scope — capability configuration cannot run without a locked domain-grounding.yaml)
- `core/components/memory/standards/schemas/intent-epic.yaml` — new field `canonical_terms_referenced` (list of canonical_nouns from domain-grounding that this epic touches)
- `core/components/skills/configure-capabilities/SKILL.md` — new input `domain_grounding_path`; new Process step to enforce canonical vocabulary citation on every selected_capability
- `core/components/skills/enrich-capabilities/SKILL.md` — business rules cite canonical terms
- `core/components/skills/generate-intent-epics/SKILL.md` — epic generation validates against vocabulary; theme vocabulary propagates to in_scope items and success scenarios
- `core/components/skills/validate-intent-epics/SKILL.md` — new check categories `ungrounded_capability`, `ubiquitous_language_drift`, `forbidden_synonym`

**build-architecture (arch-time entities):**
- `core/components/plays/build-arch/reference/intent.yaml` — new constraint requiring architecture/domain-model.yaml as an output artifact
- `core/components/plays/build-arch/SKILL.md` — reads specification/domain-grounding.yaml; produces architecture/domain-model.yaml with entities, value objects, aggregates, invariants, lifecycle states; every entity name must appear in specification/domain-grounding.yaml's canonical_nouns (the vocabulary is the contract between the two artifacts)
- `core/components/skills/derive-domain-model/SKILL.md` — NEW skill. Takes specification/domain-grounding.yaml + all intent epics as input. Produces architecture/domain-model.yaml. This is where the actual DDD modelling happens.
- `core/components/memory/standards/schemas/domain-model.yaml` — NEW schema for arch-time entity model (entities, aggregates, value objects, invariants — the full DDD shape)

**design-experience:**
- `core/components/plays/design-exp/SKILL.md` — reads specification/domain-grounding.yaml; screen names inherit theme_vocabulary; flows use canonical_verbs
- Does NOT read architecture/domain-model.yaml — design flows must stay decoupled from architecture decisions (different cadences)

**Shared infrastructure:**
- `docs/adr/017-folder-whitelist.md` — acknowledge `specification/domain-grounding.yaml` and `architecture/domain-model.yaml` as canonical artifacts
- `.meridian/core/config.yaml` — no changes (both artifacts live under already-whitelisted stage folders)

### Fix approach

**This pass (MV Demo preview):** hand-author `specification/domain-grounding.yaml` for Graveyard Crew in the test folder with ubiquitous language + theme vocabulary + bounded contexts ONLY. Thread it through the 9 regenerated epics by adopting the theme vocabulary (`Crypt`, `Grounds`, `Tomb`, `Reaper`, `Headstone`) in epic in_scope items, success scenarios, and constraint text. Add a `canonical_terms_referenced` field per epic citing which vocabulary entries each epic touches. NO entity definitions — those wait for architecture.

**Follow-up pass (canonical landing for specify-product):**
1. Author `schemas/domain-grounding.yaml` (spec-time shape: vocabulary + bounded contexts only)
2. Author `rules/domain.md` with Rules 12 (Ubiquitous Language Grounding) + 13 (Vocabulary Discipline); update `rules/features.md` with Rule 10 (Canonical Vocabulary Citation); update `rules/product.md` with Rule 12 (Domain Grounding Precedes Scope)
3. Create `core/components/skills/ground-domain-vocabulary/SKILL.md`
4. Update `configure-capabilities`, `enrich-capabilities`, `generate-intent-epics`, `validate-intent-epics` with vocabulary consumption and `forbidden_synonym` / `ungrounded_capability` checks
5. Update `specify-product/reference/intent.yaml` with C15 (Domain Grounding constraint); add Stage 2.5 workflow step dispatching `ground-domain-vocabulary`; rebake
6. Update `design-exp` to consume `specification/domain-grounding.yaml` for screen and flow naming

**Follow-up pass (canonical landing for build-architecture — this is where DDD actually happens):**
1. Author `schemas/domain-model.yaml` (arch-time shape: entities + aggregates + value objects + invariants + lifecycle states)
2. Create `core/components/skills/derive-domain-model/SKILL.md` — this is the NEW skill that does the actual DDD modeling. Takes specification/domain-grounding.yaml + all intent epics as input and produces architecture/domain-model.yaml. Every entity name must trace to a canonical_noun in the upstream grounding.
3. Update `build-arch/reference/intent.yaml` with a constraint requiring architecture/domain-model.yaml as a first-class output; rebake

Effort estimate: spec-time pass ~2-3 days. Arch-time pass ~3-4 days (entity modeling is where the hard thinking lives). Can be done sequentially — spec-time first so design-exp can consume the vocabulary.

**Why this is critical (vs just "a gap"):** without grounded vocabulary, the pipeline's outputs are prose pretending to be contracts. Downstream stages re-invent nouns. Theme grounding disappears. Engineers and designers can't share a vocabulary. The user surfaced this as "did we miss the whole domain element when designing this pipeline?" — the answer is yes, and the spec/arch split is the right shape: vocabulary at spec time (cheap, fast, user-reviewable), entities at arch time (expensive, careful, implementation-informed).

---

## Defect 6 — MVP Recommendation artifact missing from the pipeline

**Status:** OPEN — recorded 2026-04-14 during the brand-new run, Stage 2 → Stage 3 transition
**Severity:** High (structural gap — the pipeline skips the "focus" step between "opportunity" and "scope")
**Reported:** 2026-04-14 (user, during the Graveyard Crew clean rerun after seeing the market brief with real TAM/SAM data)
**Surfaced by:** User directive — "now that we have the TAM SAM etc. can we focus on domain and capabilities and creating a MVP recommendation. so this is now a new artifact... but a clear view on what the client should launch with."

### Observation

The specify-product pipeline currently has:
1. **Stage 1 — market-brief.md** — produces the opportunity landscape (TAM / SAM / SOM, competitors, market gaps, risks, CAGR)
2. **Stage 2 — domain-selection.yaml** — produces the list of KB domains that apply to the product
3. **Stage 3 — configure-capabilities → scope.yaml** — produces the full capability selection

The pipeline goes **opportunity → KB domains → capabilities** with no bridging step that answers the question: **"Given the opportunity we've mapped and the domains we've selected, WHAT IS THE CLIENT ACTUALLY LAUNCHING WITH?"**

Concrete problem at Graveyard Crew's Stage 2 → 3 transition:
- Market brief says the market is $3-5B, growing 30-40% CAGR
- Brief's "Who It's For" lists 5 use cases (content creator, web perf dev, growth marketer, solo founder, ML practitioner)
- Brief's scoring sources are 4 (Lighthouse, content scorer, campaign API, custom)
- Domain selection says 4 KB domains apply
- **None of this tells the product team: "lead with X use case using Y scoring source, defer Z for v1.1"**

Without an MVP recommendation, configure-capabilities walks ALL features in ALL 4 domains and produces a bloated v1 scope that tries to serve all 5 use cases with all 4 scoring sources. That's exactly the 17-epic demo we had to throw out in the prior run.

### Expected

A new stage — **Stage 1.75: MVP Recommendation** — between domain-selection and domain-grounding. The artifact:

```
.meridian/product/specification/mvp-recommendation.md
```

**Shape (proposed):**

```markdown
# MVP Recommendation — {slug}

## Primary Focus

- **Primary use case:** {ONE of the brief's named use cases}
- **Primary persona:** {ONE of the profile's personas}
- **Primary scoring source / integration / channel:** {ONE of the brief's named sources}
- **Why this one:** {rationale grounded in profile + market + brief}

## Launch Scope (v1)

- {capability 1, from the selected domains, constrained to primary use case}
- {capability 2}
- ...

## Deferred to v1.1+

- {capability deferred}
  - defer reason: {market / profile / scope / cost}
  - v1.1 trigger: {what would unlock this — user count, revenue, specific signal}
- ...

## Pricing Direction

- {tier structure + price range, grounded in profile.budget_sensitivity + brief cost mentions + market competitor pricing}
- {flagged: "directional, not diligence-grade — needs primary research"}

## Success Criteria for "v1 is successful"

- {quantified signals from brief KPIs, narrowed to the primary focus}
- {go/no-go for v1.1 unlock}

## Risks That Could Kill This MVP

- {derived from market-brief.md risks + profile tensions}

## Rationale Summary

{3-5 paragraph narrative: why this focus, based on profile + market + brief combined}
```

**Inputs:** market-brief.md, domain-selection.yaml, project-profile.yaml, project-brief.md, user answers in grounding-questions.md.

**Output:** specification/mvp-recommendation.md.

**Flows into:** configure-capabilities as a `mvp_recommendation_path` input that narrows the capability walk — only features that serve the primary use case get selected; others land in a `deferred_capabilities` section of scope.yaml with a rationale.

### Affected surfaces

- `core/components/plays/specify-product/reference/intent.yaml` — new constraint C16 (MVP Recommendation is mandatory before capability configuration)
- `core/components/plays/specify-product/SKILL.md` — new Stage 1.75 workflow step with a new checkpoint (Checkpoint 1.75 — MVP Review)
- `core/components/skills/recommend-mvp/SKILL.md` — NEW skill. Takes market brief + domain selection + profile + brief + grounding questions. Produces mvp-recommendation.md. Runs between Stage 2 and Stage 3.
- `core/components/memory/standards/schemas/mvp-recommendation.md` or `.yaml` — NEW schema for the recommendation shape
- `core/components/memory/standards/rules/product.md` — new Rule 14 (MVP Focus — every v1 launch picks ONE primary use case; deferred use cases become a v1.1 roadmap)
- `core/components/skills/configure-capabilities/SKILL.md` — new input `mvp_recommendation_path`; new Process step to narrow the capability walk to the primary use case; deferred capabilities land in a new `deferred_capabilities` section of scope.yaml
- `core/components/skills/generate-intent-epics/SKILL.md` — respects the deferred list; does NOT generate epics for deferred capabilities
- `core/components/skills/derive-quality-profile-from-epics/SKILL.md` — risk register picks up "deferred use cases are a retention risk" as an entry

### Fix approach

**This pass (preview):** hand-author `specification/mvp-recommendation.md` for Graveyard Crew. Use it as input for Stage 3 configure-capabilities manually. Show the user the delta between "walk all 4 domains blindly" (old behavior, 17 bloated epics) and "walk only the features that serve the primary use case" (new behavior, ~5-6 focused epics). This is Defect 6's proof-of-value for the MV Demo.

**Follow-up pass (canonical landing):**
1. Author `schemas/mvp-recommendation.yaml`
2. Author `core/components/skills/recommend-mvp/SKILL.md`
3. Add Rule 14 to `rules/product.md`
4. Add C16 to `specify-product/reference/intent.yaml`; add Stage 1.75 workflow step; rebake
5. Update `configure-capabilities` to consume mvp_recommendation_path and emit deferred_capabilities
6. Regen all 3 compiled plays as needed
7. Re-run Graveyard Crew against the canonical grounded pipeline

### Relationship to Defect 5 (domain grounding)

Defect 5 asks for domain-grounding.yaml (ubiquitous language, theme vocabulary, bounded contexts) between Stage 2 and Stage 3. Defect 6 asks for mvp-recommendation.md in the same band. **They should both land together as a new Stage 1.75 group:**
1. Domain selection (Stage 2 — KB mapping)
2. MVP recommendation (Stage 1.75a — strategic focus)
3. Domain grounding (Stage 1.75b — vocabulary)
4. Configure capabilities (Stage 3 — scope walk, narrowed by MVP rec and grounded in vocabulary)

The sequence: selection → recommendation → grounding → scope.

---

## Defect 7 — Implementation decisions bleed into product/research artifacts (no abstraction-layer boundary rule)

**Status:** OPEN — recorded 2026-04-14 during the brand-new run, after authoring `research/agentic.md`, `research/experimentation.md`, `research/metrics-and-scoring.md`
**Severity:** High (trust / layering violation — research files become implementation-prescriptive, not domain-descriptive; forces later stages to either comply or explain contradictions)
**Reported:** 2026-04-14 (user, during the Graveyard Crew clean rerun: "are you making implementation decisions? why?")
**Surfaced by:** Claude wrote research files for the 3 missing domains that embedded SDK calls, database triggers, tech stack choices, and wire-level API specifics into the "when it matters / tradeoffs / failure scenarios" sections of domain research

### Observation

When writing STM research files for the 3 missing domains (`agentic`, `experimentation`, `metrics-and-scoring`), Claude embedded implementation-specific choices directly into what should have been domain-level research. Concrete examples pulled verbatim from the authored files:

**`research/agentic.md` violations:**
- "Graveyard Crew uses the **Claude Agent SDK directly** as the execution layer (not a wrapper framework like LangGraph / CrewAI / AutoGen)"
- "Three separate Claude SDK `query()` calls per cycle" — specific SDK method
- "Each call starting a fresh session (no `resume=`)" — SDK parameter name
- "Claude SDK's `output_format` JSON schema enforcement"
- "Build-time lint rule blocking imports of judge-specific config/types in improver code" — specific build-time tool

**`research/experimentation.md` violations:**
- "Postgres row-level trigger rejecting UPDATE on an Experiment row where state != 'draft'"
- "Async via a durable job queue (e.g., pg-boss on Postgres, or simple row-based locking)"
- "Append-only `crypt_entries` table" with specific column list: `experiment_id`, `cycle_number`, `event_type`, `event_payload_json`, `prev_hash`, `this_hash`, `created_at`
- "`this_hash = sha256(prev_hash || canonical_json(event_payload) || event_type || cycle_number)`" — specific hash construction
- "Canonical JSON encoder (RFC 8785 JCS or equivalent)"

**`research/metrics-and-scoring.md` violations:**
- "A typed plugin interface (e.g., `ScoringSourcePlugin` abstract base class in Python or an interface in TypeScript)"
- Specific required methods: "`async capture(artifact) -> captured_form`, `async score(captured_form, selected_vitals) -> ScoringResult`"
- "LLM-wrapped plugins MUST declare `temperature = 0`" + "Runtime enforces `temperature == 0` check at plugin invocation"
- "Plugin MUST pass an explicit model version (`claude-sonnet-4-6` not just `sonnet`) to the SDK"

These are architecture-time decisions. They belong in `.meridian/product/architecture/` (Stage 6+), not in `.meridian/product/research/` (Stage 2.5).

### Why this is wrong

Research files describe a **domain** — what the problem space looks like, which industry patterns apply, when they matter, what fails without them, what depth spectrum exists. They must be **implementation-agnostic**. Tech stack, DB engine, SDK bindings, method signatures, wire protocols, and framework choices are **architecture-time** commitments that need:
- Cross-domain tradeoff analysis (at Stage 6)
- User Tether on major stack choices
- Dependency reconciliation with existing systems

Letting them leak into research files:
1. **Prejudges architecture.** Later stages read research files as source-of-truth; if research says "use Postgres triggers", architecture feels obligated to match.
2. **Breaks trust between stages.** Each pipeline stage has a contract with its predecessor about abstraction level. Research breaking that contract means every downstream stage has to re-parse and filter.
3. **Makes research non-portable.** A research file that names specific tech is not reusable across projects or even across ADR decisions within the same project.
4. **Mirrors Defect 5 on a different axis.** Defect 5 caught "too early to define all entities" (domain modeling in spec time). Defect 7 is the same class: "too early to commit to implementation".

### Expected

The `specify-product` play MUST enforce an **abstraction-layer boundary rule** that prevents research, spec, scope, and grounding artifacts from containing implementation specifics. The rule is a hard constraint in the play + a rules-file entry + a validator check.

**Proposed Rule 15 — Abstraction-Layer Boundary (in `rules/product.md`):**

> **Rule 15 — Abstraction-Layer Boundary.** Artifacts produced by `specify-product` MUST stay implementation-agnostic. The following are **forbidden** in any file under `.meridian/product/specification/`, `.meridian/product/research/`, `.meridian/product/experience/` (for content, not diagrams): specific database engines (Postgres, MySQL, SQLite, DynamoDB), specific SDK/framework method names and parameters (`query()`, `resume=`, `temperature=0`, `output_format`), specific programming languages (Python class definitions, TypeScript interfaces as code), specific build tools (lint rules, CI steps), specific table schemas with column lists and types, specific wire protocols (REST endpoint paths, gRPC method signatures), specific cryptographic constructions (`sha256(prev_hash || ...)`), and specific model/version identifiers (`claude-sonnet-4-6`).
>
> **Allowed** (domain-level language): "append-only ledger with tamper-evident chain", "structured-output enforcement via schema", "role-isolated execution", "write-once baseline", "pluggable measurement adapter", "LLM-wrapped scoring with controlled determinism".
>
> **Why:** Architecture-time decisions need cross-domain tradeoff analysis and user approval; leaking them into spec/research prejudges architecture and breaks stage contracts.
>
> **How to apply:** When describing a pattern's implementation, use **domain verbs and nouns** ("the ledger is appended to with tamper-evidence") not **tech nouns** ("Postgres row with prev_hash column"). If you find yourself naming a specific tool, rewrite to the underlying concept. The tech choice belongs in `.meridian/product/architecture/` (Stage 6).

**Proposed C17 constraint on `specify-product/reference/intent.yaml`:**

> **C17 — Abstraction-Layer Boundary.** No artifact produced by specify-product stages 1–5 may reference specific database engines, SDK method signatures, programming languages, framework names, table schemas with columns, wire protocols, cryptographic constructions, or model version identifiers. Violations halt the stage and return to the authoring step. **source_for_enforcement:** Defect 7.

**Validator additions:**
- `validate-research-file` (NEW or extension of an existing validator) — lint that scans research/*.md for a deny-list of tokens: `Postgres`, `MySQL`, `SQLite`, `Claude SDK`, `query()`, `temperature=0`, `output_format`, `sha256(`, `pg-boss`, `LangGraph`, `CrewAI`, `AutoGen`, `abstract base class`, `TypeScript interface`, `claude-sonnet`, `claude-opus`, `API key`, `REST endpoint`, etc. Flags each hit with line number.
- `validate-scope-file` — same deny-list, applied to scope.yaml and enriched-capabilities.yaml.
- `validate-spec-file` — same deny-list, applied to domain-grounding.yaml, mvp-recommendation.md, market-brief.md (narrower — market-brief cites real products, which is OK; deny-list is context-sensitive).

### Affected surfaces

- `core/components/memory/standards/rules/product.md` — add Rule 15 (Abstraction-Layer Boundary) with allowed/forbidden examples
- `core/components/plays/specify-product/reference/intent.yaml` — add C17 constraint
- `core/components/plays/specify-product/SKILL.md` — compiled play picks up C17 in pre-flight or per-step validation
- `core/components/skills/configure-capabilities/SKILL.md` — when writing research files for missing domains, enforce Rule 15 at write time (refuse to write a file containing deny-list tokens)
- `core/components/skills/recommend-mvp/SKILL.md` (NEW per Defect 6) — same enforcement
- NEW validator: `core/components/skills/validate-abstraction-layer/SKILL.md` — runs against research/, specification/, scope on demand, returns line-level violation list
- `core/components/memory/standards/schemas/research-file.yaml` (if it exists, else create) — declare the implementation-agnostic contract
- Retroactive cleanup: the 3 research files just authored (`/tmp/graveyard-crew-e2e/.meridian/product/research/{agentic,experimentation,metrics-and-scoring}.md`) must be rewritten to remove all deny-list violations before the Graveyard Crew MV Demo can proceed

### Fix approach

**This pass (immediate, to unblock the rerun):**
1. Rewrite the 3 research files to remove implementation decisions. Retain domain patterns, when-it-matters, depth spectrum (in abstract terms like "Basic/Standard/Advanced/Enterprise" without naming specific tech), signals, tradeoffs, failure scenarios, cross-domain dependencies.
2. Verify the domain-selection.yaml doesn't contain any tech binding (it currently mentions Claude Agent SDK — needs scrubbing).
3. Continue the rerun with the cleaned files.

**Follow-up pass (canonical landing):**
1. Author Rule 15 in `rules/product.md` with allowed/forbidden examples distilled from Defect 7.
2. Add C17 to `specify-product/reference/intent.yaml`; rebake.
3. Create `validate-abstraction-layer` skill with the deny-list.
4. Wire the validator into configure-capabilities, recommend-mvp, and any future skill that writes to product/research/ or product/specification/.
5. Re-run Graveyard Crew through the fully-constrained pipeline to verify the boundary holds.

### Relationship to Defect 5

Defect 5 caught **domain modeling leaking into spec time** (entities defined before architecture). Defect 7 catches **implementation decisions leaking into spec/research time** (SDK calls, DB engines, schemas). They are siblings — both are "stages committing to things that belong to later stages". Rule 15 (Defect 7) sits alongside Rule 13 (Defect 5) as the abstraction-layer discipline of specify-product.

### Root cause (Claude-side)

The violation happened because I conflated "grounded in industry research" with "committed to a specific implementation of that research". Citing Anthropic's `output_format` as an industry pattern is legitimate; writing "use `output_format` with `temperature=0`" as a Graveyard Crew implementation decision is a layer violation. The rule enforces the distinction: **cite the pattern, not the tool**. Without a machine-readable rule, the violation is easy to miss under time pressure.

---

## Defect 8 — KB-selected domains are referenced by path, not pulled into product memory

**Status:** OPEN — recorded 2026-04-14 during the brand-new run, after Stage 2.5 domain-grounding completion
**Severity:** High (reproducibility / non-isolation — a KB edit retroactively changes old product runs)
**Reported:** 2026-04-14 (user, during the Graveyard Crew clean rerun: "we said that KB -> LTM -> STM and then any misses get researched. and later we will take STM -> LTM. so we picked domain like user etc. from KB... but it didnt get into LTM.")
**Surfaced by:** domain-selection.yaml pointing at KB path for user-management while the 3 researched domains landed as real files in `.meridian/product/research/` — asymmetric handling of KB-sourced vs STM-researched domains

### Observation

At Stage 2, specify-product's domain-selection produces entries of two kinds:

1. **LTM-sourced (e.g., user-management)** — stored as a **reference** only:
   ```yaml
   - name: user-management
     source: ltm
     source_file: "core/components/memory/knowledge/domain/user-management.md"
   ```
2. **STM-researched (e.g., experimentation, agentic, metrics-and-scoring)** — written as a **full file** into `.meridian/product/research/{domain}.md`:
   ```yaml
   - name: experimentation
     source: missing_from_ltm_needs_research
   ```

Two problems with this asymmetry:

**Problem 1 — Non-reproducibility.** The LTM-sourced entry is a pointer into a file outside the product folder. If someone edits `core/components/memory/knowledge/domain/user-management.md` in the framework repo tomorrow, the Graveyard Crew product run is retroactively affected — Stage 3 reads the new content, not the content that was "selected" at Stage 2. Every later stage that refers back to the domain is effectively reading a moving target.

**Problem 2 — Downstream stages read from two different sources.** Stage 3 (configure-capabilities) must read STM-researched files from `.meridian/product/research/` and KB-referenced files from `core/components/memory/knowledge/domain/`. Two read paths, two sets of assumptions, two failure modes. Any stage that lists "the domains this product uses" has to merge the two sources in code.

**Terminology note:** The field name `source: ltm` is also wrong — `core/components/memory/knowledge/` is KB in the config.yaml layering (`ltm.source: ./core/components/memory/`, `ltm.target: ./.meridian/core/memory/`). The entry should say `source: kb`. Independent labeling bug baked into the defect.

### Expected

**The principle (user-stated 2026-04-14):** "anything that is used from KB should move to product. this will essentially become the LTM."

At Stage 2 (or at the start of any stage that reads a KB domain), the domain's content is **copied into `.meridian/product/research/`** as a frozen snapshot. Downstream stages read from `.meridian/product/research/` exclusively — one read path, one set of assumptions, reproducible across time.

Each copy carries a **provenance header**:

```yaml
# Provenance (Defect 8)
# ---
# origin: kb
# source_path: "core/components/memory/knowledge/domain/user-management.md"
# copied_at: "2026-04-14"
# kb_sha_at_copy: "<sha of KB file at copy time>"
# editable: false  # or true if the product has extended the KB content
```

This makes `.meridian/product/research/` the product's **effective LTM layer for the current run** — the set of domain definitions the product is actually using, regardless of whether they came from KB or were freshly researched.

### Expected flow

```
Stage 2 domain-selection:
  for each selected_domain:
    if source == "kb":
      copy KB file → .meridian/product/research/{domain}.md
      write provenance header
    elif source == "missing_from_kb_needs_research":
      (research file authored separately — already goes to product/research/)
    # result: every selected domain is a real file in product/research/

Stage 3+ (configure-capabilities, epics, etc.):
  read from .meridian/product/research/ only
  never read from core/components/memory/knowledge/
```

**Future extension (NOT this defect):** when `/capture-learning` is fixed, files in `.meridian/product/research/` that were freshly researched (or have the `editable: true` flag) flow back into KB as new / updated canonical entries. KB-origin files with unchanged content are skipped (the promotion check compares `kb_sha_at_copy` against current KB sha). That flow is a separate defect.

### Affected surfaces

- `core/components/memory/standards/rules/product.md` — new Rule 16 (Pull-to-Product Principle): any KB-sourced domain a product uses MUST be copied into product/research/ at selection time with provenance. Stage 3+ MUST read from product/research/ only.
- `core/components/plays/specify-product/reference/intent.yaml` — new C18 constraint enforcing the pull-to-product discipline
- `core/components/skills/configure-capabilities/SKILL.md` — read path fixed to `.meridian/product/research/` only; KB read path removed
- `core/components/skills/select-domains/SKILL.md` (or whatever owns Stage 2) — at selection time, copy KB content into product/research/ with provenance header
- `core/components/memory/standards/schemas/research-file.yaml` — declare the provenance header shape
- `.meridian/core/config.yaml` — update the comment on `product.directories.research`: was "STM catalog research pending LTM promotion", becomes "product domain library — KB copies + researched domains, both scoped to this product run"
- The Graveyard Crew test run (this pass, immediate fix):
  - Copy `core/components/memory/knowledge/domain/user-management.md` → `/tmp/graveyard-crew-e2e/.meridian/product/research/user-management.md` with provenance header
  - Update `/tmp/graveyard-crew-e2e/.meridian/product/specification/domain-selection.yaml` to reflect `source: kb_copied_to_research`, `source_file: ".meridian/product/research/user-management.md"`

### Fix approach

**This pass (immediate, to unblock the rerun):**
1. Manually apply the pull-to-product fix for user-management in the Graveyard Crew test folder.
2. Update domain-selection.yaml with correct source labels and paths.
3. Continue the rerun from Stage 3 reading from `.meridian/product/research/` only.

**Follow-up pass (canonical landing):**
1. Author Rule 16 in `rules/product.md` with the pull-to-product principle + provenance header schema.
2. Add C18 to `specify-product/reference/intent.yaml`; rebake.
3. Update the Stage 2 skill to copy KB content into product/research/ automatically with provenance.
4. Update configure-capabilities to read from product/research/ only.
5. Update config.yaml comment on product.directories.research.
6. Re-run Graveyard Crew end-to-end to verify pull-to-product is automated, not manual.

### Related defects

- **Defect 7 (Abstraction-Layer Boundary)** — Rule 15. Together with Rule 16 (this defect), these two form a pair: "what stays out of product/" (Rule 15: implementation specifics) and "what must come into product/" (Rule 16: KB-sourced domain definitions).
- **Future: capture-learning fix** — the reverse flow (product/research/ → KB promotion) is NOT part of Defect 8. It will be a separate defect when the user decides to wire it up.

### Current field-naming bug (also fixed by this defect)

The field value `source: ltm` in the current domain-selection.yaml is mislabeled — `core/components/memory/knowledge/` is KB in config.yaml's layering, not LTM. The new taxonomy:

| Current value | New value | Meaning |
|---|---|---|
| `source: ltm` | `source: kb_copied_to_research` | content pulled from KB and copied into product/research/ |
| `source: missing_from_ltm_needs_research` | `source: stm_research_in_product` | content freshly researched and written into product/research/ |

Both now land in the same physical location, with different `origin` provenance. Stage 3+ doesn't need to care about the distinction for reading purposes — the file is the file.

---

## Defect 10 — design-exp play carries stale pre-D1 folder paths (blocker for execution)

**Status:** OPEN — recorded 2026-04-14 during the pre-test read of design-exp/SKILL.md
**Severity:** Critical (blocker — running the play as-is halts immediately at pre-flight because the referenced paths do not exist post-D1)
**Reported:** 2026-04-14 (user: "fix this defect. this is detrimental and blocker")
**Surfaced by:** Reading the compiled `core/components/plays/design-exp/SKILL.md` and its source `core/components/plays/design-exp/reference/intent.yaml` before attempting the design-exp test run against the Graveyard Crew fixture

### Observation

The design-exp play was compiled before Defect 1's folder restructure landed. It references two obsolete paths throughout its intent.yaml AND the inherited compiled SKILL.md:

1. **`.meridian/product/product/`** — the old doubled folder. Per D1, this flattened to `.meridian/product/`, with SDLC-stage sub-folders (`user-provided/`, `specification/`, `scope/`, `architecture/`, `experience/`, `research/`). The doubled path NO LONGER EXISTS.

2. **`.meridian/product/ux/`** — the old UX output folder. Per D1, this was renamed to `.meridian/product/experience/`. The `ux/` folder NO LONGER EXISTS.

**Concrete evidence in the intent.yaml:**
- C1 rule: "Pre-flight reads scope.yaml, enriched-capabilities.yaml, epics/*.yaml, and quality-profile.yaml from **.meridian/product/product/**. Missing or DRAFT-status artifacts halt pre-flight."
- C10 rule: "Artifacts land under **.meridian/product/ux/** per ADR 017."

**Concrete evidence in the compiled SKILL.md (~30+ occurrences across the file):**
- Pre-flight bash: `for f in scope.yaml ...; do test -f "${product_base}product/$f" || halt`
- Stage 1 Persona Synthesis contract: `"epics_dir": "{product_base}product/epics/"`, `"scope_path": "{product_base}product/scope.yaml"`, `"personas_path": "{product_base}ux/personas.md"`
- Stage 2 Screen Inventory contract: `"enriched_capabilities_path": "{product_base}product/enriched-capabilities.yaml"`, `"screens_dir": "{product_base}ux/screens/"`
- Stage 3 validation: `"validation_path": "{product_base}ux/validation-screens-pre-flow.yaml"`
- Every subsequent stage carries the same stale paths
- The Evidence & Close self-commit file list references `{product_base}ux/personas.md`, `{product_base}ux/screens/*.md`, `{product_base}ux/flows/*.md`, etc.
- The Pause and Resume status file path: `{product_base}ux/_status/design-exp.json`

**Why it's a blocker:** running the play against any Graveyard-Crew-style fixture halts at pre-flight because `.meridian/product/product/scope.yaml` does not exist (the file is at `.meridian/product/scope/scope.yaml`). Even if pre-flight were bypassed, every subsequent stage would write to `.meridian/product/ux/`, which does not exist and is not in the ADR 017 whitelist — every write would be refused. No portion of the play can execute end-to-end until the paths are corrected.

### Why this slipped through

The specify-product play was rebaked when D1 landed (see prior drift notices in specify-product/SKILL.md). design-exp was NOT rebaked at the same time — likely because design-exp is downstream and nobody exercised it end-to-end during the D1 fix pass. The stale paths sat dormant until the design-exp test run attempted to start.

This is a **regression** class of defect: D1 was a framework-wide rename that should have cascaded to every play in the repo, but the cascade missed design-exp. Any other play compiled before D1 (build-arch is a candidate — worth checking when it comes up) may have the same issue.

### Expected

All `.meridian/product/product/` references resolve to the correct stage folder (`scope/`, `specification/`, etc.), and all `.meridian/product/ux/` references resolve to `.meridian/product/experience/`. Specifically:

| Current (broken) | Correct (post-D1) |
|---|---|
| `.meridian/product/product/scope.yaml` | `.meridian/product/scope/scope.yaml` |
| `.meridian/product/product/enriched-capabilities.yaml` | `.meridian/product/scope/enriched-capabilities.yaml` |
| `.meridian/product/product/epics/*.yaml` | `.meridian/product/scope/epics/*.yaml` |
| `.meridian/product/product/quality-profile.yaml` | `.meridian/product/specification/quality-profile.yaml` |
| `.meridian/product/ux/personas.md` | `.meridian/product/experience/personas.md` |
| `.meridian/product/ux/screens/` | `.meridian/product/experience/screens/` |
| `.meridian/product/ux/flows/` | `.meridian/product/experience/flows/` |
| `.meridian/product/ux/design-spec.md` | `.meridian/product/experience/design-spec.md` |
| `.meridian/product/ux/_checkpoints/design-exp/` | `.meridian/product/_checkpoints/design-exp/` (per D1, `_checkpoints/` is at product root, orthogonal to stages) |
| `.meridian/product/ux/_evidence/design-exp/` | `.meridian/product/_evidence/design-exp/` |
| `.meridian/product/ux/_status/design-exp.json` | `.meridian/product/_status/design-exp.json` |

Note the lifecycle folders (`_checkpoints/`, `_evidence/`, `_status/`) live at the product root per ADR 017 — they are NOT nested under `ux/` or `experience/`. The current intent.yaml's C10 also needs updating to reflect that.

### Affected surfaces

- `core/components/plays/design-exp/reference/intent.yaml` — C1 and C10 rules (the authoritative source, drives the rebake)
- `core/components/plays/design-exp/SKILL.md` — all 30+ path references (picked up automatically via rebake from the corrected intent)
- Any play or skill that READS from a `design-exp` output path with hardcoded references (check build-arch, prepare-implementation) — if they reference `.meridian/product/ux/`, they need updates too
- `build-arch/reference/intent.yaml` and `SKILL.md` — **probably the same drift class**; verify when build-arch is next exercised. Flag as Defect 10 companion if confirmed.

### Fix approach

**This pass (immediate):**
1. Update `design-exp/reference/intent.yaml` — rewrite C1 and C10 to use the post-D1 paths (see table above).
2. Commit the intent.yaml change as a safety net before rebake.
3. Run `/create-play --rebake design-exp` — this regenerates the compiled SKILL.md with correct paths throughout.
4. Verify: grep the new compiled SKILL.md for `product/product/` and `/ux/` — both should be zero occurrences.
5. Commit the rebake.
6. Run the design-exp MV Demo against the Graveyard Crew fixture to surface any further (non-path) defects.

**Follow-up (not this pass):**
- Audit build-arch/reference/intent.yaml + SKILL.md for the same stale-path pattern. If found, log Defect 10b and apply the same rebake-with-corrected-paths fix.
- Audit any other pre-D1-compiled play (scan `docs/adr/017-folder-whitelist.md`'s date vs each play's `compiled_at` metadata).

### Why we're not batching this with Rules 13/14/15 enforcement

D10 is a **blocker** — nothing about design-exp runs until the paths are correct. Rules 13/14/15 enforcement (MVP narrowing, abstraction-layer boundary, pull-to-product) is a **quality gap** — design-exp could run without them, it would just produce sub-optimal output (screens for deferred use cases, etc.). The user directive was "fix this defect. this is detrimental and blocker" — singular, path-focused. The R13/R14/R15 gap will surface during the test run and can be logged as a follow-up defect there.

---

## Defect 9 — MVP recommendation belongs in scope/, not specification/

**Status:** OPEN — recorded 2026-04-14 (same run, immediately after mvp-recommendation.md was authored in the wrong folder)
**Severity:** Medium (folder placement — wrong semantic layer; reader confusion; pipeline next-stage resolution has to know the right path)
**Reported:** 2026-04-14 (user: "defect - mvp should be in scope not spec")
**Surfaced by:** Authoring mvp-recommendation.md at `.meridian/product/specification/mvp-recommendation.md` per Defect 6's original proposal

### Observation

Defect 6 proposed the MVP recommendation artifact at `.meridian/product/specification/mvp-recommendation.md`. That placement is wrong because of what each top-level folder represents in the pipeline's data model:

| Folder | Semantic meaning | What lives here |
|---|---|---|
| `specification/` | **"What is the opportunity and what is the domain shape?"** — outputs of Stages 1 and 2 that describe the product space independently of what v1 chooses to build | market-brief.md, project-profile.yaml, quality-profile.yaml, domain-selection.yaml, domain-grounding.yaml |
| `scope/` | **"What are we actually building for v1?"** — outputs of Stage 3 onwards that narrow the opportunity into concrete v1 scope, capability walk, epics | scope.yaml, enriched-capabilities.yaml, validation-intent-epics.yaml, epics/ directory |
| `architecture/` | **"How are we building it?"** — Stage 6+ | arch outputs |
| `experience/` | **"How does the user interact with it?"** — Stage 6+ | design outputs |
| `research/` | **"Which domain definitions does this product use?"** — product-scoped domain library (Defect 8 pull-to-product) | domain research files with provenance headers |

MVP recommendation is **scope-narrowing** work: it takes the full opportunity space (specification/) and narrows it to the primary use cases and architectural directions that v1 will actually ship. Placing it in specification/ misrepresents it as "opportunity description" rather than "v1 scope contract".

Concrete problem at Graveyard Crew's Stage 2.75:
- `mvp-recommendation.md` was written to `specification/mvp-recommendation.md` per Defect 6's original path
- `scope.yaml` ended up reading its "primary use cases" input from a specification/ file — a reversed semantic flow (scope should not read from specification for the narrowing question; narrowing is itself a scope decision)
- Readers scanning `specification/` for "what is the opportunity?" get confused when they see "what we're launching with" mixed in

### Expected

MVP recommendation artifact lives at:

```
.meridian/product/scope/mvp-recommendation.md
```

Stage order is unchanged (it still runs at Stage 2.75, between domain-grounding and Stage 3 configure-capabilities). Only the **folder** changes. Subsequent artifacts (scope.yaml, enriched-capabilities.yaml, epics) correctly reference it at `scope/mvp-recommendation.md`.

### Affected surfaces

- `core/components/plays/specify-product/reference/intent.yaml` — update C16 path (introduced in Defect 6)
- `core/components/plays/specify-product/SKILL.md` — update Stage 1.75 / 2.75 workflow step output path
- `core/components/skills/recommend-mvp/SKILL.md` (NEW per Defect 6) — output_path: `.meridian/product/scope/mvp-recommendation.md`
- `core/components/skills/configure-capabilities/SKILL.md` — input `mvp_recommendation_path` reads from `scope/`, not `specification/`
- Defect 6 entry in this file — its affected-surfaces list also mentions `specification/mvp-recommendation.md`; should be updated to `scope/mvp-recommendation.md` when Defect 6 is formally addressed
- `.meridian/core/config.yaml` — the comment on `product.directories.specification` and `product.directories.scope` should list mvp-recommendation under scope
- ADR 017 (folder whitelist) — add `mvp-recommendation.md` to the allowed files in `scope/`
- The Graveyard Crew test run (this pass, immediate fix):
  - Move `.meridian/product/specification/mvp-recommendation.md` → `.meridian/product/scope/mvp-recommendation.md`
  - Update `scope.yaml` input reference

### Fix approach

**This pass (immediate):** file moved in the Graveyard Crew test folder; all references updated (`scope.yaml`, `domain-grounding.yaml`, `domain-selection.yaml`). Continuation of the run uses the correct path.

**Follow-up pass (canonical landing):**
1. Update Defect 6's "Expected" / "Affected surfaces" sections to use `scope/mvp-recommendation.md`
2. When the recommend-mvp skill is built (Defect 6 follow-up), its output path is `scope/mvp-recommendation.md`
3. Update C16 constraint + Stage 1.75/2.75 workflow in specify-product
4. Update ADR 017 folder whitelist
5. Re-run Graveyard Crew against the canonical pipeline to verify

### Relationship to other defects

- **Defect 6** — Defect 9 is a **correction** to Defect 6's proposed path. The two defects should land together in the canonical fix pass: Defect 6 creates the artifact + stage, Defect 9 ensures it's in the right folder.
- **Defect 5 (domain-grounding)** — domain-grounding.yaml is correctly in `specification/` because it describes the **domain shape** (ubiquitous language + bounded contexts), not what v1 builds. The test: does this artifact change based on what the team picks to ship in v1? Domain grounding does not (the Graveyard theme applies regardless of use case). MVP recommendation does (A vs B vs C vs D vs E is a v1 scope choice). That's the boundary between specification/ and scope/.
- **Defect 8 (pull-to-product)** — the pull-to-product principle is about `research/` vs KB; Defect 9 is about `specification/` vs `scope/`. Together they map all five product/ top-level folders to their correct semantic meanings.

---

## Design Directions (not defects — pipeline evolution)

### DD-1 — Graceful KB-gap handling via research-then-promote

**Status:** ESCALATED TO BLOCKER — fixing in this pass (user directive 2026-04-14)
**Reported:** 2026-04-14 (user, during Graveyard Crew e2e)
**Relates to:** pre-test finding "KB catalog does not cover Graveyard Crew's core domain (experimentation / agent-orchestration / metrics-and-scoring)"

**Minimum viable fix (this pass):**
1. Update `configure-capabilities` SKILL.md to document the gap-research flow: detect gaps via coverage threshold, write STM research files, read from BOTH LTM catalog and STM research during capability selection.
2. Update `validate-intent-epics` SKILL.md to allow `kb_source.provisional: true` so epics grounded in STM research pass validation.
3. Update `specify-product/reference/intent.yaml` to relax C4 to allow provisional kb_source.
4. For the Graveyard Crew e2e rerun, act as the research agent and author 3 new domain files directly in STM at `/tmp/graveyard-crew-e2e/.meridian/product/research/{experimentation,agent-orchestration,metrics-and-scoring}.md` with all 9 required sections per feature.
5. Run the full pipeline simulation against the Graveyard Crew brief from Stage 3 through build-arch.

**Deferred to follow-up:** compiling a proper `research-missing-domain` skill, wiring a research agent, building the `/promote-to-kb` play, and recompiling the 3 plays to pick up the updated skill contracts. Those are the full architectural landing; this pass does the minimum to unblock the rerun.

#### The rule

When the pipeline runs against a product whose core domain is not in the KB catalog, it must NOT halt and it must NOT fabricate capabilities silently. It must:

1. **Detect the gap.** `configure-capabilities` (or a pre-flight skill) identifies that the selected domains from Stage 2 resolve to < some threshold of the product's implied scope. The threshold is TBD — probably something like "less than 50% of epics can be grounded in the existing catalog".

2. **Surface the gap.** Present the gap to the user at a checkpoint, similar to today's capability-configuration checkpoint. The user sees: "your product needs domains X, Y, Z that don't exist in the KB. Do you want the pipeline to research them?"

3. **Research-on-demand.** If the user Tethers, dispatch a research agent (could be `market-analyst` expanded, or a new `knowledge-researcher` agent) that does web research + LTM synthesis and produces candidate domain-taxonomy markdown files PLUS candidate cross-tree constraints. Research output goes to **STM** at `.meridian/project/issues/{issue}/context/research/{domain}.md` — issue-scoped, not yet promoted.

4. **Use the STM research for this run.** The pipeline reads the STM-scoped research files AS IF they were LTM domain-taxonomy files, for the duration of the current specify-product run. Intent epics generated from these capabilities carry a `kb_source.provisional: true` flag so downstream stages know the source is not yet canonical.

5. **Promote to LTM after validation.** When the pipeline run completes (or at `/capture-learning` time), the STM-scoped research files are reviewed by the user and promoted to `core/components/memory/knowledge/domain/` as permanent catalog entries. From that point on, subsequent runs find the domain in LTM and skip the research step.

#### Why this is the right answer (vs Option 2 "direct generation fallback")

Option 2 as I framed it earlier was "relax the constraint and generate capabilities without KB grounding". That's a loophole. This design direction is different:

- **Research has structure.** The research agent writes actual catalog-shaped markdown (9 required sections per kb-extension-conventions.md), not free-form capability lists.
- **Research is traceable.** Every research file carries the research trace (queries, sources, synthesis rationale) so promotion decisions are informed.
- **Research compounds.** Once promoted, the next product in the same category reuses the catalog work. The system gets smarter with every run. Option 2 would produce disposable one-off generations.
- **Human review stays in the loop.** The promotion step is a conscious act, not silent drift. Bad research gets caught before it contaminates the catalog.

#### Components that need to exist

- **KB-gap detector:** either a new pre-flight check in configure-capabilities OR a new skill `detect-kb-gaps` that runs before Stage 3 and computes coverage against the product brief.
- **Research agent:** could extend `market-analyst` or be a new agent (`knowledge-researcher`). Owns research skills: web search, LTM synthesis, catalog file authoring.
- **Research skills:**
  - `research-missing-domain` — takes a domain name + suggested features + project context, produces a candidate markdown file with the 9 required sections.
  - `research-cross-tree-constraints` — derives profile-driven inclusion/exclusion rules for the new domain and adds them to a candidate `_cross-tree-constraints.yaml` overlay.
- **Promotion play:** `/promote-to-kb` (the name is already mentioned in 214 planning but the play was deferred). Reads STM `kb-research/` files, presents for user review, git-adds them to `core/components/memory/knowledge/domain/`, commits.
- **STM-aware configure-capabilities:** the skill's reading protocol is extended to look in `{stm}/context/research/` as a secondary source after `ltm_domain_taxonomy_path`.

#### Validator changes

- `validate-kb-extension` — extend to validate provisional STM research files against the same 9-section contract.
- `validate-intent-epics` — allow `kb_source.provisional: true` as a valid kb_source value; otherwise existing rules apply.
- A new validator at promotion time — `validate-promotion-candidate` — runs before a STM file is promoted to LTM.

#### Effort estimate

Substantial — approximately the size of a new sub-issue (call it 214.8 or a follow-up issue #215). It introduces a new agent, 2-3 new skills, a new play, and touches configure-capabilities + validators. Probably 3-5 days of focused work.

#### Relationship to existing pieces

- `/capture-learning` already exists and handles STM-to-LTM promotion for resolution traces. The research-promote pattern is a close cousin — maybe a variant of capture-learning rather than a new play.
- `knowledge-extractor` agent exists. It currently promotes KNOWLEDGE from STM resolution traces. It may be the natural owner of the new research-extract work too.
- `deprecated-play-patterns.md` lives in STM at `.meridian/project/issues/214/context/` — this is the same pattern: research/capture-first, promote-to-LTM later. It's direct precedent for this design direction.

#### Deferred fix path

1. Pick an owning issue (214.8 OR open #215 for post-214 work)
2. Spec the flow in an intent.yaml following the canonical shape
3. Implement components iteratively: detector → research agent → skills → STM-aware reading → promotion play → validator updates
4. Test against the Graveyard Crew brief end-to-end — it's already staged in `/tmp/graveyard-crew-e2e/` with the gap documented

For now the design is recorded; no implementation.

---

## Defect 11 — build-arch has no grounding / aggressive-questioning constraint (structural silence)

**Observed:** 2026-04-15, Graveyard Crew build-arch test run (stage 1).

**Symptom:** Stage 1 completed cleanly with `architecture.yaml` containing 19 components + 8 ADRs + full stack commitment (Next.js 14, Node.js 20 / Fastify 4, PostgreSQL 16, Redis 7, BullMQ 5, argon2id, LGTM observability, modular-monolith on self-hosted VPS, Playwright + dockerode sandbox). `tech-architect` did not surface a single grounding question or ambiguity note for the user. Validation passed with 0 violations.

**Root cause:** `core/components/plays/build-arch/reference/intent.yaml` contains no Rule-11-equivalent constraint. `grep -i 'aggressive|grounding|inference|question'` returns zero matches. specify-product enforces Rule 11 (Aggressive Questioning on Inference) via C-series constraints; design-exp inherits it via C15; build-arch is the only play in the Specify → Design → Build arc that does NOT enforce it.

**Sourcing audit of the test run:**

- **Grounded from `project-profile.grounded_tools` (6 of ~20 stack/tooling picks):** Playwright (e2e), OpenTelemetry (obs), Prometheus (metrics), Grafana (dashboards), k6 (load), LLM tier policy (Haiku analyst+judge, Sonnet improver).
- **KB-catalog-picked silently (~8 picks):** Next.js (1 of 4 frontend stacks), Node.js + Fastify (1 of 5 backend stacks), PostgreSQL (1 of N relational options), modular-monolith (1 of 6 architecture patterns), self-hosted VPS (1 of 6 platforms), Docker containerization, ci-cd choices. All were within the KB's legal catalog for `solo + MVP + budget=high`, but the agent picked without surfacing the decision.
- **Agent-default (not in KB at all, ~6 picks):** BullMQ (queue library), dockerode (Docker SDK), argon2id (password hashing), LGTM stack (Loki+Tempo beyond the OTel+Prometheus+Grafana that IS grounded), version pins (Next.js 14, PG 16, Redis 7, Fastify 4, BullMQ 5, Playwright 1.46).

Total: roughly 30% grounded, 40% KB-catalog-picked-silently, 30% agent-default. For a solo/MVP/budget=high profile, the KB catalog alone offers 4 × 5 × 6 × 6 = 720 legitimate combinations. The agent committed to one without asking.

**Impact:**

- Decisions the user would have pushed back on (e.g., BullMQ vs. a lighter queue, LGTM vs. a single-binary observability option, Fastify 4 vs. Node's stdlib http) never surfaced.
- Architecture.yaml presents as "fully grounded" because every decision has a cited `driver` — but the drivers are post-hoc rationalizations pointing at legitimate upstream constraints, not evidence the user consented to the specific pick.
- Downstream plays (prepare-implementation, implement-epic) treat architecture.yaml as LOCKED truth. A silent decision at build-arch becomes an unquestioned assumption at implementation time.

**Structural gap — the three layers missing:**

1. **Layer 1 — Aggressive questioning (Rule 11 parity):** build-arch intent must obligate `tech-architect` to enumerate the KB's legal candidate set for each stack/pattern slot, check grounded_tools for a pin, and if multiple candidates remain, append a question to `{product_base}user-provided/grounding-questions.md` and halt (or checkpoint for user decision) before committing.

2. **Layer 2 — Source-type discipline:** every decision in architecture.yaml must carry a `source_type` enum: `grounded_tools_pin` | `kb_catalog_single_candidate` | `kb_catalog_multi_candidate_user_approved` | `agent_default_with_user_approval` | `agent_default_unilateral`. The last category is a blocker — the play must not complete with any decision tagged `agent_default_unilateral`.

3. **Layer 3 — Scope widening (separate defect overlap — see D12 below):** the current single `architecture.yaml` artifact conflates logical architecture, physical architecture, NFR design response, quality vision, and design patterns across layers. When the artifact is one blob, the agent reasons about tech picks without first committing to logical shape / pattern choice / NFR response — so the picks happen before the user has a handle on what's being picked for. See D12.

**Fix direction:**

1. Add C14 (Aggressive Questioning on Architecture Inference) to build-arch intent.yaml with the explicit rule: "when KB offers multiple valid candidates for a stack/pattern slot AND project-profile.grounded_tools does not pin the choice, the play MUST append a grounding question and halt OR surface the decision at the next checkpoint for explicit user approval before the decision lands in architecture.yaml."
2. Add C15 (Source-Type Discipline) requiring every decision to carry a `source_type` enum and blocking completion on any `agent_default_unilateral` entries.
3. Add F16 (Silent Decision Violation) failure condition.
4. Update `derive-architecture-spec` skill Process section to enumerate candidates explicitly per slot, check grounded_tools, halt on ambiguity.
5. Update `validate-architecture-spec` skill to lint `source_type` values and reject `agent_default_unilateral` entries.
6. Rebake build-arch.

**Effort estimate:** 1 intent edit + 2 skill edits + 1 rebake + test-run verification. ~1 day.

**Status:** OPEN. Part of a larger build-arch redesign (see D12 for the output-shape overhaul).

---

## Defect 12 — build-arch output conflates logical / physical / NFR-design / quality-vision / design-patterns

**Observed:** 2026-04-15, Graveyard Crew build-arch test run + user review.

**Symptom:** The current build-arch play produces two artifacts — `architecture.yaml` and `quality-standards.yaml` — where `architecture.yaml` is a single blob conflating multiple distinct concerns that belong at different levels of reasoning:

1. **Logical architecture** — what the system IS (capabilities → components → responsibilities → contracts between components, independent of tech stack).
2. **Physical architecture** — how the logical shape MANIFESTS in concrete tech (stack choices, deployment topology, infrastructure tier).
3. **NFR design response** — for each relevant NFR dimension from `quality-profile.yaml`, (a) any adjustments to the NFR target based on what's achievable within the profile, and (b) the design mechanisms that will ENSURE the NFR is met (caching topology for performance, replica strategy for availability, audit-log placement for compliance, etc.).
4. **Quality Vision** — the per-characteristic articulation of what "quality" means for THIS product (derived from project-profile + quality-profile + scope) AND the design mechanisms that guarantee it. Currently spread thinly across `quality-standards.yaml` as a tooling/threshold list — the VISION (what we're aiming for and why) is absent.
5. **Design patterns at every layer** — pattern choices cascade:
   - System-level: microservices vs. modular-monolith vs. serverless vs. event-driven
   - Service-level: hexagonal vs. layered vs. onion
   - Module-level: clean architecture vs. feature-sliced vs. DDD tactical
   - Component-level (frontend): MVC vs. MVVM vs. MVP vs. Flux vs. Redux-style unidirectional
   - Component-level (backend): Repository + Service + Controller vs. Action-based vs. CQRS command/query split
   - Code-level: specific GoF / Enterprise / Concurrency patterns per hotspot

Currently the play outputs a stack pick (Next.js + Fastify + PostgreSQL), an ADR for one pattern decision (modular-monolith chosen via ADR-001), and nothing explicit at any of the other layers. The agent implicitly assumes a MVVM or RSC default for the frontend, a Controller-Service-Repository default for the backend, and no articulated code-level patterns at all.

**Root cause:** Defect 12 is structural. `core/components/plays/build-arch/reference/intent.yaml` enumerates `architecture.yaml` and `quality-standards.yaml` as the only two outputs, and the constraints describe WHAT must be present in each file without carving the concerns into distinct layers that force the agent to reason layer-by-layer.

**Impact:**

- Downstream plays read `architecture.yaml` as if it's the full architectural truth. They don't see that logical shape was never separated from physical pick.
- Implementation-time decisions (e.g., "should this feature use MVVM or classic MVC on the frontend side?") have no canonical source — the implementer invents it ad-hoc.
- Quality Vision — the thing a PM or EM would read to understand "what does success feel like for this product" — doesn't exist as an artifact. `quality-standards.yaml` has tooling + thresholds, which is the HOW, not the WHAT.
- NFR adjustments (when a target from `quality-profile.yaml` has to be softened because the profile won't support it) are invisible — the agent either quietly meets a weaker bar or silently commits to an unachievable bar.

**Related reference material:**

- KB has `core/components/memory/knowledge/arch/patterns/*` for system-level patterns (6 files).
- KB has `core/components/memory/knowledge/arch/stacks/*` for stack choices with "Evolution Paths" sections per stack file (cataloged 2026-03-25 via commit `174be31`).
- **Note (searched, not found):** there is no standalone "frontend evolution" document in the repository history. `git log --all -S "frontend evolution"` and `git log --all --diff-filter=D` both return nothing. The closest artifacts are the per-stack `Evolution Paths` sections inside each stack file (e.g., `frontend-react-nextjs.md`) and the `patterns/evolutionary-scaling.md` file about evolutionary scaling as an architectural pattern. If the user meant a different doc (e.g., a framework for frontend technology evolution over product lifecycle), it has not been committed. Follow-up: either author it as new KB content or point build-arch at the existing per-stack Evolution Paths sections as the source.
- No KB content exists for module-level patterns (clean / hexagonal / feature-sliced) or component-level patterns (MVC / MVVM / Flux / Repository-Service). These would need to be authored.

**Fix direction — the 5-output shape:**

Replace the current 2-artifact output with a 5-artifact output, each with its own schema and validator:

1. **`logical-architecture.yaml`** — capabilities → components → responsibilities → contracts. Tech-stack-free. Names components by domain role ("credential store", "experiment queue", "LLM orchestrator"), not by product ("Redis", "BullMQ", "Claude Haiku").
2. **`physical-architecture.yaml`** — maps logical components to concrete tech, deployment topology, integration points. Every decision carries `source_type` (from D11 fix).
3. **`nfr-design.md`** — per-NFR section: upstream target from quality-profile.yaml, adjusted target (if any) with reason, design mechanism(s) that ensure the target is met with traceable reference to physical-architecture components.
4. **`quality-vision.md`** — ISO 25010 characteristic-by-characteristic vision: "what does this characteristic FEEL like for this product" prose, plus the design mechanism(s) that guarantee it with references to physical-architecture or nfr-design. Written so a PM can read it end-to-end.
5. **`design-patterns.yaml`** — layered pattern choices: system-level, service-level, module-level, component-level (frontend and backend separately), code-level hotspots. Each layer has candidates considered, choice made, and driver cited. Builds on the KB catalog where available; explicitly flags layers where KB content is missing.

`quality-standards.yaml` remains as the tooling + threshold + enforcement artifact — but it becomes the IMPLEMENTATION of `quality-vision.md` rather than the vision itself.

**Effort estimate:**

- New schemas: 5 (one per artifact). ~1 day.
- Update derive-architecture-spec into 5 sub-skills (or author 3-4 new skills + keep derive-architecture-spec for physical). ~2-3 days.
- Update build-arch intent.yaml with new constraints for each artifact (mandatory sections, cross-references, coverage rules). ~half-day.
- Update validate-architecture-spec to lint all 5 artifacts OR split into 5 validators. ~1 day.
- Author missing KB content for module-level and component-level patterns (2-4 new KB files if we commit to having them). ~1-2 days.
- Rebake + test run. ~half-day.

**Total: 5-7 days.**

**Status:** OPEN. Paired with D11 — both land together in the build-arch redesign.

---

## Test environment

- **Temp folder:** `/tmp/graveyard-crew-e2e/`
- **Brief:** `/Users/kapilahuja/cto/builder/graveyard-crew/docs/project-brief.md` (copied into temp folder)
- **Pipeline commit under test:** `d1b9c60` (end of 214.7)
- **Plays exercised so far:** specify-product Stages 1-2 (market-brief, domain-selection)
- **Known pre-test finding (NOT a defect):** KB catalog does not cover Graveyard Crew's core domain (experimentation / agent-orchestration / metrics-and-scoring). Surfaced and reported before test began; requires catalog extension or pipeline fallback. See this commit's response for the 3-option analysis.
