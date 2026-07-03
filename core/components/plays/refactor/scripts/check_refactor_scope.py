#!/usr/bin/env python3
"""
check_refactor_scope.py — assert the refactor stayed within its declared target (C4 / F4).

Mechanical set-membership over state already captured to disk. It does NOT shell out to git
or run anything live — it reads two YAML artifacts a prior step wrote:

  - refactor-plan.yaml       -> target_paths: the paths (files or dir prefixes) the plan
                                declared as the refactor target.
  - implementation-report.yaml -> files_modified: the files the builder actually changed
                                (each entry may carry a deviation_justification).

A modified file is in-scope when it is one of target_paths, sits under a target_paths
directory prefix, OR carries a non-empty deviation_justification. Any modified file that is
none of these is scope sprawl (F4) and fails the check.

Usage:  python3 check_refactor_scope.py <refactor-plan.yaml> <implementation-report.yaml>
Exit:   0 = in scope, 1 = out-of-scope change found, 2 = could not read inputs.
"""

import os
import sys

try:
    import yaml
except ImportError:  # pragma: no cover - environment guard
    print("check_refactor_scope: PyYAML is required", file=sys.stderr)
    sys.exit(2)


def _load(path):
    with open(path, encoding="utf-8") as fh:
        return yaml.safe_load(fh) or {}


def _target_paths(plan):
    """target_paths may be a list of paths, or a list/map of entries with a 'path'."""
    tp = plan.get("target_paths", plan.get("target", []))
    paths = set()
    if isinstance(tp, str):
        return {tp}
    if isinstance(tp, dict):
        paths |= set(tp.keys())
        tp = tp.values()
    for entry in tp:
        if isinstance(entry, str):
            paths.add(entry)
        elif isinstance(entry, dict):
            p = entry.get("path") or entry.get("file")
            if p:
                paths.add(p)
    return {p.rstrip("/") for p in paths}


def _in_scope(path, targets):
    norm = os.path.normpath(path)
    for t in targets:
        tn = os.path.normpath(t)
        if norm == tn:
            return True
        # directory-prefix match: the modified file lives under a declared target dir
        if norm.startswith(tn + os.sep):
            return True
    return False


def main(argv):
    if len(argv) != 3:
        print("usage: python3 check_refactor_scope.py <refactor-plan.yaml> "
              "<implementation-report.yaml>", file=sys.stderr)
        return 2
    try:
        plan = _load(argv[1])
        report = _load(argv[2])
    except OSError as exc:
        print(f"check_refactor_scope: cannot read input: {exc}", file=sys.stderr)
        return 2

    targets = _target_paths(plan)
    if not targets:
        print("SCOPE CHECK: FAIL — refactor-plan declares no target_paths", file=sys.stderr)
        return 1

    modified = report.get("files_modified", [])
    out_of_scope = []
    for entry in modified:
        if isinstance(entry, str):
            path, justification = entry, ""
        elif isinstance(entry, dict):
            path = entry.get("path") or entry.get("file") or ""
            justification = (entry.get("deviation_justification") or "").strip()
        else:
            continue
        if not path:
            continue
        if _in_scope(path, targets) or justification:
            continue
        out_of_scope.append(path)

    if out_of_scope:
        print("SCOPE CHECK: FAIL")
        for p in out_of_scope:
            print(f"  sprawl (outside target_paths, no deviation_justification): {p}")
        return 1

    print("SCOPE CHECK: PASS (every modified file is within the target or justified)")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
