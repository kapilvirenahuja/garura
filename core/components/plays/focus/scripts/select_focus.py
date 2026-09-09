#!/usr/bin/env python3
"""
select_focus.py — turn a captured issue set into /focus's ordered, capped list.

The deterministic heart of the play (C6, C7, C4, C3, C8). Given the issues the
capture step wrote to disk and the resolved mode record, it applies that mode's
filter table, orders the survivors by fixed rules, caps the list, counts the
surplus, and builds each entry's plain-language reason from the very signals
that selected it. It also stamps each entry's KIND and the play to run for it, both
by fixed table lookup over the issue's own labels (the kind map). No judgment, no
inference, no host access, and never a play name worked out from the product model —
same inputs always give the same output.

Layer rule: this script never shells out to git/gh. It only reads the issue set a
prior skill/agent step captured to disk.

    python3 select_focus.py --issues <path> --mode-record <path>
                            --out-json <path> --out-md <path>

Exit 0 always when the inputs parse; the enforcer (check_output.py) is what
grades the result. Exit 2 when an input is missing or unusable.
"""
import argparse
import datetime as dt
import json
import os
import sys

try:
    import yaml
except ImportError:  # pragma: no cover — the play's pre-flight resolves the map
    yaml = None

STALE_DAYS = 14          # `review`: an open issue untouched this long is in-flight-stale


# ---------- helpers -------------------------------------------------------

def parse_ts(value):
    """Parse an ISO-8601 timestamp to an aware UTC datetime, or None."""
    if not value:
        return None
    text = str(value).strip().replace("Z", "+00:00")
    try:
        stamp = dt.datetime.fromisoformat(text)
    except ValueError:
        return None
    if stamp.tzinfo is None:
        stamp = stamp.replace(tzinfo=dt.timezone.utc)
    return stamp.astimezone(dt.timezone.utc)


def days_since(stamp, now):
    if stamp is None:
        return None
    return (now - stamp).days


def norm_state(issue):
    """Normalize the host's state word. GitLab says `opened`; GitHub says `OPEN`."""
    state = str(issue.get("state", "")).strip().lower()
    return "open" if state == "opened" else state


def label_names(issue):
    out = []
    for lab in issue.get("labels") or []:
        name = lab.get("name") if isinstance(lab, dict) else lab
        if name:
            out.append(str(name))
    return sorted(out)


def assignee_logins(issue):
    out = []
    for who in issue.get("assignees") or []:
        login = who.get("login") if isinstance(who, dict) else who
        if login:
            out.append(str(login))
    return sorted(out)


def has_link(issue):
    """True when the issue carries a linked branch or pull request."""
    for key in ("linkedBranches", "linked_branches", "linkedPullRequests",
                "linked_pull_requests", "closedByPullRequestsReferences"):
        if issue.get(key):
            return True
    return bool(issue.get("linked"))


def is_blocked(issue, labels):
    """Blocked is read from the issue's own labels — never inferred."""
    lowered = {name.lower() for name in labels}
    return bool(lowered & {"blocked", "on-hold", "on hold", "waiting"})


def phrase(items):
    items = [i for i in items if i]
    if not items:
        return ""
    if len(items) == 1:
        return items[0]
    return ", ".join(items[:-1]) + " and " + items[-1]


# ---------- the kind map (C11) --------------------------------------------

def load_kind_map(path):
    """Load the fixed label -> kind -> play table. Never inferred, never derived
    from the product model — /next owns model-derived recommendation, not this play."""
    if yaml is None:
        raise RuntimeError("pyyaml is required to read the kind map")
    with open(path, encoding="utf-8") as fh:
        doc = yaml.safe_load(fh) or {}
    rows = doc.get("kinds") or []
    fallback = doc.get("fallback") or {"kind": "unlabelled", "command": None, "says": ""}
    # The cardinal rule (C12): this is a statement of what is NOT known, never a
    # substitute recommendation, and it must never name a play.
    note = doc.get("no_command_note") or "no recommendation (label it to get one)"
    return rows, fallback, note


def resolve_kind(labels, rows, fallback):
    """First matching row wins; row order IS the precedence. No match -> fallback."""
    lowered = {str(name).strip().lower() for name in labels}
    for row in rows:
        if lowered & {str(l).strip().lower() for l in (row.get("labels") or [])}:
            return {"kind": row.get("kind"),
                    "command": row.get("command"),
                    "says": row.get("says", ""),
                    "matched_label": sorted(
                        lowered & {str(l).strip().lower() for l in row["labels"]})[0]}
    return {"kind": fallback.get("kind"), "command": fallback.get("command"),
            "says": fallback.get("says", ""), "matched_label": None}


