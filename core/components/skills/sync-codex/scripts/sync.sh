#!/usr/bin/env bash
set -euo pipefail

# sync-codex — Sync Garura plays/agents to Codex skills and subagents.
# Usage: ./sync.sh [--project|--global]

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../../../.." && pwd)"
SOURCE="$PROJECT_ROOT/core/components"

MODE="global"
for arg in "$@"; do
  case "$arg" in
    --project) MODE="project" ;;
    --global) MODE="global" ;;
    *)
      echo "Unknown argument: $arg"
      echo "Usage: sync.sh [--project|--global]"
      exit 1
      ;;
  esac
done

if [ ! -d "$SOURCE" ]; then
  echo "ERROR: core/components/ not found at $SOURCE"
  exit 1
fi

if [ "$MODE" = "global" ]; then
  SKILLS_TARGET="$HOME/.codex/skills"
  AGENTS_TARGET="$HOME/.codex/agents"
  SUPPORT_TARGET="$HOME/.codex/garura/skills"
else
  SKILLS_TARGET="$PROJECT_ROOT/.codex/skills"
  AGENTS_TARGET="$PROJECT_ROOT/.codex/agents"
  SUPPORT_TARGET="$PROJECT_ROOT/.codex/garura/skills"
fi

SKILLS_MANIFEST="$SKILLS_TARGET/.garura-sync-codex-manifest"
AGENTS_MANIFEST="$AGENTS_TARGET/.garura-sync-codex-manifest"
SUPPORT_MANIFEST="$SUPPORT_TARGET/.garura-sync-codex-manifest"

mkdir -p "$SKILLS_TARGET" "$AGENTS_TARGET" "$SUPPORT_TARGET"

load_manifest_entries() {
  local manifest="$1"
  if [ -f "$manifest" ]; then
    sed '/^[[:space:]]*$/d' "$manifest"
  fi
}

cleanup_manifest_entries() {
  local manifest="$1"
  local base_dir="$2"
  while IFS= read -r relpath; do
    [ -z "$relpath" ] && continue
    rm -rf "$base_dir/$relpath"
  done < <(load_manifest_entries "$manifest")
}

write_manifest() {
  local manifest="$1"
  shift
  : > "$manifest"
  for relpath in "$@"; do
    printf '%s\n' "$relpath" >> "$manifest"
  done
}

yaml_escape() {
  printf '%s' "$1" | sed 's/"/\\"/g'
}

toml_escape() {
  printf '%s' "$1" | sed 's/\\/\\\\/g' | sed 's/"/\\"/g'
}

cleanup_manifest_entries "$SKILLS_MANIFEST" "$SKILLS_TARGET"
cleanup_manifest_entries "$AGENTS_MANIFEST" "$AGENTS_TARGET"
cleanup_manifest_entries "$SUPPORT_MANIFEST" "$SUPPORT_TARGET"

transform_play_skill() {
  local src_dir="$1"
  local dst_dir="$2"
  local src_skill="$src_dir/SKILL.md"
  local dst_skill="$dst_dir/SKILL.md"
  local name=""
  local description=""
  local body=""
  local frontmatter_started=0
  local frontmatter_done=0

  while IFS= read -r line || [ -n "$line" ]; do
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
      case "$line" in
        name:*)
          name="$(printf '%s' "$line" | sed 's/^name:[[:space:]]*//' | sed 's/^"//' | sed 's/"$//')"
          ;;
        description:*)
          description="$(printf '%s' "$line" | sed 's/^description:[[:space:]]*//' | sed 's/^"//' | sed 's/"$//')"
          ;;
      esac
    fi
  done < "$src_skill"

  if [ -z "$name" ] || [ -z "$description" ]; then
    echo "ERROR: missing name/description in $src_skill"
    exit 1
  fi

  {
    echo "---"
    printf 'name: %s\n' "$name"
    printf 'description: "%s"\n' "$(yaml_escape "$description")"
    echo "---"
    echo
    echo "## Codex Runtime"
    echo
    echo "This Garura play is synced into Codex as a skill."
    echo
    echo "- When the play delegates to a Garura agent such as \`repo-orchestrator\`, explicitly spawn the Codex custom subagent with that exact name."
    echo "- Internal Garura skill contracts, scripts, templates, and references live under \`.codex/garura/skills/\` in project mode or \`~/.codex/garura/skills/\` in global mode."
    echo "- Do not expect internal Garura skills to be available as top-level Codex skills in this runtime."
    echo
    printf '%s' "$body"
  } > "$dst_skill"
}

transform_meta_skill() {
  local src_skill="$1"
  local dst_skill="$2"
  local name=""
  local description=""
  local body=""
  local frontmatter_started=0
  local frontmatter_done=0

  while IFS= read -r line || [ -n "$line" ]; do
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
      case "$line" in
        name:*)
          name="$(printf '%s' "$line" | sed 's/^name:[[:space:]]*//' | sed 's/^"//' | sed 's/"$//')"
          ;;
        description:*)
          description="$(printf '%s' "$line" | sed 's/^description:[[:space:]]*//' | sed 's/^"//' | sed 's/"$//')"
          ;;
      esac
    fi
  done < "$src_skill"

  if [ -z "$name" ] || [ -z "$description" ]; then
    echo "ERROR: missing name/description in $src_skill"
    exit 1
  fi

  {
    echo "---"
    printf 'name: %s\n' "$name"
    printf 'description: "%s"\n' "$(yaml_escape "$description")"
    echo "---"
    printf '%s' "$body"
  } > "$dst_skill"
}

