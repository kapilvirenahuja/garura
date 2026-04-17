# Agent Audit: repo-orchestrator

**Audited against:** 10 Architectural Principles for capture-learning play
**Agent file:** `core/components/agents/repo-orchestrator.md`
**Date:** 2026-03-06

## Audit Results

| Principle | Verdict | Findings |
|-----------|---------|----------|
| P1 -- JSON Contract Communication | PASS | Input contract defined with `intent_path`, `stm` (input/output), `task_id`, `config`. Output contract returns enriched JSON with `status`, `stm`, `task_id`, `error`. Contract examples shown in lines 39-59 (input) and 73-88 (output). |
| P2 -- STM Path Handoff | PASS | Agent reads from `stm.input` paths and writes to `stm.output` paths. Contract Processing Flow (lines 99-104) explicitly states: "Read inputs -- Load data from each path in stm.input" and "Write outputs -- Write artifacts to paths in stm.output". ALWAYS section (line 365-366) reinforces: "Write detailed artifacts to STM paths, not inline." |
| P3 -- Intent Awareness | PASS | Agent reads `intent.yaml` from `intent_path` per Contract Processing Flow step 2 (line 100). Intent Recognition section (lines 162-173) extracts domain, phase, inputs, constraints, failure conditions, and scenarios from intent. Line 369: "Read intent from intent.yaml, not from prompt prose." |
| P4 -- Structured Failure Protocol | PASS | Escalation section (lines 427-453) defines structured failure YAML with `what_failed`, `why`, `domain_assessment`, `context`, `suggested_fix`. References `structured-failure-protocol.md`. Line 454: "Do NOT return raw errors." Failure is written to `stm.output` and contract returned with `status: "failed"`. |
| P5 -- No Direct User Interaction | PASS | Boundaries/NEVER section (lines 356-357): "Ask user questions directly -- return to caller for user interaction" and "Use AskUserQuestion tool -- callers handle user interaction". |
| P6 -- Output Contract Discipline | PASS | Output Contract section (lines 69-71): "The agent returns ONLY the enriched JSON contract. All detailed artifacts, analysis, and evidence are written to STM paths. No prose, tables, or explanation in the return value." NEVER section (line 360): "Return prose, tables, or explanation as the top-level response to a play -- return ONLY the JSON contract." |
| P7 -- Skill Delegation for Artifact Production | PASS | Six skills registered: `analyze-changes`, `create-commit`, `analyze-pr`, `submit-pr`, `setup-branch`, `merge-pr` (lines 142-149). Bash usage table (lines 376-388) explicitly forbids direct git operations when a skill exists. Line 358: "Execute git commands directly when a skill exists" is in the NEVER list. Agent role is context engineering (intent recognition, config loading, constraint application) while skills produce artifacts. |
| P8 -- Recovery and Escalation | PASS | Self-Recovery section (lines 408-424): max 2 attempts per obstacle, with examples (nothing staged, branch exists, dirty working tree, remote ahead, hook error). Escalation section (lines 427-453): structured failure with domain assessment and suggested agent routing. References `intent-driven-recovery.md`. |
| P9 -- Domain Boundaries | PASS | Domain explicitly declared: "Repository management (commits, branches, PRs, git state)" (line 23). Escalation examples (lines 446-453) show clear boundary awareness: infrastructure concerns, CI failures, merge conflicts in code, and issue management are all escalated to other domains. Skills are all within repo domain. |
| P10 -- Task Graph Participation | PASS | Task Graph section (lines 106-136): `TaskUpdate` to `in_progress` on entry, `completed` on completion, `failed` on failure. Discovering New Work subsection (lines 129-136) shows `TaskCreate` for discovered work with `addBlockedBy` linking. Decision Framework steps 2 and 12 (lines 222, 234) integrate task updates into the execution flow. |

## Summary

**Overall: 10/10 PASS**

The repo-orchestrator agent is fully compliant with all 10 architectural principles. The agent definition is thorough, with explicit contract schemas, structured failure templates, skill delegation boundaries, and task graph lifecycle coverage. No gaps identified.
