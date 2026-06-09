#!/usr/bin/env python3
"""
preflight.py — resolve a play's pre-flight facts to JSON.

The mechanical hand of a play's Pre-flight phase. The play (orchestrator) decides
what to HALT on; this script does the deterministic resolution the orchestrator
should never burn inference on — parse config, derive the path tokens, resolve the
evidence flag, extract the issue from the branch, and report the changeset state.

Harness-led split:
  - This script computes FACTS (config tokens, evidence_record, branch, issue,
    on_default_branch, changes_present, worktree, platform).
  - The SKILL keeps POLICY — which fact maps to a hard halt vs a graceful exit,
    which differs per play (commit-change halts when there are NO changes;
    propose-change halts when the tree is NOT clean — same fact, opposite action).

Layer rule: this script does NOT shell out to git/gh. The orchestrator captures
the two live reads it needs (current branch via `git branch --show-current`, and
`git status --porcelain` into a file) and passes them in. Everything else here is
pure parsing and derivation, so the script is unit-testable with fixtures.

    python3 preflight.py --play <name> [--config <path>] [--branch <name>]
                         [--porcelain-file <path>]

  --play            the calling play's name (for the per-play evidence override)
  --config          path to config.yaml (default .garura/core/config.yaml)
  --branch          current branch name (orchestrator passes `git branch --show-current`)
  --porcelain-file  file holding `git status --porcelain` output (changes_present)

Prints a single JSON object to stdout. Exit 0 on success, 2 if config is unreadable.
No third-party packages — runs in any installed target.
"""

import argparse
import json
import os
import re
import sys

DEFAULT_BRANCHES = {"main", "master"}


def fail(msg):
    sys.stderr.write(f"preflight.py: {msg}\n")
    sys.exit(2)


# --- minimal indent-aware config reader (dependency-free) --------------------

def parse_config(text):
    """Parse the simple nested `key: value` YAML garura config uses into a dict.

    Handles 2-space nesting, scalar values, inline ` #` comments and full-line
    comments. Does not handle YAML lists/anchors — the keys preflight needs are
    all plain nested scalars, so this is sufficient and has no dependency.
    """
    root = {}
    # stack of (indent, dict) frames; root is indent -1
    stack = [(-1, root)]
    for raw in text.splitlines():
        if not raw.strip() or raw.lstrip().startswith("#"):
            continue
        indent = len(raw) - len(raw.lstrip(" "))
        line = raw.strip()
        # strip an inline comment (" #..."), leave URLs (which have no " #") intact
        hashpos = line.find(" #")
        if hashpos != -1:
            line = line[:hashpos].rstrip()
        if ":" not in line:
            continue
        key, _, val = line.partition(":")
        key = key.strip()
        val = val.strip()
        # pop frames that are siblings/parents of this indent
        while stack and indent <= stack[-1][0]:
            stack.pop()
        parent = stack[-1][1] if stack else root
        if val == "":
            child = {}
            parent[key] = child
            stack.append((indent, child))
        else:
            parent[key] = _scalar(val.strip("'\""))
    return root


def _scalar(v):
    low = v.lower()
    if low == "true":
        return True
    if low == "false":
        return False
    return v


def _get(cfg, *path, default=None):
    cur = cfg
    for p in path:
        if not isinstance(cur, dict) or p not in cur:
            return default
        cur = cur[p]
    return cur


# --- resolution --------------------------------------------------------------

def resolve(cfg, play, branch, porcelain_text):
    stm_base = _get(cfg, "stm", "base-path")
    product_base = _get(cfg, "product", "base-path")

    # evidence: per-play override wins, then global, then default True
    ev_play = _get(cfg, "evidence", "plays", play)
    ev_global = _get(cfg, "evidence", "record")
    evidence_record = ev_play if ev_play is not None else (
        ev_global if ev_global is not None else True)

    issue = None
    on_default = False
    if branch:
        m = re.search(r"/(\d+)", branch)
        if m:
            issue = m.group(1)
        on_default = branch in DEFAULT_BRANCHES

    changes_present = None
    if porcelain_text is not None:
        changes_present = any(l.strip() for l in porcelain_text.splitlines())

    has_product_ltm = False
    if product_base:
        has_product_ltm = os.path.isdir(os.path.join(product_base, "architecture"))

    return {
        "play": play,
        "stm_base": stm_base,
        "stm_pending": _get(cfg, "stm", "pending-path"),
        "stm_archive": _get(cfg, "stm", "archive-path"),
        "ltm_project_target": _get(cfg, "ltm", "project-target"),
        "product_base": product_base,
        "has_product_ltm": has_product_ltm,
        "evidence_record": bool(evidence_record),
        "platform": _get(cfg, "platform"),
        "worktree": bool(_get(cfg, play, "worktree", default=False)),
        "branch": branch,
        "issue": issue,
        "on_default_branch": on_default,
        "changes_present": changes_present,
    }


def main(argv=None):
    ap = argparse.ArgumentParser(description="Resolve a play's pre-flight facts to JSON.")
    ap.add_argument("--play", required=True, help="calling play name (for evidence override)")
    ap.add_argument("--config", default=".garura/core/config.yaml", help="path to config.yaml")
    ap.add_argument("--branch", default=None, help="current branch (from git branch --show-current)")
    ap.add_argument("--porcelain-file", default=None,
                    help="file with git status --porcelain output (for changes_present)")
    args = ap.parse_args(argv)

    try:
        with open(args.config, encoding="utf-8") as fh:
            cfg = parse_config(fh.read())
    except OSError as exc:
        fail(f"cannot read config {args.config}: {exc}")

    porcelain_text = None
    if args.porcelain_file:
        try:
            with open(args.porcelain_file, encoding="utf-8") as fh:
                porcelain_text = fh.read()
        except OSError as exc:
            fail(f"cannot read porcelain file {args.porcelain_file}: {exc}")

    facts = resolve(cfg, args.play, args.branch, porcelain_text)
    print(json.dumps(facts, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
