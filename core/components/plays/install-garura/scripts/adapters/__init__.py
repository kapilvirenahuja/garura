#!/usr/bin/env python3
"""
adapters — host-tool install adapters.

Each adapter translates garura's neutral components into ONE host tool's native
surface and lays them into a target. The orchestrator (install.py) picks an
adapter by name (the `--tool` flag) and calls its uniform interface:

    adapter.NAME                         -> the tool name ("claude" | "codex")
    adapter.lay_components(components, target, info) -> (paths, counts, _)
    adapter.write_instruction_surface(md_text, project_name, target, info) -> filename|None
    adapter.write_global_config(info)    -> [absolute paths] of machine-global files written

`paths` are target-relative dirs/files the adapter created (so uninstall can
reverse them exactly). `write_global_config` is where a tool's machine-global
settings live (Codex model/sandbox profiles); Claude has none and returns [].
"""

from . import claude, codex

_ADAPTERS = {
    claude.NAME: claude,
    codex.NAME: codex,
}


def get_adapter(tool):
    """Return the adapter module for a tool name, or raise KeyError."""
    return _ADAPTERS[tool]


def known():
    return sorted(_ADAPTERS)
