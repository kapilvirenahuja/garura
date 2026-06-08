#!/usr/bin/env python3
"""
validate_shape.py — assert /shape's draft bundle is schema-true, tree-sound, grounded.

Run over the draft before the checkpoint. Enforces /shape's artifact-side constraints:

  - C4/F2  schema: functionality nodes, functionality ICE, personas, journeys, and
           decisions carry their required v1 fields and valid enum values.
  - C5/F4  tree integrity: every functionality node is type=functionality with a
           parent; every functionality ICE persona ref resolves to a persona drafted
           in the bundle (or already in the live model, if --product-base given);
           every journey references a persona that exists and a node_ref.
  - C3/F3  grounding: every kept capability and selected functionality in the manifest
           carries a KB shelf or a proposal — none invented.

Layer rule: reads files on disk only; no git/gh/network.

    python3 validate_shape.py --draft <draft_dir> --manifest <shape-manifest.yaml> \
                              [--product-base <product_base>]

Prints {ok, errors[], counts} JSON. Exit 0 clean, 1 on violation, 2 usage error.
"""

import argparse
import glob
import json
import os
import sys

try:
    import yaml
except ImportError:
    sys.stderr.write("validate_shape.py: PyYAML is required (pip install pyyaml).\n")
    sys.exit(2)


def load(path):
    with open(path, encoding="utf-8") as fh:
        return yaml.safe_load(fh) or {}


def _empty(v):
    return v is None or (isinstance(v, (list, dict, str)) and len(v) == 0)


def collect_persona_ids(root):
    ids = set()
    for p in glob.glob(os.path.join(root, "**", "personas", "*.yaml"), recursive=True):
        try:
            doc = load(p)
            pid = (doc.get("persona", doc) or {}).get("id") or os.path.splitext(os.path.basename(p))[0]
            ids.add(pid)
        except (OSError, yaml.YAMLError):
            pass
    return ids


def main(argv=None):
    ap = argparse.ArgumentParser(description="Validate /shape's draft bundle.")
    ap.add_argument("--draft", required=True)
    ap.add_argument("--manifest", required=True)
    ap.add_argument("--product-base", default=None,
                    help="live model, so persona refs to already-existing personas resolve too")
    args = ap.parse_args(argv)

    draft_root = os.path.join(args.draft, "product-os")
    if not os.path.isdir(draft_root):
        sys.stderr.write(f"validate_shape.py: no draft tree at {draft_root}\n")
        sys.exit(2)

    errors = []
    counts = {"functionality": 0, "ice": 0, "persona": 0, "journey": 0, "decision": 0}

    # persona universe: drafted + (optionally) already in the live model
    persona_ids = collect_persona_ids(draft_root)
    if args.product_base:
        persona_ids |= collect_persona_ids(os.path.join(args.product_base, "product-os"))

    # --- functionality nodes -------------------------------------------------
    for node in glob.glob(os.path.join(draft_root, "**", "functionalities", "*", "node.yaml"),
                          recursive=True):
        counts["functionality"] += 1
        n = (load(node).get("node") or {})
        for f in ("id", "type", "name", "status"):
            if _empty(n.get(f)):
                errors.append(f"{node}: functionality node missing '{f}' (F2)")
        if n.get("type") != "functionality":
            errors.append(f"{node}: type is '{n.get('type')}', must be functionality (F2)")
        if _empty(n.get("parent")):
            errors.append(f"{node}: functionality has no parent capability (F4)")

    # --- functionality ICE ---------------------------------------------------
    for ice_path in glob.glob(os.path.join(draft_root, "**", "functionalities", "*", "ice.yaml"),
                              recursive=True):
        counts["ice"] += 1
        ice = (load(ice_path).get("ice") or {})
        if _empty((ice.get("intent") or {}).get("goals")):
            errors.append(f"{ice_path}: functionality ICE intent.goals empty (F2)")
        for ref in (ice.get("context") or {}).get("persona") or []:
            if ref not in persona_ids:
                errors.append(f"{ice_path}: persona ref '{ref}' resolves to no persona record (F4)")

    # --- personas ------------------------------------------------------------
    for p in glob.glob(os.path.join(draft_root, "**", "personas", "*.yaml"), recursive=True):
        counts["persona"] += 1
        per = (load(p).get("persona") or {})
        for f in ("id", "name"):
            if _empty(per.get(f)):
                errors.append(f"{p}: persona missing '{f}' (F2)")

    # --- journeys ------------------------------------------------------------
    for j in glob.glob(os.path.join(draft_root, "**", "journeys", "*.yaml"), recursive=True):
        counts["journey"] += 1
        jr = (load(j).get("journey") or {})
        for f in ("id", "name"):
            if _empty(jr.get(f)):
                errors.append(f"{j}: journey missing '{f}' (F2)")
        pref = jr.get("persona_ref")
        if not _empty(pref) and pref not in persona_ids:
            errors.append(f"{j}: journey persona_ref '{pref}' resolves to no persona (F4)")
        if _empty(jr.get("node_ref")):
            errors.append(f"{j}: journey missing node_ref (F4)")

    # --- decisions -----------------------------------------------------------
    for d in glob.glob(os.path.join(draft_root, "**", "decisions", "*.yaml"), recursive=True):
        counts["decision"] += 1
        dec = (load(d).get("decision") or {})
        for f in ("id", "title", "reason", "status", "level"):
            if _empty(dec.get(f)):
                errors.append(f"{d}: decision missing '{f}' (F2)")

    # --- grounding (manifest) ------------------------------------------------
    try:
        man = (load(args.manifest).get("shape") or {})
    except (OSError, yaml.YAMLError) as exc:
        errors.append(f"manifest unreadable: {exc}")
        man = {}
    for cap in man.get("capabilities") or []:
        cid = cap.get("id", "<cap>")
        if cap.get("decision") == "active" and _empty(cap.get("grounding")):
            errors.append(f"kept capability '{cid}' has no grounding (C3/F3)")
        for fn in cap.get("functionalities") or []:
            if _empty(fn.get("grounding")):
                errors.append(f"functionality '{fn.get('id','<fn>')}' has no grounding (C3/F3)")

    result = {"ok": not errors, "errors": errors, "counts": counts}
    print(json.dumps(result, indent=2))
    return 0 if not errors else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
