#!/usr/bin/env python3
"""
render_wireframes.py — the mechanical half of C15/F16: draw the slice, don't just describe it.

/ux writes two wireframe artifacts beside the lens: `lens/screens.yaml`, the machine-readable
record an LLM authoring skill writes (judgment — the literal frame content, the sample values,
the notes explaining why a detail is there), and `lens/wireframes.html`, the page a product
owner opens (mechanical — the page skeleton, the chrome, the state chips, the gap callouts, all
derivable from the record with no judgment at all). This script is that second half. It never
invents content: every word on the page traces to a field in `screens.yaml`. A hand-edited page
is a defect (F16) — the record and the page must never be free to disagree, so this script is
the only thing allowed to produce `wireframes.html`, and `--check` proves that on demand by
re-rendering and diffing against what is already on disk instead of writing.

Determinism: the same `screens.yaml` renders the same bytes every time. No timestamps are
generated here (the page uses `spec.date` verbatim); no dict-iteration order is relied on —
every loop walks an explicit list already in the record's own authored order.

    python3 render_wireframes.py --screens <path/to/lens/screens.yaml> \\
            --out <path/to/lens/wireframes.html> \\
            --report <path/to/wireframe-report.json> [--check]

--check re-renders the page in memory and compares it byte-for-byte against the file already at
--out, WITHOUT writing anything — this is how the play proves the page was generated and not
hand-edited (C15/F16), and it is what `wireframe-report.json`'s `ok` field certifies (Done means
D4). Findings are also raised for anything screens.yaml itself fails to satisfy (F16): a screen
named by no journey step and carrying no gap, a moment with no frame body, a state whose tone is
outside the visual core's map, a malformed `covered_by` reference, or a missing/malformed
`spec.design_system`.

Layer rule: reads/writes files on disk only; no git/gh/network.

Exit: 0 = ok (no findings); 1 = findings recorded (render/check still completed); 2 = usage/parse
error (couldn't run at all).
"""

import argparse
import html
import json
import os
import re
import sys

try:
    import yaml
except ImportError:
    sys.stderr.write("render_wireframes.py: PyYAML is required (pip install pyyaml).\n")
    sys.exit(2)

TONES = ("ok", "warn", "bad", "neutral")
MARKUP_RE = re.compile(r"\[\[(ok|warn|bad|dim|sel|pin):((?:(?!\]\]).)*)\]\]", re.DOTALL)
MOMENT_ID_RE = re.compile(r"^([A-Za-z0-9_-]+)\.m(\d+)$")


# --------------------------------------------------------------------------------------
# small helpers
# --------------------------------------------------------------------------------------

def load_yaml(path):
    with open(path, encoding="utf-8") as fh:
        return yaml.safe_load(fh) or {}


def esc(text):
    return html.escape("" if text is None else str(text), quote=True)


def render_markup(text):
    """Escape user content, then apply the [[tone:text]] inline markup as spans.

    Escaping runs BEFORE markup substitution so a literal '<' or '&' inside a frame line can
    never break the page, and the markup delimiters themselves ('[[', ']]', ':') are plain
    text that a screen author cannot use to inject HTML.
    """
    safe = esc(text)

    def sub(m):
        tone, inner = m.group(1), m.group(2)
        if tone == "pin":
            n = esc(inner.strip())
            return f'<span class="pin">{n}</span>'
        return f'<span class="{tone}">{inner}</span>'

    return MARKUP_RE.sub(sub, safe)


def tone_class(tone):
    return tone if tone in TONES else "neutral"


# --------------------------------------------------------------------------------------
# validation (F16 + the schema checks the brief lists)
# --------------------------------------------------------------------------------------

