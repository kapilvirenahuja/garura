---
name: certify-qp-compliance
description: Produce em-certification.yaml by comparing actual quality measurements (from quality-auditor) against declared Quality Profile thresholds. Outputs per-dimension CERTIFIED or BLOCKED verdicts plus an overall verdict.
user-invocable: false
model: sonnet
allowed-tools: Read, Write
deprecated: true
deprecated_note: '#434 ProductOS realignment — superseded by the command model; retained for Phase E reference, not installed'
---

# certify-qp-compliance

Model-invocable skill for Quality Profile (QP) compliance certification.

## Purpose

The engineering-manager agent owns QP certification decisions. This skill performs the mechanical comparison — reading measured values from the quality-auditor's report and declared thresholds from quality-standards.yaml, translating QP levels to concrete thresholds via the QP Translation Table, and writing a per-dimension verdict.

The agent picks WHEN to certify. This skill does HOW.

## Input

| Field | Required | Description |
|-------|----------|-------------|
| `quality_standards_path` | yes | Path to `quality-standards.yaml` with declared QP levels per dimension |
| `quality_report_path` | yes | Path to quality-auditor's `quality-report.yaml` with actual measurements |
| `qp_translation_table_path` | optional | Path to QP Translation Table (defaults to core LTM `standards/quality-profile-translation.md`) |
| `output_base` | yes | Directory to write `em-certification.yaml` into |

## Process

1. **Load QP declaration.** Read `quality-standards.yaml`. Extract declared level per QP dimension (QP-1 coverage, QP-2 complexity, QP-3 documentation, QP-7 security). QP-4, QP-5, QP-6 are deployment-time concerns — record as `N/A`.

2. **Load QP Translation Table.** For every declared level, translate into a concrete threshold (e.g., `QP-1: L2` → `coverage >= 80%`).

3. **Load measurements.** Read `quality-report.yaml`. Extract actuals for each dimension.

4. **Compare per dimension.** For each of QP-1, QP-2, QP-3, QP-7:
   - `actual` meets-or-exceeds `target` → `CERTIFIED`
   - `actual` misses `target` → `BLOCKED` + record gap
   - measurement missing → `BLOCKED` + record `missing_measurement`

5. **Aggregate overall verdict.** If every applicable dimension is CERTIFIED, overall = `CERTIFIED`. Otherwise overall = `BLOCKED` with a blockers list enumerating each failed dimension.

6. **Emit em-certification.yaml** at `{output_base}/em-certification.yaml`:

   ```yaml
   overall: CERTIFIED | BLOCKED
   certified_at: "{ISO-8601}"
   sources:
     standards: "{quality_standards_path}"
     report: "{quality_report_path}"
   dimensions:
     QP-1:
       level: {declared}
       target: {translated}
       actual: {measured}
       verdict: CERTIFIED | BLOCKED
       gap: "{text if BLOCKED}"
     QP-2: {...}
     QP-3: {...}
     QP-4: { verdict: N/A, note: "deployment-time concern" }
     QP-5: { verdict: N/A, note: "deployment-time concern" }
     QP-6: { verdict: N/A, note: "deployment-time concern" }
     QP-7: {...}
   blockers: [ "QP-1: coverage 62% below target 80%", ... ]
   ```

## Output

```yaml
em_certification_path: "{output_base}/em-certification.yaml"
overall: CERTIFIED | BLOCKED
blockers_count: {n}
status: written
```

## Failure Modes

| What failed | Cause | Return |
|-------------|-------|--------|
| quality-standards.yaml missing or unreadable | I/O | `status: failed`, `reason: missing_input` |
| quality-report.yaml missing or unreadable | I/O | `status: failed`, `reason: missing_input` |
| Translation table unreadable | I/O | `status: failed`, `reason: missing_translation_table` |
| Malformed YAML in any input | Parse error | `status: failed`, `reason: parse_error`, `file` |

## Boundaries

- You never run build, lint, test, or any quality-gate command — quality-auditor produces the measurements.
- You never modify source code.
- You never read eval files, judge reports, builder prompts, or feature specifications — same context-isolation rules as the engineering-manager agent.
- You emit one artifact. Nothing else.
