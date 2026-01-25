---
name: sync-claude
description: Sync Phoenix OS components (skills, agents) to .claude directory
user-invocable: true
model: haiku
allowed-tools: Bash
---

# sync-claude

Meta skill for syncing Phoenix OS components to Claude Code's `.claude/` directory.

## Purpose

Copy all Phoenix OS skills and agents from source of truth (`core/components/`) to `.claude/` so Claude Code can discover and use them.

## What Gets Synced

| Source | Destination | Contains |
|--------|-------------|----------|
| `core/components/skills/*` | `.claude/skills/` | True skills (model-invocable) |
| `core/components/recipes/*` | `.claude/skills/` | Recipes (workflows) |
| `core/components/agents/*.md` | `.claude/agents/` | Agent definitions |

## Process

### Step 1: Clean Existing

Remove stale content from `.claude/skills/` and `.claude/agents/`:

```bash
# Remove all content except .gitkeep
rm -rf .claude/skills/* .claude/agents/* 2>/dev/null || true
```

### Step 2: Copy Skills

Copy all skill directories:

```bash
cp -R core/components/skills/* .claude/skills/ 2>/dev/null || true
```

### Step 3: Copy Recipes

Copy all recipe directories to skills (Claude Code uses single folder):

```bash
cp -R core/components/recipes/* .claude/skills/ 2>/dev/null || true
```

### Step 4: Copy Agents

Copy agent definitions:

```bash
cp core/components/agents/*.md .claude/agents/ 2>/dev/null || true
```

### Step 5: Remove Artifacts

Clean up unwanted files:

```bash
# Remove README.md files (not needed in .claude)
rm -f .claude/skills/README.md .claude/agents/README.md 2>/dev/null || true
# Remove .gitkeep files
find .claude/skills .claude/agents -name ".gitkeep" -delete 2>/dev/null || true
```

### Step 6: Report

List what was synced:

```bash
echo "=== Synced Skills ==="
ls -1 .claude/skills/

echo ""
echo "=== Synced Agents ==="
ls -1 .claude/agents/
```

## Output

Report the synced components:

```
Synced to .claude/:
- Skills: {count} ({list})
- Agents: {count} ({list})
```

## Constraints

- NEVER modify source files in `core/components/`
- ALWAYS overwrite existing copies (ensures fresh sync)
- ONLY copy, never move
