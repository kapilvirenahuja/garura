#!/usr/bin/env python3
"""
check_surface_contract.py — surface-contract gate for /launch (C10/F9, C11/F10).

Run BEFORE the HITL walk, this gate proves the deploy target and the authored
scenarios actually match the epic's DECLARED surface (`surface.type`,
`surface.must_open`) per `surface-contract.md` — so launch never asks a human to
accept a local command standing in for an openable dashboard, nor a unit-test
scenario standing in for an "open" check.

  deploy-target shape (C10/F9)
    The deploy record's reachable target must satisfy `surface.type`:
      web_dashboard / server_api  -> a real reachable target: a local/preview URL
                                     (http/https) or a declared server endpoint.
                                     A local command (python3 ...), a file path, or
                                     a JSON-artifact path does NOT satisfy it.
      cli                          -> a command and the env it runs in (a command
                                     string is fine).
      library / service_read_model -> no deploy surface to open; a URL pretending
                                     to be a UI is rejected.

  scenario-verb preservation (C11/F10)
    Every scenario covering a `must_open` artifact must preserve the artifact's
    user VERB. For a user-facing surface (web_dashboard/server_api) a scenario
    whose run steps only run a unit-test / command (and never open/visit/load the
    artifact) is a semantic mismatch — an "open" check covered by a test run.

    python3 check_surface_contract.py --product-base <pb> --epic <epic-id>
        --deploy-record <deploy.json> --scenarios <scenarios.yaml>

Prints {ok, surface_type, errors[]}. Exit 0 conform, 1 mismatch, 2 usage.
"""

import argparse
import json
import os
import re
import sys

try:
    import yaml
except ImportError:
    sys.stderr.write("check_surface_contract.py: PyYAML is required (pip install pyyaml).\n")
    sys.exit(2)

USER_FACING = ("web_dashboard", "server_api")
URL_RE = re.compile(r"https?://", re.IGNORECASE)
# verbs that mean "the human opens/visits the reachable artifact"
OPEN_VERBS = ("open", "visit", "load", "browse", "navigate", "go to", "view", "see")
# tell-tales of a command/test run masquerading as an open
RUN_TELLS = ("python3", "python ", "unittest", "pytest", "npm test", "go test",
             "make test", "./", "java -", "node ")


def yload(path):
    with open(path, "r", encoding="utf-8") as fh:
        return yaml.safe_load(fh) or {}


def jload(path):
    with open(path, "r", encoding="utf-8") as fh:
        return json.load(fh)


def is_url(s):
    return bool(URL_RE.search(s or ""))


def parse_must_open(md_path):
    """The 'Must open:' items from the epic.md '## Surface' section — a list of
    artifact names (quoted or comma-separated), or [] when absent."""
    try:
        text = open(md_path, encoding="utf-8").read()
    except OSError:
        return []
    capturing = False
    for line in text.splitlines():
        s = line.strip()
        if s.startswith("## "):
            if capturing:
                break
            capturing = s[3:].strip().lower() == "surface"
            continue
        if capturing and re.match(r"(?i)^[-*]?\s*must open\s*[:=]", s):
            val = re.split(r"(?i)must open\s*[:=]", s, maxsplit=1)[1]
            quoted = re.findall(r'"([^"]+)"', val)
            if quoted:
                return [q.strip() for q in quoted if q.strip()]
            return [p.strip().strip('"').strip() for p in val.split(",") if p.strip()]
    return []


def looks_like_command_or_path(s):
    s = (s or "").strip()
    if not s:
        return True
    if is_url(s):
        return False
    # a bare command, a file/artifact path, or a json artifact
    if any(t in s.lower() for t in ("python3", "python ", "unittest", "pytest")):
        return True
    if s.endswith(".json") or s.endswith(".yaml") or s.endswith(".yml"):
        return True
    if s.startswith("/") or s.startswith("./") or s.startswith("../"):
        return True
    if " " in s and not is_url(s):   # multi-token command line
        return True
    return False


def main():
    ap = argparse.ArgumentParser(description="/launch surface-contract gate.")
    ap.add_argument("--product-base", required=True)
    ap.add_argument("--epic", required=True, help="epic id")
    ap.add_argument("--deploy-record", required=True)
    ap.add_argument("--scenarios", required=True)
    args = ap.parse_args()

    errors = []
    spine = yload(os.path.join(args.product_base, "product-os", "_spine.yaml"))
    epic = next((e for e in (spine.get("epics") or [])
                 if isinstance(e, dict) and e.get("id") == args.epic.split("/")[-1]), None) or {}
    stype = (epic.get("surface_type") or "").strip().lower()
    must_open = parse_must_open(
        os.path.join(args.product_base, "product-os", epic.get("doc") or ""))

    out = {"ok": False, "surface_type": stype or None, "errors": errors}

    if not stype:
        errors.append("epic declares no surface.type — /launch cannot check the deploy "
                      "target shape against an undeclared surface (C10; surface-contract.md)")
        print(json.dumps(out, indent=2))
        sys.exit(1)

    deploy = jload(args.deploy_record)
    address = (deploy.get("address") or deploy.get("target") or "").strip()

    # --- deploy-target shape vs surface.type (C10/F9) ----------------------------
    if stype in USER_FACING:
        if looks_like_command_or_path(address):
            errors.append(
                f"surface.type is '{stype}' but the deploy record's reachable target "
                f"'{address}' is a local command or artifact path, not an openable URL/"
                f"endpoint — REJECT before HITL (C10/F9; surface-contract.md)")
    elif stype == "cli":
        if not address:
            errors.append("surface.type is 'cli' but the deploy record names no command "
                          "to run (C10/F9)")
    elif stype in ("library", "service_read_model"):
        if is_url(address):
            errors.append(
                f"surface.type is '{stype}' (no run surface) but the deploy record claims "
                f"a URL '{address}' — a URL pretending to be a UI (C10/F9)")
    else:
        errors.append(f"surface.type '{stype}' is not in the surface-contract taxonomy "
                      "(C10)")

    # --- scenario-verb preservation (C11/F10) ------------------------------------
    scenarios = (yload(args.scenarios).get("scenarios") or [])
    if stype in USER_FACING and must_open:
        for sc in scenarios:
            sid = (sc.get("id") or "?").strip()
            run = " ".join(str(r) for r in (sc.get("run") or [])).lower()
            check = (sc.get("check") or "").lower()
            text = f"{run} {check}"
            mentions_open = any(v in text for v in OPEN_VERBS) or is_url(run)
            runs_command = any(t in run for t in RUN_TELLS)
            if runs_command and not mentions_open:
                errors.append(
                    f"{sid}: surface '{stype}' promises an OPEN check (must_open: "
                    f"{must_open}) but the scenario only runs a command/test and never "
                    f"opens the artifact — verb mismatch, REJECT before the walk "
                    f"(C11/F10; surface-contract.md)")

    out["ok"] = not errors
    print(json.dumps(out, indent=2))
    sys.exit(0 if out["ok"] else 1)


if __name__ == "__main__":
    main()
