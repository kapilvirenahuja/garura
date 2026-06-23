#!/usr/bin/env python3
"""
uninstall.py — remove Garura from a target project.

The mechanical hand of the `uninstall-garura` play, and the exact reverse of
`sud:install-garura`. It reads the target's `.garura/install-manifest.json` — which
records every skill/agent/play/config/CLAUDE.md/memory path install placed — and
removes precisely that set. It never guesses and never deletes a file it cannot
prove the installer created.

    python3 uninstall.py --target <path> [--purge] [--dry-run] [--quiet]

  --target    the project directory to uninstall from (a path)
  --purge     also remove the SHARED memory recorded in the manifest
  --dry-run   report what would be removed; change nothing
  --quiet     less output

Two safety rules shape the default:

1. **Shared memory is left alone.** install writes memory to a machine-global
   path (default ~/.garura/core/memory), shared across every project on the
   machine. Deleting it on one project's uninstall would yank it from the others.
   The default keeps it; `--purge` is the explicit opt-in to remove exactly the
   path the manifest recorded.

2. **The target's own STM is left alone.** Anything under `.garura/project/` the
   user produced is their work, not an install artifact. Uninstall removes the
   config and manifest it wrote and prunes empty shells, but never deletes work.

Exit: 0 = done (including nothing-to-do), 2 = bad input.
Idempotent: with no manifest it reports nothing to do and exits 0.
"""

import argparse
import json
import os
import shutil
import sys


def fail(msg):
    sys.stderr.write(f"uninstall.py: {msg}\n")
    sys.exit(2)


def info(quiet, msg):
    if not quiet:
        print(msg)


def rm_dir(path, removed, dry):
    if os.path.isdir(path):
        if not dry:
            shutil.rmtree(path)
        removed.append(path)
        return True
    return False


def rm_file(path, removed, dry):
    if os.path.isfile(path):
        if not dry:
            os.remove(path)
        removed.append(path)
        return True
    return False


def prune_empty(path, dry):
    if os.path.isdir(path) and not os.listdir(path):
        if not dry:
            os.rmdir(path)
        return True
    return False


def uninstall(target, *, purge, quiet, dry):
    man_path = os.path.join(target, ".garura", "install-manifest.json")
    if not os.path.isfile(man_path):
        info(quiet, f"nothing to do — no install manifest at {man_path}")
        return {"removed": [], "had_manifest": False}
    try:
        with open(man_path, encoding="utf-8") as fh:
            manifest = json.load(fh)
    except Exception as e:
        fail(f"manifest unreadable: {e}")

    rec = manifest.get("record", {})
    removed = []
    claude = os.path.join(target, ".claude")
    agents_dir = os.path.join(target, ".agents")

    if "components" in rec:
        # v2 manifest — the adapter-based installer records the exact
        # target-relative path of every component it wrote (claude: .claude/*,
        # codex: .agents/skills/*). Remove precisely those.
        for rel in rec.get("components", []):
            p = os.path.join(target, rel)
            if os.path.isdir(p):
                rm_dir(p, removed, dry)
            else:
                rm_file(p, removed, dry)
        # instruction surface: only the .new variant we wrote (never the user's
        # own CLAUDE.md / AGENTS.md)
        surface = rec.get("instruction_surface")
        if surface and surface.endswith(".new"):
            rm_file(os.path.join(target, surface), removed, dry)
        # machine-global host config (Codex model/sandbox profiles): purge-only,
        # exact paths, same rule as shared memory
        for g in rec.get("global_files", []):
            if purge:
                rm_file(g, removed, dry)
                info(quiet, f"  purged host config {g}")
            else:
                info(quiet, f"  kept host config {g} (use --purge to remove)")
    else:
        # v1 manifest — legacy flat copier (skills/plays/agents under .claude)
        for name in rec.get("skills", []) + rec.get("plays", []):
            rm_dir(os.path.join(claude, "skills", name), removed, dry)
        for name in rec.get("agents", []):
            rm_file(os.path.join(claude, "agents", name), removed, dry)
        if rec.get("claude_md") == "CLAUDE.md.new":
            rm_file(os.path.join(target, "CLAUDE.md.new"), removed, dry)

    # target-local config the installer wrote (both manifest formats)
    if rec.get("config"):
        rm_file(os.path.join(target, rec["config"]), removed, dry)
    # status-marker ignore rule the installer wrote (ADR 021)
    if rec.get("status_gitignore"):
        rm_file(os.path.join(target, rec["status_gitignore"]), removed, dry)
    # shared memory: only on explicit purge, and only the exact recorded path
    if rec.get("memory"):
        if purge:
            rm_dir(rec["memory"], removed, dry)
            info(quiet, f"  purged shared memory {rec['memory']}")
        else:
            info(quiet, f"  kept shared memory {rec['memory']} (use --purge to remove)")

    # remove the manifest itself
    rm_file(man_path, removed, dry)

    # prune empty shells (never touch a dir that still holds the user's work)
    for d in (
        os.path.join(claude, "skills"),
        os.path.join(claude, "agents"),
        claude,
        os.path.join(agents_dir, "skills"),
        agents_dir,
        os.path.join(target, ".garura", "core"),
        os.path.join(target, ".garura", "project", "specs"),
        os.path.join(target, ".garura", "project"),
        os.path.join(target, ".garura"),
    ):
        prune_empty(d, dry)

    return {"removed": removed, "had_manifest": True}


def main(argv=None):
    ap = argparse.ArgumentParser(description="Remove Garura from a target project.")
    ap.add_argument("--target", required=True, help="project directory to uninstall from")
    ap.add_argument("--purge", action="store_true",
                    help="also remove the shared memory recorded in the manifest")
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--quiet", action="store_true")
    args = ap.parse_args(argv)

    target = os.path.abspath(args.target)
    if not os.path.isdir(target):
        fail(f"target is not a directory: {target}")

    result = uninstall(target, purge=args.purge, quiet=args.quiet, dry=args.dry_run)
    if result["had_manifest"]:
        verb = "would remove" if args.dry_run else "removed"
        info(args.quiet, f"\ndone — {verb} {len(result['removed'])} item(s)"
                         + (" (dry run)" if args.dry_run else ""))


if __name__ == "__main__":
    main()
