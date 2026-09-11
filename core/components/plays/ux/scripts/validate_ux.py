#!/usr/bin/env python3
"""
validate_ux.py — assert /ux's lens is grounded and covers the slice's functionalities.

Run over the manifest before the checkpoint (direct-model-write, ADR 026). The ux lens is an
MD grounding doc (`ux.md`) written straight to the live model; its SHAPE (the
Intent/Screens/Flows/States/Visual core sections, each substantive) is checked by
`lint_grounding.py`, and its UNDERSTANDABILITY by the content eval — both run by the play's
validate step. THIS script checks the things the manifest carries, which the prose can't
enforce, plus the one cross-check the doc's own text carries:

  - C4/F4    grounded: every screen in the manifest names >=1 real source (a functionality of
             the slice, or a persona/journey); the visual core grounds on the KB or a decision.
  - C7/F7    hub-only: no screen or flow grounds on another lens (quality/agentic/run/...).
  - C14/F15  flow grounding: every flow in the manifest names >=1 real source (a persona or
             journey of the hub) — the half of C14 the lens text alone cannot prove.
  - C8/F8    decisions: a grounding flagged `material: true` names a `decision` that resolves —
             either the manifest's `decision_delta` (the decision the keyed persist will write)
             or a decision already on the live model (a reused product/slice decision).
  - C6/F6    coverage: the slice's functionalities (read from the slice record) are each
             grounded by at least one screen — nothing shaped is left unvisualized.
  - C14/F15  flows: parsed from the written `ux.md` itself (`--lens`) — every flow block names
             all seven fields (Persona, Goal, Entry, Steps, Decisions, Failure, Exit); every
             step names a screen that exists in `## Screens`; every screen in `## Screens` is
             named by at least one flow step (no unreachable screen); and every decision point
             says where each branch goes. Skipped with a warning when `--lens` is not passed.
  - C14/F15  flow RESOLUTION (`--readiness`, the JSON `check_ready_slice.py` emits): a flow
             EXPANDS one of the slice's journey records, so every manifest flow must name the
             journey id it expands AND the persona id that journey serves, and BOTH must appear
             in the readiness JSON's `journeys` / `personas` lists — an id that resolves to
             nothing is an error, never a warning, and the persona named must be the one the
             journey record itself serves. The reverse also holds: every resolved journey of
             the slice must be expanded by at least one flow, so none of the slice's real paths
             is left undrawn. Skipped with a warning when `--readiness` is not passed.

There is NO draft tree: the visual-core decision is carried in the manifest as `decision_delta`
until the keyed persist (`persist_ux.py`) writes it in place. Reused decisions are resolved
against the live model under `--product-base`.

Layer rule: reads files on disk only; no git/gh/network.

    python3 validate_ux.py --manifest <ux-manifest.yaml> \
            --slice-file <live slice record .yaml> [--product-base <product_base>] \
            [--lens <live lens/ux.md>] [--readiness <check_ready_slice.py output .json>]

Prints {ok, errors[], warnings[], counts} JSON. Exit 0 clean, 1 on violation, 2 usage.
"""

import argparse
import glob
import json
import os
import re
import sys

try:
    import yaml
except ImportError:
    sys.stderr.write("validate_ux.py: PyYAML is required (pip install pyyaml).\n")
    sys.exit(2)

OTHER_LENSES = ("quality", "agentic", "architecture", "run", "measure", "marketing", "lens")


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


def manifest_decisions(man, errors):
    """Decision ids this run will persist — from the manifest's decision_delta(s).

    The delta's `record` is the decision body the keyed persist writes; validate it carries
    the fields a decision must have, then register its id as resolvable.
    """
    ids = set()
    deltas = man.get("decision_delta") or man.get("decision") or []
    if isinstance(deltas, dict):
        deltas = [deltas]
    for d in (deltas or []):
        if not isinstance(d, dict) or not d:
            continue
        rec = d.get("record") or {}
        dec = rec.get("decision") if isinstance(rec.get("decision"), dict) else rec
        did = d.get("id") or (dec.get("id") if isinstance(dec, dict) else None)
        for f in ("id", "status", "level"):
            if _blank((dec or {}).get(f)) and _blank(d.get(f)):
                errors.append(f"decision_delta {did or '<?>'}: record missing '{f}' (C8/F8)")
        if did:
            ids.add(did)
    return ids


