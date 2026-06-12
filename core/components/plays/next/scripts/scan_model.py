#!/usr/bin/env python3
"""
scan_model.py — read-only product-model state snapshot for /next (C1/C2).

Walks {product_base}/product-os/ and emits ONE JSON snapshot of everything the
candidate derivation needs: profile state, capability-ICE depth, every slice's
status/order/depends_on/functionality refs, lens presence per slice, every
epic's status/order/depends_on, and the deferred buckets. Also records a
content hash of the whole product-os tree so a later re-scan can PROVE the
play wrote nothing (F3).

A missing model is NOT an error — it is the /vision branch of the decision
tree: the snapshot says model_exists=false and exits 0.

Layer rule: reads files on disk only; no git/gh/network. Deterministic: same
tree, same snapshot (no timestamps, sorted everything).

    python3 scan_model.py --product-base <pb> --out <model-state.json>

Exit 0 always (scan errors are recorded in the snapshot's `scan_errors`),
2 on usage error.
"""

import argparse
import glob
import hashlib
import json
import os
import sys

try:
    import yaml
except ImportError:
    sys.stderr.write("scan_model.py: PyYAML is required (pip install pyyaml).\n")
    sys.exit(2)

LENS_TYPES = ["quality", "ux", "agentic", "architecture", "measure", "run"]


def load(path, errors):
    try:
        with open(path, encoding="utf-8") as fh:
            return yaml.safe_load(fh) or {}
    except (OSError, yaml.YAMLError) as exc:
        errors.append(f"unreadable: {path} ({exc})")
        return {}


def tree_hash(root):
    """sha256 over sorted relative paths + bytes of every file under root."""
    h = hashlib.sha256()
    for path in sorted(glob.glob(os.path.join(root, "**", "*"), recursive=True)):
        if not os.path.isfile(path):
            continue
        rel = os.path.relpath(path, root)
        h.update(rel.encode("utf-8"))
        try:
            with open(path, "rb") as fh:
                h.update(fh.read())
        except OSError:
            h.update(b"<unreadable>")
    return "sha256:" + h.hexdigest()


def ice_depth(ice):
    """goals-only (seed from /vision) vs rich (after /understand)."""
    ctx = ice.get("context") or {}
    exp = ice.get("expectations") or {}
    has_context = any(ctx.get(k) for k in ("persona", "systems", "scope"))
    has_outcomes = bool(exp.get("outcomes"))
    return "rich" if (has_context and has_outcomes) else "goals-only"


def scan_ices(domain_dir, errors):
    """Every yaml under the domain (excluding slices/) with a top-level `ice:`."""
    ices = []
    for path in sorted(glob.glob(os.path.join(domain_dir, "**", "*.yaml"),
                                 recursive=True)):
        rel = os.path.relpath(path, domain_dir)
        if rel.startswith("slices" + os.sep):
            continue
        doc = load(path, errors)
        if isinstance(doc, dict) and "ice" in doc:
            ice = doc.get("ice") or {}
            ices.append({"node_ref": ice.get("node_ref"),
                         "file": path, "depth": ice_depth(ice)})
    return ices


def scan_slice(slice_file, errors):
    sl = (load(slice_file, errors).get("slice") or {})
    slice_id = os.path.splitext(os.path.basename(slice_file))[0]
    slice_dir = os.path.join(os.path.dirname(slice_file), slice_id)
    lens_dir = os.path.join(slice_dir, "lens")
    lenses = {lt: os.path.isfile(os.path.join(lens_dir, lt + ".yaml"))
              for lt in LENS_TYPES}

    epics = []
    for f in sorted(glob.glob(os.path.join(slice_dir, "epics", "*.yaml"))):
        if os.path.basename(f) == "deferrals.yaml":
            continue
        e = (load(f, errors).get("epic") or {})
        epics.append({
            "id": e.get("id") or os.path.splitext(os.path.basename(f))[0],
            "file": f,
            "status": (e.get("status") or "").strip().lower(),
            "order": e.get("order"),
            "depends_on": sorted(e.get("depends_on") or []),
            "issue_ref": e.get("issue_ref"),
            "title": e.get("title"),
        })

    funcs = []
    for fn in (sl.get("functionalities") or []):
        fn = fn or {}
        funcs.append({"functionality_ref": fn.get("functionality_ref"),
                      "ice_ref": fn.get("ice_ref")})

    epics_dir = os.path.join(slice_dir, "epics")
    return {
        "id": sl.get("id") or slice_id,
        "file": slice_file,
        "epics_dir_exists": os.path.isdir(epics_dir),
        "deferrals_exists": os.path.isfile(os.path.join(epics_dir, "deferrals.yaml")),
        "name": sl.get("name"),
        "status": (sl.get("status") or "").strip().lower(),
        "order": sl.get("order"),
        "effort": sl.get("effort"),
        "depends_on": sorted(sl.get("depends_on") or []),
        "functionalities": funcs,
        "lenses": lenses,
        "lens_dir": lens_dir,
        "epics": epics,
    }


def main(argv=None):
    ap = argparse.ArgumentParser(description="Product-model state snapshot for /next.")
    ap.add_argument("--product-base", required=True)
    ap.add_argument("--out", required=True)
    args = ap.parse_args(argv)

    errors = []
    root = os.path.join(args.product_base, "product-os")
    state = {"product_base": args.product_base, "root": root,
             "model_exists": os.path.isdir(root), "scan_errors": errors,
             "profile": None, "domains": [], "model_hash": None}

    if state["model_exists"]:
        state["model_hash"] = tree_hash(root)

        profile_path = os.path.join(root, "profile.yaml")
        if os.path.isfile(profile_path):
            prof = (load(profile_path, errors).get("profile") or {})
            state["profile"] = {"file": profile_path,
                                "state": (prof.get("state") or "").strip().lower()}

        for entry in sorted(os.listdir(root)):
            domain_dir = os.path.join(root, entry)
            if not os.path.isdir(domain_dir) or entry.startswith("_"):
                continue
            slices, deferred = [], None
            slices_dir = os.path.join(domain_dir, "slices")
            for sf in sorted(glob.glob(os.path.join(slices_dir, "*.yaml"))):
                if os.path.basename(sf) == "_deferred.yaml":
                    d = (load(sf, errors).get("deferred") or {})
                    deferred = {"functionalities": sorted(d.get("functionalities") or []),
                                "reason": d.get("reason")}
                    continue
                slices.append(scan_slice(sf, errors))
            state["domains"].append({
                "id": entry, "dir": domain_dir,
                "ices": scan_ices(domain_dir, errors),
                "slices": slices,
                "deferred": deferred,
            })

    # a model with a root but no domains is still a cold start
    if state["model_exists"] and not state["domains"]:
        state["model_exists"] = False
        state["model_hash"] = state["model_hash"] or None

    os.makedirs(os.path.dirname(os.path.abspath(args.out)), exist_ok=True)
    with open(args.out, "w", encoding="utf-8") as fh:
        json.dump(state, fh, indent=2, sort_keys=True)
    print(json.dumps({"ok": True, "model_exists": state["model_exists"],
                      "domains": len(state["domains"]),
                      "model_hash": state["model_hash"],
                      "scan_errors": len(errors), "out": args.out}, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
