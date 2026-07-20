#!/usr/bin/env python3
"""
classify_change.py — deterministic change-shape classifier for conditional gates (#467).

The first mechanical move of a conditional play's checkpoint step: read the play's
working-tree git diff of the model paths and emit a SHAPE VECTOR — counts on fixed
structural axes — plus the derived SHAPE KEY the gate policy is learned against. No
inference anywhere: every axis is a pattern count over the file diffs.

Direct-model-write (ADR 026): the source is the working-tree git diff of
<product_base>product-os/ vs --base-ref (HEAD), NOT a draft-vs-live directory comparison.
The `(path, old_lines, new_lines)` pairs are built from git — `new` is the current file,
`old` is the file at --base-ref (empty for an added file) — and fed through the SAME
classify_pair / new-file dispatch as before; the axis math is untouched, so the learned
gate policy and ledger keep working. Untracked additions (git ls-files --others) are
unioned with tracked changes, because a direct-write play creates new docs/decisions as
untracked files that `git diff` alone does not list.

    python3 classify_change.py --play understand \
        --product-base <product_base> --base-ref HEAD [--out shape.json]

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
import subprocess
import sys

SECTION_LINES = 5  # changed lines under one heading to call the section rewritten

STRUCTURAL = re.compile(
    r"^\s*-?\s*(id|status|name|level|depends_on|order|effort|nfr_needs|nfr_[a-z_]+|"
    r"compliance_needs|compliance_[a-z_]+)\s*:"
)
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


def git_out(root, *args):
    proc = subprocess.run(["git", "-C", root, *args], capture_output=True, text=True)
    return proc.returncode, proc.stdout


def repo_root(start):
    proc = subprocess.run(["git", "-C", start, "rev-parse", "--show-toplevel"],
                          capture_output=True, text=True)
    if proc.returncode != 0:
        fail(f"not a git repo at {start}: {proc.stderr.strip()}")
    return proc.stdout.strip()


def rel_to_root(root, path):
    # realpath both sides: git rev-parse resolves symlinks (e.g. macOS /var -> /private/var)
    # while a passed-in path may not, which would otherwise yield a broken ../../.. relpath.
    return os.path.relpath(os.path.realpath(path), os.path.realpath(root)).replace(os.sep, "/")


def git_changed(root, base_ref, tree_rel):
    """repo_rel_path -> status in {A, M, D}; unions tracked diff with untracked adds."""
    out = {}
    rc, diff = git_out(root, "diff", "--name-status", base_ref, "--", tree_rel)
    if rc != 0:
        fail(f"git diff against {base_ref} failed under {tree_rel}")
    for line in diff.splitlines():
        if not line.strip():
            continue
        parts = line.split("\t")
        status = parts[0].strip()[0]
        path = parts[-1].strip()
        if status in ("R", "C"):
            out[path] = "A"
        elif status in ("A", "M", "D"):
            out[path] = status
        else:
            out[path] = "M"
    rc, others = git_out(root, "ls-files", "--others", "--exclude-standard", "--", tree_rel)
    if rc != 0:
        fail(f"git ls-files --others failed under {tree_rel}")
    for line in others.splitlines():
        p = line.strip()
        if p:
            out[p] = "A"
    return out


def git_show_lines(root, base_ref, path):
    """File content at base_ref as a list of lines, or [] if the path did not exist there."""
    rc, text = git_out(root, "show", f"{base_ref}:{path}")
    if rc != 0:
        return []
    return text.splitlines()


def is_decision_path(rel):
    return "decision" in rel.replace(os.sep, "/").lower()


def is_profile_path(rel):
    return "profile" in os.path.basename(rel).lower()


def count_node_ids(lines):
    return {m.group(1) for ln in lines if (m := NODE_ID.match(ln))}


def _diff_lines(old, new):
    """The removed and added lines of a unified diff, fences stripped."""
    diff = list(difflib.unified_diff(old, new, lineterm="", n=0))
    minus = [
        line[1:] for line in diff if line.startswith("-") and not line.startswith("---")
    ]
    plus = [
        line[1:] for line in diff if line.startswith("+") and not line.startswith("+++")
    ]
    return minus, plus


def _status_changes(minus, plus):
    """Count status: values that changed between the removed and added lines."""
    old_status = [m.group(1) for ln in minus if (m := STATUS.match(ln))]
    new_status = [m.group(1) for ln in plus if (m := STATUS.match(ln))]
    return sum(1 for a, b in zip(old_status, new_status) if a != b)


def _bar_changes(minus, plus):
    """Count level-bearing keys whose value moved (profile files only)."""
    old_bars = {m.group(1): m.group(2) for ln in minus if (m := BAR.match(ln))}
    new_bars = {m.group(1): m.group(2) for ln in plus if (m := BAR.match(ln))}
    return sum(
        1 for k in set(old_bars) | set(new_bars) if old_bars.get(k) != new_bars.get(k)
    )


def _decision_delta(minus, plus):
    """Net decision entries appended (decisions files only)."""
    added = sum(1 for ln in plus if DECISION_ENTRY.match(ln))
    removed = sum(1 for ln in minus if DECISION_ENTRY.match(ln))
    return max(0, added - removed)


def _heading_map(lines):
    """line index -> nearest H2/H3 heading above it in the file."""
    headings = {}
    current = "(top)"
    for i, ln in enumerate(lines):
        m = HEADING.match(ln)
        if m:
            current = m.group(1).strip()
        headings[i] = current
    return headings


def _md_changes(old, new):
    """(sections_rewritten, prose_edits) for a markdown file's change."""
    heading_for_line = _heading_map(new)
    sm = difflib.SequenceMatcher(a=old, b=new, autojunk=False)
    changed_by_heading = {}
    prose = 0
    for tag, _i1, _i2, j1, j2 in sm.get_opcodes():
        if tag == "equal":
            continue
        for j in range(j1, j2):
            if j >= len(new):
                continue
            heading = heading_for_line.get(j, "(top)")
            changed_by_heading[heading] = changed_by_heading.get(heading, 0) + 1
            if not STRUCTURAL.match(new[j]) and not HEADING.match(new[j]):
                prose += 1
    sections = sum(1 for n in changed_by_heading.values() if n >= SECTION_LINES)
    return sections, prose


