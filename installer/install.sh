#!/usr/bin/env bash
set -euo pipefail

# Phoenix OS Installer
# Usage:
#   curl -fsSL https://raw.githubusercontent.com/kapilvirenahuja/phoenix-os/main/installer/install.sh | bash
#   curl -fsSL https://raw.githubusercontent.com/kapilvirenahuja/phoenix-os/main/installer/install.sh | bash -s -- --project-name my-app

REPO="kapilvirenahuja/phoenix-os"
BRANCH="main"
EXCLUDED_SKILLS="sync-claude"

# --- Helpers ---

info()  { printf '\033[1;34m[phoenix-os]\033[0m %s\n' "$1"; }
ok()    { printf '\033[1;32m[phoenix-os]\033[0m %s\n' "$1"; }
warn()  { printf '\033[1;33m[phoenix-os]\033[0m %s\n' "$1"; }
err()   { printf '\033[1;31m[phoenix-os]\033[0m %s\n' "$1" >&2; }

cleanup() {
  if [ -n "${TMPDIR_WORK:-}" ] && [ -d "$TMPDIR_WORK" ]; then
    rm -rf "$TMPDIR_WORK"
  fi
}
trap cleanup EXIT

# --- Parse arguments ---

PROJECT_NAME=""
TARGET_DIR="$(pwd)"

while [ $# -gt 0 ]; do
  case "$1" in
    --project-name)
      shift
      PROJECT_NAME="${1:-}"
      if [ -z "$PROJECT_NAME" ]; then
        err "--project-name requires a value"
        exit 1
      fi
      ;;
    *)
      err "Unknown option: $1"
      exit 1
      ;;
  esac
  shift
done

if [ -z "$PROJECT_NAME" ]; then
  PROJECT_NAME="$(basename "$TARGET_DIR")"
fi

# --- Detect mode ---

PHOENIX_CONFIG="$TARGET_DIR/.phoenix-os/core/config.yaml"
MODE="init"
if [ -f "$PHOENIX_CONFIG" ]; then
  MODE="upgrade"
fi

# --- Download repo archive ---

info "Downloading Phoenix OS from GitHub..."
TMPDIR_WORK="$(mktemp -d)"
ARCHIVE_URL="https://github.com/$REPO/archive/refs/heads/$BRANCH.tar.gz"

curl -fsSL "$ARCHIVE_URL" | tar xz -C "$TMPDIR_WORK"

# The tarball extracts to a directory named <repo>-<branch>
SRC_DIR="$TMPDIR_WORK/phoenix-os-$BRANCH"

if [ ! -d "$SRC_DIR/core" ]; then
  err "Downloaded archive does not contain core/ directory. Something went wrong."
  exit 1
fi

COMPONENTS_DIR="$SRC_DIR/core/components"

# --- Utility functions ---

