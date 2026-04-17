# Two-Phase Knowledge Lifecycle: Extract Then Promote
<!-- knowledge-file: tier=2 scope=core -->

**When this applies:** Designing any workflow that converts work artifacts (logs, traces, evidence) into persistent organizational knowledge.
**When this does NOT apply:** Workflows that write knowledge directly from agent output without human review; real-time knowledge updates where latency requirements prevent a human gate.
**Search patterns:** extract promote, knowledge lifecycle, two-phase, knowledge candidate, human gate, learn play, extraction phase, promotion phase
**Provenance:** Issue #182 — learn play dry run
**Created:** 2026-03-31

## Content

Knowledge creation is a two-phase process. The phases are strictly separated:

**Phase 1: Extraction (automated)**
- Agent reads evidence from completed work: STM files, resolution traces, eval results, implementation notes.
- Agent identifies patterns, decisions, and gaps that recurred or that relied on LLM fallback.
- Agent classifies each candidate: scope (project vs core), confidence, dedup status (new vs refinement of existing).
- Output: a staging directory of knowledge candidate files, not yet written to LTM.
- No human approval needed for this phase. Automation can run freely.

**Phase 2: Promotion (human-gated)**
- Play presents all candidates at a checkpoint with: proposed file path, classification rationale, dedup status, and full content.
- Human reviews each candidate individually: approve, reject, or defer.
- Approved candidates are written to LTM at the proposed paths.
- Rejected candidates are discarded — they leave no trace in LTM.
- Deferred candidates remain in staging for a future review cycle.

**Why the gate exists:** Extraction is pattern recognition under uncertainty. Agents will occasionally mis-classify (core vs project), over-generalize, or extract something that is work-in-progress rather than settled convention. The human gate catches these before they pollute LTM with incorrect or premature knowledge.

**Staging location:** `{stm_base}/{issue}/evidence/learn-dry-run/` — files here are candidates, not authoritative.

## Why It Matters

Direct promotion (agent writes to LTM without review) leads to knowledge pollution: contradictory files, over-specific project details promoted as universal patterns, or stale reasoning treated as current convention. Once a file exists in LTM, agents start using it. Bad knowledge propagates faster than it is caught. The extraction/promotion split contains the blast radius of any single agent error to the staging area, where it is visible but harmless.

## Applicability Boundaries

**In scope:** Any agent pipeline where automated agents produce knowledge artifacts that will be used by future automated agents. The stakes are higher when knowledge influences downstream automation.
**Out of scope:** Human-authored knowledge files where the author is directly responsible for correctness; ephemeral notes that are never promoted.

## Rationale

The extract-then-promote pattern is an instance of the broader principle: automate the tedious, gate the consequential. Extraction (reading and classifying evidence) is tedious and well-suited to automation. Promotion (deciding what the organization believes) is consequential and requires human judgment. This split is applicable to any organizational learning system, not just Meridian.

## Decay Tracking

**Last validated:** 2026-03-31
**Confidence:** medium
**Staleness window:** 180 days
**Supersedes:** null
