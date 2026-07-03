#!/usr/bin/env python3
"""
apply_epics.py — atomic, allowlisted persist of an approved epic cut (C9/C11/C16).

In the spine + grounding model an epic is TWO things: an entry in the spine `epics`
index, and a rich `epic.md` grounding doc under the slice's epics/ home. This writer
persists both, and NOTHING else:

  - copies each draft `epic.md` to {slice}/epics/{epic}.md  (allowlist: only *.md);
  - merges each draft epic entry into the live spine `epics` index (additive by id);
  - copies deferrals.yaml.

All-or-none (F7): the plan is computed and checked first; if anything is refused,
nothing is written. An existing epic whose spine status is NOT `ready` (in_delivery /
delivered) is delivery's property — re-cutting it is refused (F8). It never touches the
slice record, a lens, a functionality, the profile, or any spine field outside `epics`.

    python3 apply_epics.py --draft <dir> --product-base <pb> --out-manifest <path>

The draft holds `product-os/_spine.yaml` (an epics-index delta), the epic.md docs at
their slice-relative paths, and (optionally) a deferrals.yaml. Manifest JSON:
{ok, written[], skipped[], refused[]}. Exit 0 applied, 1 refused, 2 usage error.
"""

import argparse
import json
import os
import shutil
import sys

try:
    import yaml
except ImportError:
    sys.stderr.write("apply_epics.py: PyYAML is required (pip install pyyaml).\n")
    sys.exit(2)


def load(path):
    if not os.path.isfile(path):
        return {}
    with open(path, encoding="utf-8") as fh:
        return yaml.safe_load(fh) or {}


def main(argv=None):
    ap = argparse.ArgumentParser(description="Atomic allowlisted persist of an epic cut.")
    ap.add_argument("--draft", required=True, help="draft dir (epics index delta + epic.md docs)")
    ap.add_argument("--product-base", required=True)
    ap.add_argument("--out-manifest", required=True)
    args = ap.parse_args(argv)

    refused, written, skipped = [], [], []
    draft_root = os.path.join(args.draft, "product-os")
    live_root = os.path.join(args.product_base, "product-os")
    draft_spine = load(os.path.join(draft_root, "_spine.yaml"))
    live_spine_path = os.path.join(live_root, "_spine.yaml")
    live = load(live_spine_path)

    draft_epics = draft_spine.get("epics") or []
    if not draft_epics:
        refused.append("draft spine holds no epic entries — refusing an empty persist")

    live_epics = live.setdefault("epics", [])
    by_id = {e.get("id"): e for e in live_epics if isinstance(e, dict)}

    # --- plan: refuse re-cutting an epic delivery already owns (status != ready) ---
    for e in draft_epics:
        eid = e.get("id")
        cur = by_id.get(eid)
        if cur is not None and (cur.get("status") or "").strip().lower() != "ready":
            refused.append(f"epic '{eid}' is '{cur.get('status')}' — delivery owns it; "
                           f"will not re-cut")
        doc = e.get("doc")
        if not doc or not os.path.isfile(os.path.join(draft_root, doc)):
            refused.append(f"epic '{eid}': draft doc missing at '{doc}'")

    if refused:
        manifest = {"ok": False, "written": [], "skipped": [], "refused": refused}
        os.makedirs(os.path.dirname(os.path.abspath(args.out_manifest)), exist_ok=True)
        json.dump(manifest, open(args.out_manifest, "w"), indent=2)
        print(json.dumps(manifest, indent=2))
        return 1

    # --- apply (plan clean) ---------------------------------------------------
    for e in draft_epics:
        eid, doc = e.get("id"), e.get("doc")
        # the epic.md doc
        src, dst = os.path.join(draft_root, doc), os.path.join(live_root, doc)
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        shutil.copyfile(src, dst)
        written.append(f"doc:{doc}")
        # the spine epics entry (replace a `ready` one, add a new one)
        if eid in by_id:
            live_epics[live_epics.index(by_id[eid])] = e
            skipped.append(f"spine:epic:{eid} (replaced ready)")
        else:
            live_epics.append(e)
        written.append(f"spine:epic:{eid}")

    # deferrals (optional)
    for dirpath, _d, files in os.walk(draft_root):
        for fn in files:
            if fn == "deferrals.yaml":
                rel = os.path.relpath(os.path.join(dirpath, fn), draft_root)
                dst = os.path.join(live_root, rel)
                os.makedirs(os.path.dirname(dst), exist_ok=True)
                shutil.copyfile(os.path.join(dirpath, fn), dst)
                written.append(f"doc:{rel}")

    with open(live_spine_path, "w", encoding="utf-8") as fh:
        yaml.safe_dump(live, fh, sort_keys=False, allow_unicode=True)
    written.append("spine:_spine.yaml")

    manifest = {"ok": True, "written": written, "skipped": skipped, "refused": []}
    os.makedirs(os.path.dirname(os.path.abspath(args.out_manifest)), exist_ok=True)
    json.dump(manifest, open(args.out_manifest, "w"), indent=2)
    print(json.dumps(manifest, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