def live_decisions(product_base):
    """Decision ids already on the live model — so a reused decision resolves."""
    ids = set()
    if not product_base:
        return ids
    root = os.path.join(product_base, "product-os")
    if not os.path.isdir(root):
        return ids
    for d in glob.glob(os.path.join(root, "**", "decisions", "*.yaml"), recursive=True):
        try:
            body = load(d)
        except (OSError, yaml.YAMLError):
            continue
        dec = body.get("decision") if isinstance(body.get("decision"), dict) else body
        if isinstance(dec, dict) and dec.get("id"):
            ids.add(dec["id"])
    return ids


def check_grounding(man, decision_ids, errors):
    """C4/C7/C8 over the manifest. Returns grounded functionality refs."""
    grounded_funcs = set()

    def walk(label, entries):
        if _blank(entries):
            errors.append(f"{label} has no grounding source (C4/F4)")
            return
        for e in entries:
            st = (e.get("source_type") or "").strip().lower()
            if _blank(e.get("source")) or not st:
                errors.append(f"{label} has a grounding entry with no source (C4/F4)")
                continue
            if st in OTHER_LENSES:
                errors.append(f"{label} grounds on another lens '{st}' — /ux reads the slice's "
                              f"hub, never a lens (C7/F7)")
            elif st not in ("ice", "functionality", "persona", "journey"):
                errors.append(f"{label} source_type '{st}' is not functionality/persona/journey (C4/F4)")
            if st in ("ice", "functionality"):
                fr = e.get("functionality_ref")
                if not _blank(fr):
                    grounded_funcs.add(fr)
            if e.get("material") is True:
                dec = e.get("decision")
                if _blank(dec):
                    errors.append(f"{label} is a material choice with no decision recorded (C8/F8)")
                elif dec not in decision_ids:
                    errors.append(f"{label} names decision '{dec}' with no resolvable record (C8/F8)")

    for s in (man.get("screens") or []):
        walk(f"screen '{s.get('name', '<screen>')}'", s.get("grounds"))

    # C14/F15 — every flow's persona traces to a persona/journey of the hub, never an
    # invented one. The lens-side structural cross-check (check_flows) cannot see the hub;
    # this is the manifest half of the same constraint.
    for f in (man.get("flows") or []):
        label = f"flow '{f.get('id') or f.get('persona') or '<flow>'}'"
        gs = f.get("grounds") or []
        walk(label, gs)
        # C14 is narrower than the generic walk: a flow is a PERSON taking a path, so it must
        # name a persona or a journey. A functionality alone is not who.
        if gs and not any(
            (g or {}).get("source_type") in ("persona", "journey")
            for g in gs if isinstance(g, dict)
        ):
            errors.append(f"{label} names no persona/journey source — a flow traces to who "
                          f"takes it, not only to what it touches (C14/F15)")

    ds = man.get("design_system") or man.get("visual_core") or {}
    vt = (ds.get("source_type") or "").strip().lower()
    if vt not in ("kb", "decision"):
        errors.append("visual core must ground on a KB technology learning or a decision (C4/F4)")
    if vt == "decision":
        dec = ds.get("decision")
        if _blank(dec):
            errors.append("visual core has no decision recorded (C8/F8)")
        elif dec not in decision_ids:
            errors.append(f"visual core names decision '{dec}' with no resolvable record (C8/F8)")
    return grounded_funcs


