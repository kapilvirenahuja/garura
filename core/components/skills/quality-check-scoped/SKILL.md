---
name: meridian:quality-check-scoped
description: Diff-bounded single-pass quality evaluation for PR review. Reads KB standards from standards_order paths resolved from config, filters to domains touched by changed_paths, evaluates standard-ID checks against the diff using mechanical match rules from pr-severity-taxonomy.md, classifies every finding deterministically, and emits findings.yaml. Reuses /quality-check KB data — NOT its 11-subagent execution model. Use only from review-pr play; never invoke standalone for full-repo audits.
user-invocable: false
---

# Quality Check (Scoped)

Single-pass diff-bounded evaluation. Reuses the KB used by `/quality-check` but evaluates only standards relevant to files in `changed_paths`. **Diff scope invariant: NEVER reads files outside `changed_paths`.**

## Purpose vs `/quality-check`

| | `/quality-check` | `quality-check-scoped` |
|---|---|---|
| Scope | Full repo | Diff only |
| Execution | 11 parallel subagents | Single pass |
| Output | Spider chart + scored audit | `findings.yaml` |
| Invocable | User | Play only (review-pr) |
| KB usage | All standards in all domains | Only standards whose taxonomy match rule fires on the diff |

## Input Contract

The skill is invoked with a JSON payload from `quality-auditor`:

```yaml
diff_path: "{stm_base}/{issue}/evidence/review-pr/diff.patch"   # unified diff
changed_paths:                                                    # array; absolute repo-relative paths
  - src/api/users.ts
  - src/db/migrations/0042_add_email.sql
standards_set:                                                    # resolved from config standards_order
  kb: ~/.garura/core/memory/knowledge/quality/
  ltm: ./.garura/core/memory/knowledge/quality/
  stm: .meridian/project/issues/{issue}/specs/quality/
severity_taxonomy_path: ./core/components/memory/standards/rules/pr.md
intent_summary: "Add email verification flow"                     # 1–3 sentences from spec/intent.yaml or PR body
output_path: "{stm_base}/{issue}/evidence/review-pr/findings.yaml"
```

**Pre-flight (hard halts):**

| Check | Action on Failure |
|---|---|
| `severity_taxonomy_path` exists | HALT — "PR severity taxonomy missing at {path}" |
| `diff_path` exists and non-empty | HALT — "Empty or missing diff" |
| `changed_paths` non-empty | HALT — "No changed paths supplied" |
| At least one of `standards_set.{kb,ltm,stm}` resolves | HALT — "No standards source resolvable" |

## Execution

### Step 1 — Load taxonomy
Read `severity_taxonomy_path`. Parse the severity table into rows: `{standard_id, severity, match_rule, evidence_required}`. Build an in-memory index keyed by `standard_id`.

### Step 2 — Filter taxonomy to relevant rows
For each row, evaluate its `match_rule`:
- `path:<glob>` — match against `changed_paths[]`.
- `grep:<regex>` — match against added lines in `diff_path` (`^\+` excluding `^\+\+\+`).
- `grep+path:<regex>|<glob>` — both must match.

Drop rows with no match. The surviving set is the **relevant standard set** for this diff.

### Step 3 — Load KB descriptions for relevant standards
For each surviving `standard_id`, resolve its KB description file by walking `standards_order` (default `[kb, ltm, stm]`) and stopping at the first hit. Read ONLY the files needed — do NOT load the entire KB.

### Step 4 — Evaluate each relevant standard against the diff
For each surviving row:
1. Apply the `match_rule` to the diff and collect every match site (`file`, `line`, matched substring or matched path).
2. For each match site, emit a finding object:
   ```yaml
   - standard_id: SEC-19
     severity: P1
     file: src/config/secrets.ts
     line: 14
     evidence: 'const apiKey = "sk_live_abc..."'
     taxonomy_rule_id: SEC-19
   ```
3. **F3 hard rule:** every finding MUST carry a `standard_id` that exists in the taxonomy. If the rule's evidence-required fields are missing, drop the finding and emit a skill-level error to STM evidence — NEVER fabricate a finding.

### Step 5 — Compute scan_coverage
`scan_coverage = (count of changed_paths whose extension/path is covered by at least one taxonomy row) / total changed_paths`. Persist in the output.

### Step 6 — Emit `findings.yaml`
Write to `output_path` with stable ordering (sort by `severity` then `file` then `line`):

```yaml
meta:
  generated_at: "{ISO-8601}"
  diff_path: "{diff_path}"
  changed_paths_count: {N}
  scan_coverage: {0.0–1.0}
  taxonomy_path: "{severity_taxonomy_path}"
  standards_relevant: {count}
findings:
  - standard_id: SEC-19
    severity: P1
    file: src/config/secrets.ts
    line: 14
    evidence: 'const apiKey = "sk_live_abc..."'
    taxonomy_rule_id: SEC-19
  - ...
counts:
  P1: {n}
  P2: {n}
  P3: {n}
  P4: {n}
```

## Output Schema (`findings.yaml`)

| Field | Type | Required | Notes |
|---|---|---|---|
| `meta.generated_at` | string | yes | ISO-8601 |
| `meta.diff_path` | string | yes | echoed from input |
| `meta.scan_coverage` | float | yes | 0.0–1.0 |
| `meta.standards_relevant` | int | yes | count of taxonomy rows whose match rule fired |
| `findings[].standard_id` | string | yes | MUST exist in taxonomy |
| `findings[].severity` | enum P1\|P2\|P3\|P4 | yes | sourced from taxonomy, never inferred |
| `findings[].file` | string | yes | repo-relative path from `changed_paths` |
| `findings[].line` | int | yes | line in the diff hunk |
| `findings[].evidence` | string | yes | matched substring or path |
| `findings[].taxonomy_rule_id` | string | yes | same as `standard_id` |
| `counts.P1`–`P4` | int | yes | counts by severity |

## Diff Scope Invariant

The skill MUST NOT:
- Read files outside `changed_paths`.
- Walk the full repository tree.
- Invoke `/quality-check` or any of its subagents.
- Use heuristic/LLM reasoning to classify severity — severity is read from the taxonomy table, not inferred.

## Determinism

Two back-to-back invocations on the same `(diff_path, changed_paths, taxonomy_path)` MUST produce a byte-identical `findings.yaml` (after stripping `meta.generated_at`). Stable sort order: `severity asc → file asc → line asc → standard_id asc`.

## Failure Modes

| Code | Condition | Action |
|---|---|---|
| FS-1 | Taxonomy missing | HALT + structured failure |
| FS-2 | Diff empty/missing | HALT |
| FS-3 | A finding lacks `standard_id` | DROP finding + log error to evidence |
| FS-4 | Standards source unresolvable | HALT |
| FS-5 | Match rule regex invalid | HALT — taxonomy is malformed |

## Reference

- Input contract: `reference/input-contract.md`
- Output schema: `reference/finding-schema.md`
- Taxonomy: `core/components/memory/standards/rules/pr.md`
