#!/usr/bin/env python3
"""
validate_seed.py — assert a /vision seed tree conforms to the v1 schemas + seed scope.

Mechanical enforcement of /vision's artifact-verifiable constraints. Runs over a
product-os tree root — the draft tree (before the checkpoint) or the live model
(after apply) — and checks every node, ICE, and profile against:

  - C1/F1  schema conformance: required fields present, correct types/levels.
  - C2/F2  depth: only domain + capability nodes; NO functionality node.
  - C3/F2  directional only: capability status == proposed; profile state == directional.
  - C4/F2  seed ICE is goals-only: intent.goals non-empty; constraints/failures,
           context (persona/systems/scope), expectations, nfr_needs, compliance_needs
           all empty.

Layer rule: this script only reads files already on disk — it never shells to git/gh
or the network. It walks the given root and parses YAML.

    python3 validate_seed.py --root <product-os dir>
    python3 validate_seed.py --root <product-os dir> --apply-manifest <apply.json>

Two modes:
  - DRAFT mode (no --apply-manifest): walk the whole tree and validate every node,
    ICE, and profile, asserting the seed holds at least one domain + one capability.
    Used pre-checkpoint over the draft tree, which holds only this run's new seed.
  - SCOPED mode (--apply-manifest): validate ONLY the files this run wrote — the
    `written` list from apply_seed.py — joined under --root. Used post-apply over the
    live model, which may already hold matured nodes (/understand set the profile,
    /shape added functionalities + active capabilities) that /vision did not touch and
    must NOT be judged by seed-only rules. No min-count assertion in this mode.

Prints one JSON object {ok, errors[], counts} to stdout. Exit 0 when ok, 1 on any
violation, 2 on a usage/parse-infrastructure error.
"""

import argparse
import json
import os
import sys

try:
    import yaml
except ImportError:
    sys.stderr.write(
        "validate_seed.py: PyYAML is required (pip install pyyaml). "
        "It parses the product-os node/ice/profile YAML.\n")
    sys.exit(2)

VALID_STATUS = {"proposed", "active", "deprecated"}
VALID_TYPE = {"domain", "capability", "functionality"}
NODE_REQUIRED = ["id", "type", "name", "summary", "status"]


def load(path):
    with open(path, encoding="utf-8") as fh:
        return yaml.safe_load(fh) or {}


def _empty(v):
    """True when a field is absent or an empty list/dict/string/None."""
    if v is None:
        return True
    if isinstance(v, (list, dict, str)):
        return len(v) == 0
    return False


def check_node(path, doc, errors):
    node = doc.get("node", doc) if isinstance(doc, dict) else {}
    for f in NODE_REQUIRED:
        if _empty(node.get(f)):
            errors.append(f"{path}: node missing required field '{f}'")
    ntype = node.get("type")
    if ntype not in VALID_TYPE:
        errors.append(f"{path}: node.type '{ntype}' not one of {sorted(VALID_TYPE)}")
    # C2/F2 — /vision never writes a functionality node
    if ntype == "functionality":
        errors.append(f"{path}: functionality node present — /vision writes only "
                      f"domain + capability (C2/F2)")
    status = node.get("status")
    if status not in VALID_STATUS:
        errors.append(f"{path}: node.status '{status}' not one of {sorted(VALID_STATUS)}")
    # C3/F2 — seed capabilities are directional (proposed)
    if ntype == "capability" and status != "proposed":
        errors.append(f"{path}: capability status '{status}' must be 'proposed' "
                      f"at seed (C3/F2)")
    if ntype == "capability" and _empty(node.get("parent")):
        errors.append(f"{path}: capability node missing 'parent' (domain id)")
    if ntype == "domain" and not _empty(node.get("parent")):
        errors.append(f"{path}: domain node must have null 'parent'")
    return ntype


