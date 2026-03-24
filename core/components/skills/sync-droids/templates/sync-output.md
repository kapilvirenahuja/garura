# Sync Output Template

Structured output for `sync-droids` skill.

## Format

```
Synced to {TARGET_DIR} ({mode} mode):
- Skills: {count} ({list})
- Droids: {count} ({list})
- Memory: synced to {MEMORY_TARGET} ({list})
```

## Field Descriptions

| Field | Description |
|-------|-------------|
| `TARGET_DIR` | Destination directory (`~/.factory` or `.factory`) |
| `mode` | Deployment mode (`global` or `project`) |
| `Skills count/list` | Number and names of skills synced |
| `Droids count/list` | Number and names of droids synced |
| `MEMORY_TARGET` | Memory destination path |
| `Memory list` | Memory subdirectories synced |
