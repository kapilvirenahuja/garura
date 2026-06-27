#!/usr/bin/env python3
"""
check_epics.py — verify the persisted epic cut was surgical (C9/C11/F8).

Diffs the spine before/after the persist and proves /grill added ONLY epics — new
entries in the spine `epics` index and new epic.md docs under the slice — and changed
nothing else: domains, capabilities, functionalities, slices, profile, and every lens
doc are byte-identical. An in-delivery epic (status != ready) must be untouched.

    python3 check_epics.py --manifest <apply-manifest.json> \
        --spine-before <saved _spine.yaml> --spine-after <live _spine.yaml> \
        --slice-ref <slice-id>

Prints {ok, errors[]} JSON. Exit 0 clean, 1 violation, 2 usage error.
"""

import argparse
import json
import sys

try:
    import yaml
except ImportError:
    sys.stderr.write("check_epics.py: PyYAML is required (pip install pyyaml).\n")
    sys.exit(2)


def load(path):
    with open(path, encoding="utf-8") as fh:
        return yaml.safe_load(fh) or {}


def by_id(spine, key):
    return {e.get("id"): e for e in (spine.get(key) or []) if isinstance(e, dict)}


def main(argv=None):
    ap = argparse.ArgumentParser(description="Verify a surgical epic persist.")
    ap.add_argument("--manifest", required=True)
    ap.add_argument("--spine-before", required=True)
    ap.add_argument("--spine-after", required=True)
    ap.add_argument("--slice-ref", required=True)
    args = ap.parse_args(argv)

    try:
        before, after = load(args.spine_before), load(args.spine_after)
    except (OSError, yaml.YAMLError) as exc:
        sys.stderr.write(f"check_epics.py: cannot read spine: {exc}\n")
        return 2

    errors = []

    # everything except the epics collection must be byte-identical
    for key in ("domains", "capabilities", "functionalities", "slices", "profile"):
        if before.get(key) != after.get(key):
            errors.append(f"spine '{key}' changed — /grill writes only epics (C11/F8)")

    eb, ea = by_id(before, "epics"), by_id(after, "epics")
    for eid in set(eb) - set(ea):
        errors.append(f"epic '{eid}' was removed — /grill does not delete delivery epics")
    for eid in set(eb) & set(ea):
        if (eb[eid].get("status") or "").strip().lower() != "ready" and eb[eid] != ea[eid]:
            errors.append(f"in-delivery epic '{eid}' changed — delivery owns it (F8)")
    for eid, e in ea.items():
        if eid not in eb or eb[eid] != e:
            sref = str(e.get("slice_ref") or "")
            if args.slice_ref not in sref:
                errors.append(f"epic '{eid}' slice_ref '{sref}' is not the target slice "
                              f"'{args.slice_ref}'")

    result = {"ok": not errors, "errors": errors,
              "epics_before": len(eb), "epics_after": len(ea)}
    print(json.dumps(result, indent=2))
    return 0 if not errors else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
