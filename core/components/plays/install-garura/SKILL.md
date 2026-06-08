---
name: install-garura
description: 'Install Garura into a target project or repository so its skills, agents, and plays become discoverable by Claude Code. Reads this garura checkout''s core/components and lays them down in the target''s .claude/ (skills + agents) plus a .garura/ tooling tree (config + STM scaffold), and copies shared memory to the machine-global ~/.garura. Records an install manifest so uninstall-garura can reverse exactly what was placed. Use when the user wants to install, set up, bootstrap, add, or enable Garura in another folder or repo — "install garura into X", "set up garura in this repo", "bootstrap garura", "make Claude see the garura skills in my project". Takes the target path as its argument. For the reverse, see uninstall-garura.'
user-invocable: true
---

# install-garura

Install **this** garura checkout into a **target** project so Claude Code can discover and
run its skills, agents, and plays there. You run this from the garura repo (where the source
lives); the target is some other folder or repo the user names.

After a successful install the target has the same two trees garura itself has: a `.claude/`
tree of discoverable skills and agents, and a `.garura/` tooling tree (config + an STM
scaffold). Shared memory (the standards/KB) goes to the machine-global `~/.garura`.

## How this play is built (read this first)

This is a **bootstrap meta-play** — like play-creator, it is hand-authored, not compiled
from an ICE source, and it is **harness-led**: the play decides and reports, a bundled
script does the deterministic file work. The mechanical install — walking the source tree,
copying skills/agents/plays, normalizing frontmatter, transforming the config, writing the
manifest — lives in [`scripts/install.py`](scripts/install.py). Don't re-implement that work
in prose; call the script and reason about its result.

## What "installed" means

`install.py` produces, in the target:

- `.claude/agents/<id>.md` — one per garura agent.
- `.claude/skills/<id>/` — one per garura skill, and one per garura **play** (Claude Code
  has no separate play type, so plays land under `skills/` too), copied whole with their own
  `references/` and `scripts/` so each stays self-contained.
- `.garura/core/config.yaml` — garura's config transformed for the target (its name, type
  `Project`, component paths pointed at `.claude/*`, memory at `~/.garura/core/memory/`, the
  `platform`/`github` lines dropped so the target sets its own). An existing config is
  **kept** on re-run unless you pass `--force-config`.
- `.garura/project/specs/` — an empty STM scaffold.
- `CLAUDE.md` — garura's, retitled for the target; written as `CLAUDE.md.new` if the target
  already has one (the user's is never clobbered).
- `.garura/install-manifest.json` — the exact list of what was placed, so
  `uninstall-garura` can reverse precisely this set.

**Frontmatter is normalized on deploy:** the `model:` sentinel line (a harness-only hint such
as `model: best`) is stripped from every deployed skill/play SKILL.md and agent .md, because
Claude Code does not understand it. Nothing else is rewritten — it is a faithful copy.

**Shared memory** goes to `--memory-dest` (default `~/.garura/core/memory`), which is
machine-global and shared across projects. The manifest records the resolved path so
`uninstall-garura --purge` removes exactly what was written. Source artifacts whose name
starts with `_` or `.` (templates, dotfiles) are skipped.

## Pre-flight

Before running, confirm:

1. **A target is named.** The user must say which folder/repo to install into. If they
   didn't, ask — don't guess. The target is created if absent.
2. **You're in (or can point at) the garura checkout.** The script auto-derives the source
   by walking up until it finds a directory with `core/components/` and
   `.garura/core/config.yaml`. When run detached from source (e.g. from an installed copy),
   pass `--source <garura-checkout>`.
3. **Python 3 is available.** The script is Python 3, no third-party packages.

If a pre-flight fails, say what's missing in plain words and stop.

## Run it

From the garura repo root the source is auto-derived; you normally only pass `--target`:

```
python3 core/components/plays/install-garura/scripts/install.py --target <path-to-target>
```

Options:
- `--source <garura-checkout>` — point at the garura checkout explicitly (needed only when
  the script can't sit beside the source).
- `--memory-dest <path>` — where shared memory goes (default `~/.garura/core/memory`). Point
  it at a temp dir for a dry test so you never touch the real machine KB.
- `--force-config` — overwrite an existing target `.garura/core/config.yaml` instead of
  keeping it.
- `--quiet` — less output.

The script is **idempotent**: re-running re-lays the skills/agents/plays in place and
refreshes the shared memory, but preserves an existing config unless forced. Re-running never
produces duplicates.

## Report back

After the script returns, read the printed summary and the written
`.garura/install-manifest.json`, then tell the user in plain language:

- which target it installed into,
- how many agents and skills/plays were installed,
- whether a config was written fresh or an existing one was kept,
- where the shared memory went,
- the one next step: open the target in Claude Code and the garura skills/agents are now
  discoverable.

Keep it short. The detail lives in the manifest; your job is the human summary.

## Boundaries

- **Never hand-edit an installed copy** under a target's `.claude/`. It is generated — edit
  the garura source and re-install.
- **Don't delete the user's own files.** Install only writes the Garura/Claude artifacts named
  above. Removing them is `uninstall-garura`'s job, and even that reverses only what the
  manifest records.
- **Protect the shared memory.** `~/.garura/core/memory` is machine-global and merged into,
  never wiped, on install. When testing, redirect `--memory-dest` to a temp dir.
