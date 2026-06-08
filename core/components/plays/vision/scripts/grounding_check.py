#!/usr/bin/env python3
"""
grounding_check.py — assert every seeded capability is grounded (C5/F3).

/vision must never invent a capability. Each one either matched a KB shelf
(recorded by search-kb) or was raised as a propose-kb-node proposal. This script
reads the seed manifest author-vision-seed wrote and asserts that every capability
carries one or the other — and, when a proposal path is named, that the proposal
file actually exists on disk.

Layer rule: reads files on disk only; no git/gh/network.

    python3 grounding_check.py --manifest <seed-manifest.yaml> [--proposals-dir <dir>]

Prints {ok, errors[], capabilities} JSON. Exit 0 when every capability is grounded,
1 otherwise, 2 on usage/parse error.
"""

import argparse
import json
import os
import sys

try:
    import yaml
except ImportError:
    sys.stderr.write("grounding_check.py: PyYAML is required (pip install pyyaml).\n")
    sys.exit(2)


def main(argv=None):
    ap = argparse.ArgumentParser(description="Check /vision seed grounding.")
    ap.add_argument("--manifest", required=True, help="seed-manifest.yaml path")
    ap.add_argument("--proposals-dir", default=None,
                    help="folder where propose-kb-node proposals live (to confirm existence)")
    args = ap.parse_args(argv)

    try:
        with open(args.manifest, encoding="utf-8") as fh:
            doc = yaml.safe_load(fh) or {}
    except OSError as exc:
        sys.stderr.write(f"grounding_check.py: cannot read manifest: {exc}\n")
        sys.exit(2)
    except yaml.YAMLError as exc:
        sys.stderr.write(f"grounding_check.py: manifest parse error: {exc}\n")
        sys.exit(2)

    seed = doc.get("seed", doc) if isinstance(doc, dict) else {}
    caps = seed.get("capabilities") or []
    errors = []
    report = []

    if not caps:
        errors.append("manifest lists no capabilities — /vision seeds at least one")

    for cap in caps:
        name = cap.get("name") or cap.get("id") or "<unnamed>"
        grounding = cap.get("grounding") or {}
        shelf = grounding.get("kb_shelf")
        proposal = grounding.get("proposal")
        status = "ungrounded"
        if shelf:
            status = f"shelf: {shelf}"
        elif proposal:
            # confirm the proposal file is real
            candidate = proposal
            if args.proposals_dir and not os.path.isabs(proposal):
                candidate = os.path.join(args.proposals_dir, os.path.basename(proposal))
            if os.path.isfile(candidate) or os.path.isfile(proposal):
                status = f"proposal: {proposal}"
            else:
                errors.append(f"capability '{name}': proposal named but file not found "
                              f"({proposal})")
                status = "proposal-missing"
        else:
            errors.append(f"capability '{name}': neither a KB shelf match nor a "
                          f"KB-node proposal — ungrounded (C5/F3)")
        report.append({"name": name, "grounding": status})

    result = {"ok": not errors, "errors": errors, "capabilities": report}
    print(json.dumps(result, indent=2))
    return 0 if not errors else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
