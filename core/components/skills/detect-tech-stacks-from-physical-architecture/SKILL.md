---
name: detect-tech-stacks-from-physical-architecture
description: Read physical-architecture.yaml and produce a stacks-detected.yaml listing every technology stack the codebase uses (runtime, framework, frontend framework, ORM, template engine, testing, observability) with versions and pointers to matching KB playbooks under core/components/memory/knowledge/tech/. Deterministic — no LLM reasoning; pattern-matches named products to a canonical stack catalog. Used by /decode before runtime tech-skill synthesis.
user-invocable: false
model: sonnet
allowed-tools: Read, Write, Grep, Glob
deprecated: true
deprecated_note: '#434 ProductOS realignment — superseded by the command model; retained for Phase E reference, not installed'
---

# detect-tech-stacks-from-physical-architecture

Called by the `/decode` play during its runtime tech-skill synthesis phase, before any extraction dispatch. Produces the structured list of stacks the play must load playbooks for.

## Purpose

`/decode` is tech-agnostic at compile time (C28) but tech-aware at runtime (C29). The play reads `physical-architecture.yaml` (produced by `/arch` or `/codify`) to discover the stacks in use, then synthesizes temp extraction skills per stack. This skill does the detection step — parsing the physical architecture and matching named products to a canonical stack catalog.

The detection is deterministic: the skill holds a pattern table mapping product names and version strings to stack IDs. No LLM reasoning is involved.

## Input

Receive from the `/decode` play orchestrator via JSON contract.

- `physical_architecture_path` (path, required) — `{product_base}/architecture/physical-architecture.yaml` OR a codify STM proposal at `{stm_base}/{codify_issue}/evidence/codify/proposals/architecture/physical-architecture.yaml`.
- `output_path` (path, required) — `{stm_base}/{issue}/evidence/decode/stacks-detected.yaml`.
- `kb_tech_root` (path, optional, default `core/components/memory/knowledge/tech/`) — where playbooks live.

## Process

### 1. Validate inputs

- Confirm `physical_architecture_path` exists and is valid YAML. Missing → structured failure with `what_failed: physical_architecture_missing`.
- Confirm `output_path` parent directory is writable; create if needed.
- Confirm `kb_tech_root` exists and is a directory. Missing → structured failure with `what_failed: kb_tech_root_missing`.

### 2. Parse physical-architecture.yaml

Extract named products from every stack slot:
- `runtime` (e.g., Node.js 22.13, Python 3.12, JVM 17)
- `http_framework` / `web_framework` (Express, Spring Boot, Django, Rails, Flask, FastAPI)
- `frontend_frameworks[]` (React, Vue, Angular, Ember, Svelte)
- `data_stores[]` ORM hints (Bookshelf, Hibernate, Active Record, SQLAlchemy, Prisma, TypeORM)
- `template_engines[]` (Handlebars, Jinja, Thymeleaf, JSX)
- `test_frameworks[]` (Jest, Vitest, JUnit, pytest, RSpec, Playwright, Cypress)
- `observability[]` (Sentry, Prometheus — not extraction-relevant but recorded for completeness)
- `monorepo_tooling` (pnpm, Nx, Lerna, Turborepo, Bazel)

### 3. Match products to canonical stack catalog

The skill holds a pattern table of the form:

```yaml
canonical_stacks:
  - id: node-express
    matches: ["express", "expressjs"]
    kb_playbook: "node-express.md"
    detection_priority: high
    category: backend
  - id: spring-boot-3
    matches: ["spring boot 3", "spring-boot 3", "org.springframework.boot:3"]
    kb_playbook: "spring-boot-3.md"
    detection_priority: high
    category: backend
  - id: react-18
    matches: ["react 18", "react@18", "react 17", "react@17"]
    kb_playbook: "react-18.md"
    detection_priority: high
    category: frontend
  # ... additional stacks
```

For every detected product, match against the patterns (case-insensitive, substring aware). Produce one detected-stack entry per match. Unknown products (no pattern match) emit an entry with `kb_playbook: null` and `detection_status: unknown` — the play then surfaces this as F15 (missing playbook).

### 4. Resolve KB playbook paths

For every detected stack with a non-null `kb_playbook`, confirm the file exists at `{kb_tech_root}/{kb_playbook}`. If missing, flag `detection_status: playbook_missing` and include the full path expected — /decode uses this message verbatim in its hard-halt error.

### 5. Emit stacks-detected.yaml

Write at `output_path`:

```yaml
detected_at: "{ISO timestamp}"
physical_architecture_path: "{input path}"
stacks:
  - stack_id: "node-express"
    product_name: "Express 4.21.2"
    version: "4.21.2"
    category: "backend"
    kb_playbook: "node-express.md"
    kb_playbook_path: "core/components/memory/knowledge/tech/node-express.md"
    detection_status: "resolved" | "playbook_missing" | "unknown"
    evidence_ref: "physical-architecture.yaml#http_framework"
  # ... one per detected stack
summary:
  total_stacks: <int>
  resolved: <int>
  playbook_missing: <int>
  unknown: <int>
```

## Output

Primary artifact: `stacks-detected.yaml` at `output_path`.

No decision manifest — detection is deterministic.

## Failure Modes

```yaml
status: failure
what_failed: "physical_architecture_missing | kb_tech_root_missing | parse_error"
detail: "<specific error string>"
evidence: { offending_path: "<path>" }
```

## Notes

- The canonical_stacks pattern table lives embedded in the skill (in its lib/ or inline). New stacks are added by editing the table + adding a matching KB playbook.
- Versions ARE extracted even when the pattern match is version-agnostic — they're recorded on the detected stack for playbook version selection (e.g., spring-boot-2 vs spring-boot-3).
- If physical-architecture.yaml has a `technology_stack` top-level list, the skill honors the ordering as detection priority.
- `detection_status: unknown` does NOT halt this skill — it reports cleanly. /decode is responsible for halting per F15 when any stack lacks a playbook.
