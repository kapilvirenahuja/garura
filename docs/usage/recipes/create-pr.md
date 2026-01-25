# create-pr

Create pull requests with dynamic, context-aware quality checklists.

## Overview

The `create-pr` recipe analyzes your branch, generates a quality checklist based on what actually changed, and creates a pull request with that checklist embedded.

**Key insight:** The checklist is NOT static. It adapts based on:
- What files changed (code, API, security, database, etc.)
- What type of changes (bug fix, feature, refactor)
- What branch pattern (hotfix, release, feature)

## Usage

```bash
/create-pr
```

Or invoke directly:
```
Create a pull request for my current branch
```

## What It Does

1. **Analyzes your branch** against base (typically `main`)
2. **Detects context** — which file patterns are affected, what commit types
3. **Generates checklist** — only items relevant to what changed
4. **Presents for approval** — checkpoint before external action
5. **Creates PR** — with checklist embedded in body

## Dynamic Checklist

### Why Dynamic?

Static checklists create checkbox fatigue. Every PR gets the same 20 items, most irrelevant.

Dynamic checklists show only what matters:

| If You Changed | You'll See |
|----------------|------------|
| Code files (`*.ts`, `*.py`, etc.) | Tests pass, Build succeeds |
| API files (`routes/`, `controllers/`) | API docs updated |
| Auth/security files | Security review required |
| Database/migrations | Migration tested |
| Dependencies (`package.json`, etc.) | Dependency changes reviewed |

### Change Type Rules

| Commit Type | Additional Items |
|-------------|------------------|
| `fix:` (bug fix) | Regression test added |
| `feat:` (feature) | Feature documented, Feature tested |
| `refactor:` | No behavior change |
| Breaking change | Breaking change documented |

### Branch Rules

| Branch Pattern | Effect |
|----------------|--------|
| `hotfix/*` | Documentation items demoted to optional |
| `release/*` | All documentation promoted to required |
| `experiment/*` | Most items demoted to optional |

## Example Session

```
> /create-pr

[Analyzing PR readiness...]

## Proposed Pull Request

### Details

| Field | Value |
|-------|-------|
| Title | feat(auth): add OAuth support |
| Base | main |
| Head | feature/oauth |
| Commits | 3 |
| Changes | +120 / -45 |

### Context Detected

| Rule | Why |
|------|-----|
| Code Files Changed | `*.ts` files modified |
| API Files Changed | `src/routes/` modified |
| Security Files Changed | `src/auth/` modified |
| New Feature | Commits contain `feat:` |

### Quality Checklist (Generated)

#### Must-Have (blocking)

| Item | Trigger | Status | Evidence |
|------|---------|--------|----------|
| No merge conflicts | Always | ✅ PASS | Clean merge |
| Tests pass | Code Files | ✅ PASS | 42/42 passing |
| API docs updated | API Files | ❌ FAIL | No doc changes |
| Security review | Security Files | ⏳ REVIEW | Needs sign-off |
| Feature documented | New Feature | ❌ FAIL | No README |

---

Type **Approve** to create the PR or **Reject** to cancel.

> Approve

[Creating pull request...]

# Pull Request Created

| Field | Value |
|-------|-------|
| PR | #42 |
| URL | https://github.com/org/repo/pull/42 |
| Title | feat(auth): add OAuth support |
```

## The PR Checklist

The created PR includes checkboxes grouped by trigger:

```markdown
## Review Checklist

> Generated based on files changed in this PR

### Required (must verify before merge)

**Triggered by: Code Files Changed**
- [ ] Tests pass (verified: 42/42 passing)
- [ ] Build succeeds (verified: build OK)

**Triggered by: API Files Changed**
- [ ] API documentation is accurate

**Triggered by: Security Files Changed**
- [ ] Security implications reviewed

**Triggered by: New Feature**
- [ ] Feature is documented for users

### Optional (nice-to-have)

- [ ] Test coverage maintained (+12 new tests added)
```

## Project Customization

Override or extend rules in `.phoenix-os/config/quality-gates/pr/rules.md`.

### Add Custom Rules

```markdown
# Project PR Rules

## Add Rules

### When: UI Components Changed
Triggers: `**/components/**`, `*.tsx`, `*.vue`

| ID | Priority | Item | Verification |
|----|----------|------|--------------|
| `storybook-updated` | must-have | Storybook updated | Check for story changes |
| `visual-regression` | nice-to-have | Visual regression test | Screenshot comparison |
```

### Override Built-in Rules

```markdown
## Override Built-in Rules

| Rule ID | Change |
|---------|--------|
| `api-docs` | priority: nice-to-have |
| `security-review` | disabled: true |
```

### Add Branch Rules

```markdown
## Add Branch Rules

### When: Experiment Branch (`experiment/*`)
| Rule ID | Change |
|---------|--------|
| ALL | priority: nice-to-have |
```

## Built-in Rules Reference

See `core/components/skills/analyze-pr/reference/rules.md` for the complete list of built-in rules including:

- **Universal rules**: No merge conflicts, No secrets
- **Code file rules**: Tests pass, Build succeeds
- **API file rules**: API docs updated
- **Security file rules**: Security review
- **Database rules**: Migration tested
- **Dependency rules**: Dependencies reviewed
- **Change type rules**: Regression test, Feature documented

## Why Always Checkpoint?

PRs are externally visible. The 5-second approval pause prevents:
- Wrong base branch
- Missing context in title
- Notification noise to team
- Premature visibility of work-in-progress

## Related

- `/commit` — Commit changes (internal operation, may auto-approve)
- `repo-orchestrator` — Agent that executes PR operations
- `analyze-pr` — Skill that generates the checklist
- `submit-pr` — Skill that creates the PR
