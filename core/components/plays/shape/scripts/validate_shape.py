#!/usr/bin/env python3
"""
validate_shape.py — assert /shape's draft bundle is schema-true, tree-sound, grounded.

Run over the draft before the checkpoint. Enforces /shape's artifact-side constraints:

  - C4/F2  schema: functionality nodes, functionality ICE, personas, journeys, and
           decisions carry their required v1 fields and valid enum values.
  - C5/F4  tree integrity: every functionality node is type=functionality with a
           parent; every functionality ICE persona ref resolves to a persona drafted
           in the bundle (or already in the live model, if --product-base given);
           every journey references a persona that exists and a node_ref.
  - C3/F3  grounding: every kept capability and selected functionality in the manifest
           carries a KB shelf or a proposal — none invented.
  - C14/F13 surface: every slice is a user-facing vertical — it names >=1 surface
           (id + name + persona_ref + user_action) a persona can open and check.
  - C15/F14 user journeys: every journey traverses >=1 surface, and every surface a
           slice names is reached by at least one journey — no backend-only pipelines.
  - C16/F15 names not designs: a slice surface carries no design content
           (wireframe/components/layout/visual/mockup) — that is /realize's UX lens.

Layer rule: reads files on disk only; no git/gh/network.

    python3 validate_shape.py --draft <draft_dir> --manifest <shape-manifest.yaml> \
                              [--product-base <product_base>]

Prints {ok, errors[], counts} JSON. Exit 0 clean, 1 on violation, 2 usage error.
"""

import argparse
import glob
import json
import os
import sys

try:
    import yaml
except ImportError:
    sys.stderr.write("validate_shape.py: PyYAML is required (pip install pyyaml).\n")
    sys.exit(2)


def load(path):
    with open(path, encoding="utf-8") as fh:
        return yaml.safe_load(fh) or {}


def _empty(v):
    return v is None or (isinstance(v, (list, dict, str)) and len(v) == 0)


def collect_persona_ids(root):
    ids = set()
    for p in glob.glob(os.path.join(root, "**", "personas", "*.yaml"), recursive=True):
        try:
            doc = load(p)
            pid = (doc.get("persona", doc) or {}).get("id") or os.path.splitext(os.path.basename(p))[0]
            ids.add(pid)
        except (OSError, yaml.YAMLError):
            pass
    return ids


