# Play Analysis — garura-capture (rebuild for #266)

Generated: 2026-04-19T14:10:00Z
Mode: Rebake

## Summary

The existing SKILL.md at core/components/plays/garura-capture/SKILL.md is stale —
it is the moved report-issue compiled play (meridian:report-issue) and does not
reflect the new intent.yaml. A full rebuild is required.

The intent.yaml has been rewritten to reflect 4 new behaviors:
1. Multi-type support (feature, bug, defect, epic, enhancement) with inferred prefix/labels
2. Rename to garura:capture identity
3. Background dispatch (run_in_background: true) for gh filing
4. Crisp single-line confirmation

## Intent Summary

name: garura-capture
version: 1.1.0
constraints: C1-C9, Cbg, Cconf (11 total)
failure_conditions: F1-F7 (7 total)
scenarios: S1-S5 (5 total)

## Agent Map

| Agent | Domain | Skills Used |
|-------|--------|-------------|
| project-orchestrator | GitHub Issues: create | manage-issue (action: create) |

One domain agent. Utility: repo-orchestrator for evidence self-commit.

## Skill Contracts

manage-issue (core/components/skills/manage-issue/SKILL.md):
- action: create — takes title, body, labels; creates GitHub issue
- action: comment — takes issue_number, body; posts comment
- Skill is existing and valid

## Workflow Structure

Structure B (fast execution):
  Pre-flight → Execution → Confirmation → Evidence
  
The play has a single domain agent (project-orchestrator) doing gh issue create.
The background dispatch makes this a fire-and-forget pattern: play dispatches the
agent with run_in_background: true, writes tracking stub, immediately returns
single-line confirmation to caller.

## Constraint Classifications

| Constraint | Category | Rationale |
|------------|----------|-----------|
| C1 | pre-flight | Required fields check before domain work |
| C2 | pre-flight | Type validation/inference before domain work |
| C3 | pre-flight | Repo slug from config — environmental precondition |
| C4 | structural | Auto-date rule — process rule about generation |
| C5 | artifact-verifiable | Observable in issue body output artifact |
| C6 | artifact-verifiable | Observable in issue body (no empty optional sections) |
| C7 | structural | Fallback behavior on gh failure — process rule |
| C8 | artifact-verifiable | Observable in issue title prefix |
| C9 | artifact-verifiable | Observable in issue labels |
| Cbg | structural | Background dispatch — architectural/process rule |
| Cconf | artifact-verifiable | Observable in confirmation response |

## Coverage Gaps Identified

None at this stage — intent covers all 4 issue requirements.
The Cbg and Cconf constraints are new additions not in the original report-issue intent.

## Stale SKILL.md Delta

The old compiled play (meridian:report-issue):
- Single synchronous domain agent call
- Blocks on GH round-trip
- [DEF] hardcoded prefix
- defect hardcoded label
- Multi-line verbose confirmation

Required changes in rebuilt SKILL.md:
- Frontmatter: name garura:capture, new description
- Pre-flight: add type inference/validation (C2); remove severity-required check; add repo-slug from config (C3)
- Workflow: type-dispatch step, background dispatch with run_in_background: true
- Confirmation step: single-line output (Cconf)
- Agent boundary: project-orchestrator (background) + repo-orchestrator (utility)
