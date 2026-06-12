#!/usr/bin/env python3
"""
validate_ux.py — assert /ux's draft lens is schema-true, just-enough, grounded, and covers
the slice's functionalities.

Run over the draft before the checkpoint. The ux lens is three blocks only — screens (with a
low-fidelity layout), states, and the visual core (palette + typography). The lens realizes a
SLICE; its hub is the slice's functionalities' ICE. Enforces /ux's artifact-side constraints:

  - C10/F10  schema: the lens carries the v1 envelope (id, slice_ref, type=ux, content,
             status) and any decision carries its required v1 fields.
  - C3/F3    shape: content has exactly the three keys screens/states/design_system, each
             present and non-empty — no flows, no accessibility, no gates/components/envs.
  - C5/F5    just enough: every screen has a purpose and a layout; every states entry names a
             declared screen and enumerates states; design_system carries palette + typography.
  - C4/F4    grounded: every screen in the manifest names >=1 real source (a functionality of
             the slice, or a persona/journey); design_system grounds on the KB or a decision.
  - C7/F7    hub-only: no screen grounds on another lens (quality/agentic/architecture/run).
  - C8/F8    decisions: a grounding flagged `material: true` names a `decision` that resolves.
  - C6/F6    coverage: the slice's functionalities (read straight from the slice record) are
             each visualized by at least one screen — so nothing shaped is left unvisualized.
             (The human checkpoint is the final coverage authority; this catches gaps.)

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


OTHER_LENSES = ("quality", "agentic", "architecture", "run", "measure", "lens")
CONTENT_KEYS = {"screens", "states", "design_system"}


def validate_lens(draft_root, errors):
    """C10/C3/C5 — the lens file shape + just-enough coherence. Returns declared screen names."""
    screens = set()
    lenses = glob.glob(os.path.join(draft_root, "**", "lens", "ux.yaml"), recursive=True)
    if not lenses:
        errors.append("no ux.yaml in the draft (F3)")
        return screens
    for lp in lenses:
        doc = (load(lp).get("lens") or {})
        for f in ("id", "slice_ref", "type", "status"):
            if _blank(doc.get(f)):
                errors.append(f"{lp}: lens missing '{f}' (F10)")
        if doc.get("type") != "ux":
            errors.append(f"{lp}: type is '{doc.get('type')}', must be ux (F10)")
        content = doc.get("content") or {}
        extra = [k for k in content if k not in CONTENT_KEYS]
        if extra:
            errors.append(f"{lp}: content has keys outside the three blocks {extra} — "
                          f"screens/states/design_system only (F3)")
        for k in CONTENT_KEYS:
            if _blank(content.get(k)):
                errors.append(f"{lp}: content.{k} is empty (F3)")

        for s in (content.get("screens") or []):
            nm = (s or {}).get("name")
            if _blank(nm):
                errors.append(f"{lp}: a screen has no name (F5)")
                continue
            screens.add(nm.strip() if isinstance(nm, str) else nm)
            if _blank((s or {}).get("purpose")):
                errors.append(f"{lp}: screen {nm!r} has no purpose (F5)")
            if _blank((s or {}).get("layout")):
                errors.append(f"{lp}: screen {nm!r} has no low-fidelity layout (F5)")

        for st in (content.get("states") or []):
            scr = (st or {}).get("screen")
            if _blank(scr):
                errors.append(f"{lp}: a states entry names no screen (F5)")
            elif isinstance(scr, str) and scr.strip() not in screens:
                errors.append(f"{lp}: states entry references screen {scr!r} not in screens (F5)")
            if _blank((st or {}).get("states")):
                errors.append(f"{lp}: states for screen {scr!r} are not enumerated (F5)")

        ds = content.get("design_system") or {}
        for f in ("palette", "typography"):
            if _blank(ds.get(f)):
                errors.append(f"{lp}: design_system missing '{f}' (F5)")
    return screens


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
    """C4/C7/C8 over the manifest. Returns (grounded_funcs, manifest_screen_names)."""
    grounded_funcs = set()
    scr_names = set()

    def walk_grounds(label, entries):
        if _blank(entries):
            errors.append(f"{label} has no grounding source (C4/F4)")
            return
        for e in entries:
            st = (e.get("source_type") or "").strip().lower()
            if _blank(e.get("source")) or not st:
                errors.append(f"{label} has a grounding entry with no source (C4/F4)")
                continue
            if st in OTHER_LENSES:
                errors.append(f"{label} grounds on another lens '{st}' — "
                              f"/ux reads the slice's hub, never a lens (C7/F7)")
            elif st not in ("ice", "persona", "journey"):
                errors.append(f"{label} source_type '{st}' is not ice/persona/journey (C4/F4)")
            if st == "ice":
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
        nm = s.get("name", "<screen>")
        scr_names.add(nm.strip() if isinstance(nm, str) else nm)
        walk_grounds(f"screen '{nm}'", s.get("grounds"))

    ds = man.get("design_system") or {}
    if (ds.get("source_type") or "").strip().lower() not in ("kb", "decision"):
        errors.append("design_system must ground on the KB technology learning or a decision (C4/F4)")
    if (ds.get("source_type") or "").strip().lower() == "decision":
        dec = ds.get("decision")
        if _blank(dec):
            errors.append("design_system visual core has no decision recorded (C8/F8)")
        elif dec not in decision_ids:
            errors.append(f"design_system names decision '{dec}' with no drafted record (C8/F8)")

    return grounded_funcs, scr_names


def slice_functionalities(slice_file, errors):
    """The slice's own functionalities (read straight from the slice record) — the to-cover set."""
    if not slice_file or not os.path.isfile(slice_file):
        errors.append(f"slice record not found at {slice_file} — cannot verify coverage (C6/F6)")
        return set()
    sl = (load(slice_file).get("slice") or {})
    refs = set()
    for f in (sl.get("functionalities") or []):
        fr = (f or {}).get("functionality_ref")
        if fr:
            refs.add(fr)
    return refs


