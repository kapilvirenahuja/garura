# Context Understanding — Issue #311 (reap)

Assembled: 2026-04-22
Purpose: Canonical reference for the reap play design step. Do NOT propose solutions here — only surfaces what exists, what is missing, and what tensions the design must resolve.

---

## 1. Existing capture-learning Anatomy

**Source files:**
- `core/components/plays/capture-learning/SKILL.md` (compiled play)
- `core/components/plays/capture-learning/reference/intent.yaml` (constraints C1–C16, failure conditions F1–F11, scenarios S1–S6)

### Phases

| Phase | Step(s) | Owner | What it does |
|-------|---------|-------|--------------|
| Pre-checks | 1 — Verify Issue Closed | project-orchestrator | Confirms issue state=CLOSED; halts if open |
| Reconciliation — Analyze | 2 (inline) + 3 | play + knowledge-extractor (ANALYZE mode) | Checks for check-drift output; runs diff-context-baseline → draft-enrichment-proposals; outputs reconciliation-proposals.yaml |
| Reconciliation — Checkpoint | 4 | play | Human reviews and approves/rejects proposals (Tether/Vanish) |
| Reconciliation — Write | 5 | knowledge-extractor (ENRICH mode) | apply-ltm-enrichment: writes ADRs (Tier 1), updates artifacts in place (Tier 2), creates new artifacts (Tier 3) |
| Archival | 6 | repo-orchestrator | archive-issue-stm skill: moves {stm_base}/{issue}/ → {stm_archive}/{YYYY-MM}/{issue}/ |
| Scenario Validation | 7 | play (inline) | SCE-1 through SCE-6 |
| Evidence & Close | 8 + 9 | play + repo-orchestrator | Write evidence file; self-commit |

### Key pre-flight inputs (`SKILL.md:40-58`)
```
stm_base      from .garura/core/config.yaml
stm_archive   from .garura/core/config.yaml
product_base  from .garura/core/config.yaml
issue         provided as input
{stm_base}/{issue}/         — must exist (hard halt if not)
{stm_base}/{issue}/context/ — must exist (C7 — prepare must have run)
```

### What reap inherits from capture-learning
Reap takes **Phase Pre-checks + Phase Reconciliation-Analyze + Evidence & Close** from capture-learning. Archival (Step 6) and ENRICH write (Step 5) are stripped out.

The issue state verification (Step 1) is listed in the refactoring map as going to reap. However, for a post-epic extraction-only play invoked manually post-validate (not necessarily post-close), this is a design tension to resolve (see Section 8).

---

## 2. knowledge-extractor Agent Contract

**Source file:** `core/components/agents/knowledge-extractor.md`

### Operating Modes

| Mode | Trigger | Input prerequisites | Output | Human gate |
|------|---------|---------------------|--------|------------|
| ANALYZE | capture-learning Step 3 / reap | context/ baseline + evidence_base + product_base | reconciliation-proposals.yaml | Yes (before ENRICH) |
| ENRICH | capture-learning Step 5 | Approved proposals.yaml | writes to product LTM | Yes (prior step) |
| FAST | distill (L1) | PR diff + issue STM | proposals.yaml (1–2 max) | No |

### ANALYZE Mode IO (`knowledge-extractor.md:63-69`)

**Input:**
```
context_base        — {stm_base}/{issue}/context/
evidence_base       — {stm_base}/{issue}/
product_base        — product LTM root
drift_manifest_path — {stm_base}/{issue}/evidence/check-drift/spec-correction-manifest.yaml (optional/null)
epic_id             — the epic ID this issue implemented
```

**Output:**
```
reconciliation-proposals.yaml — at {stm_base}/{issue}/evidence/capture-learning/reconciliation-proposals.yaml
```

### ANALYZE Mode: What It Reads

The agent reads context baseline sub-folders in a defined order (`knowledge-extractor.md:73-99`):
```
{context_base}/understanding/    — architecture-inference, dependency-graph, ltm-findings
{context_base}/blast-radius/     — change-surface, blast-radius, baseline-tests
{context_base}/design/           — tech.yaml, scenarios.yaml, plan.yaml (LOCKED)
{context_base}/design/           — epic-spec.yaml, architecture-context.yaml, quality-gates.yaml
```

