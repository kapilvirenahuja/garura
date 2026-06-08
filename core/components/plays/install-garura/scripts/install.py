#!/usr/bin/env python3
"""
install.py — install Garura into a target project.

The mechanical hand of the `install-garura` play. The play decides and reports;
this script does the deterministic file work.

Model
-----
This installs THIS garura checkout into a **target** project — a directory
somewhere the user names. It reads garura's own `core/components/` (agents,
skills, plays, memory) and the source `.garura/core/config.yaml` + `CLAUDE.md`,
and lays them down so Claude Code can discover them in the target:

    python3 install.py --target <path>

  --target        the project directory to install into (a path, created if absent)
  --source        the garura checkout to install FROM (auto-derived if omitted)
  --memory-dest   where the shared memory goes (default ~/.garura/core/memory)
  --force-config  overwrite an existing target .garura/core/config.yaml
  --quiet         less output

What it lays down in the target:
  - .claude/agents/<id>.md     — one per garura agent
  - .claude/skills/<id>/        — one per garura skill (and per play; Claude has
                                  no separate play type, so plays land here too)
  - .garura/core/config.yaml    — transformed for the target (kept on re-run unless --force-config)
  - .garura/project/specs/      — empty STM scaffold
  - CLAUDE.md (or CLAUDE.md.new if one already exists)
  - .garura/install-manifest.json — exact record of what was placed, so
                                    uninstall can reverse precisely this set.

Shared memory goes to --memory-dest (default ~/.garura/core/memory), which is
machine-global and shared across projects. The manifest records the resolved
path so uninstall --purge removes exactly what was written.

Frontmatter is normalized on deploy: the `model:` sentinel line (a harness-only
hint such as `model: best`) is stripped from every deployed skill/play SKILL.md
and agent .md, since Claude Code does not understand it. Nothing else in the
artifact is rewritten — this is a faithful copy, not a transform.

Exit: 0 = installed, 2 = bad input / prerequisite missing.
Idempotent: re-running re-lays garura in place; it never duplicates.
"""

import argparse
import json
import os
import re
import shutil
import sys

EXCLUDED_SKILLS = set()  # skills present in source but never deployed


def fail(msg):
    sys.stderr.write(f"install.py: {msg}\n")
    sys.exit(2)


def info(quiet, msg):
    if not quiet:
        print(msg)


# --- small fs helpers ---------------------------------------------------------

def copy_tree_fresh(src, dest):
    """Replace dest with a fresh copy of src (idempotent, no stale files)."""
    if os.path.isdir(dest):
        shutil.rmtree(dest)
    shutil.copytree(src, dest)


def copy_tree_merge(src, dest):
    """Merge src into dest, overwriting overlapping files (for shared memory)."""
    os.makedirs(dest, exist_ok=True)
    shutil.copytree(src, dest, dirs_exist_ok=True)


def is_skippable(name):
    return name.startswith(".") or name.endswith(".bak") or name.startswith("_")


# --- frontmatter normalize ----------------------------------------------------

def normalize_frontmatter_file(path):
    """Strip the `model:` sentinel line from a file's leading --- frontmatter block.

    Claude Code does not understand garura's `model: best` harness hint; left in
    place it is at best ignored and at worst rejected. We remove only that line
    and leave the rest of the artifact byte-for-byte.
    """
    try:
        with open(path, encoding="utf-8") as fh:
            text = fh.read()
    except OSError:
        return
    m = re.match(r"(?s)^(---\n)(.*?)(\n---\n)(.*)$", text)
    if not m:
        return
    head, fm, tail, body = m.groups()
    new_fm = "\n".join(
        line for line in fm.splitlines() if not re.match(r"^model:\s", line)
    )
    if new_fm == fm:
        return
    with open(path, "w", encoding="utf-8") as fh:
        fh.write(head + new_fm + tail + body)


# --- locate the garura checkout (source root) ---------------------------------

