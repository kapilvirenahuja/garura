---
name: generate-engineering-view
description: "DEPRECATED — engineering view content now produced as part of tech.yaml by /prepare-implementation"
user-invocable: false
version: 1.0.0
category: strategy
model: sonnet
allowed-tools: Read, Write
---

# generate-engineering-view

> **DEPRECATED**
>
> This skill is no longer active. Engineering view content (epic breakdown, dependency sequence, architecture impact, technical risks, open questions) is now produced as part of `tech.yaml` by the `/prepare-implementation` recipe.
>
> Do NOT invoke this skill. If you need engineering-facing technical detail, use `/prepare-implementation` which writes `tech.yaml` and renders `tech-brief.html`.

---

## Why Deprecated

The engineering view was a standalone artifact (`roadmap-engineering.md`) derived from `roadmap.md` and `feasibility.yaml`. Under the new artifact naming system:

- `roadmap.md` → replaced by `roadmap.yaml` (produced by `draft-roadmap`)
- `feasibility.yaml` → folded into `roadmap.yaml` (produced by `assess-feasibility` + `draft-roadmap`)
- Engineering detail → produced as part of `tech.yaml` by `/prepare-implementation`

The separation of an engineering view from the roadmap is no longer needed because `roadmap.yaml` carries feasibility data inline, and deeper engineering specifics belong in `tech.yaml` where implementation context is available.

## Original Purpose (archived)

Transform an approved roadmap.md into an engineering-facing artifact. The output contained zero business context — only technical breakdown, complexity, risk, dependencies, and open questions. Audience was engineering only.

## Original Input (archived)

- `roadmap_path` — Path to the approved roadmap.md
- `scoped_epics` — Output of scope-roadmap-epics skill
- `feasibility_path` — Path to the STM feasibility file
- `output_base` — Base path for output

## Original Output (archived)

```yaml
engineering_view:
  path: "{full path to roadmap-engineering.md}"
  slug: "{slug}"
  epic_count: {integer}
  high_risk_count: {integer}
  open_questions_count: {integer}
  issue_traceability_complete: true|false
```

## Version

| Field | Value |
|-------|-------|
| Version | 1.0.0 (deprecated) |
| Category | strategy |
| Deprecated | true |
| Replaced by | tech.yaml via /prepare-implementation |