def validate(record, findings):
    spec = record.get("spec") or {}
    for key in ("slice_ref", "issue", "authored_by", "date"):
        if not spec.get(key):
            findings.append({"code": "spec-missing-field", "where": "spec",
                              "says": f"spec.{key} is missing or empty"})

    ds = spec.get("design_system")
    if not isinstance(ds, dict) or not ds:
        findings.append({"code": "design-system-missing", "where": "spec.design_system",
                          "says": "spec.design_system must be {name, reference} or "
                                  "{none_yet: true, why}"})
    else:
        has_named = bool(ds.get("name")) and bool(ds.get("reference"))
        has_none = ds.get("none_yet") is True and bool(ds.get("why"))
        if not (has_named or has_none):
            findings.append({"code": "design-system-malformed", "where": "spec.design_system",
                              "says": "spec.design_system must be {name, reference} or "
                                      "{none_yet: true, why}"})

    personas = {p.get("id"): p for p in (record.get("personas") or []) if isinstance(p, dict)}
    surfaces = {s.get("id"): s for s in (record.get("surfaces") or []) if isinstance(s, dict)}
    screens = {s.get("id"): s for s in (record.get("screens") or []) if isinstance(s, dict)}

    color_rule = record.get("color_rule") or {}
    roles = color_rule.get("roles") or {}
    valid_tones = {t for t in TONES if t in roles}

    for sid, screen in screens.items():
        where = f"screens.{sid or '<?>'}"
        sref = screen.get("surface_ref")
        if sref not in surfaces:
            findings.append({"code": "bad-surface-ref", "where": where,
                              "says": f"surface_ref '{sref}' does not resolve to a surface"})
        pref = screen.get("persona_ref")
        if pref not in personas:
            findings.append({"code": "bad-persona-ref", "where": where,
                              "says": f"persona_ref '{pref}' does not resolve to a persona"})

        moments = screen.get("moments") or []
        for mo in moments:
            n = mo.get("n") if isinstance(mo, dict) else None
            mwhere = f"{where}.m{n if n is not None else '?'}"
            frame = (mo or {}).get("frame") or {}
            lines = frame.get("lines") or []
            blocks = frame.get("blocks") or []
            if not lines and not blocks:
                findings.append({"code": "empty-frame", "where": mwhere,
                                  "says": "moment has no non-empty frame (no lines/blocks)"})

        for st in (screen.get("states") or []):
            tone = (st or {}).get("tone")
            swhere = f"{where}.states.{(st or {}).get('id', '<?>')}"
            if tone not in TONES:
                findings.append({"code": "bad-state-tone", "where": swhere,
                                  "says": f"tone '{tone}' is not one of ok/warn/bad/neutral"})
            elif tone not in valid_tones:
                findings.append({"code": "state-tone-not-in-color-rule", "where": swhere,
                                  "says": f"tone '{tone}' does not appear in color_rule.roles"})

    # journeys / steps / covered_by
    named_screens = set()
    steps_covered = 0
    steps_with_gap = 0
    gaps = []
    for j in (record.get("journeys") or []):
        jid = (j or {}).get("id", "<?>")
        for step in ((j or {}).get("steps") or []):
            n = (step or {}).get("n", "?")
            swhere = f"journeys.{jid}.step{n}"
            covered_by = (step or {}).get("covered_by") or []
            gap = (step or {}).get("gap")
            if not covered_by:
                if not (isinstance(gap, str) and gap.strip()):
                    findings.append({"code": "step-uncovered-no-gap", "where": swhere,
                                      "says": "step has no covered_by and no gap — an "
                                              "uncovered step must carry a non-empty gap"})
                else:
                    steps_with_gap += 1
                    gaps.append({"journey": jid, "step": n, "gap": gap})
                continue
            step_ok = True
            for ref in covered_by:
                m = MOMENT_ID_RE.match(str(ref)) if ref else None
                if not m:
                    findings.append({"code": "bad-covered-by", "where": swhere,
                                      "says": f"covered_by entry '{ref}' does not parse as "
                                              "<screenId>.m<n>"})
                    step_ok = False
                    continue
                sid, mn = m.group(1), int(m.group(2))
                screen = screens.get(sid)
                if screen is None:
                    findings.append({"code": "bad-covered-by", "where": swhere,
                                      "says": f"covered_by entry '{ref}' names no screen "
                                              f"'{sid}'"})
                    step_ok = False
                    continue
                mids = {(mo or {}).get("n") for mo in (screen.get("moments") or [])}
                if mn not in mids:
                    findings.append({"code": "bad-covered-by", "where": swhere,
                                      "says": f"covered_by entry '{ref}' names no moment "
                                              f"{mn} on screen '{sid}'"})
                    step_ok = False
                    continue
                named_screens.add(sid)
            if step_ok:
                steps_covered += 1

    for sid in screens:
        if sid not in named_screens:
            findings.append({"code": "screen-not-covered", "where": f"screens.{sid}",
                              "says": "screen is named by no journey step's covered_by"})

    return {
        "steps_covered": steps_covered,
        "steps_with_gap": steps_with_gap,
        "gaps": gaps,
    }


# --------------------------------------------------------------------------------------
# frame renderers
# --------------------------------------------------------------------------------------

