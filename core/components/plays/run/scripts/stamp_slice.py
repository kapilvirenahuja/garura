#!/usr/bin/env python3
"""
stamp_slice.py — flip the slice record's `status` to `realized` (C8/C9).

The last-lens stamp. Run ONLY after the human approves the checkpoint AND check_lines_up.py
reports lines_up — never otherwise (F8). It is deliberately surgical: it changes the slice
record's `status` and its updated_by/version metadata, and NOTHING else. The slice's
composition (functionalities, name, outcome, dependency_notes, acceptance_intent, order,
effort, depends_on) is left exactly as it was — check_run.py proves this afterwards.

Idempotent: stamping an already-`realized` slice leaves status `realized` (it still bumps the
metadata, which check_run tolerates).

Layer rule: a pure file edit over a disk input; no git/gh/network.

    python3 stamp_slice.py --slice-file <live slice record .yaml> [--by /run] \
            [--status realized]

Prints {ok, slice_id, status_before, status_after} JSON. Exit 0 on success, 2 on usage/parse.
"""

import argparse
import json
import sys

try:
    import yaml
except ImportError:
    sys.stderr.write("stamp_slice.py: PyYAML is required (pip install pyyaml).\n")
    sys.exit(2)


def main(argv=None):
    ap = argparse.ArgumentParser(description="Stamp the slice realized.")
    ap.add_argument("--slice-file", required=True)
    ap.add_argument("--by", default="/run")
    ap.add_argument("--status", default="realized")
    args = ap.parse_args(argv)

    try:
        with open(args.slice_file, encoding="utf-8") as fh:
            doc = yaml.safe_load(fh) or {}
    except OSError as exc:
        sys.stderr.write(f"stamp_slice.py: cannot read slice record: {exc}\n")
        sys.exit(2)
    except yaml.YAMLError as exc:
        sys.stderr.write(f"stamp_slice.py: slice record parse error: {exc}\n")
        sys.exit(2)

    sl = doc.get("slice")
    if not isinstance(sl, dict):
        sys.stderr.write("stamp_slice.py: no top-level `slice:` mapping in the record\n")
        sys.exit(2)

    status_before = sl.get("status")
    sl["status"] = args.status
    meta = sl.get("metadata")
    if not isinstance(meta, dict):
        meta = {}
        sl["metadata"] = meta
    meta["updated_by"] = args.by
    try:
        meta["version"] = int(meta.get("version") or 1) + 1
    except (TypeError, ValueError):
        meta["version"] = 1

    with open(args.slice_file, "w", encoding="utf-8") as fh:
        yaml.safe_dump(doc, fh, sort_keys=False, default_flow_style=False, allow_unicode=True)

    out = {"ok": True, "slice_id": sl.get("id"),
           "status_before": status_before, "status_after": sl["status"]}
    print(json.dumps(out, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
