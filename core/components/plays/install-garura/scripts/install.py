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

    python3 install.py --target <path> [--tool claude|codex] [--scope full|harness]

  --target        the project directory to install into (a path, created if absent)
  --tool          which host tool to target: claude (default) or codex
  --scope         which component set to install: full (default, everything) or
                  harness (meta plays + change chain + their workers only)
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
import shutil
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


# Status / resume markers are machine-local and never committed (ADR 021). This
# ignore file ships inside the .garura tree so the rule travels with every install,
# covering every status location under it (issue, realize, shaping, product _status).
STATUS_GITIGNORE = (
    "# Status / resume markers — machine-local, never committed (ADR 021).\n"
    "# Plays write these to resume; they sit locally and are never shared via git.\n"
    "# The durable record is the evidence system (_evidence/), never these.\n"
    "**/status/\n"
    "**/_status/\n"
)


# --- install scopes -----------------------------------------------------------

# A scope names WHICH components a target receives; everything else about the
# install (shared memory, config, STM scaffold, manifest) is unchanged. `full`
# is the default and installs every component. `harness` is for garura-style
# harness repos that must carry only the meta plays, the change chain, and the
# workers those plays dispatch — nothing product-facing. Membership is explicit
# and deterministic: when a kept play gains a new worker skill or agent, add it
# here in the same change.
SCOPES = {
    "full": None,  # no filter — every component installs
    "harness": {
        "plays": {
            "play-creator", "play-editor",
            "start-change", "commit-change", "propose-change",
            "review-change", "merge-change",
        },
        "skills": {
            "analyze-changes", "analyze-pr", "create-commit", "manage-issue",
            "merge-pr", "platform-adapter", "quality-check-scoped",
            "resolve-issues", "setup-branch", "submit-pr",
        },
        "agents": {
            "change-reviewer", "project-orchestrator",
            "quality-auditor", "repo-orchestrator",
        },
    },
}


# --- the install --------------------------------------------------------------

def install(source, target, tool, force, quiet, memory_dest, scope="full"):
    adapter = get_adapter(tool)
    components = os.path.join(source, "core", "components")
    if not os.path.isdir(components):
        fail(f"garura checkout at {source} has no core/components/")

    def _info(msg):
        info(quiet, msg)

    record = {
        "tool": tool,
        "scope": scope,
        "components": [],
        "counts": {},
        "instruction_surface": None,
        "config": None,
        "memory": None,
        "global_files": [],
    }

    # 1. components — the host surface, owned by the adapter; the scope filter
    #    decides which components the adapter may lay down
    allow = SCOPES[scope]
    paths, counts, _ = adapter.lay_components(components, target, _info, allow=allow)
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

    # 5b. status-marker ignore rule — keeps machine-local resume files out of git
    #     (ADR 021). Idempotent; overwritten on re-run to stay current with source.
    common.write_text(os.path.join(target, ".garura", ".gitignore"), STATUS_GITIGNORE)
    record["status_gitignore"] = ".garura/.gitignore"
    _info("  scaffold: wrote .garura/.gitignore (status markers)")

    # 6. instruction surface (CLAUDE.md / AGENTS.md) — owned by the adapter
    src_md = os.path.join(source, "CLAUDE.md")
    if os.path.isfile(src_md):
        record["instruction_surface"] = adapter.write_instruction_surface(
            common.read_text(src_md), project_name, target, _info)

    return record


def retire_stale(target, new_paths, quiet):
    """Manifest-driven retirement: a component the PREVIOUS install placed that
    this install did not re-place was renamed or retired in source — remove it,
    so renames/retirements never leave stale copies in the target (the
    grill-me / sud-install-garura lesson, #434). Only paths the prior manifest
    recorded are ever candidates — user-owned files are invisible to this —
    and only paths inside the target are ever touched. Must run BEFORE the new
    manifest overwrites the prior one."""
    path = os.path.join(target, ".garura", "install-manifest.json")
    if not os.path.isfile(path):
        return []
    try:
        with open(path, encoding="utf-8") as fh:
            prior = (json.load(fh).get("record") or {}).get("components") or []
    except (OSError, ValueError):
        return []
    base = os.path.abspath(target)
    removed = []
    for rel in sorted(set(prior) - set(new_paths)):
        full = os.path.normpath(os.path.join(base, rel))
        if not full.startswith(base + os.sep):
            continue  # never step outside the target
        if os.path.isdir(full):
            shutil.rmtree(full)
            removed.append(rel)
        elif os.path.isfile(full):
            os.remove(full)
            removed.append(rel)
    for rel in removed:
        info(quiet, f"  retired: {rel} (placed by a previous install, no longer in source)")
    return removed


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
    ap.add_argument("--scope", default="full", choices=sorted(SCOPES),
                    help="component set to install: full (default) or harness "
                         "(meta plays + change chain + their workers)")
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

    scoped = "" if args.scope == "full" else f" (scope: {args.scope})"
    info(args.quiet, f"installing garura ({source}) into {target} for {args.tool}{scoped}")
    record = install(source, target, args.tool, args.force_config, args.quiet,
                     args.memory_dest, scope=args.scope)
    record["retired"] = retire_stale(target, record["components"], args.quiet)
    write_manifest(target, record, args.quiet)

    c = record["counts"]
    n = c.get("skills", 0) + c.get("plays", 0)
    retired = f", retired {len(record['retired'])} stale" if record["retired"] else ""
    info(args.quiet, f"\ndone — installed {c.get('agents', 0)} agent(s) and "
                     f"{n} skill/play(s){retired} into {target} for {args.tool}")


if __name__ == "__main__":
    main()
