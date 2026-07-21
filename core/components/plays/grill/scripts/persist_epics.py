#!/usr/bin/env python3
"""
persist_epics.py — /grill's deterministic keyed persist, in place on the live model (ADR 026).

Direct-model-write successor of the old apply_epics.py (standards/rules/direct-model-write.md).
There is NO draft tree and NO doc copy: the LLM author-epics skill already wrote each `epic.md`
grounding doc (and the slice's `deferrals.yaml`) straight to the live model. This script owns
the ONE shared file — the spine `_spine.yaml` `epics` index — and merges the manifest's
structured epics-index delta into the live model IN PLACE, keyed to --slice-ref:

  - additive by id: a new epic id is appended; an epic id already present is REPLACED only
    when its live status is `ready` (a re-cut of a not-yet-picked-up epic).
  - it REFUSES to touch an epic delivery already owns (status != `ready`, e.g. in_delivery /
    delivered) — this is the node-level containment the file-level scoped guard cannot provide.
  - it writes NOTHING outside the spine `epics` index — no slice record, lens, functionality,
    profile, or any other spine field.

All-or-none (F7): the plan is computed and checked first; if anything is refused, nothing is
written. It reads the manifest (STM, non-model); it does NOT read a draft tree and does NOT
copy docs. Layer rule: pure file writes from disk inputs; no git/gh/network.

    python3 persist_epics.py --manifest <epics-manifest.yaml> \
        --product-base <pb> --slice-ref <domain>/<slice-id> \
        --out-manifest <persist-manifest.json>

The manifest carries the `epics` list as structured spine entries (each with id, slug,
slice_ref, status, order, functionality_refs, surface/surface_type, issue_ref, doc). Manifest
JSON: {ok, written[], skipped[], refused[], changed{epics[]}}. Exit 0 applied, 1 refused,
2 usage error.
"""

import argparse
import json
import os
import sys

try:
    import yaml
except ImportError:
    sys.stderr.write("persist_epics.py: PyYAML is required (pip install pyyaml).\n")
    sys.exit(2)


def load(path):
    if not os.path.isfile(path):
        return {}
    with open(path, encoding="utf-8") as fh:
        return yaml.safe_load(fh) or {}


def main(argv=None):
    ap = argparse.ArgumentParser(description="Keyed in-place persist of an epic cut (ADR 026).")
    ap.add_argument("--manifest", required=True,
                    help="epics-manifest.yaml (STM, non-model) — carries the epics-index delta")
    ap.add_argument("--product-base", required=True)
    ap.add_argument("--slice-ref", required=True,
                    help="the ONLY slice this run may write epics for (<domain>/<slice-id>)")
    ap.add_argument("--out-manifest", required=True)
    args = ap.parse_args(argv)

    live_root = os.path.join(args.product_base, "product-os")
    live_spine_path = os.path.join(live_root, "_spine.yaml")
    for p in (args.manifest, live_spine_path):
        if not os.path.isfile(p):
            sys.stderr.write(f"persist_epics.py: missing input {p}\n")
            return 2

    man = load(args.manifest)
    draft_epics = man.get("epics") or []
    live = load(live_spine_path)

    refused, written, skipped, changed = [], [], [], []
    if not draft_epics:
        refused.append("manifest holds no epic entries — refusing an empty persist")

    live_epics = live.setdefault("epics", [])
    by_id = {e.get("id"): e for e in live_epics if isinstance(e, dict)}

    # --- plan: containment + refuse re-cutting an epic delivery already owns ------------
    for e in draft_epics:
        eid = e.get("id")
        sref = str(e.get("slice_ref") or "")
        if args.slice_ref not in sref:
            refused.append(f"epic '{eid}' slice_ref '{sref}' is not the target slice "
                           f"'{args.slice_ref}' — refusing (containment)")
        doc = e.get("doc")
        if not doc or not os.path.isfile(os.path.join(live_root, doc)):
            refused.append(f"epic '{eid}': live doc missing at '{doc}' — author-epics must "
                           f"write it before persist")
        cur = by_id.get(eid)
        if cur is not None and (cur.get("status") or "").strip().lower() != "ready":
            refused.append(f"epic '{eid}' is '{cur.get('status')}' — delivery owns it; "
                           f"will not re-cut")

    if refused:
        manifest = {"ok": False, "written": [], "skipped": [], "refused": refused,
                    "changed": {"epics": []}}
        os.makedirs(os.path.dirname(os.path.abspath(args.out_manifest)), exist_ok=True)
        json.dump(manifest, open(args.out_manifest, "w"), indent=2)
        print(json.dumps(manifest, indent=2))
        return 1

    # --- apply (plan clean): merge the epics-index entries, keyed ------------------------
    for e in draft_epics:
        eid = e.get("id")
        if eid in by_id:
            live_epics[live_epics.index(by_id[eid])] = e
            skipped.append(f"spine:epic:{eid} (replaced ready)")
        else:
            live_epics.append(e)
        written.append(f"spine:epic:{eid}")
        changed.append(eid)

    with open(live_spine_path, "w", encoding="utf-8") as fh:
        yaml.safe_dump(live, fh, sort_keys=False, allow_unicode=True)
    written.append("spine:_spine.yaml")

    manifest = {"ok": True, "written": written, "skipped": skipped, "refused": [],
                "changed": {"epics": changed}}
    os.makedirs(os.path.dirname(os.path.abspath(args.out_manifest)), exist_ok=True)
    json.dump(manifest, open(args.out_manifest, "w"), indent=2)
    print(json.dumps(manifest, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
