#!/usr/bin/env python3
"""
apply_epics.py — atomic, allowlisted persist of an approved epic cut (C9/C11).

Writes the draft's epics/ folder — epic files + deferrals.yaml — into the slice's
epics/ home, and NOTHING else. All-or-none (F7): the plan is computed and checked
first; if anything is refused, nothing is written. The writer is handed only the
draft's epics/ folder, so it cannot touch the slice record, a lens, the ICE, or
the profile (F8).

Plan rules:
  - only *.yaml files directly under <draft>/epics/ are eligible; anything else
    in the draft epics/ folder is refused (allowlist).
  - an existing epic whose status is NOT `ready` (in_delivery / delivered) is
    delivery's property — overwriting or deleting it is refused; /grill re-cuts
    only what delivery has not picked up.
  - existing `ready` epics not in the new cut are deleted (the cut re-derives).

Layer rule: reads/writes files on disk only; no git/gh/network.

    python3 apply_epics.py --draft <dir> --slice-dir <abs> --out-manifest <path>

Manifest JSON: {ok, written[], deleted[], refused[]}. Exit 0 applied, 1 refused
(nothing written), 2 usage error.
"""

import argparse
import glob
import json
import os
import shutil
import sys

try:
    import yaml
except ImportError:
    sys.stderr.write("apply_epics.py: PyYAML is required (pip install pyyaml).\n")
    sys.exit(2)


def epic_status(path):
    try:
        with open(path, encoding="utf-8") as fh:
            return (((yaml.safe_load(fh) or {}).get("epic") or {}).get("status") or "").strip().lower()
    except (OSError, yaml.YAMLError):
        return "unreadable"


def main(argv=None):
    ap = argparse.ArgumentParser(description="Atomic allowlisted persist of an epic cut.")
    ap.add_argument("--draft", required=True, help="draft dir holding epics/")
    ap.add_argument("--slice-dir", required=True, help="the slice's folder in the product model")
    ap.add_argument("--out-manifest", required=True)
    args = ap.parse_args(argv)

    refused, written, deleted = [], [], []
    src_dir = os.path.join(args.draft, "epics")
    dst_dir = os.path.join(args.slice_dir, "epics")

    # --- plan -----------------------------------------------------------------
    if not os.path.isdir(src_dir):
        refused.append(f"draft has no epics/ folder: {src_dir}")
        plan = []
    else:
        plan = []
        for entry in sorted(os.listdir(src_dir)):
            src = os.path.join(src_dir, entry)
            if not entry.endswith(".yaml") or not os.path.isfile(src):
                refused.append(f"out of allowlist (only epics/*.yaml): {entry}")
                continue
            plan.append(entry)
        if not [e for e in plan if e != "deferrals.yaml"]:
            refused.append("draft cut holds no epic files — refusing an empty persist")

    new_names = set(plan)
    for existing in sorted(glob.glob(os.path.join(dst_dir, "*.yaml"))):
        name = os.path.basename(existing)
        status = None if name == "deferrals.yaml" else epic_status(existing)
        if name in new_names:
            if status not in (None, "ready"):
                refused.append(f"{name}: existing epic is '{status}' — delivery owns it; "
                               f"will not overwrite")
        else:
            if status in (None, "ready"):
                pass  # stale ready epic / old deferrals: replaced by the new cut
            else:
                continue  # in-delivery epic not in the cut: left untouched, not deleted

    if refused:
        manifest = {"ok": False, "written": [], "deleted": [], "refused": refused}
        os.makedirs(os.path.dirname(os.path.abspath(args.out_manifest)), exist_ok=True)
        with open(args.out_manifest, "w", encoding="utf-8") as fh:
            json.dump(manifest, fh, indent=2)
        print(json.dumps(manifest, indent=2))
        return 1

    # --- apply (all-or-none: plan is clean, now write) ------------------------
    os.makedirs(dst_dir, exist_ok=True)
    for existing in sorted(glob.glob(os.path.join(dst_dir, "*.yaml"))):
        name = os.path.basename(existing)
        status = None if name == "deferrals.yaml" else epic_status(existing)
        if name not in new_names and status in (None, "ready"):
            os.remove(existing)
            deleted.append(name)
    for entry in plan:
        shutil.copyfile(os.path.join(src_dir, entry), os.path.join(dst_dir, entry))
        written.append(entry)

    manifest = {"ok": True, "written": written, "deleted": deleted, "refused": []}
    os.makedirs(os.path.dirname(os.path.abspath(args.out_manifest)), exist_ok=True)
    with open(args.out_manifest, "w", encoding="utf-8") as fh:
        json.dump(manifest, fh, indent=2)
    print(json.dumps(manifest, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
