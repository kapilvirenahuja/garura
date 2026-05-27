# RCA Approved Issue-Comment Template

Canonical format for the GitHub issue comment posted when a user approves (Tethers) an RCA + fix plan at the fix-it approval checkpoint (or any play that produces an RCA and wants to mirror the approval decision back to the originating issue).

Consumers: `fix-it` (primary), any future play that produces `rca.yaml` + `design.yaml` and gates on user approval.

## Shape

```markdown
## RCA & Fix Plan — Approved

**Approved by:** @{user} at {ISO-8601 timestamp}
**Play:** {play-name}
**STM evidence:** `{stm_base}/{issue}/evidence/{play-name}/`

### Root Cause
{one-paragraph summary from rca.yaml.root_cause}

### Blast Radius
| Surface | Impact |
|---------|--------|
{one row per entry in rca.yaml.blast_radius}

### Fix Strategy
{ordered execution steps from design.yaml.plan — numbered list}

### Alternatives Considered
{one bullet per entry in design.yaml.alternatives — each with rejection reason}

### Risks
| Risk | Severity | Mitigation |
|------|----------|------------|
{one row per entry in design.yaml.risks}

**Confidence:** {design.yaml.confidence}/1.0

**PR:** _pending — will follow up when opened_
```

## Field Derivation Rules

| Field | Source | Notes |
|-------|--------|-------|
| `@{user}` | `git config user.name` or `platform-adapter view-user` (verb: `view-user`) | Prefer platform login for @ mentions |
| `{ISO-8601 timestamp}` | System time at approval | UTC, e.g. `2026-04-19T10:12:43Z` |
| `{play-name}` | Invoking play slug | e.g. `fix-it`, `address-qa-findings` |
| `{stm_base}` | `.garura/core/config.yaml` → `stm.base-path` | Never hardcode |
| `Root Cause` | `rca.yaml.root_cause` (string) | Render verbatim — do not re-summarize |
| `Blast Radius` | `rca.yaml.blast_radius` (list of {surface, impact}) | One table row per entry |
| `Fix Strategy` | `design.yaml.plan` (ordered list) | Preserve order; use `1.`, `2.`, `3.` |
| `Alternatives` | `design.yaml.alternatives` (list of {option, rejection_reason}) | Each bullet: `- {option} — {rejection_reason}` |
| `Risks` | `design.yaml.risks` (list of {risk, severity, mitigation}) | One table row per entry |
| `Confidence` | `design.yaml.confidence` (float 0-1) | Render as `{value}/1.0` |

## Follow-up Comment (when PR opens)

When the PR linked to this fix is subsequently created, append (not replace) a second comment to keep a clean append-only audit trail:

```markdown
## PR Opened

**PR:** {pr_url}
**Branch:** {branch-name}
**Opened at:** {ISO-8601 timestamp}
```

Rationale — append vs edit: editing the original comment loses the approval-timestamp context in GitHub's activity log. Appending keeps each event as its own timeline entry.

## Constraints

- Single comment at approval time — do not split the RCA, fix strategy, and risks into separate comments.
- Never inline the full `rca.yaml` or `design.yaml` YAML — render the derived sections only. The STM evidence path is the canonical reference.
- Always include the `Approved by` + timestamp header — it is the compliance anchor for the audit trail.
- Optional sections MUST NOT appear as empty shells. If `design.yaml.alternatives` is empty, omit the `### Alternatives Considered` heading entirely rather than rendering `_(none)_`.

## CLI Command

Posted via `manage-issue` skill (which routes through the `platform-adapter` skill with `verb: comment-issue`) or directly by the agent dispatched with `run_in_background: true`:

Invoke the `platform-adapter` skill with `verb: comment-issue` and `args: {issue_number: {issue_number}, body: "{rendered_template}"}`.

> **Legacy reference:** The backing CLI command on GitHub is `gh issue comment {issue_number} --body "{rendered_template}"`; on GitLab it is `glab issue note {issue_number} --message "{rendered_template}"`. Use the adapter rather than calling CLI directly.

## Related Templates

- `github-issue.md` — initial issue creation (not comment)
- `approval-prompt.md` — the Tether/Orbit/Vanish surface that triggers this comment
- `checkpoint.md` — the parallel STM checkpoint artifact scriber writes on the same Tether event