def derive_source_root(explicit):
    """Find the garura checkout — the directory that holds core/components/ and
    .garura/core/config.yaml.

    With --source, trust it. Otherwise walk up from this script until a parent
    looks like a garura checkout. Walking-until-found is robust to how deep the
    play sits; a fixed up-N count silently breaks if the tree moves.
    """
    def looks_like_garura(root):
        return (os.path.isdir(os.path.join(root, "core", "components"))
                and os.path.isfile(os.path.join(root, ".garura", "core", "config.yaml")))

    if explicit:
        root = os.path.abspath(explicit)
        if not looks_like_garura(root):
            fail(f"{root} is not a garura checkout (need core/components/ and "
                 f".garura/core/config.yaml)")
        return root
    here = os.path.dirname(os.path.abspath(__file__))
    cur = here
    while True:
        if looks_like_garura(cur):
            return cur
        parent = os.path.dirname(cur)
        if parent == cur:
            fail(f"could not find a garura checkout above {here} — "
                 f"pass --source <garura-checkout>")
        cur = parent


# --- config transform ---------------------------------------------------------

def transform_config(content, project_name):
    """Transform garura's own config for a target project.

    name->project name, type->Project, component paths->.claude/*, memory->the
    shared ~/.garura, and drop the platform/github lines (a fresh project sets
    its own).
    """
    out_lines = []
    skip_github_block = False
    for line in content.splitlines():
        if re.match(r"^github:", line):
            skip_github_block = True
            continue
        if skip_github_block:
            if re.match(r"^\s+\S", line):  # still inside the block
                continue
            skip_github_block = False  # fall through to handle this line
        if re.match(r"^platform:", line):
            continue
        line = re.sub(r"^(\s*name:\s*).+$", r"\1" + project_name, line)
        line = re.sub(r"^(\s*type:\s*).+$", r"\1Project", line)
        line = re.sub(r"^(\s*skills:\s*).+$", r"\1./.claude/skills/", line)
        line = re.sub(r"^(\s*plays:\s*).+$", r"\1./.claude/skills/", line)
        line = re.sub(r"^(\s*agents:\s*).+$", r"\1./.claude/agents/", line)
        line = re.sub(r"^(\s*memory:\s*).+$", r"\1~/.garura/core/memory/", line)
        out_lines.append(line)
    text = "\n".join(out_lines)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip() + "\n"


# --- the install --------------------------------------------------------------

