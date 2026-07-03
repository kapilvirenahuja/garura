#!/usr/bin/env python3
"""
check_scope.py — assert the implementation stayed within the designed blast radius.

Mechanical set-diff over state already captured to disk (C12 / F5). It does NOT
shell out to git or run anything live — it only reads two YAML artifacts a prior
step wrote:

  - design.yaml            -> affected_files: the files the design said it would touch
  - implementation-report.yaml -> files_modified: the files the builder actually changed
                                  (each entry may carry a deviation_justification)

A modified file is in-scope when it appears in design.affected_files, OR it carries a
non-empty deviation_justification. Any modified file that is neither is an out-of-scope
change (F5) and fails the check.

Usage:  python3 check_scope.py <design.yaml> <implementation-report.yaml>
Exit:   0 = in scope, 1 = out-of-scope change found, 2 = could not read inputs.
"""

import sys

try:
    import yaml
except ImportError:  # pragma: no cover - environment guard
    print("check_scope: PyYAML is required", file=sys.stderr)
    sys.exit(2)


def _load(path):
    with open(path, encoding="utf-8") as fh:
        return yaml.safe_load(fh) or {}


def _affected_paths(design):
    """affected_files may be a list of paths or a list/map of entries with a 'path'."""
    af = design.get("affected_files", [])
    paths = set()
    if isinstance(af, dict):
        paths |= set(af.keys())
        af = af.values()
    for entry in af:
        if isinstance(entry, str):
            paths.add(entry)
        elif isinstance(entry, dict):
            p = entry.get("path") or entry.get("file")
            if p:
                paths.add(p)
    return paths


def main(argv):
    if len(argv) != 3:
        print("usage: python3 check_scope.py <design.yaml> <implementation-report.yaml>",
              file=sys.stderr)
        return 2
    try:
        design = _load(argv[1])
        report = _load(argv[2])
    except OSError as exc:
        print(f"check_scope: cannot read input: {exc}", file=sys.stderr)
        return 2

    in_scope = _affected_paths(design)
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
        if path in in_scope:
            continue
        if justification:
            continue
        out_of_scope.append(path)

    if out_of_scope:
        print("SCOPE CHECK: FAIL")
        for p in out_of_scope:
            print(f"  out-of-scope (not in design.affected_files, no deviation_justification): {p}")
        return 1

    print("SCOPE CHECK: PASS (all modified files are designed or justified)")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
