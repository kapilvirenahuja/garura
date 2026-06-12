#!/usr/bin/env python3
"""
check_measure.py — assert /measure's persisted result obeys its guarantees.

Post-apply verification, comparing the live slice folder + record + profile against
snapshots taken just before apply (the snapshots are gated to the apply step, so a resume
can never compare post-apply against post-apply), and the persisted lens against the
approved draft.

  - F1/C8  faithful: the persisted `lens/measure.yaml` is byte-identical to the approved
           draft lens — what landed is exactly what the human approved.
  - F9/C1  scope: within the slice folder every file is byte-identical to its snapshot
           except `lens/measure.yaml` (the re-derive); the only allowed addition is
           `lens/measure.yaml`; nothing was removed; the slice RECORD is byte-identical
           (/measure never stamps — that is /run's duty); the profile is byte-identical.

Layer rule: reads files on disk only; no git/gh/network.

    python3 check_measure.py --cap-before <snapshot of slice folder> \
            --cap-dir <live slice folder> \
            --slice-before <slice-record-before.yaml> --slice-after <live slice record> \
            --profile-before <profile-before.yaml> --profile-after <live profile.yaml> \
            --approved-lens <draft lens/measure.yaml> --live-lens <persisted lens/measure.yaml>

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


def is_measure_lens(rel):
    parts = rel.split(os.sep)
    return len(parts) >= 2 and parts[-2] == "lens" and parts[-1] == "measure.yaml"


def main(argv=None):
    ap = argparse.ArgumentParser(description="Verify /measure's persisted result.")
    ap.add_argument("--cap-before", required=True)
    ap.add_argument("--cap-dir", required=True)
    ap.add_argument("--slice-before", required=True)
    ap.add_argument("--slice-after", required=True)
    ap.add_argument("--profile-before", required=True)
    ap.add_argument("--profile-after", required=True)
    ap.add_argument("--approved-lens", required=True)
    ap.add_argument("--live-lens", required=True)
    args = ap.parse_args(argv)

    errors = []

    # --- faithful to the approved draft (F1) ----------------------------------
    try:
        if sha256(args.approved_lens) != sha256(args.live_lens):
            errors.append("persisted lens/measure.yaml differs from the approved draft (F1)")
    except OSError as exc:
        errors.append(f"cannot compare approved vs persisted lens: {exc}")

    # --- slice record untouched (/measure never stamps) ------------------------
    try:
        if sha256(args.slice_before) != sha256(args.slice_after):
            errors.append("the slice record changed during /measure — only /run stamps it (F9)")
    except OSError as exc:
        errors.append(f"cannot compare slice records: {exc}")

    # --- profile untouched ------------------------------------------------------
    try:
        if sha256(args.profile_before) != sha256(args.profile_after):
            errors.append("profile.yaml changed during /measure — it must never write the profile (F9)")
    except OSError as exc:
        errors.append(f"cannot compare profiles: {exc}")

    # --- slice folder: only the measure lens may change or be added -------------
    before = census(args.cap_before)
    after = census(args.cap_dir)

    for rel, h in after.items():
        if rel in before:
            if h == before[rel] or is_measure_lens(rel):
                continue
            errors.append(f"{rel}: changed but only the measure lens may change (F9)")
        else:
            if is_measure_lens(rel):
                continue
            errors.append(f"{rel}: added, but /measure may add only the measure lens (F9)")

    for rel in before:
        if rel not in after:
            errors.append(f"{rel}: removed during /measure — the run is non-destructive (F9)")

    result = {"ok": not errors, "errors": errors}
    print(json.dumps(result, indent=2))
    return 0 if not errors else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
