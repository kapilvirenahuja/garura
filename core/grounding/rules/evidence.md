# Evidence Recording Rule

**Self-development reference only — not deployed via /sud:install.**

---

## Overview

The `evidence.record` flag controls whether non-essential STM artifact writes occur during
play execution. It is a global boolean flag in `.garura/core/config.yaml` under the
`evidence:` top-level section.

## Config Key

```yaml
# Location: .garura/core/config.yaml
evidence:
  record: true   # Default: true (backward compatible — existing behavior unchanged)
```

- **Config key:** `evidence.record`
- **Default value:** `true`
- **Allowed values:** `true` or `false`

When the key is absent from config, all plays default to `true` (existing behavior unchanged).

## What It Controls

When `evidence.record` is `false`, non-essential artifact writes in the `commit-code` play
and `create-commit` skill are skipped. The flag does NOT affect play correctness — all
artifacts required for the play to function are always written regardless of this flag.

## Artifacts Skipped When `evidence.record: false`

These three artifacts are considered non-essential (audit/observability artifacts):

| Artifact | Path | Written by |
|----------|------|------------|
| `commits.yaml` | `{stm_base}/{issue}/evidence/commit-code/commits.yaml` | repo-orchestrator (accumulating create-commit responses) |
| Delivery record `.md` | `{stm_base}/{issue}/evidence/commit-code/{YYYYMMDD-HHMMSS}.md` | commit-code play Step 8 |
| Status file `.json` | `{stm_base}/{issue}/status/commit-code.json` | commit-code play (throughout, final write in Step 8) |

## Artifacts Never Skipped

These artifacts are required for the play to function correctly and are written
unconditionally regardless of the `evidence.record` flag:

| Artifact | Path | Written by | Why never skipped |
|----------|------|------------|-------------------|
| `analysis.yaml` | `{stm_base}/{issue}/evidence/commit-code/analysis.yaml` | repo-orchestrator (Step 1) | Required for change analysis — play correctness depends on it |
| `issue-mappings.yaml` | `{stm_base}/{issue}/evidence/commit-code/issue-mappings.yaml` | project-orchestrator (Step 2) | Required for issue-to-commit mapping — play correctness depends on it |

## How Plays Read the Flag

Plays read the flag using a bash pattern with a default-true fallback:

```bash
evidence_record=$(grep -A1 '^evidence:' .garura/core/config.yaml | grep 'record:' | awk '{print $2}')
evidence_record=${evidence_record:-true}
```

This pattern:
- Reads the `evidence.record` value from config
- Defaults to `true` when the key is absent (backward compatible)
- Is placed in the pre-flight section of the play, before Evidence & Close artifacts are written

## Pause/Resume Interaction

When `evidence.record` is `false`, the status file (`commit-code.json`) is not written.
Pause/Resume is implicitly disabled for that run — a subsequent invocation of the play
on the same branch starts fresh (no status file = fresh start per current play logic).
This is intentional behavior for speed/development use cases, not an error condition.

## Scope

`commit-code` is the prototype play for this flag. The flag is read in:

- **`create-commit` skill** (Step 4): reads `evidence.record`; when false, returns
  `skip_commits_yaml: true` in the output template response to signal its caller
  (repo-orchestrator) to omit the write-evidence call for `commits.yaml`
- **`commit-code` play** (Step 8): reads `evidence.record`; when false, skips the
  delivery record write, status file write, and repo-orchestrator self-commit invocation;
  user summary is always presented regardless of flag value

Other plays will be addressed in separate issues per the discovery scoping constraint.
The `evidence.record` key and behavioral pattern established here are the canonical
reference for those future implementations.
