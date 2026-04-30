# Implementation Context — Issue #317

## Solution summary

Create two new Markdown documentation files — one per audience. The tool-side doc lives under a new agentic-methodology pillar at `docs/agentic-methodology/tools/lint-components.md` and covers CLI install, flags, exit codes, rule tiers, and gap disclosures. The skill-side doc lives under `docs/usage/skills/lint-components.md` and covers the JSON contract, output artifact shape, severity/classification mapping, and a sample report excerpt. Both docs cross-link to each other. **No source code changes** — pure documentation work.

## Files to create

### 1. Directory: `docs/agentic-methodology/`

New pillar directory. Other pillar directories (`engineering-observability`, `ai-governance`, `work-intelligence`, `engineering-experience`) are **NOT** created here — each comes into existence only when its first doc lands.

### 2. Directory: `docs/agentic-methodology/tools/`

Subdirectory for CLI/tool-level docs within the `agentic-methodology` pillar.

### 3. File: `docs/agentic-methodology/tools/lint-components.md`

**Audience:** CLI and tooling consumers (contributors running the linter directly).

**Must contain:**
- npm install invocation (run from `core/tools/lint-components/`)
- CLI invocation with `node` and with `lint-components` bin alias
- Flags table (`--target`, `--output`, `--validate-templates`)
- `--validate-templates` noted as accepted but not yet wired (Gap 1)
- Node version note: unstated in `package.json` engines field (Gap 2)
- Exit codes table (0 / 1 / 2)
- Output format examples: `json` and `text`
- Rule tiers section covering structural / semantic / cross-reference
- All rule IDs enumerated per tier (see understanding.md section 1)
- `info` severity noted as infrastructure-supported but unused by current rules (Gap 3)
- Single-level scan constraint noted (Gap 6)
- Cross-link to `docs/usage/skills/lint-components.md` in a Related section

**Required sections (H1 → H2 hierarchy, optional H3 inside):**
- H1: `lint-components`
- One-line summary under H1
- `## Overview` — prose + purpose of the tool
- `## Install` — npm install command, Node version gap disclosure ("No Node version declared in package.json; version requirement is unstated"), js-yaml as the only dependency
- `## Usage` — node invocation + lint-components bin alias; flags table. `--validate-templates` must carry a "(not yet implemented)" note — the flag is parsed but no rule module reads it (Gap 1)
- `## Output` — json and text format examples; exit codes table
- `## Rule Tiers` — subsections per tier (Structural, Semantic, Cross-Reference). Each subsection enumerates every rule ID in source with its severity. Note `info` severity is infrastructure-supported but no current rule emits it (Gap 3). Note the single-level scan constraint (Gap 6)
- `## Related` — link to `docs/usage/skills/lint-components.md` with "For skill invocation (JSON contract), see..."

**Hard constraints for this file:**
- Do NOT fabricate rule IDs not present in source. Cross-check every rule ID against `core/tools/lint-components/lib/rules/*.js`. Section 1 of `understanding.md` enumerates all 14 current rule IDs from source — use that list verbatim.
- Do NOT describe the behavior of `--validate-templates` as if it works. The flag is parsed at `index.js` line 11–33 but no rule module reads it.

### 4. File: `docs/usage/skills/lint-components.md`

**Audience:** play/skill authors invoking lint-components via JSON contract.

**Must contain:**
- Skill metadata block (name, user-invocable, model, allowed-tools)
- JSON contract input fields table (`project_root`, `output_path`)
- Example YAML STM contract block
- Skill process summary (install check, run linter, parse, classify, write artifact)
- Severity-to-classification mapping table (error → blocker, warning/info → informational)
- `quality-profile.yaml` role explained (classification only; severities are hardcoded in source)
- Exit code 1 is expected — skill must NOT treat it as failure
- Output artifact shape with all fields (`generated_at`, `quality_profile_status`, `summary`, `pass`, `violations`)
- Sample report.yaml excerpt showing a real violation entry
- `info` classification noted as supported but no current rule emits it (Gap 3)
- Cross-link to `docs/agentic-methodology/tools/lint-components.md` in a Related section

**Required sections (H1 → H2 hierarchy):**
- H1: `lint-components`
- One-line summary under H1
- `## Overview` — what the skill does (install check, run linter, classify, write YAML report)
- `## Metadata` — table of frontmatter fields (name, user-invocable, model, allowed-tools)
- `## Invocation` — JSON contract input fields table; example YAML STM contract block (use verbatim field names `project_root` and `output_path`)
- `## Process` — numbered steps mirroring SKILL.md process summary. Clarify that exit code 1 from the linter is expected and must NOT be treated as skill failure.
- `## Severity and Classification` — table mapping severity → classification. Explain that severity values are hardcoded in the linter source — not in `quality-profile.yaml`. Explain what `quality-profile.yaml` contributes (status field, classification tier). Note `info` severity exists in infrastructure but no current rule emits it (Gap 3)
- `## Output` — full artifact shape YAML block. Sample violations excerpt showing one error-level violation with all fields populated
- `## Related` — link to `docs/agentic-methodology/tools/lint-components.md` with "For CLI install and rule tier reference, see..."

**Hard constraints for this file:**
- Do NOT describe `--validate-templates` as a skill input; the skill hardcodes the linter invocation and does not expose that flag.
- Field names (`project_root`, `output_path`, `generated_at`, `quality_profile_status`, `summary`, `pass`, `violations`) must match the skill source verbatim.

## Files to modify

(empty — pure new docs work)

## Connections

