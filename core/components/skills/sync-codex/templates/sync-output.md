# Sync Output Template

Structured output for `sync-codex` skill.

## Format

```
Synced Codex components ({mode} mode):
- Skills target: {SKILLS_TARGET} ({count}, {list})
- Agents target: {AGENTS_TARGET} ({count}, {list})
- Support skills target: {SUPPORT_TARGET} ({count}, {list})
```

## Field Descriptions

| Field | Description |
|-------|-------------|
| `mode` | Deployment mode (`global` or `project`) |
| `SKILLS_TARGET` | Destination for top-level Codex skills |
| `AGENTS_TARGET` | Destination for Codex custom subagents |
| `SUPPORT_TARGET` | Destination for internal Garura skill support assets |
| `count/list` | Number and names of synced components |
