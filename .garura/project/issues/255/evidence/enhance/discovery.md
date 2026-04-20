# Discovery — Issue #255

## Issue Body (verbatim)
Every enhance/ship/fix-it play commits 10-14 evidence files to STM after completion (`chore(stm)` commits). This creates commit noise in the git log and wastes tokens. There's no way to turn evidence recording off.

## Design (resolved through conversation — 2026-04-19)

### Scope: commit-code only (surgical, one play at a time)
This issue is scoped to `commit-code` as the first play. Other plays follow in separate issues.

### What exactly are we building?
A config flag `evidence.record` (default `true`) that when set to `false` skips writing non-essential evidence artifacts in the `commit-code` play and `create-commit` skill — saving tokens and speeding up execution. The skip is at the WRITE level (never written, never processed), not just at the git commit level.

### Which artifacts are non-essential (skippable) in commit-code?

**Always written (play needs them to function):**
- `analysis.yaml` — change grouping, required by downstream commit step
- `issue-mappings.yaml` — issue resolution, required by commit step

**Skippable when `evidence.record: false`:**
- `commits.yaml` — commit record written by create-commit skill
- `evidence/commit-code/{YYYYMMDD}.md` — delivery record
- `status/commit-code.json` — resume state

### Where does the check live?
Two places, same flag, same config key:
1. **`create-commit` skill** — reads `evidence.record` from `.garura/core/config.yaml` before writing commits.yaml. If false, skips that write. Root-level check that covers all callers of this skill.
2. **`commit-code` play** — reads same flag in Evidence & Close phase. If false, skips delivery record and status file writes.

### What existing code does this connect to?
- `.garura/core/config.yaml` — add `evidence.record: true`
- `core/grounding/rules/evidence.md` — new file documenting the rule
- `core/components/skills/create-commit/SKILL.md` — add flag check before writing output
- `core/components/plays/commit-code/SKILL.md` — add flag check in Evidence & Close phase
  - Note: commit-code was compiled via /create-play from intent.yaml. Per CLAUDE.md, edits to SKILL.md require updating intent.yaml and rebuilding via `/create-play --build`. Must check if intent.yaml exists.

### Constraints
- Flag default `true` — backward compatible, existing behavior unchanged
- `analysis.yaml` and `issue-mappings.yaml` NEVER skipped
- No per-play or per-invocation override — single global flag
- commit-code is prototype; other plays in separate issues (surgical precision)

### Success criteria
- [ ] `evidence.record: true` in `.garura/core/config.yaml`
- [ ] `core/grounding/rules/evidence.md` documents the rule
- [ ] `create-commit` skill: reads flag, skips commits.yaml write when false
- [ ] `commit-code` play: reads flag, skips delivery record + status file when false
- [ ] `analysis.yaml` and `issue-mappings.yaml` always written regardless of flag
- [ ] Default (flag=true) behavior identical to current