def render_terminal_frame(command, frame):
    lines = frame.get("lines") or []
    body = "\n".join(render_markup(ln) for ln in lines)
    title = esc(command or "")
    return (
        '<div class="term">'
        '<div class="term-bar"><span class="dot"></span><span class="dot"></span>'
        f'<span class="dot"></span><span class="term-title">{title}</span></div>'
        f'<pre>{body}</pre>'
        '</div>'
    )


def render_web_block(block):
    if not isinstance(block, dict) or not block:
        return ""
    if "row" in block:
        row = block["row"] or {}
        cells = row.get("cells") or []
        cell_html = "".join(f'<span class="wb-sub">{render_markup(c)}</span>' for c in cells)
        note = row.get("note")
        note_html = f'<div class="wb-note">{render_markup(note)}</div>' if note else ""
        return f'<div class="wb-row">{cell_html}{note_html}</div>'
    if "panel" in block:
        panel = block["panel"] or {}
        title = panel.get("title")
        title_html = f'<span class="wb-lbl">{render_markup(title)}</span>' if title else ""
        body_html = "".join(f'<p class="wb-say">{render_markup(ln)}</p>'
                             for ln in (panel.get("body") or []))
        return f'<div class="wb-panel">{title_html}{body_html}</div>'
    if "field" in block:
        field = block["field"] or {}
        label = render_markup(field.get("label"))
        value = render_markup(field.get("value"))
        hint = field.get("hint")
        hint_html = (f' <span style="color:var(--ink-4)">{render_markup(hint)}</span>'
                     if hint else "")
        return (f'<div class="wb-field"><span class="k">{label}</span>'
                f'<span class="v">{value}{hint_html}</span></div>')
    if "button" in block:
        btn = block["button"] or {}
        cls = "btn primary" if btn.get("primary") else "btn"
        label = render_markup(btn.get("label"))
        focus_html = ('<span class="wb-default">focused</span>' if btn.get("focused") else "")
        return f'<div class="wb-btns"><span class="{cls}">{label}</span>{focus_html}</div>'
    if "pill" in block:
        pill = block["pill"] or {}
        cls = f'wb-pill {tone_class(pill.get("tone"))}' if pill.get("tone") else "wb-pill"
        return f'<span class="{cls}">{render_markup(pill.get("label"))}</span>'
    if "text" in block:
        return f'<p class="wb-say">{render_markup(block["text"])}</p>'
    return ""


def render_web_frame(url, blocks):
    body_html = "".join(render_web_block(b) for b in (blocks or []))
    return (
        '<div class="web">'
        f'<div class="web-chrome"><span class="url">{esc(url or "")}</span></div>'
        f'<div class="web-body">{body_html}</div>'
        '</div>'
    )


def render_frame(surface_kind, screen, moment):
    frame = moment.get("frame") or {}
    if surface_kind == "web":
        return render_web_frame(frame.get("url"), frame.get("blocks") or [])
    return render_terminal_frame(screen.get("command"), frame)


def caption_line(spec):
    ds = spec.get("design_system") or {}
    if ds.get("name"):
        source = ds["name"]
    else:
        source = 'a design system not chosen yet'
    return f'structure only · palette and type come later from {esc(source)}'


# --------------------------------------------------------------------------------------
# page assembly
# --------------------------------------------------------------------------------------

def render_states_chips(states):
    if not states:
        return ""
    chips = "".join(
        f'<span class="chip {tone_class((s or {}).get("tone"))}">{esc((s or {}).get("id", ""))}</span>'
        for s in states
    )
    return f'<div class="states"><span class="states-lbl">States</span>{chips}</div>'


def render_moment(surface_kind, screen, moment, is_last_moment, persona_label):
    n = moment.get("n")
    title = moment.get("title") or f"Moment {n}"
    frame_html = render_frame(surface_kind, screen, moment)
    decisions = moment.get("decisions") or []
    notes_html = ""
    if decisions:
        items = "".join(
            f'<div class="note"><span class="pin">{i}</span><span>{render_markup(d)}</span></div>'
            for i, d in enumerate(decisions, 1)
        )
        notes_html = f'<div class="notes">{items}</div>'
    does = moment.get("does")
    does_html = (f'<p class="does"><b>{esc(persona_label)} does:</b> '
                 f'{render_markup(does)}</p>' if does else "")
    lofi_html = f'<p class="lofi">{caption_line({"design_system": screen.get("_design_system", {})})}</p>'
    out = [
        '<div class="moment">',
        f'<div class="moment-lbl">{esc(title)}</div>',
        '<div class="moment-body">',
        frame_html,
        notes_html,
        '</div>',
        does_html,
        lofi_html,
        '</div>',
    ]
    return "".join(out)


