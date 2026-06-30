#!/usr/bin/env python3
"""
adapters/codex.py — the OpenAI Codex CLI adapter.

Codex differs from Claude Code in four load-bearing ways (verified against
developers.openai.com/codex, 2026), and this adapter absorbs all four:

  1. Skills live under `.agents/skills/<id>/SKILL.md` (NOT `.codex/skills/`),
     carrying only `name` + `description` frontmatter. A Codex skill has no
     `model:` or `tools:` field.
  2. There is no named-subagent file. So garura's agents have no 1:1 home —
     each garura agent is emitted as a Codex Agent Skill too (its persona body
     becomes the skill body), which keeps it invocable.
  3. Model, sandbox, and approval ('forking') are session/profile-level, set in
     the Codex home (`~/.codex`), not per artifact. So the per-skill tier can't
     be *pinned*; we record it as a one-line note in the skill body AND write
     three tier profiles + a base config into the Codex home so the user can run
     `codex --profile deep|standard|fast`.
  4. The frontmatter `description` is HARD-CAPPED at 1024 characters — Codex
     refuses to load a skill past it (openai/codex#13941), silently from the
     user's view: the folder sits in .agents/skills but the skill never appears.
     Claude Code has no such cap, so garura source descriptions may exceed it;
     this adapter truncates at a word boundary on emit (_cap_description).
     Found the hard way on token-burn-dash (#434): /run and /grill — the two
     longest descriptions — were the only skills Codex would not load.

The instruction surface is `AGENTS.md` at the target root (Codex's equivalent of
CLAUDE.md). Shared memory and garura's own `.garura/` tooling config are written
by the orchestrator and are tool-agnostic.
"""

import os
import shutil

from . import common

NAME = "codex"

CODEX_HOME = os.environ.get("CODEX_HOME") or os.path.expanduser("~/.codex")

# neutral tier -> Codex model selection (model id + reasoning effort).
# Identifiers per developers.openai.com/codex/models (2026):
#   deep -> gpt-5.5 (frontier)   standard -> gpt-5.4   fast -> gpt-5.4-mini
TIER_PROFILE = {
    "deep": {"model": "gpt-5.5", "effort": "xhigh"},
    "standard": {"model": "gpt-5.4", "effort": "medium"},
    "fast": {"model": "gpt-5.4-mini", "effort": "low"},
}


# --- per-skill emission -------------------------------------------------------

# Codex enforces description <= 1024 CHARACTERS and refuses to load the skill
# past it (developers.openai.com/codex/skills; openai/codex#13941). Claude has
# no such cap, so garura source descriptions may exceed it — the adapter's job
# is to absorb the difference: truncate at a word boundary, ellipsis appended.
DESC_MAX = 1024


def _cap_description(description):
    if len(description) <= DESC_MAX:
        return description
    cut = description[: DESC_MAX - 2]
    if " " in cut:
        cut = cut[: cut.rfind(" ")]
    return cut.rstrip(" ,;—-") + " …"


def _codex_skill_text(name, description, tier, body):
    prof = TIER_PROFILE[tier]
    fm = (
        "---\n"
        f"name: {name}\n"
        f"description: {common.yaml_scalar(_cap_description(description))}\n"
        "---\n"
    )
    # Codex can't pin a model per skill; leave the intended tier as guidance.
    note = (
        f"> Recommended Codex profile: `{tier}` — run "
        f"`codex --profile {tier}` ({prof['model']}, reasoning {prof['effort']}).\n"
    )
    return fm + "\n" + note + "\n" + body.lstrip("\n")


def _emit_skill(md_path, sid, src_dir, skills_root, paths):
    parts = common.split_frontmatter(common.read_text(md_path))
    if parts:
        _, fm, _, body = parts
    else:
        fm, body = "", common.read_text(md_path)
    name = common.frontmatter_value(fm, "name") or sid
    desc = common.frontmatter_value(fm, "description")
    # a folded/empty description leaves a marker char — fall back to the name
    if not desc or desc in (">", "|", ">-", "|-", ">+", "|+"):
        desc = name
    tier = common.tier_of(common.frontmatter_value(fm, "model"))

    out_dir = os.path.join(skills_root, sid)
    if os.path.isdir(out_dir):
        shutil.rmtree(out_dir)
    os.makedirs(out_dir, exist_ok=True)
    common.write_text(os.path.join(out_dir, "SKILL.md"),
                      _codex_skill_text(name, desc, tier, body))
    # carry a skill/play's own bundled dirs (agents have none)
    if src_dir:
        for sub in ("scripts", "references", "assets"):
            s = os.path.join(src_dir, sub)
            if os.path.isdir(s):
                shutil.copytree(s, os.path.join(out_dir, sub))
    paths.append(os.path.join(".agents", "skills", sid))


