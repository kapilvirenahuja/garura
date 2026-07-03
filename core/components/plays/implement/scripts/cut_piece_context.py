#!/usr/bin/env python3
"""
cut_piece_context.py — the per-piece context cutter for /implement (C17/F13).

A builder must work from its OWN piece, that piece's dependencies, and the spec —
never the whole plan, sibling pieces, or a free roam of the repo. Handing a builder
the full plan.yaml is the context leak this closes: it lets a long autonomous build
drift toward sibling work and bloats its token cost. So instead of passing the plan,
the play cuts a tight context slice for the one piece and dispatches THAT.

The slice carries:
  piece         — the target piece, whole.
  dependencies  — only the transitive closure of its `depends_on` (the pieces it
                  builds on top of), each as id + kind + title/outcome + the files
                  it produced, so the builder knows the surface it builds against —
                  never sibling pieces it has no dependency on.
  spec          — the path to the approved crisp ICE spec (the boundaries).

Layer rule: reads files on disk only; no git/gh/network.

    python3 cut_piece_context.py --plan <plan.yaml> --piece-id <id> \
            --spec <spec.md> --out <piece-context.yaml>

Prints {ok, errors[], piece_id, dependency_ids[], out} JSON.
Exit 0 clean, 1 gaps, 2 usage error.
"""

import argparse
import json
import os
import sys

try:
    import yaml
except ImportError:
    sys.stderr.write("cut_piece_context.py: PyYAML is required (pip install pyyaml).\n")
    sys.exit(2)


def main(argv=None):
    ap = argparse.ArgumentParser(description="Cut a tight per-piece context slice.")
    ap.add_argument("--plan", required=True)
    ap.add_argument("--piece-id", required=True)
    ap.add_argument("--spec", required=True, help="path to the approved ICE spec")
    ap.add_argument("--out", required=True)
    args = ap.parse_args(argv)

    try:
        with open(args.plan, encoding="utf-8") as fh:
            plan = yaml.safe_load(fh) or {}
    except (OSError, yaml.YAMLError) as exc:
        print(json.dumps({"ok": False, "errors": [f"plan unreadable: {exc}"]}, indent=2))
        return 1

    pieces = {p.get("id"): p for p in (plan.get("pieces") or []) if isinstance(p, dict)}
    if args.piece_id not in pieces:
        print(json.dumps({"ok": False,
                          "errors": [f"piece '{args.piece_id}' not in plan (C17)"],
                          "piece_id": args.piece_id}, indent=2))
        return 1

    # transitive closure of depends_on — the pieces this one builds on, nothing else.
    dep_ids, stack, errors = [], list(pieces[args.piece_id].get("depends_on") or []), []
    seen = set()
    while stack:
        d = stack.pop()
        if d in seen:
            continue
        seen.add(d)
        if d not in pieces:
            errors.append(f"depends_on '{d}' is not a piece in the plan (C13/C17)")
            continue
        dep_ids.append(d)
        stack.extend(pieces[d].get("depends_on") or [])

    def slim(pid):
        p = pieces[pid]
        return {"id": pid, "kind": p.get("kind"),
                "title": p.get("title") or p.get("outcome"),
                "files": p.get("files") or []}

    slice_doc = {"piece_context": {
        "piece_id": args.piece_id,
        "piece": pieces[args.piece_id],
        "dependencies": [slim(d) for d in sorted(set(dep_ids))],
        "spec": args.spec,
    }}

    os.makedirs(os.path.dirname(os.path.abspath(args.out)), exist_ok=True)
    with open(args.out, "w", encoding="utf-8") as fh:
        yaml.safe_dump(slice_doc, fh, sort_keys=False, default_flow_style=False)

    ok = not errors
    print(json.dumps({"ok": ok, "errors": errors, "piece_id": args.piece_id,
                      "dependency_ids": sorted(set(dep_ids)), "out": args.out}, indent=2))
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
