#!/usr/bin/env python3
"""
validate_marketing.py — assert /marketing's lens is grounded and considers the slice's hub.

Run over the manifest before the checkpoint. In the spine+grounding model the marketing lens is
an MD grounding doc (`marketing.md`) written straight to the live model (ADR 026); its SHAPE (the
Intent / Discoverability / Accessibility / Marketing analytics sections, each substantive) is
checked by `lint_grounding.py`, and its UNDERSTANDABILITY by the content eval — both run by the
play's validate step. THIS script checks what the manifest carries, which the prose can't enforce:

  - grounded: every grounding entry names a real source from the slice's HUB (a functionality,
    persona, or journey) — never another lens (the marketing read is hub-only).
  - decisions: a grounding flagged `material: true` names a `decision` that resolves — resolved
    against the decisions the manifest carries (direct-model-write: decisions are emitted as
    manifest data for the keyed persist to write, not into a draft tree).
  - coverage: every functionality of the slice is considered by the marketing assessment (each
    appears in the manifest grounds) — the reach assessment can't ignore part of the slice.

Layer rule: reads files on disk only; no git/gh/network.

    python3 validate_marketing.py --manifest <marketing-manifest.yaml> \
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
    sys.stderr.write("validate_marketing.py: PyYAML is required (pip install pyyaml).\n")
    sys.exit(2)

OTHER_LENSES = ("quality", "ux", "agentic", "architecture", "run", "measure", "lens")


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


def collect_decisions(man, errors):
    """The decision ids the manifest carries (ADR 026: decisions are manifest data, not draft
    files). Tolerates a {decision: {...}} wrapper or a flat record."""
    ids = set()
    for rec in (man.get("decisions") or []):
        dec = rec.get("decision") if isinstance(rec, dict) and "decision" in rec else rec
        dec = dec or {}
        for f in ("id", "title", "reason", "status", "level"):
            if _blank(dec.get(f)):
                errors.append(f"manifest decision missing '{f}'")
        if dec.get("id"):
            ids.add(dec["id"])
    return ids


def check_grounding(man, decision_ids, errors):
    """Grounds are hub-only; material → decision. Returns grounded functionality refs."""
    grounded = set()
    entries = man.get("grounds")
    if _blank(entries):
        errors.append("marketing assessment has no grounding (grounds is empty)")
        return grounded
    for e in entries:
        st = (e.get("source_type") or "").strip().lower()
        if _blank(e.get("source")) and _blank(e.get("functionality_ref")):
            errors.append("a grounding entry has no source")
            continue
        if st in OTHER_LENSES:
            errors.append(f"grounds on another lens '{st}' — /marketing reads the slice's hub, "
                          f"never a lens")
        elif st not in ("ice", "functionality", "persona", "journey"):
            errors.append(f"source_type '{st}' is not functionality/persona/journey")
        if st in ("ice", "functionality"):
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
    ap = argparse.ArgumentParser(description="Validate /marketing's lens grounding + coverage.")
    ap.add_argument("--manifest", required=True)
    ap.add_argument("--slice-file", required=True)
    args = ap.parse_args(argv)

    errors, warnings = [], []
    try:
        man = (load(args.manifest).get("marketing") or {})
    except (OSError, yaml.YAMLError) as exc:
        errors.append(f"manifest unreadable: {exc}")
        man = {}

    decision_ids = collect_decisions(man, errors)
    grounded = check_grounding(man, decision_ids, errors)
    to_cover = slice_functionalities(args.slice_file, errors)
    for fid in sorted(f for f in to_cover if f):
        if fid not in grounded:
            errors.append(f"slice functionality {fid!r} is not considered by the marketing assessment")

    counts = {"grounds": len(man.get("grounds") or []), "decisions": len(decision_ids),
              "to_cover": len(to_cover), "grounded": len(grounded)}
    result = {"ok": not errors, "errors": errors, "warnings": warnings, "counts": counts}
    print(json.dumps(result, indent=2))
    return 0 if not errors else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
