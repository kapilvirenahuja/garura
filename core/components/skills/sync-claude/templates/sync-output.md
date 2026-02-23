# Sync Output Template

Structured output for `sync-claude` skill.

## Format

```
Synced to {TARGET_DIR} ({mode} mode):
- Skills: {count} ({list})
- Agents: {count} ({list})
- Memory: synced to {MEMORY_TARGET} ({list})
```

## Field Descriptions

| Field | Description |
|-------|-------------|
| `TARGET_DIR` | Destination directory (`~/.claude` or `.claude`) |
| `mode` | Deployment mode (`global` or `project`) |
| `Skills count/list` | Number and names of skills synced |
| `Agents count/list` | Number and names of agents synced |
| `MEMORY_TARGET` | Memory destination path |
| `Memory list` | Memory subdirectories synced |
