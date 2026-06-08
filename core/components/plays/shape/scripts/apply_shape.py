#!/usr/bin/env python3
"""
apply_shape.py — persist /shape's selection bundle, on a fixed allowlist.

Run only AFTER the human approves the checkpoint. It writes exactly two kinds of change
and NOTHING else:

  1. New records — functionality node+ice, persona, journey, decision — copied from the
     draft skip-if-exists (stable ids mean a re-run touches none of them again, so no
     duplicates: C8/F7).
  2. Capability status flips — a read-modify-write that changes ONLY `node.status`
     (proposed->active / ->deprecated), preserving every other field (C7).

The script is never handed the profile path, so it physically cannot write the profile
(C6/F5 — structural). It copies, never deletes, so a prune can only deprecate
(C8/F7). Structure beyond status + functionality-create is impossible because no other
node path is in its inputs (C7/F6).

Layer rule: pure file writes from disk inputs; no git/gh/network.

    python3 apply_shape.py --draft <draft_dir> --product-base <product_base> \
                           --manifest <shape-manifest.yaml> --out-manifest <apply-manifest.json>

Exit 0 on success, 2 on usage error.
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


def main(argv=None):
    ap = argparse.ArgumentParser(description="Persist /shape on a fixed allowlist.")
    ap.add_argument("--draft", required=True)
    ap.add_argument("--product-base", required=True)
    ap.add_argument("--manifest", required=True)
    ap.add_argument("--out-manifest", required=True)
    args = ap.parse_args(argv)

    src_root = os.path.join(args.draft, "product-os")
    if not os.path.isdir(src_root):
        sys.stderr.write(f"apply_shape.py: no draft tree at {src_root}\n")
        sys.exit(2)
    dst_root = os.path.join(args.product_base, "product-os")

    written, skipped = [], []

    # 1 — new records, skip-if-exists (never overwrite, never the profile) ----
    for dirpath, _dirs, files in os.walk(src_root):
        rel_dir = os.path.relpath(dirpath, src_root)
        for fn in files:
            rel = os.path.normpath(os.path.join(rel_dir, fn))
            if os.path.basename(rel) == "profile.yaml":
                continue                       # defensive: profile is never /shape's
            dst = os.path.join(dst_root, rel)
            if os.path.exists(dst):
                skipped.append(rel)
                continue
            os.makedirs(os.path.dirname(dst), exist_ok=True)
            shutil.copy2(os.path.join(dirpath, fn), dst)
            written.append(rel)

    # 2 — capability status flips: change ONLY node.status -------------------
    try:
        with open(args.manifest, encoding="utf-8") as fh:
            man = (yaml.safe_load(fh) or {}).get("shape", {})
    except (OSError, yaml.YAMLError) as exc:
        sys.stderr.write(f"apply_shape.py: cannot read manifest: {exc}\n")
        sys.exit(2)

    status_flips = []
    for cap in man.get("capabilities") or []:
        flip = cap.get("status_flip")
        if not flip:
            continue
        # the manifest names the capability's folder explicitly (rel to product-os),
        # since the folder is a slug while the node id differs (cap-checkout vs checkout)
        rel = cap.get("path")
        if not rel:
            sys.stderr.write(f"apply_shape.py: capability {cap.get('id')} has no 'path' in manifest\n")
            continue
        cap_node = os.path.join(dst_root, rel, "node.yaml")
        if not os.path.isfile(cap_node):
            sys.stderr.write(f"apply_shape.py: capability node not found at {cap_node}\n")
            continue
        doc = yaml.safe_load(open(cap_node, encoding="utf-8")) or {}
        node = doc.get("node", doc)
        old = node.get("status")
        node["status"] = flip["to"]            # ONLY the status field changes
        with open(cap_node, "w", encoding="utf-8") as fh:
            yaml.safe_dump(doc, fh, sort_keys=False)
        status_flips.append({"capability": cap["id"], "from": old, "to": flip["to"],
                             "path": os.path.relpath(cap_node, dst_root)})

    out = {"written": sorted(written), "skipped": sorted(skipped), "status_flips": status_flips}
    with open(args.out_manifest, "w", encoding="utf-8") as fh:
        json.dump(out, fh, indent=2)
    print(json.dumps(out, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
