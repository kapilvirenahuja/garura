#!/usr/bin/env python3
"""
stamp_fix_required.py — surgical epic stamper for /launch's defect path (C6).

The launch-side transition: `validated` → `fix_required` when the human
rejected a scenario. Touches exactly `epic.status` + `epic.metadata.version`.
Refuses everything else:

  - the close-gate decision is not `fix_required` → refuse (no stamp without
    a computed rejection);
  - epic status not `validated` → refuse (only validate's stamp is revocable
    here; in_delivery/ready/delivered are other plays' states).

    python3 stamp_fix_required.py --epic-file <epic.yaml> --gate-file <gate.json>
        [--dry-run]

Prints {ok, changed, epic_id, status, errors[]}. Exit 0 ok, 1 refuse, 2 usage.
"""

import argparse
import json
import sys

try:
    import yaml
except ImportError:
    sys.stderr.write("stamp_fix_required.py: PyYAML is required (pip install pyyaml).\n")
    sys.exit(2)


def main():
    ap = argparse.ArgumentParser(description="Surgical launch fix_required stamper.")
    ap.add_argument("--epic-file", required=True)
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
        with open(args.epic_file, "w", encoding="utf-8") as fh:
            yaml.safe_dump(doc, fh, sort_keys=False, allow_unicode=True)
    out.update({"ok": True, "changed": not args.dry_run, "status": "fix_required"})
    print(json.dumps(out, indent=2))
    sys.exit(0)


if __name__ == "__main__":
    main()
