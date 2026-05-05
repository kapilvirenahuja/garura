#!/usr/bin/env bash
set -euo pipefail

# sync-droids — Sync Garura components to Factory Droid directories
# Transforms Claude Code agents into Factory Droid format during deployment.
# Usage: ./sync.sh [--project|--global]

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../../../.." && pwd)"

MODE="global"
for arg in "$@"; do
  case "$arg" in
    --project) MODE="project" ;;
    --global)  MODE="global" ;;
    *)         echo "Unknown argument: $arg"; echo "Usage: sync.sh [--project|--global]"; exit 1 ;;
  esac
done

if [ "$MODE" = "global" ]; then
  TARGET_DIR="$HOME/.factory"
  MEMORY_TARGET="$HOME/.garura/core/memory"
else
  TARGET_DIR="$PROJECT_ROOT/.factory"
  MEMORY_TARGET="$PROJECT_ROOT/.garura/core/memory"
fi

SOURCE="$PROJECT_ROOT/core/components"

if [ ! -d "$SOURCE" ]; then
  echo "ERROR: core/components/ not found at $SOURCE"
  exit 1
fi

# --- Transformation helpers ---

# Map Claude Code model shorthand to Factory model ID
map_model() {
  local model="$1"
  case "$model" in
    sonnet)  echo "claude-sonnet-4-6" ;;
    haiku)   echo "claude-haiku-4-5-20251001" ;;
    opus)    echo "claude-opus-4-6" ;;
    *)       echo "$model" ;;
  esac
}

# Map a single Claude Code tool name to Factory Droid tool name(s)
map_tool() {
  local tool="$1"
  case "$tool" in
    Bash)      echo "Execute" ;;
    Write)     echo "Edit\", \"Create" ;;
    WebFetch)  echo "FetchUrl" ;;
    *)         echo "$tool" ;;
  esac
}

