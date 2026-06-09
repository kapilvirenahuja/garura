#!/usr/bin/env python3
"""
validate_arch.py — assert /arch's draft lens is schema-true, just-enough, grounded, covers
the slice's functionalities end-to-end, and has an acyclic, orphan-free component graph.

Run over the draft before the checkpoint. The architecture lens is three blocks only —
components (the horizontals the slice threads), contracts (the seams crossed, with the data
that flows), and stack (the tech per component, with versions). The lens realizes a SLICE;
its hub is the slice's functionalities' ICE + the profile box. Enforces /arch's artifact-side
constraints:

  - C10/F10  schema: the lens carries the v1 envelope (id, slice_ref, type=architecture,
             content, status) and any decision carries its required v1 fields.
  - C3/F3    shape: content has exactly the three keys components/contracts/stack, each
             present and non-empty; no concrete product/version smeared into components.
  - C5/F5    just enough: every component has layer/kind/part; every contract has
             interface + data; every stack entry has component + tech + version.
  - C4/F4    grounded: every component grounds on a real source (a functionality's ICE or a
             profile surface); every contract grounds on a functionality; every stack pick
             grounds on a decision / profile pin / KB.
  - C7/F7    hub-only: nothing grounds on another lens (quality/ux/agentic/run).
  - C8/F8    decisions: a grounding flagged `material: true` names a `decision` that resolves.
  - C6/F6    vertical build: every functionality of the slice (read straight from the slice
             record) is threaded by at least one component/contract; the component graph
             (manifest `depends_on`) is acyclic; no component is an orphan (unreachable from
             an entry-layer component).

Layer rule: reads files on disk only; no git/gh/network.

    python3 validate_arch.py --draft <draft_dir> --manifest <architecture-manifest.yaml> \
            --slice-file <live slice record .yaml>

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
    sys.stderr.write("validate_arch.py: PyYAML is required (pip install pyyaml).\n")
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


OTHER_LENSES = ("quality", "ux", "agentic", "run", "lens")
CONTENT_KEYS = {"components", "contracts", "stack"}
LAYERS = {"experience", "process", "domain", "cross-cutting"}
KINDS = {"internal", "external"}


def validate_lens(draft_root, errors):
    """C10/C3/C5 — the lens file shape + just-enough coherence.
    Returns (declared component names, stack-covered component names)."""
    components = set()
    stack_components = set()
    lenses = glob.glob(os.path.join(draft_root, "**", "lens", "architecture.yaml"), recursive=True)
    if not lenses:
        errors.append("no architecture.yaml in the draft (F3)")
        return components, stack_components
    for lp in lenses:
        doc = (load(lp).get("lens") or {})
        for f in ("id", "slice_ref", "type", "status"):
            if _blank(doc.get(f)):
                errors.append(f"{lp}: lens missing '{f}' (F10)")
        if doc.get("type") != "architecture":
            errors.append(f"{lp}: type is '{doc.get('type')}', must be architecture (F10)")
        content = doc.get("content") or {}
        extra = [k for k in content if k not in CONTENT_KEYS]
        if extra:
            errors.append(f"{lp}: content has keys outside the three blocks {extra} — "
                          f"components/contracts/stack only (F3)")
        for k in CONTENT_KEYS:
            if _blank(content.get(k)):
                errors.append(f"{lp}: content.{k} is empty (F3)")

        for c in (content.get("components") or []):
            nm = (c or {}).get("name")
            if _blank(nm):
                errors.append(f"{lp}: a component has no name (F5)")
                continue
            components.add(nm.strip() if isinstance(nm, str) else nm)
            layer = (c or {}).get("layer")
            if _blank(layer):
                errors.append(f"{lp}: component {nm!r} has no layer (F5)")
            elif isinstance(layer, str) and layer.strip() not in LAYERS:
                errors.append(f"{lp}: component {nm!r} layer {layer!r} not one of {sorted(LAYERS)} (F5)")
            kind = (c or {}).get("kind")
            if _blank(kind):
                errors.append(f"{lp}: component {nm!r} has no kind (F5)")
            elif isinstance(kind, str) and kind.strip() not in KINDS:
                errors.append(f"{lp}: component {nm!r} kind {kind!r} not one of {sorted(KINDS)} (F5)")
            if _blank((c or {}).get("part")):
                errors.append(f"{lp}: component {nm!r} has no part (the slice's occupancy) (F5)")

        for ct in (content.get("contracts") or []):
            bt = (ct or {}).get("between")
            if _blank(bt):
                errors.append(f"{lp}: a contract has no 'between' (F5)")
            if _blank((ct or {}).get("interface")):
                errors.append(f"{lp}: contract {bt!r} has no interface (F5)")
            if _blank((ct or {}).get("data")):
                errors.append(f"{lp}: contract {bt!r} has no data (the data model that crosses) (F5)")

        for sk in (content.get("stack") or []):
            comp = (sk or {}).get("component")
            if _blank(comp):
                errors.append(f"{lp}: a stack entry names no component (F5)")
            else:
                stack_components.add(comp.strip() if isinstance(comp, str) else comp)
            if _blank((sk or {}).get("tech")):
                errors.append(f"{lp}: stack entry for {comp!r} has no tech (F5)")
            if _blank((sk or {}).get("version")):
                errors.append(f"{lp}: stack entry for {comp!r} has no version (F5)")
    return components, stack_components


def collect_decisions(draft_root, errors):
    ids = set()
    for d in glob.glob(os.path.join(draft_root, "**", "decisions", "*.yaml"), recursive=True):
        dec = (load(d).get("decision") or {})
        for f in ("id", "title", "reason", "status", "level"):
            if _blank(dec.get(f)):
                errors.append(f"{d}: decision missing '{f}' (F10)")
        if dec.get("id"):
            ids.add(dec["id"])
    return ids


def _walk_grounds(label, entries, decision_ids, errors, grounded_funcs, allowed_types,
                  require_material_decision=True):
    if _blank(entries):
        errors.append(f"{label} has no grounding source (C4/F4)")
        return
    for e in entries:
        st = (e.get("source_type") or "").strip().lower()
        if _blank(e.get("source")) or not st:
            errors.append(f"{label} has a grounding entry with no source (C4/F4)")
            continue
        if st in OTHER_LENSES:
            errors.append(f"{label} grounds on another lens '{st}' — "
                          f"/arch reads the slice's hub, never a lens (C7/F7)")
        elif st not in allowed_types:
            errors.append(f"{label} source_type '{st}' is not one of {sorted(allowed_types)} (C4/F4)")
        if st == "ice":
            fr = e.get("functionality_ref")
            if not _blank(fr):
                grounded_funcs.add(fr)
        if require_material_decision and e.get("material") is True:
            dec = e.get("decision")
            if _blank(dec):
                errors.append(f"{label} is a material choice with no decision recorded (C8/F8)")
            elif dec not in decision_ids:
                errors.append(f"{label} names decision '{dec}' with no drafted record (C8/F8)")


def check_grounding(man, decision_ids, errors):
    """C4/C7/C8 over the manifest. Returns (grounded_funcs, manifest_component_names, graph)."""
    grounded_funcs = set()
    comp_names = set()
    graph = {}          # component -> list of depends_on
    for c in (man.get("components") or []):
        nm = c.get("name", "<component>")
        nm = nm.strip() if isinstance(nm, str) else nm
        comp_names.add(nm)
        graph[nm] = [d.strip() if isinstance(d, str) else d for d in (c.get("depends_on") or [])]
        _walk_grounds(f"component '{nm}'", c.get("grounds"), decision_ids, errors,
                      grounded_funcs, allowed_types={"ice", "surface"})

    for ct in (man.get("contracts") or []):
        bt = ct.get("between", "<contract>")
        _walk_grounds(f"contract '{bt}'", ct.get("grounds"), decision_ids, errors,
                      grounded_funcs, allowed_types={"ice"})
        for fr in (ct.get("serves") or []):
            if not _blank(fr):
                grounded_funcs.add(fr)

    for sk in (man.get("stack") or []):
        comp = sk.get("component", "<stack>")
        _walk_grounds(f"stack '{comp}'", sk.get("grounds"), decision_ids, errors,
                      grounded_funcs, allowed_types={"decision", "profile", "kb"})

    return grounded_funcs, comp_names, graph


def find_cycle(graph):
    """DFS cycle detection over the directed component graph. Returns a cycle path or None."""
    WHITE, GRAY, BLACK = 0, 1, 2
    color = {n: WHITE for n in graph}
    stack = []

    def dfs(n):
        color[n] = GRAY
        stack.append(n)
        for m in graph.get(n, []):
            if m not in color:        # dangling edge — handled by caller
                continue
            if color[m] == GRAY:
                return stack[stack.index(m):] + [m]
            if color[m] == WHITE:
                c = dfs(m)
                if c:
                    return c
        color[n] = BLACK
        stack.pop()
        return None

    for n in graph:
        if color[n] == WHITE:
            c = dfs(n)
            if c:
                return c
    return None


def reachable_from(entries, graph):
    seen = set()
    work = list(entries)
    while work:
        n = work.pop()
        if n in seen:
            continue
        seen.add(n)
        work.extend(graph.get(n, []))
    return seen


def slice_functionalities(slice_file, errors):
    """The slice's own functionalities (read straight from the slice record) — the to-cover set."""
    if not slice_file or not os.path.isfile(slice_file):
        errors.append(f"slice record not found at {slice_file} — cannot verify coverage (C6/F6)")
        return set()
    sl = (load(slice_file).get("slice") or {})
    refs = set()
    for f in (sl.get("functionalities") or []):
        fr = (f or {}).get("functionality_ref")
        if fr:
            refs.add(fr)
    return refs


