---
name: check-drift
description: "Analyze implementation drift against locked specs — compares what was built vs what was specified. Produces drift report, ADRs, debt catalog, memory items, and actionable recommendations. Use when checking for spec drift, tech drift, alignment issues, spec mismatches, or implementation review. Trigger on: 'check for drift', 'spec drift', 'tech drift', 'specs mismatch', 'spec review', 'alignment check', 'what drifted', 'implementation review'."
---

# check-drift

Compares what was actually built against what was specified in locked design artifacts. Identifies five types of drift (context, spec, technology, design, evidence), extracts architecture decisions, catalogs technical debt, surfaces learnings for long-term memory, produces actionable recommendations for both spec updates and code changes, and generates a spec-correction-manifest for human-reviewed write-back to product LTM.

This is not an audit of the entire project — it is scoped to a specific implementation unit (an epic, a feature branch, or an issue). If scope is ambiguous, ask.

## When This Runs

- Mid-implementation: developer wants to check alignment before shipping
- Post-implementation: after an epic completes, before merging
- Ad-hoc: reviewing an older implementation for accumulated drift
- Pre-planning: before starting the next epic, check if specs are still accurate

## Scope Resolution

The skill needs a clear scope boundary. Resolve in this order:

1. **Branch context** — if on a feature branch (e.g., `feature/3-setup-run-first-experiment`), extract the issue number. Scope = that issue's implementation.
2. **Explicit issue** — if the user provides `--issue N` or references an issue, use that.
3. **Explicit epic** — if the user says "check drift for E2", scope to that epic.
4. **Ask** — if none of the above, ask: "What's the scope? An issue number, epic ID, or branch name?"

Do NOT run a full-project drift check. Always scope to a specific implementation unit.

## Inputs

Once scope is resolved, gather these automatically:

### From the codebase
- `git log` for the branch (commits, what changed)
- `git diff main..HEAD` or `git diff` for uncommitted changes
- All implementation files touched by the branch

### From `.garura/product/` (product-level specs — SECONDARY source)

Resolve `product_base` from `.garura/core/config.yaml` → `product.base-path`.

- `{product_base}specification/quality-profile.yaml` — quality standards, NFR targets
- `{product_base}specification/market-brief.md` — problem statement, users, strategic goals
- `{product_base}scope/scope.yaml` — capability scope and feature inventory
- `{product_base}scope/epics/{epic_id}.yaml` — epic definition with behaviors and failure conditions
- `{product_base}architecture/logical-architecture.yaml` — bounded contexts, component responsibilities
- `{product_base}architecture/physical-architecture.yaml` — technology stack, deployment topology
- `{product_base}architecture/nfr-spec.yaml` — NFR contracts with verification methods
- `{product_base}architecture/quality-vision.yaml` — quality vision per ISO 25010 characteristic
- `{product_base}architecture/design-patterns.yaml` — pattern catalog applied to this product

### From locked design artifacts (prepare STM) — PRIMARY spec source

When locked design artifacts from prepare exist, they are the most authoritative "what was specified" source. Resolved from `stm_base` + issue number:

- `{stm_base}/{issue}/context/design/tech.yaml` — locked LLD: all API contracts, internal interfaces, frontend/backend/data specs, mock strategy (STATUS: LOCKED)
- `{stm_base}/{issue}/context/design/scenarios.yaml` — locked 3-tier verification scenarios: baseline, new, regression
- `{stm_base}/{issue}/context/design/plan.yaml` — locked task DAG: milestones, scope items, exit gates, spec_refs to tech.yaml
- `{stm_base}/{issue}/context/design/epic-spec.yaml` — scoped epic specification with behaviors, constraints, success/failure scenarios
- `{stm_base}/{issue}/context/design/architecture-context.yaml` — scoped architecture context for this issue

### From implement evidence

- `{stm_base}/{issue}/evidence/implement/arbiter-verdict-*.yaml` — judge-as-arbiter verdicts; `spec_ambiguous` = direct spec gap signal
- `{stm_base}/{issue}/evidence/implement/status-report-*.yaml` — per-scope-item pass/fail mapped to tech.yaml contract IDs
- `{stm_base}/{issue}/evidence/implement/fix-report-*.yaml` — what broke and how it was fixed
- `{stm_base}/{issue}/milestones/{milestone_id}/status-report.yaml` — milestone completion status

### From validate evidence

- `{stm_base}/{issue}/milestones/{milestone_id}/milestone-verdict.yaml` — per-milestone QA verdict (ACCEPT/REJECT) with e2e results
- `{stm_base}/{issue}/evidence/validate/{milestone_id}/e2e-results.yaml` — E2E test results by tier (baseline, new, regression)
- `{stm_base}/{issue}/evidence/validate/{milestone_id}/judge-report.yaml` — system-level judge evaluation results

### From `.garura/project/issues/{issue}/` (STM)
- `{stm_base}/{issue}/milestones/{milestone_id}/CONTEXT.md` — per-milestone implementation context derived from tech.yaml
- `{stm_base}/{issue}/evidence/` — all play evidence subdirectories

### From LTM (if available)
- `~/.garura/core/memory/knowledge/` — existing architecture knowledge (deployed path)
- `~/.garura/core/memory/standards/` — existing standards (deployed path)

## Process

### Step 1: Gather and Map

Read all input files. Build a mapping:

| What was specified | Where it's specified | What was built | Where it's built |
|---|---|---|---|
| "Vercel deployment" | technical-approach.md §2.1 | Cloud Run | Dockerfile, cloudbuild.yaml |
| "streaming LLM calls" | technical-approach.md §6.3 | non-streaming | lib/agents/analyst.ts |

