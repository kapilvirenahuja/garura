# Agent Audit — /arch rebuild (#403)

Rebake-mode audit. The three agents the rebuilt /arch play uses are pre-existing — the only change in this rebuild was updating their skill-inventory tables (T19) to add the new arch skills and remove the retired ones. None of the 11 principles were touched.

## tech-architect

| Principle | Status | Finding |
|-----------|--------|---------|
| P1 JSON Contract | PASS | Existing JSON contract structure unchanged. Reads JSON contract from caller, writes JSON contract back. |
| P2 STM Path Handoff | PASS | Reads stm_base and stm.input paths; never reads prompt prose for paths. |
| P3 Intent Awareness | PASS | Loads intent.yaml at start of every invocation; respects intent constraints. |
| P4 Structured Failure | PASS | Returns structured-failure-protocol responses on missing inputs, skill failures, etc. |
| P5 No Direct User Interaction | PASS | Returns to orchestrator; never asks user directly. |
| P6 Output Contract Discipline | PASS | Writes detailed content to STM artifacts; returns minimal JSON to caller. |
| P7 Skill Delegation | PASS | Skill inventory now includes: derive-systems-inventory, derive-logical-architecture (updated), derive-physical-architecture (updated), derive-tech-stack, validate-architecture-spec (updated). Domain work delegates to skills. |
| P8 Recovery and Escalation | PASS | Self-recovery for transient failures; escalation for hard blocks. |
| P9 Domain Boundaries | PASS | Architecture-design domain; does not cross into product, design, implementation. |
| P10 Task Graph Participation | PASS | Reports to orchestrator; can create sub-tasks via TaskCreate with addBlockedBy. |
| P11 Context Sufficiency | PASS | Loads LTM (KB architecture catalogs, project profile, prior arch artifacts) when domain task requires it. |

## tech-designer

| Principle | Status | Finding |
|-----------|--------|---------|
| P1 JSON Contract | PASS | Unchanged from prior audit. |
| P2 STM Path Handoff | PASS | Unchanged. |
| P3 Intent Awareness | PASS | Unchanged. |
| P4 Structured Failure | PASS | Unchanged. |
| P5 No Direct User Interaction | PASS | Unchanged. |
| P6 Output Contract Discipline | PASS | Unchanged. |
| P7 Skill Delegation | PASS | Skill inventory now includes refine-quality-profile and derive-technical-risks (added); derive-nfr-spec and derive-quality-vision removed from active inventory. |
| P8 Recovery and Escalation | PASS | Unchanged. |
| P9 Domain Boundaries | PASS | Quality / NFR / risk domain; does not cross into structural architecture (tech-architect owns that). |
| P10 Task Graph Participation | PASS | Unchanged. |
| P11 Context Sufficiency | PASS | Loads LTM (KB quality catalogs) when domain task requires it. |

## scriber

| Principle | Status | Finding |
|-----------|--------|---------|
| P1 JSON Contract | PASS | Utility agent — exempt from full ≤5 budget but still follows JSON contract. |
| P2 STM Path Handoff | PASS | Writes to STM paths supplied by caller. |
| P3 Intent Awareness | N/A | Utility agent — writes evidence on behalf of plays. |
| P4 Structured Failure | PASS | Returns structured-failure on write failures. |
| P5 No Direct User Interaction | PASS | Returns to orchestrator. |
| P6 Output Contract Discipline | PASS | Confirms write success in JSON return. |
| P7 Skill Delegation | N/A | Scriber is the write-boundary skill itself. |
| P8 Recovery and Escalation | PASS | Retries transient I/O; escalates persistent. |
| P9 Domain Boundaries | PASS | Scriber's domain is the STM whitelist write boundary. |
| P10 Task Graph Participation | PASS | Background utility — no task ownership. |
| P11 Context Sufficiency | EXEMPT | No LTM read responsibility. |

## Verdict

All three agents PASS the P1-P11 audit. No upgrades needed. Proceed to workflow selection.
