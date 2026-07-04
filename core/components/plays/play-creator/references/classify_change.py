#!/usr/bin/env python3
"""
classify_change.py — deterministic change-shape classifier for conditional gates (#467).

The first mechanical move of a conditional play's checkpoint step: read the play's
draft-vs-live diff and emit a SHAPE VECTOR — counts on fixed structural axes — plus the
derived SHAPE KEY the gate policy is learned against. No inference anywhere: every axis
is a pattern count over the file diffs.

    python3 classify_change.py --play ux --draft <draft-dir> --live <live-dir> \
        [--out shape.json]

Axes (fixed; the shape key is `<play>:<sorted non-zero axes joined by '+'>`):

  nodes_added        new model files, or added `- id:` / `id:` entries
  nodes_removed      the inverse
  status_changes     a `status:` value that differs between live and draft
  profile_bars_changed   changed level-bearing lines in profile files (nfr_/compliance/level)
  decisions_added    new decision files or appended decision entries
  sections_rewritten markdown H2/H3 sections with >= SECTION_LINES changed lines
  prose_edits        changed lines matching no structural pattern (md prose)

A draft dir with no differences yields shape key `<play>:none`.
Exit 0 always (classification never blocks); errors in inputs exit 2.
"""

import argparse
import difflib
import json
import os
import re
import sys

SECTION_LINES = 5  # changed lines under one heading to call the section rewritten

STRUCTURAL = re.compile(
    r"^\s*-?\s*(id|status|name|level|depends_on|order|effort|nfr_needs|nfr_[a-z_]+|"
    r"compliance_needs|compliance_[a-z_]+)\s*:")
STATUS = re.compile(r"^\s*status\s*:\s*(\S+)")
NODE_ID = re.compile(r"^\s*-?\s*id\s*:\s*(\S+)")
BAR = re.compile(r"^\s*(nfr_[a-z_]+|compliance_[a-z_]+|level)\s*:\s*(\S+)")
HEADING = re.compile(r"^#{2,3}\s+(.*)$")
DECISION_ENTRY = re.compile(r"^\s*-\s*(decision|id)\s*:", re.IGNORECASE)


def fail(msg):
    sys.stderr.write(f"classify_change.py: {msg}\n")
    sys.exit(2)


def read_lines(path):
    try:
        with open(path, encoding="utf-8") as fh:
            return fh.read().splitlines()
    except (OSError, UnicodeDecodeError):
        return None  # binary or unreadable: ignored


def walk(root):
    out = {}
    for base, dirs, files in os.walk(root):
        dirs[:] = [d for d in dirs if not d.startswith((".", "_")) and d != "__pycache__"]
        for f in files:
            if f.startswith((".", "_")) or f.endswith((".pyc", ".bak")):
                continue
            full = os.path.join(base, f)
            out[os.path.relpath(full, root)] = full
    return out


def is_decision_path(rel):
    return "decision" in rel.replace(os.sep, "/").lower()


def is_profile_path(rel):
    return "profile" in os.path.basename(rel).lower()


def count_node_ids(lines):
    return {m.group(1) for ln in lines if (m := NODE_ID.match(ln))}