def render_gap(gap_text):
    return f'<div class="gap"><b>Gap.</b> {render_markup(gap_text)}</div>'


def moment_lookup(screens):
    """(screen_id, moment_n) -> (screen dict, moment dict)."""
    out = {}
    for sid, screen in screens.items():
        for mo in (screen.get("moments") or []):
            out[(sid, mo.get("n"))] = (screen, mo)
    return out


def render_step(record, journey, step, lookup, design_system):
    n = step.get("n")
    step_text = step.get("step", "")
    covered_by = step.get("covered_by") or []
    gap = step.get("gap")

    moments_html = []
    last_screen = None
    for ref in covered_by:
        m = MOMENT_ID_RE.match(str(ref))
        if not m:
            continue
        sid, mn = m.group(1), int(m.group(2))
        pair = lookup.get((sid, mn))
        if pair is None:
            continue
        screen, moment = pair
        screen = dict(screen)
        screen["_design_system"] = design_system
        surface = record["_surfaces_by_id"].get(screen.get("surface_ref"), {})
        kind = surface.get("kind", "terminal")
        pref = screen.get("persona_ref")
        persona = record["_personas_by_id"].get(pref) or {}
        persona_label = persona.get("label") or pref or ""
        moments_html.append(render_moment(kind, screen, moment, False, persona_label))
        last_screen = screen

    gap_html = render_gap(gap) if (gap and isinstance(gap, str) and gap.strip()) else ""
    states_html = render_states_chips(last_screen.get("states")) if last_screen else ""

    return (
        '<div class="step">'
        '<div class="rail"><span class="num">' + esc(n) + '</span><span class="line"></span></div>'
        '<div class="step-body">'
        f'<p class="step-say">{render_markup(step_text)}</p>'
        f'<p class="step-src">{esc(journey.get("id", ""))} · step {esc(n)}</p>'
        + "".join(moments_html)
        + gap_html
        + states_html
        + '</div></div>'
    )


def render_journey_section(record, journey, idx, lookup, design_system):
    surfaces_by_id = record["_surfaces_by_id"]
    personas_by_id = record["_personas_by_id"]
    surface = surfaces_by_id.get(journey.get("surface_ref"), {})
    persona = personas_by_id.get(journey.get("persona_ref"), {})
    kind = surface.get("kind", "terminal")
    why = surface.get("why_this_medium", "")

    steps_html = "".join(
        render_step(record, journey, step, lookup, design_system)
        for step in (journey.get("steps") or [])
    )

    meta_bits = [f"surface: {surface.get('label', journey.get('surface_ref', ''))}"]
    if kind:
        meta_bits.append(kind)
    if why:
        meta_bits.append(why)
    meta = " · ".join(esc(b) for b in meta_bits)

    return (
        '<section class="jrn">'
        '<div class="jrn-head">'
        '<div class="jrn-top">'
        f'<span class="jrn-id">{esc(journey.get("id", ""))}</span>'
        f'<span class="jrn-name">{esc(journey.get("name", ""))}</span>'
        f'<span class="jrn-who">{esc(persona.get("label", journey.get("persona_ref", "")))}</span>'
        '</div>'
        f'<div class="jrn-meta">{meta}</div>'
        '</div>'
        f'<div class="steps">{steps_html}</div>'
        '</section>'
    )


def render_vocabulary(vocabulary):
    if not vocabulary:
        return ""
    rows = "".join(
        '<div class="find">'
        f'<span class="fn">{tone_class((v or {}).get("tone"))}</span>'
        f'<span><b>{esc((v or {}).get("word", ""))}</b> — {render_markup((v or {}).get("means", ""))}</span>'
        '</div>'
        for v in vocabulary
    )
    return (
        '<section><div class="sec-head"><h2>Vocabulary</h2></div>'
        f'<div class="finds">{rows}</div></section>'
    )


def render_color_rule(color_rule):
    if not color_rule:
        return ""
    rule = color_rule.get("rule", "")
    roles = color_rule.get("roles") or {}
    rows = "".join(
        f'<div class="find"><span class="fn">{esc(tone)}</span>'
        f'<span>{esc(", ".join(str(v) for v in (roles.get(tone) or [])))}</span></div>'
        for tone in TONES if tone in roles
    )
    return (
        '<section><div class="sec-head"><h2>Colour rule</h2>'
        f'<p class="sec-note">{render_markup(rule)}</p></div>'
        f'<div class="finds">{rows}</div></section>'
    )


