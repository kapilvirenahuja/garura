#!/usr/bin/env python3
"""
check_ready.py — /quality pre-flight readiness gate (C1/F1).

/quality realizes a SHAPED capability. This asserts the preconditions before any work:

  - the product profile is `set` (firmed by /understand) — not `directional`.
  - the target capability exists, is type=capability with status `active`, and its
    ICE is RICH: non-empty intent.constraints + intent.failures, context.persona +
    systems + scope, expectations.outcomes, and nfr_needs. (A goals-only seed is not
    rich.)

Layer rule: reads files on disk only; no git/gh/network.

    python3 check_ready.py --product-base <product_base> --capability <rel-path>

`--capability` is the capability folder relative to product-os, e.g.
`order-management/checkout`.

Prints {ok, errors[], capability} JSON. Exit 0 ready, 1 not ready, 2 usage error.
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
    return v is None or (isinstance(v, (list, dict, str)) and len(v) == 0)


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
    ap = argparse.ArgumentParser(description="/quality readiness gate.")
    ap.add_argument("--product-base", required=True)
    ap.add_argument("--capability", required=True)
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
            errors.append(f"profile.state is '{state}', must be 'set' (firmed by /understand) "
                          f"— /quality realizes a firmed model (C1/F1)")

    # --- capability active + rich ICE? --------------------------------------
    cap_dir = os.path.join(root, args.capability)
    node = os.path.join(cap_dir, "node.yaml")
    if not os.path.isfile(node):
        errors.append(f"capability not found at {node}")
    else:
        n = (load(node).get("node") or {})
        if n.get("type") != "capability":
            errors.append(f"{args.capability}: node type is '{n.get('type')}', must be capability")
        if (n.get("status") or "").strip().lower() != "active":
            errors.append(f"{args.capability}: status is '{n.get('status')}', must be 'active' "
                          f"(shape it with /shape first)")
        ice = os.path.join(cap_dir, "ice.yaml")
        if not os.path.isfile(ice):
            errors.append(f"{args.capability}: no ice.yaml — run /understand first")
        else:
            ice_is_rich(ice, errors, args.capability)

    result = {"ok": not errors, "errors": errors, "capability": args.capability}
    print(json.dumps(result, indent=2))
    return 0 if not errors else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
