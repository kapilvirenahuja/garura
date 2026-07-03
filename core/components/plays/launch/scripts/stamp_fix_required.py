#!/usr/bin/env python3
"""
stamp_fix_required.py — surgical epic stamper for /launch's defect path (C6), on the spine.

The launch-side transition: `validated` → `fix_required` when the human rejected a
scenario. In the spine model the epic lives as an entry in product-os/_spine.yaml
`epics` index; this stamper finds it by id and touches exactly its `status` +
`metadata.version` on that entry. Refuses everything else:

  - the close-gate decision is not `fix_required` → refuse (no stamp without
    a computed rejection);
  - epic status not `validated` → refuse (only validate's stamp is revocable
    here; in_delivery/ready/delivered are other plays' states).

    python3 stamp_fix_required.py --product-base <pb> --epic <epic-id> --gate-file <gate.json>
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
    sys.stderr.write("stamp_fix_required.py: PyYAML is required (pip install pyyaml).\n")
    sys.exit(2)


def main():
    ap = argparse.ArgumentParser(description="Surgical launch fix_required stamper (spine).")
    ap.add_argument("--product-base", required=True)
    ap.add_argument("--epic", required=True, help="epic id")
    ap.add_argument("--gate-file", required=True)
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    errors = []
    out = {"ok": False, "changed": False, "epic_id": None, "status": None,
           "errors": errors}

    try:
        with open(args.gate_file, "r", encoding="utf-8") as fh:
            gate = json.load(fh)
    except Exception as exc:
        errors.append(f"gate file unreadable: {exc}")
        print(json.dumps(out, indent=2))
        sys.exit(1)
    if gate.get("decision") != "fix_required":
        errors.append(f"close-gate decision is '{gate.get('decision')}' — no stamp "
                      "without a computed rejection (C6)")

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
    if status != "validated":
        errors.append(f"epic status is '{status}' — launch only revokes a 'validated' "
                      "stamp (C6)")

    if errors:
        print(json.dumps(out, indent=2))
        sys.exit(1)

    if not args.dry_run:
        epic["status"] = "fix_required"
        meta = epic.setdefault("metadata", {})
        meta["version"] = int(meta.get("version") or 1) + 1
        with open(spine_path, "w", encoding="utf-8") as fh:
            yaml.safe_dump(spine, fh, sort_keys=False, allow_unicode=True)
    out.update({"ok": True, "changed": not args.dry_run, "status": "fix_required"})
    print(json.dumps(out, indent=2))
    sys.exit(0)


if __name__ == "__main__":
    main()