def render_open_questions(open_questions):
    if not open_questions:
        return ""
    rows = "".join(
        '<div class="find">'
        f'<span class="fn">{esc((q or {}).get("id", ""))}</span>'
        f'<span>{render_markup((q or {}).get("question", ""))} — '
        f'{render_markup((q or {}).get("status", ""))}</span>'
        '</div>'
        for q in open_questions
    )
    return (
        '<section><div class="sec-head"><h2>Open questions</h2></div>'
        f'<div class="finds">{rows}</div></section>'
    )


def render_coverage(record):
    rows = []
    for j in (record.get("journeys") or []):
        for step in (j.get("steps") or []):
            covered_by = step.get("covered_by") or []
            gap = step.get("gap")
            if covered_by:
                what = ", ".join(str(c) for c in covered_by)
                flag = ""
            else:
                what = "gap"
                flag = " warn" if gap else ""
            rows.append(
                f'<div class="find{flag}">'
                f'<span class="fn">{esc(j.get("id", ""))} · {esc(step.get("n", ""))}</span>'
                f'<span>{esc(what)}</span></div>'
            )
    return (
        '<section><div class="sec-head"><h2>Coverage</h2></div>'
        f'<div class="finds">{"".join(rows)}</div></section>'
    )


PAGE_CSS = """
:root {
  --ground:#F6F8F6; --surface:#FFFFFF; --surface-2:#EDF1EE; --term-bg:#FBFCFB;
  --ink:#14181A; --ink-2:#4A5552; --ink-3:#6E7A76; --ink-4:#96A19D;
  --rule:#D5DCD7; --rule-strong:#B3BEB8;
  --accent:#1F6F5C; --accent-soft:#E2EFE9;
  --flag:#A8801F; --flag-bg:#F6EDD8;
  --s-ok:#3D8A5E; --s-warn:#A8801F; --s-bad:#B3523C; --s-none:#8B9793;
  --s-ok-bg:#E4F1E8; --s-warn-bg:#F6EDD8; --s-bad-bg:#F7E4E0; --s-none-bg:#E9EDEB;
  --sans:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;
  --mono:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;
  --measure:66ch;
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --ground:#0F1413; --surface:#161C1A; --surface-2:#1D2523; --term-bg:#101615;
    --ink:#E7ECE9; --ink-2:#AFBCB7; --ink-3:#8B9793; --ink-4:#6B7773;
    --rule:#2A3331; --rule-strong:#414C49;
    --accent:#59B79C; --accent-soft:#172C26;
    --flag:#D6A54A; --flag-bg:#2C2415;
    --s-ok:#63C289; --s-warn:#D6A54A; --s-bad:#E28671; --s-none:#8B9793;
    --s-ok-bg:#162A1F; --s-warn-bg:#2C2415; --s-bad-bg:#2E1D19; --s-none-bg:#212927;
  }
}
:root[data-theme="dark"] {
  --ground:#0F1413; --surface:#161C1A; --surface-2:#1D2523; --term-bg:#101615;
  --ink:#E7ECE9; --ink-2:#AFBCB7; --ink-3:#8B9793; --ink-4:#6B7773;
  --rule:#2A3331; --rule-strong:#414C49;
  --accent:#59B79C; --accent-soft:#172C26;
  --flag:#D6A54A; --flag-bg:#2C2415;
  --s-ok:#63C289; --s-warn:#D6A54A; --s-bad:#E28671; --s-none:#8B9793;
  --s-ok-bg:#162A1F; --s-warn-bg:#2C2415; --s-bad-bg:#2E1D19; --s-none-bg:#212927;
}
* { box-sizing:border-box; }
body { background:var(--ground); color:var(--ink); font-family:var(--sans); font-size:15px; line-height:1.55; }
.page { max-width:1020px; margin:0 auto; padding:44px 24px 90px; display:flex; flex-direction:column; gap:40px; }
.masthead { display:flex; flex-direction:column; gap:10px; border-bottom:1px solid var(--rule); padding-bottom:18px; }
.eyebrow { font-family:var(--mono); font-size:11px; font-weight:500; letter-spacing:.1em; text-transform:uppercase; color:var(--accent); }
h1 { font-size:clamp(24px,3.6vw,32px); line-height:1.15; font-weight:600; margin:0; }
.masthead-warn { font-family:var(--mono); font-size:12px; color:var(--flag); background:var(--flag-bg);
  border:1px dashed var(--flag); border-radius:3px; padding:8px 12px; max-width:var(--measure); }
section { display:flex; flex-direction:column; gap:16px; }
.sec-head { display:flex; flex-direction:column; gap:5px; }
h2 { font-size:19px; font-weight:600; margin:0; }
.sec-note { margin:0; max-width:var(--measure); color:var(--ink-2); font-size:13.5px; }
.jrn { display:flex; flex-direction:column; gap:0; }
.jrn-head { border:1px solid var(--rule-strong); border-radius:3px 3px 0 0; background:var(--surface-2); padding:12px 16px; display:flex; flex-direction:column; gap:4px; }
.jrn-top { display:flex; flex-wrap:wrap; align-items:baseline; gap:6px 10px; }
.jrn-id { font-family:var(--mono); font-size:11px; font-weight:600; color:var(--accent); }
.jrn-name { font-size:16px; font-weight:600; }
.jrn-who { font-size:12px; color:var(--ink-3); margin-left:auto; }
.jrn-meta { font-family:var(--mono); font-size:11px; color:var(--ink-3); }
.steps { border:1px solid var(--rule-strong); border-top:none; border-radius:0 0 3px 3px; background:var(--surface); padding:4px 0; }
.step { display:grid; grid-template-columns:48px 1fr; }
.rail { display:flex; flex-direction:column; align-items:center; padding-top:16px; }
.rail .num { width:24px; height:24px; border-radius:50%; flex:none; background:var(--accent); color:#fff;
  font-family:var(--mono); font-size:11px; font-weight:600; display:flex; align-items:center; justify-content:center; }
.rail .line { width:2px; flex:1; background:var(--rule); margin-top:6px; min-height:16px; }
.step:last-child .rail .line { background:transparent; }
.step-body { padding:14px 16px 20px 4px; display:flex; flex-direction:column; gap:12px; min-width:0; }
.step-say { font-size:14px; font-weight:600; margin:0; max-width:var(--measure); }
.step-src { font-family:var(--mono); font-size:10px; color:var(--ink-4); margin:0; }
.moment { display:flex; flex-direction:column; gap:8px; }
.moment-lbl { font-family:var(--mono); font-size:10px; letter-spacing:.06em; text-transform:uppercase; color:var(--ink-4); }
.moment-body { display:grid; grid-template-columns:minmax(0,1fr) 230px; gap:14px; align-items:start; }
.term { background:var(--term-bg); border:1px solid var(--rule-strong); border-radius:5px; overflow:hidden; min-width:0; }
.term-bar { display:flex; align-items:center; gap:6px; padding:6px 10px; background:var(--surface-2); border-bottom:1px solid var(--rule); }
.dot { width:7px; height:7px; border-radius:50%; background:var(--rule-strong); flex:none; }
.term-title { font-family:var(--mono); font-size:10px; color:var(--ink-3); margin-left:6px; }
.term pre { margin:0; padding:12px 14px; font-family:var(--mono); font-size:12px; line-height:1.65; white-space:pre; overflow-x:auto; color:var(--ink); }
.term .dim{color:var(--ink-4)} .term .ok{color:var(--s-ok);font-weight:500}
.term .warn{color:var(--s-warn);font-weight:500} .term .bad{color:var(--s-bad);font-weight:500}
.term .sel{background:var(--accent-soft);color:var(--accent);font-weight:500}
.pin { display:inline-block; min-width:15px; height:15px; line-height:15px; border-radius:50%; background:var(--accent); color:#fff;
  font-family:var(--sans); font-size:10px; font-weight:600; text-align:center; padding:0 3px; }
.web { border:1px solid var(--rule-strong); border-radius:5px; overflow:hidden; background:var(--surface); min-width:0; }
.web-chrome { display:flex; align-items:center; gap:8px; padding:7px 11px; background:var(--surface-2); border-bottom:1px solid var(--rule); font-family:var(--mono); font-size:10px; color:var(--ink-3); }
.web-chrome .url { background:var(--ground); border:1px solid var(--rule); border-radius:100px; padding:2px 9px; flex:1; }
.web-body { padding:13px; display:flex; flex-direction:column; gap:10px; }
.wb-lbl { font-family:var(--mono); font-size:10px; letter-spacing:.06em; text-transform:uppercase; color:var(--ink-4); }
.wb-row { border:1px solid var(--rule); border-radius:3px; padding:8px 10px; display:flex; flex-direction:column; gap:3px; background:var(--ground); }
.wb-sub { font-size:11px; color:var(--ink-3); font-family:var(--mono); }
.wb-panel { border:1px solid var(--accent); border-radius:3px; padding:11px; display:flex; flex-direction:column; gap:8px; background:var(--surface); }
.wb-say { font-size:12px; color:var(--ink-2); margin:0; }
.wb-say b { color:var(--ink); font-weight:600; }
.wb-field { display:flex; flex-direction:column; gap:3px; }
.wb-field .k { font-family:var(--mono); font-size:10px; color:var(--ink-4); }
.wb-field .v { border:1px solid var(--rule); border-radius:3px; padding:5px 8px; font-size:12px; font-family:var(--mono); background:var(--ground); color:var(--ink-2); }
.wb-btns { display:flex; gap:8px; align-items:center; }
.btn { border:1px solid var(--rule-strong); border-radius:3px; padding:5px 12px; font-size:12px; color:var(--ink-2); background:var(--ground); }
.btn.primary { border-color:var(--accent); color:var(--accent); font-weight:600; }
.wb-default { font-size:11px; color:var(--ink-4); font-family:var(--mono); }
.wb-pill { font-family:var(--mono); font-size:10px; font-weight:500; padding:2px 8px; border-radius:100px; color:var(--s-none); background:var(--s-none-bg); }
.wb-pill.ok{color:var(--s-ok);background:var(--s-ok-bg)} .wb-pill.warn{color:var(--s-warn);background:var(--s-warn-bg)} .wb-pill.bad{color:var(--s-bad);background:var(--s-bad-bg)}
.wb-note { font-size:11px; color:var(--ink-3); border-left:2px solid var(--rule); padding-left:9px; }
.lofi { font-family:var(--mono); font-size:10px; color:var(--ink-4); text-align:right; padding:2px 2px 0; }
.notes { display:flex; flex-direction:column; gap:8px; padding-top:2px; }
.note { display:grid; grid-template-columns:19px 1fr; gap:8px; font-size:12px; color:var(--ink-2); }
.note b { color:var(--ink); font-weight:600; }
.does { font-family:var(--mono); font-size:11px; color:var(--ink-2); background:var(--surface-2); border-left:2px solid var(--accent); padding:6px 10px; }
.does b { color:var(--accent); font-weight:600; }
.gap { border:1px dashed var(--flag); background:var(--flag-bg); border-radius:3px; padding:10px 13px; font-size:12.5px; color:var(--ink-2); }
.gap b { color:var(--flag); font-weight:600; }
.states { display:flex; flex-wrap:wrap; gap:6px; align-items:center; }
.states-lbl { font-family:var(--mono); font-size:10px; text-transform:uppercase; color:var(--ink-4); margin-right:2px; }
.chip { font-family:var(--mono); font-size:10px; font-weight:500; padding:2px 8px; border-radius:100px; color:var(--s-none); background:var(--s-none-bg); }
.chip.ok{color:var(--s-ok);background:var(--s-ok-bg)} .chip.warn{color:var(--s-warn);background:var(--s-warn-bg)} .chip.bad{color:var(--s-bad);background:var(--s-bad-bg)}
.finds { display:flex; flex-direction:column; gap:10px; }
.find { display:grid; grid-template-columns:110px 1fr; gap:11px; max-width:var(--measure); font-size:13px; color:var(--ink-2); }
.find .fn { font-family:var(--mono); font-size:11px; font-weight:600; color:var(--accent); }
.find.warn .fn { color:var(--flag); }
footer { border-top:1px solid var(--rule); padding-top:14px; font-family:var(--mono); font-size:11px; color:var(--ink-3); display:flex; flex-direction:column; gap:4px; }
@media (max-width:780px){ .moment-body{grid-template-columns:1fr} .step{grid-template-columns:38px 1fr} .jrn-who{margin-left:0;width:100%} }
""".strip()


