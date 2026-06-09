#!/usr/bin/env python3
"""
check_run.py — assert /run's persisted result obeys its guarantees.

Post-apply verification, comparing the live slice folder + profile + slice record against
snapshots taken just before apply (the snapshots are gated to the apply step, so a resume can
never compare post-apply against post-apply).

  - C10/F10  non-destructive: every file in the slice folder is byte-identical to its
             pre-apply snapshot EXCEPT `lens/run.yaml` (the re-derive); the profile is
             byte-identical; an accepted decision present before apply is unchanged.
  - C2/F2    scope: nothing was added under the slice except the run lens and new decisions;
             the other lenses (quality/ux/agentic/architecture) are untouched.
  - C9/F9    the stamp is surgical: when --stamped, the slice record's composition is
             semantically unchanged and only `status` (→ realized) + metadata differ; when
             NOT --stamped, the slice record is byte-identical (no stamp was written).
  - C8/F8    when --stamped, `status` is exactly `realized` (the stamp is only set on lines-up;
             the lines-up gate itself is check_lines_up.py's job).

Layer rule: reads files on disk only; no git/gh/network.

    python3 check_run.py --cap-before <snapshot of slice folder> --cap-dir <live slice folder> \
            --profile-before <p.yaml> --profile-after <live p.yaml> \
            --slice-before <slice-record snapshot> --slice-after <live slice record> \
            --stamped {true|false}

Prints {ok, errors[]} JSON. Exit 0 clean, 1 on violation, 2 usage error.
"""

import argparse
import hashlib
import json
import os
import sys

try:
    import yaml
except ImportError:
    sys.stderr.write("check_run.py: PyYAML is required (pip install pyyaml).\n")
    sys.exit(2)

COMPOSITION_KEYS = ("id", "domain_ref", "name", "outcome", "functionalities",
                    "dependency_notes", "acceptance_intent", "order", "effort", "depends_on")


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


def is_run_lens(rel):
    parts = rel.split(os.sep)
    return len(parts) >= 2 and parts[-2] == "lens" and parts[-1] == "run.yaml"


def is_decision(rel):
    parts = rel.split(os.sep)
    return "decisions" in parts and rel.endswith(".yaml")


def load(path):
    with open(path, encoding="utf-8") as fh:
        return yaml.safe_load(fh) or {}


def main(argv=None):
    ap = argparse.ArgumentParser(description="Verify /run's persisted result.")
    ap.add_argument("--cap-before", required=True)
    ap.add_argument("--cap-dir", required=True)
    ap.add_argument("--profile-before", required=True)
    ap.add_argument("--profile-after", required=True)
    ap.add_argument("--slice-before", required=True)
    ap.add_argument("--slice-after", required=True)
    ap.add_argument("--stamped", required=True, choices=["true", "false"])
    args = ap.parse_args(argv)

    errors = []
    stamped = args.stamped == "true"

    # --- profile untouched ---------------------------------------------------
    try:
        if sha256(args.profile_before) != sha256(args.profile_after):
            errors.append("profile.yaml changed during /run — it must never write the profile (F2)")
    except OSError as exc:
        errors.append(f"cannot compare profiles: {exc}")

    # --- slice folder: only the run lens may change; decisions may be added --
    before = census(args.cap_before)
    after = census(args.cap_dir)
    for rel, h in after.items():
        if rel in before:
            if h == before[rel]:
                continue
            if is_run_lens(rel):
                continue
            if is_decision(rel):
                errors.append(f"{rel}: accepted decision edited in place (F10)")
            else:
                errors.append(f"{rel}: changed but only the run lens may change (F10)")
        else:
            if is_run_lens(rel) or is_decision(rel):
                continue
            errors.append(f"{rel}: added, but /run may add only the run lens or a decision (F2)")
    for rel in before:
        if rel not in after:
            errors.append(f"{rel}: removed during /run — the run is non-destructive (F10)")

    # --- slice record: the stamp is surgical --------------------------------
    if not stamped:
        try:
            if sha256(args.slice_before) != sha256(args.slice_after):
                errors.append("slice record changed but the run did not line up — no stamp "
                              "should have been written (F9/F8)")
        except OSError as exc:
            errors.append(f"cannot compare slice records: {exc}")
    else:
        try:
            sb = (load(args.slice_before).get("slice") or {})
            sa = (load(args.slice_after).get("slice") or {})
        except (OSError, yaml.YAMLError) as exc:
            errors.append(f"cannot parse slice records: {exc}")
            sb = sa = {}
        for k in COMPOSITION_KEYS:
            if sb.get(k) != sa.get(k):
                errors.append(f"slice record composition changed at '{k}' — the stamp is "
                              f"surgical, only status/metadata may change (F9)")
        if sa.get("status") != "realized":
            errors.append(f"slice was stamped but status is '{sa.get('status')}', not "
                          f"'realized' (F8)")
        # any key present before that is not composition/status/metadata must be unchanged
        for k in set(sb) | set(sa):
            if k in COMPOSITION_KEYS or k in ("status", "metadata"):
                continue
            if sb.get(k) != sa.get(k):
                errors.append(f"slice record changed at unexpected key '{k}' (F9)")

    result = {"ok": not errors, "errors": errors, "stamped": stamped}
    print(json.dumps(result, indent=2))
    return 0 if not errors else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
