# Three Elements of Intent: Verification Gates

## Gate 1: Schema Completeness (MANDATORY)

Every recipe SKILL.md must contain all three new fields in YAML front-matter.

| Check | Method | Pass Criteria |
|-------|--------|---------------|
| `intent` field exists | Parse YAML front-matter | Non-empty string |
| `constraints` field exists | Parse YAML front-matter | Non-empty list, at least 1 item |
| `failure_conditions` field exists | Parse YAML front-matter | Non-empty list, at least 1 item |

**Apply to:** All 4 recipes (`commit-code`, `create-pr`, `start-feature`, `start-planned-feature`)

## Gate 2: Intent Quality (MANDATORY)

Each `intent` field describes a business outcome, not a technical procedure.

| Rule | Anti-Pattern | Example |
|------|-------------|---------|
| No tool names | "Commit using git..." | "Safely persist completed work..." |
| No file paths | "Write to .phoenix-os/..." | "...with full traceability" |
| No HOW prescriptions | "by grouping changes and running..." | "...as conventional commits" |
| Single statement | Multiple sentences with different goals | One cohesive outcome |
| Self-evident testability | "Improve the commit process" | "Persist completed work with traceability to a tracked issue" |

**Method:** Manual review of each intent statement.

## Gate 3: Constraint Extraction Accuracy (MANDATORY)

Front-matter constraints must faithfully represent constraints already in the recipe body.

| Check | Method |
|-------|--------|
| No invented constraints | Every front-matter constraint traces to a body statement |
| No missing critical constraints | Grep body for MUST/NEVER/forbidden/maximum/always — all represented |
| No contradictions | Front-matter does not contradict workflow body |

**Apply to:** All 4 recipes. Side-by-side comparison required.

## Gate 4: Failure Condition Extraction Accuracy (MANDATORY)

Front-matter failure conditions must faithfully represent halt/abort conditions in the recipe body.

| Check | Method |
|-------|--------|
| No invented conditions | Every front-matter condition traces to a body halt/stop/abort |
| No missing critical halts | Grep body for REJECTED/halts/stops/cannot proceed — all represented |
| No contradictions | Front-matter does not contradict workflow body |

**Apply to:** All 4 recipes. Side-by-side comparison required.

## Gate 5: Backward Compatibility (MANDATORY)

No existing behavior changes. Only front-matter additions.

| Check | Method | Pass Criteria |
|-------|--------|---------------|
| `description` unchanged | Diff old vs new | Exact match |
| `name` unchanged | Diff old vs new | Exact match |
| `user-invocable` unchanged | Diff old vs new | Exact match |
| `model` unchanged | Diff old vs new | Exact match |
| `allowed-tools` unchanged | Diff old vs new | Exact match |
| No workflow body changes | Diff below `---` delimiter | Zero changes |
| Deployment succeeds | Run sync-claude --project | No errors |
| Recipe loads | Invoke recipe in Claude Code | No load errors |

## Gate 6: Documentation Updated (MANDATORY)

`phx-recipes.md` must include Three Elements in recipe structure templates.

| Check | Method |
|-------|--------|
| L1 template includes `intent`, `constraints`, `failure_conditions` | Read docs/components/phx-recipes.md |
| L2 template includes `intent`, `constraints`, `failure_conditions` | Read docs/components/phx-recipes.md |
| Three Elements requirement explained | Section exists referencing IDD philosophy |

## Gate 7: Philosophy Alignment (NON-MANDATORY)

IDD rules validation (lines 158-166 of intent-driven-development.md).

| Rule | Check |
|------|-------|
| Intent captures WHY/WHAT, never HOW | No implementation details in intent |
| Intent in business language | Accessible to non-technical stakeholders |
| Intent stable across implementation changes | Would survive a tech stack swap |
| All three elements present | Gates 1-4 cover this |
| Constraints are boundaries only humans know | Business decisions, not technical defaults |
| Failure conditions are halt signals | Risk appetite judgments |

## Gate 8: No Orphaned Constraints (NON-MANDATORY)

Recipe body does not contain significant constraints/conditions missing from front-matter.

**Method:** Grep each recipe body for:
- `MUST`, `NEVER`, `forbidden`, `required`
- `halt`, `stop`, `abort`, `cannot proceed`, `do not proceed`
- `maximum`, `always`, `checkpoint`

Cross-reference hits against front-matter lists. Flag any unrepresented items.