Implementation outcomes read (`knowledge-extractor.md:95-106`):
```
{evidence_base}/milestones/*/    — milestone-verdict.yaml, status-report.yaml
{evidence_base}/evidence/        — e2e-results.yaml, judge-report*.yaml,
                                   arbiter-verdict*.yaml, quality-report.yaml
{evidence_base}/status/          — implement.json, validate.json
```

### Skill Pool (`knowledge-extractor.md:489-491`)

| Skill | When invoked | What it produces |
|-------|-------------|------------------|
| `diff-context-baseline` | ANALYZE Steps 4-6 | `context-diff.yaml` |
| `draft-enrichment-proposals` | ANALYZE Step 7 | `reconciliation-proposals.yaml` + `adr-drafts/*.md` |
| `apply-ltm-enrichment` | ENRICH mode | Writes to product LTM in place |

The agent is a context assembler — it does NOT author artifacts inline; all authorship is delegated to these three skills.

---

## 3. Tier Taxonomy — What Exists vs. What's Missing

### Existing tier system (MATURITY axis)

The tier system in capture-learning is a **maturity/stability axis** — it answers: *how foundational is the artifact being touched?*

| Tier | Name | Semantics | Target artifacts | Action |
|------|------|-----------|-----------------|--------|
| 1 | Foundational / check-only | LOCKED artifacts that SHOULD NOT change. If they did, an ADR is required. | project-profile, logical-architecture, physical-architecture, nfr-spec, quality-vision, design-patterns | ADR + impact assessment. Never silently update. |
| 2 | Enrichment | Existing artifacts that should be updated with implementation outcomes. | research/{domain}.md (Experiential), enriched-capabilities, scope/epics/{id}.yaml post_implementation, quality-profile, mvp-recommendation, scope.yaml | Update in place, format-matched. |
| 3 | Addition | New content with no existing LTM home. | New domains, new screens, new flows, new personas, new design spec sections | Propose creation at new path. |

Source: `capture-learning/reference/intent.yaml:50-65` (C6), `knowledge-extractor.md:119-226`.

### Partial category axis — `dimension` field in `diff-context-baseline`

`diff-context-baseline/SKILL.md:53` emits a `dimension` field per finding:
```yaml
dimension: architecture | libraries | patterns | invariants | quality | assumptions
```

This is a **6-value categorical axis on findings** — it partially expresses the "what kind of learning" question. However:

1. **Misaligned with the user's reframe.** The user's categories are: architecture / domain / tech / design-pattern. The existing `dimension` set has `libraries` and `invariants` instead of `domain` and `design-pattern` explicitly.

2. **Collapsed before proposals reach the reviewer.** `draft-enrichment-proposals/SKILL.md:41-62` shows the proposals schema — `dimension` is NOT carried through into `reconciliation-proposals.yaml`. The proposals schema has: `tier`, `target_path`, `action`, `change`, `impact`, `approval_status`. A viewer of proposals sees no categorical label for what *kind* of learning is being proposed.

3. **Not in distill's proposals.yaml either.** `distill/templates/proposals-output.md:29-50` shows the L1 schema uses `confidence` (not `dimension` or any category).

### The gap

The existing taxonomy answers: *how stable is the target artifact?* (Tier 1/2/3).
The user's reframe asks: *what type of learning is this?* (architecture / domain / tech / design-pattern).

These are orthogonal axes. A Tier 2 enrichment can be an architecture learning, a domain learning, a technology learning, or a design-pattern learning — the current system cannot distinguish them. **There is no learning-category field in the proposals schema today.**

---

## 4. LTM Structure — Where Proposals Would Target

### Core LTM (`~/.garura/core/memory/`)