escape_toml_multiline() {
  sed 's/"""/\\"""/g'
}

transform_agent_to_toml() {
  local src="$1"
  local dst="$2"
  local name=""
  local description=""
  local body=""
  local frontmatter_started=0
  local frontmatter_done=0

  while IFS= read -r line || [ -n "$line" ]; do
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
      case "$line" in
        name:*)
          name="$(printf '%s' "$line" | sed 's/^name:[[:space:]]*//' | sed 's/^"//' | sed 's/"$//')"
          ;;
        description:*)
          description="$(printf '%s' "$line" | sed 's/^description:[[:space:]]*//' | sed 's/^"//' | sed 's/"$//')"
          ;;
      esac
    fi
  done < "$src"

  if [ -z "$name" ] || [ -z "$description" ]; then
    echo "ERROR: missing name/description in $src"
    exit 1
  fi

  local preamble
  preamble=$(
    cat <<'EOF'
You are a Garura custom subagent running inside Codex.

- Your reusable Garura support skill contracts/resources live under `.codex/garura/skills/` in project mode or `~/.codex/garura/skills/` in global mode.
- When the source instructions refer to internal Garura skills, load their contracts/resources from that support library instead of expecting them as top-level Codex skills.
- Preserve the named Garura agent role and follow the domain boundaries in the source instructions.

EOF
  )

  {
    printf 'name = "%s"\n' "$(toml_escape "$name")"
    printf 'description = "%s"\n' "$(toml_escape "$description")"
    echo 'developer_instructions = """'
    printf '%s' "$preamble" | escape_toml_multiline
    printf '%s' "$body" | escape_toml_multiline
    echo '"""'
  } > "$dst"
}

copy_support_skill() {
  local src_dir="$1"
  local dst_dir="$2"
  mkdir -p "$(dirname "$dst_dir")"
  cp -R "$src_dir" "$dst_dir"
}

skill_paths=()
agent_paths=()
support_paths=()

# Top-level Codex skills: plays plus sync-codex itself.
for play_dir in "$SOURCE/plays"/*/; do
  [ -d "$play_dir" ] || continue
  [ -f "$play_dir/SKILL.md" ] || continue
  play_name="$(basename "$play_dir")"
  dst_dir="$SKILLS_TARGET/$play_name"
  rm -rf "$dst_dir"
  cp -R "$play_dir" "$dst_dir"
  transform_play_skill "$play_dir" "$dst_dir"
  skill_paths+=("$play_name")
done

sync_codex_src="$SOURCE/skills/sync-codex"
if [ -d "$sync_codex_src" ]; then
  sync_dst="$SKILLS_TARGET/sync-codex"
  rm -rf "$sync_dst"
  cp -R "$sync_codex_src" "$sync_dst"
  transform_meta_skill "$sync_codex_src/SKILL.md" "$sync_dst/SKILL.md"
  skill_paths+=("sync-codex")
fi

# Custom Codex subagents.
for agent_file in "$SOURCE/agents"/*.md; do
  [ -f "$agent_file" ] || continue
  agent_name="$(basename "$agent_file" .md)"
  dst_file="$AGENTS_TARGET/$agent_name.toml"
  transform_agent_to_toml "$agent_file" "$dst_file"
  agent_paths+=("$agent_name.toml")
done

# Support Garura skills for subagents (exclude sync utilities).
for skill_dir in "$SOURCE/skills"/*/; do
  [ -d "$skill_dir" ] || continue
  skill_name="$(basename "$skill_dir")"
  case "$skill_name" in
    sync-claude|sync-droids|sync-codex)
      continue
      ;;
  esac
  dst_dir="$SUPPORT_TARGET/$skill_name"
  rm -rf "$dst_dir"
  copy_support_skill "$skill_dir" "$dst_dir"
  support_paths+=("$skill_name")
done

write_manifest "$SKILLS_MANIFEST" "${skill_paths[@]}"
write_manifest "$AGENTS_MANIFEST" "${agent_paths[@]}"
write_manifest "$SUPPORT_MANIFEST" "${support_paths[@]}"

echo "=== Synced Codex components ($MODE mode) ==="
echo ""
echo "=== Skills ($(printf '%s\n' "${skill_paths[@]}" | sed '/^$/d' | wc -l | tr -d ' ')) → $SKILLS_TARGET ==="
printf '%s\n' "${skill_paths[@]}" | sed '/^$/d'
echo ""
echo "=== Agents ($(printf '%s\n' "${agent_paths[@]}" | sed '/^$/d' | wc -l | tr -d ' ')) → $AGENTS_TARGET ==="
printf '%s\n' "${agent_paths[@]}" | sed '/^$/d'
echo ""
echo "=== Support Skills ($(printf '%s\n' "${support_paths[@]}" | sed '/^$/d' | wc -l | tr -d ' ')) → $SUPPORT_TARGET ==="
printf '%s\n' "${support_paths[@]}" | sed '/^$/d'