def flow_ids(flow):
    """The journey id and the persona id a manifest flow names, or None for each.

    Accepted either on the flow itself (`journey_ref` / `journey`, `persona_ref`) or on its
    grounding entries (a `source_type` of journey/persona, reading `journey_ref`/`persona_ref`
    and falling back to `source`). The flow's `persona` field is a display NAME ("Analyst"),
    not an id, so it is never read as one.
    """
    jid = flow.get("journey_ref") or flow.get("journey")
    pid = flow.get("persona_ref")
    for g in (flow.get("grounds") or []):
        if not isinstance(g, dict):
            continue
        st = (g.get("source_type") or "").strip().lower()
        if st == "journey" and _blank(jid):
            jid = g.get("journey_ref") or g.get("source")
        elif st == "persona" and _blank(pid):
            pid = g.get("persona_ref") or g.get("source")
    jid = jid.strip() if isinstance(jid, str) else jid
    pid = pid.strip() if isinstance(pid, str) else pid
    return (jid or None), (pid or None)


def check_readiness(man, readiness, errors):
    """C14/F15 — the manifest half of flow resolution, against the readiness hand-over.

    A flow EXPANDS a journey record of the slice: the journey supplies the persona and the
    ordered steps, /ux adds the screens, the forks, the failure path and the exit. So every
    flow must name a journey id and a persona id that the readiness check actually resolved to
    records on disk, and every resolved journey must be expanded by some flow.
    """
    counts = {"resolved_personas": 0, "resolved_journeys": 0, "flows_grounded": 0}
    persona_ids = {p.get("id") for p in (readiness.get("personas") or [])
                   if isinstance(p, dict) and p.get("id")}
    journeys = {j.get("id"): j for j in (readiness.get("journeys") or [])
                if isinstance(j, dict) and j.get("id")}
    counts["resolved_personas"] = len(persona_ids)
    counts["resolved_journeys"] = len(journeys)

    expanded = set()
    for f in (man.get("flows") or []):
        if not isinstance(f, dict):
            continue
        label = f"flow '{f.get('id') or f.get('persona') or '<flow>'}'"
        jid, pid = flow_ids(f)
        ok_flow = True
        if jid is None:
            errors.append(f"{label} names no journey id — a flow EXPANDS one of the slice's "
                          f"journey records, it is never invented (C14/F15)")
            ok_flow = False
        elif jid not in journeys:
            errors.append(f"{label} names journey '{jid}', which resolves to no journey record "
                          f"the readiness check handed over (C14/F15)")
            ok_flow = False
        if pid is None:
            errors.append(f"{label} names no persona id — name the persona the journey it "
                          f"expands serves (C14/F15)")
            ok_flow = False
        elif pid not in persona_ids:
            errors.append(f"{label} names persona '{pid}', which resolves to no persona record "
                          f"the readiness check handed over (C14/F15)")
            ok_flow = False
        if ok_flow:
            served = journeys[jid].get("persona_ref")
            if served and served != pid:
                errors.append(f"{label} names persona '{pid}', but journey '{jid}' serves "
                              f"'{served}' — a flow carries the journey's own persona (C14/F15)")
                ok_flow = False
        if jid is not None:
            expanded.add(jid)
        if ok_flow:
            counts["flows_grounded"] += 1

    for jid in sorted(journeys):
        if jid not in expanded:
            errors.append(f"journey {jid!r} of the slice is expanded by no flow — every real "
                          f"path through the slice's surfaces must be drawn (C14/F15)")
    return counts


def slice_functionalities(slice_file, errors):
    if not slice_file or not os.path.isfile(slice_file):
        errors.append(f"slice record not found at {slice_file} — cannot verify coverage (C6/F6)")
        return set()
    sl = (load(slice_file).get("slice") or {})
    return {(f or {}).get("functionality_ref") for f in (sl.get("functionalities") or [])
            if (f or {}).get("functionality_ref")}


# --------------------------------------------------------------------------------------
# C14/F15 — the flow cross-check, parsed from the written ux.md.
# Forgiving on formatting, strict on content: a field is matched case-insensitively at the
# start of a line, with or without bullet/bold markers, as long as a separator follows.
# --------------------------------------------------------------------------------------

FLOW_FIELDS = ("persona", "goal", "entry", "steps", "decisions", "failure", "exit")

