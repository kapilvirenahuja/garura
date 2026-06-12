#!/usr/bin/env python3
"""
resolve_blast_scope.py — blast-radius scope resolver for /validate (C6/F8).

Scope is DRAWN FROM RECORDED CHANGE CLAIMS, never invented:
  round 1   — the union of `files_modified` across implement's piece reports
              (the build's recorded claims).
  round N+1 — the union of `files_modified` across the FIX's piece reports,
              plus the files the prior validate report's findings named (the
              fix round re-verifies only what the fix could have touched).

The script can only read claims or fail loud — it has no way to invent scope
(KB: architecture/regression-by-blast-radius). Layer rule: disk only.

    python3 resolve_blast_scope.py --reports-dir <piece-reports dir>
        [--prior-report <report.yaml>] --round <n> --out <scope.json>

Prints {ok, round, source, files[], errors[]}. Exit 0 ok, 1 fail, 2 usage.
"""

import argparse
import glob
import json
import os
import sys

try:
    import yaml
except ImportError:
    sys.stderr.write("resolve_blast_scope.py: PyYAML is required (pip install pyyaml).\n")
    sys.exit(2)


def load(path):
    with open(path, "r", encoding="utf-8") as fh:
        return yaml.safe_load(fh) or {}


def main():
    ap = argparse.ArgumentParser(description="/validate blast-radius scope resolver.")
    ap.add_argument("--reports-dir", required=True)
    ap.add_argument("--prior-report", default=None)
    ap.add_argument("--round", type=int, required=True)
    ap.add_argument("--out", required=True)
    args = ap.parse_args()

    errors = []
    files = set()
    reports = sorted(glob.glob(os.path.join(args.reports_dir, "*.yaml"))) + \
              sorted(glob.glob(os.path.join(args.reports_dir, "*.yml")))
    if not reports:
        errors.append(f"no piece reports in {args.reports_dir} — scope cannot be "
                      "derived, and it is never invented (C6/F8)")
    for path in reports:
        try:
            rec = load(path)
        except Exception as exc:
            errors.append(f"piece report unreadable: {path}: {exc} (C6/F8)")
            continue
        for f in (rec.get("files_modified") or []):
            files.add(str(f))

    source = "implement-claims"
    if args.round > 1:
        source = "fix-claims+prior-report"
        if not args.prior_report:
            errors.append("round > 1 but no --prior-report — the fix round's scope "
                          "includes what the last report named (C6/F8)")
        else:
            try:
                prior = load(args.prior_report)
                for finding in (prior.get("findings") or []):
                    loc = finding.get("location") or ""
                    path = str(loc).split(":")[0].strip()
                    if path:
                        files.add(path)
            except Exception as exc:
                errors.append(f"prior report unreadable: {args.prior_report}: {exc} (C6/F8)")

    out = {"ok": not errors, "round": args.round, "source": source,
           "files": sorted(files), "errors": errors}
    if not errors and not files:
        out["ok"] = False
        errors.append("recorded claims resolved to an empty scope — nothing claimed "
                      "is not a valid scope for a built epic (C6/F8)")
    with open(args.out, "w", encoding="utf-8") as fh:
        json.dump(out, fh, indent=2)
    print(json.dumps(out, indent=2))
    sys.exit(0 if out["ok"] else 1)


if __name__ == "__main__":
    main()
