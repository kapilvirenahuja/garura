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
- **Global mode** (default): `~/.claude/` and `~/.phoenix-os/core/memory/` — Makes components available to ALL projects. This is the permanent, shared deployment path.
- **Project mode**: `.claude/` and `.phoenix-os/core/memory/` — Creates ephemeral local copies (gitignored) for project-specific use only.

## Input Parsing

Determine target directory based on arguments:

| Argument | Mode | TARGET_DIR |
|----------|------|------------|
| (none) | Global | `$HOME/.claude` |
| `--global` | Global (explicit) | `$HOME/.claude` |
| `--project` | Project | `.claude` |

## What Gets Synced

### Skills & Agents (to TARGET_DIR)

| Source | Destination | Contains |
|--------|-------------|----------|
| `core/components/skills/*` | `{TARGET_DIR}/skills/` | True skills (model-invocable) |
| `core/components/recipes/*` | `{TARGET_DIR}/skills/` | Recipes (workflows) |
| `core/components/agents/*.md` | `{TARGET_DIR}/agents/` | Agent definitions |

### Memory (mode dependent)

| Source | Global Destination | Project Destination | Contains |
|--------|-------------------|---------------------|----------|
| `core/components/memory/*` | `~/.phoenix-os/core/memory/` | `.phoenix-os/core/memory/` | LTM: practices, templates, quality-gates, references |

In **global mode** (default): Memory syncs to `~/.phoenix-os/core/memory/` — shared across all projects.
In **project mode**: Memory syncs to `.phoenix-os/core/memory/` — project-specific LTM.

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

### Step 5: Sync Memory

Sync LTM (Long-Term Memory) to the appropriate location based on mode.

```bash
# Determine memory target
if [ "$MODE" = "global" ]; then
  MEMORY_TARGET="$HOME/.phoenix-os/core/memory"
else
  MEMORY_TARGET=".phoenix-os/core/memory"
fi

# Create memory directory
mkdir -p "$MEMORY_TARGET"

# Clean and sync memory
rm -rf "$MEMORY_TARGET"/* 2>/dev/null || true
cp -R core/components/memory/* "$MEMORY_TARGET"/ 2>/dev/null || true
```

### Step 6: Remove Artifacts

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

### Step 7: Report

List what was synced:

```bash
echo "=== Synced to $TARGET_DIR ($MODE mode) ==="
echo ""
echo "=== Skills ==="
ls -1 "$TARGET_DIR/skills/"

echo ""
echo "=== Agents ==="
ls -1 "$TARGET_DIR/agents/"

echo ""
echo "=== Memory (target: $MEMORY_TARGET) ==="
ls -1 "$MEMORY_TARGET"/
```

## Output

Produce output using template: `templates/sync-output.md`

## Constraints

- NEVER modify source files in `core/components/`
- ALWAYS overwrite existing copies (ensures fresh sync)
- ONLY copy, never move
- ALWAYS create target directories before copying (`mkdir -p`)
- ALWAYS report which mode was used and the target path
- In global mode, NEVER sync `sync-claude` skill (framework-only)
- In global mode, memory goes to `~/.phoenix-os/core/memory/` (shared across all projects)
- In project mode, memory goes to `.phoenix-os/core/memory/` (project-specific)
- Project mode creates ephemeral local copies in `.claude/` and `.phoenix-os/core/memory/` that are gitignored
- Global mode is the canonical deployment path for components

## Version

| Field | Value |
|-------|-------|
| Version | 1.0.0 |
| Category | operations |
