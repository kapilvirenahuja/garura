#!/usr/bin/env python3
"""
deliver_epic.py — the /merge fill executor for /launch (C7/F7).

After the injected merge member lands, the epic schema's /merge fill executes:
status → `delivered` is recorded into a delivery record, then the epic FILE is
DELETED (epics are temporary — we keep the intent and structure, not the
slicing). Wiring note: the schema assigns this fill to /merge; merge-change is
a generic member that knows nothing of epics, so /launch executes the fill
right after the injected merge step (the same pattern as /implement executing
the /start fill).

Refusals (merge always first):
  - no merge evidence file, or it records no merged result → refuse;
  - epic status not `validated` → refuse (a fix_required or in_delivery epic
    must never be delivered);
  - epic file already gone → idempotent ok (resume).

    python3 deliver_epic.py --epic-file <epic.yaml> --merge-evidence <merge.json>
        --delivery-record <out.json> [--dry-run]

Prints {ok, deleted, epic_id, errors[]}. Exit 0 ok, 1 refuse, 2 usage.
"""

import argparse
import json
import os
import sys

try:
    import yaml
except ImportError:
    sys.stderr.write("deliver_epic.py: PyYAML is required (pip install pyyaml).\n")
    sys.exit(2)


def main():
    ap = argparse.ArgumentParser(description="/launch delivered+delete fill.")
    ap.add_argument("--epic-file", required=True)
    ap.add_argument("--merge-evidence", required=True)
    ap.add_argument("--delivery-record", required=True)
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    errors = []
    out = {"ok": False, "deleted": False, "epic_id": None, "errors": errors}

    if not os.path.isfile(args.epic_file):
        # already delivered+deleted — idempotent resume, provided the record exists
        if os.path.isfile(args.delivery_record):
            out.update({"ok": True, "deleted": True})
            with open(args.delivery_record, "r", encoding="utf-8") as fh:
                out["epic_id"] = (json.load(fh) or {}).get("epic_id")
            print(json.dumps(out, indent=2))
            sys.exit(0)
        errors.append("epic file missing with no delivery record — deleted before "
                      "the fill ran? (F7)")
        print(json.dumps(out, indent=2))
        sys.exit(1)

    try:
        with open(args.merge_evidence, "r", encoding="utf-8") as fh:
            merge = json.load(fh)
    except Exception as exc:
        errors.append(f"merge evidence unreadable: {exc} — merge always first (C7/F7)")
        merge = {}
    if not errors and not (merge.get("merged") or merge.get("status") == "merged"):
        errors.append("merge evidence records no merged result — the epic is deleted "
                      "only after the merge lands (C7/F7)")

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
    if status != "validated":
        errors.append(f"epic status is '{status}' — only a validated epic is "
                      "delivered (C7)")

    if errors:
        print(json.dumps(out, indent=2))
        sys.exit(1)

    record = {"epic_id": epic.get("id"), "slice_ref": epic.get("slice_ref"),
              "issue_ref": epic.get("issue_ref"), "status": "delivered",
              "merge_ref": merge.get("merge_ref") or merge.get("pr") or None}
    if not args.dry_run:
        with open(args.delivery_record, "w", encoding="utf-8") as fh:
            json.dump(record, fh, indent=2)
        os.remove(args.epic_file)
    out.update({"ok": True, "deleted": not args.dry_run})
    print(json.dumps(out, indent=2))
    sys.exit(0)


if __name__ == "__main__":
    main()