copy_dir() {
  local src="$1" dest="$2"
  mkdir -p "$dest"
  cp -R "$src"/* "$dest"/ 2>/dev/null || true
}

# --- Transform config.yaml ---

transform_config() {
  local content="$1" name="$2"
  echo "$content" \
    | sed -E "s/^([[:space:]]*name:[[:space:]]*).+$/\1$name/" \
    | sed -E "s/^([[:space:]]*type:[[:space:]]*).+$/\1Project/" \
    | sed -E "s|^([[:space:]]*skills:[[:space:]]*).+$|\1./.claude/skills/|" \
    | sed -E "s|^([[:space:]]*recipes:[[:space:]]*).+$|\1./.claude/skills/|" \
    | sed -E "s|^([[:space:]]*agents:[[:space:]]*).+$|\1./.claude/agents/|" \
    | sed -E "s|^([[:space:]]*memory:[[:space:]]*).+$|\1~/.phoenix-os/core/memory/|" \
    | sed -E '/^platform:/d' \
    | sed -E '/^github:/,/^[^ ]/{ /^github:/d; /^  /d; }' \
    | sed -E '/^$/N;/^\n$/d'
}

# --- Transform CLAUDE.md ---

transform_claude_md() {
  local content="$1" name="$2"

  # Use a temp file for multi-step sed transforms
  local tmpfile
  tmpfile="$(mktemp)"
  echo "$content" > "$tmpfile"

  # Update title
  sed -i.bak -E "s/^# CLAUDE\.md$/# CLAUDE.md — $name/" "$tmpfile"

  # Replace architecture diagram block
  python3 -c "
import re, sys
with open('$tmpfile', 'r') as f:
    text = f.read()

new_diagram = '''\`\`\`
.claude/                   # AI components (managed by Phoenix OS)
\u251c\u2500\u2500 agents/               # Agent definitions
\u2514\u2500\u2500 skills/               # Skills + recipes

.phoenix-os/
\u251c\u2500\u2500 core/
\u2502   \u251c\u2500\u2500 memory/           # LTM: practices, templates, standards
\u2502   \u2514\u2500\u2500 config.yaml       # Project configuration
\u2514\u2500\u2500 project/              # STM: checkpoints, specs
    \u2514\u2500\u2500 specs/
\`\`\`'''

text = re.sub(r'\`\`\`\ncore/components/.*?\`\`\`', new_diagram, text, flags=re.DOTALL)

# Remove Source of Truth section
text = re.sub(r'### 1\. Source of Truth[\s\S]*?(?=### 2\. Execution Model)', '', text)

# Remove sync-claude reference
text = re.sub(r'After editing source, run \`/sync-claude\`\.\n*', '', text)

# Update config path references
text = text.replace('\`core/config.yaml\`', '\`.phoenix-os/core/config.yaml\`')

# Remove doc references
text = re.sub(r'- \`docs/.*\n', '', text)

# Collapse multiple blank lines
text = re.sub(r'\n{3,}', '\n\n', text)

with open('$tmpfile', 'w') as f:
    f.write(text)
" 2>/dev/null

  cat "$tmpfile"
  rm -f "$tmpfile" "$tmpfile.bak"
}

# --- Deploy skills (excluding sync-claude) ---

deploy_skills() {
  local src="$1" dest="$2"
  mkdir -p "$dest"
  for skill_dir in "$src"/*/; do
    local skill_name
    skill_name="$(basename "$skill_dir")"
    # Skip excluded skills
    if echo "$EXCLUDED_SKILLS" | grep -qw "$skill_name"; then
      continue
    fi
    copy_dir "$skill_dir" "$dest/$skill_name"
  done
}

# ===================================================================
# INIT MODE — Fresh installation
# ===================================================================