def main(argv=None):
    ap = argparse.ArgumentParser(description="Validate /arch's draft lens.")
    ap.add_argument("--draft", required=True)
    ap.add_argument("--manifest", required=True)
    ap.add_argument("--slice-file", required=True)
    args = ap.parse_args(argv)

    draft_root = os.path.join(args.draft, "product-os")
    if not os.path.isdir(draft_root):
        sys.stderr.write(f"validate_arch.py: no draft tree at {draft_root}\n")
        sys.exit(2)

    errors, warnings = [], []

    lens_components, stack_components = validate_lens(draft_root, errors)
    decision_ids = collect_decisions(draft_root, errors)

    try:
        man = (load(args.manifest).get("architecture") or {})
    except (OSError, yaml.YAMLError) as exc:
        errors.append(f"manifest unreadable: {exc}")
        man = {}

    grounded_funcs, man_components, graph = check_grounding(man, decision_ids, errors)

    # lens <-> manifest component name agreement (C4/F4)
    for c in sorted(lens_components - man_components):
        errors.append(f"lens component {c!r} has no grounding entry in the manifest (C4/F4)")
    for c in sorted(man_components - lens_components):
        errors.append(f"manifest grounds component {c!r} that is not in the lens (C4/F4)")

    # every stack entry must name a declared component (F5)
    for c in sorted(stack_components - lens_components):
        errors.append(f"stack names component {c!r} not in the lens components (F5)")

    # --- C6/F6 graph: dangling edges, acyclic, orphans ----------------------
    for n, deps in graph.items():
        for d in deps:
            if d not in graph:
                errors.append(f"component {n!r} depends_on {d!r} which is not a declared component (F6)")

    cycle = find_cycle(graph)
    if cycle:
        errors.append(f"component graph has a cycle: {' -> '.join(cycle)} (C6/F6)")

    entry_layers = set(man.get("entry_layers") or ["experience"])
    entry_components = {c.get("name") for c in (man.get("components") or [])
                        if (c.get("layer") or "").strip() in entry_layers}
    entry_components = {e.strip() if isinstance(e, str) else e for e in entry_components if e}
    if not entry_components and man_components:
        errors.append(f"no entry-layer component (layers {sorted(entry_layers)}) — "
                      f"the slice has no surface to thread from (C6/F6)")
    reachable = reachable_from(entry_components, graph)
    for c in sorted(man_components - reachable):
        errors.append(f"component {c!r} is an orphan — unreachable from any entry-layer "
                      f"component (C6/F6)")

    # --- C6/F6 coverage: every slice functionality is threaded ---------------
    to_cover = slice_functionalities(args.slice_file, errors)
    for fid in sorted(to_cover):
        if fid not in grounded_funcs:
            errors.append(f"slice functionality {fid!r} is threaded by no component/contract (C6/F6)")

    counts = {
        "lens_components": len(lens_components), "manifest_components": len(man_components),
        "stack_components": len(stack_components), "decisions": len(decision_ids),
        "to_cover": len(to_cover), "grounded_funcs": len(grounded_funcs),
        "entry_components": len(entry_components),
    }
    result = {"ok": not errors, "errors": errors, "warnings": warnings, "counts": counts}
    print(json.dumps(result, indent=2))
    return 0 if not errors else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
