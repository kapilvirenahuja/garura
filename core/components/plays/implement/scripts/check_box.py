#!/usr/bin/env python3
"""
check_box.py — box-discipline gate for /implement (C2/C5/F2/F5, S3).

After a piece of work, every changed file must map to a plan piece, and nothing
may land in the product model. The play captures the live changeset
(`git status --porcelain` → file) and each builder/test piece writes a
piece-report (`files_modified`); this script asserts over those captured files —
it never shells out itself (layer rule).

Checks:
  mapping      — every changed path appears in some piece-report's
                 `files_modified` (pieces draw the actual box). STM paths and
                 the play's own evidence are exempt (the play's bookkeeping).
  model guard  — ZERO changed paths under the product model tree
                 (--product-base), with exactly one allowlisted exception: the
                 anchored epic file (the status flip, --epic-file).
  piece guard  — every piece-report names a piece id present in the plan, and
                 that piece is in_progress or done (work outside the plan = F10).

    python3 check_box.py --plan <plan.yaml> --porcelain-file <captured>
                         --reports-dir <piece-reports dir> --product-base <pb>
                         --epic-file <epic.yaml> --stm-base <stm base>

Prints {ok, errors[], changed, mapped} JSON. Exit 0 ok, 1 violation, 2 usage.
"""

import argparse
import glob
import json
import os
import sys

try:
    import yaml
except ImportError:
    sys.stderr.write("check_box.py: PyYAML is required (pip install pyyaml).\n")
    sys.exit(2)


def load(path):
    with open(path, encoding="utf-8") as fh:
        return yaml.safe_load(fh) or {}


def norm(p):
    return os.path.normpath(p).lstrip("./")


def parse_porcelain(text):
    """Paths from `git status --porcelain` output (handles the rename arrow)."""
    out = []
    for line in text.splitlines():
        if not line.strip():
            continue
        path = line[3:] if len(line) > 3 else line.strip()
        if " -> " in path:
            path = path.split(" -> ", 1)[1]
        out.append(norm(path.strip().strip('"')))
    return out


def main(argv=None):
    ap = argparse.ArgumentParser(description="Box-discipline gate over captured state.")
    ap.add_argument("--plan", required=True)
    ap.add_argument("--porcelain-file", required=True)
    ap.add_argument("--reports-dir", required=True)
    ap.add_argument("--product-base", required=True)
    ap.add_argument("--epic-file", required=True)
    ap.add_argument("--stm-base", required=True)
    args = ap.parse_args(argv)

    errors = []
    try:
        plan = (load(args.plan).get("plan") or {})
        with open(args.porcelain_file, encoding="utf-8") as fh:
            changed = parse_porcelain(fh.read())
    except (OSError, yaml.YAMLError) as exc:
        print(json.dumps({"ok": False, "errors": [f"unreadable input: {exc}"]}, indent=2))
        return 1

    piece_status = {p.get("id"): p.get("status") for p in (plan.get("pieces") or [])}

    mapped_files, bad_reports = set(), 0
    for rf in sorted(glob.glob(os.path.join(args.reports_dir, "*.yaml"))):
        try:
            rep = (load(rf).get("piece_report") or {})
        except (OSError, yaml.YAMLError) as exc:
            errors.append(f"piece report unreadable: {rf} ({exc})")
            bad_reports += 1
            continue
        pid = rep.get("piece_id")
        if pid not in piece_status:
            errors.append(f"{os.path.basename(rf)}: piece_id '{pid}' is not in the plan — "
                          f"work outside the spine (C13/F10)")
        elif piece_status[pid] == "planned":
            errors.append(f"{os.path.basename(rf)}: piece '{pid}' is still 'planned' — "
                          f"work ran before the plan moved it (F10)")
        mapped_files.update(norm(f) for f in (rep.get("files_modified") or []))

    stm = norm(args.stm_base)
    model_root = norm(os.path.join(args.product_base, "product-os"))
    epic_ok = norm(args.epic_file)

    for path in changed:
        exempt = path.startswith(stm) or path == epic_ok
        if path.startswith(model_root) and path != epic_ok:
            errors.append(f"product-model write: {path} — the breakdown and the build "
                          f"live in STM/repo, never the model (C5/F5)")
            continue
        if not exempt and path not in mapped_files:
            errors.append(f"unmapped change: {path} — no piece report claims it; "
                          f"outside the box or outside the plan (C2/F2)")

    out = {"ok": not errors, "errors": errors,
           "changed": len(changed), "mapped": len(mapped_files)}
    print(json.dumps(out, indent=2))
    return 0 if not errors else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