if [ "$MODE" = "init" ]; then
  info "Initializing Phoenix OS in $TARGET_DIR..."
  info "  Project name: $PROJECT_NAME"

  # 1. Deploy agents
  if [ -d "$COMPONENTS_DIR/agents" ]; then
    info "  Deploying agents..."
    copy_dir "$COMPONENTS_DIR/agents" "$TARGET_DIR/.claude/agents"
  fi

  # 2. Deploy skills (excluding sync-claude)
  if [ -d "$COMPONENTS_DIR/skills" ]; then
    info "  Deploying skills..."
    deploy_skills "$COMPONENTS_DIR/skills" "$TARGET_DIR/.claude/skills"
  fi

  # 3. Deploy recipes → .claude/skills/
  if [ -d "$COMPONENTS_DIR/recipes" ]; then
    info "  Deploying recipes..."
    for recipe_dir in "$COMPONENTS_DIR/recipes"/*/; do
      local_name="$(basename "$recipe_dir")"
      copy_dir "$recipe_dir" "$TARGET_DIR/.claude/skills/$local_name"
    done
  fi

  # 4. Deploy memory
  if [ -d "$COMPONENTS_DIR/memory" ]; then
    info "  Deploying memory..."
    copy_dir "$COMPONENTS_DIR/memory" "$HOME/.phoenix-os/core/memory"
  fi

  # 5. Transform and write config.yaml
  if [ -f "$SRC_DIR/core/config.yaml" ]; then
    info "  Writing config..."
    mkdir -p "$TARGET_DIR/.phoenix-os/core"
    config_content="$(cat "$SRC_DIR/core/config.yaml")"
    transform_config "$config_content" "$PROJECT_NAME" > "$TARGET_DIR/.phoenix-os/core/config.yaml"
  fi

  # 6. Create project directories
  info "  Creating project structure..."
  mkdir -p "$TARGET_DIR/.phoenix-os/project/specs"
  mkdir -p "$TARGET_DIR/src"

  # 7. Transform and write CLAUDE.md
  if [ -f "$SRC_DIR/CLAUDE.md" ]; then
    info "  Writing CLAUDE.md..."
    claude_content="$(cat "$SRC_DIR/CLAUDE.md")"
    transform_claude_md "$claude_content" "$PROJECT_NAME" > "$TARGET_DIR/CLAUDE.md"
  fi

  ok ""
  ok "Phoenix OS initialized successfully!"
  ok ""
  ok "Project structure created:"
  ok "  .claude/agents/      — Agent definitions"
  ok "  .claude/skills/      — Skills and recipes"
  ok "  .phoenix-os/core/    — Memory and config"
  ok "  .phoenix-os/project/ — Project artifacts"
  ok "  src/                 — Source code"
  ok "  CLAUDE.md            — AI instructions"
  ok ""
  ok "Next steps:"
  ok "  1. Review and customize CLAUDE.md for your project"
  ok "  2. Update .phoenix-os/core/config.yaml with your repo details"
  ok "  3. Start developing with Claude Code!"

# ===================================================================
# UPGRADE MODE — Non-destructive update
# ===================================================================

else
  info "Upgrading Phoenix OS in $TARGET_DIR..."
  info "  Existing installation detected."

  # 1. Upgrade agents (overwrite managed files)
  if [ -d "$COMPONENTS_DIR/agents" ]; then
    info "  Upgrading agents..."
    copy_dir "$COMPONENTS_DIR/agents" "$TARGET_DIR/.claude/agents"
  fi

  # 2. Upgrade skills (overwrite managed, excluding sync-claude)
  if [ -d "$COMPONENTS_DIR/skills" ]; then
    info "  Upgrading skills..."
    deploy_skills "$COMPONENTS_DIR/skills" "$TARGET_DIR/.claude/skills"
  fi

  # 3. Upgrade recipes
  if [ -d "$COMPONENTS_DIR/recipes" ]; then
    info "  Upgrading recipes..."
    for recipe_dir in "$COMPONENTS_DIR/recipes"/*/; do
      local_name="$(basename "$recipe_dir")"
      copy_dir "$recipe_dir" "$TARGET_DIR/.claude/skills/$local_name"
    done
  fi

  # 4. Upgrade memory
  if [ -d "$COMPONENTS_DIR/memory" ]; then
    info "  Upgrading memory..."
    copy_dir "$COMPONENTS_DIR/memory" "$HOME/.phoenix-os/core/memory"
  fi

  # 5. Write config.yaml.new for user to diff/merge
  if [ -f "$SRC_DIR/core/config.yaml" ]; then
    info "  Writing config.yaml.new (review and merge manually)..."
    config_content="$(cat "$SRC_DIR/core/config.yaml")"
    transform_config "$config_content" "$PROJECT_NAME" > "$TARGET_DIR/.phoenix-os/core/config.yaml.new"
  fi

  # 6. Write CLAUDE.md.new for user to diff/merge
  if [ -f "$SRC_DIR/CLAUDE.md" ]; then
    info "  Writing CLAUDE.md.new (review and merge manually)..."
    claude_content="$(cat "$SRC_DIR/CLAUDE.md")"
    transform_claude_md "$claude_content" "$PROJECT_NAME" > "$TARGET_DIR/CLAUDE.md.new"
  fi

  ok ""
  ok "Phoenix OS upgraded successfully!"
  ok ""
  ok "Updated (overwritten):"
  ok "  .claude/agents/              — Agent definitions"
  ok "  .claude/skills/              — Skills and recipes"
  ok "  ~/.phoenix-os/core/memory/   — Memory (practices, templates)"
  ok ""
  ok "Review these files for changes:"
  ok "  .phoenix-os/core/config.yaml.new  — diff with config.yaml"
  ok "  CLAUDE.md.new                     — diff with CLAUDE.md"
  ok ""
  ok "Preserved (not touched):"
  ok "  .phoenix-os/project/     — Your project artifacts"
  ok "  .phoenix-os/core/config.yaml — Your config"
  ok "  CLAUDE.md                — Your AI instructions"
  ok "  .claude/settings.json    — Your Claude settings"
fi
