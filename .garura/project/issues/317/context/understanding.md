# Context: Understanding — Issue #317

> lint-components tool and skill documentation

---

## 1. What the linter actually checks

The linter runs three independent rule sets in sequence (index.js lines 46–50). All rule IDs and severities are hardcoded in source — there is no external mapping file.

### Structural rules (`lib/rules/structural.js`)

Structural rules verify that component files are well-formed. They operate per-file.

**Skills** (`core/components/skills/*/SKILL.md`):
- `structural/missing-frontmatter-field` (severity: `error`) — required frontmatter fields: `name`, `description`, `user-invocable`, `model`, `allowed-tools`. Each missing field is a separate violation. (structural.js lines 65–76)
- `structural/allowed-tools-must-be-string` (severity: `error`) — `allowed-tools` must be a comma-separated string, not a YAML array. (structural.js lines 79–87)
- `structural/missing-section` (severity: `error`) — required body sections: `## Input`, `## Process`, `## Output`. Each missing section is a separate violation. (structural.js lines 90–101)
- `structural/frontmatter-parse-error` (severity: `error`) — emitted when frontmatter cannot be parsed; file-level check halts early. (structural.js lines 51–59)

**Agents** (`core/components/agents/*.md`):
- `structural/missing-frontmatter-field` (severity: `error`) — required fields: `name`, `description`, `model`, `tools`. Plus either `domain` OR `role` must be present. (structural.js lines 129–151)
- `structural/tools-must-be-array` (severity: `error`) — `tools` must be a YAML list (array), not a string. (structural.js lines 153–160)
- `structural/frontmatter-parse-error` (severity: `error`) — same early-exit as skills. (structural.js lines 113–120)

**Plays** (`core/components/plays/*/SKILL.md`):
- `structural/missing-frontmatter-field` (severity: `error`) — required fields: `name`, `description`, `model`. Plus either `user-invocable` OR `user-invokable` must be present. (structural.js lines 189–215)
- `structural/missing-section` (severity: `error`) — required body sections: `## Compiled From`, `## Role`, `## Pre-flight`. (structural.js lines 221–231)
- `structural/spelling-inconsistency` (severity: `warning`) — corpus-level check: if BOTH `user-invocable` and `user-invokable` spellings appear across plays, each file using the minority form (`user-invokable`) receives a warning. (structural.js lines 317–339)
- `structural/frontmatter-parse-error` (severity: `error`) — early exit. (structural.js lines 177–186)

**Intents** (`core/components/plays/*/reference/intent.yaml`):
- `structural/yaml-parse-error` (severity: `error`) — YAML fails to parse. (structural.js lines 248–256)
- `structural/invalid-structure` (severity: `error`) — top-level value is not a YAML object. (structural.js lines 260–267)
- `structural/missing-intent-key` (severity: `error`) — required top-level keys: `intent`, `constraints`, `failure_conditions`, `scenarios`. (structural.js lines 271–281)

### Semantic rules (`lib/rules/semantic.js`)

Semantic rules check whether names referenced inside play SKILL.md bodies resolve to real components.

**Skill references in plays:**
- `semantic/skill-not-found` (severity: `error`) — a skill name extracted from the play body is not present as a directory under `core/components/skills/`. (semantic.js lines 181–189)
  - Extraction patterns (semantic.js lines 12–86):
    - Skill Pool table: `## Skill Pool` section, rows with first column `` `skill-name` ``
    - `Skill: <name>` or `` Skill: `<name>` `` at start of line
    - `` invokes `<skill-name>` skill `` / `` invoke `<skill-name>` skill ``

**Agent references in plays:**
- `semantic/agent-not-found` (severity: `error`) — an agent name extracted from the play body is not present as a `.md` file under `core/components/agents/`. (semantic.js lines 191–199)
  - Extraction: Agent Boundaries table (`## Agent Boundaries`, `**Agent boundaries:**`, `Agent boundaries:`), first-column `` `agent-name` `` rows. (semantic.js lines 97–144)

**Note:** Semantic checks run only on plays. Skills and agents are not checked for references.

### Cross-reference rules (`lib/rules/cross-reference.js`)

Cross-reference rules verify integrity between paired files (intent.yaml + play SKILL.md).

- `cross-ref/duplicate-constraint-id` (severity: `error`) — two or more `constraints` entries in an intent.yaml share the same `id` value. (cross-reference.js lines 72–79)
- `cross-ref/duplicate-failure-condition-id` (severity: `error`) — same as above for `failure_conditions`. (cross-reference.js lines 84–91)
- `cross-ref/duplicate-scenario-id` (severity: `error`) — same as above for `scenarios`. (cross-reference.js lines 96–103)
- `cross-ref/uncovered-scenario` (severity: `warning`) — for each scenario ID of the form `S{N}` in an intent.yaml, the corresponding play SKILL.md must contain the string `SCE-{N}`. Missing coverage emits one warning per scenario. (cross-reference.js lines 112–133)

---

## 2. CLI invocation surface

**Location:** `core/tools/lint-components/index.js` (invoked as a Node.js script)

