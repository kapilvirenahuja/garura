#!/usr/bin/env python3
"""
persist_measure.py — /measure's deterministic keyed persist, in place on the live model.

Direct-model-write remnant of the old apply_measure.py + stamp_slice.py (ADR 026,
standards/rules/direct-model-write.md). There is NO draft tree and NO doc copy: the LLM
authoring skill (author-measure-lens) already wrote the per-node grounding doc — the slice's
`lens/measure.md` — straight to the live model. This script owns every SHARED file and applies
the approved manifest's structured deltas to the live model IN PLACE, keyed and surgical. Run
only AFTER the checkpoint gate resolves. It writes exactly, and nothing else:

  1. new decision records (`{slice}/decisions/<id>.yaml`, skip-if-exists — an accepted decision
     is never edited in place), each at the `rel` the manifest names.
  2. the ONE spine field — this slice's `status` -> `realized` in the spine `slices` index —
     and ONLY when the lines-up gate passed (all seven lens docs present, captured by
     lines_up.py into --lines-up). This is stamp_slice's logic folded onto the keyed persist
     path: it stamps only when the capture reads ok, and it always writes the resolved stamp
     outcome the stop condition checks. It refuses any other slice, any other field of this
     slice's entry, and any other spine collection — the node-level containment the file-level
     scoped guard cannot see inside the shared spine.

The measure lens doc is NOT touched here (the skill wrote it to the live model already); the
manifest's `docs` list is the record of which live docs the run touched, carried into the
persist record for evidence and the guard. Write-then-review (ADR 026): the stamp is written
BEFORE the checkpoint so the change-shape and the human see the FULL delta (a stamp is a
status change on the spine); the COMMIT is what the gate holds, not the disk write.

Layer rule: pure file writes from disk inputs; no git/gh/network.

    python3 persist_measure.py --manifest <measure-manifest.yaml> \
        --product-base <product_base> --slice <slice-id | domain/slice-id> \
        --lines-up <lines-up.json> --decided-by /measure --date <YYYY-MM-DD> \
        --record <stamp-record.json> --out-manifest <persist-manifest.json>

Exit 0 on success (clean stamp or explicit lines-up skip), 2 on usage/parse/containment error,
1 if the slice is not found in the spine when a stamp was due.
"""

import argparse
import json
import os
import sys

try:
    import yaml
except ImportError:
    sys.stderr.write("persist_measure.py: PyYAML is required (pip install pyyaml).\n")
    sys.exit(2)

REALIZED = "realized"


def load(path):
    if not os.path.isfile(path):
        return {}
    with open(path, encoding="utf-8") as fh:
        return yaml.safe_load(fh) or {}


def write_record(path, record):
    if not path:
        return
    parent = os.path.dirname(os.path.abspath(path))
    if parent:
        os.makedirs(parent, exist_ok=True)
    with open(path, "w", encoding="utf-8") as fh:
        json.dump(record, fh, indent=2)


def main(argv=None):
    ap = argparse.ArgumentParser(description="Keyed in-place persist for /measure (ADR 026).")
    ap.add_argument("--manifest", required=True, help="measure-manifest.yaml (STM, non-model)")
    ap.add_argument("--product-base", required=True)
    ap.add_argument("--slice", required=True, help="slice-id or domain/slice-id")
    ap.add_argument("--lines-up", required=True,
                    help="lines_up.py captured JSON; stamp only if it reads ok")
    ap.add_argument("--decided-by", default="/measure")
    ap.add_argument("--date", required=True,
                    help="decision date (play passes it; never auto-generated)")
    ap.add_argument("--record", required=True,
                    help="always write the resolved stamp outcome ({stamp_resolved, stamped}) here")
    ap.add_argument("--out-manifest", required=True)
    args = ap.parse_args(argv)

    live_root = os.path.join(args.product_base, "product-os")
    spine_path = os.path.join(live_root, "_spine.yaml")
    for p in (spine_path, args.manifest, args.lines_up):
        if not os.path.isfile(p):
            sys.stderr.write(f"persist_measure.py: missing input {p}\n")
            return 2

    manifest = load(args.manifest)
    written, changed = [], {"decisions": [], "docs": [], "stamp": None}

    # --- 1. new decision records (skip-if-exists) --------------------------------
    # Each decision entry carries `rel` (its path under product-os, slice-scoped) so the
    # persist writes it exactly where the manifest names it, matching the guard glob.
    for dec in manifest.get("decisions") or []:
        did = dec.get("id")
        rel = dec.get("rel")
        if not did or not rel:
            continue
        dpath = os.path.join(live_root, rel) if not rel.startswith("product-os") \
            else os.path.join(args.product_base, rel)
        os.makedirs(os.path.dirname(dpath), exist_ok=True)
        if os.path.exists(dpath):
            continue                              # never edit an accepted decision in place
        record = {"decision": {
            "id": did, "node_ref": dec.get("node_ref"),
            "level": dec.get("level", "product"),
            "title": dec.get("title"), "reason": dec.get("reason"),
            "alternatives": dec.get("alternatives", []),
            "status": "accepted", "superseded_by": None,
            "supersedes": dec.get("supersedes"),
            "metadata": {"decided_by": args.decided_by, "date": args.date, "version": 1},
        }}
        with open(dpath, "w", encoding="utf-8") as fh:
            yaml.safe_dump(record, fh, sort_keys=False, allow_unicode=True)
        written.append(f"decision:{did}")
        changed["decisions"].append(did)

    # --- 2. record which grounding docs the skill wrote (already on live) --------
    for d in manifest.get("docs") or []:
        rel = d.get("rel")
        if rel:
            changed["docs"].append(rel)

    # --- 3. lines-up-gated realized stamp (folded stamp_slice logic) -------------
    lines_up = load(args.lines_up)
    sid = args.slice.split("/", 1)[1] if "/" in args.slice else args.slice
    if not lines_up.get("ok"):
        stamp_record = {"stamp_resolved": True, "stamped": False,
                        "slice_id": args.slice,
                        "missing": lines_up.get("missing", []),
                        "reason": "lens docs missing — lines-up gate did not pass; slice left un-realized"}
        write_record(args.record, stamp_record)
        changed["stamp"] = {"stamped": False, "missing": lines_up.get("missing", [])}
    else:
        spine = load(spine_path)
        entry = next((s for s in (spine.get("slices") or [])
                      if isinstance(s, dict) and (s.get("id") == sid or s.get("slug") == sid)), None)
        if entry is None:
            sys.stderr.write(f"persist_measure.py: slice '{sid}' not in the spine slices index\n")
            return 1
        from_status = entry.get("status")
        entry["status"] = REALIZED               # the ONLY spine mutation — one field, keyed
        with open(spine_path, "w", encoding="utf-8") as fh:
            yaml.safe_dump(spine, fh, sort_keys=False, allow_unicode=True)
        written.append("spine:_spine.yaml")
        stamp_record = {"stamp_resolved": True, "stamped": True,
                        "slice_id": entry.get("id", sid),
                        "from_status": from_status, "to_status": REALIZED}
        write_record(args.record, stamp_record)
        changed["stamp"] = {"stamped": True, "slice_id": entry.get("id", sid),
                            "from_status": from_status, "to_status": REALIZED}

    out = {"applied": True,                       # machine field the stop condition (D2) reads
           "written": sorted(written),
           "changed": changed,
           "stamp_resolved": stamp_record["stamp_resolved"],
           "stamped": stamp_record["stamped"]}
    with open(args.out_manifest, "w", encoding="utf-8") as fh:
        json.dump(out, fh, indent=2)
    print(json.dumps(out, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