def classify_pair(rel, old, new, axes):
    """Update axes from one changed file's line diff."""
    minus, plus = _diff_lines(old, new)

    axes["status_changes"] += _status_changes(minus, plus)
    if is_profile_path(rel):
        axes["profile_bars_changed"] += _bar_changes(minus, plus)

    # node ids added/removed inside an existing file (spine index entries)
    old_ids, new_ids = count_node_ids(old), count_node_ids(new)
    axes["nodes_added"] += len(new_ids - old_ids)
    axes["nodes_removed"] += len(old_ids - new_ids)

    if is_decision_path(rel):
        axes["decisions_added"] += _decision_delta(minus, plus)

    if rel.endswith(".md"):
        sections, prose = _md_changes(old, new)
        axes["sections_rewritten"] += sections
        axes["prose_edits"] += prose
    else:
        # structured files: non-structural changed lines still count as prose edits
        axes["prose_edits"] += sum(
            1 for ln in plus if not STRUCTURAL.match(ln) and ln.strip()
        )


AXES = [
    "nodes_added",
    "nodes_removed",
    "status_changes",
    "profile_bars_changed",
    "decisions_added",
    "sections_rewritten",
    "prose_edits",
]


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument("--play", required=True)
    ap.add_argument("--product-base", required=True,
                    help="product base, e.g. .garura/product/ ; the tree is <base>product-os/")
    ap.add_argument("--base-ref", default="HEAD",
                    help="git ref the working tree is diffed against (default HEAD)")
    ap.add_argument("--out", help="write the shape JSON here (also printed)")
    args = ap.parse_args(argv)

    root = repo_root(args.product_base if os.path.isdir(args.product_base) else ".")
    tree_rel = rel_to_root(root, os.path.join(args.product_base, "product-os"))
    changed = git_changed(root, args.base_ref, tree_rel)

    axes = {a: 0 for a in AXES}

    for repo_rel in sorted(changed):
        status = changed[repo_rel]
        # product-os-relative path drives is_decision_path / is_profile_path, exactly as the
        # old draft-relative path did.
        rel = repo_rel[len(tree_rel) + 1:] if repo_rel.startswith(tree_rel + "/") else repo_rel
        if status == "A":                       # new file — same dispatch as the old draft mode
            lines = read_lines(os.path.join(root, repo_rel))
            if lines is None:
                continue
            ids = count_node_ids(lines)
            if is_decision_path(rel):
                axes["decisions_added"] += 1
            elif ids:
                axes["nodes_added"] += max(1, len(ids))
            else:
                classify_pair(rel, [], lines, axes)
        elif status == "D":                     # deletion — old lines vs empty
            old = git_show_lines(root, args.base_ref, repo_rel)
            if not old:
                continue
            classify_pair(rel, old, [], axes)
        else:                                   # modification
            old = git_show_lines(root, args.base_ref, repo_rel)
            new = read_lines(os.path.join(root, repo_rel))
            if new is None or old == new:
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
