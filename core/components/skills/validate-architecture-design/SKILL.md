---
name: validate-architecture-design
description: Validate architecture.yaml and quality-standards.yaml for structural completeness and readiness to lock
user-invocable: false
model: sonnet
allowed-tools: Read
---

# validate-architecture-design

Model-invocable skill for validating architecture.yaml and quality-standards.yaml artifacts.

## Purpose

Read and evaluate architecture.yaml and quality-standards.yaml against completeness criteria. Returns a structured validation_result with per-check outcomes. Does NOT modify any artifact.

You DO the validation. You do NOT modify any artifact or decide what happens next.

## Output Schema

Returns structured data (not a file). The `validation_result` object contains:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `ready_for_lock` | boolean | yes | true only if all checks pass AND no blocker-severity issues |
| `checks` | list | yes | Per-check results with check_id, name, status, details |
| `issues` | list | yes | Each issue: `message` (string), `check_id` (string), `severity` (blocker/warning/suggestion) |

## Input

Receive from agent:
- `architecture_yaml_path` — (required) Full path to architecture.yaml
- `quality_standards_yaml_path` — (required) Full path to quality-standards.yaml
- `product_yaml_path` — (optional) Full path to product.yaml for QP dimension cross-check

## Process

1. **Read artifacts:** Read `architecture_yaml_path` and `quality_standards_yaml_path`. If either is not found, return structured failure identifying the missing artifact(s).

2. **Check status:** If both artifacts are LOCKED, return structured failure: "Artifacts are already LOCKED — no validation needed."

3. **Run validation checks.** Run all 8 checks below. Each check produces a PASS or FAIL with details.

---

### VA1 — Stack entries have concrete named technologies

Scan the `stack` section of architecture.yaml. Every entry must have a specific `technology` value (e.g., "React 19", "PostgreSQL 16", "Python 3.12"). Vague references like "a relational database", "a web framework", or "an appropriate tool" are violations.

- **PASS:** Every stack component names a concrete technology
- **FAIL:** One or more vague technology references found (list each)

---

### VA2 — NFR rationale traces to NFR Profile dimensions

For each stack entry that includes a `rationale` or `nfr_rationale` field, verify it references specific NFR Profile dimensions (NFR-1 through NFR-7). A rationale that says "for performance" without citing an NFR dimension is a weak trace. At least 50% of stack entries with rationale fields must cite an NFR dimension.

- **PASS:** >= 50% of stack rationale fields reference NFR Profile dimensions
- **FAIL:** < 50% of stack rationale fields reference NFR dimensions (list the entries without NFR traces)

---

### VA3 — All 7 QP dimensions covered in quality-standards

Scan quality-standards.yaml for coverage of all 7 Quality Profile dimensions: QP-1 (Testing Depth), QP-2 (Code Quality Standards), QP-3 (Documentation Level), QP-4 (CI/CD Maturity), QP-5 (Observability Maturity), QP-6 (Accessibility Standard), QP-7 (Security Testing). Each dimension must have a corresponding section with at least one concrete standard entry.

- **PASS:** All 7 QP dimensions have non-empty standard entries
- **FAIL:** One or more QP dimensions missing or empty (list the missing dimensions)

---

### VA4 — Debt baseline initialized for all QP dimensions

Scan quality-standards.yaml `debt_baseline` section. Every QP dimension (QP-1 through QP-7) must have a `target_level` and `current_level` entry. Both must be integers 1-5.

- **PASS:** All 7 dimensions have valid target_level and current_level in debt_baseline
- **FAIL:** One or more dimensions missing from debt_baseline or have invalid level values (list the gaps)

---

### VA5 — Quality standards have concrete tooling

For each QP dimension in quality-standards.yaml, verify that standard entries reference specific tools, frameworks, or processes — not vague directives. Examples: "ESLint with @typescript-eslint/recommended" (concrete) vs. "use a linter" (vague). At least one concrete tool or framework must be named per dimension.

