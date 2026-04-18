---
name: sync-droids
description: Sync Meridian components to .factory/ (project mode) or ~/.factory/ (global mode, default) with Claude Code to Factory Droid transformation
user-invocable: true
---

# sync-droids

Sync Meridian components from `core/components/` to Factory Droid directories. Transforms Claude Code agent definitions into Factory Droid format during deployment (tool names, model IDs, frontmatter fields).

## Usage

Run the sync script. Pass arguments through:

```bash
# Global mode (default) — deploys to ~/.factory/ and ~/.garura/core/memory/
bash core/components/skills/sync-droids/scripts/sync.sh

# Project mode — deploys to .factory/ and .garura/core/memory/ (gitignored)
bash core/components/skills/sync-droids/scripts/sync.sh --project
```

The script handles everything: clean, transform agents to droids, copy skills/plays, sync memory, report.