```
~/.garura/core/memory/
├── knowledge/
│   ├── arch/
│   │   ├── agentic/          — agent-orchestration.md, llm-infrastructure.md, rag-*.md
│   │   ├── data/             — messaging-queues.md, nosql-*.md, relational.md, vector-databases.md
│   │   ├── operations/       — ci-cd.md, containerization.md, iac.md, observability.md, security-infrastructure.md
│   │   ├── patterns/         — cqrs-event-sourcing.md, event-driven.md, microservices.md, modular-monolith.md, serverless.md, frontend-component-orchestration.md, evolutionary-scaling.md
│   │   ├── platforms/        — aws.md, azure.md, gcp.md, railway-render.md, self-hosted.md, vercel.md
│   │   └── stacks/           — backend-{dotnet,go,java-spring,nodejs,python-fastapi}.md, frontend-{angular,react-nextjs,svelte,vue-nuxt}.md, mobile-{flutter,react-native}.md
│   ├── domain/               — commerce.md, payments.md, personalization.md, search.md, user-management.md, _cross-tree-constraints.yaml
│   ├── product/              — nfr-profile.md, product-profile.md, quality-profile.md
│   └── quality/              — architecture/, backend/, code/, data/, documentation/, frontend/, operations/, performance/, security/, tech-debt/, testing/ (subdirectory per quality dimension)
└── standards/
    ├── rules/                — architecture.md, commits.md, design.md, epics.md, feature-catalog.md, features.md, git.md, kb-extension.md, pr.md, product.md, resolution.md, scenarios.md
    ├── schemas/              — intent-epic.yaml, intent.yaml, mvp-recommendation.yaml, pr-findings.yaml, screen-inventory.yaml
    └── templates/            — approval-prompt.md, checkpoint.md, commit-message.md, delivery-report.md, evidence-file.md, feature-tree-output.md, github-issue.md, issue-comment-rca-approved.md, knowledge-file.md, pr-body.md, pr-review-comment.md
```

**Core LTM write rule:** capture-learning/reap NEVER writes to core LTM. See constraint C9 in `capture-learning/reference/intent.yaml:86-90`. Core LTM is global KB — it is enriched through a separate KB promotion process (not yet built).

### Product LTM (`.garura/product/`)

Product LTM exists for this project. The product base path is `.garura/product/` per `.garura/core/config.yaml:95`.

**What exists today:**
```
.garura/product/
├── research/        — agentic-methodology.md, ai-governance.md, engineering-experience.md, engineering-observability.md, work-intelligence.md
├── scope/           — features.yaml, enriched-capabilities.yaml, mvp-recommendation.md, scope.yaml, epics/*.yaml
├── specification/   — project-profile.yaml, quality-profile.yaml, domain-selection.yaml, market-brief.md
├── _checkpoints/
├── _evidence/
└── _status/
```

**What is MISSING today (knowledge-extractor Tier 1 target directory):**
```
.garura/product/architecture/  — DOES NOT EXIST
```

The Tier 1 target artifacts (`logical-architecture.yaml`, `physical-architecture.yaml`, `nfr-spec.yaml`, `quality-vision.yaml`, `design-patterns.yaml`) referenced in `knowledge-extractor.md:125-130` have no home on disk. This means:
- Tier 1 foundational checks would be entirely skipped (constraint C13: missing tiers skipped with warning)
- Architecture learnings from the user's reframe (ADR-worthy decisions, architectural deviations) have no Tier 1 targets today

Source confirmation: `has_product_ltm: false` in the contract reflects the `ltm_context.has_product_ltm` flag — this means no *product-level* LTM was expected in this specific invocation context, consistent with the architecture directory being absent.

**The Experiential write target for Tier 2 proposals** — `research/{domain}.md` files — DO exist and carry the `### Experiential` section per `kb-extension.md` (`~/.garura/core/memory/standards/rules/kb-extension.md:89-108`).

---

## 5. Build Trinity Input Contracts

Reap reads **what the three plays produce as canonical evidence**. Here are the exact paths.

### prepare — context baseline (`prepare/SKILL.md:79-95`)

```
{stm_base}/{issue}/context/
├── understanding/
│   └── architecture-inference, dependency-graph, ltm-findings (files)
├── blast-radius/
│   └── change-surface, blast-radius, baseline-tests (files)
├── design/
│   ├── tech.yaml          (LOCKED — LLD: API contracts, internal interfaces, etc.)
│   ├── scenarios.yaml     (LOCKED — 3-tier verification scenarios)
│   ├── plan.yaml          (LOCKED — task DAG with milestone_ids)
│   ├── epic-spec.yaml
│   ├── architecture-context.yaml
│   └── quality-gates.yaml
└── briefs/                (HTML checkpoint briefs — not used by reap)
```

Evidence from prepare:
```
{stm_base}/{issue}/evidence/prepare/
```

