#!/usr/bin/env python3
"""
apply_understand.py — persist /understand's result, on a fixed allowlist.

Run only AFTER the human approves the checkpoint. /understand legitimately UPDATES the
target capability in place (directional -> detailed) and adds its functionalities — but
it must never touch any OTHER capability. So this is an allowlisted enrich-and-add, not
vision's never-overwrite. It writes exactly:

  1. the target capability's detailed `capability.md`  (OVERWRITES the directional one)
  2. one new `functionality.md` per functionality       (additive — new docs)
  3. the live spine `_spine.yaml`, mutated ONLY for:
       - the target capability entry: detail -> detailed, + nfr_needs + compliance_needs
       - new `functionalities` entries (each with capability == the target)
       - the rolled-up `profile` (the firmed box)
       - the target capability's `decisions` list (the box-move ADR ids)
  4. one decision record per approved box-move (ADR, level product, status accepted)

Everything is keyed to --capability-ref: the script refuses to mutate any other
capability's entry and copies only the docs the draft delta names, so it cannot clobber
siblings. check_apply.py (Step 6) verifies the allowlist held — a real check, not a
formality.

Layer rule: pure file writes from disk inputs; no git/gh/network.

    python3 apply_understand.py --draft <draft_dir> --product-base <product_base> \
        --proposed-profile <draft/proposed-profile.yaml> --rollup-report <rollup.json> \
        --capability-ref <cap-id> --decided-by /understand --date <YYYY-MM-DD> \
        --out-manifest <apply-manifest.json>

Exit 0 on success, 2 on usage/parse error.
"""

import argparse
import json
import os
import shutil
import sys

try:
    import yaml
except ImportError:
    sys.stderr.write("apply_understand.py: PyYAML is required (pip install pyyaml).\n")
    sys.exit(2)


def slug(text):
    return "".join(c if c.isalnum() else "-" for c in str(text).lower()).strip("-")


def load(path):
    with open(path, encoding="utf-8") as fh:
        return yaml.safe_load(fh) or {}


def find(entries, eid):
    for e in entries:
        if isinstance(e, dict) and e.get("id") == eid:
            return e
    return None


