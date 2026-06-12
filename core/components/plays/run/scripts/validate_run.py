#!/usr/bin/env python3
"""
validate_run.py — assert /run's draft lens is schema-true, just-enough, grounded in the KB
(shape only; grounding_check.py proves the KB tie), reads no forbidden lens, and binds every
target to a real architecture component.

Run over the draft before the checkpoint. The run lens is seven blocks only — environments,
rollout, migrations, config_secrets, cicd, targets (per architecture component), and tco (the
ownership-cost picture, #435). The lens realizes a SLICE; it deploys what /arch designed, so
targets bind to the architecture lens. Enforces /run's artifact-side constraints:

  - C11/F11  schema: the lens carries the v1 envelope (id, slice_ref, type=run, content,
             status); any decision carries its required v1 fields.
  - C3/F3    shape: content has exactly the seven keys
             environments/rollout/migrations/config_secrets/cicd/targets/tco, each present and
             non-empty; no other-lens content smeared in.
  - C6/F6    just enough: rollout has a strategy; environments, migrations, config_secrets,
             and cicd are present; every target names a component and where/how it runs; and
             every architecture component has a target (coverage).
  - C5/F5    binds + reads: every target.component is a real architecture-lens component (no
             dangling target); nothing in the manifest grounds on the measure lens (or a bare
             `lens` source) — the quality/ux/agentic trinity is readable (decision 23).
  - C7/F7    decisions: a manifest grounding flagged `material: true` names a `decision` that
             resolves to a drafted record.
  - C13/F13  TCO: a material tco block — hyperscaler decided (with region + rejected
             alternatives), a concrete service per architecture component with its cost
             driver, >=3 simulation scenarios with load assumptions, a digit-bearing monthly
             range with currency/drivers/excludes/confidence, guardrails; and the manifest
             grounds platform/cost_model/simulation choices.

Grounding-to-KB itself (every choice traces to a KB learning or a recorded proposal) is
proven by grounding_check.py — this script checks the manifest's grounding SHAPE.

Layer rule: reads files on disk only; no git/gh/network.

    python3 validate_run.py --draft <draft_dir> --manifest <run-manifest.yaml> \
            --arch-lens <live architecture.yaml>

Prints {ok, errors[], warnings[], counts} JSON. Exit 0 clean, 1 on violation, 2 usage.
"""

import argparse
import glob
import json
import os
import sys

try:
    import yaml
except ImportError:
    sys.stderr.write("validate_run.py: PyYAML is required (pip install pyyaml).\n")
    sys.exit(2)


def load(path):
    with open(path, encoding="utf-8") as fh:
        return yaml.safe_load(fh) or {}


def _blank(v):
    if v is None:
        return True
    if isinstance(v, str):
        return len(v.strip()) == 0
    if isinstance(v, (list, dict)):
        return len(v) == 0
    return False


# run may reference the ARCHITECTURE lens (it deploys arch's parts); it must NOT read these:
FORBIDDEN_LENS_SOURCES = ("measure", "lens")  # decision 24: the lens trinity is READABLE; measure stays unread (presence-only via lines-up)
CONTENT_KEYS = {"environments", "rollout", "migrations", "config_secrets", "cicd", "targets",
                "tco"}
ALLOWED_SOURCE_TYPES = {"kb", "proposal", "profile", "quality", "ux", "agentic", "arch", "architecture"}  # decision 23: trinity + arch readable
# C13 (#435): the manifest must ground the platform pick and the cost model as choices.
REQUIRED_CHOICE_ASPECTS = {"platform", "cost_model", "simulation"}
CONFIDENCE_LEVELS = {"low", "medium", "high"}
MIN_SIMULATION_SCENARIOS = 3  # at least seed, pilot, expanded


def _has_digit(v):
    return isinstance(v, str) and any(ch.isdigit() for ch in v)


