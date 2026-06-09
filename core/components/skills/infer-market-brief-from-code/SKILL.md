---
name: infer-market-brief-from-code
description: Produce a low-fidelity market-brief.md stub from codebase signals (README, manifests, ADRs, git tags, deploy config) during /codify. Owned by product-keeper. Confidence defaults to low; real market data is never inferable from code.
version: 0.1.0
user-invocable: false
model: sonnet
allowed-tools: Read, Write, Grep, Glob, Bash
deprecated: true
deprecated_note: '#434 ProductOS realignment — superseded by the command model; retained for Phase E reference, not installed'
---

# infer-market-brief-from-code

Called by `product-keeper` during /codify. Produces `specification/market-brief.md` at `{stm_base}/{issue}/evidence/codify/proposals/specification/market-brief.md`.

## Purpose

Emit a low-fidelity stub of the greenfield market brief using only codebase-visible signals. In /specify the market-analyst agent produces this artifact from web research; in /codify the codebase is the sole window. Expect thin evidence — README framing, manifest descriptions, ADR business context, git tag cadence, deploy targets — none of which surface TAM/SAM/SOM, competitive landscape, pricing strategy, or market sizing.

**This skill is explicitly a stub producer.** Confidence should almost always resolve to `low`. The artifact's most important section is `knowledge_gaps` — it lists what could not be inferred so downstream /codify flows file R4 entries in resolution-trace and humans can enrich the brief later.

## Input

| Field | Required | Description |
|-------|----------|-------------|
| `scan_index_path` | yes | Path to scan-index.json produced by scan.py |
| `stm_base` | yes | STM root (resolved from `.garura/core/config.yaml` stm.base-path) |
| `issue` | yes | Issue number driving /codify |
| `output_path` | yes | Target path — typically `{stm_base}/{issue}/evidence/codify/proposals/specification/market-brief.md` |
| `decision_manifest_path` | yes | Where per-decision provenance is recorded |
| `ltm_context` | optional | Resolved LTM pointers from the Resolution Protocol (prior market briefs as templates) |
| `resolution_trace_path` | yes | Where R1–R4 resolution decisions are recorded |

## Process

1. **Validate inputs.** Confirm `scan_index_path` exists and is readable; confirm `stm_base/{issue}/` is writable; confirm `output_path` parent directory exists (create if absent).

2. **Resolution Protocol.** Walk R1 → R4 for any inferred market claim. R3 may consult `core/components/memory/` for prior market briefs as structural templates (never as evidence). Write resolution decisions to `resolution_trace_path`. Claims with no KB or web backing land as R4 entries and feed `knowledge_gaps`.

3. **Signal extraction from scan-index.json.**
   - `docs.readme_preview` — pull positioning language, target-user phrasing, feature bullets. Scan for phrases like "for {audience}", "helps you {verb}", "alternative to X", "similar to Y". Capture literal quotes with line references — never paraphrase positioning and treat the paraphrase as evidence.
   - `docs.adrs` — scan each ADR preview for business-context framing (market rationale, positioning decisions, competitive reasoning). Technical ADRs are irrelevant here and must be skipped.
   - `manifests[*].name` / `manifests[*].description` — elevator-pitch level framing; one line each. A manifest description is rarely richer than a tagline.
   - `git.tags_recent` — release cadence as a crude maturity proxy (dense tags → active; sparse or none → early/dormant). Never a market signal — record as context only.
   - `config_files.deploy` — deployment targets hint at distribution model (self-hosted binaries vs SaaS vs library vs CLI). Never a pricing or go-to-market signal; record as distribution hypothesis only.
   - `frontend_detection` and `entry_points` — presence of a web UI vs CLI-only vs API-only hints at buyer-user shape. Record as hypothesis only.

4. **Author `market-brief.md`** with YAML frontmatter (the meta block) + markdown body. Body sections, in order:
   - `# Product positioning` — one paragraph drawn from README framing. If README is absent or silent, state so explicitly and route to knowledge_gaps.
   - `# Target users` — bullet list inferred from README language (personas named, use cases described). Each bullet tagged with `[evidence: readme_preview L{n}]` or `[inferred]`.
   - `# Value proposition` — what the README or manifest description claims the product does for whom. One to three bullets.
   - `# Competitive context` — thin by default. Only populate if README literally names competitors or positions against a category; otherwise a single line: "No competitive context inferable from codebase signals. See knowledge_gaps."
   - `# Knowledge gaps` — always substantial. Itemize at minimum:
     - TAM / SAM / SOM (total / serviceable / obtainable market)
     - market size and growth rate
     - pricing strategy and revenue model
     - buyer vs user distinction (who pays, who uses)
     - geographic reach and regulatory context
     - competitor list and differentiated positioning
     - customer acquisition channel and GTM motion
     - maturity / lifecycle stage of the market category
     Each gap marked `source_type: uninferable_from_code` to drive R4 entries in resolution-trace.

5. **Record decisions in decision manifest.** Every inferred statement in the body carries an entry with: claim, signal(s) cited, confidence (`low` | `medium` — never `high` in this skill), source_type (`inferred_from_code` | `uninferable_from_code`). Low-confidence statements dominate.

## Output

- **Primary artifact:** `market-brief.md` at `output_path` with YAML frontmatter:

  ```yaml
  ---
  meta:
    source_type: "inferred_from_code"
    evidence:
      - "{scan_index_path}#docs.readme_preview"
      - "{scan_index_path}#manifests[*].description"
      - "{scan_index_path}#git.tags_recent"
    confidence: "low"         # expected default — only raise to "medium" if README is genuinely rich and names real market context
    learning_category: "product"
    sub_category: null
    tier: 2
    note: "Low-fidelity stub. Market context is not inferable from code alone. See knowledge_gaps section for items requiring human input or web research."
  ---
  ```

  followed by the markdown body described in Process step 4.

- **Decision manifest** at `decision_manifest_path` — one entry per inferred body statement.
- **Resolution trace** at `resolution_trace_path` — R1–R4 entries for every claim, with R4 entries dominating.

## Confidence Discipline

Never inflate confidence to paper over thin evidence. A `medium` rating requires README content that *explicitly* states positioning, target users, and at least one named competitor or market category. Absent all three, stay at `low`. A missing README forces `low` with a single-line body pointing everything to knowledge_gaps — do not fabricate positioning from code structure alone.

## Failure Modes

- `scan_index_missing` — scan_index_path does not exist or is malformed.
- `ltm_resolution_failed` — Resolution Protocol could not complete (e.g., memory path unreadable); proceed with R4-only trace and flag in meta.note.
- `insufficient_signal` — no README, no manifest descriptions, no business ADRs. Proceed with `confidence: low`, a minimal body, and an exhaustive knowledge_gaps section. Do not fail the skill — the stub is the point.

## Boundaries

- Read-only against the codebase; writes only to `output_path`, `decision_manifest_path`, `resolution_trace_path`.
- Never performs web research — that is the /specify market-analyst path.
- Never produces quantified market claims (TAM/SAM/SOM, pricing, market size). Those always route to knowledge_gaps.
- Does not aggregate with other /codify proposals — that is `aggregate-codify-proposals`' job.
