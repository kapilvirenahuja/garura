#!/usr/bin/env python3
"""
update_epic_status.py — surgical epic-entry writer for /implement (on the spine).

Executes the epic schema's /start fill rule (the epic entry's ONLY sanctioned
mutation by this play): write `issue_ref` and flip `status` ready → in_delivery
once the injected start-change has opened the issue — or fix_required →
in_delivery on the C14 fix-round re-entry (same issue only). In the spine model
the epic lives as an entry in product-os/_spine.yaml `epics` index; this writer
finds it by id and mutates only its `status`, `issue_ref`, and `metadata.version`
(+1) on that entry — nothing else in the spine.

Refuses anything else:
  - target not `ready`, not `fix_required` under the SAME issue, and not
    already `in_delivery` with the SAME issue (idempotent resume) → refuse;
  - target `delivered` → refuse, always.

Layer rule: reads/writes the spine file on disk only; no git/gh/network.

    python3 update_epic_status.py --product-base <pb> --epic <epic-id> --issue <number> [--dry-run]

Prints {ok, changed, epic_id, status, issue_ref, errors[]} JSON.
Exit 0 ok (changed or idempotent), 1 refused, 2 usage error.
"""

import argparse
import json
import os
import sys

try:
    import yaml
except ImportError:
    sys.stderr.write("update_epic_status.py: PyYAML is required (pip install pyyaml).\n")
    sys.exit(2)


def main(argv=None):
    ap = argparse.ArgumentParser(description="Surgical epic status/issue_ref writer (spine).")
    ap.add_argument("--product-base", required=True)
    ap.add_argument("--epic", required=True, help="epic id")
    ap.add_argument("--issue", required=True, help="issue number/ref start-change resolved")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args(argv)

    errors = []
    spine_path = os.path.join(args.product_base, "product-os", "_spine.yaml")
    if not os.path.isfile(spine_path):
        print(json.dumps({"ok": False, "changed": False,
                          "errors": [f"no spine at {spine_path}"]}, indent=2))
        return 1
    try:
        spine = yaml.safe_load(open(spine_path, encoding="utf-8")) or {}
    except yaml.YAMLError as exc:
        print(json.dumps({"ok": False, "changed": False,
                          "errors": [f"spine parse error: {exc}"]}, indent=2))
        return 1

    epic = next((e for e in (spine.get("epics") or [])
                 if isinstance(e, dict) and e.get("id") == args.epic.split("/")[-1]), None)
    if epic is None:
        print(json.dumps({"ok": False, "changed": False,
                          "errors": [f"epic '{args.epic}' not in the spine epics index"]},
                         indent=2))
        return 1

    status = (epic.get("status") or "").strip().lower()
    issue = str(args.issue).lstrip("#")
    out = {"ok": False, "changed": False, "epic_id": epic.get("id"),
           "status": status, "issue_ref": epic.get("issue_ref"), "errors": errors}

    if status == "delivered":
        errors.append("epic is 'delivered' — never re-anchored; refuse (C1)")
    elif status == "in_delivery":
        if str(epic.get("issue_ref") or "").lstrip("#") == issue:
            out["ok"] = True  # idempotent resume — nothing to write
        else:
            errors.append(f"epic is in_delivery under issue "
                          f"'{epic.get('issue_ref')}', not '{issue}' — refuse (C1)")
    elif status == "fix_required" and \
            str(epic.get("issue_ref") or "").lstrip("#") != issue:
        errors.append(f"epic is fix_required under issue "
                      f"'{epic.get('issue_ref')}', not '{issue}' — refuse (C1/C14)")
    elif status in ("ready", "fix_required"):
        epic["status"] = "in_delivery"
        epic["issue_ref"] = issue
        meta = epic.setdefault("metadata", {})
        meta["version"] = int(meta.get("version") or 1) + 1
        if not args.dry_run:
            with open(spine_path, "w", encoding="utf-8") as fh:
                yaml.safe_dump(spine, fh, sort_keys=False, allow_unicode=True)
        out.update({"ok": True, "changed": True,
                    "status": "in_delivery", "issue_ref": issue})
    else:
        errors.append(f"epic status is '{status}', expected 'ready' or "
                      f"'fix_required' (C1)")

    print(json.dumps(out, indent=2))
    return 0 if out["ok"] else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
