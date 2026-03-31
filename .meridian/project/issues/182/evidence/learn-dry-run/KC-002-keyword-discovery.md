# Keyword-Based Knowledge Discovery
<!-- knowledge-file: tier=2 scope=core -->

**When this applies:** Any agent implementing or consuming LTM knowledge lookup within the Meridian framework.
**When this does NOT apply:** External search systems, retrieval-augmented generation pipelines, or any system that uses vector embeddings for knowledge retrieval.
**Search patterns:** knowledge discovery, keyword matching, search patterns, LTM index, _index.md, deterministic lookup
**Provenance:** Issue #182 — learn recipe dry run
**Created:** 2026-03-31

## Content

Knowledge discovery in Meridian is keyword-based, not semantic. The mechanism:

1. **Agent has a domain topic** — e.g., "authentication flow", "branch naming", "error handling strategy".
2. **Agent reads `_index.md` files** in relevant LTM categories. Each index entry includes a `Patterns:` field with comma-separated keywords.
3. **Agent matches topic keywords against `Search patterns:` fields** in candidate files. Matching is string-based (substring or token match). No embeddings, no cosine similarity, no LLM calls during discovery.
4. **Agent reads matched files** and applies their content during reasoning.

**Why no semantic search:** Semantic search introduces latency from embedding generation or vector DB calls, non-determinism (same query may return different results), and a dependency on an external ML service. Keyword matching is bounded by file I/O only — latency is predictable and results are reproducible.

**Index file contract:** Every knowledge file must have an entry in `{scope_base}/{category}/_index.md`. The entry format is:
```
- [{Title}]({filename}) — {one-line summary} | Patterns: {keywords}
```
Agents use the index to avoid reading all files; they read only files whose patterns match.

**Failure mode:** If an agent cannot find a matching file, it descends to the next resolution layer (core LTM, then LLM reasoning). It does not attempt fuzzy or phonetic matching.

## Why It Matters

Semantic discovery appears to improve recall but introduces unpredictable behavior — agents may find tangentially relevant files that contaminate reasoning with inapplicable context. Keyword matching forces knowledge authors to be explicit about retrieval intent (via `Search patterns:`), creating a contract between the file author and future consumers. This makes knowledge gaps visible (no match = no answer) rather than silently filling them with approximate content.

## Applicability Boundaries

**In scope:** File-based LTM systems where knowledge files are authored by humans or agents and must be discoverable by subsequent agents without shared state.
**Out of scope:** Systems with centralized search infrastructure, vector databases, or where knowledge files are auto-indexed by content hash.

## Rationale

The keyword discovery pattern is applicable to any file-based knowledge system that prioritizes determinism and auditability over recall completeness. The specific `_index.md` format is a Meridian convention, but the pattern of explicit search hints in file metadata is a cross-project principle worth capturing.

## Decay Tracking

**Last validated:** 2026-03-31
**Confidence:** medium
**Staleness window:** 180 days
**Supersedes:** null
