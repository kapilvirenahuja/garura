---
name: sync-claude
description: Sync Phoenix OS components to .claude/ (project mode) or ~/.claude/ (global mode, default)
user-invocable: true
model: haiku
allowed-tools: Bash
---

# sync-claude

Meta skill for syncing Phoenix OS components to Claude Code's skill/agent directories.

## Purpose

Copy all Phoenix OS skills and agents from source of truth (`core/components/`) to either:
- **Global mode** (default): `~/.claude/` — Makes components available to ALL projects
- **Project mode**: `.claude/` — Makes components available only to this project

## Input Parsing

Determine target directory based on arguments:

| Argument | Mode | TARGET_DIR |
|----------|------|------------|
| (none) | Global | `$HOME/.claude` |
| `--global` | Global (explicit) | `$HOME/.claude` |
| `--project` | Project | `.claude` |

## What Gets Synced

| Source | Destination | Contains |
|--------|-------------|----------|
| `core/components/skills/*` | `{TARGET_DIR}/skills/` | True skills (model-invocable) |
| `core/components/recipes/*` | `{TARGET_DIR}/skills/` | Recipes (workflows) |
| `core/components/agents/*.md` | `{TARGET_DIR}/agents/` | Agent definitions |

## Process

### Step 1: Clean Existing

Create target directories and remove stale content:

```bash
# Create target directories
mkdir -p "$TARGET_DIR/skills" "$TARGET_DIR/agents"

# Remove all content except .gitkeep
rm -rf "$TARGET_DIR/skills"/* "$TARGET_DIR/agents"/* 2>/dev/null || true
```

### Step 2: Copy Skills

Copy all skill directories:

```bash
cp -R core/components/skills/* "$TARGET_DIR/skills/" 2>/dev/null || true
```

### Step 3: Copy Recipes

Copy all recipe directories to skills (Claude Code uses single folder):

```bash
cp -R core/components/recipes/* "$TARGET_DIR/skills/" 2>/dev/null || true
```

### Step 4: Copy Agents

Copy agent definitions:

```bash
cp core/components/agents/*.md "$TARGET_DIR/agents/" 2>/dev/null || true
```

### Step 5: Remove Artifacts

Clean up unwanted files:

```bash
# Remove README.md files (not needed in target)
rm -f "$TARGET_DIR/skills/README.md" "$TARGET_DIR/agents/README.md" 2>/dev/null || true
# Remove .gitkeep files
find "$TARGET_DIR/skills" "$TARGET_DIR/agents" -name ".gitkeep" -delete 2>/dev/null || true

# Global mode only: Remove sync-claude skill (framework-only)
if [ "$MODE" = "global" ]; then
  rm -rf "$TARGET_DIR/skills/sync-claude" 2>/dev/null || true
fi
```

### Step 6: Report

List what was synced:

```bash
echo "=== Synced to $TARGET_DIR ($MODE mode) ==="
echo ""
echo "=== Skills ==="
ls -1 "$TARGET_DIR/skills/"

echo ""
echo "=== Agents ==="
ls -1 "$TARGET_DIR/agents/"
```

## Output

Report the synced components:

```
Synced to {TARGET_DIR} ({mode} mode):
- Skills: {count} ({list})
- Agents: {count} ({list})
```

## Constraints

- NEVER modify source files in `core/components/`
- ALWAYS overwrite existing copies (ensures fresh sync)
- ONLY copy, never move
- ALWAYS create target directories before copying (`mkdir -p`)
- ALWAYS report which mode was used and the target path
- In global mode, NEVER sync `sync-claude` skill (framework-only)
- In global mode, NEVER create `.phoenix-os/` or memory directories in `~/`