# bullet/number marker, optional emphasis, the field word (with its common longer forms),
# then a separator (":" inside or outside the emphasis, or a dash).
FIELD_RE = re.compile(
    r"^(?P<indent>\s*)(?:[-*+]\s+|\d+[.)]\s+)?"
    r"(?:\*\*|__|\*|_)?\s*"
    r"(?P<field>persona|goal|entry(?:\s+point)?|steps?|decisions?(?:\s+points?)?"
    r"|failure(?:\s+paths?)?|exit(?:\s+point)?)"
    r"\s*(?P<sep1>[:：])?\s*(?:\*\*|__|\*|_)?\s*(?P<sep2>[:：—–-])?\s*(?P<value>.*)$",
    re.IGNORECASE,
)
HEADING_RE = re.compile(r"^(?P<hashes>#{1,6})\s+(?P<text>.*?)\s*#*\s*$")
BULLET_RE = re.compile(r"^(?P<indent>\s*)(?:[-*+]|\d+[.)])\s+(?P<text>.*)$")
BOLD_LEAD_RE = re.compile(r"^\s*(?:\*\*|__)(?P<name>[^*_]+?)(?:\*\*|__)")
ARROW_RE = re.compile(r"(?:→|->|=>|⟶)\s*(?P<target>[^.;\n]*)")
NO_DECISIONS = {"none", "n/a", "na", "-", "—", "–", "no forks", "none.", "n/a."}


def _norm(text):
    """Lowercase, strip markdown emphasis/backticks/punctuation noise, collapse whitespace."""
    t = re.sub(r"[*_`]+", " ", text or "")
    t = re.sub(r"\s+", " ", t)
    return t.strip().strip(" .,;:—–-").lower()


def _sections(lines):
    """Map H2 title (lowercased) -> list of its body lines."""
    out, cur = {}, None
    for line in lines:
        m = HEADING_RE.match(line)
        if m and len(m.group("hashes")) == 2:
            cur = m.group("text").strip().lower()
            out.setdefault(cur, [])
            continue
        if m and len(m.group("hashes")) == 1:
            cur = None
            continue
        if cur is not None:
            out[cur].append(line)
    return out


def _entries(lines):
    """Group lines into bullet/numbered entries, folding wrapped continuation lines in."""
    entries, cur = [], None
    for line in lines:
        if not line.strip():
            continue
        m = BULLET_RE.match(line)
        if m:
            if cur is not None:
                entries.append(cur)
            cur = m.group("text").strip()
        elif cur is not None:
            cur = cur + " " + line.strip()
    if cur is not None:
        entries.append(cur)
    return entries


def parse_screens(section_lines):
    """Screens are the bolded names of the section's top-level bullets."""
    bullets = [(len(m.group("indent")), m.group("text"))
               for m in (BULLET_RE.match(ln) for ln in section_lines) if m]
    names = []
    if bullets:
        top = min(i for i, _ in bullets)
        for indent, text in bullets:
            if indent != top:
                continue
            b = BOLD_LEAD_RE.match(text)
            if b:
                names.append(b.group("name").strip())
    if not names:  # forgiving fallback: a doc that uses H3 headings per screen
        for ln in section_lines:
            m = HEADING_RE.match(ln)
            if m and len(m.group("hashes")) >= 3:
                names.append(m.group("text").strip())
    return names


