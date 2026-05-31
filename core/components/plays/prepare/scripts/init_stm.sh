#!/usr/bin/env bash
# init_stm.sh — prepare play STM initialization (C31, F23).
#
# Idempotent creation of the issue-scoped STM tree prepare writes into. mkdir -p
# is infrastructure, not domain work — extracted so the play calls it instead of
# inlining the directory list. Safe to re-run.
#
# Usage:  init_stm.sh <stm_base> <issue>
# Exit:   0 = tree present; 2 = bad invocation.
set -euo pipefail

if [ "$#" -ne 2 ]; then
  echo "usage: init_stm.sh <stm_base> <issue>" >&2
  exit 2
fi

stm_base="${1%/}"
issue="$2"
root="${stm_base}/${issue}"

mkdir -p "${root}/context/understanding"
mkdir -p "${root}/context/blast-radius"
mkdir -p "${root}/context/design"
mkdir -p "${root}/context/briefs"
mkdir -p "${root}/evidence/prepare"
mkdir -p "${root}/status"

echo "OK: STM tree initialized at ${root}/"
exit 0
