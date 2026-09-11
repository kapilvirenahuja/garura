#!/usr/bin/env python3
"""
check_ready_slice.py — slice-realize readiness gate + hub resolution (SPINE model).

A realize lens (ux / agentic / marketing / architecture / quality / run / measure) runs on
ONE SLICE — the unit of delivery. A slice has no ICE of its own; its HUB is the union of
its functionalities' grounding (each `functionality_ref` → the spine's `functionalities`
entry → its `functionality.md` doc, which may span several capabilities) plus the product
profile (now structured in the spine), and the slice's PERSONA + JOURNEY records — the
personas its surfaces name and every journey that runs on one of those surfaces. A journey is
the flow itself: who takes it, the surface it runs on, and the ordered steps. This gate:

  - asserts the product profile is `set` (firmed by /understand) — read from the SPINE;
  - resolves the slice record and EVERY `functionality_ref` via the spine to a
    `functionality.md` grounding doc, asserting each doc exists on disk;
  - resolves the slice's people and paths: every `surface[].persona_ref` to a real
    persona record, every journey whose `surface_refs` touch one of the slice's surfaces, and
    each such journey's own `persona_ref` to a real persona record. Records live under the
    CAPABILITY dir (`<domain>/<capability>/personas|journeys/{id}.yaml`) and are found by a
    recursive glob keyed on the record's own `id`.

LOUD-FAIL rule: a reference that does not resolve is a BROKEN HUB, not an empty one — an
error, never a silent pass. That covers a `functionality_ref` with no spine entry or no
on-disk doc, a `surface[].persona_ref` that opens no persona record, a slice surface reached
by no journey record, and a resolved journey whose own `persona_ref` opens no persona record
(C1/F1). A slice that declares NO surfaces is not an error — the persona/journey checks fire
per surface and per matched journey only, so older slices that predate `surface[]` still pass.

It emits the resolved slice context (the lens dir, the functionality grounding docs, and the
slice's personas + journeys) so downstream steps read the hub without re-deriving it. This
script is SHARED — every lens play uses the same hub resolution, and the persona/journey keys
are purely additive: a lens that does not need them simply does not read them.

Layer rule: reads files on disk only; no git/gh/network.

    python3 check_ready_slice.py --product-base <pb> --slice <slice-id | domain/slice-id>

Prints {ok, errors[], slice_id, domain, slice_file, lens_dir, functionality_groundings[],
personas[] ({id, path, name}), journeys[] ({id, path, persona_ref, surface_refs, step_count})}
JSON — every path relative to --product-base.
Exit 0 ready, 1 not ready, 2 usage error.
"""

import argparse
import glob
import json
import os
import sys

try:
    import yaml
except ImportError:
    sys.stderr.write("check_ready_slice.py: PyYAML is required (pip install pyyaml).\n")
    sys.exit(2)


def load(path):
    with open(path, encoding="utf-8") as fh:
        return yaml.safe_load(fh) or {}


def _empty(v):
    return v is None or (isinstance(v, (list, dict, str)) and len(v) == 0)

def _index_records(root, folder, key):
    """Index the model's persona/journey records by their record id.

    Records live under the CAPABILITY dir (`<domain>/<capability>/personas/{id}.yaml`), so the
    walk is a recursive glob — never one hardcoded level. The record's own `id` is the key, not
    the filename. A malformed record is skipped (it simply fails to resolve, loudly, later).
    """
    out = {}
    pattern = os.path.join(root, "**", folder, "*.yaml")
    for path in sorted(glob.glob(pattern, recursive=True)):
        try:
            body = load(path)
        except (OSError, yaml.YAMLError):
            continue
        rec = body.get(key) if isinstance(body.get(key), dict) else body
        if not isinstance(rec, dict):
            continue
        rid = rec.get("id")
        if rid and rid not in out:
            out[rid] = (path, rec)
    return out