def render_page(record):
    spec = record.get("spec") or {}
    personas_by_id = {p.get("id"): p for p in (record.get("personas") or []) if isinstance(p, dict)}
    surfaces_by_id = {s.get("id"): s for s in (record.get("surfaces") or []) if isinstance(s, dict)}
    screens_by_id = {s.get("id"): s for s in (record.get("screens") or []) if isinstance(s, dict)}
    record["_personas_by_id"] = personas_by_id
    record["_surfaces_by_id"] = surfaces_by_id
    record["_screens_by_id"] = screens_by_id
    lookup = moment_lookup(screens_by_id)
    design_system = spec.get("design_system") or {}

    journeys_html = "".join(
        render_journey_section(record, j, idx, lookup, design_system)
        for idx, j in enumerate(record.get("journeys") or [], 1)
    )

    n_screens = len(screens_by_id)
    n_moments = sum(len(s.get("moments") or []) for s in screens_by_id.values())
    n_journeys = len(record.get("journeys") or [])

    title = f"{esc(spec.get('slice_ref', 'Wireframes'))}"
    parts = [
        f"<title>{title}</title>",
        f"<style>{PAGE_CSS}</style>",
        '<div class="page">',
        '<header class="masthead">',
        f'<div class="eyebrow">{esc(spec.get("slice_ref", ""))} · issue #{esc(spec.get("issue", ""))} · '
        f'{esc(spec.get("date", ""))}</div>',
        f'<h1>Wireframes</h1>',
        '<div class="masthead-warn">Generated from screens.yaml. Do not hand-edit this page — '
        'edit the record and re-render.</div>',
        '</header>',
        journeys_html,
        render_vocabulary(record.get("vocabulary") or []),
        render_color_rule(record.get("color_rule") or {}),
        render_open_questions(record.get("open_questions") or []),
        render_coverage(record),
        '<footer>',
        f'<span>{esc(spec.get("slice_ref", ""))} · issue #{esc(spec.get("issue", ""))} · '
        f'{n_screens} screens · {n_journeys} journeys · {n_moments} moments</span>',
        '<span>Rendered from screens.yaml — do not hand-edit</span>',
        '</footer>',
        '</div>',
    ]
    return "\n".join(parts) + "\n"


