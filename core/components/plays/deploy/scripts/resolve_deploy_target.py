#!/usr/bin/env python3
"""
resolve_deploy_target.py — resolve the ONE cloud environment /deploy targets this call.

/deploy is lightweight and on-demand: it deploys a delivered increment to a CLOUD environment the
run lens already defined. This resolver names the target deterministically:

  - known tiers: dev=1, qa=2, stage=3, prod=4 (local=0 is /launch's, never a deploy target).
  - if --env <name> is given, resolve that named CLOUD environment — but if it is prod, exit with
    the distinct PROD_OUT_OF_SCOPE code (3) so the play halts (C2/F2); production stays with CD.
  - else pick the LOWEST cloud tier DEFINED in the slice's run.yaml (dev if present).
  - if no cloud environment is defined at all, halt with NO_CLOUD_ENV (4) (C8/F8) — run /run first.

Layer rule: reads files on disk only; no git/gh/network.

    python3 resolve_deploy_target.py --run-yaml <slice lens/run.yaml> [--env <name>]

Prints {ok, errors[], reason, target_env:{name,type,tier}, defined_cloud[]} JSON.
Exit 0 resolved, 3 production out of scope, 4 no cloud env / not deployable, 2 usage error.
"""

import argparse
import json
import os
import sys

try:
    import yaml
except ImportError:
    sys.stderr.write("resolve_deploy_target.py: PyYAML is required (pip install pyyaml).\n")
    sys.exit(2)

# local (0) is /launch's, not a deploy target; /deploy owns the cloud tiers.
CLOUD_TIERS = {"dev": 1, "qa": 2, "stage": 3, "prod": 4}
OUT_OF_SCOPE = {"prod"}  # production stays with CD from main (#434)

EXIT_OK = 0
EXIT_USAGE = 2
EXIT_PROD = 3
EXIT_NO_CLOUD = 4


def defined_cloud_envs(run_yaml_path):
    """(name, tier) for each CLOUD environment present in the slice's run.yaml."""
    if not run_yaml_path or not os.path.isfile(run_yaml_path):
        return []
    try:
        with open(run_yaml_path, encoding="utf-8") as fh:
            doc = yaml.safe_load(fh) or {}
    except (OSError, yaml.YAMLError):
        return []
    content = doc.get("content") or (doc.get("lens") or {}).get("content") or {}
    out = []
    for e in (content.get("environments") or []):
        if not isinstance(e, dict):
            continue
        name = e.get("name")
        # a cloud environment: type cloud, or a known cloud tier, or carries a cloud block
        is_cloud = e.get("type") == "cloud" or name in CLOUD_TIERS or isinstance(e.get("cloud"), dict)
        if name and is_cloud:
            out.append((name, CLOUD_TIERS.get(name, e.get("tier"))))
    return out


def main(argv=None):
    ap = argparse.ArgumentParser(description="Resolve the one cloud environment /deploy targets.")
    ap.add_argument("--run-yaml", required=True, help="path to the slice's lens/run.yaml")
    ap.add_argument("--env", help="explicit cloud environment name to deploy to")
    args = ap.parse_args(argv)

    errors = []
    defined = defined_cloud_envs(args.run_yaml)
    defined_names = [n for n, _ in defined]
    out = {"ok": False, "errors": errors, "reason": None,
           "defined_cloud": defined_names, "target_env": None}

    if args.env:
        name = args.env.strip().lower()
        if name in OUT_OF_SCOPE:
            out["reason"] = "PROD_OUT_OF_SCOPE"
            errors.append("production is out of scope for /deploy — it stays with CD from main")
            print(json.dumps(out, indent=2))
            return EXIT_PROD
        if name not in CLOUD_TIERS:
            out["reason"] = "UNKNOWN_ENV"
            errors.append(f"unknown cloud environment '{args.env}' — known: {', '.join(CLOUD_TIERS)}")
            print(json.dumps(out, indent=2))
            return EXIT_NO_CLOUD
        if name not in defined_names:
            out["reason"] = "ENV_NOT_DEFINED"
            errors.append(f"'{name}' is not defined in run.yaml — run /run to define it first")
            print(json.dumps(out, indent=2))
            return EXIT_NO_CLOUD
        out["target_env"] = {"name": name, "type": "cloud", "tier": CLOUD_TIERS[name]}
        out["ok"] = True
        print(json.dumps(out, indent=2))
        return EXIT_OK

    # no name → lowest DEFINED cloud tier, excluding anything out of scope
    candidates = [(n, CLOUD_TIERS[n]) for n in defined_names if n in CLOUD_TIERS and n not in OUT_OF_SCOPE]
    if not candidates:
        out["reason"] = "NO_CLOUD_ENV"
        errors.append("no in-scope cloud environment is defined in run.yaml — run /run to define one")
        print(json.dumps(out, indent=2))
        return EXIT_NO_CLOUD
    name, tier = min(candidates, key=lambda c: c[1])
    out["target_env"] = {"name": name, "type": "cloud", "tier": tier}
    out["ok"] = True
    print(json.dumps(out, indent=2))
    return EXIT_OK


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