def main(argv=None):
    ap = argparse.ArgumentParser(description="Persist /understand on a fixed allowlist.")
    ap.add_argument("--draft", required=True, help="draft_dir (holds product-os/ delta + docs)")
    ap.add_argument("--product-base", required=True)
    ap.add_argument("--proposed-profile", required=True, help="rolled-up profile yaml ({profile: ...})")
    ap.add_argument("--rollup-report", required=True)
    ap.add_argument("--capability-ref", required=True, help="the ONLY capability this run may mutate")
    ap.add_argument("--decided-by", default="/understand")
    ap.add_argument("--date", required=True, help="decision date (play passes it; never auto-generated)")
    ap.add_argument("--out-manifest", required=True)
    args = ap.parse_args(argv)

    cap_id = args.capability_ref
    draft_root = os.path.join(args.draft, "product-os")
    live_root = os.path.join(args.product_base, "product-os")
    draft_spine_path = os.path.join(draft_root, "_spine.yaml")
    live_spine_path = os.path.join(live_root, "_spine.yaml")
    for p in (draft_spine_path, live_spine_path, args.proposed_profile, args.rollup_report):
        if not os.path.isfile(p):
            sys.stderr.write(f"apply_understand.py: missing input {p}\n")
            return 2

    draft_spine = load(draft_spine_path)
    live = load(live_spine_path)
    proposed_profile = (load(args.proposed_profile).get("profile") or {})

    written, changed = [], {"capability": None, "functionalities_added": [], "profile": False, "decisions": []}

    # --- 1. the target capability entry: promote in place (allowlisted to cap_id) ---
    draft_cap = find(draft_spine.get("capabilities") or [], cap_id)
    if draft_cap is None:
        sys.stderr.write(f"apply_understand.py: draft has no capability '{cap_id}'\n")
        return 2
    live_caps = live.setdefault("capabilities", [])
    live_cap = find(live_caps, cap_id)
    if live_cap is None:
        sys.stderr.write(f"apply_understand.py: live spine has no capability '{cap_id}' to detail\n")
        return 2
    for field in ("detail", "nfr_needs", "compliance_needs", "one_line", "doc"):
        if field in draft_cap:
            live_cap[field] = draft_cap[field]
    changed["capability"] = cap_id

    # --- 2. new functionality entries (additive; every one must belong to cap_id) ---
    live_funcs = live.setdefault("functionalities", [])
    have = {f.get("id") for f in live_funcs if isinstance(f, dict)}
    for f in draft_spine.get("functionalities") or []:
        if f.get("capability") != cap_id:
            sys.stderr.write(f"apply_understand.py: functionality '{f.get('id')}' is not under "
                             f"'{cap_id}' — refusing (allowlist)\n")
            return 2
        if f.get("id") not in have:
            live_funcs.append(f)
            have.add(f.get("id"))
            changed["functionalities_added"].append(f.get("id"))

    # --- 3. copy the docs the delta names (capability overwrite + new functionality docs) ---
    doc_rels = [draft_cap.get("doc")] + [f.get("doc") for f in (draft_spine.get("functionalities") or [])]
    for rel in doc_rels:
        if not rel:
            continue
        src = os.path.join(draft_root, rel)
        dst = os.path.join(live_root, rel)
        if not os.path.isfile(src):
            sys.stderr.write(f"apply_understand.py: draft doc missing: {rel}\n")
            return 2
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        shutil.copy2(src, dst)
        written.append(f"doc:{rel}")

    # --- 4. the rolled-up profile (replace the box) ---
    live["profile"] = proposed_profile
    changed["profile"] = True

    # --- 5. one decision per approved box-move; link its id onto the capability ---
    report = json.load(open(args.rollup_report, encoding="utf-8"))
    moves = report.get("box_moves", [])
    if moves:
        dec_dir = os.path.join(live_root, "decisions")
        os.makedirs(dec_dir, exist_ok=True)
        cap_decisions = live_cap.setdefault("decisions", [])
        for mv in moves:
            dim, frm, to = mv["dimension"], mv["from"], mv["to"]
            did = f"dec-{slug(cap_id)}-{slug(dim)}-{slug(frm)}-{slug(to)}"
            decision = {"decision": {
                "id": did, "node_ref": cap_id, "level": "product",
                "title": f"Move {dim} box {frm} -> {to} for {cap_id}",
                "reason": (f"The {cap_id} capability's need on {dim} ({to}) exceeds the "
                           f"committed box ({frm}); the box is raised to admit it."),
                "alternatives": [{"name": f"keep {dim} at {frm}",
                                  "why_not": f"would block {cap_id}'s required {dim} level"}],
                "status": "accepted", "superseded_by": None,
                "metadata": {"decided_by": args.decided_by, "date": args.date, "version": 1},
            }}
            dpath = os.path.join(dec_dir, f"{did}.yaml")
            with open(dpath, "w", encoding="utf-8") as fh:
                yaml.safe_dump(decision, fh, sort_keys=False)
            written.append(f"decision:{did}")
            changed["decisions"].append(did)
            if did not in cap_decisions:
                cap_decisions.append(did)

    # --- write the mutated live spine back ---
    with open(live_spine_path, "w", encoding="utf-8") as fh:
        yaml.safe_dump(live, fh, sort_keys=False, allow_unicode=True)
    written.append("spine:_spine.yaml")

    manifest = {"written": written, "capability_ref": cap_id, "changed": changed, "box_moves": moves}
    with open(args.out_manifest, "w", encoding="utf-8") as fh:
        json.dump(manifest, fh, indent=2)
    print(json.dumps(manifest, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