def main(argv=None):
    ap = argparse.ArgumentParser(description="Validate /shape's draft bundle.")
    ap.add_argument("--draft", required=True)
    ap.add_argument("--manifest", required=True)
    ap.add_argument("--product-base", default=None,
                    help="live model, so persona refs to already-existing personas resolve too")
    args = ap.parse_args(argv)

    draft_root = os.path.join(args.draft, "product-os")
    if not os.path.isdir(draft_root):
        sys.stderr.write(f"validate_shape.py: no draft tree at {draft_root}\n")
        sys.exit(2)

    errors = []
    counts = {"functionality": 0, "ice": 0, "persona": 0, "journey": 0, "decision": 0}

    # persona universe: drafted + (optionally) already in the live model
    persona_ids = collect_persona_ids(draft_root)
    if args.product_base:
        persona_ids |= collect_persona_ids(os.path.join(args.product_base, "product-os"))

    # --- functionality nodes -------------------------------------------------
    selected_fns = set()        # ids of all functionalities selected in this draft
    for node in glob.glob(os.path.join(draft_root, "**", "functionalities", "*", "node.yaml"),
                          recursive=True):
        counts["functionality"] += 1
        n = (load(node).get("node") or {})
        for f in ("id", "type", "name", "status"):
            if _empty(n.get(f)):
                errors.append(f"{node}: functionality node missing '{f}' (F2)")
        if n.get("type") != "functionality":
            errors.append(f"{node}: type is '{n.get('type')}', must be functionality (F2)")
        if _empty(n.get("parent")):
            errors.append(f"{node}: functionality has no parent capability (F4)")
        if n.get("id"):
            selected_fns.add(n["id"])

    # --- functionality ICE ---------------------------------------------------
    for ice_path in glob.glob(os.path.join(draft_root, "**", "functionalities", "*", "ice.yaml"),
                              recursive=True):
        counts["ice"] += 1
        ice = (load(ice_path).get("ice") or {})
        if _empty((ice.get("intent") or {}).get("goals")):
            errors.append(f"{ice_path}: functionality ICE intent.goals empty (F2)")
        for ref in (ice.get("context") or {}).get("persona") or []:
            if ref not in persona_ids:
                errors.append(f"{ice_path}: persona ref '{ref}' resolves to no persona record (F4)")

    # --- personas ------------------------------------------------------------
    for p in glob.glob(os.path.join(draft_root, "**", "personas", "*.yaml"), recursive=True):
        counts["persona"] += 1
        per = (load(p).get("persona") or {})
        for f in ("id", "name"):
            if _empty(per.get(f)):
                errors.append(f"{p}: persona missing '{f}' (F2)")

    # --- journeys ------------------------------------------------------------
    journey_surface_refs = set()    # surfaces some journey traverses (C15)
    for j in glob.glob(os.path.join(draft_root, "**", "journeys", "*.yaml"), recursive=True):
        counts["journey"] += 1
        jr = (load(j).get("journey") or {})
        for f in ("id", "name"):
            if _empty(jr.get(f)):
                errors.append(f"{j}: journey missing '{f}' (F2)")
        pref = jr.get("persona_ref")
        if not _empty(pref) and pref not in persona_ids:
            errors.append(f"{j}: journey persona_ref '{pref}' resolves to no persona (F4)")
        if _empty(jr.get("node_ref")):
            errors.append(f"{j}: journey missing node_ref (F4)")
        # C15/F14 — a journey is a USER journey through a surface, not a backend pipeline
        surface_refs = jr.get("surface_refs") or []
        if _empty(surface_refs):
            errors.append(f"{j}: journey traverses no surface (surface_refs empty) — "
                          f"a user journey runs on a surface, not a backend pipeline (F14)")
        for s in surface_refs:
            journey_surface_refs.add(s)

    # --- decisions -----------------------------------------------------------
    for d in glob.glob(os.path.join(draft_root, "**", "decisions", "*.yaml"), recursive=True):
        counts["decision"] += 1
        dec = (load(d).get("decision") or {})
        for f in ("id", "title", "reason", "status", "level"):
            if _empty(dec.get(f)):
                errors.append(f"{d}: decision missing '{f}' (F2)")

    # --- grounding (manifest) ------------------------------------------------
    try:
        man = (load(args.manifest).get("shape") or {})
    except (OSError, yaml.YAMLError) as exc:
        errors.append(f"manifest unreadable: {exc}")
        man = {}
    for cap in man.get("capabilities") or []:
        cid = cap.get("id", "<cap>")
        if cap.get("decision") == "active" and _empty(cap.get("grounding")):
            errors.append(f"kept capability '{cid}' has no grounding (C3/F3)")
        for fn in cap.get("functionalities") or []:
            if _empty(fn.get("grounding")):
                errors.append(f"functionality '{fn.get('id','<fn>')}' has no grounding (C3/F3)")

    # --- slices (C11/C12/C13/C14/C16 -> F10/F11/F12/F13/F15) -----------------
    counts["slice"] = 0
    placed_fns = set()              # functionality ids that landed in some slice
    slice_surface_ids = set()       # surface ids slices declare (C14)
    PLAN_KEYS = ("order", "effort", "depends_on")
    ICE_BODY_KEYS = ("ice", "intent", "context", "expectations")  # signs of copied ICE
    DESIGN_KEYS = ("wireframe", "components", "layout", "visual", "mockup")  # /realize's UX lens, not /shape (C16)
    for sp in glob.glob(os.path.join(draft_root, "**", "slices", "*.yaml"), recursive=True):
        if os.path.basename(sp) == "_deferred.yaml":
            continue
        counts["slice"] += 1
        sl = (load(sp).get("slice") or {})
        for f in ("id", "domain_ref", "name", "outcome", "acceptance_intent", "functionalities"):
            if _empty(sl.get(f)):
                errors.append(f"{sp}: slice missing '{f}' (F2)")
        # C13/F12 — shape must not plan
        for k in PLAN_KEYS:
            if not _empty(sl.get(k)):
                errors.append(f"{sp}: slice carries '{k}' — that is /roadmap's plan, not /shape (F12)")
        # C14/F13 — every slice is a user-facing vertical: it names >=1 surface
        surfaces = sl.get("surface") or []
        if _empty(surfaces):
            errors.append(f"{sp}: slice exposes no user-facing surface — it is not vertical "
                          f"and cannot be checked by a user (F13)")
        for surf in surfaces:
            if not isinstance(surf, dict):
                errors.append(f"{sp}: surface entry is not a mapping (F2)")
                continue
            for f in ("id", "name", "persona_ref", "user_action"):
                if _empty(surf.get(f)):
                    errors.append(f"{sp}: surface missing '{f}' (name/persona/what the user does) (F13)")
            counts["surface"] = counts.get("surface", 0) + 1
            sid = surf.get("id")
            if sid:
                slice_surface_ids.add(sid)
            spref = surf.get("persona_ref")
            if not _empty(spref) and spref not in persona_ids:
                errors.append(f"{sp}: surface persona_ref '{spref}' resolves to no persona (F4)")
            # C16/F15 — shape NAMES surfaces, it does not DESIGN them
            for bad in DESIGN_KEYS:
                if bad in surf:
                    errors.append(f"{sp}: surface carries design content ('{bad}') — "
                                  f"/shape names the surface; /realize's UX lens designs it (F15)")
        for entry in sl.get("functionalities") or []:
            if not isinstance(entry, dict):
                errors.append(f"{sp}: functionality entry is not a mapping (F11)")
                continue
            fref = entry.get("functionality_ref")
            iref = entry.get("ice_ref")
            if _empty(fref) or _empty(iref):
                errors.append(f"{sp}: slice functionality entry missing functionality_ref/ice_ref (F11)")
            else:
                placed_fns.add(fref)
                # C11/F11 — referenced ICE must resolve (draft first, then live model)
                cands = [os.path.join(args.draft, iref), iref]
                if args.product_base:
                    cands.append(os.path.join(args.product_base, iref))
                if not any(os.path.isfile(c) for c in cands):
                    errors.append(f"{sp}: ice_ref '{iref}' resolves to no ICE file (F11)")
            # C11/F11 — no copied ICE body inside the slice entry
            for bad in ICE_BODY_KEYS:
                if bad in entry:
                    errors.append(f"{sp}: slice embeds ICE content ('{bad}') — reference, don't copy (F11)")
            if entry.get("delivery") not in ("full", "partial"):
                errors.append(f"{sp}: functionality '{fref}' delivery must be full|partial (F2)")

    # deferred bucket
    deferred_fns = set()
    for dp in glob.glob(os.path.join(draft_root, "**", "slices", "_deferred.yaml"), recursive=True):
        dd = (load(dp).get("deferred") or {})
        for fid in dd.get("functionalities") or []:
            deferred_fns.add(fid)

    # C12/F10 — every selected functionality is in a slice or the deferred bucket
    unplaced = selected_fns - placed_fns - deferred_fns
    if unplaced:
        errors.append(f"selected functionalities placed in no slice and not deferred: "
                      f"{sorted(unplaced)} (C12/F10)")

    # C15/F14 — every surface a slice names is reached by at least one user journey
    unreached = slice_surface_ids - journey_surface_refs
    if unreached:
        errors.append(f"slice surfaces no journey reaches: {sorted(unreached)} — "
                      f"each named surface needs a user journey through it (C15/F14)")

    result = {"ok": not errors, "errors": errors, "counts": counts}
    print(json.dumps(result, indent=2))
    return 0 if not errors else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
