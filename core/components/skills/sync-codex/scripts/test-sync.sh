#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../../../.." && pwd)"
SYNC_SCRIPT="$SCRIPT_DIR/sync.sh"

assert_file() {
  local path="$1"
  if [ ! -f "$path" ]; then
    echo "ASSERTION FAILED: expected file $path"
    exit 1
  fi
}

assert_dir() {
  local path="$1"
  if [ ! -d "$path" ]; then
    echo "ASSERTION FAILED: expected directory $path"
    exit 1
  fi
}

assert_contains() {
  local path="$1"
  local pattern="$2"
  if ! grep -Fq "$pattern" "$path"; then
    echo "ASSERTION FAILED: expected '$pattern' in $path"
    exit 1
  fi
}

run_global_mode_test() {
  local tmp_home
  tmp_home="$(mktemp -d)"
  HOME="$tmp_home" bash "$SYNC_SCRIPT" >/dev/null

  assert_dir "$tmp_home/.codex/skills/ship"
  assert_file "$tmp_home/.codex/skills/ship/SKILL.md"
  assert_contains "$tmp_home/.codex/skills/ship/SKILL.md" "## Codex Runtime"
  assert_contains "$tmp_home/.codex/skills/ship/SKILL.md" "name: ship"
  assert_file "$tmp_home/.codex/agents/repo-orchestrator.toml"
  assert_contains "$tmp_home/.codex/agents/repo-orchestrator.toml" 'name = "repo-orchestrator"'
  assert_contains "$tmp_home/.codex/agents/repo-orchestrator.toml" 'developer_instructions = """'
  assert_dir "$tmp_home/.codex/garura/skills/analyze-pr"
  assert_file "$tmp_home/.codex/skills/sync-codex/SKILL.md"

  rm -rf "$tmp_home"
}

run_project_mode_test() {
  local tmp_root
  local tmp_project
  tmp_root="$(mktemp -d)"
  tmp_project="$tmp_root/project"
  mkdir -p "$tmp_project/core/components"
  cp -R "$PROJECT_ROOT/core/components" "$tmp_project/core/"

  (
    cd "$tmp_project"
    bash "$tmp_project/core/components/skills/sync-codex/scripts/sync.sh" --project >/dev/null
  )

  assert_dir "$tmp_project/.codex/skills/create-pr"
  assert_file "$tmp_project/.codex/skills/create-pr/SKILL.md"
  assert_contains "$tmp_project/.codex/skills/create-pr/SKILL.md" "description:"
  assert_file "$tmp_project/.codex/agents/project-orchestrator.toml"
  assert_dir "$tmp_project/.codex/garura/skills/manage-issue"
  assert_file "$tmp_project/.codex/skills/.garura-sync-codex-manifest"
  assert_file "$tmp_project/.codex/agents/.garura-sync-codex-manifest"
  assert_file "$tmp_project/.codex/garura/skills/.garura-sync-codex-manifest"

  rm -rf "$tmp_root"
}

run_global_mode_test
run_project_mode_test
echo "sync-codex tests passed"