# ---------- mode filters --------------------------------------------------

def evaluate(issue, mode, window_days, operator, now):
    """Return (keep, signals, sort_key) for one issue under one mode."""
    state = norm_state(issue)
    labels = label_names(issue)
    assignees = assignee_logins(issue)
    mine = bool(operator) and operator in assignees
    updated = parse_ts(issue.get("updatedAt") or issue.get("updated_at"))
    closed = parse_ts(issue.get("closedAt") or issue.get("closed_at"))
    age = days_since(updated, now)
    linked = has_link(issue)
    blocked = is_blocked(issue, labels)
    signals = []

    if mode == "today":
        if state != "open":
            return False, [], None
        if blocked:
            return False, [], None
        if assignees and not mine:
            return False, [], None
        signals.append("yours" if mine else "unassigned")
        signals.append("not blocked")
        if labels:
            signals.append("labelled " + phrase(labels))
        if age is not None:
            signals.append("last touched %d day%s ago" % (age, "" if age == 1 else "s"))
        # Freshest first; issue number breaks ties so ordering is total.
        sort_key = (0 if mine else 1, -(updated.timestamp() if updated else 0),
                    issue.get("number", 0))
        return True, signals, sort_key

    if mode == "review":
        if state != "open":
            return False, [], None
        stale = age is not None and age >= STALE_DAYS
        if not (assignees or linked or stale):
            return False, [], None
        if assignees:
            signals.append("assigned to " + phrase(assignees))
        if linked:
            signals.append("has a branch or PR open")
        if stale:
            signals.append("stale — untouched for %d days" % age)
        if blocked:
            signals.append("labelled blocked")
        # Stalest first: the thing most at risk leads.
        sort_key = (0 if stale else 1, updated.timestamp() if updated else 0,
                    issue.get("number", 0))
        return True, signals, sort_key

    if mode == "recent":
        if state != "closed":
            return False, [], None
        if closed is None:
            return False, [], None
        closed_age = days_since(closed, now)
        if closed_age is None or closed_age > window_days or closed_age < 0:
            return False, [], None
        signals.append("closed %d day%s ago" % (closed_age, "" if closed_age == 1 else "s"))
        if assignees:
            signals.append("worked by " + phrase(assignees))
        if labels:
            signals.append("labelled " + phrase(labels))
        # Most recently closed first.
        sort_key = (0, -closed.timestamp(), issue.get("number", 0))
        return True, signals, sort_key

    return False, [], None


# ---------- rendering -----------------------------------------------------

def render_md(record):
    mode = record["mode"]
    lines = ["# focus — %s" % record["label"], ""]
    lines.append("Mode `%s`%s · %d matched · showing %d"
                 % (mode,
                    " (default)" if record["defaulted"] else "",
                    record["matched_count"], record["shown_count"]))
    if mode == "recent":
        lines[-1] += " · window %d days" % record["window_days"]
    lines.append("")

    if record["shown_count"] == 0:
        lines.append("Nothing matched mode `%s`." % mode)
        lines.append("")
        lines.append("No other mode was tried and no filter was relaxed. "
                     "Run `/focus --mode today`, `--mode review` or `--mode recent` "
                     "to look at a different slice.")
        return "\n".join(lines) + "\n"

    for pos, entry in enumerate(record["entries"], start=1):
        lines.append("%d. **#%d — %s**" % (pos, entry["number"], entry["title"]))
        lines.append("   %s" % entry["reason"])
        if entry["recommendation"]:
            lines.append("   %s — %s" % (entry["kind"], entry["recommendation"]))
        else:
            # C12 — say what is not known. Never fill the gap with a default.
            lines.append("   %s — %s" % (entry["kind"], record["no_command_note"]))
        if entry.get("url"):
            lines.append("   %s" % entry["url"])
        lines.append("")

    if record["entries_without_recommendation"] > 0:
        n = record["entries_without_recommendation"]
        lines.append("%d of the %d shown carr%s no recommendation — /focus could not tell "
                     "what %s from the labels on %s."
                     % (n, record["shown_count"], "ies" if n == 1 else "y",
                        "it is" if n == 1 else "they are",
                        "it" if n == 1 else "them"))
        lines.append("")

    if record["surplus_count"] > 0:
        lines.append("%d more issue%s matched mode `%s` and are not listed."
                     % (record["surplus_count"],
                        "" if record["surplus_count"] == 1 else "s", mode))
        lines.append("")
    return "\n".join(lines) + "\n"


