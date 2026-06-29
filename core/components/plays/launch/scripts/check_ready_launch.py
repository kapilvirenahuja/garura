#!/usr/bin/env python3
"""
check_ready_launch.py — epic eligibility gate for /launch (C1/F1, C2-presence), on the spine.

/launch runs only on an epic /validate stamped `validated`, on its issue branch,
whose slice run lens stands the increment up on a dev/QA tier. In the spine +
grounding model the epic is an entry in product-os/_spine.yaml `epics` index
(status/issue_ref/slice_ref/doc); its user_check and acceptance live in the
`epic.md` grounding doc; the run lens is the slice's `lens/run.md` grounding doc.
Layer rule: asserts over files on disk; never shells out.

    python3 check_ready_launch.py --product-base <pb> --epic <epic-id>
        --run-lens <lens/run.md> [--issue <number from branch>]

Prints JSON facts: {ok, epic_id, slice_ref, issue_ref, epic_doc, user_check,
acceptance[], tier, errors[]}. Exit 0 eligible, 1 not, 2 usage.
"""

import argparse
import json
import os
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


def section(md_text, heading):
    """Lines under a `## <heading>` until the next `## ` heading (case-insensitive)."""
    out, capturing = [], False
    for line in md_text.splitlines():
        stripped = line.strip()
        if stripped.startswith("## "):
            if capturing:
                break
            capturing = stripped[3:].strip().lower() == heading.strip().lower()
            continue
        if capturing:
            out.append(line)
    return out


def main():
    ap = argparse.ArgumentParser(description="/launch eligibility gate (spine).")
    ap.add_argument("--product-base", required=True)
    ap.add_argument("--epic", required=True, help="epic id")
    ap.add_argument("--run-lens", required=True, help="the slice's lens/run.md grounding doc")
    ap.add_argument("--issue", default=None)
    args = ap.parse_args()

    errors = []
    out = {"ok": False, "epic_id": None, "slice_ref": None, "issue_ref": None,
           "epic_doc": None, "user_check": None, "acceptance": [], "tier": None,
           "errors": errors}

    # --- epic entry from the spine (C1) ---------------------------------------
    spine_path = os.path.join(args.product_base, "product-os", "_spine.yaml")
    try:
        spine = load(spine_path)
    except Exception as exc:
        errors.append(f"spine unreadable: {exc} (C1/F1)")
        print(json.dumps(out, indent=2))
        sys.exit(1)
    epic = next((e for e in (spine.get("epics") or [])
                 if isinstance(e, dict) and e.get("id") == args.epic.split("/")[-1]), None)
    if epic is None:
        errors.append(f"epic '{args.epic}' not in the spine epics index (C1/F1)")
        print(json.dumps(out, indent=2))
        sys.exit(1)

    out.update({"epic_id": epic.get("id"), "slice_ref": epic.get("slice_ref"),
                "issue_ref": epic.get("issue_ref")})

    status = (epic.get("status") or "").strip().lower()
    if status != "validated":
        errors.append(f"epic status is '{status}', must be 'validated' — /validate's "
                      "stamp is the gate (C1/F1)")
    if not epic.get("issue_ref"):
        errors.append("epic carries no issue_ref (C1/F1)")
    elif args.issue and str(epic["issue_ref"]).lstrip("#") != str(args.issue).lstrip("#"):
        errors.append(f"epic issue_ref '{epic['issue_ref']}' does not match the branch "
                      f"issue '{args.issue}' — wrong branch for this epic (C1/F1)")

    # --- user_check + acceptance from epic.md (C1) ----------------------------
    epic_doc = os.path.join(args.product_base, "product-os", epic.get("doc")) \
        if epic.get("doc") else None
    out["epic_doc"] = epic_doc
    if not epic_doc or not os.path.isfile(epic_doc):
        errors.append(f"epic.md not found at '{epic.get('doc')}' — no grounding doc to "
                      "walk the human through (C1)")
    else:
        md = open(epic_doc, encoding="utf-8").read()
        user_check = "\n".join(section(md, "User check")).strip()
        acceptance = [ln.strip("-* ").strip()
                      for ln in section(md, "Acceptance criteria")
                      if ln.strip() and not ln.strip().startswith("#")]
        acceptance = [a for a in acceptance if a]
        out["user_check"] = user_check or None
        out["acceptance"] = acceptance
        if not user_check:
            errors.append("epic.md '## User check' is empty — nothing to walk the human "
                          "through (C1)")
        if not acceptance:
            errors.append("epic.md '## Acceptance criteria' is empty (C1)")

    # --- run lens declares an early tier (C2) ---------------------------------
    try:
        run_md = open(args.run_lens, encoding="utf-8").read()
        envs_text = "\n".join(section(run_md, "Environments")).lower()
        if not envs_text.strip():
            errors.append("run lens has no '## Environments' content (C2)")
        words = set(w.strip(".,:;()/").lower() for w in envs_text.split())
        tier = next((t for t in DEV_QA_TIERS if t in words or t in envs_text), None)
        if tier is None:
            errors.append("run lens '## Environments' names no dev/QA tier "
                          "(local/dev/qa/test/preview) — launch stands up only the early "
                          "tiers (C2/F5)")
        out["tier"] = tier
    except Exception as exc:
        errors.append(f"run lens unreadable: {exc} (C2)")

    out["ok"] = not errors
    print(json.dumps(out, indent=2))
    sys.exit(0 if out["ok"] else 1)


if __name__ == "__main__":
    main()