def parse_flows(section_lines):
    """Flow blocks under ## Flows -> [{name, fields: {field: {value, lines}}}].

    A block starts at an H3+ heading, or at a Persona field when one is already open.
    """
    flows, cur, field = [], None, None

    def start(name):
        nonlocal cur, field
        cur = {"name": name, "fields": {}}
        flows.append(cur)
        field = None

    pending_name = None
    for line in section_lines:
        h = HEADING_RE.match(line)
        if h and len(h.group("hashes")) >= 3:
            start(h.group("text").strip())
            continue
        if not line.strip():
            continue
        m = FIELD_RE.match(line)
        if m and (m.group("sep1") or m.group("sep2")):
            name = m.group("field").split()[0].lower()
            name = "steps" if name == "step" else name
            name = "decisions" if name.startswith("decision") else name
            if name == "persona" and (cur is None or "persona" in cur["fields"]):
                start(pending_name or f"flow #{len(flows) + 1}")
                pending_name = None
            if cur is None:
                start(pending_name or f"flow #{len(flows) + 1}")
                pending_name = None
            if name in cur["fields"]:
                # A repeat of a field already named is body, not a new field header — a
                # "- Decision: ... → ..." sub-bullet under Decisions must not be swallowed.
                if field is not None:
                    cur["fields"][field]["lines"].append(line)
                continue
            field = name
            cur["fields"][field] = {"value": m.group("value").strip(), "lines": []}
            continue
        if cur is not None and field is not None:
            cur["fields"][field]["lines"].append(line)
        elif cur is None:
            b = BOLD_LEAD_RE.match(line.lstrip("-*+ 0123456789.)"))
            if b:
                pending_name = b.group("name").strip()
    return flows


def _field_items(fld):
    """The entries of a field: its sub-bullets, else its inline value split on arrows/semis."""
    items = _entries(fld["lines"])
    if items:
        return items
    val = fld["value"].strip()
    if not val:
        return []
    parts = re.split(r"(?:→|->|=>|;|\bthen\b)", val)
    return [p.strip() for p in parts if p.strip()]


def check_flows(lens_path, errors, warnings):
    """C14/F15 over the written ux.md. Returns (flows, screens, unreachable) counts."""
    counts = {"flows": 0, "screens": 0, "unreachable_screens": 0}
    try:
        with open(lens_path, encoding="utf-8") as fh:
            lines = fh.read().splitlines()
    except OSError as exc:
        errors.append(f"lens unreadable at {lens_path}: {exc} (C14/F15)")
        return counts

    secs = _sections(lines)
    if "screens" not in secs:
        errors.append("lens has no '## Screens' section — flows cannot be cross-checked (C14/F15)")
        return counts
    if "flows" not in secs:
        errors.append("lens has no '## Flows' section (C14/F15)")
        return counts

    screens = parse_screens(secs["screens"])
    counts["screens"] = len(screens)
    if not screens:
        errors.append("no screens found in '## Screens' — a screen is a bolded bullet name, "
                      "e.g. '- **Source coverage view**' (C14/F15)")
    by_norm = {}
    for s in screens:
        by_norm.setdefault(_norm(s), s)

    flows = parse_flows(secs["flows"])
    counts["flows"] = len(flows)
    if not flows:
        errors.append("no flow blocks found in '## Flows' — a flow is a block naming Persona, "
                      "Goal, Entry, Steps, Decisions, Failure and Exit (C14/F15)")

    reached = set()
    for flow in flows:
        label = f"flow '{flow['name']}'"
        for want in FLOW_FIELDS:
            fld = flow["fields"].get(want)
            if fld is None:
                errors.append(f"{label}: missing required field '{want.capitalize()}' — a flow "
                              f"names Persona, Goal, Entry, Steps, Decisions, Failure and Exit "
                              f"(C14/F15)")
            elif not fld["value"].strip() and not _field_items(fld):
                errors.append(f"{label}: field '{want.capitalize()}' is empty (C14/F15)")

        steps_fld = flow["fields"].get("steps")
        if steps_fld is not None:
            steps = _field_items(steps_fld)
            if not steps:
                errors.append(f"{label}: 'Steps' names no step — a flow is an ordered list of "
                              f"steps, each naming a screen (C14/F15)")
            for i, step in enumerate(steps, 1):
                lead = BOLD_LEAD_RE.match(step)
                hit = None
                if lead and _norm(lead.group("name")) in by_norm:
                    hit = by_norm[_norm(lead.group("name"))]
                else:
                    nstep = _norm(step)
                    for key, real in by_norm.items():
                        if key and re.search(rf"(?<![a-z0-9]){re.escape(key)}(?![a-z0-9])", nstep):
                            hit = real
                            break
                if hit is None:
                    named = lead.group("name").strip() if lead else step[:60]
                    errors.append(f"{label} step {i} names '{named}', which is not a screen in "
                                  f"'## Screens' (C14/F15)")
                else:
                    reached.add(hit)

        dec_fld = flow["fields"].get("decisions")
        if dec_fld is not None:
            inline = _norm(dec_fld["value"])
            declared_none = inline in NO_DECISIONS and not dec_fld["lines"]
            for dec in ([] if declared_none else _field_items(dec_fld)):
                if _norm(dec) in NO_DECISIONS:
                    continue
                targets = [t.strip() for t in ARROW_RE.findall(dec) if t.strip()]
                if len(targets) < 2:
                    errors.append(f"{label}: decision point \"{dec[:70].strip()}\" does not say "
                                  f"where each branch goes — name a destination for every branch, "
                                  f"as '<condition> → <destination>' (C14/F15)")

    for s in screens:
        if s not in reached:
            counts["unreachable_screens"] += 1
            errors.append(f"screen '{s}' is unreachable — no flow step names it (C6/C14/F15)")
    return counts