# ---------- main ----------------------------------------------------------

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--issues", required=True)
    ap.add_argument("--mode-record", required=True)
    ap.add_argument("--kind-map", required=True,
                    help="path to reference/kind-map.yaml (C11)")
    ap.add_argument("--out-json", required=True)
    ap.add_argument("--out-md", required=True)
    ap.add_argument("--now", default=None,
                    help="ISO-8601 override for the clock (tests only)")
    args = ap.parse_args()

    try:
        with open(args.issues, encoding="utf-8") as fh:
            capture = json.load(fh)
        with open(args.mode_record, encoding="utf-8") as fh:
            mode_rec = json.load(fh)
    except (OSError, ValueError) as exc:
        print("cannot read inputs: %s" % exc, file=sys.stderr)
        return 2

    try:
        kind_rows, kind_fallback, no_command_note = load_kind_map(args.kind_map)
    except (OSError, ValueError, RuntimeError) as exc:
        print("cannot read the kind map: %s" % exc, file=sys.stderr)
        return 2
    known_commands = {r.get("command") for r in kind_rows if r.get("command")}

    if not mode_rec.get("mode_valid"):
        print("mode record is not valid — halt before selection (REC5)", file=sys.stderr)
        return 2

    mode = mode_rec["mode"]
    cap = int(mode_rec.get("cap", 10))
    window_days = int(mode_rec.get("window_days", 7))
    operator = capture.get("operator") or None
    now = parse_ts(args.now) or dt.datetime.now(dt.timezone.utc)

    kept = []
    for issue in capture.get("issues") or []:
        keep, signals, sort_key = evaluate(issue, mode, window_days, operator, now)
        if not keep:
            continue
        number = issue.get("number")
        title = (issue.get("title") or "").strip()
        reason = phrase(signals)
        if reason:
            reason = reason[0].upper() + reason[1:] + "."
        resolved = resolve_kind(label_names(issue), kind_rows, kind_fallback)
        kept.append((sort_key, {
            "number": number,
            "kind": resolved["kind"],
            "kind_says": resolved["says"],
            "kind_from_label": resolved["matched_label"],
            "command": resolved["command"],
            # C12 — a recommendation exists ONLY where the table names a play. No
            # default, no pointer, no substitute. Absence is the correct answer.
            "recommendation": ("/%s" % resolved["command"]) if resolved["command"] else None,
            "title": title,
            "state": norm_state(issue),
            "url": issue.get("url") or issue.get("web_url") or "",
            "closed_at": issue.get("closedAt") or issue.get("closed_at") or None,
            "updated_at": issue.get("updatedAt") or issue.get("updated_at") or None,
            "signals": signals,
            "reason": reason,
        }))

    kept.sort(key=lambda pair: pair[0])
    entries = [item for _, item in kept][:cap]
    matched = len(kept)

    missing = sum(1 for e in entries
                  if not e["reason"] or not isinstance(e["number"], int)
                  or not e.get("kind"))
    # C11/F9 — a command must come from the map or be absent. Never invented.
    # C12/F10 — and an entry with no command must carry no recommendation at all.
    off_map = sum(1 for e in entries
                  if (e.get("command") and e["command"] not in known_commands)
                  or (not e.get("command") and e.get("recommendation")))
    no_rec = sum(1 for e in entries if not e.get("recommendation"))

    record = {
        "mode": mode,
        "mode_valid": True,
        "defaulted": bool(mode_rec.get("defaulted")),
        "label": mode_rec.get("label", ""),
        "expected_state": mode_rec.get("expected_state"),
        "window_days": window_days,
        "cap": cap,
        "operator": operator,
        "capture_complete": bool(capture.get("capture_complete")),
        "issues_captured": len(capture.get("issues") or []),
        "matched_count": matched,
        "shown_count": len(entries),
        "surplus_count": max(0, matched - len(entries)),
        "entries_missing_fields": missing,
        "entries_off_map": off_map,
        "kind_map": os.path.abspath(args.kind_map),
        "known_commands": sorted(known_commands),
        "no_command_note": no_command_note,
        "entries_without_recommendation": no_rec,
        "empty": len(entries) == 0,
        "entries": entries,
    }

    for path, payload in ((args.out_json, json.dumps(record, indent=2, sort_keys=True) + "\n"),
                          (args.out_md, render_md(record))):
        os.makedirs(os.path.dirname(os.path.abspath(path)) or ".", exist_ok=True)
        with open(path, "w", encoding="utf-8") as fh:
            fh.write(payload)

    print("mode=%s matched=%d shown=%d surplus=%d"
          % (mode, matched, len(entries), record["surplus_count"]))
    return 0


if __name__ == "__main__":
    sys.exit(main())
