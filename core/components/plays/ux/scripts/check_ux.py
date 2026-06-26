#!/usr/bin/env python3
"""
check_ux.py — assert /ux's persisted result obeys its guarantees.

Post-apply verification, comparing the live capability folder + profile against
snapshots taken just before apply (the snapshots are gated to the apply step, so a
resume can never compare post-apply against post-apply).

  - C9/F9  non-destructive: every file in the capability folder is byte-identical to its
           pre-apply snapshot EXCEPT `lens/ux.yaml` (the re-derive); the profile is
           byte-identical; an accepted decision present before apply is unchanged (never
           edited in place).
  - C2/F2  scope: nothing was added under the capability except the ux lens and new
           decisions; the other lenses (quality/architecture/run/agentic) and the slices
           are untouched.
  - C9     additions are allowed only for `lens/ux.yaml` and new `decisions/*.yaml`.

Layer rule: reads files on disk only; no git/gh/network.

    python3 check_ux.py --cap-before <snapshot of capability folder> \
            --cap-dir <live capability folder> \
            --profile-before <profile-before.yaml> --profile-after <live profile.yaml>

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


def is_ux_lens(rel):
    parts = rel.split(os.sep)
    return len(parts) >= 2 and parts[-2] == "lens" and parts[-1] == "ux.md"


def is_decision(rel):
    parts = rel.split(os.sep)
    return "decisions" in parts and rel.endswith(".yaml")


def main(argv=None):
    ap = argparse.ArgumentParser(description="Verify /ux's persisted result.")
    ap.add_argument("--cap-before", required=True, help="pre-apply snapshot of the slice folder")
    ap.add_argument("--cap-dir", required=True, help="live slice folder")
    ap.add_argument("--spine-before", required=True, help="pre-apply snapshot of _spine.yaml")
    ap.add_argument("--spine-after", required=True, help="live _spine.yaml")
    args = ap.parse_args(argv)

    errors = []

    # --- spine untouched (the profile lives in the spine; /ux never writes it) -
    try:
        if sha256(args.spine_before) != sha256(args.spine_after):
            errors.append("_spine.yaml changed during /ux — it must never write the spine "
                          "or the profile (F2)")
    except OSError as exc:
        errors.append(f"cannot compare the spine: {exc}")

    # --- capability folder: only ux lens may change; decisions may be added --
    before = census(args.cap_before)
    after = census(args.cap_dir)

    for rel, h in after.items():
        if rel in before:
            if h == before[rel]:
                continue
            if is_ux_lens(rel):
                continue                       # the re-derive is allowed to change
            if is_decision(rel):
                errors.append(f"{rel}: accepted decision edited in place (F9)")
            else:
                errors.append(f"{rel}: changed but only the ux lens may change (F9)")
        else:
            # newly added file
            if is_ux_lens(rel) or is_decision(rel):
                continue
            errors.append(f"{rel}: added, but /ux may add only the ux lens or a decision (F2)")

    for rel in before:
        if rel not in after:
            errors.append(f"{rel}: removed during /ux — the run is non-destructive (F9)")

    result = {"ok": not errors, "errors": errors}
    print(json.dumps(result, indent=2))
    return 0 if not errors else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