- **`docs/agentic-methodology/tools/lint-components.md` documents `core/tools/lint-components/index.js`**
  CLI flags, exit codes, and output formats are sourced from `index.js` (parseArgs lines 11–33, exit-code logic lines 63/67). Doc must not invent behavior not present in the source.

- **`docs/agentic-methodology/tools/lint-components.md` documents `core/tools/lint-components/lib/rules/structural.js`**
  All structural rule IDs and severities sourced from this file. Rule IDs are hardcoded strings; doc must cite them verbatim (no paraphrasing that changes the ID).

- **`docs/agentic-methodology/tools/lint-components.md` documents `core/tools/lint-components/lib/rules/semantic.js`**
  Semantic rule IDs (`semantic/skill-not-found`, `semantic/agent-not-found`) and extraction patterns sourced from `semantic.js`.

- **`docs/agentic-methodology/tools/lint-components.md` documents `core/tools/lint-components/lib/rules/cross-reference.js`**
  Cross-reference rule IDs and the uncovered-scenario logic sourced from `cross-reference.js`.

- **`docs/agentic-methodology/tools/lint-components.md` documents `core/tools/lint-components/package.json`**
  npm install command and package name sourced from `package.json`. The absence of an `engines` field is a confirmed gap — doc must not fabricate a Node version requirement.

- **`docs/usage/skills/lint-components.md` documents `core/components/skills/lint-components/SKILL.md`**
  JSON contract shape, process steps, severity classification logic, and output artifact shape sourced from SKILL.md. All field names must match verbatim.

- **`docs/usage/skills/lint-components.md` cross-links to `docs/agentic-methodology/tools/lint-components.md`** (bidirectional)

- **`docs/agentic-methodology/tools/lint-components.md` cross-links to `docs/usage/skills/lint-components.md`** (bidirectional)

## Tasks

### T1 — Create directory `docs/agentic-methodology/tools/`

Create the two new directories: `docs/agentic-methodology/` and `docs/agentic-methodology/tools/`. These are new — confirmed not present in the repo. Do NOT create sibling pillar directories (`engineering-observability/`, `ai-governance/`, etc.). These come into existence only when their first doc lands.

**Expected outcome:** `ls docs/agentic-methodology/tools/` succeeds. No other new directories under `docs/` are created.

### T2 — Author `docs/agentic-methodology/tools/lint-components.md` (CLI audience)

Write the tool-side documentation following house-style from `docs/usage/plays/create-pr.md` (H1 = component name, H2 for major sections, H3 for sub-sections, instructional direct tone, tables for flags/rules, fenced code blocks with language tags).

Use `understanding.md` section 1 for the verbatim list of all 14 current rule IDs. Do NOT fabricate.

**Depends on:** T1.

**Expected outcome:** File exists at the target path. Contains an `npm install` code block, a CLI invocation code block, flags table including `--validate-templates` with a not-yet-implemented note, all rule IDs from understanding.md section 1, and a Related section linking to the skill doc.

### T3 — Author `docs/usage/skills/lint-components.md` (skill-consumer audience)

Write the skill-side documentation following house-style from `docs/usage/plays/create-pr.md`. The `docs/usage/skills/` directory already exists (currently empty).

**Depends on:** T1.

**Expected outcome:** File exists. Contains an example YAML STM contract block, severity/classification table, full output artifact shape, and a Related section linking to the tool doc.

### T4 — Internal cross-link verification

Open both completed docs and confirm bidirectional cross-links are in place:
- `docs/agentic-methodology/tools/lint-components.md` must contain a hyperlink to `docs/usage/skills/lint-components.md`
- `docs/usage/skills/lint-components.md` must contain a hyperlink to `docs/agentic-methodology/tools/lint-components.md`

Links should be relative Markdown links, not absolute paths. If either is missing or wrong, fix it in place.

**Depends on:** T2, T3.

**Expected outcome:** grep for `usage/skills/lint-components.md` in the tool doc returns a match. grep for `agentic-methodology/tools/lint-components.md` in the skill doc returns a match.

### T5 — Visual verification of rendered Markdown

Read both completed docs and verify:
1. Heading hierarchy is consistent (H1 → H2 → H3 only; no skipped levels)
2. All fenced code blocks are closed (balanced triple-backtick pairs)
3. All tables have a header row and consistent column counts
4. No raw HTML (house-style is pure Markdown)
5. Rule IDs in the tool doc match the verbatim strings in source
6. No mention of `--validate-templates` as a working feature; either carries a "(not yet implemented)" note or is omitted from the skill doc

Fix any issues found before marking this task complete.

**Depends on:** T4.

**Expected outcome:** Both docs pass all six checks above.

## Hard constraints (apply to all tasks)

- No code changes anywhere outside `docs/`. Source files are read-only.
- Pillar directory name MUST match the features.yaml domain slug exactly: `agentic-methodology`. Not `methodology/`, not `agentic/`.
- Every rule ID mentioned in either doc must appear verbatim in `core/tools/lint-components/lib/rules/*.js`.
- Gaps from understanding.md section 8 must be honestly disclosed:
  1. `--validate-templates` not yet wired
  2. Node version unstated in package.json engines
  3. `info` severity infrastructure-only (no rule emits it)
  4. No skill `reference/intent.yaml` (SKILL.md is the only source)
  5. `structural/spelling-inconsistency` — base behavior on source code, ignore the conflicting comments
  6. Single-level scan only (no recursion)

Do NOT fabricate. If a piece of information is not in the source or in `understanding.md`, omit it rather than invent it.
