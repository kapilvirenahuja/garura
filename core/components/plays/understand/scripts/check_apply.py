#!/usr/bin/env python3
"""
check_apply.py — assert /understand's persisted result obeys its guarantees.

Post-apply verification over the apply manifest + the before/after spine. /understand may
detail the TARGET capability and add its functionalities, firm the profile, and record
box-move decisions — and nothing else. This diffs the spine before and after to prove it:

  - allowlist: no domain changed; no capability other than the target changed; every new
    functionality belongs to the target; no functionality was removed or edited.
  - promotion: the target capability is now detail: detailed with nfr_needs.
  - monotonic + state: profile.state == set; no dimension lowered.
  - decisions: one decision per box-move, each level product, status accepted, naming its
    dimension and from->to.
  - docs: every written doc sits under the target capability's folder.

Layer rule: reads files on disk only; no git/gh/network.

    python3 check_apply.py --manifest <apply-manifest.json> \
        --spine-before <saved before _spine.yaml> --spine-after <live _spine.yaml> \
        --capability-ref <cap-id>

Prints {ok, errors[]} JSON. Exit 0 clean, 1 on any violation, 2 on usage error.
"""

import argparse
import json
import os
import sys

try:
    import yaml
except ImportError:
    sys.stderr.write("check_apply.py: PyYAML is required (pip install pyyaml).\n")
    sys.exit(2)

SCALE = ["none", "low", "medium", "high", "xhigh"]


def rank(level):
    try:
        return SCALE.index((level or "none").strip().lower())
    except ValueError:
        return 0


def load(path):
    with open(path, encoding="utf-8") as fh:
        return yaml.safe_load(fh) or {}


def by_id(spine, key):
    return {e.get("id"): e for e in (spine.get(key) or []) if isinstance(e, dict)}


def main(argv=None):
    ap = argparse.ArgumentParser(description="Verify /understand's persisted result.")
    ap.add_argument("--manifest", required=True)
    ap.add_argument("--spine-before", required=True)
    ap.add_argument("--spine-after", required=True)
    ap.add_argument("--capability-ref", required=True)
    args = ap.parse_args(argv)

    try:
        manifest = json.load(open(args.manifest, encoding="utf-8"))
        before = load(args.spine_before)
        after = load(args.spine_after)
    except (OSError, ValueError, yaml.YAMLError) as exc:
        sys.stderr.write(f"check_apply.py: cannot read input: {exc}\n")
        return 2

    cap = args.capability_ref
    errors = []
    moves = manifest.get("box_moves", [])

    db, da = by_id(before, "domains"), by_id(after, "domains")
    cb, ca = by_id(before, "capabilities"), by_id(after, "capabilities")
    fb, fa = by_id(before, "functionalities"), by_id(after, "functionalities")

    # --- allowlist: domains untouched ---
    for did in set(db) | set(da):
        if db.get(did) != da.get(did):
            errors.append(f"domain '{did}' changed — /understand changes no domain")

    # --- allowlist: only the target capability may change ---
    for cid in set(cb) | set(ca):
        if cid == cap:
            continue
        if cb.get(cid) != ca.get(cid):
            errors.append(f"capability '{cid}' changed but only '{cap}' may be touched")

    # --- promotion of the target ---
    tgt = ca.get(cap)
    if tgt is None:
        errors.append(f"target capability '{cap}' is absent after apply")
    else:
        if tgt.get("detail") != "detailed":
            errors.append(f"target '{cap}' detail is '{tgt.get('detail')}', must be 'detailed'")
        if not tgt.get("nfr_needs"):
            errors.append(f"target '{cap}' has no nfr_needs after detailing")

    # --- functionalities: only new-under-target added; none removed or edited ---
    for fid in set(fb) | set(fa):
        if fid not in fb:                       # newly added
            if fa[fid].get("capability") != cap:
                errors.append(f"new functionality '{fid}' is not under '{cap}' (allowlist)")
        elif fid not in fa:
            errors.append(f"functionality '{fid}' was removed — /understand only adds")
        elif fb[fid] != fa[fid]:
            errors.append(f"existing functionality '{fid}' changed — /understand only adds new ones")

    # --- profile monotonic + state ---
    pb, pa = before.get("profile") or {}, after.get("profile") or {}
    if (pa.get("state") or "").strip().lower() != "set":
        errors.append(f"profile.state is '{pa.get('state')}', must be 'set'")
    nb, na = pb.get("nfr") or {}, pa.get("nfr") or {}
    for dim, spec in nb.items():
        if rank((na.get(dim) or {}).get("level")) < rank((spec or {}).get("level")):
            errors.append(f"dimension '{dim}' lowered")

    # --- decisions: one per box-move ---
    live_root = os.path.dirname(os.path.abspath(args.spine_after))
    dec_dir = os.path.join(live_root, "decisions")
    dec_docs = []
    if os.path.isdir(dec_dir):
        for fn in os.listdir(dec_dir):
            if fn.endswith((".yaml", ".yml")):
                try:
                    d = load(os.path.join(dec_dir, fn))
                    dec_docs.append(d.get("decision", d))
                except yaml.YAMLError as exc:
                    errors.append(f"decision {fn} unreadable: {exc}")
    for mv in moves:
        dim, frm, to = mv["dimension"], str(mv["from"]), str(mv["to"])
        match = next((d for d in dec_docs
                      if dim in (d.get("title") or "") and frm in (d.get("title") or "")
                      and to in (d.get("title") or "")), None)
        if not match:
            errors.append(f"box-move {dim} {frm}->{to} has no decision record")
            continue
        if match.get("level") != "product":
            errors.append(f"decision for {dim} is level '{match.get('level')}', must be product")
        if match.get("status") != "accepted":
            errors.append(f"decision for {dim} status '{match.get('status')}', must be accepted")

    # --- written docs under the target capability folder ---
    cap_dir = os.path.dirname(tgt.get("doc")) if tgt and tgt.get("doc") else None
    for w in manifest.get("written", []):
        if w.startswith("doc:") and cap_dir:
            rel = w[len("doc:"):]
            if not rel.startswith(cap_dir):
                errors.append(f"written doc outside the target capability folder: {rel}")

    result = {"ok": not errors, "errors": errors,
              "moves": len(moves), "decisions": len(dec_docs)}
    print(json.dumps(result, indent=2))
    return 0 if not errors else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
