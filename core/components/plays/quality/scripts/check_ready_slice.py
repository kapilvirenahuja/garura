#!/usr/bin/env python3
"""
check_ready_slice.py — slice-realize readiness gate (C1/F1) + hub resolution.

A realize lens (quality / ux / agentic / arch / run) runs on ONE SLICE — the unit of
delivery. A slice has no ICE of its own; its HUB is the union of its functionalities'
ICE (each `functionalities[].ice_ref`, which may span several capabilities of the
domain) plus the product profile. This gate:

  - asserts the product profile is `set` (firmed by /understand);
  - resolves the slice record and EVERY functionality `ice_ref`, asserting each file
    exists and its ICE is RICH.

LOUD-FAIL rule: an `ice_ref` that does not resolve to a file is a BROKEN HUB, not an
empty one — it is an error, never a silent pass. (Same lesson as the ux coverage guard.)

It also emits the resolved slice context (the lens dir + the functionality ICE paths) so
downstream steps read the hub without re-deriving it.

Layer rule: reads files on disk only; no git/gh/network.

    python3 check_ready_slice.py --product-base <pb> --slice <slice-id | domain/slice-id>

Prints {ok, errors[], slice_id, domain, slice_file, lens_dir, functionality_ices[]} JSON.
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


def ice_is_rich(ice_path, errors, label):
    try:
        ice = (load(ice_path).get("ice") or {})
    except (OSError, yaml.YAMLError) as exc:
        errors.append(f"{label}: ICE unreadable ({exc})")
        return
    intent = ice.get("intent") or {}
    ctx = ice.get("context") or {}
    checks = {
        "intent.constraints": intent.get("constraints"),
        "intent.failures": intent.get("failures"),
        "context.persona": ctx.get("persona"),
        "context.systems": ctx.get("systems"),
        "context.scope": ctx.get("scope"),
        "expectations.outcomes": (ice.get("expectations") or {}).get("outcomes"),
        "nfr_needs": ice.get("nfr_needs"),
    }
    for lbl, val in checks.items():
        if _empty(val):
            errors.append(f"{label}: ICE not rich — {lbl} is empty (run /understand first)")


def main(argv=None):
    ap = argparse.ArgumentParser(description="Slice-realize readiness gate + hub resolution.")
    ap.add_argument("--product-base", required=True)
    ap.add_argument("--slice", required=True, help="slice id, or domain/slice-id")
    args = ap.parse_args(argv)

    errors = []
    root = os.path.join(args.product_base, "product-os")

    # --- profile firmed? -----------------------------------------------------
    profile_path = os.path.join(root, "profile.yaml")
    if not os.path.isfile(profile_path):
        errors.append(f"no profile at {profile_path} — run /vision + /understand first (C1/F1)")
    else:
        state = ((load(profile_path).get("profile") or {}).get("state") or "").strip().lower()
        if state != "set":
            errors.append(f"profile.state is '{state}', must be 'set' (firmed by /understand) (C1/F1)")

    # --- resolve the slice (accept 'slice-id' or 'domain/slice-id') ----------
    slice_id = args.slice.split("/")[-1]
    matches = glob.glob(os.path.join(root, "*", "slices", slice_id + ".yaml"))
    out = {"ok": False, "errors": errors, "slice_id": slice_id}

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
        func_ices = []
        for f in funcs:
            ref = (f or {}).get("functionality_ref")
            ice_ref = (f or {}).get("ice_ref")
            if _empty(ice_ref):
                errors.append(f"functionality '{ref}' has no ice_ref in the slice (C1/F1)")
                continue
            ice_path = os.path.join(args.product_base, ice_ref)
            resolved = os.path.isfile(ice_path)
            if not resolved:
                errors.append(f"functionality '{ref}' ice_ref does not resolve: {ice_ref} "
                              f"— broken hub, cannot realize (C1/F1)")
            else:
                ice_is_rich(ice_path, errors, f"functionality '{ref}'")
            func_ices.append({"ref": ref, "ice_ref": ice_ref, "resolved": resolved})

        rel_slice = os.path.relpath(slice_file, args.product_base)
        lens_dir = os.path.join(os.path.dirname(rel_slice), slice_id, "lens")
        out.update({"domain": domain, "slice_file": rel_slice, "lens_dir": lens_dir,
                    "functionality_ices": func_ices})

    out["ok"] = not errors
    out["errors"] = errors
    print(json.dumps(out, indent=2))
    return 0 if not errors else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
