#!/usr/bin/env python3
"""
install.py — install Garura into a target project, for a chosen host tool.

The mechanical hand of the `install-garura` play. The play decides and
reports; this script does the deterministic file work.

Model
-----
This installs THIS garura checkout into a **target** project — a directory the
user names. It reads garura's `core/components/` (agents, skills, plays, memory)
and the source `.garura/core/config.yaml` + `CLAUDE.md`, and lays them down so a
host coding tool can discover them in the target.

    python3 install.py --target <path> [--tool claude|codex]

  --target        the project directory to install into (a path, created if absent)
  --tool          which host tool to target: claude (default) or codex
  --source        the garura checkout to install FROM (auto-derived if omitted)
  --memory-dest   where shared memory goes (default ~/.garura/core/memory)
  --force-config  overwrite an existing target .garura/core/config.yaml
  --quiet         less output

Adapters
--------
The per-tool transform is NOT here. It lives in `adapters/<tool>.py`, and this
orchestrator selects one by `--tool` and delegates the host surface to it:

  - claude: resolves model tiers to Claude models, lays `.claude/skills` +
    `.claude/agents`, writes CLAUDE.md.
  - codex: lays `.agents/skills` (skills, plays, AND agents — Codex has no agent
    type), writes AGENTS.md, and writes model/sandbox/approval profiles into the
    Codex home so the tier the user wanted is actually selectable.

The orchestrator owns the tool-agnostic work: shared memory, garura's own
`.garura/core/config.yaml`, the STM scaffold, and the install manifest.

Exit: 0 = installed, 2 = bad input / prerequisite missing.
Idempotent: re-running re-lays garura in place; it never duplicates.
"""

import argparse
import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from adapters import common, get_adapter, known  # noqa: E402


def fail(msg):
    sys.stderr.write(f"install.py: {msg}\n")
    sys.exit(2)


def info(quiet, msg):
    if not quiet:
        print(msg)


# --- locate the garura checkout (source root) ---------------------------------

def derive_source_root(explicit):
    """Find the garura checkout — holds core/components/ and .garura/core/config.yaml.

    With --source, trust it. Otherwise walk up from this script until a parent
    looks like a garura checkout.
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

# where each host tool installs components, for garura's own config.yaml pointers
_COMPONENT_PATHS = {
    "claude": {"skills": "./.claude/skills/", "plays": "./.claude/skills/",
               "agents": "./.claude/agents/"},
    "codex": {"skills": "./.agents/skills/", "plays": "./.agents/skills/",
              "agents": "./.agents/skills/"},
}


def transform_config(content, project_name, tool):
    """Transform garura's own config for a target project + host tool.

    name->project name, type->Project, component paths->the tool's install
    location, memory->the shared ~/.garura, and drop the platform/github lines
    (a fresh project sets its own).
    """
    cp = _COMPONENT_PATHS[tool]
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
        line = re.sub(r"^(\s*skills:\s*).+$", r"\1" + cp["skills"], line)
        line = re.sub(r"^(\s*plays:\s*).+$", r"\1" + cp["plays"], line)
        line = re.sub(r"^(\s*agents:\s*).+$", r"\1" + cp["agents"], line)
        line = re.sub(r"^(\s*memory:\s*).+$", r"\1~/.garura/core/memory/", line)
        out_lines.append(line)
    text = "\n".join(out_lines)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip() + "\n"


# --- the install --------------------------------------------------------------

def install(source, target, tool, force, quiet, memory_dest):
    adapter = get_adapter(tool)
    components = os.path.join(source, "core", "components")
    if not os.path.isdir(components):
        fail(f"garura checkout at {source} has no core/components/")

    def _info(msg):
        info(quiet, msg)

    record = {
        "tool": tool,
        "components": [],
        "counts": {},
        "instruction_surface": None,
        "config": None,
        "memory": None,
        "global_files": [],
    }

    # 1. components — the host surface, owned by the adapter
    paths, counts, _ = adapter.lay_components(components, target, _info)
    record["components"] = paths
    record["counts"] = counts

    # 2. machine-global host config (Codex profiles; Claude: none)
    record["global_files"] = adapter.write_global_config(_info)

    # 3. shared memory — machine-global, tool-agnostic
    src = os.path.join(components, "memory")
    if os.path.isdir(src):
        mem_dest = os.path.abspath(os.path.expanduser(memory_dest))
        common.copy_tree_merge(src, mem_dest)
        record["memory"] = mem_dest
        _info(f"  memory: {mem_dest}")

    # 4. target-local garura config.yaml (transformed); keep existing unless forced
    proj_core = os.path.join(target, ".garura", "core")
    os.makedirs(proj_core, exist_ok=True)
    cfg_dest = os.path.join(proj_core, "config.yaml")
    project_name = os.path.basename(os.path.abspath(target))
    src_cfg = os.path.join(source, ".garura", "core", "config.yaml")
    if os.path.isfile(src_cfg):
        if os.path.isfile(cfg_dest) and not force:
            _info("  config: kept existing")
        else:
            transformed = transform_config(common.read_text(src_cfg), project_name, tool)
            common.write_text(cfg_dest, transformed)
            _info("  config: wrote .garura/core/config.yaml")
        record["config"] = ".garura/core/config.yaml"

    # 5. target STM scaffold
    os.makedirs(os.path.join(target, ".garura", "project", "specs"), exist_ok=True)

    # 6. instruction surface (CLAUDE.md / AGENTS.md) — owned by the adapter
    src_md = os.path.join(source, "CLAUDE.md")
    if os.path.isfile(src_md):
        record["instruction_surface"] = adapter.write_instruction_surface(
            common.read_text(src_md), project_name, target, _info)

    return record


def write_manifest(target, record, quiet):
    os.makedirs(os.path.join(target, ".garura"), exist_ok=True)
    path = os.path.join(target, ".garura", "install-manifest.json")
    manifest = {"installer": "install-garura", "version": 2, "record": record}
    with open(path, "w", encoding="utf-8") as fh:
        json.dump(manifest, fh, indent=2)
        fh.write("\n")
    info(quiet, f"manifest: {path}")


def main(argv=None):
    ap = argparse.ArgumentParser(description="Install Garura into a target project.")
    ap.add_argument("--target", required=True, help="project directory to install into (a path)")
    ap.add_argument("--tool", default="claude", choices=known(),
                    help="host tool to target (default: claude)")
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

    info(args.quiet, f"installing garura ({source}) into {target} for {args.tool}")
    record = install(source, target, args.tool, args.force_config, args.quiet, args.memory_dest)
    write_manifest(target, record, args.quiet)

    c = record["counts"]
    n = c.get("skills", 0) + c.get("plays", 0)
    info(args.quiet, f"\ndone — installed {c.get('agents', 0)} agent(s) and "
                     f"{n} skill/play(s) into {target} for {args.tool}")


if __name__ == "__main__":
    main()
