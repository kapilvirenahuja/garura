#!/usr/bin/env python3
"""
check_run.py — assert /run's persisted result obeys its guarantees.

Post-apply verification, comparing the live slice folder + spine against snapshots taken
just before apply (the snapshots are gated to the apply step, so a resume can never
compare post-apply against post-apply).

  - non-destructive: every file in the slice folder is byte-identical to its pre-apply
    snapshot EXCEPT `lens/run.md` and `lens/run.yaml` (the re-derive); the spine (where the
    profile lives) is byte-identical; an accepted decision present before apply is unchanged.
  - scope: nothing was added under the slice except the run lens and new decisions; the
    other lenses (run/ux/architecture/measure/run) are untouched.

Layer rule: reads files on disk only; no git/gh/network.

    python3 check_run.py --cap-before <snapshot of slice folder> \
            --cap-dir <live slice folder> \
            --spine-before <_spine.yaml snapshot> --spine-after <live _spine.yaml>

Prints {ok, errors[]} JSON. Exit 0 clean, 1 on violation, 2 usage error.
"""

import argparse
import hashlib
import json
import os
import sys


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
    return len(parts) >= 2 and parts[-2] == "lens" and parts[-1] in ("run.md", "run.yaml")


def is_decision(rel):
    parts = rel.split(os.sep)
    return "decisions" in parts and rel.endswith(".yaml")


def main(argv=None):
    ap = argparse.ArgumentParser(description="Verify /run's persisted result.")
    ap.add_argument("--cap-before", required=True, help="pre-apply snapshot of the slice folder")
    ap.add_argument("--cap-dir", required=True, help="live slice folder")
    ap.add_argument("--spine-before", required=True, help="pre-apply snapshot of _spine.yaml")
    ap.add_argument("--spine-after", required=True, help="live _spine.yaml")
    args = ap.parse_args(argv)

    errors = []

    # --- spine untouched (the profile lives in the spine; /run never writes it) ---
    try:
        if sha256(args.spine_before) != sha256(args.spine_after):
            errors.append("_spine.yaml changed during /run — it must never write the "
                          "spine or the profile")
    except OSError as exc:
        errors.append(f"cannot compare the spine: {exc}")

    # --- slice folder: only the run lens may change; decisions may be added ---
    before = census(args.cap_before)
    after = census(args.cap_dir)

    for rel, h in after.items():
        if rel in before:
            if h == before[rel]:
                continue
            if is_lens(rel):
                continue                       # the re-derive is allowed to change
            if is_decision(rel):
                errors.append(f"{rel}: accepted decision edited in place")
            else:
                errors.append(f"{rel}: changed but only the run lens may change")
        else:
            if is_lens(rel) or is_decision(rel):
                continue
            errors.append(f"{rel}: added, but /run may add only its lens or a decision")

    for rel in before:
        if rel not in after:
            errors.append(f"{rel}: removed during /run — the run is non-destructive")

    result = {"ok": not errors, "errors": errors}
    print(json.dumps(result, indent=2))
    return 0 if not errors else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
