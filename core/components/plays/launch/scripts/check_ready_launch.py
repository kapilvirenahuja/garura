#!/usr/bin/env python3
"""
check_ready_launch.py — epic eligibility gate for /launch (C1/F1, C2-presence).

/launch runs only on an epic /validate stamped `validated`, on its issue
branch, whose slice run lens exists and declares a dev/QA tier to stand the
increment up on. Layer rule: asserts over files on disk; never shells out.

    python3 check_ready_launch.py --epic-file <epic.yaml> --run-lens <run.yaml>
        [--issue <number from branch>]

Prints JSON facts: {ok, epic_id, slice_ref, issue_ref, user_check,
acceptance[], tier, errors[]}. Exit 0 eligible, 1 not, 2 usage.
"""

import argparse
import json
import sys

try:
    import yaml
except ImportError:
    sys.stderr.write("check_ready_launch.py: PyYAML is required (pip install pyyaml).\n")
    sys.exit(2)

DEV_QA_TIERS = ("local", "local-dev", "dev", "qa", "test", "preview", "uat-dev")  # early tiers only


def load(path):
    with open(path, "r", encoding="utf-8") as fh:
        return yaml.safe_load(fh) or {}


def main():
    ap = argparse.ArgumentParser(description="/launch eligibility gate.")
    ap.add_argument("--epic-file", required=True)
    ap.add_argument("--run-lens", required=True)
    ap.add_argument("--issue", default=None)
    args = ap.parse_args()

    errors = []
    out = {"ok": False, "epic_id": None, "slice_ref": None, "issue_ref": None,
           "user_check": None, "acceptance": [], "tier": None, "errors": errors}

    try:
        epic = (load(args.epic_file).get("epic") or load(args.epic_file)) or {}
    except Exception as exc:
        errors.append(f"epic unreadable: {exc} (C1/F1)")
        print(json.dumps(out, indent=2))
        sys.exit(1)

    out.update({"epic_id": epic.get("id"), "slice_ref": epic.get("slice_ref"),
                "issue_ref": epic.get("issue_ref"),
                "user_check": epic.get("user_check"),
                "acceptance": epic.get("acceptance") or []})

    status = (epic.get("status") or "").strip().lower()
    if status != "validated":
        errors.append(f"epic status is '{status}', must be 'validated' — /validate's "
                      "stamp is the gate (C1/F1)")
    if not epic.get("issue_ref"):
        errors.append("epic carries no issue_ref (C1/F1)")
    elif args.issue and str(epic["issue_ref"]).lstrip("#") != str(args.issue).lstrip("#"):
        errors.append(f"epic issue_ref '{epic['issue_ref']}' does not match the branch "
                      f"issue '{args.issue}' — wrong branch for this epic (C1/F1)")
    if not (epic.get("user_check") or "").strip():
        errors.append("epic has no user_check — nothing to walk the human through (C1)")
    if not (epic.get("acceptance") or []):
        errors.append("epic has no acceptance criteria (C1)")

    # --- run lens declares an early tier (C2) -----------------------------------
    try:
        lens = load(args.run_lens)
        content = lens.get("content") or lens
        envs = (content.get("environments") or content.get("environment")
                or content.get("targets") or {})
        names = []
        if isinstance(envs, dict):
            names = [str(k).strip().lower() for k in envs.keys()]
        elif isinstance(envs, list):
            for e in envs:
                if isinstance(e, dict):
                    names.append(str(e.get("name") or e.get("tier") or "").strip().lower())
                else:
                    names.append(str(e).strip().lower())
        tier = next((n for n in names if n in DEV_QA_TIERS), None)
        if tier is None:
            errors.append(f"run lens declares no dev/QA tier (found: {names or 'none'}) "
                          "— launch stands up only the early tiers (C2/F5)")
        out["tier"] = tier
    except Exception as exc:
        errors.append(f"run lens unreadable: {exc} (C2)")

    out["ok"] = not errors
    print(json.dumps(out, indent=2))
    sys.exit(0 if out["ok"] else 1)


if __name__ == "__main__":
    main()
