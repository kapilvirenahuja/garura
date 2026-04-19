# Delivery Report Template

Canonical shape for the human-readable terminal report a play presents to the user at close. This is the user-facing output, not the machine-readable STM evidence file (see `templates/evidence-file.md` for that).

Consumers: `ship`, `fix-it`, `implement-epic`, every play that closes with a delivery step.

## Shape

```markdown
## {Play Name} Delivered — {context}

### Run Summary

| Field | Value |
|-------|-------|
| Play | {play-name} |
| Issue | #{issue} |
| Status | {COMPLETE \| PARTIAL \| FAILED} |
| Started | {ISO-8601 timestamp} |
| Completed | {ISO-8601 timestamp} |

### Pipeline Steps

| Step | Description | Status | Key Output |
|------|-------------|--------|------------|
| {n} | {step description} | {PASS/FAIL/SKIP} | {primary artifact or action taken} |

### Artifacts Produced

| Artifact | Path | Notes |
|----------|------|-------|
| {artifact name} | {path} | {description or status} |

### Next Steps

{Optional free-form section. Include only when there are follow-on actions for the user or downstream plays. Omit if play is fully self-contained.}
```

## Field Rules

| Field | Required | Rule |
|-------|----------|------|
| `play` | yes | Exact play slug (e.g. `ship`, `fix-it`, `implement-epic`). |
| `issue` | yes | Issue number. Required for all project-scoped plays. |
| `status` | yes | `COMPLETE` when all steps passed; `PARTIAL` when some steps skipped by configuration; `FAILED` when a step halted. |
| `started` / `completed` | yes | ISO-8601 timestamps. |
| `pipeline_steps` table | yes | At least one row per major step executed. Status: `PASS`, `FAIL`, or `SKIP`. |
| `artifacts` table | no | Include when the play produces named artifacts (evidence files, PRs, SHAs). |
| `next_steps` | no | Optional. Use when there are explicit follow-on actions (e.g., "Run validate-epic after implement-epic"). |

## Per-Play Notes

### ship
Include in Pipeline Steps: commit, PR creation, review-pr (if run), merge, distill.
Include in Artifacts: PR URL, merge SHA, branch deletion status, distill output.

### fix-it
Include in Pipeline Steps: RCA, design, approval gate, implement, quality check, PR, merge.
Include in Artifacts: PR URL, merge SHA, branch deletion status, issue comment dispatch status.
Add to Run Summary: Root Cause (summary), Fix Strategy (summary).

### implement-epic
Include in Pipeline Steps: context build, eval generation, test authoring, code authoring, quality audit.
Include in Artifacts: quality report, judge report, status report.
Add to Run Summary: Milestone, Scope Items count, Quality status, Judge pass rate.

## Related

- `templates/evidence-file.md` — machine-readable STM evidence file (distinct from this human-facing report)
- `templates/checkpoint.md` — checkpoint artifact written at each approval gate during the run
