#!/usr/bin/env bash
set -euo pipefail

# sync-claude — Pure bash sync of Meridian components
# Usage: ./sync.sh [--project|--global]

# Resolve project root (where core/components/ lives)
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../../../.." && pwd)"

# Parse mode
MODE="global"
for arg in "$@"; do
  case "$arg" in
    --project) MODE="project" ;;
    --global)  MODE="global" ;;
    *)         echo "Unknown argument: $arg"; echo "Usage: sync.sh [--project|--global]"; exit 1 ;;
  esac
done

# Set target directories
if [ "$MODE" = "global" ]; then
  TARGET_DIR="$HOME/.claude"
  MEMORY_TARGET="$HOME/.meridian/core/memory"
else
  TARGET_DIR="$PROJECT_ROOT/.claude"
  MEMORY_TARGET="$PROJECT_ROOT/.meridian/core/memory"
fi

SOURCE="$PROJECT_ROOT/core/components"

# Verify source exists
if [ ! -d "$SOURCE" ]; then
  echo "ERROR: core/components/ not found at $SOURCE"
  exit 1
fi

# Step 1: Clean existing
mkdir -p "$TARGET_DIR/skills" "$TARGET_DIR/agents"
rm -rf "${TARGET_DIR:?}/skills"/* "${TARGET_DIR:?}/agents"/* 2>/dev/null || true

# Step 2: Copy skills
cp -R "$SOURCE/skills"/* "$TARGET_DIR/skills/" 2>/dev/null || true

# Step 3: Copy plays (into skills — Claude Code uses single folder)
cp -R "$SOURCE/plays"/* "$TARGET_DIR/skills/" 2>/dev/null || true

# Step 4: Copy agents
cp "$SOURCE/agents"/*.md "$TARGET_DIR/agents/" 2>/dev/null || true

# Step 5: Sync memory
mkdir -p "$MEMORY_TARGET"
rm -rf "${MEMORY_TARGET:?}"/* 2>/dev/null || true
cp -R "$SOURCE/memory"/* "$MEMORY_TARGET"/ 2>/dev/null || true

# Step 6: Remove artifacts
rm -f "$TARGET_DIR/skills/README.md" "$TARGET_DIR/agents/README.md" 2>/dev/null || true
find "$TARGET_DIR/skills" "$TARGET_DIR/agents" -name ".gitkeep" -delete 2>/dev/null || true

# Global mode: remove sync-claude (framework-only, stays in project .claude/)
if [ "$MODE" = "global" ]; then
  rm -rf "$TARGET_DIR/skills/sync-claude" 2>/dev/null || true
fi

# Step 7: Report
SKILL_COUNT=$(ls -1d "$TARGET_DIR/skills"/*/ 2>/dev/null | wc -l | tr -d ' ')
AGENT_COUNT=$(ls -1 "$TARGET_DIR/agents"/*.md 2>/dev/null | wc -l | tr -d ' ')
MEMORY_COUNT=$(ls -1 "$MEMORY_TARGET"/ 2>/dev/null | wc -l | tr -d ' ')

echo "=== Synced to $TARGET_DIR ($MODE mode) ==="
echo ""
echo "=== Skills ($SKILL_COUNT) ==="
ls -1 "$TARGET_DIR/skills/"
echo ""
echo "=== Agents ($AGENT_COUNT) ==="
ls -1 "$TARGET_DIR/agents/"
echo ""
echo "=== Memory ($MEMORY_COUNT dirs → $MEMORY_TARGET) ==="
ls -1 "$MEMORY_TARGET"/