This mapping is the foundation for all four outputs.

### Step 2: Identify Drifts

Compare each mapping row. A drift exists when the specification and implementation diverge. Classify each drift:

- **context-drift**: CONTEXT.md says X, implementation does Y (scope, files, rules changed)
- **spec-drift**: Product spec (scope/, specification/, architecture/) says X, implementation does Y (behaviors, schema, architecture)
- **technology-drift**: Tech stack, tools, libraries, or patterns changed from what was specified
- **design-drift**: Locked design artifact (tech.yaml, scenarios.yaml, plan.yaml) says X, implementation does Y. This is LLD-vs-implementation divergence — the most precise drift type because locked design artifacts contain interface contracts with field-level specificity
- **evidence-drift**: Arbiter verdict is `spec_ambiguous`, OR milestone-verdict is REJECT with root cause traceable to spec ambiguity rather than implementation error. These are signals that the spec did not clearly specify the behavior

### Step 3: Extract ADRs

For each drift that represents a deliberate decision (not a bug), create an ADR. Use the template in `references/templates.md`.

### Step 4: Catalog Debt

For each gap, shortcut, or known issue, create a debt item. Classify as accepted (deliberate) or forced (constraint-driven). Assess blast radius. Use the template in `references/templates.md`.

### Step 5: Surface Memory Items

For each generalizable learning (not project-specific config), create a memory item. These should be promotable to LTM at `core/components/memory/knowledge/`. Use the template in `references/templates.md`.

### Step 6: Generate Recommendations

Produce two recommendation lists:

**Spec recommendations** — what needs to change in the locked artifacts:
```
REC-SPEC-[ID]: [Title]
Artifact: [which file to update]
Section: [which section]
Change: [what to change — specific enough to execute]
Priority: P0 (blocks next epic) | P1 (should fix soon) | P2 (cosmetic)
```

**Code recommendations** — what needs to change in the implementation:
```
REC-CODE-[ID]: [Title]
Files: [which files to change]
Change: [what to change]
Priority: P0 | P1 | P2
Effort: S | M | L
```

### Step 7: Write-back to product LTM

After generating recommendations, produce write-back artifacts. This step is additive-only — no existing locked files are ever modified.

**7a — spec-correction-manifest.yaml** (always produced, even if empty)
Path: `{stm_base}/{issue}/evidence/check-drift/spec-correction-manifest.yaml`

For each REC-SPEC recommendation, produce a structured correction entry:

```yaml
spec_correction_manifest:
  generated_at: "{ISO-8601 timestamp}"
  issue: "{issue number}"
  scope: "{branch or epic ID}"
  corrections:
    - id: SC-{N}
      source_drift: "DRIFT-{ID}"
      target_artifact: "{exact file path in product_base or stm/context/design}"
      target_section: "{section name or field path}"
      current_text: "{verbatim current text or section reference}"
      proposed_change: "{specific proposed correction}"
      priority: P0 | P1 | P2
      human_review_required: true
  summary:
    total_corrections: {count}
    by_artifact: {artifact_path: count}
    note: "{justification if no corrections — what was examined, why none found}"
```

This manifest is NEVER auto-applied. Human reviews and applies corrections.

**7b — New ADR files** (for design-drift with accepted classification)
For each design-drift item classified as `accepted` (deliberate decision), write a new ADR file:
Path: `{product_base}architecture/adr-{YYMMDD}-{slug}.md`
Format: standard ADR template from `references/templates.md`. NEVER overwrite existing ADR files.

**7c — Debt items** (for forced-debt design-drift)
For each design-drift classified as `forced`, append to:
Path: `{product_base}_evidence/debt-catalog-{issue}.md`
This is a new file in the `_evidence/` directory, never modifying existing debt files.

### Step 8: Validate

Re-read the drift report. For each drift:
- Is the RCA correct, or is there a deeper cause?
- Did you miss any drifts?
- Are the recommendations actionable?
- Does every design-drift and evidence-drift item have a corresponding entry in spec-correction-manifest.yaml?

## Output

Write all outputs to `{stm_base}/{issue}/evidence/check-drift/` with timestamp prefix.

### Files produced:

1. **`drift-report.md`** — all drifts (5 types) with RCA and recommendations
2. **`adrs.md`** — architecture decision records
3. **`debt-catalog.md`** — technical debt with blast radius
4. **`memory-items.md`** — learnings for LTM promotion
5. **`recommendations.md`** — spec changes + code changes in executable units
6. **`spec-correction-manifest.yaml`** — structured spec correction proposals for human review (always present, may be empty with justification)

### Summary presented to user:

```markdown
## Drift Check: {scope}

**Drifts found:** {N} ({critical} critical, {high} high, {medium} medium, {low} low)
**ADRs extracted:** {N} ({provisional} need decisions)
**Debt items:** {N} ({accepted} accepted, {forced} forced)
**Memory items:** {N} for LTM promotion
**Recommendations:** {N} spec changes, {N} code changes

### Critical Items Requiring Decisions
{list of provisional ADRs and critical drifts}

### Blocking Next Epic
{list of P0 recommendations}
```

## What This Skill Does NOT Do

- Does not overwrite or modify existing locked artifacts — spec corrections go to spec-correction-manifest.yaml for human review before application
- New ADR files for accepted design decisions are written additively as new files (never overwriting existing ADRs)
- Does not fix code (produces recommendations, human or builder executes)
- Does not run the full project — always scoped to a specific implementation unit
- Does not replace the judge or quality-auditor — those validate correctness, this validates alignment