### implement — per-milestone evidence (`implement/SKILL.md:123`)

```
{stm_base}/{issue}/evidence/implement/{milestone_id}/
├── status-report-{scope_item_id}-cycle-{N}.yaml
├── fix-report-{scope_item_id}-cycle-{N}.yaml
├── arbiter-verdict-{scope_item_id}-{contract_ref}.yaml
├── quality-report-{milestone_id}.yaml
├── judge-report-{milestone_id}.yaml
└── test-files-manifest.yaml

{stm_base}/{issue}/milestones/{milestone_id}/
└── status-report.yaml    (milestone COMPLETE/FAIL)
```

### validate — per-milestone QA evidence (`validate/SKILL.md:117`)

```
{stm_base}/{issue}/evidence/validate/{milestone_id}/
├── milestone-scenarios.yaml
├── e2e-test-manifest.yaml
├── e2e-results.yaml
├── judge-report.yaml
├── manual-test-scenarios.md
└── traces/               (screenshots, traces, response bodies)

{stm_base}/{issue}/milestones/{milestone_id}/
└── milestone-verdict.yaml   (ACCEPT/REJECT per milestone)
```

### Summary: what reap passes to knowledge-extractor ANALYZE mode

```yaml
context_base: "{stm_base}/{issue}/context/"              # from prepare
evidence_base: "{stm_base}/{issue}/"                     # root for implement+validate evidence
product_base:  "{product_base}"                          # product LTM root from config
drift_manifest_path: "{stm_base}/{issue}/evidence/check-drift/spec-correction-manifest.yaml or null"
epic_id: "{from context/design/epic-spec.yaml}"
```

---

## 6. distill Proposals Schema — Cross-L1/L2/L3 Alignment

### L1 (distill) proposals schema (`distill/templates/proposals-output.md:12-55`)

```yaml
issue: "{issue number}"
pr_number: "{PR number}"
analyzed_at: "{ISO-8601}"
no_learnings: false
source: "distill"
stm_evidence_used: false
total_proposals: 1          # hard cap: 2

proposals:
  - target_path: "{product LTM artifact path}"
    section: "{section within target artifact}"
    proposed_content: |
      {content in format of target artifact}
    evidence_diff_reference: "{where in diff this came from}"
    confidence: "low | medium | high"
```

### L2 (capture-learning / reap) reconciliation-proposals schema (`draft-enrichment-proposals/SKILL.md:41-62`)

```yaml
sourced_from: "{context_diff_path}"
generated_at: "{ISO-8601}"
proposals:
  - proposal_id: P-001
    from_finding: F-001        # links back to context-diff.yaml finding
    tier: 1 | 2 | 3
    target_path: "{LTM artifact path}"
    action: modify | add | contradict_with_adr
    change: |
      {block or diff}
    impact:
      downstream_artifacts: [...]
      plays_affected: [...]
      risk: low | medium | high
    adr_draft_path: "{path, Tier 1 only}"
    approval_status: pending
summary:
  tier_1: {n}
  tier_2: {n}
  tier_3: {n}
```

### Schema divergence — the tension

The two schemas share `target_path` and `approval_status` (implied). However:

| Field | L1 (distill) | L2 (reap) |
|-------|-------------|----------|
| Confidence | `confidence: low/medium/high` | absent |
| Tier | absent | `tier: 1/2/3` |
| Change block | `proposed_content` | `change` |
| Evidence link | `evidence_diff_reference` | `from_finding` (points to context-diff.yaml) |
| ADR draft | absent | `adr_draft_path` |
| Impact | absent | `impact.downstream_artifacts`, `impact.plays_affected`, `impact.risk` |
| Source marker | `source: "distill"` | `sourced_from: "{context_diff_path}"` |

The `distill` skill explicitly states (constraint 5): *"Proposals format forward-compatible with Mode 2. Use the same top-level keys as Mode 2's reconciliation-proposals.yaml"* — but the schemas diverged in execution. The shared top-level keys are `issue`, `analyzed_at`, `total_proposals`, `proposals[]` only.

The `enrich` play (future, separate issue) will need to consume proposals from both L1 and L2 sources. Whether they unify on a single schema or `enrich` normalizes on ingestion is unresolved — this is a design tension reap's intent must address or explicitly defer.

---

