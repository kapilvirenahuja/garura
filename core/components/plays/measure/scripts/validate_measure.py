#!/usr/bin/env python3
"""
validate_measure.py — assert /measure's proposed lens is grounded and considers the slice's hub.

Run before the checkpoint. Per ADR 026 direct-model-write, the measure lens (`measure.md`) is
authored STRAIGHT onto the live model and the material decisions are emitted as structured data
in the STM `measure-manifest.yaml` (not a draft tree). Its SHAPE (Focus / Metrics / Out of
scope) is checked by `lint_grounding.py` over the live doc and its UNDERSTANDABILITY by the
content eval — both run by the play's validate step. THIS script checks what the manifest
carries, which the prose can't enforce:

  - grounded: every grounding entry names a real source from the slice's HUB (a functionality
    or a profile outcome) — every metric ties to something the slice delivers.
  - decisions: a grounding flagged `material: true` names a `decision` that resolves — the
    decision id must appear in the manifest's `decisions:` list.
  - coverage: every functionality of the slice is considered by the measure assessment.

Manifest shape (authored by `author-measure-lens`):
  measure:   { slice_ref, grounds: [...], choices: [...] }
  docs:      [{rel}]                                    # per-node docs written to the live model
  decisions: [{id, rel, level, title, reason, alternatives, ...}]

Layer rule: reads files on disk only; no git/gh/network.

    python3 validate_measure.py --manifest <measure-manifest.yaml> \
            --slice-file <live slice record .yaml>

Prints {ok, errors[], warnings[], counts} JSON. Exit 0 clean, 1 on violation, 2 usage.
"""

import argparse
import json
import os
import sys

try:
    import yaml
except ImportError:
    sys.stderr.write("validate_measure.py: PyYAML is required (pip install pyyaml).\n")
    sys.exit(2)

OTHER_LENSES = ("quality", "agentic", "ux", "architecture", "run", "marketing", "lens")


def load(path):
    with open(path, encoding="utf-8") as fh:
        return yaml.safe_load(fh) or {}


def _blank(v):
    if v is None:
        return True
    if isinstance(v, str):
        return len(v.strip()) == 0
    if isinstance(v, (list, dict)):
        return len(v) == 0
    return False


def collect_decisions(manifest, errors):
    """Decision ids the manifest carries (structured data, ADR 026 — not a draft tree)."""
    ids = set()
    for dec in manifest.get("decisions") or []:
        for f in ("id", "rel", "title", "reason", "level"):
            if _blank(dec.get(f)):
                errors.append(f"decision '{dec.get('id') or '<no-id>'}': missing '{f}'")
        if dec.get("id"):
            ids.add(dec["id"])
    return ids


def check_grounding(man, decision_ids, errors):
    grounded = set()
    entries = man.get("grounds")
    if _blank(entries):
        errors.append("measure assessment has no grounding (grounds is empty)")
        return grounded
    for e in entries:
        st = (e.get("source_type") or "").strip().lower()
        if _blank(e.get("source")) and _blank(e.get("functionality_ref")):
            errors.append("a grounding entry has no source")
            continue
        if st in OTHER_LENSES:
            errors.append(f"grounds on another lens '{st}' — measure metrics tie to the hub "
                          f"(functionality / profile), not a lens")
        elif st not in ("profile", "functionality"):
            errors.append(f"source_type '{st}' is not profile/functionality")
        if st == "functionality":
            fr = e.get("functionality_ref")
            if not _blank(fr):
                grounded.add(fr)
        if e.get("material") is True:
            dec = e.get("decision")
            if _blank(dec):
                errors.append("a material choice has no decision recorded")
            elif dec not in decision_ids:
                errors.append(f"a material choice names decision '{dec}' with no drafted record")
    return grounded


def slice_functionalities(slice_file, errors):
    if not slice_file or not os.path.isfile(slice_file):
        errors.append(f"slice record not found at {slice_file} — cannot verify coverage")
        return set()
    sl = (load(slice_file).get("slice") or {})
    return {(f or {}).get("functionality_ref") for f in (sl.get("functionalities") or [])
            if (f or {}).get("functionality_ref")}


def main(argv=None):
    ap = argparse.ArgumentParser(description="Validate /measure's proposed grounding + coverage.")
    ap.add_argument("--manifest", required=True)
    ap.add_argument("--slice-file", required=True)
    args = ap.parse_args(argv)

    errors, warnings = [], []
    try:
        manifest = load(args.manifest)
    except (OSError, yaml.YAMLError) as exc:
        errors.append(f"manifest unreadable: {exc}")
        manifest = {}
    decision_ids = collect_decisions(manifest, errors)
    man = (manifest.get("measure") or {})

    grounded = check_grounding(man, decision_ids, errors)
    to_cover = slice_functionalities(args.slice_file, errors)
    for fid in sorted(f for f in to_cover if f):
        if fid not in grounded:
            warnings.append(f"slice functionality {fid!r} is not tied to a metric (acceptable if "
                            f"out-of-scope is stated, but check)")

    counts = {"grounds": len(man.get("grounds") or []), "decisions": len(decision_ids),
              "to_cover": len(to_cover), "grounded": len(grounded)}
    result = {"ok": not errors, "errors": errors, "warnings": warnings, "counts": counts}
    print(json.dumps(result, indent=2))
    return 0 if not errors else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