def validate_tco(lp, tco, errors):
    """C13/F13 — the TCO block is material, never generic. Returns the set of component
    names the service map covers (checked against arch components by the caller)."""
    service_components = set()
    if not isinstance(tco, dict) or _blank(tco):
        errors.append(f"{lp}: content.tco is missing or empty — TCO is first-class (C13/F13)")
        return service_components

    hs = tco.get("hyperscaler") or {}
    if _blank(hs.get("selected")):
        errors.append(f"{lp}: tco.hyperscaler.selected is empty — no hyperscaler decision (C13/F13)")
    if _blank(hs.get("default_region")):
        errors.append(f"{lp}: tco.hyperscaler.default_region is empty (C13/F13)")
    alts = hs.get("alternatives") or []
    if not alts:
        errors.append(f"{lp}: tco.hyperscaler.alternatives is empty — at least one "
                      f"considered-and-rejected alternative (C13/F13)")
    for a in alts:
        if _blank((a or {}).get("name")) or _blank((a or {}).get("why_not")):
            errors.append(f"{lp}: a tco.hyperscaler alternative lacks name/why_not (C13/F13)")

    services = tco.get("services") or []
    if not services:
        errors.append(f"{lp}: tco.services is empty — no concrete service map (C13/F13)")
    for s in services:
        s = s or {}
        comp = s.get("component")
        if _blank(comp):
            errors.append(f"{lp}: a tco.services entry names no component (C13/F13)")
            continue
        service_components.add(comp.strip() if isinstance(comp, str) else comp)
        if _blank(s.get("service")):
            errors.append(f"{lp}: tco service map for {comp!r} names no concrete service (C13/F13)")
        if _blank(s.get("cost_driver")):
            errors.append(f"{lp}: tco service map for {comp!r} names no cost driver (C13/F13)")

    scenarios = ((tco.get("simulation") or {}).get("scenarios")) or []
    if len(scenarios) < MIN_SIMULATION_SCENARIOS:
        errors.append(f"{lp}: tco.simulation has {len(scenarios)} scenario(s) — needs at "
                      f"least {MIN_SIMULATION_SCENARIOS} (seed, pilot, expanded) (C13/F13)")
    for sc in scenarios:
        sc = sc or {}
        if _blank(sc.get("name")):
            errors.append(f"{lp}: a tco.simulation scenario has no name (C13/F13)")
        load_keys = [k for k, v in sc.items() if k != "name" and not _blank(v)]
        if len(load_keys) < 2:
            errors.append(f"{lp}: tco.simulation scenario {sc.get('name', '?')!r} states "
                          f"almost no load assumptions (C13/F13)")

    est = tco.get("estimate") or {}
    if not _has_digit(est.get("monthly_range")):
        errors.append(f"{lp}: tco.estimate.monthly_range carries no numbers — a directional "
                      f"range with digits is the floor; generic prose is not (C13/F13)")
    if _blank(est.get("currency")):
        errors.append(f"{lp}: tco.estimate.currency is empty (C13/F13)")
    if (est.get("confidence") or "").strip().lower() not in CONFIDENCE_LEVELS:
        errors.append(f"{lp}: tco.estimate.confidence must be one of "
                      f"{sorted(CONFIDENCE_LEVELS)} (C13/F13)")
    if _blank(est.get("primary_drivers")):
        errors.append(f"{lp}: tco.estimate.primary_drivers is empty — name what drives the "
                      f"cost (C13/F13)")
    if "excludes" not in est:
        errors.append(f"{lp}: tco.estimate.excludes is absent — state what the estimate does "
                      f"not cover (C13/F13)")

    if _blank(tco.get("guardrails")):
        errors.append(f"{lp}: tco.guardrails is empty — budget alert / retention / scale-up "
                      f"triggers (C13/F13)")
    return service_components


def validate_lens(draft_root, errors):
    """C11/C3/C6/C13 — the lens shape + just-enough + TCO. Returns (target component
    names, tco service-map component names)."""
    target_components = set()
    tco_service_components = set()
    lenses = glob.glob(os.path.join(draft_root, "**", "lens", "run.yaml"), recursive=True)
    if not lenses:
        errors.append("no run.yaml in the draft (F3)")
        return target_components, tco_service_components
    for lp in lenses:
        doc = (load(lp).get("lens") or {})
        for f in ("id", "slice_ref", "type", "status"):
            if _blank(doc.get(f)):
                errors.append(f"{lp}: lens missing '{f}' (F11)")
        if doc.get("type") != "run":
            errors.append(f"{lp}: type is '{doc.get('type')}', must be run (F11)")
        content = doc.get("content") or {}
        extra = [k for k in content if k not in CONTENT_KEYS]
        if extra:
            errors.append(f"{lp}: content has keys outside the seven blocks {extra} — "
                          f"environments/rollout/migrations/config_secrets/cicd/targets/tco "
                          f"only (F3)")
        for k in CONTENT_KEYS:
            if _blank(content.get(k)):
                errors.append(f"{lp}: content.{k} is empty (F3/F6)")

        # rollout must carry a strategy (F6)
        rollout = content.get("rollout") or {}
        if isinstance(rollout, dict) and _blank(rollout.get("strategy")):
            errors.append(f"{lp}: rollout has no strategy (blue/green | canary | rolling) (F6)")

        # every target names a component + where/how it runs (F6)
        for t in (content.get("targets") or []):
            comp = (t or {}).get("component")
            if _blank(comp):
                errors.append(f"{lp}: a target names no component (F6)")
                continue
            target_components.add(comp.strip() if isinstance(comp, str) else comp)
            where = (t or {}).get("environment") or (t or {}).get("deploy") or (t or {}).get("where")
            if _blank(where):
                errors.append(f"{lp}: target for {comp!r} says nothing of where/how it runs "
                              f"(environment/deploy) (F6)")

        tco_service_components |= validate_tco(lp, content.get("tco"), errors)
    return target_components, tco_service_components


def collect_decisions(draft_root, errors):
    ids = set()
    for d in glob.glob(os.path.join(draft_root, "**", "decisions", "*.yaml"), recursive=True):
        dec = (load(d).get("decision") or {})
        for f in ("id", "title", "reason", "status", "level"):
            if _blank(dec.get(f)):
                errors.append(f"{d}: decision missing '{f}' (F11)")
        if dec.get("id"):
            ids.add(dec["id"])
    return ids


