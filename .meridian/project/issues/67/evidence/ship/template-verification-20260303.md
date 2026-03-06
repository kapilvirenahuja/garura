# Template Verification: /ship L2 Recipe
<!-- T10 evidence | 2026-03-03 -->

## Summary

| Gate | Check | Status |
|------|-------|--------|
| G-012 | checkpoint.md — ADR 008 schema | **PASS** |
| G-013 | guardian-decision.md — required fields | **PASS** |
| G-014 | final-report.md — required sections | **PASS** |
| G-015 | Guardian halt presentation in SKILL.md | **PASS** |

**Result: 4/4 gates PASS.**

## Detail

**G-012 checkpoint.md:**
- Metadata (Issue, Recipe, Step, Created, Status, Branch, Target) — lines 3–10 ✓
- Task List table (7 steps) — lines 12–22 ✓
- Completed Outputs table — lines 24–33 ✓
- Guardian Decisions table — lines 35–39 ✓
- Current Step — lines 41–43 ✓
- Inputs Needed to Continue (AUTO_APPROVED + HALTED variants) — lines 45–50 ✓

**G-013 guardian-decision.md:**
- Decision (AUTO-APPROVE|HALT) — lines 3–5 ✓
- Step — lines 7–9 ✓
- Reason — lines 11–13 ✓
- Evidence Summary table (must_have_fail, blocking_issues, ci_status, merge_conflicts, pr_status) — lines 15–23 ✓
- Blockers (HALT-conditional, marked with comment) — lines 25–30 ✓
- Self-Resolution Attempted — lines 32–34 ✓
- Action Required with Tether/Vanish (HALT-only) — lines 36–47 ✓

**G-014 final-report.md:**
- Delivery Summary table (Issue, Branch, PR, PR URL, Merge Commit, Strategy, Base Branch) — lines 3–13 ✓
- Steps Executed table (Status: completed|skipped|halted, Notes) — lines 15–25 ✓
- Guardian Decisions table — lines 27–31 ✓
- Evidence link — lines 33–35 ✓
- Issues Created section — lines 37–39 ✓

**G-015 Guardian halt presentation in SKILL.md:**
- Blocker description — line 217 ✓
- "Intent preserved" statement — line 218 ✓
- Completed steps summary — line 220 ✓
- Failed step identification — line 221 ✓
- Self-resolution record — line 222 ✓
- Tether/Vanish with consequences — line 224 ✓
