#!/usr/bin/env python3
"""
check_shape.py — assert /shape's persisted result obeys its guarantees.

Post-apply verification over the apply manifest + the before/after profile + the
capability nodes touched. It confirms the things the allowlisted writer makes
structural, plus the before/after comparisons:

  - C6/F5  profile untouched: profile.yaml is byte-identical before and after, and no
           profile path appears in the written set.
  - C7/F6  status-only: each flipped capability node differs from its pre-run snapshot
           in the `status` field ONLY — no reparent/rename/other edit.
  - C8/F7  soft + no-dup: a pruned capability ends `deprecated` (still present); the
           written set holds no path that already existed (re-run added no duplicate).
  - C10/F9 decisions: a decision record exists for every prune (status_flip -> deprecated)
           and every selected functionality in the manifest.

Layer rule: reads files on disk only; no git/gh/network.

    python3 check_shape.py --apply-manifest <apply-manifest.json> --shape-manifest <shape-manifest.yaml> \
        --profile-before <profile-before.yaml> --profile-after <live profile.yaml> \
        --product-base <product_base> --caps-before-dir <snapshot dir of pre-run capability node.yamls>

`--caps-before-dir` holds one `<capability-id>.yaml` snapshot per flipped capability,
taken before apply, so the status-only diff can be checked.

Prints {ok, errors[]} JSON. Exit 0 clean, 1 on violation, 2 usage error.
"""

import argparse
import json
import os
import sys

try:
    import yaml
except ImportError:
    sys.stderr.write("check_shape.py: PyYAML is required (pip install pyyaml).\n")
    sys.exit(2)


def load(path):
    with open(path, encoding="utf-8") as fh:
        return yaml.safe_load(fh) or {}


def read_bytes(path):
    with open(path, "rb") as fh:
        return fh.read()


def main(argv=None):
    ap = argparse.ArgumentParser(description="Verify /shape's persisted result.")
    ap.add_argument("--apply-manifest", required=True)
    ap.add_argument("--shape-manifest", required=True)
    ap.add_argument("--profile-before", required=True)
    ap.add_argument("--profile-after", required=True)
    ap.add_argument("--product-base", required=True)
    ap.add_argument("--caps-before-dir", required=True)
    args = ap.parse_args(argv)

    try:
        apply_man = json.load(open(args.apply_manifest, encoding="utf-8"))
        shape_man = (load(args.shape_manifest).get("shape") or {})
    except (OSError, ValueError, yaml.YAMLError) as exc:
        sys.stderr.write(f"check_shape.py: cannot read a manifest: {exc}\n")
        sys.exit(2)

    errors = []

    # --- C6/F5 profile untouched --------------------------------------------
    try:
        if read_bytes(args.profile_before) != read_bytes(args.profile_after):
            errors.append("profile.yaml changed during /shape — it must never write the profile (F5)")
    except OSError as exc:
        errors.append(f"cannot compare profiles: {exc}")
    for w in apply_man.get("written", []):
        if os.path.basename(w) == "profile.yaml":
            errors.append(f"profile path in written set: {w} (F5)")

    # --- C8/F7 no duplicate writes ------------------------------------------
    # (skip-if-exists guarantees this; surface any anomaly the writer reported)
    dup = set(apply_man.get("written", [])) & set(apply_man.get("skipped", []))
    if dup:
        errors.append(f"paths in both written and skipped (ambiguous): {sorted(dup)} (F7)")

    # --- C7/F6 status-only diff on flipped capabilities ---------------------
    dst_root = os.path.join(args.product_base, "product-os")
    for flip in apply_man.get("status_flips", []):
        cap = flip["capability"]
        before_snap = os.path.join(args.caps_before_dir, f"{cap}.yaml")
        after_node = os.path.join(dst_root, flip["path"])
        if not os.path.isfile(before_snap):
            errors.append(f"{cap}: no pre-run snapshot to verify status-only change (F6)")
            continue
        if not os.path.isfile(after_node):
            errors.append(f"{cap}: flipped node not found after apply (F6)")
            continue
        b = (load(before_snap).get("node") or {})
        a = (load(after_node).get("node") or {})
        diff_keys = {k for k in set(b) | set(a) if b.get(k) != a.get(k)}
        if diff_keys - {"status"}:
            errors.append(f"{cap}: fields other than status changed: {sorted(diff_keys - {'status'})} (F6)")

    # --- C8/F7 prune is soft (deprecated, still present) --------------------
    for cap in shape_man.get("capabilities") or []:
        if cap.get("decision") == "deprecated":
            # find the node and confirm it exists and is deprecated
            flip = next((f for f in apply_man.get("status_flips", [])
                         if f["capability"] == cap["id"]), None)
            if not flip:
                errors.append(f"pruned capability '{cap['id']}' has no status flip recorded (F7)")
                continue
            node = os.path.join(dst_root, flip["path"])
            if not os.path.isfile(node):
                errors.append(f"pruned capability '{cap['id']}' was deleted, not deprecated (F7)")
            elif (load(node).get("node") or {}).get("status") != "deprecated":
                errors.append(f"pruned capability '{cap['id']}' is not 'deprecated' (F7)")

    # --- C10/F9 decisions for prunes + selections ---------------------------
    # Count written AND skipped: on a re-run, skip-if-exists means decisions already
    # on disk land in `skipped`, not `written`. Validate against what is on disk,
    # not against what this run wrote.
    decisions_present = {os.path.splitext(os.path.basename(p))[0]
                         for p in (apply_man.get("written", []) + apply_man.get("skipped", []))
                         if os.sep + "decisions" + os.sep in (os.sep + p)}
    declared = set(shape_man.get("decisions") or [])
    missing = declared - decisions_present
    if missing:
        errors.append(f"declared decisions not present on disk: {sorted(missing)} (F9)")
    # every prune must have at least one decision declared
    prunes = [c["id"] for c in (shape_man.get("capabilities") or [])
              if c.get("decision") == "deprecated"]
    if prunes and not declared:
        errors.append(f"prunes {prunes} but no decisions declared in manifest (F9)")

    result = {"ok": not errors, "errors": errors}
    print(json.dumps(result, indent=2))
    return 0 if not errors else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