def _walk_grounds(label, entries, decision_ids, errors):
    """C5 (no forbidden-lens source) + C7 (material → decision resolves). KB-tie is
    grounding_check.py's job; here we check the grounding SHAPE."""
    if _blank(entries):
        errors.append(f"{label} has no grounding source (C4/F4)")
        return
    for e in entries:
        st = (e.get("source_type") or "").strip().lower()
        if _blank(e.get("source")) or not st:
            errors.append(f"{label} has a grounding entry with no source (C4/F4)")
            continue
        if st in FORBIDDEN_LENS_SOURCES:
            errors.append(f"{label} grounds on the {st} lens — /run may read the trinity + the "
                          f"architecture lens, never the measure lens's content (C5/F5)")
        elif st not in ALLOWED_SOURCE_TYPES:
            errors.append(f"{label} source_type '{st}' is not one of {sorted(ALLOWED_SOURCE_TYPES)} (C4/F4)")
        if e.get("material") is True:
            dec = e.get("decision")
            if _blank(dec):
                errors.append(f"{label} is a material choice with no decision recorded (C7/F7)")
            elif dec not in decision_ids:
                errors.append(f"{label} names decision '{dec}' with no drafted record (C7/F7)")


def check_grounding(man, decision_ids, errors):
    """Returns the set of manifest target component names."""
    man_targets = set()
    for ch in (man.get("choices") or []):
        aspect = ch.get("aspect", "<choice>")
        _walk_grounds(f"choice '{aspect}'", ch.get("grounds"), decision_ids, errors)
    for t in (man.get("targets") or []):
        comp = t.get("component", "<target>")
        comp = comp.strip() if isinstance(comp, str) else comp
        man_targets.add(comp)
        _walk_grounds(f"target '{comp}'", t.get("grounds"), decision_ids, errors)
    return man_targets


def arch_components(arch_lens_path, errors):
    if not arch_lens_path or not os.path.isfile(arch_lens_path):
        errors.append(f"architecture lens not found at {arch_lens_path} — /run binds targets "
                      f"to it (C1/C5/F5)")
        return set()
    doc = (load(arch_lens_path).get("lens") or {})
    content = doc.get("content") or {}
    names = set()
    for c in (content.get("components") or []):
        nm = (c or {}).get("name")
        if isinstance(nm, str) and nm.strip():
            names.add(nm.strip())
    return names


def main(argv=None):
    ap = argparse.ArgumentParser(description="Validate /run's draft lens.")
    ap.add_argument("--draft", required=True)
    ap.add_argument("--manifest", required=True)
    ap.add_argument("--arch-lens", required=True)
    args = ap.parse_args(argv)

    draft_root = os.path.join(args.draft, "product-os")
    if not os.path.isdir(draft_root):
        sys.stderr.write(f"validate_run.py: no draft tree at {draft_root}\n")
        sys.exit(2)

    errors, warnings = [], []

    lens_targets, tco_services = validate_lens(draft_root, errors)
    decision_ids = collect_decisions(draft_root, errors)

    try:
        man = (load(args.manifest).get("run") or {})
    except (OSError, yaml.YAMLError) as exc:
        errors.append(f"manifest unreadable: {exc}")
        man = {}

    man_targets = check_grounding(man, decision_ids, errors)
    comps = arch_components(args.arch_lens, errors)

    # lens <-> manifest target agreement
    for c in sorted(lens_targets - man_targets):
        errors.append(f"lens target {c!r} has no grounding entry in the manifest (C4/F4)")
    for c in sorted(man_targets - lens_targets):
        errors.append(f"manifest grounds target {c!r} that is not in the lens (C4/F4)")

    # C5/F5 — every target binds a real architecture component (no dangling)
    for c in sorted(lens_targets - comps):
        errors.append(f"target {c!r} binds to no real architecture component — dangling (C5/F5)")

    # C6/F6 — coverage: every architecture component has a target
    for c in sorted(comps - lens_targets):
        errors.append(f"architecture component {c!r} has no run target (C6/F6)")

    # C13/F13 — the TCO service map covers every architecture component, concretely
    for c in sorted(comps - tco_services):
        errors.append(f"architecture component {c!r} has a target but no concrete service "
                      f"in tco.services (C13/F13)")
    for c in sorted(tco_services - comps):
        errors.append(f"tco.services maps {c!r} which is no architecture component (C13/F13)")

    # C13/C4 — the platform pick, cost model, and simulation are grounded manifest choices
    aspects = {(ch.get("aspect") or "").strip().lower() for ch in (man.get("choices") or [])}
    for need in sorted(REQUIRED_CHOICE_ASPECTS - aspects):
        errors.append(f"manifest has no grounded '{need}' choice — the hyperscaler/platform "
                      f"pick, the cost model, and the simulation must be grounded (C13/F13)")

    counts = {"lens_targets": len(lens_targets), "manifest_targets": len(man_targets),
              "arch_components": len(comps), "decisions": len(decision_ids),
              "choices": len(man.get("choices") or [])}
    result = {"ok": not errors, "errors": errors, "warnings": warnings, "counts": counts}
    print(json.dumps(result, indent=2))
    return 0 if not errors else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