def check_ice(path, doc, errors):
    ice = doc.get("ice", doc) if isinstance(doc, dict) else {}
    intent = ice.get("intent") or {}
    # C4/F2 — goals-only
    if _empty(intent.get("goals")):
        errors.append(f"{path}: seed ICE intent.goals is empty (C4)")
    must_be_empty = {
        "intent.constraints": intent.get("constraints"),
        "intent.failures": intent.get("failures"),
        "expectations": (ice.get("expectations") or {}).get("outcomes"),
        "nfr_needs": ice.get("nfr_needs"),
        "compliance_needs": ice.get("compliance_needs"),
    }
    context = ice.get("context") or {}
    for key in ("persona", "systems", "scope"):
        must_be_empty[f"context.{key}"] = context.get(key)
    for label, val in must_be_empty.items():
        if not _empty(val):
            errors.append(f"{path}: seed ICE '{label}' must be empty at /vision — "
                          f"that is /understand's job (C4/F2)")


def check_profile(path, doc, errors):
    prof = doc.get("profile", doc) if isinstance(doc, dict) else {}
    state = prof.get("state")
    # C3/F2 — directional only
    if state != "directional":
        errors.append(f"{path}: profile.state '{state}' must be 'directional' "
                      f"at /vision (C3/F2)")


def validate_one(full, errors, counts):
    """Validate a single artifact by basename; bump counts."""
    fn = os.path.basename(full)
    try:
        if fn == "node.yaml":
            ntype = check_node(full, load(full), errors)
            if ntype in counts:
                counts[ntype] += 1
        elif fn == "ice.yaml":
            check_ice(full, load(full), errors)
            counts["ice"] += 1
        elif fn == "profile.yaml":
            check_profile(full, load(full), errors)
            counts["profile"] += 1
    except yaml.YAMLError as exc:
        errors.append(f"{full}: YAML parse error: {exc}")


def written_paths(manifest_path):
    """The `written` rel-paths from an apply_seed.py manifest."""
    with open(manifest_path, encoding="utf-8") as fh:
        doc = json.load(fh)
    return doc.get("written", [])


def main(argv=None):
    ap = argparse.ArgumentParser(description="Validate a /vision seed tree.")
    ap.add_argument("--root", required=True, help="product-os tree root to validate")
    ap.add_argument("--apply-manifest", default=None,
                    help="apply_seed.py JSON manifest; when given, validate ONLY its "
                         "`written` files (scoped post-apply mode) — never the whole tree")
    args = ap.parse_args(argv)

    if not os.path.isdir(args.root):
        sys.stderr.write(f"validate_seed.py: root not found: {args.root}\n")
        sys.exit(2)

    errors = []
    counts = {"domain": 0, "capability": 0, "functionality": 0,
              "ice": 0, "profile": 0}

    if args.apply_manifest:
        # SCOPED mode — only the files this run wrote. The live model may hold
        # matured nodes /vision never touched; do not judge those by seed rules.
        try:
            rels = written_paths(args.apply_manifest)
        except (OSError, ValueError) as exc:
            sys.stderr.write(f"validate_seed.py: cannot read apply manifest: {exc}\n")
            sys.exit(2)
        for rel in rels:
            full = os.path.join(args.root, rel)
            if os.path.isfile(full):
                validate_one(full, errors, counts)
            else:
                errors.append(f"{full}: written file named in manifest is missing")
    else:
        # DRAFT mode — walk the whole tree (the draft holds only new seed).
        for dirpath, _dirs, files in os.walk(args.root):
            for fn in files:
                validate_one(os.path.join(dirpath, fn), errors, counts)
        if counts["domain"] < 1:
            errors.append(f"{args.root}: no domain node found — /vision must seed a domain")
        if counts["capability"] < 1:
            errors.append(f"{args.root}: no capability node found — /vision seeds "
                          f"candidate capabilities")

    result = {"ok": not errors, "errors": errors, "counts": counts}
    print(json.dumps(result, indent=2))
    return 0 if not errors else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