# Transform an agent .md file into a Factory Droid .md file
transform_agent_to_droid() {
  local src="$1"
  local dst="$2"

  local in_frontmatter=0
  local frontmatter_started=0
  local frontmatter_done=0
  local in_tools=0
  local name=""
  local description=""
  local model=""
  local tools=()
  local body=""

  # First pass: parse frontmatter
  while IFS= read -r line; do
    if [ "$frontmatter_done" -eq 1 ]; then
      body+="$line"$'\n'
      continue
    fi

    if [ "$frontmatter_started" -eq 0 ] && [ "$line" = "---" ]; then
      frontmatter_started=1
      continue
    fi

    if [ "$frontmatter_started" -eq 1 ] && [ "$line" = "---" ]; then
      frontmatter_done=1
      continue
    fi

    if [ "$frontmatter_started" -eq 1 ]; then
      # Parse frontmatter fields
      case "$line" in
        name:*)
          name="$(echo "$line" | sed 's/^name:[[:space:]]*//' | sed 's/^"//' | sed 's/"$//')"
          ;;
        description:*)
          description="$(echo "$line" | sed 's/^description:[[:space:]]*//' | sed 's/^"//' | sed 's/"$//')"
          ;;
        model:*)
          local raw_model
          raw_model="$(echo "$line" | sed 's/^model:[[:space:]]*//')"
          model="$(map_model "$raw_model")"
          ;;
        domain:*|role:*)
          # Drop these fields — not supported in Factory Droids
          ;;
        tools:*)
          in_tools=1
          ;;
        "  - "*)
          if [ "$in_tools" -eq 1 ]; then
            local tool_name
            tool_name="$(echo "$line" | sed 's/^[[:space:]]*- //')"
            local mapped
            mapped="$(map_tool "$tool_name")"
            # Handle Write -> "Edit", "Create" (two tools)
            if [ "$tool_name" = "Write" ]; then
              tools+=("Edit")
              tools+=("Create")
            else
              tools+=("$mapped")
            fi
          fi
          ;;
        *)
          if [ "$in_tools" -eq 1 ]; then
            in_tools=0
          fi
          ;;
      esac
    fi
  done < "$src"

  # Add LS to tool list if not already present
  local has_ls=0
  for t in "${tools[@]}"; do
    if [ "$t" = "LS" ]; then has_ls=1; fi
  done
  if [ "$has_ls" -eq 0 ] && [ ${#tools[@]} -gt 0 ]; then
    tools+=("LS")
  fi

  # Deduplicate tools
  local unique_tools=()
  for t in "${tools[@]}"; do
    local found=0
    for u in "${unique_tools[@]+"${unique_tools[@]}"}"; do
      if [ "$t" = "$u" ]; then found=1; break; fi
    done
    if [ "$found" -eq 0 ]; then
      unique_tools+=("$t")
    fi
  done

  # Build tools array string
  local tools_str=""
  if [ ${#unique_tools[@]} -gt 0 ]; then
    tools_str="["
    local first=1
    for t in "${unique_tools[@]}"; do
      if [ "$first" -eq 1 ]; then
        tools_str+="\"$t\""
        first=0
      else
        tools_str+=", \"$t\""
      fi
    done
    tools_str+="]"
  fi

  # Write droid file
  {
    echo "---"
    echo "name: $name"
    echo "description: >-"
    echo "  $description"
    [ -n "$model" ] && echo "model: $model"
    [ -n "$tools_str" ] && echo "tools: $tools_str"
    echo "---"
    printf '%s' "$body"
  } > "$dst"
}

# Transform a skill/play SKILL.md for Factory (strip unsupported frontmatter fields)
transform_skill() {
  local src="$1"
  local dst="$2"

  local in_frontmatter=0
  local frontmatter_started=0
  local frontmatter_done=0
  local output=""

  while IFS= read -r line; do
    if [ "$frontmatter_done" -eq 1 ]; then
      output+="$line"$'\n'
      continue
    fi

    if [ "$frontmatter_started" -eq 0 ] && [ "$line" = "---" ]; then
      frontmatter_started=1
      output+="---"$'\n'
      continue
    fi

    if [ "$frontmatter_started" -eq 1 ] && [ "$line" = "---" ]; then
      frontmatter_done=1
      output+="---"$'\n'
      continue
    fi

    if [ "$frontmatter_started" -eq 1 ]; then
      case "$line" in
        model:*|context:*|allowed-tools:*)
          # Drop — not supported in Factory skills
          ;;
        *)
          output+="$line"$'\n'
          ;;
      esac
    fi
  done < "$src"

  printf '%s' "$output" > "$dst"
}

# --- Main sync ---

# Step 1: Clean existing
mkdir -p "$TARGET_DIR/skills" "$TARGET_DIR/droids"
rm -rf "${TARGET_DIR:?}/skills"/* "${TARGET_DIR:?}/droids"/* 2>/dev/null || true

# Step 2: Copy and transform skills
for skill_dir in "$SOURCE/skills"/*/; do
  [ ! -d "$skill_dir" ] && continue
  skill_name="$(basename "$skill_dir")"
  # sync-claude and sync-droids are project-only — skip from main deployment loop
  # They get deployed to project .factory/skills/ separately below
  if [ "$skill_name" = "sync-claude" ] || [ "$skill_name" = "sync-droids" ]; then
    continue
  fi
  # Copy entire skill directory
  cp -R "$skill_dir" "$TARGET_DIR/skills/$skill_name"
  # Transform the SKILL.md if it exists in the source
  if [ -f "$skill_dir/SKILL.md" ]; then
    transform_skill "$skill_dir/SKILL.md" "$TARGET_DIR/skills/$skill_name/SKILL.md"
  fi
done

# Step 3: Copy and transform plays (into skills — Factory uses single folder)
for play_dir in "$SOURCE/plays"/*/; do
  [ ! -d "$play_dir" ] && continue
  play_name="$(basename "$play_dir")"
  cp -R "$play_dir" "$TARGET_DIR/skills/$play_name"
  if [ -f "$play_dir/SKILL.md" ]; then
    transform_skill "$play_dir/SKILL.md" "$TARGET_DIR/skills/$play_name/SKILL.md"
  fi
done

# Step 4: Transform agents into droids
for agent_file in "$SOURCE/agents"/*.md; do
  [ ! -f "$agent_file" ] && continue
  agent_name="$(basename "$agent_file")"
  transform_agent_to_droid "$agent_file" "$TARGET_DIR/droids/$agent_name"
done

# Step 4b: Always deploy sync-claude and sync-droids to PROJECT .factory/skills/
# These are framework-only skills that must be available in the project scope
PROJECT_FACTORY="$PROJECT_ROOT/.factory"
mkdir -p "$PROJECT_FACTORY/skills"
for framework_skill in "sync-claude" "sync-droids"; do
  if [ -d "$SOURCE/skills/$framework_skill" ]; then
    cp -R "$SOURCE/skills/$framework_skill" "$PROJECT_FACTORY/skills/$framework_skill"
    if [ -f "$SOURCE/skills/$framework_skill/SKILL.md" ]; then
      transform_skill "$SOURCE/skills/$framework_skill/SKILL.md" "$PROJECT_FACTORY/skills/$framework_skill/SKILL.md"
    fi
  fi
done

# Step 5: Sync memory
mkdir -p "$MEMORY_TARGET"
rm -rf "${MEMORY_TARGET:?}"/* 2>/dev/null || true
cp -R "$SOURCE/memory"/* "$MEMORY_TARGET"/ 2>/dev/null || true

# Step 6: Remove artifacts
rm -f "$TARGET_DIR/skills/README.md" "$TARGET_DIR/droids/README.md" 2>/dev/null || true
find "$TARGET_DIR/skills" "$TARGET_DIR/droids" -name ".gitkeep" -delete 2>/dev/null || true

# Step 7: Report
SKILL_COUNT=$(find "$TARGET_DIR/skills" -maxdepth 1 -mindepth 1 -type d 2>/dev/null | wc -l | tr -d ' ')
DROID_COUNT=$(find "$TARGET_DIR/droids" -maxdepth 1 -name "*.md" 2>/dev/null | wc -l | tr -d ' ')
MEMORY_COUNT=$(ls -1 "$MEMORY_TARGET"/ 2>/dev/null | wc -l | tr -d ' ')

echo "=== Synced to $TARGET_DIR ($MODE mode) ==="
echo ""
echo "=== Skills ($SKILL_COUNT) ==="
ls -1 "$TARGET_DIR/skills/" 2>/dev/null || echo "(none)"
echo ""
echo "=== Droids ($DROID_COUNT) ==="
ls -1 "$TARGET_DIR/droids/" 2>/dev/null || echo "(none)"
echo ""
echo "=== Memory ($MEMORY_COUNT dirs → $MEMORY_TARGET) ==="
ls -1 "$MEMORY_TARGET"/ 2>/dev/null || echo "(none)"
