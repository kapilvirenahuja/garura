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
        [--record <verdict.json>] [--dry-run]

--record (#464, Done means D4): on a successful stamp, mark the named verdict
artifact `stamped: true` in place — the stop-condition gate reads that field at
close. A refused or dry-run stamp never records.

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


def parse_args():
    ap = argparse.ArgumentParser(description="Surgical epic verdict stamper (spine).")
    ap.add_argument("--product-base", required=True)
    ap.add_argument("--epic", required=True, help="epic id")
    ap.add_argument("--verdict-file", required=True)
    ap.add_argument("--record",
                    help="verdict JSON to mark stamped: true on success (#464 D4)")
    ap.add_argument("--dry-run", action="store_true")
    return ap.parse_args()


def refuse(out):
    """Print the result envelope and exit 1 — the refusal path."""
    print(json.dumps(out, indent=2))
    sys.exit(1)


def load_verdict(path, errors, out):
    """Read the computed verdict JSON; unreadable refuses immediately (REC3)."""
    try:
        with open(path, "r", encoding="utf-8") as fh:
            verdict = json.load(fh)
    except Exception as exc:
        errors.append(f"verdict unreadable: {exc}")
        refuse(out)
    if not verdict.get("ok") or verdict.get("verdict") not in ("validated",
                                                               "fix_required"):
        errors.append("verdict file is not a computed verdict — run "
                      "compute_verdict.py first (C8/F3)")
    return verdict


def load_epic(product_base, epic_arg, errors, out):
    """Load the spine and find the target epic entry; either missing refuses."""
    spine_path = os.path.join(product_base, "product-os", "_spine.yaml")
    try:
        spine = yaml.safe_load(open(spine_path, encoding="utf-8")) or {}
    except Exception as exc:
        errors.append(f"spine unreadable: {exc}")
        refuse(out)
    epic = next((e for e in (spine.get("epics") or [])
                 if isinstance(e, dict) and e.get("id") == epic_arg.split("/")[-1]), None)
    if epic is None:
        errors.append(f"epic '{epic_arg}' not in the spine epics index")
        refuse(out)
    return spine_path, spine, epic


def check_transition(verdict, epic, status, errors):
    """C8/F11: verdict must target this epic, and only in_delivery is stampable."""
    if verdict.get("epic_id") and epic.get("id") and \
            verdict["epic_id"] != epic["id"]:
        errors.append(f"verdict is for epic '{verdict['epic_id']}', "
                      f"target holds '{epic['id']}' — refuse (C8)")
    if status != "in_delivery":
        errors.append(f"epic status is '{status}' — only an in_delivery epic is "
                      "stampable (ready: not built; validated/fix_required: already "
                      "stamped; delivered: never re-anchored) (C8/F11)")


def apply_stamp(spine_path, spine, epic, new_status):
    """The one durable write: status, surface_verified on a pass, version bump."""
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


def record_stamp(record_path):
    """#464 Done means D4: mark the named verdict artifact stamped: true in place.
    The stop-condition gate reads `stamped` at close."""
    with open(record_path, "r", encoding="utf-8") as fh:
        rec = json.load(fh)
    rec["stamped"] = True
    with open(record_path, "w", encoding="utf-8") as fh:
        json.dump(rec, fh, indent=2)


def main():
    args = parse_args()
    errors = []
    out = {"ok": False, "changed": False, "epic_id": None, "status": None,
           "errors": errors}

    verdict = load_verdict(args.verdict_file, errors, out)
    spine_path, spine, epic = load_epic(args.product_base, args.epic, errors, out)
    out["epic_id"] = epic.get("id")
    status = (epic.get("status") or "").strip().lower()
    out["status"] = status

    check_transition(verdict, epic, status, errors)
    if errors:
        refuse(out)

    new_status = verdict["verdict"]
    if not args.dry_run:
        apply_stamp(spine_path, spine, epic, new_status)
        if args.record:
            record_stamp(args.record)
    out.update({"ok": True, "changed": not args.dry_run, "status": new_status,
                "surface_verified": new_status == "validated",
                "stamped_recorded": bool(args.record) and not args.dry_run})
    print(json.dumps(out, indent=2))
    sys.exit(0)


if __name__ == "__main__":
    main()
