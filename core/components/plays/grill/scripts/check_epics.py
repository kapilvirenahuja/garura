#!/usr/bin/env python3
"""
check_epics.py — post-apply guard for /grill (C9/C11 — F7/F8).

Proves the persist did exactly what the checkpoint approved and nothing else:

  - the persisted epics/ folder equals the approved draft EXACTLY — every draft
    file byte-identical in the model, no extra file beyond the draft set except
    in-delivery epics the apply deliberately left untouched (F7: no partial,
    nothing unapproved);
  - within the slice folder, nothing outside epics/ changed against the pre-apply
    snapshot — lens files, decisions, everything byte-identical, nothing added or
    removed (F8);
  - the slice record and the profile are byte-identical to their snapshots (F8).

Layer rule: reads files on disk only; no git/gh/network.

    python3 check_epics.py --before <snapshot-of-slice-dir> --slice-dir <abs> \
            --draft <dir> --slice-record-before <path> --slice-record-after <path> \
            --profile-before <path> --profile-after <path>

Prints {ok, errors[]} JSON. Exit 0 clean, 1 violation, 2 usage error.
"""

import argparse
import filecmp
import json
import os
import sys

try:
    import yaml
except ImportError:
    sys.stderr.write("check_epics.py: PyYAML is required (pip install pyyaml).\n")
    sys.exit(2)


def walk_files(base):
    out = {}
    for root, _dirs, files in os.walk(base):
        for f in files:
            full = os.path.join(root, f)
            out[os.path.relpath(full, base)] = full
    return out


def epic_status(path):
    try:
        with open(path, encoding="utf-8") as fh:
            return (((yaml.safe_load(fh) or {}).get("epic") or {}).get("status") or "").strip().lower()
    except (OSError, yaml.YAMLError):
        return "unreadable"


def main(argv=None):
    ap = argparse.ArgumentParser(description="Post-apply guard for /grill.")
    ap.add_argument("--before", required=True, help="pre-apply snapshot of the slice dir")
    ap.add_argument("--slice-dir", required=True)
    ap.add_argument("--draft", required=True, help="the approved draft dir (holds epics/)")
    ap.add_argument("--slice-record-before", required=True)
    ap.add_argument("--slice-record-after", required=True)
    ap.add_argument("--profile-before", required=True)
    ap.add_argument("--profile-after", required=True)
    args = ap.parse_args(argv)

    errors = []

    # --- slice record + profile untouched (F8) --------------------------------
    for label, before, after in (
        ("slice record", args.slice_record_before, args.slice_record_after),
        ("profile", args.profile_before, args.profile_after),
    ):
        if not (os.path.isfile(before) and os.path.isfile(after)):
            errors.append(f"{label}: missing before/after file for comparison")
        elif not filecmp.cmp(before, after, shallow=False):
            errors.append(f"{label} changed — /grill writes only epics (C11/F8)")

    # --- nothing outside epics/ changed within the slice folder (F8) ----------
    before_files = walk_files(args.before)
    after_files = walk_files(args.slice_dir)
    outside = lambda rel: not rel.startswith("epics" + os.sep) and rel != "epics"
    for rel in sorted(set(before_files) | set(after_files)):
        if not outside(rel):
            continue
        if rel not in after_files:
            errors.append(f"{rel}: removed from the slice folder (C11/F8)")
        elif rel not in before_files:
            errors.append(f"{rel}: added outside epics/ (C11/F8)")
        elif not filecmp.cmp(before_files[rel], after_files[rel], shallow=False):
            errors.append(f"{rel}: changed outside epics/ (C11/F8)")

    # --- persisted epics == approved draft, exactly (F7) ----------------------
    draft_dir = os.path.join(args.draft, "epics")
    model_dir = os.path.join(args.slice_dir, "epics")
    draft_set = {f for f in os.listdir(draft_dir)
                 if f.endswith(".yaml")} if os.path.isdir(draft_dir) else set()
    model_set = {f for f in os.listdir(model_dir)
                 if f.endswith(".yaml")} if os.path.isdir(model_dir) else set()
    for name in sorted(draft_set):
        if name not in model_set:
            errors.append(f"epics/{name}: approved but not persisted — partial write (C9/F7)")
        elif not filecmp.cmp(os.path.join(draft_dir, name),
                             os.path.join(model_dir, name), shallow=False):
            errors.append(f"epics/{name}: persisted file differs from the approved draft (C9/F7)")
    for name in sorted(model_set - draft_set):
        # only an in-delivery/delivered epic (delivery's property) may remain
        status = None if name == "deferrals.yaml" else epic_status(os.path.join(model_dir, name))
        if status in (None, "ready", "unreadable"):
            errors.append(f"epics/{name}: present in the model but not in the approved "
                          f"draft (C9/F7)")

    ok = not errors
    print(json.dumps({"ok": ok, "errors": errors}, indent=2))
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
