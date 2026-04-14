# Standards

Rules, conventions, and quality criteria that define "how we do things."

Agents and skills query this category when they need to know: **"What are the rules?"**

## Contents

| Path | Description | Consumers |
|------|-------------|-----------|
| `commits/categories.md` | Commit type categorization (feat, fix, refactor, etc.) | analyze-changes, analyze-pr, create-commit |
| `commits/quality-rules.md` | Commit format and quality validation rules | analyze-pr, create-commit |
| `git/branching.md` | Branch naming conventions and quality gate implications | repo-orchestrator, setup-branch |
| `git/pr-severity-taxonomy.md` | Mechanical PR severity taxonomy — standard IDs mapped to P1/P2/P3/P4 with grep/path match rules | review-pr, quality-check-scoped |
| `agent-lifecycle/epic-management-rules.md` | Epic management rules — vertical slice delivery, single module scope, mocks, dependency discipline, foundation investments | scope-roadmap-epics, assess-feasibility, prepare-implementation, feature-steward, tech-designer |
| `intent-schema.yaml` | Canonical intent.yaml contract — fields produced by intent-crafter and consumed by intent-resolver / create-play | intent-crafter, intent-resolver, create-play |
| `knowledge-file-template.md` | Canonical knowledge file template — Tier 1 (all files) and Tier 2 (core-scoped) metadata requirements, staleness rules, and index registration conventions | knowledge-extractor, capture-learning |
| `resolution-protocol.md` | R1-R4 resolution protocol — LTM hierarchy enforcement, authority semantics (LOCKED/DRAFT), resolution trace schema, context isolation exemptions | tech-designer, feature-steward, repo-orchestrator |

> **Note:** The `agent-contract.md` JSON schema previously in this directory is now **ADR 016** (`docs/adr/016-agent-json-contract.md`) — it is foundational architecture, not organizational standards.
> Brief presentation rules previously in `brief-principles.md` are now `docs/design/briefs.md`. Brief HTML/CSS/JS templates live with the `briefs` play at `core/components/plays/briefs/templates/`.

## When to Add Here

A file belongs in `standards/` if:
- It defines rules that agents must follow
- It would be customized by an adopter to match their team conventions
- It answers "what's allowed?" or "what's the format?"