**Command:**
```
node core/tools/lint-components/index.js [flags]
```

If installed globally via `npm link` or with the package's `bin` entry, also:
```
lint-components [flags]
```

**Flags** (parsed in `parseArgs`, index.js lines 11–33):

| Flag | Default | Description |
|------|---------|-------------|
| `--target=<path>` or `--target <path>` | `core/components` | Directory to scan for components |
| `--output=<format>` or `--output <format>` | `json` | Output format: `json` or `text` |
| `--validate-templates` | off (false) | Enable template validation (not enabled by default) |

The target path is resolved relative to `process.cwd()` (index.js line 42).

**Output formats:**

`json` (default):
```json
{
  "violations": [
    { "file": "...", "rule": "...", "severity": "error|warning|info", "message": "...", "line": 0 }
  ],
  "summary": { "errors": 0, "warnings": 0, "infos": 0 }
}
```

`text`:
```
<severity>: <file>:<line> [<rule>] <message>
...
<N> errors, <N> warnings, <N> infos
```
(reporter.js lines 11–24)

**Exit codes:**
- `0` — no errors (warnings and infos may still be present)
- `1` — one or more violations with `severity: error` found (index.js line 63)
- `2` — fatal/unexpected runtime error (index.js line 67)

**Gap:** The `--validate-templates` flag is parsed and stored in `args.validateTemplates` (index.js lines 29–31) but is never passed to any rule module. The current `structural.js`, `semantic.js`, and `cross-reference.js` do not read it. The flag is accepted without error but has no effect in the current implementation. Any doc describing template validation must note this is not yet wired up.

---

## 3. Skill JSON contract

Source: `core/components/skills/lint-components/SKILL.md`

**Metadata:**
```yaml
name: lint-components
user-invocable: false
model: sonnet
allowed-tools: Bash, Read
```

**Input:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `project_root` | string | Yes | Absolute path to the repository root |
| `output_path` | string | Yes | STM path where the lint report will be written |

**Example STM contract** (from SKILL.md):
```yaml
stm:
  input:
    project_root: /path/to/repo
  output:
    lint_report: .garura/project/issues/{issue}/evidence/{play}/lint-report.yaml
```

**Process summary (SKILL.md lines 33–82):**
1. Check for `core/tools/lint-components/node_modules/`; if absent, run `npm install --silent` in that directory.
2. Run `node core/tools/lint-components/index.js --target core/components --output json` from `project_root`. Capture stdout.
3. Parse stdout as JSON.
4. Read `.garura/product/specification/quality-profile.yaml`. Extract `status` field plus maintainability/security target levels. If absent, fall back to default classification and log `quality_profile_status: not_found`.
5. Classify: `error` violations → `blocker`; `warning` and `info` violations → `informational`.
6. Write structured YAML artifact to `output_path`.

**Output artifact shape** (SKILL.md lines 64–82):
```yaml
generated_at: <ISO timestamp>
quality_profile_status: <status from profile, or "not_found">
summary:
  errors: <count>
  warnings: <count>
  infos: <count>
  blockers: <count>          # = errors count
  informational: <count>     # = warnings + infos count
pass: <true if errors == 0>
violations:
  - file: <path>
    rule: <rule id>
    severity: <error|warning|info>
    classification: <blocker|informational>
    message: <message>
    line: <line number>
```

**Exit code handling (SKILL.md line 107):** Exit code 1 from the linter is expected when violations exist — the skill must NOT treat it as failure. Only exit code 2 is a fatal failure.

**Constraint:** `--validate-templates` is explicitly noted as off by default; do not pass unless instructed (SKILL.md line 105).

---

## 4. Severity mapping

**Where severities are defined:** Hardcoded in each rule module (`lib/rules/structural.js`, `lib/rules/semantic.js`, `lib/rules/cross-reference.js`). There is no external mapping file in `core/components/memory/standards/rules/` or elsewhere. The quality-profile.yaml at `.garura/product/specification/quality-profile.yaml` does not contain a rule-ID-to-severity mapping table.

**What the quality profile contributes:** The skill reads the quality profile to extract its `status` field (`DRAFT`, `APPROVED`, etc.) and, per SKILL.md, the maintainability and security target levels. These inform the *classification* step (error → blocker, warning/info → informational), not the severity values themselves.

**Severity values in source:**

| Severity | Where used | Count of distinct rule IDs |
|----------|-----------|---------------------------|
| `error` | All three modules | 12 rule IDs |
| `warning` | structural.js, cross-reference.js | 2 rule IDs (`structural/spelling-inconsistency`, `cross-ref/uncovered-scenario`) |
| `info` | Not used by any rule currently | 0 |

The `info` bucket exists in the summary (index.js line 56) and is documented in the output schema, but no current rule emits it. The linter infrastructure supports it.

**Classification by skill (SKILL.md lines 55–62):**
- `severity: error` → `classification: blocker`
- `severity: warning` → `classification: informational`
- `severity: info` → `classification: informational`

**Fallback:** if quality-profile.yaml is absent, the same default classification applies (SKILL.md line 55).

---