def classify_pair(rel, old, new, axes):
    """Update axes from one changed file's line diff."""
    diff = list(difflib.unified_diff(old, new, lineterm="", n=0))
    minus = [l[1:] for l in diff if l.startswith("-") and not l.startswith("---")]
    plus = [l[1:] for l in diff if l.startswith("+") and not l.startswith("+++")]

    # status transitions: value changed for the status key
    old_status = [m.group(1) for ln in minus if (m := STATUS.match(ln))]
    new_status = [m.group(1) for ln in plus if (m := STATUS.match(ln))]
    axes["status_changes"] += sum(1 for a, b in zip(old_status, new_status) if a != b)

    # profile bars
    if is_profile_path(rel):
        old_bars = {m.group(1): m.group(2) for ln in minus if (m := BAR.match(ln))}
        new_bars = {m.group(1): m.group(2) for ln in plus if (m := BAR.match(ln))}
        axes["profile_bars_changed"] += sum(
            1 for k in set(old_bars) | set(new_bars) if old_bars.get(k) != new_bars.get(k))

    # node ids added/removed inside an existing file (spine index entries)
    old_ids, new_ids = count_node_ids(old), count_node_ids(new)
    axes["nodes_added"] += len(new_ids - old_ids)
    axes["nodes_removed"] += len(old_ids - new_ids)

    # decisions appended inside an existing decisions file
    if is_decision_path(rel):
        axes["decisions_added"] += max(
            0, sum(1 for ln in plus if DECISION_ENTRY.match(ln))
            - sum(1 for ln in minus if DECISION_ENTRY.match(ln)))

    if rel.endswith(".md"):
        # sections rewritten: changed lines grouped under the nearest heading of NEW file
        heading_for_line = {}
        current = "(top)"
        for i, ln in enumerate(new):
            m = HEADING.match(ln)
            if m:
                current = m.group(1).strip()
            heading_for_line[i] = current
        sm = difflib.SequenceMatcher(a=old, b=new, autojunk=False)
        changed_by_heading = {}
        prose = 0
        for tag, _i1, _i2, j1, j2 in sm.get_opcodes():
            if tag == "equal":
                continue
            for j in range(j1, j2):
                if j < len(new):
                    h = heading_for_line.get(j, "(top)")
                    changed_by_heading[h] = changed_by_heading.get(h, 0) + 1
                    if not STRUCTURAL.match(new[j]) and not HEADING.match(new[j]):
                        prose += 1
        axes["sections_rewritten"] += sum(
            1 for n in changed_by_heading.values() if n >= SECTION_LINES)
        axes["prose_edits"] += prose
    else:
        # structured files: non-structural changed lines still count as prose edits
        axes["prose_edits"] += sum(
            1 for ln in plus if not STRUCTURAL.match(ln) and ln.strip())


AXES = ["nodes_added", "nodes_removed", "status_changes", "profile_bars_changed",
        "decisions_added", "sections_rewritten", "prose_edits"]


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument("--play", required=True)
    ap.add_argument("--draft", required=True, help="the play's draft dir")
    ap.add_argument("--live", required=True, help="the matching live-model dir")
    ap.add_argument("--out", help="write the shape JSON here (also printed)")
    args = ap.parse_args(argv)

    if not os.path.isdir(args.draft):
        fail(f"draft dir missing: {args.draft}")
    live_files = walk(args.live) if os.path.isdir(args.live) else {}
    draft_files = walk(args.draft)

    axes = {a: 0 for a in AXES}

    for rel in sorted(set(draft_files) | set(live_files)):
        in_d, in_l = rel in draft_files, rel in live_files
        if in_d and not in_l:  # new file
            lines = read_lines(draft_files[rel])
            if lines is None:
                continue
            ids = count_node_ids(lines)
            if is_decision_path(rel):
                axes["decisions_added"] += 1
            elif ids:
                axes["nodes_added"] += max(1, len(ids))
            else:
                classify_pair(rel, [], lines, axes)
        elif in_l and not in_d:
            # absent from draft = untouched by this play run, NOT a removal
            continue
        else:
            old, new = read_lines(live_files[rel]), read_lines(draft_files[rel])
            if old is None or new is None or old == new:
                continue
            classify_pair(rel, old, new, axes)

    nonzero = sorted(a for a in AXES if axes[a] > 0)
    shape_key = f"{args.play}:" + ("+".join(nonzero) if nonzero else "none")
    result = {"play": args.play, "shape_key": shape_key, "axes": axes}
    text = json.dumps(result, indent=2)
    if args.out:
        with open(args.out, "w", encoding="utf-8") as fh:
            fh.write(text + "\n")
    print(text)


if __name__ == "__main__":
    main()
