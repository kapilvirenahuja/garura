#!/usr/bin/env python3
"""
validate_ux.py — assert /ux's draft is grounded and covers the slice's functionalities.

Run over the draft before the checkpoint. In the spine+grounding model the ux lens is an MD
grounding doc (`ux.md`); its SHAPE (the Intent/Screens/States/Visual core sections, each
substantive) is checked by `lint_grounding.py`, and its UNDERSTANDABILITY by the content
eval — both run by the play's validate step. THIS script checks the things the manifest
carries, which the prose can't enforce:

  - C4/F4    grounded: every screen in the manifest names >=1 real source (a functionality of
             the slice, or a persona/journey); the visual core grounds on the KB or a decision.
  - C7/F7    hub-only: no screen grounds on another lens (quality/agentic/architecture/run/...).
  - C8/F8    decisions: a grounding flagged `material: true` names a `decision` that resolves.
  - C6/F6    coverage: the slice's functionalities (read from the slice record) are each
             grounded by at least one screen — nothing shaped is left unvisualized.

Layer rule: reads files on disk only; no git/gh/network.

    python3 validate_ux.py --draft <draft_dir> --manifest <ux-manifest.yaml> \
            --slice-file <live slice record .yaml>

Prints {ok, errors[], warnings[], counts} JSON. Exit 0 clean, 1 on violation, 2 usage.
"""

import argparse
import glob
import json
import os
import sys

try:
    import yaml
except ImportError:
    sys.stderr.write("validate_ux.py: PyYAML is required (pip install pyyaml).\n")
    sys.exit(2)

OTHER_LENSES = ("quality", "agentic", "architecture", "run", "measure", "marketing", "lens")


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


def collect_decisions(draft_root, errors):
    ids = set()
    for d in glob.glob(os.path.join(draft_root, "**", "decisions", "*.yaml"), recursive=True):
        dec = (load(d).get("decision") or {})
        for f in ("id", "title", "reason", "status", "level"):
            if _blank(dec.get(f)):
                errors.append(f"{d}: decision missing '{f}' (F10)")
        if dec.get("id"):
            ids.add(dec["id"])
    return ids


def check_grounding(man, decision_ids, errors):
    """C4/C7/C8 over the manifest. Returns grounded functionality refs."""
    grounded_funcs = set()

    def walk(label, entries):
        if _blank(entries):
            errors.append(f"{label} has no grounding source (C4/F4)")
            return
        for e in entries:
            st = (e.get("source_type") or "").strip().lower()
            if _blank(e.get("source")) or not st:
                errors.append(f"{label} has a grounding entry with no source (C4/F4)")
                continue
            if st in OTHER_LENSES:
                errors.append(f"{label} grounds on another lens '{st}' — /ux reads the slice's "
                              f"hub, never a lens (C7/F7)")
            elif st not in ("ice", "functionality", "persona", "journey"):
                errors.append(f"{label} source_type '{st}' is not functionality/persona/journey (C4/F4)")
            if st in ("ice", "functionality"):
                fr = e.get("functionality_ref")
                if not _blank(fr):
                    grounded_funcs.add(fr)
            if e.get("material") is True:
                dec = e.get("decision")
                if _blank(dec):
                    errors.append(f"{label} is a material choice with no decision recorded (C8/F8)")
                elif dec not in decision_ids:
                    errors.append(f"{label} names decision '{dec}' with no drafted record (C8/F8)")

    for s in (man.get("screens") or []):
        walk(f"screen '{s.get('name', '<screen>')}'", s.get("grounds"))

    ds = man.get("design_system") or man.get("visual_core") or {}
    vt = (ds.get("source_type") or "").strip().lower()
    if vt not in ("kb", "decision"):
        errors.append("visual core must ground on a KB technology learning or a decision (C4/F4)")
    if vt == "decision":
        dec = ds.get("decision")
        if _blank(dec):
            errors.append("visual core has no decision recorded (C8/F8)")
        elif dec not in decision_ids:
            errors.append(f"visual core names decision '{dec}' with no drafted record (C8/F8)")
    return grounded_funcs


def slice_functionalities(slice_file, errors):
    if not slice_file or not os.path.isfile(slice_file):
        errors.append(f"slice record not found at {slice_file} — cannot verify coverage (C6/F6)")
        return set()
    sl = (load(slice_file).get("slice") or {})
    return {(f or {}).get("functionality_ref") for f in (sl.get("functionalities") or [])
            if (f or {}).get("functionality_ref")}


def main(argv=None):
    ap = argparse.ArgumentParser(description="Validate /ux's draft grounding + coverage.")
    ap.add_argument("--draft", required=True)
    ap.add_argument("--manifest", required=True)
    ap.add_argument("--slice-file", required=True)
    args = ap.parse_args(argv)

    draft_root = os.path.join(args.draft, "product-os")
    if not os.path.isdir(draft_root):
        sys.stderr.write(f"validate_ux.py: no draft tree at {draft_root}\n")
        return 2

    errors, warnings = [], []
    decision_ids = collect_decisions(draft_root, errors)
    try:
        man = (load(args.manifest).get("ux") or {})
    except (OSError, yaml.YAMLError) as exc:
        errors.append(f"manifest unreadable: {exc}")
        man = {}

    grounded_funcs = check_grounding(man, decision_ids, errors)
    to_cover = slice_functionalities(args.slice_file, errors)
    for fid in sorted(f for f in to_cover if f):
        if fid not in grounded_funcs:
            errors.append(f"slice functionality {fid!r} is visualized by no screen (C6/F6)")

    counts = {"manifest_screens": len(man.get("screens") or []), "decisions": len(decision_ids),
              "to_cover": len(to_cover), "grounded_funcs": len(grounded_funcs)}
    result = {"ok": not errors, "errors": errors, "warnings": warnings, "counts": counts}
    print(json.dumps(result, indent=2))
    return 0 if not errors else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
