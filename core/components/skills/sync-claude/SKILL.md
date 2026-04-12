---
name: meridian:sync-claude
description: Sync Meridian components to .claude/ (project mode) or ~/.claude/ (global mode, default)
user-invocable: true
context: fork
model: haiku
allowed-tools: Bash
---

Run the sync script immediately. Do not summarize, explain, or analyze — execute the command.

If the user passed `--project`, run:

```bash
bash core/components/skills/sync-claude/scripts/sync.sh --project
```

Otherwise, run:

```bash
bash core/components/skills/sync-claude/scripts/sync.sh
```

Report the script's output verbatim. Nothing else.
