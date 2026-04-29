---
name: synthesize-tech-skill-from-playbook
description: Read a tech playbook at core/components/memory/knowledge/tech/{stack}.md plus a detected stack record, and synthesize a temporary extraction SKILL.md scoped to the current /decode issue. Pure template substitution — no LLM reasoning. Output is placed in STM at {stm_base}/{issue}/evidence/decode/temp-skills/ and optionally symlinked into .claude/skills/ for Skill tool dispatch. Covers constraints C29–C31 of /decode.
user-invocable: false
model: sonnet
allowed-tools: Read, Write
---

# synthesize-tech-skill-from-playbook

Called by the `/decode` play per detected stack, after `detect-tech-stacks-from-physical-architecture` produces `stacks-detected.yaml`. Produces one temp extraction skill per detected stack.

## Purpose

`/decode` remains tech-agnostic at compile time; tech-specific extraction logic is synthesized at runtime from KB playbooks. This skill is the synthesis step: it takes a canonical playbook describing how a given stack organizes business logic and produces an ephemeral SKILL.md that `tech-architect` can dispatch via the Skill tool.

Synthesis is deterministic — playbook contents + detected stack record → SKILL.md via template substitution. No LLM reasoning. The playbook is the source of truth; this skill just materializes it into the Skill tool's expected shape.

## Input

Receive from the `/decode` play orchestrator via JSON contract.

- `playbook_path` (path, required) — e.g., `core/components/memory/knowledge/tech/node-express.md`.
- `stack_record` (object, required) — one entry from `stacks-detected.yaml` containing `stack_id`, `product_name`, `version`, `category`.
- `output_skill_dir` (path, required) — `{stm_base}/{issue}/evidence/decode/temp-skills/extract-from-{stack_id}/`. A directory (the SKILL.md is written inside).
- `claude_skills_link_dir` (path, optional) — `.claude/skills/decode-temp-extract-from-{stack_id}/`. If provided, the skill creates a symlink (or copy on platforms without symlink) here for Skill tool discoverability.

## Process

### 1. Validate inputs

- Confirm `playbook_path` exists and is a Markdown file. Missing → structured failure `what_failed: playbook_missing`.
- Confirm `output_skill_dir` parent exists; create the directory itself.
- If `claude_skills_link_dir` is provided, confirm `.claude/skills/` is writable.

### 2. Parse playbook

Playbooks follow a canonical section structure (defined in `core/components/memory/knowledge/tech/_playbook-template.md`). Parse the following sections:

- `## Stack Identity` — name, version range, category
- `## Where Business Logic Lives` — directory conventions, file naming patterns, entry points
- `## Canonical Patterns` — controllers, services, repositories, middleware, hooks, components (stack-specific vocabulary)
- `## Aspect Recognition` — how cross-cutting concerns appear (decorators, middleware chains, annotations)
- `## Flow Tracing` — how to follow a user action end-to-end in this stack
- `## Test Conventions` — test file naming, framework, location

Extract each section's content verbatim. Parsing errors (missing required section) → structured failure `what_failed: playbook_malformed` with the missing section name.

### 3. Substitute stack-specific variables

Apply substitutions from `stack_record` into the parsed sections:
- `{stack_id}` → e.g., `node-express`
- `{product_name}` → e.g., `Express 4.21.2`
- `{version}` → e.g., `4.21.2`
- `{category}` → `backend | frontend | data | template`

### 4. Assemble SKILL.md

Emit to `{output_skill_dir}/SKILL.md`:

```markdown
---
name: extract-from-{stack_id}
description: "{One-line derived from playbook Stack Identity section.} EPHEMERAL — synthesized at runtime by /decode; removed on final Tether."
ephemeral: true
source_playbook: "{playbook_path}"
stack_version: "{version}"
---

# extract-from-{stack_id}

Synthesized extraction skill for {product_name}. Produced by `synthesize-tech-skill-from-playbook` during a /decode run.

## Where Business Logic Lives

{playbook section content, verbatim after substitution}

## Canonical Patterns

{playbook section content}

## Aspect Recognition

{playbook section content}

## Flow Tracing

{playbook section content}

## Test Conventions

{playbook section content}

## Usage

Invoked by `tech-architect` during /decode extraction. Receives a file path and a unit kind (feature | flow | aspect). Returns structured extraction per the unit's shape constraints (C4a / C4b / C4c).

## Cleanup

This skill file is removed on /decode's final Tether by `cleanup-temp-skills`. Do NOT reference this skill from outside the /decode issue that synthesized it.
```

### 5. Optional symlink into .claude/skills/

If `claude_skills_link_dir` is provided:
- Create `.claude/skills/decode-temp-extract-from-{stack_id}/` as a directory.
- Symlink (or copy if symlinks unsupported) `{output_skill_dir}/SKILL.md` into it.
- `.claude/` is gitignored per repo convention; these artifacts do not ship in version control.

### 6. Emit synthesis record

Write `{output_skill_dir}/synthesis-record.yaml`:

```yaml
synthesized_at: "{ISO timestamp}"
stack_id: "{stack_id}"
product_name: "{product_name}"
version: "{version}"
playbook_source: "{playbook_path}"
output_skill_path: "{output_skill_dir}/SKILL.md"
claude_link_path: "{claude_skills_link_dir or null}"
ephemeral: true
cleanup_trigger: "on_final_tether"
```

## Output

Primary artifact: `SKILL.md` at `{output_skill_dir}/`.
Companion: `synthesis-record.yaml` at same directory.
Optional: symlink at `{claude_skills_link_dir}/SKILL.md`.

## Failure Modes

```yaml
status: failure
what_failed: "playbook_missing | playbook_malformed | output_dir_unwritable | symlink_failed"
detail: "<specific>"
evidence: { offending_path: "<path>", missing_section: "<section name, if parse error>" }
```

## Notes

- Playbook authoring is out of scope for this skill. Playbooks are hand-authored under `core/components/memory/knowledge/tech/` following `_playbook-template.md`.
- The synthesized skill is intentionally **not** registered in any permanent skill inventory. Its discoverability via the Skill tool depends entirely on the `.claude/skills/` symlink while the play runs.
- Version-specific playbooks (e.g., `spring-boot-2.md` vs `spring-boot-3.md`) are selected by `detect-tech-stacks-from-physical-architecture` via the canonical stack catalog. This skill trusts the playbook path it receives.
- Substitution uses literal string replacement. Playbooks must not contain `{variable}` patterns in their prose except for the variables this skill substitutes.
