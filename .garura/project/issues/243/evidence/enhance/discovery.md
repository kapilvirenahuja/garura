# Discovery — Issue #243: Ground Meridian canonical glossary

## Issue Summary

Meridian's core concepts are defined implicitly across dozens of files. No single canonical glossary exists. This causes self-development friction (agents re-derive meanings) and runtime inconsistency (same concept framed differently per play).

## Issue Body

Create a grounding document defining every Meridian concept with: Name, Definition, Examples, Relationships, Anti-definitions. Covers hierarchy (play/agent/skill), memory architecture (LTM/STM/KB/context/evidence), execution model (trinity/checkpoint/resolution protocol), reconciliation (tiers/ADR/enrichment), and modes (1/2/3).

## Q&A

### Q1: Location and cross-referencing
**Answer:** The glossary goes in `core/grounding/glossary.md` — NOT in `core/components/memory/`. The distinction:
- `core/components/` = what gets deployed with Meridian (skills, plays, agents, memory)
- `core/grounding/` = what Meridian uses for its own self-development

CLAUDE.md (and AGENTS.md) should reference this file so agents read the glossary during Meridian development work. This replaces the acceptance criterion about "cross-referenced by at least one play."

### Q2: Scope
**Answer:** Exhaustive — cover every concept listed in the issue plus any discovered during context assembly. No "to be expanded" section.
