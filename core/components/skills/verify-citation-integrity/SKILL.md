---
name: verify-citation-integrity
description: Static verification of every cited_locations entry in a /decode spec. For each citation, confirms the file exists, the line range exists, and the excerpt matches the current source byte-for-byte (after trim-equivalent normalization). Deterministic — no LLM reasoning. Called before any behavior/flow/aspect spec is marked captured (C8). Citation-integrity failure halts the unit (F7).
user-invocable: false
model: sonnet
allowed-tools: Bash, Read, Write, Grep, Glob
deprecated: true
deprecated_note: '#434 ProductOS realignment — superseded by the command model; retained for Phase E reference, not installed'
---

# verify-citation-integrity

Called by the `/decode` play per spec, before the spec is written to its proposals/ location. Validates the claim every spec makes: that its referenced source locations actually exist and say what the spec says they say.

## Purpose

`/decode`'s hard discipline against LLM fabrication rests on two pillars: (a) every rule/scenario/contract carries cited_locations (C5), and (b) those citations resolve against the current source (C8). This skill enforces the second pillar mechanically. Without it, an agent could fabricate citations that look plausible but point to non-existent lines — and the fabrication would go undetected.

Verification is static — no LLM reasoning, no execution. It is a file-read + string-compare pass, fast enough to run on every spec before capture.

## Input

Receive from the `/decode` play orchestrator (or tech-architect indirectly) via JSON contract.

- `spec_path` (path, required) — the YAML spec to verify (behaviors/{id}.yaml, flows/{id}.yaml, or aspects/{id}.yaml).
- `codebase_root` (path, required) — repo root for resolving citation `file` paths.
- `output_path` (path, required) — `{stm_base}/{issue}/evidence/decode/citation-integrity-reports/{unit-id}.yaml`.
- `normalization` (enum, optional, default `trim-equivalent`) — how to compare excerpts: `exact` | `trim-equivalent` (ignore leading/trailing whitespace on each line) | `whitespace-collapsed` (replace all whitespace runs with single space).

## Process

### 1. Validate inputs

- Confirm `spec_path` exists and parses as YAML.
- Confirm `codebase_root` exists.
- Confirm `output_path` parent directory exists.

### 2. Enumerate citations

Walk the spec and collect every `cited_locations` list across every section. The sections differ per spec kind (see C4a / C4b / C4c), but all citations share the same shape:

```yaml
- file: "path/relative/to/codebase_root"
  line_start: <int>
  line_end: <int>
  excerpt: "verbatim source string"
```

Record each citation with its containing path in the spec (e.g., `business_rules[0].cited_locations[2]`). This breadcrumb is used in the report so the caller can pinpoint which field's citation failed.

### 3. Verify each citation

For each enumerated citation:

**Step 3a — File existence.** Resolve `file` against `codebase_root`. If the file does not exist, mark `check_result: file_missing`, skip the remaining checks for this citation.

**Step 3b — Line range.** Open the file, count lines, confirm `line_start >= 1` and `line_end <= total_lines` and `line_start <= line_end`. Otherwise mark `check_result: line_range_invalid`, skip remaining.

**Step 3c — Excerpt match.** Read lines [line_start, line_end] inclusive. Apply `normalization` to both the extracted content and the cited excerpt. Compare. Equal → mark `check_result: match`. Unequal → mark `check_result: excerpt_mismatch` and record both the extracted content (truncated if large) and the cited excerpt for diff display.

### 4. Emit report

Write at `output_path`:

```yaml
verified_at: "{ISO timestamp}"
spec_path: "{input}"
codebase_root: "{path}"
normalization: "trim-equivalent"
summary:
  total_citations: <int>
  match: <int>
  file_missing: <int>
  line_range_invalid: <int>
  excerpt_mismatch: <int>
  integrity_status: "pass | fail"
citations:
  - breadcrumb: "business_rules[0].cited_locations[2]"
    file: "src/module/file.ts"
    line_start: 42
    line_end: 47
    check_result: "match | file_missing | line_range_invalid | excerpt_mismatch"
    extracted_content: "<truncated to 500 chars>"
    cited_excerpt: "<truncated to 500 chars>"
    diff_summary: "<short description when mismatch>"
  - # ...
```

`integrity_status: pass` when every citation has `check_result: match`. Any other result fails the spec.

## Output

Primary artifact: citation-integrity-report.yaml at `output_path`.

## Failure Modes

```yaml
status: failure
what_failed: "spec_path_missing | spec_parse_error | codebase_root_missing | report_path_unwritable"
detail: "<specific>"
evidence: { offending_path: "<path>" }
```

Note: individual citation integrity FAILURES are NOT skill-level failures — they are recorded in the report with `integrity_status: fail`. /decode reads the report and halts the unit per C8. This separation keeps the skill a pure verifier.

## Notes

- The skill is framework-agnostic. It treats every file as text. Binary files in citations are invalid by nature and will surface as `excerpt_mismatch` once read.
- Line numbering is 1-indexed (matches editors and most tooling). This skill does NOT support 0-indexed citations.
- `normalization: trim-equivalent` is the default because whitespace changes from code formatters are common and should not fail integrity when the meaningful content is unchanged. `exact` is available for specs that must lock exact whitespace (rare — typically for string-literal assertions). `whitespace-collapsed` is the loosest option and should not be the default.
- The skill caches file reads during a single verification run to avoid re-reading the same file for multiple citations.
- If the spec has zero citations (invalid per C5 but the verifier still runs), the report returns `total_citations: 0` and `integrity_status: pass` trivially — the enforcement of "at least one citation required" lives in the spec-authoring skills, not here.
