#!/usr/bin/env python3
"""
check_kb_grounding.py — assert a realize lens's PATTERN choices are grounded in the KB.

Shared across the realize lenses (arch / ux / agentic / run-style). A lens makes two kinds of
grounding: product-specific elements (a component, a screen, an axis) trace to the slice's hub
(ICE / persona / journey / profile) — that is the validate_*.py job; and PATTERN choices (the
system shape, the visual core, the control approach, the rollout strategy) must trace to a
best-fit learning on the KB's architecture/ or technology/ shelf — "what has worked for us",
not the model's taste. This script enforces the second kind.

It reads the draft manifest's `choices:` block — the list of pattern decisions the author made,
each with a `grounds:` naming either a KB learning (`source_type: kb`, e.g.
`architecture/microservices`) that resolves under --kb-root, or a recorded gap proposal
(`source_type: proposal`) whose file exists. Every choice must carry one or the other; none may
rest on the model's taste alone.

Layer rule: reads files on disk only; no git/gh/network.

    python3 check_kb_grounding.py --manifest <lens-manifest.yaml> [--kb-root <knowledge dir>] \
            [--proposals-dir <dir>]

Prints {ok, errors[], choices} JSON. Exit 0 when every choice is KB-grounded, 1 otherwise,
2 on usage/parse error.
"""

import argparse
import json
import os
import sys

try:
    import yaml
except ImportError:
    sys.stderr.write("check_kb_grounding.py: PyYAML is required (pip install pyyaml).\n")
    sys.exit(2)

GROUNDED_SHELVES = ("architecture/", "technology/")


def _kb_learning_exists(kb_root, learning_id):
    return os.path.isfile(os.path.join(kb_root, f"{learning_id}.md"))


def _find_choices(doc):
    """Find the `choices` list: under the single top-level mapping value, or at root."""
    if not isinstance(doc, dict):
        return None
    if "choices" in doc:
        return doc.get("choices")
    for v in doc.values():
        if isinstance(v, dict) and "choices" in v:
            return v.get("choices")
    return None


def _grounded(label, grounds, proposals_dir, kb_root, errors):
    if not grounds:
        errors.append(f"{label}: no grounding — neither a KB learning nor a proposal (C/F: KB grounding)")
        return "ungrounded"
    for e in grounds:
        st = (e.get("source_type") or "").strip().lower()
        src = e.get("source")
        if st == "kb" and src:
            if kb_root and not _kb_learning_exists(kb_root, src):
                errors.append(f"{label}: KB learning '{src}' named but not found under {kb_root}")
                return "kb-missing"
            if kb_root is None and not src.startswith(GROUNDED_SHELVES):
                errors.append(f"{label}: KB source '{src}' is not on the architecture/ or technology/ shelf")
                return "kb-offshelf"
            return f"kb: {src}"
        if st == "proposal" and src:
            candidate = src
            if proposals_dir and not os.path.isabs(src):
                candidate = os.path.join(proposals_dir, os.path.basename(src))
            if os.path.isfile(candidate) or os.path.isfile(src):
                return f"proposal: {src}"
            errors.append(f"{label}: proposal named but file not found ({src})")
            return "proposal-missing"
    errors.append(f"{label}: no KB learning or proposal among its grounding entries")
    return "ungrounded"


def main(argv=None):
    ap = argparse.ArgumentParser(description="Check a realize lens's KB grounding.")
    ap.add_argument("--manifest", required=True)
    ap.add_argument("--kb-root", default=None,
                    help="the knowledge/ dir, to confirm a named KB learning exists")
    ap.add_argument("--proposals-dir", default=None)
    args = ap.parse_args(argv)

    try:
        with open(args.manifest, encoding="utf-8") as fh:
            doc = yaml.safe_load(fh) or {}
    except OSError as exc:
        sys.stderr.write(f"check_kb_grounding.py: cannot read manifest: {exc}\n")
        sys.exit(2)
    except yaml.YAMLError as exc:
        sys.stderr.write(f"check_kb_grounding.py: manifest parse error: {exc}\n")
        sys.exit(2)

    choices = _find_choices(doc)
    errors = []
    report = []

    if not choices:
        errors.append("manifest has no `choices:` block — the lens must record at least one "
                      "KB-grounded pattern choice")
        choices = []

    for ch in choices:
        name = ch.get("choice") or ch.get("aspect") or ch.get("name") or "<choice>"
        status = _grounded(f"choice '{name}'", ch.get("grounds"), args.proposals_dir,
                           args.kb_root, errors)
        report.append({"choice": name, "grounding": status})

    result = {"ok": not errors, "errors": errors, "choices": report}
    print(json.dumps(result, indent=2))
    return 0 if not errors else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