## 5. Install path

**Tool location:** `core/tools/lint-components/`

**package.json fields:**
- `name`: `lint-components`
- `version`: `1.0.0`
- `main`: `index.js`
- `bin.lint-components`: `./index.js`
- `dependencies`: `{ "js-yaml": "^4.1.0" }`
- No `engines` field — Node version requirement is not declared. No npm scripts defined (`scripts` key absent).

**Install command** (run from `core/tools/lint-components/`):
```bash
npm install
```

This installs `js-yaml` into `core/tools/lint-components/node_modules/`. No other setup is required. `js-yaml` is the only external dependency; all other modules (`fs`, `path`) are Node.js built-ins.

**First-run check in skill:** The skill (SKILL.md step 1) checks whether `node_modules/` exists and only runs `npm install --silent` if absent, making it idempotent.

**No `engines` field declared** — this is a gap. The minimum Node.js version is not documented. The tool uses no syntax requiring Node >= 12, but the actual minimum has not been validated or stated.

---

## 6. Existing tone reference — `docs/usage/plays/create-pr.md`

Key style observations:

**Heading structure:**
- H1 title = the component name (e.g., `# create-pr`)
- One-line summary sentence immediately under H1, no blank line before the summary
- `> **Golden standard:** ...` blockquote immediately after the summary (this is play-specific; skill docs won't replicate this)
- `## Overview` — short prose, then a bullet list for "Key insight"
- `## Usage` — code block first, then prose alternative
- `## Play Structure` — fenced code block for directory tree, followed by bullet list for "Key patterns"
- `## Workflow (N Steps)` — table for step overview, then H3 per step
- Terminal output shown as fenced code block with no language specifier (the whole session is unformatted prose in a code block)
- `## Related` — final section, bullet list of linked components

**Code block conventions:**
- Shell commands: fenced with ` ```bash ` or ` ``` ` (no language tag for terminal session replays)
- YAML/JSON: language-tagged (` ```yaml `, ` ```json `)
- Directory trees: ` ``` ` no language tag

**Tables:**
- Used for: step overviews, checklist items, flag references, field descriptions
- Always include a header row; pipe-aligned; no trailing pipe spaces

**Length:**
- `create-pr.md` is ~300 lines, dense with examples. Examples are not abbreviated — terminal session shows the full user flow including the prompt and the response.
- Section depth: H2 for major sections, H3 for sub-sections within workflows

**Tone:** Instructional and direct. No hedging language. Uses "you" for the reader. Bold used for emphasis on key terms, not decoration.

---

## 7. Pillar slug confirmation

**Source:** `.garura/product/scope/features.yaml`

The five domain slugs confirmed at lines 130, 505, 738, 995, 1238 of features.yaml:
- `agentic-methodology` (line 130)
- `engineering-observability` (line 505)
- `ai-governance` (line 738)
- `work-intelligence` (line 995)
- `engineering-experience` (line 1238)

The lint-components tool validates Meridian component contracts (plays, skills, agents). This is a methodology/component-architecture concern, placing it under the `agentic-methodology` pillar. Confirmed: `docs/agentic-methodology/tools/lint-components.md` is the correct path as decided in discovery.md.

---

## 8. Gaps in the source (flags for implementer)

**Gap 1: `--validate-templates` is a no-op.**
`index.js` parses and stores the flag (lines 29–31), but no rule module reads `args.validateTemplates`. Any description of this flag must state it is accepted but has no current effect, or omit it from the docs to avoid confusion. Discovery.md says "no behavior changes" — the docs should reflect actual behavior, which means the flag either gets a "(not yet implemented)" note or is omitted.

**Gap 2: No Node.js version requirement declared.**
`package.json` has no `engines` field. The minimum supported Node version is unspecified. The doc writer must either leave this unstated or add a parenthetical (e.g., "Node 14+ recommended") — but this cannot be sourced from the code and would need to be confirmed by the author of #252.

**Gap 3: `info` severity is infrastructure-only.**
The summary counts `infos` and the output schema documents `severity: info`, but no rule currently emits it. Docs should describe it as a supported severity level that no current rule uses, rather than giving a concrete example rule.

**Gap 4: Skill has no `reference/intent.yaml`.**
`core/components/skills/lint-components/` contains only `SKILL.md`. There is no `reference/intent.yaml` for this skill, so the contract details must be sourced entirely from SKILL.md.

**Gap 5: `structural/spelling-inconsistency` comment inconsistency.**
`structural.js` lines 327–331 contain conflicting inline comments about which spelling is the majority vs. minority form. The logic itself is deterministic (it warns on `user-invokable` files when both spellings exist — lines 331–332 use `invokableFiles` as `minorityFiles`), but the comments are self-contradictory. The doc should describe the behavior as implemented, not the confused comments.

**Gap 6: Discover uses one-level-deep scanning for skills and plays.**
`discover.js` lines 52–59 and 66–73 scan exactly one directory level for `SKILL.md` files. Nested skills or plays would not be discovered. This is the intended design but is not documented anywhere. Worth noting in the tool-side doc as a constraint.
