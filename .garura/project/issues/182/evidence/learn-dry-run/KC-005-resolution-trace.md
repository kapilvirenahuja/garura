# Resolution Trace for Decision Auditability
<!-- knowledge-file: tier=2 scope=core -->

**When this applies:** Any agent that performs knowledge resolution and must record which layer answered each query, for downstream auditability or knowledge gap detection.
**When this does NOT apply:** Agents that do not perform LTM resolution (pure producers, utility agents); situations where STM is unavailable and there is no persistent store for the trace.
**Search patterns:** resolution trace, decision auditability, LTM source tracking, ungrounded fallback, knowledge gap, trace file, STM trace
**Provenance:** Issue #182 — learn play dry run
**Created:** 2026-03-31

## Content

A resolution trace records every decision an agent made during knowledge resolution. Each entry captures:

```yaml
- query: "branch naming convention"
  layer: project/locked          # project | core | llm
  source_file: "conventions/git.md"
  source_section: "Branch Names"
  resolved_value: "feat/{issue}-{slug}"
  confidence: high
  flagged_ungrounded: false
```

**Trace location:** Written to STM, not embedded in the agent's output contract. This keeps output payloads lean — consumers receive the decision, not the full provenance chain. The trace is available for audit and for the learn play to scan.

**Ungrounded entries:** When Layer 3 (LLM reasoning) answers a query, `flagged_ungrounded: true` is set and `source_file` is null. These entries are the primary signal for knowledge promotion — they show where the organization has not yet captured a decision.

**Trace usage in learn play:** The learn play reads resolution traces from STM evidence as one of its extraction sources. It identifies ungrounded entries, clusters them by topic, and generates knowledge candidates for those gaps.

**Trace does not block:** A resolution trace entry is informational. An ungrounded entry does not halt the agent or fail the workflow. It is recorded and the agent proceeds with the LLM-derived answer.

**Format note:** Traces are written as YAML lists in a file named `resolution-trace.yaml` within the issue's STM directory. One trace file per agent invocation, appended if multiple agents run in sequence.

## Why It Matters

Without traces, knowledge gaps are invisible until something goes wrong. With traces, every LLM fallback is a logged event that the learn play can convert into a knowledge candidate. The organization's knowledge gaps become a prioritized work queue rather than unknown unknowns. Additionally, when agents make wrong decisions, traces make the source auditable — "the agent used core file X, which was stale" is actionable; "the agent was wrong" is not.

## Applicability Boundaries

**In scope:** Multi-layer LTM systems where knowledge sources have different authority levels and agents must justify which source they used.
**Out of scope:** Single-source knowledge systems where all content is equally authoritative; stateless agents with no persistent output.

## Rationale

Audit trails for automated decisions are a universal requirement in any system where decisions affect correctness or quality. The resolution trace pattern applies the audit trail concept specifically to knowledge lookups, making LTM usage observable. This is reusable across any framework with layered knowledge resolution.

## Decay Tracking

**Last validated:** 2026-03-31
**Confidence:** medium
**Staleness window:** 180 days
**Supersedes:** null
