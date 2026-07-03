#!/usr/bin/env python3
"""
check_measure.py — assert /measure's persisted result obeys its guarantees.

Post-apply verification, comparing the live slice folder + spine against snapshots taken
just before apply. /measure is the one lens play that DOES write the spine — but only one
field: the target slice's `status` -> `realized`, and only when the lines-up gate passed.

  - slice folder: every file byte-identical to its pre-apply snapshot EXCEPT `lens/measure.md`
    (the re-derive); decisions may be added but never edited in place; nothing else added.
  - spine: with --expect-realized, the ONLY change is the target slice's `status` becoming
    `realized` — every other slice, every other field, and every other collection
    (domains/capabilities/functionalities/profile/epics) byte-identical. Without
    --expect-realized (lines-up did not pass, no stamp), the spine is byte-identical.

Layer rule: reads files on disk only; no git/gh/network.

    python3 check_measure.py --cap-before <snap> --cap-dir <live slice folder> \
            --spine-before <_spine.yaml snap> --spine-after <live _spine.yaml> \
            --slice <slice-id> [--expect-realized]

Prints {ok, errors[]} JSON. Exit 0 clean, 1 on violation, 2 usage error.
"""

import argparse
import copy
import hashlib
import json
import os
import sys

try:
    import yaml
except ImportError:
    sys.stderr.write("check_measure.py: PyYAML is required.\n")
    sys.exit(2)


def sha256(path):
    h = hashlib.sha256()
    with open(path, "rb") as fh:
        for chunk in iter(lambda: fh.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()


def census(root):
    out = {}
    for dirpath, _dirs, files in os.walk(root):
        for fn in files:
            fp = os.path.join(dirpath, fn)
            out[os.path.relpath(fp, root)] = sha256(fp)
    return out


def is_lens(rel):
    parts = rel.split(os.sep)
    return len(parts) >= 2 and parts[-2] == "lens" and parts[-1] == "measure.md"


def is_decision(rel):
    return "decisions" in rel.split(os.sep) and rel.endswith(".yaml")


def slice_status_only_diff(before, after, sid, errors):
    """True iff the ONLY difference between the two spines is the target slice's status
    becoming 'realized'."""
    a2 = copy.deepcopy(after)
    tgt = next((s for s in (a2.get("slices") or [])
                if isinstance(s, dict) and (s.get("id") == sid or s.get("slug") == sid)), None)
    if tgt is None:
        errors.append(f"slice '{sid}' not found in the after-spine")
        return False
    if tgt.get("status") != "realized":
        errors.append(f"slice '{sid}' status is '{tgt.get('status')}', expected 'realized'")
        return False
    bsl = next((s for s in (before.get("slices") or [])
                if isinstance(s, dict) and (s.get("id") == sid or s.get("slug") == sid)), {})
    tgt["status"] = bsl.get("status")     # restore the one field we expect changed
    if a2 != before:
        errors.append("the spine changed beyond the target slice's status — /measure stamps "
                      "only that one field")
        return False
    return True


def main(argv=None):
    ap = argparse.ArgumentParser(description="Verify /measure's persisted result.")
    ap.add_argument("--cap-before", required=True)
    ap.add_argument("--cap-dir", required=True)
    ap.add_argument("--spine-before", required=True)
    ap.add_argument("--spine-after", required=True)
    ap.add_argument("--slice", required=True)
    ap.add_argument("--expect-realized", action="store_true",
                    help="lines-up passed: expect the target slice's status to become realized")
    args = ap.parse_args(argv)

    errors = []
    sid = args.slice.split("/", 1)[1] if "/" in args.slice else args.slice

    try:
        if args.expect_realized:
            before = yaml.safe_load(open(args.spine_before, encoding="utf-8")) or {}
            after = yaml.safe_load(open(args.spine_after, encoding="utf-8")) or {}
            slice_status_only_diff(before, after, sid, errors)
        elif sha256(args.spine_before) != sha256(args.spine_after):
            errors.append("_spine.yaml changed but lines-up did not pass — no stamp was due")
    except (OSError, yaml.YAMLError) as exc:
        errors.append(f"cannot compare the spine: {exc}")

    before_c = census(args.cap_before)
    after_c = census(args.cap_dir)
    for rel, h in after_c.items():
        if rel in before_c:
            if h == before_c[rel] or is_lens(rel):
                continue
            errors.append(f"{rel}: accepted decision edited in place" if is_decision(rel)
                          else f"{rel}: changed but only the measure lens may change")
        elif not (is_lens(rel) or is_decision(rel)):
            errors.append(f"{rel}: added, but /measure may add only its lens or a decision")
    for rel in before_c:
        if rel not in after_c:
            errors.append(f"{rel}: removed during /measure — the run is non-destructive")

    result = {"ok": not errors, "errors": errors}
    print(json.dumps(result, indent=2))
    return 0 if not errors else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
