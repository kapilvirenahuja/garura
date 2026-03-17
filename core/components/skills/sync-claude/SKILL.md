---
name: sync-claude
description: Sync Meridian components to .claude/ (project mode) or ~/.claude/ (global mode, default)
user-invocable: true
context: fork
model: haiku
allowed-tools: Bash
---

# sync-claude

Sync Meridian components from `core/components/` to Claude Code directories. Runs in fork mode (isolated subprocess) so it works regardless of parent conversation context size.

## Usage

Run the sync script. Pass arguments through:

```bash
# Global mode (default) — deploys to ~/.claude/ and ~/.meridian/core/memory/
bash core/components/skills/sync-claude/scripts/sync.sh

# Project mode — deploys to .claude/ and .meridian/core/memory/ (gitignored)
bash core/components/skills/sync-claude/scripts/sync.sh --project
```

That's it. The script handles everything: clean, copy skills/recipes/agents/memory, remove artifacts, report.