def lay_components(components, target, info):
    skills_root = os.path.join(target, ".agents", "skills")
    os.makedirs(skills_root, exist_ok=True)

    paths = []
    counts = {"agents": 0, "skills": 0, "plays": 0}
    deprecated = 0

    # skills + plays — folders with a SKILL.md
    for kind in ("skills", "plays"):
        src = os.path.join(components, kind)
        if not os.path.isdir(src):
            continue
        for name in sorted(os.listdir(src)):
            if common.skippable(name) or name in common.EXCLUDED_SKILLS:
                continue
            sp = os.path.join(src, name)
            md = os.path.join(sp, "SKILL.md")
            if not os.path.isdir(sp) or not os.path.isfile(md):
                continue
            if common.file_is_deprecated(md):
                deprecated += 1
                continue
            _emit_skill(md, name, sp, skills_root, paths)
            counts[kind] += 1
        info(f"  {kind}: {counts[kind]}")

    # agents — single .md files, each emitted as a Codex skill (no agent type)
    src = os.path.join(components, "agents")
    if os.path.isdir(src):
        for name in sorted(os.listdir(src)):
            if common.skippable(name) or not name.endswith(".md"):
                continue
            if common.file_is_deprecated(os.path.join(src, name)):
                deprecated += 1
                continue
            _emit_skill(os.path.join(src, name), name[:-3], None, skills_root, paths)
            counts["agents"] += 1
        info(f"  agents: {counts['agents']}")

    if deprecated:
        info(f"  (skipped {deprecated} deprecated component(s))")
    return paths, counts, []


def _recast_for_codex(md):
    """Garura's instruction surface is authored for Claude Code; the codex AGENTS.md must
    name its actual host. Recast the host references (specific intro phrasing first, then any
    remaining mention) so the file reads as Codex's, not Claude Code's."""
    md = md.replace("Claude Code (claude.ai/code)", "the OpenAI Codex CLI")
    md = md.replace("Claude Code", "Codex")
    return md


def write_instruction_surface(md_text, project_name, target, info):
    """Codex reads AGENTS.md. Retitle garura's, recast its host references; never clobber
    the user's own."""
    md = _recast_for_codex(common.retitle(md_text, f"# AGENTS.md — {project_name}"))
    dest = os.path.join(target, "AGENTS.md")
    if os.path.isfile(dest):
        common.write_text(dest + ".new", md)
        info("  AGENTS.md: wrote AGENTS.md.new (existing kept)")
        return "AGENTS.md.new"
    common.write_text(dest, md)
    info("  AGENTS.md: wrote AGENTS.md")
    return "AGENTS.md"


# --- machine-global Codex config (model / sandbox / approval) -----------------

_BASE_CONFIG = (
    "# Written by garura install-garura (codex adapter). Safe to edit.\n"
    "# Base defaults; the deep/standard/fast profiles override per run.\n"
    'model = "gpt-5.4"\n'
    'model_reasoning_effort = "medium"\n'
    'approval_policy = "on-request"\n'
    'sandbox_mode = "workspace-write"\n'
    'web_search = "cached"\n'
)


def _profile_toml(tier, prof):
    return (
        f"# garura tier profile: {tier}. Use with: codex --profile {tier}\n"
        f'model = "{prof["model"]}"\n'
        f'model_reasoning_effort = "{prof["effort"]}"\n'
        'approval_policy = "on-request"\n'
        'sandbox_mode = "workspace-write"\n'
    )


def write_global_config(info):
    """Write base config + the three tier profiles into the Codex home.

    Machine-global, like shared memory. Never clobbers an existing file (the
    user's own settings win); only the files this run *creates* are returned, so
    uninstall --purge removes exactly those.
    """
    created = []
    os.makedirs(CODEX_HOME, exist_ok=True)

    base = os.path.join(CODEX_HOME, "config.toml")
    if os.path.isfile(base):
        info(f"  codex config: kept existing {base}")
    else:
        common.write_text(base, _BASE_CONFIG)
        created.append(base)
        info(f"  codex config: wrote {base}")

    for tier, prof in TIER_PROFILE.items():
        p = os.path.join(CODEX_HOME, f"{tier}.config.toml")
        if os.path.isfile(p):
            info(f"  codex profile: kept existing {tier}.config.toml")
        else:
            common.write_text(p, _profile_toml(tier, prof))
            created.append(p)
            info(f"  codex profile: wrote {tier}.config.toml ({prof['model']})")

    return created
