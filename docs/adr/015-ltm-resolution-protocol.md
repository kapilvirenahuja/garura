# ADR 015: LTM Resolution Protocol and Learning Recipe

**Status:** Accepted
**Date:** 2026-03-31
**Deciders:** Kapil Ahuja

## Context

Meridian agents were making domain decisions without systematically consulting stored knowledge. Three gaps existed:

1. No agent checked project-level LTM artifacts before falling back to LLM reasoning
2. Core LTM consultation was agent-internal prose, not enforced by the contract schema
3. Knowledge discovered during execution sat in STM evidence files with no promotion mechanism

This meant every agent dispatch potentially reinvented decisions that prior work had already resolved, and valuable discoveries were lost after each session.

## Decision

### Resolution Protocol (R1-R4)

We introduced a 3-layer resolution hierarchy enforced through the agent contract schema:
- **Layer 1 (Project LTM):** .meridian/product/ — LOCKED artifacts are authoritative
- **Layer 2 (Core LTM):** ~/.meridian/core/memory/ — always advisory
- **Layer 3 (LLM reasoning):** fallback, flagged as "ungrounded"

Agents receiving the new `ltm_context` contract field follow the R1-R4 protocol before any domain reasoning. Every domain decision is recorded in a resolution trace.

### Contract Schema Extension

The universal agent contract gained two optional fields:
- `ltm_context` (input): project_base, core_base, query_domains, locked_artifacts
- `resolution_trace_path` (output): path to per-decision trace in STM

Both are optional — backward compatibility is preserved.

### Agent Updates

5 agents updated: tech-designer, product-strategist (full R1-R4), code-builder, quality-auditor (lightweight awareness), repo-orchestrator (convention check). 2 agents exempt: eval-generator, judge (context isolation preserved).

### Recipe Updates

7 recipes populate ltm_context in their agent dispatch contracts. 2 recipes had ad-hoc LTM path fields replaced by the standard field.

### Learning Recipe

A new `learn` recipe reads resolution traces from completed work, identifies LLM fallback decisions as promotion candidates, and presents them for human approval before writing to LTM. A `knowledge-extractor` agent handles extraction and classification.

### Knowledge File Standard

A canonical template standardizes all knowledge files with Tier 1 (required) and Tier 2 (core-required) metadata, including decay tracking via `last_validated` and `confidence` fields.

## Consequences

### Positive
- Consistent knowledge resolution across all agent dispatches
- Traceable decisions — every domain choice records its source
- Accumulating knowledge — LLM fallbacks become LTM entries over time
- Backward compatible — existing recipes without ltm_context continue working

### Negative
- Agent definitions are more complex (R1-R4 protocol text)
- Resolution trace adds file I/O per agent dispatch (minimal latency)
- Knowledge staleness is a new maintenance concern (mitigated by decay tracking)

## Related ADRs
- ADR 001: Three-Layer Hierarchy (now extended to knowledge resolution)
- ADR 009: Skill LTM Reads (now formalized into R1-R4 protocol)