- **PASS:** Every QP dimension references at least one named tool or framework
- **FAIL:** One or more dimensions have only vague directives (list the dimensions)

---

### VA6 — Agentic PCAM present if applicable

If architecture.yaml has agentic signals in the stack (LLM references, agent frameworks, Claude/GPT mentions), verify the `agentic` section exists with all four PCAM sub-sections (`perception`, `cognition`, `action`, `memory`) each containing at least one entry. If no agentic signals exist, this check passes as not-applicable.

- **PASS:** No agentic signals detected, OR agentic section has all four PCAM sub-sections populated
- **FAIL:** Agentic signals present but agentic section is absent or incomplete (identify missing PCAM sub-sections)

---

### VA7 — Profiles ref present

Verify architecture.yaml has a `profiles_ref` field that is non-null and references a product.yaml path. If `product_yaml_path` was provided as input, verify the referenced file exists.

- **PASS:** `profiles_ref` is present and non-null; file exists if path was provided for cross-check
- **FAIL:** `profiles_ref` is absent, null, or references a non-existent file

---

### VA8 — Platform and integration entries are specific

If architecture.yaml has `platforms` or `integrations` sections, verify each entry names a specific provider or service (e.g., "Vercel", "Stripe", "Supabase") rather than a generic category (e.g., "a hosting platform", "a payment provider").

- **PASS:** All platform and integration entries name specific providers, OR sections are absent
- **FAIL:** One or more entries use generic category names (list the entries)

---

4. **Classify issues.** For each failed check, classify severity:
   - `blocker` — VA1, VA3, VA4, VA5 failures (structural incompleteness)
   - `warning` — VA2, VA6, VA7, VA8 failures (traceability or coverage gaps)
   - `suggestion` — Weak but present content

5. **Determine ready_for_lock.** `true` only if all 8 checks pass AND no blocker-severity issues exist.

## Output

```yaml
validation_result:
  ready_for_lock: true|false
  checks:
    - check_id: "VA1"
      name: "Stack entries have concrete named technologies"
      status: "PASS|FAIL"
      details: "{description of findings}"
    - check_id: "VA2"
      name: "NFR rationale traces to NFR Profile dimensions"
      status: "PASS|FAIL"
      details: "{description of findings}"
    - check_id: "VA3"
      name: "All 7 QP dimensions covered in quality-standards"
      status: "PASS|FAIL"
      details: "{description of findings}"
    - check_id: "VA4"
      name: "Debt baseline initialized for all QP dimensions"
      status: "PASS|FAIL"
      details: "{description of findings}"
    - check_id: "VA5"
      name: "Quality standards have concrete tooling"
      status: "PASS|FAIL"
      details: "{description of findings}"
    - check_id: "VA6"
      name: "Agentic PCAM present if applicable"
      status: "PASS|FAIL"
      details: "{description of findings}"
    - check_id: "VA7"
      name: "Profiles ref present"
      status: "PASS|FAIL"
      details: "{description of findings}"
    - check_id: "VA8"
      name: "Platform and integration entries are specific"
      status: "PASS|FAIL"
      details: "{description of findings}"
  issues:
    - message: "{description of issue}"
      check_id: "{VA1-VA8}"
      severity: "blocker|warning|suggestion"
```

**IMPORTANT**: This skill produces validation results. The calling agent receives this output and decides what to do next. Do NOT instruct the agent to return or stop.

## Constraints

- NEVER modify any artifact — read-only across all inputs
- NEVER approve lock (ready_for_lock: true) when any check has FAIL status with blocker severity
- ALWAYS return all 8 checks with status, even if the check passes trivially
- ALWAYS list every individual violation in the issues array — do not summarize multiple violations into a single issue
- VA6 may return PASS with a "not applicable" note for non-agentic products

## Version

| Field | Value |
|-------|-------|
| Version | 1.0.0 |
| Category | analysis |
