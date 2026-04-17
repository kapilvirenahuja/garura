# Final Verification: /ship High-Order Play — G-001 to G-024
<!-- T14 evidence | 2026-03-03 -->

## Result: 24/24 PASS

| Gate | Check | Status | Citation |
|------|-------|--------|----------|
| G-001 | Directory structure | **PASS** | ship/ with SKILL.md, reference/intent.yaml, 3 templates |
| G-002 | SKILL.md frontmatter | **PASS** | Lines 2-6: name/user-invocable/model/allowed-tools |
| G-003 | Level L2 declaration | **PASS** | Lines 279-281: Level L2, Distinct Agents 2 |
| G-004 | intent.yaml completeness | **PASS** | 3 pre_flight, 8 behavioral, 7 failure_conditions |
| G-005 | Intent load directive | **PASS** | Lines 13-15: references reference/intent.yaml |
| G-006 | Agent limit | **PASS** | 1 direct agent (repo-orchestrator); L1s via Skill tool |
| G-007 | Inline guardian | **PASS** | No workflow-guardian; matrix at lines 207-220 |
| G-008 | L1 invocations | **PASS** | Steps 1/2 lines 92-118: Skill tool + ship_context |
| G-009 | Skip-logic | **PASS** | Lines 90, 107: both skip conditions present |
| G-010 | Self-resolution scope | **PASS** | Lines 243-254: CANNOT/CAN/max attempts all present |
| G-011 | Evidence path | **PASS** | Line 199: .meridian/{issue}/evidence/ship/{ts}.md |
| G-012 | checkpoint.md schema | **PASS** | All 6 ADR 008 field groups present |
| G-013 | guardian-decision.md fields | **PASS** | All 7 required fields including HALT-conditional |
| G-014 | final-report.md sections | **PASS** | All 5 sections present |
| G-015 | Halt presentation | **PASS** | Lines 222-241: all 6 required elements |
| G-016 | Recovery section | **PASS** | Lines 256-262: hard halt + recovery ref + max retries |
| G-017 | Forbidden tools | **PASS** | Lines 17-21: Bash/Grep/Glob/git/gh forbidden |
| G-018 | Orchestrator-owned Step 6 | **PASS** | Line 196: "Orchestrator owns this step entirely" |
| G-019 | NWWI enforcement | **PASS** | C3 in intent.yaml; {issue} at lines 86/156/199/224 |
| G-020 | commit-code modification | **PASS** | Lines 122-124: FIRST check; AUTO_APPROVED; no prompt |
| G-021 | create-pr modification | **PASS** | Lines 110-112: quality gate before C5; blockers override |
| G-022 | repo-orchestrator scope | **PASS** | Lines 277-280: both write exceptions with rationale |
| G-023 | Deployment | **PASS** | ~/.claude/skills/ship/SKILL.md exists and current |
| G-024 | Docs update | **PASS** | docs/components/plays.md lines 539-543: ship/ entry |
