#!/usr/bin/env python3
"""
check_lines_up.py — /run's cross-lens gate (C1 arch-present at pre-flight; C5/C8 lines-up at
the gate). The last-lens duty: a slice is "done" only when all six lens files exist and every
cross-reference resolves.

Two phases, one script (the play keeps the halt policy; this returns the facts):

  --phase preflight   Only assert the slice's ARCHITECTURE lens exists — /run deploys arch's
                      parts, so it cannot run without them (C1). Emits {arch_present}.
                      Exit 0 if present, 1 if missing.

  --phase gate        The full lines-up check before the stamp (C8): all six lens files
                      (quality, ux, agentic, architecture, measure, run) exist for the slice, every
                      architecture component has a run target, every run target binds to a
                      real component (C5 — no dangling target), AND the run lens carries a
                      non-empty content.tco block (C13, #435 — a slice is never stamped
                      realized without the ownership-cost picture; validate_run.py proves the
                      block is material, this gate proves it exists). Emits
                      {lenses_present{...}, all_five_present, uncovered_components[],
                      dangling_targets[], tco_present, lines_up}. Exit 0 if lines_up, 1
                      otherwise.

                      --run-lens <path> overrides where the RUN lens is read from (presence +
                      targets), leaving the other five read from the live lens dir. /run's
                      Step 4 passes the DRAFT run.yaml here (the run lens is not yet persisted);
                      Step 7 omits it to re-check against the persisted tree. The arch
                      components are always read from the LIVE architecture lens.

Layer rule: reads files on disk only; no git/gh/network.

    python3 check_lines_up.py --product-base <pb> --slice <slice-id | domain/slice-id> \
            --phase {preflight|gate} [--run-lens <draft run.yaml>]

Prints a JSON facts object. Exit 0 = ok for the phase, 1 = not, 2 = usage/resolution error.
"""

import argparse
import glob
import json
import os
import sys

try:
    import yaml
except ImportError:
    sys.stderr.write("check_lines_up.py: PyYAML is required (pip install pyyaml).\n")
    sys.exit(2)

LENS_TYPES = ("quality", "ux", "agentic", "architecture", "measure", "run")


def load(path):
    with open(path, encoding="utf-8") as fh:
        return yaml.safe_load(fh) or {}


def resolve_lens_dir(product_base, slice_arg):
    """Resolve the slice's lens dir from the slice argument (slice-id or domain/slice-id).
    Returns (lens_dir, slice_id, error)."""
    slice_id = slice_arg.split("/")[-1]
    domain = slice_arg.split("/")[0] if "/" in slice_arg else None
    pattern = os.path.join(product_base, "product-os",
                           domain if domain else "*", "slices", f"{slice_id}.yaml")
    matches = sorted(glob.glob(pattern))
    if not matches:
        return None, slice_id, f"no slice record matched {pattern}"
    if len(matches) > 1:
        return None, slice_id, f"slice id {slice_id!r} is ambiguous across domains: {matches}"
    slice_file = matches[0]
    lens_dir = os.path.join(os.path.dirname(slice_file), slice_id, "lens")
    return lens_dir, slice_id, None


def lenses_present(lens_dir, run_lens=None):
    out = {}
    for t in LENS_TYPES:
        path = run_lens if (t == "run" and run_lens) else os.path.join(lens_dir, f"{t}.yaml")
        out[t] = os.path.isfile(path)
    return out


def arch_components(lens_dir):
    path = os.path.join(lens_dir, "architecture.yaml")
    if not os.path.isfile(path):
        return set()
    doc = (load(path).get("lens") or {})
    content = doc.get("content") or {}
    names = set()
    for c in (content.get("components") or []):
        nm = (c or {}).get("name")
        if isinstance(nm, str) and nm.strip():
            names.add(nm.strip())
    return names


def run_targets(lens_dir, run_lens=None):
    """Returns (target component names, tco_present) from the run lens."""
    path = run_lens or os.path.join(lens_dir, "run.yaml")
    if not os.path.isfile(path):
        return set(), False
    doc = (load(path).get("lens") or {})
    content = doc.get("content") or {}
    comps = set()
    for t in (content.get("targets") or []):
        c = (t or {}).get("component")
        if isinstance(c, str) and c.strip():
            comps.add(c.strip())
    tco = content.get("tco")
    tco_present = isinstance(tco, dict) and len(tco) > 0
    return comps, tco_present


def main(argv=None):
    ap = argparse.ArgumentParser(description="/run cross-lens gate.")
    ap.add_argument("--product-base", required=True)
    ap.add_argument("--slice", required=True)
    ap.add_argument("--phase", required=True, choices=["preflight", "gate"])
    ap.add_argument("--run-lens", default=None,
                    help="override path for the RUN lens (e.g. the draft run.yaml at Step 4)")
    args = ap.parse_args(argv)

    lens_dir, slice_id, err = resolve_lens_dir(args.product_base, args.slice)
    if err:
        print(json.dumps({"ok": False, "error": err, "slice_id": slice_id}, indent=2))
        return 2

    present = lenses_present(lens_dir, args.run_lens)

    if args.phase == "preflight":
        out = {"ok": present["architecture"], "phase": "preflight",
               "slice_id": slice_id, "lens_dir": lens_dir,
               "arch_present": present["architecture"]}
        print(json.dumps(out, indent=2))
        return 0 if present["architecture"] else 1

    # --- gate ---------------------------------------------------------------
    all_five = all(present.values())
    uncovered, dangling, tco_present = [], [], False
    if present["architecture"] and present["run"]:
        comps = arch_components(lens_dir)
        targets, tco_present = run_targets(lens_dir, args.run_lens)
        uncovered = sorted(comps - targets)      # arch components with no run target (C5/C8)
        dangling = sorted(targets - comps)        # run targets binding no real component (C5)

    # C13 (#435): no TCO, no stamp — the ownership-cost picture is part of lining up.
    lines_up = all_five and not uncovered and not dangling and tco_present
    out = {"ok": lines_up, "phase": "gate", "slice_id": slice_id, "lens_dir": lens_dir,
           "lenses_present": present, "all_five_present": all_five,
           "missing_lenses": sorted([t for t, p in present.items() if not p]),
           "uncovered_components": uncovered, "dangling_targets": dangling,
           "tco_present": tco_present,
           "lines_up": lines_up}
    print(json.dumps(out, indent=2))
    return 0 if lines_up else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
