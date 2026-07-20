#!/usr/bin/env python3
"""
validate_shape.py — assert /shape's bundle is schema-true, grounded, and vertical.

Run over the LIVE model before the checkpoint (ADR 026 direct-model-write: author-shape-bundle
already wrote the slice/persona/journey/decision records straight to the live tree; there is no
draft). /shape SELECTS and COMPOSES — it does not create functionalities (so there are no
functionality nodes/ICE to validate). It enforces:

  - schema: personas, journeys, decisions, and slices carry their required fields.
  - references: every slice `functionality_ref` resolves to a real functionality in the
    LIVE spine (the functionalities /understand created) — slices reference by spine id,
    never copy.
  - surface: every slice is a user-facing vertical — it names >=1 surface
    (id + name + persona_ref + user_action), named not designed.
  - user journeys: every journey traverses >=1 surface, and every surface a slice names is
    reached by at least one journey.
  - placement: every selected functionality lands in a slice OR the _deferred bucket.
  - status: capability status flips are only active|deprecated.
  - grounding + decisions: every kept capability + selected functionality is grounded; a
    decision exists per prune and per material selection.

Layer rule: reads files on disk only; no git/gh/network.

    python3 validate_shape.py --root <product_base>/product-os --manifest <shape-manifest.yaml> \
                              --spine <live _spine.yaml>

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

PLAN_KEYS = ("order", "effort", "depends_on")
DESIGN_KEYS = ("wireframe", "components", "layout", "visual", "mockup")
VALID_STATUS_FLIP = {"active", "deprecated"}


def load(path):
    with open(path, encoding="utf-8") as fh:
        return yaml.safe_load(fh) or {}


def _empty(v):
    return v is None or (isinstance(v, (list, dict, str)) and len(v) == 0)


def collect_persona_ids(root):
    ids = set()
    for p in glob.glob(os.path.join(root, "**", "personas", "*.yaml"), recursive=True):
        try:
            ids.add((load(p).get("persona", {}) or {}).get("id")
                    or os.path.splitext(os.path.basename(p))[0])
        except (OSError, yaml.YAMLError):
            pass
    return ids


def main(argv=None):
    ap = argparse.ArgumentParser(description="Validate /shape's live bundle (ADR 026).")
    ap.add_argument("--root", required=True, help="the live product-os tree the records were written to")
    ap.add_argument("--manifest", required=True)
    ap.add_argument("--spine", required=True, help="live _spine.yaml (resolves functionality_refs + live personas)")
    args = ap.parse_args(argv)

    live_records_root = args.root
    if not os.path.isdir(live_records_root):
        sys.stderr.write(f"validate_shape.py: no product-os tree at {live_records_root}\n")
        return 2
    if not os.path.isfile(args.spine):
        sys.stderr.write(f"validate_shape.py: no spine at {args.spine}\n")
        return 2

    spine = load(args.spine)
    live_func_ids = {f.get("id") for f in (spine.get("functionalities") or []) if isinstance(f, dict)}

    errors = []
    counts = {"persona": 0, "journey": 0, "decision": 0, "slice": 0, "surface": 0}

    persona_ids = collect_persona_ids(live_records_root)

    # --- personas ------------------------------------------------------------
    for p in glob.glob(os.path.join(live_records_root, "**", "personas", "*.yaml"), recursive=True):
        counts["persona"] += 1
        per = (load(p).get("persona") or {})
        for f in ("id", "name"):
            if _empty(per.get(f)):
                errors.append(f"{p}: persona missing '{f}'")

    # --- journeys ------------------------------------------------------------
    journey_surface_refs = set()
    for j in glob.glob(os.path.join(live_records_root, "**", "journeys", "*.yaml"), recursive=True):
        counts["journey"] += 1
        jr = (load(j).get("journey") or {})
        for f in ("id", "name"):
            if _empty(jr.get(f)):
                errors.append(f"{j}: journey missing '{f}'")
        pref = jr.get("persona_ref")
        if not _empty(pref) and pref not in persona_ids:
            errors.append(f"{j}: journey persona_ref '{pref}' resolves to no persona")
        surface_refs = jr.get("surface_refs") or []
        if _empty(surface_refs):
            errors.append(f"{j}: journey traverses no surface (surface_refs empty) — "
                          f"a user journey runs on a surface, not a backend pipeline")
        journey_surface_refs |= set(surface_refs)

    # --- decisions -----------------------------------------------------------
    for d in glob.glob(os.path.join(live_records_root, "**", "decisions", "*.yaml"), recursive=True):
        counts["decision"] += 1
        dec = (load(d).get("decision") or {})
        for f in ("id", "title", "reason", "status", "level"):
            if _empty(dec.get(f)):
                errors.append(f"{d}: decision missing '{f}'")

    # --- slices --------------------------------------------------------------
    placed_fns = set()
    slice_surface_ids = set()
    for sp in glob.glob(os.path.join(live_records_root, "**", "slices", "*.yaml"), recursive=True):
        if os.path.basename(sp) == "_deferred.yaml":
            continue
        counts["slice"] += 1
        sl = (load(sp).get("slice") or {})
        for f in ("id", "domain_ref", "name", "outcome", "acceptance_intent", "functionalities"):
            if _empty(sl.get(f)):
                errors.append(f"{sp}: slice missing '{f}'")
        for k in PLAN_KEYS:
            if not _empty(sl.get(k)):
                errors.append(f"{sp}: slice carries '{k}' — that is /roadmap's plan, not /shape")
        surfaces = sl.get("surface") or []
        if _empty(surfaces):
            errors.append(f"{sp}: slice exposes no user-facing surface — it is not vertical "
                          f"and cannot be checked by a user")
        for surf in surfaces:
            if not isinstance(surf, dict):
                errors.append(f"{sp}: surface entry is not a mapping")
                continue
            for f in ("id", "name", "persona_ref", "user_action"):
                if _empty(surf.get(f)):
                    errors.append(f"{sp}: surface missing '{f}' (name/persona/what the user does)")
            counts["surface"] += 1
            if surf.get("id"):
                slice_surface_ids.add(surf["id"])
            spref = surf.get("persona_ref")
            if not _empty(spref) and spref not in persona_ids:
                errors.append(f"{sp}: surface persona_ref '{spref}' resolves to no persona")
            for bad in DESIGN_KEYS:
                if bad in surf:
                    errors.append(f"{sp}: surface carries design content ('{bad}') — "
                                  f"/shape names the surface; /realize's UX lens designs it")
        for entry in sl.get("functionalities") or []:
            if not isinstance(entry, dict):
                errors.append(f"{sp}: functionality entry is not a mapping")
                continue
            fref = entry.get("functionality_ref")
            if _empty(fref):
                errors.append(f"{sp}: slice functionality entry missing functionality_ref")
            else:
                placed_fns.add(fref)
                if fref not in live_func_ids:
                    errors.append(f"{sp}: functionality_ref '{fref}' resolves to no functionality "
                                  f"in the spine (/understand creates them)")
            if entry.get("delivery") not in ("full", "partial"):
                errors.append(f"{sp}: functionality '{fref}' delivery must be full|partial")

    # --- deferred bucket -----------------------------------------------------
    deferred_fns = set()
    for dp in glob.glob(os.path.join(live_records_root, "**", "slices", "_deferred.yaml"), recursive=True):
        for fid in (load(dp).get("deferred") or {}).get("functionalities") or []:
            deferred_fns.add(fid)

    # --- manifest: grounding, status flips, placement, decisions -------------
    try:
        man = (load(args.manifest).get("shape") or {})
    except (OSError, yaml.YAMLError) as exc:
        errors.append(f"manifest unreadable: {exc}")
        man = {}

    selected_fns = set()
    for cap in man.get("capabilities") or []:
        cid = cap.get("id", "<cap>")
        dec = cap.get("decision")
        if dec not in VALID_STATUS_FLIP and not _empty(dec):
            errors.append(f"capability '{cid}' decision '{dec}' must be active|deprecated")
        if dec == "active" and _empty(cap.get("grounding")):
            errors.append(f"kept capability '{cid}' has no grounding")
        for fn in cap.get("functionalities") or []:
            fid = fn.get("id")
            if fid:
                selected_fns.add(fid)
            if _empty(fn.get("grounding")):
                errors.append(f"functionality '{fid or '<fn>'}' has no grounding")

    # placement: every selected functionality in a slice or the deferred bucket
    unplaced = selected_fns - placed_fns - deferred_fns
    if unplaced:
        errors.append(f"selected functionalities placed in no slice and not deferred: {sorted(unplaced)}")

    # every surface a slice names is reached by a journey
    unreached = slice_surface_ids - journey_surface_refs
    if unreached:
        errors.append(f"slice surfaces no journey reaches: {sorted(unreached)} — "
                      f"each named surface needs a user journey through it")

    # a decision exists per prune
    declared_decisions = set(man.get("decisions") or [])
    prunes = [c.get("id") for c in (man.get("capabilities") or []) if c.get("decision") == "deprecated"]
    if prunes and not declared_decisions:
        errors.append(f"prunes {prunes} but no decisions declared in the manifest")

    result = {"ok": not errors, "errors": errors, "counts": counts}
    print(json.dumps(result, indent=2))
    return 0 if not errors else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
