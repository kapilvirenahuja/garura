# Standards

Rules, YAML schemas, and output templates that define "how we do things" and "what outputs must look like."

Agents and skills query this category when they need to know: **"What are the rules, what is the shape, what is the output template?"**

## Contents

| Path | Purpose | See |
|------|---------|-----|
| `rules/` | Canonical per-domain rule files. One file per recipe-producing domain (epics, features, product, design, architecture, scenarios, plus operational rules for commits, git, pr, kb-extension, resolution protocol). Skills load these to enforce rules on their outputs. | `rules/_index.md` |
| `schemas/` | YAML schemas that drive artifact shape. Every skill that writes a YAML artifact conforms to a schema here; every validator uses the schema as source of truth. Currently: intent, intent-epic, screen-inventory. | `schemas/_index.md` |
| `templates/` | Output-shape templates for user-visible artifacts — GitHub issues, approval prompts, checkpoint files, evidence files, knowledge files. Replaces the former `memory/formats/` directory. | `templates/_index.md` |

## Layout principle

- **rules/** = "how must this artifact / surface be structured and enforced"
- **schemas/** = "what is the canonical YAML shape" (machine-readable contract)
- **templates/** = "what does the final output look like" (human-readable shape)

A single concept can show up in all three categories: a feature has a schema (`schemas/intent-epic.yaml`), rules about how it must be authored (`rules/features.md`), and a template for the epic file (none yet — intent-epic is pure YAML). A GitHub issue has no schema, no rule file yet, and one template (`templates/github-issue.md`). A commit has no schema, a rule file (`rules/commits.md`), and no dedicated template — the git commit subject line IS the output surface.

## When to Add Here

A file belongs under `standards/` if:
- It defines rules that agents must follow (goes in `rules/`)
- It defines the YAML shape of an artifact (goes in `schemas/`)
- It defines the user-visible shape of an output (goes in `templates/`)
- It would be customized by an adopter to match their team conventions

## Related

- `knowledge/` — factual claims, domain models, research (what's true, not what's allowed)
- `workflows/` — play-level recipe orchestration

> **Note:** The `agent-contract.md` JSON schema previously in this directory is now **ADR 016** (`docs/adr/016-agent-json-contract.md`) — it is foundational architecture, not organizational standards.
> Brief presentation rules previously in `brief-principles.md` are now `docs/design/briefs.md`. Brief HTML/CSS/JS templates live with the `doc-builder` agent at `core/components/agents/doc-builder/templates/`.
