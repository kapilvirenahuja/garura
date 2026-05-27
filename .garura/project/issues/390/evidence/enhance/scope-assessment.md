# Scope Assessment — #390

| Signal | Estimate | Threshold | Verdict |
|--------|----------|-----------|---------|
| Files to touch | ~20 (7 framework + 9 epic migrations + ~4 downstream consumers) | enhance ≤15 | OVER |
| Domains crossed | 3 (schema, skills/agents, product epic content) | enhance ≤2 | OVER |
| New abstractions | 2 (draft-epic-expectation skill, epic-expectation-crafter agent) | enhance ≤2 | OK |
| Tests impacted | ~10 | enhance ≤30 | OK |
| Effort | 1-2 days | enhance ≤1 day | OVER |

**Verdict:** Out of band on files / domains / effort. Recommendation was to drop to /prepare.

**User decision:** Override — push through with /enhance (chose option b on 2026-05-27).
Acceptance: thinner rigor on downstream `failure_scenarios` consumer hunt; single-PR ship with larger diff.