# --------------------------------------------------------------------------------------
# CLI
# --------------------------------------------------------------------------------------

def main(argv=None):
    ap = argparse.ArgumentParser(
        description="Render lens/wireframes.html from lens/screens.yaml (C15/F16).")
    ap.add_argument("--screens", required=True, help="path to lens/screens.yaml")
    ap.add_argument("--out", required=True, help="path to write lens/wireframes.html")
    ap.add_argument("--report", required=True, help="path to write wireframe-report.json")
    ap.add_argument("--check", action="store_true",
                     help="re-render and diff against --out without writing")
    args = ap.parse_args(argv)

    if not os.path.isfile(args.screens):
        sys.stderr.write(f"render_wireframes.py: not found: {args.screens}\n")
        return 2

    try:
        record = load_yaml(args.screens)
    except yaml.YAMLError as exc:
        sys.stderr.write(f"render_wireframes.py: cannot parse {args.screens}: {exc}\n")
        return 2

    required_top = ("spec", "personas", "surfaces", "journeys", "screens", "vocabulary",
                     "color_rule", "open_questions")
    findings = []
    for key in required_top:
        if key not in record:
            findings.append({"code": "missing-top-level-key", "where": "<root>",
                              "says": f"required top-level key '{key}' is missing"})

    coverage = validate(record, findings)

    rendered = render_page(record)

    mode = "check" if args.check else "render"
    if args.check:
        if not os.path.isfile(args.out):
            findings.append({"code": "check-missing-output", "where": args.out,
                              "says": "--check requested but the rendered file does not exist"})
        else:
            with open(args.out, encoding="utf-8") as fh:
                on_disk = fh.read()
            if on_disk != rendered:
                findings.append({"code": "hand-edited", "where": args.out,
                                  "says": "page was hand-edited; re-render from the record"})
    else:
        os.makedirs(os.path.dirname(os.path.abspath(args.out)) or ".", exist_ok=True)
        with open(args.out, "w", encoding="utf-8") as fh:
            fh.write(rendered)

    report = {
        "ok": not findings,
        "screens": len(record.get("screens") or []),
        "moments": sum(len((s or {}).get("moments") or []) for s in (record.get("screens") or [])),
        "journeys": len(record.get("journeys") or []),
        "steps_covered": coverage["steps_covered"],
        "steps_with_gap": coverage["steps_with_gap"],
        "gaps": coverage["gaps"],
        "findings": findings,
        "rendered": args.out,
        "record": args.screens,
        "mode": mode,
    }

    os.makedirs(os.path.dirname(os.path.abspath(args.report)) or ".", exist_ok=True)
    with open(args.report, "w", encoding="utf-8") as fh:
        json.dump(report, fh, indent=2)
        fh.write("\n")
    print(json.dumps(report, indent=2))

    return 0 if not findings else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
