# Agent Audit: knowledge-extractor (ENRICH mode for /enrich play)

| Principle | Status | Finding |
|-----------|--------|---------|
| P1 JSON Contract | PASS | ENRICH mode input/output documented as JSON contracts (`mode: enrich`, `stm.input.proposals_path`, structured output with `status`, `task_id`, `stm.output`). |
| P2 STM Path Handoff | PASS | All inputs/outputs are STM paths (`proposals_path`, `product_base`); no inline data. |
| P3 Intent Awareness | PASS | Agent reads `intent_path` from contract on entry. Will receive `enrich/reference/intent.yaml` when invoked by /enrich. |
| P4 Structured Failure | PASS | Documented failure protocol with named error types (`proposals_not_found`, `product_base_unreachable`, `artifact_write_failed`, etc.) and `domain_assessment` block. |
| P5 No Direct User Interaction | PASS | No `AskUserQuestion` in tools list. The play owns reviewer interaction; the agent receives already-approved proposals. |
| P6 Output Contract Discipline | PASS | ENRICH output is the JSON contract only — `written_files`, `adrs_written`, `summary`. Artifacts go to LTM and STM file paths. |
| P7 Skill Delegation | **FAIL** | ENRICH mode's current Skill Pool only lists `apply-ltm-enrichment`. The /enrich play's design requires THREE skills: `normalize-proposals-for-enrichment` (per-source mapping, run BEFORE review), `apply-ltm-enrichment` (write approved entries), and `promote-adr-draft` (create ADR file for approved T1 entries). The current ENRICH steps describe the ADR write inline (`Write ADR document to product ADR location`) — that's artifact production the new `promote-adr-draft` skill now owns. |
| P8 Recovery and Escalation | PASS | Max 1 retry, structured escalation after 2 attempts total. |
| P9 Domain Boundaries | PASS | Knowledge domain (LTM reconciliation). All proposed enrich-mode work stays within that boundary. |
| P10 Task Graph Participation | PASS | Marks `task_id` `in_progress` / `completed` / `failed`. |
| P11 Context Sufficiency | EXEMPT | ENRICH mode operates entirely on contract-supplied paths (proposals.yaml + product LTM root). Fits the exemption clause: agent produces writes from contract data, no domain knowledge discovery needed. |

## Summary

10 PASS, 1 FAIL, 1 EXEMPT.

## P7 Fix proposal — upgrade knowledge-extractor's ENRICH mode

The agent already declares ENRICH mode and is the right owner. Three concrete changes needed in `core/components/agents/knowledge-extractor.md`:

1. **Skill Pool table** — add two rows:
   - `normalize-proposals-for-enrichment` — invoked at the start of ENRICH mode for each issue's native proposals.yaml.
   - `promote-adr-draft` — invoked once per approved Tier 1 proposal that carries an `adr_draft_path`.
2. **ENRICH mode Steps** — restructure:
   - Step 1: invoke `normalize-proposals-for-enrichment` with the native source proposals.yaml → produces reconciliation-proposals.yaml.
   - Step 2 (owned by play, not agent): reviewer approval cycle.
   - Step 3: invoke `apply-ltm-enrichment` with approved reconciliation entries → writes product LTM.
   - Step 4: for each approved T1 entry with `adr_draft_path`, invoke `promote-adr-draft` → writes new ADR file.
   - Remove the inline "Write ADR document to product ADR location" instruction — that authorship now belongs to `promote-adr-draft`.
3. **Description** — extend the ENRICH mode line to mention per-source normalization and ADR promotion.

Re-audit after upgrade should produce 11/11 PASS (or 10 PASS + 1 EXEMPT).

## Re-audit (post-upgrade)

Upgrade applied to `core/components/agents/knowledge-extractor.md` — description extended, ENRICH-mode rewritten as pre-review / post-review phases, Skill Pool table now lists `normalize-proposals-for-enrichment`, `apply-ltm-enrichment`, and `promote-adr-draft`, inline ADR authorship removed, input contract documents the `phase` field.

| Principle | Status |
|-----------|--------|
| P1 JSON Contract | PASS |
| P2 STM Path Handoff | PASS |
| P3 Intent Awareness | PASS |
| P4 Structured Failure | PASS (added `error: review_incomplete` for the post-review pending-entry case) |
| P5 No Direct User Interaction | PASS (review explicitly owned by play, not agent) |
| P6 Output Contract Discipline | PASS |
| P7 Skill Delegation | **PASS** — three skills declared and invoked, no inline artifact authoring |
| P8 Recovery and Escalation | PASS |
| P9 Domain Boundaries | PASS |
| P10 Task Graph Participation | PASS |
| P11 Context Sufficiency | EXEMPT |

**Final: 10 PASS + 1 EXEMPT. Gate cleared.**

