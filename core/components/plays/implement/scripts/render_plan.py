#!/usr/bin/env python3
"""
render_plan.py — deterministic plan → issue-markdown renderer for /implement (C12).

The plan is published to the epic's tracked issue so it survives a lost session.
project-orchestrator posts/edits the comment; THIS script composes it — the agent
fires a CLI verb, it writes no prose (hard scripting pass, #434).

Emits a markdown body with: the epic line, a piece checklist (state glyph, kind,
title, deps, grounding sources), open questions, and a `plan-fingerprint:` line —
sha256 over the normalized piece set (id|kind|status|deps) — that
check_plan_sync.py later compares against the live plan to detect drift (F9).

Layer rule: reads/writes files on disk only; no git/gh/network.

    python3 render_plan.py --plan <plan.yaml> --output <plan-issue.md>

Prints {ok, fingerprint, output, pieces} JSON. Exit 0 ok, 1 error, 2 usage.
"""

import argparse
import hashlib
import json
import sys

try:
    import yaml
except ImportError:
    sys.stderr.write("render_plan.py: PyYAML is required (pip install pyyaml).\n")
    sys.exit(2)

GLYPH = {"planned": "[ ]", "in_progress": "[~]", "done": "[x]", "blocked": "[!]"}


def fingerprint(pieces):
    rows = sorted(f"{p.get('id')}|{p.get('kind')}|{p.get('status')}|"
                  f"{','.join(sorted(p.get('depends_on') or []))}" for p in pieces)
    return hashlib.sha256("\n".join(rows).encode("utf-8")).hexdigest()


def main(argv=None):
    ap = argparse.ArgumentParser(description="Deterministic plan→markdown renderer.")
    ap.add_argument("--plan", required=True)
    ap.add_argument("--output", required=True)
    args = ap.parse_args(argv)

    try:
        plan = (yaml.safe_load(open(args.plan, encoding="utf-8")) or {}).get("plan") or {}
    except (OSError, yaml.YAMLError) as exc:
        print(json.dumps({"ok": False, "errors": [f"plan unreadable: {exc}"]}, indent=2))
        return 1

    pieces = [p or {} for p in (plan.get("pieces") or [])]
    fp = fingerprint(pieces)
    done = sum(1 for p in pieces if p.get("status") == "done")

    lines = [
        f"## Build plan — epic `{plan.get('epic_ref')}`",
        "",
        f"_The working spine of this build ({done}/{len(pieces)} done). "
        f"Managed by /implement; states sync as the build moves._",
        "",
    ]
    for p in pieces:
        deps = ", ".join(p.get("depends_on") or [])
        grounds = ",".join(sorted({(c or {}).get("source") or "?"
                                   for c in (p.get("grounding") or [])}))
        line = (f"- {GLYPH.get(p.get('status'), '[ ]')} **{p.get('id')}** "
                f"({p.get('kind')}) — {p.get('title')}")
        if deps:
            line += f" · after: {deps}"
        line += f" · grounded: {grounds}"
        lines.append(line)
    questions = plan.get("open_questions") or []
    if questions:
        lines += ["", "### Open questions"]
        lines += [f"- {q.get('question')}" for q in questions if (q or {}).get("question")]
    waiver = ((plan.get("docs_waiver") or {}).get("reason") or "").strip()
    if waiver:
        lines += ["", f"_Docs waived: {waiver}_"]
    lines += ["", f"<!-- plan-fingerprint: {fp} -->", ""]

    with open(args.output, "w", encoding="utf-8") as fh:
        fh.write("\n".join(lines))

    print(json.dumps({"ok": True, "fingerprint": fp, "output": args.output,
                      "pieces": len(pieces)}, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
