#!/usr/bin/env python3
"""
stamp_epic.py — surgical epic-entry stamper for /validate (C8, F6/F11), on the spine.

The ONE durable model write of this play: flip the epic's status per the computed
verdict — in_delivery → validated (pass) or in_delivery → fix_required (fail). In
the spine model the epic lives as an entry in product-os/_spine.yaml `epics` index;
this stamper finds it by id and touches exactly its `status`, `metadata.version`,
and — on a pass — `surface_verified: true` (the required surface-parity check ran
and matched, surface-contract.md / ADR 022) on that entry; nothing else; refuses
every other transition.

Refusals:
  - verdict file ok=false or verdict null → refuse (compute first, REC3)
  - epic status not `in_delivery` → refuse (only implement's hand-off is stampable)
  - epic `delivered` or `ready` → refuse, always

    python3 stamp_epic.py --product-base <pb> --epic <epic-id> --verdict-file <verdict.json>
        [--dry-run]

Prints {ok, changed, epic_id, status, errors[]}. Exit 0 ok, 1 refuse, 2 usage.
"""

import argparse
import json
import os
import sys

try:
    import yaml
except ImportError:
    sys.stderr.write("stamp_epic.py: PyYAML is required (pip install pyyaml).\n")
    sys.exit(2)


def main():
    ap = argparse.ArgumentParser(description="Surgical epic verdict stamper (spine).")
    ap.add_argument("--product-base", required=True)
    ap.add_argument("--epic", required=True, help="epic id")
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

    spine_path = os.path.join(args.product_base, "product-os", "_spine.yaml")
    try:
        spine = yaml.safe_load(open(spine_path, encoding="utf-8")) or {}
    except Exception as exc:
        errors.append(f"spine unreadable: {exc}")
        print(json.dumps(out, indent=2))
        sys.exit(1)
    epic = next((e for e in (spine.get("epics") or [])
                 if isinstance(e, dict) and e.get("id") == args.epic.split("/")[-1]), None)
    if epic is None:
        errors.append(f"epic '{args.epic}' not in the spine epics index")
        print(json.dumps(out, indent=2))
        sys.exit(1)
    out["epic_id"] = epic.get("id")
    status = (epic.get("status") or "").strip().lower()
    out["status"] = status

    if verdict.get("epic_id") and epic.get("id") and \
            verdict["epic_id"] != epic["id"]:
        errors.append(f"verdict is for epic '{verdict['epic_id']}', "
                      f"target holds '{epic['id']}' — refuse (C8)")
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
        # On a pass, also stamp surface_verified: the verdict gate (check_gates.py,
        # C13) only reaches `validated` once the required surface-parity check has
        # run and matched (surface-contract.md, ADR 022), so `validated` carries
        # surface_verified: true. This is the signal /next reads to tell a surface
        # that actually shipped from surface debt.
        if new_status == "validated":
            epic["surface_verified"] = True
        meta = epic.setdefault("metadata", {})
        meta["version"] = int(meta.get("version") or 1) + 1
        with open(spine_path, "w", encoding="utf-8") as fh:
            yaml.safe_dump(spine, fh, sort_keys=False, allow_unicode=True)
    out.update({"ok": True, "changed": not args.dry_run, "status": new_status,
                "surface_verified": new_status == "validated"})
    print(json.dumps(out, indent=2))
    sys.exit(0)


if __name__ == "__main__":
    main()
