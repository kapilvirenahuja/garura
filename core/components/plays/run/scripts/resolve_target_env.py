#!/usr/bin/env python3
"""
resolve_target_env.py — resolve the ONE environment /run defines this call.

/run builds environments incrementally — one per call, in tier order. This resolver names
the target environment for the current call, deterministically:

  - known tiers: local=0, dev=1, qa=2, stage=3, prod=4; type is `local` at tier 0, else `cloud`.
  - if --env <name> is given, resolve that named environment (add it, or edit it if present).
  - else pick the LOWEST tier whose name is not yet present in the slice's existing run.yaml
    (a first call, with no run.yaml, resolves to `local`).
  - if every known environment is already present and no --env is given, halt (1) and ask for
    an explicit --env to edit — never guess which one to re-derive.

Layer rule: reads files on disk only; no git/gh/network.

    python3 resolve_target_env.py --run-yaml <slice lens/run.yaml | missing path> [--env <name>]

Prints {ok, errors[], target_env:{name,type,tier}, existing_run_yaml, defined[]} JSON.
Exit 0 resolved, 1 cannot resolve, 2 usage error.
"""

import argparse
import json
import os
import sys

try:
    import yaml
except ImportError:
    sys.stderr.write("resolve_target_env.py: PyYAML is required (pip install pyyaml).\n")
    sys.exit(2)

TIERS = {"local": 0, "dev": 1, "qa": 2, "stage": 3, "prod": 4}


def env_type(name):
    return "local" if TIERS[name] == 0 else "cloud"


def defined_envs(run_yaml_path):
    """Names of environments already present in the slice's run.yaml (empty if none/missing)."""
    if not run_yaml_path or not os.path.isfile(run_yaml_path):
        return []
    try:
        with open(run_yaml_path, encoding="utf-8") as fh:
            doc = yaml.safe_load(fh) or {}
    except (OSError, yaml.YAMLError):
        return []
    content = doc.get("content") or (doc.get("lens") or {}).get("content") or {}
    return [e.get("name") for e in (content.get("environments") or [])
            if isinstance(e, dict) and e.get("name")]


def main(argv=None):
    ap = argparse.ArgumentParser(description="Resolve the one environment /run defines this call.")
    ap.add_argument("--run-yaml", required=True, help="path to the slice's lens/run.yaml (may not exist)")
    ap.add_argument("--env", help="explicit environment name to define or edit")
    args = ap.parse_args(argv)

    errors = []
    present = defined_envs(args.run_yaml)
    existing = args.run_yaml if os.path.isfile(args.run_yaml) else None
    out = {"ok": False, "errors": errors, "existing_run_yaml": existing, "defined": present}

    if args.env:
        name = args.env.strip().lower()
        if name not in TIERS:
            errors.append(f"unknown environment '{args.env}' — known: {', '.join(TIERS)}")
        else:
            out["target_env"] = {"name": name, "type": env_type(name), "tier": TIERS[name]}
    else:
        remaining = [n for n in sorted(TIERS, key=TIERS.get) if n not in present]
        if not remaining:
            errors.append("every known environment is already defined — pass --env <name> to edit one")
        else:
            name = remaining[0]
            out["target_env"] = {"name": name, "type": env_type(name), "tier": TIERS[name]}

    out["ok"] = not errors
    print(json.dumps(out, indent=2))
    return 0 if not errors else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
