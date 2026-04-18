---
name: sync-codex
description: Sync Garura plays, the sync-codex meta-utility skill, and Garura subagents to Codex directories. Use when deploying Garura components to Codex in project mode (.codex/skills and .codex/agents) or global mode (~/.codex/skills and ~/.codex/agents).
user-invocable: true
---

# sync-codex

Sync Garura Codex-facing components from `core/components/` to Codex directories. This deploys:

- Garura plays as top-level Codex skills
- `sync-codex` itself as a top-level Codex skill
- Garura agents as Codex custom subagents
- Internal Garura skills as support assets under `.codex/garura/skills/`

It does **not** sync Garura memory.

## Usage

Run the sync script. Pass arguments through:

```bash
# Global mode (default) — deploys to ~/.codex/skills and ~/.codex/agents
bash core/components/skills/sync-codex/scripts/sync.sh

# Project mode — deploys to .codex/skills and .codex/agents
bash core/components/skills/sync-codex/scripts/sync.sh --project
```

The script handles transformation, managed cleanup, support-skill copying, and reporting.
