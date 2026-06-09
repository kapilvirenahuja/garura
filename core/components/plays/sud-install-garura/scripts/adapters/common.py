#!/usr/bin/env python3
"""
adapters/common.py — shared helpers for the install adapters.

The install orchestrator owns the tool-agnostic work (memory, config, manifest,
STM scaffold). Each adapter owns one host tool's surface (Claude Code, Codex).
This module holds what both adapters need: frontmatter splitting, a model-tier
abstraction, and a few filesystem helpers. No third-party deps — this runs on a
consumer's machine at install time where PyYAML may be absent.

Model tiers
-----------
Garura artifacts carry a `model:` hint in their frontmatter (best / opus /
sonnet / haiku). That value is a *tier* signal, not a literal host model id. We
fold it to one of three neutral tiers, and each adapter maps the tier onto its
own host's real model selection:

    best, opus        -> deep      (most capable)
    sonnet            -> standard
    haiku             -> fast

This is the seam that lets one source serve both Claude and Codex.
"""

import os
import re
import shutil

# garura's source `model:` values -> neutral tier
MODEL_TIER = {
    "best": "deep",
    "deep": "deep",
    "opus": "deep",
    "sonnet": "standard",
    "standard": "standard",
    "haiku": "fast",
    "fast": "fast",
}
DEFAULT_TIER = "standard"

# skills present in source but never deployed to any host
EXCLUDED_SKILLS = set()


def tier_of(model_value):
    """Fold a garura `model:` value to a neutral tier. Unknown -> standard."""
    if not model_value:
        return DEFAULT_TIER
    return MODEL_TIER.get(str(model_value).strip().lower(), DEFAULT_TIER)


def skippable(name):
    """Source artifacts starting with `_`/`.` (templates, dotfiles) never deploy."""
    return name.startswith(".") or name.startswith("_") or name.endswith(".bak")


# --- filesystem helpers -------------------------------------------------------

def read_text(path):
    with open(path, encoding="utf-8") as fh:
        return fh.read()


def write_text(path, text):
    parent = os.path.dirname(path)
    if parent:
        os.makedirs(parent, exist_ok=True)
    with open(path, "w", encoding="utf-8") as fh:
        fh.write(text)


def copy_tree_fresh(src, dest):
    """Replace dest with a fresh copy of src (idempotent, no stale files)."""
    if os.path.isdir(dest):
        shutil.rmtree(dest)
    shutil.copytree(src, dest)


def copy_tree_merge(src, dest):
    """Merge src into dest, overwriting overlapping files (for shared memory)."""
    os.makedirs(dest, exist_ok=True)
    shutil.copytree(src, dest, dirs_exist_ok=True)


# --- frontmatter --------------------------------------------------------------

_FM_RE = re.compile(r"(?s)^(---\n)(.*?)(\n---\n?)(.*)$")


def split_frontmatter(text):
    """Return (head, fm, tail, body) for a `---`-fenced doc, else None.

    head is the opening fence ('---\\n'), fm is the inner frontmatter text
    (no surrounding newlines), tail is the closing fence ('\\n---\\n'), body is
    everything after. Reassembling head + fm + tail + body is a round-trip.
    """
    m = _FM_RE.match(text)
    if not m:
        return None
    return m.groups()


def frontmatter_value(fm, key):
    """Read a single top-level scalar from frontmatter text. None if absent.

    Deliberately small: handles `key: value` on one line, which is the shape
    garura's name/description/model fields use. Quotes are stripped.
    """
    if not fm:
        return None
    for line in fm.splitlines():
        m = re.match(rf"^{re.escape(key)}:\s*(.*)$", line)
        if m:
            return m.group(1).strip().strip("'\"")
    return None


def yaml_scalar(value):
    """Render a scalar safely as a single-line YAML value.

    Descriptions carry colons, quotes, and apostrophes. Single-quoted YAML is
    the robust single-line choice: everything inside is literal and the only
    escape is `'` -> `''`.
    """
    if value is None:
        return "''"
    special = any(c in value for c in (":", "#", "'", '"', "{", "}", "[", "]",
                                       ",", "&", "*", "!", "|", ">", "%", "@", "`"))
    if special or value.strip() != value or value == "":
        return "'" + value.replace("'", "''") + "'"
    return value


def retitle(md_text, new_h1):
    """Replace the document's first H1 with new_h1; prepend one if none exists."""
    if re.search(r"^# .*$", md_text, flags=re.MULTILINE):
        return re.sub(r"^# .*$", new_h1, md_text, count=1, flags=re.MULTILINE)
    return new_h1 + "\n\n" + md_text