## 7. /create-play Workflow Notes

**Source:** `core/components/plays/create-play/SKILL.md`

### The compilation pipeline

```
intent.yaml (authored) → /create-play --build {play-name} → compiled SKILL.md
```

New play directory must contain:
```
core/components/plays/{play-name}/
├── SKILL.md              (compiled — DO NOT EDIT MANUALLY)
└── reference/
    └── intent.yaml       (source of truth — edit here)
```

### What /create-play produces (`create-play/SKILL.md:333-351`)

The compiled SKILL.md must have ALL of these sections:
- Frontmatter (name, description, user-invokable)
- Header (operational description)
- Compiled From (notice + intent hash guard)
- Role + Agent Boundaries table
- Pre-flight (checks with constraint IDs, bash logic, resume check)
- Task DAG (TaskCreate for every step with blockedBy)
- Workflow (sequential steps by phase, JSON contracts per ADR 016, step evals)
- Scenario Validation
- Evidence & Close (write evidence + self-commit per ADR 012, non-blocking)
- Pause and Resume (status file at `{stm_base}/{issue}/status/{play-name}.json`)
- Compilation Metadata (intent_hash, compiled_by, compiled_at, workflow_structure, agent counts, eval counts)

### Gate before compilation (`create-play/SKILL.md:15-17`)

A play is compilable only when intent.yaml defines — at minimum:
- At least 1 constraint with id and rule
- At least 1 failure condition with id and condition
- At least 1 scenario with id, persona, given, then

### Intent hash guard

After compile, SKILL.md includes:
```
If sha256(reference/intent.yaml) does not equal {hash}, rebuild is required before running.
```

### Workflow structures available (`create-play/SKILL.md:240-265`)

| Structure | Pattern | When |
|-----------|---------|------|
| A | Pre-flight → Preparation → Checkpoint (skippable) → Execution → Evidence | Multiple agents, confidence-gated review |
| B | Pre-flight → Execution → Approval → Evidence | Simpler, single-agent, low-risk |
| C | Pre-flight → Play-1 → STM handoff → Play-2 → ... → Evidence | Composing existing plays |
| Readiness-only | Pre-flight → Preparation → Scenario Validation → Evidence | Analysis-only, no generation |

Reap is extraction-only (reads trinity, produces proposals to STM) — likely Structure A or readiness-only depending on whether a human checkpoint is compiled in.

### Evidence self-commit (`create-play/SKILL.md:347`)

Compiled plays include an Evidence & Close phase with repo-orchestrator self-commit, non-blocking. This matches discovery.md decision: "Evidence self-commit via repo-orchestrator."

### STM status file

Per Pause and Resume, reap will write:
```
{stm_base}/{issue}/status/reap.json
```

---

## 8. STM Folder Whitelist Confirmation

**Source:** `.garura/core/config.yaml:49-58` (ADR 017), MEMORY rule `feedback_garura_folder_structure.md`

Permitted STM subfolders per config `stm.structure`:
```
{issue}/specs/
{issue}/evidence/{play-name}/
{issue}/checkpoint/{play-name}/
{issue}/context/
{issue}/review/
```

The reap output path `{stm_base}/{issue}/evidence/reap/proposals.yaml` is **permitted** — it is under `evidence/{play-name}/` whitelist entry.

The distill output path `{stm_base}/{issue}/evidence/distill/proposals.yaml` follows the same pattern — confirmed permitted by existing production use.

---

## 9. Identified Gaps and Design Tensions

### Gap 1 — No learning-category field in proposals schema

**What exists:** Tier 1/2/3 = maturity axis (is the artifact foundational, enrichable, or missing?).
**Partial:** `diff-context-baseline` emits `dimension: architecture | libraries | patterns | invariants | quality | assumptions` per finding, but this field is dropped before reaching `reconciliation-proposals.yaml`.
**What the reframe requires:** Each proposal must carry a learning category (architecture / domain / tech / design-pattern) so `enrich` can route proposals to appropriate KB sections and so humans reviewing proposals can understand *what type* of learning is being captured.
**The question reap's design must answer:** Does reap extend the proposals schema with a `learning_category` field? If so, does it flow through the existing skill chain (`diff-context-baseline` → `draft-enrichment-proposals`) or does reap need a different skill that emits category-aware proposals?