def main(argv=None):
    ap = argparse.ArgumentParser(description="Validate /ux's draft lens.")
    ap.add_argument("--draft", required=True)
    ap.add_argument("--manifest", required=True)
    ap.add_argument("--slice-file", required=True)
    args = ap.parse_args(argv)

    draft_root = os.path.join(args.draft, "product-os")
    if not os.path.isdir(draft_root):
        sys.stderr.write(f"validate_ux.py: no draft tree at {draft_root}\n")
        sys.exit(2)

    errors, warnings = [], []

    lens_screens = validate_lens(draft_root, errors)
    decision_ids = collect_decisions(draft_root, errors)

    try:
        man = (load(args.manifest).get("ux") or {})
    except (OSError, yaml.YAMLError) as exc:
        errors.append(f"manifest unreadable: {exc}")
        man = {}

    grounded_funcs, man_screens = check_grounding(man, decision_ids, errors)

    for s in sorted(lens_screens - man_screens):
        errors.append(f"lens screen {s!r} has no grounding entry in the manifest (C4/F4)")
    for s in sorted(man_screens - lens_screens):
        errors.append(f"manifest grounds screen {s!r} that is not in the lens (C4/F4)")

    # coverage (C6/F6): the slice's own functionalities must each be visualized
    to_cover = slice_functionalities(args.slice_file, errors)
    for fid in sorted(to_cover):
        if fid not in grounded_funcs:
            errors.append(f"slice functionality {fid!r} is visualized by no screen (C6/F6)")

    counts = {
        "lens_screens": len(lens_screens), "manifest_screens": len(man_screens),
        "decisions": len(decision_ids), "to_cover": len(to_cover),
        "grounded_funcs": len(grounded_funcs),
    }
    result = {"ok": not errors, "errors": errors, "warnings": warnings, "counts": counts}
    print(json.dumps(result, indent=2))
    return 0 if not errors else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
