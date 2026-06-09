#!/usr/bin/env python3
"""
grounding_check.py — assert every /run operational choice is grounded in the KB (C4/F4).

/run must never invent an operational choice. Each material choice (rollout strategy,
migration stance, environment topology, CI/CD shape, runtime pick) and each per-component
target either matched a KB learning on the architecture or technology shelf (source_type
`kb`) or was raised as a KB-learning-gap proposal (source_type `proposal`). This script reads
the run-manifest author-run-lens wrote and asserts that every choice and target carries one or
the other — and, when a proposal is named, that the proposal file exists; when a KB learning is
named and --kb-root is given, that the learning file exists on a shelf.

Layer rule: reads files on disk only; no git/gh/network.

    python3 grounding_check.py --manifest <run-manifest.yaml> [--proposals-dir <dir>] \
            [--kb-root <knowledge dir>]

Prints {ok, errors[], items} JSON. Exit 0 when every choice/target is grounded, 1 otherwise,
2 on usage/parse error.
"""

import argparse
import json
import os
import sys

try:
    import yaml
except ImportError:
    sys.stderr.write("grounding_check.py: PyYAML is required (pip install pyyaml).\n")
    sys.exit(2)

GROUNDED_SHELVES = ("architecture/", "technology/")


def _kb_learning_exists(kb_root, learning_id):
    """A KB learning id like 'architecture/microservices' resolves to <kb_root>/<id>.md."""
    return os.path.isfile(os.path.join(kb_root, f"{learning_id}.md"))


def _grounded(label, grounds, proposals_dir, kb_root, errors):
    if not grounds:
        errors.append(f"{label}: no grounding — neither a KB learning nor a proposal (C4/F4)")
        return "ungrounded"
    for e in grounds:
        st = (e.get("source_type") or "").strip().lower()
        src = e.get("source")
        if st == "kb" and src:
            if kb_root and not _kb_learning_exists(kb_root, src):
                errors.append(f"{label}: KB learning '{src}' named but not found under "
                              f"{kb_root} (C4/F4)")
                return "kb-missing"
            if kb_root is None and not src.startswith(GROUNDED_SHELVES):
                # without a KB root we can't open the file; at least require it name a
                # real shelf (architecture/ or technology/) — run grounds on those two.
                errors.append(f"{label}: KB source '{src}' is not on the architecture/ or "
                              f"technology/ shelf (C4/F4)")
                return "kb-offshelf"
            return f"kb: {src}"
        if st == "proposal" and src:
            candidate = src
            if proposals_dir and not os.path.isabs(src):
                candidate = os.path.join(proposals_dir, os.path.basename(src))
            if os.path.isfile(candidate) or os.path.isfile(src):
                return f"proposal: {src}"
            errors.append(f"{label}: proposal named but file not found ({src}) (C4/F4)")
            return "proposal-missing"
    errors.append(f"{label}: no KB learning or proposal among its grounding entries (C4/F4)")
    return "ungrounded"


def main(argv=None):
    ap = argparse.ArgumentParser(description="Check /run KB grounding.")
    ap.add_argument("--manifest", required=True, help="run-manifest.yaml path")
    ap.add_argument("--proposals-dir", default=None)
    ap.add_argument("--kb-root", default=None,
                    help="the knowledge/ dir, to confirm a named KB learning exists")
    args = ap.parse_args(argv)

    try:
        with open(args.manifest, encoding="utf-8") as fh:
            doc = yaml.safe_load(fh) or {}
    except OSError as exc:
        sys.stderr.write(f"grounding_check.py: cannot read manifest: {exc}\n")
        sys.exit(2)
    except yaml.YAMLError as exc:
        sys.stderr.write(f"grounding_check.py: manifest parse error: {exc}\n")
        sys.exit(2)

    man = doc.get("run", doc) if isinstance(doc, dict) else {}
    errors = []
    report = []

    choices = man.get("choices") or []
    targets = man.get("targets") or []
    if not choices:
        errors.append("manifest lists no operational choices — /run grounds at least the "
                      "rollout and migration stances")

    for ch in choices:
        aspect = ch.get("aspect") or "<choice>"
        status = _grounded(f"choice '{aspect}'", ch.get("grounds"), args.proposals_dir,
                           args.kb_root, errors)
        report.append({"choice": aspect, "grounding": status})
    for t in targets:
        comp = t.get("component") or "<target>"
        status = _grounded(f"target '{comp}'", t.get("grounds"), args.proposals_dir,
                           args.kb_root, errors)
        report.append({"target": comp, "grounding": status})

    result = {"ok": not errors, "errors": errors, "items": report}
    print(json.dumps(result, indent=2))
    return 0 if not errors else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
