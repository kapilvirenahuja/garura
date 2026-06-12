#!/usr/bin/env python3
"""
stamp_epic.py — surgical epic-record stamper for /validate (C8, F6/F11).

The ONE durable model write of this play: flip the epic's status per the
computed verdict — in_delivery → validated (pass) or in_delivery →
fix_required (fail). Modeled on /implement's update_epic_status.py and /run's
stamp_slice.py: touches exactly `epic.status` and `epic.metadata.version`,
nothing else; refuses every other transition.

Refusals:
  - verdict file ok=false or verdict null → refuse (compute first, REC3)
  - epic status not `in_delivery` → refuse (only implement's hand-off is stampable)
  - epic `delivered` or `ready` → refuse, always

    python3 stamp_epic.py --epic-file <epic.yaml> --verdict-file <verdict.json>
        [--dry-run]

Prints {ok, changed, epic_id, status, errors[]}. Exit 0 ok, 1 refuse, 2 usage.
"""

import argparse
import json
import sys

try:
    import yaml
except ImportError:
    sys.stderr.write("stamp_epic.py: PyYAML is required (pip install pyyaml).\n")
    sys.exit(2)


def main():
    ap = argparse.ArgumentParser(description="Surgical epic verdict stamper.")
    ap.add_argument("--epic-file", required=True)
    ap.add_argument("--verdict-file", required=True)
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    errors = []
    out = {"ok": False, "changed": False, "epic_id": None, "status": None,
           "errors": errors}

    try:
        with open(args.verdict_file, "r", encoding="utf-8") as fh:
            verdict = json.load(fh)
    except Exception as exc:
        errors.append(f"verdict unreadable: {exc}")
        print(json.dumps(out, indent=2))
        sys.exit(1)
    if not verdict.get("ok") or verdict.get("verdict") not in ("validated",
                                                               "fix_required"):
        errors.append("verdict file is not a computed verdict — run "
                      "compute_verdict.py first (C8/F3)")

    try:
        with open(args.epic_file, "r", encoding="utf-8") as fh:
            doc = yaml.safe_load(fh) or {}
    except Exception as exc:
        errors.append(f"epic unreadable: {exc}")
        print(json.dumps(out, indent=2))
        sys.exit(1)
    epic = doc.get("epic") or doc
    out["epic_id"] = epic.get("id")
    status = (epic.get("status") or "").strip().lower()
    out["status"] = status

    if verdict.get("epic_id") and epic.get("id") and \
            verdict["epic_id"] != epic["id"]:
        errors.append(f"verdict is for epic '{verdict['epic_id']}', "
                      f"file holds '{epic['id']}' — refuse (C8)")
    if status != "in_delivery":
        errors.append(f"epic status is '{status}' — only an in_delivery epic is "
                      "stampable (ready: not built; validated/fix_required: already "
                      "stamped; delivered: never re-anchored) (C8/F11)")

    if errors:
        print(json.dumps(out, indent=2))
        sys.exit(1)

    new_status = verdict["verdict"]
    if not args.dry_run:
        epic["status"] = new_status
        meta = epic.setdefault("metadata", {})
        meta["version"] = int(meta.get("version") or 1) + 1
        with open(args.epic_file, "w", encoding="utf-8") as fh:
            yaml.safe_dump(doc, fh, sort_keys=False, allow_unicode=True)
    out.update({"ok": True, "changed": not args.dry_run, "status": new_status})
    print(json.dumps(out, indent=2))
    sys.exit(0)


if __name__ == "__main__":
    main()
