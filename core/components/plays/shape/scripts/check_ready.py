#!/usr/bin/env python3
"""
check_ready.py — /shape pre-flight readiness gate (C1/F1).

/shape selects against a firmed model. This asserts the preconditions before any work:

  - the product profile is `set` (firmed by /understand) — not `directional`.
  - the domain exists and every one of its capabilities has RICH ICE: non-empty
    intent.constraints + intent.failures, context.persona + systems + scope,
    expectations.outcomes, and nfr_needs. (A goals-only seed is not rich.)

Layer rule: reads files on disk only; no git/gh/network.

    python3 check_ready.py --product-base <product_base> --domain <domain-slug>

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


def _empty(v):
    if v is None:
        return True
    if isinstance(v, (list, dict, str)):
        return len(v) == 0
    return False


def ice_is_rich(ice_path, errors, cap):
    try:
        ice = (load(ice_path).get("ice") or {})
    except (OSError, yaml.YAMLError) as exc:
        errors.append(f"{cap}: ICE unreadable ({exc})")
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
    for label, val in checks.items():
        if _empty(val):
            errors.append(f"{cap}: ICE not rich — {label} is empty (run /understand first)")


def main(argv=None):
    ap = argparse.ArgumentParser(description="/shape readiness gate.")
    ap.add_argument("--product-base", required=True)
    ap.add_argument("--domain", required=True)
    args = ap.parse_args(argv)

    errors = []
    root = os.path.join(args.product_base, "product-os")
    profile_path = os.path.join(root, "profile.yaml")

    # --- profile firmed? -----------------------------------------------------
    if not os.path.isfile(profile_path):
        errors.append(f"no profile at {profile_path} — run /vision + /understand first")
    else:
        state = ((load(profile_path).get("profile") or {}).get("state") or "").strip().lower()
        if state != "set":
            errors.append(f"profile.state is '{state}', must be 'set' (firmed by /understand) — "
                          f"/shape selects against a firmed box (C1/F1)")

    # --- domain + capabilities rich? ----------------------------------------
    domain_dir = os.path.join(root, args.domain)
    caps = []
    if not os.path.isdir(domain_dir):
        errors.append(f"domain '{args.domain}' not found at {domain_dir}")
    else:
        for entry in sorted(os.listdir(domain_dir)):
            cap_dir = os.path.join(domain_dir, entry)
            node = os.path.join(cap_dir, "node.yaml")
            if not (os.path.isdir(cap_dir) and os.path.isfile(node)):
                continue
            try:
                ntype = ((load(node).get("node") or {}).get("type"))
            except (OSError, yaml.YAMLError):
                ntype = None
            if ntype != "capability":
                continue
            caps.append(entry)
            ice = os.path.join(cap_dir, "ice.yaml")
            if not os.path.isfile(ice):
                errors.append(f"{entry}: no ice.yaml — run /understand first")
            else:
                ice_is_rich(ice, errors, entry)
        if not caps:
            errors.append(f"domain '{args.domain}' has no capabilities to shape")

    result = {"ok": not errors, "errors": errors, "capabilities": caps}
    print(json.dumps(result, indent=2))
    return 0 if not errors else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
