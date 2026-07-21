#!/usr/bin/env python3
"""
persist_learn.py — /learn's deterministic keyed persist, in place on the live model.

Direct-model-write remnant of the old apply_learn.py (ADR 026,
standards/rules/direct-model-write.md). There is NO draft tree and NO doc copy: the LLM
authoring skill (author-learnings) already wrote the per-node grounding docs — capability.md,
functionality.md, and the slice lens/{measure|run|quality}.md — straight to the live model.
This script owns every SHARED file and applies the approved manifest's structured deltas to the
live model IN PLACE, keyed to the manifest-named nodes and the meaning-field whitelist. Run only
AFTER the checkpoint gate resolves. It writes exactly, and nothing else:

  1. spine meaning fields on the nodes the manifest names:
       - capability/functionality `one_line`  (refined descriptor)
       - capability `nfr_needs[<dim>].level`  (monotonic-up) OR profile `nfr[<dim>].level`
       - capability/functionality `status`    (earned promotion)
       - the node's `decisions` list           (append new ids; never remove/reorder)
  2. new decision records (`decisions/<id>.yaml`, skip-if-exists — an accepted decision is never
     edited in place), each linked onto its node.

It refuses any node the manifest does not name, any field that is not a meaning field, any
skeleton change (id/slug/parent), any slice or epic rewrite, and any nfr level that would fall —
this is the node-level containment the file-level scoped_write_guard.py cannot provide. The
grounding docs are NOT touched here (the skill wrote them to the live model already); the guard
confirms they, and every other changed path, fell inside the run's declared write scope. Layer
rule: pure file writes from disk inputs; no git/gh/network.

    python3 persist_learn.py --manifest <learn-manifest.yaml> \
        --product-base <product_base> --decided-by /learn --date <YYYY-MM-DD> \
        --out-manifest <persist-manifest.json>

Exit 0 on success, 2 on usage/parse/containment error.
"""

import argparse
import json
import os
import sys

try:
    import yaml
except ImportError:
    sys.stderr.write("persist_learn.py: PyYAML is required (pip install pyyaml).\n")
    sys.exit(2)

SCALE = ["none", "low", "medium", "high", "xhigh"]
MEANING_FIELDS = {"one_line", "nfr_needs", "status"}


def rank(level):
    try:
        return SCALE.index((level or "none").strip().lower())
    except ValueError:
        return 0


def load(path):
    with open(path, encoding="utf-8") as fh:
        return yaml.safe_load(fh) or {}


def find(entries, eid):
    for e in entries:
        if isinstance(e, dict) and e.get("id") == eid:
            return e
    return None


def main(argv=None):
    ap = argparse.ArgumentParser(description="Keyed in-place persist for /learn (ADR 026).")
    ap.add_argument("--manifest", required=True, help="learn-manifest.yaml (STM, non-model)")
    ap.add_argument("--product-base", required=True)
    ap.add_argument("--decided-by", default="/learn")
    ap.add_argument("--date", required=True, help="decision date (play passes it; never auto-generated)")
    ap.add_argument("--out-manifest", required=True)
    args = ap.parse_args(argv)

    live_root = os.path.join(args.product_base, "product-os")
    spine_path = os.path.join(live_root, "_spine.yaml")
    for p in (spine_path, args.manifest):
        if not os.path.isfile(p):
            sys.stderr.write(f"persist_learn.py: missing input {p}\n")
            return 2

    live = load(spine_path)
    manifest = load(args.manifest)
    caps = live.setdefault("capabilities", [])
    funcs = live.setdefault("functionalities", [])
    profile = live.setdefault("profile", {})

    written, changed = [], {"nodes": [], "decisions": [], "docs": []}

    # --- 1. spine meaning-field mutations on manifest-named nodes -----------------
    for c in manifest.get("changes") or []:
        ref, kind, field = c.get("node_ref"), c.get("node_kind"), c.get("field")
        if field not in MEANING_FIELDS:
            sys.stderr.write(f"persist_learn.py: field '{field}' is not a meaning field — refusing\n")
            return 2
        if kind == "capability":
            node = find(caps, ref)
        elif kind == "functionality":
            node = find(funcs, ref)
        elif kind == "profile":
            node = profile
        else:
            sys.stderr.write(f"persist_learn.py: node_kind '{kind}' not allowed (allowlist)\n")
            return 2
        if node is None:
            sys.stderr.write(f"persist_learn.py: node '{ref}' ({kind}) not found in spine\n")
            return 2

        if field == "one_line":
            node["one_line"] = c.get("to")
        elif field == "status":
            node["status"] = c.get("to")
        elif field == "nfr_needs":
            dim = c.get("dimension")
            if not dim:
                sys.stderr.write("persist_learn.py: nfr_needs change needs a 'dimension'\n")
                return 2
            target = node.setdefault("nfr_needs" if kind == "capability" else "nfr", {})
            slot = target.setdefault(dim, {})
            if rank(c.get("to")) < rank(slot.get("level")):
                sys.stderr.write(f"persist_learn.py: nfr '{dim}' on '{ref}' would fall — refusing\n")
                return 2
            slot["level"] = c.get("to")
        changed["nodes"].append({"ref": ref, "kind": kind, "field": field})

    # --- 2. record which grounding docs the skill rewrote (already on live) -------
    # The docs were written straight to the live model by author-learnings; this script
    # does NOT copy or write them. The manifest's `docs` list is the record of which live
    # docs the run touched, carried into the persist record for evidence and the guard.
    for d in manifest.get("docs") or []:
        rel = d.get("rel")
        if rel:
            changed["docs"].append(rel)

    # --- 3. new decision records (skip-if-exists) + link onto the node -----------
    dec_dir = os.path.join(live_root, "decisions")
    for dec in manifest.get("decisions") or []:
        did = dec.get("id")
        if not did:
            continue
        os.makedirs(dec_dir, exist_ok=True)
        dpath = os.path.join(dec_dir, f"{did}.yaml")
        if not os.path.exists(dpath):
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
        # link the decision id onto its node (append-only)
        ref = dec.get("node_ref")
        node = find(caps, ref) or find(funcs, ref)
        if node is not None:
            dlist = node.setdefault("decisions", [])
            if did not in dlist:
                dlist.append(did)

    # --- write the mutated spine back --------------------------------------------
    with open(spine_path, "w", encoding="utf-8") as fh:
        yaml.safe_dump(live, fh, sort_keys=False, allow_unicode=True)
    written.append("spine:_spine.yaml")

    out = {"written": written, "changed": changed,
           "nodes_named": sorted({c["ref"] for c in changed["nodes"]} |
                                 {d.get("node_ref") for d in (manifest.get("decisions") or [])
                                  if d.get("node_ref")}),
           # machine field for the play's stop condition (#464/#466 Batch C; ADR 026):
           # the approved updates were applied to the live model — the persist completed
           "applied": True}
    with open(args.out_manifest, "w", encoding="utf-8") as fh:
        json.dump(out, fh, indent=2)
    print(json.dumps(out, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
