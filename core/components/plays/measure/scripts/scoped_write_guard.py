#!/usr/bin/env python3
"""
scoped_write_guard.py — the shared post-write containment guard for direct-model-write
plays (ADR 026, standards/rules/direct-model-write.md).

Under direct-model-write there is no draft/ copy and no apply_<play>.py that "cannot"
write outside scope by construction. Containment is instead a post-write, detect-and-revert
guard over the real product-os tree on the feature branch: after a play's writes, this
script diffs the model tree against the branch base and FAILS the run (or, on --restore,
reverts) if any changed model path falls outside the run's declared write scope.

Canonical copy lives at play-creator/references/scoped_write_guard.py and is stamped
into each model-writing play's scripts/ (same convention as preflight.py,
session_stamp.py, classify_change.py).

    python3 scripts/scoped_write_guard.py
        --product-base <product_base>
        --base-ref HEAD
        --allow <glob> [--allow <glob> ...]       # paths this run MAY change (add or modify)
        [--add-only <glob> ...]                   # paths that may be ADDED but not modified
        [--restore]                               # revert violations instead of only reporting
        [--out <report.json>]

Behavior:
  - Compute the set of model paths changed vs --base-ref (tracked modifications +
    tracked/untracked additions + tracked deletions) under <product_base>product-os/.
  - A path is IN SCOPE iff it matches an --allow glob; a path matching an --add-only glob
    is in scope only when it is a NEW file (added). A modification of an existing file that
    matches only --add-only is a VIOLATION.
  - Without --restore: exit non-zero and list every out-of-scope path (the play halts).
  - With --restore: `git restore`/`git checkout` each out-of-scope tracked path to its
    base-ref content, remove each out-of-scope new/untracked file, then exit 0 (the
    checkpoint-cancel path reuses this with an EMPTY allow set to revert the whole change).
  - Always writes guard-report.json (when --out is given) with an `ok` boolean and the
    violation list.

Globs are matched with fnmatch against BOTH the repo-relative path git reports AND the
path relative to <product_base>product-os/, so a play may declare either form. Note that
fnmatch `*` crosses `/` (so `product-os/*/checkout/*` matches nested docs); `**` is NOT
special.

Layer rule: pure git/file ops; no gh/network.

Exit: 0 = ok (or restored); 1 = violations found (report-only mode); 2 = usage/git error.
"""

import argparse
import fnmatch
import json
import os
import subprocess
import sys


def fail(msg):
    sys.stderr.write(f"scoped_write_guard.py: {msg}\n")
    sys.exit(2)


def git(root, *args):
    """Run a git command at root; return (rc, stdout)."""
    proc = subprocess.run(
        ["git", "-C", root, *args],
        capture_output=True, text=True,
    )
    return proc.returncode, proc.stdout


def repo_root(start):
    proc = subprocess.run(
        ["git", "-C", start, "rev-parse", "--show-toplevel"],
        capture_output=True, text=True,
    )
    if proc.returncode != 0:
        fail(f"not a git repo at {start}: {proc.stderr.strip()}")
    return proc.stdout.strip()


def rel_to_root(root, path):
    """The path relative to the git repo root, POSIX-style.

    realpath both sides: git rev-parse resolves symlinks (e.g. macOS /var -> /private/var)
    while a passed-in path may not, which would otherwise yield a broken ../../.. relpath.
    """
    return os.path.relpath(os.path.realpath(path), os.path.realpath(root)).replace(os.sep, "/")


def changed_paths(root, base_ref, tree_rel):
    """
    Every model path under tree_rel that changed vs base_ref.

    Returns a dict: repo_rel_path -> status in {"A", "M", "D"} ("A" = new/added).
    Unions tracked changes (git diff --name-status) with untracked additions
    (git ls-files --others) — untracked files are invisible to `git diff`, and a
    direct-write play creates new docs/decisions as untracked files, so they MUST be
    included or the guard silently misses them.
    """
    out = {}

    rc, diff = git(root, "diff", "--name-status", base_ref, "--", tree_rel)
    if rc != 0:
        fail(f"git diff against {base_ref} failed under {tree_rel}")
    for line in diff.splitlines():
        if not line.strip():
            continue
        parts = line.split("\t")
        code = parts[0].strip()
        # Rename/copy carry a score (e.g. R100); take the destination path.
        path = parts[-1].strip()
        status = code[0]  # A, M, D, R, C, T ...
        if status == "R" or status == "C":
            out[path] = "A"      # the destination is effectively a new path here
        elif status in ("A", "M", "D", "T"):
            out[path] = "M" if status == "T" else status
        else:
            out[path] = "M"

    rc, others = git(root, "ls-files", "--others", "--exclude-standard", "--", tree_rel)
    if rc != 0:
        fail(f"git ls-files --others failed under {tree_rel}")
    for line in others.splitlines():
        p = line.strip()
        if p:
            out[p] = "A"

    return out


