#!/usr/bin/env python3
"""
apply_shape.py — persist /shape's selection bundle, on a fixed allowlist.

Run only AFTER the human approves the checkpoint. /shape SELECTS and COMPOSES — it never
creates functionalities and never writes the profile. This writes exactly:

  1. the live spine `_spine.yaml`, mutated ONLY for:
       - capability `status` flips (active/deprecated) — status field only, every other
         capability field preserved; never a functionality, never a domain, never the profile.
       - persona / journey / decision refs appended onto the flipped capabilities (additive).
       - new `slices` index entries (skip-if-exists by id).
  2. the slice / persona / journey / decision RECORD files — copied from the draft
     skip-if-exists (stable ids → a re-run adds no duplicates).

The profile is never written (defensive: any profile path is refused). The spine's
`functionalities` and `domains` collections are never touched.

Layer rule: pure file writes from disk inputs; no git/gh/network.

    python3 apply_shape.py --draft <draft_dir> --product-base <product_base> \
        --manifest <shape-manifest.yaml> --out-manifest <apply-manifest.json>

Exit 0 on success, 2 on usage/parse error.
"""

import argparse
import json
import os
import shutil
import sys

try:
    import yaml
except ImportError:
    sys.stderr.write("apply_shape.py: PyYAML is required (pip install pyyaml).\n")
    sys.exit(2)

SPINE_NAME = "_spine.yaml"
REF_LISTS = ("personas", "journeys", "decisions")


def load(path):
    if not os.path.isfile(path):
        return {}
    with open(path, encoding="utf-8") as fh:
        return yaml.safe_load(fh) or {}


def find(entries, eid):
    for e in entries:
        if isinstance(e, dict) and e.get("id") == eid:
            return e
    return None


def main(argv=None):
    ap = argparse.ArgumentParser(description="Persist /shape on a fixed allowlist.")
    ap.add_argument("--draft", required=True)
    ap.add_argument("--product-base", required=True)
    ap.add_argument("--manifest", required=True, help="shape-manifest.yaml (provenance)")
    ap.add_argument("--out-manifest", required=True)
    args = ap.parse_args(argv)

    draft_root = os.path.join(args.draft, "product-os")
    live_root = os.path.join(args.product_base, "product-os")
    draft_spine_path = os.path.join(draft_root, SPINE_NAME)
    live_spine_path = os.path.join(live_root, SPINE_NAME)
    if not os.path.isdir(draft_root):
        sys.stderr.write(f"apply_shape.py: no draft tree at {draft_root}\n")
        return 2
    if not os.path.isfile(draft_spine_path) or not os.path.isfile(live_spine_path):
        sys.stderr.write("apply_shape.py: draft delta or live _spine.yaml missing\n")
        return 2

    draft_spine = load(draft_spine_path)
    live = load(live_spine_path)

    written, skipped, status_flips = [], [], []

    # --- 1. capability status flips + ref merges (only the named capabilities) ---
    live_caps = live.setdefault("capabilities", [])
    for dcap in draft_spine.get("capabilities") or []:
        cid = dcap.get("id")
        live_cap = find(live_caps, cid)
        if live_cap is None:
            sys.stderr.write(f"apply_shape.py: capability '{cid}' not in live spine — refusing\n")
            return 2
        new_status = dcap.get("status")
        if new_status and new_status != live_cap.get("status"):
            status_flips.append({"capability": cid, "from": live_cap.get("status"), "to": new_status})
            live_cap["status"] = new_status            # ONLY the status field
        for key in REF_LISTS:                          # additive ref merge
            for ref in dcap.get(key) or []:
                lst = live_cap.setdefault(key, [])
                if ref not in lst:
                    lst.append(ref)

    # --- 2. new slices index entries (skip-if-exists by id) ---
    live_slices = live.setdefault("slices", [])
    have_slices = {s.get("id") for s in live_slices if isinstance(s, dict)}
    for s in draft_spine.get("slices") or []:
        sid = s.get("id")
        if sid in have_slices:
            skipped.append(f"spine:slice:{sid}")
        else:
            live_slices.append(s)
            have_slices.add(sid)
            written.append(f"spine:slice:{sid}")

    # --- 3. copy the record files skip-if-exists (never spine, never profile) ---
    for dirpath, _dirs, files in os.walk(draft_root):
        rel_dir = os.path.relpath(dirpath, draft_root)
        for fn in files:
            rel = os.path.normpath(os.path.join(rel_dir, fn))
            if fn == SPINE_NAME and rel_dir == ".":
                continue                               # merged, not copied
            if fn == "profile.yaml":
                continue                               # defensive: never /shape's
            dst = os.path.join(live_root, rel)
            if os.path.exists(dst):
                skipped.append(f"doc:{rel}")
                continue
            os.makedirs(os.path.dirname(dst), exist_ok=True)
            shutil.copy2(os.path.join(dirpath, fn), dst)
            written.append(f"doc:{rel}")

    # --- write the mutated live spine back ---
    with open(live_spine_path, "w", encoding="utf-8") as fh:
        yaml.safe_dump(live, fh, sort_keys=False, allow_unicode=True)
    written.append("spine:_spine.yaml")

    out = {"written": sorted(written), "skipped": sorted(skipped), "status_flips": status_flips}
    with open(args.out_manifest, "w", encoding="utf-8") as fh:
        json.dump(out, fh, indent=2)
    print(json.dumps(out, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
