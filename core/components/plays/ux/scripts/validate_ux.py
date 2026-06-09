#!/usr/bin/env python3
"""
validate_ux.py — assert /ux's draft lens is schema-true, just-enough, grounded, and covers
the capability's shaped slices.

Run over the draft before the checkpoint. The ux lens is three blocks only — screens (with
a low-fidelity layout), states, and the visual core (palette + typography). Enforces /ux's
artifact-side constraints:

  - C10/F10  schema: the lens carries the v1 envelope (id, capability_ref, type=ux, content,
             status) and any decision carries its required v1 fields.
  - C3/F3    shape: content has exactly the three keys screens/states/design_system, each
             present and non-empty — no flows, no accessibility, no gates/components/envs.
  - C5/F5    just enough: every screen has a purpose and a layout; every states entry names a
             declared screen and enumerates states; design_system carries palette + typography.
  - C4/F4    grounded: every screen in the manifest names >=1 real source; the visual core
             grounds on a decision that resolves.
  - C7/F7    hub-only: no screen grounds on another lens (quality/agentic/architecture/run).
  - C8/F8    decision: the design_system names a `decision` resolving to a drafted record.
  - C6/F6    coverage: the to-cover set (this capability's functionalities that appear in a
             slice, recomputed independently from the live slices + capability dirs) equals
             the manifest's `covers`, and every covered functionality is grounded by a
             screen — so nothing shaped is left unvisualized. If the live slices name
             functionalities but none resolve under the capability dir, that is almost
             certainly a misread tree, not a legitimately-empty set — so it is a LOUD error,
             not a silent pass. (The human checkpoint is the final coverage authority.)

Layer rule: reads files on disk only; no git/gh/network.

    python3 validate_ux.py --draft <draft_dir> --manifest <ux-manifest.yaml> \
            --capability-dir <live capability folder> --slices-dir <live domain slices folder>

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


OTHER_LENSES = ("quality", "agentic", "architecture", "run", "lens")
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
        for f in ("id", "capability_ref", "type", "status"):
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

        # screens: name + purpose + low-fidelity layout
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

        # states: each names a declared screen + enumerates states
        for st in (content.get("states") or []):
            scr = (st or {}).get("screen")
            if _blank(scr):
                errors.append(f"{lp}: a states entry names no screen (F5)")
            elif isinstance(scr, str) and scr.strip() not in screens:
                errors.append(f"{lp}: states entry references screen {scr!r} not in screens (F5)")
            if _blank((st or {}).get("states")):
                errors.append(f"{lp}: states for screen {scr!r} are not enumerated (F5)")

        # design_system: palette + typography
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
                              f"/ux reads the hub + shape, never a lens (C7/F7)")
            elif st not in ("slice", "ice", "persona", "journey"):
                errors.append(f"{label} source_type '{st}' is not slice/ice/persona/journey (C4/F4)")
            if st == "slice":
                fr = e.get("functionality_ref")
                if _blank(fr):
                    errors.append(f"{label} grounds on a slice with no functionality_ref (C4/F4)")
                else:
                    grounded_funcs.add(fr)

    for s in (man.get("screens") or []):
        nm = s.get("name", "<screen>")
        scr_names.add(nm.strip() if isinstance(nm, str) else nm)
        walk_grounds(f"screen '{nm}'", s.get("grounds"))

    # visual core grounds on a decision that resolves (C4/C8)
    ds = man.get("design_system") or {}
    if (ds.get("source_type") or "").strip().lower() != "decision":
        errors.append("design_system (visual core) must ground on a decision (C4/F4)")
    dec = ds.get("decision")
    if _blank(dec):
        errors.append("the visual core has no decision recorded (C8/F8)")
    elif dec not in decision_ids:
        errors.append(f"the visual core names decision '{dec}' with no drafted record (C8/F8)")

    return grounded_funcs, scr_names


def capability_functionalities(cap_dir, warnings):
    """Independently enumerate this capability's functionality node ids from the live tree."""
    ids = set()
    if not cap_dir or not os.path.isdir(cap_dir):
        warnings.append("capability-dir absent — coverage recompute is vacuous")
        return ids
    for fp in glob.glob(os.path.join(cap_dir, "**", "*.yaml"), recursive=True):
        try:
            node = (load(fp).get("node") or {})
        except (OSError, yaml.YAMLError):
            continue
        if (node.get("type") or "").strip().lower() == "functionality" and node.get("id"):
            ids.add(node["id"])
    return ids


def slice_bound_functionalities(slices_dir, warnings):
    """Functionality refs that appear in any slice of the domain (live tree)."""
    refs = set()
    if not slices_dir or not os.path.isdir(slices_dir):
        warnings.append("slices-dir absent — coverage recompute is vacuous")
        return refs
    for fp in glob.glob(os.path.join(slices_dir, "*.yaml")):
        if os.path.basename(fp).startswith("_"):     # skip _deferred.yaml
            continue
        sl = (load(fp).get("slice") or {})
        for f in (sl.get("functionalities") or []):
            fr = (f or {}).get("functionality_ref")
            if fr:
                refs.add(fr)
    return refs


def main(argv=None):
    ap = argparse.ArgumentParser(description="Validate /ux's draft lens.")
    ap.add_argument("--draft", required=True)
    ap.add_argument("--manifest", required=True)
    ap.add_argument("--capability-dir", required=True)
    ap.add_argument("--slices-dir", required=True)
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

    # reconcile lens <-> manifest screens (every lens screen must be grounded)
    for s in sorted(lens_screens - man_screens):
        errors.append(f"lens screen {s!r} has no grounding entry in the manifest (C4/F4)")
    for s in sorted(man_screens - lens_screens):
        errors.append(f"manifest grounds screen {s!r} that is not in the lens (C4/F4)")

    # coverage (C6/F6): recompute to-cover independently, compare to manifest covers
    cap_funcs = capability_functionalities(args.capability_dir, warnings)
    slice_funcs = slice_bound_functionalities(args.slices_dir, warnings)
    # Loud guard: live slices name functionalities but none resolve under the capability —
    # almost certainly a misread tree, not a legitimately empty set.
    if slice_funcs and not cap_funcs:
        errors.append("slices name functionalities but none resolve under the capability dir "
                      "— coverage cannot be verified (likely a misread model tree) (C6/F6)")
    to_cover = cap_funcs & slice_funcs
    covers = set(man.get("covers") or [])
    for missing in sorted(to_cover - covers):
        errors.append(f"slice-bound functionality {missing!r} missing from manifest covers (C6/F6)")
    for extra in sorted(covers - to_cover):
        warnings.append(f"manifest covers {extra!r} which is not a slice-bound capability functionality")
    for fid in sorted(to_cover):
        if fid not in grounded_funcs:
            errors.append(f"slice-bound functionality {fid!r} is visualized by no screen (C6/F6)")

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
