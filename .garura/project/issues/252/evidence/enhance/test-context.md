# Test Context — Issue #252: Component Linting for Garura Components

## What Was Built (Behavioral Description)

A two-layer linting system for Garura components:

1. A **deterministic Node.js CLI linter** that validates Garura components (plays, agents, skills) across three tiers — structural (per-file frontmatter and section requirements), semantic (cross-file skill/agent reference integrity), and cross-reference (ID uniqueness and scenario coverage). It emits structured JSON output and exits with code 1 if any ERROR-level violations are found.

2. A **lint-components skill** that invokes the Node.js linter, reads the project quality profile to determine severity policy, and writes a structured lint report artifact indicating pass/fail and the policy source.

## Verification Evals

### EVAL-01 — Node tool produces valid JSON output when run against core/components/

**Setup:** Run the linter CLI from the repo root.

**Command:**
```bash
cd core/tools/lint-components && npm install --silent && cd ../../.. && node core/tools/lint-components/index.js --target core/components --output json
```

**PASS if:**
- stdout is parseable JSON
- JSON has top-level key `violations` (array) and `summary` (object with integer fields `errors`, `warnings`, `infos`)
- Process exits with code 0 or 1 (either is acceptable — existing violations may be present)
- No uncaught exception is thrown to stderr

**FAIL if:**
- stdout is not valid JSON
- Required top-level keys (`violations`, `summary`) are absent
- Process throws an uncaught exception
- `summary` fields are missing or not integers

---

### EVAL-02 — Missing required frontmatter field is caught

**Setup:** Create a temporary test skill directory. Copy `core/components/skills/manage-issue/SKILL.md` to a temp location. Remove the `name` field from its frontmatter. Run the linter against `core/components` or the temp directory such that the modified file is included.

**PASS if:**
- The `violations` array contains an entry matching the test file
- That entry has `severity: "error"` (or `"ERROR"`)
- That entry's `rule` or `message` references frontmatter completeness or a missing required field

**FAIL if:**
- The modified file's missing `name` field produces no violation at all
- The violation has `severity: "warning"` instead of error

---

### EVAL-03 — Broken skill reference is caught

**Setup:** In a play SKILL.md body (or a temp copy), add a reference to a skill name that does not exist under `core/components/skills/` — use a clearly fictional name such as `nonexistent-skill-xyz` — in a structured skill invocation context (e.g., inside a Skill tool call or Skill Pool table). Run the linter.

**PASS if:**
- The `violations` array contains an entry for that play file
- `severity: "error"` (or `"ERROR"`)
- `message` or `rule` identifies `nonexistent-skill-xyz` as the missing/unresolvable skill reference

**FAIL if:**
- The broken reference produces no violation
- The violation has severity warning rather than error

---

### EVAL-04 — Constraint ID collision (duplicate IDs in one intent.yaml) is caught

**Setup:** In a play's intent.yaml (or a temp copy), introduce two constraints both with the ID value `C1`. Run the linter.

**PASS if:**
- The `violations` array contains an entry for that intent.yaml
- `severity: "error"` (or `"ERROR"`)
- `rule` or `message` references ID uniqueness, duplicate ID, or constraint collision, and identifies `C1` as the duplicate

**FAIL if:**
- The duplicate ID produces no violation
- The violation is severity warning rather than error

---

### EVAL-05 — Spelling variant user-invocable vs user-invokable is flagged as WARNING, not ERROR

**Setup:** Run the linter against `core/components` without any modification. The existing codebase contains plays with both `user-invokable` and `user-invocable` spellings.

**PASS if:**
- Any violations emitted for the spelling inconsistency have `severity: "warning"` (or `"WARNING"`)
- No play file is flagged with `severity: "error"` solely for using `user-invokable` OR `user-invocable` spelling
- Both spellings are accepted as structurally valid at the individual file level

**FAIL if:**
- Any play is flagged as `error` for the spelling variant
- No warning is emitted at all for the spelling inconsistency (when both variants exist in the corpus)

---

### EVAL-06 — lint-components skill exists at correct path with required SKILL.md sections

**Setup:** After implementation, run the linter against the skill's own directory.

**Command:**
```bash
node core/tools/lint-components/index.js --target core/components/skills/lint-components --output json
```

**PASS if:**
- The violations array for `core/components/skills/lint-components/SKILL.md` contains zero ERROR-level violations
- The SKILL.md contains required sections: `## Input`, `## Process`, `## Output`
- The SKILL.md frontmatter has `name: lint-components`, `user-invocable: false`, `model: sonnet`, and `allowed-tools` containing `Bash` and `Read`

**FAIL if:**
- The skill's own SKILL.md fails structural lint with ERROR violations
- Required sections are absent
- Frontmatter fields are missing or incorrect

---

### EVAL-07 — Skill reads quality profile and classifies violations by severity policy

**Setup:** Invoke the lint-components skill in a test context (or manually trace the Process section). Confirm that the skill's output artifact references the quality profile.

**PASS if:**
- The skill's output artifact (lint report) includes a `severity_policy` field or equivalent section that records how violations were classified
- The classification is traceable to the quality profile at `.garura/product/specification/quality-profile.yaml`
- The output notes the quality profile's status field (e.g., DRAFT)
- ERROR violations are classified as blockers; WARNING violations are classified as informational

**FAIL if:**
- The skill's output artifact contains no evidence that the quality profile was read
- Severity classification uses hardcoded thresholds with no reference to the quality profile
- The quality profile path is absent from the skill's Process section
