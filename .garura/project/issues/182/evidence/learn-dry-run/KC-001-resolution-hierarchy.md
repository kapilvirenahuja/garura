# Three-Layer Knowledge Resolution Hierarchy
<!-- knowledge-file: tier=2 scope=core -->

**When this applies:** Any agent performing knowledge resolution — looking up project decisions, conventions, or patterns before acting.
**When this does NOT apply:** Agents that do not consult LTM at all (e.g., pure utility agents like file-writer with no decision-making scope).
**Search patterns:** knowledge resolution, LTM lookup, project LTM, core LTM, LOCKED, DRAFT, resolution order, fallback
**Provenance:** Issue #182 — learn play dry run
**Created:** 2026-03-31

## Content

Agents resolve knowledge in strict layer order. They descend only as far as needed:

**Layer 1 — Project LTM**
- LOCKED files are authoritative. When LOCKED content answers the query, resolution stops. The agent uses that content and records source as `project/locked`.
- DRAFT files are advisory. They inform the agent but do not stop descent. The agent records source as `project/draft` and continues to check for corroborating or conflicting content in deeper layers.

**Layer 2 — Core LTM**
- Advisory only. Core content supplements project content. It never overrides LOCKED project decisions.
- Consulted when: (a) no project LOCKED file answers the query, or (b) a DRAFT project file needs corroboration.
- Source recorded as `core`.

**Layer 3 — LLM Reasoning**
- Pure fallback. Used only when Layers 1 and 2 yield no applicable content.
- All conclusions from this layer are flagged as `ungrounded` in the resolution trace.
- Ungrounded entries are the primary signal for knowledge gap identification and future promotion to LTM.

**Conflict rule:** Project always wins. When project LOCKED content contradicts core content, project is applied. The contradiction is recorded in the resolution trace but does not block the agent.

**Descent termination:** The agent stops descending the moment LOCKED project content is found for the specific query. It does not continue to validate against core or LLM for LOCKED answers.

## Why It Matters

Without a defined resolution order, agents blend project-specific decisions with generic patterns. This causes project conventions to be silently overridden by core defaults, or LLM reasoning to fill gaps that have already been decided. The hierarchy makes resolution deterministic and auditable — the same query produces the same answer regardless of which agent runs it.

## Applicability Boundaries

**In scope:** Any multi-layer LTM system where project-specific knowledge must take precedence over reusable defaults, and where LLM reasoning is a fallback rather than a primary source.
**Out of scope:** Single-layer flat knowledge stores; systems where all knowledge is treated as equally authoritative regardless of source.

## Rationale

The three-layer hierarchy is a universal pattern for layered configuration and knowledge systems. The specific layer names (project/core/LLM) are Meridian conventions, but the resolution order principle — specific overrides general, explicit overrides inferred — applies across frameworks. Any agent-based system with multiple knowledge sources benefits from a defined resolution contract.

## Decay Tracking

**Last validated:** 2026-03-31
**Confidence:** medium
**Staleness window:** 180 days
**Supersedes:** null