def main(argv=None):
    ap = argparse.ArgumentParser(description="Validate /ux's lens grounding + coverage.")
    ap.add_argument("--manifest", required=True)
    ap.add_argument("--slice-file", required=True)
    ap.add_argument("--product-base", help="live model root — to resolve a reused decision")
    ap.add_argument("--lens", help="the written lens/ux.md — enables the C14/F15 flow "
                                   "cross-check (skipped with a warning when omitted)")
    ap.add_argument("--readiness", help="the JSON check_ready_slice.py emitted for this slice — "
                                       "enables the C14/F15 flow RESOLUTION check (skipped with "
                                       "a warning when omitted)")
    args = ap.parse_args(argv)

    errors, warnings = [], []
    try:
        man = (load(args.manifest).get("ux") or {})
    except (OSError, yaml.YAMLError) as exc:
        errors.append(f"manifest unreadable: {exc}")
        man = {}

    decision_ids = manifest_decisions(man, errors) | live_decisions(args.product_base)

    grounded_funcs = check_grounding(man, decision_ids, errors)
    to_cover = slice_functionalities(args.slice_file, errors)
    for fid in sorted(f for f in to_cover if f):
        if fid not in grounded_funcs:
            errors.append(f"slice functionality {fid!r} is visualized by no screen (C6/F6)")

    if args.lens:
        flow_counts = check_flows(args.lens, errors, warnings)
    else:
        flow_counts = {"flows": 0, "screens": 0, "unreachable_screens": 0}
        warnings.append("--lens was not passed: the C14/F15 flow cross-check was skipped "
                        "(pass --lens <slice>/lens/ux.md to run it)")

    if args.readiness:
        try:
            with open(args.readiness, encoding="utf-8") as fh:
                readiness = json.load(fh) or {}
        except (OSError, ValueError) as exc:
            errors.append(f"readiness JSON unreadable at {args.readiness}: {exc} (C14/F15)")
            readiness = None
        ready_counts = ({"resolved_personas": 0, "resolved_journeys": 0, "flows_grounded": 0}
                        if readiness is None else check_readiness(man, readiness, errors))
    else:
        ready_counts = {"resolved_personas": 0, "resolved_journeys": 0, "flows_grounded": 0}
        warnings.append("--readiness was not passed: the C14/F15 flow resolution check was "
                        "skipped (pass --readiness <check_ready_slice.py output .json> to run it)")

    counts = {"manifest_screens": len(man.get("screens") or []),
              "manifest_flows": len(man.get("flows") or []), "decisions": len(decision_ids),
              "to_cover": len(to_cover), "grounded_funcs": len(grounded_funcs)}
    counts.update(flow_counts)
    counts.update(ready_counts)
    result = {"ok": not errors, "errors": errors, "warnings": warnings, "counts": counts}
    print(json.dumps(result, indent=2))
    return 0 if not errors else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
