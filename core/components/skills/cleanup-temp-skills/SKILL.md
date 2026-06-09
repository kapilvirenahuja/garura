---
name: cleanup-temp-skills
description: Remove ephemeral tech skills synthesized during a /decode run. Deletes the STM-scoped temp-skills/ directory AND any .claude/skills/decode-temp-*/ symlinks or copies created for Skill tool discoverability. Triggered on final Tether at /decode checkpoint Phase 2. Includes safety guards against deleting outside the expected ephemeral paths.
user-invocable: false
model: sonnet
allowed-tools: Bash, Read, Write
deprecated: true
deprecated_note: '#434 ProductOS realignment — superseded by the command model; retained for Phase E reference, not installed'
---

# cleanup-temp-skills

Called by the `/decode` play at the evidence-close phase, after the user's final Tether at Checkpoint Phase 2. Removes every artifact synthesized during the run by `synthesize-tech-skill-from-playbook`.

## Purpose

Per /decode constraints C31 and C32, synthesized tech skills are ephemeral — scoped to a single /decode run and never permitted to persist into the framework. This skill enforces that boundary. It removes both the STM copies (authoritative) and the `.claude/skills/decode-temp-*/` symlinks or copies used for Skill tool dispatch.

Cleanup triggers only on final Tether (Phase 2 approval). Vanish preserves state for resume; `--force` cleanup bypasses state and removes regardless.

## Input

Receive from the `/decode` play orchestrator via JSON contract.

- `stm_temp_skills_dir` (path, required) — `{stm_base}/{issue}/evidence/decode/temp-skills/`. The authoritative location.
- `claude_skills_link_root` (path, optional, default `.claude/skills/`) — where the `decode-temp-*` symlinks/copies live. Every entry matching the prefix `decode-temp-` is considered in-scope.
- `trigger` (enum, required) — `tether | force`. `tether` is the normal path; `force` bypasses safety checks that require a cleanup receipt from a parent play.
- `output_path` (path, required) — `{stm_base}/{issue}/evidence/decode/cleanup-report.yaml`.

## Process

### 1. Validate inputs

- Confirm `stm_temp_skills_dir` is absolute (or resolved relative to a known root) and begins with `{stm_base}` — NEVER delete paths outside STM.
- Confirm `claude_skills_link_root` is either `.claude/skills/` or `{HOME}/.claude/skills/` — refuse any other root. If it is `{HOME}/.claude/skills/`, REFUSE the cleanup with `what_failed: global_skills_in_scope` — global skill path is the framework boundary and decode never writes to it per C31.
- Confirm at least one of the two directories exists. If neither, emit an empty cleanup report (idempotent success).

### 2. Enumerate targets

- Inside `stm_temp_skills_dir`, list every direct child directory. Each is expected to be `extract-from-{stack_id}/` containing `SKILL.md` and `synthesis-record.yaml`. Record the list.
- Inside `claude_skills_link_root`, list every entry whose name matches glob `decode-temp-*`. Record the list, noting whether each is a symlink or a directory copy.

### 3. Remove targets (safely)

For each `claude_skills_link_root` target:
- If symlink: `unlink` the symlink. Do NOT follow the symlink and delete its target (that's the STM copy, which is removed next).
- If directory copy: `rm -rf` confined to paths under `claude_skills_link_root`.

For `stm_temp_skills_dir`:
- `rm -rf` the directory. The skill confirms the path is within `{stm_base}` one more time immediately before the delete — belt-and-suspenders.

Refuse ANY path that does not begin with `{stm_base}` or `{claude_skills_link_root}`. Safety check violation → structured failure `what_failed: unsafe_path`.

### 4. Emit cleanup report

Write at `output_path`:

```yaml
cleaned_at: "{ISO timestamp}"
trigger: "tether | force"
stm_removed:
  root: "{stm_temp_skills_dir}"
  count: <int>
  entries: ["extract-from-{stack_id_1}", ...]
claude_links_removed:
  root: "{claude_skills_link_root}"
  count: <int>
  entries:
    - name: "decode-temp-extract-from-{stack_id}"
      kind: "symlink" | "copy"
status: "success"
```

## Output

Primary artifact: `cleanup-report.yaml` at `output_path`.

## Failure Modes

```yaml
status: failure
what_failed: "unsafe_path | global_skills_in_scope | permission_denied | partial_cleanup"
detail: "<specific>"
evidence: { offending_path: "<path>", directories_remaining: [...] }
```

`partial_cleanup` means some targets were removed but others failed (e.g., permission issue on a single symlink). The report lists what remained. /decode logs the partial cleanup as a warning per C18 (non-blocking close).

## Notes

- Cleanup is idempotent. Re-invocation with nothing to clean returns `status: success` with zero counts.
- Deletion is `rm -rf` scoped to paths confirmed to be within STM or within `.claude/skills/decode-temp-*/`. The skill never recurses upward.
- The `force` trigger is intended for explicit user cleanup (`/decode --cleanup`). It still honors the path-safety guards — it only bypasses the check for a parent-play cleanup receipt.
- This skill makes no LLM inferences and records no decision manifest.