### Gap 2 — Tier 1 targets do not exist in product LTM

**What exists:** `.garura/product/architecture/` directory is absent. All five Tier 1 target artifacts (logical-architecture.yaml, physical-architecture.yaml, nfr-spec.yaml, quality-vision.yaml, design-patterns.yaml) have no on-disk home.
**Consequence:** Constraint C13 (missing tiers skipped with warning) means Tier 1 checks will be entirely skipped for this project today. Architecture learnings (ADR-worthy decisions, deviations from locked architecture) have no Tier 1 target.
**The question reap's design must answer:** Does reap's pre-flight still require architecture artifacts, or does it accept their absence gracefully (C13-style skip)? Does reap produce architecture category proposals to a *proposed new* path even if the architecture artifacts don't exist yet?

### Gap 3 — Issue-closed constraint vs. post-validate invocation timing

**From capture-learning:** C1 and Step 1 require the issue to be in CLOSED state before any work. `project-orchestrator` verifies via GitHub.
**From discovery.md:** reap is "post-epic" — manual invocation after validate completes. The issue need not be closed to run extraction; archival (which required close) is moved to `archive-issue-stm` as a separate step.
**The question reap's design must answer:** Does reap require issue-closed (C1 equivalent), or does it allow extraction while the issue is still open? The discovery refactoring map assigns the "Verify issue state" pre-check to reap — but its purpose in the original context was gating archival, not extraction.

### Gap 4 — proposals.yaml schema divergence across L1/L2/L3

**What exists:** distill (L1) and reap (L2) produce structurally different proposals.yaml files. The key divergences are: confidence (L1) vs. tier (L2); proposed_content (L1) vs. change (L2); evidence_diff_reference (L1) vs. from_finding (L2).
**Downstream implication:** `enrich` play will need to consume both. This requires either schema unification now (reap aligns with distill, or distill aligns with reap) or enrich carrying a normalization layer.
**The question reap's design must answer:** Does reap produce proposals in the distill schema, the reconciliation schema, or a new unified schema? The distill constraint 5 already declares forward-compatibility intent — but the schemas have already drifted.

### Gap 5 — drift manifest consumption

**From capture-learning:** Step 2 checks for `{stm_base}/{issue}/evidence/check-drift/spec-correction-manifest.yaml` (C8). If present, findings are imported as pre-classified proposals with `source: check-drift`.
**For reap:** The check-drift play exists (`core/components/plays/check-drift/`). reap inherits the ANALYZE phase from capture-learning — including C8. Whether reap preserves this optional integration or removes it is unresolved.

### Gap 6 — ANALYZE mode was designed around product LTM reads

**What exists:** knowledge-extractor ANALYZE mode's Tier 2 analysis (Step 5 in `knowledge-extractor.md:162-206`) reads `research/{domain}.md` Experiential sections from *product LTM* and proposes enrichments to them. The Tier 3 analysis (Step 6) checks against `domain-selection.yaml`, `experience/screens/`, `experience/flows/`, `personas.md` — all product LTM artifacts.
**Reframe implication:** The user's reframe shifts extraction from "what changed vs. LTM?" to "what was missing from LTM all along?" This is a subtle but important semantic shift. The existing ANALYZE mode asks "did implementation deviate from or extend what we had?" The reframe asks "what architecture/domain/tech/design-pattern gap did this epic reveal?" These may produce different proposals.
**The question reap's design must answer:** Does reap reuse knowledge-extractor ANALYZE mode as-is, or does it need to extend/replace the analysis logic to surface category-level gaps rather than diff-level enrichments?

### Gap 7 — Mode labeling and three-mode mapping

The three learning pipeline levels map to knowledge-extractor modes:
- FAST mode → distill play (L1, post-PR, lightweight)
- ANALYZE mode → reap play (L2, post-epic, full trinity read) — **this issue**
- ENRICH mode → enrich play (separate issue, LTM write boundary)

This three-way split is architecturally clean. However, the current knowledge-extractor agent definition (`knowledge-extractor.md:1-6`) describes ANALYZE+ENRICH as the "full reconciliation cycle." After reap is built, the agent's description needs updating to reflect that ANALYZE feeds reap (STM only) and ENRICH feeds enrich (LTM write) as separate plays.
