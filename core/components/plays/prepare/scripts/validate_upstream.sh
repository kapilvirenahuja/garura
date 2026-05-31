#!/usr/bin/env bash
# validate_upstream.sh — prepare play pre-flight (C1, C34, F24).
#
# Mechanical existence check for every upstream locked artifact prepare
# requires. No discovery mode, no fallback: a single missing artifact is a
# hard halt. Deterministic — extracted from the prepare play so the play calls
# it instead of re-reasoning the path list each run.
#
# Usage:  validate_upstream.sh <product_base> <epic_id>
# Exit:   0 = all present; 1 = one or more missing (prints the missing list);
#         2 = bad invocation.
set -euo pipefail

if [ "$#" -ne 2 ]; then
  echo "usage: validate_upstream.sh <product_base> <epic_id>" >&2
  exit 2
fi

product_base="${1%/}"
epic_id="$2"

# REQUIRED upstream artifacts: specify (3), design (1 file + screens dir), arch (5).
required=(
  "${product_base}/scope/epics/${epic_id}.yaml"
  "${product_base}/scope/scope.yaml"
  "${product_base}/specification/quality-profile.yaml"
  "${product_base}/experience/design-spec.md"
  "${product_base}/architecture/logical-architecture.yaml"
  "${product_base}/architecture/physical-architecture.yaml"
  "${product_base}/architecture/nfr-spec.yaml"
  "${product_base}/architecture/quality-vision.yaml"
  "${product_base}/architecture/design-patterns.yaml"
)

missing=()
for path in "${required[@]}"; do
  [ -f "$path" ] || missing+=("$path")
done

# screens directory must hold at least one screen markdown
screens_dir="${product_base}/experience/screens"
if ! ls "${screens_dir}"/*.md >/dev/null 2>&1; then
  missing+=("${screens_dir}/*.md (no screen files found)")
fi

if [ "${#missing[@]}" -ne 0 ]; then
  echo "HALT: missing upstream locked artifact(s) — run the upstream play first:" >&2
  for m in "${missing[@]}"; do echo "  - ${m}" >&2; done
  exit 1
fi

echo "OK: all upstream locked artifacts present (specify, design, arch)."
exit 0
