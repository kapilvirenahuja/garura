#!/usr/bin/env bash
# Regression test for issue #358 — stale Meridian references after project rename
# Green state: all working-tree changes applied (no MERIDIAN_CONFIG, no MERIDIAN INTERFACE, no meridian in .claude/specs/)
# Red state: HEAD before fix (MERIDIAN_CONFIG in install.sh, MERIDIAN INTERFACE in idsd.md, 111 occurrences in .claude/specs/)

set -euo pipefail

PASS=0
FAIL=0

pass() { echo "PASS: $1"; PASS=$((PASS + 1)); }
fail() { echo "FAIL: $1"; FAIL=$((FAIL + 1)); }

# Determine repo root relative to this script
# Script lives at: {repo}/.garura/project/issues/358/evidence/fix-it/regression-test.sh
# That is 6 levels below repo root: .garura / project / issues / 358 / evidence / fix-it
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../../../../.." && pwd)"

# --- Check 1: installer/install.sh must not contain MERIDIAN_CONFIG ---
COUNT=$(grep -c "MERIDIAN_CONFIG" "$REPO_ROOT/installer/install.sh" || true)
if [ "$COUNT" -eq 0 ]; then
  pass "installer/install.sh: MERIDIAN_CONFIG absent"
else
  fail "installer/install.sh: found $COUNT occurrence(s) of MERIDIAN_CONFIG"
fi

# --- Check 2: installer/install.sh must contain GARURA_CONFIG ---
COUNT=$(grep -c "GARURA_CONFIG" "$REPO_ROOT/installer/install.sh" || true)
if [ "$COUNT" -gt 0 ]; then
  pass "installer/install.sh: GARURA_CONFIG present ($COUNT occurrence(s))"
else
  fail "installer/install.sh: GARURA_CONFIG not found — rename was not applied"
fi

# --- Check 3: docs/philosophy/idsd.md must not contain MERIDIAN INTERFACE ---
COUNT=$(grep -c "MERIDIAN INTERFACE" "$REPO_ROOT/docs/philosophy/idsd.md" || true)
if [ "$COUNT" -eq 0 ]; then
  pass "docs/philosophy/idsd.md: MERIDIAN INTERFACE absent"
else
  fail "docs/philosophy/idsd.md: found $COUNT occurrence(s) of MERIDIAN INTERFACE"
fi

# --- Check 4: docs/philosophy/idsd.md must contain GARURA INTERFACE ---
COUNT=$(grep -c "GARURA INTERFACE" "$REPO_ROOT/docs/philosophy/idsd.md" || true)
if [ "$COUNT" -gt 0 ]; then
  pass "docs/philosophy/idsd.md: GARURA INTERFACE present ($COUNT occurrence(s))"
else
  fail "docs/philosophy/idsd.md: GARURA INTERFACE not found — rename was not applied"
fi

# --- Check 5: .claude/specs/ must contain zero meridian references (case-insensitive) ---
SPECS_DIR="$REPO_ROOT/.claude/specs"
if [ -d "$SPECS_DIR" ]; then
  MATCHES=$(grep -ri "meridian" "$SPECS_DIR" || true)
  if [ -z "$MATCHES" ]; then
    pass ".claude/specs/: no meridian references found"
  else
    COUNT=$(echo "$MATCHES" | wc -l | tr -d ' ')
    fail ".claude/specs/: found $COUNT line(s) with meridian references"
  fi
else
  fail ".claude/specs/: directory not found at $SPECS_DIR"
fi

# --- Summary ---
echo ""
echo "Results: $PASS passed, $FAIL failed"

if [ "$FAIL" -gt 0 ]; then
  exit 1
fi

exit 0
