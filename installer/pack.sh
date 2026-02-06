#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$SCRIPT_DIR"

echo "=== Phoenix OS Pack ==="
echo "Building distributable package..."

# Clean any previous build artifacts
rm -rf core CLAUDE.md README.md LICENSE .gitignore

# Copy core content from repo root
echo "  Copying core/..."
cp -R "$REPO_ROOT/core" .

# Copy root files
echo "  Copying root files..."
for file in CLAUDE.md README.md LICENSE .gitignore; do
  if [ -f "$REPO_ROOT/$file" ]; then
    cp "$REPO_ROOT/$file" .
  fi
done

# Run npm pack
echo "  Packing..."
npm pack --quiet

# Move tarball to repo root
TARBALL=$(ls phoenix-os-*.tgz 2>/dev/null)
if [ -n "$TARBALL" ]; then
  mv "$TARBALL" "$REPO_ROOT/"
  echo "  Created: $TARBALL"
else
  echo "ERROR: No tarball produced"
  exit 1
fi

# Cleanup copied files
echo "  Cleaning up..."
rm -rf core CLAUDE.md README.md LICENSE .gitignore

echo "=== Done ==="
echo "Package: $REPO_ROOT/$TARBALL"
