#!/usr/bin/env python3
"""
adapters/claude.py — the Claude Code adapter.

Lays garura's components into a target's `.claude/` tree:
  - agents -> .claude/agents/<id>.md
  - skills -> .claude/skills/<id>/   (whole folder, self-contained)
  - plays  -> .claude/skills/<id>/   (Claude has no play type)

Frontmatter transform (this is the part the old flat copier got wrong — it
stripped every `model:` line, so deployed agents lost their tier):
  - agents:       RESOLVE the model and KEEP it, so the agent runs on the
                  intended tier. `best` -> `opus`; the `opus`/`sonnet`/`haiku`
                  shorthands Claude Code accepts are passed through unchanged.
  - skills/plays: DROP the model line. A Claude skill has no model field — the
                  agent that invokes the skill carries the model.
Everything else in the frontmatter (tools, allowed-tools, user-invocable, …) is
left byte-for-byte; this is a faithful copy with one resolved field.
"""

import os
import re
import shutil

from . import common

NAME = "claude"

# garura tier-ish sentinels that Claude Code does NOT accept verbatim.
# Claude takes the bare shorthands opus/sonnet/haiku, so only `best`/`deep`
# need resolving. Anything already a shorthand or a literal id passes through.
_RESOLVE = {"best": "opus", "deep": "opus"}


def _resolve_model(value):
    if not value:
        return value
    v = value.strip()
    return _RESOLVE.get(v.lower(), v)


def _rewrite_md(path, *, drop_model):
    """Rewrite a SKILL.md/agent.md frontmatter in place: drop or resolve model."""
    parts = common.split_frontmatter(common.read_text(path))
    if not parts:
        return
    head, fm, tail, body = parts
    out = []
    for line in fm.splitlines():
        m = re.match(r"^model:\s*(.*)$", line)
        if m:
            if drop_model:
                continue
            out.append(f"model: {_resolve_model(m.group(1).strip())}")
            continue
        out.append(line)
    common.write_text(path, head + "\n".join(out) + tail + body)


def lay_components(components, target, info):
    claude = os.path.join(target, ".claude")
    skills_dest = os.path.join(claude, "skills")
    agents_dest = os.path.join(claude, "agents")
    os.makedirs(skills_dest, exist_ok=True)
    os.makedirs(agents_dest, exist_ok=True)

    paths = []
    counts = {"agents": 0, "skills": 0, "plays": 0}
    deprecated = 0

    # agents — single .md files; resolve + keep model
    src = os.path.join(components, "agents")
    if os.path.isdir(src):
        for name in sorted(os.listdir(src)):
            if common.skippable(name) or not name.endswith(".md"):
                continue
            if common.file_is_deprecated(os.path.join(src, name)):
                deprecated += 1
                continue
            dest = os.path.join(agents_dest, name)
            shutil.copy2(os.path.join(src, name), dest)
            _rewrite_md(dest, drop_model=False)
            paths.append(os.path.join(".claude", "agents", name))
            counts["agents"] += 1
        info(f"  agents: {counts['agents']}")

    # skills + plays — folders under .claude/skills; drop model
    for kind in ("skills", "plays"):
        src = os.path.join(components, kind)
        if not os.path.isdir(src):
            continue
        for name in sorted(os.listdir(src)):
            if common.skippable(name) or name in common.EXCLUDED_SKILLS:
                continue
            sp = os.path.join(src, name)
            # a folder without a SKILL.md is not an installable artifact
            # (dev/iteration leftovers); skip it rather than deploy a broken one
            if not os.path.isdir(sp) or not os.path.isfile(os.path.join(sp, "SKILL.md")):
                continue
            if common.file_is_deprecated(os.path.join(sp, "SKILL.md")):
                deprecated += 1
                continue
            dest = os.path.join(skills_dest, name)
            common.copy_tree_fresh(sp, dest)
            _rewrite_md(os.path.join(dest, "SKILL.md"), drop_model=True)
            paths.append(os.path.join(".claude", "skills", name))
            counts[kind] += 1
        info(f"  {kind}: {counts[kind]}")

    if deprecated:
        info(f"  (skipped {deprecated} deprecated component(s))")
    return paths, counts, []


def write_instruction_surface(md_text, project_name, target, info):
    """Claude reads CLAUDE.md. Retitle garura's; never clobber the user's own."""
    md = common.retitle(md_text, f"# CLAUDE.md — {project_name}")
    dest = os.path.join(target, "CLAUDE.md")
    if os.path.isfile(dest):
        common.write_text(dest + ".new", md)
        info("  CLAUDE.md: wrote CLAUDE.md.new (existing kept)")
        return "CLAUDE.md.new"
    common.write_text(dest, md)
    info("  CLAUDE.md: wrote CLAUDE.md")
    return "CLAUDE.md"


def write_global_config(info):
    """Claude Code has no machine-global model/sandbox config to write."""
    return []
