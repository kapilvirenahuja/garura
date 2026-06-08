#!/usr/bin/env python3
"""
check_apply.py — assert /understand's persisted result obeys its guarantees.

Post-apply verification over the manifest + the before/after profiles + the written
decisions. It confirms what the allowlisted writer already makes structural, and
checks the things that need the before/after pair:

  - F3/F9/C2/C9  allowlist: every written path is the target ICE, the profile, or a
                 file under the decisions dir — no node.yaml, no other capability's ICE.
  - F6           monotonic + state: profile.state == set; no dimension's level is
                 lower after than before.
  - F8           decisions: one decision per box-move, each carrying its dimension,
                 from->to, level product, status accepted.

Layer rule: reads files on disk only; no git/gh/network.

    python3 check_apply.py --manifest <apply-manifest.json> \
        --profile-before <profile before.yaml> --profile-after <live profile.yaml> \
        --target-ice <live target ice.yaml> --decisions-dir <live decisions dir>

Prints {ok, errors[]} JSON. Exit 0 clean, 1 on any violation, 2 on usage error.
"""

import argparse
import json
import os
import sys

try:
    import yaml
except ImportError:
    sys.stderr.write("check_apply.py: PyYAML is required (pip install pyyaml).\n")
    sys.exit(2)

SCALE = ["none", "low", "medium", "high", "xhigh"]


def rank(level):
    try:
        return SCALE.index((level or "none").strip().lower())
    except ValueError:
        return 0


def load(path):
    with open(path, encoding="utf-8") as fh:
        return yaml.safe_load(fh) or {}


def main(argv=None):
    ap = argparse.ArgumentParser(description="Verify /understand's persisted result.")
    ap.add_argument("--manifest", required=True)
    ap.add_argument("--profile-before", required=True)
    ap.add_argument("--profile-after", required=True)
    ap.add_argument("--target-ice", required=True)
    ap.add_argument("--decisions-dir", required=True)
    args = ap.parse_args(argv)

    try:
        with open(args.manifest, encoding="utf-8") as fh:
            manifest = json.load(fh)
    except (OSError, ValueError) as exc:
        sys.stderr.write(f"check_apply.py: cannot read manifest: {exc}\n")
        sys.exit(2)

    errors = []
    written = manifest.get("written", [])
    moves = manifest.get("box_moves", [])

    # --- allowlist (F3/F9/C2/C9) --------------------------------------------
    target_ice = os.path.normpath(args.target_ice)
    dec_dir = os.path.normpath(args.decisions_dir)
    profile_after = os.path.normpath(args.profile_after)
    for w in written:
        nw = os.path.normpath(w)
        ok = (nw == target_ice or nw == profile_after
              or nw.startswith(dec_dir + os.sep))
        if not ok:
            errors.append(f"written path outside allowlist: {w} (F3/F9)")
        if os.path.basename(nw) == "node.yaml":
            errors.append(f"a node.yaml was written — /understand changes no structure (C2/F3): {w}")

    # --- monotonic + state (F6) ---------------------------------------------
    try:
        before = (load(args.profile_before).get("profile") or {})
        after = (load(args.profile_after).get("profile") or {})
    except (OSError, yaml.YAMLError) as exc:
        errors.append(f"cannot read profiles: {exc}")
        before, after = {}, {}

    if (after.get("state") or "").strip().lower() != "set":
        errors.append(f"profile.state is '{after.get('state')}', must be 'set' (F6)")
    nb, na = before.get("nfr") or {}, after.get("nfr") or {}
    for dim, spec in nb.items():
        before_level = (spec or {}).get("level")
        after_level = (na.get(dim) or {}).get("level")
        if rank(after_level) < rank(before_level):
            errors.append(f"dimension '{dim}' lowered {before_level} -> {after_level} (F6)")

    # --- decisions one-per-move (F8) ----------------------------------------
    dec_docs = []
    if os.path.isdir(dec_dir):
        for fn in os.listdir(dec_dir):
            if fn.endswith((".yaml", ".yml", ".json")):
                p = os.path.join(dec_dir, fn)
                try:
                    d = load(p) if fn.endswith(("yaml", "yml")) else json.load(open(p))
                    dec_docs.append((fn, d.get("decision", d)))
                except Exception as exc:        # noqa: BLE001 - report, don't crash
                    errors.append(f"decision {fn} unreadable: {exc}")

    for mv in moves:
        dim, frm, to = mv["dimension"], str(mv["from"]), str(mv["to"])
        match = None
        for _fn, dec in dec_docs:
            title = (dec.get("title") or "")
            if dim in title and frm in title and to in title:
                match = dec
                break
        if not match:
            errors.append(f"box-move {dim} {frm}->{to} has no decision record (F8)")
            continue
        if match.get("level") != "product":
            errors.append(f"decision for {dim} is level '{match.get('level')}', must be product (F8)")
        if match.get("status") != "accepted":
            errors.append(f"decision for {dim} status '{match.get('status')}', must be accepted (F7/F8)")

    result = {"ok": not errors, "errors": errors,
              "moves": len(moves), "decisions": len(dec_docs)}
    print(json.dumps(result, indent=2))
    return 0 if not errors else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
