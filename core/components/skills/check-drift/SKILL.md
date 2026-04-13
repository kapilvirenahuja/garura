---
name: check-drift
description: "Analyze implementation drift against locked specs — compares what was built vs what was specified. Produces drift report, ADRs, debt catalog, memory items, and actionable recommendations. Use when checking for spec drift, tech drift, alignment issues, spec mismatches, or implementation review. Trigger on: 'check for drift', 'spec drift', 'tech drift', 'specs mismatch', 'spec review', 'alignment check', 'what drifted', 'implementation review'."
---

# check-drift

Compares what was actually built against what was specified in locked design artifacts. Identifies three types of drift (context, spec, technology), extracts architecture decisions, catalogs technical debt, surfaces learnings for long-term memory, and produces actionable recommendations for both spec updates and code changes.

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

### From `.meridian/product/` (specs)
- `discovery/product.yaml` — problem statement, users, strategic goals
- `architecture/architecture.yaml` — architecture and tech decisions
- `architecture/quality-standards.yaml` — quality standards and debt baseline
- `roadmap/epics.yaml` — epic definition with success scenarios and failure conditions
- `roadmap/features.yaml` — feature behaviors and invariants

### From `.meridian/project/issues/{issue}/` (STM)
- `CONTEXT.md` — scoped implementation context
- `evidence/implement-epic/` — judge reports, quality reports, defect logs, remediation logs
- `status/` — play execution state

### From LTM (if available)
- `core/components/memory/knowledge/` — existing architecture knowledge
- `core/components/memory/standards/` — existing standards

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
- **spec-drift**: Product spec / tech approach / LLD says X, implementation does Y (behaviors, schema, architecture)
- **technology-drift**: Tech stack, tools, libraries, or patterns changed from what was specified

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

### Step 7: Validate

Re-read the drift report. For each drift:
- Is the RCA correct, or is there a deeper cause?
- Did you miss any drifts?
- Are the recommendations actionable?

## Output

Write all outputs to `{stm_base}/{issue}/evidence/check-drift/` with timestamp prefix.

### Files produced:

1. **`drift-report.md`** — all drifts with RCA and recommendations
2. **`adrs.md`** — architecture decision records
3. **`debt-catalog.md`** — technical debt with blast radius
4. **`memory-items.md`** — learnings for LTM promotion
5. **`recommendations.md`** — spec changes + code changes in executable units

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

- Does not modify any files (read-only analysis)
- Does not update specs (produces recommendations, human decides)
- Does not fix code (produces recommendations, human or builder executes)
- Does not run the full project — always scoped to a specific implementation unit
- Does not replace the judge or quality-auditor — those validate correctness, this validates alignment
