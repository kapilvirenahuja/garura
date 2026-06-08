#!/usr/bin/env python3
"""
apply_understand.py — persist /understand's result, on a fixed allowlist.

Run only AFTER the human approves the checkpoint. It writes EXACTLY three kinds of
artifact and nothing else:

  1. the target capability's ice.yaml  (the enrichment — this one IS overwritten)
  2. the firmed product profile.yaml   (the rolled-up box)
  3. one decision record per approved box-move (ADR, level product, status accepted)

The script only ever writes the destinations it is handed — it never tree-walks — so it
cannot clobber other capabilities by enumeration (C2/F3 no structure change; C9/F9
non-destructive). This is weaker than a skip-if-exists writer: a wrong-but-consistent
target path would still be written, so check_apply.py (the play's Step 6) is a real
verification, not a formality. Each box-move from the roll-up report becomes its own
decision with the dimension and from->to it represents (C8/F8).

Layer rule: pure file writes from disk inputs; no git/gh/network.

    python3 apply_understand.py \
        --enriched-ice <draft/ice.yaml> --target-ice <live target ice.yaml> \
        --proposed-profile <draft/proposed-profile.yaml> --profile-dest <live profile.yaml> \
        --rollup-report <rollup.json> --decisions-dir <live decisions dir> \
        --capability-ref <id> --decided-by /understand --date <YYYY-MM-DD> \
        --out-manifest <apply-manifest.json>

Exit 0 on success, 2 on usage error.
"""

import argparse
import json
import os
import shutil
import sys


def slug(text):
    return "".join(c if c.isalnum() else "-" for c in text.lower()).strip("-")


def main(argv=None):
    ap = argparse.ArgumentParser(description="Persist /understand on a fixed allowlist.")
    ap.add_argument("--enriched-ice", required=True)
    ap.add_argument("--target-ice", required=True)
    ap.add_argument("--proposed-profile", required=True)
    ap.add_argument("--profile-dest", required=True)
    ap.add_argument("--rollup-report", required=True)
    ap.add_argument("--decisions-dir", required=True)
    ap.add_argument("--capability-ref", required=True)
    ap.add_argument("--decided-by", default="/understand")
    ap.add_argument("--date", required=True, help="decision date (play passes it; never auto-generated)")
    ap.add_argument("--out-manifest", required=True)
    args = ap.parse_args(argv)

    for p in (args.enriched_ice, args.proposed_profile, args.rollup_report):
        if not os.path.isfile(p):
            sys.stderr.write(f"apply_understand.py: missing input {p}\n")
            sys.exit(2)

    written = []

    # 1 — the enriched ICE (overwrite the seed — this is the enrichment)
    os.makedirs(os.path.dirname(args.target_ice), exist_ok=True)
    shutil.copy2(args.enriched_ice, args.target_ice)
    written.append(args.target_ice)

    # 2 — the firmed profile
    os.makedirs(os.path.dirname(args.profile_dest), exist_ok=True)
    shutil.copy2(args.proposed_profile, args.profile_dest)
    written.append(args.profile_dest)

    # 3 — one decision per approved box-move
    with open(args.rollup_report, encoding="utf-8") as fh:
        report = json.load(fh)
    moves = report.get("box_moves", [])
    if moves:
        os.makedirs(args.decisions_dir, exist_ok=True)
    for i, mv in enumerate(moves, 1):
        dim, frm, to = mv["dimension"], mv["from"], mv["to"]
        did = f"dec-{slug(args.capability_ref)}-{slug(dim)}-{frm}-{to}"
        decision = {
            "decision": {
                "id": did,
                "node_ref": None,                 # product-level box move
                "level": "product",
                "title": f"Move {dim} box {frm} -> {to} for {args.capability_ref}",
                "reason": (f"The {args.capability_ref} capability's need on {dim} "
                           f"({to}) exceeds the committed box ({frm}); the box is "
                           f"raised to admit it."),
                "alternatives": [
                    {"name": f"keep {dim} at {frm}",
                     "why_not": f"would block the {args.capability_ref} capability's "
                                f"required {dim} level"},
                ],
                "status": "accepted",             # approved at the /understand checkpoint
                "superseded_by": None,
                "metadata": {"decided_by": args.decided_by, "date": args.date, "version": 1},
            }
        }
        dpath = os.path.join(args.decisions_dir, f"{did}.yaml")
        try:
            import yaml
            with open(dpath, "w", encoding="utf-8") as fh:
                yaml.safe_dump(decision, fh, sort_keys=False)
        except ImportError:
            with open(dpath, "w", encoding="utf-8") as fh:
                json.dump(decision, fh, indent=2)
        written.append(dpath)

    with open(args.out_manifest, "w", encoding="utf-8") as fh:
        json.dump({"written": written, "box_moves": moves}, fh, indent=2)
    print(json.dumps({"written": written, "box_moves": moves}, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
