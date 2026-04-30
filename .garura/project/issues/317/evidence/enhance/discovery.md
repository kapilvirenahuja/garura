# Discovery — Issue #317

## Issue body (verbatim)

**Title:** docs: document lint-components tool and skill introduced in #252

**Description:**
The component linting feature (#252) shipped a new Node.js CLI tool at `core/tools/lint-components/` and a new skill `lint-components`. Neither has documentation beyond inline comments and the SKILL.md Process section. This issue tracks adding user-facing documentation covering: (1) how to invoke the linter CLI directly, (2) how to invoke the lint-components skill from other plays/skills, (3) what each rule tier checks (structural/semantic/cross-reference), (4) how to interpret the quality-profile severity mapping in the lint report, (5) how to run `npm install` for the tool on first use.

## What this issue is about

A while back (#252), a Node.js linter for Meridian components shipped at `core/tools/lint-components/`, with a wrapper skill at `core/components/skills/lint-components/`. The linter checks plays, skills, and agents against three rule categories — structural, semantic, cross-reference — and maps violations to severities via the project's quality profile. Right now the only documentation is inline code comments and a brief Process section in the skill file. This issue adds user-facing docs covering install, CLI invocation, skill invocation, rule tiers, and severity interpretation.

Pure documentation work — no code changes, no behavioral changes.

## Q&A — orchestrator → user

### Q1. Where should the documentation live?

**Decision:** two files in two homes.

1. **Skill-side doc** (how to invoke the skill from other plays/skills) → `docs/usage/skills/lint-components.md`. Fits the existing skill-usage convention; the `docs/usage/skills/` folder exists today with just a `.gitkeep`.

2. **Tool-side doc** (CLI invocation, `npm install`, internals) → goes in a NEW pillar-organized docs structure under `docs/{pillar-slug}/`. Pillar slugs match `features.yaml` domain slugs exactly. The five pillars:
   - `agentic-methodology`
   - `engineering-observability`
   - `ai-governance`
   - `work-intelligence`
   - `engineering-experience`

   The lint-components tool is a methodology concern (it validates Meridian's own component contracts — plays, skills, agents). Its tool-side doc lands at `docs/agentic-methodology/tools/lint-components.md`.

3. **Scaffold scope** for the other four pillars: NOT now. Don't create empty placeholder folders. Each pillar directory comes into existence the first time a doc lands under it.

### Q2. How much example detail should the docs include?

**Decision:** examples included.

- Skill-side doc: sample JSON contract a calling agent would send + sample report.yaml excerpt showing how violations and severities appear.
- Tool-side doc: sample CLI invocation with terminal output snippet + sample `npm install` output.

Examples make the doc 10× more useful. This is the kind of doc someone (including future me) hits first when trying to use the linter — terse reference docs without examples push the reader straight to the source.

### Q3. Severity-mapping reference — describe inline or link out?

**Decision:** describe inline in the doc that needs it.

The severity mapping uses the project quality profile. The skill-side doc explains how to read the report; severity values come from quality-profile.yaml entries the linter consults. Describe the mapping inline so the reader doesn't need to follow links to understand the report. If a deeper quality-profile reference exists already, link to it as a footnote — but don't depend on it for the explanation.

### Q4. Update `docs/components/skills.md` to mention lint-components?

**Decision:** out of scope for this issue.

`docs/components/skills.md` is the philosophy doc for skills as a category. It doesn't currently enumerate every skill. Adding lint-components to a catalog there is a separate concern — possibly a future "skills catalog" effort but not this issue. Leave untouched.

### Q5. Update root README or other top-level entry points?

**Decision:** out of scope for this issue.

The two new docs are reachable by anyone browsing `docs/` directly. Wiring them into top-level navigation/README is a separate docs-IA concern. If a future issue covers nav, both files will be picked up at that time.

## Confirmed integration points

- **Code under documentation** (read-only — no edits to source):
  - `core/tools/lint-components/index.js` (CLI entry)
  - `core/tools/lint-components/lib/` (rule implementations)
  - `core/tools/lint-components/package.json` (npm config)
  - `core/components/skills/lint-components/SKILL.md` (skill definition — has the JSON contract shape)
  - `core/components/memory/standards/rules/` (quality-profile severity rules the linter consults)

- **New files to create:**
  - `docs/usage/skills/lint-components.md` (skill-side)
  - `docs/agentic-methodology/tools/lint-components.md` (tool-side)
  - `docs/agentic-methodology/` (new directory)
  - `docs/agentic-methodology/tools/` (new subdirectory)

- **Untouched (out of scope):**
  - `docs/components/skills.md` and other category-philosophy docs
  - Root README, top-level nav
  - Any code under `core/tools/lint-components/` or `core/components/skills/lint-components/` (no behavior changes)
  - Any other pillar directories (`engineering-observability/`, `ai-governance/`, `work-intelligence/`, `engineering-experience/` — not created until needed)

## Success criteria

A new contributor (or future self) can:

1. Read `docs/agentic-methodology/tools/lint-components.md` and successfully run `npm install` + invoke the CLI on a play directory and read the output.
2. Read `docs/usage/skills/lint-components.md` and write a play/skill that invokes lint-components correctly via the JSON contract.
3. Understand from either doc what the three rule tiers check and how severities are assigned.
4. No behavior changes in the linter itself; this is documentation only.
