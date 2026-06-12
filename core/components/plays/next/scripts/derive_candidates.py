#!/usr/bin/env python3
"""
derive_candidates.py — the /next decision tree, as code (C6/C8/C9, F2/F6).

A PURE FUNCTION over the scan_model.py snapshot: same snapshot in, same
candidate set out — no clock, no randomness, no file reads beyond the two
arguments. Emits every action that is currently RUNNABLE or BLOCKED (with the
blocker named), plus the model-inconsistency report (the repair lane, C5).

The tree (framed with the user, #434 follow-on):

  no model ............................................. /vision
  goals-only capability ICE or profile directional ..... /understand
  profile set/locked, domain has ICE but no slices ..... /shape {domain}
  slices proposed / unordered .......................... /roadmap
  per planned slice (roadmap order + depends_on cited):
      first missing lens of quality -> ux -> agentic
      -> architecture -> measure -> run ................ that lens play
  REPAIR: slice realized but a lens missing ............ the missing lens play
      (blocks grill/implement on that slice — carries the blocker flag)
  realized slice, never grilled ........................ /grill {slice}
  epics: fix_required .................................. /implement (fix round)
         ready + deps delivered ........................ /implement {epic}
         ready + deps NOT delivered .................... blocked (dep named)
         in_delivery ................................... /validate {epic}
         validated ..................................... /launch {epic}
  realized slice, grilled, all epics delivered/gone .... /enrich (learning)
  everything delivered ................................. strategy refresh
      (/shape from deferred when a deferred bucket exists; /roadmap re-plan)

Layer rule: no git/gh/network. Deterministic ordering: candidates sorted by
(lane_rank, order_hint, id).

    python3 derive_candidates.py --state <model-state.json> --out <candidates.json>

Exit 0 on success (even with zero candidates), 2 on usage error.
"""

import argparse
import hashlib
import json
import sys

LENS_CHAIN = ["quality", "ux", "agentic", "architecture", "measure", "run"]
LENS_PLAY = {"quality": "quality", "ux": "ux", "agentic": "agentic",
             "architecture": "arch", "measure": "measure", "run": "run"}
LANE_RANK = {"repair": 0, "execute": 1, "grill": 2, "foundation": 3,
             "lens": 4, "strategy": 5, "learning": 6, "refresh": 7}
EPIC_STATUSES = {"ready", "in_delivery", "validated", "fix_required", "delivered"}


def cand(cid, play, command, target, lane, status="runnable", blocker=None,
         gates=None, order_hint=0, unblocks=None, repair=False, parallel=False):
    return {"id": cid, "play": play, "command": command, "target": target,
            "lane": lane, "status": status, "blocker": blocker,
            "gates": sorted(g for g in (gates or []) if g),
            "order_hint": order_hint,
            "unblocks": sorted(u for u in (unblocks or []) if u),
            "repair": repair,
            "parallel_lane": parallel}


def slice_ref(domain, sl):
    return f"{domain}/{sl['id']}"


