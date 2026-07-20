#!/usr/bin/env python3
"""
persist_shape.py — /shape's deterministic keyed persist, in place on the live model (ADR 026).

Direct-model-write successor of the old apply_shape.py (standards/rules/direct-model-write.md).
There is NO draft tree and NO record copy: the LLM author-shape-bundle skill already wrote the
per-node record files — the slice records, the persona/journey/decision records, and the
`_deferred` bucket — straight to the live model. This script owns the ONE shared file — the
spine `_spine.yaml` — and applies the manifest's structured spine-delta to the live model IN
PLACE, keyed to --domain:

  1. capability `status` flips (active/deprecated) — the STATUS FIELD ONLY, on the capabilities
     the manifest names. Every other capability field is preserved. It REFUSES to touch a
     capability the manifest does not name, and (when the spine records a capability's domain)
     REFUSES to flip one outside --domain — this is the node-level containment the file-level
     scoped guard cannot provide.
  2. persona / journey / decision refs appended onto those named capabilities (additive).
  3. new `slices` index entries (skip-if-exists by id).

It never writes the profile (defensive: a profile delta is refused), and never touches the
spine's `functionalities` or `domains` collections. It reads the manifest (STM, non-model); it
does NOT read a draft tree and does NOT copy record files. Layer rule: pure file writes from
disk inputs; no git/gh/network.

    python3 persist_shape.py --manifest <shape-manifest.yaml> \
        --product-base <product_base> --domain <domain-id> \
        --out-manifest <persist-manifest.json>

The manifest carries `shape.spine_delta` as structured data: `capabilities` (each id + status +
optional personas/journeys/decisions ref lists) and `slices` (each a spine index entry: id,
slug, domain_ref, status, functionality_refs, doc). Manifest JSON: {applied, written[],
skipped[], status_flips[]}. Exit 0 applied, 2 usage/parse/containment error.
"""

import argparse
import json
import os
import sys

try:
    import yaml
except ImportError:
    sys.stderr.write("persist_shape.py: PyYAML is required (pip install pyyaml).\n")
    sys.exit(2)

SPINE_NAME = "_spine.yaml"
REF_LISTS = ("personas", "journeys", "decisions")


def load(path):
    if not os.path.isfile(path):
        return {}
    with open(path, encoding="utf-8") as fh:
        return yaml.safe_load(fh) or {}


def find(entries, eid):
    for e in entries:
        if isinstance(e, dict) and e.get("id") == eid:
            return e
    return None


def main(argv=None):
    ap = argparse.ArgumentParser(description="Keyed in-place persist for /shape (ADR 026).")
    ap.add_argument("--manifest", required=True, help="shape-manifest.yaml (STM, non-model)")
    ap.add_argument("--product-base", required=True)
    ap.add_argument("--domain", required=True, help="the ONLY domain this run may mutate")
    ap.add_argument("--out-manifest", required=True)
    args = ap.parse_args(argv)

    live_root = os.path.join(args.product_base, "product-os")
    live_spine_path = os.path.join(live_root, SPINE_NAME)
    for p in (args.manifest, live_spine_path):
        if not os.path.isfile(p):
            sys.stderr.write(f"persist_shape.py: missing input {p}\n")
            return 2

    man = load(args.manifest)
    shape = man.get("shape", man) if isinstance(man, dict) else {}
    delta = shape.get("spine_delta") or {}
    live = load(live_spine_path)

    # --- containment: the manifest must be about the target domain, nothing else -------
    man_domain = shape.get("domain_ref") or shape.get("domain")
    if man_domain and man_domain != args.domain:
        sys.stderr.write(f"persist_shape.py: manifest domain '{man_domain}' != --domain "
                         f"'{args.domain}' — refusing (containment)\n")
        return 2

    # defensive: /shape never writes the profile — a profile delta is a hard refusal.
    if "profile" in delta:
        sys.stderr.write("persist_shape.py: spine_delta carries a profile — /shape never "
                         "writes the profile; refusing\n")
        return 2

    written, skipped, status_flips = [], [], []

    # --- 1. capability status flips + ref merges (only the named capabilities) ---------
    live_caps = live.setdefault("capabilities", [])
    for dcap in delta.get("capabilities") or []:
        cid = dcap.get("id")
        live_cap = find(live_caps, cid)
        if live_cap is None:
            sys.stderr.write(f"persist_shape.py: capability '{cid}' not in live spine — refusing\n")
            return 2
        cap_domain = live_cap.get("domain_ref") or live_cap.get("domain")
        if cap_domain and cap_domain != args.domain:
            sys.stderr.write(f"persist_shape.py: capability '{cid}' is in domain '{cap_domain}', "
                             f"not --domain '{args.domain}' — refusing (containment)\n")
            return 2
        new_status = dcap.get("status")
        if new_status and new_status != live_cap.get("status"):
            status_flips.append({"capability": cid, "from": live_cap.get("status"), "to": new_status})
            live_cap["status"] = new_status            # ONLY the status field
        for key in REF_LISTS:                          # additive ref merge
            for ref in dcap.get(key) or []:
                lst = live_cap.setdefault(key, [])
                if ref not in lst:
                    lst.append(ref)

    # --- 2. new slices index entries (skip-if-exists by id) ----------------------------
    live_slices = live.setdefault("slices", [])
    have_slices = {s.get("id") for s in live_slices if isinstance(s, dict)}
    for s in delta.get("slices") or []:
        sid = s.get("id")
        if sid in have_slices:
            skipped.append(f"spine:slice:{sid}")
        else:
            live_slices.append(s)
            have_slices.add(sid)
            written.append(f"spine:slice:{sid}")

    # --- write the mutated live spine back ---------------------------------------------
    with open(live_spine_path, "w", encoding="utf-8") as fh:
        yaml.safe_dump(live, fh, sort_keys=False, allow_unicode=True)
    written.append("spine:_spine.yaml")

    # applied: the machine field the baked stop condition asserts — written only on a
    # completed persist, so its presence+truth proves the spine merge landed.
    out = {"applied": True, "written": sorted(written), "skipped": sorted(skipped),
           "status_flips": status_flips}
    with open(args.out_manifest, "w", encoding="utf-8") as fh:
        json.dump(out, fh, indent=2)
    print(json.dumps(out, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
