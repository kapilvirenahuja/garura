#!/usr/bin/env python3
"""
check_ready_slice.py — slice-realize readiness gate + hub resolution (SPINE model).

A realize lens (ux / agentic / marketing / architecture / quality / run / measure) runs on
ONE SLICE — the unit of delivery. A slice has no ICE of its own; its HUB is the union of
its functionalities' grounding (each `functionality_ref` → the spine's `functionalities`
entry → its `functionality.md` doc, which may span several capabilities) plus the product
profile (now structured in the spine). This gate:

  - asserts the product profile is `set` (firmed by /understand) — read from the SPINE;
  - resolves the slice record and EVERY `functionality_ref` via the spine to a
    `functionality.md` grounding doc, asserting each doc exists on disk.

LOUD-FAIL rule: a `functionality_ref` that does not resolve to a real spine functionality
with an on-disk doc is a BROKEN HUB, not an empty one — an error, never a silent pass.

It emits the resolved slice context (the lens dir + the functionality grounding docs) so
downstream steps read the hub without re-deriving it. This script is SHARED — every lens
play uses the same hub resolution.

Layer rule: reads files on disk only; no git/gh/network.

    python3 check_ready_slice.py --product-base <pb> --slice <slice-id | domain/slice-id>

Prints {ok, errors[], slice_id, domain, slice_file, lens_dir, functionality_groundings[]} JSON.
Exit 0 ready, 1 not ready, 2 usage error.
"""

import argparse
import glob
import json
import os
import sys

try:
    import yaml
except ImportError:
    sys.stderr.write("check_ready_slice.py: PyYAML is required (pip install pyyaml).\n")
    sys.exit(2)


def load(path):
    with open(path, encoding="utf-8") as fh:
        return yaml.safe_load(fh) or {}


def _empty(v):
    return v is None or (isinstance(v, (list, dict, str)) and len(v) == 0)


def main(argv=None):
    ap = argparse.ArgumentParser(description="Slice-realize readiness gate + hub resolution.")
    ap.add_argument("--product-base", required=True)
    ap.add_argument("--slice", required=True, help="slice id, or domain/slice-id")
    args = ap.parse_args(argv)

    errors = []
    root = os.path.join(args.product_base, "product-os")
    slice_id = args.slice.split("/")[-1]
    out = {"ok": False, "errors": errors, "slice_id": slice_id}

    # --- the spine: slice REALIZED? + functionality doc index ------------------
    # /grill's precondition (C1/F2): the slice is stamped `realized` (by /measure, once all
    # seven lens docs lined up). Stronger than the lens plays' profile==set gate.
    LENSES = ["quality", "ux", "agentic", "marketing", "architecture", "run", "measure"]
    spine_path = os.path.join(root, "_spine.yaml")
    func_doc = {}
    slice_status = {}
    if not os.path.isfile(spine_path):
        errors.append(f"no spine at {spine_path} — run /vision + /understand first (C1/F2)")
    else:
        spine = load(spine_path)
        func_doc = {f.get("id"): f.get("doc") for f in (spine.get("functionalities") or [])
                    if isinstance(f, dict)}
        slice_status = {s.get("id"): (s.get("status") or "").strip().lower()
                        for s in (spine.get("slices") or []) if isinstance(s, dict)}

    # --- resolve the slice (accept 'slice-id' or 'domain/slice-id') -----------
    matches = glob.glob(os.path.join(root, "*", "slices", slice_id + ".yaml"))
    if not matches:
        errors.append(f"slice '{slice_id}' not found under any domain's slices/ "
                      f"— shape it with /shape first (C1/F1)")
    elif len(matches) > 1:
        errors.append(f"slice id '{slice_id}' is ambiguous across domains: "
                      f"{[os.path.relpath(m, args.product_base) for m in matches]}")
    else:
        slice_file = matches[0]
        domain = os.path.basename(os.path.dirname(os.path.dirname(slice_file)))
        sl = (load(slice_file).get("slice") or {})
        funcs = sl.get("functionalities") or []
        if _empty(funcs):
            errors.append(f"slice '{slice_id}' bundles no functionalities — nothing to realize (C1/F1)")
        groundings = []
        for f in funcs:
            ref = (f or {}).get("functionality_ref")
            doc = func_doc.get(ref)
            if _empty(doc):
                errors.append(f"functionality '{ref}' is not in the spine, or has no grounding "
                              f"doc — broken hub, cannot realize (C1/F1)")
                groundings.append({"functionality_ref": ref, "doc": None, "resolved": False})
                continue
            doc_path = os.path.join(root, doc)
            resolved = os.path.isfile(doc_path)
            if not resolved:
                errors.append(f"functionality '{ref}' grounding doc does not resolve: {doc} "
                              f"— broken hub, cannot realize (C1/F1)")
            groundings.append({"functionality_ref": ref, "doc": doc, "resolved": resolved})

        rel_slice = os.path.relpath(slice_file, args.product_base)
        lens_dir = os.path.join(os.path.dirname(rel_slice), slice_id, "lens")

        # --- C1/F2: the slice must be REALIZED ---
        st = slice_status.get(slice_id, "")
        if st != "realized":
            errors.append(f"slice '{slice_id}' status is '{st or 'unset'}', must be 'realized' "
                          f"(run the realize pipes first; /measure stamps it) (C1/F2)")
        # --- C1/F2: all seven lens docs present ---
        abs_lens = os.path.join(args.product_base, lens_dir)
        missing = [t for t in LENSES if not os.path.isfile(os.path.join(abs_lens, t + ".md"))]
        if missing:
            errors.append(f"slice '{slice_id}' is missing lens docs: "
                          f"{', '.join(t + '.md' for t in missing)} — not realized (C1/F2)")

        out.update({"domain": domain, "slice_file": rel_slice, "lens_dir": lens_dir,
                    "realized": st == "realized",
                    "lens_docs": [os.path.join(lens_dir, t + ".md") for t in LENSES],
                    "functionality_groundings": groundings})

    out["ok"] = not errors
    out["errors"] = errors
    print(json.dumps(out, indent=2))
    return 0 if not errors else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