def derive(state):
    candidates, inconsistencies = [], []

    # ---- cold start -----------------------------------------------------
    if not state.get("model_exists"):
        candidates.append(cand(
            "strategy/vision", "vision", "/vision", "(new product)", "strategy",
            gates=["no product model exists under product-os/"],
            unblocks=["the whole strategy pipeline (understand, shape, roadmap)"]))
        return candidates, inconsistencies

    profile = state.get("profile") or {}
    profile_state = profile.get("state") or "directional"

    any_slices = any(d.get("slices") for d in state["domains"])
    goals_only = [i for d in state["domains"] for i in d.get("ices", [])
                  if i.get("depth") == "goals-only"]

    # ---- strategy: understand / shape / roadmap -------------------------
    if profile_state == "directional" or (goals_only and not any_slices):
        why = [f"profile state is '{profile_state}' (must be set before /shape)"]
        if goals_only:
            why.append(f"{len(goals_only)} capability ICE still goals-only "
                       "(seed depth, not yet enriched)")
        candidates.append(cand(
            "strategy/understand", "understand", "/understand", "(product)",
            "strategy", gates=why,
            unblocks=["/shape (needs a set profile and rich capability ICE)"]))

    if profile_state in ("set", "locked"):
        for d in state["domains"]:
            if d.get("ices") and not d.get("slices"):
                candidates.append(cand(
                    f"strategy/shape/{d['id']}", "shape", f"/shape {d['id']}",
                    d["id"], "strategy",
                    gates=[f"profile is '{profile_state}'",
                           f"domain '{d['id']}' has capability ICE but no slices"],
                    unblocks=["/roadmap", "the realize lenses for this domain"]))

    unplanned = [(d["id"], s) for d in state["domains"] for s in d["slices"]
                 if s["status"] == "proposed" or (s["status"] not in ("deferred",)
                                                  and s.get("order") is None)]
    if unplanned:
        candidates.append(cand(
            "strategy/roadmap", "roadmap", "/roadmap", "(all slices)", "strategy",
            gates=[f"{len(unplanned)} slice(s) unplanned (status proposed / no order): "
                   + ", ".join(slice_ref(dm, s) for dm, s in unplanned)],
            unblocks=["the realize pipelines (lens work runs in roadmap order)"]))

    # ---- per-slice: lenses, repair, grill, epics -------------------------
    all_slices = [(d["id"], s) for d in state["domains"] for s in d["slices"]]
    by_id = {s["id"]: s for _, s in all_slices}
    in_flight_orders = sorted(s.get("order") or 0 for _, s in all_slices
                              if s["status"] in ("planned", "realized"))
    first_order = in_flight_orders[0] if in_flight_orders else 0

    fully_delivered, learning_targets = [], []

    for domain, sl in all_slices:
        ref = slice_ref(domain, sl)
        order = sl.get("order") or 0
        if sl["status"] == "deferred":
            continue
        if sl["status"] not in ("proposed", "planned", "realized") and sl["status"]:
            inconsistencies.append({
                "kind": "unknown-slice-status", "target": ref,
                "detail": f"slice status '{sl['status']}' is outside the vocabulary "
                          "(proposed|planned|realized|deferred)"})

        dep_state = []
        for dep in sl.get("depends_on") or []:
            dep_sl = by_id.get(dep)
            if dep_sl is None:
                inconsistencies.append({
                    "kind": "broken-slice-dependency", "target": ref,
                    "detail": f"depends_on '{dep}' does not resolve to any slice"})
            else:
                dep_state.append(f"depends_on {dep} is '{dep_sl['status']}'")

        missing = [lt for lt in LENS_CHAIN if not sl["lenses"].get(lt)]
        parallel = order > first_order

        # -- repair: realized but incomplete (C5) --
        if sl["status"] == "realized" and missing:
            lens = missing[0]
            inconsistencies.append({
                "kind": "realized-but-lens-missing", "target": ref,
                "detail": f"slice is stamped realized but lens(es) missing: "
                          f"{', '.join(missing)} — downstream gates "
                          "(grill/implement) require all six"})
            candidates.append(cand(
                f"repair/{ref}/{lens}", LENS_PLAY[lens],
                f"/{LENS_PLAY[lens]} {ref}", ref, "repair",
                gates=[f"slice status is 'realized' but '{lens}' lens is absent"],
                order_hint=order, repair=True,
                unblocks=[f"every epic of {ref} (the six-lens gate)",
                          f"/grill on {ref}" if not sl["epics_dir_exists"] else ""]))
            # the queue behind the broken gate stays VISIBLE (S1/F6): every
            # live epic of this slice is a blocked candidate naming the lens
            epic_by_id = {e["id"]: e for e in sl["epics"]}
            for e in sorted(sl["epics"], key=lambda e: (e.get("order") or 0,
                                                        e["id"])):
                if e["status"] == "delivered":
                    continue
                eref = f"{ref}/{e['id']}"
                dep_note = []
                for dep in e.get("depends_on") or []:
                    dep_e = epic_by_id.get(dep)
                    if dep_e and dep_e["status"] != "delivered":
                        dep_note.append(f"also waits for {dep} "
                                        f"(is '{dep_e['status']}')")
                play_for = {"ready": ("implement", f"/implement --epic {eref}"),
                            "fix_required": ("implement",
                                             f"/implement --epic {eref}"),
                            "in_delivery": ("validate", f"/validate --epic {eref}"),
                            "validated": ("launch", f"/launch --epic {eref}")}
                pl, cmd = play_for.get(e["status"],
                                       ("implement", f"/implement --epic {eref}"))
                candidates.append(cand(
                    f"execute/{eref}", pl, cmd, eref, "execute",
                    status="blocked",
                    blocker=f"slice gate broken: '{', '.join(missing)}' lens "
                            f"missing on {ref} — repair first"
                            + ("; " + "; ".join(dep_note) if dep_note else ""),
                    gates=[f"epic status '{e['status']}', order {e.get('order')}",
                           "the six-lens gate requires all lenses present"],
                    order_hint=order))

        # -- planned slice: walk the lens chain --
        if sl["status"] == "planned" and missing:
            lens = missing[0]
            lane = "foundation" if lens in ("architecture", "measure", "run") else "lens"
            candidates.append(cand(
                f"{lane}/{ref}/{lens}", LENS_PLAY[lens],
                f"/{LENS_PLAY[lens]} {ref}", ref, lane,
                gates=[f"slice is planned at roadmap order {order}",
                       f"lens chain position: '{lens}' is the first missing of "
                       f"quality→ux→agentic→architecture→measure→run"] + dep_state,
                order_hint=order, parallel=parallel,
                unblocks=[f"the next lens in {ref}'s chain",
                          f"/run's realized stamp on {ref}" if lens == "run" else ""]))

        if sl["status"] == "planned" and not missing:
            inconsistencies.append({
                "kind": "lenses-complete-but-unstamped", "target": ref,
                "detail": "all six lenses exist but the slice is not stamped "
                          "realized — /run's stamp step did not finish"})
            candidates.append(cand(
                f"repair/{ref}/stamp", "run", f"/run {ref}", ref, "repair",
                gates=["all six lens files exist", "slice status is still 'planned'"],
                order_hint=order, repair=True,
                unblocks=[f"/grill on {ref}"]))

        # -- realized + complete: grill or execute --
        if sl["status"] == "realized" and not missing:
            if not sl["epics_dir_exists"] and not sl["deferrals_exists"]:
                candidates.append(cand(
                    f"grill/{ref}", "grill", f"/grill {ref}", ref, "grill",
                    gates=["slice is realized with all six lenses",
                           "no epics cut yet (no epics/ folder)"] + dep_state,
                    order_hint=order, parallel=parallel,
                    unblocks=["the execute pipeline (implement/validate/launch)"]))
            else:
                epics = sl["epics"]
                live = [e for e in epics if e["status"] != "delivered"]
                if not live:
                    fully_delivered.append(ref)
                    learning_targets.append((domain, sl, order))
                epic_by_id = {e["id"]: e for e in epics}
                for e in sorted(epics, key=lambda e: (e.get("order") or 0, e["id"])):
                    eref = f"{ref}/{e['id']}"
                    st = e["status"]
                    if st and st not in EPIC_STATUSES:
                        inconsistencies.append({
                            "kind": "unknown-epic-status", "target": eref,
                            "detail": f"epic status '{st}' is outside the vocabulary"})
                        continue
                    undelivered = []
                    for dep in e.get("depends_on") or []:
                        dep_e = epic_by_id.get(dep)
                        if dep_e is None:
                            inconsistencies.append({
                                "kind": "broken-epic-dependency", "target": eref,
                                "detail": f"depends_on '{dep}' does not exist "
                                          "in this slice"})
                        elif dep_e["status"] != "delivered":
                            undelivered.append(f"{dep} (is '{dep_e['status']}')")
                    if st in ("in_delivery", "fix_required") and not e.get("issue_ref"):
                        inconsistencies.append({
                            "kind": "epic-missing-issue-ref", "target": eref,
                            "detail": f"epic is '{st}' but carries no issue_ref"})
                    if st == "ready":
                        if undelivered:
                            candidates.append(cand(
                                f"execute/{eref}", "implement",
                                f"/implement --epic {eref}", eref, "execute",
                                status="blocked",
                                blocker="waits for dependency epic(s): "
                                        + ", ".join(undelivered),
                                gates=[f"epic order {e.get('order')}",
                                       "deps must be 'delivered' "
                                       "(check_ready_epic gate)"],
                                order_hint=order, parallel=parallel))
                        else:
                            candidates.append(cand(
                                f"execute/{eref}", "implement",
                                f"/implement --epic {eref}", eref, "execute",
                                gates=["epic status 'ready'",
                                       "all depends_on delivered",
                                       "slice realized with six lenses"],
                                order_hint=order, parallel=parallel,
                                unblocks=[d for d, de in
                                          ((x["id"], x.get("depends_on") or [])
                                           for x in epics) if e["id"] in de]))
                    elif st == "fix_required":
                        candidates.append(cand(
                            f"execute/{eref}/fix", "implement",
                            f"/implement --epic {eref}", eref, "execute",
                            gates=["epic status 'fix_required' — the fix round "
                                   "(re-admits /implement with the validate "
                                   "fix report)"],
                            order_hint=order,
                            unblocks=[f"/validate then /launch on {e['id']}"]))
                    elif st == "in_delivery":
                        candidates.append(cand(
                            f"execute/{eref}/validate", "validate",
                            f"/validate --epic {eref}", eref, "execute",
                            gates=["epic status 'in_delivery' "
                                   "(its /validate gate also requires "
                                   "/implement's verdict to hold)"],
                            order_hint=order,
                            unblocks=[f"/launch on {e['id']}"]))
                    elif st == "validated":
                        candidates.append(cand(
                            f"execute/{eref}/launch", "launch",
                            f"/launch --epic {eref}", eref, "execute",
                            gates=["epic status 'validated' — /launch's hard "
                                   "precondition"],
                            order_hint=order,
                            unblocks=["delivery (epic merges and leaves the model)"]))

    # ---- learning + strategy refresh -------------------------------------
    for domain, sl, order in learning_targets:
        ref = slice_ref(domain, sl)
        candidates.append(cand(
            f"learning/{ref}", "enrich", "/enrich", ref, "learning",
            gates=[f"{ref} is grilled and every epic is delivered/cleared"],
            order_hint=order,
            unblocks=["the KB and product LTM (skipping learning piles up "
                      "corrections later)"]))

    live_work = [c for c in candidates
                 if c["lane"] in ("strategy", "lens", "foundation", "grill",
                                  "execute", "repair")]
    if not live_work and any_slices:
        deferred_domains = [d["id"] for d in state["domains"]
                            if d.get("deferred") and
                            (d["deferred"].get("functionalities"))]
        for dom in deferred_domains:
            candidates.append(cand(
                f"refresh/shape/{dom}", "shape", f"/shape {dom}", dom, "refresh",
                gates=["all in-flight work is delivered",
                       f"domain '{dom}' holds a deferred bucket — parked "
                       "functionality ready to be re-shaped"],
                unblocks=["the next round of slices"]))
        candidates.append(cand(
            "refresh/roadmap", "roadmap", "/roadmap", "(all slices)", "refresh",
            gates=["all in-flight work is delivered — re-plan from here"],
            unblocks=["the next build cycle"]))

    candidates.sort(key=lambda c: (LANE_RANK.get(c["lane"], 9),
                                   c["order_hint"], c["id"]))
    return candidates, inconsistencies


def main(argv=None):
    ap = argparse.ArgumentParser(description="/next decision tree over the model snapshot.")
    ap.add_argument("--state", required=True)
    ap.add_argument("--out", required=True)
    args = ap.parse_args(argv)

    with open(args.state, encoding="utf-8") as fh:
        state = json.load(fh)

    candidates, inconsistencies = derive(state)
    payload_for_hash = json.dumps(
        {"candidates": candidates, "inconsistencies": inconsistencies},
        sort_keys=True)
    out = {
        "derived_from_model_hash": state.get("model_hash"),
        "candidates": candidates,
        "inconsistencies": inconsistencies,
        "derivation_hash": "sha256:" + hashlib.sha256(
            payload_for_hash.encode("utf-8")).hexdigest(),
    }
    with open(args.out, "w", encoding="utf-8") as fh:
        json.dump(out, fh, indent=2, sort_keys=True)
    print(json.dumps({"ok": True,
                      "candidates": len(candidates),
                      "runnable": sum(1 for c in candidates
                                      if c["status"] == "runnable"),
                      "blocked": sum(1 for c in candidates
                                     if c["status"] == "blocked"),
                      "inconsistencies": len(inconsistencies),
                      "derivation_hash": out["derivation_hash"],
                      "out": args.out}, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
