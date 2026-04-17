# Agent Audit: project-orchestrator

**Audited against:** 10 Architectural Principles for capture-learning play
**Agent file:** `core/components/agents/project-orchestrator.md`
**Date:** 2026-03-06

## Audit Results

| Principle | Verdict | Findings |
|-----------|---------|----------|
| P1 -- JSON Contract Communication | PASS | Input contract defined with `intent_path`, `stm` (input/output), `task_id` (lines 39-54). Output contract returns enriched JSON with `status` and `stm` (lines 65-89). Both success and failure contract shapes are documented. |
| P2 -- STM Path Handoff | PASS | Agent reads from `stm.input` paths and writes to `stm.output` paths. ALWAYS section (lines 306-308): "Read input data from stm.input paths -- never expect inline data" and "Write output artifacts to stm.output paths -- never return artifacts inline." |
| P3 -- Intent Awareness | PASS | Intent Loading section (lines 94-101): reads `intent.yaml` from `intent_path`, extracts constraints, failure conditions, and scenarios. Line 101: "they are NOT passed as prose in the prompt and must NOT be assumed from context." Decision Framework step 2 (line 274) and step 5 (line 277) validate constraints before skill invocation. |
| P4 -- Structured Failure Protocol | PASS | Escalation section (lines 367-395) defines structured failure YAML with `what_failed`, `why`, `domain_assessment`, `context`, `suggested_fix`. References `structured-failure-protocol.md`. Line 395: "Do NOT return raw errors." Failure written to `stm.output.failure` path. Decision Framework step 5 (line 277): constraint violations produce structured failure before skill invocation. |
| P5 -- No Direct User Interaction | PASS | Boundaries/NEVER section (lines 298-299): "Ask user questions directly -- return to caller for user interaction" and "Use AskUserQuestion tool -- callers handle user interaction." |
| P6 -- Output Contract Discipline | PASS | Output Contract section (line 65): "The agent returns ONLY the enriched JSON contract. All detailed artifacts are written to STM paths." Line 91: "Never return prose, tables, or explanation to the play. Detailed content goes to STM files." NEVER section (line 302): "Return prose, tables, or explanation to the play -- return only the JSON contract." |
| P7 -- Skill Delegation for Artifact Production | PASS | Two skills registered: `manage-issue` and `resolve-issues` (lines 140-143). Bash usage table (lines 326-332) forbids direct `gh` commands when skills exist. Agent adds value through context engineering: type hint derivation (lines 214-241), constraint validation, and enrichment of skill output -- while skills handle the actual operations. |
| P8 -- Recovery and Escalation | PASS | Self-Recovery section (lines 349-363): max 2 attempts per obstacle, with examples (issue not found, duplicate title, no search results, missing label). Escalation section (lines 367-395): structured failure with domain assessment and suggested agent. References `intent-driven-recovery.md`. Escalation examples include GitHub API auth failure, missing code component, repo not found. |
| P9 -- Domain Boundaries | PASS | Domain explicitly declared: "Project management (issues, tracking, planning)" (line 21). Escalation examples (lines 389-393) show clear boundary awareness: GitHub API auth -> infrastructure, code component verification -> design/tech-designer, repo configuration -> infrastructure. NEVER section (lines 294-302) constrains actions to project management operations only. |
| P10 -- Task Graph Participation | PASS | Task Graph section (lines 103-134): `TaskUpdate` to `in_progress` on entry, `completed` on completion, `failed` on failure. Discovering New Work subsection (lines 119-126) shows `TaskCreate` with `addBlockedBy`. Decision Framework steps 1, 10, and 11 (lines 273, 282, 283) integrate task updates. ALWAYS section (line 314): "Participate in the task graph via TaskUpdate/TaskCreate." |

## Summary

**Overall: 10/10 PASS**

The project-orchestrator agent is fully compliant with all 10 architectural principles. The agent definition mirrors the structural rigor of repo-orchestrator with appropriate domain-specific adaptations (issue management skills, type hint derivation as agent value-add). No gaps identified.
