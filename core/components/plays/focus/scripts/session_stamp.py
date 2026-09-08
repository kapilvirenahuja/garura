#!/usr/bin/env python3
"""
session_stamp.py — the session identity stamp (#463).

Binds a play run to the exact slice of the Claude Code session ledger that
produced it, so spend and behavior are computable OFFLINE (token-burn-dash)
with zero in-run cost. No parsing, no summing: one directory listing, one
line read, one file size.

The ledger: Claude Code writes one JSONL per session under
~/.claude/projects/<cwd-slug>/<session-id>.jsonl. Every line carries
sessionId and gitBranch; assistant lines carry token usage. This script
never reads more than the last line of a candidate file.

Phases (mirrors the status-marker lifecycle):
    --phase start  → resolve the live session (prefer the ledger whose last
                     line's gitBranch matches --branch, else newest mtime),
                     write {session_id, ledger_file, start_offset, started_at}
                     to --marker.
    --phase close  → read --marker, take the ledger's current size as
                     end_offset, emit the stamp JSON to stdout (the play close
                     copies the fields into the evidence frontmatter).

Canonical copy: play-creator/references/session_stamp.py — stamped into each
play's scripts/ by play-creator (Standard Play Close, G12), same discipline
as preflight.py. Failures are soft: a missing ledger yields a stamp with
nulls and "ledger_resolved": false — the close never blocks on the stamp.
"""

import argparse
import json
import sys
import time
from pathlib import Path


def cwd_slug(cwd):
    return "".join(ch if ch.isalnum() else "-" for ch in str(cwd))


def last_line(path, max_tail=65536):
    """Read the final line of a (possibly large) file without loading it."""
    try:
        with open(path, "rb") as fh:
            fh.seek(0, 2)
            size = fh.tell()
            fh.seek(max(0, size - max_tail))
            tail = fh.read().decode("utf-8", errors="replace")
        lines = [l for l in tail.strip().splitlines() if l.strip()]
        return json.loads(lines[-1]) if lines else None
    except Exception:
        return None


def resolve_ledger(projects_dir, cwd, branch):
    """The live session's ledger: prefer last-line gitBranch == branch,
    fall back to newest mtime. Returns (path, session_id) or (None, None)."""
    slug_dir = Path(projects_dir) / cwd_slug(cwd)
    if not slug_dir.is_dir():
        return None, None
    candidates = sorted(slug_dir.glob("*.jsonl"),
                        key=lambda p: p.stat().st_mtime, reverse=True)
    newest = None
    for p in candidates[:10]:  # only recent files can be the live session
        rec = last_line(p)
        if rec is None:
            continue
        sid = rec.get("sessionId")
        if newest is None and sid:
            newest = (p, sid)
        if branch and rec.get("gitBranch") == branch and sid:
            return p, sid
    return newest if newest else (None, None)


def phase_start(args):
    ledger, session_id = resolve_ledger(args.projects_dir, args.cwd, args.branch)
    marker = {
        "ledger_resolved": ledger is not None,
        "session_id": session_id,
        "ledger_file": str(ledger) if ledger else None,
        "start_offset": ledger.stat().st_size if ledger else None,
        "started_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }
    Path(args.marker).parent.mkdir(parents=True, exist_ok=True)
    with open(args.marker, "w", encoding="utf-8") as fh:
        json.dump(marker, fh, indent=2)
    print(json.dumps(marker, indent=2))


def phase_close(args):
    try:
        with open(args.marker, "r", encoding="utf-8") as fh:
            marker = json.load(fh)
    except Exception:
        marker = {"ledger_resolved": False, "session_id": None,
                  "ledger_file": None, "start_offset": None}
    ledger = marker.get("ledger_file")
    end_offset = None
    if ledger and Path(ledger).exists():
        end_offset = Path(ledger).stat().st_size
    stamp = {
        "ledger_resolved": bool(marker.get("ledger_resolved") and end_offset is not None),
        "session_id": marker.get("session_id"),
        "ledger_file": ledger,
        "ledger_start_offset": marker.get("start_offset"),
        "ledger_end_offset": end_offset,
    }
    print(json.dumps(stamp, indent=2))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--phase", required=True, choices=["start", "close"])
    ap.add_argument("--marker", required=True,
                    help="status-marker path for the stamp (per play run)")
    ap.add_argument("--cwd", default=str(Path.cwd()),
                    help="project root the session runs in")
    ap.add_argument("--branch", default=None,
                    help="current git branch (start phase; ledger match hint)")
    ap.add_argument("--projects-dir",
                    default=str(Path.home() / ".claude" / "projects"))
    args = ap.parse_args()
    phase_start(args) if args.phase == "start" else phase_close(args)


if __name__ == "__main__":
    main()
    sys.exit(0)
