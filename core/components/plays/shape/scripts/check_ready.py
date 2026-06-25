#!/usr/bin/env python3
"""
check_ready.py — /shape pre-flight readiness gate (C1/F1).

/shape selects and composes against a firmed, detailed model. This asserts the
preconditions before any work, reading the live spine (`_spine.yaml`):

  - the product profile is `set` (firmed by /understand) — not `directional`.
  - every capability in the target domain is `detail: detailed` (detailed by /understand)
    AND has at least one functionality (a `functionalities` entry whose `capability` == it).
    A directional seed with no functionalities is not ready — run /understand first.

Layer rule: reads files on disk only; no git/gh/network.

    python3 check_ready.py --spine <_spine.yaml> --domain <domain-id>

Prints {ok, errors[], capabilities[]} JSON. Exit 0 ready, 1 not ready, 2 usage error.
"""

import argparse
import json
import os
import sys

try:
    import yaml
except ImportError:
    sys.stderr.write("check_ready.py: PyYAML is required (pip install pyyaml).\n")
    sys.exit(2)


def load(path):
    with open(path, encoding="utf-8") as fh:
        return yaml.safe_load(fh) or {}


def main(argv=None):
    ap = argparse.ArgumentParser(description="/shape readiness gate.")
    ap.add_argument("--spine", required=True, help="live _spine.yaml")
    ap.add_argument("--domain", required=True, help="target domain id")
    args = ap.parse_args(argv)

    if not os.path.isfile(args.spine):
        sys.stderr.write(f"check_ready.py: no spine at {args.spine} — run /vision + /understand first\n")
        return 2
    spine = load(args.spine)

    errors = []

    # --- profile firmed? -----------------------------------------------------
    state = ((spine.get("profile") or {}).get("state") or "").strip().lower()
    if state != "set":
        errors.append(f"profile.state is '{state}', must be 'set' (firmed by /understand) — "
                      f"/shape selects against a firmed box (C1/F1)")

    # --- domain exists? ------------------------------------------------------
    domains = {d.get("id") for d in (spine.get("domains") or []) if isinstance(d, dict)}
    if args.domain not in domains:
        errors.append(f"domain '{args.domain}' not found in the spine")

    # --- capabilities detailed + have functionalities? -----------------------
    caps = [c for c in (spine.get("capabilities") or [])
            if isinstance(c, dict) and c.get("domain") == args.domain]
    funcs_by_cap = {}
    for f in (spine.get("functionalities") or []):
        if isinstance(f, dict):
            funcs_by_cap.setdefault(f.get("capability"), []).append(f.get("id"))

    cap_ids = []
    if not caps and args.domain in domains:
        errors.append(f"domain '{args.domain}' has no capabilities to shape")
    for c in caps:
        cid = c.get("id")
        cap_ids.append(cid)
        if c.get("detail") != "detailed":
            errors.append(f"{cid}: detail is '{c.get('detail')}', must be 'detailed' "
                          f"(run /understand first) (C1/F1)")
        if not funcs_by_cap.get(cid):
            errors.append(f"{cid}: has no functionalities — /understand creates them; "
                          f"/shape has nothing to select (C1/F1)")

    result = {"ok": not errors, "errors": errors, "capabilities": cap_ids}
    print(json.dumps(result, indent=2))
    return 0 if not errors else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
