#!/usr/bin/env python3
"""
deliver_epic.py — the /merge fill executor for /launch (C7/F7), on the spine.

After the injected merge member lands, the epic schema's /merge fill executes:
status -> `delivered` is recorded into a delivery record AND written back onto the
epic's spine `epics` entry, which is KEPT in place (with its epic.md grounding doc)
as the as-delivered record. Epics are permanent (ADR 019, #439): we keep the intent,
the structure, AND the slicing — the kept spine entry + epic.md are the product
model's record of what shipped, in what order, against what acceptance and
user_check. The epic entry/doc are NEVER deleted.

Wiring note: the schema assigns this fill to /merge; merge-change is a generic
member that knows nothing of epics, so /launch executes the fill right after the
injected merge step (the same pattern as /implement executing the /start fill).

Refusals (merge always first):
  - no merge evidence file, or it records no merged result -> refuse;
  - epic status not `validated` (already `delivered` on resume is a clean no-op);
  - epic not in the spine -> refuse (the kept record must exist; never deleted).

    python3 deliver_epic.py --product-base <pb> --epic <epic-id> --merge-evidence <merge.json>
        --delivery-record <out.json> [--dry-run]

Prints {ok, delivered, epic_id, errors[]}. Exit 0 ok, 1 refuse, 2 usage.
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
    ap = argparse.ArgumentParser(description="/launch delivered-stamp fill (epic kept, spine).")
    ap.add_argument("--product-base", required=True)
    ap.add_argument("--epic", required=True, help="epic id")
    ap.add_argument("--merge-evidence", required=True)
    ap.add_argument("--delivery-record", required=True)
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    errors = []
    out = {"ok": False, "delivered": False, "epic_id": None, "errors": errors}

    spine_path = os.path.join(args.product_base, "product-os", "_spine.yaml")
    if not os.path.isfile(spine_path):
        errors.append(f"no spine at {spine_path}")
        print(json.dumps(out, indent=2))
        sys.exit(1)

    try:
        with open(args.merge_evidence, "r", encoding="utf-8") as fh:
            merge = json.load(fh)
    except Exception as exc:
        errors.append(f"merge evidence unreadable: {exc} — merge always first (C7/F7)")
        merge = {}
    if not errors and not (merge.get("merged") or merge.get("status") == "merged"):
        errors.append("merge evidence records no merged result — the epic is stamped "
                      "delivered only after the merge lands (C7/F7)")

    try:
        spine = yaml.safe_load(open(spine_path, encoding="utf-8")) or {}
    except Exception as exc:
        errors.append(f"spine unreadable: {exc}")
        print(json.dumps(out, indent=2))
        sys.exit(1)
    epic = next((e for e in (spine.get("epics") or [])
                 if isinstance(e, dict) and e.get("id") == args.epic.split("/")[-1]), None)
    if epic is None:
        errors.append("epic not in the spine epics index — the kept record must exist "
                      "and is never deleted (F7)")
        print(json.dumps(out, indent=2))
        sys.exit(1)
    out["epic_id"] = epic.get("id")
    status = (epic.get("status") or "").strip().lower()

    # idempotent resume: already delivered with a record present is a clean no-op
    if status == "delivered" and os.path.isfile(args.delivery_record):
        out.update({"ok": True, "delivered": True})
        print(json.dumps(out, indent=2))
        sys.exit(0)

    if status not in ("validated", "delivered"):
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
        # stamp delivered onto the KEPT spine epic entry — never delete it
        epic["status"] = "delivered"
        with open(spine_path, "w", encoding="utf-8") as fh:
            yaml.safe_dump(spine, fh, sort_keys=False, allow_unicode=True)
    out.update({"ok": True, "delivered": not args.dry_run})
    print(json.dumps(out, indent=2))
    sys.exit(0)


if __name__ == "__main__":
    main()
