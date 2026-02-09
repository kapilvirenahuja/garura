#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")"
echo "=== Phoenix OS Pack ==="
npm pack
echo "=== Done ==="
