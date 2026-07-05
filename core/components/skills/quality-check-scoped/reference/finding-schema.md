# Finding Schema — quality-check-scoped

## File: `findings.yaml`

```yaml
meta:
  generated_at: "2026-04-13T19:30:00+05:30"
  diff_path: ".garura/project/issues/208/evidence/review-pr/diff.patch"
  changed_paths_count: 12
  scan_coverage: 0.83
  taxonomy_path: "./core/components/memory/standards/rules/pr.md"
  standards_relevant: 7
  catchall:            # catch-all rules rolled into a count, not per-file findings (#454)
    CODE-20: 12
  errors: []           # taxonomy rows that failed to compile (FS-5); absent/empty when clean

findings:
  - standard_id: SEC-19
    severity: P1
    file: src/config/secrets.ts
    line: 14
    evidence: 'const apiKey = "sk_live_abc123..."'
    artifact_type: runtime-code
    taxonomy_rule_id: SEC-19

counts:
  P1: 1
  P2: 0
  P3: 2
  P4: 0
```

## Field rules

| Field | Required | Constraint |
|---|---|---|
| `standard_id` | yes | MUST exist as a row in `pr-severity-taxonomy.md`. **F3 enforcement.** |
| `severity` | yes | Read from taxonomy. Never inferred. |
| `file` | yes | MUST be a member of `changed_paths` |
| `line` | yes | Integer. Line within the diff hunk. |
| `evidence` | yes | Matched substring (`grep:`) or matched path (`path:`). Never empty. |
| `artifact_type` | yes | From the taxonomy's Artifact-Type Scoping table (#438). A grep-rule finding is valid only on `runtime-code`, `deployable-config`, or `tests`. |
| `taxonomy_rule_id` | yes | Equal to `standard_id` |

## Meta fields

| Field | Required | Constraint |
|---|---|---|
| `meta.catchall` | yes | Object keyed by `standard_id` → count of changed files a catch-all rule (`CODE-20`, `path:**/*`) covered. Recorded as a count, never per-file findings (#454). |
| `meta.errors` | no | List of `{standard_id, error}` for taxonomy rows that failed to compile (FS-5). Absent or empty when the taxonomy is clean. |

## Sort order

`severity asc → file asc → line asc → standard_id asc`

This ordering is required for determinism (V2). Two runs on the same input produce a byte-identical `findings.yaml` (modulo `meta.generated_at`).

## Rejection rules

- Missing `standard_id` → drop finding, log error to STM evidence (`F3`).
- Missing `evidence` → drop finding, log warning.
- `severity` not in `{P1,P2,P3,P4}` → drop finding, log error.
- `file` not in `changed_paths` → drop finding, log error (diff scope invariant breach).
- grep-rule finding with `artifact_type` outside `{runtime-code, deployable-config, tests}` → drop finding, log error (#438 artifact-type scoping).
