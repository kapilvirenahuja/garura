#!/usr/bin/env python3
"""
check_plan_sync.py — plan-vs-issue drift gate for /implement (C12/C13, F9/F10).

The published plan on the epic's issue must match the live plan whenever the
play pauses or ends — the plan never lives only in the session. The publish
step records what it posted (plan-publish.yaml: the rendered fingerprint + when);
this script recomputes the fingerprint from the live plan and compares. It also
re-checks piece-state legality (no piece running while a dependency is not done
— silent order violation, F10).

Layer rule: reads files on disk only; the posting itself is project-orchestrator's
CLI verb; this script only proves recorded-vs-actual agreement.

    python3 check_plan_sync.py --plan <plan.yaml> --publish-record <plan-publish.yaml>
                               [--tracking-off]

With --tracking-off (plan_tracking=false in config) the publish comparison is
skipped and only state legality runs.

Prints {ok, errors[], fingerprint, published_fingerprint} JSON.
Exit 0 in sync, 1 drifted/illegal, 2 usage error.
"""

import argparse
import hashlib
import json
import sys

try:
    import yaml
except ImportError:
    sys.stderr.write("check_plan_sync.py: PyYAML is required (pip install pyyaml).\n")
    sys.exit(2)


def load(path):
    with open(path, encoding="utf-8") as fh:
        return yaml.safe_load(fh) or {}


def fingerprint(pieces):
    rows = sorted(f"{p.get('id')}|{p.get('kind')}|{p.get('status')}|"
                  f"{','.join(sorted(p.get('depends_on') or []))}" for p in pieces)
    return hashlib.sha256("\n".join(rows).encode("utf-8")).hexdigest()


def main(argv=None):
    ap = argparse.ArgumentParser(description="Plan-vs-published drift gate.")
    ap.add_argument("--plan", required=True)
    ap.add_argument("--publish-record", default=None)
    ap.add_argument("--tracking-off", action="store_true")
    args = ap.parse_args(argv)

    errors = []
    try:
        plan = (load(args.plan).get("plan") or {})
    except (OSError, yaml.YAMLError) as exc:
        print(json.dumps({"ok": False, "errors": [f"plan unreadable: {exc}"]}, indent=2))
        return 1

    pieces = [p or {} for p in (plan.get("pieces") or [])]
    fp = fingerprint(pieces)
    published_fp = None

    # --- piece-state legality (F10) -------------------------------------------
    status = {p.get("id"): p.get("status") for p in pieces}
    for p in pieces:
        if p.get("status") in {"in_progress", "done"}:
            for d in (p.get("depends_on") or []):
                if status.get(d) != "done":
                    errors.append(f"{p.get('id')} is {p.get('status')} but dependency "
                                  f"'{d}' is {status.get(d)} — order violated (C13/F10)")

    # --- publish agreement (F9) ------------------------------------------------
    if not args.tracking_off:
        if not args.publish_record:
            errors.append("no publish record passed and tracking is on — the plan was "
                          "never published to the issue (C12/F9)")
        else:
            try:
                rec = (load(args.publish_record).get("plan_publish") or {})
                published_fp = rec.get("fingerprint")
            except (OSError, yaml.YAMLError) as exc:
                errors.append(f"publish record unreadable: {exc} (C12/F9)")
            if published_fp and published_fp != fp:
                errors.append("published plan is stale — issue fingerprint "
                              f"{published_fp[:12]}… != live {fp[:12]}…; republish "
                              f"before pausing or ending (C12/F9)")
            elif args.publish_record and not published_fp:
                errors.append("publish record carries no fingerprint (C12/F9)")

    print(json.dumps({"ok": not errors, "errors": errors, "fingerprint": fp,
                      "published_fingerprint": published_fp}, indent=2))
    return 0 if not errors else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