def main(argv=None):
    ap = argparse.ArgumentParser(description="Slice-realize readiness gate + hub resolution.")
    ap.add_argument("--product-base", required=True)
    ap.add_argument("--slice", required=True, help="slice id, or domain/slice-id")
    args = ap.parse_args(argv)

    errors = []
    root = os.path.join(args.product_base, "product-os")
    slice_id = args.slice.split("/")[-1]
    out = {"ok": False, "errors": errors, "slice_id": slice_id,
           "personas": [], "journeys": []}

    # --- the spine: profile firmed? + functionality doc index -----------------
    spine_path = os.path.join(root, "_spine.yaml")
    func_doc = {}
    if not os.path.isfile(spine_path):
        errors.append(f"no spine at {spine_path} — run /vision + /understand first (C1/F1)")
    else:
        spine = load(spine_path)
        state = ((spine.get("profile") or {}).get("state") or "").strip().lower()
        if state != "set":
            errors.append(f"profile.state is '{state}', must be 'set' (firmed by /understand) (C1/F1)")
        func_doc = {f.get("id"): f.get("doc") for f in (spine.get("functionalities") or [])
                    if isinstance(f, dict)}

    # --- resolve the slice (accept 'slice-id' or 'domain/slice-id') -----------
    matches = glob.glob(os.path.join(root, "*", "slices", slice_id + ".yaml"))
    if not matches:
        errors.append(f"slice '{slice_id}' not found under any domain's slices/ "
                      f"— shape it with /shape first (C1/F1)")
    elif len(matches) > 1:
        errors.append(f"slice id '{slice_id}' is ambiguous across domains: "
                      f"{[os.path.relpath(m, args.product_base) for m in matches]}")
    else:
        slice_file = matches[0]
        domain = os.path.basename(os.path.dirname(os.path.dirname(slice_file)))
        sl = (load(slice_file).get("slice") or {})
        funcs = sl.get("functionalities") or []
        if _empty(funcs):
            errors.append(f"slice '{slice_id}' bundles no functionalities — nothing to realize (C1/F1)")
        groundings = []
        for f in funcs:
            ref = (f or {}).get("functionality_ref")
            doc = func_doc.get(ref)
            if _empty(doc):
                errors.append(f"functionality '{ref}' is not in the spine, or has no grounding "
                              f"doc — broken hub, cannot realize (C1/F1)")
                groundings.append({"functionality_ref": ref, "doc": None, "resolved": False})
                continue
            doc_path = os.path.join(root, doc)
            resolved = os.path.isfile(doc_path)
            if not resolved:
                errors.append(f"functionality '{ref}' grounding doc does not resolve: {doc} "
                              f"— broken hub, cannot realize (C1/F1)")
            groundings.append({"functionality_ref": ref, "doc": doc, "resolved": resolved})

        # --- the slice's PERSONA + JOURNEY records (C1/F1) ---------------------
        # A journey IS a flow: who, the surface it runs on, the ordered steps. The lens reads
        # these records rather than inventing a path, so every reference must open a real file.
        persona_idx = _index_records(root, "personas", "persona")
        journey_idx = _index_records(root, "journeys", "journey")

        surfaces = sl.get("surface") or []
        surface_ids = []
        wanted_personas = []
        for s in surfaces:
            sid = (s or {}).get("id")
            if sid:
                surface_ids.append(sid)
            pref = (s or {}).get("persona_ref")
            if _empty(pref):
                continue
            if pref not in persona_idx:
                errors.append(f"surface '{sid or '<?>'}' names persona '{pref}', which opens no "
                              f"persona record on disk — broken hub, cannot realize (C1/F1)")
            elif pref not in wanted_personas:
                wanted_personas.append(pref)

        # Journeys of this slice: those whose surface_refs touch one of the slice's surfaces.
        sid_set = set(surface_ids)
        journeys_out = []
        reached_surfaces = set()
        for jid, (jpath, jrec) in sorted(journey_idx.items()):
            jsurfaces = [r for r in (jrec.get("surface_refs") or []) if r]
            hit = sid_set.intersection(jsurfaces)
            if not hit:
                continue
            reached_surfaces |= hit
            jpref = jrec.get("persona_ref")
            if _empty(jpref):
                errors.append(f"journey '{jid}' names no persona_ref — a journey is a person "
                              f"taking a path; broken hub, cannot realize (C1/F1)")
            elif jpref not in persona_idx:
                errors.append(f"journey '{jid}' names persona '{jpref}', which opens no persona "
                              f"record on disk — broken hub, cannot realize (C1/F1)")
            elif jpref not in wanted_personas:
                wanted_personas.append(jpref)
            journeys_out.append({
                "id": jid,
                "path": os.path.relpath(jpath, args.product_base),
                "persona_ref": jpref,
                "surface_refs": jsurfaces,
                "step_count": len(jrec.get("steps") or []),
            })

        for sid in surface_ids:
            if sid not in reached_surfaces:
                errors.append(f"surface '{sid}' is reached by no journey record — the slice has a "
                              f"surface with no path through it; broken hub, cannot realize "
                              f"(C1/F1)")

        personas_out = []
        for pid in wanted_personas:
            ppath, prec = persona_idx[pid]
            personas_out.append({
                "id": pid,
                "path": os.path.relpath(ppath, args.product_base),
                "name": prec.get("name") or pid,
            })

        out["personas"] = personas_out
        out["journeys"] = journeys_out

        rel_slice = os.path.relpath(slice_file, args.product_base)
        lens_dir = os.path.join(os.path.dirname(rel_slice), slice_id, "lens")
        out.update({"domain": domain, "slice_file": rel_slice, "lens_dir": lens_dir,
                    "functionality_groundings": groundings})

    out["ok"] = not errors
    out["errors"] = errors
    print(json.dumps(out, indent=2))
    return 0 if not errors else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
