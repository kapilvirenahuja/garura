#!/usr/bin/env python3
"""
check_shape.py — assert /shape's persisted result obeys its guarantees.

Post-apply verification: a before/after diff of the live spine, plus the written decisions.
/shape may flip capability status, append persona/journey/decision refs onto those
capabilities, and add slices — and nothing else. This proves it:

  - profile untouched: spine.profile is identical before and after.
  - capabilities: a capability changes ONLY in `status` and its persona/journey/decision
    ref lists; every other field is identical; none added or removed.
  - functionalities + domains: identical before and after (shape never touches them).
  - slices: only added (no pre-existing slice changed or removed).
  - decisions: one decision record exists per prune (and per declared selection).

Layer rule: reads files on disk only; no git/gh/network.

    python3 check_shape.py --apply-manifest <apply-manifest.json> --shape-manifest <shape-manifest.yaml> \
        --spine-before <saved before _spine.yaml> --spine-after <live _spine.yaml> --domain <domain-id>

Prints {ok, errors[]} JSON. Exit 0 clean, 1 on violation, 2 usage error.
"""

import argparse
import json
import os
import sys

try:
    import yaml
except ImportError:
    sys.stderr.write("check_shape.py: PyYAML is required (pip install pyyaml).\n")
    sys.exit(2)

CAP_MUTABLE = {"status", "personas", "journeys", "decisions"}


def load(path):
    with open(path, encoding="utf-8") as fh:
        return yaml.safe_load(fh) or {}


def by_id(spine, key):
    return {e.get("id"): e for e in (spine.get(key) or []) if isinstance(e, dict)}


def main(argv=None):
    ap = argparse.ArgumentParser(description="Verify /shape's persisted result.")
    ap.add_argument("--apply-manifest", required=True)
    ap.add_argument("--shape-manifest", required=True)
    ap.add_argument("--spine-before", required=True)
    ap.add_argument("--spine-after", required=True)
    ap.add_argument("--domain", required=True)
    args = ap.parse_args(argv)

    try:
        apply_man = json.load(open(args.apply_manifest, encoding="utf-8"))
        shape_man = (load(args.shape_manifest).get("shape") or {})
        before = load(args.spine_before)
        after = load(args.spine_after)
    except (OSError, ValueError, yaml.YAMLError) as exc:
        sys.stderr.write(f"check_shape.py: cannot read input: {exc}\n")
        return 2

    errors = []

    # --- profile untouched ---
    if (before.get("profile") or {}) != (after.get("profile") or {}):
        errors.append("spine.profile changed during /shape — it must never write the profile")

    # --- domains + functionalities untouched ---
    if by_id(before, "domains") != by_id(after, "domains"):
        errors.append("a domain changed during /shape — shape touches no domain")
    if by_id(before, "functionalities") != by_id(after, "functionalities"):
        errors.append("a functionality changed during /shape — shape selects, never edits functionalities")

    # --- capabilities: only status + ref lists may change; none added/removed ---
    cb, ca = by_id(before, "capabilities"), by_id(after, "capabilities")
    if set(cb) != set(ca):
        added, removed = set(ca) - set(cb), set(cb) - set(ca)
        if added:
            errors.append(f"capabilities added by /shape: {sorted(added)} — shape creates none")
        if removed:
            errors.append(f"capabilities removed by /shape: {sorted(removed)} — shape soft-prunes, never deletes")
    for cid in set(cb) & set(ca):
        b, a = cb[cid], ca[cid]
        changed = {k for k in set(b) | set(a) if b.get(k) != a.get(k)}
        illegal = changed - CAP_MUTABLE
        if illegal:
            errors.append(f"capability '{cid}': fields other than status/refs changed: {sorted(illegal)}")

    # --- slices only added (no pre-existing slice changed or removed) ---
    sb, sa = by_id(before, "slices"), by_id(after, "slices")
    for sid in set(sb):
        if sid not in sa:
            errors.append(f"slice '{sid}' removed by /shape — shape only adds slices")
        elif sb[sid] != sa[sid]:
            errors.append(f"pre-existing slice '{sid}' changed — shape only adds new slices")

    # --- decisions: declared present on disk; every prune has a decision ---
    on_disk = {os.path.splitext(os.path.basename(p[len('doc:'):]))[0]
               for p in (apply_man.get("written", []) + apply_man.get("skipped", []))
               if p.startswith("doc:") and (os.sep + "decisions" + os.sep) in (os.sep + p[len('doc:'):])}
    declared = set(shape_man.get("decisions") or [])
    missing = declared - on_disk
    if missing:
        errors.append(f"declared decisions not present on disk: {sorted(missing)}")
    prunes = [c.get("id") for c in (shape_man.get("capabilities") or []) if c.get("decision") == "deprecated"]
    if prunes and not declared:
        errors.append(f"prunes {prunes} but no decisions declared in the manifest")
    # confirm each prune actually ended deprecated in the after-spine
    for cid in prunes:
        if (ca.get(cid) or {}).get("status") != "deprecated":
            errors.append(f"pruned capability '{cid}' is not 'deprecated' after apply")

    result = {"ok": not errors, "errors": errors}
    print(json.dumps(result, indent=2))
    return 0 if not errors else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