def install(source, target, force, quiet, memory_dest):
    components = os.path.join(source, "core", "components")
    if not os.path.isdir(components):
        fail(f"garura checkout at {source} has no core/components/")

    claude = os.path.join(target, ".claude")
    skills_dest = os.path.join(claude, "skills")
    agents_dest = os.path.join(claude, "agents")
    os.makedirs(skills_dest, exist_ok=True)
    os.makedirs(agents_dest, exist_ok=True)

    record = {"skills": [], "agents": [], "plays": [], "memory": None,
              "config": None, "claude_md": None}

    # 1. agents — single .md files
    src = os.path.join(components, "agents")
    if os.path.isdir(src):
        for name in sorted(os.listdir(src)):
            if is_skippable(name) or not name.endswith(".md"):
                continue
            dest = os.path.join(agents_dest, name)
            shutil.copy2(os.path.join(src, name), dest)
            normalize_frontmatter_file(dest)
            record["agents"].append(name)
        info(quiet, f"  agents: {len(record['agents'])}")

    # 2. skills — folders
    src = os.path.join(components, "skills")
    if os.path.isdir(src):
        for name in sorted(os.listdir(src)):
            if is_skippable(name) or name in EXCLUDED_SKILLS:
                continue
            sp = os.path.join(src, name)
            if os.path.isdir(sp):
                dest = os.path.join(skills_dest, name)
                copy_tree_fresh(sp, dest)
                normalize_frontmatter_file(os.path.join(dest, "SKILL.md"))
                record["skills"].append(name)
        info(quiet, f"  skills: {len(record['skills'])}")

    # 3. plays — folders, also land under .claude/skills (Claude has no play type)
    src = os.path.join(components, "plays")
    if os.path.isdir(src):
        for name in sorted(os.listdir(src)):
            if is_skippable(name):
                continue
            pp = os.path.join(src, name)
            if os.path.isdir(pp):
                dest = os.path.join(skills_dest, name)
                copy_tree_fresh(pp, dest)
                normalize_frontmatter_file(os.path.join(dest, "SKILL.md"))
                record["plays"].append(name)
        info(quiet, f"  plays: {len(record['plays'])}")

    # 4. memory — shared, into memory_dest (machine-global, not target-local)
    src = os.path.join(components, "memory")
    if os.path.isdir(src):
        mem_dest = os.path.abspath(os.path.expanduser(memory_dest))
        copy_tree_merge(src, mem_dest)
        record["memory"] = mem_dest
        info(quiet, f"  memory: {mem_dest}")

    # 5. target-local config.yaml (transformed); keep existing unless --force-config
    proj_core = os.path.join(target, ".garura", "core")
    os.makedirs(proj_core, exist_ok=True)
    cfg_dest = os.path.join(proj_core, "config.yaml")
    project_name = os.path.basename(os.path.abspath(target))
    src_cfg = os.path.join(source, ".garura", "core", "config.yaml")
    if os.path.isfile(src_cfg):
        if os.path.isfile(cfg_dest) and not force:
            info(quiet, "  config: kept existing")
        else:
            with open(src_cfg, encoding="utf-8") as fh:
                transformed = transform_config(fh.read(), project_name)
            with open(cfg_dest, "w", encoding="utf-8") as fh:
                fh.write(transformed)
            info(quiet, "  config: wrote .garura/core/config.yaml")
        record["config"] = ".garura/core/config.yaml"

    # 6. target STM scaffold
    os.makedirs(os.path.join(target, ".garura", "project", "specs"), exist_ok=True)

    # 7. CLAUDE.md — fresh if absent, else .new (never clobber the user's)
    src_md = os.path.join(source, "CLAUDE.md")
    if os.path.isfile(src_md):
        with open(src_md, encoding="utf-8") as fh:
            md = fh.read()
        if re.search(r"^# .*$", md, flags=re.MULTILINE):
            md = re.sub(r"^# .*$", f"# CLAUDE.md — {project_name}", md,
                        count=1, flags=re.MULTILINE)
        else:
            md = f"# CLAUDE.md — {project_name}\n\n" + md
        dest_md = os.path.join(target, "CLAUDE.md")
        if os.path.isfile(dest_md):
            with open(dest_md + ".new", "w", encoding="utf-8") as fh:
                fh.write(md)
            record["claude_md"] = "CLAUDE.md.new"
            info(quiet, "  CLAUDE.md: wrote CLAUDE.md.new (existing kept)")
        else:
            with open(dest_md, "w", encoding="utf-8") as fh:
                fh.write(md)
            record["claude_md"] = "CLAUDE.md"
            info(quiet, "  CLAUDE.md: wrote CLAUDE.md")

    return record


def write_manifest(target, record, quiet):
    os.makedirs(os.path.join(target, ".garura"), exist_ok=True)
    path = os.path.join(target, ".garura", "install-manifest.json")
    manifest = {"installer": "install-garura", "version": 1, "record": record}
    with open(path, "w", encoding="utf-8") as fh:
        json.dump(manifest, fh, indent=2)
        fh.write("\n")
    info(quiet, f"manifest: {path}")


def main(argv=None):
    ap = argparse.ArgumentParser(description="Install Garura into a target project.")
    ap.add_argument("--target", required=True, help="project directory to install into (a path)")
    ap.add_argument("--source", help="garura checkout to install from (auto-derived if omitted)")
    ap.add_argument("--memory-dest", default="~/.garura/core/memory",
                    help="where shared memory goes (default ~/.garura/core/memory)")
    ap.add_argument("--force-config", action="store_true",
                    help="overwrite an existing target .garura/core/config.yaml")
    ap.add_argument("--quiet", action="store_true")
    args = ap.parse_args(argv)

    source = derive_source_root(args.source)
    target = os.path.abspath(args.target)
    os.makedirs(target, exist_ok=True)

    info(args.quiet, f"installing garura ({source}) into {target}")
    record = install(source, target, args.force_config, args.quiet, args.memory_dest)
    write_manifest(target, record, args.quiet)

    n = len(record["skills"]) + len(record["plays"])
    info(args.quiet, f"\ndone — installed {len(record['agents'])} agent(s) and "
                     f"{n} skill/play(s) into {target}")


if __name__ == "__main__":
    main()
