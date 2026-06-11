#!/usr/bin/env python3
"""
update_epic_status.py — surgical epic-record writer for /implement.

Executes the epic schema's /start fill rule (the epic file's ONLY sanctioned
mutation by this play): write `issue_ref` and flip `status` ready → in_delivery
once the injected start-change has opened the issue. Wiring note: the schema
assigns this fill to /start; start-change predates epics, so /implement
executes it immediately after the injected start step (#434 decision — can move
into start-change later).

Surgical: touches exactly `epic.status`, `epic.issue_ref`, and
`epic.metadata.version` (+1). Refuses anything else:

  - target not `ready` and not already `in_delivery` with the SAME issue
    (idempotent resume) → refuse;
  - target `delivered` → refuse, always.

Layer rule: reads/writes files on disk only; no git/gh/network.

    python3 update_epic_status.py --epic-file <path> --issue <number> [--dry-run]

Prints {ok, changed, epic_id, status, issue_ref, errors[]} JSON.
Exit 0 ok (changed or idempotent), 1 refused, 2 usage error.
"""

import argparse
import json
import sys

try:
    import yaml
except ImportError:
    sys.stderr.write("update_epic_status.py: PyYAML is required (pip install pyyaml).\n")
    sys.exit(2)


def main(argv=None):
    ap = argparse.ArgumentParser(description="Surgical epic status/issue_ref writer.")
    ap.add_argument("--epic-file", required=True)
    ap.add_argument("--issue", required=True, help="issue number/ref start-change resolved")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args(argv)

    errors = []
    try:
        with open(args.epic_file, encoding="utf-8") as fh:
            doc = yaml.safe_load(fh) or {}
    except (OSError, yaml.YAMLError) as exc:
        print(json.dumps({"ok": False, "changed": False,
                          "errors": [f"epic file unreadable: {exc}"]}, indent=2))
        return 1

    epic = doc.get("epic") or {}
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
    elif status == "ready":
        epic["status"] = "in_delivery"
        epic["issue_ref"] = issue
        meta = epic.setdefault("metadata", {})
        meta["version"] = int(meta.get("version") or 1) + 1
        doc["epic"] = epic
        if not args.dry_run:
            with open(args.epic_file, "w", encoding="utf-8") as fh:
                yaml.safe_dump(doc, fh, sort_keys=False, allow_unicode=True)
        out.update({"ok": True, "changed": True,
                    "status": "in_delivery", "issue_ref": issue})
    else:
        errors.append(f"epic status is '{status}', expected 'ready' (C1)")

    print(json.dumps(out, indent=2))
    return 0 if out["ok"] else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