def in_globs(path_variants, globs):
    return any(fnmatch.fnmatch(p, g) for p in path_variants for g in globs)


def exists_at_ref(root, base_ref, path):
    rc, _ = git(root, "cat-file", "-e", f"{base_ref}:{path}")
    return rc == 0


def restore_path(root, base_ref, path):
    """Revert one out-of-scope path to its base-ref state."""
    if exists_at_ref(root, base_ref, path):
        # tracked & existed at base: restore worktree (and unstage) to base content
        rc, _ = git(root, "restore", "--source", base_ref, "--staged", "--worktree", "--", path)
        if rc != 0:
            git(root, "checkout", base_ref, "--", path)
        return "restored"
    # new at base: drop it entirely
    git(root, "rm", "-f", "--cached", "--ignore-unmatch", "--", path)
    abspath = os.path.join(root, path)
    if os.path.isfile(abspath):
        os.remove(abspath)
    return "removed"


def main(argv=None):
    ap = argparse.ArgumentParser(description="Post-write scoped containment guard (ADR 026).")
    ap.add_argument("--product-base", required=True,
                    help="product base, e.g. .garura/product/ ; the tree is <base>product-os/")
    ap.add_argument("--base-ref", default="HEAD", help="git ref the model tree is diffed against")
    ap.add_argument("--allow", action="append", default=[],
                    help="glob a changed path MAY match (add or modify); repeatable")
    ap.add_argument("--add-only", action="append", default=[],
                    help="glob a changed path may match only when it is a NEW file; repeatable")
    ap.add_argument("--restore", action="store_true",
                    help="revert out-of-scope paths instead of only reporting")
    ap.add_argument("--out", help="write guard-report.json here (also printed)")
    args = ap.parse_args(argv)

    root = repo_root(args.product_base if os.path.isdir(args.product_base) else ".")
    tree_abs = os.path.join(args.product_base, "product-os")
    tree_rel = rel_to_root(root, tree_abs)              # e.g. .garura/product/product-os
    base_rel = rel_to_root(root, args.product_base)     # e.g. .garura/product

    changed = changed_paths(root, args.base_ref, tree_rel)

    violations = []
    restored = []
    for path, status in sorted(changed.items()):
        # A changed path is offered to fnmatch in three forms so a play may declare its
        # scope globs in whichever is natural: the full repo-relative path, the path
        # relative to product_base (starts with `product-os/`), and the path relative to
        # the product-os tree itself.
        variants = [path]
        base_prefix = base_rel + "/"
        if base_rel not in ("", ".") and path.startswith(base_prefix):
            variants.append(path[len(base_prefix):])
        elif base_rel in ("", "."):
            variants.append(path)
        tree_prefix = tree_rel + "/"
        if path.startswith(tree_prefix):
            variants.append(path[len(tree_prefix):])
        is_new = status == "A"
        allowed = in_globs(variants, args.allow)
        add_only = in_globs(variants, args.add_only)
        in_scope = allowed or (add_only and is_new)
        if in_scope:
            continue
        reason = "out-of-scope"
        if add_only and not is_new:
            reason = "modification of an add-only path"
        violations.append({"path": path, "status": status, "reason": reason})
        if args.restore:
            action = restore_path(root, args.base_ref, path)
            restored.append({"path": path, "action": action})

    ok = not violations if not args.restore else True
    report = {
        "ok": ok,
        "base_ref": args.base_ref,
        "tree": tree_rel,
        "allow": args.allow,
        "add_only": args.add_only,
        "restore": args.restore,
        "changed": [{"path": p, "status": s} for p, s in sorted(changed.items())],
        "violations": violations,
        "restored": restored,
    }
    text = json.dumps(report, indent=2)
    if args.out:
        os.makedirs(os.path.dirname(os.path.abspath(args.out)), exist_ok=True)
        with open(args.out, "w", encoding="utf-8") as fh:
            fh.write(text + "\n")
    print(text)

    if args.restore:
        return 0
    return 0 if not violations else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
