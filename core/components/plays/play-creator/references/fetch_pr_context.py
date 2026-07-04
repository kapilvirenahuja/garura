#!/usr/bin/env python3
"""
fetch_pr_context.py — review-change Step 1 as a script (#484).

Fetches the PR diff, changed paths, and base ref (via platform_adapter.py) and
binds the standards_order + review-knowledge shelf path from config — writing
context.yaml + pr.diff. Replaces the repo-orchestrator dispatch. Zero judgment;
the category assessment and design-grounding that follow stay agent-run.

    python3 fetch_pr_context.py --config .garura/core/config.yaml \
        [--pr-number N] --out-context <context.yaml> --out-diff <pr.diff>

context.yaml records: standards_order, review_shelf, changed_paths, base.
Exit 0 on success, 1 on a fetch failure.
"""

import argparse
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import platform_adapter as pa  # noqa: E402


def _config_value(config_path, dotted):
    """Read a simple scalar or inline list by a shallow 'a.b' path from config yaml.
    Deliberately tiny — avoids a yaml dep; handles the two keys we need."""
    keys = dotted.split(".")
    try:
        with open(config_path, encoding="utf-8") as fh:
            lines = fh.readlines()
    except FileNotFoundError:
        return None
    depth = 0
    for i, line in enumerate(lines):
        stripped = line.rstrip("\n")
        m = re.match(rf"^{'  ' * depth}({re.escape(keys[depth])}):\s*(.*)$", stripped)
        if m:
            if depth == len(keys) - 1:
                val = m.group(2).strip()
                if val.startswith("["):
                    return [v.strip().strip("\"'") for v in
                            val.strip("[]").split(",") if v.strip()]
                return val.strip("\"'").split("#")[0].strip() or None
            depth += 1
    return None


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument("--config", default=".garura/core/config.yaml")
    ap.add_argument("--pr-number", default="")
    ap.add_argument("--out-context", required=True)
    ap.add_argument("--out-diff", required=True)
    ns = ap.parse_args(argv)

    pr = ns.pr_number
    if not pr:
        res = pa.dispatch("view-pr", {"pr_number": ""}, config_path=ns.config)
        if res["exit_code"] == 0 and res["stdout"].strip():
            pr = str(json.loads(res["stdout"]).get("number", ""))
    if not pr:
        sys.stderr.write("fetch_pr_context.py: no open PR for the branch\n")
        sys.exit(1)

    meta = pa.dispatch("view-pr", {"pr_number": pr}, config_path=ns.config)
    if meta["exit_code"] != 0:
        sys.stderr.write(f"fetch_pr_context.py: view-pr failed: {meta['stderr']}\n")
        sys.exit(1)
    data = json.loads(meta["stdout"])
    base = data.get("baseRefName", "main")
    changed_paths = [f.get("path") for f in data.get("files", []) if f.get("path")]

    diff = pa.dispatch("diff-pr", {"pr_number": pr}, config_path=ns.config)
    if diff["exit_code"] != 0:
        sys.stderr.write(f"fetch_pr_context.py: diff-pr failed: {diff['stderr']}\n")
        sys.exit(1)
    with open(ns.out_diff, "w", encoding="utf-8") as fh:
        fh.write(diff["stdout"])

    standards_order = _config_value(ns.config, "review-pr.standards_order") or \
        ["kb", "ltm", "stm"]
    ltm_target = _config_value(ns.config, "ltm.project-target") or "./.garura/core/memory/"
    review_shelf = os.path.join(ltm_target, "knowledge", "review") + os.sep

    context = {"pr_number": pr, "base": base, "changed_paths": changed_paths,
               "standards_order": standards_order, "review_shelf": review_shelf}
    with open(ns.out_context, "w", encoding="utf-8") as fh:
        json.dump(context, fh, indent=2)
    print(json.dumps(context, indent=2))
    sys.exit(0)


if __name__ == "__main__":
    main()
